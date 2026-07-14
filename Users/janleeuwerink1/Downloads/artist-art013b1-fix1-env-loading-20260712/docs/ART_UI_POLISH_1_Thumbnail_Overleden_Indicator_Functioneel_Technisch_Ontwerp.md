# ART-UI-POLISH-1 — Profielfoto-thumbnail en overleden-indicator

Datum: 2026-07-11  
Status: functioneel en technisch uitgewerkt; code-implementatie volgt in de volgende codesprint

## 1. Aanleiding

De artiestenlijst bevat inmiddels Discogs-koppeling, artist type, favorieten, gewicht en relationele informatie. De gekozen primaire Discogs-profielfoto is echter alleen zichtbaar in detail-/editcontext. Ook is in de lijst niet direct herkenbaar of een artiest is overleden.

Deze sprint verbetert de herkenbaarheid van artiesten in de bestaande compacte tabel zonder de rijhoogte, informatiedichtheid of bestaande interacties negatief te beïnvloeden.

## 2. Sprintdoel

Voeg aan iedere artiestenrij twee compacte visuele signalen toe:

1. een kleine profielfoto-thumbnail op basis van de primaire externe artist image;
2. een overleden-indicator wanneer `artist.ar_artist_passing` is gevuld.

De uitbreiding moet performant zijn, mag geen N+1-query veroorzaken en moet correct blijven werken met zoeken, sorteren, filteren, pagineren en embedded Shellstarter-weergave.

## 3. Scope

### 3.1 In scope

- Thumbnail helemaal links in de artiestenrij.
- Primaire afbeelding uit `artist_external_image` gebruiken.
- Neutrale fallback-avatar bij ontbrekende of niet-ladende afbeelding.
- Vaste thumbnailafmetingen en vaste tabelrijhoogte.
- `loading="lazy"` en niet-blokkerende foutafhandeling.
- Overleden-indicator wanneer `ar_artist_passing` een geldige niet-lege waarde bevat.
- Bootstrap Icon `bi-hourglass-bottom`.
- Tooltiptekst `Artiest overleden`.
- Backend-lijstcontract uitbreiden met maximaal één primaire image-URL.
- Directe lijstrefresh nadat een andere primaire profielfoto is gekozen.
- Contract-, component- en browsergerichte testbasis.
- Documentatie, backlog en projectnotities bijwerken.

### 3.2 Buiten scope

- Nieuwe image-uploadfunctionaliteit.
- Lokale opslag of caching van externe afbeeldingen.
- Image crop-editor.
- Fullscreen image viewer of nieuwe detailmodal.
- Wijzigen van geboorte- of sterfdatum.
- Nieuw databaseveld voor overleden-status.
- Nieuwe database-entiteit of migratie.
- Herontwerp van de volledige artiestentabel.
- ART-012D-4 reviewqueue-validatie.
- ART-013B musician-in-band uitbreiding.

## 4. Functioneel ontwerp

### 4.1 Thumbnailpositie

De thumbnail wordt weergegeven in de eerste visuele tabelkolom, vóór de bestaande status-, favoriet-, Discogs- en naamvelden.

Voorkeursvolgorde binnen de compacte identiteitscel:

```text
[thumbnail] [overleden-indicator indien van toepassing] [bestaande rij-inhoud]
```

Wanneer de bestaande tabelstructuur aparte kolommen vereist, mogen thumbnail en overleden-indicator in één nieuwe compacte kolom worden gecombineerd. Het functionele resultaat is leidend: beide signalen staan aan het begin van de rij en vergroten de rijhoogte niet.

### 4.2 Bron van de afbeelding

De lijst gebruikt uitsluitend de afbeelding waarvoor geldt:

```text
artist_external_image.is_primary = true
```

Wanneer meerdere primaire afbeeldingen door historische datavervuiling bestaan, levert het backendcontract deterministisch maximaal één record terug. De bestaande unieke index blijft de primaire datakwaliteitsbescherming.

De frontend kiest nooit zelf de eerste afbeelding uit een image-array. Het backend levert één expliciete `primary_image_url` of `null`.

