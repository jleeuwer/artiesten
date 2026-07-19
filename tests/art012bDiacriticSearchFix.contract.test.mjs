import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Discogs = require('../services/discogsClient.js');

const env = {
  DISCOGS_USER_TOKEN: 'test-token',
  DISCOGS_USER_AGENT: 'ArtistTests/1.0',
  DISCOGS_BASE_URL: 'https://api.discogs.test',
};

test('bouwt unieke originele, NFC- en accentloze zoekvarianten', () => {
  const variants = Discogs.buildArtistSearchVariants('Agnetha Fa\u0308ltskog');
  assert.equal(variants[0].strategy, 'original');
  assert.ok(variants.some((item) => item.value === 'Agnetha Fältskog'));
  assert.ok(variants.some((item) => item.value === 'Agnetha Faltskog'));
});

test('verwijdert diakritische tekens zonder de bronnaam te muteren', () => {
  assert.equal(Discogs.stripDiacritics('Agnetha Fältskog'), 'Agnetha Faltskog');
  assert.equal(Discogs.stripDiacritics('Sinéad O’Connor'), 'Sinead O’Connor');
  assert.equal(Discogs.stripDiacritics('Motörhead'), 'Motorhead');
});

test('rangschikt exacte naam boven accentloze en gedeeltelijke matches', () => {
  const exact = { discogs_name: 'Agnetha Fältskog' };
  const accentless = { discogs_name: 'Agnetha Faltskog' };
  const partial = { discogs_name: 'Agnetha' };
  assert.ok(Discogs.scoreArtistSearchResult(exact, 'Agnetha Fältskog') > Discogs.scoreArtistSearchResult(accentless, 'Agnetha Fältskog'));
  assert.ok(Discogs.scoreArtistSearchResult(accentless, 'Agnetha Fältskog') > Discogs.scoreArtistSearchResult(partial, 'Agnetha Fältskog'));
});

test('zoekt met meerdere varianten, dedupliceert op Discogs-id en behoudt correcte naam', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url) => {
    calls.push(String(url));
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q');
    const results = q.includes('Faltskog')
      ? [{ id: 149038, title: 'Agnetha Fältskog', type: 'artist', uri: '/artist/149038' }]
      : [];
    return { ok: true, status: 200, json: async () => ({ pagination: { items: 1 }, results }) };
  };
  try {
    const result = await Discogs.searchArtists('Agnetha Fältskog', { limit: 10, env });
    assert.ok(calls.length >= 2);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].discogs_artist_id, 149038);
    assert.equal(result.items[0].discogs_name, 'Agnetha Fältskog');
    assert.deepEqual(result.items[0].matched_by, ['diacritic_stripped']);
  } finally {
    global.fetch = originalFetch;
  }
});
