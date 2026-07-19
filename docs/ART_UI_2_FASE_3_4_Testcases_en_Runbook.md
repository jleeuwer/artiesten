# ART-UI-2 Fase 3/4 — Functionele en technische testcases

Datum: 2026-07-14  
Status: testbasis voor implementatie en automatisering

## A. Standalone scrollowner

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-001 | Open app standalone | document is primaire verticale scrollowner | Playwright |
| UI2-034-TC-002 | Scroll van toolbar naar details | volledige pagina blijft bereikbaar | Playwright |
| UI2-034-TC-003 | Cursor boven details en wheel | document scrolt verder | Playwright |
| UI2-034-TC-004 | Detailmodules met lange content | geen interne verticale scrollbar | CSS-contract + Playwright |
| UI2-034-TC-005 | Home/End op document | begin/einde pagina bereikbaar | Playwright |

## B. Artiestentabel

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-006 | Veel artiesten | tabel heeft één verticale scrollbar | Playwright |
| UI2-034-TC-007 | Brede tabel | horizontale scrollbar blijft werken | Playwright |
| UI2-034-TC-008 | Verticaal tabelscrollen | header blijft sticky | Playwright/visual |
| UI2-034-TC-009 | Horizontaal tabelscrollen | sticky header blijft uitgelijnd | Playwright/visual |
| UI2-034-TC-010 | Lage viewport | tabel blijft minimaal bruikbaar | Playwright |
| UI2-034-TC-011 | Hoge viewport | tabel wordt niet onbeperkt hoog | CSS-contract |
| UI2-034-TC-012 | 200% zoom | header en rijen blijven bereikbaar | Handmatig/axe |
| UI2-034-TC-013 | Loadingstatus | containerhoogte springt niet | Componenttest |
| UI2-034-TC-014 | Geen resultaten | lege status blijft in tabelviewport | Componenttest |
| UI2-034-TC-015 | Foutmelding boven tabel | tabel en details blijven bereikbaar | Playwright |

## C. Scrollpositiebehoud

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-016 | Selecteer artiest midden in tabel | tabelpositie blijft | Playwright |
| UI2-034-TC-017 | Open details via naam | tabelpositie blijft | Playwright |
| UI2-034-TC-018 | Open/sluit Edit-modal | tabelpositie blijft | Playwright |
| UI2-034-TC-019 | Toggle favoriet | tabelpositie blijft | Playwright |
| UI2-034-TC-020 | Discogs koppelen | tabelpositie blijft | Playwright |
| UI2-034-TC-021 | Primaire image wijzigen | tabelpositie blijft | Playwright |
| UI2-034-TC-022 | Bandrelatie opslaan | tabelpositie blijft | Playwright |
| UI2-034-TC-023 | Proposal negeren/later | tabelpositie blijft | Playwright |

## D. Scrollreset

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-024 | Nieuwe zoekterm | tabel scrollTop wordt 0 | Component/Playwright |
| UI2-034-TC-025 | Filter wijzigen | tabel scrollTop wordt 0 | Playwright |
| UI2-034-TC-026 | Sortering wijzigen | tabel scrollTop wordt 0 | Playwright |
| UI2-034-TC-027 | Paginering wijzigen | tabel scrollTop wordt 0 | Playwright |
| UI2-034-TC-028 | Filters wissen | tabel scrollTop wordt 0 | Playwright |
| UI2-034-TC-029 | Zoekterm levert nul resultaten | tabel bovenaan en details leeg | Playwright |

## E. Detailstate en async

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-030 | Nieuwe zoekterm na geselecteerde artiest | details worden onmiddellijk gewist | Componenttest |
| UI2-034-TC-031 | Zoekterm zonder resultaat | oude artiestdetails komen niet terug | Playwright |
| UI2-034-TC-032 | Oude relations-response arriveert later | response wordt genegeerd | Unit/componenttest |
| UI2-034-TC-033 | Snel meerdere artiesten selecteren | laatste selectie blijft leidend | Componenttest |
| UI2-034-TC-034 | Zoekterm wissen | neutrale state volgens bestaande flow | Componenttest |

## F. Embedded Shellstarter

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-035 | Open embedded | workspace is primaire scrollowner | Playwright embedded fixture |
| UI2-034-TC-036 | Shell en app | geen dubbele verticale hoofdscrollbar | Playwright/visual |
| UI2-034-TC-037 | Embedded lage hoogte | toolbar, tabel en details bereikbaar | Playwright |
| UI2-034-TC-038 | Embedded hoge hoogte | geen onnodige lege scrollruimte | Visual |
| UI2-034-TC-039 | Theme switch | hoogte/scrollowner blijft stabiel | Playwright |
| UI2-034-TC-040 | Parent resize | layout herberekent zonder reload | Playwright |
| UI2-034-TC-041 | Embedded wheel boven details | workspace scrolt | Playwright |
| UI2-034-TC-042 | Embedded tabelbodem | gebruiker kan daarna workspace naar details scrollen | Playwright |
| UI2-034-TC-043 | Offcanvas embedded | onderliggende workspace staat stil | Playwright |
| UI2-034-TC-044 | Offcanvas sluiten | workspacepositie hersteld | Playwright |