### 4.3 Fallback-avatar

Een fallback wordt getoond wanneer:

- geen primaire afbeelding bestaat;
- de URL leeg of `null` is;
- de browser de externe afbeelding niet kan laden;
- de response geen imageveld bevat door compatibiliteit met een oudere backend.

De fallback is visueel neutraal en gebruikt bij voorkeur een lokaal icoon of CSS-oplossing, zodat geen extra externe netwerkrequest nodig is.

### 4.4 Afmetingen en rijhoogte

Aanbevolen visuele maat:

```text
28 × 28 px
```

Toegestane implementatiemarge:

```text
28–32 px
```

Voorwaarden:

- vaste breedte en hoogte;
- `object-fit: cover`;
- rond of licht afgerond;
- geen layout shift tijdens laden;
- de bestaande tabelrijhoogte mag functioneel niet toenemen.

### 4.5 Overleden-indicator

De indicator wordt getoond wanneer:

```text
ar_artist_passing IS NOT NULL
```

en de waarde na normalisatie niet leeg is.

Icoon:

```html
<i class="bi bi-hourglass-bottom" aria-hidden="true"></i>
```

Toegankelijke naam en tooltip:

```text
Artiest overleden
```

De sterfdatum blijft op de bestaande plaats zichtbaar. Het icoon vervangt de datum niet.

### 4.6 Toegankelijkheid

- Thumbnail heeft een betekenisvolle `alt`, bijvoorbeeld `Profielfoto van <artiestnaam>`.
- Fallback-avatar heeft dezelfde semantische alttekst of wordt decoratief gebruikt naast een toegankelijke artiestnaam.
- Het overleden-icoon heeft een screenreadertekst of `aria-label`.
- Tooltip is aanvullende informatie en niet de enige toegankelijke aanduiding.
- Keyboardnavigatie en bestaande rijacties blijven intact.

### 4.7 Interactie

De thumbnail is in deze sprint primair informatief.

Voorkeursbesluit:

- geen afzonderlijke klikactie toevoegen;
- bestaande rijselectie of detailactie blijft leidend;
- klikken op de thumbnail mag de bestaande rijselectie activeren indien de huidige tabel dat al via event bubbling ondersteunt;
- er wordt geen nieuwe image-modal geïntroduceerd.

### 4.8 Directe refresh

Nadat in ART-012E-2 een andere primaire image is gekozen:

- wordt de geselecteerde artiestdetailstate bijgewerkt;
- wordt ook de artiestenlijst opnieuw opgehaald of lokaal veilig bijgewerkt;
- toont de lijst zonder volledige browserrefresh de nieuwe thumbnail.

### 4.9 Embedded en responsive gedrag

- De nieuwe identiteitscel blijft zichtbaar in standalone en Shellstarter embedded mode.
- Op kleinere breedte mag tekst worden afgekapt, maar thumbnail en statusindicator mogen niet vervormen.
- De uitbreiding veroorzaakt geen horizontale overflow buiten de bestaande tabelregels.

## 5. Functionele regels

| Regel | Beschrijving |
|---|---|
| UI-P1-FR-01 | Per artiest wordt maximaal één thumbnail getoond. |
| UI-P1-FR-02 | Alleen de primaire externe image mag als thumbnail worden gebruikt. |
| UI-P1-FR-03 | Zonder bruikbare image wordt altijd een fallback getoond. |
| UI-P1-FR-04 | Een image-loadfout wordt zonder kapot image-icoon afgehandeld. |
| UI-P1-FR-05 | `ar_artist_passing` gevuld betekent: overleden-indicator tonen. |
| UI-P1-FR-06 | `ar_artist_passing` leeg of null betekent: geen overleden-indicator. |
| UI-P1-FR-07 | Thumbnail en indicator vergroten de tabelrij niet. |
| UI-P1-FR-08 | Een nieuwe primaire image wordt na opslaan direct zichtbaar in de lijst. |
| UI-P1-FR-09 | Bestaande favoriet-, Discogs-, edit-, selecteer- en sorteeracties blijven werken. |
| UI-P1-FR-10 | De lijstquery levert images in dezelfde query-/requestflow en veroorzaakt geen request per rij. |

