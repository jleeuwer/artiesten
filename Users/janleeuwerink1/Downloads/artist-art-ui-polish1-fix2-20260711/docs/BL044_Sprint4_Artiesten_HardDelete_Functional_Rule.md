# BL-044 Sprint 4 — Functionele hard delete regel

## Regel
`Delete forever` in Artiesten volgt voortaan deze functionele regel:

1. als de artiest voorkomt in `file_details`, mag permanent verwijderen niet doorgaan
2. als de artiest alleen een afhankelijke relatie heeft met `artiesten_spelling`, worden die spelling-records eerst verwijderd
3. daarna wordt de record in `artist` verwijderd
4. als andere FK-relaties de delete blokkeren, geeft de app een nette generieke blokkademelding

## Server-side implementatie
De regel is in de backend afgedwongen:

- expliciete precheck op `public.file_details`
- delete van `public.artiesten_spelling`
- delete van `public.artist`
- transactionele afhandeling in het model

## UI-resultaat
In de Trash-weergave toont de app nu:

- een specifieke melding bij blokkade door `file_details`
- een generieke melding bij andere referenties
- een succesmelding wanneer permanent verwijderen wel lukt
