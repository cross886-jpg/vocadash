// tests/test_schema_jump_and_isolation.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_schema_jump_and_isolation.js...');

// Mock Environment
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
  readyState: 'complete',
  getElementById: (id) => getMockElement(id),
  querySelector: (sel) => getMockElement(sel.replace('#', '')),
  querySelectorAll: () => [],
  createElement: (tag) => getMockElement('mock_' + tag + '_' + Math.random()),
  body: { appendChild: () => {} }
};

let toastLogs = [];
const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  showToast: (msg) => { toastLogs.push(msg); },
  currentLanguage: 'es',
  currentCourseId: 'es_main',
  activeCourseId: 'main'
};
sandbox.window = sandbox;

// Load core files
const files = [
  'js/data/languagesRegistry.js',
  'js/data/courseSections.js',
  'js/data_es.js',
  'js/data_football.js',
  'js/data_en.js',
  'js/courseConfig.js',
  'js/progressManager.js',
  'js/quizSessionGenerator.js',
  'js/flashcard.js',
  'js/courseDrawer.js',
  'js/debug.js'
];

for (const file of files) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInNewContext(code, sandbox);
}

console.log('✅ PASS: Core JS modules loaded cleanly');

// =========================================================================
// 1. 단어 객체 스키마(Schema) 확장 호환성 검증
// =========================================================================
console.log('--- 1. Testing Word Object Schema Compatibility ---');

// (A) Standard word without examples or gender/pos
const testWordA = {
  id: "test_01",
  word: "agua",
  pronunciation: "아과",
  meaning: "물"
};

// (B) Advanced word with gender, partOfSpeech, exampleTarget, exampleMeaning
const testWordB = {
  id: "test_02",
  word: "coche",
  pronunciation: "코체",
  meaning: "자동차",
  gender: "m",
  partOfSpeech: "명사",
  exampleTarget: "Mi coche es rojo",
  exampleKo: "내 차는 빨간색이다"
};

// Test quizSessionGenerator with extended schema
const dummyCourse = {
  units: [
    {
      unit: 1,
      words: [testWordA, testWordB]
    }
  ]
};
sandbox.getCurrentCourseData = () => dummyCourse;

const quizSession = sandbox.quizSessionGenerator.generateStageSession('node-1', 'es', 0);
assert.strictEqual(quizSession.length, 2, 'Quiz session must include 2 words');

const qA = quizSession[0];
assert.strictEqual(qA.word, 'agua');
assert.strictEqual(qA.meaning, '물');
assert.strictEqual(qA.gender, null);
assert.strictEqual(qA.exampleTarget, '');

const qB = quizSession[1];
assert.strictEqual(qB.word, 'coche');
assert.strictEqual(qB.gender, 'm');
assert.strictEqual(qB.grammarHint, '남성 · 명사');
assert.strictEqual(qB.exampleTarget, 'Mi coche es rojo');
assert.strictEqual(qB.exampleMeaning, '내 차는 빨간색이다');

// Test 4-choice distractor generation doesn't crash
const choices = sandbox.quizSessionGenerator.generateQuestionChoices(qB, quizSession, 'node-1', 'es');
assert.strictEqual(choices.length, 4, 'Must generate 4 choices');
assert.ok(choices.includes('자동차'), 'Correct answer must be included in choices');

// Test flashcard open with extended schema
sandbox.openFlashcardScreen('node-1', null, { words: [testWordA, testWordB] });
assert.strictEqual(sandbox.currentSessionQuestions.length, 2);
assert.strictEqual(sandbox.currentSessionQuestions[1].grammarHint, '남성 · 명사');

console.log('✅ PASS: Word Schema expansion (gender, partOfSpeech, examples) verified without errors');

// =========================================================================
// 2. 치트 패널 Gate 점프 (window.debugJumpToUnit) 검증
// =========================================================================
console.log('--- 2. Testing Cheat Jump (debugJumpToUnit) ---');

assert.strictEqual(typeof sandbox.debugJumpToUnit, 'function', 'window.debugJumpToUnit must be defined');

// Jump to Gate 5 in es_main
sandbox.currentLanguage = 'es';
sandbox.currentCourseId = 'es_main';
sandbox.activeCourseId = 'main';

const jumpSuccess = sandbox.debugJumpToUnit(5);
assert.strictEqual(jumpSuccess, true, 'debugJumpToUnit(5) must return true');

// Verify unlocked level in progressManager
const unlockedEs = sandbox.getUnlockedUnitLevel('es', 'es_main');
assert.strictEqual(unlockedEs, 5, 'Gate 5 must be unlocked for es_main');
assert.strictEqual(sandbox.currentUnitNumber, 5, 'currentUnitNumber must be 5');
assert.strictEqual(sandbox._currentVisibleUnitIndex, 4, '_currentVisibleUnitIndex must be 4');

// Switch to soccer pack (es_soccer) and jump to Gate 3
sandbox.currentCourseId = 'es_soccer';
sandbox.activeCourseId = 'pack_football';
sandbox.debugJumpToUnit(3);

const unlockedSoccer = sandbox.getUnlockedUnitLevel('es', 'es_soccer');
assert.strictEqual(unlockedSoccer, 3, 'Gate 3 must be unlocked for es_soccer');

// Ensure es_main is still at Gate 5 (No cross-course pollution)
const unlockedEsCheck = sandbox.getUnlockedUnitLevel('es', 'es_main');
assert.strictEqual(unlockedEsCheck, 5, 'es_main must stay at Gate 5 when es_soccer is modified');

console.log('✅ PASS: Cheat Jump to Gate successfully unlocks and synchronizes course');

// =========================================================================
// 3. 코스별 LocalStorage 진행도 격리 최종 확인
// =========================================================================
console.log('--- 3. Testing LocalStorage Course Isolation ---');

// Clear storage
mockLocalStorage.clear();

// 1) Clear Unit 2 in Spanish soccer pack
sandbox.setUnlockedUnitLevel(2, 'es', 'es_soccer');
sandbox.saveCourseProgress({ completedNodes: ['u1_n1', 'u1_n2', 'u1_n6'] }, 'es_soccer', 'es');

// 2) Check Spanish main course progress
const esMainProg = sandbox.getCourseProgress('es_main', 'es');
const esMainUnlocked = sandbox.getUnlockedUnitLevel('es', 'es_main');
assert.strictEqual(esMainUnlocked, 1, 'es_main unlocked units must be 1 (unpolluted by soccer pack)');
assert.strictEqual(esMainProg.completedNodes.length, 0, 'es_main completedNodes must be empty');

// 3) English main course progress
const enMainProg = sandbox.getCourseProgress('en_main', 'en');
const enMainUnlocked = sandbox.getUnlockedUnitLevel('en', 'en_main');
assert.strictEqual(enMainUnlocked, 1, 'en_main unlocked units must be 1');
assert.strictEqual(enMainProg.completedNodes.length, 0, 'en_main completedNodes must be empty');

// 4) Verify Soccer progress is strictly preserved
const soccerProg = sandbox.getCourseProgress('es_soccer', 'es');
const soccerUnlocked = sandbox.getUnlockedUnitLevel('es', 'es_soccer');
assert.strictEqual(soccerUnlocked, 2, 'Soccer unlocked unit must be 2');
assert.strictEqual(soccerProg.completedNodes.length, 3, 'Soccer completed nodes must be 3');

console.log('✅ PASS: Course progress isolation (es_main vs es_soccer vs en_main) verified 100%');

console.log('🎉 ALL FINAL FOUNDATION TESTS PASSED PERFECTLY! 🚀');
