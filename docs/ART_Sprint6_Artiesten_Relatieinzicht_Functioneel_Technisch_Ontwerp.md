# ART Sprint 6 — Artiesten relatie-inzicht, gewicht, favorieten en merge-voorbereiding

Laatste bijgewerkt: 2026-05-18

## 1. Doel van deze sprintuitwerking

Deze sprint is een functionele en technische ontwerpsprint voor de volgende uitbreiding van de Artiesten-app. De sprint bouwt voort op de release-hygiëne uit Sprint 5 en scherpt de requirements aan voor:

- artiestgewicht / belangrijkheid op basis van gekoppelde songs;
- favorieten markeren en filteren;
- een read-only relatiepaneel onderaan het artiestenscherm;
- voorbereiding op Discogs artist enrichment;
- voorbereiding op muzikant-, band- en albumrelaties;
- voorbereiding op artiesten ontdubbelen / samenvoegen.

De scope van deze sprintuitwerking is bewust nog geen volledige implementatie van Discogs, albums of merge-acties. Die onderwerpen raken datamodel, datakwaliteit en bulkmutaties en moeten per vervolg-sprint nader worden uitgewerkt.

## 2. Functionele uitgangspunten

### 2.1 Requirements worden per sprint aangescherpt

Voor de Artiesten-app geldt vanaf deze sprint expliciet:

- requirements worden per sprint eerst in dialoog aangescherpt;
- grote datamodelkeuzes worden niet impliciet meegenomen in een code-sprint;
- bij relaties tussen artiesten moet alvast rekening worden gehouden met albums;
- albums worden nog niet gebouwd in Sprint 6, maar toekomstige integratie mag niet worden geblokkeerd door keuzes in het schermontwerp.

### 2.2 Artiest als beheerobject

De huidige `artist`-tabel blijft voorlopig de centrale entiteit voor canonical artiesten. De app beheert en toont de artiest zoals die in de database wordt gebruikt via `artist_key` / `ar_artist_key`.

Belangrijke bestaande relaties:

- `file_details.fd_artist_key` verwijst naar de artiest;
- `artiesten_spelling.as_artist_key` verwijst naar de artiest;
- hitlijstvoorkomen kunnen voorlopig worden afgeleid uit `file_details.fd_hitlijst`.

Toekomstige relaties:

- albums;
- album-artiesten;
- album-tracks;
- Discogs artist links;
- muzikant/band/alias-relaties;
- merge-history.

## 3. Sprint 6 functionele scope

### 3.1 Artiestgewicht / belangrijkheid

De gebruiker wil kunnen zien welke artiesten zwaarder of belangrijker zijn in de collectie. De aangescherpte definitie is gebaseerd op unieke songtitels in `file_details`, zodat meerdere versies van hetzelfde liedje het gewicht niet kunstmatig ophogen.

#### Eerste definitie

```text
artist_weight = count(distinct lower(trim(fd_tag_title))) where fd_artist_key = artist.ar_artist_key and (fd_action is null or lower(fd_action) <> 'delete')
```

#### Aanvullende meetwaarden

Naast `artist_weight` kunnen deze velden nuttig zijn:

```text
version_count             = totaal aantal niet-verwijderde file_details records / versies
artist_weight             = aantal unieke titels via count(distinct lower(trim(fd_tag_title)))
hitlijst_count            = aantal unieke fd_hitlijst waarden
spelling_count            = aantal gekoppelde artiesten_spelling records
```

#### UI

In de artiestenlijst komen kolommen of badges voor:

- aantal unieke titels;
- aantal hitlijsten;
- aantal spellingen;
- favoriet-status.

#### Sortering

Minimale sorteeropties:

- artiestnaam A-Z;
- artiestnaam Z-A;
- gewicht hoog-laag;
- gewicht laag-hoog;
- favorieten eerst, daarna gewicht, daarna artiestnaam.

Aanbevolen default:

```text
favorieten eerst → hoogste gewicht → artiestnaam A-Z
```

### 3.2 Favoriete artiesten

De gebruiker wil artiesten kunnen markeren als favoriet en daarop filteren.

#### Functionele flow

