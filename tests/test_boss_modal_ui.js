// tests/test_boss_modal_ui.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_boss_modal_ui.js...');

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
    querySelector: function (sel) {
      if (sel.includes('icon')) return createMockElement('lesson-start-btn-icon');
      if (sel.includes('text')) return createMockElement('lesson-start-btn-text');
      return createMockElement();
    },
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
  navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
  userHearts: 5
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
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_en.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/roadmapRenderer.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/lessonModal.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/profileManager.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8'), context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

console.log('\n--- TEST 1: Open Boss Node Bottom Sheet (Dedicated Boss Exam UI) ---');
win.openLessonModal('node-boss');

const badgeEl = mockDocument.getElementById('lesson-modal-badge');
const titleEl = mockDocument.getElementById('lesson-modal-title');
const descEl = mockDocument.getElementById('lesson-modal-desc');
const progSection = mockDocument.getElementById('lesson-modal-progress-section');
const bossSection = mockDocument.getElementById('lesson-modal-boss-section');
const bossCondText = mockDocument.getElementById('lesson-modal-boss-condition-text');
const xpText = mockDocument.getElementById('lesson-modal-xp');
const gemsText = mockDocument.getElementById('lesson-modal-gems');
const startBtn = mockDocument.getElementById('lesson-start-btn');
const startBtnText = mockDocument.getElementById('lesson-start-btn-text');

console.log('Boss Badge:', badgeEl.textContent);
console.log('Boss Title:', titleEl.textContent);
console.log('Boss Desc:', descEl.textContent);
console.log('Boss Condition:', bossCondText.textContent);
console.log('Boss XP / Gems:', xpText.textContent, '/', gemsText.textContent);
console.log('Boss Start Button:', startBtnText.textContent);

assert.strictEqual(badgeEl.textContent, '🔥 FINAL BOSS EXAM');
assert.strictEqual(badgeEl.className.includes('text-rose-600'), true);
assert.strictEqual(titleEl.textContent, 'Unit 1 총괄 보스전');
assert.ok(descEl.textContent.includes('이번 유닛에서 배운 모든 단어가 총출동합니다!') && descEl.textContent.includes('단판 승부로 다음 유닛을 해금하세요.'));
assert.strictEqual(progSection.classList.contains('hidden'), true, 'Progress section (0/3) must be hidden for boss modal');
assert.strictEqual(bossSection.classList.contains('hidden'), false, 'Boss condition section must be visible');
assert.strictEqual(bossCondText.textContent, '통과 기준: 80% 이상');
assert.strictEqual(xpText.textContent, '+50 XP');
assert.strictEqual(gemsText.textContent, '+30');
assert.strictEqual(startBtnText.textContent, '⚔️ 보스전 도전하기');
assert.strictEqual(startBtn.className.includes('from-amber-500'), true, 'CTA button must have warm boss theme gradient');
console.log('✅ PASS: Boss node modal renders dedicated boss exam layout');

console.log('\n--- TEST 2: Unit 2 Boss Node Composite Key (Unit 2 총괄 보스전) ---');
win.openLessonModal('u2_node-boss');
assert.strictEqual(mockDocument.getElementById('lesson-modal-badge').textContent, '🔥 FINAL BOSS EXAM');
assert.strictEqual(mockDocument.getElementById('lesson-modal-title').textContent, 'Unit 2 총괄 보스전');
assert.strictEqual(mockDocument.getElementById('lesson-start-btn-text').textContent, '⚔️ 보스전 도전하기');
console.log('✅ PASS: Composite key u2_node-boss renders Unit 2 총괄 보스전');

console.log('\n--- TEST 3: Normal Node Recovery (Restore 0/3 Progress & Standard Theme) ---');
win.openLessonModal('node-2');

console.log('Normal Badge:', badgeEl.textContent);
console.log('Normal Title:', titleEl.textContent);
console.log('Normal Progress Text:', mockDocument.getElementById('lesson-modal-progress-text').textContent);
console.log('Normal XP / Gems:', xpText.textContent, '/', gemsText.textContent);
console.log('Normal Start Button:', startBtnText.textContent);

assert.strictEqual(badgeEl.textContent.includes('2과'), true);
assert.strictEqual(badgeEl.className.includes('text-rose-600'), false);
assert.strictEqual(progSection.classList.contains('hidden'), false, 'Progress section must be restored for normal node');
assert.strictEqual(bossSection.classList.contains('hidden'), true, 'Boss condition section must be hidden for normal node');
assert.strictEqual(xpText.textContent, '+20 XP');
assert.strictEqual(gemsText.textContent, '+10');
assert.strictEqual(startBtnText.textContent, '학습 시작하기');
assert.strictEqual(startBtn.className.includes('bg-[#22c55e]'), true, 'CTA button must be restored to emerald green');
console.log('✅ PASS: Normal node successfully restores standard layout, 0/3 progress, and emerald theme');

console.log('\n🎉 ALL TESTS IN test_boss_modal_ui.js PASSED SUCCESSFULLY! 🚀');
