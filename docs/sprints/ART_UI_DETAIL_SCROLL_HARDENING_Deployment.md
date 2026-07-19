# ART-UI detail- en scrollhardening — deployment

## 1. Uitpakken

Pak de ZIP uit en ga naar de projectdirectory.

## 2. Dependencies installeren

```bash
npm ci
npm --prefix client ci
```

`node_modules` is bewust niet opgenomen in de oplevering.

## 3. Databasepreflight

Zorg dat de PostgreSQL-container draait. Configureer zo nodig in `.ENV`:

```dotenv
DB_CONTAINER=postgres
DB_NAME=musicdb
DB_USER=postgres
```

Voer daarna uit:

```bash
npm run db:preflight:art-ui-detail-scroll
```

## 4. Migratie

```bash
npm run db:migrate:art-ui-detail-scroll
```

Dit is bewust een no-op-migratie: de sprint vereist geen schemawijziging. De container- en schemabereikbaarheid worden wel gecontroleerd.

## 5. Tests

```bash
npm run test:art-ui-detail-scroll
npm run test:art-ui-2:phase34
npm run test:art013b2:fix7
npm run test:art-ui-msg1-art012c-ux2
```

## 6. Productiebuild

```bash
npm run build
```

## 7. Verify

```bash
npm run db:verify:art-ui-detail-scroll
```

## 8. Applicatie starten

```bash
npm start
```
