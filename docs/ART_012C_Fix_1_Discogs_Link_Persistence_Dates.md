# ART-012C-Fix-1 — Discogs-koppeling opslaan en datums toepassen

## Aanleiding

Tijdens testen bleek dat na klikken op **Koppel Discogs artist** geen records zichtbaar werden in de verwachte ART-012-tabellen. Daarnaast is functioneel aangescherpt dat geboorte- en overlijdensdatum, wanneer Discogs die als gestructureerde datum levert, naar de lokale `artist` mogen worden overgenomen.

## Analyse

De knop **Koppel Discogs artist** is bedoeld om een externe Discogs-bron te bewaren. Na een succesvolle koppeling moeten minimaal deze tabellen gevuld zijn:

- `artist_external_reference` — de koppeling tussen lokale artist en Discogs artist ID/URL;
- `artist_enrichment_cache` — ruwe en genormaliseerde Discogs-brondata;
- `artist_external_image` — image metadata/URL's, geen binaire bestanden.

De lokale `artist.ar_artist_key` blijft leidend en wordt nooit vervangen door een Discogs ID.

## Technische oorzaak lege tabellen

De optionele audit-insert naar `admin_audit_log` kon op oudere/lokale schema's falen. Een PostgreSQL-fout binnen een transactie maakt de hele transactie abortive. Alleen de fout opvangen is dan niet genoeg: latere `COMMIT` faalt alsnog en alle eerder geschreven Discogs-tabellen worden teruggedraaid.

Daarom gebruikt de link-flow nu een **savepoint** rond de optionele auditstap:

1. schrijf `artist_external_reference`;
2. schrijf `artist_enrichment_cache`;
3. schrijf `artist_external_image`;
4. probeer `admin_audit_log` binnen savepoint;
5. als alleen audit ontbreekt/faalt door ontbrekende tabel/kolom: rollback naar savepoint, maar behoud de Discogs-koppeling;
6. commit de hoofdtransactie.

## Geboorte- en overlijdensdatum

De geboortedatum en overlijdensdatum worden alleen overgenomen wanneer Discogs deze als gestructureerde velden aanlevert.

Als de Discogs-detailresponse gestructureerde datumvelden bevat, worden deze genormaliseerd:

- `birth_date`, `date_of_birth`, `born` → `artist.ar_artist_dateofbirth`;
- `death_date`, `date_of_death`, `died`, `passing_date` → `artist.ar_artist_passing`.

Belangrijke regels:

- alleen ISO-achtige datumwaarden worden geaccepteerd (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`);
- onvolledige datums worden genormaliseerd naar de eerste dag (`YYYY-01-01`, `YYYY-MM-01`);
- lokale velden worden alleen gevuld als ze nog leeg zijn;
- bestaande lokale datumwaarden worden niet overschreven;
- datums worden bewust **niet uit vrije profieltekst** geparsed, omdat dat te foutgevoelig is.

## UI-gedrag

Na koppelen toont de UI:

- of de externe Discogs-referentie is opgeslagen;
- hoeveel image metadata-records zijn opgeslagen;
- of geboorte-/overlijdensdatum is overgenomen;
- of er geen gestructureerde datum beschikbaar was.

## Controlequeries

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select reference_id, artist_key, source, external_id, external_name, status, synced_at
from artist_external_reference
order by updated_at desc
limit 10;
"
```

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select cache_id, artist_key, source, external_id, cache_status, fetched_at
from artist_enrichment_cache
order by fetched_at desc
limit 10;
"
```

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select image_id, artist_key, source, external_image_url, cache_status, created_at
from artist_external_image
order by created_at desc
limit 10;
"
```
