# ART-013B-1 — Musician-in-band handmatig relatiebeheer

Datum: 2026-07-11  
Status: functioneel en technisch ontwerp — gereed voor codesprint

## 1. Aanleiding

De database bevat al de tabellen `musician` en `musician_in_band`. ART-013A en ART-013A-1 hebben de koppeling tussen persoonsartiesten en musicians operationeel gemaakt. De volgende stap is het bestaande bandlidmaatschapsmodel bruikbaar te maken in de Artiesten-app.

De gebruiker moet alle bandlidmaatschapsgegevens handmatig kunnen invoeren, ook wanneer externe bronnen geen of onvolledige informatie bieden. Externe bronnen worden later ondersteunend toegevoegd in deze volgorde:

1. Discogs als primaire externe bron;
2. MusicBrainz als aanvullende bron;
3. Wikidata als latere verificatie- en aanvullende bron.

Geen enkele externe bron mag lokale gegevens automatisch overschrijven.

## 2. Sprintdoel

ART-013B-1 levert binnen de Artiesten-app volledig handmatig beheer van relaties in `musician_in_band`.

De gebruiker kan vanuit een band:

- huidige en voormalige leden bekijken;
- een bestaande musician koppelen;
- rol/functie vastleggen;
- begin- en eindperiode vastleggen;
- broninformatie en opmerkingen vastleggen;
- een relatie wijzigen;
- een relatie gecontroleerd verwijderen.

De gebruiker kan vanuit een persoonsartiest/musician:

- zien van welke bands de persoon lid is of was;
- dezelfde relatie openen en wijzigen;
- doorklikken naar de betreffende band.

## 3. Architectuurbesluit

### 3.1 Functioneel geïntegreerd

De functionaliteit wordt geïntegreerd in de bestaande Artiesten-app. Er komt geen aparte app of container.

### 3.2 Technisch modulair

De code wordt als zelfstandig feature-domein opgebouwd en niet in de bestaande grote artistcomponenten verweven.

Voorgestelde backendstructuur:

```text
controllers/musicianInBandController.js
models/musicianInBandModel.js
routes/musicianInBandRoutes.js
services/musicianInBandService.js
validators/musicianInBandValidator.js
```

Voorgestelde frontendstructuur:

```text
client/src/features/musician-in-band/
  BandMembersPanel.jsx
  MusicianBandsPanel.jsx
  MusicianInBandFormModal.jsx
  MusicianInBandDeleteDialog.jsx
  MemberStatusBadge.jsx
  api.js
  validation.js
```

Provideradapters voor Discogs, MusicBrainz en Wikidata worden pas in latere sprints toegevoegd.

## 4. Functionele scope

### 4.1 Bandcontext

Bij artists met type `band`, `group`, `duo` of `trio` komt een paneel **Bandleden**.

Het paneel toont minimaal:

- musiciannaam;
- rol/functie;
- van;
- tot;
- status huidig/voormalig/onbekend;
- bron;
- opmerkingenindicator;
- acties Edit en Verwijder.

### 4.2 Persoonscontext

Bij artists met type `person` en een gekoppelde musician komt een paneel **Bands / groepen**.

Het paneel toont minimaal:

- bandnaam;
- rol/functie;
- van;
- tot;
- status;
- bron;
- link naar de band;
- actie Edit.

Wanneer een person-artist nog geen gekoppelde musician heeft, toont de UI een duidelijke melding en geen onbruikbare invoeractie.

### 4.3 Relatie toevoegen

De gebruiker selecteert:

- een bestaande musician;
- de bandcontext wordt vooraf ingevuld;
- optioneel rol/functie;
- optioneel begindatum;
- optioneel einddatum;
- optioneel bronsoort;
- optioneel bronverwijzing/URL;
- optioneel opmerkingen.

Alle velden behalve musician en band mogen leeg blijven.

### 4.4 Relatie wijzigen

Alle aanvullende velden zijn wijzigbaar. De gekoppelde musician en band mogen alleen worden gewijzigd wanneer dit expliciet als her-koppeling wordt ondersteund; standaard worden zij in Edit read-only getoond om onbedoelde verplaatsing te voorkomen.

### 4.5 Relatie verwijderen

Verwijderen vereist bevestiging en toont musician, band en periode. De musician en artist worden nooit verwijderd; alleen de koppelregel in `musician_in_band`.

### 4.6 Huidig of voormalig

Status wordt bij voorkeur afgeleid:

- einddatum leeg: `current`;
- einddatum gevuld en in verleden: `former`;
- alleen historische vrije tekst of onvolledige periode: `unknown` wanneer niet betrouwbaar afleidbaar.

