# ART-015C-2 — UI hardening merge-richting en favorieten

Datum: 2026-05-25

## Doel

Deze fix-release verduidelijkt de merge-richting in de Artiesten-app en borgt de eerder afgesproken UI-conventie voor favorieten.

## Wijzigingen

### Merge-richting

De oude knoplabels waren functioneel correct, maar onvoldoende duidelijk:

- `Deze vervangen`
- `Kandidaat vervangen`

Deze zijn vervangen door:

- **Maak kandidaat leidend**
  - de kandidaat blijft bestaan als canonical/vervangende artiest;
  - de huidige geselecteerde artiest wordt redundant en wordt vervangen door de kandidaat.

- **Maak deze artiest leidend**
  - de huidige geselecteerde artiest blijft bestaan als canonical/vervangende artiest;
  - de kandidaat wordt redundant en wordt vervangen door de huidige artiest.

De buttons hebben ook expliciete `title`- en `aria-label`-teksten zodat de richting toegankelijker en minder ambigu is.

### Favorieten-iconen

De favorieten-toggle blijft de afgesproken Bootstrap Icons gebruiken:

- favoriet: `<i class="bi bi-star-fill"></i>`
- niet favoriet: `<i class="bi bi-star"></i>`

De bestaande toegankelijke labels/tooltips blijven behouden.

### Env-template hardening

De release houdt vast aan één officiële env-template:

- `.env.example`

Legacy templates blijven uitgesloten:

- `.sample.env`
- `.env.sample`

Gebruik bij uitpakken over een bestaande directory:

```bash
npm run env:cleanup-legacy
```

## Testen

Nieuwe contracttest:

```bash
npm run test:art015c2
```

Aanbevolen volledige lokale validatie na dependency-installatie:

```bash
npm run test:unit
npm run test:sprint4
```
