import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("ART-012D-3A canonical rename preview is wired", () => {
  const model = read("models/artist.js");
  const controller = read("controllers/artistController.js");
  const routes = read("routes/artistRoutes.js");
  const api = read("client/src/api.js");
  const ui = read("client/src/components/ArtistPageContent.jsx");
  const docs = read("docs/ART_012D_3A_Canonical_Rename_Preview_Implementatie.md");
  const runbook = read("docs/ART_012D_3A_Testcases_en_Runbook.md");
  const pkg = JSON.parse(read("package.json"));

  assert.match(model, /async function getDiscogsCanonicalRenamePreview/);
  assert.match(model, /preview_only:\s*true/);
  assert.match(model, /no_mutations:\s*true/);
  assert.match(model, /preserve_old_canonical_as_spelling/);
  assert.match(model, /ensure_new_canonical_in_spelling/);
  assert.match(model, /SPELLING_CONFLICT_OTHER_ARTIST/);
  assert.match(model, /CANONICAL_NAME_CONFLICT/);

  assert.match(controller, /getDiscogsCanonicalRenamePreview/);
  assert.match(routes, /\/discogs\/spelling-proposals\/canonical-preview/);
  assert.match(api, /previewDiscogsCanonicalRename/);

  assert.doesNotMatch(ui, /Preview canonical/);
  assert.doesNotMatch(ui, /artist-discogs-canonical-preview-btn/);
  assert.doesNotMatch(ui, /artist-discogs-canonical-preview/);
  assert.match(ui, /Discogs naamvoorstellen reviewqueue/);

  assert.match(docs, /geen mutaties/i);
  assert.match(docs, /artist\.ar_artist_name/);
  assert.match(docs, /artiesten_spelling/);
  assert.match(runbook, /npm run test:art012d3a/);

  assert.ok(pkg.scripts["test:art012d3a"].includes("art012d3aCanonicalRenamePreview.contract.test.mjs"));
  assert.ok(pkg.scripts["test:art012d"].includes("test:art012d3a"));
});
