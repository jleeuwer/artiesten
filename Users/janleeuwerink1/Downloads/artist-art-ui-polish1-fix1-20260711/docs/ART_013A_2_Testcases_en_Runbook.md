# ART-013A-2 — Functionele testcases en runbook

Datum: 2026-07-11  
Status: bijgewerkt voor geïmplementeerde sprint; basis en traceability voor automatische tests

## 1. Doel

Deze testset valideert de volledige ART-013A-keten:

```text
schema → preflight → migratie → preview → backfill → idempotentie → trigger-sync → verificatie
```

De testcases zijn zo geschreven dat zij als basis kunnen dienen voor Node contracttests, shelltests en PostgreSQL-integratietests.

## 2. Testvoorwaarden

- PostgreSQL draait in Docker.
- De test wordt niet tegen productie uitgevoerd.
- ART-013A en ART-013A-1 bronbestanden zijn aanwezig.
- Project-env/config bevat de juiste container-, database- en gebruikersinstellingen.
- Testdata gebruikt herkenbare prefix `__ART013A2_TEST__`.
- Alle opdrachten loggen via `2>&1 | tee`.
- Integratietests draaien transactioneel of ruimen uitsluitend eigen testrecords op.

## 3. Voorgestelde runvolgorde

### 3.1 Contracttests

```bash
mkdir -p logs && npm run test:art013a2:contract 2>&1 | tee "logs/test-art013a2-contract-$(date +%Y%m%d-%H%M%S).log"
```

### 3.2 Preflight

```bash
mkdir -p logs && npm run musician:preflight 2>&1 | tee "logs/musician-preflight-$(date +%Y%m%d-%H%M%S).log"
```

### 3.3 Migraties

```bash
mkdir -p logs && npm run db:migrate:art013a 2>&1 | tee "logs/db-migrate-art013a-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run db:migrate:art013a1 2>&1 | tee "logs/db-migrate-art013a1-$(date +%Y%m%d-%H%M%S).log"
```

### 3.4 Preview

```bash
mkdir -p logs && npm run musician:backfill:preview 2>&1 | tee "logs/musician-backfill-preview-$(date +%Y%m%d-%H%M%S).log"
```

### 3.5 Backfill

```bash
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-$(date +%Y%m%d-%H%M%S).log"
```

### 3.6 Tweede backfill-run

```bash
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-second-run-$(date +%Y%m%d-%H%M%S).log"
```

### 3.7 Verificatie

```bash
mkdir -p logs && npm run musician:verify 2>&1 | tee "logs/musician-verify-$(date +%Y%m%d-%H%M%S).log"
```

### 3.8 Database-integratietests

```bash
mkdir -p logs && npm run test:art013a2:db 2>&1 | tee "logs/test-art013a2-db-$(date +%Y%m%d-%H%M%S).log"
```

### 3.9 Volledige sprinttest

```bash
mkdir -p logs && npm run test:art013a2 2>&1 | tee "logs/test-art013a2-$(date +%Y%m%d-%H%M%S).log"
```

## 4. Functionele testcases

### A. Preflight en configuratie

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-001 | Geldige omgeving | Docker DB bereikbaar, schema compleet, geen duplicates | Exitcode 0; resultaat `READY`; aantallen zichtbaar; geen databasewijzigingen | shell + DB integration |
| ART013A2-FT-002 | PostgreSQL-container niet bereikbaar | Container gestopt of onjuiste naam | Duidelijke fout; exitcode configuratiefout; geen vervolgstappen | shell |
| ART013A2-FT-003 | Databaseconfig ontbreekt | Verplichte env/config ontbreekt | Script stopt vóór `psql`; geen credentials in output | shell contract |
| ART013A2-FT-004 | Artist-tabel ontbreekt | Testschema zonder `artist` | `BLOCKER`; exitcode 2 of technisch afgesproken blocker-code | DB integration |
| ART013A2-FT-005 | Musician-tabel ontbreekt | Testschema zonder `musician` | `BLOCKER`; geen migratie/backfill | DB integration |
| ART013A2-FT-006 | Vereiste kolom ontbreekt | Bijvoorbeeld `mu_musician_name` ontbreekt | Kolomnaam expliciet gemeld; `BLOCKER` | DB integration |
| ART013A2-FT-007 | Incompatibel datatype | Bijvoorbeeld artist key en musician link niet compatibel | `BLOCKER`; datatypeverschil zichtbaar | DB integration |
| ART013A2-FT-008 | Preflight is read-only | Snapshot/row counts vóór en na | Geen DML/DDL-wijziging | DB integration |
| ART013A2-FT-009 | Trigger aanwezig en enabled | ART-013A migratie uitgevoerd | Check `PASS` | DB integration |
| ART013A2-FT-010 | Trigger ontbreekt | Functie/trigger verwijderd in testtransactie | `BLOCKER` voor volledige ketenverificatie | DB integration |

