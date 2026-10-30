// ==============================================================================
// VocaDash - Bottom Navigation Tab Active State Sync Unit Test
// 하단 네비게이션 탭 바 활성(Active) 상태 UI 동기화, 단일 상태 파이프라인 검증
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock DOM
global.window = global;
global.window.scrollTo = () => {};
const domStore = {};

function createMockElement(id, classes = '', attrs = {}) {
  const classList = new Set(classes.split(' ').filter(Boolean));
  const el = {
    id,
    classList: {
      add: (...cls) => cls.forEach(c => classList.add(c)),
      remove: (...cls) => cls.forEach(c => classList.delete(c)),
      contains: c => classList.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classList.has(c)) classList.delete(c); else classList.add(c);
        } else if (force) classList.add(c);
        else classList.delete(c);
      }
    },
    style: {
      removeProperty: p => { delete el.style[p]; },
      setProperty: (p, v) => { el.style[p] = v; }
    },
    _attrs: { ...attrs },
    setAttribute: (k, v) => { el._attrs[k] = String(v); },
    getAttribute: k => el._attrs[k] || null,
    removeAttribute: k => { delete el._attrs[k]; },
    children: [],
    addEventListener: () => {},
    querySelector: sel => {
      if (sel.includes('.nav-icon-container')) return el._iconContainer;
      if (sel.includes('material-symbols-outlined') || sel.includes('span')) return el._icon;
      return null;
    },
    querySelectorAll: () => []
  };
  return el;
}

// Build 4 Bottom Navigation Buttons
const tabHome = createMockElement('tab-home', 'nav-tab nav-item nav-home', { 'aria-current': 'page' });
tabHome._iconContainer = createMockElement('home-icon-container', 'nav-icon-container rounded-full bg-emerald-500 text-white');
tabHome._icon = createMockElement('home-icon', 'material-symbols-outlined text-[22px]');

const tabPacks = createMockElement('tab-packs', 'nav-tab nav-item nav-packs text-slate-400');
tabPacks._iconContainer = createMockElement('packs-icon-container', 'nav-icon-container w-11 h-11');
tabPacks._icon = createMockElement('packs-icon', 'material-symbols-outlined text-[22px]');

const tabBook = createMockElement('tab-book', 'nav-tab nav-item nav-book text-slate-400');
tabBook._iconContainer = createMockElement('book-icon-container', 'nav-icon-container w-11 h-11');
tabBook._icon = createMockElement('book-icon', 'material-symbols-outlined text-[22px]');

const tabRecords = createMockElement('tab-records', 'nav-tab nav-item nav-records text-slate-400');
tabRecords._iconContainer = createMockElement('records-icon-container', 'nav-icon-container w-11 h-11');
tabRecords._icon = createMockElement('records-icon', 'material-symbols-outlined text-[22px]');

const allTabs = [tabHome, tabPacks, tabBook, tabRecords];

// Screens
const screens = {
  'roadmap-screen': createMockElement('roadmap-screen'),
  'packs-screen': createMockElement('packs-screen', 'hidden'),
  'book-screen': createMockElement('book-screen', 'hidden'),
  'stats-screen': createMockElement('stats-screen', 'hidden'),
  'review-screen': createMockElement('review-screen', 'hidden'),
  'roadmap-header': createMockElement('roadmap-header'),
  'bottom-nav': createMockElement('bottom-nav')
};

global.document = {
  readyState: 'complete',
  getElementById: id => {
    if (screens[id]) return screens[id];
    if (id === 'tab-home') return tabHome;
    if (id === 'tab-packs') return tabPacks;
    if (id === 'tab-book') return tabBook;
    if (id === 'tab-records') return tabRecords;
    return createMockElement(id);
  },
  querySelector: sel => {
    if (sel.includes('#tab-home')) return tabHome;
    if (sel.includes('#tab-packs')) return tabPacks;
    if (sel.includes('#tab-book')) return tabBook;
    if (sel.includes('#tab-records')) return tabRecords;
    if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
    return null;
  },
  querySelectorAll: sel => {
    if (sel.includes('#tab-home') || sel.includes('.nav-tab')) {
      return allTabs;
    }
    return [];
  },
  addEventListener: () => {}
};

// Load navigation.js
eval(fs.readFileSync(path.join(__dirname, '../js/navigation.js'), 'utf-8'));

console.log('🧪 Starting test_navigation_tab_sync.js...');

