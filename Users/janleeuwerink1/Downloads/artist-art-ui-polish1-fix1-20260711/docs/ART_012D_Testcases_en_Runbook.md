# ART-012D — Testcases en runbook

Datum: 2026-06-07  
Status: ontwerp/testcases, nog geen code-implementatie

## 1. Doel

Dit document beschrijft de teststrategie voor ART-012D: Discogs-data toepassen als voorstellen voor artiestenspelling en canonical artist name-wijzigingen.

## 2. Voorwaarden

ART-012D bouwt voort op:

```bash
npm run db:migrate:art012b
```

En bestaande Discogs-configuratie:

```env
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
```

## 3. Functionele testcases

### TC-ART012D-001 — Discogs naam is voorstel

**Given** een lokale artist met gekoppelde Discogs artist  
**When** de Discogs naam afwijkt van `artist.ar_artist_name`  
**Then** toont de UI dit als voorstel  
**And** wordt `artist.ar_artist_name` niet automatisch aangepast.

### TC-ART012D-002 — Voeg Discogs naam toe als alternatieve spelling

**Given** Discogs naam bestaat nog niet in `artiesten_spelling`  
**When** gebruiker kiest **Voeg toe als alternatieve spelling**  
**Then** wordt een record toegevoegd aan `artiesten_spelling`  
**And** blijft `artist.ar_artist_name` ongewijzigd.

### TC-ART012D-003 — Alternatieve spelling bestaat al bij dezelfde artist

**Given** voorstel bestaat al in `artiesten_spelling` voor dezelfde artist  
**When** gebruiker het voorstel bekijkt  
**Then** toont de UI status “bestaat al”  
**And** wordt geen dubbel record aangemaakt.

### TC-ART012D-004 — Alternatieve spelling conflicteert met andere artist

**Given** voorstel bestaat al in `artiesten_spelling` voor een andere artist  
**When** gebruiker het voorstel wil toepassen  
**Then** blokkeert de app de actie  
**And** toont de app de conflicterende artist key/naam.

### TC-ART012D-005 — Maak Discogs naam canonical

**Given** lokale canonical naam is `Hall & Oates`  
**And** Discogs naamvoorstel is `Daryl Hall & John Oates`  
**When** gebruiker kiest **Maak canonical naam** en bevestigt  
**Then** wordt `artist.ar_artist_name` gewijzigd naar de nieuwe naam  
**And** blijft de oude canonical naam behouden als alternatieve spelling  
**And** is de nieuwe canonical naam geborgd in `artiesten_spelling`.

### TC-ART012D-006 — Canonical rename vereist bevestiging

**Given** gebruiker kiest **Maak canonical naam**  
**When** gebruiker niet bevestigt of geen reden invult  
**Then** wordt geen wijziging uitgevoerd.

### TC-ART012D-007 — Audit

**Given** een spellingvoorstel wordt toegepast  
**Then** wordt minimaal vastgelegd:

- artist key;
- bron `discogs`;
- voorstelwaarde;
- actie;
- timestamp;
- reden/auditnotitie.

## 4. Technische testcases

### TC-ART012D-T001 — Geen directe overwrite in link-flow

Controleer dat de Discogs-koppelflow niet rechtstreeks `artist.ar_artist_name` update.

### TC-ART012D-T002 — Conflictcontrole gebruikt `artiesten_spelling`

Controleer dat voorstellen worden vergeleken met:

```sql
artiesten_spelling.as_alternatieve_spelling
```

### TC-ART012D-T003 — Canonical rename is transactioneel

Canonical rename moet in één transactie gebeuren. Als een stap faalt, wordt alles teruggedraaid.

### TC-ART012D-T004 — Oude canonical naam blijft behouden

Na canonical rename moet de oude naam aanwezig zijn in `artiesten_spelling` voor dezelfde artist.

## 5. Handmatige controlequeries toekomstige implementatie

Alternatieve spellingen voor artist:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_artist_key, as_alternatieve_spelling
from artiesten_spelling
where as_artist_key = <artist_key>
order by as_alternatieve_spelling;
"
```

Canonical artist controleren:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select ar_artist_key, ar_artist_name
from artist
where ar_artist_key = <artist_key>;
"
```

Conflicten zoeken:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_artist_key, as_alternatieve_spelling
from artiesten_spelling
where as_alternatieve_spelling = '<voorstel>'::citext;
"
```

## 6. NPM testscript

Ontwerptest:

```bash
npm run test:art012d
```

Volledige ART-012 testset:

```bash
npm run test:art012
```

## 7. Geen migratie in deze ontwerpsprint

ART-012D ontwerp bevat nog geen SQL-migratie. Eventuele tabellen zoals `artist_spelling_proposals` komen pas in een implementatiesprint.
