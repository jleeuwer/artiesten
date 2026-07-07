# BL-044 Sprint 4 — Artiesten test cases en runbook

## Handmatige testcases

### 1. Embedded render
1. Open Artiesten via shellstarter.
2. Controleer dat de content netjes full-width binnen de shell-content staat.
3. Controleer dat geen witte linker/rechter marge zichtbaar blijft.

### 2. Create artist
1. Klik op `+ Add artist`.
2. Vul een geldige naam in.
3. Klik op `Save`.
4. Verwacht: succesvolle create, toast zichtbaar, rij aanwezig in lijst.

### 3. Create validation
1. Open create-formulier.
2. Laat naam leeg.
3. Klik op `Save`.
4. Verwacht: validatiefout en geen 500-fout.

### 4. Theme propagation
1. Open shell-hosted Artiesten.
2. Wijzig shelltheme.
3. Verwacht: child-app volgt theme zonder reload.

### 5. Height sync
1. Open detail/offcanvas.
2. Open trash-overzicht.
3. Gebruik paging/search.
4. Verwacht: geen afgesneden content in embedded iframe.

## Automatische tests
- `npm run test:sprint4`
- `bash scripts/test-sprint4-hardening.sh`


### 6. Modal overlay after search/filter
1. Zoek/filter op een artiest.
2. Open de edit modal.
3. Verwacht: modal opent als volledige overlay binnen de embedded viewport en niet alleen binnen het overgebleven zoekgebied.
4. Verwacht: modal body scrollt intern wanneer de viewport te klein is.


### 7. Trash hard delete
1. Verplaats een artiest naar Trash.
2. Open Trash.
3. Klik op `Delete forever`.
4. Verwacht: item verdwijnt uit Trash en wordt niet gerestored.
5. Verwacht: bij een referentie in `file_details` verschijnt een nette blokkademelding.
6. Verwacht: bij andere FK-conflicten verschijnt een generieke referentiemelding.
