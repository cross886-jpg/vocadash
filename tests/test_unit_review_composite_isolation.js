// tests/test_unit_review_composite_isolation.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_unit_review_composite_isolation.js...');

const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

function createMockElement(id = '') {
  return {
    id,
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
      width: '',
      removeProperty: function (p) { delete this[p]; },
      setProperty: function (p, v) { this[p] = v; }
    },
    dataset: {},
    setAttribute: function (k, v) { this[k] = v; },
    getAttribute: function (k) { return this[k]; },
    removeAttribute: function (k) { delete this[k]; },
    querySelector: function (sel) { return createMockElement(); },
    querySelectorAll: function (sel) { return []; },
    closest: function (sel) { return createMockElement(); },
    appendChild: function () { },
    addEventListener: function () { },
    removeEventListener: function () { },
    remove: function () { },
    innerHTML: '',
    textContent: '',
    className: ''
  };
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
  addEventListener: (evt, fn) => {
    if (evt === 'DOMContentLoaded') domContentLoadedHandler = fn;
  },
  removeEventListener: () => { },
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body')
};

class MockIntersectionObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

const win = {
  addEventListener: () => { },
  removeEventListener: () => { },
  IntersectionObserver: MockIntersectionObserver,
  location: { reload: () => { }, href: 'http://localhost/', search: '' },
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
  Audio: function () {
    return { play: () => Promise.resolve(), pause: () => { }, currentTime: 0 };
  }
};
win.document = mockDocument;
win.localStorage = mockLocalStorage;
win.window = win;

vm.createContext(context);

