# ART-012E-4-Fix-5 — Artist edit date persistence

Datum: 2026-06-08

## Aanleiding

Bij het handmatig bewerken van een artiest in het edit-scherm werden geboorte- en sterfdatum onjuist weergegeven/veranderd en niet betrouwbaar opgeslagen.

## Oorzaak

De normale artist edit-flow gebruikte nog PostgreSQL `date` waarden via de standaard Node/Postgres date-conversie. Daardoor konden datumvelden als JavaScript `Date`/ISO timestamp door de API en frontend lopen. Een `date` zonder tijdzone moet in deze app als lokale kalenderdatum `YYYY-MM-DD` behandeld worden, niet als timestamp.

## Oplossing

- Artist list/get/create/update retourneert `ar_artist_dateofbirth` en `ar_artist_passing` nu als `date::text`.
- Artist create/update cast input expliciet met `$2::date` en `$3::date`.
- De controller accepteert voor deze velden alleen lege waarden of `YYYY-MM-DD`.
- Het edit-formulier vult date inputs alleen met een echte `YYYY-MM-DD` waarde en snijdt geen willekeurige Date-string meer af.

## Migratie

Geen nieuwe migratie nodig.

## Test

```bash
mkdir -p logs && npm run test:art012e4fix5 2>&1 | tee "logs/test-art012e4fix5-$(date +%Y%m%d-%H%M%S).log"
```
