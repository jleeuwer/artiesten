# ART-015D-3C — Stale reviewqueue signalering

## Doel

ART-015D-3C voorkomt dat duplicate candidates uit de periodieke scanner onzichtbaar blijven liggen. De scanner en reviewqueue signaleren voortaan wanneer open kandidaten ouder zijn dan een configureerbare drempel.

## Functionele scope

- Open duplicate candidates met status `new`, `reviewing`, `merge_planned` of `error` worden als stale beschouwd wanneer `first_seen_at` ouder is dan de drempel.
- De drempel staat in `.env` als `ARTIST_DUPLICATE_STALE_REVIEW_DAYS`, standaard 14 dagen.
- De reviewqueue toont stale candidates met badge **Te lang open**.
- De reviewqueue toont bij stale candidates hoeveel dagen ze openstaan en welke drempel geldt.
- De scanner verrijkt Shellstarter-alerts met reviewqueue-statistieken:
  - open candidates;
  - stale candidates;
  - oudste open candidate;
  - stale-drempel in dagen.
- Als stale candidates de alertdrempel bereiken, wordt de scanner-alert `warning`.

## Configuratie

```env
ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14
ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true
ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1
```

## Technisch ontwerp

### Scanner

De scanner voert na `persist_candidates` een read-only query uit op `artist_duplicate_candidates` om open/stale aantallen te bepalen. Deze statistieken worden toegevoegd aan de bestaande scan-statistieken en vervolgens gebruikt bij `build_alert`.

De scanner faalt niet als deze stale-statistieken niet opgehaald kunnen worden; de fout wordt gelogd als warning.

### API / reviewqueue

`GET /api/artists/duplicate-candidates` retourneert per candidate extra velden:

- `stale_review_days`
- `review_age_days`
- `is_stale_review_candidate`

De berekening gebruikt `ARTIST_DUPLICATE_STALE_REVIEW_DAYS` uit de serveromgeving.

### UI

De Duplicate reviewqueue toont:

- een waarschuwing boven de lijst als de geladen pagina stale candidates bevat;
- badge **Te lang open** op stale candidates;
- detailregel met aantal dagen open en de ingestelde drempel.

## Signalering: alerts, UI en mail

ART-015D-3C gebruikt twee concrete signaleringskanalen en één bewust openstaand kanaal.

| Signaal | Status | Toelichting |
|---|---|---|
| Shellstarter alert via `public.alerts` | Geïmplementeerd | De scanner schrijft bij relevante scanresultaten een alert naar de bestaande `alerts` tabel. Shellstarter kan deze alert tonen als hij deze tabel uitleest. |
| UI-badge **Te lang open** | Geïmplementeerd | De Duplicate reviewqueue toont per stale candidate een badge en het aantal dagen open. |
| UI-waarschuwing in reviewqueue | Geïmplementeerd | Als de geladen reviewqueue stale candidates bevat, toont de UI een waarschuwing boven de lijst. |
| Echte mail | Niet geïmplementeerd | Mail is functioneel voorbereid, maar er is nog geen technisch Shellstarter-mailcontract gekoppeld. |
| Mailstrategie | Voorbereid | Mail blijft kandidaat voor situaties zoals scannerfouten, hoge impact of veel stale candidates. |
| Volgende stap | ART-015D-3D | Shellstarter mailcontract uitwerken en daarna pas technisch koppelen. |

De scanner doet de operationele signalering: er is werkvoorraad of er staat werk te lang open. De reviewqueue doet de gebruikerssignalering: deze specifieke kandidaat staat te lang open.

Samengevat:

```text
Scanner → schrijft scan-run + candidates
Scanner → schrijft Shellstarter-alerts via public.alerts
Reviewqueue → toont stale candidates met badge/waarschuwing
Mail → nog niet technisch geïmplementeerd
```

## Niet in scope

- Automatisch sluiten of wijzigen van candidates.
- Mailimplementatie.
- Automatische merge.
- Schedulerbestanden wijzigen.

## Acceptatiecriteria

- `.env.example` bevat de stale reviewqueue-configuratie.
- Scanner-alerts bevatten open/stale reviewqueue-statistieken.
- Reviewqueue API retourneert stale velden.
- UI toont stale candidates duidelijk.
- Stale signalering wijzigt geen candidate-statussen.
