# ART-012E-1-Fix-2 — Discogs link-icoon direct zichtbaar na koppelen

Datum: 2026-06-08

## Aanleiding

Na ART-012E-1-Fix-1 verscheen het Discogs link-icoon in de artiestentabel nog niet direct na het koppelen van een Discogs artist. Het icoon werd pas zichtbaar na een handmatige browserrefresh.

## Oplossing

De frontend houdt nu naast de serverdata ook een kleine optimistische set bij met artiesten die in de huidige sessie succesvol aan Discogs zijn gekoppeld.

Daardoor wordt het icoon direct zichtbaar zodra de koppeling succesvol is afgerond:

```html
<i class="bi bi-link"></i>
```

## Technisch

Aangepast in `client/src/components/ArtistPageContent.jsx`:

- nieuwe state `discogsLinkedArtistKeys`;
- na succesvolle koppeling wordt de artist key direct aan deze set toegevoegd;
- de tabel gebruikt `isDiscogsLinkedArtist(r)` zodat zowel serverdata als de optimistische sessiestatus meetellen;
- het relatiepaneel gebruikt dezelfde helper voor de badge `Discogs gekoppeld`;
- de bestaande serverrefresh blijft behouden zodat de databasewaarheid later alsnog leidend is.

## Verwachte test

1. Open een artiest zonder Discogs-icoon.
2. Zoek en koppel een Discogs artist.
3. Controleer dat het link-icoon direct in de artiestentabel zichtbaar wordt zonder browserrefresh.
4. Refresh de browser en controleer dat het icoon zichtbaar blijft op basis van de databasekoppeling.
