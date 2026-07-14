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

test('default theme comes from env when no query or stored contract exists', () => {
  const context = buildShellIntegrationContext({
    search: '',
    storage: createStorage(),
    env: {
      VITE_ARTIST_APP_ENABLE_SHELL_MODE: 'true',
      VITE_ARTIST_APP_ALLOW_THEME_QUERY: 'true',
      VITE_ARTIST_APP_DEFAULT_THEME: 'rose-dark',
    },
  });

  assert.equal(context.themeKey, 'rose-dark');
  assert.equal(context.themeSource, 'storage');
});

test('shell mode can be disabled via env', () => {
  const context = buildShellIntegrationContext({
    search: '?shellTheme=teal',
    storage: createStorage(),
    env: {
      VITE_ARTIST_APP_ENABLE_SHELL_MODE: 'false',
      VITE_ARTIST_APP_ALLOW_THEME_QUERY: 'true',
      VITE_ARTIST_APP_DEFAULT_THEME: 'slate',
    },
  });

  assert.equal(context.shellMode, false);
  assert.equal(context.themeKey, 'teal');
});
