# ART-013A-3 Design Release Notes

Datum: 2026-07-12

## Nieuw ontwerpbesluit

Het artist/musician-model wordt asymmetrisch:

- een persoonsartist heeft exact één musician;
- een musician mag zonder artist bestaan;
- bandleden kunnen als standalone musician worden geregistreerd;
- `musician_in_band` blijft de lokale bandrelatiebron;
- een musician kan later veilig naar artist worden gepromoveerd.

## Opgeleverd

- functioneel en technisch ontwerp;
- migratie- en datakwaliteitsstrategie;
- functionele en technische testbasis;
- sprintmanifest;
- backlog-, projectnotitie- en README-update.

Er is in deze designrelease nog geen runtimecode of databasemigratie geïmplementeerd.
