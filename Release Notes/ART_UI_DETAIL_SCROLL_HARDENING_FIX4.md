# ART-UI detail- en scrollhardening — Fix 4

Datum: 2026-07-19

## Aanleiding

`npm run test:all` stopte in `art012d3aFix1DiscogsSpellingUx.contract.test.mjs` omdat een historische contracttest nog een inmiddels verwijderde, letterlijke instructietekst verwachtte:

`Gebruik de naamvoorstellen reviewqueue om Discogs-namen te beoordelen`

De actuele UI bevat dezelfde functionele uitleg in de tekst:

`Na koppeling kun je Discogs-namen via de reviewqueue beoordelen.`

Daarnaast blijft de kop `Discogs naamvoorstellen reviewqueue` aanwezig.

## Wijziging

- De verouderde letterlijke assertion is verwijderd.
- De contracttest controleert nu de actuele instructie en de blijvende reviewqueue-elementen.
- Er is geen wijziging aan backend, API of databaseschema.
- Er is geen database-migratie nodig.
