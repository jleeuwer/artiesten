# ART-015C — Artiesten merge uitvoeren: functioneel en technisch ontwerp

Status: ontwerp-/requirementsprint  
Datum: 2026-05-25  
Scope: Artiesten-app / musicdb / Shellstarter alert-haak

## 1. Doel

ART-015C werkt de daadwerkelijke uitvoering van een artiest-merge uit. In ART-015B is bewust alleen duplicate discovery en read-only impactscan gebouwd. ART-015C beschrijft hoe de merge veilig uitgevoerd wordt, inclusief transactie, audit/history, validatie-reset en Shellstarter-alert.

De kernregel is:

> Een artist merge is één technische database-transactie. Alles lukt, of niets lukt.

Er mogen dus nooit gedeeltelijk gemergede records achterblijven.

## 2. Functionele flow

```text
Gebruiker kiest redundante artiest
        ↓
Gebruiker kiest vervangende/canonical artiest
        ↓
Systeem draait impactscan opnieuw server-side
        ↓
Systeem toont/confirmeert scope, aantallen, conflicten en waarschuwingen
        ↓
Gebruiker bevestigt expliciet
        ↓
Backend voert merge uit binnen één transactie
        ↓
Audit/history wordt vastgelegd
        ↓
Redundante artiest wordt gemarkeerd als merged/deleted
        ↓
Shellstarter alert wordt aangemaakt
        ↓
Relatiepanelen en lijst worden opnieuw geladen
```

Belangrijk: de frontend mag geen losse update-operaties uitvoeren op meerdere tabellen. De frontend roept één backend-endpoint aan. Alle mutaties gebeuren server-side in één servicefunctie.

## 3. Analyse huidig schema

Op basis van `musicdbschema.sql` en de FK-query-output is duidelijk dat bestaande foreign keys niet de volledige functionele impact tonen.

### 3.1 Formele foreign keys naar `artist`

De query-output toont minimaal deze formele FK's:

| Tabel | Kolom | Status |
|---|---|---|
| `artiesten_spelling` | `as_artist_key` | formele FK aanwezig |
| `file_details` | `fd_artist_key` | formele FK aanwezig |
| `musician` | `ar_artist_key` | formele FK aanwezig |
| `musician_in_band` | `mb_artist_key` | formele FK aanwezig |

### 3.2 Functionele artist-key kolommen zonder formele FK

Het schema bevat ook kolommen die functioneel naar `artist.ar_artist_key` verwijzen maar niet in de FK-query verschijnen:

| Tabel | Kolom | Relevantie |
|---|---|---|
| `hitlijsten` | `ar_artist_key` | hoog |
| `staging_hitlijsten` | `hl_artist_key` | hoog, afhankelijk van stagingbeleid |
| `import_scan_items` | `fd_artist_key` | middel/hoog bij actieve imports |
| `file_details_version_group_validations` | `fd_artist_key` | gevoelig; niet blind updaten |

Conclusie: ART-015C mag niet alleen vertrouwen op bestaande foreign keys. De merge-scope wordt expliciet vastgelegd.

## 4. Merge-scope v1

### 4.1 Binnen de transactie muteren

| Tabel | Kolom(men) | Actie |
|---|---|---|
| `file_details` | `fd_artist_key` | redundant key vervangen door replacement key |
| `file_details` | `fd_correct_artist` | synchroniseren naar replacement artist name |
| `artiesten_spelling` | `as_artist_key` | spellingen overzetten naar replacement artist, met conflictregels |
| `hitlijsten` | `ar_artist_key` | redundant key vervangen door replacement key |
| `staging_hitlijsten` | `hl_artist_key` | redundant key vervangen door replacement key |
| `import_scan_items` | `fd_artist_key` | redundant key vervangen door replacement key |
| `file_details_version_group_validations` | `fd_artist_key` | niet key-updaten; affected validations resetten/invalideren |
| `artist` | merge-statusvelden | redundante artist markeren als merged/deleted |
| `artist_merge_history` | nieuwe rij | audit/history vastleggen |
| `admin_audit_log` | nieuwe rij | generieke audit vastleggen |
| `alerts` | nieuwe rij | Shellstarter alert aanmaken |

