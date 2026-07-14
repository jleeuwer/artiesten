# Release notes — ART-012D-1 Discogs spellingvoorstellen read-only

## Inhoud

Deze release implementeert de eerste stap van ART-012D: Discogs naamvoorstellen ophalen en tonen zonder mutaties.

## Toegevoegd

- Endpoint `GET /api/artists/:id/discogs/spelling-proposals`.
- Backendfunctie `Artist.getDiscogsSpellingProposals`.
- UI-sectie **Discogs naamvoorstellen**.
- Classificatie van voorstellen als beschikbaar, bestaand of conflict.
- Contracttest `tests/art012d1Implementation.contract.test.mjs`.

## Geen migratie

Er is geen nieuwe SQL-migratie nodig bovenop ART-012B.

## Niet in scope

- Toevoegen aan `artiesten_spelling`.
- Canonical rename.
- Automatische wijzigingen op basis van Discogs.
