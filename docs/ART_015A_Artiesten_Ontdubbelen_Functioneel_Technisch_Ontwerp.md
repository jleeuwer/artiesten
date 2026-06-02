# ART-015A — Artiesten ontdubbelen / samenvoegen

**Status:** functioneel en technisch ontwerp  
**Type:** requirements- en architectuursprint, nog geen merge-uitvoering in code  
**Datum:** 2026-05-25  
**Scope:** Artiesten-app / musicdb  

## 1. Doel

ART-015A werkt de functionaliteit uit om dubbele artiesten veilig te kunnen herkennen, beoordelen en uiteindelijk samenvoegen.

De kern is:

1. De gebruiker kiest een redundante/dubbele artiest.
2. De gebruiker kiest een vervangende/canonical artiest.
3. Het systeem zoekt waar de redundante `artist_key` voorkomt.
4. Het systeem toont een impactoverzicht.
5. De gebruiker bevestigt expliciet.
6. Pas daarna mag het systeem verwijzingen transactiegewijs vervangen.
7. De merge wordt vastgelegd in audit/history.

Deze sprint levert ontwerp en documentatie. De daadwerkelijke merge-uitvoering wordt bewust in een latere implementatiesprint gebouwd.

## 2. Waarom nu?

Sprint 6 heeft relatie-inzicht toegevoegd:

- gewicht op unieke titels;
- favorieten;
- read-only panelen voor `file_details`, `artiesten_spelling` en hitlijsten;
- compacte relatiepanelen in het edit-scherm.

Daarmee is zichtbaar geworden waar artiesten aan gekoppeld zijn. De volgende logische beheerfunctie is het veilig ontdubbelen van artiesten, voordat we complexere koppelingen toevoegen zoals Discogs artist-data, albums, muzikant/band-relaties en album-relaties.

## 3. Belangrijke uitgangspunten

### 3.1 Geen automatische merge

Fuzzy matching, onderhoudsscans en Discogs-data mogen alleen kandidaten voorstellen. De merge zelf blijft altijd handmatig bevestigd.

### 3.2 Eén centrale mergeflow

Of een duplicate-kandidaat gevonden wordt via de interactieve Artiesten-app of via een periodieke onderhoudsscan, de uiteindelijke flow blijft hetzelfde:

```text
redundante artiest kiezen
→ vervangende artiest kiezen
→ impactscan
→ conflictcontrole
→ expliciet akkoord
→ transactie
→ audit/history
```

### 3.3 Geen directe hard delete

De redundante artiest wordt niet automatisch hard deleted. De veiligste eerste keuze is markeren als samengevoegd of soft delete, zodat historie en traceerbaarheid behouden blijven.

### 3.4 Voorbereid op albums en toekomstige relaties

Albums zijn nog niet toegevoegd aan `musicdb`, maar het ontwerp moet daarop voorsorteren. ART-015A mag dus niet alleen aan `file_details` en `artiesten_spelling` denken; toekomstige tabellen zoals albums, tracks, album-artists, Discogs artist-links en musician/band-relaties moeten in de architectuur passen.

## 4. Twee varianten voor duplicate discovery

We ontwerpen twee manieren om mogelijke dubbele artiesten te vinden.

## 4.1 Variant 1 — Periodieke onderhoudsfunctie met staging

Dit is de onderhouds-/scanvariant.

### Flow

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

### Functioneel idee

Een periodiek programma, bijvoorbeeld Python, scant de database op mogelijke dubbele artiesten. De scanner schrijft bevindingen naar staging-/reviewtabellen. Daarna leest de Artiesten-app of een aparte Node.js frontend de kandidaten uit en kan de gebruiker per kandidaat een actie nemen.

### Mogelijke acties per kandidaat

- beoordelen;
- negeren;
- markeren als geen dubbel;
- later beoordelen;
- redundante/vervangende artiest kiezen;
- impactscan openen;
- merge bevestigen in een latere uitvoeringsstap.

### Voordelen

- Geschikt voor periodiek onderhoud.
- Zwaardere fuzzy matching kan buiten de UI draaien.
- Grote werkvoorraad kan rustig worden afgewerkt.
- Past bij de bredere maintenance-architectuur, zoals Discogs/file_details maintenance.
- Scanruns zijn herhaalbaar, logbaar en testbaar.

### Nadelen

- Meer architectuur en extra tabellen.
- Extra batchprogramma of scheduler nodig.
- Meer runbook- en deploy-afspraken.
- Minder direct interactief.