## 5.1 Gerealiseerde oplossing

De bestaande lijstquery leverde `primary_image_url` en `primary_image_id` al via één begrensde `LEFT JOIN LATERAL`. Daarom is voor deze sprint geen databasemigratie nodig. De concrete implementatie bestaat uit:

- `ArtistListIdentityVisual` in `ArtistPageContent.jsx`;
- een vaste profielkolom links in de artiestentabel;
- een 32×32 thumbnail met `loading="lazy"` en `object-fit: cover`;
- lokale `imageFailed` state die wordt gereset wanneer de URL wijzigt;
- een toegankelijke fallback-avatar bij een ontbrekende of defecte URL;
- een hourglass-indicator bij een gevulde `ar_artist_passing`;
- directe lokale lijst- en selectiestate-update na het kiezen van een andere primaire image;
- geïsoleerde CSS-klassen zonder globale `img`, `td` of `tr` overrides.

## 6. Technisch ontwerp

### 6.1 Betrokken componenten

De exacte bestandsnamen worden tijdens implementatie bevestigd. Verwachte wijzigingsgebieden:

- backend artist list model/query;
- artist controller/list response;
- React artiestentabelcomponent;
- profielimage-keuzehandler uit ART-012E-2;
- CSS/module stylesheet voor compacte identiteitscel;
- backend contracttests;
- frontend componenttests;
- Playwright Chromium-tests.

### 6.2 API-contract

De bestaande artist list response wordt niet-brekend uitgebreid met:

```json
{
  "primary_image_url": "https://.../image.jpg"
}
```

Wanneer geen primaire image bestaat:

```json
{
  "primary_image_url": null
}
```

Optioneel kan intern ook een image-id worden geleverd wanneer dat nodig is voor caching of debug, maar dit is geen functionele vereiste:

```json
{
  "primary_image_id": 123,
  "primary_image_url": "https://.../image.jpg"
}
```

Bestaande velden en sorteringscontracten mogen niet wijzigen.

### 6.3 Querystrategie

Voorkeur: één `LEFT JOIN LATERAL` per artist list query:

```sql
LEFT JOIN LATERAL (
    SELECT aei.image_url
    FROM artist_external_image aei
    WHERE aei.ar_artist_key = a.ar_artist_key
      AND aei.is_primary = true
    ORDER BY aei.updated_at DESC NULLS LAST, aei.artist_external_image_key DESC
    LIMIT 1
) primary_image ON true
```

De werkelijke kolomnamen moeten worden afgestemd op het bestaande schema.

Alternatief is een vooraf geaggregeerde subquery of view. Niet toegestaan:

- per artiest een extra SQL-query;
- per rij een aparte API-call;
- alle images ophalen en in de frontend reduceren.

### 6.4 Deterministische selectie

Hoewel de bestaande unieke index maximaal één primaire image hoort af te dwingen, bevat de query een `ORDER BY ... LIMIT 1`. Dit voorkomt vermenigvuldiging van artiestenrijen bij historische of tijdelijk inconsistente data.

### 6.5 Frontendcomponent

Aanbevolen componentcontract:

```jsx
<ArtistIdentityVisual
  artistName={artist.ar_artist_name}
  imageUrl={artist.primary_image_url}
  isDeceased={Boolean(normalizeDateValue(artist.ar_artist_passing))}
/>
```

Het component beheert alleen presentatiestate, waaronder image-load failure. Het wijzigt geen artistgegevens.

### 6.6 Image error handling

Aanbevolen patroon:

- lokale state `imageFailed` begint als `false`;
- reset wanneer `imageUrl` wijzigt;
- `onError` zet `imageFailed=true`;
- bij `null` of failure wordt fallback gerenderd;
- voorkom een oneindige `onError`-loop door niet opnieuw dezelfde defecte URL toe te wijzen.

### 6.7 CSS-contract

Prefix nieuwe classes om globale regressies te voorkomen, bijvoorbeeld:

