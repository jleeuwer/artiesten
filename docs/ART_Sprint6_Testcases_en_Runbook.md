# ART Sprint 6 — Testcases en runbook

Laatste bijgewerkt: 2026-05-18

Dit document beschrijft de beoogde testgevallen voor de latere implementatie van Sprint 6: artiestgewicht, favorieten en read-only relatie-inzicht.

## 1. Teststrategie

Sprint 6 raakt zowel API, SQL-aggregaties als UI-state. De teststrategie bestaat uit:

- contracttests op backend routes/controllers;
- querytests met representatieve testdata;
- componenttests voor sortering, filtering en geselecteerde artiest;
- regressietests op bestaande CRUD, trash, hard delete en embedded Shellstarter-contract;
- documentatie/packagingtests.

## 2. Testdata uitgangspunt

Gebruik minimaal deze testset:

```text
Artist A: 5 file_details, 2 hitlijsten, 3 spellingen, favoriet
Artist B: 0 file_details, 0 hitlijsten, 1 spelling, niet favoriet
Artist C: 2 file_details waarvan 1 fd_action = Delete, 1 hitlijst, 0 spellingen
Artist D: 5 file_details, 1 hitlijst, 0 spellingen, niet favoriet
```

Hiermee kunnen sortering, tellingen en filtering gecontroleerd worden.

## 3. Functionele testcases

### ART-S6-F001 — Artiestgewicht zichtbaar

**Gegeven** een artiest met gekoppelde `file_details` records.  
**Wanneer** de gebruiker het artiestenoverzicht opent.  
**Dan** toont de lijst het aantal unieke titels als gewicht; meerdere versies van dezelfde titel tellen één keer mee.

### ART-S6-F002 — Artiest zonder songs krijgt gewicht nul

**Gegeven** een artiest zonder gekoppelde `file_details`.  
**Wanneer** de lijst wordt geladen.  
**Dan** toont het systeem gewicht `0` en blijft de artiest zichtbaar.

### ART-S6-F003 — Sorteren op gewicht hoog-laag

**Gegeven** artiesten met verschillende gewichten.  
**Wanneer** de gebruiker sortering `gewicht hoog-laag` kiest.  
**Dan** staan artiesten met meeste gekoppelde songs bovenaan.

### ART-S6-F004 — Sorteren op artiestnaam

**Gegeven** meerdere artiesten.  
**Wanneer** de gebruiker sortering `artiestnaam A-Z` kiest.  
**Dan** wordt alfabetisch gesorteerd op canonical artiestnaam.

### ART-S6-F005 — Favoriet markeren

**Gegeven** een artiest die nog geen favoriet is.  
**Wanneer** de gebruiker op het ster-icoon klikt.  
**Dan** wordt de artiest favoriet en blijft de lijst consistent.

### ART-S6-F006 — Favoriet verwijderen

**Gegeven** een artiest die favoriet is.  
**Wanneer** de gebruiker opnieuw op het ster-icoon klikt.  
**Dan** wordt de favoriet-markering verwijderd.

### ART-S6-F007 — Filter alleen favorieten

**Gegeven** een mix van favoriete en niet-favoriete artiesten.  
**Wanneer** de gebruiker het favorietenfilter activeert.  
**Dan** toont de lijst alleen favoriete artiesten.

### ART-S6-F008 — Relatiepaneel toont file_details

**Gegeven** een geselecteerde artiest met gekoppelde `file_details`.  
**Wanneer** het relatiepaneel wordt geopend.  
**Dan** toont het file-details-paneel gekoppelde records read-only.

### ART-S6-F009 — Relatiepaneel toont artiestenspellingen

**Gegeven** een geselecteerde artiest met alternatieve spellingen.  
**Wanneer** het relatiepaneel wordt geopend.  
**Dan** toont het spellingenpaneel alle gekoppelde spellingen read-only.

### ART-S6-F010 — Relatiepaneel toont hitlijsten

**Gegeven** een geselecteerde artiest met songs in meerdere hitlijsten.  
**Wanneer** het relatiepaneel wordt geopend.  
**Dan** toont het hitlijstenpaneel de hitlijsten met aantallen.

### ART-S6-F011 — Relatiepaneel heeft lege status

**Gegeven** een artiest zonder gekoppelde relaties.  
**Wanneer** het relatiepaneel wordt geopend.  
**Dan** toont elk paneel een nette lege status zonder foutmelding.

### ART-S6-F012 — Geen editacties in read-only panelen

**Gegeven** het relatiepaneel.  
**Wanneer** de gebruiker file_details, spellingen of hitlijsten bekijkt.  
**Dan** zijn er geen edit/delete-knoppen in deze panelen.

## 4. Technische testcases

