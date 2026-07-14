# ART-013A-3-Fix-2 — Nieuw bandlid validatie

## Probleem
Bij **Nieuw bandlid** gaf de API `musicianKey is verplicht`, terwijl de musician in dezelfde samengestelde transactie nog moest worden aangemaakt.

## Oplossing
De `create-member`-flow valideert `bandArtistKey` direct, maar stelt alleen de `musicianKey`-validatie uit. Na het aanmaken van de standalone musician wordt de nieuwe sleutel in het lidmaatschap geplaatst. De normale flow voor het koppelen van een bestaande musician blijft beide referenties verplicht stellen.

## Database
Geen migratie nodig.
