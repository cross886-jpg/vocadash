// tests/test_review_zero_fallback.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_review_zero_fallback.js...');

// Mock environment
const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const mockElements = {};
function getMockElement(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      style: {},
      dataset: {},
      classList: {
        _set: new Set(),
        add: function (...cls) { cls.forEach(c => this._set.add(c)); },
        remove: function (...cls) { cls.forEach(c => this._set.delete(c)); },
        contains: function (c) { return this._set.has(c); },
        toggle: function (c, force) {
          if (force === true) this._set.add(c);
          else if (force === false) this._set.delete(c);
          else if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        }
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      remove: () => {},
      querySelector: (sel) => getMockElement(sel.replace('#', '')),
      querySelectorAll: () => []
    };
  }
  return mockElements[id];
}

const mockDocument = {
  getElementById: (id) => getMockElement(id),
  querySelector: (sel) => getMockElement(sel.replace('#', '')),
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  readyState: 'complete'
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Math: Math,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  parseInt: parseInt,
  parseFloat: parseFloat,
  JSON: JSON,
  Set: Set,
  Map: Map
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

function loadScript(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInNewContext(code, sandbox, { filename: fullPath });
}

// 1. Core and Data Scripts
loadScript('js/data/languagesRegistry.js');
loadScript('js/data/courseSections.js');
loadScript('js/data_es.js');
loadScript('js/data_en.js');
loadScript('js/courseConfig.js');
loadScript('js/quizSessionGenerator.js');
loadScript('js/reviewManager.js');
loadScript('js/progressManager.js');
loadScript('js/lessonModal.js');
loadScript('js/gameResultModal.js');

console.log('✅ PASS: All modules loaded into test sandbox');

// --- 1. Test generateReviewSession with 0 wrong words (Clean state) ---
console.log('--- 1. Testing generateReviewSession with 0 wrong words ---');
mockLocalStorage.clear();
sandbox.currentLanguage = 'es';
sandbox.currentActiveCourse = 'es';
sandbox.currentUnitNumber = 1;

// Verify loadWrongWords returns empty array
const wrongWords0 = sandbox.loadWrongWords('es');
assert.strictEqual(wrongWords0.length, 0, 'Wrong words should be 0 in clean state');

const session0 = sandbox.generateReviewSession(1, 'es');
assert.strictEqual(Array.isArray(session0), true, 'Session should be an array');
assert.strictEqual(session0.length, 10, 'Session must guarantee exactly 10 questions even with 0 wrong words');
assert.strictEqual(session0[0].isReviewMode, true, 'isReviewMode flag must be true');
assert.strictEqual(session0[0].tag, '랜덤 복습', 'Tag should be "랜덤 복습" when 0 wrong words exist');
assert.ok(session0[0].word && session0[0].meaning, 'Questions must have valid word and meaning');

console.log('✅ PASS: generateReviewSession generates 10 random review questions when wrong words = 0');

// --- 2. Test generateReviewSession with partial wrong words (e.g. 3 wrong words) ---
console.log('--- 2. Testing generateReviewSession with partial wrong words (3 words) ---');
const testWrongWords = [
  { id: 'w1', term: 'Hola', word: 'Hola', meaning: '안녕', phonetic: '[올라]', correctStreak: 1, wrongCount: 2, escaped: false, lang: 'es' },
  { id: 'w2', term: 'Gracias', word: 'Gracias', meaning: '감사합니다', phonetic: '[그라시아스]', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' },
  { id: 'w3', term: 'Por favor', word: 'Por favor', meaning: '부탁합니다', phonetic: '[포르 파보르]', correctStreak: 2, wrongCount: 1, escaped: false, lang: 'es' }
];
sandbox.saveWrongWords(testWrongWords, 'es');

const sessionPartial = sandbox.generateReviewSession(1, 'es');
assert.strictEqual(sessionPartial.length, 10, 'Session must guarantee 10 questions when wrong words < 10');
// Verify that the 3 wrong words are present in the session
const sessionWordIds = sessionPartial.map(q => q.id || q.word);
assert.ok(sessionWordIds.includes('w1'), 'Session must include wrong word w1');
assert.ok(sessionWordIds.includes('w2'), 'Session must include wrong word w2');
assert.ok(sessionWordIds.includes('w3'), 'Session must include wrong word w3');

console.log('✅ PASS: generateReviewSession fills up to 10 questions when wrong words = 3');

// --- 3. Test openReviewSpeedrunModal with 0 wrong words description ---
console.log('--- 3. Testing review speedrun modal with 0 wrong words ---');
mockLocalStorage.clear(); // clean state again
sandbox.openReviewSpeedrunModal(1, 'node-review');

const descEl = getMockElement('review-speedrun-modal-desc');
const countTextEl = getMockElement('review-speedrun-target-count');
assert.ok(descEl.textContent.includes('오답이 없습니다! 🌟 완벽 복습 런에 도전하세요'), 'Modal desc must display "오답이 없습니다! 🌟 완벽 복습 런에 도전하세요"');
assert.strictEqual(countTextEl.textContent, '랜덤 완벽 복습 10개 코스', 'Target count text must display "랜덤 완벽 복습 10개 코스"');

console.log('✅ PASS: Modal displays perfect review mode text when wrong words = 0');

// --- 4. Test startGameWithWords fallback with 0 wrong words ---
console.log('--- 4. Testing startGameWithWords fallback with 0 wrong words ---');
let openedScreenId = null;
let openedSession = null;
let openedOptions = null;
let toastMsg = null;

sandbox.showToast = (msg, icon) => { toastMsg = msg; };
sandbox.openGameScreen = (nodeId, session, opts) => {
  openedScreenId = nodeId;
  openedSession = session;
  openedOptions = opts;
};

sandbox.startGameWithWords([]);
assert.ok(toastMsg.includes('오답이 없습니다! 🌟 완벽 복습 런에 도전하세요'), 'Toast message should inform about perfect review run');
assert.strictEqual(openedSession.length, 10, 'Opened game session must have 10 questions');
assert.strictEqual(openedOptions?.mode, 'review', 'Options mode must be "review"');
assert.strictEqual(sandbox.isReviewGameMode, true, 'isReviewGameMode flag must be true');

console.log('✅ PASS: startGameWithWords starts 10-question review game when wrong words = 0');

// --- 5. Test Stage Clear and Reward for Review Node ---
console.log('--- 5. Testing Stage Clear and Reward for Review Node ---');
const clearResult = sandbox.saveStageClearResult({
  nodeId: 'u1_node-review',
  isClear: true,
  accuracy: 100,
  questions: openedSession,
  missedWords: [],
  isReviewMode: true,
  isSpeedrun: true
});

assert.strictEqual(clearResult.stars, 3, 'Stars should be 3 for 100% accuracy');
assert.strictEqual(clearResult.addGems, 10, 'Gems reward must be awarded for review node clear (10 gems)');
assert.strictEqual(sandbox.isReviewNodeCompleted('u1_node-review', 1), true, 'Review node must be marked as completed');

console.log('✅ PASS: Stage clear rewards gems/stars and marks review node completed');

console.log('🎉 ALL REVIEW ZERO FALLBACK TESTS PASSED PERFECTLY! 🚀');

