# BL-044 Sprint 3 — Artiesten deliverables

## Doel van deze codebase in Sprint 3
De Artiesten-codebase moet een herbruikbare shell-hosted module leveren die binnen shellstarter kan worden gerenderd, naast behoud van standalone mode.

## Functionele deliverables
1. Pure contentcomponent voor Artiesten
2. Shell-hosted wrapper voor Artiesten
3. Standalone wrapper voor behoud van zelfstandige modus
4. Geen eigen platformchrome in shell-hosted mode
5. BL-043 theme continuity blijft actief

## Technische deliverables
- extractie van `ArtistPageContent`
- `ArtistShellModule` voor rendering binnen shellstarter
- `ArtistStandaloneApp` voor bestaande zelfstandige modus
- vereenvoudigde `App.jsx` als orchestrator
- testdekking voor shell-hosted vs standalone rendering
- macOS bash scripts per testcluster

## Verwachte hoofdwijzigingen
### Client
- `client/src/App.jsx`
- nieuw `client/src/components/ArtistPageContent.jsx`
- nieuw `client/src/ArtistShellModule.jsx`
- nieuw `client/src/ArtistStandaloneApp.jsx`
- eventueel uitbreiding `client/src/shellIntegration.js`

### Tests
- tests voor shell mode renderen
- tests voor content-only module gebruik
- tests voor standalone backward compatibility

### Scripts
- `scripts/test-client-artiesten.sh`
- `scripts/test-artist-shell-mode.sh`
- opname in `scripts/test-all.sh`

## Acceptatiecriteria
- dezelfde businesscontent kan shell-hosted en standalone draaien
- shell-hosted mode rendert zonder extra app-shell chrome
- standalone mode blijft bruikbaar
- theming continuity blijft intact
