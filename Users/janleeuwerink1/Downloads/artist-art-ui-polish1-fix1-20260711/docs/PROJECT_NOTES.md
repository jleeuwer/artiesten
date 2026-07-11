# Artiesten-app Project Notes

Laatste bijgewerkt: 2026-07-11

## Doel

De Artiesten-app beheert canonical artiestgegevens uit de Musicapp-database. De app moet zelfstandig kunnen draaien en daarnaast netjes embedded kunnen functioneren binnen Shellstarter.

## Architectuur

- Backend: Node.js + Express.
- Database: PostgreSQL via `pg` en `DATABASE_URL`.
- Frontend: React + Vite + React Bootstrap.
- Build-output frontend: `public/app`.
- API-prefix: `/api`.
- Artist endpoints: `/api/artists`.
- Health endpoint: `/api/health`.
- DB-health endpoint: `/api/health/db`.

## Lokale poorten

- Voorkeurspoort backend/productie: `3012`.
- Vite devserver: standaard `5173`, tenzij Vite anders kiest.

## Databaseconfiguratie

De app leest databaseconfiguratie uit `DATABASE_URL`.

Voorbeeld host-machine naar Docker PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/musicdb
```

Voorbeeld container-to-container:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/musicdb
```

## Env-bestanden

- `.env` is lokaal en mag niet in release-ZIP's.
- `.env.example` is de enige officiële veilige voorbeeldconfiguratie en moet worden meegeleverd.
- `.sample.env` en `.env.sample` worden niet meer gebruikt.
- Nieuwe env-variabelen moeten altijd in `.env.example` en in de README worden gedocumenteerd.

## Shellstarter embedded contract

De Artiesten-app ondersteunt embedded gedrag via client-side shell context.

Belangrijke Vite-variabelen:

```env
VITE_ARTIST_APP_ENABLE_SHELL_MODE=true
VITE_ARTIST_APP_ALLOW_THEME_QUERY=true
VITE_ARTIST_APP_DEFAULT_THEME=slate
```

Belangrijke queryparameters:

- `shellEmbed=1`
- `embeddedInShell=1`
- `shellTheme=<themeKey>`
- `shellOrigin=<origin>`
- `shellHost=<host>`

Belangrijke postMessage events vanuit/naar Shellstarter:

- theme contract ontvangen via shell bridge;
- embedded ready event;
- embedded height event.

## Delete-regels

- Soft delete verplaatst een artiest naar de trash-flow.
- Restore haalt een artiest terug uit trash.
- Hard delete mag niet als de artiest nog door `file_details` wordt gebruikt.
- Hard delete verwijdert eerst gekoppelde `artiesten_spelling` records en daarna de artiest.

## Teststrategie

Root tests gebruiken Node's ingebouwde test runner. Belangrijke scripts:

```bash
npm run test:unit
npm run test:sprint4
npm run test:packaging
npm run test:all
```

`npm run test:all` vereist geïnstalleerde root- en client-dependencies.

## Release-afspraken

Release-ZIP's bevatten:

- broncode;
- tests;
- scripts;
- documentatie;
- `.env.example`;
- eventueel actuele `public/app` build-output.

Release-ZIP's bevatten niet:

- `.env`;
- `.git`;
- `node_modules`;
- `client/node_modules`;
- logs;
- `.DS_Store`;
- `__MACOSX`;
- tijdelijke ZIP/TAR-bestanden.

Gebruik voor lokale releasevoorbereiding:

```bash
npm run package:zip
```


## Sprint 6 ontwerpbesluiten

Vanaf Sprint 6 worden requirements per sprint eerst in dialoog aangescherpt voordat code wordt gebouwd. Dit is vooral belangrijk voor datamodelgevoelige onderwerpen zoals artiestrelaties, albums, Discogs en ontdubbelen.

### Artiestgewicht

De eerste functionele definitie van artiestgewicht is:

```text
artist_weight = count(distinct lower(trim(fd_tag_title))) where fd_artist_key = artist.ar_artist_key and (fd_action is null or lower(fd_action) <> 'delete')
```

Aanvullende meetwaarden kunnen zijn:

- totaal aantal `file_details`;
- aantal keep-records;
- aantal unieke `fd_hitlijst` waarden;
- aantal gekoppelde artiestenspellingen.

### Favorieten

Favorieten zijn voorlopig ontworpen als algemene markering op artist-niveau. Mogelijke implementatie:

```sql
ALTER TABLE artist
ADD COLUMN IF NOT EXISTS ar_is_favorite boolean NOT NULL DEFAULT false;
```

Als Shellstarter later persoonlijke favorieten per gebruiker moet ondersteunen, kan dit worden vervangen of uitgebreid met een aparte favorietentabel.

### Relatiepaneel

Het beoogde read-only relatiepaneel onderaan de app toont voor een geselecteerde artiest:

- gekoppelde `file_details`;
- gekoppelde `artiesten_spelling` records;
- hitlijsten waarin de artiest voorkomt.

Het ontwerp moet later uitbreidbaar zijn met:

- Albums;
- Discogs;
- Relaties tussen muzikanten, artiesten en bands;
- Merge-impact.

### Albums

Albums worden nog niet gebouwd in Sprint 6. Wel moet het ontwerp voorkomen dat albums later moeilijk kunnen worden toegevoegd. Albums worden apart uitgewerkt in ART-014.

### Artiesten ontdubbelen / samenvoegen

Artist merge is een aparte flow. De kern is:

1. redundante artiest kiezen;
2. vervangende artiest kiezen;
3. alle databaseverwijzingen naar redundante artist_key zoeken;
4. impact tonen;
5. na akkoord transactiegewijs vervangen;
6. audit/history vastleggen.

Geen automatische hard delete van de redundante artiest zonder expliciet ontwerpbesluit.

## Sprint 6 implementatie — relatie-inzicht, gewicht en favorieten

Datum: 2026-05-19

Deze sprint is omgezet van ontwerp naar concrete code. De implementatie blijft bewust beperkt tot read-only relatie-inzicht en lichte artist-list functionaliteit. Discogs artist enrichment, albums, muzikant/band-relaties en artist merge blijven vervolgitems.

### Geïmplementeerd

- Artiestgewicht op basis van aantal unieke titels in `file_details`, waarbij records met `fd_action = Delete` niet meetellen.
- Extra tellers in artiestenlijst:
  - `artist_weight`;
  - `hitlijst_count`;
  - `spelling_count`.
