# ART-015C — Testcases en runbook

Status: ontwerp-/requirementsprint  
Datum: 2026-05-25

## 1. Doel van de testset

Deze testset beschrijft hoe de latere ART-015C implementatie gevalideerd moet worden. ART-015C voert voor het eerst echte database-mutaties uit voor artiest-merge en vereist daarom transactionele tests.

## 2. Testgroepen

### TC-015C-001 — Migratie is aanwezig

Verwacht:

- migratie voegt merge-statusvelden aan `artist` toe;
- migratie maakt `artist_merge_history` aan;
- migratie bevat orphan-checks voor FK-hardening;
- migratie bevat FK-hardening als `NOT VALID` voorstel.

### TC-015C-002 — Merge endpoint valideert input

Scenario's:

- redundant key ontbreekt → 400;
- replacement key ontbreekt → 400;
- redundant key is gelijk aan replacement key → 400;
- actor/reason optioneel maar audit krijgt veilige defaults.

### TC-015C-003 — Merge is één transactie

Setup:

- seed redundant artist;
- seed replacement artist;
- seed records in `file_details`, `artiesten_spelling`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items`.

Verwacht:

- service gebruikt één database-client;
- start met `BEGIN`;
- eindigt met `COMMIT` bij succes;
- voert `ROLLBACK` uit bij fout;
- na fout zijn alle tabellen onveranderd.

### TC-015C-004 — file_details wordt correct gemerged

Verwacht:

- `fd_artist_key` wordt replacement key;
- `fd_correct_artist` wordt replacement artist name;
- aantal updates komt terug in `affected_counts.file_details`.

### TC-015C-005 — artiesten_spelling conflictregels

Scenario's:

1. spelling bestaat alleen bij redundant → wordt overgezet;
2. spelling bestaat al bij replacement → redundant duplicaat wordt verwijderd/overgeslagen volgens implementatieregel;
3. spelling bestaat bij derde artist → merge wordt geblokkeerd.

### TC-015C-006 — hitlijsten/staging/import worden meegenomen

Verwacht:

- `hitlijsten.ar_artist_key` wordt replacement key;
- `staging_hitlijsten.hl_artist_key` wordt replacement key;
- `import_scan_items.fd_artist_key` wordt replacement key;
- aantallen komen terug in affected counts.

### TC-015C-007 — version-group-validations worden geïnvalideerd

Verwacht:

- affected title groups worden bepaald uit `file_details` vóór merge;
- validations voor redundant/replacement artist + affected title groups krijgen `reset_at`;
- `reset_source = 'artist_merge'`;
- er ontstaat geen unique constraint conflict door blind key-updaten.

### TC-015C-008 — redundant artist wordt gemarkeerd als merged

Verwacht:

- `ar_is_deleted = true`;
- `ar_deleted_at` gevuld;
- `ar_merged_into_artist_key = replacement key`;
- `ar_merged_at` gevuld;
- `ar_merge_note` bevat reason of systeemtekst.

### TC-015C-009 — audit/history/alert worden geschreven

Verwacht:

- `artist_merge_history` bevat merge-details;
- `admin_audit_log` bevat generieke auditregel;
- `alerts` bevat Shellstarter-alert met `app_key='artist'` en `module_key='artist-merge'`.

### TC-015C-010 — mail is voorbereid, niet verplicht in v1

Verwacht:

- documentatie beschrijft mailbeleid;
- code hoeft nog geen echte mail te versturen zolang Shellstarter-mailcontract niet is vastgesteld;
- eventueel `notification_status` in history bevat `mail: skipped/not_configured`.

## 3. Docker PostgreSQL runbook

De gebruiker draait PostgreSQL in Docker. ART-015C migraties moeten daarom Docker-proof worden aangeboden.

Voorbeeldpatroon:

```bash
ARTIST_DB_CONTAINER=my-postgresdb \
ARTIST_DB_USER=postgres \
ARTIST_DB_NAME=musicdb \
npm run db:migrate:art015c
```

Intern patroon:

```bash
docker exec -i "$ARTIST_DB_CONTAINER" psql -U "$ARTIST_DB_USER" -d "$ARTIST_DB_NAME" < scripts/sql/20260525_art015c_artist_merge_design.sql
```

## 4. Orphan-check vóór FK-hardening

Voordat FK's op `hitlijsten`, `staging_hitlijsten` en `import_scan_items` worden gevalideerd, moeten orphan-checks nul opleveren of moet opschoning plaatsvinden.

```sql
select count(*) as orphan_hitlijsten
from public.hitlijsten h
left join public.artist a on a.ar_artist_key = h.ar_artist_key
where h.ar_artist_key is not null
  and a.ar_artist_key is null;
