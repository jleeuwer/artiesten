# ART-UI-POLISH-1-Fix-3 — Overledenindicator in Edit-scherm

## Aanleiding
De eerdere fixes toonden de overledenstatus in de artiestenlijst, het relatie-inzicht en de aparte detail-Offcanvas. De gebruiker bedoelde met het detailscherm echter het daadwerkelijke Edit-scherm dat via de knop **Edit** wordt geopend.

## Oplossing
- Het Edit-profielhoofd toont nu een compacte badge met inline SVG-hourglass en tekst **Overleden**.
- De badge gebruikt het actuele formulierdatumveld `ar_artist_passing`, zodat de status direct verschijnt of verdwijnt wanneer de datum in het Edit-scherm wordt aangepast.
- Tooltip en `aria-label` tonen de overlijdensdatum.
- De implementatie is niet afhankelijk van Bootstrap Icons.

## Test
`npm run test:art-ui-polish1-fix3`
