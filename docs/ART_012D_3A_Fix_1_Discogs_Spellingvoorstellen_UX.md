# ART-012D-3A-Fix-1 — Discogs spellingvoorstellen UX-verduidelijking

## Aanleiding

Tijdens testen bleek de functionele flow rond Discogs spellingvoorstellen niet vanzelfsprekend genoeg. De knoppen **Voeg toe als spelling** en **Preview canonical** verschijnen pas nadat een Discogs artist aan de lokale artiest is gekoppeld en spellingvoorstellen zijn geladen. Functioneel is dat correct, maar de UI gaf vóór die stap onvoldoende uitleg.

## Ontwerpregel

Discogs-koppeling, alternatieve spelling en canonical rename blijven drie gescheiden acties:

1. **Koppel Discogs artist**: slaat de externe Discogs-bron en cachedata op.
2. **Voeg toe als spelling**: voegt een beschikbaar Discogs-naamvoorstel toe aan `artiesten_spelling`.
3. **Preview canonical**: toont alleen de impact van een mogelijke canonical rename; er worden geen mutaties uitgevoerd.

`artist.ar_artist_name` wordt nooit automatisch aangepast door Discogs-koppeling of preview.

## UI-aanpassingen

### Zonder gekoppelde Discogs-referentie

De UI toont nu expliciet:

> Koppel eerst een Discogs artist voordat spellingvoorstellen beschikbaar zijn. Na koppeling kun je Discogs-namen als spellingvoorstel beoordelen.

### Na koppeling

Na **Koppel Discogs artist**:

- wordt het relatiepaneel opnieuw geladen;
- worden spellingvoorstellen automatisch opnieuw opgehaald;
- toont de succesmelding dat de gebruiker spellingvoorstellen kan beoordelen.

### Bij spellingvoorstellen

De sectie **Discogs naamvoorstellen** legt nu uit:

- **Voeg toe als spelling** wijzigt alleen `artiesten_spelling`;
- **Preview canonical** toont alleen impact en voert geen wijziging uit;
- canonical rename blijft een aparte spelling-aware flow.

## Acceptatiecriteria

- De gebruiker ziet vóór koppelen waarom spellingvoorstellen nog niet beschikbaar zijn.
- Na koppelen wordt de vervolgactie duidelijk gemaakt.
- De actie **Voeg toe als spelling** blijft beschikbaar bij `available_discogs_name` en `available_alternative_spelling`.
- De actie **Preview canonical** blijft beschikbaar voor geschikte voorstellen.
- De documentatie bevat de volledige flow:
  `Zoek in Discogs → Detail bekijken → Koppel Discogs artist → Toon spellingvoorstellen → Voeg toe als spelling → Preview canonical`.
