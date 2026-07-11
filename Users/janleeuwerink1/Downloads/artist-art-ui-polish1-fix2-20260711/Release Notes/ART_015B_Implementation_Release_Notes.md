# ART-015B Implementation Release Notes

## Scope

Deze release implementeert interactieve fuzzy duplicate search en een read-only merge-impactscan voor de Artiesten-app.

## Toegevoegd

- `GET /api/artists/:id/duplicate-candidates`
- `GET /api/artists/merge/impact`
- Fuzzy matching op artiestnaam en artiestenspellingen.
- UI-sectie **Mogelijke dubbele artiesten** in het relatiepaneel.
- Read-only impactscan in offcanvas.
- Contracttests voor ART-015B.
- Documentatie en runbook voor ART-015B.

## Geen database-migratie

ART-015B voegt geen nieuwe tabellen of kolommen toe. Als de Sprint 6 favorietenmigratie al is uitgevoerd, is voor deze release geen extra SQL-migratie nodig.

## Bewust niet inbegrepen

- Echte merge-uitvoering.
- Muterende updates van artist keys.
- Audit/history tabel.
- Periodieke Python scanner/staging.

## Validatie

Aanbevolen:

```bash
npm run test:art015b
npm run test:unit
```
