import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../client/src/components/ArtistPageContent.jsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../client/src/components/ArtistFormModal.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../client/src/app.css", import.meta.url), "utf8");
const model = readFileSync(new URL("../models/artist.js", import.meta.url), "utf8");

test("ART-UI-1A maakt edit-modal breder", () => {
  assert.match(modal, /size="xl"/);
  assert.match(css, /artist-form-modal-dialog[\s\S]*1280px/);
});

test("ART-UI-1A voegt paneelnavigatie toe voor onderste detailgebied", () => {
  assert.match(page, /relationPanelView/);
  assert.match(page, /Detailpanelen activeren/);
  assert.match(page, /setRelationPanelView\("relations"\)/);
  assert.match(page, /setRelationPanelView\("discogs"\)/);
  assert.match(page, /setRelationPanelView\("duplicates"\)/);
  assert.match(css, /artist-relation-section-nav/);
});

test("ART-UI-1A maakt scrollgedrag van relatiepaneel voorspelbaar", () => {
  assert.match(css, /\.artist-relation-panel[\s\S]*overflow-y: auto/);
  assert.match(css, /overscroll-behavior: contain/);
  assert.match(css, /overflow-x: hidden/);
});

test("ART-UI-1A toont externe Discogs profieltekst vanuit relations", () => {
  assert.match(model, /artist_external_profile/);
  assert.match(model, /externalProfiles/);
  assert.match(page, /Discogs profieltekst/);
  assert.match(page, /artist-external-profile-text/);
});
