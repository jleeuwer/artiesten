# ART-015D — Testcases en runbook

## 1. Doel

Dit document beschrijft de teststrategie en het runbook voor de toekomstige periodieke duplicate scanner van de Artiesten-app.

ART-015D is in deze sprint een ontwerp- en documentatiesprint. De daadwerkelijke scanner en reviewqueue worden in vervolgsprints geïmplementeerd.

## 2. Teststrategie

### Documentatiecontracttest

De huidige sprint bevat een contracttest die controleert of het ART-015D ontwerp aanwezig is en de belangrijkste ontwerpbesluiten bevat:

- Python onderhoudsscan;
- staging/reviewtabellen;
- candidate statusflow;
- hergebruik van impactscan en merge-service;
- Shellstarter alerts/mail;
- scheduling;
- geen automatische merge.

Command:

```bash
npm run test:art015d
```

### Toekomstige tests ART-015D-1

Voor de scannerimplementatie moeten minimaal de volgende tests komen:

1. Normalisatie van artiestnamen.
2. Fuzzy score berekening.
3. Match via `artist.ar_artist_name`.
4. Match via `artiesten_spelling.as_alternatieve_spelling`.
5. Korte namen krijgen strengere matchregels.
6. Scanner schrijft een scan-run.
7. Scanner schrijft candidates.
8. Scanner voorkomt dubbele candidate-pairs per run.
9. Scanner voert geen merge uit.
10. Scanner logt start/einde/fouten.

### Toekomstige tests ART-015D-2

Voor de reviewqueue:

1. Candidate lijst ophalen.
2. Filteren op status.
3. Candidate markeren als `not_duplicate`.
4. Candidate markeren als `ignored`.
5. Impactscan starten vanuit candidate.
6. Merge uitvoeren via bestaande ART-015C-service.
7. Candidate krijgt status `merged` na succesvolle merge.
8. Candidate blijft ongewijzigd bij rollback/fout.

### Toekomstige tests ART-015D-3

Voor scheduling/alerts:

1. Dubbele actieve scan wordt geblokkeerd.
2. Scan afgerond schrijft alert.
3. Scan mislukt schrijft foutlog en alert.
4. Logbestand staat in projectlogdirectory.
5. Mail/outbox alleen geactiveerd volgens configuratie.

## 3. Conceptueel runbook toekomstige scanner

### Handmatige uitvoering

Voorbeeldrichting voor de toekomstige Python scanner:

```bash
python scripts/artist_duplicate_scanner.py \
  --env .env \
  --min-score 82 \
  --log-dir logs
```

### Cron-geschikte uitvoering

Voorbeeld:

```bash
0 3 * * 0 cd /path/to/artist && .venv/bin/python scripts/artist_duplicate_scanner.py --env .env --log-dir logs
```

### Docker PostgreSQL context

De scanner moet databaseconnectie lezen uit `.env`, bijvoorbeeld via `DATABASE_URL`. Omdat de gebruiker PostgreSQL in Docker draait, moet de scanner host-to-container poortmapping ondersteunen, zoals `localhost:5433` naar containerpoort `5432`.

### Logging

Aanbevolen logbestand:

```text
logs/artist-duplicate-scanner-YYYYMMDD-HHMMSS.log
```

### Reviewproces

1. Scanner draait periodiek of handmatig.
2. Candidates komen in staging/reviewqueue.
3. Gebruiker opent Artiesten-app.
4. Gebruiker beoordeelt candidates.
5. Gebruiker start impactscan.
6. Gebruiker voert eventueel merge uit via ART-015C.

## 4. Acceptatiecriteria voor ART-015D ontwerp

- Er is een ontwerpdocument voor de periodieke duplicate scanner.
- Er is een runbook/testdocument.
- Het ontwerp onderscheidt scanner, staging, reviewqueue, impactscan en merge-service.
- Het ontwerp bevestigt dat de scanner nooit automatisch merged.
- Het ontwerp bevat stagingtabellen en statussen.
- Het ontwerp bevat scheduling- en alert/mail-afwegingen.

---

## 5. ART-015D-1 runbook — SQL stagingtabellen en Python scanner basis

### 5.1 Migratie draaien

Omdat PostgreSQL in Docker draait:

```bash
npm run db:migrate:art015d1
```

Het script gebruikt:

```text
ARTIST_DB_CONTAINER
ARTIST_DB_USER
ARTIST_DB_NAME
```

### 5.2 Scanner dry-run

Gebruik eerst dry-run:

```bash
npm run scan:duplicates -- --dry-run --verbose
```

Dry-run:

- leest artiesten en spellingen;
- berekent fuzzy duplicate candidates;
- toont de eerste candidates;
- schrijft niets naar staging;
- voert nooit een merge uit.

### 5.3 Scanner echte run

Na controle:

```bash
npm run scan:duplicates
```

Of met aangepaste drempel:

```bash
ARTIST_DUPLICATE_MIN_SCORE=88 npm run scan:duplicates
```

### 5.4 Controle scan-runs

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select scan_run_id, started_at, finished_at, status, candidate_count, scanner_version
from artist_duplicate_scan_runs
order by scan_run_id desc
limit 10;
"
```

### 5.5 Controle candidates

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select candidate_id, scan_run_id, artist_key_a, artist_name_a, artist_key_b, artist_name_b, match_score, match_method, status
from artist_duplicate_candidates
order by candidate_id desc
limit 25;
"
```

### 5.6 Logs

De wrapper schrijft een logbestand in:

```text
logs/artist-duplicate-scanner-wrapper-YYYYMMDD-HHMMSS.log
```

De Python scanner schrijft JSONL-logregels in:

```text
logs/artist-duplicate-scanner-YYYYMMDD-HHMMSS.jsonl
```

