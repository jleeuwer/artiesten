# Release Notes — ART-015D-2B Duplicate reviewqueue

## Inhoud

Deze release voegt een reviewqueue toe voor candidates die door de periodieke duplicate scanner zijn gevonden.

## Toegevoegd

- Knop **Duplicate reviewqueue** in de Artiesten-app.
- Reviewqueue zijpaneel met filters op status, naam en score.
- API endpoints:
  - `GET /api/artists/duplicate-candidates`
  - `PATCH /api/artists/duplicate-candidates/:candidateId/status`
- Statusacties:
  - `reviewing`
  - `not_duplicate`
  - `ignored`
- Merge vanuit reviewqueue met optionele `duplicateCandidateId`.
- Succesvolle merge zet de candidate transactioneel op `merged` en vult `merge_id`.

## Migratie

Er is geen nieuwe SQL-migratie nodig. ART-015D-1 en ART-015D-2A moeten al zijn toegepast.
