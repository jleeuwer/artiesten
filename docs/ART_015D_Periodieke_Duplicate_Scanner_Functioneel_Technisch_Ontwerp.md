# ART-015D — Periodieke duplicate scanner / onderhoudsvariant

## 1. Doel

ART-015D beschrijft de periodieke onderhoudsvariant voor artiest-ontdubbeling.

De interactieve flow uit ART-015B/ART-015C blijft leidend voor de daadwerkelijke merge. ART-015D voegt daar een onderhoudsprogramma aan toe dat mogelijke dubbele artiesten periodiek opspoort en als reviewbare werkvoorraad klaarzet.

Belangrijk uitgangspunt:

```text
scanner vindt kandidaten
→ staging/reviewqueue
→ bestaande impactscan
→ bestaande transactionele merge
→ bestaande mergehistorie/audit/alerts
```

De scanner voert zelf nooit een merge uit.

## 2. Functionele scope

### In scope voor ART-015D ontwerp

- Periodieke scan op mogelijke dubbele artiesten.
- Python onderhoudsprogramma als voorkeursvariant voor de scanner.
- Fuzzy matching op artiestnamen en artiestenspellingen.
- Staging/reviewtabellen voor gevonden candidates.
- Reviewqueue in de Artiesten-app als toekomstige frontend.
- Statusflow voor candidates.
- Scheduling-opties.
- Logging naar projectlogdirectory.
- Shellstarter alert/mail-momenten functioneel definiëren.
- Hergebruik van bestaande ART-015B impactscan en ART-015C merge-service.

### Niet in scope voor deze ontwerpsprint

- Automatische merges.
- Albums implementeren.
- Discogs artist enrichment implementeren.
- Muzikant/band/album-relatiemodel implementeren.
- Volledige Shellstarter mailkoppeling zolang het mailcontract nog niet definitief is.

## 3. Twee duplicate-discovery varianten

ART-015A onderscheidde twee bronnen voor duplicate candidates. ART-015D werkt variant 1 verder uit.

### Variant 1 — Periodieke onderhoudsfunctie met staging

```text
[Python duplicate scanner]
          ↓
artist_duplicate_candidates staging
          ↓
[Artiesten-app review UI]
          ↓
impactscan API
          ↓
merge API
          ↓
artist_merge_history
```

De scanner maakt een lijst met mogelijke dubbelen. De gebruiker verwerkt deze lijst later in de Artiesten-app.

### Variant 2 — Geïntegreerde ondersteuning in de Artiesten-app

```text
[Artiesten-app interactieve fuzzy search]
          ↓
impactscan API
          ↓
merge API
          ↓
artist_merge_history
```

Deze variant is al geïmplementeerd in ART-015B/ART-015C en blijft beschikbaar voor handmatig beheer.

## 4. Functionele flow onderhoudsscan

1. Gebruiker of scheduler start de scanner.
2. Scanner registreert een scan-run.
3. Scanner laadt relevante artiestgegevens:
   - `artist.ar_artist_key`
   - `artist.ar_artist_name`
   - `artist.ar_is_deleted`
   - `artist.ar_merged_into_artist_key`
   - `artiesten_spelling.as_alternatieve_spelling`
   - optioneel gewicht/titelaantallen uit `file_details`
4. Scanner normaliseert namen/spellingen.
5. Scanner berekent mogelijke duplicate-pairs.
6. Scanner slaat candidates op in staging/reviewtabellen.
7. Scanner markeert run als afgerond of mislukt.
8. Scanner schrijft logregels en eventueel Shellstarter-alert.
9. Gebruiker opent later de reviewqueue in de Artiesten-app.
10. Gebruiker verwerkt candidates via bestaande impactscan/merge-flow.

## 5. Fuzzy matching regels

Fuzzy matching is uitsluitend bedoeld voor kandidaatdetectie en nooit voor automatische merge.

