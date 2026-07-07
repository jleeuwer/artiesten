# ART-012E-4-Fix-3 — Date apply direct persistence

## Opgelost

Geboorte- en sterfdatumvoorstellen worden nu via een expliciete, directe update op de lokale `artist`-tabel toegepast.

De apply-flow:

1. lockt de betreffende artist row met `FOR UPDATE`;
2. leest de actuele lokale datum;
3. vraagt expliciete overwrite-bevestiging wanneer de lokale datum al gevuld en afwijkend is;
4. voert daarna een directe `UPDATE public.artist SET <datumveld> = $2::date` uit;
5. controleert na de update dat de waarde daadwerkelijk als `YYYY-MM-DD` is opgeslagen.

## Velden

- `artist.ar_artist_dateofbirth`
- `artist.ar_artist_passing`

## Geen migratie

Deze fix bevat alleen backend/applicatielogica en tests. Er is geen nieuwe database-migratie nodig.
