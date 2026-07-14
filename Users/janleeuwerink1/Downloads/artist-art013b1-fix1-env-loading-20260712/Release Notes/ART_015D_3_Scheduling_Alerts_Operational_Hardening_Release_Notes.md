# Release Notes — ART-015D-3 Scheduling, alerts en operationele hardening

## Type

Functioneel/technisch ontwerp en documentatie-update.

## Inhoud

- ART-015D-3 ontwerpdocument toegevoegd.
- ART-015D-3 testcases/runbook toegevoegd.
- `startapp.sh` opgenomen als uitvoerbaar lokaal start-/validatiescript.
- Documentatie uitgebreid met:
  - handmatige scannerstart;
  - crontab scheduling;
  - macOS launchd aandachtspunten;
  - Shellstarter alertregels;
  - mailstrategie;
  - operationele logging;
  - vervolgimplementatieplan.
- Contracttest toegevoegd voor ART-015D-3 documentatie en `startapp.sh`.

## Geen nieuwe SQL-migratie

ART-015D-3 gebruikt bestaande ART-015D-tabellen en bestaande Shellstarter `alerts`-tabel.

## Lokaal gebruik

```bash
chmod +x startapp.sh
./startapp.sh
```

Of scanner afzonderlijk:

```bash
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
```
