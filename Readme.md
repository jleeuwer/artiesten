# Artiesten-app

De Artiesten-app is de Musicapp-beheerapp voor canonical artiestgegevens. De app draait zelfstandig als Node.js/Express + React/Vite applicatie en kan daarnaast embedded worden gebruikt binnen Shellstarter.

## Functionaliteit

- Overzicht van artiesten.
- Artiest toevoegen, wijzigen en bekijken.
- Soft delete naar trash.
- Restore vanuit trash.
- Hard delete met functionele beveiliging:
  - blokkeren als de artiest nog in `file_details` voorkomt;
  - gekoppelde `artiesten_spelling` records opruimen vóór definitief verwijderen.
- Embedded Shellstarter-modus met theme- en height-contract.

## Technische stack

- Backend: Node.js + Express.
- Frontend: React + Vite + React Bootstrap.
- Database: PostgreSQL.
- Logging: Winston.
- Tests: Node test runner.

## Directory-indeling

```text
.
├── client/                 # React/Vite frontend
├── config/                 # database en logging
├── controllers/            # backend controllers
├── docs/                   # sprintdocs, backlog en projectnotities
├── middleware/             # Express middleware
├── models/                 # database queries/model functies
├── public/app/             # productiebuild van de React-app
├── routes/                 # Express routes
├── scripts/                # test- en release-scripts
├── tests/                  # contract/unit tests
├── app.js
└── server.js
```

## Configuratie

Kopieer de officiële voorbeeldconfiguratie naar `.env`:

```bash
cp .env.example .env
```

Minimale configuratie:

```env
NODE_ENV=development
PORT=3012
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/musicdb
CORS_ORIGIN=http://localhost:5173
VITE_ARTIST_APP_ENABLE_SHELL_MODE=true
VITE_ARTIST_APP_ALLOW_THEME_QUERY=true
VITE_ARTIST_APP_DEFAULT_THEME=slate
```

`.env` is lokaal en mag niet in release-ZIP's worden opgenomen. `.env.example` is de enige officiële env-template en moet juist wel worden meegeleverd.

## Installatie

Installeer root- en client-dependencies:

```bash
npm run install:all
```

Dit voert uit:

```bash
npm install
npm --prefix client install
```

## Ontwikkelen

Start backend:

```bash
npm run dev
```

Start client in een tweede terminal:

```bash
npm run client:dev
```

De backend draait standaard op de poort uit `.env`, bij voorkeur `3012`. De Vite devserver draait meestal op `5173`.

## Productiebuild

Maak de React-build naar `public/app`:

```bash
npm run build
```

Start daarna de Express-server:

```bash
npm start
```

Of gecombineerd:

```bash
npm run prod
```

## Testen

Snelle unit/contracttests zonder client-build:

```bash
npm run test:unit
```

Sprint 4 regressietests:

```bash
npm run test:sprint4
```

Packaging-hygiëne controleren:

```bash
npm run test:packaging
```

Volledige validatie, inclusief dependencycheck en client-build:

```bash
npm run test:all
```

Let op: `npm run test:all` vereist dat `npm run install:all` al is uitgevoerd.

## Shellstarter embedded gebruik

De app kan embedded worden geopend met queryparameters zoals:

```text
?embeddedInShell=1&shellTheme=slate&shellOrigin=http://localhost:3010
```

Ondersteunde embedded signalen en context staan beschreven in:

```text
docs/PROJECT_NOTES.md
```

Shellstarter-code valt buiten deze codebase. Deze app bewaakt alleen het client-contract dat nodig is om embedded correct te functioneren.

## Release-ZIP maken

Gebruik:

```bash
npm run package:zip
```

Dit maakt een schone ZIP in de bovenliggende directory. De release-ZIP sluit onder andere uit:

- `.env`
- `.git`
- `node_modules`
- `client/node_modules`
- logs
- `.DS_Store`
- `__MACOSX`
- bestaande ZIP/TAR-bestanden

## Documentatie

Belangrijke documenten:

- `docs/BACKLOG.md`
- `docs/PROJECT_NOTES.md`
- `docs/ART_Sprint6_Artiesten_Relatieinzicht_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_Sprint6_Testcases_en_Runbook.md`
- `docs/BL044_Sprint4_Artiesten_Test_Cases_and_Runbook.md`
- overige BL-044 sprintdocumentatie in `docs/`

