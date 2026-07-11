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

## ART-015D-2B Duplicate reviewqueue

Na het draaien van de duplicate scanner kan de werkvoorraad in de Artiesten-app worden bekeken via **Duplicate reviewqueue**. De queue toont candidates uit `artist_duplicate_candidates`, ondersteunt filters en laat de gebruiker per candidate kiezen voor beoordelen, geen dubbel, negeren of merge via de bestaande impactscan.

De reviewqueue voert zelf geen merge-logica uit. Merge blijft lopen via de ART-015C transactionele merge-service.

## ART-015D-3 — Scanner scheduling, alerts en operationele hardening

ART-015D-3 werkt de operationele kant van de duplicate scanner uit.

Belangrijkste gebruik:

```bash
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
```

Voor lokale volledige start/validatie is `startapp.sh` toegevoegd:

```bash
./startapp.sh
```

Het script voert achtereenvolgens `npm run install:all`, `npm run build`, `npm run test:all` en `npm run dev` uit en schrijft per stap timestamped logs naar `logs/`.

Scheduling is functioneel/technisch uitgewerkt voor handmatig starten, crontab en macOS launchd. Shellstarter-alerts worden gebruikt voor scanresultaten en fouten. Mail is functioneel voorbereid, maar nog niet hard gekoppeld zolang het Shellstarter-mailcontract niet definitief is.

Zie:

- `docs/ART_015D_3_Scheduling_Alerts_Operational_Hardening.md`
- `docs/ART_015D_3_Testcases_en_Runbook.md`

## ART-015D-3A — Scanner alert hardening

De duplicate scanner ondersteunt nu concrete Shellstarter-alerting. Bij echte runs schrijft de scanner standaard alleen een alert als er nieuwe of bijgewerkte open duplicate candidates zijn. Bij een scanfout nadat een scan-run is aangemaakt, schrijft de scanner een `danger` alert. Alerting is configureerbaar via `ARTIST_DUPLICATE_ALERT_ENABLED` en `ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD`. Gebruik `--no-alert` voor onderhouds- of testscenario's.

## ART-015D-3B — Periodieke duplicate scanner schedulen

Voor het periodiek draaien van de duplicate scanner zijn scripts en een installatiehandleiding toegevoegd.

Install manual:

```text
docs/ART_015D_3B_Scheduler_Install_Manual.md
```

Handmatige wrapper-test:

```bash
./scripts/scheduled-duplicate-scan.sh --dry-run --verbose --no-alert
```

Cron installeren, standaard wekelijks zondag 09:00:

```bash
npm run schedule:duplicates:cron:install
```

Cron verwijderen:

```bash
npm run schedule:duplicates:cron:uninstall
```

macOS launchd installeren, standaard wekelijks zondag 09:00:

```bash
npm run schedule:duplicates:launchd:install
```

macOS launchd verwijderen:

```bash
npm run schedule:duplicates:launchd:uninstall
```

De scheduler scripts voeren geen merge uit. Ze draaien alleen de scanner, waarna candidates via de Duplicate reviewqueue afgehandeld worden.

## Env-template herstellen

Als je een nieuwe release over een bestaande projectdirectory uitpakt, kan `.env.example` lokaal nog oude inhoud bevatten. Herstel de officiële voorbeeldconfiguratie met:

```bash
npm run env:refresh-example
```

Daarna kun je de alert-hardeningtest opnieuw draaien:

```bash
npm run test:art015d3a
```


### ART-015D-3B-Fix-2

De scheduler-test is aangepast zodat `npm run test:art015d3b` meerdere ART-015D-3B testbestanden mag draaien. Controleer bij lokale problemen dat `.env.example` de duplicate scanner- en alertvariabelen bevat.

## ART-015D-3C — Stale reviewqueue signalering

Duplicate candidates die te lang openstaan worden nu zichtbaar gesignaleerd in de Duplicate reviewqueue. Configureer dit via `.env`:

```env
ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14
ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true
ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1
```

De scanner neemt open/stale reviewqueue-statistieken mee in Shellstarter-alerts.

## ART-015D-3C-Fix-1 — Signalering en env-configuratie

De duplicate scanner gebruikt deze configuratie in `.env.example`:

