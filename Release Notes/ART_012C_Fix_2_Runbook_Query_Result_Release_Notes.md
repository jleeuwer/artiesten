# Release Notes — ART-012C-Fix-2 Runbook querycorrectie en koppelresultaat

## Type
Documentatie/testfix.

## Wijzigingen

- Runbookqueries voor ART-012C gecorrigeerd.
- `artist_enrichment_cache` gebruikt `fetched_at`, niet `synced_at`.
- Verschil verduidelijkt tussen:
  - `artist_external_reference.synced_at`;
  - `artist_enrichment_cache.fetched_at`;
  - `artist_external_image.created_at`.
- Koppelresultaat verduidelijkt: na **Koppel Discogs artist** worden `artist_external_reference`, `artist_enrichment_cache` en `artist_external_image` gevuld of bijgewerkt.
- Vastgelegd dat de lokale artistnaam niet automatisch wordt overschreven en dat `artist.ar_artist_key` leidend blijft.

## Migratie

Geen nieuwe SQL-migratie nodig bovenop ART-012B.

## Validatie

Gebruik:

```bash
npm run test:art012c:fix2
npm run test:art012c
npm run test:art012
```