1. Gebruiker ziet een ster-icoon bij een artiest.
2. Gebruiker klikt op de ster om favoriet aan/uit te zetten.
3. De lijst wordt bijgewerkt zonder de context kwijt te raken.
4. Gebruiker kan filteren op alleen favorieten.
5. Favorieten kunnen ook in sortering prioriteit krijgen.

#### Datamodel-opties

Optie A — boolean op `artist`:

```sql
ALTER TABLE artist
ADD COLUMN ar_is_favorite boolean NOT NULL DEFAULT false;
```

Optie B — aparte tabel:

```sql
CREATE TABLE artist_favorites (
  artist_key bigint PRIMARY KEY REFERENCES artist(ar_artist_key),
  created_at timestamptz NOT NULL DEFAULT now(),
  note text
);
```

#### Advies

Voor een eerste single-user beheerapp is optie A eenvoudiger. Als Shellstarter later multi-user favorieten krijgt, is optie B beter. De technische sprint moet daarom eerst controleren of favorieten persoonlijk of algemeen voor de database moeten zijn.

Voor nu is de functionele default:

```text
Favoriet is een algemene markering op artist-niveau, niet user-specifiek.
```

### 3.3 Read-only split-screen / relatiepaneel onderaan

Als de gebruiker een artiest selecteert, toont de app onderaan een read-only relatiepaneel.

#### Eerste indeling

```text
[ File details ] [ Artiesten spelling ] [ Hitlijsten ]
```

#### Toekomstig uitbreidbaar naar

```text
[ File details ] [ Artiesten spelling ] [ Hitlijsten ] [ Albums ] [ Discogs ] [ Relaties ]
```

Een tab-layout is waarschijnlijk schaalbaarder dan drie vaste kolommen zodra albums, Discogs en relaties worden toegevoegd. Voor Sprint 6 kan een split-screen met tabs of panelen worden ontworpen, mits uitbreidbaar.

### 3.4 Paneel links — File details

Doel: tonen welke songs/versies aan de artiest gekoppeld zijn. Geen editfunctie, want beheer van file details bestaat elders.

Voorstel kolommen:

```text
fd_key
fd_tag_title
fd_file_name
fd_hitlijst
fd_action
fd_duration
fd_year_song_publish
fd_year_song_version
fd_discogs
```

Voor een eerste compacte versie:

```text
Titel
Bestandsnaam
Hitlijst
Actie
Duur
Jaar origineel
Jaar versie
```

### 3.5 Paneel midden — Artiesten spelling

Doel: tonen welke alternatieve spellingen aan de artiest gekoppeld zijn. Geen editfunctie in Sprint 6.

Voorstel kolommen:

```text
as_alternatieve_spelling
as_artist_key
canonical artist name
```

Als timestamps of bronvelden bestaan, kunnen die later worden toegevoegd.

### 3.6 Paneel rechts — Hitlijsten

Doel: tonen in welke hitlijsten de artiest voorkomt.

Eerste afleiding via `file_details.fd_hitlijst`:

```sql
SELECT fd_hitlijst, COUNT(*) AS aantal
FROM file_details
WHERE fd_artist_key = $1
GROUP BY fd_hitlijst
ORDER BY fd_hitlijst;
```

Mogelijke kolommen:

```text
Hitlijst
Aantal songs/versies
Eerste jaar / laatste jaar, indien betrouwbaar beschikbaar
```

Omdat hitlijstmetadata mogelijk in andere tabellen staat, blijft Sprint 6 read-only en afgeleid uit beschikbare `file_details` gegevens.

## 4. Nieuwe/uitgebreide backlog-items

### ART-008 — Artiesten relatie-inzicht, gewicht en sortering

Uitbreiding van bestaand item.

Scope:

- bereken `artist_weight` uit `file_details`;
- toon aantallen in lijst;
- sorteer op gewicht;
- toon read-only relatiepaneel;
- toon file_details, spellingen en hitlijsten;
- ontwerp uitbreidbaar voor albums.

### ART-009 — Artiesten spelling inzicht

Uitbreiding van bestaand item.

Scope:

- toon alle gekoppelde alternatieve spellingen read-only;
- bepaal later of muteren in deze app komt of in Coretables blijft.

### ART-011 — Favoriete artiesten

Nieuw item.

Scope:

- artiest als favoriet markeren;
- favoriet verwijderen;
- filter alleen favorieten;
- sortering met favorieten eerst.

### ART-012 — Discogs artist enrichment

Nieuw item.

Scope later:

- Discogs artist zoeken;
- kandidaten tonen;
- Discogs artist detail inspecteren;
- gekozen Discogs artist koppelen;
- evalueren welke Discogs data structureel wordt opgeslagen.

### ART-013 — Muzikant / artiest / band / album relaties

Nieuw episch item.

Scope later:

- uitwerken of `artist` een type krijgt of dat aparte entiteiten nodig zijn;
- modelleren van solo-artiest, muzikant/zanger/zangeres, band/groep, alias/project;
- relaties tussen personen en bands;
- albums expliciet meenemen;
- voorbereiden op album-artiest en track-artiest relaties.

### ART-014 — Albums in musicdb functioneel uitwerken

Nieuw item.

Scope later:

- albumtabellen ontwerpen;
- relatie met Discogs release/master bepalen;
- koppeling album ↔ tracks ↔ file_details bepalen;
- compilaties en meerdere artiesten per album ondersteunen;
- trackvolgorde, label, land, catalogusnummer en releasejaar onderzoeken.

### ART-015 — Artiesten ontdubbelen / samenvoegen

Nieuw item.

Scope later:

- redundante artiest kiezen;
- vervangende/canonical artiest kiezen;
- alle verwijzingen naar redundante `artist_key` zoeken;
- impactoverzicht tonen;
- na akkoord alle verwijzingen transactiegewijs vervangen;
- merge-history/audit vastleggen;
- bepalen wat met redundante artist-record gebeurt.

## 5. Technisch ontwerp Sprint 6

### 5.1 Backend endpoints

Voor implementatie van Sprint 6 worden deze endpoints voorgesteld.

#### Lijst met statistieken

```http
GET /api/artists?search=&sort=weight_desc&favoritesOnly=false
```

Response bevat naast bestaande artistvelden ook:

```json
{
  "ar_artist_key": 123,
  "ar_artist_name": "Queen",
  "ar_is_favorite": true,
  "file_details_count": 42,
  "keep_file_details_count": 40,
  "hitlijst_count": 8,
  "spelling_count": 5
}
```

#### Favoriet togglen

```http
PATCH /api/artists/:id/favorite
```

Body:

```json
{
  "isFavorite": true
}
```

#### Relatie-overzicht voor geselecteerde artiest

```http
GET /api/artists/:id/relations
```

Response:

```json
{
  "artist": {
    "ar_artist_key": 123,
    "ar_artist_name": "Queen"
  },
  "summary": {
    "fileDetailsCount": 42,
    "spellingCount": 5,
    "hitlijstCount": 8
  },
  "fileDetails": [],
  "spellings": [],
  "hitlijsten": []
}
```

### 5.2 Querystrategie

De artist list kan met aggregaties worden verrijkt. Een eerste queryvorm:

```sql
SELECT
  a.ar_artist_key,
  a.ar_artist_name,
  COALESCE(a.ar_is_favorite, false) AS ar_is_favorite,
  COUNT(fd.fd_key) AS file_details_count,
  COUNT(fd.fd_key) FILTER (WHERE COALESCE(fd.fd_action, '') <> 'Delete') AS keep_file_details_count,
  COUNT(DISTINCT fd.fd_hitlijst) FILTER (WHERE fd.fd_hitlijst IS NOT NULL) AS hitlijst_count,
  COUNT(DISTINCT s.as_alternatieve_spelling) AS spelling_count
FROM artist a
LEFT JOIN file_details fd ON fd.fd_artist_key = a.ar_artist_key
LEFT JOIN artiesten_spelling s ON s.as_artist_key = a.ar_artist_key
GROUP BY a.ar_artist_key, a.ar_artist_name, a.ar_is_favorite;
```

Let op: door dubbele joins kan telling worden vermenigvuldigd. In implementatie moet dit worden opgelost met subqueries/CTE's per bron of `COUNT(DISTINCT ...)` waar betrouwbaar. Voor performance en juistheid is CTE-aanpak aanbevolen.

### 5.3 Aanbevolen CTE-query voor statistieken

