# ART-013B-2-Fix-5 — Artist-aware Discogs member matching

Discogs-bandleden worden nu ook gematcht met bestaande artists, ongeacht het huidige artisttype. De matching gebruikt Discogs-ID, canonical naam en alternatieve spellingen.

- `person` zonder musician: voorstel `matched_artist_person`; bij acceptatie wordt transactioneel een musician aangemaakt en gekoppeld.
- leeg of `unknown`: voorstel `artist_type_missing`; acceptatie geblokkeerd tot correctie.
- band/group/duo/trio/alias/project: voorstel `artist_type_conflict`; acceptatie geblokkeerd.
- na correctie kan `Zoek via Discogs` opnieuw worden uitgevoerd om het voorstel opnieuw te classificeren.

Database: herhaal `npm run db:migrate:art013b2` om `proposed_artist_key` en de nieuwe matchstatussen toe te voegen.