// --- TEST 1: Initial State Check (Home is Active) ---
console.log('\n--- TEST 1: Initial State Check ---');
assert.strictEqual(tabHome.getAttribute('aria-current'), 'page', 'Initial Home tab should have aria-current="page"');
assert.strictEqual(tabHome._iconContainer.classList.contains('bg-emerald-500'), true, 'Initial Home iconContainer should have bg-emerald-500');

// --- TEST 2: Switch to Packs Tab ---
console.log('\n--- TEST 2: Switch to Packs Tab (Single Active Badge Transfer) ---');
window.switchMainTab('packs');

// Check Home Tab reset
assert.strictEqual(tabHome.getAttribute('aria-current'), null, 'Home must NOT have aria-current');
assert.strictEqual(tabHome.classList.contains('active'), false, 'Home must NOT have active class');
assert.strictEqual(tabHome._iconContainer.classList.contains('bg-emerald-500'), false, 'Home iconContainer must NOT have bg-emerald-500');
assert.strictEqual(tabHome._iconContainer.classList.contains('text-slate-400'), true, 'Home iconContainer must be text-slate-400');

// Check Packs Tab activated
assert.strictEqual(tabPacks.getAttribute('aria-current'), 'page', 'Packs must have aria-current="page"');
assert.strictEqual(tabPacks.classList.contains('active'), true, 'Packs must have active class');
assert.strictEqual(tabPacks._iconContainer.classList.contains('bg-emerald-500'), true, 'Packs iconContainer must have bg-emerald-500');
assert.strictEqual(tabPacks._iconContainer.classList.contains('text-white'), true, 'Packs iconContainer must have text-white');
assert.strictEqual(screens['packs-screen'].classList.contains('hidden'), false, 'Packs screen must be visible');
console.log('✅ PASS: Home badge cleanly removed, Packs badge cleanly activated');

// --- TEST 3: Switch to Wordbook (Book) Tab ---
console.log('\n--- TEST 3: Switch to Wordbook (Book) Tab ---');
window.switchMainTab('book');

assert.strictEqual(tabPacks.getAttribute('aria-current'), null, 'Packs must NOT have aria-current');
assert.strictEqual(tabPacks._iconContainer.classList.contains('bg-emerald-500'), false, 'Packs must NOT have bg-emerald-500');
assert.strictEqual(tabBook.getAttribute('aria-current'), 'page', 'Book must have aria-current="page"');
assert.strictEqual(tabBook._iconContainer.classList.contains('bg-emerald-500'), true, 'Book iconContainer must have bg-emerald-500');
assert.strictEqual(screens['book-screen'].classList.contains('hidden'), false, 'Book screen must be visible');
console.log('✅ PASS: Wordbook tab cleanly and uniquely activated');

// --- TEST 4: Switch to Records (Stats) Tab ---
console.log('\n--- TEST 4: Switch to Records (Stats) Tab ---');
window.switchMainTab('records');

assert.strictEqual(tabBook.getAttribute('aria-current'), null, 'Book must NOT have aria-current');
assert.strictEqual(tabBook._iconContainer.classList.contains('bg-emerald-500'), false, 'Book must NOT have bg-emerald-500');
assert.strictEqual(tabRecords.getAttribute('aria-current'), 'page', 'Records must have aria-current="page"');
assert.strictEqual(tabRecords._iconContainer.classList.contains('bg-emerald-500'), true, 'Records iconContainer must have bg-emerald-500');
console.log('✅ PASS: Records tab cleanly and uniquely activated');

// --- TEST 5: Return to Home (Roadmap) Tab ---
console.log('\n--- TEST 5: Return to Home (Roadmap) Tab ---');
window.switchMainTab('home');

assert.strictEqual(tabRecords.getAttribute('aria-current'), null, 'Records must NOT have aria-current');
assert.strictEqual(tabRecords._iconContainer.classList.contains('bg-emerald-500'), false, 'Records must NOT have bg-emerald-500');
assert.strictEqual(tabHome.getAttribute('aria-current'), 'page', 'Home must have aria-current="page"');
assert.strictEqual(tabHome._iconContainer.classList.contains('bg-emerald-500'), true, 'Home iconContainer must have bg-emerald-500');
assert.strictEqual(screens['roadmap-screen'].classList.contains('hidden'), false, 'Roadmap screen must be visible');
console.log('✅ PASS: Home tab cleanly re-activated as the single active tab');

console.log('\n🎉 ALL TESTS IN test_navigation_tab_sync.js PASSED PERFECTLY! 🚀');
