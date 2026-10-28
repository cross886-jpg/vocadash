const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_course_isolation_and_stage_unlock.js...');

// Set up mock DOM and localStorage
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
      removeProperty: function () { },
      setProperty: function () { }
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
    textContent: ''
  };
}

let domContentLoadedHandler = null;
const elementsById = {};
const mockDocument = {
  getElementById: (id) => {
    if (!elementsById[id]) elementsById[id] = createMockElement(id);
    return elementsById[id];
  },
  querySelector: (sel) => createMockElement(),
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
  IntersectionObserver: MockIntersectionObserver
};

const context = {
  console,
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  IntersectionObserver: MockIntersectionObserver,
  addEventListener: () => { },
  removeEventListener: () => { },
  setTimeout: (fn) => 1,
  clearTimeout: () => { },
  setInterval: (fn) => 1,
  clearInterval: () => { },
  requestAnimationFrame: (fn) => 1,
  cancelAnimationFrame: () => { },
  performance: { now: () => Date.now() },
  escapeHTML: (str) => String(str || '')
};
win.window = win;
win.document = mockDocument;
win.localStorage = mockLocalStorage;

vm.createContext(context);

// Load files
const footballCode = fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf8');
const esCode = fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const gameResultModalCode = fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf8');
vm.runInContext(gameResultModalCode, context);
const engineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf8');

vm.runInContext(footballCode, context);
vm.runInContext(esCode, context);
const courseConfigCode = fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8');
vm.runInContext(courseConfigCode, context);
const profileManagerCode = fs.readFileSync(path.join(__dirname, "../js/profileManager.js"), "utf-8");
vm.runInContext(profileManagerCode, context);
const heartManagerCode = fs.readFileSync(path.join(__dirname, "../js/heartManager.js"), "utf-8");
vm.runInContext(heartManagerCode, context);
const languageModalCode = fs.readFileSync(path.join(__dirname, "../js/languageModal.js"), "utf-8");
vm.runInContext(languageModalCode, context);
const bookRendererCode = fs.readFileSync(path.join(__dirname, "../js/bookRenderer.js"), "utf-8");
vm.runInContext(bookRendererCode, context);
const progressManagerCode = fs.readFileSync(path.join(__dirname, "../js/progressManager.js"), "utf-8");
vm.runInContext(progressManagerCode, context);
const roadmapRendererCode = fs.readFileSync(path.join(__dirname, "../js/roadmapRenderer.js"), "utf-8");
vm.runInContext(roadmapRendererCode, context);
const packsManagerCode = fs.readFileSync(path.join(__dirname, "../js/packsManager.js"), "utf-8");
vm.runInContext(packsManagerCode, context);
const reviewManagerCode = fs.readFileSync(path.join(__dirname, "../js/reviewManager.js"), "utf-8");
vm.runInContext(reviewManagerCode, context);
vm.runInContext(appCode, context);
if (domContentLoadedHandler) {
  domContentLoadedHandler();
}
vm.runInContext(engineCode, context);

console.log('--- Step 1: Initial State Verification ---');
mockLocalStorage.clear();
win.setLanguage('es');
win.switchCourse('main');

assert.strictEqual(win.currentLanguage, 'es');
assert.strictEqual(win.currentCourseId, 'main');
assert.strictEqual(mockLocalStorage.getItem('vocadash_active_course_es'), 'main');
assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'main')), 0);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'pack_football')), 0);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'en', 'main')), 0);
console.log('✅ Initial state verified.');

console.log('--- Step 2: Clear Spanish Regular Course 1-1 (Round 1) ---');
win.currentGameLessonId = 'node-1';
win.finishGameStage(true);

// 1. Verify localStorage key format
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n1'), '1', 'Should save to vocadash_prog_es_main_u1_n1');
// Ensure no leak to other courses or languages
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_pack_football_u1_n1'), null, 'Football pack 1-1 must NOT be affected');
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_en_main_u1_n1'), null, 'English main 1-1 must NOT be affected');
// Ensure no legacy un-isolated keys exist
assert.strictEqual(mockLocalStorage.getItem('vocadash_node_progress_node-1'), null, 'Must NOT write un-scoped vocadash_node_progress_node-1');

