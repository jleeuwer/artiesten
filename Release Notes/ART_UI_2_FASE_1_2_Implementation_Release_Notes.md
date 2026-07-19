# ART-UI-2 Fase 1/2 — Implementation Release Notes

Datum: 14 juli 2026

## Wijzigingen

- Geneste verticale scroll uit het relatie-/detailgebied verwijderd.
- Legacy `overflow-y: auto` en vaste detailhoogtes fysiek uit de basis-CSS verwijderd.
- Horizontale bereikbaarheid van brede tabellen behouden.
- Discogs-resultaten en imagegrid volgen de primaire paginascroll.
- Modal- en offcanvas-scroll blijven behouden.
- Development-only scrolldebug toegevoegd.
- Automatische scrollaudit toegevoegd via `npm run ui:scroll:audit`.
- Historische ART-UI-1A-test aangepast aan de nieuwe scrollarchitectuur.

## Database

Geen database- of Docker/PostgreSQL-migratie vereist.
