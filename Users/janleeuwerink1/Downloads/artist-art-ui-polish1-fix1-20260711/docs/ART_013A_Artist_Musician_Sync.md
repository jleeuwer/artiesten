# ART-013A — One-way artist → musician sync

## Doel

ART-013A voorkomt dubbele onderhoudslast wanneer een `artist` ook een bestaande gekoppelde `musician` representeert. Bij een update van de persoonsartiest worden de basisgegevens van de gekoppelde musicus automatisch bijgewerkt.

De synchronisatie is bewust klein en veilig gehouden.

## Ontwerpbesluit

Synchronisatie loopt uitsluitend één richting op:

```text
artist → musician
```

Er komt nooit bidirectionele synchronisatie, omdat niet elke `musician` ook een `artist` is. Een musicus kan bijvoorbeeld alleen historisch onderdeel zijn van een band via `musician_in_band`.

## Functionele regels

1. Synchronisatie gebeurt alleen bij `UPDATE` van een bestaande `artist`.
2. Synchronisatie gebeurt alleen als `artist.ar_artist_type = 'person'`.
3. Synchronisatie gebeurt alleen als er al een gekoppelde musician bestaat met `musician.ar_artist_key = artist.ar_artist_key`.
4. Er worden geen musician-records automatisch aangemaakt.
5. Verwijderen, mergen of deactiveren van een artist synchroniseert niets naar `musician`.
6. Een bestaande `musician` blijft bestaan, ook als de gekoppelde artist wordt verwijderd of samengevoegd, omdat bandrelaties historisch geldig kunnen blijven via `musician_in_band`.
7. De synchronisatie wordt in PostgreSQL uitgevoerd via een trigger/functie, zodat updates via app, script of pgAdmin hetzelfde gedrag hebben.

## Gesynchroniseerde velden

| Artist | Musician | Opmerking |
|---|---|---|
| `ar_artist_name` | `mu_musician_name` | Naam van dezelfde persoon |
| `ar_artist_dateofbirth` | `mu_musician_dateofbirth` | Alleen als artistwaarde gevuld is; bestaande musicianwaarde blijft behouden bij lege artistwaarde |
| `ar_artist_passing` | `mu_musician_passing` | Sterfdatum mag leeg zijn |
| `ar_website_url` | `mu_website_url` | Website wordt één-op-één gevolgd |

## Bewust niet gesynchroniseerd

| Veld | Reden |
|---|---|
| `ar_artist_notes` → `mu_musician_notes` | Notities kunnen een andere context hebben |
| favoriet-status | Hoort bij artist/collectiegebruik |
| Discogs/externe brondata | Externe artistdata is niet automatisch musiciandata |
| delete/merge/deactiveer-status | Musician moet historisch kunnen blijven bestaan |

## Technische implementatie

De migratie voegt toe:

- `public.fn_artist_sync_to_musician()`;
- trigger `trg_artist_sync_to_musician` op `public.artist`.

De trigger draait `AFTER UPDATE` op relevante artistvelden:

- `ar_artist_name`;
- `ar_artist_dateofbirth`;
- `ar_artist_passing`;
- `ar_website_url`;
- `ar_artist_type`.

De trigger update alleen bestaande `musician`-records. Er is geen trigger op `musician` en er is geen delete-trigger.

## Belangrijke technische keuze rond geboortedatum

In het huidige schema is `musician.mu_musician_dateofbirth` verplicht (`NOT NULL`). Daarom wordt bij een lege `artist.ar_artist_dateofbirth` de bestaande musician-geboortedatum behouden. De trigger verzint geen placeholderdatum en blokkeert ook de artist-update niet.


ART-013A ontwerpnotitie: er is geen automatische aanmaak van musician-records.
