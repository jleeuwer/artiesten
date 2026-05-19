import test from 'node:test';
import assert from 'node:assert/strict';
import { extractShellThemeMessage, isAllowedParentMessage, SHELL_THEME_MESSAGE_TYPE } from '../client/src/shellBridge.js';

test('isAllowedParentMessage accepts matching explicit parent origin', () => {
  assert.equal(isAllowedParentMessage({ origin: 'http://localhost:3010' }, 'http://localhost:3010'), true);
  assert.equal(isAllowedParentMessage({ origin: 'http://localhost:3011' }, 'http://localhost:3010'), false);
});

test('extractShellThemeMessage normalizes incoming shell theme message', () => {
  const result = extractShellThemeMessage({
    type: SHELL_THEME_MESSAGE_TYPE,
    themeKey: 'rose-dark',
    themeContract: { themeKey: 'rose-dark', mode: 'dark', contrast: 'standard', category: 'expressive', tokens: { accent: '#f472b6' } },
  }, 'slate');

  assert.equal(result.themeKey, 'rose-dark');
  assert.equal(result.themeContract.themeKey, 'rose-dark');
  assert.equal(result.themeSource, 'parent-message');
});

test('extractShellThemeMessage ignores unrelated messages', () => {
  assert.equal(extractShellThemeMessage({ type: 'other:event' }, 'slate'), null);
});
