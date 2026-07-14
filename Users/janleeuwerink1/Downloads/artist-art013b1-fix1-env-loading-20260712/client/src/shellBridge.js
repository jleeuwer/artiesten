import { normalizeThemeContract } from './shellIntegration.js';

export const SHELL_THEME_MESSAGE_TYPE = 'musicapp:shell-theme';
export const EMBEDDED_HEIGHT_MESSAGE_TYPE = 'musicapp:embedded-height';
export const EMBEDDED_READY_MESSAGE_TYPE = 'musicapp:embedded-ready';

export function isAllowedParentMessage(event, parentOrigin = '') {
  if (!event) return false;
  if (!parentOrigin || parentOrigin === '*') return true;
  return event.origin === parentOrigin;
}

export function extractShellThemeMessage(data, fallbackTheme = 'slate') {
  if (!data || data.type !== SHELL_THEME_MESSAGE_TYPE) return null;
  const themeKey = typeof data.themeKey === 'string' && data.themeKey.trim() ? data.themeKey.trim() : fallbackTheme;
  return {
    themeKey,
    themeContract: normalizeThemeContract(data.themeContract, themeKey),
    themeSource: 'parent-message',
  };
}
