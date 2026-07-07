# ART-012D-3 — Discogs naam canonical maken via spelling-aware flow

Datum: 2026-06-07  
Type sprint: functioneel/technisch ontwerp  
Status: uitgewerkt, nog geen implementatie

## 1. Doel

ART-012D-3 werkt uit hoe een Discogs artist name later gecontroleerd gebruikt kan worden als nieuwe lokale canonical artist name.

Deze sprint bouwt voort op:

- ART-012C: Discogs artist koppelen aan lokale artist;
- ART-012C-Fix-3: Discogs artist name is een voorstel, geen directe overwrite;
- ART-012D-1: Discogs spellingvoorstellen read-only tonen;
- ART-012D-2: Discogs naam toevoegen als alternatieve spelling.

## 2. Belangrijkste ontwerpregel

`artist.ar_artist_name` mag nooit rechtstreeks uit Discogs worden overschreven.

Een canonical rename moet altijd spelling-aware zijn omdat de lokale artiestnaam samenhangt met:

```text
artist.ar_artist_name
artiesten_spelling.as_alternatieve_spelling
artiesten_spelling.as_artist_key
```

Daarom is canonical rename een expliciete beheeractie met bevestiging, conflictcontrole, transactie en audit.

## 3. Functionele flow

### 3.1 Startpunt

De gebruiker bekijkt een gekoppelde Discogs artist en ziet een naamvoorstel dat afwijkt van de lokale canonical naam.

Voorbeeld:

```text
Lokale canonical naam: Hall & Oates
Discogs naam: Daryl Hall & John Oates
```

De app toont later een actie:

```text
Maak Discogs naam canonical
```

### 3.2 Bevestigingsscherm

Voor uitvoering moet de gebruiker duidelijk zien:

- huidige lokale canonical naam;
- voorgestelde nieuwe canonical naam;
- dat de oude canonical naam behouden blijft als alternatieve spelling;
- welke spellingen al bestaan;
- eventuele conflicten;
- dat de actie transactioneel wordt uitgevoerd;
- dat file_details/hitlijsten niet automatisch tekstueel worden herschreven.

De gebruiker moet expliciet bevestigen.

### 3.3 Resultaat na succesvolle rename

Na succesvolle canonical rename:

```text
artist.ar_artist_name = <nieuwe Discogs/canonical naam>
```

En in `artiesten_spelling` zijn geborgd:

```text
oude canonical naam → dezelfde artist_key
nieuwe canonical naam → dezelfde artist_key
bestaande alternatieve spellingen blijven gekoppeld
```

## 4. Niet in scope van ART-012D-3 implementatieontwerp

Deze sprint bouwt nog geen code. Later bij implementatie blijft buiten scope:

- automatische canonical rename bij Discogs-koppeling;
- automatische merge van artists;
- automatisch herschrijven van `file_details.fd_correct_artist`;
- automatisch herschrijven van historische stagingteksten;
- automatische toepassing van alle aliases/name variations;
- albums, MusicBrainz, Wikidata/Wikipedia.

## 5. Conflictregels

Canonical rename moet vóór uitvoering blokkeren bij conflicten.

### 5.1 Conflict op `artist.ar_artist_name`

Als de nieuwe canonical naam al bestaat als andere artist:

```text
Blokkeren: naam is al canonical voor artist_key X.
```

De gebruiker moet dan eerst artist merge/ontdubbelen gebruiken of een andere naam kiezen.

### 5.2 Conflict op `artiesten_spelling.as_alternatieve_spelling`

Als de nieuwe naam al als alternatieve spelling aan een andere artist gekoppeld is:

```text
Blokkeren: spelling is al gekoppeld aan artist_key X.
```

### 5.3 Nieuwe naam is al spelling bij dezelfde artist

Als de nieuwe naam al bestaat als alternatieve spelling bij dezelfde artist, mag de rename doorgaan. De spelling hoeft dan niet opnieuw toegevoegd te worden.

### 5.4 Oude canonical naam bestaat nog niet als spelling

De oude canonical naam moet worden toegevoegd als alternatieve spelling voor dezelfde artist, tenzij die al bestaat.

### 5.5 Nieuwe naam is leeg/onbruikbaar

Lege of te korte waarden worden geblokkeerd. Normalisatie voor detectie mag worden toegepast, maar de oorspronkelijke schrijfwijze moet bewaard blijven.

## 6. Transactioneel ontwerp

Canonical rename wordt uitgevoerd in één database-transactie.

```text
BEGIN
1. lock artist row FOR UPDATE
2. lees oude canonical naam
3. valideer nieuwe naam
4. controleer conflict op artist.ar_artist_name
5. controleer conflict op artiesten_spelling.as_alternatieve_spelling
6. voeg oude canonical naam toe als spelling indien nodig
7. update artist.ar_artist_name naar nieuwe canonical naam
8. borg nieuwe canonical naam in artiesten_spelling indien nodig
9. schrijf audit/history
10. optioneel: schrijf Shellstarter-alert
COMMIT
```

Bij fout:

```text
ROLLBACK
```

Er mogen geen gedeeltelijke wijzigingen achterblijven.

## 7. SQL-richting

### 7.1 Artist locken

