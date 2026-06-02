# ART-015C-3 — Mergehistorie en samengevoegde artiesten zichtbaar maken

## Doel

ART-015C-1 maakte het uitvoeren van een artist merge mogelijk. ART-015C-2 verduidelijkte de merge-richting in de UI. ART-015C-3 maakt de merge daarna beheerbaar en controleerbaar in de Artiesten-app.

De gebruiker moet kunnen zien:

- welke artiest is samengevoegd;
- naar welke leidende/canonical artiest de artiest is samengevoegd;
- wanneer een merge is uitgevoerd;
- welke mergehistorie bij een artiest hoort;
- hoeveel acties/records door de merge zijn geraakt.

## Functionele requirements

### 1. Samengevoegde artiesten herkenbaar in de lijst

De artiestenlijst toont samengevoegde artiesten alleen wanneer de gebruiker daarvoor kiest. Standaard toont de lijst actieve, niet-samengevoegde artiesten.

Nieuwe filteropties:

- **Actieve artiesten**: standaard, exclusief samengevoegde artiesten.
- **Inclusief samengevoegde artiesten**: actieve artiesten plus samengevoegde artiesten.
- **Alleen samengevoegde artiesten**: uitsluitend records met `ar_merged_into_artist_key`.

Samengevoegde artiesten krijgen een badge **Samengevoegd** en tonen de leidende artiest waarnaar ze verwijzen.

### 2. Geen normale acties op samengevoegde artiesten

Voor samengevoegde artiesten worden reguliere beheeracties beperkt:

- Edit is uitgeschakeld.
- Trash is uitgeschakeld.
- Ontdubbelen is uitgeschakeld.

De samengevoegde artiest blijft als historisch record zichtbaar, maar de gebruiker moet voor verdere acties naar de leidende artiest gaan.

### 3. Leidende artiest openen

Bij een samengevoegde artiest toont het relatiepaneel:

> Deze artiest is samengevoegd.

Daarbij staat een actie **Open leidende artiest**. Deze opent de canonical/replacement artiest en laadt diens relatie-inzicht.

### 4. Mergehistorie in relatiepaneel

Het relatiepaneel toont een compacte read-only kaart **Mergehistorie**.

Deze toont per merge:

- datum;
- richting:
  - **Vervangen door** wanneer de geselecteerde artiest redundant was;
  - **Leidend voor** wanneer de geselecteerde artiest canonical was;
- andere betrokken artiest;
- totale impact op basis van `affected_counts`.

De kaart is informatief. Bewerken of rollback van merges is niet in scope.

## Technisch ontwerp

### Backend

Nieuwe route:

```text
GET /api/artists/merge/history?artistKey=<id>&limit=100&offset=0
```

Deze route gebruikt `artist_merge_history` en kan zowel algemene mergehistorie als historie per artiest leveren.

`GET /api/artists/:id/relations` is uitgebreid met `mergeHistory`, zodat het relatiepaneel de mergehistorie direct kan tonen.

### Artist list filtering

`GET /api/artists` accepteert nu `mergeStatus`:

```text
mergeStatus=active          # standaard
mergeStatus=include_merged  # actieve artiesten plus samengevoegde artiesten
mergeStatus=merged_only     # alleen samengevoegde artiesten
```

De modelquery retourneert extra merge-metadata:

- `ar_merged_into_artist_key`
- `ar_merged_at`
- `ar_merge_note`
- `ar_merged_into_artist_name`

### Geen nieuwe migratie

ART-015C-3 gebruikt de migratie uit ART-015C-1:

```text
scripts/sql/20260525_art015c_artist_merge_execution.sql
```

Er is voor deze sprint geen extra SQL-migratie nodig.

## Niet in scope

Niet meegenomen in ART-015C-3:

- undo/rollback van merges;
- mailintegratie;
- periodieke duplicate scanner;
- Discogs artist enrichment;
- albums/muzikant/band-relaties;
- muteren van mergehistorie.

## Acceptatiecriteria

- Samengevoegde artiesten zijn standaard verborgen in de actieve lijst.
- De gebruiker kan samengevoegde artiesten expliciet tonen of apart filteren.
- Samengevoegde artiesten tonen een badge **Samengevoegd**.
- Het relatiepaneel toont **Open leidende artiest**.
- Ontdubbelen is uitgeschakeld voor samengevoegde artiesten.
- Het relatiepaneel toont read-only mergehistorie.
- De bestaande ART-015C transactionele merge blijft intact.


## ART-015C-3-Fix-1 — Duplicate state reset bij navigatie

### Bevinding

