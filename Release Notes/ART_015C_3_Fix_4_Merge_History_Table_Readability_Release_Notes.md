# ART-015C-3-Fix-4 — Merge history tabel leesbaarheid

## Aanleiding

In het paneel **Mergehistorie** kon de horizontale scrollbar tegen de tabelinhoud aan liggen. Daardoor werd de tekst in de laatste tabelregel slecht leesbaar.

## Oplossing

- De merge-history tabel gebruikt nu een eigen scroll-wrapper: `artist-merge-history-table-wrap`.
- De scroll-wrapper heeft extra onderruimte zodat de horizontale scrollbar niet over de tekst valt.
- Tabelcellen in de merge-history tabel mogen tekst afbreken in plaats van alles op één regel te forceren.
- De impactdetails worden nu weergegeven als compacte chips/badges in plaats van als één lange tekstregel.

## Tests

Toegevoegd:

```bash
npm run test:art015c3:fix4
```

De bestaande ART-015C testsets nemen deze fix mee via:

```bash
npm run test:art015c3
npm run test:art015c
```

## Database

Geen database-migratie nodig.
