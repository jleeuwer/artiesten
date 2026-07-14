# ART-013B-1 Sprintmanifest

## Sprint

ART-013B-1 — Musician-in-band handmatig relatiebeheer

## Type

Functioneel/technisch ontwerp en testbasis voor de volgende codesprint.

## Besluiten

- Functionaliteit blijft onderdeel van de Artiesten-app.
- Technische implementatie wordt een zelfstandig feature-domein.
- Bestaande tabel `musician_in_band` blijft de lokale waarheid.
- Handmatige invoer is volledig en leidend.
- Externe bronnen schrijven nooit rechtstreeks naar de lokale relatie.
- Providerprioriteit voor vervolgsprints: Discogs, MusicBrainz, Wikidata.
- Geen aparte app, microservice of container.

## Nieuwe documenten

- `docs/ART_013B_1_Musician_In_Band_Handmatig_Relatiebeheer_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_013B_1_Testcases_en_Runbook.md`
- `docs/ART_013B_1_Sprint_Manifest.md`
- `Release Notes/ART_013B_1_Design_Release_Notes.md`

## Testbasis

88 traceerbare functionele scenario's voor contract-, API-, PostgreSQL-, component-, Chromium- en packagingtests.

## Nog niet geïmplementeerd

- database-migratie;
- backendroutes/services;
- frontendpanelen/modal;
- npm scripts;
- automatische ART-013B-1-tests;
- Discogs/MusicBrainz/Wikidata providers.
