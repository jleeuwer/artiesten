# ART-013A-3 — Functionele en technische testcases en runbook

Datum: 2026-07-12  
Status: testbasis voor codesprint

## 1. Doel

Dit document vormt de traceerbare basis voor unit-, API-, component-, PostgreSQL-integratie-, Chromium- en packagingtests van ART-013A-3. De testcase-ID’s moeten in de codesprint terugkomen in testnamen of een expliciete mapping.

## 2. Automatiseringslagen

- **Unit/contract:** validators, routes, servicecontracten en documenttraceability.
- **API:** request/response, foutcodes en transacties.
- **PostgreSQL-integratie:** constraints, locks, rollback, sync en datakwaliteit.
- **Component:** formulierstate, waarschuwingen en refresh.
- **Chromium Playwright:** volledige gebruikersflows, toetsenbord, responsive en embedded mode.
- **Packaging/build:** productiebuild en schone release.

## A. Preflight en schema

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-001` | Preflight leest de centrale `.env` en gebruikt `ARTIST_DB_CONTAINER`, `ARTIST_DB_NAME` en `ARTIST_DB_USER`. | Contract + shelltest |
| `A3-TC-002` | Preflight blokkeert wanneer tabel `artist` ontbreekt. | PostgreSQL-integratietest |
| `A3-TC-003` | Preflight blokkeert wanneer tabel `musician` ontbreekt. | PostgreSQL-integratietest |
| `A3-TC-004` | Preflight controleert `artist.ar_artist_key` en `artist.ar_artist_type`. | PostgreSQL-integratietest |
| `A3-TC-005` | Preflight controleert `musician.mu_musician_key` en nullable `musician.ar_artist_key`. | PostgreSQL-integratietest |
| `A3-TC-006` | Preflight inventariseert de foreign key op `musician.ar_artist_key`. | PostgreSQL-integratietest |
| `A3-TC-007` | Preflight inventariseert de partial unique index op `musician.ar_artist_key`. | PostgreSQL-integratietest |
| `A3-TC-008` | Preflight rapporteert actieve persoonsartists zonder musician. | PostgreSQL-integratietest |
| `A3-TC-009` | Preflight rapporteert musicians gekoppeld aan niet-persoonsartists. | PostgreSQL-integratietest |
| `A3-TC-010` | Standalone musicians met `ar_artist_key IS NULL` zijn PASS/INFO en geen blocker. | PostgreSQL-integratietest |
| `A3-TC-011` | Preflight rapporteert orphan artistkeys op musician. | PostgreSQL-integratietest |
| `A3-TC-012` | Preflight rapporteert dubbele artistkoppelingen voordat migratie start. | PostgreSQL-integratietest |

## B. Migratie en constraints

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-013` | Migratie is idempotent en kan tweemaal draaien. | PostgreSQL-integratietest |
| `A3-TC-014` | Partial unique index voorkomt meerdere musicians voor één artist. | PostgreSQL-integratietest |
| `A3-TC-015` | Meerdere standalone musicians met NULL artistkey blijven toegestaan. | PostgreSQL-integratietest |
| `A3-TC-016` | Migratie verwijdert geen bestaande musicianrecords. | PostgreSQL-integratietest |
| `A3-TC-017` | Migratie verwijdert geen `musician_in_band`-relaties. | PostgreSQL-integratietest |
| `A3-TC-018` | Foreign key veroorzaakt geen cascade-delete van musician bij artistdelete. | PostgreSQL-integratietest |
| `A3-TC-019` | Optionele timestamps worden alleen toegevoegd wanneer zij ontbreken. | PostgreSQL-integratietest |
| `A3-TC-020` | Migratie faalt met duidelijke blocker bij bestaande dubbele niet-null artistlinks. | PostgreSQL-integratietest |

