# ART-012D-1 — Testcases en runbook

## Voorwaarden

ART-012B migratie moet zijn toegepast:

```bash
npm run db:migrate:art012b
```

Er moet een Discogs artist gekoppeld zijn via **Koppel Discogs artist**, zodat deze tabellen gevuld zijn:

- `artist_external_reference`;
- `artist_enrichment_cache`;
- `artist_external_image` optioneel.

## Handmatige test

1. Open een artiest met gekoppelde Discogs-referentie.
2. Ga naar **Discogs artist enrichment**.
3. Klik **Toon spellingvoorstellen**.
4. Controleer dat voorstellen zichtbaar worden.
5. Controleer dat de app niets wijzigt in `artist` of `artiesten_spelling`.

Controlequery:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_artist_key, as_alternatieve_spelling
from artiesten_spelling
where as_artist_key = <artist_key>
order by as_alternatieve_spelling;
"
```

## API-test

```bash
curl http://localhost:3012/api/artists/<artist_key>/discogs/spelling-proposals
```

Verwachte response:

- `artist`;
- `reference`;
- `cache`;
- `proposals`;
- `summary`;
- `note` met read-only melding.

## Testcases

| Testcase | Verwachting |
|---|---|
| TC-ART012D1-001 | Endpoint bestaat en retourneert voorstellen voor gekoppelde Discogs-bron. |
| TC-ART012D1-002 | Discogs artist name wordt als voorstel getoond maar overschrijft `artist.ar_artist_name` niet. |
| TC-ART012D1-003 | Bestaande eigen spelling krijgt status `already_alternative_spelling`. |
| TC-ART012D1-004 | Spelling die bij een andere artist hoort krijgt status `conflict_other_artist`. |
| TC-ART012D1-005 | UI toont **Toon spellingvoorstellen** en samenvattingchips. |
| TC-ART012D1-006 | Er worden geen muterende SQL-acties uitgevoerd door dit endpoint. |

## Automatische tests

```bash
npm run test:art012d1
npm run test:art012d
npm run test:art012
```
