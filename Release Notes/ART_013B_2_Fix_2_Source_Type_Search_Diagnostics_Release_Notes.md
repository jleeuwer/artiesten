# ART-013B-2-Fix-2

- Breidt `ck_musician_in_band_source_type` uit met `discogs`, `musicbrainz` en `wikidata`.
- Voegt functionele migratiediagnostiek toe voor ontbrekende proposal/source-tabellen.
- Zoekt bandleden gecombineerd in `musician` en `artist`.
- Toont persoonsartists zonder musician met transactionele create-and-link flow.
- Toont artists met een ander type als niet-selecteerbare datakwaliteitswaarschuwing.
