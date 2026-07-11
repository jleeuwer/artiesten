# BL-044 Sprint 2 — Artiesten shell-contained implementation

## Doel
Maak Artiesten geschikt voor shell-contained rendering binnen shellstarter, met behoud van standalone mode.

## Gerealiseerd
- nieuwe `client/src/shellIntegration.js`
- `.env`-gestuurde shell mode ondersteuning
- actieve shell theme uit query/localStorage contract met fallback uit `.env`
- `App.jsx` accepteert nu shell context
- Artiesten rendert nu met shell-contained of standalone wrappergedrag
- theming continuity via `data-theme` en app-level CSS tokens
- macOS bash test scripts toegevoegd

## Belangrijk
Artiesten had al nauwelijks een eigen Holy Grail layout. Sprint 2 focust daarom op formele shell-contained mode, theme continuity en een herhaalbaar integratiepatroon.
