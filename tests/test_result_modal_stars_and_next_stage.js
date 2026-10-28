const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_result_modal_stars_and_next_stage.js...');

const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

function createMockElement(id = '') {
  const el = {
    id,
    listeners: {},
    classList: {
      _classes: new Set(),
      add: function (...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function (...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function (c) { return this._classes.has(c); },
      toggle: function (c, force) {
        if (force === true) this._classes.add(c);
        else if (force === false) this._classes.delete(c);
        else if (this._classes.has(c)) this._classes.delete(c);
        else this._classes.add(c);
      }
    },
    style: {
      display: '',
      opacity: '1',
      filter: '',
      boxShadow: '',
      width: '',
      removeProperty: function (p) { delete this[p]; },
      setProperty: function (p, v) { this[p] = v; }
    },
    dataset: {},
    setAttribute: function (k, v) { this[k] = v; },
    getAttribute: function (k) { return this[k]; },
    removeAttribute: function (k) { delete this[k]; },
    querySelector: function (sel) { return createMockElement('child-' + sel); },
    querySelectorAll: function (sel) { return []; },
    closest: function (sel) { return createMockElement(); },
    appendChild: function () { },
    addEventListener: function (evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    },
    removeEventListener: function () { },
    remove: function () { },
    scrollIntoView: function () { },
    innerHTML: '',
    textContent: '',
    className: ''
  };
  return el;
}

let domContentLoadedHandler = null;
const elementsById = {};
const mockDocument = {
  getElementById: (id) => {
    if (!elementsById[id]) elementsById[id] = createMockElement(id);
    return elementsById[id];
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) return mockDocument.getElementById(sel.slice(1));
    return createMockElement();
  },
  querySelectorAll: (sel) => [],
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body'),
  addEventListener: (evt, fn) => {
    if (evt === 'DOMContentLoaded') domContentLoadedHandler = fn;
  },
  removeEventListener: () => { }
};

class MockIntersectionObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

const win = {
  addEventListener: () => { },
  removeEventListener: () => { },
  scrollTo: () => { },
  scroll: () => { },
  IntersectionObserver: MockIntersectionObserver,
  location: { reload: () => { }, href: 'http://localhost/' },
  navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' }
};

const context = {
  console,
  setTimeout: (fn, ms) => {
    if (typeof fn === 'function') {
      if (!ms || ms <= 0) { fn(); return 1; }
      return global.setTimeout(fn, ms);
    }
    return 1;
  },
  clearTimeout: (id) => global.clearTimeout(id),
  setInterval: () => 1,
  clearInterval: () => { },
  requestAnimationFrame: (fn) => 1,
  cancelAnimationFrame: () => { },
  performance: { now: () => Date.now() },
  escapeHTML: (str) => String(str || ''),
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  IntersectionObserver: MockIntersectionObserver,
  addEventListener: () => { },
  removeEventListener: () => { },
  Math,
  Date,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  parseInt,
  parseFloat,
  isNaN
};
win.window = win;
win.document = mockDocument;
win.localStorage = mockLocalStorage;

vm.createContext(context);

// Load script files
const footballCode = fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf-8');
vm.runInContext(footballCode, context);

const dataEsCode = fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8');
vm.runInContext(dataEsCode, context);

const dataEnCode = fs.readFileSync(path.join(__dirname, '../js/data_en.js'), 'utf-8');
vm.runInContext(dataEnCode, context);

const appJsCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
const courseConfigCode = fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8');
vm.runInContext(courseConfigCode, context);
const profileManagerCode = fs.readFileSync(path.join(__dirname, "../js/profileManager.js"), "utf-8");
vm.runInContext(profileManagerCode, context);
const progressManagerCode = fs.readFileSync(path.join(__dirname, "../js/progressManager.js"), "utf-8");
vm.runInContext(progressManagerCode, context);
vm.runInContext(appJsCode, context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

const navJsCode = fs.readFileSync(path.join(__dirname, '../js/navigation.js'), 'utf-8');
vm.runInContext(navJsCode, context);

const gameResultModalCode = fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf-8');
vm.runInContext(gameResultModalCode, context);

const quizSessionGeneratorCode = fs.readFileSync(path.join(__dirname, '../js/quizSessionGenerator.js'), 'utf-8');
vm.runInContext(quizSessionGeneratorCode, context);

const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8');
vm.runInContext(gameEngineCode, context);

console.log('\n--- TEST 1: calculateStarsByAccuracy differential tiers ---');
assert.strictEqual(win.calculateStarsByAccuracy(100), 3, '100% must be 3 stars');
assert.strictEqual(win.calculateStarsByAccuracy(95), 3, '95% must be 3 stars');
assert.strictEqual(win.calculateStarsByAccuracy(90), 3, '90% must be 3 stars');
assert.strictEqual(win.calculateStarsByAccuracy(89), 2, '89% must be 2 stars');
assert.strictEqual(win.calculateStarsByAccuracy(70), 2, '70% must be 2 stars');
assert.strictEqual(win.calculateStarsByAccuracy(69), 1, '69% must be 1 star');
assert.strictEqual(win.calculateStarsByAccuracy(60), 1, '60% MUST BE 1 STAR (reported bug fixed)');
assert.strictEqual(win.calculateStarsByAccuracy(50), 1, '50% must be 1 star');
assert.strictEqual(win.calculateStarsByAccuracy(49), 0, '49% must be 0 stars');
assert.strictEqual(win.calculateStarsByAccuracy(0), 0, '0% must be 0 stars');
console.log('✅ PASS: calculateStarsByAccuracy satisfies all tiers accurately');

console.log('\n--- TEST 2: renderModalStars DOM active class toggling ---');
const s1 = mockDocument.getElementById('result-star-1');
const s2 = mockDocument.getElementById('result-star-2');
const s3 = mockDocument.getElementById('result-star-3');

// Test 1 star (e.g. 60% accuracy)
win.renderModalStars(1);
assert.strictEqual(s1.classList.contains('active'), true, 'Star 1 must have active class');
assert.strictEqual(s2.classList.contains('active'), false, 'Star 2 must NOT have active class');
assert.strictEqual(s3.classList.contains('active'), false, 'Star 3 must NOT have active class');
assert.strictEqual(s1.style.opacity, '1', 'Star 1 opacity must be 1');
assert.strictEqual(s2.style.opacity, '0.25', 'Star 2 opacity must be 0.25');
assert.strictEqual(s3.style.opacity, '0.25', 'Star 3 opacity must be 0.25');

// Test 0 stars (e.g. 40% accuracy)
win.renderModalStars(0);
assert.strictEqual(s1.classList.contains('active'), false, 'Star 1 must NOT have active class');
assert.strictEqual(s2.classList.contains('active'), false, 'Star 2 must NOT have active class');
assert.strictEqual(s3.classList.contains('active'), false, 'Star 3 must NOT have active class');

// Test 3 stars (e.g. 95% accuracy)
win.renderModalStars(3);
assert.strictEqual(s1.classList.contains('active'), true, 'Star 1 must have active class');
assert.strictEqual(s2.classList.contains('active'), true, 'Star 2 must have active class');
assert.strictEqual(s3.classList.contains('active'), true, 'Star 3 must have active class');
console.log('✅ PASS: renderModalStars toggles active class and opacity properly for 0, 1, 2, 3 stars');

console.log('\n--- TEST 3: finishGameStage with 60% accuracy yields 1 star ---');
win.resetStageFinishingFlag();
win.currentGameLessonId = 'u1_node-1';
win.finishGameStage(true, 60);

assert.strictEqual(win.lastEarnedStars, 1, '60% accuracy must earn 1 star in result modal');
assert.strictEqual(s1.classList.contains('active'), true, 'Star 1 must be active');
assert.strictEqual(s2.classList.contains('active'), false, 'Star 2 must NOT be active');
assert.strictEqual(s3.classList.contains('active'), false, 'Star 3 must NOT be active');
console.log('✅ PASS: finishGameStage with 60% accuracy gives exactly 1 star');

console.log('\n--- TEST 4: handleResultPrimary next stage calculation (composite key) ---');
let lastPipelineTarget = null;
let lastPipelineSession = null;
win.startStageLearningPipeline = function(nodeId, session) {
  lastPipelineTarget = nodeId;
  lastPipelineSession = session;
};

// 4-1: Round 1 -> Round 2 of same node
win.resetStageFinishingFlag();
win.setNodeProgress('u1_node-1', 1, 1, 'es', 'main');
win.currentGameLessonId = 'u1_node-1';
win.lastEarnedStars = 1;
win.handleResultPrimary();
assert.strictEqual(lastPipelineTarget, 'u1_node-1', 'Round 2 must remain on u1_node-1');

// 4-2: 3 Clears of node-1 -> advance to u1_node-2
win.resetStageFinishingFlag();
win.setNodeProgress('u1_node-1', 3, 3, 'es', 'main');
win.currentGameLessonId = 'u1_node-1';
win.lastEarnedStars = 3;
win.handleResultPrimary();
assert.strictEqual(lastPipelineTarget, 'u1_node-2', 'Completed node-1 must advance to u1_node-2');

// 4-3: 3 Clears of node-2 -> advance to u1_node-3
win.resetStageFinishingFlag();
win.setNodeProgress('u1_node-2', 3, 3, 'es', 'main');
win.currentGameLessonId = 'u1_node-2';
win.lastEarnedStars = 3;
win.handleResultPrimary();
assert.strictEqual(lastPipelineTarget, 'u1_node-3', 'Completed node-2 must advance to u1_node-3');

// 4-4: 3 Clears of node-3 -> advance to u1_node-boss and unlock boss
win.resetStageFinishingFlag();
win.setNodeProgress('u1_node-3', 3, 3, 'es', 'main');
win.currentGameLessonId = 'u1_node-3';
win.lastEarnedStars = 3;
win.handleResultPrimary();
assert.strictEqual(lastPipelineTarget, 'u1_node-boss', 'Completed node-3 must advance to u1_node-boss');
assert.strictEqual(win.unlockedNodes.includes('u1_node-boss') || win.unlockedNodes.includes('node-boss'), true, 'Boss node must be unlocked');

// 4-5: Boss Clear -> advance to Unit 2 node 1 (u2_node-1) and unlock Unit 2
win.resetStageFinishingFlag();
win.setNodeProgress('u1_node-boss', 3, 3, 'es', 'main');
win.currentGameLessonId = 'u1_node-boss';
win.lastEarnedStars = 3;
win.handleResultPrimary();
assert.strictEqual(lastPipelineTarget, 'u2_node-1', 'Completed boss must advance to u2_node-1');
assert.strictEqual(win.currentUnitNumber, 2, 'Current unit number must be 2');
console.log('✅ PASS: handleResultPrimary correctly calculates composite keys and unlocks stages');

console.log('\n🎉 ALL TESTS IN test_result_modal_stars_and_next_stage.js PASSED SUCCESSFULLY! 🚀');
