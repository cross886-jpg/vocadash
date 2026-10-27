// tests/test_review_node_badge_ui.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_review_node_badge_ui.js...');

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

const footballCode = fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf8');
const esCode = fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const engineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf8');

vm.runInContext(footballCode, context);
vm.runInContext(esCode, context);
const courseConfigCode = fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8');
vm.runInContext(courseConfigCode, context);
const profileManagerCode = fs.readFileSync(path.join(__dirname, "../js/profileManager.js"), "utf-8");
vm.runInContext(profileManagerCode, context);
const roadmapRendererCode = fs.readFileSync(path.join(__dirname, '../js/roadmapRenderer.js'), 'utf-8');
vm.runInContext(roadmapRendererCode, context);
vm.runInContext(appCode, context);
if (domContentLoadedHandler) {
  domContentLoadedHandler();
}
vm.runInContext(engineCode, context);

console.log('--- Step 1: Initial locked state in Unit 1 ---');
mockLocalStorage.clear();
win.setLanguage('es');
win.switchCourse('main');

win.updateRoadmapNodesUI();

const reviewLabelCard = elementsById['node-review-label-card'];
const lockBadgeReview = elementsById['node-review-lock-badge'];
const reviewBtn = elementsById['node-review-btn'];

assert(reviewLabelCard, 'node-review-label-card element must exist');
const isCardHidden = reviewLabelCard.classList.contains('hidden') || reviewLabelCard.style.display === 'none';
assert(isCardHidden, 'When review node is locked, bottom badge must be hidden');
console.log('✅ Locked state badge is hidden:', isCardHidden);

assert(lockBadgeReview && !lockBadgeReview.classList.contains('hidden'), 'Lock badge must be visible when locked');
assert(reviewBtn && reviewBtn.className.includes('bg-slate-300'), 'Button must be gray when locked');
console.log('✅ Locked state button is gray and has lock badge');

console.log('--- Step 2: Unlock review node with 2 wrong words ---');
mockLocalStorage.setItem('vocadash_prog_es_main_u1_n1', '3');
mockLocalStorage.setItem('vocadash_prog_es_main_u1_n2', '3');
win.markBonusClaimed('node-bonus');

const mockWrongWords = [
  { id: 'w1', term: 'hola', meaning: '안녕', lang: 'es', escaped: false, correctStreak: 0 },
  { id: 'w2', term: 'adios', meaning: '잘가', lang: 'es', escaped: false, correctStreak: 1 }
];
mockLocalStorage.setItem('vocadash_wrong_answers_es', JSON.stringify(mockWrongWords));
if (typeof win.loadWrongWords === 'function') {
  win.wrongWords = win.loadWrongWords('es');
}

win.updateRoadmapNodesUI();

const isCardVisibleWithWrong = !reviewLabelCard.classList.contains('hidden') && reviewLabelCard.style.display !== 'none';
assert(isCardVisibleWithWrong, 'When unlocked, review badge must be visible');
const badgeText = elementsById['node-review-badge-text'].textContent;
assert(badgeText.includes('오답 탈출'), `Badge text must contain '오답 탈출', got: ${badgeText}`);
console.log(`✅ Unlocked state with wrong words shows badge: "${badgeText}"`);

console.log('--- Step 3: Unlock review node with 0 wrong words (Perfect state) ---');
mockLocalStorage.setItem('vocadash_wrong_answers_es', JSON.stringify([]));
if (typeof win.loadWrongWords === 'function') {
  win.wrongWords = win.loadWrongWords('es');
}

win.updateRoadmapNodesUI();

const isCardVisibleWithZero = !reviewLabelCard.classList.contains('hidden') && reviewLabelCard.style.display !== 'none';
assert(isCardVisibleWithZero, 'When unlocked with 0 wrong words, review badge must be visible');
const badgeTextZero = elementsById['node-review-badge-text'].textContent;
assert(badgeTextZero.includes('스피드 복습'), `Badge text must contain '스피드 복습', got: ${badgeTextZero}`);
console.log(`✅ Unlocked state with 0 wrong words shows badge: "${badgeTextZero}"`);

console.log('--- Step 4: Check dynamic unit review node renderer (renderUnitReviewHtml) ---');
if (typeof win.renderUnitReviewHtml === 'function') {
  // Test locked HTML
  const lockedHtml = win.renderUnitReviewHtml({
    unitNum: 2,
    align: 'ml-auto mr-7 mb-11',
    width: '170px',
    isCompleted: false,
    isActive: false,
    isLocked: true,
    nodeId: 'u2-review'
  });
  assert(!lockedHtml.includes('오답 탈출') && !lockedHtml.includes('스피드 복습'), 'Locked dynamic review node must NOT render bottom badge');
  assert(lockedHtml.includes('lock'), 'Locked dynamic review node must render lock');
  console.log('✅ Dynamic review node when locked omits bottom badge');

  // Test unlocked with 0 wrong words
  const unlockedZeroHtml = win.renderUnitReviewHtml({
    unitNum: 2,
    align: 'ml-auto mr-7 mb-11',
    width: '170px',
    isCompleted: false,
    isActive: true,
    isLocked: false,
    nodeId: 'u2-review'
  });
  assert(unlockedZeroHtml.includes('스피드 복습'), 'Unlocked dynamic review node with 0 wrong words must render "스피드 복습"');
  console.log('✅ Dynamic review node when unlocked with 0 wrong words renders "스피드 복습"');

  // Test unlocked with wrong words
  mockLocalStorage.setItem('vocadash_wrong_answers_es', JSON.stringify(mockWrongWords));
  if (typeof win.loadWrongWords === 'function') {
    win.wrongWords = win.loadWrongWords('es');
  }
  const unlockedWithWrongHtml = win.renderUnitReviewHtml({
    unitNum: 2,
    align: 'ml-auto mr-7 mb-11',
    width: '170px',
    isCompleted: false,
    isActive: true,
    isLocked: false,
    nodeId: 'u2-review'
  });
  assert(unlockedWithWrongHtml.includes('오답 탈출'), 'Unlocked dynamic review node with wrong words must render "오답 탈출"');
  console.log('✅ Dynamic review node when unlocked with wrong words renders "오답 탈출"');
}

console.log('🎉 ALL REVIEW NODE BADGE UI TESTS PASSED SUCCESSFULLY! 🚀');
