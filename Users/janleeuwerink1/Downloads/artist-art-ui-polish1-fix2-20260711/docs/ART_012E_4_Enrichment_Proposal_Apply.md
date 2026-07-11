# ART-012E-4 — Discogs verrijkingsvoorstellen toepassen

## Doel

ART-012E-4 maakt de read-only verrijkingsvoorstellen uit ART-012E-3 actiegericht. De gebruiker kan een voorstel nu expliciet toepassen, negeren of later beoordelen.

Belangrijk ontwerpprincipe: Discogs blijft brondata. Lokale artist-data wordt alleen aangepast na een expliciete gebruikersactie.

## Functioneel

De sectie **Discogs verrijkingsvoorstellen** toont per voorstel acties:

- **Toepassen**: past een veilig voorstel toe.
- **Overschrijf**: zichtbaar/bruikbaar bij conflict; vraagt om bevestiging voordat een bestaande lokale waarde wordt vervangen.
- **Later**: markeert het voorstel als `review_later`.
- **Negeer**: markeert het voorstel als `ignored`.

## Toepasbare velden in ART-012E-4

| Doelveld | Gedrag |
|---|---|
| `artist.ar_artist_dateofbirth` | Alleen volledige datums `YYYY-MM-DD` toepassen. |
| `artist.ar_artist_passing` | Alleen volledige datums `YYYY-MM-DD` toepassen. |
| `artist.ar_website_url` | Toepassen als website leeg is; overschrijven alleen met confirm. |
| `artist.ar_artist_type` | Toepassen als type leeg/unknown is; overschrijven alleen met confirm. |
| `artist_external_profile.profile_text` | Discogs-profieltekst opslaan als externe profieltekst. |

Onvolledige datums zoals alleen een jaar of maand blijven zichtbaar als voorstel, maar zijn niet toepasbaar op de `date`-velden van `artist`.

## Technisch

Nieuwe migratie:

```bash
mkdir -p logs && npm run db:migrate:art012e4 2>&1 | tee "logs/db-migrate-art012e4-$(date +%Y%m%d-%H%M%S).log"
```

Nieuwe tabel:

- `artist_external_profile`

Uitbreiding op `artist_enrichment_proposals`:

- `applied_at`
- `applied_by`
- `ignored_at`
- `ignored_by`
- `reviewed_by`

Nieuwe endpoints:

```text
PATCH /api/artists/:id/discogs/enrichment-proposals/:proposalId/status
POST  /api/artists/:id/discogs/enrichment-proposals/:proposalId/apply
```

## Veiligheidsregels

1. Automatisch toepassen blijft verboden.
2. Conflicten vereisen expliciete overschrijfbevestiging.
3. Onvolledige datums worden niet toegepast.
4. Discogs-profieltekst wordt niet in `artist.ar_artist_notes` geplaatst, maar in `artist_external_profile`.
5. Apply-acties worden transactioneel uitgevoerd.
6. Audit naar `admin_audit_log` is optioneel en mag oudere lokale schema's niet blokkeren.


## ART-012E-4-Fix-1 — Apply refresh artist-state

Na het toepassen van een verrijkingsvoorstel gebruikt de frontend de actuele `artist` uit de apply-response om de artiestentabel, geselecteerde artiest, relatie-inzicht en eventueel geopende detailcontext direct bij te werken. Voor `artist_external_profile.profile_text` wordt expliciet gemeld dat dit externe profieldata is en dat de lokale `artist`-tabel daarbij niet wijzigt.
