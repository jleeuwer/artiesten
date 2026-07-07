# ART-012D — Discogs naamvoorstellen en artiestenspelling toepassen

Datum: 2026-06-07  
Type sprint: functioneel/technisch ontwerp  
Status: uitgewerkt, nog geen code-implementatie

## 1. Doel

ART-012D beschrijft hoe Discogs artist-data als **voorstel** gebruikt kan worden om lokale artiestenspellingen en eventueel de canonical artist name gecontroleerd te verbeteren.

De sprint bouwt voort op:

- ART-012B: Discogs artist search/detail;
- ART-012C: Discogs artist koppelen aan lokale artist;
- ART-012C-Fix-3: Discogs artist name is een voorstel en overschrijft nooit automatisch de lokale artistnaam.

## 2. Belangrijkste ontwerpregel

De lokale artistnaam mag nooit rechtstreeks uit Discogs worden overschreven.

```text
Discogs artist name = bronvoorstel
artist.ar_artist_name = lokale canonical naam
artiesten_spelling = mapping-/spellingmodel
```

Omdat `artist.ar_artist_name` samenhangt met `artiesten_spelling`, moet elke canonical name-wijziging via een expliciete spelling-aware flow lopen.

## 3. Functionele scope ART-012D

ART-012D werkt de volgende toekomstige functies uit:

1. Discogs artist name tonen als voorstel.
2. Discogs artist name toevoegen als alternatieve spelling.
3. Discogs artist name voorstellen als nieuwe canonical artist name.
4. Oude canonical artist name behouden als alternatieve spelling.
5. Aliases en name variations uit Discogs tonen als spellingvoorstellen.
6. Conflicten op `artiesten_spelling.as_alternatieve_spelling` controleren vóór toepassen.
7. Gebruiker expliciet laten bevestigen.
8. Alle wijzigingen auditbaar maken.

## 4. Niet in scope van ART-012D ontwerp

Nog niet bouwen in deze ontwerpsprint:

- automatische canonical rename;
- automatische insert van alle Discogs aliases;
- automatische merge van artists;
- automatische update van `file_details`;
- automatische update van `hitlijsten`;
- albums;
- Wikipedia/Wikidata/MusicBrainz enrichment.

## 5. Brongegevens uit Discogs

ART-012D gebruikt data die al via ART-012C wordt opgeslagen in:

- `artist_external_reference`;
- `artist_enrichment_cache`;
- `artist_external_image`.

Voor spellingvoorstellen zijn vooral relevant:

| Discogs veld | Gebruik |
|---|---|
| Discogs artist name | voorstel voor alternatieve spelling of canonical naam |
| real name | informatief, mogelijk later artist-attribuut |
| aliases | spelling-/identityvoorstellen, niet automatisch toepassen |
| name variations | spellingvoorstellen |
| groups/members | later input voor ART-013 relaties |

## 6. Voorgestelde gebruikersflow

### 6.1 Uitgangspunt

De gebruiker heeft een lokale artist gekoppeld aan een Discogs artist.

Voorbeeld:

```text
Lokale artist: Hall & Oates
Discogs artist: Daryl Hall & John Oates
```

De app toont:

```text
Discogs stelt een afwijkende naam voor. Deze naam wordt niet automatisch toegepast.
```

### 6.2 Mogelijke acties

De gebruiker krijgt later drie duidelijke acties:

1. **Alleen Discogs-koppeling behouden**
   - Geen wijziging aan `artist`.
   - Geen wijziging aan `artiesten_spelling`.
   - Huidige ART-012C gedrag.

2. **Voeg Discogs naam toe als alternatieve spelling**
   - Insert in `artiesten_spelling`.
   - `artist.ar_artist_name` blijft gelijk.
   - Conflictcontrole op unieke spelling.

3. **Maak Discogs naam canonical**
   - Alleen via aparte bevestigde flow.
   - Oude canonical naam blijft behouden/toegevoegd als alternatieve spelling.
   - Nieuwe canonical naam wordt `artist.ar_artist_name`.
   - Nieuwe canonical naam wordt geborgd in `artiesten_spelling`.
   - Conflictcontrole en audit zijn verplicht.

## 7. Alternatieve spelling toevoegen

### 7.1 Functionele regel

Een Discogs-naam of name variation mag als alternatieve spelling worden toegevoegd aan dezelfde artist.

Voorbeeld:

