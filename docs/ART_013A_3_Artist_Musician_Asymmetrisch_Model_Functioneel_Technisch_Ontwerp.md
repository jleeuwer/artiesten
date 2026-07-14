# ART-013A-3 — Artist/Musician asymmetrisch model

Datum: 2026-07-12  
Status: functioneel en technisch ontwerp — gereed voor codesprint

## 1. Aanleiding

De huidige Artiesten-app behandelt `artist` en `musician` praktisch als een verplichte één-op-één-koppeling. Dit werkt voor soloartiesten, maar niet voor bandleden, sessiemuzikanten en begeleiders die wel als musicus geregistreerd moeten worden zonder als zelfstandige artiest in de artiestenlijst te verschijnen.

De bestaande tabel `musician_in_band` verwijst terecht naar `musician`. Daarom moet een bandlid kunnen bestaan als `musician` zonder verplicht `artist`-record.

## 2. Kernbesluit

Het model wordt asymmetrisch:

- iedere `artist` met `ar_artist_type = 'person'` heeft exact één gekoppelde `musician`;
- een `musician` mag nul of één gekoppelde `artist` hebben;
- niet-persoonsartists krijgen geen gekoppelde musician;
- `musician_in_band` blijft altijd verwijzen naar `musician`;
- handmatige data blijft leidend;
- externe bronnen volgen later als voorstellen, in volgorde Discogs, MusicBrainz en Wikidata.

```text
artist(type=person) 1 ───── 1 musician
                              │
                              └──── 0..n musician_in_band ───── 1 band-artist

musician → artist = 0..1
person-artist → musician = exact 1
```

## 3. Begripsafbakening

### Artist

Een zelfstandig herkenbare muziekact in de applicatie, bijvoorbeeld een soloartiest, band, duo, groep, project of alias.

### Musician

Een natuurlijk persoon die muzikaal actief is, bijvoorbeeld als bandlid, sessiemuzikant, begeleider of achtergrondzanger. Een musician hoeft geen zelfstandig artist-profiel te hebben.

## 4. Functionele scope

### 4.1 Standalone musician

De gebruiker kan een musician aanmaken zonder artist. Minimaal verplicht is de naam. Geboortedatum, sterfdatum, website en opmerkingen zijn optioneel.

Een standalone musician:

- kan aan één of meer bands worden gekoppeld;
- verschijnt niet automatisch in de algemene artistlijst;
- kan later aan een bestaande persoonsartist worden gekoppeld;
- kan later worden gepromoveerd tot nieuwe persoonsartist.

### 4.2 Nieuwe persoonsartist

Bij het aanmaken van een artist van type `person` moet de gebruiker kunnen kiezen:

1. koppel een bestaande vrije musician;
2. maak automatisch een nieuwe musician aan.

De complete actie gebeurt transactioneel. Een persoonsartist mag na commit niet zonder musician achterblijven.

### 4.3 Nieuw bandlid vanuit bandcontext

In het paneel **Bandleden** komen twee acties:

- **Bestaande musician toevoegen**;
- **Nieuw bandlid aanmaken**.

Bij **Nieuw bandlid aanmaken** worden in één flow:

1. een standalone musician aangemaakt;
2. de `musician_in_band`-relatie aangemaakt.

Er wordt geen artist aangemaakt.

### 4.4 Musician promoveren naar artist

Bij een standalone musician komt de actie **Maak ook aan als artiest**.

De gebruiker controleert naam, datums en website. Na bevestiging:

1. wordt een artist met type `person` aangemaakt;
2. wordt de bestaande musician gekoppeld;
3. blijven alle bandrelaties bestaan;
4. wordt geen tweede musician aangemaakt.

### 4.5 Bestaande artist en musician koppelen

Een persoonsartist zonder musician kan aan een vrije musician worden gekoppeld. Een musician is vrij wanneer `ar_artist_key IS NULL`.

Vooraf worden mogelijke verschillen getoond in:

- naam;
- geboortedatum;
- sterfdatum;
- website.

De gebruiker kiest expliciet of artistgegevens naar musician worden gekopieerd. Er vindt geen stille overschrijving plaats.

### 4.6 Loskoppelen

Loskoppelen is alleen toegestaan als een functionele reden wordt opgegeven. De musician blijft bestaan en behoudt bandrelaties. De artist mag na de actie niet als actieve `person` zonder musician achterblijven. Daarom zijn toegestane scenario's:

- direct opnieuw koppelen aan een andere vrije musician;
- artist type wijzigen naar niet-person;
- artist deactiveren of samenvoegen volgens bestaande flows.

Een losstaande unlink-call zonder vervolgactie wordt niet aangeboden in de normale UI.

### 4.7 Verwijderen

- een artist verwijderen verwijdert de musician niet;
- een musician met artistkoppeling kan niet worden verwijderd;
- een musician met `musician_in_band`-relaties kan niet worden verwijderd;
- deactiveren of samenvoegen heeft de voorkeur boven hard delete.

## 5. Synchronisatie

Voor gekoppelde persoonsartists blijft synchronisatie één richting:

| Artist | Musician |
|---|---|
| `ar_artist_name` | `mu_musician_name` |
| `ar_artist_dateofbirth` | `mu_musician_dateofbirth` |
| `ar_artist_passing` | `mu_musician_passing` |
| `ar_website_url` | `mu_website_url` |

Regels:

- artist is leidend voor gedeelde velden wanneer gekoppeld;
- standalone musician wordt rechtstreeks beheerd;
- musicianwijzigingen synchroniseren nooit terug naar artist;
- na loskoppelen stopt synchronisatie;
- band-, group-, duo- en trio-artists triggeren nooit musician-sync.

## 6. Datamodel

### 6.1 Bestaande koppeling behouden

De bestaande kolom blijft leidend:

```text
musician.ar_artist_key nullable
```

Betekenis:

- `NULL`: standalone musician;
- gevuld: gekoppeld aan exact één persoonsartist.

### 6.2 Eén-op-één-borging

De bestaande partial unique index blijft verplicht:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_musician_ar_artist_key_not_null
ON public.musician (ar_artist_key)
WHERE ar_artist_key IS NOT NULL;
```

### 6.3 Foreign keygedrag

De foreign key van `musician.ar_artist_key` naar `artist.ar_artist_key` moet worden geïnventariseerd. Voorkeursgedrag:

- geen cascade-delete naar musician;
- bij artist-delete wordt de koppeling gecontroleerd losgemaakt of hergericht door servicecode;
- databaseconstraint voorkomt orphan artist keys.

### 6.4 Geen extra koppeltabel

Er komt geen `artist_musician`-koppeltabel en geen tweede verwijzing `artist.ar_musician_key`. Dat zou dubbele waarheid creëren.

### 6.5 Optionele metadata

Voor concurrency en beheer kan `musician` worden uitgebreid met:

```text
mu_created_at timestamptz not null default now()
mu_updated_at timestamptz not null default now()
mu_is_active boolean not null default true
```

Alleen toevoegen wanneer preflight aantoont dat deze nog ontbreken en bestaande conventies dit ondersteunen.

## 7. Datakwaliteitsregels

De verificatie rapporteert minimaal:

- actieve persoonsartist zonder musician;
- meerdere musicians gekoppeld aan dezelfde artist;
- musician gekoppeld aan niet-persoonsartist;
- orphan `musician.ar_artist_key`;
- vermoedelijke dubbele standalone musicians;
- musician-in-band-relatie naar ontbrekende musician;
- artist/person en musician met afwijkende gedeelde gegevens;
- musician met lege of onbruikbare naam.

Standalone musicians zonder artist zijn expliciet geldig en mogen niet als fout worden gemeld.

## 8. Backendarchitectuur

### 8.1 Modules

```text
controllers/musicianController.js
controllers/artistMusicianLinkController.js
models/musicianModel.js
services/musicianService.js
services/artistMusicianLinkService.js
validators/musicianValidator.js
validators/artistMusicianLinkValidator.js
routes/musicianRoutes.js
routes/artistMusicianLinkRoutes.js
```

`musicianInBandService` blijft verantwoordelijk voor lidmaatschappen en gebruikt `musicianService` voor aanmaken/zoeken.

### 8.2 Serviceverantwoordelijkheden

#### musicianService

- standalone musician aanmaken en wijzigen;
- zoeken en detail ophalen;
- duplicate candidates bepalen;
- verwijderbaarheid controleren;
- optimistic concurrency bewaken.

#### artistMusicianLinkService

- nieuwe musician voor persoonsartist aanmaken;
- bestaande vrije musician koppelen;
- musician promoveren naar artist;
- koppeling gecontroleerd verplaatsen;
- één-op-één-regel bewaken;
- synchronisatie initialiseren.

### 8.3 API-voorstel

```text
GET    /api/musicians/search
GET    /api/musicians/:musicianKey
POST   /api/musicians
PUT    /api/musicians/:musicianKey
DELETE /api/musicians/:musicianKey