Een handmatige statuskolom wordt alleen toegevoegd als het bestaande schema of acceptatietesten aantonen dat afleiding onvoldoende is.

### 4.7 Datumnauwkeurigheid

Muziekhistorische data is vaak onvolledig. Daarom ondersteunt het ontwerp:

- volledige datum;
- alleen jaar;
- jaar en maand;
- onbekend.

Aanbevolen datamodel: tekstuele precisie naast genormaliseerde datumvelden, of aparte `precision`-velden. In de codesprint wordt eerst het bestaande schema via preflight gecontroleerd voordat de definitieve migratie wordt vastgelegd.

## 5. Datamodel

`musician_in_band` blijft de lokale waarheid.

Minimaal gewenste aanvullende velden:

```text
mb_role                 text null
mb_date_from             date null
mb_date_to               date null
mb_date_from_precision   text null
mb_date_to_precision     text null
mb_source_type           text null
mb_source_reference      text null
mb_source_url            text null
mb_notes                 text null
mb_created_at             timestamptz not null default now()
mb_updated_at             timestamptz not null default now()
```

Mogelijke toegestane precisies:

```text
day
month
year
unknown
```

Mogelijke bronsoorten in deze handmatige sprint:

```text
manual
book
website
liner_notes
other
```

`discogs`, `musicbrainz` en `wikidata` worden voorbereid als waarden, maar pas functioneel gebruikt in latere enrichment-sprints.

### 5.1 Bestaande sleutels

De migratie mag bestaande sleutelkolommen en relaties niet vervangen. Een preflight inventariseert vooraf:

- primaire sleutel van `musician_in_band`;
- musician-FK;
- band/artist-FK, waaronder de reeds bekende `mb_artist_key`;
- bestaande unieke constraints;
- bestaande dubbele relaties;
- bestaande null- en datatypebeperkingen.

### 5.2 Uniciteit

Een musicus kan meerdere niet-overlappende periodes bij dezelfde band hebben. Daarom mag geen simpele unieke constraint op musician + band worden toegevoegd.

Duplicaatdetectie gebeurt op een combinatie van:

- musician;
- band;
- startwaarde en precisie;
- eindwaarde en precisie;
- eventueel rol.

Exacte duplicaten worden geblokkeerd. Meerdere termijnen blijven toegestaan.

### 5.3 Periodevalidatie

- einddatum mag niet vóór begindatum liggen;
- bij alleen jaren geldt eindjaar >= beginjaar;
- ontbrekende begin- of einddatum is toegestaan;
- overlap wordt gewaarschuwd, niet automatisch geblokkeerd, omdat meerdere rollen of terugkerende lidmaatschappen mogelijk zijn;
- exacte duplicaten worden wel geblokkeerd.

## 6. API-ontwerp

Voorgestelde routes:

```text
GET    /api/artists/:artistKey/band-members
GET    /api/artists/:artistKey/bands
GET    /api/musician-in-band/:relationKey
POST   /api/musician-in-band
PUT    /api/musician-in-band/:relationKey
DELETE /api/musician-in-band/:relationKey
GET    /api/musicians/search?q=
```

### 6.1 Create payload

```json
{
  "musicianKey": 123,
  "bandArtistKey": 456,
  "role": "gitaar",
  "dateFrom": "1962-01-01",
  "dateFromPrecision": "year",
  "dateTo": "1969-01-01",
  "dateToPrecision": "year",
  "sourceType": "book",
  "sourceReference": "Titel, auteur, pagina 42",
  "sourceUrl": null,
  "notes": "Oorspronkelijke bezetting"
}
```

### 6.2 Stabiele foutcodes

```text
MUSICIAN_IN_BAND_NOT_FOUND
MUSICIAN_NOT_FOUND
BAND_ARTIST_NOT_FOUND
ARTIST_NOT_BAND_TYPE
INVALID_MEMBERSHIP_PERIOD
DUPLICATE_MEMBERSHIP
MEMBERSHIP_OVERLAP_WARNING
MUSICIAN_NOT_LINKED_TO_PERSON_ARTIST
STALE_MUSICIAN_IN_BAND
```

Updates gebruiken `updated_at` of een versieveld voor optimistic concurrency.

## 7. UI-ontwerp

### 7.1 Band Members Panel

- geïntegreerd in bestaand detail-/relatiegebied;
- compacte tabel op desktop;
- kaartweergave of horizontale scroll op smalle schermen;
- filters: huidig, voormalig, alles;
- sortering standaard: huidig eerst, daarna startdatum en naam;
- knop **Bandlid toevoegen**;
- lege toestand met uitleg.

