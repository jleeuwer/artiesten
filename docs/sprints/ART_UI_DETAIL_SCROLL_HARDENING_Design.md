# ART UI-detail- en scrollhardening — functioneel en technisch ontwerp

## Scope
Deze sprint combineert ART-013B-2-UX-1, ART-013B-2-UX-2, ART-UI-DETAILS-1, ART-UI-LABELS-1 en ART-UI-SCROLL-2.

## Functioneel ontwerp

### Discogs-bandledenvoorstellen
- Conflictmeldingen gebruiken maximaal twee zichtbare tekstregels; de volledige tekst blijft via `title` beschikbaar.
- De actiezone gebruikt één horizontale actieregel. Op kleinere viewports scrolt alleen deze cel horizontaal; knoppen worden niet ongecontroleerd onder elkaar geplaatst.
- Na accepteren, later zetten, negeren of heropenen wordt de lijst opnieuw geladen zonder dat de gebruiker zijn werkpositie verliest.
- Focus wordt zonder automatische browser-scroll hersteld op dezelfde proposal of, wanneer die niet meer zichtbaar is, op de eerstvolgende beschikbare actie.

### Detailsecties
- File Details heet voortaan **Songs**.
- Artiesten Spelling heet voortaan **Alternatieve spellingen**.
- Songs, Alternatieve spellingen, Hitlijsten en Mergehistorie zijn afzonderlijk inklapbaar.
- Songs staat standaard open; de overige drie secties staan standaard dicht.
- De open/dicht-status blijft gedurende de actieve React-sessie behouden.
- De sectiekoppen zijn echte knoppen met `aria-expanded` en `aria-controls`.

### Scrollgedrag
- De pagina of Shellstarter-container blijft eigenaar van de verticale artiestdetailscroll.
- Alleen de Discogs-proposalmodal heeft een expliciete verticale lijstscroll.
- Detailkaarten gebruiken geen browser scroll anchoring, zodat dynamisch openen/sluiten of async verversen de viewport niet laat springen.

## Technisch ontwerp
- `CollapsibleRelationSection` is een lokale, herbruikbare presentational component.
- `relationSectionsOpen` beheert de sessiestatus per sectie.
- `DiscogsBandMemberProposalQueue` gebruikt `tableWrapRef` en `pendingAnchorRef`.
- Voor een mutatie wordt de huidige `scrollTop` en proposal-key vastgelegd.
- Na herladen wordt in `requestAnimationFrame` de positie hersteld en `focus({ preventScroll: true })` toegepast.
- CSS reserveert een stabiele actiekolom en gebruikt `nowrap`; compacte fouttekst gebruikt line-clamp.
- Geen database- of API-wijzigingen nodig.

## Buiten scope
- Persistente open/dicht-voorkeur in de database of localStorage.
- Herontwerp van de volledige Discogs-reviewqueue.
- Wijziging van proposalstatussen of matchinglogica.

## Database-impact en Docker/PostgreSQL

Deze sprint wijzigt uitsluitend frontendpresentatie, focusherstel, scrollgedrag en sectielabels. Er worden geen tabellen, kolommen, constraints, indexen of gegevens gewijzigd.

Voor consistente deployment via Docker zijn drie expliciete scripts toegevoegd:

- `npm run db:preflight:art-ui-detail-scroll`
- `npm run db:migrate:art-ui-detail-scroll`
- `npm run db:verify:art-ui-detail-scroll`

De migratiestap is bewust een **no-op**. Zij controleert wel of de ingestelde PostgreSQL-container draait en of de bestaande `artist`-tabel bereikbaar is. Hierdoor kan dezelfde deploymentvolgorde als bij databasegerichte sprints worden gebruikt zonder een fictieve schemamutatie uit te voeren.

De scripts lezen eerst `.ENV` en daarna `.env`. Ondersteunde variabelen:

- `DB_CONTAINER` of `POSTGRES_CONTAINER`;
- `DB_NAME` of `POSTGRES_DB`;
- `DB_USER` of `POSTGRES_USER`.

Standaardwaarden zijn respectievelijk `postgres`, `musicdb` en `postgres`.