```

```sql
select count(*) as orphan_staging_hitlijsten
from public.staging_hitlijsten s
left join public.artist a on a.ar_artist_key = s.hl_artist_key
where s.hl_artist_key is not null
  and a.ar_artist_key is null;
```

```sql
select count(*) as orphan_import_scan_items
from public.import_scan_items i
left join public.artist a on a.ar_artist_key = i.fd_artist_key
where i.fd_artist_key is not null
  and a.ar_artist_key is null;
```

## 5. Acceptatie voor de toekomstige code-sprint

- `npm run test:art015c` groen.
- `npm run test:unit` groen.
- Migratie draait via Docker PostgreSQL.
- Bij fout in merge-service vindt rollback plaats.
- Geen gedeeltelijke merge mogelijk.

---

## ART-015C-1 implementatie testen

### Migratie draaien in Docker PostgreSQL

```bash
npm run db:migrate:art015c
```

Dit gebruikt:

```text
scripts/sql/20260525_art015c_artist_merge_execution.sql
```

Benodigde `.env` variabelen:

```env
ARTIST_DB_CONTAINER=my-postgresdb
ARTIST_DB_USER=postgres
ARTIST_DB_NAME=musicdb
```

### Automatische tests

```bash
npm run test:art015c
npm run test:unit
npm run test:sprint4
```

### Functionele testflow

1. Open de Artiesten-app.
2. Selecteer een artiest.
3. Klik `Zoek mogelijke dubbelen`.
4. Kies bij een kandidaat `Maak kandidaat leidend` of `Maak deze artiest leidend`.
5. Controleer de impactscan.
6. Vul een reden in.
7. Vink de expliciete bevestiging aan.
8. Klik `Merge uitvoeren`.
9. Controleer:
   - redundant artist is gemarkeerd als merged/deleted;
   - replacement artist heeft gekoppelde records overgenomen;
   - `artist_merge_history` bevat een record;
   - `admin_audit_log` bevat een `artist_merge` record;
   - `alerts` bevat een Shellstarter-alert.

### Rollback-test

Voor technische validatie moet een testomgeving een fout simuleren binnen de transactie, bijvoorbeeld door tijdelijk een constraint te laten falen. Acceptatiecriterium:

```text
Geen enkele scope-tabel is gedeeltelijk aangepast wanneer de transactie faalt.
```

## ART-015C-2 — UI hardening merge-richting

### TC-015C2-001 — Knoplabels zijn eenduidig

1. Selecteer een artiest.
2. Klik op **Zoek mogelijke dubbelen**.
3. Controleer bij een kandidaat dat de twee richtingknoppen zichtbaar zijn:
   - **Maak kandidaat leidend**
   - **Maak deze artiest leidend**

Verwachting:

- **Maak kandidaat leidend** betekent dat de kandidaat canonical/vervangend wordt en de huidige artiest redundant wordt.
- **Maak deze artiest leidend** betekent dat de huidige artiest canonical/vervangend blijft en de kandidaat redundant wordt.
- De oude labels `Deze vervangen` en `Kandidaat vervangen` worden niet meer getoond.

### TC-015C2-002 — Toegankelijke buttonteksten

Controleer in de browser/DOM dat beide buttons een duidelijke `title` en `aria-label` hebben die de richting van de merge toelichten.

### TC-015C2-003 — Favorieteniconen

Controleer in de artiestenlijst:

- favoriete artiest toont `bi bi-star-fill`;
- niet-favoriete artiest toont `bi bi-star`;
- de tooltip/label blijft duidelijk voor screenreaders en toetsenbordgebruikers.

### Automatische test

```bash
npm run test:art015c2
```

## ART-015C-3 — Mergehistorie en samengevoegde artiesten

### Doel

Valideer dat uitgevoerde merges zichtbaar en beheerbaar zijn in de UI zonder nieuwe mutaties uit te voeren.

### Handmatige testcases

1. Open de Artiesten-app en controleer dat de standaardlijst **Actieve artiesten** toont.
2. Kies filter **Inclusief samengevoegde artiesten** en controleer dat samengevoegde records zichtbaar worden.
3. Kies filter **Alleen samengevoegde artiesten** en controleer dat alleen artiesten met `ar_merged_into_artist_key` verschijnen.
4. Selecteer een samengevoegde artiest.
5. Controleer dat het relatiepaneel meldt: **Deze artiest is samengevoegd.**
6. Klik **Open leidende artiest** en controleer dat de canonical artiest wordt geopend.
7. Controleer dat de kaart **Mergehistorie** zichtbaar is.
8. Controleer dat voor samengevoegde artiesten ontdubbelen is uitgeschakeld.
9. Controleer dat Edit en Trash voor samengevoegde artiesten niet gebruikt kunnen worden.

### Automatische test

```bash
npm run test:art015c3
```

Deze test controleert routes, API, modelquery, UI-labels, mergefilters en documentatie voor ART-015C-3.


## ART-015C-3-Fix-1 testcases — Duplicate state reset

### Testcase: terug naar artiestenlijst sluit duplicate-context

1. Selecteer een artiest.
2. Klik **Zoek mogelijke dubbelen**.
3. Controleer dat kandidaten of een melding zichtbaar zijn.
4. Klik **Terug naar artiestenlijst**.
5. Verwacht: de duplicate candidates, impactscan en mergevelden zijn gesloten/gereset.

### Testcase: andere artiest selecteren wist oude duplicate-context

1. Selecteer artiest A.
2. Zoek mogelijke dubbelen.
3. Selecteer artiest B.
4. Verwacht: het relatiepaneel toont de relaties van artiest B zonder oude duplicate-kandidaten of impactscan van artiest A.

### Automatische test

```bash
npm run test:art015c3
```

De contracttest controleert dat `resetDuplicateWorkflowState()` bestaat en wordt aangeroepen bij terug naar de lijst en bij selectie van een andere artiest.

## ART-015C-3-Fix-2 testcases — SQL parameter typing en merge logging

### ART-015C-FIX2-001 — SQL-parameters zijn expliciet getypeerd

**Doel:** voorkomen dat PostgreSQL faalt met `could not determine data type of parameter $1`.

**Controle:**

```bash
npm run test:art015c3:fix2
```

De test controleert dat de merge-service expliciete casts gebruikt voor integer, text, citext, jsonb en bigint parameters in history/audit/alert SQL.

### ART-015C-FIX2-002 — Rollback bevat merge-stapdiagnose

**Doel:** bij een technische mergefout moet zichtbaar zijn in welke stap de rollback ontstond.

**Verwacht gedrag:**

- transactie wordt teruggedraaid;
- serverlog bevat `artist_merge.rollback`;
- log metadata bevat `failedStep`;
- API-response bevat `mergeStep` en `transaction: rolled_back`.

### ART-015C-FIX2-003 — LOG_LEVEL stuurt detailniveau

**Doel:** merge logging moet instelbaar zijn.

**Gebruik:**

```env
LOG_LEVEL=debug
```

Voor normale runs blijft `LOG_LEVEL=info` voldoende. Voor merge-diagnose is `debug` aanbevolen.


## ART-015C-3-Fix-3 testcases — Mergehistorie keys en impactdetails

### TC-015C3-FIX3-01 — Merge-resultaat toont keys

1. Voer een merge uit via de impactscan.
2. Controleer de succesmelding.
3. Verwacht dat zichtbaar zijn:
   - merge-id;
   - redundante artist key + naam;
   - leidende artist key + naam;
   - affected counts.

### TC-015C3-FIX3-02 — Mergehistorie toont keys

1. Selecteer een artiest met mergehistorie.
2. Controleer de kaart **Mergehistorie**.
3. Verwacht per regel:
   - merge-id;
   - redundant artist key;
   - leidende artist key;
   - richting;
   - impactdetails.

### Automatische test

```bash
npm run test:art015c3:fix3
```

## ART-015C-3-Fix-4 test

Controleer de leesbaarheid van het paneel **Mergehistorie** bij meerdere affected counts en langere namen:

```bash
npm run test:art015c3:fix4
```

Acceptatie:

- De merge-history tabel heeft een dedicated scroll-wrapper met voldoende onderruimte.
- Lange teksten in de tabel breken af waar nodig.
- Affected counts worden als compacte chips weergegeven.
