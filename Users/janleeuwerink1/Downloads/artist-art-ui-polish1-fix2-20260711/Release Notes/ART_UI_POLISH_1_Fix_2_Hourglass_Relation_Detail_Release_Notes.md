# ART-UI-POLISH-1-Fix-2 — Betrouwbaar hourglass en indicator in Relatie-inzicht

Datum: 2026-07-11

## Bevindingen

- De tabelindicator gebruikte `bi bi-hourglass-bottom` en was daarmee afhankelijk van een Bootstrap Icons-font dat in deze applicatie niet als dependency is geïnstalleerd. Daardoor kon een ander of leeg symbool verschijnen.
- De eerdere fix plaatste de detailbadge uitsluitend in de rechter detail-Offcanvas. Het vaste detailgedeelte **Relatie-inzicht** onder de artiestenlijst bevatte nog geen overledenindicator.

## Oplossing

- Vervang het font-icoon door een ingebouwd inline SVG-hourglass.
- Gebruik één herbruikbare `DeceasedStatusBadge` voor alle renderlocaties.
- Toon de status op drie plekken:
  1. compact in de artiestentabel;
  2. naast de artiestennaam in Relatie-inzicht;
  3. naast de artiestennaam in de detail-Offcanvas.
- Tooltip en `aria-label` bevatten de overlijdensdatum.
- Geen database- of API-wijziging nodig.

## Tests

- `npm run test:art-ui-polish1`: 64/64 geslaagd (58 bestaande + 6 Fix-2).
- `npm run test:artui1a`: 4/4 geslaagd.
- `npm run test:art012e2`: 4/4 geslaagd.
- `npm run build`: geslaagd.
