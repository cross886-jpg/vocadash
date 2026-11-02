// ==============================================================================
// VocaDash - Pure Weakness Quiz Queue Build Test (Karpathy Guidelines)
// 외부 일반 단어 혼입 배제 및 오답 단어 SSOT 기준 10문제 순환 큐 검증
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock Environment
global.window = global;
global.localStorage = {
  _store: {},
  getItem: k => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: k => { delete global.localStorage._store[k]; },
  clear: () => { global.localStorage._store = {}; }
};

global.document = {
  getElementById: () => null,
  createElement: () => ({ classList: { add: () => {}, remove: () => {} }, style: {} }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Modules
eval(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/quizSessionGenerator.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/reviewManager.js'), 'utf-8'));

console.log('🧪 Starting test_pure_weakness_quiz_queue.js...');

// --- TEST 1: buildWeaknessQuizQueue with 1 wrong word ---
const singleWrongWord = [{ id: 'w_only_1', term: 'Difícil', meaning: '어려운', lang: 'es' }];
const queue1 = window.buildWeaknessQuizQueue(singleWrongWord, 10);

assert.strictEqual(queue1.length, 10, 'Queue must contain exactly 10 questions');
assert(
  queue1.every(q => q.id === 'w_only_1' && q.term === 'Difícil'),
  'All 10 questions must be copies of the single wrong word'
);
console.log('✅ PASS: 1 wrong word -> 10 question queue contains purely 10 repetitions of that 1 word');

// --- TEST 2: buildWeaknessQuizQueue with 7 wrong words ---
const sevenWrongWords = [
  { id: 'w1', term: 'Palabra 1' },
  { id: 'w2', term: 'Palabra 2' },
  { id: 'w3', term: 'Palabra 3' },
  { id: 'w4', term: 'Palabra 4' },
  { id: 'w5', term: 'Palabra 5' },
  { id: 'w6', term: 'Palabra 6' },
  { id: 'w7', term: 'Palabra 7' }
];
const queue7 = window.buildWeaknessQuizQueue(sevenWrongWords, 10);

assert.strictEqual(queue7.length, 10, 'Queue must contain exactly 10 questions');
const validIds7 = new Set(sevenWrongWords.map(w => w.id));

// Verify that EVERY question in queue7 comes from the 7 wrong words
assert(
  queue7.every(q => validIds7.has(q.id)),
  'Every single question in queue must be from the 7 wrong words (NO foreign words!)'
);

// Verify all 7 original words appeared at least once
const appearedIds = new Set(queue7.map(q => q.id));
assert.strictEqual(appearedIds.size, 7, 'All 7 wrong words must be included in the 10 questions');
console.log('✅ PASS: 7 wrong words -> Exactly 10 questions purely composed of the 7 wrong words (no foreign words)');

// --- TEST 3: buildWeaknessQuizQueue with 0 wrong words ---
const queue0 = window.buildWeaknessQuizQueue([], 10);
assert.deepStrictEqual(queue0, [], 'Empty wrong words list must return empty queue');
console.log('✅ PASS: 0 wrong words -> Returns empty queue [] cleanly');

// --- TEST 4: buildWeaknessQuizQueue with 12 wrong words ---
const twelveWrongWords = Array.from({ length: 12 }, (_, i) => ({ id: `w_${i + 1}`, term: `T_${i + 1}` }));
const queue12 = window.buildWeaknessQuizQueue(twelveWrongWords, 10);
assert.strictEqual(queue12.length, 10, 'Queue must cap at targetCount 10');
assert(
  queue12.every(q => twelveWrongWords.some(w => w.id === q.id)),
  'All 10 questions must belong to the 12 wrong words'
);
console.log('✅ PASS: 12 wrong words -> Selects 10 questions purely from the wrong words');

// --- TEST 5: generateReviewSession SSOT integration with loadWrongWords ---
// Set exactly 2 wrong words in localStorage
const mockTwoWrongWords = [
  { id: 'wrong_es_1', term: 'Perro', meaning: '개', lang: 'es', escaped: false, correctStreak: 1 },
  { id: 'wrong_es_2', term: 'Gato', meaning: '고양이', lang: 'es', escaped: false, correctStreak: 0 }
];
window.saveWrongWords(mockTwoWrongWords, 'es');

const reviewSession = window.generateReviewSession(1, 'es');

assert.strictEqual(reviewSession.length, 10, 'generateReviewSession must generate 10 questions');
const sessionIds = reviewSession.map(q => q.id);

// Critical Karpathy check: verify that general course words (es_101, es_102, node-1 words) NEVER appear!
const courseNode1WordIds = window.courseData_es.units[0].words.map(w => w.id);
assert(
  reviewSession.every(q => q.id === 'wrong_es_1' || q.id === 'wrong_es_2'),
  'generateReviewSession must NOT pull outside general stage words into the review queue!'
);
assert(
  !reviewSession.some(q => courseNode1WordIds.includes(q.id)),
  'Review session must NOT contain any words from general course node-1 pool'
);
console.log('✅ PASS: generateReviewSession strictly restricts SSOT to loadWrongWords without node-1 padding');

// --- TEST 6: 0 wrong words produces 0 review questions without fallback contamination ---
window.saveWrongWords([], 'es');
const emptyReviewSession = window.generateReviewSession(1, 'es');
assert.deepStrictEqual(emptyReviewSession, [], '0 wrong words must yield empty session (no artificial padding)');
console.log('✅ PASS: 0 wrong words cleanly returns [] without foreign course words padding');

console.log('\n🎉 ALL TESTS IN test_pure_weakness_quiz_queue.js PASSED PERFECTLY! 🚀\n');

