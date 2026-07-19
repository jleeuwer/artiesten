# ART-012B-Fix-2 — Diacritic-tolerante Discogs artist search

## Aanleiding

Discogs gaf voor sommige bestaande artiesten geen of te weinig resultaten wanneer de naam diakritische tekens bevatte, bijvoorbeeld `Agnetha Fältskog`.

## Functioneel gedrag

De gebruiker zoekt nog steeds met de correcte lokale artiestnaam. De applicatie probeert intern meerdere unieke zoekvarianten:

1. originele invoer;
2. Unicode NFC-genormaliseerde invoer;
3. accentloze zoekvariant.

Voorbeeld:

- `Agnetha Fältskog`
- `Agnetha Faltskog`

De accentloze variant wordt uitsluitend gebruikt om te zoeken. De lokale artiestnaam en de naam uit Discogs worden niet gewijzigd.

## Resultaatverwerking

- resultaten worden gededupliceerd op Discogs artist-ID;
- een exacte naam inclusief diakritische tekens krijgt de hoogste score;
- een accent-equivalente naam krijgt daarna prioriteit;
- gedeeltelijke matches worden lager geplaatst;
- per resultaat wordt technisch vastgelegd via welke zoekstrategie het is gevonden.

## Technische implementatie

In `services/discogsClient.js` zijn toegevoegd:

- `normalizeUnicode`;
- `stripDiacritics`;
- `buildArtistSearchVariants`;
- `normalizeComparableName`;
- `scoreArtistSearchResult`.

`searchArtists` voert de unieke varianten uit, dedupliceert op `discogs_artist_id`, sorteert lokaal en beperkt daarna de response tot de gevraagde limiet.

## Testgevallen

- samengestelde en losse Unicode-diacritics;
- `Agnetha Fältskog` → `Agnetha Faltskog`;
- `Sinéad O’Connor`;
- `Motörhead`;
- deduplicatie van dezelfde Discogs-ID uit meerdere queries;
- exacte naam boven accentloze en gedeeltelijke matches;
- correcte Discogs-naam blijft behouden.

## Database

Geen databasewijziging of migratie nodig.

## API-belasting

De zoekvarianten worden sequentieel uitgevoerd. Zodra de originele of NFC-query een exacte of accent-equivalente match bevat, stopt de flow. De accentloze zoekvariant is dus een fallback en veroorzaakt niet standaard een extra Discogs-call.
