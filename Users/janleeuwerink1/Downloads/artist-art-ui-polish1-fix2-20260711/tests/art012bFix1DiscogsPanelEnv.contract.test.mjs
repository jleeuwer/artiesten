import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('ART-012B-Fix-1 Discogs results panel uses full-width scroll-safe layout', () => {
  const page = read('client/src/components/ArtistPageContent.jsx');
  const css = read('client/src/app.css');

  assert.match(page, /artist-discogs-results-wrap/);
  assert.match(page, /artist-discogs-results-table/);
  assert.match(page, /artist-discogs-action-col/);
  assert.match(page, /artist-discogs-detail-button/);

  assert.match(css, /\.artist-relation-grid > \.artist-discogs-card\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(css, /\.artist-discogs-results-wrap\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.artist-discogs-results-wrap\s*\{[^}]*padding-bottom:\s*1rem/s);
  assert.match(css, /\.artist-discogs-results-table\s*\{[^}]*min-width:\s*46rem/s);
  assert.match(css, /\.artist-discogs-action-col\s*\{[^}]*min-width:\s*8rem/s);
  assert.match(css, /\.artist-discogs-detail-button\s*\{[^}]*min-width:\s*5\.5rem/s);
});

test('ART-012B-Fix-1 env example and refresh script contain canonical Discogs and image-cache variables only', () => {
  const envExample = read('.env.example');
  const refresh = read('scripts/env-refresh-example.sh');

  for (const required of [
    'DISCOGS_USER_TOKEN=',
    'DISCOGS_USER_AGENT=MusicappArtist/1.0',
    'DISCOGS_BASE_URL=https://api.discogs.com',
    'DISCOGS_REQUEST_TIMEOUT_MS=10000',
    'DISCOGS_CACHE_TTL_SECONDS=21600',
    'ARTIST_IMAGE_CACHE_ENABLED=false',
    'ARTIST_IMAGE_CACHE_DIR=data/cache/artist-images',
    'ARTIST_IMAGE_CACHE_MAX_AGE_DAYS=30',
    'ARTIST_DUPLICATE_MIN_SCORE=82',
    'ARTIST_DUPLICATE_MAX_CANDIDATES=500',
    'ARTIST_DUPLICATE_ALERT_ENABLED=true',
    'ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25',
    'ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14',
    'ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true',
    'ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1'
  ]) {
    assert.match(envExample, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(refresh, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(envExample, /^DISCOGS_API_TOKEN=/m);
  assert.doesNotMatch(envExample, /^DISCOGS_API_BASE_URL=/m);
  assert.doesNotMatch(envExample, /^DISCOGS_ENABLED=/m);
  assert.doesNotMatch(envExample, /ImporterenSongs\/1\.25\.6/);
});

test('ART-012B-Fix-1 docs and release notes are present', () => {
  assert.ok(existsSync('Release Notes/ART_012B_Fix_1_Discogs_Panel_Env_Release_Notes.md'));
  assert.match(read('docs/ART_012B_Discogs_Search_Detail_Implementatie.md'), /ART-012B-Fix-1/);
  assert.match(read('docs/BACKLOG.md'), /ART-012B-Fix-1/);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-012B-Fix-1/);
});
