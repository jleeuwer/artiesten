# ART-012E-4-Fix-7 — Nederlandse datum-invoer UX

Datum: 2026-06-08

## Doel

De datumvelden in het artiest edit-scherm moeten gebruikersvriendelijk zijn voor oudere datums, zoals geboortejaren uit de 20e eeuw. De gebruiker moet handmatig `dd-mm-jjjj` kunnen typen en daarnaast datepicker-ondersteuning houden.

## Wijzigingen

- Geboortedatum en sterfdatum in het edit-scherm zijn nu zichtbare tekstvelden in Nederlands formaat `dd-mm-jjjj`.
- Naast elk datumveld staat een kalenderknop met native datepicker-ondersteuning.
- De datepickerwaarde wordt naar `dd-mm-jjjj` geconverteerd voor de zichtbare invoer.
- Bij opslaan worden `dd-mm-jjjj` waarden geconverteerd naar `YYYY-MM-DD` voor API/database.
- Backend/database blijven ongewijzigd en blijven PostgreSQL `date` gebruiken.
- Ongeldige invoer geeft een duidelijke melding dat `dd-mm-jjjj` nodig is.

## Geen migratie

Deze fix vereist geen database-migratie.

## Testadvies

```bash
mkdir -p logs && npm run test:art012e4fix7 2>&1 | tee "logs/test-art012e4fix7-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012e4 2>&1 | tee "logs/test-art012e4-fix7-$(date +%Y%m%d-%H%M%S).log"
```
