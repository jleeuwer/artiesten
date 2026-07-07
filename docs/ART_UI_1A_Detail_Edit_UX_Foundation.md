# ART-UI-1A — Detail/edit UX foundation

## Doel

Deze sprint pakt de eerste UI/UX-hardening op voor de Artiesten-app na ART-012D/E:

- edit-modal voelt te smal;
- externe Discogs-profieltekst is nog niet zichtbaar;
- onderste detailgebied onder de artiestentabel heeft onvoorspelbaar scrollgedrag;
- gebruiker heeft meer controle nodig over welke detailmodule actief is.

## Functioneel

### Breder edit-scherm

Het edit-scherm gebruikt nu een extra brede modal (`xl`) met een maximale breedte van 1280px. Hiermee is er meer ruimte voor basisgegevens, profielheader en relatiecontext.

### Paneelnavigatie onder de artiestentabel

Het relatiepaneel heeft nu een navigatiebalk:

- Alles;
- Relaties;
- Discogs;
- Ontdubbelen.

Hiermee kan de gebruiker detailmodules onder de artiestentabel activeren/deactiveren zonder door alle blokken te hoeven scrollen.

### Scrollgedrag

Het relatiepaneel is nu zelf de primaire verticale scrollcontainer. Horizontale overflow wordt onderdrukt zodat het scrollen voorspelbaarder is.

### Discogs profieltekst zichtbaar

Wanneer een Discogs-profieltekst is opgeslagen in `artist_external_profile`, wordt die read-only getoond in het Discogs-gedeelte. Lokale notities blijven apart in `artist.ar_artist_notes`.

## Niet in scope

- Volledig apart edit-scherm;
- bewerken van Discogs-profieltekst;
- lokale biografie als nieuw datamodel;
- drag/drop paneelindeling;
- volledige herstructurering naar tabs door de hele app.
