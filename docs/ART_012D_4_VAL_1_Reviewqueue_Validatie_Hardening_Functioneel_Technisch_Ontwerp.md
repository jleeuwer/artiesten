# ART-012D-4-VAL-1 — Discogs naamvoorstellen reviewqueue: functionele validatie en hardening

**Status:** uitgewerkt voor volgende codesprint  
**Datum:** 11-07-2026  
**Baseline:** ART-UI-POLISH-1-Fix-4  
**Voorganger:** ART-012D-4 + ART-012D-4-Fix-1/Fix-2/Fix-3

## 1. Aanleiding

De persistente Discogs-naamvoorstellenreviewqueue is technisch aanwezig. De queue ondersteunt genereren, filteren, zoeken, statustellers, toevoegen als spelling, later beoordelen, negeren, heropenen en conflictblokkades. De huidige automatische tests zijn hoofdzakelijk contracttests: zij bewaken dat code, routes en documentatie aanwezig zijn, maar bewijzen nog niet alle statusovergangen en database-effecten op een echte PostgreSQL-database.

Deze sprint rondt ART-012D-4 functioneel en operationeel af voordat ART-013B wordt gestart.

## 2. Sprintdoel

Aantoonbaar maken dat Discogs aliases, name variations, real names en externe artist names:

1. reproduceerbaar en idempotent in de reviewqueue terechtkomen;
2. correct geclassificeerd worden als nieuw, bestaand, conflict of ongeldig;
3. veilig door alle toegestane statusovergangen lopen;
4. uitsluitend na expliciete gebruikersactie aan `artiesten_spelling` worden toegevoegd;
5. nooit automatisch de canonical artistnaam wijzigen;
6. ook bij gelijktijdige of verouderde gebruikersacties dataconsistent blijven;
7. volledig testbaar zijn met contract-, database-integratie- en Chromium-E2E-tests.

## 3. Functionele uitgangspunten

### 3.1 Discogs blijft brondata

Discogs-data wordt alleen als voorstel opgeslagen. Genereren of opnieuw genereren mag geen lokale artistnaam, spelling of merge uitvoeren.

### 3.2 Lokale canonical naam blijft leidend

`artist.ar_artist_name` wordt in deze sprint nooit gewijzigd. Canonical rename blijft onderdeel van ART-012D-3A/3B.

### 3.3 Eén voorstel per artist, bron, type en genormaliseerde naam

De queue mag na herhaald genereren geen functioneel dubbele voorstellen bevatten. Verschillen in hoofdletters en omringende whitespace worden voor deduplicatie genormaliseerd, terwijl de oorspronkelijke bronwaarde voor presentatie en audit behouden blijft.

### 3.4 Live waarheid bij toepassen

De status in `artist_name_proposals` is informatief. Vlak vóór toevoegen als spelling wordt live gecontroleerd of de naam:

- canonical is voor dezelfde artist;
- al als spelling bij dezelfde artist bestaat;
- als spelling of canonical naam bij een andere artist bestaat;
- inmiddels ongeldig is geworden.

### 3.5 Expliciete en verklaarbare status

Ondersteunde statussen:

| Status | Betekenis | Primaire acties |
|---|---|---|
| `new` | Nog te beoordelen | toevoegen, later, negeren |
| `review_later` | Uitgesteld | heropenen |
| `ignored` | Bewust afgewezen | heropenen |
| `added` | Aan spellingen toegevoegd | alleen raadplegen |
| `existing` | Bestond al bij dezelfde artist | alleen raadplegen |
| `conflict` | Behoort aan andere artist | alleen raadplegen / later conflictresolver |
| `invalid` | Leeg of technisch ongeldig | alleen raadplegen |

### 3.6 Geen verborgen bulkmutaties

De sprint voegt geen bulk-apply toe. Iedere spellingsmutatie blijft een afzonderlijke, expliciete actie.

## 4. Gebruikersflow

### 4.1 Queue genereren

1. Gebruiker opent een gekoppelde artist.
2. Gebruiker opent het Discogs-paneel en kiest **Genereer queue**.
3. De applicatie verwerkt de actuele Discogs-cache.
4. De gebruiker ziet een samenvatting met aantallen:
   - nieuw toegevoegd;
   - al aanwezig/ongewijzigd;
   - bestaand bij dezelfde artist;
   - conflict;
   - ongeldig.
5. De lijst en statustellers worden direct ververst.