### 7.2 Form modal

Secties:

1. Relatie
   - musician zoeken/selecteren;
   - band read-only;
2. Rol en periode
   - rol;
   - van + precisie;
   - tot + precisie;
3. Bron
   - bronsoort;
   - referentie;
   - URL;
4. Opmerkingen

De modal gebruikt Nederlandse datumweergave en dezelfde datumhulpfuncties als de artist-editflow waar praktisch mogelijk.

### 7.3 Waarschuwingen

Bij mogelijke overlap toont de UI een niet-blokkerende waarschuwing met bestaande periodes. De gebruiker kan na expliciete bevestiging doorgaan, tenzij sprake is van een exact duplicaat.

## 8. Externe bronnen — voorbereid, niet geïmplementeerd

### 8.1 Volgorde

1. handmatig lokaal beheer;
2. Discogs proposals;
3. MusicBrainz aanvullingen;
4. Wikidata verificatie.

### 8.2 Toekomstige providerinterface

```js
{
  provider: "discogs",
  personExternalId: "...",
  bandExternalId: "...",
  personName: "...",
  bandName: "...",
  role: "...",
  dateFrom: "...",
  dateTo: "...",
  sourceUrl: "...",
  rawPayload: {}
}
```

Providers schrijven nooit rechtstreeks naar `musician_in_band`; zij leveren proposals voor expliciete review.

## 9. Security en datakwaliteit

- parameterized SQL;
- server-side validatie van alle IDs en velden;
- URL-validatie alleen `http`/`https`;
- lengtelimieten voor rol, bronreferentie en opmerkingen;
- HTML wordt niet als markup gerenderd;
- delete is expliciet en transactioneel;
- audit/logging volgens bestaande appconventies;
- geen externe API-call in ART-013B-1.

## 10. Technische tests

De codesprint voegt toe:

```text
tests/art013b1Documentation.contract.test.mjs
tests/art013b1Implementation.contract.test.mjs
tests/art013b1FunctionalCases.contract.test.mjs
tests/art013b1Api.integration.test.mjs
tests/art013b1Db.integration.sql
client tests voor panel en modal
Playwright Chromium hoofdflow
```

Voorgestelde npm-commando's:

```text
npm run musician-in-band:preflight
npm run db:migrate:art013b1
npm run musician-in-band:verify
npm run test:art013b1:contract
npm run test:art013b1:db
npm run test:art013b1:e2e
npm run test:art013b1
```

Alle documentatiecommando's loggen via `2>&1 | tee`.

## 11. Buiten scope

- automatisch ophalen uit Discogs;
- MusicBrainz- of Wikidata-integratie;
- automatische musician- of artistaanmaak;
- canonical artist rename;
- merge van musicians;
- generieke bronvergelijker;
- album- en trackcredits;
- nieuwe aparte app of microservice.

## 12. Acceptatiecriteria

ART-013B-1 is geaccepteerd wanneer:

1. alle data handmatig kan worden ingevoerd zonder externe bron;
2. bandleden vanuit bandcontext zichtbaar en beheerbaar zijn;
3. bands vanuit persoonscontext zichtbaar zijn;
4. incomplete periodes toegestaan zijn;
5. ongeldige periodes worden geblokkeerd;
6. exacte duplicaten worden geblokkeerd;
7. overlap begrijpelijk wordt gewaarschuwd;
8. delete alleen de relatie verwijdert;
9. stale updates veilig worden geweigerd;
10. er geen N+1-query per rij ontstaat;
11. PostgreSQL-tests transactioneel eindigen met `leftovers=0`;
12. Chromium-hoofdflow slaagt;
13. bestaande artist-, Discogs- en musician-tests groen blijven;
14. ZIP geen `node_modules`, `.env`, logs of macOS-metadata bevat.

## 13. Vervolg

Na acceptatie:

1. ART-013B-2 — Discogs members/groups proposals;
2. ART-013B-3 — MusicBrainz aanvulling;
3. ART-013B-4 — Wikidata verificatie;
4. lokale redactionele biografie;
5. ART-014 album-, release- en trackmodel.


## ART-013B-1 implementatiestatus — 2026-07-12

De concrete codesprint is opgeleverd. Handmatig beheer is modulair geïntegreerd in het Relatie-inzicht. De bestaande tabel `musician_in_band` blijft lokale waarheid. Preflight, migratie, verificatie, API, frontendfeature, duplicate/overlap/stale bescherming en automatische contracttests zijn aanwezig. Externe providers blijven vervolgscope: Discogs primair, MusicBrainz aanvullend, Wikidata daarna.
