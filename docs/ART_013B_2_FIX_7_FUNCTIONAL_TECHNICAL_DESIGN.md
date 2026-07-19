# ART-013B-2-Fix-7 — fallback na onjuiste artistmatch

## Aanleiding

Bij Discogs-bandleden kon een gelijkende lokale artist met type `band` of een samengestelde naam de verwerking blokkeren. Voorbeeld: Discogs-lid `Roger Glover` werd gekoppeld aan `Roger Glover & Guests`. Na negeren werd geen standalone musician aangemaakt.

## Functioneel gedrag

- Alleen een artist met type `person` kan rechtstreeks als persoon worden gekoppeld.
- Een gevonden artist met een ander type blijft zichtbaar als naamkandidaat, maar blokkeert de flow niet.
- De proposal blijft `new` en biedt **Aanmaken als musician**.
- Deze actie maakt een standalone musician met de Discogs-naam en daarna de bandrelatie.
- **Voorstel negeren** betekent uitsluitend dat het volledige voorstel wordt genegeerd.
- `artist_type_missing` en `ambiguous` blijven blokkerende controlesituaties.

## Technische uitwerking

- `musicianInBandMatchingService.classify` classificeert een niet-persoonsartist als `artist_type_conflict` met proposalstatus `new`.
- `accept` accepteert `createStandalone=true` en gebruikt voor `artist_type_conflict` automatisch de standalone flow.
- De bestaande artist-key wordt niet gekoppeld aan de nieuwe musician.
- Aanmaak van musician, bandrelatie, bronhistorie en proposalstatus blijft één transactie.
- Er is geen databasemigratie nodig; bestaande statuswaarden worden hergebruikt.

## Testgevallen

1. Roger Glover versus `Roger Glover & Guests` (band): standalone musician kan worden aangemaakt.
2. Exacte person-artist zonder musician: bestaande artist wordt gekoppeld aan nieuw aangemaakte musician.
3. Bestaande standalone musician: bestaande musician wordt gebruikt.
4. Artisttype ontbreekt: actie blijft geblokkeerd voor controle.
5. Meerdere lokale kandidaten: actie blijft geblokkeerd als ambigu.
6. Bestaande bandrelatie: geen dubbele relatie.
7. Dubbele acceptatie: tweede verwerking wordt geweigerd.
8. Fout bij relatieaanmaak: volledige transactie wordt teruggedraaid.
9. Volledig voorstel negeren: geen musician of relatie wordt aangemaakt.
