// ==============================================================================
// VocaDash - In-game Quiz Queue Shuffle Isolation Test (Karpathy Guidelines)
// 단어 예습(플래시카드) 순서(1~10번) 탈피 및 인게임 퀴즈 큐 무작위 셔플 검증
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock Browser Environment
global.window = global;
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
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

// 2. Load Core Data & Modules
eval(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/quizSessionGenerator.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/lessonModal.js'), 'utf-8'));

console.log('🧪 Starting test_quiz_queue_shuffle_isolation.js...');

// --- TEST 1: shuffleArray utility preserves original array immutability ---
const originalArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const originalCopyBefore = [...originalArr];

const shuffled = window.shuffleArray(originalArr);

// Original must remain untouched
assert.deepStrictEqual(originalArr, originalCopyBefore, 'shuffleArray MUST NOT mutate original array in-place');
assert.notStrictEqual(shuffled, originalArr, 'shuffleArray must return a distinct new array instance');
assert.strictEqual(shuffled.length, originalArr.length, 'Shuffled array must have identical length');

// All original elements must be preserved in shuffled array
const sortedShuffled = [...shuffled].sort((a, b) => a - b);
assert.deepStrictEqual(sortedShuffled, originalArr, 'Shuffled array must contain all original elements');
console.log('✅ PASS: shuffleArray creates a shallow copy, preserves all elements, and leaves input untouched');

// --- TEST 2: Flashcard Stage 1 Deck maintains curriculum 1~10 order ---
const stage1Deck = window.quizSessionGenerator.generateDeckForStage('node-1', 'es', 0);
assert.strictEqual(stage1Deck.length, 10, 'Stage 1 deck must have 10 words');

const expectedIds = ['es_101', 'es_102', 'es_103', 'es_104', 'es_105', 'es_106', 'es_107', 'es_108', 'es_109', 'es_110'];
const actualDeckIds = stage1Deck.map(w => w.id);
assert.deepStrictEqual(actualDeckIds, expectedIds, 'Flashcard session must deliver words in curriculum order (1번~10번)');
console.log('✅ PASS: Flashcard preview preserves clean 1~10 curriculum sequence');

// --- TEST 3: openGameScreen initializes in-game quiz questions with Fisher-Yates shuffle ---
const flashcardSession = stage1Deck.map(w => ({ ...w }));
const sessionSnapshotBefore = JSON.stringify(flashcardSession.map(w => w.id));

window.openGameScreen('node-1', flashcardSession);

// A. flashcardSession must NOT be mutated in-place
const sessionSnapshotAfter = JSON.stringify(flashcardSession.map(w => w.id));
assert.strictEqual(sessionSnapshotBefore, sessionSnapshotAfter, 'Incoming session array must NOT be mutated in-place');

// B. window.gameQuestions must be shuffled and NOT match the flashcard 1~10 order
const gameQuestionIds = window.gameQuestions.map(w => w.id);
assert.strictEqual(gameQuestionIds.length, 10, 'gameQuestions must contain 10 questions');
assert.deepStrictEqual(
  [...gameQuestionIds].sort(),
  [...expectedIds].sort(),
  'gameQuestions must contain all 10 words from session'
);

// Verify that the order is actually shuffled (probability of identical 10-item permutation is 1/3,628,800)
assert.notDeepStrictEqual(
  gameQuestionIds,
  expectedIds,
  'In-game quiz question queue MUST NOT match the flashcard 1~10 order!'
);
console.log(`✅ PASS: In-game runner quiz queue is randomized: [${gameQuestionIds.slice(0, 5).join(', ')}...] != [${expectedIds.slice(0, 5).join(', ')}...]`);

// --- TEST 4: Multiple game starts or restarts create distinct permutations ---
const permutations = new Set();
for (let i = 0; i < 5; i++) {
  window.openGameScreen('node-1', flashcardSession);
  permutations.add(window.gameQuestions.map(w => w.id).join(','));
}
assert(permutations.size >= 3, 'Multiple game launches should produce varying random order');
console.log(`✅ PASS: Dynamic re-shuffling generated ${permutations.size} distinct permutations across 5 runs`);

// --- TEST 5: Object nodeData input from navigation.js also shuffles properly ---
const nodeData = {
  nodeId: 'node-2',
  lessonId: 'node-2',
  session: expectedIds.map(id => ({ id, word: id }))
};
window.openGameScreen(nodeData);
const nodeDataQuestionIds = window.gameQuestions.map(w => w.id);
assert.strictEqual(nodeDataQuestionIds.length, 10);
assert.notDeepStrictEqual(nodeDataQuestionIds, expectedIds, 'nodeData input must also shuffle queue');
console.log('✅ PASS: nodeData object pipeline also shuffles quiz question queue properly');

console.log('\n🎉 ALL TESTS IN test_quiz_queue_shuffle_isolation.js PASSED PERFECTLY! 🚀\n');
