# ART-012E-3 — Testcases en runbook

## Installatie / migratie

```bash
mkdir -p logs && npm run install:all 2>&1 | tee "logs/install-all-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run db:migrate:art012e3 2>&1 | tee "logs/db-migrate-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

## Tests

```bash
mkdir -p logs && npm run test:art012e3 2>&1 | tee "logs/test-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012e3-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run build 2>&1 | tee "logs/build-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run dev 2>&1 | tee "logs/dev-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele testcases

1. Open een artiest die aan Discogs gekoppeld is.
2. Controleer dat de sectie **Discogs verrijkingsvoorstellen** zichtbaar is.
3. Klik op **Genereer voorstellen**.
4. Controleer dat voorstellen verschijnen met veld, lokale waarde, voorstel, status, confidence en context.
5. Controleer dat geboorte-/sterfdatum uit profieltekst alleen als voorstel verschijnt.
6. Controleer dat onvolledige datums niet als toepasbare datum worden behandeld.
7. Controleer dat lokale artist-data niet wijzigt.
8. Open een artiest zonder Discogs-koppeling en controleer dat de sectie niet actief is.

## Regressie

Controleer dat ART-012E-1 en ART-012E-2 blijven werken:

- Discogs link-icoon verschijnt direct na koppelen;
- artist type blijft bewerkbaar;
- profielfoto uit Discogs images blijft werken.

## ART-012E-3-Fix-1 — Test lange Discogs links

1. Open een artiest met Discogs-koppeling.
2. Klik op **Toon voorstellen** of **Genereer voorstellen**.
3. Controleer dat een lange Discogs/website-link de tabel niet meer breder maakt dan de kaart.
4. Controleer dat de link als **Open link** zichtbaar is en dat de ruwe URL afgekapt wordt met ellipsis.
5. Controleer dat de rest van **Relatie-inzicht** niet horizontaal uitrekt.
