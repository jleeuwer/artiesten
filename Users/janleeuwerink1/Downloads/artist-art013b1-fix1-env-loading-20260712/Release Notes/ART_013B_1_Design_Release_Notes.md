# ART-013B-1 Design Release Notes

Datum: 2026-07-11

Deze ontwerpoplevering werkt de volgende Artiesten-app sprint uit: handmatig beheer van bandlidmaatschappen op basis van de bestaande tabel `musician_in_band`.

Belangrijkste afspraken:

- één geïntegreerde gebruikerservaring in de Artiesten-app;
- technisch aparte featuremodules;
- volledige handmatige invoer zonder externe API;
- Discogs later primair als ondersteunende proposalbron;
- MusicBrainz daarna aanvullend;
- Wikidata pas daarna voor verificatie;
- externe gegevens overschrijven lokale data nooit automatisch;
- 88 functionele testcases vormen de basis voor automatisering.

Deze release bevat ontwerp en documentatie, geen concrete runtime-implementatie.
