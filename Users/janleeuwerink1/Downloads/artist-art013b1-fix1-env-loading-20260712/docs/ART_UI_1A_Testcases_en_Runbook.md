# ART-UI-1A — Testcases en runbook

## Commands

```bash
mkdir -p logs && npm run test:artui1a 2>&1 | tee "logs/test-artui1a-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-artui1a-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run build 2>&1 | tee "logs/build-artui1a-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele test

1. Open de Artiesten-app.
2. Open een artiest via Edit en controleer dat de modal duidelijk breder is.
3. Selecteer een artiest in de tabel.
4. Controleer dat onder de tabel de detailnavigatie zichtbaar is: Alles, Relaties, Discogs, Ontdubbelen.
5. Klik Relaties en controleer dat relatiekaarten zichtbaar zijn.
6. Klik Discogs en controleer dat Discogs-blokken zichtbaar zijn.
7. Klik Ontdubbelen en controleer dat het ontdubbelblok zichtbaar is.
8. Controleer dat het scrollen in het onderste detailgebied voorspelbaar via het paneel zelf werkt.
9. Pas een Discogs-profieltekstvoorstel toe en controleer dat de profieltekst read-only zichtbaar is in het Discogs-gedeelte.
