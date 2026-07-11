# BL-044 Sprint 3 Hotfix — Embedded breedte en create/update herstel

## Doel
Deze hotfix herstelt twee testbevindingen uit de shell-hosted integratie van Artiesten:

1. zichtbare whitespace links/rechts in de shell-hosted module
2. runtime fout bij create/update via `POST /api/artists` en `PUT /api/artists/:id`

## Root cause

### 1. Whitespace in embedded mode
De whitespace bleek uit twee lagen te komen:

- de Shellstarter host renderde de iframe binnen een kaart met interne padding
- Artiesten gebruikte in embedded mode nog steeds een Bootstrap `Container`/layout met eigen gutters

### 2. `fn is not a function`
`routes/artistRoutes.js` registreerde `ctrl.get`, `ctrl.create` en `ctrl.update`, terwijl deze handlers in `controllers/artistController.js` niet meer werden geëxporteerd. Daardoor ontving `asyncHandler` geen functie maar `undefined`.

## Doorgevoerde wijziging in Artiesten

- `get`, `create` en `update` opnieuw geïmplementeerd en geëxporteerd in `controllers/artistController.js`
- payload-normalisatie toegevoegd voor create/update
- validatie toegevoegd voor verplichte `ar_artist_name`
- embedded root wrapper aangepast zodat shell-hosted rendering geen Bootstrap container gebruikt
- embedded CSS aangescherpt voor flush rendering zonder horizontale padding
- regressietest toegevoegd voor controller contract en inputvalidatie

## Verwacht resultaat

- Save bij nieuwe artiest werkt weer
- Edit/update werkt weer
- embedded rendering gebruikt de volledige beschikbare breedte binnen de shell-hosted integratie