POST   /api/artists/:artistKey/musician/create
POST   /api/artists/:artistKey/musician/link
POST   /api/artists/:artistKey/musician/relink

POST   /api/musicians/:musicianKey/create-artist
POST   /api/musician-in-band/create-member
```

Een generieke onbeveiligde unlink-route wordt niet aangeboden.

### 8.4 Stabiele foutcodes

Minimaal:

```text
MUSICIAN_NOT_FOUND
ARTIST_NOT_FOUND
ARTIST_NOT_PERSON
ARTIST_ALREADY_LINKED
MUSICIAN_ALREADY_LINKED
MUSICIAN_DELETE_BLOCKED_ARTIST_LINK
MUSICIAN_DELETE_BLOCKED_BAND_RELATIONS
POSSIBLE_MUSICIAN_DUPLICATE
STALE_MUSICIAN
LINK_DATA_CONFLICT
```

## 9. Transactionele flows

### 9.1 Persoonsartist plus nieuwe musician

```text
BEGIN
create artist(type=person)
create musician(ar_artist_key=new artist)
verify exactly one link
COMMIT
```

### 9.2 Persoonsartist plus bestaande musician

```text
BEGIN
lock artist
lock musician
verify artist is person and unlinked
verify musician is free
link musician
copy approved artist fields
verify one-to-one
COMMIT
```

### 9.3 Nieuw bandlid

```text
BEGIN
create standalone musician
create musician_in_band
COMMIT
```

Fout in relatievalidatie rolt ook de nieuwe musician terug.

### 9.4 Promotie naar artist

```text
BEGIN
lock musician
verify musician is free
create artist(type=person)
link existing musician
verify one-to-one
COMMIT
```

## 10. Frontendontwerp

Binnen de Artiesten-app, maar technisch als featuremodules:

```text
client/src/features/musicians/
  MusicianSearchSelect.jsx
  MusicianFormModal.jsx
  MusicianDetailPanel.jsx
  CreateArtistFromMusicianModal.jsx
  ArtistMusicianLinkModal.jsx
  DuplicateMusicianWarning.jsx
  api.js
  validation.js
```

Aanpassingen in `musician-in-band`:

- knop **Nieuw bandlid aanmaken**;
- samengestelde musician- en relatievelden;
- duplicate waarschuwing vóór opslaan;
- na succes directe refresh van bandledenpaneel.

## 11. Migratie- en implementatiestrategie

De codesprint bevat:

1. `.env`-gestuurde preflight volgens bestaande `ARTIST_DB_*`-conventie;
2. inventarisatie van musician-schema, FK en indexen;
3. idempotente migratie voor ontbrekende constraints/metadata;
4. aangepaste create/update artist-service;
5. standalone musician API en UI;
6. create-member samengestelde flow;
7. promotie- en linkflow;
8. verify-rapportage;
9. transactionele database-integratietests;
10. regressietests voor ART-013A, ART-013A-1/2 en ART-013B-1.

## 12. Buiten scope

- Discogs, MusicBrainz en Wikidata providers;
- automatische artistcreatie vanuit externe brondata;
- generieke musician-hoofdapp;
- sessiemuzikant-op-release/trackmodellering;
- volledige musician mergefunctie;
- automatische fuzzy duplicate merge;
- bidirectionele synchronisatie.

## 13. Acceptatiecriteria

ART-013A-3 is geaccepteerd wanneer:

1. standalone musician zonder artist geldig is;
2. iedere nieuw aangemaakte persoonsartist exact één musician heeft;
3. niet-persoonsartists geen musician krijgen;
4. een nieuw bandlid vanuit bandcontext zonder artist kan worden aangemaakt;
5. bestaande bandrelaties blijven bestaan bij latere promotie naar artist;
6. een vrije musician veilig aan een persoonsartist kan worden gekoppeld;
7. dubbele één-op-één-koppelingen technisch worden geblokkeerd;
8. artist-delete geen musician of bandhistorie cascadeert;
9. synchronisatie alleen artist → gekoppelde musician blijft;
10. verificatie standalone musicians niet als fout classificeert;
11. database-integratietests transactioneel zijn en `leftovers=0` rapporteren;
12. bestaande ART-013A- en ART-013B-1-regressies blijven slagen.
