function valueOrFallback(primary, fallback) {
  const primaryValue = typeof primary === 'string' ? primary.trim() : '';
  if (primaryValue) return primaryValue;
  const fallbackValue = typeof fallback === 'string' ? fallback.trim() : '';
  return fallbackValue || '';
}

function parseBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || String(value).trim() === '') return defaultValue;
  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

function parseInteger(value, defaultValue) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function getDiscogsConfig(env = process.env) {
  const userToken = valueOrFallback(env.DISCOGS_USER_TOKEN, env.DISCOGS_API_TOKEN);
  const baseUrl = valueOrFallback(env.DISCOGS_BASE_URL, env.DISCOGS_API_BASE_URL) || 'https://api.discogs.com';
  const userAgent = valueOrFallback(env.DISCOGS_USER_AGENT, 'MusicappArtist/1.0');
  const requestTimeoutMs = parseInteger(env.DISCOGS_REQUEST_TIMEOUT_MS, 10000);
  const cacheTtlSeconds = parseInteger(env.DISCOGS_CACHE_TTL_SECONDS, 21600);

  const legacyEnabled = parseBoolean(env.DISCOGS_ENABLED, true);
  const hasRequiredRuntimeConfig = Boolean(userToken && userAgent && baseUrl);

  return {
    enabled: legacyEnabled && hasRequiredRuntimeConfig,
    configured: hasRequiredRuntimeConfig,
    userToken,
    userAgent,
    baseUrl,
    requestTimeoutMs,
    cacheTtlSeconds,
    usedLegacyToken: !env.DISCOGS_USER_TOKEN && Boolean(env.DISCOGS_API_TOKEN),
    usedLegacyBaseUrl: !env.DISCOGS_BASE_URL && Boolean(env.DISCOGS_API_BASE_URL),
    disabledReason: !legacyEnabled
      ? 'DISCOGS_ENABLED=false legacy flag is set'
      : hasRequiredRuntimeConfig
        ? ''
        : 'Missing DISCOGS_USER_TOKEN or compatible legacy token'
  };
}

module.exports = { getDiscogsConfig };
