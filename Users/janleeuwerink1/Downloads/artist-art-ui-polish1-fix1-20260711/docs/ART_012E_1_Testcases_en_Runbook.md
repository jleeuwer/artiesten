# ART-012E-1 — Testcases en runbook

## Migratie

Voer eerst de database-migratie uit:

```bash
npm run db:migrate:art012e1 2>&1 | tee "logs/art012e1-migrate-$(date +%Y%m%d-%H%M%S).log"
```

De migratie voegt `artist.ar_artist_type` toe met default `unknown`.

## Tests

Contracttest:

```bash
npm run test:art012e1 2>&1 | tee "logs/art012e1-test-$(date +%Y%m%d-%H%M%S).log"
```

Brede ART-012 regressietest:

```bash
npm run test:art012 2>&1 | tee "logs/art012-regression-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele testcases

### TC-ART012E1-001 — Discogs icoon zichtbaar bij gekoppelde artiest

Voorwaarde:

- er bestaat een rij in `artist_external_reference` met `source='discogs'` en `status='linked'`.

Verwachting:

- in de artiestenlijst staat bij deze artiest het icoon `<i class="bi bi-link"></i>`;
- tooltip vermeldt `Discogs gekoppeld` of `Discogs gekoppeld: <external_name>`.

### TC-ART012E1-002 — Geen Discogs icoon bij niet-gekoppelde artiest

Voorwaarde:

- artiest heeft geen actieve Discogs-koppeling.

Verwachting:

- Discogs kolom toont geen linkicoon.

### TC-ART012E1-003 — Artist type wijzigen

Stappen:

1. Open een artiest via **Edit**.
2. Kies artist type, bijvoorbeeld `duo` of `band`.
3. Sla op.
4. Open de artiest opnieuw.

Verwachting:

- gekozen artist type blijft bewaard;
- artiestenlijst en relatiepaneel tonen het gekozen type.

### TC-ART012E1-004 — Bestaande Discogs spelling/canonical flow blijft werken

Stappen:

1. Open een gekoppelde Discogs-artiest.
2. Gebruik **Toon spellingvoorstellen**.
3. Controleer dat **Voeg toe als spelling**, **Preview canonical** en eventueel **Maak canonical** blijven werken zoals in ART-012D.

Verwachting:

- ART-012E-1 heeft geen regressie op ART-012D.


## ART-012E-1-Fix-2 — Discogs link-icoon direct zichtbaar na koppelen

Na succesvolle Discogs-koppeling houdt de frontend de gekoppelde artist key optimistisch bij, zodat `<i class="bi bi-link"></i>` direct in de artiestentabel verschijnt zonder handmatige browserrefresh. De serverrefresh blijft behouden; na browserrefresh blijft de databasekoppeling leidend.
