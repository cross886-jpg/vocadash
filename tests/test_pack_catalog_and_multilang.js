const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_pack_catalog_and_multilang.js...');

const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

function createMockElement(id = '', classes = []) {
  const classSet = new Set(classes);
  const el = {
    id,
    listeners: {},
    classList: {
      _classes: classSet,
      add: function (...cls) { cls.forEach(c => classSet.add(c)); },
      remove: function (...cls) { cls.forEach(c => classSet.delete(c)); },
      contains: function (c) { return classSet.has(c); },
      toggle: function (c, force) {
        if (force === true) classSet.add(c);
        else if (force === false) classSet.delete(c);
        else if (classSet.has(c)) classSet.delete(c);
        else classSet.add(c);
      }
    },
    style: {
      display: '',
      removeProperty: function (p) { delete this[p]; },
      setProperty: function (p, v) { this[p] = v; }
    },
    dataset: {},
    setAttribute: function (k, v) { this[k] = v; },
    getAttribute: function (k) { return this[k]; },
    removeAttribute: function (k) { delete this[k]; },
    querySelector: function (sel) { return null; },
    querySelectorAll: function (sel) { return []; },
    closest: function (sel) { return null; },
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
  navigator: { userAgent: 'Mozilla/5.0' }
};

const context = {
  console,
  setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
  clearTimeout: () => { },
  setInterval: () => 1,
  clearInterval: () => { },
  requestAnimationFrame: (fn) => { if (typeof fn === 'function') fn(); return 1; },
  cancelAnimationFrame: () => { },
  performance: { now: () => Date.now() },
  escapeHTML: (str) => String(str || ''),
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  IntersectionObserver: MockIntersectionObserver,
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

vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_en.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8'), context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/navigation.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8'), context);

console.log('\n--- TEST 1: SUPPORTED_LANGUAGES Registry & Labels ---');
assert.ok(Array.isArray(win.SUPPORTED_LANGUAGES), 'SUPPORTED_LANGUAGES must be an array');
assert.strictEqual(win.SUPPORTED_LANGUAGES.some(l => l.code === 'es' && l.label === '스페인어(ES)'), true, 'Must have 스페인어(ES)');
assert.strictEqual(win.SUPPORTED_LANGUAGES.some(l => l.code === 'en' && l.label === '영어(EN)'), true, 'Must have 영어(EN)');
assert.strictEqual(win.SUPPORTED_LANGUAGES.some(l => l.code === 'ja'), true, 'Must support JA extension');
assert.strictEqual(win.SUPPORTED_LANGUAGES.some(l => l.code === 'fr'), true, 'Must support FR extension');
console.log('✅ PASS: SUPPORTED_LANGUAGES registry is well-defined and extensible');

console.log('\n--- TEST 2: PACK_CATALOG Multi-language structure ---');
assert.ok(win.PACK_CATALOG, 'PACK_CATALOG must exist');
assert.ok(Array.isArray(win.PACK_CATALOG.es), 'PACK_CATALOG.es must be an array');
assert.ok(Array.isArray(win.PACK_CATALOG.en), 'PACK_CATALOG.en must be an array');
assert.ok(Array.isArray(win.PACK_CATALOG.ja), 'PACK_CATALOG.ja must be an array');

const footballPack = win.PACK_CATALOG.es.find(p => p.id === 'pack_football');
assert.ok(footballPack, 'Football pack must exist in Spanish catalog');
assert.strictEqual(footballPack.title, '스페인 축구 실전', 'Title must be concise without redundant 단어팩');

const esMain = win.PACK_CATALOG.es.find(p => p.id === 'main');
assert.ok(esMain, 'Main course must exist in Spanish catalog');

const enMain = win.PACK_CATALOG.en.find(p => p.id === 'main_en');
assert.ok(enMain, 'Main English course must exist in English catalog');
console.log('✅ PASS: PACK_CATALOG accurately maps courses across languages');

console.log('\n--- TEST 3: renderPacksScreenUI dynamic card and tab rendering ---');
const packsScreen = mockDocument.getElementById('packs-screen');
const packsLangTabs = mockDocument.getElementById('packs-lang-tabs');
const packsCardList = mockDocument.getElementById('packs-card-list');

// 3-1: Render Spanish
win.renderPacksScreenUI('es');
assert.ok(packsLangTabs.innerHTML.includes('스페인어(ES)'), 'Must render 스페인어(ES) tab');
assert.ok(packsLangTabs.innerHTML.includes('영어(EN)'), 'Must render 영어(EN) tab');
assert.ok(packsCardList.innerHTML.includes('스페인 축구 실전'), 'Must render Spanish football course');
assert.ok(packsCardList.innerHTML.includes('스페인어 정규 코스'), 'Must render Spanish main course');

// 3-2: Render English
win.renderPacksScreenUI('en');
assert.ok(packsCardList.innerHTML.includes('영어 정규 코스'), 'Must render English main course');
assert.ok(!packsCardList.innerHTML.includes('스페인 축구 실전'), 'Spanish course must not be rendered in English tab');

// 3-3: Render Japanese (Coming Soon)
win.renderPacksScreenUI('ja');
assert.ok(packsCardList.innerHTML.includes('일본어 기초 회화'), 'Must render Japanese course');
assert.ok(packsCardList.innerHTML.includes('준비 중'), 'Must render coming soon status for Japanese');
console.log('✅ PASS: renderPacksScreenUI dynamically renders tabs and cards cleanly');

console.log('\n--- TEST 4: renderPackCardHtml template generator ---');
const testPack = {
  id: 'pack_custom',
  title: '프랑스어 여행',
  badge: '신규',
  desc: '파리 여행 필수 어휘',
  icon: '🇫🇷',
  wordsCount: 50,
  unitsCount: 5,
  lang: 'fr',
  isComingSoon: false
};
const html = win.renderPackCardHtml(testPack, false);
assert.ok(html.includes('프랑스어 여행'), 'Must contain title');
assert.ok(html.includes('🇫🇷'), 'Must contain icon');
assert.ok(html.includes('장착하기'), 'Must contain equip button');

const htmlEquipped = win.renderPackCardHtml(testPack, true);
assert.ok(htmlEquipped.includes('장착 중'), 'Must reflect equipped status');
console.log('✅ PASS: renderPackCardHtml produces valid and reactive HTML templates');

console.log('\n🎉 ALL TESTS IN test_pack_catalog_and_multilang.js PASSED SUCCESSFULLY! 🚀');
