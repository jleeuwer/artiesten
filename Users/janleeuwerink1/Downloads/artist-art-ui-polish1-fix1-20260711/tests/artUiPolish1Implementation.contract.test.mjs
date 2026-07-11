import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../client/src/components/ArtistPageContent.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../client/src/app.css", import.meta.url), "utf8");
const model = readFileSync(new URL("../models/artist.js", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("ART-UI-POLISH-1 levert primary_image_url in dezelfde artiestenlijstquery", () => {
  assert.match(model, /primary_image\.external_image_url AS primary_image_url/);
  assert.match(model, /LEFT JOIN LATERAL[\s\S]*artist_external_image[\s\S]*is_primary = true[\s\S]*LIMIT 1/);
});

test("ART-UI-POLISH-1 gebruikt geen per-row image query in de frontend", () => {
  assert.match(page, /artist\?\.primary_image_url/);
  assert.doesNotMatch(page, /items\.map\([\s\S]{0,500}api\.(getDiscogsImages|listDiscogsImages)/);
});

test("ART-UI-POLISH-1 rendert een compacte lazy-loaded thumbnail", () => {
  assert.match(page, /className="artist-list-thumbnail"/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /width="32"/);
  assert.match(page, /height="32"/);
  assert.match(css, /\.artist-list-thumbnail[\s\S]*width: 32px[\s\S]*height: 32px[\s\S]*object-fit: cover/);
});

test("ART-UI-POLISH-1 toont een toegankelijke fallback zonder kapotte img", () => {
  assert.match(page, /onError=\{\(\) => setImageFailed\(true\)\}/);
  assert.match(page, /artist-list-thumbnail-fallback/);
  assert.match(page, /Geen profielfoto beschikbaar voor/);
  assert.match(page, /useEffect\(\(\) => \{\s*setImageFailed\(false\);\s*\}, \[imageUrl\]\)/);
});

test("ART-UI-POLISH-1 toont overleden-indicator alleen bij gevulde passing", () => {
  assert.match(page, /Boolean\(String\(artist\?\.ar_artist_passing \|\| ""\)\.trim\(\)\)/);
  assert.match(page, /bi bi-hourglass-bottom/);
  assert.match(page, /title=\{`Artiest overleden/);
  assert.match(page, /aria-label="Artiest overleden"/);
});

test("ART-UI-POLISH-1 voegt de profielkolom toe en houdt colspans consistent", () => {
  assert.match(page, />Profiel<\/th>/);
  assert.match(page, /<ArtistListIdentityVisual artist=\{r\} \/>/);
  const colspans = [...page.matchAll(/colSpan=\{(\d+)\}/g)].map((m) => Number(m[1]));
  assert.ok(colspans.includes(12));
});

test("ART-UI-POLISH-1 behoudt directe local-state refresh na primary image wijziging", () => {
  assert.match(page, /setItems\(\(prev\) => prev\.map/);
  assert.match(page, /primary_image_url: primary\.external_image_url/);
  assert.match(page, /setSelectedArtist/);
});

test("ART-UI-POLISH-1 is opgenomen in de npm regressiesuite", () => {
  assert.ok(pkg.scripts["test:art-ui-polish1"]);
  assert.match(pkg.scripts["test:unit"], /test:art-ui-polish1/);
});
