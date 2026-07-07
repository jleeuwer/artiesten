# ART-012B-Prep — Discogs env-standaardisatie

## Doel

Voordat de Artiesten-app Discogs artist search/detail daadwerkelijk implementeert, standaardiseren we de Discogs-configuratie over Musicapp-apps heen. Hiermee voorkomen we dat Artiesten-app en Importeren Songs verschillende namen voor dezelfde instelling gebruiken.

## Besluit

De Artiesten-app gebruikt voortaan deze standaardvariabelen:

```env
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
```

`artist.ar_artist_key` blijft de lokale sleutel. Discogs-configuratie wordt alleen gebruikt om externe artist-data op te halen, te tonen en later eventueel na review toe te passen.

## Standaard versus legacy

Importeren Songs gebruikt historisch onder andere:

```env
DISCOGS_ENABLED=true
DISCOGS_API_BASE_URL=https://api.discogs.com
DISCOGS_API_TOKEN=
```

Voor nieuwe code gelden deze afspraken:

| Betekenis | Standaard | Legacy/fallback | Status |
|---|---|---|---|
| Discogs token | `DISCOGS_USER_TOKEN` | `DISCOGS_API_TOKEN` | standaard gebruiken |
| API basis-URL | `DISCOGS_BASE_URL` | `DISCOGS_API_BASE_URL` | standaard gebruiken |
| User agent | `DISCOGS_USER_AGENT` | n.v.t. | verplicht |
| Cache TTL | `DISCOGS_CACHE_TTL_SECONDS` | n.v.t. | standaard gebruiken |
| Request timeout | `DISCOGS_REQUEST_TIMEOUT_MS` | n.v.t. | standaard gebruiken |
| Feature toggle | geen standaardtoggle | `DISCOGS_ENABLED` | uitfaseren |

## Waarom geen `DISCOGS_ENABLED` als standaard?

Discogs is functioneel beschikbaar als de verplichte runtime-configuratie aanwezig is:

- `DISCOGS_USER_TOKEN`
- `DISCOGS_USER_AGENT`
- `DISCOGS_BASE_URL`

Als `DISCOGS_USER_TOKEN` leeg is, moet de UI Discogs-acties uitschakelen of een duidelijke configuratiemelding tonen. Een aparte `DISCOGS_ENABLED` vlag is dan niet nodig. Tijdens overgang mag de config-helper `DISCOGS_ENABLED=false` nog respecteren als legacy-disable.

## Config-helper

De Artiesten-app bevat `config/discogsConfig.js`. Deze helper:

- leest de standaardvariabelen;
- accepteert tijdelijk fallback op `DISCOGS_API_TOKEN` en `DISCOGS_API_BASE_URL`;
- markeert of legacy-namen gebruikt zijn;
- bepaalt of Discogs geconfigureerd/enabled is;
- gebruikt standaardwaarden voor timeout en cache-TTL.

## Acceptatiecriteria voor ART-012B

- `.env.example` bevat alleen de standaardnamen, geen legacy-namen als voorkeursconfiguratie.
- Documentatie benoemt legacy-namen alleen als fallback/migratiepad.
- Nieuwe Artiesten-code gebruikt `DISCOGS_USER_TOKEN` en `DISCOGS_BASE_URL`.
- Discogs UI-acties worden disabled als de token ontbreekt.
- Legacy fallback voorkomt directe breuk bij hergebruik van bestaande Importeren Songs-configuratie, maar wordt niet als nieuwe standaard gepresenteerd.

## Cross-app backlog

Voor Importeren Songs moet later een aparte backlogtaak worden uitgevoerd om de oude variabelen te migreren naar dezelfde standaard:

```env
DISCOGS_USER_TOKEN=
DISCOGS_BASE_URL=https://api.discogs.com
```

Legacy-variabelen zoals `DISCOGS_API_TOKEN`, `DISCOGS_API_BASE_URL` en `DISCOGS_ENABLED` moeten daar gefaseerd worden uitgefaseerd.
