import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShellIntegrationContext } from '../client/src/shellIntegration.js';

function createStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
  };
}

test('embedded shell query forces shell mode and preserves parent origin', () => {
  const context = buildShellIntegrationContext({
    search: '?shellTheme=rose-dark&shellEmbed=1&shellOrigin=http%3A%2F%2Flocalhost%3A3010&shellHost=shellstarter',
    storage: createStorage(),
    env: {
      VITE_ARTIST_APP_ENABLE_SHELL_MODE: 'false',
      VITE_ARTIST_APP_ALLOW_THEME_QUERY: 'true',
      VITE_ARTIST_APP_DEFAULT_THEME: 'slate',
    },
  });

  assert.equal(context.shellMode, true);
  assert.equal(context.embeddedInShell, true);
  assert.equal(context.parentOrigin, 'http://localhost:3010');
  assert.equal(context.shellHost, 'shellstarter');
  assert.equal(context.themeKey, 'rose-dark');
});
