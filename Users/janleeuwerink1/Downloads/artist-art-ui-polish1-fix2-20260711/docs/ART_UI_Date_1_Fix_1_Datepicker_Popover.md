# ART-UI-Date-1-Fix-1 — Datepicker popover

## Doel

De datumvelden in het artist edit-scherm moeten zowel handmatige Nederlandse invoer (`dd-mm-jjjj`) als datepicker-ondersteuning bieden.

## Functionele regels

- Zichtbare invoer blijft `dd-mm-jjjj`.
- De kalenderknop opent een in-app datepicker popover.
- De datepicker bevat dag, maand en jaar.
- De gebruiker bevestigt met **Gebruik datum**.
- **Wissen** maakt het veld leeg.
- Opslag/API blijven `YYYY-MM-DD`.
- Tabel/details blijven `dd-mm-jjjj` tonen.

## Technische keuze

De eerdere oplossing leunde op een transparante native `input type="date"` overlay. Dat bleek niet betrouwbaar genoeg. De nieuwe oplossing gebruikt een expliciete React-popover, zodat de klik op de kalenderknop in alle ondersteunde browsers functioneel is.
