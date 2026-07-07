# ART-015D-3A — Scanner alert hardening

## Doel

ART-015D-3A maakt de Shellstarter-alerting rond de periodieke duplicate scanner concreter en robuuster. De scanner blijft een onderhoudsfunctie die alleen duplicate candidates klaarzet; hij voert nooit automatisch een merge uit.

## Functioneel gedrag

Bij een echte scanner-run, dus niet bij `--dry-run`, kan de scanner een Shellstarter-alert schrijven in `public.alerts`.

### Alertregels

| Situatie | Alert | Severity |
|---|---:|---|
| Scan afgerond met nieuwe of bijgewerkte open candidates | Ja | `info` of `warning` |
| Scan afgerond zonder actieve candidates | Nee, standaard niet | n.v.t. |
| Scan mislukt nadat een scan-run is aangemaakt | Ja | `danger` |
| Alert insert faalt | Scanner-run blijft geslaagd/gefaald zoals oorspronkelijk; alertfout wordt gelogd | n.v.t. |

De severity bij een succesvolle scan is afhankelijk van `ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD`. Als het aantal actieve candidates, nieuw plus bestaand bijgewerkt, gelijk aan of groter is dan de threshold, krijgt de alert severity `warning`; anders `info`.

## Configuratie

```env
ARTIST_DUPLICATE_ALERT_ENABLED=true
ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25
```

De optie `--no-alert` blijft beschikbaar voor onderhoud en testscenario's.

## Technische implementatie

De scanner gebruikt helperfuncties:

- `env_bool`
- `env_int`
- `build_alert`
- `write_alert`
- `maybe_write_alert`

`maybe_write_alert` is bewust defensief: als het schrijven naar `public.alerts` faalt, mag dat de scanner-run niet alsnog laten falen. De alertfout wordt als warning gelogd.

## Alertinhoud

Succes-alert:

```text
Scan-run <id> is afgerond. Gevonden: <found>; nieuw: <inserted>; bestaand bijgewerkt: <updated>; overgeslagen door reviewstatus: <skipped>.
```

Fout-alert:

```text
Scan-run <id> is mislukt. Fout: <error_message>
```

## Niet in scope

- Echte mailverzending.
- Automatische merge.
- Scheduling-bestanden voor crontab/launchd.
- Stale reviewqueue signalering.

Deze blijven vervolgitems binnen ART-015D-3.