- Sortering:
  - favorieten eerst → gewicht → naam;
  - gewicht hoog-laag;
  - gewicht laag-hoog;
  - naam A-Z;
  - naam Z-A.
- Favoriet markeren/verwijderen via ster-icoon.
- Filter `Alleen favorieten`.
- Read-only relatiepaneel onderaan met drie kolommen:
  - `file_details` entries;
  - `artiesten_spelling` varianten;
  - hitlijsten waarin de artiest voorkomt.
- API-uitbreidingen:
  - `GET /api/artists/:id/relations`;
  - `PATCH /api/artists/:id/favorite`.
- Database-migratie:
  - `scripts/sql/20260519_artists_sprint6_favorites.sql`.
- Automatische contracttest:
  - `tests/sprint6Implementation.contract.test.mjs`.

### Ontwerpkeuze

Favorieten worden voorlopig algemeen opgeslagen op `artist.ar_is_favorite`. Als later gebruikersspecifieke favorieten nodig zijn, kan dit worden uitgebreid met een aparte favorietentabel gekoppeld aan Shellstarter-gebruikers.

### Niet geïmplementeerd in deze sprint

- Albums in `musicdb`.
- Discogs artist-data ophalen of opslaan.
- Muzikant/band/album-relaties.
- Artiesten ontdubbelen/samenvoegen.
- Editfunctionaliteit in het relatiepaneel.

## 2026-05-19 — Sprint 6 testfix: env samples en Docker migratie

- Bevinding opgelost waarbij `tests/packaging.contract.test.mjs` faalde door inconsistente env-template bestanden.
- `.env.example` bevat nu de enige officiële veilige voorbeeldconfiguratie, inclusief `PORT=3012`, `DATABASE_URL`, CORS, Shellstarter/Vite variabelen en Docker migratiehulpvariabelen.
- Docker PostgreSQL is de primaire migratieroute voor Sprint 6. Het lokale `psql "$DATABASE_URL"` voorbeeld is vervangen door `npm run db:migrate:sprint6` en een expliciet `docker exec` voorbeeld.
- Nieuw script: `scripts/db-migrate-sprint6-docker.sh`, met timestamped logging naar `logs/`.

## 2026-05-19 — Sprint 6 Fix: unieke-titelgewicht en relatiepaneel UX

Gebruikerstest heeft twee aanscherpingen opgeleverd:

- Artiestgewicht telt voortaan unieke songtitels via `count(distinct lower(trim(fd_tag_title)))`, waarbij records met `fd_action = Delete` niet meetellen. Meerdere versies van dezelfde titel tellen dus één keer mee voor gewicht. Het totaal aantal niet-verwijderde `file_details` records blijft beschikbaar als `version_count`.
- Na selectie van een artiest wordt de focus/scroll naar het relatiepaneel onderaan verplaatst. Het paneel krijgt een duidelijke header en de knop `Terug naar artiestenlijst`.
- Het edit-scherm bevat nu compacte read-only infopanelen voor file details, artiestenspellingen en hitlijsten. Deze panelen zijn informatief; bewerken gebeurt via de betreffende app in Shellstarter.


## Sprint 6 fix-release: env-template standaardisatie

Besluit: de Artiesten-app gebruikt vanaf deze release alleen `.env.example` als officiële env-template.

- `.sample.env` en `.env.sample` worden niet meer meegeleverd.
- Tests controleren expliciet dat deze oude template-namen niet meer aanwezig zijn.
- Lokale configuratie blijft `.env` en blijft uitgesloten van release-ZIP's.
- Runbook-instructie is: `cp .env.example .env`.

## 2026-05-25 — ART-015A ontwerp: artiesten ontdubbelen / samenvoegen

ART-015A is uitgewerkt als functioneel en technisch ontwerp. De daadwerkelijke merge-code wordt nog niet gebouwd.

Besluiten en uitgangspunten:

- Fuzzy matching wordt wel meegenomen, geïnspireerd door de Tipparade loader-aanpak, maar uitsluitend als hulpmiddel om mogelijke dubbele artiesten te vinden.
- Fuzzy matching mag nooit automatisch een merge uitvoeren.
- De gebruiker blijft verantwoordelijk voor de definitieve keuze van redundante artiest en vervangende/canonical artiest.
- De mergeflow blijft centraal en gelijk, ongeacht of een kandidaat uit de interactieve Artiesten-app komt of uit een periodieke onderhoudsscan.

Twee varianten zijn ontworpen:

1. **Periodieke onderhoudsfunctie met staging**
   - Een Python scanner kan periodiek mogelijke dubbelen zoeken.
   - Kandidaten worden opgeslagen in staging-/reviewtabellen.
   - De Artiesten-app leest de kandidaten uit en laat de gebruiker acties nemen.

2. **Geïntegreerde ondersteuning in de Artiesten-app**
   - De gebruiker zoekt vanuit de app mogelijke dubbelen.
   - Fuzzy kandidaten worden getoond met matchscore en matchreden.
   - De gebruiker kan een impactscan openen.

Architectuurregel:

```text
candidate discovery → impactscan → conflictcontrole → expliciet akkoord → transactie → audit/history
```

Advies voor vervolg:

- Eerst ART-015B bouwen: interactieve duplicate search + read-only impactscan.
- Daarna ART-015C: daadwerkelijke merge-uitvoering met transactie en audit.
- Daarna ART-015D: periodieke Python onderhoudsscan met staging/reviewqueue.

Albums, Discogs artist-data en muzikant/band-relaties blijven expliciet in beeld zodat het mergeontwerp later niet te smal blijkt.

## 2026-05-25 — ART-015B implementatie: interactieve duplicate search en impactscan

- ART-015B is uitgewerkt als read-only implementatiesprint voor artiesten ontdubbelen.
- Fuzzy matching is geïmplementeerd als hulpmiddel voor kandidaatdetectie, niet als automatische merge.
- De Artiesten-app toont mogelijke dubbele artiesten vanuit het relatiepaneel van de geselecteerde artiest.
- De gebruiker kan twee impactrichtingen bekijken: geselecteerde artiest vervangen door kandidaat, of kandidaat vervangen door geselecteerde artiest.
- Nieuwe API's:
  - `GET /api/artists/:id/duplicate-candidates`
  - `GET /api/artists/merge/impact`