### 4.2 Niet muteren in v1, wel rapporteren/voorbereiden

| Onderdeel | Reden |
|---|---|
| albums / album_artists / tracks | albumdatamodel is nog niet uitgewerkt |
| Discogs artist-linktabellen | nog niet aanwezig als stabiel domeinmodel |
| tekstuele raw stagingvelden zoals `artiest_raw` | raw brondata; geen lokale `artist_key` |
| `song_spelling.hl_artiest` | tekstuele mapping; geen `artist_key` |
| mail | nog beslissen hoe Shellstarter mail exact wordt aangestuurd |

## 5. Conflictregels

### 5.1 Redundante en replacement artist

Blokkeren als:

- redundant artist niet bestaat;
- replacement artist niet bestaat;
- keys gelijk zijn;
- replacement artist al deleted/merged is;
- redundant artist al merged is, tenzij later expliciet hermerge wordt ondersteund.

### 5.2 `artiesten_spelling`

`artiesten_spelling.as_alternatieve_spelling` heeft functioneel een unieke betekenis: één alternatieve spelling mag niet naar twee artiesten wijzen.

Regel:

- spelling bestaat alleen bij redundant → overzetten naar replacement;
- spelling bestaat al bij replacement → redundant spellingrecord verwijderen of overslaan als duplicaat;
- spelling bestaat bij een derde artist → merge blokkeren en conflict tonen.

De exacte SQL moet voorkomen dat unieke constraints falen. Eerst conflicten detecteren, daarna pas muteren.

### 5.3 `file_details_version_group_validations`

Deze tabel bevat procesmatige validaties op artist + titelgroep. Een artist merge verandert de betekenis van de validatie.

Regel v1:

- affected `title_group_key`s bepalen uit `file_details` waar `fd_artist_key = redundantArtistKey`;
- validations voor redundant en replacement artist met die `title_group_key`s resetten/invalideren;
- niet simpel `fd_artist_key` updaten, omdat dit unieke constraints en inhoudelijke validatiebetekenis kan raken.

Voorstel resetvelden:

```text
reset_at = now()
reset_source = 'artist_merge'
reset_reason = 'Artist merge invalidated version-group validation'
reset_criteria = jsonb met redundant/replacement artist en merge_id
updated_at = now()
```

### 5.4 `fd_correct_artist`

`file_details.fd_artist_key` is de formele sleutel. `fd_correct_artist` is tekst/citext en kan anders na de merge de oude naam blijven tonen.

Regel v1:

- na update naar replacement key wordt `fd_correct_artist` gezet op `replacement.ar_artist_name` voor alle geraakte records.

## 6. Transactie-ontwerp

Pseudocode:

```text
BEGIN;

1. Lock redundant artist row FOR UPDATE.
2. Lock replacement artist row FOR UPDATE.
3. Valideer preconditions.
4. Draai impactscan opnieuw server-side.
5. Controleer confirmedImpactHash / expected counts indien gebruikt.
6. Detecteer spellingconflicten en andere blockers.
7. Maak artist_merge_history rij aan of reserveer merge_id.
8. Update file_details.fd_artist_key + fd_correct_artist.
9. Update hitlijsten.ar_artist_key.
10. Update staging_hitlijsten.hl_artist_key.
11. Update import_scan_items.fd_artist_key.
12. Verwerk artiesten_spelling: overzetten, duplicaten oplossen, conflicten blokkeren.
13. Reset/invalidate file_details_version_group_validations.
14. Markeer redundant artist als merged/deleted.
15. Update artist_merge_history met affected_counts en status completed.
16. Insert admin_audit_log.
17. Insert Shellstarter alert in alerts.

COMMIT;
```

