/**
 * tests/test_section_isolation_roadmap.js
 * 로드맵 섹션별 완전 분리 (Section Isolation) 및 드로어 동기화 검증 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Mock LocalStorage & DOM
const storageMock = {};
global.localStorage = {
  getItem: (key) => (key in storageMock ? storageMock[key] : null),
  setItem: (key, val) => { storageMock[key] = String(val); },
  removeItem: (key) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

// DOM Mocking
function createMockElement(id, tagName = 'div', className = '') {
  return {
    id,
    tagName: tagName.toUpperCase(),
    className,
    classList: {
      _classes: new Set(className.split(' ').filter(Boolean)),
      contains(c) { return this._classes.has(c); },
      add(...cs) { cs.forEach(c => c && this._classes.add(c)); this._updateClassName(); },
      remove(...cs) { cs.forEach(c => c && this._classes.delete(c)); this._updateClassName(); },
      toggle(c, force) {
        if (force === undefined) force = !this.contains(c);
        if (force) this.add(c); else this.remove(c);
        return force;
      },
      _updateClassName() { this.className = Array.from(this._classes).join(' '); }
    },
    style: {},
    dataset: {},
    children: [],
    parentElement: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
      return child;
    },
    querySelector(selector) {
      return this.children.find(c => {
        if (selector.startsWith('#') && c.id === selector.slice(1)) return true;
        if (selector.startsWith('.') && c.classList?.contains(selector.slice(1))) return true;
        if (selector.includes('[data-unit-index="')) {
          const match = selector.match(/\[data-unit-index="(\d+)"\]/);
          if (match && c.dataset?.unitIndex === match[1]) return true;
        }
        return false;
      }) || null;
    },
    querySelectorAll(selector) {
      const results = [];
      const traverse = (el) => {
        if (!el || !el.children) return;
        el.children.forEach(c => {
          let matches = false;
          if (selector.startsWith('#') && c.id === selector.slice(1)) matches = true;
          else if (selector.startsWith('.') && c.classList?.contains(selector.slice(1))) matches = true;
          else if (selector.includes('.unit-section-block') && c.classList?.contains('unit-section-block')) matches = true;
          else if (selector.includes('.course-ticket-card') && c.classList?.contains('course-ticket-card')) matches = true;
          else if (selector.includes('.roadmap-node') && c.classList?.contains('roadmap-node')) matches = true;
          if (matches) results.push(c);
          traverse(c);
        });
      };
      traverse(this);
      return results;
    },
    closest(selector) {
      if (this.style?.display === 'none') return this;
      return null;
    },
    getBoundingClientRect: () => ({ top: 100, bottom: 200, left: 0, right: 300, width: 300, height: 100 }),
    scrollIntoView: () => {},
    innerHTML: '',
    textContent: ''
  };
}

const mockDocElements = {};
const mockDocument = {
  getElementById: (id) => mockDocElements[id] || (mockDocElements[id] = createMockElement(id)),
  querySelector: (sel) => {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return mockDocElements[id] || (mockDocElements[id] = createMockElement(id));
    }
    if (sel.includes('.unit-section-block')) {
      const match = sel.match(/\[data-unit-index="(\d+)"\]/);
      if (match) {
        return mockDocElements['roadmap-subsequent-units']?.children?.find(c => c.dataset?.unitIndex === match[1])
          || (match[1] === '0' ? mockDocElements['unit-section-0'] : null);
      }
    }
    return null;
  },
  querySelectorAll: (sel) => {
    const list = [];
    if (sel.includes('.unit-section-block')) {
      if (mockDocElements['unit-section-0']) list.push(mockDocElements['unit-section-0']);
      if (mockDocElements['roadmap-subsequent-units']?.children) {
        mockDocElements['roadmap-subsequent-units'].children.forEach(c => {
          if (c.classList?.contains('unit-section-block')) list.push(c);
        });
      }
    }
    return list;
  },
  createElement: (tag) => createMockElement('dyn-' + Math.random(), tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: createMockElement('body')
};

global.document = mockDocument;
global.window = global;
global.window.document = mockDocument;
global.window.scrollTo = () => {};
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};

// Setup standard DOM nodes required for roadmap
const containerU0 = createMockElement('unit-section-0', 'div', 'unit-section-block');
containerU0.dataset.unitIndex = '0';
mockDocElements['unit-section-0'] = containerU0;

const subContainer = createMockElement('roadmap-subsequent-units', 'div');
mockDocElements['roadmap-subsequent-units'] = subContainer;

mockDocElements['unit-banner'] = createMockElement('unit-banner');
mockDocElements['unit-sub-badge'] = createMockElement('unit-sub-badge');
mockDocElements['unit-main-title'] = createMockElement('unit-main-title');
mockDocElements['unit-lang-badge'] = createMockElement('unit-lang-badge');
mockDocElements['unit-banner-content'] = createMockElement('unit-banner-content');
mockDocElements['course-drawer-card'] = createMockElement('course-drawer-card');
mockDocElements['course-drawer-backdrop'] = createMockElement('course-drawer-backdrop');

// Result modal elements
mockDocElements['result-title'] = createMockElement('result-title');
mockDocElements['result-subtitle'] = createMockElement('result-subtitle');
mockDocElements['btn-result-primary-text'] = createMockElement('btn-result-primary-text');
mockDocElements['game-result-modal'] = createMockElement('game-result-modal');
mockDocElements['game-result-card'] = createMockElement('game-result-card');

console.log('🧪 [Test] Starting test_section_isolation_roadmap.js...');

// Load dependencies
require('../js/data/courseSections.js');
require('../js/progressManager.js');
require('../js/courseDrawer.js');
require('../js/roadmapRenderer.js');
require('../js/gameResultModal.js');

console.log('✅ PASS: Modules loaded successfully');

// --- Test 1: Initial Roadmap Render with Section A1 (1~30) ---
console.log('--- 1. Testing Section A1 (Unit 1~30) Roadmap Isolation ---');
window.currentLanguage = 'es';
window.currentCourseId = 'es_main';
window.currentSectionId = 'es_sec_1';
window.setUnlockedUnitLevel(1, 'es', 'es_main');

window.renderRoadmap();

// Unit 1 (#unit-section-0) should be visible
assert.strictEqual(containerU0.style.display, '', 'Unit 1 (#unit-section-0) should be visible when in section A1');

// #roadmap-subsequent-units should contain unit-section-blocks from unit 2 (idx 1) up to unit 30 (idx 29)
const blocks = subContainer.innerHTML.match(/id="unit-section-(\d+)"/g) || [];
const renderedIndices = blocks.map(b => parseInt(b.match(/\d+/)[0], 10));

assert.strictEqual(renderedIndices.length, 29, `Should render 29 subsequent blocks (units 2~30), found ${renderedIndices.length}`);
assert.strictEqual(renderedIndices[0], 1, 'First subsequent block should be index 1 (Unit 2)');
assert.strictEqual(renderedIndices[renderedIndices.length - 1], 29, 'Last subsequent block should be index 29 (Unit 30)');
assert.ok(!renderedIndices.includes(30), 'Index 30 (Unit 31) should NOT be rendered in section A1');

// Banner should indicate A1
assert.ok(mockDocElements['unit-sub-badge'].textContent.includes('VD-A1'), `Banner badge should contain VD-A1, got: ${mockDocElements['unit-sub-badge'].textContent}`);
console.log('✅ PASS: A1 roadmap contains only units 1~30 and excludes unit 31+');

// --- Test 2: Drawer Ticket Selection Switches Roadmap to Section A2 (31~70) ---
console.log('--- 2. Testing Switching to Section A2 (Unit 31~70) via Drawer ---');
const drawerCard = mockDocElements['course-drawer-card'];
window.renderCourseDrawer('es_main', 'es_sec_1');

// Simulate user clicking ticket A2 in drawer
window.courseDrawer.switchSection(drawerCard, 'es_sec_2', 'es_main', true);

assert.strictEqual(window.currentSectionId, 'es_sec_2', 'window.currentSectionId should be es_sec_2');
assert.strictEqual(localStorage.getItem('vocadash_active_section_es_main'), 'es_sec_2', 'Active section in storage should be es_sec_2');

// Unit 1 (#unit-section-0) must be HIDDEN for A2
assert.strictEqual(containerU0.style.display, 'none', 'Unit 1 (#unit-section-0) must be hidden when active section is A2');

// #roadmap-subsequent-units should now contain units 31 (idx 30) to 70 (idx 69)
const a2Blocks = subContainer.innerHTML.match(/id="unit-section-(\d+)"/g) || [];
const a2Indices = a2Blocks.map(b => parseInt(b.match(/\d+/)[0], 10));

assert.strictEqual(a2Indices.length, 40, `Section A2 has 40 units (31~70), found ${a2Indices.length}`);
assert.strictEqual(a2Indices[0], 30, 'First unit in A2 should be index 30 (Unit 31)');
assert.strictEqual(a2Indices[a2Indices.length - 1], 69, 'Last unit in A2 should be index 69 (Unit 70)');
assert.ok(!a2Indices.includes(1), 'Unit 2 (idx 1) must not be rendered in A2');
assert.ok(!a2Indices.includes(70), 'Unit 71 (idx 70) must not be rendered in A2');

// Banner should indicate A2
assert.ok(mockDocElements['unit-sub-badge'].textContent.includes('VD-A2'), `Banner badge should contain VD-A2, got: ${mockDocElements['unit-sub-badge'].textContent}`);
console.log('✅ PASS: Switching to A2 completely isolates roadmap to units 31~70');

// --- Test 3: English (en_main) Section Isolation ---
console.log('--- 3. Testing English Course A1 (Unit 1~27) Isolation ---');
window.currentLanguage = 'en';
window.currentCourseId = 'en_main';
window.currentSectionId = 'en_sec_1';
window.setUnlockedUnitLevel(1, 'en', 'en_main');

window.renderRoadmap();

assert.strictEqual(containerU0.style.display, '', 'Unit 1 should be visible for EN A1');
const enBlocks = subContainer.innerHTML.match(/id="unit-section-(\d+)"/g) || [];
const enIndices = enBlocks.map(b => parseInt(b.match(/\d+/)[0], 10));

assert.strictEqual(enIndices.length, 26, `EN A1 has 27 units total (unit 1 + 26 subsequent units), found ${enIndices.length}`);
assert.strictEqual(enIndices[enIndices.length - 1], 26, 'Last subsequent block for EN A1 should be index 26 (Unit 27)');
assert.ok(!enIndices.includes(27), 'Unit 28 (idx 27) must NOT be rendered in EN A1');
console.log('✅ PASS: English A1 roadmap correctly limited to units 1~27');

// --- Test 4: Section End Boss Clear Interaction ---
console.log('--- 4. Testing Section End Boss Clear Interaction ---');
// Switch back to Spanish A1 (Unit 1~30)
window.currentLanguage = 'es';
window.currentCourseId = 'es_main';
window.currentSectionId = 'es_sec_1';
window.setUnlockedUnitLevel(30, 'es', 'es_main');
window.currentUnitNumber = 30;

// Simulate completing boss of Unit 30
window.openGameResultModal({
  stars: 3,
  score: 100,
  timeText: '00:45',
  missedWords: [],
  questions: [{ id: 1, word: 'hola', meaning: '안녕' }],
  streak: 5,
  currentLessonId: 'u30_node-boss'
});

assert.strictEqual(mockDocElements['result-title'].textContent, '🎉 TICKET CLEAR!', `Title should be '🎉 TICKET CLEAR!', got: ${mockDocElements['result-title'].textContent}`);
assert.ok(mockDocElements['result-subtitle'].textContent.includes('다음 구간 탑승권 잠금 해제!'), `Subtitle should contain next ticket unlock notice, got: ${mockDocElements['result-subtitle'].textContent}`);
assert.strictEqual(mockDocElements['btn-result-primary-text'].textContent, '다음 구간 탑승권 열기 ✈️');

// Trigger Primary Button click
window.handleResultPrimary();

// Active section should now be es_sec_2 (A2)
assert.strictEqual(window.currentSectionId, 'es_sec_2', 'Active section should transition to es_sec_2');
assert.strictEqual(containerU0.style.display, 'none', 'Unit 1 must be hidden after transitioning to A2');

console.log('✅ PASS: Section end boss clear successfully displays next boarding pass unlock notice and transitions section');

console.log('🎉 ALL SECTION ISOLATION TESTS PASSED PERFECTLY! 🚀');