### 4.2 Voorstel beoordelen

- **Voeg toe als spelling**: alleen bij een op dat moment geldig `new`-voorstel.
- **Later**: zet `new` naar `review_later`.
- **Negeer**: zet `new` naar `ignored`.
- **Heropen**: zet `review_later` of `ignored` terug naar `new`, waarna live conflictstatus opnieuw wordt bepaald.

### 4.3 Verouderde browserstate

Wanneer een tweede gebruiker of proces de onderliggende spelling inmiddels heeft gewijzigd, krijgt de eerste gebruiker een duidelijke melding. De UI ververst het voorstel en toont de actuele status; er wordt geen dubbele of conflicterende spelling toegevoegd.

## 5. Functionele scope

### In scope

- volledige validatie van generatie en hergeneratie;
- idempotentie en bron-normalisatie;
- alle statusovergangen;
- filters, zoeken, tellers en lege resultaten;
- live conflictcontrole bij apply en reopen;
- veilige transactie bij toevoegen aan spelling;
- concurrency/stale-state scenario's;
- directe refresh van queue en spellingpaneel;
- foutmeldingen en herstelbaarheid;
- auditvelden en consistente timestamps;
- database-integratietests met rollback;
- Chromium E2E-basis;
- regressie van ART-012D-2, 3A/3B en 4;
- runbook en testresultaatrapportage.

### Buiten scope

- canonical rename vanuit de reviewqueue;
- bulkacties;
- automatische merge;
- automatische acceptatie op confidence;
- nieuwe externe bronnen naast Discogs;
- redesign van het volledige artist-detailscherm;
- generieke conflictresolver over alle artists;
- wijzigingen aan `musician` of `musician_in_band`.

## 6. Acceptatiecriteria

1. Genereren is idempotent en veroorzaakt geen dubbele functionele voorstellen.
2. De generatie-uitkomst is verklaarbaar met een samenvatting per classificatie.
3. Alle toegestane statusovergangen werken en niet-toegestane overgangen worden geblokkeerd.
4. Toevoegen als spelling is transactioneel en voegt exact één lokale spelling toe.
5. Een live conflict kan niet door verouderde UI-state worden omzeild.
6. Een al bestaande spelling bij dezelfde artist resulteert in `existing`, niet in een fout of duplicaat.
7. Geen enkele flow wijzigt `artist.ar_artist_name`.
8. Filters, zoeken en tellers blijven onderling consistent.
9. Queue en spellingpaneel verversen zonder volledige browserrefresh.
10. Database-integratietests laten na rollback nul testrecords achter.
11. Contract-, database- en E2E-tests zijn traceerbaar naar de functionele testcase-ID's.
12. De volledige regressiesuite en productiebuild slagen.

## 7. Technische analyse van de huidige situatie

Bestaande bouwstenen:

- tabel `public.artist_name_proposals`;
- basismigratie ART-012D-4;
- Fix-1 hardeningmigratie;
- lijstfilters `status`, `type`, `q`;
- generation endpoint;
- status endpoint;
- apply-spelling endpoint;
- transactionele apply met `FOR UPDATE`;
- bestaande spellinglogica uit ART-012D-2;
- frontend reviewqueue met filters, tellers en acties.

Belangrijkste nog te bewijzen of te hardenen onderdelen:

- werkelijke idempotentie tegen PostgreSQL;
- classificatie bij canonical naam en spelling bij dezelfde/andere artist;
- case- en whitespace-normalisatie;
- gelijktijdig toepassen van hetzelfde voorstel;
- stale-state tussen genereren en toepassen;
- rollback bij fout tussen proposal-update en spellinginsert;
- correcte teller- en filterrefresh na elke actie;
- reproduceerbare testfixtures zonder productiedata te vervuilen.

## 8. Voorgestelde technische implementatie

### 8.1 Centrale naamnormalisatie

Introduceer één gedeelde normalisatiefunctie voor vergelijking en deduplicatie, bijvoorbeeld:

```text
trim -> interne whitespace normaliseren -> Unicode/string lowercase voor vergelijking
```

De originele `proposed_name` blijft behouden voor presentatie. De genormaliseerde waarde kan afhankelijk van het huidige schema:

- tijdens queries worden berekend; of
- in een nieuwe kolom `proposal_name_normalized` worden opgeslagen.

