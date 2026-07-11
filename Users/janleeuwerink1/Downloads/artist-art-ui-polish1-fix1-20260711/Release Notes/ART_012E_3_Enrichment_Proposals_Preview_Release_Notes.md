# Release Notes — ART-012E-3 Enrichment proposals preview

## Samenvatting

ART-012E-3 voegt een read-only previewlaag toe voor Discogs-verrijkingsvoorstellen.

## Toegevoegd

- Nieuwe tabel `artist_enrichment_proposals`.
- Nieuwe migratie `20260608_art012e3_enrichment_proposals_preview.sql`.
- Nieuwe API-endpoints:
  - `GET /api/artists/:id/discogs/enrichment-proposals`
  - `POST /api/artists/:id/discogs/enrichment-proposals/generate`
- Extractie van kandidaat-geboorte-/sterfdatum uit Discogs-profieltekst.
- Heuristisch artist type voorstel.
- Read-only UI-sectie **Discogs verrijkingsvoorstellen**.

## Bewust buiten scope

- Geen apply-acties.
- Geen automatische wijziging van `artist`.
- Geen wijziging van `ar_artist_dateofbirth`, `ar_artist_passing`, `ar_website_url` of `ar_artist_type`.
- Geen ignore/review_later/statusbeheer via UI.

## Test

Gebruik:

```bash
mkdir -p logs && npm run test:art012e3 2>&1 | tee "logs/test-art012e3-$(date +%Y%m%d-%H%M%S).log"
```

## ART-012E-3-Fix-1 — Tabelbreedte bij lange Discogs links

- Lange URL's in verrijkingsvoorstellen worden niet meer volledig inline in de tabel uitgeschreven.
- URL-waarden tonen nu een compacte actie `Open link` met de ruwe URL afgekapt/ellipsis eronder.
- De verrijkingsvoorstellentabel gebruikt nu `table-layout: fixed` met vaste kolombreedtes en horizontaal scrollgedrag binnen de bestaande kaart.
- De fix voorkomt dat Discogs-links de hele relatie-inzicht layout breder maken.
