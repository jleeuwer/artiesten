# ART-015D-3D — Shellstarter mailcontract

## Doel

ART-015D-3D rondt het functionele en technische mailcontract af voor de Artiesten-app duplicate maintenance flow. De bestaande flow schrijft al Shellstarter-alerts via `public.alerts` en toont stale reviewqueue-signalen in de Artiesten-app. Echte e-mailverzending wordt nog niet door de Artiesten-app zelf uitgevoerd.

Doel van dit contract is vastleggen **wanneer mail wenselijk is**, **wie de mail verstuurt**, **welke data wordt aangeleverd** en **hoe de Artiesten-app standalone bruikbaar blijft**.

## Bestaande signalering

| Signaal | Status | Kanaal |
|---|---|---|
| Scanner-run met nieuwe/bijgewerkte candidates | Geïmplementeerd | Shellstarter-alert via `public.alerts` |
| Scanner-run mislukt | Geïmplementeerd | Shellstarter-alert via `public.alerts` |
| Stale reviewqueue | Geïmplementeerd | Shellstarter-alert + UI-badge/waarschuwing |
| Echte e-mail | Niet geïmplementeerd | Vervolg via Shellstarter mailcontract |

## Ontwerpbesluit

De Artiesten-app verstuurt **geen mail rechtstreeks** via SMTP, Outlook of een eigen mailclient.

De Artiesten-app blijft verantwoordelijk voor:

1. detecteren van relevante gebeurtenissen;
2. vastleggen van audit/history;
3. schrijven van Shellstarter-alerts;
4. voorbereiden van een optionele mail-intentie volgens een afgesproken contract.

Shellstarter blijft verantwoordelijk voor:

1. bepalen van ontvangers;
2. toepassen van gebruikers-/systeemvoorkeuren;
3. daadwerkelijke mailverzending;
4. retry en delivery-status op mailniveau.

Hiermee blijft de Artiesten-app standalone bruikbaar en ontstaat geen harde afhankelijkheid van Shellstarter-mail in de basisfunctionaliteit.

## Voorkeurscontract: notification outbox

De voorkeursrichting is een **notification outbox**-contract. De Artiesten-app schrijft mail-intenties naar een gedeelde tabel of Shellstarter-owned tabel. Shellstarter leest deze outbox en verzorgt de daadwerkelijke verzending.

Conceptuele tabel:

```sql
notification_outbox (
  notification_id       bigserial primary key,
  app_key               text not null,
  module_key            text not null,
  event_type            text not null,
  severity              text not null,
  title                 text not null,
  body                  text not null,
  payload               jsonb not null default '{}'::jsonb,
  preferred_channel     text not null default 'mail',
  delivery_status       text not null default 'pending',
  created_at            timestamptz not null default now(),
  processed_at          timestamptz,
  error_message         text
)
```

Deze tabel wordt in ART-015D-3D **nog niet gemigreerd** zolang het Shellstarter-datamodel niet definitief is. Het contract wordt wel functioneel en technisch vastgelegd zodat Shellstarter en Artiesten-app op hetzelfde ontwerp kunnen aansluiten.

## Alternatieve contracten

### Optie A — Shellstarter leest `public.alerts` en mailt bepaalde alerts

Shellstarter kan bestaande alerts zelf interpreteren en mailregels toepassen.

Voordelen:
- geen nieuwe Artiesten-app tabellen nodig;
- alerts blijven single source of truth;
- simpele integratie.

Nadelen:
- minder expliciet verschil tussen alert en mail;
- maildeduplicatie en retry zijn lastiger te modelleren;
- e-mailinhoud moet uit alert-body/payload worden afgeleid.

### Optie B — Artiesten-app roept een Shellstarter API aan

De Artiesten-app kan een endpoint aanroepen zoals `POST /api/notifications/mail`.

Voordelen:
- direct contract;
- Shellstarter kan direct valideren.

Nadelen:
- harde runtime-afhankelijkheid;
- lastiger standalone;
- API-fout mag scanner/merge niet breken.

### Optie C — Notification outbox

Voorkeursrichting.

Voordelen:
- robuust bij tijdelijke Shellstarter/mailstoringen;
- goed retrybaar;
- transactioneel te combineren met scan/merge-audit;
- Artiesten-app blijft losgekoppeld van mailtransport.

Nadelen:
- vereist concrete Shellstarter-afspraak over tabel/schema/processor.

## Wanneer mailen?

Mail is niet bedoeld voor elk normaal onderhoudssignaal. Alerts blijven het primaire kanaal voor normale operationele feedback.

