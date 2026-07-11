# Release Notes — ART-015D Design

## Type

Documentatie-/ontwerpsprint.

## Samenvatting

ART-015D werkt de periodieke onderhoudsvariant voor artiest-ontdubbeling uit. De scanner vindt mogelijke dubbele artiesten en zet ze klaar in staging/reviewtabellen. De daadwerkelijke impactscan en merge blijven via de bestaande ART-015B/ART-015C-flow lopen.

## Toegevoegd

- Functioneel/technisch ontwerp voor periodieke duplicate scanner.
- Stagingdatamodel voor scan-runs en candidates.
- Candidate statusflow.
- Schedulingadvies.
- Loggingstrategie.
- Shellstarter alert/mail-momenten.
- Testcases en runbook.
- Documentatiecontracttest.

## Niet toegevoegd

- Geen Python scanner-code.
- Geen nieuwe SQL-migratie.
- Geen reviewqueue UI.
- Geen automatische merge.

## Validatie

- `npm run test:art015d`
- `npm run test:unit`
- `npm run test:sprint4`