Bij elke fout:

```text
ROLLBACK;
Geen gedeeltelijke merge.
```

## 7. Migratievoorstel

ART-015C heeft minimaal extra schema nodig voor merge-status en history.

### 7.1 Artist merge statusvelden

```sql
ALTER TABLE public.artist
  ADD COLUMN IF NOT EXISTS ar_merged_into_artist_key integer,
  ADD COLUMN IF NOT EXISTS ar_merged_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ar_merge_note text;

ALTER TABLE public.artist
  ADD CONSTRAINT artist_merged_into_artist_key_fkey
  FOREIGN KEY (ar_merged_into_artist_key)
  REFERENCES public.artist(ar_artist_key);
```

### 7.2 Artist merge history

```sql
CREATE TABLE IF NOT EXISTS public.artist_merge_history (
  merge_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  redundant_artist_key integer NOT NULL,
  replacement_artist_key integer NOT NULL,
  redundant_artist_name public.citext NOT NULL,
  replacement_artist_name public.citext NOT NULL,
  merge_reason text,
  performed_by text DEFAULT 'system' NOT NULL,
  performed_at timestamp with time zone DEFAULT now() NOT NULL,
  affected_counts jsonb DEFAULT '{}'::jsonb NOT NULL,
  conflict_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  notification_status jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'completed' NOT NULL,
  CONSTRAINT artist_merge_history_status_check
    CHECK (status IN ('completed', 'failed', 'rolled_back')),
  CONSTRAINT artist_merge_history_distinct_artists_check
    CHECK (redundant_artist_key <> replacement_artist_key)
);
```

### 7.3 FK-hardening, gefaseerd

Voor robuustheid worden extra foreign keys voorbereid, maar alleen na orphan-checks.

Orphan-checks:

```sql
select count(*) as orphan_hitlijsten
from public.hitlijsten h
left join public.artist a on a.ar_artist_key = h.ar_artist_key
where h.ar_artist_key is not null
  and a.ar_artist_key is null;

select count(*) as orphan_staging_hitlijsten
from public.staging_hitlijsten s
left join public.artist a on a.ar_artist_key = s.hl_artist_key
where s.hl_artist_key is not null
  and a.ar_artist_key is null;

select count(*) as orphan_import_scan_items
from public.import_scan_items i
left join public.artist a on a.ar_artist_key = i.fd_artist_key
where i.fd_artist_key is not null
  and a.ar_artist_key is null;
```

FK's na akkoord/opschoning:

```sql
ALTER TABLE public.hitlijsten
  ADD CONSTRAINT hitlijsten_ar_artist_key_fkey
  FOREIGN KEY (ar_artist_key)
  REFERENCES public.artist(ar_artist_key)
  NOT VALID;

ALTER TABLE public.staging_hitlijsten
  ADD CONSTRAINT staging_hitlijsten_hl_artist_key_fkey
  FOREIGN KEY (hl_artist_key)
  REFERENCES public.artist(ar_artist_key)
  NOT VALID;

ALTER TABLE public.import_scan_items
  ADD CONSTRAINT import_scan_items_fd_artist_key_fkey
  FOREIGN KEY (fd_artist_key)
  REFERENCES public.artist(ar_artist_key)
  NOT VALID;
```

Later valideren:

```sql
ALTER TABLE public.hitlijsten VALIDATE CONSTRAINT hitlijsten_ar_artist_key_fkey;
ALTER TABLE public.staging_hitlijsten VALIDATE CONSTRAINT staging_hitlijsten_hl_artist_key_fkey;
ALTER TABLE public.import_scan_items VALIDATE CONSTRAINT import_scan_items_fd_artist_key_fkey;
```

## 8. API-ontwerp

### 8.1 Merge uitvoeren

```http
POST /api/artists/merge/execute
```

Body:

