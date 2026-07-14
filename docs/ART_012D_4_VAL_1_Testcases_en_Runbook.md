# ART-012D-4-VAL-1 — Functionele testcases en automatiseringsbasis

**Sprint:** Discogs naamvoorstellen reviewqueue: functionele validatie en hardening  
**Status:** testbasis voor codesprint  
**Datum:** 11-07-2026

## 1. Doel

Deze testbasis valideert niet alleen aanwezigheid van code, maar het functionele gedrag van de persistente reviewqueue. Iedere testcase heeft een stabiele ID en een voorgestelde automatiseringslaag.

## 2. Testdata

Gebruik minimaal:

- Artist A met Discogs-koppeling en canonical naam `Test Artist Alpha`;
- Artist B met canonical naam `Conflict Name`;
- spelling `Alpha Alias Existing` bij Artist A;
- spelling `Shared Alias` bij Artist B;
- Discogs-cache voor Artist A met aliases, name variations, real name, duplicaten, whitespacevarianten en lege waarden;
- unieke testprefix `__ART012D4VAL1_TEST__`.

Alle database-integratietests draaien transactioneel en eindigen met rollback.

## 3. Testcase-overzicht

### A. Preflight, schema en datakwaliteit

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-001 | Tabel `artist_name_proposals` bestaat | PASS | DB-integratie |
| D4V1-TC-002 | Vereiste kolommen en datatypes bestaan | PASS of duidelijke BLOCKER | DB-integratie |
| D4V1-TC-003 | Toegestane statuswaarden zijn beschikbaar | Alleen afgesproken statussen | DB-integratie |
| D4V1-TC-004 | Orphan proposal verwijst naar ontbrekende artist | Preflight BLOCKER/WARNING met aantal | DB-integratie |
| D4V1-TC-005 | Lege proposalnaam bestaat | Preflight rapporteert invalid data | DB-integratie |
| D4V1-TC-006 | Functioneel dubbele proposals bestaan | Preflight rapporteert duplicaten | DB-integratie |
| D4V1-TC-007 | `added` proposal zonder lokale spelling | Verify rapporteert inconsistentie | DB-integratie |
| D4V1-TC-008 | Geen problemen aanwezig | Summary `blockers=0` | Shell + DB |

### B. Generatie en bronextractie

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-009 | Artist zonder Discogs-koppeling genereert queue | Begrijpelijke fout, geen mutatie | API/E2E |
| D4V1-TC-010 | Gekoppelde artist zonder cachedata | Lege summary, geen fout | API/DB |
| D4V1-TC-011 | Alias wordt geëxtraheerd | Eén voorstel met type alias | DB/API |
| D4V1-TC-012 | Name variation wordt geëxtraheerd | Eén voorstel met correct type | DB/API |
| D4V1-TC-013 | Real name wordt geëxtraheerd | Eén voorstel met correct type | DB/API |
| D4V1-TC-014 | Externe artistnaam wijkt af | Voorstel volgens afgesproken bronregel | DB/API |
| D4V1-TC-015 | Lege of whitespacewaarde | Status invalid of genegeerd met summary | DB/API |
| D4V1-TC-016 | Dezelfde naam komt meerdere keren in payload voor | Eén functioneel voorstel | DB/API |
| D4V1-TC-017 | Naam verschilt alleen in hoofdletters | Geen functioneel duplicaat | DB/API |
| D4V1-TC-018 | Naam bevat omringende whitespace | Genormaliseerd voor vergelijking | DB/API |
| D4V1-TC-019 | Naam bevat meerdere interne spaties | Consistente normalisatie | DB/API |
| D4V1-TC-020 | Generatie-response bevat alle tellers | Tellers sluiten aan op mutaties | API-contract |

### C. Idempotentie en hergeneratie

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-021 | Eerste generatie | Verwacht aantal inserts | DB/API |
| D4V1-TC-022 | Tweede identieke generatie | Nul functioneel nieuwe voorstellen | DB/API |
| D4V1-TC-023 | Broncontext wijzigt, naam blijft gelijk | Geen duplicaat; metadata volgens beleid bijgewerkt | DB/API |
| D4V1-TC-024 | Nieuw alias toegevoegd aan cache | Alleen nieuw alias toegevoegd | DB/API |
| D4V1-TC-025 | Alias verdwijnt uit cache | Bestaand reviewrecord niet stil verwijderd | DB/API |
| D4V1-TC-026 | Reeds `ignored` voorstel opnieuw in cache | Status blijft ignored | DB/API |
| D4V1-TC-027 | Reeds `added` voorstel opnieuw in cache | Status blijft added | DB/API |
| D4V1-TC-028 | Reeds `review_later` opnieuw in cache | Status blijft review_later | DB/API |