```sql
select ar_artist_key, ar_artist_name
from artist
where ar_artist_key = $1::integer
for update;
```

### 7.2 Conflict op canonical naam

```sql
select ar_artist_key, ar_artist_name
from artist
where ar_artist_name = $1::citext
  and ar_artist_key <> $2::integer;
```

### 7.3 Conflict op alternatieve spelling

```sql
select as_artist_key, as_alternatieve_spelling
from artiesten_spelling
where as_alternatieve_spelling = $1::citext
  and as_artist_key <> $2::integer;
```

### 7.4 Oude naam borgen als spelling

```sql
insert into artiesten_spelling (as_alternatieve_spelling, as_artist_key)
values ($1::citext, $2::integer)
on conflict (as_alternatieve_spelling) do nothing;
```

Deze `do nothing` is alleen toegestaan nadat conflictcontrole heeft vastgesteld dat de spelling niet bij een andere artist hoort.

### 7.5 Artistnaam wijzigen

```sql
update artist
set ar_artist_name = $1::citext,
    ar_updated_at = now()
where ar_artist_key = $2::integer;
```

### 7.6 Nieuwe naam borgen als spelling

```sql
insert into artiesten_spelling (as_alternatieve_spelling, as_artist_key)
values ($1::citext, $2::integer)
on conflict (as_alternatieve_spelling) do nothing;
```

## 8. Audit en historie

Canonical rename moet auditbaar zijn.

Minimale auditdata:

```text
artist_key
old_canonical_name
new_canonical_name
source = discogs
external_id / Discogs artist ID
reason
performed_at
performed_by / system user
```

Mogelijke implementatie-opties:

1. generieke `admin_audit_log` gebruiken;
2. aparte tabel `artist_name_change_history` toevoegen;
3. beide gebruiken.

Voor implementatie wordt optie 2 aanbevolen als het tonen van naamwijzigingshistorie belangrijk wordt.

## 9. UI-ontwerp

### 9.1 Discogs spellingvoorstellen

Bij een beschikbaar Discogs-name proposal toont de UI later naast **Voeg toe als spelling** ook:

```text
Maak canonical
```

Deze actie opent eerst een confirmatiepaneel of modal.

### 9.2 Confirmatiepaneel

Het confirmatiepaneel toont:

```text
Huidige canonical naam: Hall & Oates
Nieuwe canonical naam: Daryl Hall & John Oates

De oude naam blijft als alternatieve spelling behouden.
De nieuwe naam wordt ook als spelling geborgd.
```

Bij conflicten wordt de knop geblokkeerd en toont de UI de conflicterende artist/spelling.

### 9.3 Resultaatmelding

Na succes:

```text
Canonical artist name gewijzigd voor artist_key 1483.
Oude naam "Hall & Oates" is behouden als alternatieve spelling.
Nieuwe naam "Daryl Hall & John Oates" is geborgd als spelling.
```

## 10. API-ontwerp voor toekomstige implementatie

### 10.1 Preview endpoint

```text
GET /api/artists/:id/discogs/spelling-proposals/canonical-preview?value=<naam>
```

Retourneert:

```json
{
  "artistKey": 1483,
  "oldCanonicalName": "Hall & Oates",
  "newCanonicalName": "Daryl Hall & John Oates",
  "canApply": true,
  "conflicts": [],
  "willAddOldNameAsSpelling": true,
  "willEnsureNewNameAsSpelling": true
}
```

### 10.2 Execute endpoint

```text
POST /api/artists/:id/discogs/spelling-proposals/canonical
```

Payload:

```json
{
  "newCanonicalName": "Daryl Hall & John Oates",
  "source": "discogs",
  "externalId": "12345",
  "reason": "Discogs naam als canonical gekozen na review"
}
```

## 11. Teststrategie

Automatische tests moeten straks controleren:

1. canonical rename gebruikt één transactie;
2. oude canonical naam blijft als `artiesten_spelling` behouden;
3. nieuwe canonical naam wordt geborgd in `artiesten_spelling`;
4. conflict met andere `artist.ar_artist_name` blokkeert;
5. conflict met `artiesten_spelling` van andere artist blokkeert;
6. rollback laat `artist` en `artiesten_spelling` ongewijzigd;
7. audit/history wordt geschreven;
8. `file_details` en `hitlijsten` worden niet tekstueel herschreven;
9. Discogs-koppelen blijft los van canonical rename.

## 12. Acceptatiecriteria voor toekomstige implementatie

- Canonical rename gebeurt alleen na expliciete gebruikerbevestiging.
- Discogs-koppelen voert nooit canonical rename uit.
- Oude canonical naam blijft vindbaar als alternatieve spelling.
- Nieuwe canonical naam is geborgd als spelling.
- Conflicten met andere artists worden geblokkeerd.
- De wijziging is transactioneel en auditbaar.
- UI toont helder wat wordt gewijzigd en wat niet.

## 13. Vervolg

Aanbevolen vervolg na dit ontwerp:

1. **ART-012D-3A** — canonical rename preview implementeren, nog geen mutaties.
2. **ART-012D-3B** — spelling-aware canonical rename uitvoeren.
3. **ART-012D-4** — aliases/name variations persistent als reviewqueue/proposals beheren.
