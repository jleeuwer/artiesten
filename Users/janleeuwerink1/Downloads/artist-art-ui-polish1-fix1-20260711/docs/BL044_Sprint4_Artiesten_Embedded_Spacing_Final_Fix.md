# BL-044 Sprint 4 — Artiesten embedded spacing final fix

## Aanleiding
Na inspectie van het gerenderde HTML-fragment bleek de embedded root nog steeds de Bootstrap class `py-4` te dragen. Daardoor bleef verticale ruimte bestaan onder de embedded content, ook wanneer andere embedded CSS-regels al waren aangescherpt.

## Root cause
De root wrapper in `ArtistPageContent.jsx` gebruikte nog steeds `py-4` voor zowel standalone als embedded rendering. In embedded mode veroorzaakte dat extra top/bottom padding die zichtbaar bleef onder de paginering.

## Doorgevoerde fix
- `py-4` wordt nu alleen nog buiten embedded mode toegepast
- extra regressietest toegevoegd voor embedded spacing contract

## Verwacht resultaat
- geen resterende Bootstrap vertical padding meer op de embedded root
- witte restruimte onder de embedded Artiesten-content hoort verder af te nemen of te verdwijnen
