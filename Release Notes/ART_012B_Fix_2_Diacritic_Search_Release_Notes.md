# ART-012B-Fix-2 release notes

- Discogs artist search ondersteunt Unicode NFC-normalisatie.
- Bij namen met diakritische tekens wordt ook een accentloze fallbackquery uitgevoerd.
- Resultaten worden op Discogs-ID gededupliceerd.
- Exacte correcte naam krijgt prioriteit in de rangschikking.
- Lokale en Discogs-namen worden niet gemuteerd.
- Geen database-migratie nodig.
