# ART-013A — Testcases en runbook

## Migratie uitvoeren

```bash
mkdir -p logs && npm run db:migrate:art013a 2>&1 | tee "logs/db-migrate-art013a-$(date +%Y%m%d-%H%M%S).log"
```

## Contracttest uitvoeren

```bash
mkdir -p logs && npm run test:art013a 2>&1 | tee "logs/test-art013a-$(date +%Y%m%d-%H%M%S).log"
```

## Regressietests uitvoeren

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art013a-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:packaging 2>&1 | tee "logs/test-packaging-art013a-$(date +%Y%m%d-%H%M%S).log"
```

## Functionele testcases

### TC-013A-001 — Person artist update synchroniseert musician

Voorwaarde:

- `artist.ar_artist_type = 'person'`;
- er bestaat een `musician` met dezelfde `ar_artist_key`.

Actie:

- wijzig naam, geboortedatum, sterfdatum of website van de artist.

Verwachting:

- gekoppelde musician krijgt dezelfde naam, sterfdatum en website;
- geboortedatum wordt overgenomen als de artistwaarde gevuld is.

### TC-013A-002 — Band/group update synchroniseert niet

Voorwaarde:

- `artist.ar_artist_type` is bijvoorbeeld `band`, `group`, `duo`, `trio`, `project`, `alias` of `unknown`.

Actie:

- wijzig artistgegevens.

Verwachting:

- geen musician-record wordt bijgewerkt.

### TC-013A-003 — Artist zonder gekoppelde musician geeft geen fout

Voorwaarde:

- er bestaat geen `musician` met `musician.ar_artist_key = artist.ar_artist_key`.

Actie:

- wijzig een person artist.

Verwachting:

- artist-update lukt;
- er wordt geen musician aangemaakt.

### TC-013A-004 — Delete/merge/deactivate raakt musician niet

Actie:

- artist verwijderen, deactiveren of mergen.

Verwachting:

- de gekoppelde musician blijft bestaan;
- bandrelaties via `musician_in_band` blijven intact.

### TC-013A-005 — Notes worden niet gesynchroniseerd

Actie:

- wijzig `artist.ar_artist_notes`.

Verwachting:

- `musician.mu_musician_notes` blijft ongewijzigd.

## Handmatige SQL-controle

Voor een gekoppelde persoonsartiest:

```sql
select
  a.ar_artist_key,
  a.ar_artist_name,
  a.ar_artist_dateofbirth,
  a.ar_artist_passing,
  a.ar_website_url,
  m.mu_musician_key,
  m.mu_musician_name,
  m.mu_musician_dateofbirth,
  m.mu_musician_passing,
  m.mu_website_url
from artist a
join musician m
  on m.ar_artist_key = a.ar_artist_key
where a.ar_artist_key = <artist_key>;
```


ART-013A ontwerpnotitie: er is geen automatische aanmaak van musician-records.


ART-013A richting: artist -> musician.


ART-013A sync is one-way en niet bidirectioneel.