### Normalisatie

De scanner gebruikt dezelfde conceptuele normalisatie als ART-015B:

- lowercase;
- trim;
- accenten verwijderen;
- `&` normaliseren naar `and`;
- leestekens reduceren;
- meerdere spaties reduceren;
- optioneel stopwoorden normaliseren zoals `the`, maar voorzichtig bij korte namen.

### Matchsignalen

Candidate score kan bestaan uit meerdere deelcomponenten:

- exact genormaliseerde naam gelijk;
- Levenshtein-ratio;
- token-overlap;
- Jaccard-similarity op tokens;
- match via `artiesten_spelling`;
- match op naam zonder leestekens;
- later: Discogs aliases/name variations.

### False-positive bescherming

Bij korte namen extra voorzichtig zijn, bijvoorbeeld:

- ABBA;
- Yes;
- Kiss;
- Queen;
- Air.

Voor korte namen is een hogere score-drempel nodig en mogelijk een exactere match.

## 6. Stagingdatamodel voorstel

### `artist_duplicate_scan_runs`

Doel: registratie van iedere onderhoudsscan.

Voorstelvelden:

```sql
create table public.artist_duplicate_scan_runs (
  scan_run_id bigserial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  scanner_version text,
  match_config jsonb not null default '{}'::jsonb,
  candidate_count integer not null default 0,
  error_message text,
  log_file text,
  created_by text
);
```

Statuswaarden:

- `running`
- `completed`
- `failed`
- `cancelled`

### `artist_duplicate_candidates`

Doel: reviewbare duplicate candidates.

Voorstelvelden:

```sql
create table public.artist_duplicate_candidates (
  candidate_id bigserial primary key,
  scan_run_id bigint not null references public.artist_duplicate_scan_runs(scan_run_id),
  artist_key_a integer not null references public.artist(ar_artist_key),
  artist_name_a text not null,
  artist_key_b integer not null references public.artist(ar_artist_key),
  artist_name_b text not null,
  match_score numeric(5,2) not null,
  match_method text not null,
  match_reason text not null,
  match_details jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  review_decision text,
  review_note text,
  reviewed_at timestamptz,
  reviewed_by text,
  merge_id bigint,
  created_at timestamptz not null default now(),
  constraint artist_duplicate_candidates_pair_chk check (artist_key_a <> artist_key_b)
);
```

Aanbevolen unieke index om dubbele pairs per run te voorkomen:

```sql
create unique index artist_duplicate_candidates_run_pair_uq
on public.artist_duplicate_candidates (
  scan_run_id,
  least(artist_key_a, artist_key_b),
  greatest(artist_key_a, artist_key_b)
);
```

### Candidate statusflow

```text
new
→ reviewing
→ not_duplicate
→ merge_planned
→ merged
→ ignored
→ error
```

Betekenis:

- `new`: kandidaat is gevonden, nog niet beoordeeld.
- `reviewing`: gebruiker bekijkt kandidaat.
- `not_duplicate`: gebruiker heeft bepaald dat dit geen dubbel is.
- `merge_planned`: kandidaat is waarschijnlijk dubbel, impactscan/merge nog uit te voeren.
- `merged`: kandidaat is verwerkt via bestaande ART-015C merge.
- `ignored`: bewust genegeerd, bijvoorbeeld lage kwaliteit of niet relevant.
- `error`: verwerking gaf een fout.

## 7. Reviewqueue in de Artiesten-app

De Artiesten-app krijgt later een reviewqueue voor `artist_duplicate_candidates`.

### Mogelijke UI

- Lijst met candidates.
- Filters:
  - status;
  - scan-run;
  - minimale score;
  - match method;
  - alleen high confidence.
- Per candidate tonen:
  - artist A key + naam;
  - artist B key + naam;
  - score;
  - reden;
  - match details;
  - gewicht/titelaantallen indien beschikbaar;
  - spellingvarianten.
