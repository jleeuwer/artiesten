# ART-UI-MSG-1 + ART-012C-UX-2

Datum: 2026-07-18

## Opgeleverd

- Centrale `AppNotification` component voor success, info, warning en danger.
- Severity-afhankelijke iconen, titels, kleuren en toegankelijke live-regio's.
- Optionele stabiele foutcode in de melding; technische details blijven buiten de gebruikersmelding.
- Bestaande undo-acties blijven ondersteund.
- Na een succesvolle Discogs-koppeling worden zoekresultaten, gekozen detail en tijdelijke linkresultaten gewist.
- Focus en scroll gaan terug naar het artiest-relatiegebied.
- Een compacte succesmelding bevestigt de koppeling.

## Database

Geen migratie nodig.

## Test

```bash
npm run test:art-ui-msg1-art012c-ux2
npm run build --prefix client
```
