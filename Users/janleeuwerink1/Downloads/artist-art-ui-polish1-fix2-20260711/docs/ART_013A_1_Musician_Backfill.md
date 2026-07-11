# ART-013A-1 — Idempotente musician backfill vanuit person artists

## Doel

ART-013A synchroniseert bestaande gekoppelde musicians wanneer een `person` artist wordt bijgewerkt. Als de tabel `musician` leeg is, heeft die trigger nog geen praktisch effect. ART-013A-1 vult daarom gecontroleerd ontbrekende musician-records vanuit bestaande artists met:

```text
artist.ar_artist_type = 'person'
```

De backfill is idempotent: het script mag periodiek of handmatig opnieuw worden uitgevoerd en voegt alleen musicians toe die nog ontbreken.

## Ontwerpbesluiten

- De bestaande ART-013A sync blijft één richting: `artist → musician`.
- Er komt geen bidirectionele synchronisatie.
- De trigger maakt nog steeds geen musicians aan.
- De backfill is een expliciet onderhoudsscript, geen automatische triggeractie.
- Alleen `person` artists komen in aanmerking.
- Alleen artists zonder gekoppelde musician worden toegevoegd.
- Een gekoppelde musician wordt herkend via `musician.ar_artist_key = artist.ar_artist_key`.
- Bestaande musician-records worden niet overschreven.
- Musicians worden nooit verwijderd door deze backfill.
- Delete/merge/deactiveren van artist blijft buiten scope; musician blijft historisch bruikbaar voor `musician_in_band`.

## Waarom geboortedatum nullable wordt

In het huidige model kan `musician.mu_musician_dateofbirth` verplicht zijn. Voor veel persoonsartiesten is de geboortedatum echter onbekend. ART-013A-1 maakt dit veld daarom nullable:

```sql
ALTER TABLE public.musician
  ALTER COLUMN mu_musician_dateofbirth DROP NOT NULL;
```

Er worden geen placeholderdatums gebruikt. Een onbekende geboortedatum blijft `NULL`.

## Unieke koppeling

Om dubbele linked musicians te voorkomen wordt een partial unique index toegevoegd:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_musician_ar_artist_key_not_null
  ON public.musician (ar_artist_key)
  WHERE ar_artist_key IS NOT NULL;
```

Hierdoor kan een artist maximaal één gekoppelde musician hebben. Standalone musician-records zonder `ar_artist_key` blijven mogelijk.

## Backfill-gedrag

Preview:

```bash
mkdir -p logs && npm run musician:backfill:preview 2>&1 | tee "logs/musician-backfill-preview-$(date +%Y%m%d-%H%M%S).log"
```

Execute:

```bash
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-$(date +%Y%m%d-%H%M%S).log"
```

Het execute-script gebruikt `NOT EXISTS` en `ON CONFLICT DO NOTHING`. Daardoor is opnieuw uitvoeren veilig.

## Velden bij nieuwe musician

| Artist | Musician |
|---|---|
| `ar_artist_key` | `ar_artist_key` |
| `ar_artist_name` | `mu_musician_name` |
| `ar_artist_dateofbirth` | `mu_musician_dateofbirth` |
| `ar_artist_passing` | `mu_musician_passing` |
| `ar_website_url` | `mu_website_url` |
| geen mapping | `mu_musician_notes = NULL` |

Notes worden bewust niet gekopieerd. Artist-notities en musician-notities kunnen een andere context hebben.

## Buiten scope

- Geen UI-wijzigingen.
- Geen automatische musician-aanmaak in de trigger.
- Geen sync van musician naar artist.
- Geen delete-sync.
- Geen merge-sync.
- Geen automatische relaties in `musician_in_band`.


Ontwerpnotitie: geen automatische aanmaak via trigger; de backfill is een expliciete onderhoudsactie.
