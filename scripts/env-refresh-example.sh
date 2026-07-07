#!/usr/bin/env bash
set -euo pipefail

cat > .env.example <<'ENVEOF'
# Artiesten-app voorbeeldconfiguratie
# Kopieer dit bestand naar .env en pas lokale waarden aan.
# Dit bestand bevat geen geheimen en mag in release-ZIP's worden meegeleverd.

# App
NODE_ENV=development
PORT=3012
LOG_LEVEL=info

# Database
# Gebruikersconfiguratie: PostgreSQL draait in Docker.
# Host-machine naar Docker PostgreSQL voorbeeld: localhost:5433 -> container postgres:5432.
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/musicdb

# Docker PostgreSQL migratiehulp
# Pas ARTIST_DB_CONTAINER aan als jouw container anders heet.
ARTIST_DB_CONTAINER=my-postgresdb
ARTIST_DB_USER=postgres
ARTIST_DB_NAME=musicdb

# CORS
# Gebruik dit tijdens lokale client-development met Vite.
CORS_ORIGIN=http://localhost:5173

# Shellstarter / embedded client runtime
# Deze variabelen worden door Vite in de client-build opgenomen.
VITE_ARTIST_APP_ENABLE_SHELL_MODE=true
VITE_ARTIST_APP_ALLOW_THEME_QUERY=true
VITE_ARTIST_APP_DEFAULT_THEME=slate

# ART-015D duplicate scanner defaults
ARTIST_DUPLICATE_MIN_SCORE=82
ARTIST_DUPLICATE_MAX_CANDIDATES=500

# ART-015D-3A duplicate scanner alerting
ARTIST_DUPLICATE_ALERT_ENABLED=true
ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25

# ART-015D-3C duplicate reviewqueue stale signalling
ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14
ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true
ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1

# Discogs artist enrichment (ART-012, optional)
# Standaardnamen voor alle Musicapp-apps. Legacy namen zoals DISCOGS_API_TOKEN,
# DISCOGS_API_BASE_URL en DISCOGS_ENABLED worden niet meer als template gebruikt.
DISCOGS_USER_TOKEN=
DISCOGS_USER_AGENT=MusicappArtist/1.0
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_REQUEST_TIMEOUT_MS=10000
DISCOGS_CACHE_TTL_SECONDS=21600

# ART-012 image cache defaults (optional; paths are relative to the app root unless absolute)
ARTIST_IMAGE_CACHE_ENABLED=false
ARTIST_IMAGE_CACHE_DIR=data/cache/artist-images
ARTIST_IMAGE_CACHE_MAX_AGE_DAYS=30
ENVEOF

printf '[artist] refreshed .env.example with canonical runtime/scanner/alert/discogs/image-cache variables\n'
