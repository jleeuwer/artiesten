# ART-UI-POLISH-1-Fix-4 — Testcontract compatibiliteit

Datum: 2026-07-11

## Aanleiding

Na Fix-3 faalde `npm run test:all` in de oudere ART-012E-2-contracttest. De productiecode was functioneel correct, maar de test verwachtte exact de oude JSX-aanroep van `ArtistProfileHeader` zonder aanvullende props.

Fix-3 voegde terecht toe:

```jsx
passingDate={form.ar_artist_passing}
```

Hierdoor kon de overledenindicator in het Edit-scherm direct reageren op het actuele formulierdatumveld.

## Oplossing

De ART-012E-2-test controleert voortaan afzonderlijk dat:

- `ArtistProfileHeader` wordt gebruikt;
- `artist`, `relations` en `loading` worden doorgegeven;
- de nieuwe `passingDate`-prop wordt doorgegeven.

De test matcht niet langer de volledige JSX-aanroep als één exacte tekstregel. Daardoor blijven toekomstige, niet-brekende aanvullende props mogelijk zonder de historische profielimage-test onterecht te laten falen.

## Functionele impact

Geen wijziging aan runtimecode, database of API. Alleen het automatische regressietestcontract is gecorrigeerd.