- Acties:
  - open artist A;
  - open artist B;
  - impactscan starten;
  - markeer geen dubbel;
  - negeer;
  - later beoordelen;
  - merge uitvoeren via bestaande ART-015C-flow.

### Hergebruik bestaande mergeflow

De reviewqueue mag geen eigen merge-logica bevatten. De uiteindelijke verwerking loopt via:

- bestaande impactscan;
- bestaande transactionele merge-service;
- bestaande `artist_merge_history`;
- bestaande alerts/audit.

## 8. Scheduling opties

### Optie A — Crontab

Voordelen:

- simpel;
- OS-standaard;
- weinig dependencies.

Nadelen:

- minder zichtbaar in Shellstarter;
- logging/monitoring zelf inrichten.

### Optie B — OS scheduler / launchd / task scheduler

Voordelen:

- platformeigen;
- robuust.

Nadelen:

- platformafhankelijk.

### Optie C — Custom Python scheduler

Voordelen:

- volledig in eigen code;
- makkelijk te koppelen aan app-specifieke logging.

Nadelen:

- extra procesbeheer;
- risico op dubbele runs;
- meer onderhoud.

### Advies

Start met een handmatig uitvoerbare Python scanner plus crontab-geschikte commandoregel. Houd de scanner idempotent en voorkom dubbele actieve runs met een run-lock/statuscheck.

## 9. Logging

De scanner schrijft naar de projectlogdirectory, bijvoorbeeld:

```text
logs/artist-duplicate-scanner-YYYYMMDD-HHMMSS.log
```

Minimale logevents:

- scan start;
- configuratie;
- aantal geladen artiesten;
- aantal geladen spellingen;
- aantal candidate pairs;
- aantal opgeslagen candidates;
- scan completed/failed;
- foutmelding en stacktrace bij technische fout.

Logniveaus:

- `debug`: matchdetails, thresholds, pair-evaluatie indien nodig;
- `info`: scan start/einde, aantallen;
- `warn`: verdachte datakwaliteit, overgeslagen artists;
- `error`: technische fouten.

## 10. Shellstarter alerts/mail

### Alertmomenten

Aanbevolen alerts:

- scan afgerond met nieuwe candidates;
- scan mislukt;
- uitzonderlijk veel candidates gevonden;
- reviewqueue bevat candidates ouder dan X dagen.

### Mailmomenten

Mail voorlopig functioneel voorbereiden, maar nog niet hard implementeren zolang het Shellstarter-mailcontract niet definitief is.

Mail is geschikt voor:

- scan mislukt;
- veel candidates gevonden;
- periodieke samenvatting;
- maintenance run met hoge impact.

## 11. API-ontwerp toekomstige reviewqueue

Voorstel endpoints:

```text
GET  /api/artists/duplicate-scan-runs
GET  /api/artists/duplicate-candidates
PATCH /api/artists/duplicate-candidates/:candidateId/status
POST /api/artists/duplicate-candidates/:candidateId/impact
POST /api/artists/duplicate-candidates/:candidateId/merge
```

Belangrijk: `merge` route gebruikt intern dezelfde merge-service als ART-015C.

## 12. Implementatieplan vervolg

### ART-015D-1 — SQL stagingtabellen + Python scanner basis

- Migratie voor `artist_duplicate_scan_runs` en `artist_duplicate_candidates`.
- Python CLI scanner.
- `.env` configuratie.
- Logging naar `logs/`.
- Fuzzy matching basis.
- Scanner schrijft candidates, maar er is nog geen review UI.

### ART-015D-2 — Reviewqueue in Artiesten-app

- API endpoints voor scan-runs/candidates.
- React reviewqueue.
- Statusacties.
- Impactscan starten vanuit candidate.
- Merge via bestaande ART-015C-service.

### ART-015D-3 — Scheduling en alerts/mail hardening

