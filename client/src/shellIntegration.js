export const DEFAULT_THEME_CONTRACT = Object.freeze({
  themeKey: 'slate',
  mode: 'dark',
  contrast: 'standard',
  category: 'core',
  tokens: {},
});

export function parseBooleanEnv(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

export function getThemeFromQuery(search = '') {
  try {
    const params = new URLSearchParams(search || '');
    return params.get('shellTheme') || '';
  } catch {
    return '';
  }
}

export function getBooleanQueryFlag(search = '', key) {
  try {
    const params = new URLSearchParams(search || '');
    const value = params.get(key);
    if (!value) return false;
    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
  } catch {
    return false;
  }
}

export function getQueryValue(search = '', key) {
  try {
    const params = new URLSearchParams(search || '');
    return params.get(key) || '';
  } catch {
    return '';
  }
}

export function normalizeThemeContract(rawContract, fallbackTheme = DEFAULT_THEME_CONTRACT.themeKey) {
  if (!rawContract || typeof rawContract !== 'object' || Array.isArray(rawContract)) {
    return { ...DEFAULT_THEME_CONTRACT, themeKey: fallbackTheme || DEFAULT_THEME_CONTRACT.themeKey };
  }

  return {
    themeKey: typeof rawContract.themeKey === 'string' && rawContract.themeKey.trim() ? rawContract.themeKey : (fallbackTheme || DEFAULT_THEME_CONTRACT.themeKey),
    mode: typeof rawContract.mode === 'string' && rawContract.mode.trim() ? rawContract.mode : DEFAULT_THEME_CONTRACT.mode,
    contrast: typeof rawContract.contrast === 'string' && rawContract.contrast.trim() ? rawContract.contrast : DEFAULT_THEME_CONTRACT.contrast,
    category: typeof rawContract.category === 'string' && rawContract.category.trim() ? rawContract.category : DEFAULT_THEME_CONTRACT.category,
    tokens: rawContract.tokens && typeof rawContract.tokens === 'object' && !Array.isArray(rawContract.tokens) ? rawContract.tokens : {},
  };
}

export function getStoredThemeContract(storage, fallbackTheme = DEFAULT_THEME_CONTRACT.themeKey) {
  try {
    const raw = storage?.getItem?.('musicapp.shell.theme.contract');
    if (!raw) return normalizeThemeContract(null, fallbackTheme);
    return normalizeThemeContract(JSON.parse(raw), fallbackTheme);
  } catch {
    return normalizeThemeContract(null, fallbackTheme);
  }
}

export function buildShellIntegrationContext({
  search = '',
  storage = typeof window !== 'undefined' ? window.localStorage : null,
  env = typeof import.meta !== 'undefined' ? import.meta.env : {},
} = {}) {
  const shellModeEnabled = parseBooleanEnv(env?.VITE_ARTIST_APP_ENABLE_SHELL_MODE, true);
  const allowThemeQuery = parseBooleanEnv(env?.VITE_ARTIST_APP_ALLOW_THEME_QUERY, true);
  const defaultTheme = typeof env?.VITE_ARTIST_APP_DEFAULT_THEME === 'string' && env.VITE_ARTIST_APP_DEFAULT_THEME.trim()
    ? env.VITE_ARTIST_APP_DEFAULT_THEME.trim()
    : DEFAULT_THEME_CONTRACT.themeKey;

  const queryTheme = allowThemeQuery ? getThemeFromQuery(search) : '';
  const storedContract = getStoredThemeContract(storage, defaultTheme);
  const activeTheme = queryTheme || storedContract.themeKey || defaultTheme;
  const embeddedInShell = getBooleanQueryFlag(search, 'shellEmbed') || getBooleanQueryFlag(search, 'embeddedInShell');
  const shellMode = embeddedInShell ? true : shellModeEnabled;
  const parentOrigin = getQueryValue(search, 'shellOrigin');
  const shellHost = getQueryValue(search, 'shellHost') || '';

  return {
    shellMode,
    embeddedInShell,
    shellHost,
    parentOrigin,
    themeKey: activeTheme,
    themeContract: normalizeThemeContract({ ...storedContract, themeKey: activeTheme }, defaultTheme),
    shellModeSource: embeddedInShell ? 'query' : 'env',
    themeSource: queryTheme ? 'query' : (storedContract.themeKey ? 'storage' : 'default'),
  };
}