```json
{
  "redundantArtistKey": 123,
  "replacementArtistKey": 456,
  "reason": "Dubbele artiest door spellingsvariant",
  "confirmedImpactHash": "optional-hash-from-impactscan",
  "notify": {
    "alert": true,
    "mail": false
  }
}
```

Response:

```json
{
  "ok": true,
  "mergeId": 1001,
  "affectedCounts": {
    "file_details": 12,
    "artiesten_spelling_transferred": 2,
    "artiesten_spelling_duplicates_removed": 1,
    "hitlijsten": 4,
    "staging_hitlijsten": 0,
    "import_scan_items": 1,
    "validations_reset": 3
  },
  "alertId": 987
}
```

### 8.2 Eerst nog steeds impactscan gebruiken

`GET /api/artists/merge/impact` blijft verplicht vóór uitvoering. De execute-endpoint draait zelf opnieuw een impactscan, zodat stale UI-data geen foutieve merge kan veroorzaken.

## 9. Shellstarter alerts en mail

### 9.1 Alerts in ART-015C

De Artiesten-app kan standalone blijven door niet direct een Shellstarter API te vereisen. Omdat `alerts` in `musicdbschema.sql` aanwezig is, kan ART-015C een alert-record schrijven.

Voor succesvolle merge:

```text
app_key: artist
module_key: artist-merge
title: Artiesten merge uitgevoerd
severity: info
body: "Redundant → Replacement, X records aangepast."
```

Voor hoge impact kan severity `warning` worden gebruikt.

### 9.2 Mail

Mail wordt in ART-015C functioneel voorbereid, maar niet hard gekoppeld zolang het definitieve Shellstarter mailmechanisme niet is vastgesteld. Mogelijke latere opties:

- Shellstarter leest `alerts` en verstuurt mail op basis van regels;
- Artiesten-app schrijft een outbox/message-record;
- Artiesten-app roept een Shellstarter API aan.

Advies v1:

- alert direct ondersteunen;
- mail als vervolgkeuze documenteren;
- geen harde afhankelijkheid op Shellstarter-mail in de merge-transactie.

## 10. Implementatieplan

### Stap 1 — Migratie

- Voeg `ar_merged_into_artist_key`, `ar_merged_at`, `ar_merge_note` toe.
- Maak `artist_merge_history`.
- Voeg orphan-check SQL toe.
- Voeg FK-hardening als `NOT VALID` migratievoorstel toe, maar pas valideren na akkoord.
- Docker-proof migratiescript toevoegen voor ART-015C.

### Stap 2 — Backend service

Nieuwe servicefunctie:

```text
mergeArtists({ redundantArtistKey, replacementArtistKey, reason, actor, confirmedImpactHash, notify })
```

Alle mutaties gebeuren via één database-client binnen één transactie.

### Stap 3 — Controller/API

- `POST /api/artists/merge/execute` toevoegen.
- Input valideren met zod.
- Alleen uitvoeren na geldige impact/conflictcontrole.

### Stap 4 — Frontend

- In ART-015B impactpaneel knop toevoegen: “Merge uitvoeren”.
- Duidelijke waarschuwing en bevestigingsdialoog.
- Na succes: lijst en relatiepanelen herladen.
- Toon merge-id en affected counts.

### Stap 5 — Tests

Minimaal:

