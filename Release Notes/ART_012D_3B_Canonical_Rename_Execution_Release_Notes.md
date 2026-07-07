# Release Notes — ART-012D-3B Canonical rename execution

## Toegevoegd

- Endpoint `POST /api/artists/:id/discogs/spelling-proposals/canonical`.
- Backendfunctie `Artist.executeDiscogsCanonicalRename`.
- UI-knop **Maak canonical** na een niet-geblokkeerde preview.
- Transactionele spelling-aware canonical rename.
- Contracttest `tests/art012d3bCanonicalRenameExecution.contract.test.mjs`.

## Belangrijk

- Geen nieuwe SQL-migratie nodig.
- `Koppel Discogs artist` blijft alleen een bronkoppeling.
- `file_details.fd_correct_artist` wordt niet automatisch herschreven.
