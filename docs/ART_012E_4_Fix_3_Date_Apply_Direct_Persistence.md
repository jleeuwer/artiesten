# ART-012E-4-Fix-3 — Date apply direct persistence

Deze fix zorgt dat toegepaste Discogs-verrijkingsvoorstellen voor geboorte- en sterfdatum daadwerkelijk persistent worden opgeslagen in de lokale `artist`-tabel.

## Aangepaste apply-regel

Voor datumvelden wordt niet langer via een conditionele `CASE`-update gewerkt. De flow leest en lockt eerst de actuele artist row, controleert of overschrijven nodig is, en voert daarna een directe update uit:

- `ar_artist_dateofbirth`
- `ar_artist_passing`

Bestaande afwijkende waarden blijven beschermd: overschrijven kan alleen na expliciete bevestiging.

## Test

```bash
mkdir -p logs && npm run test:art012e4fix3 2>&1 | tee "logs/test-art012e4fix3-$(date +%Y%m%d-%H%M%S).log"
```
