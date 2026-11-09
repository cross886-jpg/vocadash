/**
 * tests/test_spanish_data_clean.js
 * Verifies that Spanish master runtime data (js/data/data_es.js) adheres to:
 * 1. 167 units and 4,998 words integrity.
 * 2. Clean unit titles (Unit X. Level Name) without Roman numerals.
 * 3. 0 single-character particle fragments or grammar/transliteration errors.
 * 4. Standard canonical meanings for core verbs and words (ser, haber, poder, hablar, etc.).
 */
const assert = require('assert');
const data_es = require('../js/data/data_es.js');

assert(data_es && data_es.units, "courseData_es.units must exist");
assert.strictEqual(data_es.totalUnits, 167, "Must have exactly 167 units");
assert.strictEqual(data_es.allWords.length, 4998, "Must have exactly 4998 words");

// 1. Unit Titles Check: No Roman numerals
const ROMAN_TRAILING_REGEX = /\s+[IVXLCDM]+$/i;
data_es.units.forEach(u => {
  const title = u.title || '';
  assert(!ROMAN_TRAILING_REGEX.test(title), `Unit ${u.unitNumber} title '${title}' contains trailing Roman numerals!`);
});

const unit1 = data_es.units.find(u => u.unitNumber === 1);
assert.strictEqual(unit1.title, "Unit 1. A1 기초 핵심 어휘");

const unit68 = data_es.units.find(u => u.unitNumber === 68);
assert.strictEqual(unit68.title, "Unit 68. A2 실전 도약 어휘");

// 2. Disallowed particles check
const DISALLOWED_PARTICLES = new Set([
  '을', '를', '에', '의', '로', '와', '과', '서', '도', '은', '는', '이', '가', '만', '게', '할', '일',
  '고', '며', '랑', '않', '하', '되', '인', '된', '1', '개', '대', '약', '봐', '더', '덜', '살', '다', '내'
]);

data_es.allWords.forEach(w => {
  const m = (w.meaning || '').trim();
  assert(!DISALLOWED_PARTICLES.has(m), `Word '${w.word}' (rank ${w.rank}) has disallowed particle meaning '${m}'`);
  assert(!m.includes('팔로우'), `Word '${w.word}' contains transliterated error '팔로우'`);
  assert(!m.includes('라이브'), `Word '${w.word}' contains transliterated error '라이브'`);
  assert(!m.includes('테이크 아웃'), `Word '${w.word}' contains transliterated error '테이크 아웃'`);
});

// 3. Core verbs and word check
const EXPECTED_WORDS = {
  ser: '이다',
  haber: '있다',
  poder: '할수있다',
  hablar: '말하다',
  volver: '돌아가다',
  trabajar: '일하다',
  vivir: '살다',
  seguir: '계속하다',
  gustar: '좋아하다',
  conde: '백작',
  mira: '보아라',
  perro: '강아지'
};

Object.entries(EXPECTED_WORDS).forEach(([word, expectedMeaning]) => {
  const item = data_es.wordMap[word];
  assert(item, `Word '${word}' not found in wordMap`);
  assert.strictEqual(item.meaning, expectedMeaning, `Expected '${word}' to have meaning '${expectedMeaning}', got '${item.meaning}'`);
});

console.log(`✅ [Spanish Data Clean Test Passed] 4,998 words, 167 units, 0 Roman numerals, 0 particle defects.`);

