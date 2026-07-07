# ART-015B — Testcases en runbook

## Automatische tests

Draai voor deze sprint:

```bash
npm run test:art015b
npm run test:unit
```

Voor een volledige lokale validatie na dependency-installatie:

```bash
npm run install:all
npm run test:all
```

## Handmatige testcases

### TC-015B-001 — Duplicate candidates zoeken

1. Start de app.
2. Selecteer een artiest in de hoofdtafel.
3. Controleer dat het relatiepaneel onderaan verschijnt.
4. Klik op **Zoek mogelijke dubbelen**.
5. Verwacht:
   - lijst met kandidaten of een duidelijke lege-state;
   - score zichtbaar;
   - matchreden zichtbaar;
   - gematchte waarden zichtbaar.

### TC-015B-002 — Impactscan “Maak kandidaat leidend”

1. Zoek mogelijke dubbelen.
2. Klik bij een kandidaat op **Maak kandidaat leidend**.
3. Verwacht:
   - impactscan opent;
   - geselecteerde artiest is redundante artiest;
   - kandidaat is vervangende artiest;
   - `file_details` impact wordt getoond;
   - `artiesten_spelling` impact wordt getoond;
   - geen database-mutatie wordt uitgevoerd.

### TC-015B-003 — Impactscan “Maak deze artiest leidend”

1. Zoek mogelijke dubbelen.
2. Klik bij een kandidaat op **Maak deze artiest leidend**.
3. Verwacht:
   - impactscan opent;
   - kandidaat is redundante artiest;
   - geselecteerde artiest is vervangende artiest;
   - waarschuwingen/conflicten worden getoond indien aanwezig;
   - geen mergeknop of uitvoeractie is beschikbaar.

### TC-015B-004 — Fuzzy search blijft advies

Controleer dat de UI en documentatie duidelijk maken dat fuzzy matching alleen kandidaatdetectie is en geen automatische merge uitvoert.

## Geen migratie nodig

ART-015B voegt geen nieuwe databasekolommen of tabellen toe. De Sprint 6 favorietenmigratie blijft wel nodig als die nog niet eerder is uitgevoerd.