```env
ARTIST_DUPLICATE_MIN_SCORE=82
ARTIST_DUPLICATE_MAX_CANDIDATES=500
ARTIST_DUPLICATE_ALERT_ENABLED=true
ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25
ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14
ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true
ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1
```

Signalering werkt op dit moment via Shellstarter-alerts in `public.alerts` en via badges/waarschuwingen in de Duplicate reviewqueue. Echte mail is nog niet technisch geïmplementeerd; dat blijft een vervolgitem voor ART-015D-3D.

## ART-015D-3D — Shellstarter mailcontract

ART-015D-3D werkt het mailcontract voor duplicate maintenance uit. De huidige implementatie schrijft Shellstarter-alerts via `public.alerts` en toont stale reviewqueue-signalen in de UI. Echte mail wordt nog niet door de Artiesten-app verstuurd.

Belangrijkste besluit:

```text
scanner/merge event
→ audit/history
→ public.alerts
→ optionele mail-intentie/outbox
→ Shellstarter mailprocessor
```

De Artiesten-app verstuurt geen directe SMTP/Outlook-mail. De voorkeursrichting is een notification outbox waarbij Shellstarter de daadwerkelijke mailverzending, ontvangers en retry afhandelt.

Controleer de contractdocumentatie met:

```bash
npm run test:art015d3d
```

Er is geen nieuwe SQL-migratie voor ART-015D-3D.

## ART-012 — Discogs artist enrichment ontwerp

ART-012 beschrijft hoe de Artiesten-app later Discogs artist-data gaat gebruiken voor verrijking van lokale artiestgegevens.

Belangrijkste ontwerpbesluiten:

- `artist.ar_artist_key` blijft altijd de lokale primaire sleutel.
- De Discogs artist ID vervangt nooit de lokale artist key.
- Discogs artist ID wordt alleen gebruikt als externe lookup key en bronreferentie.
- Lokale artistvelden worden niet automatisch overschreven.
- Discogs-data wordt eerst opgehaald, getoond en beoordeeld; daarna kan de gebruiker expliciet kiezen welke verrijking lokaal wordt toegepast.
- Voorkeursrichting voor opslag is een aparte externe referentie/cache, niet alle Discogs-data direct als kolommen op `artist`.

Voorgestelde Discogs-configuratie voor latere implementatie:

```env
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_REQUEST_TIMEOUT_MS=10000
DISCOGS_CACHE_TTL_SECONDS=86400
```

Ontwerpdocumenten:

- `docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_012_Testcases_en_Runbook.md`

Test:

```bash
npm run test:art012
```


ART-012A-Fix-1: Discogs artist images worden ontwerptechnisch opgeslagen als metadata/URL/cache-referentie, niet als binaire data in PostgreSQL. Het basispad voor lokale image-cache wordt via `ARTIST_IMAGE_CACHE_DIR` in `.env` geconfigureerd; databasepaden blijven relatief.

## ART-012B-Prep — Discogs configuratiestandaard

Voor Discogs gebruikt de Artiesten-app de gedeelde Musicapp-standaard:

```env
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
```

Legacy-namen uit andere apps zoals `DISCOGS_API_TOKEN`, `DISCOGS_API_BASE_URL` en `DISCOGS_ENABLED` worden alleen nog als fallback/migratiepad beschouwd en staan niet als standaard in `.env.example`.

De configuratie wordt centraal gelezen via `config/discogsConfig.js`. Als `DISCOGS_USER_TOKEN` ontbreekt, moet Discogs-functionaliteit in de UI disabled of duidelijk gemarkeerd worden als niet geconfigureerd.

## ART-012B — Discogs artist search/detail basisimplementatie

ART-012B voegt de eerste concrete Discogs artist enrichment functionaliteit toe. De implementatie is bewust inspect-only: Discogs-data wordt gezocht en getoond, maar nog niet gekoppeld of toegepast op lokale artiestrecords.

Nieuwe migratie:

```bash
npm run db:migrate:art012b
```

Nieuwe backend endpoints:

```text
GET /api/artists/discogs/config
GET /api/artists/:id/discogs/search
GET /api/artists/discogs/:discogsArtistId
```

Nieuwe UI:

