# ART-015D-3 — Scanner scheduling, Shellstarter alerts en operationele hardening

## 1. Doel

ART-015D-3 werkt de operationele laag uit rondom de periodieke duplicate scanner voor artiesten.

De functionele keten is nu:

```text
scanner → staging candidates → reviewqueue → impactscan → transactionele merge → mergehistorie/audit/alerts
```

ART-015D-3 zorgt ervoor dat deze keten beheerbaar wordt in dagelijks gebruik:

- de scanner kan handmatig en periodiek worden gestart;
- scanlogs worden voorspelbaar opgeslagen;
- Shellstarter-alerts geven aan dat er reviewwerk of fouten zijn;
- mail wordt functioneel voorbereid, maar nog niet hard gekoppeld;
- runbook en tests borgen dat beheeracties reproduceerbaar zijn;
- `startapp.sh` biedt één uitvoerbaar start-/validatiescript voor lokale builds.

## 2. Functionele uitgangspunten

1. De scanner voert nooit automatisch merges uit.
2. De reviewqueue blijft de plaats waar de gebruiker candidates beoordeelt.
3. De bestaande ART-015C merge-service blijft de enige plek waar artist keys transactioneel worden vervangen.
4. Scheduling mag geen dubbele open werkvoorraad creëren; ART-015D-2A rerun handling blijft leidend.
5. Alerts zijn geschikt voor korte operationele signalering in Shellstarter.
6. Mail wordt alleen gebruikt voor samenvattingen, fouten of high-impact situaties zodra het Shellstarter-mailcontract definitief is.
7. Alle scripts schrijven logoutput naar `logs/` met timestamped bestandsnamen.

## 3. Schedulingvarianten

### 3.1 Handmatig starten

Voor handmatige uitvoering blijft dit de basis:

```bash
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
```

Gebruik eerst `--dry-run --verbose` als je thresholds of configuratie wijzigt.

### 3.2 Crontab

Voor eenvoudige periodieke uitvoering op macOS/Linux kan crontab worden gebruikt.

Voorbeeld: elke zondag om 03:15.

```cron
15 3 * * 0 cd /Users/janleeuwerink1/Projects/JavaScript/Nodejs/Musicapp/artist && /bin/bash scripts/run-artist-duplicate-scanner.sh >> logs/artist-duplicate-cron-$(date +\%Y\%m\%d-\%H\%M\%S).log 2>&1
```

Aandachtspunten:

- gebruik absolute paden;
- escape `%` in crontab met `\%`;
- zorg dat Docker draait;
- zorg dat `.env` aanwezig is;
- zorg dat `ARTIST_DB_CONTAINER`, `ARTIST_DB_USER` en `ARTIST_DB_NAME` kloppen.

### 3.3 macOS launchd

Voor macOS is `launchd` robuuster dan crontab als de app op een Mac draait.

Conceptueel:

- `ProgramArguments`: `/bin/bash`, `scripts/run-artist-duplicate-scanner.sh`;
- `WorkingDirectory`: Artiesten-app projectdirectory;
- `StartCalendarInterval`: bijvoorbeeld zondag 03:15;
- `StandardOutPath` en `StandardErrorPath`: `logs/`.

Een concrete `.plist` kan later worden toegevoegd als de gewenste frequentie en lokale padstructuur definitief zijn.

### 3.4 Custom Python scheduler

Een eigen scheduler is nu niet aanbevolen als eerste keuze. Die zou extra procesbeheer, foutafhandeling en monitoring vereisen. Voor nu zijn handmatig, crontab of launchd eenvoudiger en transparanter.

## 4. Alertstrategie

De scanner schrijft al Shellstarter-alerts via `public.alerts` wanneer alerting is ingeschakeld. ART-015D-3 definieert de regels die de scanner/reviewqueue moeten volgen.

| Situatie | Alert | Severity | Mail |
|---|---:|---|---:|
| Scan geslaagd, geen nieuwe/bijgewerkte candidates | Optioneel | info | Nee |
| Scan geslaagd, nieuwe candidates | Ja | info | Nee |
| Scan geslaagd, veel candidates | Ja | warning | Optioneel later |
| Scan mislukt | Ja indien technisch mogelijk | danger/error | Ja later |
| Reviewqueue bevat oude open candidates | Ja | warning | Optioneel later |
| Merge uitgevoerd vanuit reviewqueue | Bestaande ART-015C alert | info/warning | Nee |

### 4.1 Alertinhoud

Een scanner-alert moet minimaal bevatten:

- scan-run id;
- aantal gevonden candidates;
- aantal nieuw toegevoegd;
- aantal bestaande candidates bijgewerkt;
- aantal overgeslagen door reviewstatus;
- verwijzing naar de duplicate reviewqueue.

Voorbeeld:

```text
Artiesten duplicate scan afgerond
Scan-run 42: 500 gevonden, 12 nieuw, 488 bestaand bijgewerkt, 0 overgeslagen. Open de Duplicate reviewqueue om de candidates te beoordelen.
```

### 4.2 Severity

Voorstel:

- `info`: normale scan met nieuwe candidates;
- `warning`: veel nieuwe candidates of oude open candidates;
- `danger`/`error`: scan mislukt.

De exacte severity-waarden moeten blijven aansluiten op de Shellstarter `alerts`-tabel en UI.

## 5. Mailstrategie

Mail wordt in ART-015D-3 functioneel voorbereid, maar niet hard geïmplementeerd zolang het Shellstarter-mailcontract nog niet definitief is.

Mail is geschikt voor:

