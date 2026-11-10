// tests/test_stage2_to_stage3_unlock.js
// Verifies that completing Stage 2 (es_1_n2 / u2_n2) immediately unlocks Stage 3 (es_1_n5 / u2_n5)
// without being blocked by optional Bonus (n3) or Review (n4) nodes, and syncs nodeProgressMap & unlockedNodes.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_stage2_to_stage3_unlock.js...');

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
    tagName: 'DIV',
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
    querySelector: function (sel) {
      if (sel === '.node-stage-num') return this._stageNumEl || (this._stageNumEl = createMockElement());
      if (sel === '.node-btn') return this._btnEl || (this._btnEl = createMockElement());
      if (sel === '.node-target') return this._targetEl || (this._targetEl = createMockElement());
      return createMockElement();
    },
    querySelectorAll: function () { return []; },
    closest: function () { return createMockElement(); },
    appendChild: function () { },
    addEventListener: function (evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    },
    removeEventListener: function () { },
    remove: function () { },
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(val) {
      this._innerHTML = val;
      const tagRegex = /<([a-z0-9\-]+)([^>]*)>/gi;
      let match;
      while ((match = tagRegex.exec(val)) !== null) {
        const attrs = match[2];
        const idMatch = attrs.match(/(?:^|\s)id="([^"]+)"/);
        if (idMatch) {
          const elId = idMatch[1];
          const subEl = mockDocument.getElementById(elId);
          const typeMatch = attrs.match(/data-node-type="([^"]+)"/);
          if (typeMatch) subEl.dataset.nodeType = typeMatch[1];
          const nodeIdMatch = attrs.match(/data-node-id="([^"]+)"/);
          if (nodeIdMatch) subEl.dataset.nodeId = nodeIdMatch[1];
          const lockMatch = attrs.match(/data-is-locked="([^"]+)"/);
          if (lockMatch) subEl.dataset.isLocked = lockMatch[1];
          const classMatch = attrs.match(/class="([^"]+)"/);
          if (classMatch) subEl.className = classMatch[1];
        }
      }
    },
    textContent: '',
    className: ''
  };
  return el;
}

const elementsById = {};
const mockDocument = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!elementsById[id]) elementsById[id] = createMockElement(id);
    return elementsById[id];
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) return mockDocument.getElementById(sel.slice(1));
    return createMockElement();
  },
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body'),
  addEventListener: () => { },
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
  navigator: { userAgent: 'node-test' }
};

const context = {
  console,
  setTimeout: () => 1,
  clearTimeout: () => { },
  setInterval: () => 1,
  clearInterval: () => { },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => { },
  performance: { now: () => Date.now() },
  escapeHTML: (str) => String(str || ''),
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  IntersectionObserver: MockIntersectionObserver,
  addEventListener: () => { },
  removeEventListener: () => { },
  Math, Date, JSON, Array, Object, String, Number, Boolean, parseInt, parseFloat, isNaN
};
win.window = win;
win.document = mockDocument;
win.localStorage = mockLocalStorage;

vm.createContext(context);

function loadScript(relPath) {
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf-8');
  vm.runInContext(code, context);
}

loadScript('js/data/data_es.js');
loadScript('js/data_football.js');
loadScript('js/data/data_en.js');
loadScript('js/data/courseSections.js');
loadScript('js/courseConfig.js');
loadScript('js/progressManager.js');
loadScript('js/roadmapTemplates.js');
loadScript('js/roadmapRenderer.js');
loadScript('js/lessonModal.js');
loadScript('js/quizSessionGenerator.js');
loadScript('js/gameResultModal.js');

// Initialize Spanish main course
win.currentLanguage = 'es';
win.currentActiveCourse = 'es';
win.currentCourseId = 'es_main';
win.activeCourseId = 'main';

const unit1Nodes = win.courseData_es.units[0].nodes;
const n1Node = unit1Nodes.find(n => n.id === 'es_1_n1');
const n2Node = unit1Nodes.find(n => n.id === 'es_1_n2');
const n3BonusNode = unit1Nodes.find(n => n.id === 'es_1_n3');
const n4ReviewNode = unit1Nodes.find(n => n.id === 'es_1_n4');
const n5Node = unit1Nodes.find(n => n.id === 'es_1_n5');
const n6BossNode = unit1Nodes.find(n => n.id === 'es_1_n6');

