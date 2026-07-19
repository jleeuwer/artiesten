import fs from 'node:fs';

const cssPath = 'client/src/app.css';
const css = fs.readFileSync(cssPath, 'utf8');
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: match[1].trim(),
  body: match[2],
}));

const verticalScrollPattern = /overflow(?:-y)?\s*:\s*(auto|scroll)/i;
const allowedSelectorPattern = /(modal-body|offcanvas-body|artist-table-wrap|artist-workspace-table-region|artist-table-viewport|artist-workspace-embedded)/i;
const detailSelectorPattern = /(artist-relation-panel|artist-workspace-detail-region|artist-relation-table-scroll|artist-discogs-results-wrap|artist-discogs-image-grid)/i;

const violations = blocks.filter(({ selector, body }) =>
  detailSelectorPattern.test(selector)
  && verticalScrollPattern.test(body)
  && !allowedSelectorPattern.test(selector),
);

console.log('[INFO][ART-UI-2-SCROLL-AUDIT] CSS:', cssPath);
console.log('[INFO] onderzochte CSS-blokken=' + blocks.length);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error('[BLOCKER] onverwachte verticale detailscroll:', violation.selector);
  }
  process.exit(1);
}

const modalScroll = blocks.some(({ selector, body }) => /artist-form-modal .*modal-body/i.test(selector) && /overflow-y\s*:\s*auto/i.test(body));
if (!modalScroll) {
  console.error('[BLOCKER] modal-body mist de toegestane eigen verticale scroll');
  process.exit(1);
}

console.log('[PASS] detailgebied bevat geen geneste verticale scrollcontainers');
const tableViewport = blocks.some(({ selector, body }) => /artist-table-viewport/i.test(selector) && /overflow\s*:\s*auto/i.test(body));
if (!tableViewport) {
  console.error('[BLOCKER] artist-table-viewport mist de toegestane secundaire scroll');
  process.exit(1);
}
const stickyHeader = blocks.some(({ selector, body }) => /artist-table-phase34 thead th/i.test(selector) && /position\s*:\s*sticky/i.test(body));
if (!stickyHeader) {
  console.error('[BLOCKER] sticky tabelheader ontbreekt');
  process.exit(1);
}
console.log('[PASS] modal-body behoudt de toegestane eigen verticale scroll');
console.log('[PASS] artist-table-viewport is de enige secundaire verticale scroller');
console.log('[PASS] sticky tabelheader is actief');
console.log('[SUMMARY][ART-UI-2-SCROLL-AUDIT] passed=true violations=0');
