# ART-015D-2B — Duplicate reviewqueue in de Artiesten-app

## Doel

ART-015D-2B maakt de resultaten van de periodieke duplicate scanner afwerkbaar in de Artiesten-app. De scanner blijft alleen kandidaten signaleren; de gebruiker beslist per candidate wat ermee gebeurt.

De reviewqueue hergebruikt bewust de bestaande ART-015B/ART-015C flow:

```text
scanner vindt kandidaten
→ artist_duplicate_candidates
→ reviewqueue in Artiesten-app
→ bestaande impactscan
→ bestaande transactionele merge
→ artist_merge_history / audit / alerts
→ candidate status bijgewerkt
```

## Functionele scope

### Reviewqueue openen

In het hoofdscherm is een knop **Duplicate reviewqueue** toegevoegd. Deze opent een zijpaneel met candidates uit `artist_duplicate_candidates`.

### Filters

De reviewqueue ondersteunt filters op:

- status;
- artiestnaam;
- minimale score.

Statuswaarden:

- `open` — verzameling van `new`, `reviewing`, `merge_planned`, `error`;
- `new`;
- `reviewing`;
- `merge_planned`;
- `not_duplicate`;
- `ignored`;
- `merged`;
- `all`.

### Informatie per candidate

Per candidate toont de UI minimaal:

- candidate-id;
- artiest A met artist key;
- artiest B met artist key;
- matchscore;
- matchmethode;
- matchreden;
- status;
- eerste keer gezien;
- laatste keer gezien;
- aantal keren gezien;
- gewicht per artiest.

### Acties per candidate

Per candidate kan de gebruiker:

- artiest A openen;
- artiest B openen;
- **Maak B leidend** starten via bestaande impactscan;
- **Maak A leidend** starten via bestaande impactscan;
- status zetten naar **In beoordeling**;
- status zetten naar **Geen dubbel**;
- status zetten naar **Negeren**.

De reviewqueue voert zelf geen aparte merge-logica uit. Bij een merge vanuit de reviewqueue wordt `duplicateCandidateId` meegegeven aan `POST /api/artists/merge/execute`, zodat de bestaande transactionele merge-service na succesvolle commit de candidate op `merged` kan zetten en `merge_id` vastlegt.

## Technisch ontwerp

### Nieuwe API endpoints

```text
GET   /api/artists/duplicate-candidates
PATCH /api/artists/duplicate-candidates/:candidateId/status
```

### Queryparameters `GET /api/artists/duplicate-candidates`

- `status`
- `search`
- `minScore`
- `scanRunId`
- `limit`
- `offset`

### Statusupdate

`PATCH /api/artists/duplicate-candidates/:candidateId/status` accepteert:

```json
{
  "status": "not_duplicate",
  "note": "Door gebruiker gemarkeerd als geen dubbel"
}
```

Bij eindstatussen `not_duplicate`, `ignored` en `merged` worden `reviewed_at` en `reviewed_by` gevuld.

### Mergekoppeling

`POST /api/artists/merge/execute` accepteert optioneel:

```json
{
  "redundantArtistKey": 123,
  "replacementArtistKey": 456,
  "reason": "impact gecontroleerd",
  "duplicateCandidateId": 789
}
```

Als `duplicateCandidateId` gevuld is, markeert de merge-service dezelfde candidate binnen dezelfde transactie als `merged` en vult `merge_id`.

## Niet in scope

Niet in deze sprint:

- automatische merge;
- scheduling/cron;
- alerts/mail voor scannerresultaten;
- reviewqueue bulkacties;
- Discogs artist enrichment;
- albums;
- muzikant/band-relaties.

## Acceptatiecriteria

- De reviewqueue is bereikbaar vanuit het hoofdscherm.
- Candidates kunnen gefilterd worden op status, naam en score.
- A/B-richting is zichtbaar en de gebruiker kiest expliciet welke artiest leidend wordt.
- `not_duplicate` en `ignored` kunnen vanuit de UI gezet worden.
- Merge vanuit de reviewqueue gebruikt de bestaande ART-015C transactionele merge-service.
- Na succesvolle merge wordt de candidate status `merged` en wordt `merge_id` vastgelegd.
