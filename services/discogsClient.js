const { getDiscogsConfig } = require('../config/discogsConfig');

function trimTrailingSlash(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

function buildDiscogsWebUrl(uri = '') {
  if (!uri) return '';
  if (/^https?:\/\//i.test(uri)) return uri;
  return `https://www.discogs.com${uri.startsWith('/') ? uri : `/${uri}`}`;
}

function normalizeSearchResult(result = {}) {
  const discogsArtistId = result.id ?? result.artist_id ?? null;
  return {
    discogs_artist_id: discogsArtistId,
    discogs_id: discogsArtistId,
    discogs_name: result.title || result.name || '',
    discogs_url: buildDiscogsWebUrl(result.uri || ''),
    resource_url: result.resource_url || '',
    type: result.type || 'artist',
    thumb_url: result.thumb || '',
    cover_image_url: result.cover_image || '',
    match_context: result.title || result.name || '',
    raw: result,
  };
}

function normalizeNameList(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return { name: item };
    return {
      id: item.id ?? null,
      name: item.name || item.title || '',
      resource_url: item.resource_url || '',
      active: item.active ?? undefined,
    };
  }).filter((item) => item.name);
}


function normalizeDiscogsDate(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  // Accept only explicit structured ISO-like dates. Discogs artist profiles are free text
  // and are intentionally not parsed automatically to avoid wrong birth/death data.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  return null;
}

function normalizeImages(images = []) {
  if (!Array.isArray(images)) return [];
  return images.map((img, index) => ({
    type: img.type || (index === 0 ? 'primary' : 'secondary'),
    uri: img.uri || '',
    uri150: img.uri150 || '',
    resource_url: img.resource_url || '',
    width: img.width ?? null,
    height: img.height ?? null,
    is_primary: (img.type || '').toLowerCase() === 'primary' || index === 0,
    cache_status: 'remote_only',
    local_cache_path: null,
    raw: img,
  })).filter((img) => img.uri || img.uri150);
}

function normalizeArtistDetail(data = {}) {
  return {
    discogs_artist_id: data.id ?? null,
    discogs_id: data.id ?? null,
    discogs_name: data.name || '',
    real_name: data.realname || data.real_name || '',
    profile: data.profile || '',
    birth_date: normalizeDiscogsDate(data.birth_date || data.date_of_birth || data.born),
    death_date: normalizeDiscogsDate(data.death_date || data.date_of_death || data.died || data.passing_date),
    discogs_url: data.uri ? buildDiscogsWebUrl(data.uri) : buildDiscogsWebUrl(`/artist/${data.id || ''}`),
    resource_url: data.resource_url || '',
    urls: Array.isArray(data.urls) ? data.urls : [],
    aliases: normalizeNameList(data.aliases),
    namevariations: normalizeNameList(data.namevariations || data.name_variations),
    groups: normalizeNameList(data.groups),
    members: normalizeNameList(data.members),
    images: normalizeImages(data.images),
    raw: data,
  };
}

function ensureConfigured(config) {
  if (!config.enabled || !config.configured) {
    const err = new Error(config.disabledReason || 'Discogs is not configured');
    err.statusCode = 503;
    err.code = 'DISCOGS_NOT_CONFIGURED';
    throw err;
  }
}

async function requestDiscogsJson(path, { query = {}, env = process.env } = {}) {
  const config = getDiscogsConfig(env);
  ensureConfigured(config);

  const baseUrl = trimTrailingSlash(config.baseUrl);
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': config.userAgent,
        Authorization: `Discogs token=${config.userToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(body?.message || `Discogs request failed with status ${response.status}`);
      err.statusCode = response.status === 401 ? 502 : response.status;
      err.discogsStatusCode = response.status;
      err.payload = body;
      throw err;
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchArtists(query, { limit = 10, env = process.env } = {}) {
  const config = getDiscogsConfig(env);
  ensureConfigured(config);
  const cleaned = String(query || '').trim();
  if (!cleaned) return { query: cleaned, items: [] };

  const data = await requestDiscogsJson('/database/search', {
    env,
    query: {
      q: cleaned,
      type: 'artist',
      per_page: Math.max(1, Math.min(Number(limit) || 10, 25)),
      page: 1,
    },
  });

  return {
    query: cleaned,
    pagination: data.pagination || null,
    items: (data.results || []).filter((r) => (r.type || 'artist') === 'artist').map(normalizeSearchResult),
    raw: data,
  };
}

async function getArtistDetail(discogsArtistId, { env = process.env } = {}) {
  const id = Number(discogsArtistId);
  if (!Number.isFinite(id) || id <= 0) {
    const err = new Error('Invalid Discogs artist id');
    err.statusCode = 400;
    throw err;
  }
  const data = await requestDiscogsJson(`/artists/${id}`, { env });
  return normalizeArtistDetail(data);
}

function getDiscogsStatus(env = process.env) {
  const config = getDiscogsConfig(env);
  return {
    enabled: config.enabled,
    configured: config.configured,
    baseUrl: config.baseUrl,
    userAgent: config.userAgent,
    cacheTtlSeconds: config.cacheTtlSeconds,
    requestTimeoutMs: config.requestTimeoutMs,
    usedLegacyToken: config.usedLegacyToken,
    usedLegacyBaseUrl: config.usedLegacyBaseUrl,
    disabledReason: config.disabledReason,
  };
}

module.exports = {
  buildDiscogsWebUrl,
  getDiscogsStatus,
  normalizeSearchResult,
  normalizeArtistDetail,
  requestDiscogsJson,
  searchArtists,
  getArtistDetail,
};