## 4.2 Variant 2 — Geïntegreerde ondersteuning in de Artiesten-app

Dit is de interactieve beheerfunctie.

### Flow

```text
[Artiesten-app interactieve fuzzy search]
          ↓
impactscan API
          ↓
merge API
          ↓
artist_merge_history
```

### Functioneel idee

In de Artiesten-app kiest de gebruiker een artiest en krijgt ondersteuning bij het zoeken naar mogelijke dubbelen. De gebruiker kan bijvoorbeeld klikken op **Zoek mogelijke dubbelen**. Daarna toont de app fuzzy kandidaten met matchscore en matchreden.

### Mogelijke interacties

- kandidaat bekijken;
- kandidaat gebruiken als redundante artiest;
- kandidaat gebruiken als vervangende artiest;
- impactscan uitvoeren;
- kandidaat negeren.

### Voordelen

- Direct bruikbaar in de bestaande Artiesten-app.
- Minder architectuur nodig.
- Goed voor handmatige correctie.
- Snelle feedback op matchcriteria.
- Past goed bij het bestaande relatiepaneel.

### Nadelen

- Minder geschikt voor grote opschoonacties.
- Fuzzy matching moet snel blijven.
- Geen automatische werkvoorraad.

## 4.3 Advies voor implementatievolgorde

Voor ART-015A ontwerpen we beide varianten. Voor de eerste implementatie is het advies:

1. **Eerst geïntegreerde ondersteuning in de Artiesten-app.**
2. Daarna pas de periodieke onderhoudsfunctie met staging.

Reden: de mergeflow, impactscan, conflictregels en audit moeten eerst functioneel kloppen. Daarna kan een Python scanner dezelfde flow voeden met grotere hoeveelheden kandidaten.

## 5. Fuzzy matching als candidate discovery

Fuzzy matching wordt gebruikt om mogelijke dubbele artiesten te vinden, niet om automatisch te mergen.

### Voorbeelden

```text
Beatles ↔ The Beatles
Prince ↔ Prince and The Revolution
Beyonce ↔ Beyoncé
A-ha ↔ a Ha
Earth Wind & Fire ↔ Earth, Wind & Fire
```

### Matchbronnen

Eerste versie:

- `artist.ar_artist_name`;
- `artiesten_spelling.as_alternatieve_spelling`;
- genormaliseerde naamvarianten.

Latere uitbreiding:

- Discogs aliases;
- Discogs name variations;
- Discogs groups/members;
- album-artiesten;
- muzikant/band-relaties.

### Normalisatie

Te onderzoeken en waarschijnlijk toe te passen:

- lowercase;
- trim;
- meerdere spaties reduceren;
- accenten verwijderen;
- leestekens normaliseren;
- `&` en `and` vergelijkbaar maken;
- `the` optioneel apart behandelen;
- haakjes en toevoegingen zoals `(The)` of `feat.` voorzichtig behandelen.

### Risico's

Korte namen geven snel valse positieven. Bijvoorbeeld:

```text
Yes
Kiss
Queen
ABC
A-ha
```

Daarom moeten we matchscore en matchreden tonen en moet de gebruiker altijd zelf kiezen.

### Matchscore en matchreden

De UI toont bij voorkeur:

- score;
- matchmethode;
- gevonden via naam of spelling;
- normalisatieverschil;
- eventuele waarschuwing bij korte namen.

Voorbeeld:

| Redundante kandidaat | Mogelijke vervanger | Score | Reden |
|---|---:|---:|---|
| Beyonce | Beyoncé | 0.96 | Accentverschil na normalisatie |
| The Beatles | Beatles | 0.91 | The-prefix genegeerd |
| Earth Wind & Fire | Earth, Wind & Fire | 0.94 | Leestekens genegeerd |

## 6. Impactscan

De impactscan zoekt waar de redundante `artist_key` voorkomt.

### Minimale scope

- `file_details.fd_artist_key`;
- `artiesten_spelling.as_artist_key`.

### Voorbereid op toekomstige scope

- albums;
- album-artists;
- tracks;
- Discogs artist-links;
- artist relationships;
- staging/importtabellen;
- merge history;
- maintenance candidates.

### Impactoverzicht niveau 1 — samenvatting per tabel

Minimaal tonen:

| Tabel | Kolom | Aantal records | Actie |
|---|---:|---:|---|
| `file_details` | `fd_artist_key` | 42 | wordt vervangen |
| `artiesten_spelling` | `as_artist_key` | 3 | wordt vervangen of samengevoegd |

