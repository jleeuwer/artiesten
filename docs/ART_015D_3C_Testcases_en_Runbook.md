# ART-015D-3C — Testcases en runbook

## Testcases

1. **Env configuratie**
   - `.env.example` bevat `ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14`.
   - `.env.example` bevat `ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true`.
   - `.env.example` bevat `ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1`.

2. **Scanner alert verrijking**
   - `artist_duplicate_scanner.py` bevat `fetch_stale_review_stats`.
   - `build_alert` verwerkt `open_count`, `stale_count`, `oldest_open_days` en `stale_threshold_days`.
   - Scanner-alert body noemt open reviewqueue en stale candidates.

3. **Reviewqueue API**
   - `listDuplicateReviewCandidates` retourneert `is_stale_review_candidate`, `review_age_days` en `stale_review_days`.

4. **Reviewqueue UI**
   - Stale candidates krijgen badge **Te lang open**.
   - UI toont waarschuwing wanneer stale candidates in de geladen pagina zitten.

## Handmatige test

1. Zet tijdelijk een lage drempel in `.env`:

```env
ARTIST_DUPLICATE_STALE_REVIEW_DAYS=1
ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true
ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1
```

2. Maak een candidate kunstmatig ouder, bijvoorbeeld in pgAdmin of psql:

```sql
update artist_duplicate_candidates
set first_seen_at = now() - interval '10 days'
where status in ('new', 'reviewing', 'merge_planned', 'error')
  and candidate_id = (
    select candidate_id
    from artist_duplicate_candidates
    where status in ('new', 'reviewing', 'merge_planned', 'error')
    order by candidate_id desc
    limit 1
  );
```

3. Start de app en open **Duplicate reviewqueue**.

4. Controleer:
   - badge **Te lang open** is zichtbaar;
   - melding bovenaan de reviewqueue is zichtbaar;
   - het aantal dagen open wordt getoond.

5. Draai de scanner:

```bash
npm run scan:duplicates
```

6. Controleer dat de Shellstarter-alerttekst de open/stale reviewqueue-statistieken bevat.

## Automatische test

```bash
npm run test:art015d3c
npm run test:art015d
```
