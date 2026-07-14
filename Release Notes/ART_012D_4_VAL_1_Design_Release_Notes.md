# ART-012D-4-VAL-1 — Design release notes

Datum: 11-07-2026

## Toegevoegd

- functioneel en technisch ontwerp voor volledige validatie en hardening van de Discogs naamvoorstellenreviewqueue;
- 84 traceerbare functionele testcases;
- automatiseringsstrategie voor contract-, PostgreSQL-, component- en Chromium-E2E-tests;
- ontwerp voor preflight, verify, rollback, concurrency en stale-state afhandeling;
- sprintmanifest en bijgewerkt runbook.

## Besluiten

- Discogs blijft voorstelbron en overschrijft geen lokale data automatisch;
- canonical rename en bulkacties blijven buiten scope;
- generatie moet idempotent en verklaarbaar zijn;
- apply voert altijd een live conflictcontrole uit;
- de database-integratietest draait transactioneel en moet `leftovers=0` aantonen;
- de volgende functionele sprint na acceptatie blijft ART-013B.

## Implementatiestatus

Dit is een ontwerp- en testbasisoplevering. De voorgestelde nieuwe code, scripts en npm-commando's worden in de volgende codesprint geïmplementeerd.
