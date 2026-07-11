# ART-012D-4-Fix-1 — Testcases en runbook

## Migratie

```bash
mkdir -p logs && npm run db:migrate:art012d4:fix1 2>&1 | tee "logs/db-migrate-art012d4-fix1-$(date +%Y%m%d-%H%M%S).log"
```

## Tests

```bash
mkdir -p logs && npm run test:art012d4:fix1 2>&1 | tee "logs/test-art012d4-fix1-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012d4 2>&1 | tee "logs/test-art012d4-all-fix1-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012d4-fix1-regression-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele test

1. Open een artiest met Discogs-koppeling.
2. Genereer de Discogs naamvoorstellen queue.
3. Filter op `new` en controleer de teller.
4. Zoek op een deel van een voorstelnaam.
5. Zet een voorstel op **Later**.
6. Heropen het voorstel.
7. Zet een voorstel op **Negeer**.
8. Heropen het voorstel.
9. Voeg een voorstel toe als spelling.
10. Controleer dat het spellingpaneel direct is bijgewerkt.
11. Test een voorstel dat al bij een andere artiest bestaat en controleer dat **Voeg toe als spelling** niet beschikbaar is.

## Fix-2: migratievolgorde guard

Als `public.artist_name_proposals` nog niet bestaat, voert `npm run db:migrate:art012d4:fix1` nu automatisch eerst de ART-012D-4-basismigratie uit. Je hoeft dus niet handmatig eerst `npm run db:migrate:art012d4` te draaien.

```bash
mkdir -p logs && npm run db:migrate:art012d4:fix1 2>&1 | tee "logs/db-migrate-art012d4-fix1-$(date +%Y%m%d-%H%M%S).log"
```
