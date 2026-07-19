# ART-UI-DETAILS-1 Fix 5 — functioneel en technisch ontwerp

## Functioneel
Eén globale toggle regelt de zichtbaarheid van Songs, Alternatieve spellingen, Hitlijsten en Mergehistorie. De bediening is alles-of-niets. De standaardtoestand is verborgen.

## Technisch
- Eén state: `showRelationDetails`.
- Eén knop met `aria-expanded` en `aria-controls` voor alle vier secties.
- Conditionele rendering van de volledige groep.
- Gewone, niet-interactieve sectieheaders.
- Sessiebehoud via `sessionStorage`; geen permanente gebruikersvoorkeur.
- Geen database-impact.

## Functionele testgevallen
1. Open artiestdetail: vier secties zijn verborgen.
2. Klik `Toon details`: alle vier secties verschijnen.
3. Klik `Verberg details`: alle vier verdwijnen.
4. Geen individuele header reageert als toggle.
5. Herladen binnen dezelfde sessie behoudt de keuze.
6. Nieuwe browsersessie start standaard verborgen.

## Technische testgevallen
- Exact één boolean state voor de groep.
- Eén toggleknop met correcte ARIA-attributen.
- Geen `CollapsibleRelationSection` of individuele `onToggle` meer.
- Alle vier secties staan binnen dezelfde conditionele rendergrens.