```sql
WITH fd_stats AS (
  SELECT
    fd_artist_key AS artist_key,
    COUNT(*) AS file_details_count,
    COUNT(*) FILTER (WHERE COALESCE(fd_action, '') <> 'Delete') AS keep_file_details_count,
    COUNT(DISTINCT fd_hitlijst) FILTER (WHERE fd_hitlijst IS NOT NULL) AS hitlijst_count
  FROM file_details
  GROUP BY fd_artist_key
), spelling_stats AS (
  SELECT
    as_artist_key AS artist_key,
    COUNT(*) AS spelling_count
  FROM artiesten_spelling
  GROUP BY as_artist_key
)
SELECT
  a.ar_artist_key,
  a.ar_artist_name,
  COALESCE(a.ar_is_favorite, false) AS ar_is_favorite,
  COALESCE(fd_stats.file_details_count, 0) AS file_details_count,
  COALESCE(fd_stats.keep_file_details_count, 0) AS keep_file_details_count,
  COALESCE(fd_stats.hitlijst_count, 0) AS hitlijst_count,
  COALESCE(spelling_stats.spelling_count, 0) AS spelling_count
FROM artist a
LEFT JOIN fd_stats ON fd_stats.artist_key = a.ar_artist_key
LEFT JOIN spelling_stats ON spelling_stats.artist_key = a.ar_artist_key;
```

### 5.4 Databasemigratie voor favorieten

Als gekozen wordt voor de simpele artist-kolom:

```sql
ALTER TABLE artist
ADD COLUMN IF NOT EXISTS ar_is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_artist_is_favorite
ON artist(ar_is_favorite);
```

Als multi-user later belangrijk wordt, kan dit worden vervangen of uitgebreid met een aparte favorietentabel.

### 5.5 UI-componenten

Voorstel componenten:

```text
ArtistPageContent
├── ArtistToolbar
│   ├── Search input
│   ├── Sort select
│   └── Favorites-only toggle
├── ArtistTable
│   ├── FavoriteStarButton
│   └── Weight/Counts columns
└── ArtistRelationPanel
    ├── ArtistRelationSummary
    ├── FileDetailsReadOnlyTable
    ├── ArtistSpellingsReadOnlyTable
    └── HitlijstenReadOnlyTable
```

### 5.6 UX-regels

- Selectie van een artiest blijft behouden na favoriet-toggle indien mogelijk.
- Relatiepaneel toont loading/error/empty states per tab of kolom.
- Grote aantallen `file_details` worden gepagineerd of beperkt met een duidelijke `toon meer`-optie.
- Geen editknoppen in de read-only relatiepanelen.
- Later doorklikken naar Coretables/File Details mag, maar is niet nodig in Sprint 6.

## 6. Technische voorbereiding ART-015 merge

Artist merge is nog geen Sprint 6 implementatie, maar het relatiepaneel vormt de basis voor impactdenken.

### 6.1 Verwachte merge-flow

1. Kies redundante artiest.
2. Kies vervangende artiest.
3. Scan databaseverwijzingen naar redundante `artist_key`.
4. Toon impactoverzicht.
5. Vraag expliciete bevestiging.
6. Update alle verwijzingen binnen één database-transactie.
7. Leg audit/history vast.
8. Markeer redundante artiest als merged of soft delete.

### 6.2 Impactoverzicht

Minimaal tonen:

```text
Tabel
Kolom
Aantal records
Actie
```

Waar zinvol ook extractievelden.

Voor `file_details`:

```text
fd_key
fd_tag_title
fd_file_name
fd_hitlijst
fd_action
fd_year_song_publish
fd_year_song_version
```

Voor `artiesten_spelling`:

```text
as_alternatieve_spelling
as_artist_key
```

### 6.3 Veiligheidsregels

- Redundante en vervangende artiest mogen niet hetzelfde zijn.
- Merge moet transactiegewijs worden uitgevoerd.
- Conflicten met unieke constraints moeten vooraf worden gedetecteerd.
- Er moet een auditrecord zijn voordat of tegelijk met de mutatie wordt uitgevoerd.
- Bij twijfel geen automatische hard delete van redundante artiest.

## 7. Acceptatiecriteria Sprint 6 implementatie

