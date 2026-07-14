import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

test("create-member stelt musicianKey-validatie uit tot na musician-create", () => {
  const service = read("services/musicianInBandService.js");
  assert.match(service, /requireMusicianReference:\s*false/);
  assert.match(service, /requireBandReference:\s*true/);
  assert.match(service, /membership\.musicianKey\s*=\s*createdMusician\.musician_key/);
});

test("normale create-flow blijft musicianKey en bandArtistKey verplicht stellen", () => {
  const service = read("services/musicianInBandService.js");
  assert.match(service, /create:\s*\(body\)\s*=>\s*Model\.create\(normalizeMembershipPayload\(body\)\)/);
});

test("validator ondersteunt onafhankelijke referentievereisten", () => {
  const validator = read("validators/musicianInBandValidator.js");
  assert.match(validator, /requireMusicianReference\s*=\s*requireReferences/);
  assert.match(validator, /requireBandReference\s*=\s*requireReferences/);
  assert.match(validator, /requireMusicianReference\s*\?\s*positiveInteger/);
  assert.match(validator, /requireBandReference\s*\?\s*positiveInteger/);
});