Voorkeur: alleen een migratie toevoegen wanneer analyse van het bestaande schema aantoont dat databasebrede uniciteit anders niet betrouwbaar kan worden afgedwongen.

### 8.2 Generation service

Splits generatie op in testbare stappen:

1. Discogs-cache lezen;
2. kandidaten extraheren met bron/type/context;
3. kandidaten normaliseren;
4. lege en ongeldige waarden classificeren;
5. duplicaten binnen dezelfde payload verwijderen;
6. lokale canonical namen en spellingen in één query ophalen;
7. classificatie bepalen;
8. voorstellen via upsert opslaan;
9. generation summary teruggeven.

Voorgesteld resultaatcontract:

```json
{
  "artistId": 123,
  "processed": 12,
  "inserted": 4,
  "unchanged": 3,
  "existing": 2,
  "conflict": 2,
  "invalid": 1,
  "statusCounts": {
    "new": 4,
    "existing": 2,
    "conflict": 2,
    "invalid": 1
  }
}
```

### 8.3 Status-transition policy

Leg de toegestane overgangen centraal vast:

```text
new -> review_later | ignored | added | existing | conflict
review_later -> new | existing | conflict
ignored -> new | existing | conflict
```

`added`, `existing`, `conflict` en `invalid` zijn via de normale UI terminal. Ongeautoriseerde of ongeldige overgangen leveren HTTP 409 of 422 met een stabiele foutcode.

### 8.4 Apply transaction

Binnen één transactie:

1. proposal selecteren `FOR UPDATE`;
2. artist en proposal ownership controleren;
3. actuele naam opnieuw normaliseren;
4. canonical en spellingconflicten live controleren;
5. bij dezelfde artist: status `existing` en geen insert;
6. bij andere artist: status `conflict` en geen insert;
7. anders spelling toevoegen via bestaande ART-012D-2-logica;
8. proposal naar `added` zetten;
9. commit;
10. response bevat actuele proposal en spelling-summary.

Een fout vóór commit moet zowel insert als statuswijziging terugdraaien.

### 8.5 Optimistic/stale-state response

API-responses bevatten stabiele codes, bijvoorbeeld:

- `NAME_PROPOSAL_ALREADY_PROCESSED`;
- `NAME_PROPOSAL_EXISTING_SAME_ARTIST`;
- `NAME_PROPOSAL_CONFLICT_OTHER_ARTIST`;
- `NAME_PROPOSAL_INVALID_TRANSITION`;
- `NAME_PROPOSAL_NOT_FOUND`.

De frontend toont een Nederlandse melding en ververst de queue.

### 8.6 Database preflight en verificatie

Nieuwe scripts voor de codesprint:

```text
scripts/art012d4-reviewqueue-preflight.sh
scripts/art012d4-reviewqueue-verify.sh
scripts/test-art012d4-reviewqueue-db.sh
scripts/sql/art012d4_reviewqueue_preflight.sql
scripts/sql/art012d4_reviewqueue_verify.sql
scripts/sql/test_art012d4_reviewqueue_integration.sql
```

Preflight controleert onder andere:

- tabel en verwachte kolommen;
- toegestane statussen;
- dubbele functionele voorstellen;
- orphan proposals;
- proposals met lege naam;
- `added` zonder corresponderende spelling;
- meerdere lokale spellingen die dezelfde genormaliseerde waarde gebruiken.

Verify rapporteert blockers, warnings en info zonder data te wijzigen.

### 8.7 Transactionele database-integratietest

De database-test:

- vereist expliciet `ARTIST_DB_TEST_ALLOWED=true`;
- weigert herkenbare productiedatabases tenzij aparte override is gegeven;
- gebruikt unieke prefix `__ART012D4VAL1_TEST__`;
- draait in `BEGIN ... ROLLBACK`;
- maakt artists, lokale spellingen, Discogs-cache en proposals aan;
- test generatie, hergeneratie, statuses, conflicts en apply;
- controleert na rollback `leftovers=0`.

### 8.8 Frontend hardening

- generation summary als dismissible alert;
- acties tijdelijk uitschakelen tijdens request;
- dubbele click voorkomen;
- gerichte refresh van proposals, counters en relation/spellingdata;
- actieve filters behouden;
- na actie een verdwenen rij niet als fout behandelen;
- foutcode naar begrijpelijke melding vertalen;
- actieknoppen uitsluitend tonen voor geldige status;
- conflictartiest compact en navigeerbaar tonen zonder layoutbreedte te breken.