### Impactoverzicht niveau 2 — korte extractie

Voor `file_details`:

- `fd_key`;
- `fd_tag_title`;
- `fd_correct_artist`;
- `fd_file_name`;
- `fd_hitlijst`;
- `fd_action`;
- `fd_year_song_publish`;
- `fd_year_song_version`;
- `fd_discogs`, indien aanwezig.

Voor `artiesten_spelling`:

- `as_alternatieve_spelling`;
- `as_artist_key`;
- huidige canonical artistnaam;
- mogelijke conflictstatus.

Voor toekomstige albumtabellen:

- albumtitel;
- albumartiest;
- jaar;
- Discogs release/master;
- aantal tracks;
- rol van artiest op album.

### Impactoverzicht niveau 3 — conflicten en waarschuwingen

Voorbeelden:

- vervangende artiest heeft al dezelfde alternatieve spelling;
- beide artiesten hebben verschillende Discogs artist IDs;
- redundante artiest is favoriet maar vervangende artiest niet;
- beide artiesten hebben relatiegegevens met bands/muzikanten;
- toekomstige albumkoppelingen zouden dubbel ontstaan;
- de redundant artist komt voor in stagingtabellen die nog niet definitief zijn verwerkt.

## 7. Merge-uitvoering — ontwerp, nog niet bouwen in ART-015A

De uiteindelijke merge moet transactiegewijs gebeuren.

### Conceptuele stappen

1. Valideer redundante artiest.
2. Valideer vervangende artiest.
3. Blokkeer merge als beide artist keys gelijk zijn.
4. Draai impactscan opnieuw vlak voor uitvoering.
5. Controleer conflicten.
6. Update verwijzingen in scope-tabellen.
7. Behandel `artiesten_spelling` conflicten.
8. Markeer redundante artist als merged/soft deleted.
9. Leg audit/history vast.
10. Commit transactie.

### Belangrijk

De impactscan die de gebruiker ziet, moet vlak voor uitvoering opnieuw worden gevalideerd. De database kan immers gewijzigd zijn tussen preview en akkoord.

## 8. Datamodelvoorstellen

## 8.1 `artist_merge_history`

Voor audit/history:

```sql
create table if not exists artist_merge_history (
  amh_id bigserial primary key,
  amh_redundant_artist_key bigint not null,
  amh_replacement_artist_key bigint not null,
  amh_redundant_artist_name text,
  amh_replacement_artist_name text,
  amh_reason text,
  amh_status text not null default 'completed',
  amh_affected_tables jsonb not null default '[]'::jsonb,
  amh_conflicts jsonb not null default '[]'::jsonb,
  amh_created_at timestamptz not null default now(),
  amh_created_by text
);
```

## 8.2 Redundante artiest markeren

Optie A — velden op `artist`:

```sql
alter table artist
add column if not exists ar_merged_into_artist_key bigint null,
add column if not exists ar_merged_at timestamptz null,
add column if not exists ar_merge_note text null;
```

Optie B — alleen audit/history gebruiken en redundante artiest soft deleten.

Advies voor eerste implementatie: optie A plus audit/history, omdat traceerbaarheid dan direct zichtbaar is in de artist-tabel.

## 8.3 Candidate staging voor onderhoudsvariant

Voor periodieke scanruns:

```sql
create table if not exists artist_duplicate_scan_runs (
  adsr_id bigserial primary key,
  adsr_started_at timestamptz not null default now(),
  adsr_finished_at timestamptz,
  adsr_status text not null default 'running',
  adsr_source text not null default 'python-maintenance',
  adsr_parameters jsonb not null default '{}'::jsonb,
  adsr_candidate_count integer not null default 0
);
```

```sql
create table if not exists artist_duplicate_candidates (
  adc_id bigserial primary key,
  adc_scan_run_id bigint references artist_duplicate_scan_runs(adsr_id),
  adc_artist_key_a bigint not null,
  adc_artist_name_a text not null,
  adc_artist_key_b bigint not null,
  adc_artist_name_b text not null,
  adc_match_score numeric(5,4) not null,
  adc_match_method text not null,
  adc_match_reason text,
  adc_status text not null default 'open',
  adc_review_decision text,
  adc_review_note text,
  adc_created_at timestamptz not null default now(),
  adc_reviewed_at timestamptz
);
```

Statuswaarden bijvoorbeeld:

```text
open
reviewing
not_duplicate
merge_candidate
merged
ignored
```