### 5.7 ART-015D-1 automatische tests

```bash
npm run test:art015d1
npm run test:art015d
```

De contracttests controleren:

- aanwezigheid van stagingmigratie;
- Docker-proof migratiescript;
- Python scanner;
- fuzzy matching functies;
- staging inserts;
- geen automatische merge;
- package scripts;
- documentatie/runbook.

## 6. Acceptatiecriteria ART-015D-1

- De migratie maakt `artist_duplicate_scan_runs` en `artist_duplicate_candidates` aan.
- De scanner kan via Docker PostgreSQL artiesten en spellingen lezen.
- De scanner kan candidates berekenen en stagingrecords schrijven.
- Dry-run schrijft niets naar de database.
- De scanner voert nooit automatisch een merge uit.
- De scanner logt start, aantallen, completion en fouten.
- Een succesvolle scan kan een Shellstarter-alert schrijven.
- De reviewqueue blijft vervolgscope voor ART-015D-2.

## ART-015D-2A — Rerun handling runbook

### Migratie uitvoeren

```bash
npm run db:migrate:art015d2a
```

Deze migratie vult bestaande candidate-rijen aan met `artist_key_low`, `artist_key_high`, first/last-seen velden en `times_seen`.

### Controle op dubbele open candidates

Als de migratie meldt dat de unieke open-pair index niet kon worden aangemaakt, controleer dan:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  artist_key_low,
  artist_key_high,
  count(*) as open_occurrences,
  array_agg(candidate_id order by candidate_id) as candidate_ids
from artist_duplicate_candidates
where status in ('new', 'reviewing', 'merge_planned', 'error')
group by artist_key_low, artist_key_high
having count(*) > 1
order by open_occurrences desc;
"
```

### Scanner opnieuw draaien

```bash
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
npm run scan:duplicates
```

Verwachting:

- De tweede echte run maakt geen dubbele open candidates voor dezelfde artiestcombinatie.
- Bestaande open candidates krijgen `times_seen + 1`.
- `last_seen_scan_run_id` wordt bijgewerkt.
- Scan-run statistieken tonen hoeveel candidates nieuw, bijgewerkt of overgeslagen zijn.

### Scanrun-statistieken controleren

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  scan_run_id,
  status,
  candidate_count,
  candidates_found,
  candidates_inserted,
  candidates_updated_existing,
  candidates_skipped_reviewed,
  started_at,
  finished_at
from artist_duplicate_scan_runs
order by scan_run_id desc
limit 10;
"
```

### Candidate rerun-velden controleren

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  candidate_id,
  artist_key_low,
  artist_key_high,
  status,
  match_score,
  times_seen,
  first_seen_scan_run_id,
  last_seen_scan_run_id,
  first_seen_at,
  last_seen_at
from artist_duplicate_candidates
order by last_seen_at desc
limit 25;
"
```

### Automatische test

```bash
npm run test:art015d2a
npm run test:art015d
```

## ART-015D-2A-Fix-1 — psql stdin hardening

### Bevinding

Bij `npm run scan:duplicates` kon de scanner falen met:

```text
exec /usr/bin/psql: argument list too long
```

Dit ontstond wanneer de scanner een grote batch gegenereerde SQL via de command line aan `psql -c` meegaf. Bij bijvoorbeeld 500 candidates kan de SQL groter worden dan de maximale argumentlengte van macOS/Linux/Docker.

### Oplossing

De scanner voert SQL nu uit via `psql` stdin:

```text
docker exec -i <container> psql ...
```

De SQL wordt niet meer als command argument meegegeven. Hierdoor blijft de command line klein en kan de scanner grotere batches verwerken.

### Test

```bash
npm run test:art015d2a:fix1
npm run scan:duplicates
```

Verwacht: geen `argument list too long` fout meer bij grotere candidate batches.

## ART-015D-2A-Fix-2 — first_seen_at / last_seen_at fout

### Bevinding

Bij een echte scanner-run kon PostgreSQL deze fout geven:

```text
null value in column "first_seen_at" of relation "artist_duplicate_candidates" violates not-null constraint
```

### Oorzaak

De ART-015D-2A migratie maakt `first_seen_at` en `last_seen_at` verplicht, maar de scanner-insert vulde deze velden niet voor nieuwe candidates.

### Oplossing

De scanner vult bij nieuwe candidates nu expliciet:

- `first_seen_at`
- `last_seen_at`
- `first_seen_scan_run_id`
- `last_seen_scan_run_id`
- `times_seen`

### Test

```bash
npm run test:art015d2a:fix2
npm run scan:duplicates
```

## ART-015D-2B — Reviewqueue testcases

### Handmatige test

1. Draai scanner:
   ```bash
   npm run scan:duplicates
   ```
2. Start app en open **Duplicate reviewqueue**.
3. Controleer dat candidates zichtbaar zijn.
4. Filter op status `open`, `new`, `ignored`, `not_duplicate` en `all`.
5. Markeer een candidate als **Geen dubbel**.
6. Markeer een candidate als **Negeren**.
7. Open een candidate via **Maak A leidend** of **Maak B leidend** en controleer dat de bestaande impactscan opent.
8. Voer een merge uit en controleer dat de candidate status `merged` krijgt.

### SQL-controle na merge vanuit reviewqueue

```sql
select candidate_id, status, merge_id, reviewed_at, reviewed_by
from artist_duplicate_candidates
order by reviewed_at desc nulls last, candidate_id desc
limit 20;
```

## ART-015D-3 — Scheduling, alerts en operationele hardening

Zie ook:

```text
docs/ART_015D_3_Testcases_en_Runbook.md
```

Belangrijkste testcommando's:

```bash
npm run test:art015d3
npm run test:art015d
npm run test:packaging
```

Operationeel:

```bash
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
./startapp.sh
```
