# ART-013B-2-Fix-1

Opgelost: acceptatie van een nieuw Discogs-bandlid zonder periode faalde op `mb_date_from_precision`/`mb_date_to_precision` NOT NULL. Ontbrekende precisie wordt nu als `unknown` opgeslagen.

Geen database-migratie nodig.
