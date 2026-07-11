# ART-012E-2 — Testcases en runbook

## Installatie / migratie

Voer commando's altijd uit met logging naar `logs/`.

```bash
mkdir -p logs && npm run install:all 2>&1 | tee "logs/install-all-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run db:migrate:art012e2 2>&1 | tee "logs/db-migrate-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

## Technische tests

```bash
mkdir -p logs && npm run test:art012e2 2>&1 | tee "logs/test-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012e2-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:packaging 2>&1 | tee "logs/test-packaging-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run build 2>&1 | tee "logs/build-art012e2-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele testcases

### TC-ART-012E-2-001 — Gekoppelde artiest met images

1. Start de app.
2. Selecteer een artiest die aan Discogs gekoppeld is en Discogs images heeft.
3. Controleer de sectie **Profielfoto uit Discogs images**.

Verwachting:

- de Discogs images worden getoond;
- er is een knop **Maak profielfoto** beschikbaar bij niet-primaire images.

### TC-ART-012E-2-002 — Profielfoto kiezen

1. Klik bij een Discogs image op **Maak profielfoto**.
2. Controleer de relatie-header.

Verwachting:

- de gekozen image krijgt badge **Profielfoto**;
- de relatie-header toont de gekozen image;
- er verschijnt een successmelding.

### TC-ART-012E-2-003 — Eén primaire image

1. Kies eerst image A als profielfoto.
2. Kies daarna image B als profielfoto.

Verwachting:

- image A is niet langer primair;
- image B is primair;
- er is maximaal één image met badge **Profielfoto**.

### TC-ART-012E-2-004 — Persistentie na heropenen

1. Kies een profielfoto.
2. Selecteer een andere artiest.
3. Selecteer de oorspronkelijke artiest opnieuw.

Verwachting:

- dezelfde profielfoto blijft zichtbaar.

### TC-ART-012E-2-005 — Geen images

1. Selecteer een gekoppelde Discogs-artiest zonder images.

Verwachting:

- de app toont een duidelijke melding dat er geen Discogs-afbeeldingen zijn.
