# ART-012D-4-Fix-1 — Name proposal reviewqueue hardening

## Doel

De Discogs naamvoorstellen-reviewqueue is aangescherpt zodat aliases, real names en name variations veiliger en overzichtelijker kunnen worden afgehandeld.

## Functioneel

Toegevoegd:

- filters op status;
- filters op voorsteltype;
- zoekveld op voorstelnaam, toelichting en conflictartiest;
- tellers per status;
- compacte tabelweergave;
- duidelijke conflictinformatie;
- actie **Heropen** voor `ignored` en `review_later` voorstellen;
- blokkade op **Voeg toe als spelling** wanneer een voorstel conflicteert met een spelling van een andere artiest;
- directe refresh van relatie-inzicht en spellingpaneel na toevoegen als spelling.

## Statussen

- `new`: voorstel kan beoordeeld worden;
- `added`: voorstel is toegevoegd aan `artiesten_spelling`;
- `ignored`: voorstel is genegeerd;
- `conflict`: spelling bestaat bij een andere artiest;
- `review_later`: later beoordelen;
- `existing`: spelling bestaat al bij deze artiest of is canonical;
- `invalid`: voorstel is leeg of ongeldig.

## Conflictdetectie

Conflictdetectie vindt plaats bij genereren én opnieuw bij toepassen. De apply-flow vertrouwt dus niet alleen op de oude status in `artist_name_proposals`, maar controleert live of `artiesten_spelling.as_alternatieve_spelling` inmiddels door een andere artiest wordt gebruikt.

## Technisch

- Nieuwe migratie: `scripts/sql/20260608_art012d4_fix1_name_proposal_reviewqueue_hardening.sql`.
- Nieuw script: `scripts/db-migrate-art012d4-fix1-docker.sh`.
- Nieuw testscript: `npm run test:art012d4:fix1`.
- `listDiscogsNameProposals` ondersteunt `status`, `type` en `q` filters.
- `applyDiscogsNameProposalAsSpelling` is transactioneel en gebruikt `FOR UPDATE`.