## C. Standalone musician CRUD

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-021` | Gebruiker kan standalone musician met alleen naam aanmaken. | API + componenttest |
| `A3-TC-022` | Standalone musician wordt opgeslagen met `ar_artist_key = NULL`. | API + DB-test |
| `A3-TC-023` | Naam is verplicht en whitespace-only wordt geweigerd. | Unit + API-test |
| `A3-TC-024` | Optionele geboorte-, sterfdatum, website en opmerkingen worden opgeslagen. | API-test |
| `A3-TC-025` | Ongeldige datum wordt met veldfout geweigerd. | Unit + API-test |
| `A3-TC-026` | Standalone musician kan worden gewijzigd zonder artist te raken. | API + DB-test |
| `A3-TC-027` | Stale update van musician wordt geweigerd. | API + DB-test |
| `A3-TC-028` | Musician detail toont gekoppelde artist alleen wanneer aanwezig. | Component + Playwright |
| `A3-TC-029` | Standalone musician verschijnt niet in algemene artistlijst. | API + Playwright |
| `A3-TC-030` | Zoeken naar musicians bevat standalone en gekoppelde musicians. | API + Playwright |
| `A3-TC-031` | Zoekresultaat toont naam, datums, gekoppelde artist en bandsamenvatting. | Component + Playwright |
| `A3-TC-032` | Possible duplicate candidates worden vóór create getoond. | API + componenttest |

## D. Nieuwe persoonsartist

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-033` | Nieuwe artist van type person maakt transactioneel één musician. | API + DB-test |
| `A3-TC-034` | Nieuwe bandartist maakt geen musician. | API + DB-test |
| `A3-TC-035` | Nieuwe group/duo/trio maakt geen musician. | API + DB-test |
| `A3-TC-036` | Fout bij musiciancreate rolt artistcreate terug. | PostgreSQL-integratietest |
| `A3-TC-037` | Person-create kan een bestaande vrije musician selecteren. | API + Playwright |
| `A3-TC-038` | Person-create weigert musician die al aan artist gekoppeld is. | API-test |
| `A3-TC-039` | Person-create toont dataverschillen vóór koppelen. | Component + Playwright |
| `A3-TC-040` | Na commit heeft person exact één linked musician. | PostgreSQL-integratietest |
| `A3-TC-041` | Artistnaam en kerndatums worden volgens expliciete keuze naar musician gekopieerd. | API + DB-test |
| `A3-TC-042` | Annuleren van de keuze maakt geen artist of musician aan. | Playwright |

## E. Nieuw bandlid vanuit bandcontext

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-043` | Bandledenpaneel toont actie `Nieuw bandlid aanmaken`. | Component + Playwright |
| `A3-TC-044` | Nieuw bandlid maakt musician en `musician_in_band` in één transactie. | API + DB-test |
| `A3-TC-045` | Nieuw bandlid maakt geen artist. | API + DB-test |
| `A3-TC-046` | Fout in relatievalidatie rolt nieuwe musician terug. | PostgreSQL-integratietest |
| `A3-TC-047` | Rol, periode, bron en opmerkingen worden tegelijk opgeslagen. | API + DB-test |
| `A3-TC-048` | Duplicate candidate waarschuwing verschijnt vóór create-member. | Component + Playwright |
| `A3-TC-049` | Gebruiker kan na waarschuwing bestaande musician kiezen. | Playwright |
| `A3-TC-050` | Na succes ververst bandledenpaneel zonder volledige paginareload. | Component + Playwright |
| `A3-TC-051` | Create-member respecteert ART-013B-1 overlapbevestiging. | API + Playwright |
| `A3-TC-052` | Create-member laat geen gedeeltelijke records achter bij fout. | PostgreSQL-integratietest |

## F. Koppelen en promoveren

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-053` | Vrije musician kan aan bestaande persoonsartist worden gekoppeld. | API + DB-test |
| `A3-TC-054` | Koppeling aan band/group/duo/trio wordt geweigerd. | API-test |
| `A3-TC-055` | Artist die al een musician heeft kan niet opnieuw gekoppeld worden. | API-test |
| `A3-TC-056` | Musician die al een artist heeft kan niet opnieuw gekoppeld worden. | API-test |
| `A3-TC-057` | Linkflow lockt artist en musician tegen gelijktijdige koppeling. | Concurrency DB-test |
| `A3-TC-058` | Stale linkscherm wordt met 409 geweigerd. | API + Playwright |
| `A3-TC-059` | Standalone musician kan worden gepromoveerd naar nieuwe persoonsartist. | API + Playwright |
| `A3-TC-060` | Promotie maakt geen tweede musician. | PostgreSQL-integratietest |
| `A3-TC-061` | Bestaande bandrelaties blijven na promotie bestaan. | PostgreSQL-integratietest |
| `A3-TC-062` | Promotie rolt volledig terug wanneer artistcreate faalt. | PostgreSQL-integratietest |
| `A3-TC-063` | Promotie toont mogelijke artist- en musicianduplicaten. | Component + Playwright |
| `A3-TC-064` | Annuleren van promotie laat database ongewijzigd. | Playwright |

