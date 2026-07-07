# ART-012E-3 — Discogs enrichment proposals read-only preview

## Doel

ART-012E-3 maakt zichtbaar welke verrijkingsgegevens uit een gekoppelde Discogs artist beschikbaar zijn, zonder deze waarden al toe te passen op lokale artist-velden.

Deze sprint is bewust read-only:

- geen automatische wijzigingen in `artist`;
- geen apply-acties;
- geen ignore/review-statusacties;
- geen mutatie van `ar_artist_dateofbirth`, `ar_artist_passing`, `ar_website_url` of `ar_artist_type`.

## Functionele scope

In het relatie-inzicht verschijnt de sectie **Discogs verrijkingsvoorstellen** voor artiesten met een gekoppelde Discogs entry.

De gebruiker kan:

1. voorstellen genereren uit de bestaande Discogs-cache;
2. bestaande voorstellen tonen;
3. per voorstel lokale waarde, voorgestelde waarde, status, confidence en context bekijken.

## Voorsteltypen

ART-012E-3 ondersteunt read-only voorstellen voor:

- geboortedatum (`ar_artist_dateofbirth`);
- sterfdatum (`ar_artist_passing`);
- externe profieltekst (`artist_external_profile.profile_text` later);
- artist type (`ar_artist_type`);
- primaire image-samenvatting (`artist_external_image.is_primary`).

## Profieltekst-extractie

Geboorte- en sterfdatum mogen uit Discogs-profieltekst worden gehaald, maar alleen als voorstel.

Volledige datums krijgen `extraction_confidence = high` en status `available`, `existing` of `conflict`.

Onvolledige datums, zoals alleen een jaar of maand+jaar, worden wel getoond maar krijgen status `not_applicable`, omdat de lokale velden `date` zijn en we geen kunstmatige datum zoals `1958-01-01` willen opslaan.

## Datamodel

Nieuwe tabel:

```sql
artist_enrichment_proposals
```

Belangrijke velden:

- `proposal_type`;
- `target_table`;
- `target_field`;
- `local_value`;
- `proposed_value`;
- `proposed_value_normalized`;
- `extraction_method`;
- `extraction_confidence`;
- `extraction_context`;
- `status`;
- `conflict_type`.

De unieke index `uq_artist_enrichment_proposals_dedupe` voorkomt dubbele voorstellen per artiest, bron, veld en voorgestelde waarde.

## API

```text
GET  /api/artists/:id/discogs/enrichment-proposals
POST /api/artists/:id/discogs/enrichment-proposals/generate
```

`POST .../generate` bouwt voorstellen opnieuw op vanuit de bestaande Discogs-cache/reference en past geen lokale artist-data aan.

## Buiten scope

De volgende onderdelen volgen later in ART-012E-4:

- voorstel toepassen;
- voorstel negeren;
- later beoordelen;
- conflict markeren;
- externe profieltekst definitief opslaan;
- website/datums/type toepassen na expliciete bevestiging.

## ART-012E-3-Fix-1 — URL-weergave in voorstelpreview

Lange Discogs- of website-URL's worden in de read-only voorstelpreview compact weergegeven. De gebruiker ziet een actie **Open link** en de ruwe URL blijft beschikbaar als afgekorte tekst met tooltip. Hierdoor blijft de tabel binnen de relatie-inzicht kaart leesbaar en trekt een lange link de layout niet meer breed.

## ART-012E-4-Fix-4 note

Datum-applicatie voor `ar_artist_dateofbirth` en `ar_artist_passing` moet persistentie controleren via PostgreSQL `date::text`. Hiermee vermijden we onbetrouwbare vergelijking via JavaScript `Date` objecten of driverconversie. Het functionele formaat blijft `YYYY-MM-DD`.
