# ART-013B-1 — Functionele testcases en runbook

Datum: 2026-07-11  
Doel: basis voor handmatige acceptatie en toekomstige geautomatiseerde tests.

## Testcaseconventie

- ID: `ART013B1-TC-###`
- Prioriteit: P0, P1 of P2
- Automatisering: contract, PostgreSQL, API, component, Playwright of handmatig

## A. Preflight en migratie

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-001 | `musician_in_band` bestaat | Preflight PASS | P0 | PostgreSQL |
| ART013B1-TC-002 | `musician` bestaat | Preflight PASS | P0 | PostgreSQL |
| ART013B1-TC-003 | `artist` bestaat | Preflight PASS | P0 | PostgreSQL |
| ART013B1-TC-004 | bestaande PK/FK-kolommen worden geïnventariseerd | Rapport toont exacte sleutels | P0 | PostgreSQL |
| ART013B1-TC-005 | ontbrekende vereiste sleutelkolom | Migratie blokkeert met duidelijke fout | P0 | PostgreSQL |
| ART013B1-TC-006 | migratie eerste uitvoering | Nieuwe velden/constraints aanwezig | P0 | PostgreSQL |
| ART013B1-TC-007 | migratie tweede uitvoering | Idempotent, geen fout | P0 | PostgreSQL |
| ART013B1-TC-008 | bestaande rijen behouden | Geen verlies of overschrijving | P0 | PostgreSQL |
| ART013B1-TC-009 | ongeldige bestaande data | Preflight rapporteert blokkade/waarschuwing | P0 | PostgreSQL |
| ART013B1-TC-010 | verify na migratie | Alle verwachte objecten PASS | P0 | PostgreSQL |

## B. Bandcontext en lijstweergave

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-011 | band zonder leden | Lege toestand en knop toevoegen | P0 | Playwright |
| ART013B1-TC-012 | band met huidig lid | Lid zichtbaar als Huidig | P0 | API/Playwright |
| ART013B1-TC-013 | band met voormalig lid | Lid zichtbaar als Voormalig | P0 | API/Playwright |
| ART013B1-TC-014 | band met onbekende periode | Status Onbekend | P1 | API/component |
| ART013B1-TC-015 | meerdere leden | Alle rijen één keer zichtbaar | P0 | API/Playwright |
| ART013B1-TC-016 | filter Huidig | Alleen huidige leden | P1 | Playwright |
| ART013B1-TC-017 | filter Voormalig | Alleen voormalige leden | P1 | Playwright |
| ART013B1-TC-018 | filter Alles | Alle leden | P1 | Playwright |
| ART013B1-TC-019 | standaard sortering | Huidig eerst, stabiele volgorde | P1 | API/component |
| ART013B1-TC-020 | detail link musician | Opent juiste person/musiciancontext | P1 | Playwright |

## C. Persoonscontext

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-021 | person met gekoppelde musician en één band | Band zichtbaar | P0 | API/Playwright |
| ART013B1-TC-022 | person met meerdere bandperiodes | Alle periodes zichtbaar | P0 | API/Playwright |
| ART013B1-TC-023 | person zonder gekoppelde musician | Heldere melding, geen addactie | P0 | Playwright |
| ART013B1-TC-024 | niet-person artist | Geen persoonsbands-paneel | P1 | component |
| ART013B1-TC-025 | link naar band | Opent juiste band | P1 | Playwright |
| ART013B1-TC-026 | edit vanuit persoonscontext | Zelfde relatie wordt geopend | P0 | Playwright |

