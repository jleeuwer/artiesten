import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}
function isExecutable(relativePath) {
  return (fs.statSync(path.join(root, relativePath)).mode & 0o111) !== 0;
}

test('ART-015D-3B scheduler scripts exist and are executable', () => {
  for (const script of [
    'scripts/scheduled-duplicate-scan.sh',
    'scripts/install-cron-duplicate-scan.sh',
    'scripts/uninstall-cron-duplicate-scan.sh',
    'scripts/install-launchd-duplicate-scan.sh',
    'scripts/uninstall-launchd-duplicate-scan.sh'
  ]) {
    assert.ok(exists(script), `${script} should exist`);
    assert.ok(isExecutable(script), `${script} should be executable`);
    assert.match(read(script), /set -euo pipefail/);
  }
});

test('ART-015D-3B scheduled wrapper writes timestamped logs and delegates to scanner npm script', () => {
  const wrapper = read('scripts/scheduled-duplicate-scan.sh');
  assert.match(wrapper, /duplicate-scan-\$STAMP\.log/);
  assert.match(wrapper, /date \+%Y%m%d-%H%M%S/);
  assert.match(wrapper, /mkdir -p "\$LOG_DIR"/);
  assert.match(wrapper, /npm run scan:duplicates -- "\$@"/);
  assert.match(wrapper, /ARTIST_SCHEDULER_LOG_DIR/);
});

test('ART-015D-3B cron installer uses managed marker block and supports schedule override', () => {
  const install = read('scripts/install-cron-duplicate-scan.sh');
  const uninstall = read('scripts/uninstall-cron-duplicate-scan.sh');
  assert.match(install, /CRON_SCHEDULE:-0 9 \* \* 0/);
  assert.match(install, /BEGIN ARTIST_DUPLICATE_SCAN/);
  assert.match(install, /END ARTIST_DUPLICATE_SCAN/);
  assert.match(install, /crontab -/);
  assert.match(uninstall, /BEGIN ARTIST_DUPLICATE_SCAN/);
  assert.match(uninstall, /crontab "\$tmp_new"/);
});

test('ART-015D-3B launchd installer creates plist with expected scheduling keys', () => {
  const install = read('scripts/install-launchd-duplicate-scan.sh');
  const uninstall = read('scripts/uninstall-launchd-duplicate-scan.sh');
  assert.match(install, /nl\.musicdb\.artist\.duplicate-scan/);
  assert.match(install, /StartCalendarInterval/);
  assert.match(install, /ProgramArguments/);
  assert.match(install, /WorkingDirectory/);
  assert.match(install, /StandardOutPath/);
  assert.match(install, /StandardErrorPath/);
  assert.match(install, /launchctl load/);
  assert.match(uninstall, /launchctl unload/);
});

test('ART-015D-3B documentation and package scripts are wired', () => {
  assert.ok(exists('docs/ART_015D_3B_Scheduler_Install_Manual.md'));
  assert.ok(exists('docs/ART_015D_3B_Testcases_en_Runbook.md'));
  assert.match(read('docs/ART_015D_3B_Scheduler_Install_Manual.md'), /npm run schedule:duplicates:cron:install/);
  assert.match(read('docs/ART_015D_3B_Scheduler_Install_Manual.md'), /npm run schedule:duplicates:launchd:install/);
  assert.match(read('docs/ART_015D_3B_Scheduler_Install_Manual.md'), /\.\/scripts\/scheduled-duplicate-scan\.sh --dry-run --verbose --no-alert/);
  assert.match(read('Readme.md'), /ART-015D-3B/);
  assert.match(read('Release Notes/ART_015D_3B_Scheduler_Scripts_Install_Manual_Release_Notes.md'), /Geen nieuwe SQL-migratie/);

  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['schedule:duplicates:cron:install'], 'bash scripts/install-cron-duplicate-scan.sh');
  assert.equal(pkg.scripts['schedule:duplicates:cron:uninstall'], 'bash scripts/uninstall-cron-duplicate-scan.sh');
  assert.equal(pkg.scripts['schedule:duplicates:launchd:install'], 'bash scripts/install-launchd-duplicate-scan.sh');
  assert.equal(pkg.scripts['schedule:duplicates:launchd:uninstall'], 'bash scripts/uninstall-launchd-duplicate-scan.sh');
  assert.match(pkg.scripts['test:art015d3b'], /node --test/);
  assert.match(pkg.scripts['test:art015d3b'], /tests\/art015d3bSchedulerScripts\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art015d'], /test:art015d3b/);
});
