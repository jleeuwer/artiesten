# ART-013A-2 — Artist/Musician databasevalidatie en backfill-hardening

Datum ontwerp: 2026-07-11  
Status: geïmplementeerd; gereed voor database-acceptatie

## 1. Aanleiding

ART-013A introduceert een eenrichtingssynchronisatie van `artist` naar een reeds gekoppelde `musician`. ART-013A-1 introduceert een idempotente backfill waarmee ontbrekende musicians voor persoonsartiesten expliciet kunnen worden aangemaakt.

De contracttests van beide sprints zijn succesvol, maar de volledige keten is nog niet aantoonbaar gevalideerd tegen de werkelijke PostgreSQL-database. De huidige migratie en scripts gaan bovendien uit van een passend schema en schone bestaande koppelingen. Daardoor kunnen onverwachte legacy-constraints, ontbrekende kolommen, dubbele koppelingen of afwijkende datatypes pas tijdens de migratie of backfill zichtbaar worden.

ART-013A-2 maakt deze keten operationeel veilig en reproduceerbaar voordat ART-013B de `musician_in_band`-relaties uitbreidt.

## 2. Sprintdoel

De sprint levert een gecontroleerde uitvoerstraat op voor:

1. database-preflight;
2. migratievalidatie;
3. backfill-preview;
4. backfill-uitvoering;
5. idempotentiecontrole;
6. triggerverificatie;
7. post-run datakwaliteitscontrole;
8. reproduceerbare Docker-gebaseerde integratietests.

De sprint wijzigt de functionele synchronisatieregels niet.

## 3. Bevestigde ontwerpbesluiten

De bestaande besluiten blijven ongewijzigd:

- synchronisatie is uitsluitend `artist → musician`;
- er is nooit automatische synchronisatie van musician terug naar artist;
- alleen artists met `ar_artist_type = 'person'` komen in aanmerking;
- de trigger werkt alleen bij `UPDATE` van een bestaande artist;
- de trigger werkt alleen als al een gekoppelde musician bestaat;
- de trigger maakt geen musician aan;
- de backfill is een expliciete onderhoudsactie;
- de backfill overschrijft geen bestaande musician;
- delete, merge en deactiveren verwijderen of ontkoppelen geen musician;
- historische `musician_in_band`-relaties moeten behouden blijven;
- artist-notities worden niet naar musician-notities gekopieerd.

## 4. Scope

### 4.1 In scope

- schema-preflight voor `artist`, `musician`, functie, trigger en relevante kolommen;
- detectie van bestaande dubbele non-null `musician.ar_artist_key`-koppelingen;
- detectie van ontbrekende verplichte musician-kolommen zonder default;
- detectie van ongeldige backfill-kandidaten;
- controle of de ART-013A functie en trigger aanwezig en actief zijn;
- veilige migratievolgorde;
- verbeterde preview met blockers, warnings en aantallen;
- uitvoer met expliciete run summary;
- post-run verificatie;
- idempotentiecontrole;
- transactionele database-integratietests in Docker;
- logging naar `logs/` via `2>&1 | tee`;
- documentatie, runbook en testcases;
- release packaging zonder `.env`, logs, `node_modules`, `.DS_Store`, `__MACOSX` en `._*`.

### 4.2 Buiten scope

- wijzigingen aan de Artiesten-app UI;
- automatische periodieke scheduling;
- automatische musician-aanmaak vanuit de artist-trigger;
- bidirectionele synchronisatie;
- opschonen of automatisch samenvoegen van dubbele musicians;
- functionele uitbreiding van `musician_in_band`;
- Discogs member/group proposals;
- wijziging van het artist- of musician-domeinmodel buiten noodzakelijke compatibiliteit;
- verwijderen van musicians.

## 5. Gebruikersrollen

### Beheerder / ontwikkelaar

De beheerder voert de preflight, migratie, preview, backfill en verificatie uit vanuit de projectdirectory tegen PostgreSQL in Docker.

### Applicatiegebruiker

Voor de eindgebruiker verandert in deze sprint niets aan de UI. Het resultaat is indirect zichtbaar doordat persoonsartiesten correct aan musicians gekoppeld zijn en latere artist-updates veilig worden gesynchroniseerd.

## 6. Functionele requirements

