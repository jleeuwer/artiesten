# ART-012D-4-VAL-1 — Sprintmanifest

## Sprint

**Naam:** Discogs naamvoorstellen reviewqueue: functionele validatie en hardening  
**Type:** validatie-, test- en hardeningsprint  
**Baseline:** ART-UI-POLISH-1-Fix-4

## Doel

De bestaande ART-012D-4-reviewqueue met echte PostgreSQL-integratietests, statusovergangen, idempotentie-, concurrency- en Chromium-E2E-tests aantoonbaar afronden.

## Ontwerpartefacten in deze oplevering

- `docs/ART_012D_4_VAL_1_Reviewqueue_Validatie_Hardening_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_012D_4_VAL_1_Testcases_en_Runbook.md`
- `docs/ART_012D_4_VAL_1_Sprint_Manifest.md`
- `Release Notes/ART_012D_4_VAL_1_Design_Release_Notes.md`

## Beoogde codeartefacten voor de codesprint

- centrale proposalnormalisatie en transitiepolicy;
- generation summary;
- stabiele API-foutcodes;
- preflight- en verificationscripts;
- transactionele PostgreSQL-integratietest;
- contracttests;
- frontend componenttests;
- Chromium Playwright-test;
- bijgewerkte package scripts en CI/regressiesuite.

## Geen onderdeel van deze ontwerpoplevering

De nieuwe scripts en npm-commando's zijn nog niet geïmplementeerd. Deze ZIP is de afgesproken functionele en technische sprintbasis voor de volgende code-implementatie.

## Vervolgvolgorde

1. ART-012D-4-VAL-1 implementeren en accepteren.
2. ART-013B musician-in-band relatieverrijking.
3. Lokale biografie ontwerpen.
4. ART-014 album-, release- en trackmodel.