```text
artist.ar_artist_name = Hall & Oates
voorstel = Daryl Hall & John Oates
```

Na toepassen:

```text
artiesten_spelling.as_alternatieve_spelling = Daryl Hall & John Oates
artiesten_spelling.as_artist_key = <artist_key van Hall & Oates>
```

### 7.2 Conflictregels

Voor insert moet worden gecontroleerd:

1. Bestaat de spelling al voor dezelfde artist?
   - Dan is de actie idempotent: toon “bestaat al”.
2. Bestaat de spelling al voor een andere artist?
   - Dan blokkeren en conflict tonen.
3. Is de spelling leeg of te kort?
   - Dan niet aanbieden of blokkeren.
4. Is de spelling identiek aan canonical naam?
   - Dan hooguit tonen als reeds bekend, niet dubbel toevoegen.

### 7.3 SQL-richting

```sql
insert into artiesten_spelling (as_alternatieve_spelling, as_artist_key)
values ($1::citext, $2::integer)
on conflict (as_alternatieve_spelling) do nothing;
```

Voor echte implementatie mag `do nothing` alleen na expliciete conflictcontrole worden gebruikt, zodat de gebruiker begrijpt waarom er niets is toegevoegd.

## 8. Discogs naam canonical maken

### 8.1 Functionele regel

Canonical rename is een zwaardere beheeractie dan een alternatieve spelling toevoegen.

De app moet expliciet tonen:

```text
Je wijzigt de lokale canonical artist name.
De oude naam blijft als alternatieve spelling behouden.
```

### 8.2 Transactionele stappen

De canonical rename moet in één transactie gebeuren:

```text
BEGIN
1. lock artist record
2. bepaal oude canonical naam
3. controleer nieuwe canonical naam op conflict in artist.ar_artist_name
4. controleer nieuwe canonical naam op conflict in artiesten_spelling.as_alternatieve_spelling
5. voeg oude canonical naam toe/behoud als alternatieve spelling
6. update artist.ar_artist_name
7. borg nieuwe canonical naam in artiesten_spelling
8. schrijf audit/history
COMMIT
```

Bij fout:

```text
ROLLBACK
```

### 8.3 Wat wordt niet aangepast

Canonical rename wijzigt niet automatisch:

- `file_details.fd_correct_artist`;
- tekstuele historische stagingvelden;
- Discogs brondata;
- mergehistorie.

Als later gewenst is dat afgeleide tekstvelden worden gesynchroniseerd, moet dat apart worden ontworpen.

## 9. Aliases en name variations als voorstellen

Discogs kan meerdere alias/name variation items bevatten. Die moeten niet blind worden toegevoegd.

### Voorstelweergave

Tabel/paneel:

| Voorstel | Bron | Status | Actie |
|---|---|---|---|
| Daryl Hall & John Oates | Discogs artist name | nieuw | Voeg toe als spelling |
| Hall And Oates | Discogs name variation | bestaat al | Geen actie |
| Daryl Hall | Discogs alias | conflict/andere artist | Bekijk conflict |

### Statussen

```text
new
already_linked_to_this_artist
conflict_other_artist
ignored
applied
not_applicable
```

## 10. Datamodelvoorstel

ART-012D kan in eerste implementatie zonder extra tabel starten door voorstellen runtime te berekenen uit `artist_enrichment_cache.normalized_data_json`.

Voor beheerbaarheid is later een staging/reviewtabel beter:

```text
artist_spelling_proposals
```

Conceptuele velden:

```text
proposal_id
artist_key
source
source_reference_id
proposal_value
proposal_type
proposal_source_field
status
conflict_artist_key
applied_at
ignored_at
review_note
created_at
updated_at
```

### Proposal types

```text
alternative_spelling
canonical_name
alias
name_variation
real_name
```

Voor ART-012D eerste implementatie kan dit nog worden uitgesteld; het ontwerp moet wel rekening houden met latere persistentie.

## 11. API-ontwerp

### 11.1 Voorstellen ophalen

```http
GET /api/artists/:id/discogs/spelling-proposals
```

Response conceptueel:

```json
{
  "artistKey": 1483,
  "localArtistName": "Hall & Oates",
  "discogsReference": {
    "externalId": "12345",
    "externalName": "Daryl Hall & John Oates"
  },
  "proposals": [
    {
      "value": "Daryl Hall & John Oates",
      "type": "alternative_spelling",
      "sourceField": "discogs.name",
      "status": "new",
      "conflict": null
    }
  ]
}
```