- Cron/runbook.
- Dubbele-run beveiliging.
- Shellstarter alerts.
- Mail/outbox zodra contract duidelijk is.
- Metrics en logverfijning.

## 13. Acceptatiecriteria ontwerp

- Scanner is kandidaatbron, geen merge-uitvoerder.
- Candidates worden persistent en reviewbaar opgeslagen.
- Bestaande impactscan en mergeflow worden hergebruikt.
- Statusflow ondersteunt afwerken van een werkvoorraad.
- Scheduling is ontworpen zonder vendor lock-in.
- Shellstarter alerts/mail zijn functioneel voorbereid.
- Albums, Discogs en muzikant/band-relaties zijn niet geblokkeerd door dit ontwerp.

---

## 13. ART-015D-1 implementatie — SQL stagingtabellen en Python scanner basis

ART-015D-1 implementeert de technische basis voor de onderhoudsvariant. De reviewqueue in de Artiesten-app volgt later in ART-015D-2.

### 13.1 Toegevoegde databaseobjecten

Migratiebestand:

```text
scripts/sql/20260526_art015d1_duplicate_scanner_staging.sql
```

De migratie maakt de volgende tabellen aan:

- `artist_duplicate_scan_runs`
- `artist_duplicate_candidates`

De tabel `artist_duplicate_candidates` is expliciet bedoeld als staging-/reviewtabel. De scanner voert **nooit automatisch een merge** uit.

### 13.2 Docker-proof migratie

De migratie wordt uitgevoerd via:

```bash
npm run db:migrate:art015d1
```

Het script gebruikt de bekende Docker PostgreSQL-configuratie:

```text
ARTIST_DB_CONTAINER=my-postgresdb
ARTIST_DB_USER=postgres
ARTIST_DB_NAME=musicdb
```

### 13.3 Python scanner

Scannerbestand:

```text
scripts/artist_duplicate_scanner.py
```

Wrapper/run-script:

```text
scripts/run-artist-duplicate-scanner.sh
```

Uitvoering:

```bash
npm run scan:duplicates
```

De scanner gebruikt geen externe Python database dependency. Hij gebruikt `docker exec ... psql` zodat hij aansluit bij de bestaande Docker PostgreSQL-setup.

### 13.4 Scannerinputs

De scanner leest:

- `artist.ar_artist_key`
- `artist.ar_artist_name`
- `artist.ar_is_deleted`
- `artist.ar_merged_into_artist_key`
- `artiesten_spelling.as_artist_key`
- `artiesten_spelling.as_alternatieve_spelling`

Samengevoegde en verwijderde artiesten worden uitgesloten van de scan.

### 13.5 Matching

De scanner ondersteunt in ART-015D-1:

- normalisatie van namen;
- accenten verwijderen;
- `&` normaliseren naar `and`;
- leestekens reduceren;
- `difflib.SequenceMatcher` ratio;
- token-overlap;
- matching via `artist.ar_artist_name`;
- matching via `artiesten_spelling.as_alternatieve_spelling`;
- strengere guard voor korte namen.

### 13.6 Output

Bij een normale run:

1. scanner maakt een `artist_duplicate_scan_runs` record;
2. scanner berekent candidates;
3. scanner schrijft candidates naar `artist_duplicate_candidates`;
4. scanner markeert de run als `completed` of `failed`;
5. scanner schrijft een Shellstarter-alert wanneer `--no-alert` niet is meegegeven;
6. scanner schrijft JSONL-logs in de projectlogdirectory.

### 13.7 Dry-run

Voor veilige testuitvoering:

```bash
npm run scan:duplicates -- --dry-run --verbose
```

Dry-run berekent candidates en toont de eerste resultaten, maar schrijft geen stagingrecords en voert geen merge uit.

### 13.8 Configuratie

`.env.example` bevat standaardwaarden:

