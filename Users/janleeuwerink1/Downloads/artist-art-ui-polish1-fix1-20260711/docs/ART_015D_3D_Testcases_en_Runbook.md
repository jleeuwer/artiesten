# ART-015D-3D — Testcases en runbook Shellstarter mailcontract

## Doel

Dit document beschrijft hoe het ART-015D-3D mailcontract wordt gevalideerd. Deze sprint implementeert nog geen echte mailverzending; de validatie richt zich op documentatie, contractkeuzes en vervolgimplementatie-afbakening.

## Testcases

### TC-3D-001 — Mail is expliciet niet geïmplementeerd

**Verwacht:** Documentatie vermeldt dat echte mail nog niet technisch is geïmplementeerd en dat alerts via `public.alerts` het bestaande signaalkanaal zijn.

### TC-3D-002 — Voorkeurscontract is notification outbox

**Verwacht:** Documentatie beschrijft een notification outbox als voorkeursrichting en benoemt Shellstarter als eigenaar van daadwerkelijke mailverzending.

### TC-3D-003 — Mailmomenten zijn vastgelegd

**Verwacht:** Documentatie bevat een tabel met gebeurtenissen en besluit per kanaal:

- scan failure → alert + mail;
- stale reviewqueue → alert + optioneel mail;
- high-impact merge → alert + optioneel mail;
- normale scan/merge → meestal alleen alert.

### TC-3D-004 — Artiesten-app blijft standalone

**Verwacht:** Documentatie vermeldt dat de Artiesten-app geen directe SMTP/Outlook-mail verstuurt en niet hard afhankelijk wordt van Shellstarter-mail.

### TC-3D-005 — Package script

**Verwacht:** `npm run test:art015d3d` voert de ART-015D-3D contracttest uit en `npm run test:art015d` neemt deze mee.

## Handmatige controle

```bash
npm run test:art015d3d
npm run test:art015d
```

Controleer daarnaast in de documentatie:

```bash
grep -n "notification outbox" docs/ART_015D_3D_Shellstarter_Mailcontract.md
grep -n "Echte e-mail" docs/ART_015D_3D_Shellstarter_Mailcontract.md
grep -n "ART-015D-3D" docs/BACKLOG.md
```

## Geen migratie in deze sprint

ART-015D-3D is een contract-/ontwerpsprint. Er wordt nog geen outboxmigratie toegepast zolang Shellstarter-mail niet definitief is afgestemd.