| Gebeurtenis | Alert | Mail | Toelichting |
|---|---:|---:|---|
| Scan geslaagd, geen nieuwe/open signalen | Nee of optioneel | Nee | Geen actie nodig. |
| Scan geslaagd, nieuwe/bijgewerkte candidates | Ja | Nee | Normale werkvoorraad. |
| Scan geslaagd, candidates boven warning threshold | Ja | Optioneel | Mail alleen als operationeel gewenst. |
| Stale reviewqueue boven threshold | Ja | Optioneel/Ja | Goede kandidaat voor periodieke reminder. |
| Scanner-run mislukt | Ja | Ja | Beheerder moet dit weten. |
| Artist merge succesvol met beperkte impact | Ja | Nee | Normaal handmatig beheer. |
| Artist merge succesvol met hoge impact | Ja | Optioneel/Ja | Auditwaardige actie. |
| Artist merge mislukt/rollback | Ja of log | Ja | Technische fout of blokkade. |
| Periodieke scan heeft uitzonderlijk veel candidates | Ja warning | Optioneel/Ja | Kan op datakwaliteitsprobleem wijzen. |

## Mailinhoud

Elke mail-intentie moet voldoende context bevatten zonder dat de ontvanger de serverlog nodig heeft.

Minimale velden:

- app: `artist`;
- module: `duplicate-maintenance` of `artist-merge`;
- event type;
- severity;
- titel;
- samenvatting;
- scan-run-id of merge-id;
- aantallen;
- timestamp;
- verwijzing naar Artiesten-app/Shellstarter context;
- foutmelding indien van toepassing.

Voor scanner-mails:

```text
Artiesten duplicate scanner vereist aandacht
Scan-run: 42
Nieuwe candidates: 18
Bestaand bijgewerkt: 7
Open candidates: 31
Te lang open: 4
Oudste open candidate: 23 dagen
```

Voor merge-mails:

```text
Artiesten merge met hoge impact uitgevoerd
Merge-id: 105
Redundant: 7654 — Daryl Hall John Oates
Leidend: 1483 — Hall & Oates
Records geraakt: 4
Reden: handmatige ontdubbeling
```

## Fout- en retryregels

Mail mag de scanner of merge niet onnodig breken.

Regels:

1. Scanner of merge mag niet mislukken enkel omdat mail niet geschreven/verzonden kan worden.
2. Alert schrijven blijft de primaire directe signalering.
3. Mail-intentie schrijven naar een outbox mag defensief gebeuren; fout wordt gelogd als `warn`.
4. Als mail-intentie transactioneel onderdeel is van een merge, mag dat alleen als de outbox betrouwbaar beschikbaar is.
5. Shellstarter is verantwoordelijk voor retry van `pending`/`failed` mailitems.
6. Dubbele mails moeten worden voorkomen met een idempotency key, bijvoorbeeld `artist-scan:<scan_run_id>:failure` of `artist-merge:<merge_id>:high-impact`.

## Configuratievoorstel

Toekomstige `.env`-variabelen, pas te activeren bij implementatie:

```env
ARTIST_MAIL_OUTBOX_ENABLED=false
ARTIST_MAIL_ON_SCAN_FAILURE=true
ARTIST_MAIL_ON_STALE_REVIEWQUEUE=false
ARTIST_MAIL_ON_HIGH_IMPACT_MERGE=false
ARTIST_MAIL_HIGH_IMPACT_RECORD_THRESHOLD=25
```

Deze variabelen zijn **nog niet toegevoegd aan `.env.example` als actieve configuratie**, omdat het mailcontract nog niet technisch is geïmplementeerd. Ze zijn ontwerpvoorstel voor de toekomstige implementatiesprint.

## Relatie met bestaande alerts

Alerts blijven leidend voor directe Shellstarter-signalering.

```text
scanner/merge event
→ audit/history
→ public.alerts
→ optionele mail-intentie/outbox
→ Shellstarter mailprocessor
```

Mail is dus een aanvullende escalatie, geen vervanging van alerts.

## Implementatieplan vervolg

### ART-015D-3D-1 — Shellstarter contractvalidatie

- Controleren of Shellstarter al een mail/outbox-tabel of API heeft.
- Bepalen of `public.alerts` voldoende payload bevat voor mailafleiding.
- Beslissen over outbox-tabel versus Shellstarter API.

### ART-015D-3D-2 — Mail outbox implementatie

- Migratie toevoegen als het outboxmodel gekozen wordt.
- Helperfunctie toevoegen voor mail-intenties.
- Scanner failure en stale reviewqueue optioneel laten mailen.
- Merge high-impact optioneel laten mailen.

### ART-015D-3D-3 — Shellstarter mailprocessor

- In Shellstarter zelf mailitems verwerken.
- Retry/delivery-status beheren.
- Recipients/preferenties configureren.

## Acceptatiecriteria ART-015D-3D design

- Documentatie maakt expliciet dat alerts geïmplementeerd zijn en mail nog niet.
- Mailmomenten zijn vastgelegd.
- Voorkeurscontract is benoemd: notification outbox.
- Alternatieven zijn gedocumenteerd.
- Scanner/merge mogen niet afhankelijk worden van directe mailverzending.
- Vervolgimplementatie is opgesplitst in duidelijke stappen.
