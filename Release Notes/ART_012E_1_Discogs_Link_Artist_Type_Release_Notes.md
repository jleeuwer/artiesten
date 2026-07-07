# Release Notes — ART-012E-1 Discogs linked indicator en artist type

## Inhoud

Deze release voegt een kleine, testbare basis toe voor latere Discogs-verrijking.

Toegevoegd:

- Discogs gekoppeld-indicatie in de artiestentabel met `<i class="bi bi-link"></i>`.
- Backendveld `has_discogs_link` op basis van `artist_external_reference`.
- Discogs metadata in list/get responses: external id, naam, URL en syncdatum.
- Nieuw artist type veld `artist.ar_artist_type`.
- Artist type zichtbaar in lijst en relatiepaneel.
- Artist type bewerkbaar in het edit-scherm.
- Docker-proof migratiescript `db:migrate:art012e1`.
- Contracttest `test:art012e1`.

## Niet inbegrepen

Niet in deze release:

- Discogs enrichment proposals.
- Profielfoto uit Discogs images.
- Datumextractie uit profieltekst.
- Apply-acties op lokale artistvelden.

## Installatie

```bash
npm run db:migrate:art012e1
npm run test:art012e1
```

## Testadvies

Test vooral:

- icoon zichtbaar bij gekoppelde artiesten;
- geen icoon bij niet-gekoppelde artiesten;
- artist type wijzigen en opnieuw openen;
- ART-012D spelling/canonical flow regressie.
