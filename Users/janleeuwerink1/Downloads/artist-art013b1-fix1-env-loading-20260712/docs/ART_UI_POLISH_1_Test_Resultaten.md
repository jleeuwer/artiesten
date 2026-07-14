# ART-UI-POLISH-1 — Testresultaten

Datum: 2026-07-11

## Uitgevoerde automatische tests

| Commando | Resultaat |
|---|---:|
| `npm run test:art-ui-polish1` | 58/58 geslaagd |
| `npm run test:artui1a` | 4/4 geslaagd |
| `npm run test:art012e2` | 4/4 geslaagd |
| `npm run test:packaging` | 6/6 geslaagd |
| `npm run build` | geslaagd; 349 modules getransformeerd |

De ART-UI-POLISH-1-suite controleert querycontract, ontbreken van per-row image requests, thumbnail- en fallbackcontract, toegankelijkheidsattributen, overledenstatus, CSS-dimensies, directe state-refresh, npm-integratie en traceability van alle 48 functionele testcase-ID’s.

## Niet geautomatiseerd in deze repository

De repository bevat nog geen ingerichte React-componenttest- of Playwright-runtime. De browsermatige scenario’s blijven daarom als handmatig acceptatierunbook opgenomen. Bij een toekomstige Playwright-inrichting wordt uitsluitend Chromium gebruikt.

## Handmatige acceptatie lokaal

1. Controleer levende en overleden artiesten.
2. Controleer artiesten met en zonder primaire image.
3. Simuleer een onbereikbare image-URL en controleer de fallback.
4. Kies een andere primaire Discogs-image en controleer de directe lijstupdate.
5. Test zoeken, sorteren, favorietenfilter, paginering en rijacties.
6. Controleer standalone en embedded Shellstarter-layout.
