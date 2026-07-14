# ART-013A-3-Fix-1 — Root packaging en npm-scriptcontrole

## Probleem
De vorige ZIP bevatte een extra bovenliggende map `art013a3_impl/`. Bij het overzetten naar een bestaande checkout kon daardoor de oude root-`package.json` blijven staan, waardoor `npm run artist-musician:preflight` ontbrak.

## Oplossing
- applicatiebestanden staan direct in de ZIP-root;
- root-`package.json` bevat alle ART-013A-3 databasecommando's;
- `npm run verify:art013a3:install` controleert de installatie;
- contracttest bewaakt de scripts.