### FR-013A2-01 — Preflight zonder wijzigingen

Er moet een commando beschikbaar komen dat het schema en de data controleert zonder databasewijzigingen uit te voeren.

Voorgesteld commando:

```bash
npm run musician:preflight
```

De preflight moet minimaal rapporteren:

- bereikbaarheid van de Docker PostgreSQL-container;
- bestaan van tabellen `artist` en `musician`;
- bestaan en datatype van alle gebruikte kolommen;
- nullable/default-status van musician-kolommen;
- aantal dubbele non-null `ar_artist_key`-koppelingen;
- aantal person-artists;
- aantal reeds gekoppelde person-artists;
- aantal ontbrekende musicians;
- aantal ongeldige kandidaten;
- aanwezigheid en status van ART-013A functie en trigger;
- blocker-, warning- en info-aantallen.

De preflight mag geen inserts, updates, deletes, DDL of triggerwijzigingen uitvoeren.

### FR-013A2-02 — Blockers versus warnings

De uitvoer onderscheidt:

- `BLOCKER`: uitvoering is niet veilig en moet stoppen;
- `WARNING`: uitvoering kan mogelijk doorgaan, maar vereist beoordeling;
- `INFO`: informatieve uitkomst.

Minimale blockers:

- database/container niet bereikbaar;
- tabel of vereiste kolom ontbreekt;
- datatype is incompatibel;
- dubbele non-null `musician.ar_artist_key`-koppelingen;
- verplichte musician-kolom zonder default die de insert onmogelijk maakt;
- ART-013A trigger/functie ontbreekt wanneer de volledige keten wordt geverifieerd.

Minimale warnings:

- person-artist heeft lege of alleen-whitespace naam;
- artist-naam is langer dan de musician-kolom toestaat;
- artist type is `person`, maar de artist is gedeactiveerd indien zo'n status in het schema aanwezig is;
- bestaande gekoppelde musician wijkt inhoudelijk af van de artist vóór triggerverificatie.

### FR-013A2-03 — Geen automatische datareparatie

De preflight en verificatie mogen geen dubbele musicians automatisch samenvoegen, verwijderen of ontkoppelen. Zij moeten concrete sleutels rapporteren zodat een beheerder bewust kan besluiten hoe de data wordt hersteld.

### FR-013A2-04 — Veilige migratie

De ART-013A-1 migratie mag de unieke index pas aanmaken nadat is vastgesteld dat er geen bestaande dubbele gekoppelde musicians zijn.

Bij een blocker moet de migratie stoppen met:

- een niet-nul exitcode;
- een duidelijke Nederlandstalige foutmelding;
- de query of lijst waarmee de probleemrecords gevonden kunnen worden;
- geen gedeeltelijk toegepaste structurele wijzigingen, voor zover transactioneel mogelijk.

### FR-013A2-05 — Uitgebreide backfill-preview

De preview toont minimaal:

- totaal person-artists;
- reeds gekoppeld;
- geldige ontbrekende kandidaten;
- uitgesloten kandidaten met reden;
- blockers en warnings;
- per kandidaat: artist key, naam, geboortedatum, sterfdatum en website;
- expliciete melding dat preview geen wijzigingen uitvoert.

Voorgesteld commando blijft:

```bash
npm run musician:backfill:preview
```

### FR-013A2-06 — Gecontroleerde backfill

De execute-modus:

- weigert te starten bij blockers;
- voegt alleen geldige ontbrekende person-artists toe;
- overschrijft geen bestaande musicians;
- maakt geen dubbele koppelingen;
- toont het aantal geselecteerde, ingevoegde, overgeslagen en mislukte records;
- geeft een niet-nul exitcode bij technische fout;
- is idempotent.

### FR-013A2-07 — Post-run verificatie

Er komt een apart verificatiecommando:

```bash
npm run musician:verify
```

Dit controleert minimaal:

- nul dubbele gekoppelde musicians;
- nul geldige ontbrekende person-musicians na een volledige backfill;
- iedere gekoppelde musician verwijst naar een bestaande artist;
- gekoppelde artist is een `person`, tenzij het een expliciet bestaand legacygeval betreft dat als warning wordt gerapporteerd;
- trigger en functie zijn aanwezig en enabled;
- veldmapping van gecontroleerde testrecords is correct;
- geen musician is verwijderd.