## D. Handmatig toevoegen

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-027 | geldig minimaal record | Relatie aangemaakt | P0 | API/PostgreSQL/Playwright |
| ART013B1-TC-028 | alle optionele velden gevuld | Waarden exact opgeslagen | P0 | API/PostgreSQL |
| ART013B1-TC-029 | musician ontbreekt | Validatiefout | P0 | API/component |
| ART013B1-TC-030 | band ontbreekt | Validatiefout | P0 | API |
| ART013B1-TC-031 | artist is type person | `ARTIST_NOT_BAND_TYPE` | P0 | API |
| ART013B1-TC-032 | duo als bandcontext | Relatie toegestaan | P1 | API |
| ART013B1-TC-033 | trio als bandcontext | Relatie toegestaan | P1 | API |
| ART013B1-TC-034 | group als bandcontext | Relatie toegestaan | P1 | API |
| ART013B1-TC-035 | rol leeg | Relatie toegestaan | P1 | API |
| ART013B1-TC-036 | alleen beginjaar | Correct met precision year | P0 | API/PostgreSQL |
| ART013B1-TC-037 | alleen eindjaar | Correct toegestaan | P1 | API/PostgreSQL |
| ART013B1-TC-038 | geen periode | Correct toegestaan | P0 | API |
| ART013B1-TC-039 | bron manual | Correct opgeslagen | P1 | API |
| ART013B1-TC-040 | URL http/https | Correct opgeslagen | P1 | API |
| ART013B1-TC-041 | onveilige URL-scheme | Validatiefout | P0 | API |
| ART013B1-TC-042 | te lange rol | Validatiefout | P1 | API |
| ART013B1-TC-043 | HTML/script in notes | Als tekst behandeld | P0 | API/Playwright |

## E. Periode- en duplicaatvalidatie

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-044 | einddatum vóór begindatum | Blokkade | P0 | API/PostgreSQL |
| ART013B1-TC-045 | eindjaar vóór beginjaar | Blokkade | P0 | API |
| ART013B1-TC-046 | gelijke begin/einddatum | Toegestaan | P1 | API |
| ART013B1-TC-047 | exact duplicaat | `DUPLICATE_MEMBERSHIP` | P0 | API/PostgreSQL |
| ART013B1-TC-048 | zelfde musician/band andere periode | Toegestaan | P0 | API/PostgreSQL |
| ART013B1-TC-049 | overlappende periode | Waarschuwing | P0 | API/Playwright |
| ART013B1-TC-050 | overlap expliciet bevestigd | Relatie aangemaakt | P1 | API/Playwright |
| ART013B1-TC-051 | zelfde periode andere rol | Waarschuwing, geen stil duplicaat | P1 | API |
| ART013B1-TC-052 | precisie unknown | Geen fictieve exacte datum tonen | P1 | component |

## F. Wijzigen en concurrency

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-053 | rol wijzigen | Direct zichtbaar | P0 | API/Playwright |
| ART013B1-TC-054 | periode wijzigen | Status herberekend | P0 | API/Playwright |
| ART013B1-TC-055 | bron wijzigen | Correct opgeslagen | P1 | API |
| ART013B1-TC-056 | notes wissen | Null/leeg correct opgeslagen | P1 | API |
| ART013B1-TC-057 | onbekende relationKey | 404 foutcode | P0 | API |
| ART013B1-TC-058 | stale updatedAt | 409 `STALE_MUSICIAN_IN_BAND` | P0 | API/PostgreSQL |
| ART013B1-TC-059 | twee gelijktijdige edits | Eén slaagt, één stale | P0 | API/PostgreSQL |
| ART013B1-TC-060 | edit verandert musician/band zonder her-koppelflow | Geblokkeerd | P0 | API |
| ART013B1-TC-061 | databasefout tijdens update | Volledige rollback | P0 | PostgreSQL |

## G. Verwijderen

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-062 | delete dialoog | Toont musician, band en periode | P0 | Playwright |
| ART013B1-TC-063 | delete annuleren | Geen wijziging | P0 | Playwright |
| ART013B1-TC-064 | delete bevestigen | Alleen relatie verwijderd | P0 | API/PostgreSQL/Playwright |
| ART013B1-TC-065 | musician blijft bestaan | Record blijft aanwezig | P0 | PostgreSQL |
| ART013B1-TC-066 | artist/band blijft bestaan | Record blijft aanwezig | P0 | PostgreSQL |
| ART013B1-TC-067 | delete onbekende relatie | 404 | P1 | API |
| ART013B1-TC-068 | stale delete | 409 | P0 | API |

