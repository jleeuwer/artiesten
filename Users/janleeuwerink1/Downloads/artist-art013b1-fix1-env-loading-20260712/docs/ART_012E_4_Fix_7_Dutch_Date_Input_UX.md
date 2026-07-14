# ART-012E-4-Fix-7 — Nederlandse datum-invoer UX

## Functionele afspraak

In het artiest edit-scherm voert de gebruiker geboorte- en sterfdatum in als Nederlands datumformaat:

```text
dd-mm-jjjj
```

Voorbeeld:

```text
12-03-1947
```

De gebruiker hoeft dus niet via een browserkalender terug te scrollen naar de 20e eeuw.

## Datepicker

Naast het tekstveld blijft datepicker-ondersteuning beschikbaar via een kalenderknop. De gekozen datepickerwaarde wordt omgezet naar het zichtbare Nederlandse formaat.

## Technische opslag

De API en PostgreSQL blijven werken met:

```text
YYYY-MM-DD
```

De frontend converteert daarom bij opslaan:

```text
12-03-1947 -> 1947-03-12
```

## Validatie

- Lege datumvelden zijn toegestaan.
- Ongeldige datums worden vóór opslaan afgekeurd.
- Het verwachte invoerformaat is `dd-mm-jjjj`.
