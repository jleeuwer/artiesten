# ART-015D-2A-Fix-1 — Duplicate scanner psql stdin hardening

## Probleem

`npm run scan:duplicates` kon falen met:

```text
exec /usr/bin/psql: argument list too long
```

Dit gebeurde wanneer de scanner honderden duplicate candidates wilde wegschrijven en de gegenereerde SQL via `psql -c` als command argument werd meegegeven.

## Oplossing

De scanner geeft SQL nu via stdin aan `psql` door. De Docker/psql-route blijft hetzelfde, maar de command line blijft klein:

```text
docker exec -i <container> psql ...
```

## Validatie

- `python3 -m py_compile scripts/artist_duplicate_scanner.py`
- `npm run test:art015d2a:fix1`
- `npm run test:art015d2a`
- `npm run test:art015d`
- `npm run test:packaging`
