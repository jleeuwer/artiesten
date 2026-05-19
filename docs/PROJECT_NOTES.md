# Artiesten-app Project Notes

Laatste bijgewerkt: 2026-05-18

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
- `.sample.env` en `.env.example` zijn veilige voorbeeldbestanden en moeten wel meegeleverd worden.
- Nieuwe env-variabelen moeten altijd in beide voorbeeldbestanden en in de README worden gedocumenteerd.

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
- `.sample.env`;
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

- Bevinding opgelost waarbij `tests/packaging.contract.test.mjs` faalde omdat `.sample.env` leeg was.
- `.sample.env` en `.env.example` bevatten nu dezelfde veilige voorbeeldconfiguratie, inclusief `PORT=3012`, `DATABASE_URL`, CORS, Shellstarter/Vite variabelen en Docker migratiehulpvariabelen.
- Docker PostgreSQL is de primaire migratieroute voor Sprint 6. Het lokale `psql "$DATABASE_URL"` voorbeeld is vervangen door `npm run db:migrate:sprint6` en een expliciet `docker exec` voorbeeld.
- Nieuw script: `scripts/db-migrate-sprint6-docker.sh`, met timestamped logging naar `logs/`.

## 2026-05-19 — Sprint 6 Fix: unieke-titelgewicht en relatiepaneel UX

Gebruikerstest heeft twee aanscherpingen opgeleverd:

- Artiestgewicht telt voortaan unieke songtitels via `count(distinct lower(trim(fd_tag_title)))`, waarbij records met `fd_action = Delete` niet meetellen. Meerdere versies van dezelfde titel tellen dus één keer mee voor gewicht. Het totaal aantal niet-verwijderde `file_details` records blijft beschikbaar als `version_count`.
- Na selectie van een artiest wordt de focus/scroll naar het relatiepaneel onderaan verplaatst. Het paneel krijgt een duidelijke header en de knop `Terug naar artiestenlijst`.
- Het edit-scherm bevat nu compacte read-only infopanelen voor file details, artiestenspellingen en hitlijsten. Deze panelen zijn informatief; bewerken gebeurt via de betreffende app in Shellstarter.
