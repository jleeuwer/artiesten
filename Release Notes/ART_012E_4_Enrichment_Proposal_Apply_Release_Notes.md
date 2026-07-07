# Release Notes — ART-012E-4 Enrichment Proposal Apply

## Opgeleverd

- Apply-acties toegevoegd voor Discogs verrijkingsvoorstellen.
- Statusacties toegevoegd: later beoordelen en negeren.
- Externe profieltekst wordt opgeslagen in `artist_external_profile`.
- Conflicten vereisen expliciete overschrijfbevestiging.
- Onvolledige datums blijven niet toepasbaar op artist date-velden.
- Contracttest en runbook toegevoegd.

## Migratie

```bash
mkdir -p logs && npm run db:migrate:art012e4 2>&1 | tee "logs/db-migrate-art012e4-$(date +%Y%m%d-%H%M%S).log"
```
