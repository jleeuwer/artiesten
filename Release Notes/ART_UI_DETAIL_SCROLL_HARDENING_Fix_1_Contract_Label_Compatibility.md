# ART UI Detail & Scroll Hardening — Fix 1

## Aanleiding
De volledige `npm run test:all` regressiesuite faalde in een historische Sprint 6-contracttest. De UI was bewust hernoemd van `File details` naar `Songs` en van `Artiesten spelling` naar `Alternatieve spellingen`, maar de oude test verwachtte nog de voormalige labels.

## Oplossing
- Sprint 6-contracttest bijgewerkt naar de actuele labels.
- De Edit-modal gebruikt nu eveneens `Alternatieve spellingen`.
- Geen functionele of databasewijziging.

## Regressie
De test bewaakt nog steeds dat het relatiepaneel aanwezig is, maar gebruikt nu het actuele UI-contract.
