# ART-012E-1 Fix 1 — Discogs link-icoon direct verversen

Datum: 2026-06-08

## Aanleiding

Na het koppelen van een Discogs artist werd de koppeling wel opgeslagen, maar de artiestentabel toonde het Discogs-link-icoon pas na een latere refresh/herlaadactie.

## Oplossing

De frontend werkt na een succesvolle Discogs-koppeling nu direct de geselecteerde artiest en de huidige lijstregel bij met:

- `has_discogs_link = true`;
- `discogs_external_id`;
- `discogs_external_name`;
- `discogs_external_url`;
- `discogs_synced_at`.

Daarnaast ververst `loadRelations` voortaan de geselecteerde artiest en de bijbehorende lijstregel met de actuele artist payload uit de relations API.

## Functioneel resultaat

Direct na klikken op **Koppel Discogs artist** verschijnt in de artiestentabel bij de betreffende artiest het gekozen icoon:

```html
<i class="bi bi-link"></i>
```

## Test

Toegevoegd/aangescherpt contract in:

- `tests/art012e1DiscogsIconArtistType.contract.test.mjs`

Aanbevolen testcommando:

```bash
mkdir -p logs && npm run test:art012e1 2>&1 | tee "logs/test-art012e1-fix1-$(date +%Y%m%d-%H%M%S).log"
```
