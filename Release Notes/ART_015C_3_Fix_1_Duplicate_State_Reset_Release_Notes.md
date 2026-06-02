# Release Notes — ART-015C-3-Fix-1 Duplicate state reset

## Doel

Deze fix voorkomt verwarring in het relatiepaneel wanneer de gebruiker mogelijke dubbele artiesten heeft gezocht en daarna teruggaat naar de artiestenlijst of een andere artiest selecteert.

## Opgelost

- De duplicate-search/impactscan state wordt volledig leeggemaakt bij **Terug naar artiestenlijst**.
- De duplicate-search/impactscan state wordt volledig leeggemaakt wanneer een andere artiest wordt geselecteerd.
- Oude kandidaten, impactscanresultaten, merge-richting, redenveld, bevestigingsstatus en meldingen blijven niet meer zichtbaar bij een andere geselecteerde artiest.

## Technisch

Nieuwe helper in `client/src/components/ArtistPageContent.jsx`:

```text
resetDuplicateWorkflowState()
```

Deze reset onder andere:

- `duplicateCandidates`
- `duplicatesError`
- `duplicatesLoading`
- `impactOpen`
- `impactData`
- `impactError`
- `mergeReason`
- `mergeConfirmed`
- `mergeResult`

## Tests

Uitgebreid:

```bash
npm run test:art015c3
```

## Migratie

Geen nieuwe SQL-migratie nodig.