// --- TEST 1: Strict Sequential Chain (1단계 -> 2단계 -> 선물 -> 오답 -> 3단계 -> 보스) ---
mockLocalStorage.clear();
win.nodeProgressMap = {};
win.unlockedNodes = ['es_1_n1', 'node-1'];

assert.strictEqual(win.isNodeUnlocked(0, 0, n1Node, win.courseData_es), true, 'Stage 1 opens immediately');
assert.strictEqual(win.isNodeUnlocked(0, 1, n2Node, win.courseData_es), false, 'Stage 2 locked initially');
assert.strictEqual(win.isNodeUnlocked(0, 2, n3BonusNode, win.courseData_es), false, 'Bonus locked initially');
assert.strictEqual(win.isNodeUnlocked(0, 3, n4ReviewNode, win.courseData_es), false, 'Review locked initially');
assert.strictEqual(win.isNodeUnlocked(0, 4, n5Node, win.courseData_es), false, 'Stage 3 locked initially');
assert.strictEqual(win.isNodeUnlocked(0, 5, n6BossNode, win.courseData_es), false, 'Boss locked initially');

// Clear Stage 1 -> opens Stage 2 only
for (let i = 0; i < 3; i++) win.saveStageClearResult({ nodeId: 'es_1_n1', accuracy: 100 });
assert.strictEqual(win.isNodeUnlocked(0, 1, n2Node, win.courseData_es), true, 'Stage 2 opens after Stage 1');
assert.strictEqual(win.isNodeUnlocked(0, 2, n3BonusNode, win.courseData_es), false, 'Bonus stays locked before Stage 2 clear');

// Clear Stage 2 -> opens Bonus ONLY; Review & Stage 3 MUST stay locked!
for (let i = 0; i < 3; i++) win.saveStageClearResult({ nodeId: 'es_1_n2', accuracy: 100 });
assert.strictEqual(win.isNodeUnlocked(0, 2, n3BonusNode, win.courseData_es), true, 'Bonus unlocks when Stage 2 cleared');
assert.strictEqual(win.isNodeUnlocked(0, 3, n4ReviewNode, win.courseData_es), false, 'Review MUST stay locked before Bonus claimed');
assert.strictEqual(win.isNodeUnlocked(0, 4, n5Node, win.courseData_es), false, 'Stage 3 MUST stay locked before Review completed');
assert.strictEqual(win.isNodeUnlocked(0, 5, n6BossNode, win.courseData_es), false, 'Boss MUST stay locked before Stage 3 cleared');

win.renderRoadmap();
assert.strictEqual(mockDocument.getElementById('node-bonus-btn').dataset.isLocked, 'false', 'UI Bonus button unlocked');
assert.strictEqual(mockDocument.getElementById('node-review-btn').dataset.isLocked, 'true', 'UI Review button locked before bonus claim');
assert.strictEqual(mockDocument.getElementById('node-3-btn').dataset.isLocked, 'true', 'UI Stage 3 button locked before review complete');
assert.strictEqual(mockDocument.getElementById('node-boss-btn').dataset.isLocked, 'true', 'UI Boss button locked before Stage 3 clear');

// Claim Bonus -> opens Review ONLY; Stage 3 MUST still stay locked!
win.markBonusClaimed('es_1_n3');
assert.strictEqual(win.isNodeUnlocked(0, 3, n4ReviewNode, win.courseData_es), true, 'Review unlocks after Bonus claimed');
assert.strictEqual(win.isNodeUnlocked(0, 4, n5Node, win.courseData_es), false, 'Stage 3 MUST stay locked while Review incomplete');

win.renderRoadmap();
assert.strictEqual(mockDocument.getElementById('node-review-btn').dataset.isLocked, 'false', 'UI Review button unlocked after bonus claim');
assert.strictEqual(mockDocument.getElementById('node-3-btn').dataset.isLocked, 'true', 'UI Stage 3 button stays locked before review');