## G. Synchronisatie

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-065` | Wijziging van gekoppelde persoonsartist synchroniseert naam naar musician. | PostgreSQL-integratietest |
| `A3-TC-066` | Geboorte-, sterfdatum en website synchroniseren naar linked musician. | PostgreSQL-integratietest |
| `A3-TC-067` | Wijziging van standalone musician wijzigt geen artist. | PostgreSQL-integratietest |
| `A3-TC-068` | Wijziging van musician synchroniseert nooit terug naar artist. | PostgreSQL-integratietest |
| `A3-TC-069` | Wijziging van bandartist raakt geen musician. | PostgreSQL-integratietest |
| `A3-TC-070` | Na gecontroleerde relink ontvangt oude musician geen updates meer. | PostgreSQL-integratietest |
| `A3-TC-071` | Nieuwe linked musician krijgt bij link een expliciet bevestigde beginsynchronisatie. | API + DB-test |
| `A3-TC-072` | Trigger blijft beperkt tot UPDATE en maakt geen musician aan. | Contract + DB-test |

## H. Delete, merge en relink

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-073` | Musician met artistlink kan niet hard worden verwijderd. | API + DB-test |
| `A3-TC-074` | Musician met bandrelaties kan niet hard worden verwijderd. | API + DB-test |
| `A3-TC-075` | Vrije musician zonder referenties kan volgens beleid worden verwijderd/deactiveerd. | API-test |
| `A3-TC-076` | Artistdelete verwijdert musician niet. | PostgreSQL-integratietest |
| `A3-TC-077` | Artistmerge behoudt één geldige musicianlink. | PostgreSQL-integratietest |
| `A3-TC-078` | Bandrelaties blijven na artistmerge behouden. | PostgreSQL-integratietest |
| `A3-TC-079` | Relink is één transactie: oude link los, nieuwe link vast. | PostgreSQL-integratietest |
| `A3-TC-080` | Relinkfout rolt oude koppeling terug. | PostgreSQL-integratietest |
| `A3-TC-081` | Normale UI biedt geen losse unlink die actieve person orphan maakt. | Componenttest |
| `A3-TC-082` | Typewijziging person→band vereist gecontroleerde afhandeling van musicianlink. | API + Playwright |

## I. Verify en datakwaliteit

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-083` | Verify rapporteert person zonder musician als fout. | PostgreSQL-integratietest |
| `A3-TC-084` | Verify rapporteert meerdere musicians per artist. | PostgreSQL-integratietest |
| `A3-TC-085` | Verify rapporteert musician gekoppeld aan non-person artist. | PostgreSQL-integratietest |
| `A3-TC-086` | Verify rapporteert orphan artistkey. | PostgreSQL-integratietest |
| `A3-TC-087` | Verify accepteert standalone musician als geldig. | PostgreSQL-integratietest |
| `A3-TC-088` | Verify rapporteert lege musiciannaam. | PostgreSQL-integratietest |
| `A3-TC-089` | Verify signaleert afwijkende gedeelde velden tussen linked artist en musician. | PostgreSQL-integratietest |
| `A3-TC-090` | Verify rapporteert machineleesbare summary en exitcode. | Shell + PostgreSQL-test |

## J. Security, UX, regressie en packaging

| ID | Scenario | Automatisering |
|---|---|---|
| `A3-TC-091` | Alle write-endpoints valideren numerieke sleutels en payloadlengten. | Unit + API-test |
| `A3-TC-092` | Notes en URLs worden veilig gerenderd zonder scriptinjectie. | Component + Playwright |
| `A3-TC-093` | Toetsenbord- en focusflow werkt in create/link/promote-modals. | Playwright |
| `A3-TC-094` | Embedded Shellstarter-layout blijft bruikbaar. | Chromium Playwright |
| `A3-TC-095` | ART-013A, ART-013A-1/2 en ART-013B-1 regressies blijven groen. | Contract + DB-test |
| `A3-TC-096` | Database-integratietest draait in transactie en eindigt met `leftovers=0`. | PostgreSQL-integratietest |
| `A3-TC-097` | Productieguard blokkeert DB-test zonder expliciete toestemming. | Shelltest |
| `A3-TC-098` | Productiebuild slaagt. | Buildtest |
| `A3-TC-099` | Release-ZIP bevat geen `.env`, logs, `node_modules` of macOS-metadata. | Packagingtest |
| `A3-TC-100` | Documentatie, API-contract en testcase-ID’s blijven traceerbaar. | Contracttest |

## 3. Database-runbook

Geplande volgorde voor de codesprint:

```bash
mkdir -p logs && npm run musician-model:preflight 2>&1 | tee "logs/art013a3-preflight-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run db:migrate:art013a3 2>&1 | tee "logs/art013a3-migration-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run musician-model:verify 2>&1 | tee "logs/art013a3-verify-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013a3:db 2>&1 | tee "logs/art013a3-dbtest-$(date +%Y%m%d-%H%M%S).log"
```

## 4. Technische testdata

- Alle testnamen gebruiken prefix `__ART013A3_TEST__`.
- Database-integratietests draaien tussen `BEGIN` en `ROLLBACK`.
- Voor en na de test wordt op testprefix en relaties gecontroleerd.
- Een succesvolle test rapporteert `[SUMMARY][ART013A3-DB-TEST] passed=true leftovers=0`.
- De test weigert uitvoering zonder `ARTIST_DB_TEST_ALLOWED=true` of op een als production gemarkeerde omgeving.

## 5. Minimale handmatige acceptatie

1. Maak vanuit een band een nieuw bandlid zonder artist aan.
2. Controleer dat alleen musician en lidmaatschap bestaan.
3. Promoveer dezelfde musician later naar een persoonsartist.
4. Controleer dat de bandrelatie behouden blijft.
5. Wijzig de artist en controleer artist→musician-sync.
6. Maak een tweede standalone musician en koppel deze aan een bestaande vrije persoonsartist.
7. Controleer duplicate- en stale-statefeedback.
8. Voer verify uit en controleer dat standalone musicians niet als fout verschijnen.