- kaart **Discogs artist enrichment** in het artiest-relatiepaneel;
- knop **Zoek in Discogs**;
- resultatenlijst met Discogs artist ID en Discogs-link;
- detailinspectie met real name/profile/aliases/name variations/groups/members/images;
- disabled/configuratiemelding wanneer `DISCOGS_USER_TOKEN` ontbreekt.

Test:

```bash
npm run test:art012b
npm run test:art012
```

## ART-012B-Fix-1 — Discogs resultatenpaneel

Het Discogs artist enrichment-paneel gebruikt vanaf deze fix de volledige breedte van het relatiegrid. De resultaatstabel heeft een scroll-safe wrapper en de kolom **Actie** blijft volledig zichtbaar zodat de knop **Detail** goed klikbaar blijft.

De env-template kan worden hersteld met:

```bash
npm run env:refresh-example
```

Daarmee worden de canonieke Discogs-, image-cache- en duplicate-scanner variabelen opnieuw in `.env.example` gezet. Een echte Discogs-token hoort alleen in `.env`, niet in `.env.example`.

## ART-012C — Discogs artist koppelen

Na `npm run db:migrate:art012b` en correcte Discogs-configuratie kan een gebruiker in het relatiepaneel:

1. **Zoek in Discogs** kiezen;
2. een resultaat met **Detail** inspecteren;
3. **Koppel Discogs artist** kiezen.

De koppeling schrijft een externe referentie/cachemetadata, maar wijzigt geen lokale artist key en overschrijft de lokale artistnaam niet.

Automatische test:

```bash
npm run test:art012c
```

### ART-012C-Fix-1 Discogs-koppeling controleren

Na **Koppel Discogs artist** hoort de app records te schrijven naar `artist_external_reference`, `artist_enrichment_cache` en eventueel `artist_external_image`. De lokale artist key blijft leidend. Gestructureerde geboorte-/overlijdensdatums uit Discogs vullen alleen lege lokale datumvelden; vrije profieltekst wordt niet automatisch geparsed.


## ART-012C-Fix-2 — Discogs controlequeries

Bij controle van Discogs-koppelingen:

- `artist_external_reference.synced_at` = moment van koppeling/sync van de externe referentie.
- `artist_enrichment_cache.fetched_at` = moment waarop Discogs-brondata is opgehaald/gecached.
- `artist_enrichment_cache` heeft geen `synced_at` kolom.

Na **Koppel Discogs artist** worden `artist_external_reference`, `artist_enrichment_cache` en eventueel `artist_external_image` gevuld of bijgewerkt.

### ART-012C-Fix-3 — Discogs naamvoorstel en artiestenspelling

Discogs artist names worden alleen als voorstel gebruikt. De actie **Koppel Discogs artist** wijzigt de lokale canonical artist name niet.

Als een Discogs-naam later als nieuwe canonical naam moet worden gebruikt, dan moet dat via een aparte spelling-aware flow met `artiesten_spelling`, inclusief conflictcontrole, bevestiging en audit.


## ART-012D — Discogs naamvoorstellen en artiestenspelling

ART-012D is functioneel/technisch uitgewerkt als volgende stap na Discogs-koppeling. De lokale `artist.ar_artist_key` en `artist.ar_artist_name` blijven leidend. Discogs artist names worden alleen als voorstellen behandeld.

Belangrijke regel:

```text
Koppel Discogs artist wijzigt de lokale artistnaam niet.
Canonical naamwijzigingen lopen later via een spelling-aware flow met artiesten_spelling.
```

Documentatie:

- `docs/ART_012D_Discogs_Naamvoorstellen_Artiestenspelling_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_012D_Testcases_en_Runbook.md`

Test:

```bash
npm run test:art012d
```

### ART-012D-1 — Discogs spellingvoorstellen

Na het koppelen van een Discogs artist kan de gebruiker in het relatiepaneel **Toon spellingvoorstellen** gebruiken. De app toont dan read-only voorstellen uit Discogs artist name, real name, aliases en name variations.

Dit endpoint voert geen mutaties uit:

```text
GET /api/artists/:id/discogs/spelling-proposals
```

Voor toepassen op `artiesten_spelling` volgt een latere sprint.

