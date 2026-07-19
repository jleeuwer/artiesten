# Release notes — ART UI-detail- en scrollhardening

## Opgeleverd
- Compacte Discogs-bandledenconflictmeldingen.
- Actieknoppen blijven in één horizontale actieregel.
- Scroll- en focusherstel na proposalacties.
- Inklapbare secties Songs, Alternatieve spellingen, Hitlijsten en Mergehistorie.
- Labels File Details en Artiesten Spelling hernoemd.
- Scroll anchoring en embedded scrollgedrag verder gehard.
- Functioneel/technisch ontwerp en testcatalogus toegevoegd.

## Database
Geen migratie nodig.

## Packaging- en databaseaanvulling

- complete broncode, documentatie en tests in één ZIP;
- `node_modules` uitgesloten;
- Docker/PostgreSQL-preflight toegevoegd;
- expliciete no-op migratie toegevoegd omdat deze UI-sprint geen schemawijziging vereist;
- post-deployment verify toegevoegd;
- npm-scripts voor alle drie databasehandelingen toegevoegd.
