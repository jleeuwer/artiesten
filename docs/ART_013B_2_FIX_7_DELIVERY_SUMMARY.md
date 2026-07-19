# Oplevering ART-013B-2-Fix-7

## Gewijzigd

- `services/musicianInBandMatchingService.js`
- `services/musicianInBandProposalService.js`
- `client/src/features/musician-in-band-proposals/DiscogsBandMemberProposalQueue.jsx`
- `tests/art013b2Fix5ArtistAwareMatching.contract.test.mjs`
- `tests/art013b2Fix7NonPersonFallback.contract.test.mjs`
- `package.json`
- functioneel/technisch ontwerp en release notes
- opnieuw gebouwde frontend in `public/app`

## Validatie

- `npm run test:art013b2`: geslaagd
- `npm --prefix client run build`: geslaagd na `npm ci` in `client`

## Installatie

Geen databasemigratie nodig. Pak de release uit, installeer dependencies volgens de bestaande installatie-instructies en herstart de applicatie.
