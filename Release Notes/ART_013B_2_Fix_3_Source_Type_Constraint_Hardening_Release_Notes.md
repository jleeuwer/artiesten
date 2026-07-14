# ART-013B-2-Fix-3 — Source type constraint hardening

## Probleem
Na Fix-2 kon acceptatie van een Discogs-bandlid nog steeds falen op `ck_musician_in_band_source_type`. Dit kon gebeuren wanneer een legacy CHECK-constraint met een andere naam actief bleef, de migratie niet de werkelijk actieve definitie verving, of bestaande waarden hoofdletters/spaties bevatten.

## Oplossing
- Verwijdert alle CHECK-constraints op `musician_in_band` waarvan de definitie `mb_source_type` bevat, ongeacht de constraintnaam.
- Normaliseert bestaande waarden met `lower(btrim(...))`.
- Maakt één canonieke constraint die manual, book, website, liner_notes, other, discogs, musicbrainz en wikidata toestaat.
- Verify toont voortaan de exacte actieve constraintdefinitie en rapporteert ongeldige bestaande bronwaarden.

## Uitvoering
Voer opnieuw uit:

```bash
mkdir -p logs && npm run db:migrate:art013b2 2>&1 | tee "logs/art013b2-fix3-migration-$(date +%Y%m%d-%H%M%S).log"
```

Daarna:

```bash
mkdir -p logs && npm run musician-in-band-proposals:verify 2>&1 | tee "logs/art013b2-fix3-verify-$(date +%Y%m%d-%H%M%S).log"
```