## 9. API-contracten

Bestaande endpoints blijven behouden. Uitbreidingen zijn niet-brekend.

### Genereren

```http
POST /api/artists/:id/discogs/name-proposals/generate
```

Response bevat generation summary en actuele statusCounts.

### Lijst

```http
GET /api/artists/:id/discogs/name-proposals?status=new&type=alias&q=naam
```

Response bevat:

```json
{
  "items": [],
  "total": 0,
  "statusCounts": {},
  "filters": { "status": "new", "type": "alias", "q": "naam" }
}
```

### Status wijzigen

```http
PATCH /api/artists/:id/discogs/name-proposals/:proposalId/status
```

Request:

```json
{ "status": "review_later" }
```

### Toevoegen als spelling

```http
POST /api/artists/:id/discogs/name-proposals/:proposalId/apply-spelling
```

Response bevat actuele proposalstatus en de toegevoegde of reeds bestaande spelling.

## 10. Automatiseringsstrategie

### Contracttests

Bewaken:

- routes, services en helpers;
- transitiepolicy;
- foutcodes;
- frontend actions en refresh;
- documentatie en npm-scripts.

### Database-integratietests

Bewaken werkelijke PostgreSQL-effecten, constraints, locks, rollback en idempotentie.

### Frontend componenttests

Bewaken filters, tellers, action state, error state en gerichte refresh.

### Chromium Playwright

Bewaken de volledige gebruikersflow met gekoppelde testartist en gecontroleerde API/databasefixture.

### Regressietests

Minimaal:

- ART-012D-2 alternatieve spelling;
- ART-012D-3A preview;
- ART-012D-3B canonical rename;
- ART-012D-4 bestaande contracttests;
- ART-012E Discogs-koppeling;
- productiebuild en packaging.

## 11. Voorgestelde npm-commando's voor de codesprint

```json
{
  "name-proposals:preflight": "bash scripts/art012d4-reviewqueue-preflight.sh",
  "name-proposals:verify": "bash scripts/art012d4-reviewqueue-verify.sh",
  "test:art012d4:val1:contract": "node --test tests/art012d4Val1*.contract.test.mjs",
  "test:art012d4:val1:db": "bash scripts/test-art012d4-reviewqueue-db.sh",
  "test:art012d4:val1:e2e": "playwright test tests/e2e/art012d4-reviewqueue.spec.* --project=chromium",
  "test:art012d4:val1": "npm run test:art012d4:val1:contract && npm run test:art012d4:val1:db"
}
```

De exacte extensies en Playwright-inrichting worden in de codesprint afgestemd op de bestaande teststack. WebKit wordt niet verplicht.

## 12. Logging

Alle gedocumenteerde uitvoercommando's gebruiken:

```bash
mkdir -p logs && <commando> 2>&1 | tee "logs/<naam>-$(date +%Y%m%d-%H%M%S).log"
```

De scripts geven een machineleesbare summary, bijvoorbeeld:

```text
[SUMMARY][ART012D4-VAL1] passed=true blockers=0 warnings=0 leftovers=0
```

## 13. Definition of Done

De sprint is gereed wanneer:

- alle acceptatiecriteria aantoonbaar zijn;
- alle testcase-ID's gekoppeld zijn aan minimaal één testlaag of expliciete handmatige acceptatie;
- database-integratietests op de Docker/PostgreSQL-testdatabase slagen;
- E2E-hoofdflow in Chromium slaagt;
- `npm run test:art012`, relevante regressies en build slagen;
- preflight/verify geen onverklaarde blockers tonen;
- rollbacktest `leftovers=0` rapporteert;
- documentatie, backlog, release notes en runbook actueel zijn;
- release-ZIP geen `node_modules`, `.env`, logs of macOS-metadata bevat.

## 14. Vervolg na acceptatie

1. **ART-013B** — `musician_in_band` uitbreiden met rol, periode en bron.
2. Lokale redactionele biografie ontwerpen.
3. **ART-014** — album-, release- en trackmodel.

## 15. Implementatiestatus

ART-012D-4-VAL-1 is geïmplementeerd. De code bevat centrale statusovergangen, live canonical- en spellingconflictcontrole, stale-state bescherming, een generation summary, Docker-migratie, preflight, verificatie en transactionele database-testbasis. Canonical rename en bulkacties blijven buiten scope.
