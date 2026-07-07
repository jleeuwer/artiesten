# ART-012C-Fix-2 — Runbook querycorrectie en koppelresultaat verduidelijking

## Aanleiding

Tijdens het controleren van een Discogs-koppeling werd duidelijk dat de cachetabel niet hetzelfde tijdveld gebruikt als de externe referentietabel. De tabel `artist_enrichment_cache` bevat geen kolom `synced_at`. Voor cachedata is het juiste veld `fetched_at`.

## Correct onderscheid tussen de tijdvelden

| Tabel | Tijdveld | Betekenis |
|---|---|---|
| `artist_external_reference` | `synced_at` | Moment waarop de externe Discogs-referentie is gekoppeld/gesynchroniseerd. |
| `artist_enrichment_cache` | `fetched_at` | Moment waarop Discogs-brondata is opgehaald en in de cache is opgeslagen. |
| `artist_external_image` | `created_at` / `updated_at` | Moment waarop image-metadata is vastgelegd of bijgewerkt. |

## Wat doet **Koppel Discogs artist**?

Na een succesvolle koppeling worden drie ART-012-tabellen gevuld of bijgewerkt:

1. `artist_external_reference` — de koppeling tussen lokale `artist.ar_artist_key` en Discogs artist ID/URL.
2. `artist_enrichment_cache` — ruwe en genormaliseerde Discogs-brondata met `fetched_at`.
3. `artist_external_image` — image metadata/URL's met `cache_status = remote_only`; geen binaire afbeeldingen in PostgreSQL.

De lokale `artist.ar_artist_key` blijft altijd leidend. De lokale artistnaam wordt niet automatisch overschreven.

Geboorte- en overlijdensdatum worden alleen gevuld wanneer Discogs gestructureerde datumvelden levert en de lokale velden nog leeg zijn.

## Correcte controlequeries

### Externe referentie

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  reference_id,
  artist_key,
  source,
  external_id,
  external_name,
  external_url,
  status,
  synced_at,
  updated_at
from artist_external_reference
where lower(source) = 'discogs'
order by updated_at desc
limit 10;
"
```

### Enrichment cache

Let op: gebruik hier `fetched_at`, niet `synced_at`.

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  cache_id,
  artist_key,
  source,
  external_id,
  cache_status,
  fetched_at,
  expires_at
from artist_enrichment_cache
where lower(source) = 'discogs'
order by fetched_at desc
limit 10;
"
```

### Image metadata

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "
select
  image_id,
  artist_key,
  source,
  image_type,
  external_image_url,
  cache_status,
  local_cache_path,
  created_at
from artist_external_image
where lower(source) = 'discogs'
order by created_at desc
limit 10;
"
```

## Technische impact

Er is geen nieuwe SQL-migratie nodig. Deze fix corrigeert documentatie, runbookverwachtingen en testdekking.
