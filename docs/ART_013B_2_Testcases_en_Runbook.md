# ART-013B-2 — Functionele testcases en automatiseringsbasis

Datum: 2026-07-12

## Teststrategie

De testcase-ID's vormen het traceability-contract voor unit-, API-, PostgreSQL-, component- en Chromium Playwright-tests.


## Preflight en migratie

- **ART013B2-TC-001** — preflight leest centrale .env. Automatisering: `DB/contract`.
- **ART013B2-TC-002** — proposal-tabel ontbreekt vóór migratie als INFO. Automatisering: `DB/contract`.
- **ART013B2-TC-003** — source-tabel ontbreekt vóór migratie als INFO. Automatisering: `DB/contract`.
- **ART013B2-TC-004** — bestaande musician_in_band sleutel wordt herkend. Automatisering: `DB/contract`.
- **ART013B2-TC-005** — migratie maakt proposal-tabel. Automatisering: `DB/contract`.
- **ART013B2-TC-006** — migratie maakt source-tabel. Automatisering: `DB/contract`.
- **ART013B2-TC-007** — migratie maakt foreign keys. Automatisering: `DB/contract`.
- **ART013B2-TC-008** — migratie maakt statusconstraints. Automatisering: `DB/contract`.
- **ART013B2-TC-009** — migratie maakt idempotentie-indexen. Automatisering: `DB/contract`.
- **ART013B2-TC-010** — tweede migratierun is veilig. Automatisering: `DB/contract`.
- **ART013B2-TC-011** — verify detecteert orphan proposals. Automatisering: `DB/contract`.
- **ART013B2-TC-012** — verify detecteert orphan sources. Automatisering: `DB/contract`.

## Discogs provider en normalisatie

- **ART013B2-TC-013** — provider gebruikt bestaande Discogs-config. Automatisering: `unit/provider`.
- **ART013B2-TC-014** — niet-gekoppelde band geeft foutcode. Automatisering: `unit/provider`.
- **ART013B2-TC-015** — members worden genormaliseerd. Automatisering: `unit/provider`.
- **ART013B2-TC-016** — former members worden genormaliseerd. Automatisering: `unit/provider`.
- **ART013B2-TC-017** — ontbrekende rol is toegestaan. Automatisering: `unit/provider`.
- **ART013B2-TC-018** — ontbrekende periode is toegestaan. Automatisering: `unit/provider`.
- **ART013B2-TC-019** — bron-URL wordt bewaard. Automatisering: `unit/provider`.
- **ART013B2-TC-020** — raw payload wordt bewaard. Automatisering: `unit/provider`.
- **ART013B2-TC-021** — ongeldig person-id wordt invalid. Automatisering: `unit/provider`.
- **ART013B2-TC-022** — provider timeout geeft stabiele fout. Automatisering: `unit/provider`.
- **ART013B2-TC-023** — provider rate limit geeft stabiele fout. Automatisering: `unit/provider`.
- **ART013B2-TC-024** — geen scrapingfallback wordt gebruikt. Automatisering: `unit/provider`.

## Genereren en idempotentie

- **ART013B2-TC-025** — eerste generatie maakt voorstellen. Automatisering: `API/DB`.
- **ART013B2-TC-026** — tweede generatie maakt geen dubbelen. Automatisering: `API/DB`.
- **ART013B2-TC-027** — accepted blijft behouden. Automatisering: `API/DB`.
- **ART013B2-TC-028** — ignored blijft behouden. Automatisering: `API/DB`.
- **ART013B2-TC-029** — review_later blijft behouden. Automatisering: `API/DB`.
- **ART013B2-TC-030** — retrieved_at wordt geactualiseerd. Automatisering: `API/DB`.
- **ART013B2-TC-031** — raw payload wordt geactualiseerd. Automatisering: `API/DB`.
- **ART013B2-TC-032** — generation summary telt inserted. Automatisering: `API/DB`.
- **ART013B2-TC-033** — generation summary telt updated. Automatisering: `API/DB`.
- **ART013B2-TC-034** — generation summary telt conflicts. Automatisering: `API/DB`.
- **ART013B2-TC-035** — lege Discogs-lijst is geldig. Automatisering: `API/DB`.
- **ART013B2-TC-036** — generatiefout wijzigt bestaande queue niet. Automatisering: `API/DB`.

## Matching en classificatie

- **ART013B2-TC-037** — match via externe Discogs-id. Automatisering: `unit/API/DB`.
- **ART013B2-TC-038** — match via exacte genormaliseerde naam. Automatisering: `unit/API/DB`.
- **ART013B2-TC-039** — match via alternatieve spelling. Automatisering: `unit/API/DB`.
- **ART013B2-TC-040** — match via naam en geboortedatum. Automatisering: `unit/API/DB`.
- **ART013B2-TC-041** — geen match wordt new_musician. Automatisering: `unit/API/DB`.
- **ART013B2-TC-042** — één match wordt matched_musician. Automatisering: `unit/API/DB`.
- **ART013B2-TC-043** — bestaande relatie wordt matched_relation. Automatisering: `unit/API/DB`.
- **ART013B2-TC-044** — aanvullende data wordt partial. Automatisering: `unit/API/DB`.
- **ART013B2-TC-045** — afwijkende rol wordt conflict. Automatisering: `unit/API/DB`.
- **ART013B2-TC-046** — afwijkende periode wordt conflict. Automatisering: `unit/API/DB`.
- **ART013B2-TC-047** — meerdere kandidaten wordt ambiguous. Automatisering: `unit/API/DB`.
- **ART013B2-TC-048** — onbruikbare naam wordt invalid. Automatisering: `unit/API/DB`.
- **ART013B2-TC-049** — confidence accepteert niet automatisch. Automatisering: `unit/API/DB`.
- **ART013B2-TC-050** — standalone musician kan correcte match zijn. Automatisering: `unit/API/DB`.

