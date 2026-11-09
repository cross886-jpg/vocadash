/**
 * tests/verify_no_meaning_fragments.js
 * Verifies that 0 disallowed 1-character particles / fragments remain in js/data/data_en.js.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DISALLOWED_JOSA = new Set([
  '을', '를', '에', '의', '로', '개', '일', '와', '과', '서', '도', '은', '는', '이', '가', '만', '게', '보', '더', '할',
  '고', '며', '랑', '않', '하', '되', '인', '된', '1'
]);

const data_en = require('../js/data/data_en.js');
assert(data_en && data_en.units, "courseData_en.units must exist");

const units = Array.isArray(data_en.units) ? data_en.units : Object.values(data_en.units);
assert.strictEqual(units.length, 167, `Expected 167 units, got ${units.length}`);

let totalWords = 0;
const violations = [];

units.forEach(unit => {
  (unit.words || []).forEach(w => {
    totalWords++;
    const m = (w.meaning || '').trim();
    if (DISALLOWED_JOSA.has(m)) {
      violations.push({ rank: w.rank, word: w.word, meaning: m });
    }
  });
});

console.log(`Total words verified in js/data/data_en.js: ${totalWords}`);
console.log(`Violations found: ${violations.length}`);

assert.strictEqual(totalWords, 4998, `Expected 4998 words, got ${totalWords}`);
assert.strictEqual(violations.length, 0, `Expected 0 violations, got ${violations.length}: ${JSON.stringify(violations)}`);

console.log("✅ Node.js Runtime Verification PASSED: exactly 0 disallowed josa/particles in js/data/data_en.js!");
