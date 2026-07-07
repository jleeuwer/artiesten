# BL-044 Sprint 3 — Artiesten implementatie

## Doel
De Artiesten-codebase voorbereiden op shell-hosted gebruik binnen shellstarter zonder standalone gedrag te verliezen.

## Gerealiseerd
- `client/src/components/ArtistPageContent.jsx`
- `client/src/ArtistShellModule.jsx`
- `client/src/ArtistStandaloneApp.jsx`
- Dunne `client/src/App.jsx` orchestrator
- Uitgebreide shell-integratiecontext in `client/src/shellIntegration.js`
- Embedded shell query support:
  - `shellTheme`
  - `shellEmbed=1`
  - `shellHost=shellstarter`
  - `shellOrigin=<origin>`
- Hoogte-synchronisatie terug naar shellstarter met `postMessage`
- Nieuwe Node-test: `tests/embeddedShellMode.test.mjs`
- Nieuw macOS bash script: `scripts/test-artist-shell-mode.sh`

## Resultaat
Artiesten kan nu zowel standalone als shell-hosted draaien. In shell-hosted mode stuurt de module zijn hoogte terug naar de host zodat de shellstarter-iframe mee kan groeien.
