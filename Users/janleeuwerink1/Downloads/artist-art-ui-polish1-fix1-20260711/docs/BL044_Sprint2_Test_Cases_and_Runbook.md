# BL-044 Sprint 2 — Test cases and runbook

## Testgevallen
- queryparameter `shellTheme` wint van stored contract
- stored contract wint van env default als query ontbreekt
- shell mode kan via `.env` aan of uit
- veilige default contractopbouw bij ongeldige storage payload
- root-level clustered macOS bash scripts starten tests automatisch

## Scripts
- `scripts/test-client-shell.sh`
- `scripts/test-client-artiesten.sh`
- `scripts/test-all-unit.sh`
- `scripts/test-all.sh`

## Package scripts
- `npm run test:client:shell`
- `npm run test:client:theme-contract`
- `npm run test:unit`
- `npm run test:all`

## Handmatige controle
1. Start de app normaal en controleer standalone mode.
2. Open de app met `?shellTheme=rose-dark` en controleer dat de roze shell style actief is.
3. Controleer met `?shellTheme=rainbow-accent` dat een andere style actief wordt.
4. Controleer dat de app bruikbaar blijft in beide modi.


## Installatie opmerking
Voordat `npm run test:all` succesvol kan bouwen, moeten zowel de root dependencies als de client dependencies geïnstalleerd zijn. Gebruik daarvoor:

```bash
npm run install:all
```

Daarna kunnen de tests en build automatisch via:

```bash
npm run test:all
```