```text
artist-ui-polish1-identity
artist-ui-polish1-avatar
artist-ui-polish1-avatar-fallback
artist-ui-polish1-deceased
```

Minimale eigenschappen:

```css
.artist-ui-polish1-avatar {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  object-fit: cover;
}
```

Geen globale `img`, `td`, `tr` of Bootstrap-overschrijvingen toevoegen.

### 6.8 Refresh na primaire image-keuze

Na succesvolle primary-image mutatie wordt dezelfde centrale list refresh gebruikt als na andere artistwijzigingen. Wanneer de app momenteel lokale state patcht, moet minimaal `primary_image_url` worden bijgewerkt.

Voorkeur:

```text
mutatie succesvol → detail/image-state verversen → artist list refresh → selectie behouden
```

### 6.9 Performance

Acceptatievoorwaarden:

- één artist list API-request;
- geen extra frontend request per rij;
- geen extra backend query per artiest;
- queryplan blijft indexeerbaar op `artist_external_image.ar_artist_key` en `is_primary`;
- thumbnails gebruiken lazy loading;
- vaste dimensies beperken layout shift.

### 6.10 Beveiliging

- Image-URL wordt als normale `src` gebruikt en niet als HTML geïnjecteerd.
- Geen `dangerouslySetInnerHTML`.
- Geen proxy-endpoint of server-side download in deze sprint.
- Alttekst gebruikt normale React escaping.
- Externe image failures mogen de pagina niet laten crashen.

## 7. Voorgestelde implementatiestappen

1. Bestaande artist list query en image-schema exact inventariseren.
2. Backend response uitbreiden met `primary_image_url`.
3. Backendcontracttest toevoegen voor één, geen en meerdere historische primary records.
4. Compact frontendcomponent toevoegen.
5. Veilige image fallback en lazy loading implementeren.
6. Overleden-indicator met tooltip en aria-label implementeren.
7. CSS isoleren en rijhoogte vastleggen.
8. ART-012E-2 primary-image actie koppelen aan list refresh.
9. Componenttests toevoegen.
10. Playwrighttests voor tabelgedrag, refresh en embedded layout toevoegen.
11. Productiebuild en volledige regressiesuite uitvoeren.
12. Release-ZIP maken zonder runtime-artifacts.

## 8. Acceptatiecriteria

De sprintcode is geaccepteerd wanneer:

- iedere artiestenrij één thumbnail of fallback toont;
- uitsluitend de primaire image wordt gebruikt;
- defecte externe URLs visueel veilig worden afgehandeld;
- overleden artiesten een hourglass-indicator met toegankelijke tekst tonen;
- levende artiesten geen indicator tonen;
- rijhoogte niet toeneemt;
- image-keuze direct in de lijst zichtbaar wordt;
- geen N+1-query of request-per-row ontstaat;
- zoeken, sorteren, filteren, pagineren en rijacties blijven werken;
- standalone en embedded layout geen regressie tonen;
- contract-, component- en Chromium Playwrighttests slagen;
- documentatie en release notes zijn bijgewerkt;
- release-ZIP geen `node_modules`, `.env`, logs of macOS-metadata bevat.

## 9. Definition of Done

- Functionele regels aantoonbaar geïmplementeerd.
- API-contract gedocumenteerd en getest.
- Querystrategie aantoonbaar zonder N+1.
- Toegankelijkheid getest.
- Directe refresh na primary-image-keuze getest.
- Regressiesuite en productiebuild geslaagd.
- Functionele testcase-uitkomsten vastgelegd.
- Schone release-ZIP opgeleverd.

## 10. Vervolg na deze sprint

Na implementatie en acceptatie van ART-UI-POLISH-1 wordt de afgesproken backlogvolgorde hervat:

1. ART-012D-4 volledig functioneel valideren en eventuele fixes uitvoeren.
2. ART-013B `musician_in_band` uitbreiden met rol, periode en bron.
3. Lokale redactionele biografie ontwerpen.
4. ART-014 album-, release- en trackdatamodel uitwerken.
