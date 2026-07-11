# Release Notes — ART-013A-2 Databasevalidatie en backfill-hardening

Datum: 2026-07-11  
Status: geïmplementeerd; gereed voor database-acceptatie

## Opgeleverd

- read-only schema- en data-preflight met `BLOCKER`, `WARNING` en `INFO`;
- centrale Docker/psql-uitvoerhelper;
- duplicate-guard vóór de unieke musician/artist-index;
- geharde preview en execute met gedeelde preflight;
- uitsluiting en rapportage van ongeldige kandidaten;
- post-run verificatie van duplicates, missing links, orphans en triggerstatus;
- transactionele PostgreSQL-integratietest met rollback en productieguard;
- npm-commando's, contracttests en functionele testmapping;
- documentatie en backlog bijgewerkt.

## Nieuwe commando's

```bash
npm run musician:preflight
npm run musician:verify
npm run test:art013a2:contract
npm run test:art013a2:db
npm run test:art013a2
```

## Veiligheid

- Geen automatische duplicate-reparatie.
- Geen overschrijving van bestaande musicians door de backfill.
- Geen delete van musicians.
- Database-integratietests zijn standaard geblokkeerd en vereisen `ARTIST_DB_TEST_ALLOWED=true`.
- Productieomgevingen worden expliciet geweigerd.

## Teststatus opleveromgeving

Contracttests en shell-syntaxchecks worden tijdens packaging uitgevoerd. De Docker-database-integratietest moet in de lokale ontwikkelomgeving worden uitgevoerd omdat de opleveromgeving geen Docker CLI bevat.
