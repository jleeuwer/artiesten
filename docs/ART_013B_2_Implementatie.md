# ART-013B-2 — Implementatie

## Resultaat
Discogs is de primaire ondersteunende bron voor bandleden. Handmatige invoer blijft leidend en `musician_in_band` blijft de lokale waarheid.

De implementatie bevat:
- een Discogs-provider die `members` van de gekoppelde Discogs-band ophaalt;
- idempotente generatie van voorstellen;
- matching met bestaande standalone of gekoppelde musicians;
- herkenning van reeds bestaande bandrelaties;
- reviewqueue met Nieuw, Later, Genegeerd, Conflict en Geaccepteerd;
- expliciete acceptatie;
- transactionele creatie van een standalone musician en bandrelatie;
- een generieke bronhistorie per geaccepteerde relatie;
- stale-statecontrole;
- Docker/PostgreSQL preflight, migratie, verify en rollbacktest.

## Lokale data blijft leidend
Acceptatie vult alleen nieuwe records of expliciet gekozen velden. De provider schrijft nooit direct naar `musician_in_band`. De brongegevens blijven afzonderlijk beschikbaar in `musician_in_band_source`.

## Databasecommando's
```bash
mkdir -p logs && npm run musician-in-band-proposals:preflight 2>&1 | tee "logs/art013b2-preflight-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run db:migrate:art013b2 2>&1 | tee "logs/art013b2-migration-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run musician-in-band-proposals:verify 2>&1 | tee "logs/art013b2-verify-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013b2:db 2>&1 | tee "logs/art013b2-dbtest-$(date +%Y%m%d-%H%M%S).log"
```

## Fix-1 — Precision defaults bij nieuwe Discogs-bandleden

Bij acceptatie van een Discogs-voorstel zonder begin- of einddatum worden de verplichte kolommen `mb_date_from_precision` en `mb_date_to_precision` gevuld met `unknown`. Alleen wanneer een concrete datum aanwezig is, wordt `day` gebruikt. Hiermee schrijft de acceptatieflow nooit `NULL` naar de `NOT NULL`-kolommen.
