# ART-012D-4 — Testcases en runbook

## Migratie

```bash
mkdir -p logs && npm run db:migrate:art012d4 2>&1 | tee "logs/db-migrate-art012d4-$(date +%Y%m%d-%H%M%S).log"
```

## Tests

```bash
mkdir -p logs && npm run test:art012d4 2>&1 | tee "logs/test-art012d4-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012d4-regression-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele test

1. Open een artiest met Discogs-koppeling.
2. Klik op `Genereer queue` bij Discogs naamvoorstellen reviewqueue.
3. Controleer dat aliases/name variations persistent zichtbaar worden.
4. Klik `Later` bij een voorstel en controleer dat status wijzigt.
5. Klik `Negeer` bij een voorstel en controleer dat status wijzigt.
6. Klik `Voeg toe als spelling` bij een nieuw voorstel.
7. Controleer dat de spelling in `artiesten_spelling` staat en dat de voorstelstatus `added` wordt.
