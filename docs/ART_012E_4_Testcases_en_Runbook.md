# ART-012E-4 — Testcases en runbook

## Installatie/migratie

```bash
mkdir -p logs && npm run install:all 2>&1 | tee "logs/install-all-art012e4-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run db:migrate:art012e4 2>&1 | tee "logs/db-migrate-art012e4-$(date +%Y%m%d-%H%M%S).log"
```

## Geautomatiseerde tests

```bash
mkdir -p logs && npm run test:art012e4 2>&1 | tee "logs/test-art012e4-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012e4-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run build 2>&1 | tee "logs/build-art012e4-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run dev 2>&1 | tee "logs/dev-art012e4-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele testcases

1. Open een artiest met Discogs-koppeling.
2. Klik op **Toon voorstellen** of **Genereer voorstellen**.
3. Klik **Toepassen** bij een voorstel zonder conflict.
4. Controleer dat de lokale waarde is aangepast en de proposal-status `applied` wordt.
5. Klik **Later** bij een voorstel en controleer status `review_later`.
6. Klik **Negeer** bij een voorstel en controleer status `ignored`.
7. Test een conflictvoorstel en controleer dat overschrijven bevestiging vraagt.
8. Controleer dat onvolledige datums niet toepasbaar zijn.
9. Controleer dat Discogs-profieltekst wordt opgeslagen in `artist_external_profile` en niet in `artist.ar_artist_notes`.


## ART-012E-4-Fix-1 — Apply refresh artist-state

Na het toepassen van een verrijkingsvoorstel gebruikt de frontend de actuele `artist` uit de apply-response om de artiestentabel, geselecteerde artiest, relatie-inzicht en eventueel geopende detailcontext direct bij te werken. Voor `artist_external_profile.profile_text` wordt expliciet gemeld dat dit externe profieldata is en dat de lokale `artist`-tabel daarbij niet wijzigt.

## ART-012E-4-Fix-2 aanvullende test

Controleer specifiek datumvoorstellen:

1. Genereer of toon Discogs verrijkingsvoorstellen bij een gekoppelde artiest.
2. Kies een exacte datumwaarde in formaat `YYYY-MM-DD`, bijvoorbeeld `2016-01-10`.
3. Klik **Toepassen**.
4. Controleer in de UI en eventueel via database-query dat `artist.ar_artist_dateofbirth` of `artist.ar_artist_passing` werkelijk is bijgewerkt.

Voorbeeld query:

```sql
select ar_artist_key, ar_artist_name, ar_artist_dateofbirth, ar_artist_passing
from artist
where ar_artist_key = <artist_key>;
```