## H. UI, accessibility en regressie

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-069 | toetsenbordbediening modal | Volledig bruikbaar | P1 | Playwright |
| ART013B1-TC-070 | labels en aria | Velden/toetsen toegankelijk | P1 | component/Playwright |
| ART013B1-TC-071 | loading state | Geen dubbele submit | P0 | component/Playwright |
| ART013B1-TC-072 | API-fout | Begrijpelijke melding, invoer behouden | P0 | component/Playwright |
| ART013B1-TC-073 | responsive smal scherm | Geen onbruikbare overflow | P1 | Playwright |
| ART013B1-TC-074 | embedded Shellstarter | Paneel en modal bruikbaar | P1 | Playwright |
| ART013B1-TC-075 | artistlijst regressie | Zoeken/sorteren blijft werken | P0 | regressie |
| ART013B1-TC-076 | Edit artist regressie | Bestaande modal blijft werken | P0 | regressie |
| ART013B1-TC-077 | ART-013A sync regressie | Artist→musician blijft werken | P0 | PostgreSQL |
| ART013B1-TC-078 | naamvoorstellen regressie | ART-012D-4 blijft groen | P0 | contract/API |
| ART013B1-TC-079 | geen N+1 | Eén lijstquery per paneelrequest | P0 | API/querytest |
| ART013B1-TC-080 | lege/nullvelden | UI toont `—`, geen `null` | P1 | component |

## I. Testisolatie, logging en packaging

| ID | Scenario | Verwacht | Prioriteit | Automatisering |
|---|---|---|---|---|
| ART013B1-TC-081 | DB-test zonder guard | Test weigert | P0 | shell |
| ART013B1-TC-082 | DB-test transactioneel | Eindigt met rollback | P0 | PostgreSQL |
| ART013B1-TC-083 | leftovers na test | `leftovers=0` | P0 | PostgreSQL |
| ART013B1-TC-084 | logging | Samenvatting en foutcodes gelogd | P1 | shell/API |
| ART013B1-TC-085 | productiebuild | Slaagt | P0 | build |
| ART013B1-TC-086 | ZIP zonder node_modules | PASS | P0 | packaging |
| ART013B1-TC-087 | ZIP zonder .env/logs/macOS metadata | PASS | P0 | packaging |
| ART013B1-TC-088 | docs en npm scripts aanwezig | PASS | P0 | contract |

## Aanbevolen lokale uitvoervolgorde voor de codesprint

```bash
mkdir -p logs && npm run musician-in-band:preflight 2>&1 | tee "logs/art013b1-preflight-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run db:migrate:art013b1 2>&1 | tee "logs/art013b1-migration-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run musician-in-band:verify 2>&1 | tee "logs/art013b1-verify-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:art013b1:contract 2>&1 | tee "logs/art013b1-contract-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013b1:db 2>&1 | tee "logs/art013b1-db-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:art013b1:e2e 2>&1 | tee "logs/art013b1-e2e-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:all 2>&1 | tee "logs/test-all-$(date +%Y%m%d-%H%M%S).log"
```

De genoemde nieuwe scripts zijn in deze ontwerpoplevering nog niet geïmplementeerd.


## ART-013B-1 implementatiestatus — 2026-07-12

De concrete codesprint is opgeleverd. Handmatig beheer is modulair geïntegreerd in het Relatie-inzicht. De bestaande tabel `musician_in_band` blijft lokale waarheid. Preflight, migratie, verificatie, API, frontendfeature, duplicate/overlap/stale bescherming en automatische contracttests zijn aanwezig. Externe providers blijven vervolgscope: Discogs primair, MusicBrainz aanvullend, Wikidata daarna.

## Fix-2 aanvullende acceptatie

- Preflight toont PASS voor `mb_musician_key` en `mb_artist_key`.
- Als `mb_musician_band_key` ontbreekt, toont preflight INFO en geen BLOCKER.
- Migratie voegt `mb_musician_band_key` en de unieke index toe.
- Een tweede migratierun is idempotent.
- Verify toont PASS voor de technische relationsleutel.
- Bestaande relaties worden niet verwijderd of gewijzigd, behalve dat zij een unieke technische sleutel krijgen.