// 2. Verify getNodeProgress
assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'main')), 1);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'pack_football')), 0);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'en', 'main')), 0);

// 3. Verify node-2 is still locked (requires 3 paws)
assert.strictEqual(win.isNodeUnlocked(0, 1, { id: 'node-2' }, win.courseData), false, 'node-2 must remain locked when node-1 has 1 paw');
console.log('✅ 1-1 cleared once: Spanish main is 1 paw, Football and English isolated, node-2 locked.');

console.log('--- Step 3: Switch to Spanish Football Pack ---');
win.switchCourse('pack_football');
assert.strictEqual(win.currentCourseId, 'pack_football');
assert.strictEqual(mockLocalStorage.getItem('vocadash_active_course_es'), 'pack_football');

// Football pack 1-1 must be 0
assert.strictEqual(win.nodeProgressMap['node-1'], 0, 'Football pack node-1 must have 0 paws');
assert.strictEqual(win.nodeProgressMap['fb_1_n1'], 0, 'Football pack fb_1_n1 must have 0 paws');
assert.strictEqual(Number(win.getNodeProgress('fb_1_n1', 'es', 'pack_football')), 0);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'pack_football')), 0);
console.log('✅ Football pack switched: 1-1 is at 0 paws (un-cleared).');

console.log('--- Step 4: Switch to English Course ---');
win.setLanguage('en');
assert.strictEqual(win.currentLanguage, 'en');
assert.strictEqual(win.currentCourseId, 'main');
assert.strictEqual(mockLocalStorage.getItem('vocadash_active_course_en'), 'main');

// English 1-1 must be 0
assert.strictEqual(win.nodeProgressMap['node-1'], 0, 'English node-1 must have 0 paws');
assert.strictEqual(Number(win.getNodeProgress('node-1', 'en', 'main')), 0);
console.log('✅ English course switched: 1-1 is at 0 paws.');

console.log('--- Step 5: Switch back to Spanish Main Course ---');
win.setLanguage('es');
win.switchCourse('main');
assert.strictEqual(win.currentLanguage, 'es');
assert.strictEqual(win.currentCourseId, 'main');
assert.strictEqual(win.nodeProgressMap['node-1'], 1, 'Spanish main 1-1 progress restored to 1 paw');

console.log('--- Step 6: Complete Spanish 1-1 to 3 Paws (Mastery) ---');
win.openGameScreen('node-1');
win.finishGameStage(true); // round 2 -> 2 paws
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n1'), '2');
win.openGameScreen('node-1');
win.finishGameStage(true); // round 3 -> 3 paws
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n1'), '3');

assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'main')), 3);
// Node 2 is now unlocked!
assert.strictEqual(win.isNodeUnlocked(0, 1, { id: 'node-2' }, win.courseData), true, 'node-2 must unlock after node-1 reaches 3 paws');

// Verify Football pack and English STILL completely untouched!
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_pack_football_u1_n1'), null);
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_en_main_u1_n1'), null);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'es', 'pack_football')), 0);
assert.strictEqual(Number(win.getNodeProgress('node-1', 'en', 'main')), 0);
console.log('✅ Spanish 1-1 3 paws master: node-2 unlocked, Football & English remain 0.');

console.log('--- Step 7: Unit Unlock Level Isolation ---');
win.setUnlockedUnitLevel(2, 'es', 'main');
assert.strictEqual(mockLocalStorage.getItem('vocadash_unlocked_es_main'), '2');
assert.strictEqual(win.getUnlockedUnitLevel('es', 'main'), 2);
assert.strictEqual(win.getUnlockedUnitLevel('es', 'pack_football'), 1, 'Football pack unit level must remain 1');
assert.strictEqual(win.getUnlockedUnitLevel('en', 'main'), 1, 'English unit level must remain 1');
console.log('✅ Unit unlock levels are strictly isolated.');

console.log('🎉 ALL COURSE ISOLATION AND STAGE UNLOCK TESTS PASSED! 🚀');
