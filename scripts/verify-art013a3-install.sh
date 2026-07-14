#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
node <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const required = [
  'artist-musician:preflight',
  'db:migrate:art013a3',
  'artist-musician:verify',
  'test:art013a3:db'
];
const missing = required.filter((name) => !pkg.scripts || !pkg.scripts[name]);
if (missing.length) {
  console.error(`[BLOCKER][ART013A3-INSTALL] Ontbrekende npm-scripts: ${missing.join(', ')}`);
  process.exit(1);
}
for (const name of required) {
  console.log(`[PASS][ART013A3-INSTALL] npm run ${name} -> ${pkg.scripts[name]}`);
}
NODE
