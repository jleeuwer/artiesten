# Release Notes — ART-015D-3D Shellstarter mailcontract

## Type release

Documentatie-/contractrelease.

## Inhoud

- Shellstarter-mailcontract functioneel en technisch uitgewerkt.
- Vastgelegd dat Artiesten-app geen directe mail verstuurt.
- Voorkeursrichting: notification outbox.
- Alternatieven gedocumenteerd:
  - Shellstarter mailt op basis van `public.alerts`;
  - Shellstarter mail-API;
  - notification outbox.
- Mailmomenten vastgelegd voor scanner failure, stale reviewqueue en high-impact merge.
- Fout- en retryregels beschreven.
- Vervolgimplementatie opgesplitst in ART-015D-3D-1/2/3.

## Technische impact

- Geen nieuwe SQL-migratie.
- Geen wijziging in scanner-runtime.
- Geen wijziging in merge-runtime.
- Nieuwe documentatiecontracttest toegevoegd.

## Validatie

Uit te voeren:

```bash
npm run test:art015d3d
npm run test:art015d
npm run test:packaging
```
