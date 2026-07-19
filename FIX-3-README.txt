ART-UI-DETAILS-1 Fix 3

Gesloten secties worden niet langer alleen verborgen met HTML/CSS, maar volledig conditioneel uit de DOM verwijderd.
Dit voorkomt dat globale styling de inhoud alsnog zichtbaar maakt.

Gewijzigd:
- client/src/components/ArtistPageContent.jsx
- tests/artUiDetailsFix3ConditionalRendering.contract.test.mjs
- Release Notes/ART-UI-DETAILS-1-Fix-3-20260719.md
- public/app (opnieuw gebouwd)

Geen databasemigratie nodig.
