# ART-012A-Fix-1 — Image-cache ontwerp en env-configuratie

Datum: 2026-06-06

## Aanleiding

Tijdens ART-012A is verduidelijkt dat Discogs artist images wel bruikbaar zijn voor UI/broncontext, maar niet als binaire bestanden in PostgreSQL moeten worden opgeslagen. Ook is besloten dat het basispad voor lokale image-cache in `.env` thuishoort, zodat migraties naar andere machines geen databasewijziging vereisen.

## Aangepast

- ART-012 ontwerpdocument uitgebreid met image-opslag en cachebeleid.
- Conceptuele tabel `artist_external_image` toegevoegd aan het ontwerp.
- `.env.example` uitgebreid met:
  - `ARTIST_IMAGE_CACHE_ENABLED=false`
  - `ARTIST_IMAGE_CACHE_DIR=data/cache/artist-images`
  - `ARTIST_IMAGE_CACHE_MAX_AGE_DAYS=30`
- Testcases/runbook uitgebreid met portable image-cache acceptatiecriteria.
- Contracttest `tests/art012Documentation.contract.test.mjs` aangescherpt.

## Besluit

- Binaire images worden niet in PostgreSQL opgeslagen.
- Database bewaart alleen externe image-URL's, bronmetadata en optionele relatieve cache-referenties.
- `ARTIST_IMAGE_CACHE_DIR` is het centrale basispad in `.env`.
- `local_cache_path` in de database is relatief ten opzichte van `ARTIST_IMAGE_CACHE_DIR`.

## Migratie

Geen SQL-migratie in deze documentatie-/ontwerpfix.