## ART-012D-2 — Discogs naam toevoegen als alternatieve spelling

Na het koppelen van een Discogs artist kun je in **Discogs naamvoorstellen** beschikbare namen toevoegen via **Voeg toe als spelling**. Dit schrijft alleen naar `artiesten_spelling`; de lokale canonical artist name (`artist.ar_artist_name`) wordt niet gewijzigd.

Test:

```bash
npm run test:art012d2
```


## ART-012D-3 — Discogs naam canonical maken via spelling-aware flow

ART-012D-3 is een ontwerp-/documentatiesprint. Er wordt nog geen canonical-rename code gebouwd. De sprint borgt dat een Discogs artist name alleen via een expliciete spelling-aware flow canonical mag worden gemaakt.

Belangrijk:

- **Koppel Discogs artist** wijzigt de lokale artistnaam niet.
- Oude canonical naam blijft als alternatieve spelling behouden.
- Nieuwe canonical naam wordt geborgd in `artiesten_spelling`.
- Conflicten met bestaande artists/spellingen blokkeren de actie.
- Canonical rename moet transactioneel en auditbaar zijn.

Documentatie:

- `docs/ART_012D_3_Canonical_Rename_Spelling_Aware_Ontwerp.md`
- `docs/ART_012D_3_Testcases_en_Runbook.md`

Test:

```bash
npm run test:art012d3
```


## ART-012D-2-Fix-1 — Actieknop voor beschikbare spellingvoorstellen

Bij Discogs naamvoorstellen moet de actie **Voeg toe als spelling** zichtbaar zijn voor voorstellen met `available_discogs_name` en `available_alternative_spelling`. De knop schrijft alleen naar `artiesten_spelling`; `artist.ar_artist_name` blijft ongewijzigd. Niet-toepasbare voorstellen tonen een duidelijke niet-toepasbaar-status.

## ART-012D-3A — Discogs canonical rename preview

De Artiesten-app ondersteunt nu een read-only preview voor het canonical maken van een Discogs-naam. Gebruik in **Discogs naamvoorstellen** de knop **Preview canonical**.

Deze actie voert geen databasewijzigingen uit. De preview toont alleen of een toekomstige spelling-aware canonical rename mogelijk lijkt en welke conflicten moeten worden opgelost.

Test:

```bash
npm run test:art012d3a
```


## ART-012D-3A-Fix-1 — Discogs spellingvoorstellen UX

De Discogs-flow is verduidelijkt. Als er nog geen Discogs artist gekoppeld is, toont het relatiepaneel dat eerst **Koppel Discogs artist** moet worden uitgevoerd voordat spellingvoorstellen beschikbaar zijn. Na koppeling kan de gebruiker via **Toon spellingvoorstellen** de Discogs-namen beoordelen. **Voeg toe als spelling** wijzigt alleen `artiesten_spelling`; **Preview canonical** toont alleen impact en voert geen wijziging uit.

Functionele flow:

```text
Zoek in Discogs → Detail bekijken → Koppel Discogs artist → Toon spellingvoorstellen → Voeg toe als spelling → Preview canonical
```

## ART-012D-3B — Discogs canonical rename uitvoeren

Na **Preview canonical** kan de gebruiker bij een niet-geblokkeerd voorstel kiezen voor **Maak canonical**. Deze actie voert een spelling-aware transactie uit:

- oude canonical naam blijft behouden als alternatieve spelling;
- nieuwe canonical naam wordt geborgd in `artiesten_spelling`;
- `artist.ar_artist_name` wordt pas na expliciete bevestiging aangepast;
- `file_details.fd_correct_artist` wordt niet automatisch herschreven.

Test:

```bash
npm run test:art012d3b
```

## ART-012E-1 — Discogs linked icon en artist type

Deze release voegt de eerste kleine stap voor Discogs artist enrichment toe:

- Discogs gekoppelde artiesten tonen in de artiestenlijst het icoon `<i class="bi bi-link"></i>`.
- Artist type is toegevoegd aan `artist.ar_artist_type`.
- Artist type waarden: `unknown`, `person`, `duo`, `trio`, `group`, `band`, `alias`, `project`.

Migratie:

```bash
npm run db:migrate:art012e1
```

