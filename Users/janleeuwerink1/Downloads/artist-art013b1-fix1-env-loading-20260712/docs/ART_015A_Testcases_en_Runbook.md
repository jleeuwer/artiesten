# ART-015A — Testcases en runbook

**Status:** ontwerp-/documentatiesprint  
**Datum:** 2026-05-25

ART-015A bevat nog geen uitvoerende mergecode. De tests zijn daarom documentatiecontracttests die borgen dat de overeengekomen requirements niet uit de documentatie verdwijnen.

## 1. Testcases voor ART-015A

### ART-015A-DOC-001 — Ontwerpdocument bestaat

**Doel:** borgen dat het functioneel/technisch ontwerp beschikbaar is.

**Verwacht:**

- `docs/ART_015A_Artiesten_Ontdubbelen_Functioneel_Technisch_Ontwerp.md` bestaat.
- Het document beschrijft doel, uitgangspunten, flows, datamodel en vervolg.

### ART-015A-DOC-002 — Twee discovery-varianten zijn beschreven

**Doel:** borgen dat zowel de onderhoudsvariant als de geïntegreerde variant zijn vastgelegd.

**Verwacht:**

- Periodieke onderhoudsfunctie met staging is beschreven.
- Geïntegreerde ondersteuning in de Artiesten-app is beschreven.
- Beide routes gebruiken dezelfde impactscan, mergeflow en audit/history.

### ART-015A-DOC-003 — Fuzzy matching is kandidaatdetectie, geen automatische merge

**Doel:** voorkomen dat fuzzy matching later als automatische correctie wordt geïnterpreteerd.

**Verwacht:**

- Documentatie zegt expliciet dat fuzzy matching alleen duplicate candidates voorstelt.
- De gebruiker moet altijd redundante en vervangende artiest kiezen.
- De gebruiker moet altijd expliciet bevestigen.

### ART-015A-DOC-004 — Impactscan is uitgewerkt

**Doel:** borgen dat de preview/impactscan centraal blijft.

**Verwacht:**

- Minimaal `file_details.fd_artist_key` en `artiesten_spelling.as_artist_key` zijn in scope.
- Samenvatting per tabel is beschreven.
- Extractievelden per tabel zijn beschreven.
- Conflicten en waarschuwingen zijn beschreven.

### ART-015A-DOC-005 — Albums en toekomstige relaties zijn meegenomen

**Doel:** voorkomen dat het ontwerp te smal wordt.

**Verwacht:**

- Albums worden expliciet genoemd.
- Artist relationships, muzikanten en bands worden genoemd.
- Discogs artist-data wordt genoemd als latere uitbreiding.

### ART-015A-DOC-006 — Audit/history is beschreven

**Doel:** borgen dat merges traceerbaar worden.

**Verwacht:**

- `artist_merge_history` of vergelijkbare audit is beschreven.
- Redundante en vervangende artist keys worden opgeslagen.
- Geraakte tabellen/conflicten worden vastgelegd.

## 2. Automatische tests

Uitvoeren:

```bash
npm run test:art015a
```

Of als onderdeel van unit-tests:

```bash
npm run test:unit
```

## 3. Verwacht resultaat

```text
ART-015A documentation contract tests: groen
```

## 4. Latere implementatietests voor ART-015B/ART-015C

Wanneer ART-015B wordt gebouwd, moeten extra tests worden toegevoegd voor:

- fuzzy duplicate candidates;
- matchscore/matchreden;
- impactscan per tabel;
- extracties uit `file_details` en `artiesten_spelling`;
- conflictmeldingen;
- geen automatische merge.

Wanneer ART-015C wordt gebouwd, moeten extra tests worden toegevoegd voor:

- transactie;
- rollback;
- audit/history;
- update van `file_details.fd_artist_key`;
- update/merge van `artiesten_spelling.as_artist_key`;
- blokkeren van merge naar dezelfde artiest.

