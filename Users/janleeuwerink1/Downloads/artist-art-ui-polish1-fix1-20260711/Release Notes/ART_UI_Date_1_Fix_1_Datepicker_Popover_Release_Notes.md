# ART-UI-Date-1-Fix-1 — Datepicker popover voor Nederlandse datumvelden

Datum: 2026-06-09

## Aanleiding

In het artist edit-scherm was rechts van het Nederlandse datumveld een kalenderknop zichtbaar, maar klikken op deze knop opende geen datepicker.

## Oplossing

De onbetrouwbare transparante native date-input overlay is vervangen door een expliciete in-app datepicker popover.

De gebruiker kan nu:

- handmatig blijven typen in `dd-mm-jjjj`;
- op de kalenderknop klikken;
- dag, maand en jaar kiezen;
- de gekozen datum toepassen via **Gebruik datum**;
- de datum wissen via **Wissen**.

Opslag/API blijven `YYYY-MM-DD`. De zichtbare invoer en schermweergave blijven Nederlands.

## Geen migratie

Deze wijziging is alleen frontend/UI en vereist geen database-migratie.

## Test

```bash
mkdir -p logs && npm run test:artuidate1:fix1 2>&1 | tee "logs/test-artuidate1-fix1-$(date +%Y%m%d-%H%M%S).log"
```