- scan mislukt;
- periodieke samenvatting;
- hoge aantallen nieuwe candidates;
- reviewqueue blijft lang openstaan;
- toekomstige batch/maintenance rapportage.

Mail is niet nodig voor iedere normale scan met enkele candidates. Dat zou ruis veroorzaken.

## 6. Operationele logging

Alle operationele scripts schrijven naar `logs/`.

### Scanner-wrapper

`npm run scan:duplicates` gebruikt:

```text
scripts/run-artist-duplicate-scanner.sh
```

Deze schrijft wrapperlogs zoals:

```text
logs/artist-duplicate-scanner-wrapper-YYYYMMDD-HHMMSS.log
```

De Python scanner schrijft JSONL-logs zoals:

```text
logs/artist-duplicate-scanner-YYYYMMDD-HHMMSS.jsonl
```

### Startapp

`startapp.sh` voert lokaal de standaard validatie-/startketen uit:

```bash
npm run install:all
npm run build
npm run test:all
npm run dev
```

Iedere stap schrijft naar een timestamped logfile in `logs/`.

## 7. Startapp-script

Het bestand `startapp.sh` wordt vanaf ART-015D-3 meegeleverd als uitvoerbaar shellscript.

Gebruik:

```bash
./startapp.sh
```

Het script is bedoeld voor lokale ontwikkelvalidatie en start daarna de dev-server. Het script hoort niet in background/asynchrone modus te draaien vanuit ChatGPT; de gebruiker voert het lokaal uit.

## 8. Reviewqueue operationele flow

1. Scheduler draait scanner.
2. Scanner schrijft/actualiseert candidates.
3. Scanner schrijft scan-run statistieken.
4. Scanner maakt Shellstarter-alert als er reviewwerk is of als scan faalt.
5. Gebruiker opent Artiesten-app.
6. Gebruiker opent Duplicate reviewqueue.
7. Gebruiker beoordeelt candidates.
8. Eventuele merge verloopt via bestaande ART-015C transactie.
9. Candidate krijgt status `merged`, `not_duplicate`, `ignored` of blijft `reviewing`.

## 9. Technisch ontwerp

### 9.1 Bestaande tabellen

ART-015D-3 gebruikt bestaande tabellen:

- `artist_duplicate_scan_runs`;
- `artist_duplicate_candidates`;
- `alerts`;
- `artist_merge_history`;
- `admin_audit_log`.

Er is voor deze ontwerpsprint geen nieuwe SQL-migratie nodig.

### 9.2 Scanner-run statistieken

De scanner-run statistieken uit ART-015D-2A blijven leidend:

- `candidates_found`;
- `candidates_inserted`;
- `candidates_updated_existing`;
- `candidates_skipped_reviewed`;
- `candidate_count`.

### 9.3 Alert insert

De scanner mag een alert schrijven via:

```sql
insert into public.alerts(app_key, module_key, title, body, severity, status)
values ('artist', 'artist-duplicate-scanner', ..., ..., ..., 'open');
```

De scanner moet een `--no-alert` optie behouden voor onderhoud/testscenario's.

### 9.4 Configuratie

Bestaande configuratie:

```env
ARTIST_DUPLICATE_MIN_SCORE=82
ARTIST_DUPLICATE_MAX_CANDIDATES=500
```

Aanbevolen toekomstige configuratie:

```env
ARTIST_DUPLICATE_ALERT_ENABLED=true
ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25
ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14
```

Deze toekomstige variabelen zijn ontwerpvoorbereiding. Implementatie kan in ART-015D-3A plaatsvinden.

## 10. Implementatieplan vervolg

### ART-015D-3A — Alert hardening in scanner

- Alertbody verrijken met scan-run statistieken.
- Threshold configureerbaar maken.
- `--no-alert` behouden.
- Foutscenario's beter loggen.

### ART-015D-3B — Scheduler examples

- Crontab voorbeeldbestand.
- macOS launchd voorbeeldbestand.
- Runbook uitbreiden met installatie-/teststappen.

### ART-015D-3C — Reviewqueue health/aging

- Open candidates ouder dan X dagen signaleren.
- Alert bij stale reviewqueue.
- Mogelijk dashboardregel in reviewqueue.

### ART-015D-3D — Mailcontract uitwerken

- Shellstarter mailcontract bepalen.
- Mail alleen voor fouten/high-impact/samenvatting.

## 11. Acceptatiecriteria

- Documentatie beschrijft handmatige en periodieke scannerstart.
- Documentatie beschrijft alert- en mailregels.
- `startapp.sh` is aanwezig en uitvoerbaar.
- Runbook bevat crontab/launchd-keuzes.
- Tests borgen dat ART-015D-3 documentatie aanwezig is.
- Tests borgen dat `startapp.sh` timestamped logs gebruikt.
- Release-ZIP bevat geen `node_modules`, `.env`, legacy env-samples, logs, MacOS metadata of fontbestanden.

## ART-015D-3B concrete scheduler scripts

De scheduling-response is omgezet naar concrete code en een install manual:

- `docs/ART_015D_3B_Scheduler_Install_Manual.md`
- `scripts/scheduled-duplicate-scan.sh`
- `scripts/install-cron-duplicate-scan.sh`
- `scripts/uninstall-cron-duplicate-scan.sh`
- `scripts/install-launchd-duplicate-scan.sh`
- `scripts/uninstall-launchd-duplicate-scan.sh`

De aanbevolen eerste installatie is cron, wekelijks op zondag om 09:00:

```bash
npm run schedule:duplicates:cron:install
```
