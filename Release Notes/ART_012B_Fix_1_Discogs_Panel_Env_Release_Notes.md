# ART-012B-Fix-1 — Discogs panel responsive layout en env-template hardening

## Aanleiding

Tijdens testen bleek het Discogs-resultatenpaneel te smal. De actieknop **Detail** was slechts deels zichtbaar. Ook moest de env-template definitief de actuele ART-012 en ART-015D variabelen bevatten.

## Wijzigingen

- Discogs-resultatenkaart spant nu de volledige relatiegrid-breedte.
- Resultatenwrapper heeft horizontale scrollruimte en extra padding onder de tabel.
- Actiekolom en detailknop hebben vaste minimale breedte.
- Lange Discogs-artiestnamen mogen afbreken.
- `.env.example` bevat de canonieke Discogs-, image-cache- en duplicate-scanner variabelen.
- `scripts/env-refresh-example.sh` genereert dezelfde canonieke `.env.example`.
- Nieuwe contracttest: `tests/art012bFix1DiscogsPanelEnv.contract.test.mjs`.

## Migratie

Geen SQL-migratie nodig.

## Validatie

Draai:

```bash
npm run test:art012b:fix1
npm run test:art012
npm run test:packaging
```
