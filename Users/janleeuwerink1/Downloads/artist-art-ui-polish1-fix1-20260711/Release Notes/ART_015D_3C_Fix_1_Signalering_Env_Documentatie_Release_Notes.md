# ART-015D-3C-Fix-1 — Signalering en env-documentatie hardening

## Doel

Deze fix maakt de ART-015D-3C documentatie explicieter over het verschil tussen Shellstarter-alerts, UI-signalering en mail. Daarnaast borgt de fix dat `.env.example` alle duplicate scanner-, alert- en stale reviewqueue-variabelen bevat.

## Aangepast

- `.env.example` bevat expliciet:
  - `ARTIST_DUPLICATE_MIN_SCORE=82`
  - `ARTIST_DUPLICATE_MAX_CANDIDATES=500`
  - `ARTIST_DUPLICATE_ALERT_ENABLED=true`
  - `ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25`
  - `ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14`
  - `ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true`
  - `ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1`
- ART-015D-3C documentatie bevat nu een centrale signaaltabel:
  - Shellstarter alert via `public.alerts` is geïmplementeerd.
  - UI-badge en reviewqueue-waarschuwing zijn geïmplementeerd.
  - Echte mail is nog niet technisch geïmplementeerd.
  - ART-015D-3D blijft de vervolgstap voor het Shellstarter-mailcontract.
- Contracttest toegevoegd om deze env- en documentatieafspraken te borgen.

## Migratie

Geen nieuwe SQL-migratie nodig.
