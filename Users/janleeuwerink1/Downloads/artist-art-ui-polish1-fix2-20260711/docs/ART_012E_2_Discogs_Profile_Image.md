# ART-012E-2 — Profielfoto uit Discogs images

## Doel

ART-012E-2 voegt een kleine, testbare verrijkingsstap toe aan de Artiesten-app: bij een aan Discogs gekoppelde artiest kan de gebruiker één van de uit Discogs opgehaalde afbeeldingen kiezen als primaire profielfoto.

## Functionele scope

In scope:

- Discogs images tonen in de bestaande Discogs-sectie van het relatie-/editgebied.
- Eén image kunnen markeren als primaire profielfoto.
- De gekozen profielfoto tonen bij het geselecteerde artiestdetail.
- De keuze bewaren via het bestaande veld `artist_external_image.is_primary`.
- Per artiest maximaal één primaire image toestaan.

Niet in scope:

- Lokale image download/cache hardening.
- Binaire images opslaan in PostgreSQL.
- Enrichment proposal tabel.
- Geboorte-/sterfdatumextractie.
- Externe profieltekst toepassen.

## Functionele regels

1. De profielfoto wordt gekozen uit `artist_external_image` records met `source = 'discogs'`.
2. De gebruiker kiest expliciet de primaire profielfoto via de knop **Maak profielfoto**.
3. De app zet daarna alle andere Discogs images van dezelfde artiest op `is_primary = false`.
4. De gekozen image krijgt `is_primary = true`.
5. De afbeelding blijft remote-only in deze sprint; `external_image_url` wordt gebruikt voor weergave.
6. Er wordt geen lokale artistnaam of andere lokale artistdata aangepast.

## Technisch ontwerp

### Database

ART-012E-2 gebruikt het bestaande veld:

```sql
artist_external_image.is_primary
```

Nieuwe migratie:

```text
scripts/sql/20260608_art012e2_discogs_profile_image.sql
```

Deze migratie:

- normaliseert bestaande data zodat maximaal één primaire image per artist overblijft;
- voegt een partial unique index toe:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_artist_external_image_one_primary
  ON public.artist_external_image (artist_key)
  WHERE is_primary = true;
```

### Backend

Nieuwe model-functies:

```text
listDiscogsImages(artistKey)
setPrimaryDiscogsImage({ artistKey, imageId, performedBy })
```

Nieuwe API-routes:

```text
GET  /api/artists/:id/discogs/images
POST /api/artists/:id/discogs/images/:imageId/primary
```

`getRelations` geeft daarnaast terug:

```text
discogsImages
primaryDiscogsImage
```

### Frontend

Nieuwe UI-elementen:

- compacte profielfoto in de relatie-header;
- sectie **Profielfoto uit Discogs images**;
- grid met Discogs images;
- badge **Profielfoto** bij de primaire image;
- knop **Maak profielfoto** bij niet-primaire images.

## Acceptatiecriteria

1. Bij een gekoppelde Discogs-artiest met images verschijnt een image-grid.
2. Als er geen images zijn, toont de app een duidelijke melding.
3. De gebruiker kan één image als profielfoto kiezen.
4. Na keuze toont het detailgebied de gekozen profielfoto.
5. Na sluiten/openen blijft dezelfde image primair.
6. Per artiest kan technisch maximaal één image `is_primary = true` zijn.
7. Bestaande ART-012C/D/E-1 functionaliteit blijft werken.
