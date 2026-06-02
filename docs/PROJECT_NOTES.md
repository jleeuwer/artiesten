# Artiesten-app Project Notes

Laatste bijgewerkt: 2026-05-19

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