## Actuele functionele richting

Sprint 6 is geïmplementeerd: artiestgewicht, favorieten en read-only relatie-inzicht. De app moet later ook kunnen doorgroeien naar Discogs artist enrichment, artiesten ontdubbelen/samenvoegen, muzikant-band-artiest relaties en albums in `musicdb`.

## ART Sprint 6 — Relatie-inzicht, gewicht en favorieten

Deze versie bevat de Sprint 6 implementatie voor de Artiesten-app.

### Nieuwe functionaliteit

- Artiestgewicht op basis van aantal unieke titels in `file_details`, exclusief records met `fd_action = Delete`.
- Sortering op favoriet, gewicht en naam.
- Favoriet markeren via ster-icoon.
- Filter `Alleen favorieten`.
- Read-only relatiepaneel onderaan het scherm met:
  - gekoppelde `file_details`;
  - gekoppelde `artiesten_spelling` records;
  - hitlijsten waarin de artiest voorkomt.

### Database-migratie

Voor Sprint 6 is deze migratie nodig. Omdat de standaard ontwikkelomgeving PostgreSQL in Docker gebruikt, is `docker exec` de aanbevolen route:

```bash
# Pas de containernaam aan als jouw PostgreSQL-container anders heet.
ARTIST_DB_CONTAINER=my-postgresdb npm run db:migrate:sprint6
```

Of rechtstreeks vanaf de host:

```bash
docker exec -i my-postgresdb psql -U postgres -d musicdb < scripts/sql/20260519_artists_sprint6_favorites.sql
```

