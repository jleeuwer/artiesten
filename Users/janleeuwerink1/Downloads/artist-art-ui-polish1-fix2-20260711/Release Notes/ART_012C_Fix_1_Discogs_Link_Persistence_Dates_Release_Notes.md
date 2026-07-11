# Release Notes — ART-012C-Fix-1 Discogs link persistence en datums

## Fixes

- Discogs-koppeling blijft nu bewaard als optionele auditlogging ontbreekt of niet compatibel is.
- Optionele `admin_audit_log` wordt uitgevoerd binnen een savepoint zodat de hoofdtransactie niet onnodig wordt teruggedraaid.
- Discogs-detailnormalisatie ondersteunt gestructureerde `birth_date` en `death_date`-achtige velden.
- Lokale `artist.ar_artist_dateofbirth` en `artist.ar_artist_passing` worden alleen gevuld als ze leeg zijn en Discogs een gestructureerde datum levert.
- UI meldt expliciet of geboorte-/overlijdensdatum is overgenomen.

## Niet gewijzigd

- Discogs ID vervangt nooit `artist.ar_artist_key`.
- Lokale artistnaam wordt niet overschreven.
- Vrije Discogs-profieltekst wordt niet automatisch geparsed voor datums.
