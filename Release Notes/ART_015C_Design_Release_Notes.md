# ART-015C Design Release Notes

Datum: 2026-05-25

## Inhoud

Deze release werkt ART-015C functioneel en technisch uit. Er is nog geen merge-code gebouwd; dit is een ontwerp-/documentatiesprint met migratievoorstel en implementatieplan.

## Belangrijkste besluiten

- Artist merge wordt één database-transactie: alles lukt of niets lukt.
- Impactscan wordt opnieuw server-side uitgevoerd vlak vóór de merge.
- Merge-scope v1 omvat `file_details`, `artiesten_spelling`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items`, reset van `file_details_version_group_validations`, `artist_merge_history`, `admin_audit_log` en `alerts`.
- Redundante artist wordt niet hard deleted maar gemarkeerd als merged/deleted.
- Shellstarter-alert wordt voorbereid via de bestaande `alerts` tabel.
- Mail blijft functioneel voorbereid maar niet hard gekoppeld totdat het mailcontract is vastgesteld.
- FK-hardening voor `hitlijsten`, `staging_hitlijsten` en `import_scan_items` wordt gefaseerd voorgesteld na orphan-checks.

## Validatie

Uitgevoerd:

```bash
npm run test:art015c
npm run test:unit
npm run test:sprint4
```

## Geen node_modules

De ZIP bevat geen `node_modules`, geen `.env`, geen `.sample.env`, geen `.env.sample`, geen logs en geen MacOS metadata.