### FR-013A2-08 — Idempotentierapport

Na twee opeenvolgende uitvoeringen moet de tweede run aantoonbaar nul nieuwe musician-records invoegen. De verificatie moet dit als expliciet resultaat kunnen rapporteren.

### FR-013A2-09 — Triggerverificatie

De integratietest bewijst:

- update van gekoppelde person-artist synchroniseert naam, geboorte, overlijden en website;
- update van band/group synchroniseert niet;
- update van person-artist zonder gekoppelde musician maakt niets aan;
- update van musician wijzigt artist niet;
- delete/deactivatie/merge verwijdert musician niet.

### FR-013A2-10 — Veilige testisolatie

Geautomatiseerde database-integratietests moeten:

- uitsluitend tegen de geconfigureerde Docker test-/ontwikkeldatabase draaien;
- expliciet weigeren bij een niet-toegestane databaseomgeving;
- testrecords herkenbaar markeren;
- binnen een transactie werken en rollback uitvoeren, of gegarandeerde cleanup toepassen;
- bestaande productieachtige data niet wijzigen.

### FR-013A2-11 — Logging

Alle documentatiecommando's volgen de projectstandaard:

```bash
mkdir -p logs && <commando> 2>&1 | tee "logs/<naam>-$(date +%Y%m%d-%H%M%S).log"
```

Gevoelige waarden zoals wachtwoorden en volledige connection strings mogen niet in logs verschijnen.

### FR-013A2-12 — Packaging

De release-ZIP wordt gecontroleerd op uitsluiting van:

- `.env`;
- `node_modules`;
- `logs`;
- `.DS_Store`;
- `__MACOSX`;
- `._*`;
- tijdelijke database dumps;
- editorcache.

## 7. Technisch ontwerp

## 7.1 Geïmplementeerde bestanden

```text
scripts/
  musician-preflight.sh
  musician-verify.sh
  db-test-art013a2-docker.sh
  sql/
    20260711_art013a2_preflight.sql
    20260711_art013a2_verify.sql
    20260711_art013a2_integration_test.sql

tests/
  art013a2DatabaseHardening.contract.test.mjs
  art013a2DatabaseIntegration.test.mjs

docs/
  ART_013A_2_Databasevalidatie_Backfill_Hardening_Functioneel_Technisch_Ontwerp.md
  ART_013A_2_Testcases_en_Runbook.md

Release Notes/
  ART_013A_2_Databasevalidatie_Backfill_Hardening_Release_Notes.md
```

Bestandsnamen mogen tijdens implementatie technisch worden aangepast, zolang de functies en npm-contracten gelijk blijven.

## 7.2 NPM-scripts

Voorgestelde uitbreiding:

```json
{
  "scripts": {
    "musician:preflight": "bash scripts/musician-preflight.sh",
    "musician:verify": "bash scripts/musician-verify.sh",
    "test:art013a2:contract": "node --test tests/art013a2DatabaseHardening.contract.test.mjs",
    "test:art013a2:db": "bash scripts/db-test-art013a2-docker.sh",
    "test:art013a2": "npm run test:art013a2:contract && npm run test:art013a2:db"
  }
}
```

`test:art013a` moet na implementatie ook ART-013A-2 contracttests opnemen. De database-integratietest hoeft niet automatisch onderdeel te zijn van iedere snelle unit-test-run, maar wel van de expliciete sprinttest en releasevalidatie.

## 7.3 Docker databasecontract

De scripts gebruiken dezelfde Docker-omgeving en env-conventies als de bestaande migraties. Zij mogen niet stilzwijgend terugvallen op een lokale PostgreSQL-installatie.

De implementatie moet:

- de containernaam uit de bestaande projectconfiguratie/env halen;
- database, gebruiker en eventueel schema uit env/config halen;
- met `docker exec` en `psql -v ON_ERROR_STOP=1` uitvoeren;
- bij ontbrekende container/configuratie duidelijk stoppen;
- wachtwoorden niet echoën.

## 7.4 Preflight SQL

De preflight gebruikt alleen read-only queries op:

- `information_schema.tables`;
- `information_schema.columns`;
- `pg_catalog.pg_proc`;
- `pg_catalog.pg_trigger`;
- `pg_catalog.pg_class` en `pg_index`;
- aggregaties op `artist` en `musician`.

Voorbeelden van controles:

```sql
select ar_artist_key, count(*)
from public.musician
where ar_artist_key is not null
group by ar_artist_key
having count(*) > 1;
```

```sql
select a.ar_artist_key, a.ar_artist_name
from public.artist a
where coalesce(a.ar_artist_type, 'unknown') = 'person'
  and nullif(btrim(a.ar_artist_name), '') is null;
```

De SQL-uitvoer moet machineleesbare regels of vaste kolomnamen leveren, zodat shellscripts exitcodes en summaries betrouwbaar kunnen bepalen.

## 7.5 Preflight exitcodes

Voorgesteld contract:

- `0`: geen blockers;
- `2`: functionele/data-blockers gevonden;
- `3`: configuratie- of containerfout;
- `4`: onverwachte SQL/technische fout.

Warnings mogen exitcode `0` behouden, maar moeten duidelijk zichtbaar zijn.

## 7.6 Migratie-hardening

De implementatie moet bepalen of de huidige ART-013A-1 migratie wordt aangepast of dat een aanvullende ART-013A-2 migratie wordt toegevoegd.

Voorkeur:

1. preflight als verplichte aparte stap;
2. aanvullende guard in de migratie zelf;
3. DDL binnen transactie waar PostgreSQL dat ondersteunt;
4. unieke index pas na duplicate-guard;
5. idempotente heruitvoering.

Een guard kan via een `DO $$ ... $$` block een exception werpen wanneer duplicates bestaan.

## 7.7 Backfill-selectie

Een geldige kandidaat voldoet aan:

```text
artist.ar_artist_type = 'person'
AND geen musician met dezelfde ar_artist_key
AND ar_artist_key is gevuld
AND ar_artist_name is niet leeg
AND mapped waarden passen in doelkolommen
AND geen ander schema-blocker verhindert insert
```

De implementatie moet voorkomen dat preview en execute verschillende selectielogica gebruiken. Bij voorkeur delen zij exact dezelfde SQL-selectie of database-view/CTE.

## 7.8 Backfill-transactie

De execute-run moet atomair zijn voor de set inserts, tenzij batchverwerking aantoonbaar nodig is. Bij een onverwachte SQL-fout wordt de run teruggedraaid en gerapporteerd als mislukt.

`NOT EXISTS`, de partial unique index en `ON CONFLICT DO NOTHING` blijven als verdedigingslagen bestaan.

## 7.9 Verificatie SQL

De verificatie levert vaste checks met status, code en aantallen, bijvoorbeeld:

```text
PASS | DUPLICATE_LINKS | 0
PASS | MISSING_VALID_PERSON_MUSICIANS | 0
PASS | ORPHAN_MUSICIAN_ARTIST_LINKS | 0
PASS | TRIGGER_PRESENT_ENABLED | 1
WARN | NON_PERSON_LINKS | 2
```

Hierdoor kunnen zowel mensen als geautomatiseerde tests dezelfde uitvoer beoordelen.

## 7.10 Database-integratietest

De integratietest maakt unieke testrecords aan, bijvoorbeeld met prefix:

```text
__ART013A2_TEST__
```

Scenario's:

1. person-artist zonder musician;
2. person-artist met gekoppelde musician;
3. band/group met gekoppelde legacy-musician indien technisch nodig;
4. standalone musician zonder artist-link.

De test draait in een transactie en eindigt met rollback. Wanneer migratie-DDL niet veilig in dezelfde transactie kan worden getest, gebruikt de test een vooraf gevalideerde ontwikkel/testdatabase en verwijdert hij uitsluitend eigen gemarkeerde records.

## 7.11 Beveiliging en operationele veiligheid

- Scripts moeten `set -euo pipefail` gebruiken.
- SQL gebruikt `ON_ERROR_STOP=1`.
- Database-naam en container worden vóór write-acties zichtbaar bevestigd in de log.
- Een denylist/allowlist voorkomt uitvoering tegen bekende productieomgevingen.
- Er worden geen credentials gelogd.
- Geen automatische datareparatie bij duplicates.

