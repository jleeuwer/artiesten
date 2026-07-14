# ART-013B-1-Fix-2 — Legacy relation key compatibility

Datum: 2026-07-12

## Aanleiding
De bestaande `musician_in_band`-tabel bevat `mb_musician_key` en `mb_artist_key`, maar geen technische sleutel `mb_musician_band_key`. De eerste migratie eiste deze nieuwe sleutel ten onrechte vooraf.

## Oplossing
- preflight rapporteert elke bestaande sleutelkolom afzonderlijk;
- ontbreken van `mb_musician_band_key` is geen blocker meer;
- de migratie voegt deze technische identity-kolom veilig toe;
- een unieke index borgt stabiele CRUD-identificatie zonder een eventuele bestaande primary key te vervangen;
- verify controleert de nieuwe sleutel en index;
- documentatie en contracttests zijn bijgewerkt.

## Data-impact
De migratie vervangt of verwijdert geen bestaande kolommen of relaties. Bestaande rijen krijgen automatisch een unieke technische relationsleutel.
