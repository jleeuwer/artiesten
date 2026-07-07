# Release Notes — ART-012D-4 Discogs naamvoorstellen reviewqueue

## Opgeleverd

- Persistente reviewqueue voor Discogs naamvoorstellen.
- Nieuwe tabel `artist_name_proposals`.
- Queue-generatie uit Discogs-cache.
- Statusacties `Later` en `Negeer`.
- Actie `Voeg toe als spelling` met hergebruik van bestaande ART-012D-2 logic.
- Contracttest `tests/art012d4NameProposalsReviewQueue.contract.test.mjs`.

## Niet in scope

- Canonical rename vanuit de queue.
- Automatische artist-name wijzigingen.
