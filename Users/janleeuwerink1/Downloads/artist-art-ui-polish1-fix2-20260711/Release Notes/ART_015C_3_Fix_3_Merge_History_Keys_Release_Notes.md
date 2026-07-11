# ART-015C-3-Fix-3 — Mergehistorie artist keys en impactdetails

## Aanleiding

Bij het testen van een artist merge was niet direct zichtbaar welke `artist_key` redundant was en welke `artist_key` leidend/canonical is geworden. Daardoor was controle via `artist_merge_history` en `artiesten_spelling` minder duidelijk dan gewenst.

## Wijzigingen

- De merge-resultaatmelding toont nu expliciet:
  - `merge_id`;
  - redundante artist key + naam;
  - leidende/replacement artist key + naam;
  - affected counts uitgesplitst per scope;
  - alert-id en severity.
- De mergehistoriekaart in het relatiepaneel toont nu expliciet:
  - merge-id;
  - redundante artist key;
  - leidende artist key;
  - richting van de merge;
  - leesbare affected-count details.
- De bestaande transactionele mergeflow is niet inhoudelijk gewijzigd.
- Er is geen nieuwe SQL-migratie nodig.

## Validatie

Nieuwe/uitgebreide contracttest:

```bash
npm run test:art015c3:fix3
```

Daarnaast blijven de bestaande ART-015C tests geldig.
