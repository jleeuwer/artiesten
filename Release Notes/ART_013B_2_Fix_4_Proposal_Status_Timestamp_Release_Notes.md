# ART-013B-2-Fix-4 — Proposal status timestamp precision

## Bevinding
Bij een bestaand lokaal bandlid kon `Negeer` direct na het laden ten onrechte melden dat het voorstel intussen gewijzigd was.

## Oorzaak
PostgreSQL bewaart `updated_at` met microsecondeprecisie. Via JSON/JavaScript wordt de timestamp op milliseconden weergegeven. De oude SQL-update vergeleek beide timestamps exact en gaf daardoor een fout-negatieve stale conflictmelding.

## Oplossing
- Proposal wordt binnen een transactie met `FOR UPDATE` gelockt.
- `expectedUpdatedAt` en de actuele databasewaarde worden op JavaScript-millisecondeprecisie vergeleken.
- De statusupdate gebeurt daarna op de gelockte rij.
- Echte gelijktijdige wijzigingen blijven resulteren in `STALE_MIB_PROPOSAL`.

Geen database-migratie nodig.
