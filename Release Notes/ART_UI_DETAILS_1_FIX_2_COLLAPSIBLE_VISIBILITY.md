# ART-UI-DETAILS-1 Fix 2 — Collapsible visibility

## Probleem
De open/dicht-state en het `hidden`-attribuut werden correct gezet, maar bestaande author CSS kon de standaard browserweergave van `[hidden]` overschrijven. Daardoor bleven Songs, Alternatieve spellingen, Hitlijsten en Mergehistorie zichtbaar.

## Oplossing
Voor `.artist-collapsible-section-body[hidden]` wordt expliciet `display: none !important` toegepast.

## Test
`npm run test:art-ui-details-fix2`

Geen databasewijziging vereist.
