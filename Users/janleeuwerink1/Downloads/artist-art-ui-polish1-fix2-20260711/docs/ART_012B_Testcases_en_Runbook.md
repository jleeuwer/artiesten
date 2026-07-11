# ART-012B — Testcases en runbook

## Installatie/migratie

Na uitpakken:

```bash
npm run install:all
npm run db:migrate:art012b
```

## Configuratie

Discogs-configuratie in `.env`:

```env
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
```

Als `DISCOGS_USER_TOKEN` leeg is, blijft de Discogs-knop in de UI disabled of toont de API een configuratiemelding.

## Handmatige testcases

### TC-ART012B-001 — Configstatus

1. Start de app.
2. Open een artiest.
3. Controleer de Discogs-kaart.

Verwacht:

- bij ontbrekende token duidelijke melding;
- geen technische foutmelding;
- lokale artist key blijft zichtbaar/leidend.

### TC-ART012B-002 — Zoeken in Discogs

1. Vul Discogs-token in `.env`.
2. Start de app opnieuw.
3. Selecteer een artiest.
4. Klik **Zoek in Discogs**.

Verwacht:

- resultatenlijst met Discogs artist IDs;
- link **Open Discogs**;
- geen lokale data wordt gewijzigd.

### TC-ART012B-003 — Detail inspecteren

1. Voer een zoekactie uit.
2. Klik **Detail** bij een resultaat.

Verwacht:

- detail toont naam, real name/profile waar beschikbaar;
- badges tonen aantallen aliases/name variations/groups/members/images;
- melding dat koppelen/toepassen pas in ART-012C volgt.

## Automatische tests

```bash
npm run test:art012b
npm run test:art012
npm run test:packaging
npm run test:unit
```

## Niet testen in ART-012B

- toepassen van Discogs-data;
- image download/cache;
- aliases naar `artiesten_spelling` schrijven;
- merge op basis van Discogs.