Wanneer een gebruiker bij een artiest mogelijke dubbelen zoekt en daarna teruggaat naar de artiestenlijst of een andere artiest selecteert, mag de eerder gevonden duplicate-kandidaat niet zichtbaar blijven in het relatiepaneel. Oude duplicate-/impactinformatie hoort altijd bij de artiest waarvoor zij geladen is en mag niet lijken alsof zij bij een nieuwe selectie hoort.

### Gewenst gedrag

De duplicate-workflow wordt volledig gereset bij:

- klikken op **Terug naar artiestenlijst**;
- selecteren van een andere artiest;
- leegmaken van de geselecteerde artiest.

De reset wist minimaal:

- duplicate candidates;
- gekozen/geladen impactscan;
- open impact-offcanvas;
- merge-richting via de geladen impact;
- redenveld;
- bevestigingsstatus;
- merge-resultaat;
- duplicate-/impactmeldingen.

### Acceptatiecriteria

- Oude duplicate candidates blijven niet zichtbaar na **Terug naar artiestenlijst**.
- Oude duplicate candidates blijven niet zichtbaar na selectie van een andere artiest.
- Een impactscan van een vorige artiest blijft niet zichtbaar bij een nieuwe artiest.
- Merge-knoppen, redenveld en bevestiging worden opnieuw opgebouwd vanuit de nieuwe selectie.

## ART-015C-3-Fix-2 — Merge SQL-typing en logging

### Aanleiding

Tijdens het uitvoeren van een artist merge kan PostgreSQL falen met:

```text
could not determine data type of parameter $1
```

De transactie rolt dan correct terug, maar zonder stapgerichte logging is niet direct zichtbaar in welke merge-stap de fout is ontstaan.

### Oplossing

De merge-service gebruikt nu expliciete PostgreSQL-casts op parameters in de gevoelige SQL-stappen:

- `artist_merge_history` insert;
- `admin_audit_log` insert;
- `alerts` insert;
- `artist_merge_history.notification_status` update;
- updates waar citext/text/jsonb/integer waarden gemengd worden.

Voorbeelden:

```sql
$1::integer
$2::text
$3::public.citext
$7::jsonb
$1::bigint
```

### Logging

De merge-service logt nu stapgericht met `debug`, `info`, `warn` en `error`, afhankelijk van `LOG_LEVEL`.

Belangrijke stappen:

- `artist_merge.start`
- `artist_merge.begin`
- `artist_merge.lock_artists`
- `artist_merge.update_file_details`
- `artist_merge.update_artist_spellings`
- `artist_merge.reset_validations`
- `artist_merge.insert_artist_merge_history`
- `artist_merge.insert_admin_audit_log`
- `artist_merge.insert_shellstarter_alert`
- `artist_merge.commit`
- `artist_merge.rollback`

Bij rollback wordt de mislukte stap gelogd als `failedStep`.

### API-foutmelding

Als de merge faalt, retourneert de API nu een veilige foutmelding:

```json
{
  "error": "Merge is niet uitgevoerd; de transactie is teruggedraaid.",
  "detail": "Zie serverlog voor technische details.",
  "mergeStep": "insert_shellstarter_alert",
  "transaction": "rolled_back"
}
```

De frontend toont de stapnaam zodat gericht in de serverlog gezocht kan worden.


## ART-015C-3-Fix-3 — Artist keys zichtbaar in mergehistorie en merge-resultaat

### Aanleiding

Bij controle na een merge moet direct zichtbaar zijn welke `artist_key` redundant was en welke `artist_key` leidend is geworden. Alleen artiestnamen zijn onvoldoende, omdat namen juist kunnen lijken of dubbel kunnen voorkomen.

### Gewenst gedrag

De mergehistoriekaart in het relatiepaneel toont per merge:

- `merge_id`;
- redundante artist key;
- leidende/replacement artist key;
- richting van de merge;
- andere betrokken artiestnaam;
- totale impact;
- affected counts uitgesplitst in leesbare labels.

De merge-resultaatmelding na **Merge uitvoeren** toont:

- `merge_id`;
- redundant: artist key + naam;
- leidend: artist key + naam;
- affected counts per scope;
- alert-id/severity.

### Acceptatiecriteria

- De gebruiker kan in de UI zien: `redundant_artist_key -> replacement_artist_key`.
- De mergehistorie toont de keys ook als artiestnamen veel op elkaar lijken.
- De resultaatmelding na merge geeft direct genoeg informatie om SQL-controlequeries gericht uit te voeren.
- Er is geen nieuwe SQL-migratie nodig.

## Fix 4 — Leesbaarheid merge-history tabel

De tabel in het paneel **Mergehistorie** gebruikt een eigen scroll-wrapper met extra onderruimte. Hiermee blijft de horizontale scrollbar beschikbaar zonder over de rij-inhoud heen te vallen. Lange impactdetails worden niet meer als één brede regel weergegeven, maar als compacte chips per geraakt onderdeel.
