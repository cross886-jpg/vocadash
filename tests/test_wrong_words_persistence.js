// ==============================================================================
// VocaDash - Wrong Words Persistence & SSOT Integration Test
// 오답 발생 시 vocadash_wrong_words_es 영구 저장 및 로드맵 연동 단위 테스트
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock DOM & localStorage
global.window = global;
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
function createMockEl(id) {
  const classSet = new Set();
  return {
    id,
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
      removeProperty: p => { delete domElements[id].style[p]; }
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
    if (!domElements[id]) {
      domElements[id] = createMockEl(id);
    }
    return domElements[id];
  },
  querySelector: sel => {
    if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
    return createMockEl(sel);
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Modules
global.currentLanguage = 'es';
global.currentActiveCourse = 'es';

eval(fs.readFileSync(path.join(__dirname, '../js/reviewManager.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8'));

console.log('🧪 Starting test_wrong_words_persistence.js...');

// TEST 1: Initial state
localStorage.clear();
assert.strictEqual(localStorage.getItem('vocadash_wrong_words_es'), null, 'Initial wrong words in storage should be null');

// TEST 2: Direct call to addWrongWord / recordAnswerResult
const testWord = {
  id: 'test_word_1',
  term: 'Biblioteca',
  meaning: '도서관',
  phonetic: '[비블리오테카]',
  lang: 'es'
};

window.addWrongWord(testWord);

const storedJson = localStorage.getItem('vocadash_wrong_words_es');
assert(storedJson !== null, 'localStorage.getItem("vocadash_wrong_words_es") must not be null after addWrongWord');

const storedList = JSON.parse(storedJson);
assert(Array.isArray(storedList), 'Stored list must be an array');
assert.strictEqual(storedList.length, 1, 'Stored list should have 1 item');
assert.strictEqual(storedList[0].term, 'Biblioteca');
assert.strictEqual(storedList[0].escaped, false, 'escaped must be false');
assert.strictEqual(storedList[0].correctStreak, 0, 'correctStreak must be 0');
assert.strictEqual(storedList[0].wrongCount, 1, 'wrongCount must be 1');
console.log('✅ PASS: addWrongWord saves properly to localStorage vocadash_wrong_words_es');

// Also verify vocadash_wrong_answers_es is synchronized
const storedAnswers = localStorage.getItem('vocadash_wrong_answers_es');
assert(storedAnswers !== null, 'vocadash_wrong_answers_es must also be synchronized');
console.log('✅ PASS: vocadash_wrong_answers_es is in sync');

// TEST 3: Duplicate wrong answer on the same word increments wrongCount, keeps correctStreak at 0
window.addWrongWord(testWord);
const updatedList = JSON.parse(localStorage.getItem('vocadash_wrong_words_es'));
assert.strictEqual(updatedList.length, 1, 'Should not duplicate word in list');
assert.strictEqual(updatedList[0].wrongCount, 2, 'wrongCount should be incremented to 2');
assert.strictEqual(updatedList[0].correctStreak, 0, 'correctStreak should stay 0');
console.log('✅ PASS: Duplicate wrong answer increments wrongCount and keeps streak 0');

// TEST 4: Mastery 5 graduation
// 4 correct answers -> correctStreak goes to 4
for (let i = 1; i <= 4; i++) {
  window.recordAnswerResult(testWord, true);
  const midList = window.loadWrongWords('es');
  assert.strictEqual(midList.length, 1);
  assert.strictEqual(midList[0].correctStreak, i);
}
console.log('✅ PASS: Correct answers increment streak up to 4');

// 5th correct answer -> word graduates and is removed
window.recordAnswerResult(testWord, true);
const graduatedList = window.loadWrongWords('es');
assert.strictEqual(graduatedList.length, 0, 'Word should graduate and be removed after 5 consecutive correct answers');
const graduatedJson = localStorage.getItem('vocadash_wrong_words_es');
assert.strictEqual(JSON.parse(graduatedJson).length, 0, 'Storage should reflect graduation');
console.log('✅ PASS: 5 consecutive correct answers graduate and remove word');

// TEST 5: In-game scoring integration (handleWrongAnswer)
localStorage.clear();
const questionWord = {
  id: 'q_gato',
  word: 'Gato',
  term: 'Gato',
  meaning: '고양이',
  phonetic: '[가토]',
  lang: 'es'
};

// Start a game session with 1 question
window.openGameScreen('node-2', [questionWord]);

// Simulate wrong answer in gameEngine via handleChoiceClick
const mockBtn = { classList: { add() {}, remove() {} } };
window.handleChoiceClick(mockBtn, '강아지');

// Verify that the wrong word is recorded in localStorage
const gameWrongJson = localStorage.getItem('vocadash_wrong_words_es');
assert(gameWrongJson !== null, 'localStorage vocadash_wrong_words_es must be populated after in-game wrong answer');
const gameWrongList = JSON.parse(gameWrongJson);
assert.strictEqual(gameWrongList.length, 1);
assert.strictEqual(gameWrongList[0].term, 'Gato');
assert.strictEqual(gameWrongList[0].escaped, false);
assert.strictEqual(gameWrongList[0].correctStreak, 0);
console.log('✅ PASS: handleWrongAnswer triggers storage persistence to vocadash_wrong_words_es');

// TEST 6: Consecutive clicks on wrong answer for same question does not duplicate
window.handleChoiceClick(mockBtn, '호랑이');
const gameWrongListAfterSecond = JSON.parse(localStorage.getItem('vocadash_wrong_words_es'));
assert.strictEqual(gameWrongListAfterSecond.length, 1, 'Should not add second entry for same question attempt');
assert.strictEqual(gameWrongListAfterSecond[0].wrongCount, 1, 'First fail handles wrongCount');
console.log('✅ PASS: Consecutive wrong clicks on same question prevent duplicate recording');

// TEST 7: Deadline breached integration
localStorage.clear();
const deadlineWord = {
  id: 'q_perro',
  word: 'Perro',
  term: 'Perro',
  meaning: '개/강아지',
  phonetic: '[페로]',
  lang: 'es'
};
window.openGameScreen('node-2', [deadlineWord]);

window.handleDeadlineBreached?.();
const deadlineWrongJson = localStorage.getItem('vocadash_wrong_words_es');
assert(deadlineWrongJson !== null, 'localStorage vocadash_wrong_words_es must be populated after deadline breached');
const deadlineWrongList = JSON.parse(deadlineWrongJson);
assert.strictEqual(deadlineWrongList.length, 1);
assert.strictEqual(deadlineWrongList[0].term, 'Perro');
console.log('✅ PASS: handleDeadlineBreached triggers storage persistence to vocadash_wrong_words_es');

// TEST 8: Roadmap UI reflects 오답 탈출 (N)
let roadmapUpdated = false;
window.updateRoadmapNodesUI = () => {
  roadmapUpdated = true;
};
window.addWrongWord({ id: 'q_casa', term: 'Casa', meaning: '집', lang: 'es' });
assert.strictEqual(roadmapUpdated, true, 'updateRoadmapNodesUI should be called when wrong word is added');

const activeWrongList = window.loadWrongWords('es');
const reviewWrongCount = activeWrongList.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
const reviewBadgeLabel = reviewWrongCount > 0 ? `오답 탈출 (${reviewWrongCount})` : '복습 완료';
assert.strictEqual(reviewBadgeLabel, `오답 탈출 (${reviewWrongCount})`);
assert(reviewWrongCount >= 1, 'reviewWrongCount should be at least 1');
console.log(`✅ PASS: Roadmap review badge label evaluates to "${reviewBadgeLabel}"`);

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
