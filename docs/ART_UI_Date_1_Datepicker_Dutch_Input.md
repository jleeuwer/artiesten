# ART-UI-Date-1 — Datepicker bij Nederlandse datum-invoer

## Doel

Het artist edit-scherm moet geboortedatum en sterfdatum gebruiksvriendelijk laten invoeren:

- handmatig als `dd-mm-jjjj`;
- met ondersteuning door een datepicker;
- opslag/API blijven `YYYY-MM-DD`.

## Functioneel gedrag

| Onderdeel | Gedrag |
|---|---|
| Zichtbare input | `dd-mm-jjjj` |
| Handmatige invoer | toegestaan, bijvoorbeeld `12-03-1947` |
| Datepicker | te openen via kalendericoon |
| API payload | `YYYY-MM-DD` |
| Database | PostgreSQL `date` |
| Tabel/details | Nederlands `dd-mm-jjjj` |

## Technische oplossing

De zichtbare input blijft `type="text"`, zodat oude jaartallen direct getypt kunnen worden zonder onhandige browserkalender-navigatie.

Naast de zichtbare input blijft een native `input type="date"` aanwezig. Deze is transparant over het kalenderknopgebied geplaatst, zodat klikken op het kalendericoon de native picker opent. Bij selectie wordt de ISO-waarde geconverteerd naar `dd-mm-jjjj` in het zichtbare veld.

## Acceptatiecriteria

1. Gebruiker kan `12-03-1947` handmatig typen.
2. Gebruiker kan via het kalendericoon de datepicker openen.
3. Gekozen datepickerwaarde verschijnt als `dd-mm-jjjj`.
4. Opslaan verstuurt `YYYY-MM-DD` naar de API.
5. Na opnieuw openen blijft de datum zichtbaar als `dd-mm-jjjj`.
6. Geen database-migratie nodig.