Controleer daarna het nieuwe veld:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "select column_name, data_type, column_default from information_schema.columns where table_name = 'artist' and column_name = 'ar_is_favorite';"
```

Een lokaal `psql "$DATABASE_URL" ...` commando is alleen geschikt wanneer `psql` lokaal geïnstalleerd is en direct bij de database kan.

### Sprint 6 tests

```bash
npm run test:sprint6
npm run test:unit
```

Na dependency-installatie kan de volledige set worden gedraaid:

```bash
npm run install:all
npm run test:all
```

## ART-015A — Artiesten ontdubbelen / samenvoegen

De Artiesten-app bevat nu ontwerpdocumentatie voor ART-015A: het veilig ontdubbelen en samenvoegen van artiesten.

Documentatie:

- `docs/ART_015A_Artiesten_Ontdubbelen_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_015A_Testcases_en_Runbook.md`

Belangrijkste uitgangspunten:

- fuzzy matching helpt alleen bij het vinden van mogelijke dubbele artiesten;
- fuzzy matching voert nooit automatisch een merge uit;
- de gebruiker kiest altijd zelf de redundante en vervangende artiest;
- de merge gebruikt altijd impactscan, conflictcontrole, expliciet akkoord, transactie en audit/history;
- zowel een geïntegreerde Artiesten-app variant als een periodieke onderhoudsvariant met staging zijn uitgewerkt.

Test voor deze ontwerpsprint:

```bash
npm run test:art015a
```

## ART-015B — Artiesten ontdubbelen: duplicate search en impactscan

De Artiesten-app ondersteunt nu een eerste read-only stap voor artiesten ontdubbelen:

1. Selecteer een artiest in de hoofdtafel.
2. Het relatiepaneel verschijnt onderaan.
3. Klik op **Zoek mogelijke dubbelen**.
4. Beoordeel fuzzy kandidaten met score en matchreden.
5. Open een impactscan met **Maak kandidaat leidend** of **Maak deze artiest leidend**.

Belangrijk: ART-015B voert nog geen merge uit. Fuzzy matching is alleen bedoeld voor kandidaatdetectie. De echte samenvoeging met transactie en audit volgt in ART-015C.

Voor deze sprint is geen extra SQL-migratie nodig.

Testen:

```bash
npm run test:art015b
npm run test:unit
```

## ART-015C — Artiesten merge ontwerp

ART-015C is functioneel en technisch uitgewerkt in:

- `docs/ART_015C_Artiesten_Merge_Transactie_Audit_Alerts_Ontwerp.md`
- `docs/ART_015C_Testcases_en_Runbook.md`

Belangrijkste ontwerpbesluit: een artist merge wordt uitgevoerd als één database-transactie. Alles lukt, of niets lukt. De frontend roept later één backend-endpoint aan; de backend voert alle updates server-side uit binnen één transactie.

De merge-scope v1 is:

- `file_details.fd_artist_key` en `file_details.fd_correct_artist`
- `artiesten_spelling.as_artist_key`
- `hitlijsten.ar_artist_key`
- `staging_hitlijsten.hl_artist_key`
- `import_scan_items.fd_artist_key`
- reset/invalidate van `file_details_version_group_validations`
- `artist` markeren als merged/deleted
- `artist_merge_history`
- `admin_audit_log`
- `alerts` voor Shellstarter alerting

### ART-015C migratievoorstel

Het migratievoorstel staat in:

```bash
scripts/sql/20260525_art015c_artist_merge_design.sql
```

Docker PostgreSQL patroon:

```bash
ARTIST_DB_CONTAINER=my-postgresdb \
ARTIST_DB_USER=postgres \
ARTIST_DB_NAME=musicdb \
npm run db:migrate:art015c
```

Let op: dit is een ontwerp-/startermigratie voor de volgende code-sprint. FK-hardening staat bewust als voorstel/commentaar en moet pas worden gevalideerd na orphan-checks.

## Legacy env sample cleanup

Vanaf deze release is alleen `.env.example` officieel. Als je een ZIP over een bestaande directory uitpakt, verwijder dan oude samplebestanden:

```bash
npm run env:cleanup-legacy
cp .env.example .env
```

## ART-015C-1 artist merge uitvoeren

Na ART-015B kan een gebruiker vanuit de impactscan een merge transactioneel uitvoeren.

Voorwaarden:

```bash
npm run db:migrate:art015c
```

De UI vraagt verplicht:

- reden/notitie;
- expliciete bevestiging dat de impactscan is gecontroleerd.

De backend voert de merge uit als één transactie. Bij succes worden `artist_merge_history`, `admin_audit_log` en een Shellstarter-alert in `alerts` geschreven.


### ART-015C-2 merge-richting

De ART-015C mergeknoppen gebruiken duidelijke leidende-artiest labels:

- **Maak kandidaat leidend**: de kandidaat blijft bestaan als canonical/vervangende artiest; de huidige geselecteerde artiest wordt vervangen.
- **Maak deze artiest leidend**: de huidige geselecteerde artiest blijft bestaan als canonical/vervangende artiest; de kandidaat wordt vervangen.

Bij uitpakken over een bestaande directory kan legacy env-rommel worden verwijderd met:

```bash
npm run env:cleanup-legacy
```

### ART-015C-2-Fix-1 — Favorieteniconen

De artiestenlijst toont de favorietstatus met Bootstrap Icons-compatible classes:

- favoriet: `<i class="bi bi-star-fill" aria-hidden="true"></i>`
- niet favoriet: `<i class="bi bi-star" aria-hidden="true"></i>`

De knop heeft ook toegankelijke `aria-label`/`title`-teksten. De CSS bevat een fallback zodat de iconen zichtbaar zijn zonder icon-fontbestanden in de release-ZIP.

## ART-015C-3 — Mergehistorie

De Artiesten-app toont na ART-015C-3 samengevoegde artiesten en mergehistorie.

In de artiestenlijst kan gefilterd worden op:

- Actieve artiesten;
- Inclusief samengevoegde artiesten;
- Alleen samengevoegde artiesten.

Samengevoegde artiesten krijgen de badge **Samengevoegd** en tonen naar welke leidende artiest zij verwijzen. In het relatiepaneel staat een read-only kaart **Mergehistorie**. Voor samengevoegde artiesten is ontdubbelen uitgeschakeld; gebruik **Open leidende artiest** voor verdere beheeracties.

Test:

```bash
npm run test:art015c3
```


## ART-015C-3-Fix-1 duplicate-state reset

Als een gebruiker mogelijke dubbelen zoekt en daarna teruggaat naar de artiestenlijst of een andere artiest selecteert, wordt de duplicate-/impactscancontext automatisch leeggemaakt. Hierdoor blijven oude kandidaten, impactscans en mergevelden niet zichtbaar bij een andere geselecteerde artiest.

## ART-015C merge logging

Voor diagnose van artist merges kan het logniveau worden verhoogd:

```env
LOG_LEVEL=debug
```

Bij een technische fout tijdens `Merge uitvoeren` wordt de transactie teruggedraaid. De API geeft een veilige melding terug met `mergeStep`; de serverlog bevat de corresponderende `artist_merge.<step>` regels.


### ART-015C-3-Fix-3 — Mergecontrole

Na een artist merge toont de app nu expliciet de betrokken artist keys:

- redundant artist key + naam;
- leidende/replacement artist key + naam;
- merge-id;
- affected counts.

Ook de kaart **Mergehistorie** in het relatiepaneel toont deze keys, zodat controlequeries gericht uitgevoerd kunnen worden.

### ART-015C-3-Fix-4 — Mergehistorie leesbaarheid

De merge-history tabel heeft extra onderruimte voor horizontaal scrollen en toont impactdetails als compacte chips, zodat de inhoud ook bij langere namen en meerdere affected counts leesbaar blijft.

## ART-015D — Periodieke duplicate scanner

De Artiesten-app is uitgebreid met ontwerpdocumentatie voor een periodieke onderhoudsvariant voor artiest-ontdubbeling.

Kernprincipe:

```text
Python duplicate scanner
→ artist_duplicate_candidates staging
→ reviewqueue in Artiesten-app
→ bestaande impactscan
→ bestaande transactionele merge-service
```

De scanner voert zelf nooit een merge uit. De daadwerkelijke merge blijft via de bestaande ART-015C-service lopen.

Documentatie:

- `docs/ART_015D_Periodieke_Duplicate_Scanner_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_015D_Testcases_en_Runbook.md`

Validatie:

```bash
npm run test:art015d
```

## ART-015D-1 — Periodieke duplicate scanner basis

ART-015D-1 voegt de onderhoudsvariant voor mogelijke dubbele artiesten toe.

### Migratie

Omdat PostgreSQL in Docker draait:

```bash
npm run db:migrate:art015d1
```

Dit maakt de stagingtabellen aan:

- `artist_duplicate_scan_runs`
- `artist_duplicate_candidates`

### Scanner dry-run

Voer eerst een dry-run uit:

```bash
npm run scan:duplicates -- --dry-run --verbose
```

Dry-run schrijft niets naar de database en voert nooit een merge uit.

### Scanner echte run

```bash
npm run scan:duplicates
```

Optioneel met aangepaste drempel:

```bash
ARTIST_DUPLICATE_MIN_SCORE=88 npm run scan:duplicates
```

### Belangrijk

De scanner voert nooit automatisch een merge uit. Hij zet alleen mogelijke dubbele artiesten klaar in de reviewtabellen. De daadwerkelijke merge blijft verlopen via de bestaande impactscan en transactionele ART-015C mergeflow.

### Tests

```bash
npm run test:art015d1
npm run test:art015d
```

### ART-015D-2A — Duplicate scanner rerun handling

Na ART-015D-1 moet de rerun-hardening migratie worden uitgevoerd:

```bash
npm run db:migrate:art015d2a
```

Daarna kan de scanner veilig herhaald worden:

```bash
npm run scan:duplicates
npm run scan:duplicates
```

Bij herhaalde runs worden bestaande open candidate-paren bijgewerkt via `last_seen_at`, `last_seen_scan_run_id` en `times_seen`. Afgehandelde paren met `not_duplicate`, `ignored` of `merged` worden niet opnieuw als nieuwe werkvoorraad aangeboden.

### ART-015D-2A-Fix-1: scanner en grote batches

De duplicate scanner voert gegenereerde SQL via `psql` stdin uit. Hierdoor kan `npm run scan:duplicates` grotere candidate batches verwerken zonder de fout `argument list too long`.

```bash
npm run test:art015d2a:fix1
npm run scan:duplicates
```

### ART-015D-2A-Fix-2 scanner timestamp fix

Als `npm run scan:duplicates` faalt op `artist_duplicate_candidates.first_seen_at`, gebruik dan de release met ART-015D-2A-Fix-2. Deze vult `first_seen_at` en `last_seen_at` expliciet bij nieuwe duplicate candidates. Er is geen extra SQL-migratie nodig.