### ART-S6-T001 — Statistiekenquery telt niet dubbel

Controleer dat `file_details_count` en `spelling_count` niet vermenigvuldigd worden door joins tussen `file_details` en `artiesten_spelling`.

### ART-S6-T002 — Favoriet endpoint valideert boolean

`PATCH /api/artists/:id/favorite` accepteert alleen `true` of `false`.

### ART-S6-T003 — Favoriet endpoint geeft 404 bij onbekende artiest

Bij een niet-bestaande artist key geeft het endpoint een nette 404 response.

### ART-S6-T004 — Relations endpoint geeft vaste responsevorm

`GET /api/artists/:id/relations` geeft altijd terug:

```json
{
  "artist": {},
  "summary": {},
  "fileDetails": [],
  "spellings": [],
  "hitlijsten": []
}
```

### ART-S6-T005 — Sort parameter allowlist

De backend accepteert alleen bekende sortwaarden zoals:

```text
name_asc
name_desc
weight_desc
weight_asc
favorite_weight_name
```

Onbekende waarden vallen terug op default of geven een nette validatiefout.

### ART-S6-T006 — Release-ZIP blijft schoon

De bestaande packagingregels uit Sprint 5 blijven gelden.

## 5. Regressietests

Na implementatie moeten minimaal blijven slagen:

```bash
npm run test:unit
npm run test:sprint4
npm run test:packaging
npm run test:sprint6
```

Volledige validatie na dependency-installatie:

```bash
npm run install:all
npm run test:all
```

## 6. Handmatige acceptatietest

1. Start database en backend.
2. Open Artiesten-app standalone.
3. Controleer dat lijst laadt.
4. Sorteer op gewicht.
5. Sorteer op artiestnaam.
6. Markeer artiest als favoriet.
7. Filter op favorieten.
8. Selecteer artiest met songs.
9. Controleer file_details-paneel.
10. Controleer spellingenpaneel.
11. Controleer hitlijstenpaneel.
12. Selecteer artiest zonder relaties en controleer lege status.
13. Open embedded via Shellstarter-context/query en controleer layout/theming.

## 7. Nog niet in Sprint 6 testen

Deze onderwerpen worden apart uitgewerkt en vallen niet onder de eerste Sprint 6 implementatietests:

- Discogs artist search;
- Discogs artist detail opslaan;
- albums toevoegen aan musicdb;
- muzikant/band-relatiedatamodel;
- artiesten merge daadwerkelijk uitvoeren;
- merge-history/audit.

## 8. Implementatie-runbook Sprint 6

### 8.1 Database-migratie uitvoeren

Voer vóór het starten van de app de Sprint 6 migratie uit op `musicdb`. De standaard ontwikkelconfiguratie gebruikt PostgreSQL in Docker; gebruik daarom bij voorkeur het meegeleverde script:

```bash
# standaard containernaam: my-postgresdb
npm run db:migrate:sprint6

# als jouw container anders heet
ARTIST_DB_CONTAINER=my-postgresdb npm run db:migrate:sprint6
```

Het script voert intern uit via `docker exec` en schrijft een timestamped logbestand naar `logs/`:

```bash
docker exec -i my-postgresdb psql -U postgres -d musicdb < scripts/sql/20260519_artists_sprint6_favorites.sql
```

Controle na migratie:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "select column_name, data_type, column_default from information_schema.columns where table_name = 'artist' and column_name = 'ar_is_favorite';"
```

Gebruik een lokaal `psql "$DATABASE_URL" ...` commando alleen wanneer je bewust lokaal psql gebruikt en de database direct vanaf de host bereikbaar is.

### 8.2 Backend/API controleren

Controleer na starten van de app:

```bash
curl "http://localhost:3012/api/artists?sort=favorite_first&favoriteOnly=false"
curl "http://localhost:3012/api/artists/1/relations"
```

Favoriet toggelen:

```bash
curl -X PATCH "http://localhost:3012/api/artists/1/favorite" \
  -H "Content-Type: application/json" \
  -d '{"favorite":true}'
```

### 8.3 Automatische tests

Uitgevoerd tijdens oplevering:

```bash
npm run test:sprint6
npm run test:sprint4
npm run test:unit
```

Volledige build/test na dependency-installatie:

```bash
npm run install:all
npm run test:all
```

## 9. Geautomatiseerde testdekking

Toegevoegd:

- `tests/sprint6Implementation.contract.test.mjs`

Deze test controleert dat:

- favorite en relationship endpoints bestaan;
- backend aggregaties voor gewicht, hitlijsten en spellingen aanwezig zijn;
- frontend filter/sort/relatiepaneel bevat;
- database-migratie `ar_is_favorite` veilig toevoegt.