// Load data files
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
const roadmapRendererCode = fs.readFileSync(path.join(__dirname, '../js/roadmapRenderer.js'), 'utf-8');
vm.runInContext(roadmapRendererCode, context);
vm.runInContext(appJsCode, context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8');
vm.runInContext(gameEngineCode, context);

console.log('\n--- TEST 1: Composite Key Namespace Standard ---');
// Verify getCompositeNodeKey helper
assert.strictEqual(win.getCompositeNodeKey('node-review', 1), 'u1_node-review');
assert.strictEqual(win.getCompositeNodeKey('node-review', 2), 'u2_node-review');
assert.strictEqual(win.getCompositeNodeKey('node-review', 10), 'u10_node-review');
assert.strictEqual(win.getCompositeNodeKey('stage-1', 2), 'u2_stage-1');
assert.strictEqual(win.getCompositeNodeKey('node-boss', 3), 'u3_node-boss');
assert.strictEqual(win.getCompositeNodeKey('u4_node-review', 4), 'u4_node-review');
console.log('✅ PASS: getCompositeNodeKey produces correct namespaced keys for all nodes');

// Parse coordinates
const c1 = win.parseNodeCoordinates('u2_node-review');
assert.strictEqual(c1.unitIndex, 2);
assert.strictEqual(c1.nodeIndex, 'review');

const c2 = win.parseNodeCoordinates('u5_stage-2');
assert.strictEqual(c2.unitIndex, 5);
assert.strictEqual(c2.nodeIndex, 2);
console.log('✅ PASS: parseNodeCoordinates handles composite node keys');

console.log('\n--- TEST 2: Unit 1 Review Completion does NOT contaminate Unit 2+ ---');
mockLocalStorage.clear();
win.nodeProgressMap = {};
win.completedStages = [];

// Complete Unit 1 Review Node
win.completeReviewNode('u1_node-review', 1);

// Verify Unit 1 is completed
assert.strictEqual(win.isReviewNodeCompleted('u1_node-review', 1), true, 'Unit 1 review must be completed');
assert.strictEqual(win.isReviewNodeCompleted('node-review', 1), true, 'Unit 1 legacy review call must be completed');

// Verify Unit 2, Unit 3, Unit 10 are NOT completed!
assert.strictEqual(win.isReviewNodeCompleted('u2_node-review', 2), false, 'Unit 2 review must NOT be completed!');
assert.strictEqual(win.isReviewNodeCompleted('u3_node-review', 3), false, 'Unit 3 review must NOT be completed!');
assert.strictEqual(win.isReviewNodeCompleted('u10_node-review', 10), false, 'Unit 10 review must NOT be completed!');
assert.strictEqual(win.isReviewNodeCompleted('node-review', 2), false, 'Unit 2 node-review query must NOT be completed!');
console.log('✅ PASS: Unit 1 review completion is strictly isolated and does NOT contaminate Unit 2+');

console.log('\n--- TEST 3: Roadmap Rendering Priority Defense (isLocked > isCompleted) ---');
// Even if isCompleted is true, if isLocked is true, green checkmarks and completed styling must be strictly blocked
const lockedHtml = win.renderUnitReviewHtml({
  unitNum: 2,
  isLocked: true,
  isCompleted: true, // Dirty/contaminated state simulation
  isActive: false,
  reviewBadgeText: '잠김',
  unitTheme: 'bg-teal-500'
});

assert.strictEqual(lockedHtml.includes('lock'), true, 'Locked review node must render lock icon');
assert.strictEqual(lockedHtml.includes('data-is-locked="true"'), true, 'Locked review node must have data-is-locked="true"');
assert.strictEqual(lockedHtml.includes('data-node-type="locked"'), true, 'Locked review node must have data-node-type="locked"');
assert.strictEqual(lockedHtml.includes('bg-slate-300'), true, 'Locked review node must have locked gray style');
assert.strictEqual(lockedHtml.includes('check'), false, 'Locked review node MUST NOT render "check"');
assert.strictEqual(lockedHtml.includes('✔'), false, 'Locked review node MUST NOT render "✔"');
assert.strictEqual(lockedHtml.includes('✅'), false, 'Locked review node MUST NOT render "✅"');

// Test renderUnitNodeHtml as well
const lockedNodeHtml = win.renderUnitNodeHtml({
  unitNum: 2,
  nodeId: 'u2_stage-1',
  idx: 0,
  stepNum: 1,
  nodeType: 'stage',
  isLocked: true,
  isCompleted: true, // Dirty state
  isActive: false,
  unitTheme: 'bg-teal-500',
  title: '기초 단어'
});
assert.strictEqual(lockedNodeHtml.includes('lock'), true, 'Locked stage node must render lock icon');
assert.strictEqual(lockedNodeHtml.includes('data-is-locked="true"'), true, 'Locked stage node must have data-is-locked="true"');
assert.strictEqual(lockedNodeHtml.includes('check'), false, 'Locked stage node MUST NOT render check');
assert.strictEqual(lockedNodeHtml.includes('✔'), false, 'Locked stage node MUST NOT render checkmark');
console.log('✅ PASS: Roadmap renderers strictly prioritize isLocked over isCompleted, completely blocking green checkmarks');

console.log('\n--- TEST 4: gameEngine finishGameStage and exitGameToRoadmap composite key sync ---');
// Launch Unit 2 review speedrun via openGameScreen
win.openGameScreen('u2_node-review', [{ id: 'q1', word: 'test', meaning: '테스트' }]);
win.isReviewGameMode = true;
win.isRoadmapReviewSpeedrun = true;
win.currentReviewUnitNumber = 2;
win.currentReviewNodeId = 'u2_node-review';

win.finishGameStage(true);

// Check nodeProgressMap & completedStages
assert.strictEqual(win.nodeProgressMap['u2_node-review'], 1, 'u2_node-review must be in nodeProgressMap');
assert.strictEqual(win.completedStages.includes('u2_node-review'), true, 'u2_node-review must be in completedStages');
assert.strictEqual(win.isReviewNodeCompleted('u2_node-review', 2), true, 'Unit 2 review is now legitimately completed');
assert.strictEqual(win.isReviewNodeCompleted('u3_node-review', 3), false, 'Unit 3 review remains uncompleted');
console.log('✅ PASS: finishGameStage records composite key u2_node-review without bleeding into Unit 3');

console.log('\n--- TEST 5: Legacy Single Key Migration & Safety Handling ---');
mockLocalStorage.clear();
win.nodeProgressMap = {};
// User had old dirty localStorage
mockLocalStorage.setItem('vocadash_review_completed_node-review', 'true');
mockLocalStorage.setItem('vocadash_review_completed', 'true');

// Run migration
win.migrateLegacyReviewData();

// Verify Unit 1 received migrated completion
assert.strictEqual(win.isReviewNodeCompleted('u1_node-review', 1), true, 'Unit 1 inherited legacy completion safely');
// Verify Unit 2+ is completely untouched
assert.strictEqual(win.isReviewNodeCompleted('u2_node-review', 2), false, 'Unit 2 is NOT marked completed by legacy migration');
assert.strictEqual(win.isReviewNodeCompleted('u3_node-review', 3), false, 'Unit 3 is NOT marked completed by legacy migration');
console.log('✅ PASS: Legacy migration only maps to Unit 1 and strictly shields Unit 2+');

console.log('\n🎉 ALL TESTS IN test_unit_review_composite_isolation.js PASSED SUCCESSFULLY! 🚀');
