# ART-012D-3 — Testcases en runbook

Datum: 2026-06-07  
Type: testcases/runbook voor ontwerp  
Status: documentatiecontract

## 1. Doel

Dit document beschrijft de testcases en toekomstige runbookstappen voor het spelling-aware canonical maken van een Discogs artist name.

ART-012D-3 levert nog geen muterende code. De huidige test is daarom een documentatie-/contracttest die borgt dat de randvoorwaarden duidelijk vastliggen.

## 2. Kernregels die getest moeten worden

- Discogs-koppelen wijzigt nooit `artist.ar_artist_name`.
- Een Discogs artist name is een voorstel.
- Canonical rename vereist een aparte spelling-aware flow.
- `artiesten_spelling` moet consistent blijven.
- Oude canonical naam blijft als spelling behouden.
- Nieuwe canonical naam wordt als spelling geborgd.
- Conflicten op `artist.ar_artist_name` en `artiesten_spelling.as_alternatieve_spelling` worden geblokkeerd.
- Canonical rename is één transactie.

## 3. Toekomstige functionele testcases

### TC-ART012D3-001 — Preview toont veilige rename

**Given** een artist met canonical naam `Hall & Oates`  
**And** Discogs stelt `Daryl Hall & John Oates` voor  
**When** de gebruiker preview opent  
**Then** de UI toont oude en nieuwe naam  
**And** toont dat oude naam als spelling behouden blijft  
**And** toont dat nieuwe naam als spelling geborgd wordt.

### TC-ART012D3-002 — Conflict met bestaande artist blokkeert

**Given** een andere artist heeft al `Daryl Hall & John Oates` als canonical naam  
**When** de gebruiker die naam canonical wil maken  
**Then** de actie wordt geblokkeerd  
**And** de conflicterende artist key wordt getoond.

### TC-ART012D3-003 — Conflict met spelling van andere artist blokkeert

**Given** `Daryl Hall & John Oates` bestaat in `artiesten_spelling` voor een andere artist  
**When** de gebruiker die naam canonical wil maken  
**Then** de actie wordt geblokkeerd  
**And** de conflicterende artist key wordt getoond.

### TC-ART012D3-004 — Rename is transactioneel

**Given** canonical rename wordt gestart  
**And** een fout treedt op na het toevoegen van oude canonical naam als spelling  
**When** de transactie faalt  
**Then** `artist.ar_artist_name` blijft ongewijzigd  
**And** `artiesten_spelling` blijft ongewijzigd.

### TC-ART012D3-005 — Geen tekstuele synchronisatie naar file_details

**Given** canonical rename is succesvol  
**Then** `file_details.fd_correct_artist` wordt niet automatisch herschreven  
**And** historische/stagingteksten worden niet automatisch herschreven.

## 4. Toekomstige runbookcontrolequeries

### Artist en spellingen controleren

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select ar_artist_key, ar_artist_name
from artist
where ar_artist_key = <artist_key>;
"
```

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_alternatieve_spelling, as_artist_key
from artiesten_spelling
where as_artist_key = <artist_key>
order by as_alternatieve_spelling;
"
```

### Conflictcheck voor een naam

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select ar_artist_key, ar_artist_name
from artist
where ar_artist_name = '<nieuwe naam>';

select as_artist_key, as_alternatieve_spelling
from artiesten_spelling
where as_alternatieve_spelling = '<nieuwe naam>';
"
```

## 5. Huidige validatie

Voor deze ontwerpsprint:

```bash
npm run test:art012d3
npm run test:art012d
npm run test:art012
npm run test:packaging
```
