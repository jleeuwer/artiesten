# ART-012D-2-Fix-1 — Actieknop voor beschikbare spellingvoorstellen

## Doel

Fix op ART-012D-2: als de backend een Discogs spellingvoorstel classificeert als `available_discogs_name` of `available_alternative_spelling`, moet de UI daadwerkelijk de knop **Voeg toe als spelling** tonen.

## Aanpassingen

- Frontend helper `isAddableDiscogsSpellingProposal` toegevoegd.
- De knop **Voeg toe als spelling** wordt nu getoond als:
  - `proposal.canAddAlternativeSpelling === true`; of
  - `proposal.action === "available_discogs_name"`; of
  - `proposal.action === "available_alternative_spelling"`.
- Knop krijgt class `artist-discogs-add-spelling-btn` en een expliciet `aria-label`.
- Niet-toepasbare voorstellen blijven **Niet toepasbaar** tonen met tooltip.
- Contracttest aangescherpt zodat deze statuswaarden expliciet worden geborgd.

## Geen databasewijziging

Er is geen SQL-migratie nodig.