Wanneer Sprint 6 later naar code gaat, gelden deze criteria.

### Functioneel

- Artiestenlijst toont gewicht/aantallen.
- Artiestenlijst kan sorteren op gewicht en naam.
- Artiesten kunnen als favoriet worden gemarkeerd.
- Favorietenfilter werkt.
- Selectie van een artiest toont onderaan read-only relaties.
- File details-paneel toont gekoppelde records.
- Spellingen-paneel toont gekoppelde alternatieve spellingen.
- Hitlijsten-paneel toont hitlijstvoorkomen.
- UI is uitbreidbaar met Albums-tab/paneel.

### Technisch

- Nieuwe query's veroorzaken geen foutieve tellingen door join-vermenigvuldiging.
- Favoriet-mutatie is gevalideerd en geeft 404 bij onbekende artiest.
- Relation endpoint geeft empty arrays terug bij geen relaties.
- Tests dekken sorting, favorieten en relatie-response af.
- Documentatie is bijgewerkt.
- Release-ZIP blijft schoon volgens Sprint 5-regels.

## 8. Open vragen voor requirementsdialoog vóór code

1. Is favoriet algemeen voor iedereen of later per Shellstarter-gebruiker?
2. Welke default sortering wil je precies?
3. Moeten `fd_action = 'Delete'` records meetellen in artist_weight, of apart zichtbaar zijn?
4. Wil je het onderste relatiepaneel als drie kolommen of als tabs?
5. Hoeveel `file_details` records wil je maximaal direct tonen?
6. Moet het hitlijstenpaneel alleen uit `file_details.fd_hitlijst` komen of ook uit hitlijst-tabellen?
7. Wil je bij file_details in het relatiepaneel ook `fd_discogs` tonen?
8. Moet de merge-functionaliteit een aparte menuactie worden of onderdeel van een detail/maintenance-scherm?
9. Moet de redundante artiest na merge soft deleted, gemarkeerd als merged, of hard deleted worden?
10. Welke albuminformatie wil je uiteindelijk vanuit de artiest kunnen zien?

## 9. Voorgestelde vervolgstappen

1. Requirementsdialoog Sprint 6 afronden op bovenstaande open vragen.
2. Daarna code-sprint voor ART-008/ART-011 uitvoeren.
3. Daarna aparte ontwerpsprint voor ART-015 artist merge.
4. Daarna pas Discogs artist enrichment en album/muzikant/band datamodel verder uitwerken.

## 10. Implementatiestatus Sprint 6

Deze sprint is na de ontwerpuitwerking geïmplementeerd als code-sprint.

### Backend

Nieuwe en aangepaste onderdelen:

- `models/artist.js`
  - voegt aggregaties toe voor `artist_weight`, `hitlijst_count` en `spelling_count`;
  - ondersteunt sortering via `sort` queryparameter;
  - ondersteunt `favoriteOnly` filtering;
  - bevat `setFavorite(id, favorite)`;
  - bevat `getRelations(id)`.
- `controllers/artistController.js`
  - bevat `setFavorite` handler;
  - bevat `getRelations` handler;
  - verwerkt `favoriteOnly` en `sort` in list requests.
- `routes/artistRoutes.js`
  - `GET /api/artists/:id/relations`;
  - `PATCH /api/artists/:id/favorite`.

### Database

Nieuwe migratie:

```bash
scripts/sql/20260519_artists_sprint6_favorites.sql
```

Deze voegt veilig toe:

```sql
ALTER TABLE public.artist
  ADD COLUMN IF NOT EXISTS ar_is_favorite boolean NOT NULL DEFAULT false;
```

En maakt een index voor favoriet/filter/sort-gebruik.

### Frontend

Nieuwe UI in `client/src/components/ArtistPageContent.jsx`:

- favoriet-ster per artiest;
- filter `Alleen favorieten`;
- sorteerkeuze;
- kolommen voor gewicht, hitlijsten en spellingen;
- geselecteerde rij;
- read-only relatiepaneel met `file_details`, `artiesten_spelling` en hitlijsten.

### Bewuste beperking

Het relatiepaneel is read-only. Bewerken van `file_details`, spellingen, hitlijsten, albums of Discogs-data blijft buiten scope van Sprint 6.
