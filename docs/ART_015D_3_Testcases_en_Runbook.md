# ART-015D-3 — Testcases en runbook

## 1. Doel

Dit document beschrijft de testcases en operationele runbook-stappen voor scanner scheduling, Shellstarter alerts, mailvoorbereiding en operationele hardening.

## 2. Voorwaarden

- ART-015D-1 migratie is toegepast.
- ART-015D-2A migratie is toegepast.
- ART-015D-2B reviewqueue is beschikbaar.
- `.env` is gemaakt vanuit `.env.example`.
- Docker PostgreSQL draait.
- `ARTIST_DB_CONTAINER`, `ARTIST_DB_USER` en `ARTIST_DB_NAME` kloppen.

## 3. Handmatige validatie

### 3.1 Scanner dry-run

```bash
npm run scan:duplicates -- --dry-run --verbose
```

Verwacht:

- scanner start;
- varianten worden geladen;
- candidates worden berekend;
- geen databasewijzigingen voor candidates;
- logbestanden verschijnen in `logs/`.

### 3.2 Echte scan

```bash
npm run scan:duplicates
```

Verwacht:

- nieuwe scan-run;
- candidates toegevoegd of bestaande candidates bijgewerkt;
- geen dubbele open candidates bij rerun;
- Shellstarter-alert als alerting aan staat en er candidates zijn.

### 3.3 Reviewqueue openen

1. Start app.
2. Open Artiesten-app.
3. Klik **Duplicate reviewqueue**.
4. Controleer candidates, score, status en `times_seen`.

### 3.4 Startapp-script

```bash
./startapp.sh
```

Verwacht:

- `logs/` wordt aangemaakt;
- install, build, test en dev logs worden timestamped weggeschreven;
- script start uiteindelijk `npm run dev`.

## 4. Scheduling runbook

### 4.1 Crontab voorbeeld

```cron
15 3 * * 0 cd /Users/janleeuwerink1/Projects/JavaScript/Nodejs/Musicapp/artist && /bin/bash scripts/run-artist-duplicate-scanner.sh >> logs/artist-duplicate-cron-$(date +\%Y\%m\%d-\%H\%M\%S).log 2>&1
```

Test crontab eerst met een tijdelijke tijd of voer het script handmatig uit.

### 4.2 macOS launchd aandachtspunten

- Gebruik absolute paden.
- Zet `WorkingDirectory` op de Artiesten-app directory.
- Zorg dat Docker actief is vóór de scheduler draait.
- Schrijf stdout/stderr naar `logs/`.

## 5. Alerttest

Na een echte scan:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select id, app_key, module_key, title, severity, status, created_at
from public.alerts
where app_key = 'artist'
  and module_key = 'artist-duplicate-scanner'
order by id desc
limit 10;
"
```

Verwacht:

- alert bij scan met candidates;
- severity `info` of `warning`;
- status `open`.

## 6. Scan-run statistieken

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
from public.artist_duplicate_scan_runs
order by scan_run_id desc
limit 10;
"
```

## 7. Automatische tests

```bash
npm run test:art015d3
npm run test:art015d
npm run test:packaging
```

Volledige lokale validatie na dependency-installatie:

```bash
npm run install:all
npm run test:all
```

## 8. Niet in scope

- Volledige mailimplementatie.
- Automatische merge.
- Discogs artist enrichment.
- Albums/muzikant-band-relaties.

## ART-015D-3A — Scanner alert hardening test

Controleer na een echte scan met candidates:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select id, app_key, module_key, title, severity, status, body, created_at
from public.alerts
where app_key = 'artist'
  and module_key = 'artist-duplicate-scanner'
order by id desc
limit 10;
"
```

Verwacht: een `info` of `warning` alert als er nieuwe of bijgewerkte open candidates zijn. Gebruik `--no-alert` om alerting voor een run uit te zetten.

## Aanvulling ART-015D-3C

Voer ook uit:

```bash
npm run test:art015d3c
```

Controleer handmatig dat de Duplicate reviewqueue badge **Te lang open** toont wanneer een open candidate ouder is dan `ARTIST_DUPLICATE_STALE_REVIEW_DAYS`.
