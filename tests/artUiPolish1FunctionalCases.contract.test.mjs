import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cases = readFileSync(new URL("../docs/ART_UI_POLISH_1_Testcases_en_Runbook.md", import.meta.url), "utf8");
const design = readFileSync(new URL("../docs/ART_UI_POLISH_1_Thumbnail_Overleden_Indicator_Functioneel_Technisch_Ontwerp.md", import.meta.url), "utf8");

for (let i = 1; i <= 48; i += 1) {
  const id = `UI-P1-TC-${String(i).padStart(3, "0")}`;
  test(`${id} blijft traceerbaar in de functionele testbasis`, () => {
    assert.match(cases, new RegExp(id));
  });
}

test("ontwerp legt vast dat geen databasemigratie nodig is", () => {
  assert.match(design, /geen databasemigratie/i);
});

test("ontwerp borgt dezelfde lijstquery en geen N\+1", () => {
  assert.match(design, /LEFT JOIN LATERAL/i);
  assert.match(design, /N\+1/i);
});
