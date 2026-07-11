# ART-012 — Discogs artist enrichment — Functioneel en technisch ontwerp

Status: ontwerp-/documentatiesprint  
Datum: 2026-06-06

## 1. Doel

ART-012 voegt een gecontroleerde Discogs-verrijkingsflow toe voor lokale artiesten in `musicdb`.

Het doel is niet om Discogs leidend te maken, maar om lokale artiestgegevens rijker, beter controleerbaar en beter herbruikbaar te maken voor toekomstige flows zoals duplicate detection, artiestrelaties, bands/muzikanten en albums.

## 2. Hoofdbesluit: lokale artist key blijft leidend

De lokale sleutel blijft altijd de primaire sleutel binnen `musicdb`:

```text
artist.ar_artist_key
```

De Discogs artist ID wordt **niet** gebruikt als vervanging van `artist.ar_artist_key`.

Redenen:

- bestaande tabellen verwijzen naar `artist.ar_artist_key`, zoals `file_details`, `artiesten_spelling`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items`, mergehistorie en duplicate candidates;
- niet elke lokale artiest heeft een betrouwbare Discogs-match;
- Discogs is een externe bron buiten onze controle;
- lokale modellering kan bewust afwijken van Discogs;
- de Artiesten-app moet ook zonder Discogs blijven werken.

Ontwerpregel:

```text
Discogs ID is een externe lookup key en metadatareferentie, geen primaire sleutel.
```

## 3. Functionele uitgangspunten

1. De gebruiker zoekt Discogs-data voor een lokale artiest.
2. De app toont Discogs-kandidaten.
3. De gebruiker inspecteert een kandidaat.
4. De gebruiker koppelt na expliciete bevestiging een Discogs artist aan de lokale artist.
5. De app slaat de externe referentie en opgehaalde brondata op.
6. Lokale artist-attributen worden niet automatisch overschreven.
7. Verrijking naar lokale velden gebeurt via een review/accept-flow.

## 4. Wat willen we uit Discogs halen?

Discogs artist data kan meerdere soorten informatie leveren:

| Discogs-data | Gebruik | Opslagadvies |
|---|---|---|
| Artist ID | technische lookup key | externe referentie |
| Discogs URL | inspectie/bronlink | externe referentie |
| Discogs naam | vergelijking met lokaal | externe referentie + kandidaatveld |
| Real name | mogelijke lokale verrijking | reviewbaar artist-attribuut |
| Profile/biografie | context | enrichment/cache of reviewbaar veld |
| Name variations | spellingvoorstellen | voorstel voor `artiesten_spelling`, niet automatisch toepassen |
| Aliases | duplicate detection / spelling | aparte review/staging of external data |
| Groups/member of | toekomstige ART-013 relaties | enrichment/cache, later relatievoorstel |
| Members | toekomstige band/muzikantrelaties | enrichment/cache, later relatievoorstel |
| Images | UI/broncontext | URL/cachemetadata, geen binaire bestanden in DB |
| Raw JSON | heranalyse/debug | enrichment-cache |
| Sync timestamp | beheer | verplicht |


### 4.1 Image-opslag en lokale cache

Voor Discogs artist images geldt een aparte opslagregel:

```text
Binaire images worden niet in PostgreSQL opgeslagen.
```

De database bewaart alleen bronmetadata, URL's en optionele cachemetadata. Het basispad voor een lokale image-cache wordt centraal geconfigureerd via `.env`, zodat migratie naar een andere machine of directory geen databasewijziging vereist.

Voorstel in `.env.example`:

```env
ARTIST_IMAGE_CACHE_ENABLED=false
ARTIST_IMAGE_CACHE_DIR=data/cache/artist-images
ARTIST_IMAGE_CACHE_MAX_AGE_DAYS=30
```

De database bewaart bij caching alleen een relatieve cache-referentie binnen `ARTIST_IMAGE_CACHE_DIR`, bijvoorbeeld:

```text
discogs/1483/primary.jpg
```

Niet:

```text
/Users/<user>/Projects/.../artist/data/cache/artist-images/discogs/1483/primary.jpg
```

Hierdoor blijft de database portable en hoeft bij migratie alleen `.env` te worden aangepast.

### 4.2 Conceptuele image-metadatatabel

Wanneer images echt in de UI gebruikt worden, is een aparte tabel beter dan imagekolommen op `artist`.

Conceptueel voorstel:

```sql
create table public.artist_external_image (
  image_id bigserial primary key,
  artist_key integer not null references public.artist(ar_artist_key),
  reference_id bigint references public.artist_external_reference(reference_id),
  source text not null,
  external_image_url text not null,
  external_resource_url text,
  image_type text,
  width integer,
  height integer,
  is_primary boolean not null default false,
  cache_status text not null default 'remote_only',
  local_cache_path text,
  cached_at timestamptz,
  cache_error text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Ontwerpregels:

- `external_image_url` bevat de bron-URL van Discogs of een andere externe bron.
- `local_cache_path` is alleen een relatieve path/cache-key binnen `ARTIST_IMAGE_CACHE_DIR`.
- `cache_status` ondersteunt waarden zoals `remote_only`, `cached`, `failed` en `expired`.
- binaire bestanden worden eventueel op schijf gecachet, niet in de database.
- raw image metadata mag in `raw_data` worden bewaard voor heranalyse.

Voor ART-012A blijft dit ontwerp. Een daadwerkelijke image-cache implementatie hoort in een latere implementatiesprint.

## 5. Datamodelopties

### Optie A — Discogs-kernvelden direct op `artist`

Voor een eenvoudige eerste versie kunnen enkele velden op `artist` worden toegevoegd:

```sql
alter table public.artist
  add column ar_discogs_artist_id bigint,
  add column ar_discogs_url text,
  add column ar_discogs_name text,
  add column ar_discogs_synced_at timestamptz,
  add column ar_real_name text,
  add column ar_profile text;
```

Voordelen:

- eenvoudig;
- weinig joins;
- snel zichtbaar in bestaande artist-query's.

Nadelen:

- minder geschikt voor meerdere bronnen;
- minder geschikt voor reviewstatussen;
- `artist` wordt snel breed en bronafhankelijk;
- raw Discogs-data past hier niet netjes.

### Optie B — Aparte externe referentie- en enrichment-tabellen

Voorkeursrichting voor ART-012:

```text
artist_external_reference
artist_enrichment_cache
```

Conceptueel:

```sql
create table public.artist_external_reference (
  reference_id bigserial primary key,
  artist_key integer not null references public.artist(ar_artist_key),
  source text not null,
  external_id text not null,
  external_url text,
  external_name text,
  confidence_score numeric(5,2),
  status text not null default 'linked',
  selected_by text,
  selected_at timestamptz,
  synced_at timestamptz,
  unique (source, external_id),
  unique (artist_key, source)
);

create table public.artist_enrichment_cache (
  cache_id bigserial primary key,
  artist_key integer not null references public.artist(ar_artist_key),
  reference_id bigint references public.artist_external_reference(reference_id),
  source text not null,
  normalized_data jsonb not null default '{}'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  review_status text not null default 'new',
  fetched_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text
);
```

Images worden niet als binaire payload in deze cache of in PostgreSQL opgeslagen. Image-URL's en cachemetadata kunnen later in `artist_external_image` worden opgeslagen. Het basispad voor lokale file-cache staat in `.env` via `ARTIST_IMAGE_CACHE_DIR`; de database bewaart alleen relatieve cachepaden.

Voordelen:

- uitbreidbaar naar Wikipedia/Wikidata, MusicBrainz en andere bronnen;
- brondata en lokale waarheid blijven gescheiden;
- raw data blijft beschikbaar voor herinterpretatie;
- reviewflow past beter;
- duplicate detection kan later meerdere bronnen gebruiken.

Nadelen:

- meer tabellen;
- meer API's/UI nodig;
- iets complexere queries.

### Advies

Voor ART-012 kiezen we **Optie B** als voorkeursontwerp.

`artist` blijft schoon en lokaal leidend. Discogs-data wordt via externe referentie/cache opgeslagen. Later kunnen specifieke geaccepteerde attributen eventueel naar `artist` of domeintabellen worden gepromoveerd.

## 6. Lokale artist-attributen verrijken

Naast de Discogs-koppeling willen we onderzoeken welke lokale artist-attributen rijker kunnen worden.

Mogelijke lokale uitbreidingen:

| Attribuut | Herkomst | Opmerking |
|---|---|---|
| real name | Discogs/Wikidata | vooral solo-artiesten |
| profile/summary | Discogs/Wikipedia | kan lang zijn; review vereist |
| country/origin | Wikidata/MusicBrainz/Discogs indien beschikbaar | mogelijk later ART-017 |
| active period | Wikidata/MusicBrainz | later |
| artist type | Discogs/MusicBrainz/user | solo/band/project/unknown |
| source confidence | app-afgeleid | nuttig voor review |

Belangrijk: Discogs-data is brondata. Lokale verrijking gebeurt alleen na expliciete gebruikerskeuze.

## 7. Functionele flow

### 7.1 Discogs artist search

Vanuit een artist-detail of relatiepaneel:

1. gebruiker kiest **Zoek Discogs artist**;
2. zoekquery wordt standaard gevuld met `artist.ar_artist_name`;
3. gebruiker kan query aanpassen;
4. app toont kandidaten met:
   - Discogs ID;
   - naam;
   - URL;
   - type/context indien beschikbaar;
   - korte score of matchreden;
5. gebruiker kiest **Bekijk details**.

### 7.2 Discogs artist detail inspecteren

Detailweergave toont:

- Discogs artist ID;
- naam;
- URL;
- real name;
- profile;
- aliases;
- name variations;
- groups/member-of;
- members;
- images/URLs indien beschikbaar;
- ruwe bronstatus/fetched timestamp.

### 7.3 Koppelen aan lokale artist

Na inspectie kan de gebruiker kiezen:

```text
Koppel deze Discogs artist aan lokale artiest
```

De app schrijft dan:

- externe referentie;
- enrichment-cache;
- sync timestamp;
- audit/log.

De lokale artistnaam of artist key wordt niet automatisch aangepast.

### 7.4 Verrijkingsvoorstellen accepteren

Na koppeling kan de app voorstellen tonen:

- real name toepassen;
- profile overnemen;
- name variation toevoegen aan `artiesten_spelling`;
- alias als duplicate-candidate signaleren;
- groups/members als toekomstig ART-013-relatievoorstel bewaren.

In ART-012A blijft dit ontwerp. De eerste implementatie hoeft nog geen auto-apply te doen.

## 8. Relatie met bestaande modules

### ART-015 duplicate detection

Discogs aliases/name variations kunnen later de fuzzy duplicate scanner verbeteren.

Voorbeeld:

```text
Discogs alias/name variation → candidate input voor duplicate scanner → reviewqueue → impactscan → transactionele merge
```

Geen automatische merge op basis van Discogs.

### ART-013 muzikant/band/album relaties

Discogs groups/members kunnen later relationele voorstellen opleveren:

- persoon is lid van band;
- band heeft members;
- artist is group/project;
- relatie met albums/releases.

ART-012 bewaart brondata zo dat ART-013 hier later op kan aansluiten.

### ART-014 albums

Discogs artist enrichment moet rekening houden met toekomstige album/release-koppelingen, maar albums worden niet in ART-012A gebouwd.

## 9. API-ontwerp

Voorgestelde endpoints:

```text
GET  /api/artists/:artistId/discogs/search?q=<query>
GET  /api/artists/:artistId/discogs/candidates/:discogsArtistId
POST /api/artists/:artistId/discogs/link
GET  /api/artists/:artistId/enrichment
POST /api/artists/:artistId/enrichment/:cacheId/apply
```

### `POST /api/artists/:artistId/discogs/link`

Input:

```json
{
  "discogsArtistId": 12345,
  "discogsUrl": "https://www.discogs.com/artist/12345",
  "discogsName": "Example Artist",
  "selectedReason": "Handmatig bevestigd na inspectie"
}
```

Gedrag:

- valideert lokale artist;
- valideert Discogs-kandidaat;
- schrijft/actualiseert `artist_external_reference`;
- schrijft/actualiseert `artist_enrichment_cache`;
- schrijft audit/log;
- overschrijft geen lokale artistvelden.

## 10. Configuratie

Discogs-configuratie moet aansluiten bij bestaande conventies in andere Musicapp modules.

Voorstel in `.env.example`:

```env
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_REQUEST_TIMEOUT_MS=10000
DISCOGS_CACHE_TTL_SECONDS=21600
ARTIST_IMAGE_CACHE_ENABLED=false
ARTIST_IMAGE_CACHE_DIR=data/cache/artist-images
ARTIST_IMAGE_CACHE_MAX_AGE_DAYS=30
```

Als Discogs niet is geconfigureerd, wordt de Discogs-knop disabled met duidelijke tooltip:

```text
Discogs is niet geconfigureerd. Vul DISCOGS_USER_TOKEN en DISCOGS_USER_AGENT in.
```

## 11. Logging, audit en fouten

Logniveaus:

- `info`: zoekactie gestart, kandidaat gekoppeld, enrichment opgehaald;
- `debug`: aantallen kandidaten, cache hit/miss, API timing;
- `warn`: Discogs niet geconfigureerd, rate-limit, geen kandidaten;
- `error`: API-fout, parsefout, databasefout.

Audit:

- koppelen van Discogs artist moet auditwaardig zijn;
- toepassen van lokale verrijking moet auditwaardig zijn;
- brondata/cache refresh hoeft niet altijd als audit-event, maar wel als log.

## 12. Veiligheid en betrouwbaarheid

- Discogs-fouten mogen de normale Artiesten-app niet breken.
- Externe API-timeouts moeten begrensd zijn.
- Rate-limit headers moeten later geëvalueerd worden.
- Raw JSON mag geen secrets bevatten.
- Geen fontbestanden of externe binaries in de release-ZIP.
- Discogs-token staat alleen in `.env`, nooit in `.env.example` met echte waarde.
- Image-cachebestanden worden niet meegeleverd in release-ZIP's.
- `ARTIST_IMAGE_CACHE_DIR` is machine-afhankelijk en hoort in `.env`; databasepaden blijven relatief.

## 13. Teststrategie

Voor ART-012A documentatie:

- ontwerp vermeldt dat `ar_artist_key` leidend blijft;
- ontwerp vermeldt dat Discogs ID externe lookup-key is;
- ontwerp bevat datamodelkeuze voor external reference/cache;
- ontwerp bevat review/accept-flow;
- ontwerp bevat configvariabelen;
- ontwerp beschrijft image-opslag zonder binaire bestanden in PostgreSQL;
- ontwerp beschrijft `ARTIST_IMAGE_CACHE_DIR` als centraal basispad in `.env`;
- backlog/project notes/README verwijzen naar ART-012.

Voor latere implementatie:

- Discogs disabled wanneer config ontbreekt;
- search endpoint mockt Discogs-responses;
- link endpoint overschrijft lokale artistnaam niet;
- external reference wordt correct opgeslagen;
- enrichment-cache bewaart raw/normalized data;
- voorstel voor `artiesten_spelling` wordt niet automatisch toegepast.

## 14. Niet in scope voor ART-012A

- echte Discogs API-implementatie;
- SQL-migratie;
- automatische merge;
- albums;
- MusicBrainz/Wikipedia/Wikidata;
- automatische lokale overschrijving;
- periodieke Discogs-sync.

## 15. Vervolgplanning

- **ART-012B** — Discogs artist search/detail implementatie.
- **ART-012C** — Discogs artist koppelen en enrichment-cache migratie.
- **ART-012D** — Verrijkingsvoorstellen en review/accept-flow.
- **ART-012E** — Discogs-data gebruiken als input voor duplicate scanner.
- **ART-017** — Externe artist enrichment framework voor Wikipedia/Wikidata/MusicBrainz en bronvergelijking.

## Aanvullende ontwerpregel ART-012C-Fix-3: canonical naamwijziging via artiestenspelling

Discogs artist names worden behandeld als bronvoorstellen. Een Discogs-naam mag niet rechtstreeks `artist.ar_artist_name` overschrijven, omdat de lokale canonical artist name samenhangt met `artiesten_spelling`.

Een toekomstige canonical rename moet spelling-aware zijn:

1. oude canonical naam behouden als alternatieve spelling;
2. nieuwe canonical naam controleren op unieke spellingconflicten;
3. `artist.ar_artist_name` en `artiesten_spelling` consistent bijwerken;
4. gebruiker expliciet laten bevestigen;
5. wijziging auditen.

Nieuwe backlog: **ART-012D — Discogs naamvoorstellen en artiestenspelling toepassen**.

