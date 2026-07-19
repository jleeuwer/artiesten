import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../client/src/components/ArtistPageContent.jsx', import.meta.url), 'utf8');
const notification = fs.readFileSync(new URL('../client/src/components/AppNotification.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../client/src/app.css', import.meta.url), 'utf8');

test('ART-UI-MSG-1 centralizes severity-aware notifications', () => {
  assert.match(page, /import AppNotification/);
  assert.match(notification, /success:/);
  assert.match(notification, /info:/);
  assert.match(notification, /warning:/);
  assert.match(notification, /danger:/);
  assert.match(notification, /aria-live=/);
  assert.match(notification, /role=/);
  assert.match(notification, /technicalCode/);
  assert.match(css, /ART-UI-MSG-1/);
});

test('ART-012C-UX-2 closes Discogs results and detail after linking', () => {
  const linkFunction = page.slice(page.indexOf('async function linkDiscogsDetailToArtist'), page.indexOf('async function setPrimaryDiscogsImage'));
  assert.match(linkFunction, /setDiscogsResults\(null\)/);
  assert.match(linkFunction, /setDiscogsDetail\(null\)/);
  assert.match(linkFunction, /setDiscogsLinkResult\(null\)/);
  assert.match(linkFunction, /Discogs-koppeling voltooid/);
  assert.match(linkFunction, /relationPanelRef\.current\?\.focus/);
  assert.match(linkFunction, /relationPanelRef\.current\?\.scrollIntoView/);
  assert.match(page, /ref=\{relationPanelRef\} tabIndex=\{-1\}/);
});
