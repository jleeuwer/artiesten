# ART-012D-3A — Canonical rename preview implementatie

## Doel

ART-012D-3A voegt een veilige preview toe voor het mogelijk canonical maken van een Discogs-naam. De preview voert **geen mutaties** uit op `artist` of `artiesten_spelling`.

De gebruiker kan vanuit de tabel **Discogs naamvoorstellen** een voorstel openen met de actie **Preview canonical**. De app toont daarna wat een toekomstige spelling-aware canonical rename zou doen en of de actie later uitvoerbaar lijkt.

## Functionele regels

- `Koppel Discogs artist` blijft gescheiden van canonical rename.
- Discogs artist names blijven voorstellen.
- `artist.ar_artist_name` wordt in deze sprint niet gewijzigd.
- `artiesten_spelling` wordt in deze sprint niet gewijzigd.
- De preview controleert conflicten voordat een toekomstige muterende flow wordt gebouwd.
- De oude canonical naam moet in de toekomstige muterende flow behouden blijven als alternatieve spelling.
- De nieuwe canonical naam moet in de toekomstige muterende flow geborgd worden in `artiesten_spelling`.

## UI

In de sectie **Discogs naamvoorstellen** is een extra actie beschikbaar:

- **Preview canonical**

Deze actie is beschikbaar bij voorstellen die relevant zijn als mogelijke canonical naam, zoals Discogs artist name of bestaande eigen alternatieve spellingen.

De preview toont:

- huidige canonical naam;
- voorgestelde canonical naam;
- status: uitvoerbaar in toekomstige transactie of geblokkeerd;
- blokkades/conflicten;
- waarschuwingen;
- spelling-aware plan.

## API

Nieuw endpoint:

```http
POST /api/artists/:id/discogs/spelling-proposals/canonical-preview
```

Payload:

```json
{
  "proposedName": "Daryl Hall & John Oates"
}
```

Respons bevat onder andere:

```json
{
  "preview_only": true,
  "no_mutations": true,
  "current_canonical_name": "Hall & Oates",
  "proposed_canonical_name": "Daryl Hall & John Oates",
  "can_execute_later": true,
  "blocked": false,
  "blocks": [],
  "warnings": [],
  "spelling_plan": {
    "preserve_old_canonical_as_spelling": true,
    "ensure_new_canonical_in_spelling": true
  },
  "transaction_plan": []
}
```

## Conflictcontroles

De preview controleert minimaal:

- voorgestelde naam is gelijk aan huidige canonical naam;
- voorgestelde naam bestaat al als `artist.ar_artist_name` bij een andere artist;
- voorgestelde naam bestaat al als `artiesten_spelling.as_alternatieve_spelling` bij een andere artist;
- huidige canonical naam ontbreekt nog als eigen spelling en moet later geborgd worden.

## Geen migratie

ART-012D-3A introduceert geen nieuwe SQL-migratie. De sprint gebruikt bestaande tabellen:

- `artist`
- `artiesten_spelling`
- `artist_external_reference`
- `artist_enrichment_cache`

## Vervolg

De logische volgende sprint is **ART-012D-3B — spelling-aware canonical rename uitvoeren**. Daarin wordt de preview omgezet naar een transactionele mutatie met auditlogging.
