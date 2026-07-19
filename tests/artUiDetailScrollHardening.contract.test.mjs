import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../client/src/components/ArtistPageContent.jsx', import.meta.url), 'utf8');
const queue = fs.readFileSync(new URL('../client/src/features/musician-in-band-proposals/DiscogsBandMemberProposalQueue.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../client/src/app.css', import.meta.url), 'utf8');

test('ART-UI-DETAILS-1 provides one accessible all-or-nothing details toggle', () => {
  assert.match(page, /function RelationDetailSection/);
  assert.match(page, /const \[showRelationDetails, setShowRelationDetails\]/);
  assert.match(page, /aria-expanded=\{showRelationDetails\}/);
  assert.match(page, /aria-controls="artist-relation-section-songs artist-relation-section-spellings artist-relation-section-charts artist-relation-section-merge-history"/);
  assert.match(page, /showRelationDetails \? "Verberg details" : "Toon details"/);
  assert.match(page, /\{showRelationDetails \? \(<>/);
  assert.doesNotMatch(page, /function CollapsibleRelationSection/);
  assert.doesNotMatch(page, /toggleRelationSection/);
  assert.match(page, /title="Songs"/);
  assert.match(page, /title="Alternatieve spellingen"/);
  assert.match(page, /title="Hitlijsten"/);
  assert.match(page, /title="Mergehistorie"/);
});

test('ART-013B-2-UX-1 keeps proposal actions stable and messages compact', () => {
  assert.match(queue, /discogs-member-proposal-message/);
  assert.match(queue, /discogs-member-proposal-actionbar/);
  assert.match(css, /flex-wrap:\s*nowrap/);
  assert.match(css, /-webkit-line-clamp:\s*2/);
  assert.match(css, /min-width:\s*max-content/);
});

test('ART-013B-2-UX-2 restores proposal-list scroll and focus without scrolling', () => {
  assert.match(queue, /pendingAnchorRef/);
  assert.match(queue, /scrollTop:wrap\?\.scrollTop/);
  assert.match(queue, /wrap\.scrollTop=anchor\.scrollTop/);
  assert.match(queue, /focus\(\{preventScroll:true\}\)/);
  assert.match(queue, /data-proposal-key/);
});

test('ART-UI-SCROLL-2 assigns explicit scroll ownership and disables anchoring', () => {
  assert.match(css, /discogs-member-proposal-table-wrap/);
  assert.match(css, /overscroll-behavior:\s*contain/);
  assert.match(css, /overflow-anchor:\s*none/);
  assert.match(css, /artist-workspace-embedded[\s\S]*scroll-behavior:\s*auto/);
});