// Complete Review -> opens Stage 3; Boss stays locked!
win.completeReviewNode('es_1_n4', 1);
assert.strictEqual(win.isNodeUnlocked(0, 4, n5Node, win.courseData_es), true, 'Stage 3 unlocks after Review completed');
assert.strictEqual(win.isNodeUnlocked(0, 5, n6BossNode, win.courseData_es), false, 'Boss stays locked until Stage 3 cleared');

win.renderRoadmap();
assert.strictEqual(mockDocument.getElementById('node-3-btn').dataset.isLocked, 'false', 'UI Stage 3 button unlocked after review');
assert.strictEqual(mockDocument.getElementById('node-boss-btn').dataset.isLocked, 'true', 'UI Boss button still locked');

// Clear Stage 3 -> opens Boss!
for (let i = 0; i < 3; i++) win.saveStageClearResult({ nodeId: 'es_1_n5', accuracy: 100 });
assert.strictEqual(win.isNodeUnlocked(0, 5, n6BossNode, win.courseData_es), true, 'Boss unlocks after Stage 3 cleared');
console.log('✅ PASS TEST 1: Strict sequential chain (1 -> 2 -> Bonus -> Review -> 3 -> Boss) verified in logic & UI');

// --- TEST 2: vocadash_unlocked_unit_es = 8 does NOT grant free-pass to uncompleted nodes ---
mockLocalStorage.clear();
win.nodeProgressMap = {};
mockLocalStorage.setItem('vocadash_unlocked_unit_es', '8');
mockLocalStorage.setItem('vocadash_prog_es_main_u1_n1', '3');
mockLocalStorage.setItem('vocadash_prog_es_main_u1_n2', '3'); // Stage 2 cleared, but bonus NOT claimed & review NOT completed

assert.strictEqual(win.getUnlockedUnitLevel('es', 'main'), 8, 'Unlocked level reads 8 from vocadash_unlocked_unit_es');
assert.strictEqual(win.isNodeUnlocked(0, 2, n3BonusNode, win.courseData_es), true, 'Unit 1 Bonus open (p2 >= 3)');
assert.strictEqual(win.isNodeUnlocked(0, 3, n4ReviewNode, win.courseData_es), false, 'Unit 1 Review MUST stay false despite unlockedLevel=8');
assert.strictEqual(win.isNodeUnlocked(0, 4, n5Node, win.courseData_es), false, 'Unit 1 Stage 3 MUST stay false despite unlockedLevel=8');
assert.strictEqual(win.isNodeUnlocked(0, 5, n6BossNode, win.courseData_es), false, 'Unit 1 Boss MUST stay false despite unlockedLevel=8');

// Check Unit 3 inside unlockedLevel=8: Stage 1 opens (unit is open), Stage 2..Boss stay locked
const u3Nodes = win.courseData_es.units[2].nodes;
assert.strictEqual(win.isNodeUnlocked(2, 0, u3Nodes[0], win.courseData_es), true, 'Unit 3 Stage 1 opens when unlockedLevel=8');
assert.strictEqual(win.isNodeUnlocked(2, 1, u3Nodes[1], win.courseData_es), false, 'Unit 3 Stage 2 stays locked without Stage 1 progress');
assert.strictEqual(win.isNodeUnlocked(2, 3, u3Nodes[3], win.courseData_es), false, 'Unit 3 Review stays locked');
assert.strictEqual(win.isNodeUnlocked(2, 4, u3Nodes[4], win.courseData_es), false, 'Unit 3 Stage 3 stays locked');

win.nodeProgressMap = win.loadNodeProgress('es', 'main');
win.renderRoadmap();
assert.strictEqual(mockDocument.getElementById('node-review-btn').dataset.isLocked, 'true', 'UI Unit 1 Review stays locked when unlockedLevel=8');
assert.strictEqual(mockDocument.getElementById('node-3-btn').dataset.isLocked, 'true', 'UI Unit 1 Stage 3 stays locked when unlockedLevel=8');
const subsequentHtmlHighLvl = mockDocument.getElementById('roadmap-subsequent-units').innerHTML;
assert.ok(subsequentHtmlHighLvl.includes('data-node-id="es_3_n5" data-is-locked="true"'), 'Unit 3 es_3_n5 HTML must render locked when incomplete');
console.log('✅ PASS TEST 2: High unlocked unit level (8) separates unit entry from per-node sequential chain');

