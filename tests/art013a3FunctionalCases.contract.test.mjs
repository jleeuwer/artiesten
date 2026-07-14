import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const doc=fs.readFileSync('docs/ART_013A_3_Testcases_en_Runbook.md','utf8');
for(let i=1;i<=100;i++){const id=`A3-TC-${String(i).padStart(3,'0')}`;test(`${id} remains traceable`,()=>assert.match(doc,new RegExp(id)));}
