# ART-015C-2-Fix-1 — Favorieteniconen zichtbaar in artiestenlijst

Datum: 2026-05-25

## Aanleiding

Na ART-015C-2 bleek dat de afgesproken favorieteniconen niet zichtbaar waren in de artiestenlijst.

## Oorzaak

De component bevatte wel de Bootstrap Icons class-namen, maar de zichtbare rendering was onvoldoende geborgd. De productiebuild in `public/app` was bovendien opnieuw opgebouwd nodig om de actuele frontend-code te bevatten.

## Wijzigingen

- De favorietenknop in de artiestenlijst gebruikt expliciet:
  - favoriet: `<i class="bi bi-star-fill" aria-hidden="true"></i>`
  - niet favoriet: `<i class="bi bi-star" aria-hidden="true"></i>`
- De knop heeft toegankelijke labels:
  - `Verwijder uit favorieten`
  - `Markeer als favoriet`
- Er is een CSS-fallback toegevoegd in `client/src/app.css`, zodat de Bootstrap Icons-compatible classes zichtbaar renderen zonder dat de release-ZIP icon-fontbestanden hoeft mee te leveren.
- De productiebuild in `public/app` is opnieuw opgebouwd.
- De ART-015C-2 contracttest controleert nu expliciet:
  - de JSX-rendering in de artiestenlijst;
  - `aria-label` en `title`;
  - de CSS-fallback voor `bi-star` en `bi-star-fill`.

## Validatie

Uitgevoerd:

```bash
npm run test:art015c2
npm run build
```

Aanbevolen lokaal na uitpakken:

```bash
npm run install:all
npm run test:unit
npm run test:sprint4
npm run build
```
