# ART-UI-DETAILS-1 Fix 3

## Probleem
De secties Songs, Alternatieve spellingen, Hitlijsten en Mergehistorie bleven bij de gebruiker zichtbaar, ondanks de eerdere hidden/CSS-fix.

## Oorzaak en aanpak
De eerdere implementatie vertrouwde nog op het HTML-attribuut `hidden`. Om iedere invloed van globale CSS, Bootstrap of browserweergave uit te sluiten, wordt de inhoud van een gesloten sectie nu conditioneel helemaal niet meer in de DOM gerenderd.

## Wijziging
- `CollapsibleRelationSection` rendert de body alleen wanneer `open === true`.
- Het attribuut `hidden={!open}` is verwijderd.
- Een regressietest borgt dat gesloten inhoud niet in de DOM kan blijven staan.
- De productiebuild in `public/app` is opnieuw opgebouwd.

## Database
Geen schemawijziging en geen migratie nodig.