### B. Datakwaliteit en migratieguards

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-011 | Geen dubbele links | Iedere non-null `ar_artist_key` uniek | Duplicate-check `0`; migratie kan doorgaan | DB integration |
| ART013A2-FT-012 | Twee musicians voor één artist | Twee records met dezelfde non-null artist key | `BLOCKER`; betrokken artist key(s) gemeld; geen index aangemaakt | DB integration |
| ART013A2-FT-013 | Duplicate niet automatisch gerepareerd | Duplicate testcase | Geen delete/update/merge van records | DB integration |
| ART013A2-FT-014 | Verplichte extra musician-kolom zonder default | Testschema bevat extra `NOT NULL` kolom | `BLOCKER`; kolomnaam en reden zichtbaar | DB integration |
| ART013A2-FT-015 | Nullable geboortedatum | `mu_musician_dateofbirth` mag null zijn | Migratie slaagt en kolom is nullable | DB integration |
| ART013A2-FT-016 | Migratie opnieuw draaien | Migratie reeds uitgevoerd | Geen fout; structuur blijft correct | DB integration |
| ART013A2-FT-017 | Partial unique index | Meerdere standalone musicians met null artist key | Toegestaan; index blokkeert alleen dubbele non-null links | DB integration |
| ART013A2-FT-018 | Migratie stopt transactioneel | Guard faalt | Geen ongewenste gedeeltelijke DDL, voor zover transactioneel ondersteund | DB integration |

### C. Kandidaatselectie en preview

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-019 | Person zonder musician | Geldige person-artist | Staat in geldige kandidaten | DB integration |
| ART013A2-FT-020 | Person met musician | Bestaande link via `ar_artist_key` | Niet als insertkandidaat; telt als reeds gekoppeld | DB integration |
| ART013A2-FT-021 | Band | `ar_artist_type='band'` | Niet geselecteerd | DB integration |
| ART013A2-FT-022 | Group | `ar_artist_type='group'` | Niet geselecteerd | DB integration |
| ART013A2-FT-023 | Unknown/null type | null of `unknown` | Niet geselecteerd | DB integration |
| ART013A2-FT-024 | Lege naam | person met lege/whitespace naam | Uitgesloten; warning/blocker volgens ontwerp; reden zichtbaar | DB integration |
| ART013A2-FT-025 | Onbekende geboortedatum | person met null geboortedatum | Geldige kandidaat; mapped geboortedatum null | DB integration |
| ART013A2-FT-026 | Naam te lang | Naam overschrijdt doelkolom | Uitgesloten of blocker vóór execute; geen afgekapt record | DB integration |
| ART013A2-FT-027 | Preview wijzigt niets | Kandidaten aanwezig | Row counts en data vóór/na identiek | DB integration |
| ART013A2-FT-028 | Preview toont mapping | Geldige kandidaat | Key, naam, geboorte, overlijden, website zichtbaar | shell output contract |
| ART013A2-FT-029 | Preview/execute selectielogica gelijk | Zelfde ongewijzigde dataset | Preview candidate count = execute selected count | DB integration |

### D. Backfill-uitvoering

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-030 | Normale insert | Eén geldige ontbrekende person | Eén musician ingevoegd met juiste artist key | DB integration |
| ART013A2-FT-031 | Veldmapping | Artist bevat alle vier mapped velden | Naam, geboorte, overlijden en website correct overgenomen | DB integration |
| ART013A2-FT-032 | Notes niet kopiëren | Artist notes gevuld | Musician notes blijven null/ongewijzigd | DB integration |
| ART013A2-FT-033 | Bestaande musician behouden | Musician heeft afwijkende handmatige waarden | Backfill voert geen update uit | DB integration |
| ART013A2-FT-034 | Alleen person insert | Gemengde set person/band/group | Alleen geldige persons ingevoegd | DB integration |
| ART013A2-FT-035 | Blocker aanwezig | Duplicate link of schemafout | Execute weigert; nul inserts | DB integration |
| ART013A2-FT-036 | Concurrente/bestaande link | Link ontstaat tussen preview en execute | Geen duplicate; record veilig skipped via constraint/conflict handling | DB integration |
| ART013A2-FT-037 | SQL-fout tijdens run | Kunstmatig veroorzaakte insertfout | Niet-nul exitcode; transactionele rollback; failed summary | DB integration |
| ART013A2-FT-038 | Run summary | Meerdere geldige en uitgesloten records | Selected/inserted/skipped/failed aantallen kloppen | shell + DB integration |
| ART013A2-FT-039 | Geen delete | Bestaande musicians vóór run | Na run zijn alle bestaande musician keys nog aanwezig | DB integration |

