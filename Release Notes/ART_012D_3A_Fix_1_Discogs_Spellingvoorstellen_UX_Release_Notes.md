# ART-012D-3A-Fix-1 — Discogs spellingvoorstellen UX-verduidelijking

## Type

UI-/documentatiefix.

## Inhoud

- UI toont nu een duidelijke melding wanneer nog geen Discogs artist is gekoppeld.
- Na **Koppel Discogs artist** wordt duidelijk gemaakt dat spellingvoorstellen de volgende stap zijn.
- Spellingvoorstellen worden na koppeling automatisch opnieuw opgehaald.
- De tekst in de sectie **Discogs naamvoorstellen** verduidelijkt:
  - **Voeg toe als spelling** wijzigt alleen `artiesten_spelling`;
  - **Preview canonical** toont alleen impact en voert geen wijziging uit.
- Nieuwe contracttest: `tests/art012d3aFix1DiscogsSpellingUx.contract.test.mjs`.

## Migratie

Geen nieuwe SQL-migratie nodig.
