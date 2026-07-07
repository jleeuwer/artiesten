import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShellIntegrationContext, getThemeFromQuery, normalizeThemeContract, parseBooleanEnv } from '../client/src/shellIntegration.js';

function createStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

test('parseBooleanEnv understands common truthy values', () => {
  assert.equal(parseBooleanEnv('true', false), true);
  assert.equal(parseBooleanEnv('1', false), true);
  assert.equal(parseBooleanEnv('', true), true);
  assert.equal(parseBooleanEnv('false', true), false);
});

test('getThemeFromQuery reads shellTheme from URL search params', () => {
  assert.equal(getThemeFromQuery('?shellTheme=rose-dark'), 'rose-dark');
  assert.equal(getThemeFromQuery('?foo=bar'), '');
});

test('buildShellIntegrationContext prefers query theme over stored contract', () => {
  const storage = createStorage({
    'musicapp.shell.theme.contract': JSON.stringify({ themeKey: 'slate', mode: 'dark', contrast: 'standard', category: 'core', tokens: {} }),
  });

  const context = buildShellIntegrationContext({
    search: '?shellTheme=rose-dark',
    storage,
    env: {
      VITE_ARTIST_APP_ENABLE_SHELL_MODE: 'true',
      VITE_ARTIST_APP_ALLOW_THEME_QUERY: 'true',
      VITE_ARTIST_APP_DEFAULT_THEME: 'slate',
    },
  });

  assert.equal(context.shellMode, true);
  assert.equal(context.themeKey, 'rose-dark');
  assert.equal(context.themeSource, 'query');
});

test('buildShellIntegrationContext falls back to stored theme contract when query is absent', () => {
  const storage = createStorage({
    'musicapp.shell.theme.contract': JSON.stringify({ themeKey: 'pastel-light', mode: 'light', contrast: 'standard', category: 'expressive', tokens: { accent: '#f9a8d4' } }),
  });

  const context = buildShellIntegrationContext({
    search: '',
    storage,
    env: {
      VITE_ARTIST_APP_ENABLE_SHELL_MODE: 'true',
      VITE_ARTIST_APP_ALLOW_THEME_QUERY: 'true',
      VITE_ARTIST_APP_DEFAULT_THEME: 'slate',
    },
  });

  assert.equal(context.themeKey, 'pastel-light');
  assert.equal(context.themeSource, 'storage');
  assert.equal(context.themeContract.mode, 'light');
});

test('normalizeThemeContract applies safe defaults for invalid payloads', () => {
  const contract = normalizeThemeContract(null, 'teal');
  assert.equal(contract.themeKey, 'teal');
  assert.equal(contract.mode, 'dark');
  assert.deepEqual(contract.tokens, {});
});
