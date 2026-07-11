# ART-012D-2 — Discogs naam toevoegen als alternatieve spelling

## Doel

ART-012D-2 maakt de eerste gecontroleerde mutatie vanuit Discogs-naamvoorstellen mogelijk: een beschikbare Discogs-naam, real name, alias of name variation kan worden toegevoegd aan `artiesten_spelling` als alternatieve spelling voor de lokale artiest.

De lokale canonical artist name blijft ongewijzigd. `artist.ar_artist_name` wordt nooit automatisch overschreven door Discogs-data.

## Functionele flow

1. Gebruiker koppelt eerst een Discogs artist aan de lokale artist via ART-012C.
2. Gebruiker opent **Discogs naamvoorstellen**.
3. Het systeem toont voorstellen uit:
   - Discogs artist name;
   - real name;
   - aliases;
   - name variations.
4. Alleen voorstellen met `canAddAlternativeSpelling = true` krijgen de actie **Voeg toe als spelling**.
5. Bij klikken op **Voeg toe als spelling**:
   - het systeem controleert opnieuw server-side of de spelling beschikbaar is;
   - conflicten met `artiesten_spelling.as_alternatieve_spelling` worden geblokkeerd;
   - de spelling wordt transactioneel toegevoegd aan `artiesten_spelling`;
   - de canonical artist name blijft ongewijzigd.
6. De UI laadt de spellingvoorstellen en relatiepanelen opnieuw, zodat de nieuwe spelling direct zichtbaar wordt.

## Niet in scope

ART-012D-2 doet nog niet:

- canonical rename;
- wijzigen van `artist.ar_artist_name`;
- automatisch toevoegen van alle aliases/name variations;
- persistent proposals/reviewqueue;
- wijzigen van bestaande spellingen;
- automatische merge.

Canonical rename komt later in ART-012D-3 en moet spelling-aware, transactioneel en auditbaar zijn.

## Technisch ontwerp

### Endpoint

```http
POST /api/artists/:id/discogs/spelling-proposals/alternative
```

Request body:

```json
{
  "proposedName": "Daryl Hall & John Oates"
}
```

Response bij succes:

```json
{
  "added": true,
  "artist": {
    "ar_artist_key": 1483,
    "ar_artist_name": "Hall & Oates"
  },
  "spelling": {
    "as_alternatieve_spelling": "Daryl Hall & John Oates",
    "as_artist_key": 1483
  },
  "note": "Discogs-naam is toegevoegd als alternatieve spelling. De lokale canonical artist name is niet gewijzigd."
}
```

### Backend service

Nieuwe functie:

```js
Artist.addDiscogsAlternativeSpelling({ artistKey, proposedName, performedBy })
```

Belangrijkste controles:

- `artistKey` moet bestaan;
- `proposedName` moet gevuld zijn;
- voorstel mag niet gelijk zijn aan de canonical artist name;
- voorstel mag nog niet bestaan als spelling voor dezelfde artist;
- voorstel mag niet gekoppeld zijn aan een andere artist;
- insert gebeurt binnen één transactie;
- optionele auditlogging gebruikt een savepoint zodat ontbrekende/incompatibele auditlogging de hoofdactie niet breekt.

### SQL-mutatie

```sql
INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
VALUES ($1::public.citext, $2::integer)
RETURNING as_alternatieve_spelling, as_artist_key;
```

## Conflictafhandeling

| Situatie | Gedrag |
|---|---|
| Voorstel is al canonical artist name | 409 `ALREADY_CANONICAL` |
| Voorstel bestaat al als spelling voor dezelfde artist | 409 `ALREADY_ALTERNATIVE_SPELLING` |
| Voorstel is gekoppeld aan andere artist | 409 `SPELLING_CONFLICT_OTHER_ARTIST` |
| Unique constraint faalt alsnog | 409 `SPELLING_UNIQUE_CONFLICT` |

## UI

In de tabel **Discogs naamvoorstellen** wordt een extra kolom **Actie** toegevoegd.

Voor voorstellen met `canAddAlternativeSpelling=true` toont de UI:

```text
Voeg toe als spelling
```

Voor bestaande of conflicterende voorstellen toont de UI:

```text
Niet toepasbaar
```

Na succesvolle toevoeging toont de UI:

```text
Alternatieve spelling opgeslagen: <naam>. De lokale canonical artist name is niet gewijzigd.
```

## Acceptatiecriteria

- Beschikbaar Discogs-voorstel kan als alternatieve spelling worden toegevoegd.
- `artist.ar_artist_name` blijft ongewijzigd.
- `artiesten_spelling` bevat de nieuwe spelling na succes.
- Conflicten met andere artists worden geblokkeerd.
- Bestaande spellingen worden niet dubbel toegevoegd.
- UI toont succes/foutmelding en laadt voorstellen opnieuw.


## ART-012D-2-Fix-1 — Actieknop voor beschikbare spellingvoorstellen

Bij Discogs naamvoorstellen moet de actie **Voeg toe als spelling** zichtbaar zijn voor voorstellen met `available_discogs_name` en `available_alternative_spelling`. De knop schrijft alleen naar `artiesten_spelling`; `artist.ar_artist_name` blijft ongewijzigd. Niet-toepasbare voorstellen tonen een duidelijke niet-toepasbaar-status.
