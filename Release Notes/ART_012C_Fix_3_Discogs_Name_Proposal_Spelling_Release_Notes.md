# ART-012C-Fix-3 — Discogs naamvoorstel en artiestenspelling

## Samenvatting

Deze fix borgt dat Discogs artist names alleen als voorstel worden gebruikt. De actie **Koppel Discogs artist** registreert een externe Discogs-bron en cachemetadata, maar wijzigt de lokale canonical artist name niet.

## Functionele wijzigingen

- UI-tekst in het Discogs-koppelpaneel verduidelijkt:
  - Discogs-namen zijn voorstellen;
  - lokale artist keys en artistnaam worden niet overschreven;
  - canonical naamwijzigingen lopen via artiestenspelling.
- Documentatie aangescherpt rond het `artiesten_spelling`-model.
- Nieuw backlog-item toegevoegd:
  - ART-012D — Discogs naamvoorstellen en artiestenspelling toepassen.

## Ontwerpbesluit

Een Discogs artist name mag nooit rechtstreeks `artist.ar_artist_name` overschrijven. Een toekomstige canonical rename moet via een spelling-aware flow lopen die:

- de oude canonical naam bewaart als alternatieve spelling;
- de nieuwe canonical naam borgt in `artiesten_spelling`;
- conflicten op `artiesten_spelling.as_alternatieve_spelling` controleert;
- de gebruiker expliciet laat bevestigen;
- de wijziging auditeert.

## Migratie

Geen nieuwe SQL-migratie nodig.
