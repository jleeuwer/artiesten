# ART-012D-3B — Testcases en runbook

## Voorwaarden

- ART-012B migratie is uitgevoerd.
- Discogs is geconfigureerd in `.env`.
- De artiest heeft een gekoppelde Discogs artist.
- Er zijn spellingvoorstellen zichtbaar.

## Handmatige testflow

1. Start de app.
2. Selecteer een artiest.
3. Zoek/koppel een Discogs artist.
4. Klik **Toon spellingvoorstellen**.
5. Kies een beschikbaar voorstel.
6. Klik **Preview canonical**.
7. Controleer dat er nog geen wijziging is uitgevoerd.
8. Klik **Maak canonical**.
9. Bevestig de actie.
10. Controleer de succesmelding.

## Databasecontrole

Controleer artist:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select ar_artist_key, ar_artist_name
from artist
where ar_artist_key = <artist_key>;
"
```

Controleer spellings:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_alternatieve_spelling, as_artist_key
from artiesten_spelling
where as_artist_key = <artist_key>
order by as_alternatieve_spelling;
"
```

De oude canonical naam en de nieuwe canonical naam moeten allebei als spelling voor dezelfde artist_key aanwezig zijn.

## Acceptatiecriteria

- **Maak canonical** verschijnt alleen na een niet-geblokkeerde preview.
- Canonical rename wordt transactioneel uitgevoerd.
- Oude canonical naam blijft behouden als alternatieve spelling.
- Nieuwe canonical naam wordt geborgd in `artiesten_spelling`.
- `file_details.fd_correct_artist` wordt niet automatisch aangepast.
- Conflicten blokkeren de actie.

## Automatische tests

```bash
npm run test:art012d3b
npm run test:art012d3a
npm run test:art012d
npm run test:art012
```