### 11.2 Alternatieve spelling toepassen

```http
POST /api/artists/:id/spelling-proposals/apply-alternative
```

Body:

```json
{
  "value": "Daryl Hall & John Oates",
  "source": "discogs",
  "reason": "Discogs name variation accepted"
}
```

### 11.3 Canonical naam wijzigen

```http
POST /api/artists/:id/spelling-proposals/apply-canonical
```

Body:

```json
{
  "newCanonicalName": "Daryl Hall & John Oates",
  "preserveOldNameAsSpelling": true,
  "reason": "Discogs canonical name accepted"
}
```

## 12. UI-ontwerp

In het Discogs artist enrichment paneel komt later een extra sectie:

```text
Discogs naam- en spellingvoorstellen
```

Met uitleg:

```text
Discogs-namen zijn voorstellen. Lokale artistnaam wordt niet automatisch aangepast.
Naamwijzigingen lopen via artiestenspelling en vereisen bevestiging.
```

Acties:

- **Voeg toe als alternatieve spelling**
- **Maak canonical naam**
- **Negeer voorstel**
- **Bekijk conflict**

De actie **Maak canonical naam** opent altijd een bevestigingsdialoog met impact:

- oude canonical naam;
- nieuwe canonical naam;
- aan te maken/behouden spellingen;
- conflicten;
- auditreden.

## 13. Audit en logging

Elke toepassing moet auditbaar zijn.

Minimaal loggen:

- artist key;
- oude canonical naam;
- nieuwe canonical naam;
- toegevoegde alternatieve spelling;
- bron `discogs`;
- Discogs external ID;
- gebruiker/actor indien beschikbaar;
- timestamp;
- reason/review note.

Als `admin_audit_log` niet beschikbaar of incompatibel is, moet de hoofdactie niet per ongeluk worden teruggedraaid tenzij audit functioneel verplicht wordt gemaakt. Voor canonical rename is audit functioneel sterk gewenst; dit moet bij implementatie definitief worden gekozen.

## 14. Relatie met ART-009

ART-009 gaat over de positionering van `artiesten_spelling` beheer. ART-012D raakt dit direct.

Ontwerpkeuze:

- ART-012D mag spellingvoorstellen vanuit Discogs aanleveren.
- De daadwerkelijke spellingmutatie moet dezelfde regels volgen als regulier artiestenspellingbeheer.
- Als ART-009 later een volledige spellingbeheer-UI oplevert, moet ART-012D daarop aansluiten in plaats van dubbele logica te bouwen.

## 15. Relatie met ART-015 duplicate scanner

Geaccepteerde Discogs-spellingen kunnen de duplicate scanner verbeteren.

Niet doen:

```text
Discogs alias automatisch gebruiken om artists te mergen.
```

Wel doen:

```text
Discogs alias/name variation als extra spellingvariant gebruiken na review.
```

## 16. Teststrategie

Contracttests moeten borgen:

- Discogs artist name wordt nergens automatisch naar `artist.ar_artist_name` geschreven.
- UI/documentatie bevat uitleg dat Discogs-namen voorstellen zijn.
- Alternatieve spelling-flow controleert conflicten.
- Canonical rename-flow bewaart oude canonical naam als spelling.
- Canonical rename-flow vereist expliciete bevestiging.
- `artiesten_spelling.as_alternatieve_spelling` uniqueness wordt gerespecteerd.
- Audit/logging is beschreven.

## 17. Acceptatiecriteria ART-012D ontwerp

- Functionele flow voor alternatieve spelling toepassen is beschreven.
- Functionele flow voor canonical rename is beschreven.
- Conflictafhandeling is beschreven.
- API-ontwerp is beschreven.
- UI-ontwerp is beschreven.
- Teststrategie is beschreven.
- Backlog en project notes verwijzen naar ART-012D.

## 18. Vervolgplanning

Aanbevolen volgorde:

1. **ART-012D-1** — spellingvoorstellen ophalen en tonen, nog geen mutaties.
2. **ART-012D-2** — Discogs naam toevoegen als alternatieve spelling.
3. **ART-012D-3** — canonical rename via spelling-aware transactie.
4. **ART-012D-4** — aliases/name variations reviewqueue/persistent proposals.
