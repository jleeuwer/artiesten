# Release Notes — ART-015D-3B Scheduler scripts en install manual

## Inhoud

Deze release voegt concrete scheduler scripts en een installatiehandleiding toe voor het periodiek draaien van de ART-015D duplicate scanner.

## Toegevoegd

- `docs/ART_015D_3B_Scheduler_Install_Manual.md`
- `docs/ART_015D_3B_Testcases_en_Runbook.md`
- `scripts/scheduled-duplicate-scan.sh`
- `scripts/install-cron-duplicate-scan.sh`
- `scripts/uninstall-cron-duplicate-scan.sh`
- `scripts/install-launchd-duplicate-scan.sh`
- `scripts/uninstall-launchd-duplicate-scan.sh`
- `tests/art015d3bSchedulerScripts.contract.test.mjs`

## Package scripts

- `npm run schedule:duplicates:cron:install`
- `npm run schedule:duplicates:cron:uninstall`
- `npm run schedule:duplicates:launchd:install`
- `npm run schedule:duplicates:launchd:uninstall`
- `npm run test:art015d3b`

## Geen nieuwe SQL-migratie

Deze release bevat alleen scripts, documentatie en tests. Er is geen nieuwe database-migratie nodig.
