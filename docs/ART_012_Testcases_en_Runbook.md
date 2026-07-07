# ART-012 — Discogs artist enrichment — Testcases en runbook

Status: ontwerp-/documentatiesprint  
Datum: 2026-06-06

## 1. Doel van deze testset

Deze sprint levert nog geen Discogs-code of migratie op. De testset borgt dat het functionele en technische ontwerp volledig is vastgelegd en dat toekomstige implementaties dezelfde ontwerpbesluiten volgen.

## 2. Ontwerp-testcases

### TC-012A-001 — Lokale artist key blijft leidend

**Given** de ART-012 ontwerpdocumentatie  
**When** het ontwerp wordt gelezen  
**Then** staat expliciet dat `artist.ar_artist_key` de primaire sleutel blijft  
**And** staat expliciet dat Discogs ID nooit de lokale artist key vervangt.

### TC-012A-002 — Discogs ID is externe lookup-key

**Given** Discogs artist enrichment  
**When** de koppeling wordt ontworpen  
**Then** wordt Discogs artist ID gebruikt als externe referentie om informatie op te halen  
**And** niet als relationele sleutel binnen `musicdb`.

### TC-012A-003 — Externe referentie/cache model is voorkeursrichting

**Given** de keuze tussen velden op `artist` en aparte tabellen  
**When** het ontwerp wordt gelezen  
**Then** is `artist_external_reference` + `artist_enrichment_cache` de voorkeursrichting.

### TC-012A-004 — Geen automatische overschrijving

**Given** Discogs-data is opgehaald  
**When** de gebruiker een Discogs artist koppelt  
**Then** worden lokale artistvelden niet automatisch overschreven  
**And** verrijking vereist een review/accept-flow.

### TC-012A-005 — Discogs-data kan lokale artist-attributen verrijken

**Given** Discogs levert real name, profile, aliases, name variations, groups en members  
**When** het ontwerp wordt gelezen  
**Then** staat beschreven welke data lokaal, in cache of als voorstel kan worden gebruikt.

### TC-012A-006 — Configvariabelen zijn beschreven

**Given** Discogs-configuratie  
**When** de README en ART-012 documentatie worden gelezen  
**Then** zijn `DISCOGS_USER_TOKEN`, `DISCOGS_USER_AGENT`, `DISCOGS_BASE_URL`, `DISCOGS_REQUEST_TIMEOUT_MS` en `DISCOGS_CACHE_TTL_SECONDS` beschreven  
**And** zijn `ARTIST_IMAGE_CACHE_ENABLED`, `ARTIST_IMAGE_CACHE_DIR` en `ARTIST_IMAGE_CACHE_MAX_AGE_DAYS` beschreven.

### TC-012A-007 — Relatie met ART-015 en ART-013/014 is beschreven

**Given** bestaande duplicate scanner en toekomstige artiestrelaties/albums  
**When** ART-012 wordt gelezen  
**Then** staat beschreven dat Discogs aliases/name variations later duplicate detection kunnen verbeteren  
**And** dat groups/members later ART-013 kunnen voeden  
**And** dat albums niet in scope zijn voor ART-012A.

### TC-012A-008 — Image-cache is portable ontworpen

**Given** Discogs artist images beschikbaar zijn  
**When** ART-012 wordt gelezen  
**Then** staat beschreven dat binaire images niet in PostgreSQL worden opgeslagen  
**And** dat `ARTIST_IMAGE_CACHE_DIR` het centrale basispad in `.env` is  
**And** dat de database alleen relatieve cache-referenties bewaart.

## 3. Automatische test

Uitvoeren:

```bash
npm run test:art012
```

Deze test controleert de aanwezigheid van de ART-012 ontwerpdocumentatie, backlogverwijzingen, README-verwijzing en package-script.

## 4. Runbook voor latere implementatie

Voor ART-012B/012C later:

1. Voeg Discogs-configuratie toe aan `.env`.
2. Controleer optioneel image-cacheconfiguratie in `.env`, bijvoorbeeld `ARTIST_IMAGE_CACHE_DIR=data/cache/artist-images`.
3. Start de app.
4. Open een lokale artist.
5. Kies **Zoek Discogs artist**.
6. Inspecteer Discogs-kandidaatdetails.
7. Koppel kandidaat pas na expliciete bevestiging.
8. Controleer dat `artist.ar_artist_key` ongewijzigd blijft.
9. Controleer dat de externe referentie/cache is aangemaakt.
10. Controleer dat lokale artistnaam niet automatisch is overschreven.
11. Controleer dat eventuele image-cachepaden relatief blijven ten opzichte van `ARTIST_IMAGE_CACHE_DIR`.

## 5. Niet uitvoeren in ART-012A

- Geen SQL-migratie draaien.
- Geen Discogs API-call testen.
- Geen echte Discogs-koppeling uitvoeren.
- Geen lokale artistvelden verrijken.
