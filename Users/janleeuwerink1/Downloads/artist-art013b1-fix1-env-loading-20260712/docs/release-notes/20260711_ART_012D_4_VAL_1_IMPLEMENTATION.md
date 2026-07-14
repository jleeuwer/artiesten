# ART-012D-4-VAL-1 implementation

- status-transition policy toegevoegd;
- statusmutaties transactioneel met `FOR UPDATE`;
- optimistic concurrency via `expectedUpdatedAt` en foutcode `STALE_NAME_PROPOSAL`;
- live conflictcontrole tegen canonical namen en alternatieve spellingen van alle artists;
- generation summary toegevoegd aan API en UI;
- hergeneratie bewaart `added`, `ignored` en `review_later`;
- migratie met statusconstraint en ondersteunende indexes;
- Docker preflight, verify en database-testbasis;
- 84 functionele cases gekoppeld aan automatische contracttests.
