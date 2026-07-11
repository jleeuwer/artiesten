# ART-012B — Discogs artist search/detail basisimplementatie

## Doel

ART-012B bouwt de eerste concrete basis voor Discogs artist enrichment in de Artiesten-app.

De sprint levert zoeken en inspecteren op, maar past nog geen Discogs-data toe op de lokale `artist`-records.

## Belangrijkste ontwerpbesluiten

- `artist.ar_artist_key` blijft altijd de lokale primaire sleutel.
- Discogs artist ID vervangt nooit lokale artist keys.
- Discogs artist ID wordt alleen gebruikt als externe lookup-key en bronreferentie.
- Discogs-data wordt in ART-012B alleen opgehaald en getoond.
- Koppelen/toepassen volgt later in ART-012C.
- Binaire Discogs-images worden niet in PostgreSQL opgeslagen.
- Images worden ontwerptechnisch voorbereid als metadata in `artist_external_image`.
- `local_cache_path` blijft relatief binnen `ARTIST_IMAGE_CACHE_DIR`.

## Backend

Nieuwe routes:

```text
GET /api/artists/discogs/config
GET /api/artists/:id/discogs/search
GET /api/artists/discogs/:discogsArtistId
```

### Configstatus

`GET /api/artists/discogs/config` geeft terug of Discogs functioneel beschikbaar is.

Discogs is beschikbaar als minimaal aanwezig zijn:

```env
DISCOGS_USER_TOKEN
DISCOGS_USER_AGENT
DISCOGS_BASE_URL
```

Legacy fallback op `DISCOGS_API_TOKEN` en `DISCOGS_API_BASE_URL` blijft tijdelijk ondersteund via `config/discogsConfig.js`, maar de standaard is `DISCOGS_USER_TOKEN` en `DISCOGS_BASE_URL`.

### Artist search

`GET /api/artists/:id/discogs/search` zoekt op de lokale artiestnaam. De response bevat genormaliseerde Discogs-resultaten met:

- Discogs artist ID;
- Discogs naam;
- Discogs URL;
- resource URL;
- image/thumb URL metadata;
- raw bronrecord.

### Artist detail

`GET /api/artists/discogs/:discogsArtistId` haalt detaildata op, waaronder:

- real name;
- profile;
- aliases;
- name variations;
- groups;
- members;
- image metadata;
- raw Discogs payload.

## Databasevoorbereiding

Nieuwe migratie:

```text
scripts/sql/20260606_art012b_discogs_artist_enrichment_basis.sql
```

Nieuwe voorbereidende tabellen:

- `artist_external_reference`
- `artist_enrichment_cache`
- `artist_external_image`

Deze tabellen worden in ART-012B nog niet volledig gebruikt voor koppelen/toepassen. Ze leggen de basis voor ART-012C.

Docker-proof migratie:

```bash
npm run db:migrate:art012b
```

## Frontend

In het relatiepaneel is een kaart **Discogs artist enrichment** toegevoegd.

De kaart ondersteunt:

- knop **Zoek in Discogs**;
- disabled state als Discogs niet geconfigureerd is;
- resultatenlijst met Discogs artist ID, naam en link;
- detailinspectie;
- duidelijke melding dat ART-012B alleen inspecteert.

## Niet in scope

Nog niet inbegrepen:

- Discogs-resultaat koppelen aan lokale artist;
- lokale artistvelden overschrijven;
- aliases naar `artiesten_spelling` toepassen;
- image-download/cache;
- Discogs-data gebruiken in duplicate scanner;
- automatische artist merge.

## Vervolg

ART-012C wordt de logische volgende sprint:

```text
Discogs artist koppelen aan lokale artist + enrichment-cache vullen
```

## ART-012B-Fix-1 — Discogs resultatenpaneel en env-template

### Aanleiding

Tijdens testen bleek het paneel **Discogs artist enrichment** te smal wanneer zoekresultaten werden getoond. De kolom **Actie** viel deels buiten beeld, waardoor de knop **Detail** nog maar net zichtbaar en klikbaar was.

Daarnaast moet `.env.example` de volledige actuele configuratieset blijven bevatten voor zowel ART-015D duplicate scanner instellingen als ART-012 Discogs/image-cache instellingen. Legacy Discogs-variabelen zoals `DISCOGS_API_TOKEN`, `DISCOGS_API_BASE_URL` en `DISCOGS_ENABLED` worden niet meer als template gebruikt.

### Functionele fix

- De Discogs-kaart spant nu de volledige breedte van het relatiegrid.
- De resultaten worden getoond in een scroll-safe wrapper met extra onderruimte.
- De actiekolom heeft een vaste minimale breedte zodat **Detail** volledig zichtbaar blijft.
- Lange artiestnamen mogen afbreken in plaats van de actieknop buiten beeld te duwen.
- `.env.example` bevat de canonieke Discogs-variabelen en image-cachevariabelen.
- `scripts/env-refresh-example.sh` genereert dezelfde canonieke `.env.example`.

### Acceptatiecriteria

- De knop **Detail** is volledig zichtbaar en klikbaar in het Discogs-resultatenpaneel.
- Er is geen horizontale afknelling van de actiekolom.
- `.env.example` bevat `DISCOGS_USER_TOKEN=` maar geen echte tokenwaarde.
- `.env.example` bevat geen legacy Discogs-templatevariabelen.
