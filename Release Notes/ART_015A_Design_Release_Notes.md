# ART-015A Design Release Notes

**Release:** ART-015A Artiesten ontdubbelen / samenvoegen — ontwerpdocumentatie  
**Datum:** 2026-05-25

## Inhoud

Deze release bevat een functioneel en technisch ontwerp voor het veilig ontdubbelen van artiesten.

Toegevoegd:

- `docs/ART_015A_Artiesten_Ontdubbelen_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_015A_Testcases_en_Runbook.md`
- `tests/art015aDocumentation.contract.test.mjs`
- `npm run test:art015a`

## Belangrijke ontwerpbesluiten

- Fuzzy matching wordt gebruikt voor kandidaatdetectie, niet voor automatische merge.
- De gebruiker kiest altijd zelf de redundante en vervangende artiest.
- De flow is centraal:

```text
candidate discovery → impactscan → conflictcontrole → expliciet akkoord → transactie → audit/history
```

- Twee kandidaatbronnen zijn uitgewerkt:
  1. geïntegreerde ondersteuning in de Artiesten-app;
  2. periodieke onderhoudsfunctie met staging, bijvoorbeeld Python.

## Niet inbegrepen

- Geen uitvoerende merge-code.
- Geen stagingtabellen aangemaakt.
- Geen Python scanner.
- Geen database-migratie voor ART-015A.

## Validatie

```bash
npm run test:art015a
npm run test:unit
```
