# Release Notes — ART-015D-3A Scanner alert hardening

## Inhoud

Deze release concretiseert de Shellstarter-alerting voor de duplicate scanner.

## Wijzigingen

- Scanner schrijft alleen standaard succes-alerts als er nieuwe of bijgewerkte open candidates zijn.
- Scanner schrijft een `danger` alert als een scan faalt nadat een scan-run is aangemaakt.
- Alert severity bij succes is configureerbaar via `ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD`.
- Alerting is configureerbaar via `ARTIST_DUPLICATE_ALERT_ENABLED` en kan per run worden uitgezet met `--no-alert`.
- Alert-insert fouten laten de scan zelf niet alsnog falen; ze worden gelogd als warning.
- `.env.example`, README, ART-015D runbook en tests zijn bijgewerkt.

## Migratie

Geen nieuwe SQL-migratie nodig.

## Test

```bash
npm run test:art015d3a
npm run test:art015d
npm run test:packaging
```
