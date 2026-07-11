# ART-013A-1 — Testcases en runbook

## Installatie / migratie

Voer eerst de migratie uit. Deze maakt `mu_musician_dateofbirth` nullable en voegt een unieke index toe op gekoppelde musicians.

```bash
mkdir -p logs && npm run db:migrate:art013a1 2>&1 | tee "logs/db-migrate-art013a1-$(date +%Y%m%d-%H%M%S).log"
```

## Preview draaien

```bash
mkdir -p logs && npm run musician:backfill:preview 2>&1 | tee "logs/musician-backfill-preview-$(date +%Y%m%d-%H%M%S).log"
```

Verwacht:

- aantal `person` artists;
- aantal `person` artists met musician;
- aantal `person` artists zonder musician;
- lijst van kandidaten die bij execute worden toegevoegd.

## Backfill uitvoeren

```bash
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-$(date +%Y%m%d-%H%M%S).log"
```

Verwacht:

- alleen ontbrekende musicians worden toegevoegd;
- bestaande musicians worden niet overschreven;
- tweede run voegt niets extra toe.

## Automatische tests

```bash
mkdir -p logs && npm run test:art013a1 2>&1 | tee "logs/test-art013a1-$(date +%Y%m%d-%H%M%S).log"
```

Brede ART-013A regressie inclusief ART-013A-1:

```bash
mkdir -p logs && npm run test:art013a 2>&1 | tee "logs/test-art013a-$(date +%Y%m%d-%H%M%S).log"
```

## Handmatige SQL-controles

Aantal ontbrekende musicians voor person-artists:

```sql
select
  count(*) as missing_person_musicians
from artist a
where coalesce(a.ar_artist_type, 'unknown') = 'person'
  and not exists (
    select 1
    from musician m
    where m.ar_artist_key = a.ar_artist_key
  );
```

Controle van gekoppelde musicians:

```sql
select
  a.ar_artist_key,
  a.ar_artist_name,
  m.mu_musician_key,
  m.mu_musician_name,
  m.mu_musician_dateofbirth,
  m.mu_musician_passing
from artist a
join musician m
  on m.ar_artist_key = a.ar_artist_key
where coalesce(a.ar_artist_type, 'unknown') = 'person'
order by a.ar_artist_name;
```

## Functionele testcases

| Test | Verwachting |
|---|---|
| Preview op lege musician-tabel | alle person-artists zonder musician worden als kandidaat getoond |
| Execute na preview | kandidaten worden als musician toegevoegd |
| Execute tweede keer | geen dubbele musicians |
| Artist type `band` | wordt niet toegevoegd als musician |
| Artist type `unknown` | wordt niet toegevoegd als musician |
| Person-artist zonder geboortedatum | wordt toegevoegd met `NULL` geboortedatum |
| Bestaande musician met dezelfde `ar_artist_key` | wordt niet overschreven |
| Na backfill artist-update uitvoeren | ART-013A-trigger werkt en musician wordt bijgewerkt |

## Ontwerpgrenzen

ART-013A-1 is een onderhoudsactie. Het vervangt niet de ART-013A-trigger en verandert de syncregels niet:

- geen bidirectionele sync;
- geen automatische musician-aanmaak via trigger;
- geen delete-sync;
- geen merge-sync;
- geen relatie-aanmaak in `musician_in_band`.


Ontwerpnotitie: geen automatische aanmaak via trigger; de backfill is een expliciete onderhoudsactie.


Het backfill-script is idempotent: opnieuw uitvoeren maakt geen dubbele musicians aan.