### D. Classificatie existing/conflict/invalid

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-029 | Voorstel gelijk aan canonical naam eigen artist | Status existing | DB/API |
| D4V1-TC-030 | Voorstel gelijk aan bestaande spelling eigen artist | Status existing | DB/API |
| D4V1-TC-031 | Voorstel gelijk aan canonical naam andere artist | Status conflict | DB/API |
| D4V1-TC-032 | Voorstel gelijk aan spelling andere artist | Status conflict met conflictartist | DB/API |
| D4V1-TC-033 | Vergelijking verschilt alleen in case | Zelfde classificatie | DB/API |
| D4V1-TC-034 | Ongeldige proposalwaarde | Status invalid; geen acties | DB/UI |

### E. Statusovergangen

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-035 | `new` naar `review_later` | Status gewijzigd | API/E2E |
| D4V1-TC-036 | `review_later` heropenen | Status new na live hercontrole | API/E2E |
| D4V1-TC-037 | `new` naar `ignored` | Status gewijzigd | API/E2E |
| D4V1-TC-038 | `ignored` heropenen | Status new na live hercontrole | API/E2E |
| D4V1-TC-039 | Terminale `added` handmatig heropenen | Geblokkeerd met stabiele foutcode | API |
| D4V1-TC-040 | Terminale `conflict` via gewone statusroute wijzigen | Geblokkeerd | API |
| D4V1-TC-041 | Onbekende status opsturen | HTTP 422/400, geen mutatie | API |
| D4V1-TC-042 | Proposal behoort bij andere artist-ID | HTTP 404/403, geen mutatie | API/security |

### F. Toevoegen als spelling

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-043 | Geldig new voorstel toepassen | Exact één spelling toegevoegd; status added | DB/API/E2E |
| D4V1-TC-044 | Dezelfde apply tweemaal | Geen dubbele spelling; tweede call verklaarbaar | DB/API |
| D4V1-TC-045 | Spelling bestaat inmiddels bij eigen artist | Geen insert; status existing | DB/API |
| D4V1-TC-046 | Spelling bestaat inmiddels bij andere artist | Geen insert; status conflict | DB/API |
| D4V1-TC-047 | Proposalstatus is ignored | Apply geblokkeerd | API |
| D4V1-TC-048 | Proposalstatus is review_later | Apply geblokkeerd | API |
| D4V1-TC-049 | Proposalnaam is leeg/invalid | Geen insert | DB/API |
| D4V1-TC-050 | Fout na spellinginsert vóór statusupdate | Volledige rollback | DB-integratie |
| D4V1-TC-051 | Fout na statusupdate vóór commit | Volledige rollback | DB-integratie |
| D4V1-TC-052 | Canonical artistnaam controleren na apply | Ongewijzigd | DB-regressie |

### G. Concurrency en verouderde state

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-053 | Twee requests passen hetzelfde voorstel gelijktijdig toe | Eén spelling, consistente terminale status | DB-concurrency |
| D4V1-TC-054 | Andere artist claimt spelling tussen list en apply | Live conflict; geen dubbele spelling | DB/API |
| D4V1-TC-055 | Proposal wordt genegeerd terwijl andere request apply start | Lock/transitiebeleid levert één consistente uitkomst | DB-concurrency |
| D4V1-TC-056 | Proposal wordt verwijderd of ontbreekt bij actie | 404 en UI-refresh | API/E2E |

### H. Filters, zoeken en tellers

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-057 | Filter status new | Alleen new items | API/component/E2E |
| D4V1-TC-058 | Filter voorsteltype alias | Alleen aliases | API/component |
| D4V1-TC-059 | Zoek op deel voorstelnaam | Case-insensitive relevante resultaten | API/component |
| D4V1-TC-060 | Zoek op conflictartist | Conflictresultaat zichtbaar | API/component |
| D4V1-TC-061 | Combinatie status, type en zoekterm | AND-semantiek | API/E2E |
| D4V1-TC-062 | Geen resultaten | Duidelijke empty state | Component/E2E |
| D4V1-TC-063 | Tellers met actief filter | Globale tellers blijven volgens afgesproken contract | API/component |
| D4V1-TC-064 | Actie verandert status | Tellers direct bijgewerkt | Component/E2E |
| D4V1-TC-065 | Filters blijven na actie behouden | Geen onverwachte reset | Component/E2E |

