# ART-012D-2 — Testcases en runbook

## Voorwaarden

- ART-012B migratie is uitgevoerd:

```bash
npm run db:migrate:art012b
```

- Discogs is lokaal geconfigureerd in `.env`.
- Er is minimaal één lokale artist gekoppeld aan een Discogs artist via ART-012C.

## Automatische tests

```bash
npm run test:art012d2
npm run test:art012d
npm run test:art012
```

## Functionele testcases

### TC-ART012D2-001 — Beschikbaar voorstel toevoegen

1. Open een lokale artist met gekoppelde Discogs-referentie.
2. Klik **Toon spellingvoorstellen**.
3. Kies een voorstel met status `available`.
4. Klik **Voeg toe als spelling**.

Verwacht:

- succesmelding verschijnt;
- `artist.ar_artist_name` blijft gelijk;
- nieuwe rij bestaat in `artiesten_spelling`.

Controlequery:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_artist_key, as_alternatieve_spelling
from artiesten_spelling
where as_artist_key = <artist_key>
order by as_alternatieve_spelling;
"
```

### TC-ART012D2-002 — Reeds bestaande spelling blokkeren

1. Voeg dezelfde spelling opnieuw toe.

Verwacht:

- API geeft 409;
- geen dubbele rij in `artiesten_spelling`.

### TC-ART012D2-003 — Conflict met andere artist blokkeren

1. Kies een voorstel dat volgens de UI conflicteert met een andere artist.
2. Probeer toe te voegen.

Verwacht:

- API geeft 409;
- response bevat `conflictingArtistKey` en `conflictingArtistName`;
- er wordt geen rij toegevoegd.

### TC-ART012D2-004 — Canonical naam niet wijzigen

Na toevoegen van een alternatieve spelling:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select ar_artist_key, ar_artist_name
from artist
where ar_artist_key = <artist_key>;
"
```

Verwacht:

- `ar_artist_name` is ongewijzigd.

## Niet testen in deze sprint

- canonical rename;
- bulk toevoegen van aliases;
- persistent spelling proposal reviewqueue.


## ART-012D-2-Fix-1 — Actieknop voor beschikbare spellingvoorstellen

Bij Discogs naamvoorstellen moet de actie **Voeg toe als spelling** zichtbaar zijn voor voorstellen met `available_discogs_name` en `available_alternative_spelling`. De knop schrijft alleen naar `artiesten_spelling`; `artist.ar_artist_name` blijft ongewijzigd. Niet-toepasbare voorstellen tonen een duidelijke niet-toepasbaar-status.
