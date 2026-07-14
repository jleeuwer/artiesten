# ART-013A-3 — Implementatie

Datum: 2026-07-12  
Status: geïmplementeerd; lokale Docker/PostgreSQL-acceptatie vereist

## Gerealiseerd

- `musician.ar_artist_key` blijft de enige artist/musician-koppeling en is nullable.
- Een standalone musician kan zonder artist worden aangemaakt, gezocht, gewijzigd en veilig verwijderd.
- Een nieuwe persoonsartist maakt in dezelfde transactie exact één musician, of koppelt een geselecteerde vrije musician.
- Een vrije musician kan aan een bestaande persoonsartist worden gekoppeld of naar een nieuwe persoonsartist worden gepromoveerd.
- Vanuit Bandlid toevoegen kan een nieuw bandlid plus `musician_in_band` in één transactie worden opgeslagen zonder artistrecord.
- De bestaande eenrichtingssync artist → musician blijft actief voor gekoppelde persoonsartists.
- Verwijderen van een musician wordt geblokkeerd zolang een artist- of bandrelatie bestaat.
- Duplicate candidates op genormaliseerde naam worden vóór musician-create gemeld.

## API

- `GET /api/musicians/search`
- `GET /api/musicians/:musicianKey`
- `POST /api/musicians`
- `PUT /api/musicians/:musicianKey`
- `DELETE /api/musicians/:musicianKey`
- `POST /api/musicians/:musicianKey/create-artist`
- `POST /api/artists/:artistKey/musician/link`
- `DELETE /api/artists/:artistKey/musician/link`
- `POST /api/musician-in-band/create-member`

## Databasevolgorde

```bash
mkdir -p logs && npm run artist-musician:preflight 2>&1 | tee "logs/art013a3-preflight-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run db:migrate:art013a3 2>&1 | tee "logs/art013a3-migration-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run artist-musician:verify 2>&1 | tee "logs/art013a3-verify-$(date +%Y%m%d-%H%M%S).log"
ARTIST_DB_TEST_ALLOWED=true npm run test:art013a3:db 2>&1 | tee "logs/art013a3-dbtest-$(date +%Y%m%d-%H%M%S).log"
```

Alle scripts lezen de bestaande centrale `.env` met `ARTIST_DB_CONTAINER`, `ARTIST_DB_USER`, `ARTIST_DB_NAME`, `ARTIST_DB_TEST_ALLOWED` en `ARTIST_DB_ENVIRONMENT`.