### E. Idempotentie en verificatie

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-040 | Tweede run | Eerste run succesvol | Tweede run: selected/inserted 0 | DB integration |
| ART013A2-FT-041 | Geen dubbele musicians | Backfill tweemaal uitgevoerd | Duplicate count 0 | DB integration |
| ART013A2-FT-042 | Geen ontbrekende geldige persons | Volledige backfill uitgevoerd | Missing valid count 0 | DB integration |
| ART013A2-FT-043 | Orphan-link | Musician verwijst naar niet-bestaande artist in testdata | Verify meldt blocker/warning volgens contract | DB integration |
| ART013A2-FT-044 | Non-person legacy-link | Musician linkt aan band/group | Verify meldt warning; verwijdert niets | DB integration |
| ART013A2-FT-045 | Verify read-only | Database snapshot vóór/na | Geen wijzigingen | DB integration |
| ART013A2-FT-046 | Verify summary | Schone database | Alle verplichte checks `PASS`; exitcode 0 | shell + DB integration |

### F. ART-013A trigger-regressie

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-047 | Person naam wijzigen | Person met gekoppelde musician | `mu_musician_name` wordt bijgewerkt | DB integration |
| ART013A2-FT-048 | Person geboortedatum wijzigen | Geldige datum | Musician geboortedatum wordt bijgewerkt | DB integration |
| ART013A2-FT-049 | Person sterfdatum wijzigen | Geldige datum/null conform triggercontract | Musician passing volgt artist | DB integration |
| ART013A2-FT-050 | Person website wijzigen | URL of null | Musician website volgt artist | DB integration |
| ART013A2-FT-051 | Meerdere mapped velden tegelijk | Eén artist-update | Alle mapped velden consistent bijgewerkt | DB integration |
| ART013A2-FT-052 | Band wijzigen | Band/group met eventueel legacy-link | Geen musician-sync | DB integration |
| ART013A2-FT-053 | Person zonder musician wijzigen | Geen gekoppelde musician | Geen musician aangemaakt | DB integration |
| ART013A2-FT-054 | Musician wijzigen | Gekoppelde musician handmatig gewijzigd | Artist blijft ongewijzigd | DB integration |
| ART013A2-FT-055 | Artist delete | Testperson met musician; delete binnen transactie | Musician wordt niet door sync verwijderd | DB integration |
| ART013A2-FT-056 | Artist deactiveren | Indien statusveld aanwezig | Musician blijft bestaan; geen delete/ontkoppeling | DB integration |
| ART013A2-FT-057 | Artist merge | Bestaande mergeflow op testdata | Musician wordt niet verwijderd; eventuele linkafhandeling volgt bestaand mergecontract en wordt gerapporteerd | DB integration / app integration |

### G. Testisolatie, logging en packaging

| ID | Scenario | Voorwaarde / invoer | Verwacht resultaat | Automatiseringslaag |
|---|---|---|---|---|
| ART013A2-FT-058 | Productieomgeving geblokkeerd | DB/env gemarkeerd als productie | Integratietest weigert te starten | shell |
| ART013A2-FT-059 | Transactionele rollback | Integratietest voltooid | Geen `__ART013A2_TEST__` records achtergebleven | DB integration |
| ART013A2-FT-060 | Fout tijdens test | Test geforceerd onderbroken | Cleanup/rollback; geen blijvende testdata | DB integration |
| ART013A2-FT-061 | Credentials niet gelogd | Env bevat wachtwoord | Wachtwoord/connection string niet in output/log | shell contract |
| ART013A2-FT-062 | Tee logging | Documentatiecommando uitgevoerd | Logbestand met stdout en stderr aanwezig | manual/shell |
| ART013A2-FT-063 | Package zonder secrets | Release-ZIP gemaakt | Geen `.env` of dumps | packaging contract |
| ART013A2-FT-064 | Package zonder runtime artifacts | Release-ZIP gemaakt | Geen `node_modules` of `logs` | packaging contract |
| ART013A2-FT-065 | Package zonder macOS metadata | Release-ZIP gemaakt | Geen `.DS_Store`, `__MACOSX`, `._*` | packaging contract |