```env
ARTIST_DUPLICATE_MIN_SCORE=82
ARTIST_DUPLICATE_MAX_CANDIDATES=500
```

De shell-wrapper leest deze waarden als defaults.

### 13.9 Vervolg naar ART-015D-2

ART-015D-2 bouwt de reviewqueue in de Artiesten-app bovenop deze stagingtabellen. De bestaande ART-015B/ART-015C impactscan en merge-service blijven leidend.

## ART-015D-2A — Rerun handling en datamodel-hardening

### Aanleiding

Een periodieke scanner kan meerdere keren worden uitgevoerd terwijl eerdere scanresultaten nog open of deels verwerkt zijn. Zonder extra regels kan dezelfde combinatie van artiesten daardoor opnieuw als nieuwe candidate verschijnen. ART-015D-2A voorkomt dubbele open review-werkvoorraad.

### Functionele regels

- Een candidate-paar wordt volgorde-onafhankelijk herkend: artiest A + artiest B is hetzelfde paar als artiest B + artiest A.
- De scanner gebruikt hiervoor `artist_key_low = least(artist_key_a, artist_key_b)` en `artist_key_high = greatest(artist_key_a, artist_key_b)`.
- Als een open candidate al bestaat, wordt geen nieuwe candidate aangemaakt. De bestaande candidate wordt bijgewerkt met `last_seen_at`, `last_seen_scan_run_id` en `times_seen`.
- Als een paar eerder is afgehandeld met status `not_duplicate`, `ignored` of `merged`, wordt het niet opnieuw als nieuwe werkvoorraad aangeboden.
- Elke scan-run blijft wel eigen statistieken vastleggen: gevonden, nieuw toegevoegd, bestaand bijgewerkt en overgeslagen door reviewstatus.

### Technisch ontwerp

ART-015D-2A voegt velden toe aan `artist_duplicate_candidates`:

- `artist_key_low`
- `artist_key_high`
- `first_seen_at`
- `last_seen_at`
- `first_seen_scan_run_id`
- `last_seen_scan_run_id`
- `times_seen`

ART-015D-2A voegt scanstatistieken toe aan `artist_duplicate_scan_runs`:

- `candidates_found`
- `candidates_inserted`
- `candidates_updated_existing`
- `candidates_skipped_reviewed`

De scannerlogica is aangepast naar:

```text
bereken fuzzy candidates
→ normaliseer candidate-paar naar low/high
→ zoek bestaand candidate-paar
→ open bestaand paar: update last_seen/times_seen
→ reviewed/ignored/merged paar: skip
→ onbekend paar: insert als new
```

### Datamodel-hardening

De migratie probeert een unieke partial index aan te maken op open candidates:

```sql
unique (artist_key_low, artist_key_high)
where status in ('new', 'reviewing', 'merge_planned', 'error')
```

Als een bestaande database al dubbele open candidates bevat, wordt de index niet aangemaakt en meldt PostgreSQL een notice. Het ART-015D-2A runbook bevat een diagnostische query om zulke dubbelen eerst op te sporen.

### Niet in scope

ART-015D-2A bouwt nog geen reviewqueue UI. Dat volgt in ART-015D-2B.

## 14. ART-015D-3 aanvulling — scheduling, alerts en operationele hardening

ART-015D-3 werkt de operationele laag verder uit. Zie het aparte document:

```text
docs/ART_015D_3_Scheduling_Alerts_Operational_Hardening.md
```

Kernbesluiten:

- handmatig starten blijft mogelijk via `npm run scan:duplicates`;
- periodiek draaien wordt gedocumenteerd voor crontab en macOS launchd;
- Shellstarter-alerts zijn de primaire signalering voor scanresultaten en fouten;
- mail wordt functioneel voorbereid maar nog niet hard geïmplementeerd;
- `startapp.sh` wordt meegeleverd als uitvoerbaar lokaal validatie-/startscript;
- logs blijven timestamped in `logs/`.
