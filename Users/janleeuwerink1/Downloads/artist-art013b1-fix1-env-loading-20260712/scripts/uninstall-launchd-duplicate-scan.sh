#!/usr/bin/env bash
set -euo pipefail

LABEL="${LAUNCHD_LABEL:-nl.musicdb.artist.duplicate-scan}"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ -f "$PLIST_PATH" ]]; then
  launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
  rm -f "$PLIST_PATH"
  echo "[ART-015D-3B] Removed launchd agent: $PLIST_PATH"
else
  echo "[ART-015D-3B] No launchd agent found at: $PLIST_PATH"
fi
