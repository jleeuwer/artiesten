# ART-012C — Discogs artist koppelen aan lokale artist

## Doel

ART-012C voegt de eerste accept-/koppelfunctie toe aan de Discogs artist enrichment-flow. Na ART-012B kon de gebruiker Discogs artist-resultaten zoeken en details inspecteren. In ART-012C kan de gebruiker een geïnspecteerde Discogs artist bewust koppelen aan de lokale artist.

## Belangrijk ontwerpbesluit

`artist.ar_artist_key` blijft leidend binnen `musicdb`. De Discogs artist ID wordt nooit gebruikt als vervanging van de lokale sleutel.

De Discogs ID is uitsluitend een externe lookup-key om Discogs-data later opnieuw op te halen, te verversen of te vergelijken.

```text
lokale artist.ar_artist_key → externe Discogs artist ID → Discogs-data ophalen/verversen
```

De koppeling wijzigt dus niet automatisch:

- `artist.ar_artist_key`;
- `artist.ar_artist_name`;
- bestaande foreign keys in `file_details`, `hitlijsten`, `artiesten_spelling`, enzovoort.

## Functionele flow

1. Gebruiker selecteert een lokale artiest.
2. Gebruiker kiest **Zoek in Discogs**.
3. Gebruiker opent **Detail** van een Discogs-resultaat.
4. Gebruiker controleert naam, real name, profile, aliases, name variations, groups/members en images-aantallen.
5. Gebruiker kiest **Koppel Discogs artist**.
6. De backend haalt het Discogs detail opnieuw op.
7. De backend slaat de koppeling, cachedata en image-metadata op.
8. De relatiekaart toont de gekoppelde Discogs-referentie.

## Technische implementatie

### Endpoint

```text
POST /api/artists/:id/discogs/link
```

Payload:

```json
{
  "discogsArtistId": 10263
}
```

Response bevat onder andere:

- `linked: true`;
- lokale artist;
- `reference` uit `artist_external_reference`;
- `cache` uit `artist_enrichment_cache`;
- `imageCount`;
- genormaliseerde Discogs detaildata.

### Database-opslag

ART-012C gebruikt de ART-012B tabellen:

- `artist_external_reference`;
- `artist_enrichment_cache`;
- `artist_external_image`.

#### artist_external_reference

Hier wordt de actieve koppeling opgeslagen:

```text
artist_key = lokale artist.ar_artist_key
source = discogs
external_id = Discogs artist ID
external_url = Discogs artist URL
external_name = Discogs artist name
status = linked
synced_at = now()
```

Als een andere Discogs-koppeling voor dezelfde lokale artist al `linked` was, wordt die op `stale` gezet. Zo blijft duidelijk welke Discogs artist nu leidend gekoppeld is zonder historische referenties direct te verwijderen.

#### artist_enrichment_cache

Hier wordt de opgehaalde Discogs-data bewaard als bron/cache:

- `raw_data_json` bevat de ruwe brondata;
- `normalized_data_json` bevat de genormaliseerde artist-data;
- `cache_status = fetched`;
- `expires_at` wordt bepaald met `DISCOGS_CACHE_TTL_SECONDS`.

#### artist_external_image

Hier worden alleen image-metadata en URL's opgeslagen.

Binaire afbeeldingen worden niet in PostgreSQL opgeslagen. De database bevat alleen:

- externe image URL;
- bron/resource URL;
- image type;
- width/height;
- `cache_status = remote_only`;
- optionele relatieve cacheverwijzing voor latere fases.

Als lokale image-cache later wordt aangezet, blijft het basispad uit `.env` komen via `ARTIST_IMAGE_CACHE_DIR`; de database bewaart alleen relatieve paden/cachekeys.

## Bewust niet in scope

ART-012C past Discogs-data nog niet automatisch toe op lokale artist-attributen. De volgende zaken blijven vervolgitems:

- real name/profile toepassen op lokale artistdata;
- aliases/name variations voorstellen voor `artiesten_spelling`;
- Discogs groups/members gebruiken voor muzikant/band-relaties;
- images lokaal downloaden/cacheen;
- bronvergelijking met Wikipedia/Wikidata/MusicBrainz.

## Acceptatiecriteria

- De gebruiker kan een Discogs-detail bewust koppelen aan de lokale artist.
- De lokale artist key blijft ongewijzigd en leidend.
- De lokale artistnaam wordt niet automatisch overschreven.
- `artist_external_reference` bevat de gekoppelde Discogs artist met status `linked`.
- `artist_enrichment_cache` bevat raw/normalized Discogs-data.
- `artist_external_image` bevat alleen metadata/URL's, geen binaire data.
- De UI toont de gekoppelde Discogs-referentie bij de artist.


## ART-012C-Fix-2 verduidelijking

De controlequery voor `artist_enrichment_cache` moet `fetched_at` gebruiken. Het veld `synced_at` hoort bij `artist_external_reference` en is daar het moment van koppeling/synchronisatie van de externe referentie.

`Koppel Discogs artist` betekent: externe Discogs-brondata bewaren en vindbaar maken. Het betekent niet dat de lokale artistnaam automatisch wordt overschreven.

## ART-012C-Fix-3 ontwerpregel: Discogs-naam is voorstel

De Discogs artist name is een voorstel en nooit een directe overwrite van `artist.ar_artist_name`.

De reden is dat de lokale canonical artist name onderdeel is van het spelling-/mappingmodel:

```text
artist.ar_artist_name
↔ artiesten_spelling.as_alternatieve_spelling
↔ artiesten_spelling.as_artist_key
```

`Koppel Discogs artist` mag daarom alleen de externe Discogs-bron koppelen en brondata/cachemetadata opslaan. De actie mag de lokale artistnaam niet wijzigen.

Als de Discogs-naam afwijkt van de lokale canonical naam, dan moet een toekomstige spelling-aware flow dit afhandelen via `artiesten_spelling`. Die flow moet minimaal:

- de oude canonical naam behouden of toevoegen als alternatieve spelling;
- de nieuwe canonical naam alleen na expliciete bevestiging toepassen;
- de nieuwe canonical naam borgen in `artiesten_spelling`;
- conflicten controleren op `artiesten_spelling.as_alternatieve_spelling`;
- de wijziging auditen.

Voor ART-012C blijft dus gelden: koppelen is externe-bronregistratie, geen canonical rename.

