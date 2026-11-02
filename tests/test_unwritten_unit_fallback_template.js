// tests/test_unwritten_unit_fallback_template.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_unwritten_unit_fallback_template.js...');

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
  addEventListener: () => {},
  removeEventListener: () => {},
  body: { appendChild: () => {} }
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  showToast: () => {},
  currentLanguage: 'es',
  currentCourseId: 'es_main',
  activeCourseId: 'main'
};
sandbox.window = sandbox;

// Load Core JS Modules
const files = [
  'js/data/languagesRegistry.js',
  'js/data/courseSections.js',
  'js/data_es.js',
  'js/data_football.js',
  'js/data_en.js',
  'js/courseConfig.js',
  'js/progressManager.js',
  'js/quizSessionGenerator.js',
  'js/roadmapRenderer.js',
  'js/lessonModal.js',
  'js/flashcard.js',
  'js/debug.js'
];

for (const file of files) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInNewContext(code, sandbox);
}

console.log('✅ PASS: All core modules loaded cleanly');

// =========================================================================
// 1. getUnitDataWithFallback 단독 검증
// =========================================================================
console.log('--- 1. Testing getUnitDataWithFallback function ---');
assert.strictEqual(typeof sandbox.getUnitDataWithFallback, 'function', 'getUnitDataWithFallback must be exposed');

// Unit 1 (existing written unit in data_es.js)
const unit1 = sandbox.getUnitDataWithFallback('es_main', 1);
assert.strictEqual(unit1.words[0].id, 'es_101', 'Unit 1 should return real written words');

// Unit 85 (unwritten unit in es_main)
const unit85 = sandbox.getUnitDataWithFallback('es_main', 85);
assert.ok(unit85, 'Unit 85 fallback data must be generated');
assert.strictEqual(unit85.unitNumber, 85);
assert.strictEqual(unit85.dummy, true);
assert.strictEqual(unit85.words.length, 30, 'Dummy unit must have 30 words');
assert.strictEqual(unit85.stages.length, 3, 'Dummy unit must define 3 stages');
assert.strictEqual(unit85.nodes.length, 6, 'Dummy unit must have 6 nodes (stage-1, stage-2, bonus, review, stage-3, boss)');
assert.strictEqual(unit85.nodes[0].wordIds.length, 10, 'Stage 1 should have 10 words');
assert.strictEqual(unit85.nodes[5].type, 'boss', 'Boss node must exist');

console.log('✅ PASS: getUnitDataWithFallback correctly preserves written units and generates fallback for unwritten units');

// =========================================================================
// 2. 미작성 유닛 퀴즈 세션 생성 (generateStageSession) 검증
// =========================================================================
console.log('--- 2. Testing Quiz Session Generation for Unwritten Unit ---');
sandbox.currentLanguage = 'es';
sandbox.currentCourseId = 'es_main';
sandbox.currentUnitNumber = 50;

// Test Stage 1 for Unit 50 (node id: u50_stage-1)
const quizDeck = sandbox.quizSessionGenerator.generateStageSession('u50_stage-1', 'es', 0);
assert.ok(Array.isArray(quizDeck) && quizDeck.length > 0, 'Quiz deck must not be empty');
assert.strictEqual(quizDeck[0].word, 'Voca_50_1');
assert.strictEqual(quizDeck[0].meaning, '단어 뜻 50-1');

// Test 4-choice distractors for unwritten unit
const choices = sandbox.quizSessionGenerator.generateQuestionChoices(quizDeck[0], quizDeck, 'u50_stage-1', 'es');
assert.strictEqual(choices.length, 4, 'Must generate 4 distractors without throwing undefined');
assert.ok(choices.includes('단어 뜻 50-1'), 'Correct meaning must be in choices');

console.log('✅ PASS: Quiz session for unwritten Unit 50 generated and playable');

// =========================================================================
// 3. 미작성 유닛 플래시카드 (openFlashcardScreen) 검증
// =========================================================================
console.log('--- 3. Testing Flashcard Screen for Unwritten Unit ---');
sandbox.currentUnitNumber = 99;
sandbox.openFlashcardScreen('u99_stage-2');

assert.ok(Array.isArray(sandbox.currentSessionQuestions), 'Flashcard active deck must be populated');
assert.strictEqual(sandbox.currentSessionQuestions[0].word, 'Voca_99_11');
assert.strictEqual(sandbox.currentSessionQuestions[0].meaning, '단어 뜻 99-11');

console.log('✅ PASS: Flashcard deck for unwritten Unit 99 rendered safely');

// =========================================================================
// 4. 로드맵 렌더러 및 치트 점프 (debugJumpToUnit) 통합 연동 검증
// =========================================================================
console.log('--- 4. Testing Roadmap Renderer with Unwritten Unit Jump ---');
// Jump to Gate 125
sandbox.debugJumpToUnit(125);
assert.strictEqual(sandbox.currentUnitNumber, 125);

// Render roadmap
sandbox.renderRoadmap();

// Verify top unit banner updated to Unit 125
sandbox.updateTopUnitBanner(124, true);
const topTitle = getMockElement('unit-main-title').textContent;
assert.ok(topTitle.includes('125'), 'Top banner must display Unit 125');

console.log('✅ PASS: Roadmap and Top Banner cleanly handle Unit 125 without crash');

console.log('🎉 ALL UNWRITTEN UNIT FALLBACK TESTS PASSED PERFECTLY! 🚀');