## Reviewqueue en filters

- **ART013B2-TC-051** — queue toont voorstellen. Automatisering: `component/Playwright`.
- **ART013B2-TC-052** — statusfilter werkt. Automatisering: `component/Playwright`.
- **ART013B2-TC-053** — matchstatusfilter werkt. Automatisering: `component/Playwright`.
- **ART013B2-TC-054** — zoekterm werkt. Automatisering: `component/Playwright`.
- **ART013B2-TC-055** — aandachtfilter werkt. Automatisering: `component/Playwright`.
- **ART013B2-TC-056** — tellers zijn correct. Automatisering: `component/Playwright`.
- **ART013B2-TC-057** — bronlink opent veilig. Automatisering: `component/Playwright`.
- **ART013B2-TC-058** — loading state zichtbaar. Automatisering: `component/Playwright`.
- **ART013B2-TC-059** — lege queue toont uitleg. Automatisering: `component/Playwright`.
- **ART013B2-TC-060** — filters blijven na refresh behouden. Automatisering: `component/Playwright`.

## Acceptatie bestaande musician

- **ART013B2-TC-061** — bestaande vrije musician kan worden gekozen. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-062** — reeds gekoppelde musician blijft geldig. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-063** — nieuwe relatie wordt aangemaakt. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-064** — bestaande relatie wordt niet gedupliceerd. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-065** — source wordt gekoppeld. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-066** — proposal wordt accepted. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-067** — stale voorstel wordt geweigerd. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-068** — ambigue match vereist keuze. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-069** — lokale rol wordt niet stil overschreven. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-070** — rollback bij source-fout. Automatisering: `API/DB/Playwright`.

## Acceptatie nieuwe standalone musician

- **ART013B2-TC-071** — nieuwe musician wordt aangemaakt zonder artist. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-072** — musician_in_band wordt aangemaakt. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-073** — source wordt aangemaakt. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-074** — proposal wordt accepted. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-075** — mogelijke duplicaten worden getoond. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-076** — gebruiker kan annuleren. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-077** — artist-tabel blijft ongewijzigd. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-078** — fout in relatie rolt musician terug. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-079** — fout in source rolt alles terug. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-080** — tweede acceptatie wordt geweigerd. Automatisering: `API/DB/Playwright`.

## Partial/conflict/source-only

- **ART013B2-TC-081** — leeg lokaal rolveld kan worden aangevuld. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-082** — gevuld rolveld vereist keuze. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-083** — leeg beginveld kan worden aangevuld. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-084** — conflicterende begindatum vereist keuze. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-085** — alleen source koppelen wijzigt relatie niet. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-086** — zelfde source wordt niet gedupliceerd. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-087** — conflict kan later worden gezet. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-088** — ignored voorstel kan heropenen. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-089** — review_later kan heropenen. Automatisering: `API/DB/Playwright`.
- **ART013B2-TC-090** — accepted voorstel kan niet heropenen. Automatisering: `API/DB/Playwright`.

## Concurrency, rollback en security

- **ART013B2-TC-091** — expectedUpdatedAt is verplicht bij mutatie. Automatisering: `DB/API`.
- **ART013B2-TC-092** — gelijktijdige acceptatie levert één winnaar. Automatisering: `DB/API`.
- **ART013B2-TC-093** — SQL-injectie in zoekterm is veilig. Automatisering: `DB/API`.
- **ART013B2-TC-094** — onbevoegde statusovergang wordt geweigerd. Automatisering: `DB/API`.
- **ART013B2-TC-095** — ongeldige URL wordt geweigerd of geneutraliseerd. Automatisering: `DB/API`.
- **ART013B2-TC-096** — raw payload wordt niet als HTML gerenderd. Automatisering: `DB/API`.
- **ART013B2-TC-097** — transactionele test rolt terug. Automatisering: `DB/API`.
- **ART013B2-TC-098** — leftovers zijn nul. Automatisering: `DB/API`.
- **ART013B2-TC-099** — productiedatabaseguard werkt. Automatisering: `DB/API`.
- **ART013B2-TC-100** — API logt fout zonder token te tonen. Automatisering: `DB/API`.

## Regressie, build en packaging

- **ART013B2-TC-101** — handmatig bandlid toevoegen blijft werken. Automatisering: `contract/build`.
- **ART013B2-TC-102** — ART-013A-3 standalone musician blijft werken. Automatisering: `contract/build`.
- **ART013B2-TC-103** — artist-musician sync blijft werken. Automatisering: `contract/build`.
- **ART013B2-TC-104** — naamproposalqueue blijft werken. Automatisering: `contract/build`.
- **ART013B2-TC-105** — Discogs artistkoppeling blijft werken. Automatisering: `contract/build`.
- **ART013B2-TC-106** — Vite build slaagt. Automatisering: `contract/build`.
- **ART013B2-TC-107** — Node contracttests slagen. Automatisering: `contract/build`.
- **ART013B2-TC-108** — Chromium hoofdflow is beschreven. Automatisering: `contract/build`.
- **ART013B2-TC-109** — ZIP bevat geen node_modules. Automatisering: `contract/build`.
- **ART013B2-TC-110** — ZIP bevat geen .env of logs. Automatisering: `contract/build`.

Totaal: **110 testcases**.