## 5. Automatiseringsmapping

### 5.1 Contracttests

`tests/art013a2DatabaseHardening.contract.test.mjs` controleert statisch minimaal:

- npm-scripts bestaan;
- shellscripts gebruiken `set -euo pipefail`;
- SQL gebruikt `ON_ERROR_STOP`;
- preflight bevat geen DML/DDL;
- duplicate-guard aanwezig;
- vaste statuscodes/outputlabels aanwezig;
- verify-script bestaat;
- testscript bevat productieguard en rollback/cleanup;
- documentatie en release notes aanwezig;
- packaging-excludes aanwezig.

### 5.2 Database-integratietests

`tests/art013a2DatabaseIntegration.test.mjs` of SQL/shell-equivalent voert minimaal FT-001, FT-008, FT-011, FT-012, FT-019 t/m FT-057 en FT-059 uit.

### 5.3 Packagingtests

Bestaande `tests/packaging.contract.test.mjs` uitbreiden met macOS metadata en ART-013A-2 documenten/scripts.

## 6. Handmatige acceptatiechecklist

- [ ] Preflight draait tegen de bedoelde Docker-container.
- [ ] Database- en containernaam zijn zichtbaar, credentials niet.
- [ ] Blockers = 0 of zijn bewust opgelost.
- [ ] Warnings zijn beoordeeld.
- [ ] Migraties draaien succesvol en herhaalbaar.
- [ ] Preview-aantallen zijn logisch en steekproefsgewijs gecontroleerd.
- [ ] Execute voegt exact de verwachte records toe.
- [ ] Bestaande musicians zijn niet aangepast.
- [ ] Tweede execute voegt nul records toe.
- [ ] Verify geeft geen onverwachte duplicates/missing/orphans.
- [ ] Person-update synchroniseert de gekoppelde musician.
- [ ] Band/group-update synchroniseert niet.
- [ ] Person zonder musician veroorzaakt geen automatische insert.
- [ ] Musician-update verandert artist niet.
- [ ] Delete/deactiveren/merge verwijdert musician niet.
- [ ] Integratietests laten geen testrecords achter.
- [ ] Alle logs zijn opgeslagen.
- [ ] Release-ZIP is schoon.

## 7. Bewijs vastleggen

Voor acceptatie worden vastgelegd:

- gebruikte applicatieversie/ZIP;
- datum en tijd;
- Docker-containernaam;
- database-naam;
- preflight-summary;
- preview-summary;
- eerste en tweede execute-summary;
- verify-summary;
- uitslag contracttests;
- uitslag database-integratietests;
- eventuele warnings en genomen besluiten.

Geen wachtwoorden, tokens of volledige connection strings opnemen.


## 8. Uitvoercommando's na implementatie

Contracttests zonder database:

```bash
mkdir -p logs && npm run test:art013a2:contract 2>&1 | tee "logs/art013a2-contract-$(date +%Y%m%d-%H%M%S).log"
```

Preflight:

```bash
mkdir -p logs && npm run musician:preflight 2>&1 | tee "logs/art013a2-preflight-$(date +%Y%m%d-%H%M%S).log"
```

Database-integratietest, uitsluitend lokaal tegen development/test:

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013a2:db 2>&1 | tee "logs/art013a2-dbtest-$(date +%Y%m%d-%H%M%S).log"
```

Volledige suite:

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013a2 2>&1 | tee "logs/art013a2-all-$(date +%Y%m%d-%H%M%S).log"
```

## 9. Traceability naar automatische tests

- FT-001 t/m FT-018: contracttests plus preflight SQL/shell.
- FT-019 t/m FT-043: preview, execute en verify SQL; database-acceptatie tegen Docker.
- FT-044 t/m FT-057: transactionele integratietest `20260711_art013a2_integration_test.sql`.
- FT-058 t/m FT-061: productieguard, rollbackcontrole en credential-contracttests.
- FT-062: handmatige logacceptatie via de gedocumenteerde `tee`-commando's.
- FT-063 t/m FT-065: packaging-contracttest en finale ZIP-inspectie.