## 8. Uitvoer en rapportage

Iedere actie eindigt met een compacte summary.

Voorbeeld preflight:

```text
ART-013A-2 preflight
Database: musicdb
Container: postgres
Blockers: 0
Warnings: 2
Person artists: 1250
Already linked: 0
Valid backfill candidates: 1246
Excluded candidates: 4
Result: READY
```

Voorbeeld execute:

```text
ART-013A-2 backfill
Selected: 1246
Inserted: 1246
Skipped existing/concurrent: 0
Failed: 0
Result: SUCCESS
```

Voorbeeld tweede run:

```text
Selected: 0
Inserted: 0
Result: IDEMPOTENT
```

## 9. Acceptatiecriteria

ART-013A-2 is geaccepteerd wanneer:

1. preflight zonder wijzigingen draait;
2. schema- en dataproblemen als blockers/warnings worden geclassificeerd;
3. duplicates vóór indexcreatie worden gemeld;
4. migratie bij blocker veilig stopt;
5. preview en execute dezelfde kandidaatselectie gebruiken;
6. backfill alleen geldige ontbrekende person-musicians toevoegt;
7. bestaande musicians niet worden overschreven;
8. tweede backfill-run nul inserts oplevert;
9. verificatie nul onverwachte duplicates, missing links en orphans meldt;
10. trigger-sync voor person-artists aantoonbaar werkt;
11. band/group en ongekoppelde person-artists niet worden gesynchroniseerd;
12. musician→artist sync niet bestaat;
13. delete/merge/deactiveren musician niet verwijdert;
14. database-integratietests geïsoleerd en herhaalbaar slagen;
15. logs geen credentials bevatten;
16. alle documentatiecommando's `2>&1 | tee` gebruiken;
17. release packaging schoon is.

## 10. Definition of Done

- functioneel en technisch ontwerp geïmplementeerd;
- contracttests aanwezig en groen;
- database-integratietests aanwezig en groen op Docker PostgreSQL;
- preflight, preview, execute en verify handmatig uitgevoerd;
- idempotentie bewezen;
- runbook bijgewerkt met echte uitvoerresultaten;
- release notes aanwezig;
- `PROJECT_NOTES.md`, `BACKLOG.md` en `Readme.md` bijgewerkt;
- geen secrets, logs, dependencies of macOS metadata in release-ZIP;
- ART-013A-2 door gebruiker functioneel gevalideerd.

## 11. Vervolg na deze sprint

Na acceptatie is de aanbevolen volgorde:

1. ART-UI-Polish — thumbnail en overleden-indicator;
2. ART-012D-4 volledige functionele validatie en eventuele fixes;
3. ART-013B — uitbreiding `musician_in_band` met rol, periode en bron;
4. ontwerp lokale biografie;
5. ART-014 album/release-datamodel.


## 12. Implementatieresultaat (2026-07-11)

ART-013A-2 is concreet geïmplementeerd.

### Nieuwe uitvoercommando's

```bash
npm run musician:preflight
npm run musician:backfill:preview
npm run musician:backfill
npm run musician:verify
npm run test:art013a2:contract
npm run test:art013a2:db
npm run test:art013a2
```

### Implementatiekenmerken

- `musician:preflight` voert eerst schema- en daarna datacontroles uit en stopt met exitcode 3 bij blockers.
- Preview en execute roepen verplicht dezelfde centrale preflight aan.
- De ART-013A-1 migratie controleert dubbele `ar_artist_key`-koppelingen vóór het aanmaken van de unieke index.
- De backfill sluit lege namen en namen die niet in `mu_musician_name` passen uit en rapporteert deze apart.
- `musician:verify` controleert duplicates, geldige ontbrekende koppelingen, orphan links, non-person legacy links en triggerstatus.
- Database-integratietests zijn transactioneel en eindigen met `ROLLBACK`.
- Integratietests vereisen expliciet `ARTIST_DB_TEST_ALLOWED=true` en weigeren een productieomgeving.
- Credentials en volledige connection strings worden niet gelogd.

### Operationele beperking

De contracttests kunnen zonder Docker worden uitgevoerd. De database-integratietest vereist de lokale Docker/PostgreSQL-omgeving en moet daar tijdens acceptatie worden uitgevoerd.
