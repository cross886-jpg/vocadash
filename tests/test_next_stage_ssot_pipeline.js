// ==============================================================================
// VocaDash - Next Stage SSOT Pipeline Test (Karpathy Guidelines)
// 2과 1스테이지 완료 후 [다음 회차] 클릭 시 2스테이지 단어가 정상 출제되는지 검증
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock DOM & localStorage
global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.history = { pushState() {}, replaceState() {} };
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
const storage = {};
global.localStorage = {
  getItem: k => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const domElements = {};
function createMockEl(id, tagName = 'div') {
  const classSet = new Set();
  return {
    id,
    tagName: tagName.toUpperCase(),
    classList: {
      add: (...cls) => cls.forEach(c => classSet.add(c)),
      remove: (...cls) => cls.forEach(c => classSet.delete(c)),
      contains: c => classSet.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
        } else if (force) classSet.add(c);
        else classSet.delete(c);
      }
    },
    style: {
      removeProperty: p => { delete domElements[id]?.style[p]; },
      setProperty: () => {}
    },
    textContent: '',
    children: [],
    dataset: {},
    addEventListener() {},
    querySelectorAll: () => [],
    querySelector: () => null
  };
}

global.document = {
  readyState: 'complete',
  getElementById(id) {
    if (!domElements[id]) domElements[id] = createMockEl(id);
    return domElements[id];
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
    return createMockEl(sel);
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Modules
global.currentLanguage = 'es';
global.currentActiveCourse = 'es';

eval(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/quizSessionGenerator.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/navigation.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/lessonModal.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf-8'));

console.log('🧪 Starting test_next_stage_ssot_pipeline.js...');

// --- TEST 1: normalizeLessonId handles composite keys accurately ---
assert.strictEqual(window.normalizeLessonId('node-1'), 'node-1');
assert.strictEqual(window.normalizeLessonId('u1_node-1'), 'node-1');
assert.strictEqual(window.normalizeLessonId('node-2'), 'node-2');
assert.strictEqual(window.normalizeLessonId('u1_node-2'), 'node-2', 'u1_node-2 MUST normalize to node-2, NOT node-1');
assert.strictEqual(window.normalizeLessonId('u1_node-3'), 'node-3');
assert.strictEqual(window.normalizeLessonId('u1_node-boss'), 'node-boss');
console.log('✅ PASS: normalizeLessonId resolves u1_node-2 to node-2 without u1 collision');

// --- TEST 2: Word pool isolation between 1과 and 2과 ---
const unit1Words = window.courseData_es.units[0].words;
const node1WordIds = new Set(window.courseData_es.units[0].nodes[0].wordIds);
const node2WordIds = new Set(window.courseData_es.units[0].nodes[1].wordIds);

// Verify node-1 and node-2 words are distinct
assert(node1WordIds.size > 0 && node2WordIds.size > 0);
for (const id of node2WordIds) {
  assert(!node1WordIds.has(id), `Node 2 word ${id} should not be in Node 1`);
}
console.log('✅ PASS: Node 1 and Node 2 word sets are properly defined in courseData');

// --- TEST 3: User clears 1과 Round 1 (progress = 1) and unlocks 2과 ---
localStorage.clear();
window.nodeProgressMap = {};
window.saveStageClearResult({
  nodeId: 'u1_node-1',
  accuracy: 100,
  questions: unit1Words.slice(0, 10),
  missedWords: []
});
assert.strictEqual(Number(window.getNodeProgress('u1_node-1', 'es', 'main')), 1);

// Now simulate user playing 2과 Round 1 (1스테이지)
window.currentGameLessonId = 'u1_node-2';
window.currentSelectedNodeId = 'u1_node-2';

const node2Questions = unit1Words.filter(w => node2WordIds.has(w.id));
const saveRes = window.saveStageClearResult({
  nodeId: 'u1_node-2',
  accuracy: 90,
  questions: node2Questions,
  missedWords: []
});

// Verify saveStageClearResult kept activeNodeId as u1_node-2 (did NOT rewrite to node-1)
assert.strictEqual(saveRes.activeNodeId, 'u1_node-2', 'saveStageClearResult must keep u1_node-2');
assert.strictEqual(Number(window.getNodeProgress('u1_node-2', 'es', 'main')), 1, 'u1_node-2 cleared count must be 1');
console.log('✅ PASS: saveStageClearResult preserves 2과 without forcing node-1');

// --- TEST 4: getNextStageStep for 2과 Round 1 yields 2과 Round 2 (u1_node-2) ---
const nextStep = window.getNextStageStep('u1_node-2', 3);
assert.strictEqual(nextStep.nextNodeId, 'u1_node-2', 'Next step after round 1 of node-2 must remain on u1_node-2');
assert.strictEqual(nextStep.nextRound, 2, 'Next round must be 2');
console.log('✅ PASS: getNextStageStep correctly calculates next stage as u1_node-2 round 2');

// --- TEST 5: handleResultPrimary routes directly to startLesson(nextNodeId) ---
let startLessonCalledNodeId = null;
let startedSessionWords = null;

window.openFlashcardScreen = function(opts) {
  startedSessionWords = opts.words;
};
window.openGameScreen = function(lessonId, session) {
  startedSessionWords = session;
};

// Trigger handleResultPrimary
window.currentGameLessonId = 'u1_node-2';
window.handleResultPrimary();

// Verify that startedSessionWords are 2과 words, NOT 1과 words!
assert(Array.isArray(startedSessionWords) && startedSessionWords.length > 0, 'Session words must be populated');
const firstWord = startedSessionWords[0];
assert(node2WordIds.has(firstWord.id), `First word ${firstWord.term || firstWord.word} (${firstWord.id}) MUST belong to 2과 wordIds`);
assert(!node1WordIds.has(firstWord.id), `First word ${firstWord.term || firstWord.word} must NOT belong to 1과`);
console.log(`✅ PASS: [다음 회차] immediately loaded 2과 words: "${firstWord.term || firstWord.word}"`);

// --- TEST 6: Completing 3 rounds of 2과 advances to 3과 (u1_node-3) ---
window.setNodeProgress('u1_node-2', 3, 3, 'es', 'main');
const stepAfterMaster2 = window.getNextStageStep('u1_node-2', 3);
assert.strictEqual(stepAfterMaster2.nextNodeId, 'u1_node-3', 'After 3 clears of node-2, must advance to u1_node-3');

window.handleResultPrimary();
const firstWordNode3 = startedSessionWords[0];
const node3 = window.courseData_es.units[0].nodes.find(n => n.stageNumber === 3);
const node3WordIds = new Set(node3.wordIds);
assert(node3WordIds.has(firstWordNode3.id), `Word ${firstWordNode3.term || firstWordNode3.word} must belong to 3과`);
console.log(`✅ PASS: Advancing from 2과 to 3과 immediately loaded 3과 words: "${firstWordNode3.term || firstWordNode3.word}"`);

console.log('🎉 ALL TESTS IN test_next_stage_ssot_pipeline.js PASSED PERFECTLY! 🚀');
