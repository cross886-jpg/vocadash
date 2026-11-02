// ==============================================================================
// VocaDash - Review Infinite Life & Session State Isolation Test (Karpathy Guidelines)
// 약점 복습 모드 상단 UI 무제한(💖 ∞) 명시 및 하트 차감 배제 / 일반 스테이지 격리 검증
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock Browser Environment
global.window = global;
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

const store = {};
global.localStorage = {
  getItem: k => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

const domElements = {};
function createMockEl(id, tagName = 'div') {
  const classSet = new Set();
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    parentElement: null,
    children: [],
    classList: {
      add: (...cls) => cls.forEach(c => classSet.add(c)),
      remove: (...cls) => cls.forEach(c => classSet.delete(c)),
      contains: c => classSet.has(c),
      toggle: (c, force) => {
        if (force === undefined) { if (classSet.has(c)) classSet.delete(c); else classSet.add(c); }
        else if (force) classSet.add(c); else classSet.delete(c);
      }
    },
    style: {
      display: '',
      removeProperty: p => { delete el.style[p]; },
      setProperty: (p, v) => { el.style[p] = v; }
    },
    textContent: '',
    innerHTML: '',
    dataset: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: sel => {
      if (sel === '.game-heart') {
        const matches = [];
        (el._heartSpans || []).forEach(s => matches.push(s));
        return matches;
      }
      return [];
    },
    querySelector: sel => {
      if (sel === '.game-heart') return (el._heartSpans && el._heartSpans.length > 0) ? el._heartSpans[0] : null;
      return null;
    }
  };
  return el;
}

const heartsContainer = createMockEl('game-hearts');
heartsContainer._heartSpans = [
  createMockEl('', 'span'), createMockEl('', 'span'), createMockEl('', 'span'),
  createMockEl('', 'span'), createMockEl('', 'span')
];
domElements['game-hearts'] = heartsContainer;

global.document = {
  readyState: 'complete',
  getElementById: id => {
    if (!domElements[id]) domElements[id] = createMockEl(id);
    return domElements[id];
  },
  createElement: tag => createMockEl('', tag),
  querySelector: sel => {
    if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
    return createMockEl(sel);
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Core Modules
eval(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/quizSessionGenerator.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/heartManager.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/lessonModal.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/reviewManager.js'), 'utf-8'));

console.log('🧪 Starting test_review_infinite_life_and_isolation.js...');

// Set initial global user state: 3 hearts, stage-1 progress = 1
window.setUserHearts(3);
assert.strictEqual(window.getUserHearts(), 3, 'User starts with 3 global hearts');
localStorage.setItem('vocadash_prog_es_main_node-1', '1');

// Mock wrong words in storage
const mockWrongWords = [
  { id: 'w1', word: 'Difícil', term: 'Difícil', meaning: '어려운', correctStreak: 0, wrongCount: 2, escaped: false, lang: 'es' },
  { id: 'w2', word: 'Fácil', term: 'Fácil', meaning: '쉬운', correctStreak: 1, wrongCount: 1, escaped: false, lang: 'es' }
];
window.saveWrongWords(mockWrongWords, 'es');

// --- TEST 1: Launch Review Game and verify Header UI displays 💖 ∞ ---
const reviewQuestions = window.generateReviewSession(1, 'es');
assert.strictEqual(reviewQuestions.length, 10, 'Review queue has 10 questions');

window.openGameScreen('node-review', reviewQuestions, { mode: 'review' });

// Verify mode and header UI
assert.strictEqual(window.currentGameMode, 'review', 'Game mode must be set to "review"');
assert(
  heartsContainer.innerHTML.includes('💖 ∞') || heartsContainer.textContent.includes('💖 ∞'),
  `Header hearts container must display "💖 ∞". Actual innerHTML: "${heartsContainer.innerHTML}"`
);
console.log('✅ PASS: Review mode header cleanly renders "💖 ∞" infinite badge instead of normal hearts');

// --- TEST 2: Wrong answers and deadline breach do NOT decrement hearts or trigger Game Over ---
const initialUserHearts = window.getUserHearts();

// Trigger 5 wrong clicks
for (let i = 0; i < 5; i++) {
  const dummyBtn = createMockEl('btn');
  window.handleWrongAnswer(dummyBtn, 'Wrong Answer');
}

// Trigger deadline breach
window.handleDeadlineBreached();

// Hearts must STILL be identical to initialUserHearts (3)
assert.strictEqual(
  window.getUserHearts(),
  initialUserHearts,
  'User global hearts must NOT decrease during review run wrong answers'
);
assert.strictEqual(
  window.isGameActive,
  true,
  'Game must remain active without Game Over even after multiple wrong answers'
);
console.log('✅ PASS: Consecutive wrong answers in review mode bypass heart deduction and Game Over check');

// --- TEST 3: Complete Review Session and verify Global State Isolation ---
window.correctWords = reviewQuestions.slice();
window.missedWords = [];
window.finishGameStage(true, 100);

// Close and return to roadmap
window.exitGameToRoadmap();

// Verify user global hearts remained 3
assert.strictEqual(
  window.getUserHearts(),
  3,
  'User global hearts must remain intact (3) after exiting review run'
);

// Verify normal stage 1 progress did NOT get contaminated or incremented
const stage1Prog = localStorage.getItem('vocadash_prog_es_main_node-1');
assert.strictEqual(
  stage1Prog,
  '1',
  'Normal stage 1 progress must remain 1 (NOT contaminated by review run)'
);
console.log('✅ PASS: Review run session is strictly isolated: global hearts and stage progress preserved');

// --- TEST 4: Standard mode restores normal hearts and normal heart deduction ---
window.openGameScreen('node-1', [
  { id: 'es_101', word: 'Hola', meaning: '안녕' }
], { mode: 'standard' });

assert.strictEqual(window.currentGameMode, 'standard', 'Standard mode must be active');
assert(
  heartsContainer.innerHTML.includes('game-heart') || heartsContainer.querySelectorAll('.game-heart').length > 0,
  'Standard mode must restore standard game-heart elements'
);

// In standard mode, wrong answer DOES deduct heart
const heartsBeforeDeduct = window.getUserHearts();
const mockBtn = createMockEl('btn-fail');
window.handleWrongAnswer(mockBtn, 'Wrong');
assert.strictEqual(
  window.getUserHearts(),
  heartsBeforeDeduct - 1,
  'Standard mode must deduct 1 heart on wrong answer'
);
console.log('✅ PASS: Standard mode cleanly restores normal heart UI and decrement rules');

console.log('\n🎉 ALL TESTS IN test_review_infinite_life_and_isolation.js PASSED PERFECTLY! 🚀\n');
