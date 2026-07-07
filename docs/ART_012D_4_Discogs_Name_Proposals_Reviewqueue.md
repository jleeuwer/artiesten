# ART-012D-4 — Discogs naamvoorstellen reviewqueue

## Doel

Discogs aliases/name variations, real names en Discogs artist names worden niet alleen tijdelijk getoond, maar persistent opgeslagen als reviewbare naamvoorstellen.

## Functionele scope

- Voorstellen genereren vanuit de gekoppelde Discogs-cache.
- Voorstellen opslaan in `artist_name_proposals`.
- Statussen beheren: `new`, `added`, `ignored`, `conflict`, `review_later`, `existing`.
- Acties in de UI:
  - `Voeg toe als spelling`;
  - `Later`;
  - `Negeer`.
- Conflicten met bestaande `artiesten_spelling` worden zichtbaar gemaakt.

## Buiten scope

- Geen automatische canonical rename.
- Geen wijzigingen in `artist.ar_artist_name`.
- Geen automatische merge.

## Technisch

Nieuwe tabel: `artist_name_proposals`.

Nieuwe endpoints:

- `GET /api/artists/:id/discogs/name-proposals`
- `POST /api/artists/:id/discogs/name-proposals/generate`
- `PATCH /api/artists/:id/discogs/name-proposals/:proposalId/status`
- `POST /api/artists/:id/discogs/name-proposals/:proposalId/apply-spelling`

De apply-actie hergebruikt de bestaande ART-012D-2 logica voor toevoegen aan `artiesten_spelling`.
