# ART-015D-3B — Testcases en runbook scheduler scripts

## Testdoel

Valideren dat de periodieke duplicate scanner op een beheerbare manier gepland kan worden met cron of macOS launchd, zonder merge-logica te dupliceren en met logoutput in `logs/`.

## Handmatige tests

### TC-001 — Scheduled wrapper dry-run

```bash
./scripts/scheduled-duplicate-scan.sh --dry-run --verbose --no-alert
```

Verwacht:

- command start zonder syntaxfout;
- logbestand in `logs/duplicate-scan-YYYYMMDD-HHMMSS.log`;
- scanner draait in dry-run;
- geen database-mutaties voor candidates.

### TC-002 — Cron installeren

```bash
npm run schedule:duplicates:cron:install
crontab -l
```

Verwacht:

- crontab bevat managed blok `ARTIST_DUPLICATE_SCAN`;
- standaardplanning is `0 9 * * 0`;
- scriptpad wijst naar `scripts/scheduled-duplicate-scan.sh`.

### TC-003 — Cron planning overschrijven

```bash
CRON_SCHEDULE="30 7 * * *" npm run schedule:duplicates:cron:install
crontab -l
```

Verwacht:

- bestaande managed blok is vervangen;
- nieuwe planning is `30 7 * * *`;
- geen dubbele managed blokken.

### TC-004 — Cron verwijderen

```bash
npm run schedule:duplicates:cron:uninstall
crontab -l
```

Verwacht:

- managed blok is verwijderd;
- andere crontabregels blijven intact.

### TC-005 — launchd installeren

```bash
npm run schedule:duplicates:launchd:install
launchctl start nl.musicdb.artist.duplicate-scan
```

Verwacht:

- plist staat in `~/Library/LaunchAgents/nl.musicdb.artist.duplicate-scan.plist`;
- launchd kan de job starten;
- logs verschijnen in `logs/launchd-duplicate-scan.*.log`.

### TC-006 — launchd verwijderen

```bash
npm run schedule:duplicates:launchd:uninstall
```

Verwacht:

- plist is verwijderd;
- LaunchAgent is unloaded.

## Automatische contracttest

```bash
npm run test:art015d3b
```

Controleert:

- scripts bestaan en zijn uitvoerbaar;
- cron-script beheert een markerblok;
- launchd-script genereert een plist met juiste keys;
- scheduled wrapper schrijft timestamped logs;
- package scripts zijn aanwezig;
- install manual en README verwijzen naar de scripts.
