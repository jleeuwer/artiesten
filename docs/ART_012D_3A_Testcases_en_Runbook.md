# ART-012D-3A — Testcases en runbook

## Testdoel

Valideren dat de applicatie een canonical rename preview kan tonen zonder mutaties uit te voeren.

## Handmatige test

1. Start de Artiesten-app.
2. Selecteer een artiest met gekoppelde Discogs-referentie.
3. Open **Discogs naamvoorstellen**.
4. Klik bij een geschikt voorstel op **Preview canonical**.
5. Controleer dat een previewmelding verschijnt met:
   - huidige canonical naam;
   - voorgestelde canonical naam;
   - status;
   - conflicten of waarschuwingen;
   - melding dat er geen wijzigingen zijn uitgevoerd.
6. Controleer dat `artist.ar_artist_name` niet is gewijzigd.
7. Controleer dat `artiesten_spelling` niet is gewijzigd.

## Controlequeries

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select ar_artist_key, ar_artist_name
from artist
where ar_artist_key = <artist_key>;
"
```

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select as_alternatieve_spelling, as_artist_key
from artiesten_spelling
where as_artist_key = <artist_key>
order by as_alternatieve_spelling;
"
```

## Automatische tests

```bash
npm run test:art012d3a
npm run test:art012d
npm run test:art012
```

## Acceptatiecriteria

- Endpoint `POST /api/artists/:id/discogs/spelling-proposals/canonical-preview` bestaat.
- Backendfunctie `getDiscogsCanonicalRenamePreview` bestaat.
- UI toont knop **Preview canonical**.
- Preview-respons bevat `preview_only: true` en `no_mutations: true`.
- Documentatie benoemt dat `artist` en `artiesten_spelling` niet worden gewijzigd.
- Geen nieuwe SQL-migratie nodig.


## ART-012D-3A-Fix-1 — UX-testflow

Te testen flow:

```text
Zoek in Discogs → Detail bekijken → Koppel Discogs artist → Toon spellingvoorstellen → Voeg toe als spelling → Preview canonical
```

Verwacht gedrag:

- Zonder gekoppelde Discogs-referentie toont de UI dat eerst gekoppeld moet worden.
- Na koppeling wordt duidelijk dat spellingvoorstellen de volgende stap zijn.
- **Voeg toe als spelling** is zichtbaar bij beschikbare voorstellen.
- **Preview canonical** is zichtbaar bij geschikte canonical rename-voorstellen.
- Preview canonical voert geen mutaties uit.
