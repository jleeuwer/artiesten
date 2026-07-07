# BL-044 Sprint 4 addendum — Embedded surface en modal overlay

## Aanleiding
Na shellstarter-validatie bleven twee visuele/UX punten openstaan:

1. resterende whitespace in de bovenhoeken en onder de tabel
2. edit modal gedroeg zich te lokaal na filter/search in plaats van als volledige overlay

## Doorgevoerde fix

### Embedded surface flattening
- embedded `artist-page-surface` is in shell-hosted mode vlakker gemaakt
- outer corner rounding is verwijderd voor embedded rendering
- extra bottom spacing onder de tabel/paginering is teruggebracht

### Modal overlay hardening
- `ArtistFormModal` gebruikt nu een expliciete modal class, dialog class en content class
- modal is nu `scrollable` en gebruikt viewport-gebaseerde max-heights
- modal body scrollt intern in plaats van visueel mee te groeien met een lokaal gefilterd contentgebied

## Resultaat
- embedded shell-hosted rendering hoort geen storende hoek-whitespace meer te tonen
- edit/add modal hoort als echte overlay binnen de iframe viewport te werken
