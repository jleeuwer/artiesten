import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const doc=fs.readFileSync('docs/ART_012D_4_VAL_1_Testcases_en_Runbook.md','utf8');
for(let i=1;i<=84;i++){
  const id=`D4V1-TC-${String(i).padStart(3,'0')}`;
  test(`${id} blijft traceerbaar`,()=>assert.match(doc,new RegExp(id)));
}
