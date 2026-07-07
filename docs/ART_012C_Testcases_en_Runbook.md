# ART-012C — Testcases en runbook

## Voorwaarden

ART-012B migratie moet toegepast zijn:

```bash
npm run db:migrate:art012b
```

Discogs-configuratie in `.env`:

```env
DISCOGS_USER_TOKEN=<eigen token>
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
```

## Handmatige test

1. Start de app.
2. Selecteer een artiest.
3. Kies **Zoek in Discogs**.
4. Kies **Detail** bij het juiste Discogs-resultaat.
5. Controleer de detaildata.
6. Kies **Koppel Discogs artist**.
7. Controleer dat een succesmelding verschijnt.
8. Controleer dat de relatiekaart nu **Gekoppelde Discogs-referentie** toont.
9. Controleer in de database:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select reference_id, artist_key, source, external_id, external_name, status, synced_at
from artist_external_reference
where lower(source) = 'discogs'
order by updated_at desc
limit 10;
"
```

Cachecontrole:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select cache_id, artist_key, source, external_id, cache_status, fetched_at, expires_at
from artist_enrichment_cache
where lower(source) = 'discogs'
order by fetched_at desc
limit 10;
"
```

Image-metadata controle:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select image_id, artist_key, source, image_type, external_image_url, cache_status, local_cache_path
from artist_external_image
where lower(source) = 'discogs'
order by created_at desc
limit 10;
"
```

## Automatische tests

```bash
npm run test:art012c
npm run test:art012
```

## Verwacht gedrag

- Discogs ID vervangt nooit `artist.ar_artist_key`.
- Artistnaam wordt niet automatisch overschreven.
- Er wordt alleen externe referentie/cachemetadata opgeslagen.
- Images worden niet als binaire data in PostgreSQL opgeslagen.


## ART-012C-Fix-2 controle: tijdvelden

Gebruik bij `artist_external_reference` het veld `synced_at`: dit is het moment waarop de externe Discogs-referentie is gekoppeld of gesynchroniseerd.

Gebruik bij `artist_enrichment_cache` het veld `fetched_at`: dit is het moment waarop Discogs-brondata is opgehaald en in de cache is opgeslagen. Deze tabel heeft geen kolom `synced_at`.

Gebruik bij `artist_external_image` `created_at`/`updated_at` voor image-metadata. Binaire afbeeldingen worden niet in PostgreSQL opgeslagen.

Na **Koppel Discogs artist** verwacht je records in:

- `artist_external_reference`;
- `artist_enrichment_cache`;
- `artist_external_image`, als Discogs image metadata levert.

## ART-012C-Fix-3 test: Discogs-naamvoorstel en artiestenspelling

Acceptatiecriteria:

- De UI meldt expliciet dat Discogs-namen voorstellen zijn.
- `Koppel Discogs artist` wijzigt `artist.ar_artist_name` niet.
- Documentatie benoemt dat canonical naamwijzigingen via `artiesten_spelling` moeten lopen.
- Een toekomstige spelling-aware rename-flow moet oude canonical naam bewaren, nieuwe canonical naam borgen en conflicten op `artiesten_spelling.as_alternatieve_spelling` controleren.

Handmatige controle:

1. Open een artiest en zoek in Discogs.
2. Open een Discogs-detail waarvan de naam afwijkt van de lokale naam.
3. Controleer dat de UI aangeeft dat koppelen geen lokale artistnaam overschrijft.
4. Klik **Koppel Discogs artist**.
5. Controleer dat `artist.ar_artist_name` gelijk blijft.
6. Controleer dat de externe referentie/cachetabellen wel zijn gevuld.

