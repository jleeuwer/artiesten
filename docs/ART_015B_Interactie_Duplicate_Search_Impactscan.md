# ART-015B — Interactieve duplicate search en read-only impactscan

## Doel

ART-015B implementeert de eerste concrete stap voor artiesten ontdubbelen. De gebruiker kan vanuit de Artiesten-app mogelijke dubbele artiesten zoeken met fuzzy matching en vervolgens een read-only impactscan openen voor twee mogelijke merge-richtingen.

Deze sprint voert bewust nog geen database-mutaties voor merge uit. De echte samenvoeging met transactie en audit hoort bij ART-015C.

## Scope

In scope:

- interactieve fuzzy duplicate candidate search vanuit het relatiepaneel van een geselecteerde artiest;
- matching op `artist.ar_artist_name` en `artiesten_spelling.as_alternatieve_spelling`;
- normalisatie van namen, onder andere lowercase, accenten verwijderen, `&` naar `and`, leestekens reduceren en spaties normaliseren;
- fuzzy score op basis van genormaliseerde exacte match, token-overlap en Levenshtein-afstand;
- top-N kandidaten met score, matchreden en gematchte waarden;
- read-only impactscan voor twee richtingen:
  - geselecteerde artiest wordt vervangen door kandidaat;
  - kandidaat wordt vervangen door geselecteerde artiest;
- impactscan op minimaal:
  - `file_details.fd_artist_key`;
  - `artiesten_spelling.as_artist_key`;
- waarschuwingen voor spellingconflicten en favoriet-status;
- documentatie en contracttests.

Niet in scope:

- echte merge uitvoeren;
- `UPDATE file_details SET fd_artist_key = ...`;
- audit/history schrijven;
- periodieke Python maintenance scanner;
- stagingtabellen voor duplicate candidates;
- albums, Discogs artist links en muzikant/band-relaties muteren.

## Functionele flow

```text
Gebruiker selecteert artiest
  ↓
Relatiepaneel verschijnt onderaan
  ↓
Gebruiker klikt “Zoek mogelijke dubbelen”
  ↓
App toont fuzzy kandidaten met score en matchreden
  ↓
Gebruiker kiest impactrichting:
  - Maak kandidaat leidend
  - Maak deze artiest leidend
  ↓
Read-only impactscan toont geraakte tabellen, aantallen, voorbeelden en waarschuwingen
  ↓
Geen merge in deze sprint
```

## Fuzzy matching

Fuzzy matching is alleen een hulpmiddel voor kandidaatdetectie. Het systeem mag nooit automatisch artiesten samenvoegen op basis van fuzzy score.

De gebruiker blijft verantwoordelijk voor:

1. het beoordelen van kandidaten;
2. het kiezen van redundante artiest;
3. het kiezen van vervangende artiest;
4. het beoordelen van de impactscan;
5. later in ART-015C: expliciet akkoord voor uitvoeren.

## Technisch ontwerp

### API-endpoints

```text
GET /api/artists/:id/duplicate-candidates?limit=20&minScore=0.72
```

Geeft mogelijke dubbele artiesten terug voor de geselecteerde artiest.

```text
GET /api/artists/merge/impact?redundantArtistKey=<id>&replacementArtistKey=<id>
```

Geeft een read-only impactscan terug. Deze route staat vóór `/:id`, zodat Express hem niet als artist-id route interpreteert.

### Centrale flow

```text
candidate discovery → impactscan → conflictcontrole → expliciet akkoord → transactie → audit/history
```

ART-015B implementeert alleen:

```text
candidate discovery → impactscan
```

### Impactscan

De impactscan bevat minimaal:

- redundante artiest;
- vervangende artiest;
- table impacts;
- waarschuwingen;
- future scopes;
- expliciet veld `canExecuteMergeInThisSprint: false`.

Voor `file_details` toont de scan:

- aantal records;
- aantal unieke titels;
- aantal hitlijsten;
- voorbeeldrecords met titel, hitlijst, bestandsnaam en jaren.

Voor `artiesten_spelling` toont de scan:

- aantal records;
- aantal conflicten met spellingen die al bij de vervangende artiest bestaan;
- voorbeeldrecords met conflictindicator.

## Toekomstige aansluiting

ART-015C moet dezelfde impactscan gebruiken als voorwaarde voor echte merge-uitvoering. ART-015D kan later een periodieke Python scanner bouwen die kandidaatsets klaarzet in stagingtabellen. Beide routes gebruiken dezelfde centrale impactscan en mergeflow.

## Acceptatiecriteria

- De gebruiker kan vanuit het relatiepaneel mogelijke dubbelen zoeken.
- Kandidaten tonen score, matchwaarde en matchreden.
- De gebruiker kan beide impactrichtingen inspecteren.
- De impactscan toont minimaal `file_details` en `artiesten_spelling`.
- De sprint voert geen merge uit en bevat geen muterende artist-key update.
- Contracttests borgen routes, model/controllerfuncties en frontendintegratie.

## ART-015C-2 labelbesluit voor merge-richting

De impactscan gebruikt vanaf ART-015C-2 duidelijke labels voor de merge-richting:

- **Maak kandidaat leidend**: de kandidaat wordt de canonical/vervangende artiest; de huidige geselecteerde artiest wordt vervangen.
- **Maak deze artiest leidend**: de huidige geselecteerde artiest wordt de canonical/vervangende artiest; de kandidaat wordt vervangen.

Deze labels vervangen de eerdere formuleringen `Deze vervangen` en `Kandidaat vervangen`.
