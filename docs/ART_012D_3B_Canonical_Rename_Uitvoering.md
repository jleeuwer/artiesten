# ART-012D-3B — Canonical rename uitvoeren via spelling-aware transactie

## Doel

ART-012D-3B voegt de daadwerkelijke uitvoering toe van een canonical artist name-wijziging op basis van een Discogs-naamvoorstel.

De actie blijft strikt gescheiden van **Koppel Discogs artist**. Koppelen registreert alleen Discogs als externe bron. Een canonical rename gebeurt alleen na preview en expliciete gebruikerbevestiging.

## Functionele flow

1. Gebruiker opent een lokale artiest.
2. Gebruiker koppelt een Discogs artist.
3. Gebruiker toont Discogs naamvoorstellen.
4. Gebruiker klikt **Preview canonical**.
5. Het systeem toont impact/conflicten zonder mutaties.
6. Als de preview niet geblokkeerd is, verschijnt **Maak canonical**.
7. Gebruiker bevestigt expliciet.
8. Backend voert de wijziging uit als één spelling-aware transactie.

## Transactionele regels

De uitvoering gebeurt in één database-transactie:

- lock `artist` met `FOR UPDATE`;
- controleer dat de nieuwe canonical naam niet al canonical is;
- controleer conflict op `artist.ar_artist_name`;
- controleer conflict op `artiesten_spelling.as_alternatieve_spelling`;
- behoud de oude canonical naam als alternatieve spelling;
- borg de nieuwe canonical naam in `artiesten_spelling`;
- update `artist.ar_artist_name`;
- schrijf audit indien beschikbaar;
- commit of rollback als één geheel.

Als één stap faalt, wordt alles teruggedraaid.

## Wat wordt gewijzigd

| Object | Wijziging |
|---|---|
| `artist.ar_artist_name` | Wordt aangepast naar de gekozen nieuwe canonical naam |
| `artiesten_spelling` | Oude canonical naam wordt behouden/toegevoegd als alternatieve spelling |
| `artiesten_spelling` | Nieuwe canonical naam wordt geborgd als spelling voor dezelfde artiest |
| `admin_audit_log` | Optionele auditregel als de tabel/schema beschikbaar is |

## Wat wordt niet automatisch gewijzigd

`file_details.fd_correct_artist` wordt niet automatisch aangepast. Dit veld kan historische of bestandsmetadata bevatten en wordt niet meegenomen in de canonical rename.

Historische stagingteksten, importregels, Discogs-cachedata en externe brondata worden ook niet herschreven.

## Conflictregels

De actie wordt geblokkeerd als:

- de voorgestelde naam al de huidige canonical naam is;
- een andere artist al dezelfde canonical naam heeft;
- de voorgestelde naam al als spelling aan een andere artist gekoppeld is;
- de oude canonical naam niet veilig als spelling kan worden geborgd;
- een unieke constraint faalt.

## UI

De previewkaart toont nu, als de preview uitvoerbaar is, de knop **Maak canonical**.

De gebruiker krijgt vooraf een browserbevestiging. Na succes toont de UI een resultaatmelding en worden artiestenlijst, relatiepaneel en spellingvoorstellen opnieuw geladen.

## Geen nieuwe SQL-migratie

ART-012D-3B gebruikt de bestaande tabellen `artist`, `artiesten_spelling` en optioneel `admin_audit_log`. Er is geen nieuwe SQL-migratie nodig.
