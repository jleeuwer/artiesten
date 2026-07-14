# ART-012D-1 — Discogs spellingvoorstellen ophalen en tonen

## Doel

ART-012D-1 maakt de eerste functionele stap na het koppelen van een Discogs artist: de app kan uit de opgeslagen Discogs-brondata naamvoorstellen afleiden en read-only tonen aan de gebruiker.

Deze sprint voert **geen database-mutaties** uit op `artist` of `artiesten_spelling`.

## Functioneel gedrag

Na **Koppel Discogs artist** kan de gebruiker bij een artiest kiezen voor **Toon spellingvoorstellen**. De app haalt voorstellen op uit de laatst gekoppelde Discogs-referentie en cachedata.

Bronnen voor voorstellen:

- Discogs artist name;
- real name;
- aliases;
- name variations.

Per voorstel toont de app:

- voorgestelde naam;
- bron, bijvoorbeeld `Discogs naam`, `Real name`, `Alias` of `Name variation`;
- status/action;
- toelichting;
- eventueel conflicterende artist key en naam.

## Statussen

De voorstellen worden alleen geclassificeerd:

| Status/action | Betekenis |
|---|---|
| `already_canonical` | De naam is gelijk aan `artist.ar_artist_name`. |
| `already_alternative_spelling` | De naam bestaat al in `artiesten_spelling` voor dezelfde artiest. |
| `available_discogs_name` | Discogs artist name is beschikbaar als voorstel. |
| `available_alternative_spelling` | Alias/variation/real name is beschikbaar als alternatief spellingvoorstel. |
| `conflict_other_artist` | De spelling bestaat al bij een andere artist key. |

## Belangrijke ontwerpregel

Discogs artist names blijven bronvoorstellen. De lokale canonical artist name wordt nooit direct overschreven.

Een latere canonical rename moet via een aparte spelling-aware transactie gebeuren waarbij:

- de oude canonical naam behouden blijft als alternatieve spelling;
- `artist.ar_artist_name` gecontroleerd wordt gewijzigd;
- de nieuwe canonical naam geborgd wordt in `artiesten_spelling`;
- conflicten op `artiesten_spelling.as_alternatieve_spelling` worden gecontroleerd;
- de gebruiker expliciet bevestigt;
- de wijziging auditbaar is.

## Technische implementatie

Nieuw endpoint:

```text
GET /api/artists/:id/discogs/spelling-proposals
```

Nieuwe backendfunctie:

```text
Artist.getDiscogsSpellingProposals(id)
```

De functie leest:

- `artist_external_reference` voor de laatst gekoppelde Discogs-bron;
- `artist_enrichment_cache.normalized_data_json` voor de Discogs detaildata;
- `artiesten_spelling` voor bestaande spellingen en conflicten.

Er wordt niets geschreven naar de database.

## UI

In de kaart **Discogs artist enrichment** verschijnt na een gekoppelde Discogs-referentie de sectie **Discogs naamvoorstellen** met knop **Toon spellingvoorstellen**.

De UI toont samenvattingchips:

- totaal;
- beschikbaar;
- bestaand;
- conflict.

## Niet in scope

Niet in scope voor ART-012D-1:

- Discogs naam toevoegen als alternatieve spelling;
- canonical artist name wijzigen;
- aliases/name variations persistent als reviewqueue bewaren;
- auditregels schrijven;
- automatische import of automatische correctie.

Die acties komen in ART-012D-2 en later.
