#!/usr/bin/env bash
set -euo pipefail

# Installs/updates a macOS launchd LaunchAgent for the artist duplicate scanner.
# Defaults to weekly on Sunday at 09:00.
# Override with LAUNCHD_WEEKDAY, LAUNCHD_HOUR and LAUNCHD_MINUTE.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABEL="${LAUNCHD_LABEL:-nl.musicdb.artist.duplicate-scan}"
WEEKDAY="${LAUNCHD_WEEKDAY:-0}"
HOUR="${LAUNCHD_HOUR:-9}"
MINUTE="${LAUNCHD_MINUTE:-0}"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$LABEL.plist"
SCRIPT_PATH="$ROOT_DIR/scripts/scheduled-duplicate-scan.sh"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$LAUNCH_AGENTS_DIR" "$LOG_DIR"
chmod +x "$SCRIPT_PATH"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$LABEL</string>

    <key>ProgramArguments</key>
    <array>
      <string>$SCRIPT_PATH</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$ROOT_DIR</string>

    <key>StartCalendarInterval</key>
    <dict>
      <key>Weekday</key>
      <integer>$WEEKDAY</integer>
      <key>Hour</key>
      <integer>$HOUR</integer>
      <key>Minute</key>
      <integer>$MINUTE</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>$LOG_DIR/launchd-duplicate-scan.out.log</string>

    <key>StandardErrorPath</key>
    <string>$LOG_DIR/launchd-duplicate-scan.err.log</string>
  </dict>
</plist>
PLIST

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "[ART-015D-3B] Installed launchd agent: $PLIST_PATH"
echo "[ART-015D-3B] Start manually with: launchctl start $LABEL"
echo "[ART-015D-3B] Uninstall with: bash scripts/uninstall-launchd-duplicate-scan.sh"
