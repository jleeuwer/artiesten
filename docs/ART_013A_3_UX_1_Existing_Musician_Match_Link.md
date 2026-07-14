# ART-013A-3-UX-1 — Existing musician match & link

## Functioneel doel
Bij het aanmaken van een nieuwe artist van type `person` zoekt de applicatie eerst naar een bestaande standalone musician. Zo wordt voorkomen dat dezelfde persoon zowel als reeds bestaand bandlid als een tweede musician-record wordt vastgelegd.

## Gebruikersflow
1. De gebruiker voert naam en beschikbare persoonsdata van de nieuwe artist in.
2. De applicatie zoekt op exacte/genormaliseerde naam, alternatieve spelling, geboorte- en sterfdatum en later externe ID's.
3. Bij een mogelijke match toont de app de bestaande musician, gekoppelde bands en verschillen in gegevens.
4. Keuzes:
   - **Koppel aan bestaande musician**;
   - **Toch nieuwe musician aanmaken**, met expliciete duplicaatbevestiging;
   - **Annuleren en controleren**.
5. Vanuit een standalone musician blijft de omgekeerde actie **Maak ook aan als artiest** beschikbaar.

## Regels
- Er wordt bij koppelen geen tweede musician aangemaakt.
- Bestaande `musician_in_band`-bandrelaties blijven behouden.
- Alleen een vrije musician (`ar_artist_key IS NULL`) kan worden gekoppeld.
- Alleen een artist van type `person` kan worden gekoppeld.
- Verschillende naam-, datum- of websitewaarden worden vooraf getoond en nooit stil overschreven.
- Na koppeling blijft `artist → musician` leidend voor gedeelde velden.
- Koppelen en promoveren gebeuren transactioneel en met stale/concurrencycontrole.

## Relatie met ART-013B-2
Discogs-bandledenvoorstellen mogen een bestaande standalone musician matchen. Wanneer later een zelfstandige person-artist voor die persoon wordt aangemaakt, gebruikt dezelfde match-and-link-flow de bestaande musician en blijven alle geaccepteerde Discogs-bronnen en bandrelaties intact.
