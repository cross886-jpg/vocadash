// tests/test_backfill_unlock_and_gates.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_backfill_unlock_and_gates.js...');

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
  getElementById: (id) => getMockElement(id),
  querySelector: (sel) => getMockElement(sel.replace('#', '')),
  querySelectorAll: () => [],
  createElement: (tag) => getMockElement(`mock-${tag}-${Math.random()}`),
  body: getMockElement('mock-body'),
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

// 1. Load Core Scripts
loadScript('js/data/languagesRegistry.js');
loadScript('js/data/courseSections.js');
loadScript('js/data_es.js');
loadScript('js/data_en.js');
loadScript('js/courseConfig.js');
loadScript('js/progressManager.js');
loadScript('js/debug.js');
loadScript('js/courseDrawer.js');

console.log('✅ PASS: All required modules loaded');

// --- 1. Test debugJumpToUnit(30) unlocks Unit 1~29 ---
console.log('--- 1. Testing debugJumpToUnit(30) backfill unlock ---');
mockLocalStorage.clear();
sandbox.currentLanguage = 'es';
sandbox.currentActiveCourse = 'es';
sandbox.currentCourseId = 'es_main';

const jumpSuccess = sandbox.debugJumpToUnit(30);
assert.strictEqual(jumpSuccess, true, 'debugJumpToUnit should return true');

const unlockedLvl = sandbox.getUnlockedUnitLevel('es', 'main');
assert.strictEqual(unlockedLvl, 30, 'Unlocked level should be 30');

// Verify that all units 1 ~ 29 have progress backfilled
for (let u = 1; u <= 29; u++) {
  const p1 = mockLocalStorage.getItem(`vocadash_prog_es_main_u${u}_n1`);
  const p2 = mockLocalStorage.getItem(`vocadash_prog_es_main_u${u}_n2`);
  const p3 = mockLocalStorage.getItem(`vocadash_prog_es_main_u${u}_n3`);
  const boss = mockLocalStorage.getItem(`vocadash_prog_es_main_u${u}_n6`);

  assert.strictEqual(p1, '3', `Unit ${u} Stage 1 must be cleared (3 stars)`);
  assert.strictEqual(p2, '3', `Unit ${u} Stage 2 must be cleared (3 stars)`);
  assert.strictEqual(p3, '3', `Unit ${u} Stage 3 must be cleared (3 stars)`);
  assert.strictEqual(boss, '1', `Unit ${u} Boss must be cleared (1 star)`);

  // Verify node unlock check for all previous units
  assert.strictEqual(sandbox.isNodeUnlocked(u - 1, 0), true, `Unit ${u} node 0 must be unlocked`);
  assert.strictEqual(sandbox.isNodeUnlocked(u - 1, 1), true, `Unit ${u} node 1 must be unlocked`);
}

console.log('✅ PASS: All units 1~29 have been backfilled with cleared progress');

// --- 2. Test Course Drawer Gate Rendering for Gate 1~29 when unlocked = 30 ---
console.log('--- 2. Testing Course Drawer Gate Status ---');
// Setup drawer DOM containers
const drawerCard = getMockElement('course-drawer-card');
sandbox.renderCourseDrawer('es_main', 'es_sec_1');

// Verify the HTML content of the gates container
const gatesContainer = drawerCard.querySelector('#course-gate-list');
assert.ok(gatesContainer, 'Gates container must exist');
const gatesHtml = gatesContainer.innerHTML;
assert.ok(gatesHtml.length > 0, 'Gates container must have rendered HTML');

// Gate 1~29 must be 'passed'
for (let u = 1; u <= 29; u++) {
  assert.ok(
    gatesHtml.includes(`data-unit="${u}" data-status="passed"`),
    `Gate ${u} must have status="passed"`
  );
  assert.ok(
    gatesHtml.includes('PASSED'),
    `Gate ${u} must show PASSED badge`
  );
}

// Gate 30 must be 'active' (출발)
assert.ok(
  gatesHtml.includes('data-unit="30" data-status="active"'),
  'Gate 30 must have status="active"'
);
assert.ok(
  gatesHtml.includes('출발'),
  'Gate 30 must show 출발 badge'
);

console.log('✅ PASS: Gate 1~29 are marked PASSED and unlocked in drawer; Gate 30 is active');

// --- 3. Test Jumping to Gate 68 (across section boundary to B1) ---
console.log('--- 3. Testing Jump to Gate 68 (Section A2 / B1 transition) ---');
sandbox.debugJumpToUnit(68);
assert.strictEqual(sandbox.getUnlockedUnitLevel('es', 'main'), 68, 'Unlocked level should be 68');

// Render Section 1 (A1: Gates 1~30) and Section 2 (A2: Gates 31~70)
sandbox.renderCourseDrawer('es_main', 'es_sec_1');
const sec1Container = drawerCard.querySelector('#course-gate-list');
const sec1Html = sec1Container.innerHTML;
for (let u = 1; u <= 30; u++) {
  assert.ok(
    sec1Html.includes(`data-unit="${u}" data-status="passed"`),
    `Gate ${u} in Section A1 must be passed when user is at Gate 68`
  );
}

sandbox.renderCourseDrawer('es_main', 'es_sec_2');
const sec2Container = drawerCard.querySelector('#course-gate-list');
const sec2Html = sec2Container.innerHTML;
for (let u = 31; u <= 67; u++) {
  assert.ok(
    sec2Html.includes(`data-unit="${u}" data-status="passed"`),
    `Gate ${u} in Section A2 must be passed when user is at Gate 68`
  );
}
assert.ok(
  sec2Html.includes('data-unit="68" data-status="active"'),
  'Gate 68 in Section A2 must be active'
);
assert.ok(
  sec2Html.includes('data-unit="69" data-status="closed"'),
  'Gate 69 in Section A2 must be closed'
);

console.log('✅ PASS: Jumping to Gate 68 unlocks all gates 1~67 across sections cleanly');

console.log('🎉 ALL BACK-FILL UNLOCK & GATES TESTS PASSED PERFECTLY! 🚀');
