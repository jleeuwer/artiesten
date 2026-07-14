# Release Notes — ART-012D-4-Fix-3 Legacy naamvoorstellenblok verwijderd

## Doel

Na introductie van de persistente **Discogs naamvoorstellen reviewqueue** bleef de oude ART-012D sectie **Discogs naamvoorstellen** nog zichtbaar. Dit zorgde voor dubbele functionaliteit en verwarring.

## Wijzigingen

- Oude legacy UI-sectie `Discogs naamvoorstellen` verwijderd uit het relatiepaneel.
- Alleen de nieuwe sectie **Discogs naamvoorstellen reviewqueue** blijft zichtbaar.
- Meldteksten na Discogs-koppeling verwijzen nu naar de reviewqueue.
- De oude backend/API blijft beschikbaar voor historische ART-012D flows, maar wordt niet meer als tweede UI-blok getoond.
- Contracttests aangepast zodat de nieuwe reviewqueue de actieve UI-flow is.

## Migratie

Geen database-migratie nodig.
