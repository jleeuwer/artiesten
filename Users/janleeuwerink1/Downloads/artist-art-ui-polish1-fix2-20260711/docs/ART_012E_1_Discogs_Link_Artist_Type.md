# ART-012E-1 — Discogs gekoppeld-indicatie en artist type

## Doel

Deze kleine sprint legt de veilige basis voor latere Discogs-verrijking zonder al enrichment proposals of apply-acties te bouwen.

De gebruiker krijgt nu direct functionele feedback in de artiestenlijst:

```html
<i class="bi bi-link"></i>
```

Dit icoon betekent: **Discogs gekoppeld**.

Daarnaast krijgt de lokale artiest een nieuw veld **artist type**, zodat latere verrijking beter kan onderscheiden tussen persoon, duo, trio, groep, band, alias en project.

## Functionele scope

In scope:

- Discogs gekoppeld-indicatie in de artiestentabel.
- Tooltip met Discogs gekoppeld-informatie.
- Artist type tonen in de artiestentabel.
- Artist type bewerkbaar maken in het edit-scherm.
- Artist type zichtbaar maken in het relatiepaneel.

Niet in scope:

- Discogs enrichment proposals.
- Geboorte-/sterfdatum-extractie uit profieltekst.
- Profielfoto kiezen uit Discogs images.
- Apply-acties op lokale artistvelden.
- Aliases/name variations reviewqueue.

## Artist type waarden

De toegestane waarden zijn:

- `unknown`
- `person`
- `duo`
- `trio`
- `group`
- `band`
- `alias`
- `project`

Belangrijke ontwerpkeuze: **band is niet aantal-gebaseerd**. Een duo of trio kan functioneel ook als band bekendstaan, maar voor lokale classificatie kunnen `duo` en `trio` apart worden vastgelegd wanneer dat nuttig is.

## Technisch ontwerp

### Database

Nieuwe migratie:

```text
scripts/sql/20260608_art012e1_discogs_link_artist_type.sql
```

Deze voegt toe:

```sql
ALTER TABLE public.artist
  ADD COLUMN IF NOT EXISTS ar_artist_type TEXT NOT NULL DEFAULT 'unknown';
```

Met constraint voor de toegestane waarden en index:

```sql
CREATE INDEX IF NOT EXISTS idx_artist_ar_artist_type
  ON public.artist (ar_artist_type);
```

Docker-proof migratiescript:

```bash
npm run db:migrate:art012e1
```

### Backend

`models/artist.js` exposeert:

- `ar_artist_type`
- `has_discogs_link`
- `discogs_external_id`
- `discogs_external_name`
- `discogs_external_url`
- `discogs_synced_at`

De Discogs indicator gebruikt `artist_external_reference`:

```sql
lower(aer.source) = 'discogs'
and aer.status = 'linked'
```

### Frontend

In `ArtistPageContent.jsx` is een `DiscogsLinkedIcon` toegevoegd.

De artiestenlijst toont bij gekoppelde Discogs-artiesten:

```html
<i class="bi bi-link"></i>
```

In `ArtistFormModal.jsx` is `ar_artist_type` toegevoegd als `Form.Select`.

## Vervolg

Logische vervolgstap:

- ART-012E-2 — Profielfoto kiezen uit Discogs images.
- ART-012E-3 — Discogs enrichment proposals read-only preview.
- ART-012E-4 — Apply-acties voor goedgekeurde verrijkingsvoorstellen.


## ART-012E-1-Fix-2 — Discogs link-icoon direct zichtbaar na koppelen

Na succesvolle Discogs-koppeling houdt de frontend de gekoppelde artist key optimistisch bij, zodat `<i class="bi bi-link"></i>` direct in de artiestentabel verschijnt zonder handmatige browserrefresh. De serverrefresh blijft behouden; na browserrefresh blijft de databasekoppeling leidend.