// --- TEST 3: Normalized claimedBonuses keys (u2-bonus / u2_node-bonus / es_2_n3) in Unit 2 ---
mockLocalStorage.clear();
win.nodeProgressMap = {};
mockLocalStorage.setItem('vocadash_unlocked_es_main', '2');
mockLocalStorage.setItem('vocadash_prog_es_main_u2_n1', '3');
mockLocalStorage.setItem('vocadash_prog_es_main_u2_n2', '3');

const u2Nodes = win.courseData_es.units[1].nodes;
const u2Bonus = u2Nodes.find(n => n.id === 'es_2_n3');
const u2Review = u2Nodes.find(n => n.id === 'es_2_n4');
const u2Stage3 = u2Nodes.find(n => n.id === 'es_2_n5');

assert.strictEqual(win.isNodeUnlocked(1, 2, u2Bonus, win.courseData_es), true, 'Unit 2 Bonus unlocked');
assert.strictEqual(win.isNodeUnlocked(1, 3, u2Review, win.courseData_es), false, 'Unit 2 Review locked before claim');

mockLocalStorage.setItem('vocadash_claimed_bonuses', JSON.stringify(['u2-bonus']));
assert.strictEqual(win.isNodeUnlocked(1, 3, u2Review, win.courseData_es), true, 'Unit 2 Review unlocked via normalized key u2-bonus');
assert.strictEqual(win.isNodeUnlocked(1, 4, u2Stage3, win.courseData_es), false, 'Unit 2 Stage 3 still locked until review done');

win.completeReviewNode('es_2_n4', 2);
assert.strictEqual(win.isNodeUnlocked(1, 4, u2Stage3, win.courseData_es), true, 'Unit 2 Stage 3 unlocked after Unit 2 review done');
console.log('✅ PASS TEST 3: Normalized bonus keys & Unit 2 sequential chain verified');

// --- TEST 4: Cross-language namespace (${prefix}_${unitNum}_n{slot}) & isolation ---
mockLocalStorage.clear();
win.nodeProgressMap = {};
mockLocalStorage.setItem('vocadash_claimed_bonuses', JSON.stringify(['es_1_n3']));
win.currentLanguage = 'en';
win.currentActiveCourse = 'en';
win.activeCourseId = 'main';
win.currentCourseId = 'main';
mockLocalStorage.setItem('vocadash_prog_en_main_u1_n1', '3');
mockLocalStorage.setItem('vocadash_prog_en_main_u1_n2', '3');

assert.strictEqual(win.isNodeUnlocked(0, 2, { id: 'en_1_n3', type: 'bonus' }), true, 'English Unit 1 Bonus unlocks when en_1_n2=3');
assert.strictEqual(win.isNodeUnlocked(0, 3, { id: 'en_1_n4', type: 'review' }), false, 'es_1_n3 claimed must NOT unlock en_1_n4');

mockLocalStorage.setItem('vocadash_claimed_bonuses', JSON.stringify(['es_1_n3', 'en_1_n3']));
assert.strictEqual(win.isNodeUnlocked(0, 3, { id: 'en_1_n4', type: 'review' }), true, 'en_1_n4 unlocks when en_1_n3 claimed');
assert.strictEqual(win.isNodeUnlocked(0, 4, { id: 'en_1_n5', type: 'stage', stageNumber: 3 }), false, 'en_1_n5 stays locked until en_1_n4 completed');

win.completeReviewNode('en_1_n4', 1);
assert.strictEqual(win.isNodeUnlocked(0, 4, { id: 'en_1_n5', type: 'stage', stageNumber: 3 }), true, 'en_1_n5 unlocks after en_1_n4 completed');
console.log('✅ PASS TEST 4: Cross-language prefix normalization (${prefix}_${unitNum}_n{slot}) & isolation verified');

console.log('🎉 ALL TESTS IN test_stage2_to_stage3_unlock.js PASSED PERFECTLY!');