- De impactscan dekt nu minimaal `file_details.fd_artist_key` en `artiesten_spelling.as_artist_key`.
- ART-015C blijft nodig voor daadwerkelijke merge-uitvoering met transactie en audit/history.
- Geen nieuwe SQL-migratie nodig voor ART-015B.

## 2026-05-25 — ART-015C ontwerpbesluiten

- De artist merge wordt als één technische transactie ontworpen. Bij één fout volgt rollback en mogen er geen gedeeltelijke updates achterblijven.
- De aangeleverde schema-analyse laat zien dat de FK-query-output niet volledig is voor functionele impact. Naast formele FK's zijn `hitlijsten.ar_artist_key`, `staging_hitlijsten.hl_artist_key`, `import_scan_items.fd_artist_key` en `file_details_version_group_validations.fd_artist_key` functioneel relevant.
- ART-015C v1 neemt `file_details`, `artiesten_spelling`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items`, invalidatie van `file_details_version_group_validations`, `artist_merge_history`, `admin_audit_log` en `alerts` mee.
- `file_details.fd_correct_artist` moet na merge naar de replacement artist name worden gezet.
- Redundante artists worden niet hard deleted maar gemarkeerd als merged/deleted met `ar_merged_into_artist_key`, `ar_merged_at` en `ar_merge_note`.
- Shellstarter alerts worden in v1 via de bestaande `alerts` tabel voorbereid. Mail wordt later verder uitgewerkt.
- FK-hardening wordt gefaseerd voorgesteld met orphan-checks en `NOT VALID` constraints.
- Legacy env sample files worden via `npm run env:cleanup-legacy` opgeruimd. Alleen `.env.example` blijft officieel.

---

## ART-015C-1 implementatienotitie

De artist merge is geïmplementeerd als één transactionele backend-service. De frontend toont alleen de impactscan, vraagt reden + expliciete bevestiging, en roept daarna `POST /api/artists/merge/execute` aan.

Belangrijke ontwerpkeuze: de redundante artiest wordt niet hard deleted maar gemarkeerd met `ar_merged_into_artist_key`, `ar_merged_at` en `ar_merge_note`. Hierdoor blijft herleidbaar welke artiest is samengevoegd.

Shellstarter-integratie blijft los gekoppeld via de bestaande `alerts` tabel. Mail wordt nog niet direct aangemaakt.

## ART-015C-2 — UI hardening merge-richting

Besluit: de merge-richtingbuttons in ART-015B/ART-015C worden hernoemd om duidelijker te maken welke artiest leidend/canonical wordt.

- `Deze vervangen` is vervangen door **Maak kandidaat leidend**.
- `Kandidaat vervangen` is vervangen door **Maak deze artiest leidend**.

Functioneel blijft de merge hetzelfde. De nieuwe teksten leggen de nadruk op de artiest die blijft bestaan als canonical/vervangende artiest. De UI bevat daarnaast expliciete `title`- en `aria-label`-teksten.

Favorieten blijven visueel ondersteund met Bootstrap Icons:

- favoriet: `bi bi-star-fill`
- niet favoriet: `bi bi-star`

## ART-015C-2-Fix-1 — Favorieteniconen zichtbaar maken

Testbevinding: de afgesproken iconen `bi bi-star-fill` en `bi bi-star` waren niet zichtbaar in de artiestenlijst.

Oplossing:

- De favorietenknop rendert nu expliciet `<i class="bi bi-star-fill" aria-hidden="true"></i>` voor favoriete artiesten.
- De favorietenknop rendert nu expliciet `<i class="bi bi-star" aria-hidden="true"></i>` voor niet-favoriete artiesten.
- De knop gebruikt `aria-label` en `title` met de teksten `Verwijder uit favorieten` en `Markeer als favoriet`.
- `client/src/app.css` bevat een Bootstrap Icons-compatible fallback voor de star-glyphs, zodat de release geen icon-fontbestanden hoeft mee te leveren.
- `public/app` is opnieuw opgebouwd zodat de productiebuild de actuele frontend bevat.

## ART-015C-3 — Mergehistorie en samengevoegde artiesten

Besluit: na het transactioneel uitvoeren van artist merges moet de gebruiker de gevolgen kunnen terugzien in de Artiesten-app. Samengevoegde artiesten blijven historisch zichtbaar, maar worden standaard uit de actieve lijst gefilterd. Via `mergeStatus` kan de gebruiker ze alsnog tonen of apart bekijken.

Het relatiepaneel bevat nu een read-only kaart **Mergehistorie**. Samengevoegde artiesten tonen **Open leidende artiest**. Reguliere mutatieacties op samengevoegde artiesten worden bewust uitgeschakeld.


## ART-015C-3-Fix-1 — Duplicate state reset

Testbevinding: duplicate candidates bleven zichtbaar nadat de gebruiker terugging naar de artiestenlijst of een andere artiest selecteerde. Dit gaf de indruk dat oude kandidaten bij de nieuwe artiest hoorden.

Oplossing: `resetDuplicateWorkflowState()` toegevoegd en aangeroepen bij selectie van een andere artiest, bij leegmaken van selectie en bij **Terug naar artiestenlijst**. Geen databasewijziging nodig.

## ART-015C-3-Fix-2 — Merge SQL typing en structured logging

Testbevinding: bij `Merge uitvoeren` ontstond PostgreSQL-fout `could not determine data type of parameter $1`. De transactie werd niet uitgevoerd, wat de rollback-eis bevestigt, maar de foutdiagnose was onvoldoende.

Besluit/fix:

- merge SQL-parameters in history/audit/alert en gevoelige update-stappen krijgen expliciete casts;
- `LOG_LEVEL` wordt door de logger gerespecteerd;
- merge-service logt stapgericht met `artist_merge.<step>`;
- rollback-log bevat `failedStep`;
- API-response bij technische mergefout bevat veilige rollbackmelding en `mergeStep`;
- frontend toont de stapnaam in de foutmelding.


## 2026-05-26 — ART-015C-3-Fix-3

Testbevinding opgelost: mergehistorie en merge-resultaat moeten expliciet artist keys tonen. De UI toont nu `redundant_artist_key`, `replacement_artist_key`, merge-id en affected-count details, zodat controle via SQL en de relatiepanelen eenduidig is.

## ART-015C-3-Fix-4 — Merge history tabel leesbaarheid

De merge-history tabel is aangepast zodat de horizontale scrollbar de inhoud niet langer onleesbaar maakt. De tabel gebruikt nu een dedicated scroll-wrapper met extra onderruimte, cellen mogen tekst afbreken, en affected counts worden als compacte chips getoond. Er is geen databasewijziging nodig.

## ART-015D — Periodieke duplicate scanner ontwerp

Besluit: na afronding van de interactieve ontdubbel-flow wordt de onderhoudsvariant uitgewerkt. De onderhoudsvariant bestaat uit een periodieke scanner, bij voorkeur in Python, die mogelijke dubbele artiesten detecteert en candidates klaarzet in staging/reviewtabellen.

Architectuurprincipe:

```text
scanner vindt kandidaten
→ staging/reviewqueue
→ bestaande impactscan
→ bestaande transactionele merge
→ bestaande mergehistorie/audit/alerts
```

De scanner voert zelf geen merge uit. Dit houdt de bestaande ART-015C transactionele merge-service centraal en voorkomt dubbele merge-logica.

ART-015D is vastgelegd als ontwerp- en documentatiesprint. Implementatie wordt voorgesteld in ART-015D-1, ART-015D-2 en ART-015D-3.

---

## ART-015D-1 implementatienotities

De periodieke duplicate scanner basis is toegevoegd.

Belangrijke keuzes:

- De scanner is Python, maar gebruikt geen externe Python database dependency.
- Database-interactie loopt via `docker exec ... psql`, passend bij de Docker PostgreSQL-setup.
- Scannerresultaten worden opgeslagen in stagingtabellen en worden later via ART-015D-2 in een reviewqueue getoond.
- De scanner voert nooit automatisch een merge uit.
- Dry-run is beschikbaar voor veilige eerste beoordeling.
- Logging wordt geschreven naar `logs/` als wrapper-log en JSONL scanner-log.
- Bij succesvolle scan kan een Shellstarter-alert worden geschreven.

Runvolgorde lokaal:

```bash
npm run db:migrate:art015d1
npm run scan:duplicates -- --dry-run --verbose
npm run scan:duplicates
```

## ART-015D-2A projectnotitie

De duplicate scanner is gehard voor herhaalde runs. Candidateparen worden nu duurzaam herkend met `artist_key_low` en `artist_key_high`. Een nieuwe scan maakt geen nieuwe open candidate als het paar al openstaat; in plaats daarvan worden `last_seen_at`, `last_seen_scan_run_id` en `times_seen` bijgewerkt. Afgehandelde paren met `not_duplicate`, `ignored` of `merged` worden niet opnieuw als werkvoorraad aangeboden.

De reviewqueue is nog niet gebouwd; ART-015D-2B moet deze stagingdata in de Artiesten-app ontsluiten.

## ART-015D-2A-Fix-1 — Scanner psql stdin hardening

Tijdens lokaal testen faalde `npm run scan:duplicates` met `exec /usr/bin/psql: argument list too long`. De oorzaak was dat de Python scanner grote gegenereerde SQL-batches via `psql -c` als command argument meegaf. De scanner gebruikt nu `subprocess.run(..., input=sql)` en voert SQL via stdin aan `psql`, zodat grote candidate batches niet meer tegen de OS argument-length limiet aanlopen.

## ART-015D-2A-Fix-2 — Candidate timestamps bij scanner inserts

Tijdens een echte `npm run scan:duplicates` run bleek dat nieuwe records in `artist_duplicate_candidates` faalden op de NOT NULL constraint van `first_seen_at`. De scanner vult nu bij nieuwe candidates expliciet `first_seen_at`, `last_seen_at`, `first_seen_scan_run_id`, `last_seen_scan_run_id` en `times_seen`. Hiermee sluit de scanner aan op de ART-015D-2A rerun-hardening migratie.

## ART-015D-2B — Duplicate reviewqueue

De periodieke duplicate scanner heeft nu een reviewqueue in de Artiesten-app. De scanner blijft read-only/signalering; de gebruiker verwerkt candidates via de UI. Merge-acties lopen via de bestaande ART-015C transactionele merge-service. Bij merge vanuit de queue wordt de candidate transactioneel gekoppeld aan de mergehistorie via `merge_id`.

## ART-015D-3 — Scheduling, alerts en operationele hardening

ART-015D-3 is functioneel/technisch uitgewerkt als operationele laag rondom de duplicate scanner.

Belangrijkste besluiten:
- De scanner blijft review-only en voert nooit automatische merges uit.
- Scheduling wordt eerst ondersteund via handmatige start, crontab en macOS launchd-documentatie.
- Shellstarter-alerts zijn geschikt voor scanresultaten, scanfouten en stale reviewqueue-signalen.
- Mail wordt voorlopig alleen functioneel voorbereid; harde koppeling wacht op het Shellstarter-mailcontract.
- `startapp.sh` wordt meegeleverd als uitvoerbaar script voor lokale install/build/test/dev-keten met timestamped logs in `logs/`.
- Er is geen nieuwe SQL-migratie nodig voor deze ontwerpsprint.

## ART-015D-3A — Scanner alert hardening

Besluit: Shellstarter-alerts zijn nu concreet geïmplementeerd voor duplicate scanner-runs. Succes-alerts worden alleen geschreven bij actieve candidates. Fout-alerts krijgen severity `danger`. Mail blijft buiten scope totdat het Shellstarter-mailcontract is uitgewerkt.

## ART-015D-3B — Scheduler scripts en install manual

De periodieke duplicate scanner kan nu praktisch ingepland worden via cron of macOS launchd. De scanner blijft niet-mutatief ten aanzien van merges: hij schrijft alleen candidates naar staging/reviewqueue. De gebruiker verwerkt candidates daarna via de Artiesten-app reviewqueue en bestaande transactionele mergeflow.

Toegevoegde scripts:
- `scripts/scheduled-duplicate-scan.sh`
- `scripts/install-cron-duplicate-scan.sh`
- `scripts/uninstall-cron-duplicate-scan.sh`
- `scripts/install-launchd-duplicate-scan.sh`
- `scripts/uninstall-launchd-duplicate-scan.sh`

## ART-015D-3B-Fix-1 — Env example refresh

Naar aanleiding van een testbevinding is een refresh-script toegevoegd voor `.env.example`. Dit voorkomt dat een bestaande lokale projectdirectory een verouderde env-template houdt zonder `ARTIST_DUPLICATE_ALERT_ENABLED` en `ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD`.

Gebruik:

```bash
npm run env:refresh-example
```


## ART-015D-3B-Fix-2 — Testscript/env-template hardening

De ART-015D-3B scheduler contracttest is minder broos gemaakt: `test:art015d3b` mag meerdere ART-015D-3B tests draaien zolang de scheduler-test onderdeel blijft. `.env.example` bevat de duplicate scanner- en alertvariabelen.

## ART-015D-3C — Stale reviewqueue signalering

Besluit: de periodieke duplicate scanner mag oude reviewqueue-werkvoorraad signaleren, maar niet automatisch sluiten of wijzigen. De reviewqueue toont stale candidates op basis van `ARTIST_DUPLICATE_STALE_REVIEW_DAYS`. Shellstarter-alerts worden verrijkt met open/stale aantallen.

## ART-015D-3C-Fix-1 — Signalering en env-documentatie hardening

- `.env.example` is aangevuld/gecontroleerd op de volledige duplicate-scanner configuratieset.
- Documentatie maakt expliciet onderscheid tussen:
  - Shellstarter-alerts via `public.alerts`;
  - UI-signalering in de reviewqueue;
  - mail als nog niet technisch geïmplementeerd kanaal.
- ART-015D-3D blijft het vervolgitem voor het Shellstarter-mailcontract.

## ART-015D-3D — Shellstarter mailcontract

ART-015D-3D legt het mailcontract voor de duplicate-maintenance flow vast. Bestaande signalering via `public.alerts` en UI-badges blijft geïmplementeerd. Echte mailverzending wordt nog niet technisch uitgevoerd door de Artiesten-app.

Ontwerpbesluit:
- De Artiesten-app verstuurt geen mail rechtstreeks via SMTP, Outlook of eigen mailclient.
- Shellstarter is eigenaar van ontvangers, voorkeuren, verzending, retry en delivery-status.
- Voorkeursrichting is een notification outbox, zodat scanner en mergeflow losgekoppeld blijven van runtime mailtransport.
- Mail is bedoeld voor escalatie: scanfouten, stale reviewqueue boven drempel en high-impact merges. Normale scans en normale merges blijven primair alerts.
- ART-015D-3D bevat geen SQL-migratie; het outboxschema wordt pas geïmplementeerd nadat het Shellstarter-mailcontract in Shellstarter is bevestigd.

## ART-012 — Discogs artist enrichment ontwerp

Datum: 2026-06-06

Ontwerpbesluiten:

- De lokale `artist.ar_artist_key` blijft de primaire sleutel binnen `musicdb`.
- Discogs artist ID wordt nooit gebruikt als vervanging voor lokale artist keys.
- Discogs artist ID is alleen een externe lookup key om Discogs-data op te halen en te verversen.
- De lokale `artist` tabel kan functioneel rijker worden, maar brondata en lokale waarheid blijven gescheiden.
- Voorkeursrichting is een generiek extern-bronmodel met `artist_external_reference` en `artist_enrichment_cache`.
- Discogs-data wordt niet automatisch toegepast op lokale artistvelden; gebruiker bevestigt koppeling en eventuele verrijking.
- Discogs aliases/name variations kunnen later gebruikt worden als input voor duplicate detection.
- Discogs groups/members kunnen later ART-013 muzikant/band/relaties voeden.
- Albums blijven buiten scope van ART-012A, maar het ontwerp blijft uitbreidbaar richting ART-014.
- Wikipedia/Wikidata/MusicBrainz worden als bredere externe enrichment-bronnen apart opgenomen onder ART-017.


ART-012A-Fix-1: Discogs artist images worden ontwerptechnisch opgeslagen als metadata/URL/cache-referentie, niet als binaire data in PostgreSQL. Het basispad voor lokale image-cache wordt via `ARTIST_IMAGE_CACHE_DIR` in `.env` geconfigureerd; databasepaden blijven relatief.

## ART-012B-Prep — Discogs env-standaardisatie

Besluit: voor nieuwe Discogs-code gebruikt de Artiesten-app `DISCOGS_USER_TOKEN`, `DISCOGS_USER_AGENT`, `DISCOGS_BASE_URL`, `DISCOGS_CACHE_TTL_SECONDS` en `DISCOGS_REQUEST_TIMEOUT_MS`.

Legacy-variabelen uit Importeren Songs (`DISCOGS_API_TOKEN`, `DISCOGS_API_BASE_URL`, `DISCOGS_ENABLED`) worden alleen als fallback/migratiepad beschouwd. Nieuwe `.env.example` templates bevatten deze legacy-namen niet als actieve configuratie.

`config/discogsConfig.js` centraliseert het uitlezen van de configuratie en bepaalt of Discogs functioneel beschikbaar is. Discogs is beschikbaar als token, user-agent en base URL aanwezig zijn. Een ontbrekende token moet in ART-012B leiden tot disabled UI-acties en een duidelijke configuratiemelding.

## ART-012B — Discogs artist search/detail basisimplementatie

ART-012B is geïmplementeerd als inspect-only basis voor Discogs artist enrichment.

Besluiten:

- Lokale `artist.ar_artist_key` blijft leidend.
- Discogs artist ID wordt alleen gebruikt voor lookup/broncontext.
- Discogs-data wordt nog niet toegepast op lokale records.
- Database is voorbereid met `artist_external_reference`, `artist_enrichment_cache` en `artist_external_image`.
- Image metadata wordt voorbereid, maar binaire bestanden worden niet in PostgreSQL opgeslagen.
- Koppelen/toepassen volgt in ART-012C.

## ART-012B-Fix-1 — Discogs paneel en env-template

Testbevinding opgelost: het Discogs artist enrichment resultatenpaneel was te smal, waardoor de **Detail** knop deels buiten beeld viel. De Discogs-kaart gebruikt nu de volledige relatiegrid-breedte en de resultaatstabel heeft een scroll-safe wrapper met vaste actiekolom.

Ook is de env-template gehard: `.env.example` en `scripts/env-refresh-example.sh` bevatten nu de actuele ART-012 Discogs/image-cache variabelen én de ART-015D duplicate-scanner variabelen. Legacy Discogs-templatevariabelen worden niet opgenomen in `.env.example`.

## ART-012C — Discogs artist link implementation

ART-012C voegt het koppelen van een gekozen Discogs artist aan een lokale artist toe. De lokale `artist.ar_artist_key` blijft altijd leidend. De Discogs artist ID wordt opgeslagen als externe referentie en gebruikt als lookup-key voor latere refresh/enrichment.

De implementatie gebruikt de ART-012B tabellen:
- `artist_external_reference` voor de actieve bronkoppeling;
- `artist_enrichment_cache` voor raw/normalized Discogs-data;
- `artist_external_image` voor image metadata/URL's.

Binaire images worden niet in PostgreSQL opgeslagen. Een eventuele lokale image-cache blijft een latere uitbreiding en gebruikt relatieve cachepaden onder `ARTIST_IMAGE_CACHE_DIR`.

## ART-012C-Fix-1 — Discogs koppeling persistentie en datums

Tijdens testen bleek dat Discogs-koppelacties geen zichtbare records opleverden in de externe referentie/cachetabellen. De link-flow is aangepast zodat optionele auditlogging binnen een savepoint draait en ontbrekende auditinfrastructuur de hoofdtransactie niet meer terugdraait. Daarnaast is vastgelegd en geïmplementeerd dat gestructureerde geboorte-/overlijdensdatums uit Discogs alleen lege lokale artistvelden mogen vullen en nooit bestaande lokale waarden overschrijven.


## ART-012C-Fix-2 — Runbook querycorrectie en koppelresultaat

- Controlequery voor `artist_enrichment_cache` gebruikt `fetched_at`, niet `synced_at`.
- Documentatie verduidelijkt welke drie tabellen worden gevuld na **Koppel Discogs artist**.
- Geen nieuwe SQL-migratie nodig.

## ART-012C-Fix-3 — Discogs naamvoorstel en artiestenspelling

Tijdens ART-012C is bevestigd dat de lokale artistnaam niet automatisch uit Discogs mag worden overschreven. De reden is niet alleen veiligheid, maar vooral het spelling-/mappingmodel met `artiesten_spelling`.

Ontwerpbesluit: Discogs artist names zijn voorstellen. `Koppel Discogs artist` registreert alleen de externe bron en cachedata. Een toekomstige canonical naamwijziging moet via een spelling-aware flow lopen die `artist.ar_artist_name` en `artiesten_spelling` consistent bijwerkt, oude canonical namen bewaart als spelling en conflicten controleert.


## ART-012D — Discogs naamvoorstellen en artiestenspelling

ART-012D is functioneel en technisch uitgewerkt als ontwerpsprint. Discogs artist names zijn bronvoorstellen en worden nooit direct gebruikt om `artist.ar_artist_name` te overschrijven.

Belangrijkste ontwerpbesluiten:

- Discogs-namen kunnen later als alternatieve spelling worden toegepast.
- Canonical rename vereist een aparte spelling-aware flow.
- Oude canonical namen moeten als alternatieve spelling behouden blijven.
- Conflicten worden gecontroleerd via `artiesten_spelling.as_alternatieve_spelling`.
- Canonical rename moet transactioneel en auditbaar zijn.
- ART-012D-1 wordt aanbevolen als eerste implementatiesprint: voorstellen ophalen en tonen zonder mutaties.

## ART-012D-1 — Discogs spellingvoorstellen read-only

ART-012D-1 is toegevoegd als veilige tussenstap vóór het toepassen van Discogs-data. De app toont naamvoorstellen uit de gekoppelde Discogs-bron, maar wijzigt nog niets in `artist` of `artiesten_spelling`.

Belangrijke ontwerpregel blijft: Discogs artist names zijn bronvoorstellen. Canonical artist name wijzigingen mogen alleen via een latere spelling-aware flow plaatsvinden.

## ART-012D-2 — Discogs alternatieve spelling

Besluit: Discogs-naamvoorstellen mogen als alternatieve spelling worden toegevoegd, maar wijzigen nooit automatisch de lokale canonical artist name. De mutatie loopt via `artiesten_spelling`, met server-side conflictcontrole op bestaande spellingen. Canonical rename blijft een aparte toekomstige spelling-aware flow.


## ART-012D-3 — Canonical rename spelling-aware design

ART-012D-3 is uitgewerkt als ontwerp voor het canonical maken van een Discogs artist name. Belangrijk besluit: Discogs-koppelen blijft gescheiden van canonical rename. Een nieuwe canonical naam mag alleen worden toegepast via een spelling-aware transactie die `artist.ar_artist_name` én `artiesten_spelling` consistent houdt. De oude canonical naam blijft als alternatieve spelling bewaard. Conflicten op bestaande canonical namen en alternatieve spellingen blokkeren de actie.


## ART-012D-2-Fix-1 — Actieknop voor beschikbare spellingvoorstellen

Bij Discogs naamvoorstellen moet de actie **Voeg toe als spelling** zichtbaar zijn voor voorstellen met `available_discogs_name` en `available_alternative_spelling`. De knop schrijft alleen naar `artiesten_spelling`; `artist.ar_artist_name` blijft ongewijzigd. Niet-toepasbare voorstellen tonen een duidelijke niet-toepasbaar-status.

## ART-012D-3A — Canonical rename preview

ART-012D-3A implementeert een read-only preview voor het mogelijk canonical maken van een Discogs-naam. De preview is bewust niet-mutatief: `artist.ar_artist_name` en `artiesten_spelling` blijven ongewijzigd. De preview controleert conflicten met bestaande canonical artist names en bestaande spellingen bij andere artists, en toont welk spelling-aware transactieplan later nodig is.


## ART-012D-3A-Fix-1 — Discogs spellingvoorstellen UX

Testbevinding: de knoppen **Voeg toe als spelling** en **Preview canonical** waren functioneel aanwezig, maar de gebruiker zag onvoldoende waarom ze pas na koppeling/voorstellen laden verschijnen. De UI en documentatie zijn aangescherpt. Discogs-koppeling, spelling toevoegen en canonical-preview blijven gescheiden stappen.

## ART-012D-3B — Canonical rename execution

Toegevoegd: spelling-aware uitvoering van canonical rename via Discogs-naamvoorstel. De lokale `artist.ar_artist_name` wordt alleen gewijzigd na preview en expliciete bevestiging. De oude canonical naam blijft behouden als alternatieve spelling en de nieuwe canonical naam wordt in `artiesten_spelling` geborgd. Geen nieuwe SQL-migratie.

## ART-012E-1 — Discogs gekoppeld-indicatie en artist type

ART-012E is bewust opgesplitst in kleine testbare stappen. ART-012E-1 doet nog geen echte verrijking, maar legt de basis:

- Discogs gekoppelde artiesten zijn herkenbaar in de artiestenlijst met `<i class="bi bi-link"></i>`.
- `artist.ar_artist_type` is toegevoegd met default `unknown`.
- Toegestane artist type waarden: `unknown`, `person`, `duo`, `trio`, `group`, `band`, `alias`, `project`.
- `band` is niet aantal-gebaseerd; `duo` en `trio` zijn aparte bruikbare classificaties.
- Artist type wordt handmatig gekozen en niet automatisch door Discogs gezet.

Migratie:

```bash
npm run db:migrate:art012e1
```

Test:

```bash
npm run test:art012e1
```


## ART-012E-1-Fix-2 — Discogs link-icoon direct zichtbaar na koppelen

Na succesvolle Discogs-koppeling houdt de frontend de gekoppelde artist key optimistisch bij, zodat `<i class="bi bi-link"></i>` direct in de artiestentabel verschijnt zonder handmatige browserrefresh. De serverrefresh blijft behouden; na browserrefresh blijft de databasekoppeling leidend.

## 2026-06-08 — ART-012E-2 Discogs profielfoto

Na acceptatie van ART-012E-1 is ART-012E-2 uitgewerkt als aparte kleine sprint. De app toont bij een gekoppelde Discogs-artiest de beschikbare Discogs images en laat de gebruiker één image kiezen als primaire profielfoto. De keuze wordt opgeslagen in `artist_external_image.is_primary`. De migratie normaliseert bestaande primaire images en voegt een partial unique index toe zodat per artiest maximaal één primaire image mogelijk is.

Bewust buiten scope gehouden: lokale image-cache download, enrichment proposals, datumextractie en profielteksttoepassing.

## 2026-06-08 — ART-012E-3 Enrichment proposals preview

ART-012E-3 bouwt een read-only proposal-laag voor Discogs-verrijking. De app kan voorstellen genereren uit de bestaande Discogs-cache/reference en toont lokale waarde, voorgestelde waarde, status, confidence en context.

Belangrijk ontwerpbesluit: profieltekst mag gebruikt worden voor kandidaat-extractie, maar waarden worden niet automatisch toegepast. Onvolledige datums blijven alleen zichtbaar als voorstel, omdat de lokale velden echte `date`-velden zijn.

## 2026-06-08 — ART-012E-4 Discogs enrichment proposal apply

ART-012E-4 voegt gecontroleerde apply-acties toe aan de Discogs verrijkingsvoorstellen uit ART-012E-3. Voorstellen kunnen expliciet worden toegepast, genegeerd of later beoordeeld. Bestaande lokale waarden worden beschermd door confirm-overwrite gedrag. Discogs-profieltekst wordt opgeslagen in `artist_external_profile` en niet in `artist.ar_artist_notes`. Onvolledige datums blijven zichtbaar, maar zijn niet toepasbaar op de `date`-velden van `artist`.


## ART-012E-4-Fix-1 — Apply refresh artist-state

Na het toepassen van een verrijkingsvoorstel gebruikt de frontend de actuele `artist` uit de apply-response om de artiestentabel, geselecteerde artiest, relatie-inzicht en eventueel geopende detailcontext direct bij te werken. Voor `artist_external_profile.profile_text` wordt expliciet gemeld dat dit externe profieldata is en dat de lokale `artist`-tabel daarbij niet wijzigt.

## 2026-06-08 — ART-012E-4-Fix-6 Nederlandse datumweergave

- Geboorte- en sterfdatums worden in de Artiesten-app op schermen getoond als `dd-mm-jjjj`.
- Database/API blijven `YYYY-MM-DD` gebruiken.
- Native edit-formulier date inputs blijven `YYYY-MM-DD`, passend bij HTML `input type="date"`.
- Geen database-migratie nodig.

## ART-012D-4 — Discogs naamvoorstellen reviewqueue

De tijdelijke Discogs spellingvoorstellen zijn uitgebreid met een persistente reviewqueue in `artist_name_proposals`. De apply-actie voor `Voeg toe als spelling` hergebruikt de bestaande veilige ART-012D-2 flow en wijzigt `artist.ar_artist_name` niet.

## ART-UI-1A — Detail/edit UX foundation

ART-UI-1A pakt de eerste UI/UX-hardening op voor de Artiesten-app. Het edit-scherm is verbreed, het onderste relatie/detailgebied heeft een paneelnavigatie gekregen en het relatiepaneel is de primaire scrollcontainer geworden. Externe Discogs-profieltekst uit `artist_external_profile` wordt read-only getoond in het Discogs-gedeelte; lokale notities blijven apart in `artist.ar_artist_notes`.

## ART-UI-Date-1 — Datepicker bij Nederlandse datum-invoer

De datumvelden in het artist edit-scherm blijven zichtbaar en handmatig invoerbaar als `dd-mm-jjjj`, maar de native datepicker is opnieuw betrouwbaar aanklikbaar gemaakt via het kalendericoon. Database/API blijven `YYYY-MM-DD` gebruiken. Geen database-migratie nodig.

## ART-013A — One-way artist → musician sync

ART-013A legt de basis voor het verder uitwerken van musicus/band-relaties zonder een nieuw generiek relatiedatamodel naast de bestaande tabellen te introduceren.

Het bestaande model bevat `musician` en `musician_in_band`. Voor de eerste sprint is gekozen voor een kleine databasegestuurde synchronisatie van `artist` naar `musician`:

- alleen bij update;
- alleen voor persoonsartiesten (`ar_artist_type = 'person'`);
- alleen voor bestaande gekoppelde musicians;
- nooit bidirectioneel;
- geen automatische musician-aanmaak;
- geen delete/merge-sync.

De implementatie gebruikt een PostgreSQL functie en trigger, zodat updates via Node.js, pgAdmin of scripts consistent hetzelfde gedrag krijgen.

Belangrijk: `musician.mu_musician_dateofbirth` is in het huidige schema `NOT NULL`. Als de artist-geboortedatum leeg is, behoudt de trigger daarom de bestaande musician-geboortedatum in plaats van de artist-update te blokkeren of een placeholderdatum te verzinnen.


ART-013A ontwerpnotitie: er is geen automatische aanmaak van musician-records.

---

## ART-013A-1 — Idempotente musician backfill vanuit person artists

Naar aanleiding van de constatering dat de `musician`-tabel leeg kan zijn, is ART-013A-1 toegevoegd. ART-013A zelf synchroniseert alleen bestaande gekoppelde musicians bij een update van een `person` artist. ART-013A-1 verzorgt daarom een expliciet, herhaalbaar onderhoudsscript om ontbrekende musician-records aan te maken.

Belangrijke ontwerpbesluiten:

- De synchronisatie blijft uitsluitend `artist → musician`.
- Er komt geen bidirectionele synchronisatie.
- De trigger blijft geen musicians automatisch aanmaken.
- De backfill is een handmatig of periodiek te draaien onderhoudsactie.
- Alleen `artist.ar_artist_type = 'person'` komt in aanmerking.
- Een bestaande gekoppelde musician wordt herkend via `musician.ar_artist_key = artist.ar_artist_key`.
- Het script voegt alleen ontbrekende musicians toe en overschrijft bestaande musicians niet.
- Het script is idempotent en mag meerdere keren worden uitgevoerd.
- `musician.mu_musician_dateofbirth` wordt nullable gemaakt; onbekende geboortedatums blijven `NULL`, geen placeholderdatum.
- Delete/merge/deactiveren van artist blijft los van musician, zodat `musician_in_band` historisch geldig kan blijven.

Nieuwe commando's:

```bash
mkdir -p logs && npm run db:migrate:art013a1 2>&1 | tee "logs/db-migrate-art013a1-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run musician:backfill:preview 2>&1 | tee "logs/musician-backfill-preview-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-$(date +%Y%m%d-%H%M%S).log"
```

---

## 2026-07-11 — ART-013A-2 databasevalidatie en backfill-hardening uitgewerkt

Na analyse van ART-013A en ART-013A-1 is besloten om vóór nieuwe musician/band-functionaliteit eerst de volledige artist→musician-keten operationeel af te ronden.

ART-013A-2 omvat:

- read-only database-preflight;
- schema-, datatype- en constraintvalidatie;
- detectie van dubbele `musician.ar_artist_key`-koppelingen vóór unieke indexcreatie;
- classificatie in blockers, warnings en informatie;
- één gedeelde kandidaatselectie voor preview en execute;
- veilige backfill met aantallen voor selected/inserted/skipped/failed;
- apart `musician:verify`-commando;
- expliciete idempotentiecontrole;
- transactionele/geïsoleerde Docker PostgreSQL-integratietests;
- productieguard en testdata-cleanup;
- logging via `2>&1 | tee`;
- packaging-hardening voor `.DS_Store`, `__MACOSX` en `._*` naast de bestaande excludes.

De domeinregels wijzigen niet: sync blijft uitsluitend artist→musician, alleen voor person-artists en alleen naar bestaande gekoppelde musicians. De trigger maakt niets aan en delete/merge/deactiveren verwijdert geen musician.

Documenten:

- `docs/ART_013A_2_Databasevalidatie_Backfill_Hardening_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_013A_2_Testcases_en_Runbook.md`
- `Release Notes/ART_013A_2_Databasevalidatie_Backfill_Hardening_Release_Notes.md`

Afgesproken vervolgvolgorde na acceptatie:

1. ART-UI-Polish — thumbnail en overleden-indicator;
2. ART-012D-4 volledige functionele validatie/fixes;
3. ART-013B musician-in-band relatieverrijking;
4. lokale biografie ontwerpen;
5. ART-014 album/release-datamodel.


## ART-013A-2 — Databasevalidatie en backfill-hardening (2026-07-11)

Status: **geïmplementeerd; lokale database-acceptatie open**.

Opgeleverd: centrale preflight, geharde migratie, veilige preview/execute, verificatie, transactionele database-integratietest, contracttests en bijgewerkt runbook. De eerstvolgende afgesproken volgorde na acceptatie blijft: ART-UI-Polish, ART-012D-4 validatie/fixes, ART-013B, lokale biografie en ART-014.

## ART-UI-POLISH-1 ontwerpbesluiten — 2026-07-11

De eerstvolgende sprint na ART-013A-2 verbetert de artiestenlijst met een compacte primaire profielfoto en overledenstatus.

### Imagecontract

- De backendlijst levert maximaal één veld `primary_image_url` per artiest.
- Alleen `artist_external_image.is_primary = true` kwalificeert.
- De frontend haalt niet per rij images op en kiest niet zelf een eerste image.
- Query wordt uitgevoerd met een join/lateral-subquery of gelijkwaardige enkele querystrategie.
- Historische inconsistente dubbele primary records mogen een artiest niet dubbel in de lijst laten verschijnen.

### Presentatiecontract

- Thumbnailmaat: bij voorkeur 28×28 px, maximaal 32×32 px.
- Vaste afmetingen en `object-fit: cover` voorkomen layout shift.
- Ontbrekende of defecte image toont een lokale fallback-avatar.
- Externe images worden lazy geladen.
- Nieuwe CSS krijgt een sprint-/componentprefix; geen globale `img`, `tr` of `td` overrides.

### Overledenstatus

- Geen nieuw databaseveld.
- Indicator wordt afgeleid van een gevulde `artist.ar_artist_passing`.
- Bootstrap Icon: `bi-hourglass-bottom`.
- Tooltip en toegankelijke tekst: `Artiest overleden`.
- De bestaande sterfdatum blijft zichtbaar.

### Interactie

- Thumbnail is informatief; geen nieuwe image-modal of aparte klikactie.
- Na het kiezen van een andere primaire Discogs-image wordt de artiestenlijst direct ververst.
- De geselecteerde artiest en het geopende detailpaneel blijven behouden.

### Teststrategie

De codesprint krijgt backendcontracttests, frontendcomponenttests en Chromium Playwrighttests. De functionele basis bevat 48 genummerde testcases in:

```text
docs/ART_UI_POLISH_1_Testcases_en_Runbook.md
```

## 2026-07-11 — ART-UI-POLISH-1 geïmplementeerd

- Profielkolom links in de artiestenlijst toegevoegd.
- Primaire Discogs-image wordt als compacte lazy-loaded thumbnail getoond.
- Ontbrekende of defecte images vallen terug op een lokale avatar.
- Gevulde `ar_artist_passing` toont een toegankelijke hourglass-indicator.
- Bestaande lateral join voorkomt N+1-query’s en dubbele artiestenrijen.
- Primary-image wijziging patcht direct lijst- en selectiestate.
- 48 functionele testcase-ID’s zijn contractueel traceerbaar; implementatiecontracttests zijn toegevoegd.
- Volgende backlogstap: ART-012D-4 volledig functioneel valideren en hardenen.
