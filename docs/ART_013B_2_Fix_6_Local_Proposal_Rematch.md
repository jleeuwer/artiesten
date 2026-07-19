# ART-013B-2-Fix-6 — Lokale rematching na artistcorrectie

## Functioneel
Na correctie van een artisttype, artistnaam, alternatieve spelling of musician-koppeling wordt een bestaand voorstel lokaal opnieuw beoordeeld. De queue doet dit automatisch bij openen en biedt daarnaast **Lokale matches vernieuwen**.

**Discogs opnieuw ophalen** blijft een aparte actie en is alleen nodig om de externe ledenlijst opnieuw te lezen.

Voorbeeld:

- oud: `artist_type_missing`
- artist wordt gewijzigd naar `person`
- nieuw: `matched_artist_person`, `matched_musician` of `matched_relation`

## Technisch
`POST /api/musician-in-band-proposals/bands/:artistKey/rematch` verwerkt niet-geaccepteerde proposals transactioneel met de bestaande matchingservice. `ignored` en `review_later` blijven behouden.

Er is geen databasemigratie nodig.