## 9. API-ontwerp

### Interactieve duplicate search

```http
GET /api/artists/:id/duplicate-candidates?limit=20&threshold=0.82
```

Response bevat:

- candidate artist key;
- candidate artist name;
- match score;
- match method;
- match reason;
- relation counts;
- favorite indicator;
- optional warnings.

### Impactscan

```http
POST /api/artists/merge/impact
```

Body:

```json
{
  "redundantArtistKey": 123,
  "replacementArtistKey": 456
}
```

Response bevat:

- samenvatting per tabel;
- extracties;
- conflicten;
- waarschuwingen;
- uitvoerbaarheid.

### Merge uitvoeren

Nog niet bouwen in ART-015A, maar ontwerp:

```http
POST /api/artists/merge/execute
```

Body:

```json
{
  "redundantArtistKey": 123,
  "replacementArtistKey": 456,
  "confirmed": true,
  "reason": "Dubbele spelling gecorrigeerd na handmatige controle"
}
```

### Onderhoudskandidaten uitlezen

Voor latere variant 1:

```http
GET /api/artists/duplicate-candidates?status=open
PATCH /api/artists/duplicate-candidates/:candidateId
```

## 10. UI-ontwerp

## 10.1 Geïntegreerde variant

In de Artiesten-app:

1. Gebruiker selecteert artiest.
2. Relatiepaneel toont context.
3. Knop **Zoek mogelijke dubbelen**.
4. Kandidatenlijst toont score en reden.
5. Gebruiker kiest kandidaat als redundante of vervangende artiest.
6. App opent impactscan.
7. App toont waarschuwingen en conflicts.
8. Merge uitvoeren komt pas in latere sprint.

## 10.2 Onderhoudsvariant

Aparte reviewlijst:

- open duplicate candidates;
- score;
- matchmethode;
- datum scan;
- status;
- actie: bekijken, negeren, geen dubbel, impactscan.

## 11. Teststrategie

### ART-015A documentatiecontracttests

- ontwerpdocument bestaat;
- beide discovery-varianten staan beschreven;
- fuzzy matching is expliciet kandidaatdetectie en geen automatische merge;
- impactscan bevat minimaal `file_details` en `artiesten_spelling`;
- albums en toekomstige relaties worden genoemd;
- centrale mergeflow is opgenomen;
- audit/history is beschreven.

### Latere ART-015B tests

- duplicate candidates worden gevonden op genormaliseerde namen;
- korte namen veroorzaken geen automatische hoge-confidence merge;
- matchscore en matchreden worden teruggegeven;
- impactscan telt records per tabel;
- extracties bevatten afgesproken velden;
- conflicten op `artiesten_spelling` worden gemeld.

### Latere ART-015C tests

- merge draait in transactie;
- rollback bij fout;
- `file_details.fd_artist_key` wordt vervangen;
- `artiesten_spelling.as_artist_key` wordt veilig vervangen of samengevoegd;
- audit/history wordt gevuld;
- redundante artiest wordt gemarkeerd als merged;
- gelijke redundant/replacement key wordt geweigerd.

## 12. Acceptatiecriteria ART-015A

ART-015A is afgerond wanneer:

- het functioneel/technisch ontwerp is gedocumenteerd;
- beide kandidaatbronnen zijn beschreven;
- fuzzy matching is opgenomen als hulpmiddel voor candidate discovery;
- impactscan en mergeflow zijn uitgewerkt;
- audit/history en stagingtabellen zijn voorgesteld;
- albums en toekomstige artist relationships expliciet zijn meegenomen;
- backlog, project notes, README en tests zijn bijgewerkt;
- documentatiecontracttests groen zijn.

## 13. Niet in scope voor ART-015A

- Geen echte fuzzy search implementatie.
- Geen candidate stagingtabellen aanmaken.
- Geen merge API uitvoeren.
- Geen database-update van artist keys.
- Geen Python scanner bouwen.
- Geen albumdatamodel implementeren.
- Geen Discogs artist enrichment implementeren.

## 14. Aanbevolen vervolg

1. **ART-015B — Interactieve duplicate search + impactscan implementeren**  
   Bouw de geïntegreerde Artiesten-app variant met fuzzy kandidaten en read-only impactscan.

2. **ART-015C — Merge uitvoeren met transactie en audit**  
   Bouw de daadwerkelijke merge-uitvoering.

3. **ART-015D — Periodieke duplicate scanner/staging**  
   Bouw de Python onderhoudsvariant en reviewqueue.

