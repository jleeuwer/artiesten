# BL-044 Sprint 4 — Artiesten hardening implementation

## Doel
Sprint 4 hardent de shell-hosted Artiesten-module als eerste referentie-implementatie binnen shellstarter.

## Doorgevoerde codewijzigingen

### Embedded shell bridge hardening
- `client/src/ArtistShellModule.jsx`
  - runtime shellcontext wordt nu lokaal beheerd zodat shell-updates tijdens runtime kunnen landen
  - height sync gebruikt nu naast `ResizeObserver` ook `MutationObserver` en `window.resize`
  - child app publiceert nu ook een `musicapp:embedded-ready` event
  - child app accepteert nu runtime theme-berichten van de shell

- `client/src/shellBridge.js`
  - centrale helpers voor origin-filtering en theme-message parsing
  - normalisatie van incoming shell theme contracten

### Layout hardening
- embedded mode gebruikt geen Bootstrap `Container` meer als outer wrapper
- embedded CSS is opgeschoond voor flush rendering zonder dubbele padding/gutters

### API hardening
- controller exports voor `get`, `create` en `update` zijn hersteld
- create/update payload-validatie toegevoegd

## Testuitbreiding
- `tests/artistController.contract.test.mjs`
- `tests/shellBridge.test.mjs`
- sprintscript `scripts/test-sprint4-hardening.sh`

## Resultaat
- embedded hosting is stabieler bij dynamische content
- runtime theme sync vanuit shellstarter is voorbereid en functioneel
- create/update regressies zijn afgedekt