Test:

```bash
npm run test:art012e1
```

## ART-012E-2 — Discogs profielfoto

ART-012E-2 laat gebruikers één van de uit Discogs opgehaalde artist images kiezen als primaire profielfoto.

Migratie:

```bash
mkdir -p logs && npm run db:migrate:art012e2 2>&1 | tee "logs/db-migrate-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

Gerichte test:

```bash
mkdir -p logs && npm run test:art012e2 2>&1 | tee "logs/test-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

De gekozen profielfoto wordt opgeslagen via `artist_external_image.is_primary`. Er worden geen binaire images in PostgreSQL opgeslagen.

### ART-012E-3 — Discogs enrichment proposals preview

ART-012E-3 voegt read-only Discogs-verrijkingsvoorstellen toe. Migreer met:

```bash
mkdir -p logs && npm run db:migrate:art012e3 2>&1 | tee "logs/db-migrate-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

Test met:

```bash
mkdir -p logs && npm run test:art012e3 2>&1 | tee "logs/test-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

### ART-012D-4 Discogs naamvoorstellen reviewqueue

Migratie en tests:

```bash
mkdir -p logs && npm run db:migrate:art012d4 2>&1 | tee "logs/db-migrate-art012d4-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:art012d4 2>&1 | tee "logs/test-art012d4-$(date +%Y%m%d-%H%M%S).log"
```

## ART-013A — Artist → musician sync

ART-013A voegt one-way synchronisatie toe van `artist` naar bestaande gekoppelde `musician` records voor persoonsartiesten.

Migratie:

```bash
mkdir -p logs && npm run db:migrate:art013a 2>&1 | tee "logs/db-migrate-art013a-$(date +%Y%m%d-%H%M%S).log"
```

Test:

```bash
mkdir -p logs && npm run test:art013a 2>&1 | tee "logs/test-art013a-$(date +%Y%m%d-%H%M%S).log"
```

De synchronisatie is nooit bidirectioneel en maakt geen musician-records automatisch aan.

## ART-013A-1 — Musician backfill vanuit person artists

ART-013A synchroniseert bestaande gekoppelde musicians bij een update van een `person` artist. Als de `musician`-tabel leeg is, kan ART-013A-1 worden gebruikt om ontbrekende musician-records idempotent aan te maken vanuit artists met `ar_artist_type = 'person'`.

Migratie:

```bash
mkdir -p logs && npm run db:migrate:art013a1 2>&1 | tee "logs/db-migrate-art013a1-$(date +%Y%m%d-%H%M%S).log"
```

Preview:

```bash
mkdir -p logs && npm run musician:backfill:preview 2>&1 | tee "logs/musician-backfill-preview-$(date +%Y%m%d-%H%M%S).log"
```

Uitvoeren:

```bash
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-$(date +%Y%m%d-%H%M%S).log"
```

Tests:

```bash
mkdir -p logs && npm run test:art013a1 2>&1 | tee "logs/test-art013a1-$(date +%Y%m%d-%H%M%S).log"
```

---

## Geplande volgende sprint: ART-013A-2

ART-013A-2 is functioneel en technisch uitgewerkt als databasevalidatie- en hardeningsprint voor de artist→musician-keten.

Geplande commando's na implementatie:

```bash
mkdir -p logs && npm run musician:preflight 2>&1 | tee "logs/musician-preflight-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run musician:verify 2>&1 | tee "logs/musician-verify-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art013a2 2>&1 | tee "logs/test-art013a2-$(date +%Y%m%d-%H%M%S).log"
```

Deze scripts zijn in deze documentatiesprint nog niet geïmplementeerd. Zie het functioneel/technisch ontwerp en het test-runbook in `docs/`.


## ART-013A-2 — Databasevalidatie en backfill-hardening (2026-07-11)

Status: **geïmplementeerd; lokale database-acceptatie open**.

Opgeleverd: centrale preflight, geharde migratie, veilige preview/execute, verificatie, transactionele database-integratietest, contracttests en bijgewerkt runbook. De eerstvolgende afgesproken volgorde na acceptatie blijft: ART-UI-Polish, ART-012D-4 validatie/fixes, ART-013B, lokale biografie en ART-014.
