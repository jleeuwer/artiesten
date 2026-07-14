# ART-UI-POLISH-1-Fix-1 — Zichtbaarheid overleden-indicator

## Bevinding

De eerste implementatie renderde de indicator uitsluitend in een smalle statusruimte vóór de profielfoto. De secundaire grijstint en het formaat maakten de indicator nauwelijks herkenbaar. In het detailscherm werd alleen de overlijdensdatum getoond; daar was geen afzonderlijke statusindicator geïmplementeerd.

## Oplossing

- De lijstindicator krijgt een compacte, contrastrijke statuscirkel.
- De tooltip vermeldt de overlijdensdatum wanneer die beschikbaar is.
- Het detailscherm toont naast de artiestennaam een compacte badge met hourglass-icoon en tekst `Overleden`.
- Beide indicatoren blijven conditioneel gekoppeld aan een niet-lege `ar_artist_passing`.
- Expliciete test-id's zijn toegevoegd voor toekomstige component- en Playwright-tests.

## Functionele acceptatie

1. Een levende artiest toont nergens een overleden-indicator.
2. Een artiest met sterfdatum toont de indicator vóór de profielfoto in de tabel.
3. Het detailscherm toont naast de naam de badge `Overleden`.
4. Hover/focus toont `Artiest overleden op dd-mm-jjjj` wanneer de datum bekend is.
5. De tabelrijhoogte blijft compact.