- contracttest dat merge-endpoint bestaat;
- model/service-test dat `BEGIN`, `COMMIT`, `ROLLBACK` gebruikt;
- test dat `file_details`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items` in scope zitten;
- test dat `file_details_version_group_validations` reset/invalidate krijgt;
- test dat `artist_merge_history`, `admin_audit_log` en `alerts` worden geschreven;
- test dat `artiesten_spelling` conflictregels gedocumenteerd/geïmplementeerd zijn;
- test dat geen merge plaatsvindt als keys gelijk zijn;
- test dat bij fout rollback plaatsvindt.

## 11. Acceptatiecriteria ART-015C

- Merge is één transactie.
- Geen gedeeltelijke updates bij fout.
- Impactscan wordt server-side opnieuw uitgevoerd vlak vóór merge.
- Redundante artiest wordt niet hard verwijderd maar gemarkeerd als merged/deleted.
- `file_details.fd_correct_artist` wordt gesynchroniseerd naar de replacement artist name.
- Geraakte version-group-validations worden gereset/geïnvalideerd.
- Merge-history wordt vastgelegd.
- Generieke audit wordt vastgelegd.
- Shellstarter-alert wordt aangemaakt.
- Mail is functioneel voorbereid maar niet verplicht geïmplementeerd in v1.
- FK-hardening is als migratievoorstel en orphan-check uitgewerkt.

## 12. Besluit voor volgende stap

Na akkoord op dit ontwerp kan ART-015C worden gebouwd als code-sprint. Daarbij moet de migratie vóór de app-start of vóór het testen worden uitgevoerd in Docker PostgreSQL.

---

## ART-015C-1 implementatiebesluit: transactionele merge-service

ART-015C-1 implementeert de merge-uitvoering als één backend-servicefunctie. De frontend voert dus geen losse update-acties uit. De flow is:

```text
impactscan bekijken
→ reden invullen
→ expliciet bevestigen
→ POST /api/artists/merge/execute
→ backend valideert opnieuw
→ BEGIN
→ lock redundant + replacement artist FOR UPDATE
→ update afgesproken scope
→ schrijf history/audit/alert
→ COMMIT
```

Bij elke fout geldt:

```text
ROLLBACK
→ geen gedeeltelijke merge
→ gebruiker krijgt foutmelding
```

### Implementatie-scope v1

De transactionele service werkt de volgende onderdelen bij:

| Onderdeel | Actie |
|---|---|
| `file_details.fd_artist_key` | redundante key vervangen door replacement key |
| `file_details.fd_correct_artist` | synchroniseren naar replacement artist name |
| `artiesten_spelling.as_artist_key` | spellingen overzetten naar replacement artist |
| conflicterende `artiesten_spelling` | dubbele spellingen bij replacement verwijderen/ontdubbelen vóór update |
| `hitlijsten.ar_artist_key` | vervangen door replacement key |
| `staging_hitlijsten.hl_artist_key` | vervangen door replacement key |
| `import_scan_items.fd_artist_key` | vervangen door replacement key |
| `import_scan_items.fd_correct_artist` | synchroniseren naar replacement artist name |
| `file_details_version_group_validations` | geraakte validaties resetten/invalideren |
| `artist` | redundante artiest markeren als merged/deleted |
| `artist_merge_history` | merge historisch vastleggen |
| `admin_audit_log` | generieke audit vastleggen |
| `alerts` | Shellstarter-alert klaarzetten |

### Redundante artiest

De redundante artiest wordt niet hard deleted. De record blijft bestaan als historische verwijzing:

```text
ar_is_deleted = true
ar_deleted_at = now()
ar_merged_into_artist_key = replacement_artist_key
ar_merged_at = now()
ar_merge_note = merge reason
ar_is_favorite = false
```

Als de redundante artiest favoriet was en de replacement niet, dan neemt de replacement de favorietstatus over.

### UI-bevestiging

De impactscan-offcanvas is uitgebreid met:

- verplicht redenveld;
- expliciete checkbox: impactscan gecontroleerd;
- knop `Merge uitvoeren`;
- resultaatmelding met merge-id en alert-id.

### Shellstarter alert

Bij succesvolle merge wordt een record in `alerts` aangemaakt:

```text
app_key = artist
module_key = artist-merge
title = Artiesten merge uitgevoerd
severity = info of warning
```

Severity wordt `warning` bij hoge impact of opgeloste spellingconflicten. E-mail blijft voorbereid maar niet hard gekoppeld totdat het Shellstarter-mailcontract definitief is.
