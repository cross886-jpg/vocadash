// tests/test_node3_persistence_and_boss_unlock.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_node3_persistence_and_boss_unlock.js...');

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
    addEventListener: function (evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    },
    removeEventListener: function () { },
    remove: function () { },
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

const courseConfigCode = fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8');
vm.runInContext(courseConfigCode, context);
const roadmapRendererCode = fs.readFileSync(path.join(__dirname, '../js/roadmapRenderer.js'), 'utf-8');
vm.runInContext(roadmapRendererCode, context);
const lessonModalCode = fs.readFileSync(path.join(__dirname, '../js/lessonModal.js'), 'utf-8');
vm.runInContext(lessonModalCode, context);
const profileManagerCode = fs.readFileSync(path.join(__dirname, "../js/profileManager.js"), "utf-8");
vm.runInContext(profileManagerCode, context);
const appJsCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
vm.runInContext(appJsCode, context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8');
vm.runInContext(gameEngineCode, context);

// ----------------------------------------------------
// Setup initial state: Node 1 and Node 2 cleared (3/3), bonus claimed, review completed
// ----------------------------------------------------
mockLocalStorage.clear();
win.setNodeProgress('node-1', 3, 3, 'es', 'main');
win.setNodeProgress('node-2', 3, 3, 'es', 'main');
if (typeof win.claimBonus === 'function') win.claimBonus('node-bonus', 1);
if (typeof win.completeReviewNode === 'function') win.completeReviewNode('node-review', 1);

// --- TEST 1: Play 3과 Round 1 and verify localStorage persistence ---
console.log('\n--- TEST 1: Play 3과 Round 1 and Verify Persistence ---');
win.openLessonModal('node-3');
win.openGameScreen('node-3');
assert.strictEqual(win.currentGameLessonId, 'node-3');

const finishResult1 = win.finishGameStage(true);
assert.notStrictEqual(finishResult1, false, 'finishGameStage must succeed');
if (typeof win.exitGameToRoadmap === 'function') win.exitGameToRoadmap(true);

// Check localStorage keys
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3'), '1');
assert.strictEqual(mockLocalStorage.getItem('u1_node-3'), '1');
assert.strictEqual(mockLocalStorage.getItem('u1_stage-3'), '1');
assert.strictEqual(win.nodeProgressMap['node-3'], 1);
assert.strictEqual(win.nodeProgressMap['u1_node-3'], 1);

// Check vocadash_user_data has actuallyPlayed: true
const userData1 = JSON.parse(mockLocalStorage.getItem('vocadash_user_data') || '{}');
assert.ok(userData1.clearedNodes, 'userData.clearedNodes must exist');
assert.strictEqual(userData1.clearedNodes['node-3']?.actuallyPlayed, true, 'node-3 must have actuallyPlayed: true');
assert.strictEqual(userData1.clearedNodes['u1_node-3']?.actuallyPlayed, true, 'u1_node-3 must have actuallyPlayed: true');
console.log('✅ PASS: Round 1 progress (=1) and composite key u1_node-3 successfully saved to localStorage with actuallyPlayed: true');

// --- TEST 2: Simulate Page Refresh (loadNodeProgress & updateRoadmapNodesUI) ---
console.log('\n--- TEST 2: Simulate Page Refresh & Verify Progress Retention ---');
// Wiping in-memory state to simulate fresh browser session
win.nodeProgressMap = {};
win.isGameActive = false;
win.isActive = false;

// 1) loadNodeProgress
const reloadedProgress = win.loadNodeProgress('es', 'main');
assert.strictEqual(reloadedProgress['node-3'], 1, 'Reloaded node-3 progress must remain 1');
assert.strictEqual(reloadedProgress['u1_node-3'], 1, 'Reloaded u1_node-3 progress must remain 1');
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3'), '1', 'Storage must NOT be wiped!');

// 2) openLessonModal('node-3') must show 1/3 progress
win.openLessonModal('node-3');
const modalProgText = mockDocument.getElementById('lesson-modal-progress-text');
assert.strictEqual(modalProgText.textContent, '1/3', 'Lesson modal progress must show 1/3');
console.log('✅ PASS: Page refresh retained progress (1/3) without resetting to 0');

// 3) updateRoadmapNodesUI
win.updateRoadmapNodesUI();
assert.strictEqual(win.nodeProgressMap['node-3'], 1);
assert.strictEqual(win.nodeProgressMap['u1_node-3'], 1);

// Boss node must still be locked at 1/3
const targetBoss = mockDocument.getElementById('node-boss-target');
assert.strictEqual(targetBoss.dataset.nodeType, 'locked', 'Boss node must remain locked when node-3 is 1/3');
console.log('✅ PASS: Roadmap nodes UI rendered 1/3 paws and kept boss locked');

// --- TEST 3: Complete Round 2 & Round 3 to Reach 3/3 ---
console.log('\n--- TEST 3: Complete Round 2 & Round 3 (Master 3과) ---');
win.openGameScreen('node-3');
win.finishGameStage(true); // Round 2 -> 2
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3'), '2');
assert.strictEqual(mockLocalStorage.getItem('u1_node-3'), '2');

win.openGameScreen('node-3');
win.finishGameStage(true); // Round 3 -> 3
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3'), '3');
assert.strictEqual(mockLocalStorage.getItem('u1_node-3'), '3');
console.log('✅ PASS: 3과 completed with 3/3 master status');

// --- TEST 4: Verify Boss Node Unlocked After 3/3 and After Refresh ---
console.log('\n--- TEST 4: Boss Node Unlock Verification After Refresh ---');
// Simulate refresh
win.nodeProgressMap = {};
const freshReload = win.loadNodeProgress('es', 'main');
assert.strictEqual(freshReload['node-3'], 3);
assert.strictEqual(freshReload['u1_node-3'], 3);

win.updateRoadmapNodesUI();

// Verify boss node is active/unlocked
const lockBadgeBoss = mockDocument.getElementById('node-boss-lock-badge');
assert.strictEqual(lockBadgeBoss.classList.contains('hidden'), true, 'Boss lock badge must be hidden');
assert.strictEqual(targetBoss.dataset.nodeType, 'active', 'Boss target must be active');

// Also verify isNodeUnlocked for boss
const isBossUnlocked = win.isNodeUnlocked(0, 5, { id: 'node-boss', type: 'boss' });
assert.strictEqual(isBossUnlocked, true, 'isNodeUnlocked for boss node must return true');

console.log('✅ PASS: Boss node is unlocked and ready for final exam after 3과 reaches 3/3');

console.log('\n🎉 ALL TESTS IN test_node3_persistence_and_boss_unlock.js PASSED PERFECTLY! 🚀');
