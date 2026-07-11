# ART-015D-3B — Install manual periodieke duplicate scanner scheduling

## Doel

Deze handleiding beschrijft hoe de periodieke duplicate scanner voor de Artiesten-app gepland kan worden op een Mac/hostomgeving. De scanner zelf blijft dezelfde veilige onderhoudsflow gebruiken:

```text
scanner → staging candidates → reviewqueue → impactscan → transactionele merge → mergehistorie/audit/alerts
```

De scheduler voert **geen automatische merge** uit. De scanner zet alleen mogelijke dubbele artiesten klaar in de reviewqueue.

## Meegeleverde scripts

| Script | Doel |
|---|---|
| `scripts/scheduled-duplicate-scan.sh` | Wrapper die `npm run scan:duplicates` draait en timestamped logs schrijft. |
| `scripts/install-cron-duplicate-scan.sh` | Installeert een managed crontab-blok. |
| `scripts/uninstall-cron-duplicate-scan.sh` | Verwijdert het managed crontab-blok. |
| `scripts/install-launchd-duplicate-scan.sh` | Installeert een macOS LaunchAgent. |
| `scripts/uninstall-launchd-duplicate-scan.sh` | Verwijdert de macOS LaunchAgent. |
| `startapp.sh` | Start-/validatiescript voor install, build, test en dev-run met logging. |

## Randvoorwaarden

1. De Artiesten-app is uitgepakt in bijvoorbeeld:

```bash
/Users/janleeuwerink1/Projects/JavaScript/Nodejs/Musicapp/artist
```

2. `.env` bestaat en is gebaseerd op `.env.example`:

```bash
cp .env.example .env
```

3. Docker PostgreSQL draait:

```bash
docker ps
```

4. De ART-015D migraties zijn uitgevoerd:

```bash
npm run db:migrate:art015d1
npm run db:migrate:art015d2a
```

5. De scanner werkt handmatig:

```bash
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
```

## Handmatige scheduled wrapper-test

Voer eerst de scheduled wrapper handmatig uit:

```bash
./scripts/scheduled-duplicate-scan.sh
```

Het script schrijft logs naar:

```text
logs/duplicate-scan-YYYYMMDD-HHMMSS.log
```

De wrapper geeft alle arguments door aan de scanner. Voor een test zonder alerts:

```bash
./scripts/scheduled-duplicate-scan.sh --dry-run --verbose --no-alert
```

## Optie A — Cron installeren

Cron is de eenvoudigste scheduling-variant. Standaard installeert het script een wekelijkse scan op zondag om 09:00:

```bash
npm run schedule:duplicates:cron:install
```

Controleer de crontab:

```bash
crontab -l
```

Het script beheert een blok:

```text
# BEGIN ARTIST_DUPLICATE_SCAN
0 9 * * 0 /pad/naar/artist/scripts/scheduled-duplicate-scan.sh
# END ARTIST_DUPLICATE_SCAN
```

### Andere planning kiezen

Dagelijks om 07:30:

```bash
CRON_SCHEDULE="30 7 * * *" npm run schedule:duplicates:cron:install
```

Elke maandag om 08:15:

```bash
CRON_SCHEDULE="15 8 * * 1" npm run schedule:duplicates:cron:install
```

### Cron verwijderen

```bash
npm run schedule:duplicates:cron:uninstall
```

## Optie B — macOS launchd installeren

`launchd` is de native macOS scheduler. Standaard installeert het script een LaunchAgent voor zondag 09:00:

```bash
npm run schedule:duplicates:launchd:install
```

Handmatig starten:

```bash
launchctl start nl.musicdb.artist.duplicate-scan
```

Logs staan in:

```text
logs/launchd-duplicate-scan.out.log
logs/launchd-duplicate-scan.err.log
```

### Andere planning kiezen

Dagelijks om 07:30 is bij launchd niet direct met `Weekday` als wildcard in dit script ingericht; voor een andere wekelijkse dag/tijd kun je variabelen gebruiken.

Maandag 08:15:

```bash
LAUNCHD_WEEKDAY=1 LAUNCHD_HOUR=8 LAUNCHD_MINUTE=15 npm run schedule:duplicates:launchd:install
```

Zondag 09:00:

```bash
LAUNCHD_WEEKDAY=0 LAUNCHD_HOUR=9 LAUNCHD_MINUTE=0 npm run schedule:duplicates:launchd:install
```

### launchd verwijderen

```bash
npm run schedule:duplicates:launchd:uninstall
```

## Startapp-script

`startapp.sh` voert een lokale installatie-/validatieflow uit met timestamped logs:

```bash
./startapp.sh
```

Het script draait:

```text
npm run install:all
npm run build
npm run test:all
npm run dev
```

Alle output gaat naar `logs/`.

## Alertgedrag

Als `ARTIST_DUPLICATE_ALERT_ENABLED=true` in `.env` staat, schrijft de scanner Shellstarter-alerts bij echte runs wanneer er nieuwe of bijgewerkte open candidates zijn. Bij scanfouten wordt een danger-alert geschreven als er al een scan-run is aangemaakt.

Voor onderhoud zonder alerts:

```bash
npm run scan:duplicates -- --no-alert
```

of scheduled:

```bash
./scripts/scheduled-duplicate-scan.sh --no-alert
```

## Aanbevolen startconfiguratie

Voor jouw Mac-ontwikkelomgeving is dit de aanbevolen start:

```bash
npm run db:migrate:art015d1
npm run db:migrate:art015d2a
./scripts/scheduled-duplicate-scan.sh --dry-run --verbose --no-alert
npm run schedule:duplicates:cron:install
```

Gebruik initieel wekelijks. De duplicate scanner is onderhoudswerk, geen realtime proces.

## Problemen oplossen

### Docker/PostgreSQL draait niet

Controleer:

```bash
docker ps
```

### `.env` ontbreekt

Maak hem opnieuw:

```bash
cp .env.example .env
```

### Cron draait niet

Controleer:

```bash
crontab -l
ls -la logs
```

### launchd draait niet

Controleer:

```bash
launchctl list | grep nl.musicdb.artist.duplicate-scan
cat logs/launchd-duplicate-scan.err.log
```

### Scanner geeft geen nieuwe candidates

Dat kan correct zijn als bestaande open candidates al zijn bijgewerkt door ART-015D-2A rerun handling. Controleer scan-run statistieken:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  scan_run_id,
  status,
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