## G. Modals, focus en toetsenbord

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-045 | Edit-modal openen | alleen modal-body scrolt | Playwright |
| UI2-034-TC-046 | Modal sluiten | focus terug op Edit-knop | Playwright |
| UI2-034-TC-047 | Offcanvas sluiten | focus en scrollpositie behouden | Playwright |
| UI2-034-TC-048 | PageDown in tabelviewport | tabel scrolt wanneer viewport focus heeft | Playwright |
| UI2-034-TC-049 | PageDown buiten tabel | primaire owner scrolt | Playwright |
| UI2-034-TC-050 | Escape sluit overlay | onderliggende layout ongewijzigd | Playwright |

## H. Responsive en trackpad

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-051 | 1440×900 | standaard desktoplayout | Visual |
| UI2-034-TC-052 | 1280×720 | lage desktoplayout bruikbaar | Visual |
| UI2-034-TC-053 | 1024×768 | horizontale tabelscroll beschikbaar | Visual |
| UI2-034-TC-054 | 768×900 | content niet afgesneden | Visual |
| UI2-034-TC-055 | Mac-trackpad inertial scroll | geen vastlopen tussen tabel en workspace | Handmatig |
| UI2-034-TC-056 | Muiswiel | voorspelbare owner per cursorpositie | Handmatig/Playwright wheel |
| UI2-034-TC-057 | Shift+wheel/horizontaal gesture | tabel horizontaal, pagina niet onverwacht | Handmatig |

## I. Technische contracten

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-058 | Feature flag uit | Fase 1/2 blijft beschikbaar | Contracttest |
| UI2-034-TC-059 | Feature flag aan | Fase 3/4 layout actief | Contracttest |
| UI2-034-TC-060 | Layoutcomponent | bevat geen API-calls | Static contract |
| UI2-034-TC-061 | Tabelviewport | één `overflow:auto` owner | CSS contract |
| UI2-034-TC-062 | Detailregion | geen `overflow-y:auto/scroll` | Scrollaudit |
| UI2-034-TC-063 | Embedded workspace | één `overflow-y:auto` owner | Scrollaudit |
| UI2-034-TC-064 | Geen globale body lock | geen productieregel `body{overflow:hidden}` | CSS contract |
| UI2-034-TC-065 | Sticky z-index | lager dan overlays | CSS contract |
| UI2-034-TC-066 | Geen backendwijziging | routes/payloads ongewijzigd | Contracttest |
| UI2-034-TC-067 | Geen DB-wijziging | geen UI2 migratiescripts | Packagingtest |
| UI2-034-TC-068 | Debug uit productie | debug alleen DEV + envflag | Contracttest |
| UI2-034-TC-069 | Productiebuild | Vite build slaagt | Buildtest |
| UI2-034-TC-070 | Packaging | geen node_modules/.env/logs | Packagingtest |

## J. Functionele regressies

| ID | Scenario | Verwacht | Automatisering |
|---|---|---|---|
| UI2-034-TC-071 | Artist zoeken/selecteren | werkt | Regressie/Playwright |
| UI2-034-TC-072 | Edit artist | werkt | Regressie/Playwright |
| UI2-034-TC-073 | Discogs artist koppelen | werkt | Regressie |
| UI2-034-TC-074 | Discogs resultaten sluiten | werkt | Regressie |
| UI2-034-TC-075 | Enrichmentvoorstellen | werken | Regressie |
| UI2-034-TC-076 | Naamvoorstellenqueue | werkt | Regressie |
| UI2-034-TC-077 | Bandleden handmatig beheren | werkt | Regressie |
| UI2-034-TC-078 | Discogs bandledenqueue/rematch | werkt | Regressie |
| UI2-034-TC-079 | Overledenindicatoren | zichtbaar | Visual/regressie |
| UI2-034-TC-080 | Meldingen/toasts | zichtbaar en niet afgesneden | Playwright |

## Uitvoerrunbook codesprint

```bash
mkdir -p logs && npm run ui:scroll:audit 2>&1 | tee "logs/art-ui2-phase34-scroll-audit-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art-ui-2:phase34 2>&1 | tee "logs/art-ui2-phase34-tests-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run build 2>&1 | tee "logs/art-ui2-phase34-build-$(date +%Y%m%d-%H%M%S).log"
```

Handmatige acceptatie wordt uitgevoerd in standalone en Shellstarter embedded mode, met Mac-trackpad en muis.

## Aanvullende profielfototestcases

- UI2-034-PROFILE-001: zonder primaire foto staat de sectie open.
- UI2-034-PROFILE-002: met primaire foto staat de sectie ingeklapt.
- UI2-034-PROFILE-003: ingeklapte sectie toont thumbnail en knop Profielfoto wijzigen.
- UI2-034-PROFILE-004: openen en sluiten werkt met toetsenbord en `aria-expanded`.
- UI2-034-PROFILE-005: succesvolle keuze ververst lijst/detail en klapt in.
- UI2-034-PROFILE-006: fout bij opslaan laat de sectie open.
- UI2-034-PROFILE-007: wisselen van artist reset de openstatus.
- UI2-034-PROFILE-008: de sectie introduceert geen verticale scrollbar.
