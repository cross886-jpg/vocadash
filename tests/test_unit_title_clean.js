/**
 * tests/test_unit_title_clean.js
 * Verifies that unit titles in js/data/data_en.js have no Roman numerals appended.
 */
const assert = require('assert');
const data_en = require('../js/data/data_en.js');

assert(data_en && data_en.units, "courseData_en.units must exist");

const units = Array.isArray(data_en.units) ? data_en.units : Object.values(data_en.units);

// Roman numeral pattern at the end of a title
const ROMAN_TRAILING_REGEX = /\s+[IVXLCDM]+$/i;

units.forEach(u => {
  const title = u.title || '';
  assert(!ROMAN_TRAILING_REGEX.test(title), `Unit ${u.unitNumber} title '${title}' still contains trailing Roman numerals!`);
});

// Specifically check Unit 68 as requested
const unit68 = units.find(u => u.unitNumber === 68);
assert(unit68, "Unit 68 must exist");
assert.strictEqual(unit68.title, "Unit 68. A2 실전 도약 어휘", `Expected 'Unit 68. A2 실전 도약 어휘', got '${unit68.title}'`);

// Specifically check Unit 1
const unit1 = units.find(u => u.unitNumber === 1);
assert(unit1, "Unit 1 must exist");
assert.strictEqual(unit1.title, "Unit 1. A1 기초 핵심 어휘", `Expected 'Unit 1. A1 기초 핵심 어휘', got '${unit1.title}'`);

console.log(`✅ All ${units.length} unit titles verified: 0 trailing Roman numerals. Unit 68 title: '${unit68.title}'`);

