# Release notes — ART-012D-2 Discogs naam toevoegen als alternatieve spelling

## Inhoud

Deze release voegt de eerste muterende Discogs-spellingactie toe:

- beschikbare Discogs-naamvoorstellen kunnen als alternatieve spelling worden toegevoegd;
- canonical artist name wordt niet gewijzigd;
- conflicten met bestaande `artiesten_spelling` worden geblokkeerd;
- UI toont succes/foutmelding en laadt voorstellen opnieuw.

## Geen migratie

Er is geen nieuwe SQL-migratie nodig.

## Validatie

Gebruik:

```bash
npm run test:art012d2
npm run test:art012d
npm run test:art012
```