### I. UI, feedback en toegankelijkheid

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-066 | Generation summary verschijnt | Dismissible en begrijpelijk | Component/E2E |
| D4V1-TC-067 | Actie bezig | Betreffende knoppen disabled/spinner | Component/E2E |
| D4V1-TC-068 | Dubbele click op apply | Maximaal één request/mutatie | Component/E2E |
| D4V1-TC-069 | Conflict toont andere artist compact | Geen layout overflow | Component/E2E |
| D4V1-TC-070 | Statusbadge heeft tekst, niet alleen kleur | Toegankelijk | Component/accessibility |
| D4V1-TC-071 | Actieknoppen via keyboard bereikbaar | Correcte tabvolgorde | E2E/accessibility |
| D4V1-TC-072 | API stale-state fout | Nederlandse melding en refresh | Component/E2E |
| D4V1-TC-073 | Apply geslaagd | Spellingpaneel direct bijgewerkt | E2E |
| D4V1-TC-074 | Queue-item verdwijnt door actief filter | Geen fout; empty state/teller correct | Component/E2E |

### J. Security, logging, rollback en packaging

| ID | Scenario | Verwacht resultaat | Automatisering |
|---|---|---|---|
| D4V1-TC-075 | Niet-numerieke artist/proposal ID | Validatiefout | API |
| D4V1-TC-076 | SQL-achtige zoekterm | Geen SQL-injectie, normale parameterbinding | API/security |
| D4V1-TC-077 | Database-test zonder opt-in | Script weigert uitvoering | Shell-contract |
| D4V1-TC-078 | Database-test op herkenbare productie-DB | Script weigert zonder override | Shell-contract |
| D4V1-TC-079 | Transactionele test voltooid | Summary passed=true | DB-integratie |
| D4V1-TC-080 | Na rollback zoeken op testprefix | leftovers=0 | DB-integratie |
| D4V1-TC-081 | Alle commando's loggen via tee | Logbestand aanwezig | Handmatig/shell |
| D4V1-TC-082 | Release-ZIP inspecteren | Geen node_modules/.env/logs/macOS metadata | Packaging |
| D4V1-TC-083 | Productiebuild | Slaagt | Build CI |
| D4V1-TC-084 | Volledige ART-012 regressie | Slaagt | CI |

## 4. Voorgestelde automatische testscripts

### Contract

```bash
mkdir -p logs && npm run test:art012d4:val1:contract 2>&1 | tee "logs/test-art012d4-val1-contract-$(date +%Y%m%d-%H%M%S).log"
```

### Database-integratie

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art012d4:val1:db 2>&1 | tee "logs/test-art012d4-val1-db-$(date +%Y%m%d-%H%M%S).log"
```

### Chromium E2E

```bash
mkdir -p logs && npm run test:art012d4:val1:e2e 2>&1 | tee "logs/test-art012d4-val1-e2e-$(date +%Y%m%d-%H%M%S).log"
```

### Regressie

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:all 2>&1 | tee "logs/test-all-art012d4-val1-$(date +%Y%m%d-%H%M%S).log"
```

De commando's worden in de codesprint toegevoegd. Dit ontwerpbestand claimt niet dat zij al geïmplementeerd zijn.

## 5. Handmatige acceptatierun

1. Selecteer een gekoppelde artist met gecontroleerde Discogs-testdata.
2. Genereer de queue en leg de summary vast.
3. Genereer opnieuw en controleer dat geen duplicaten ontstaan.
4. Test filters op status/type en zoekveld.
5. Zet één voorstel op Later en heropen het.
6. Zet één voorstel op Negeer en heropen het.
7. Pas één geldig voorstel toe als spelling.
8. Controleer directe refresh van spellingpaneel en tellers.
9. Maak bewust een conflict via een tweede artist en probeer een verouderd voorstel toe te passen.
10. Controleer dat geen canonical naam is gewijzigd.
11. Voer preflight en verify uit.
12. Controleer logs en summaries.

## 6. Exitcriteria

- D4V1-TC-001 t/m D4V1-TC-084 hebben een vastgelegde uitkomst.
- Alle P1-scenario's voor apply, conflict, rollback en idempotentie zijn geautomatiseerd.
- Chromium-hoofdflow slaagt.
- Database-test rapporteert `leftovers=0`.
- Geen open blocker of onverklaarde warning.
