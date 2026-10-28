const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_instant_roadmap_scroll.js...');

const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

let lastScrollIntoViewCall = null;
let lastScrollToCall = null;

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
    closest: function (sel) {
      if (sel.includes('roadmap-node') && classSet.has('roadmap-node')) return el;
      return null;
    },
    appendChild: function () { },
    addEventListener: function (evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    },
    removeEventListener: function () { },
    remove: function () { },
    scrollIntoView: function (opts) {
      lastScrollIntoViewCall = { elementId: this.id || this.dataset?.nodeId || 'unknown', opts };
    },
    innerHTML: '',
    textContent: '',
    className: ''
  };
  return el;
}

let domContentLoadedHandler = null;
const elementsById = {};
const querySelectorMap = {};

const mockDocument = {
  getElementById: (id) => {
    if (!elementsById[id]) elementsById[id] = createMockElement(id);
    return elementsById[id];
  },
  querySelector: (sel) => {
    if (querySelectorMap[sel]) return querySelectorMap[sel];
    if (sel.startsWith('#')) return mockDocument.getElementById(sel.slice(1));
    return null;
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
  scrollTo: (opts) => {
    lastScrollToCall = opts;
  },
  scroll: () => { },
  IntersectionObserver: MockIntersectionObserver,
  location: { reload: () => { }, href: 'http://localhost/' },
  navigator: { userAgent: 'Mozilla/5.0' }
};

const context = {
  console,
  setTimeout: (fn, ms) => {
    if (typeof fn === 'function') {
      fn();
      return 1;
    }
    return 1;
  },
  clearTimeout: (id) => { },
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

// Load files
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data_en.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/roadmapRenderer.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/profileManager.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8'), context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/navigation.js'), 'utf-8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8'), context);

console.log('\n--- TEST 1: autoScrollToActiveNode instant behavior prioritizing START node over completed/legacy nodes ---');
const node2Container = createMockElement('node-2-container', ['roadmap-node']);
node2Container.dataset.nodeType = 'completed';
const node2Check = createMockElement('node-2-check-badge');
node2Container.querySelector = (sel) => sel.includes('check-badge') ? node2Check : null;

const node3Container = createMockElement('node-3-container', ['roadmap-node']);
node3Container.dataset.nodeType = 'stage';
const node3StartBadge = createMockElement('node-3-start-pill', ['node-badge-start']);
node3Container.querySelector = (sel) => sel.includes('node-badge-start') || sel.includes('start-pill') ? node3StartBadge : null;

const roadmapScreen = elementsById['roadmap-screen'] || createMockElement('roadmap-screen');
roadmapScreen.querySelectorAll = (sel) => {
  if (sel.includes('.roadmap-node')) return [node2Container, node3Container];
  return [];
};
elementsById['roadmap-screen'] = roadmapScreen;
mockDocument.querySelectorAll = roadmapScreen.querySelectorAll;
elementsById['node-2-container'] = node2Container;
elementsById['node-3-container'] = node3Container;

// 레거시 변수가 완료된 node-2를 가리키더라도 무시되어야 함!
win.currentSelectedNodeId = 'node-2';

lastScrollIntoViewCall = null;
win.autoScrollToActiveNode();

assert.ok(lastScrollIntoViewCall, 'scrollIntoView must be called');
assert.strictEqual(lastScrollIntoViewCall.opts.behavior, 'instant', 'behavior must be instant');
assert.strictEqual(lastScrollIntoViewCall.opts.block, 'center', 'block must be center');
assert.strictEqual(lastScrollIntoViewCall.elementId, 'node-3-container', 'element must be active START node (node-3-container), not completed node-2');
console.log('✅ PASS: autoScrollToActiveNode ignores completed node-2 and scrolls instantly to START node-3');

console.log('\n--- TEST 2: autoScrollToActiveNode falls back to last open node when all completed ---');
node3Container.dataset.nodeType = 'completed';
node3Container.querySelector = (sel) => null;

lastScrollIntoViewCall = null;
win.autoScrollToActiveNode();

assert.ok(lastScrollIntoViewCall, 'scrollIntoView must be called on last open node');
assert.strictEqual(lastScrollIntoViewCall.opts.behavior, 'instant', 'behavior must be instant');
assert.strictEqual(lastScrollIntoViewCall.elementId, 'node-3-container', 'element must be last open node (node-3-container)');
console.log('✅ PASS: autoScrollToActiveNode falls back to last open node when all completed');

console.log('\n--- TEST 3: switchMainTab(home) does NOT reset window.scrollTo top 0 ---');
lastScrollToCall = null;
lastScrollIntoViewCall = null;

win.switchMainTab('home');

assert.strictEqual(lastScrollToCall, null, 'switchMainTab("home") must NOT force window.scrollTo({ top: 0 })');
assert.ok(lastScrollIntoViewCall, 'switchMainTab("home") must trigger autoScrollToActiveNode');
assert.strictEqual(lastScrollIntoViewCall.opts.behavior, 'instant', 'behavior must be instant');
console.log('✅ PASS: switchMainTab("home") preserves scroll and immediately centers active node');

console.log('\n--- TEST 4: switchMainTab non-home tabs still reset window.scrollTo top 0 ---');
lastScrollToCall = null;
win.switchMainTab('review');

assert.ok(lastScrollToCall, 'switchMainTab("review") should scroll to top');
assert.strictEqual(lastScrollToCall.top, 0, 'top must be 0');
assert.strictEqual(lastScrollToCall.behavior, 'instant', 'behavior must be instant');
console.log('✅ PASS: Other tabs correctly reset to top: 0');

console.log('\n--- TEST 5: exitGameToRoadmap triggers instant scroll to active node ---');
lastScrollIntoViewCall = null;
win.isExplicitExitRequested = true;
win.exitGameToRoadmap(true);

assert.ok(lastScrollIntoViewCall, 'exitGameToRoadmap must trigger instant scrollIntoView');
assert.strictEqual(lastScrollIntoViewCall.opts.behavior, 'instant', 'behavior must be instant');
console.log('✅ PASS: exitGameToRoadmap immediately centers active stage instantly');

console.log('\n🎉 ALL TESTS IN test_instant_roadmap_scroll.js PASSED SUCCESSFULLY! 🚀');
