// ==============================================================================
// VocaDash - Unit 1 Boss Slot & Unified Boss Renderer Test
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Unit 1 Boss Slot & Unified Boss Renderer Test...');

// 1. Verify index.html static markup
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

assert(indexHtml.includes('id="u1-boss-slot"'), 'index.html must have #u1-boss-slot');
assert(!indexHtml.includes('id="node-boss-btn"'), 'index.html must NOT contain hardcoded #node-boss-btn');
assert(!indexHtml.includes('id="node-boss-glow"'), 'index.html must NOT contain hardcoded #node-boss-glow');
assert(!indexHtml.includes('id="node-boss-label-card"'), 'index.html must NOT contain hardcoded #node-boss-label-card');
console.log('✅ PASS: Static HTML hardcoded Unit 1 boss node completely removed and replaced with #u1-boss-slot.');

// 2. Setup mock DOM environment
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

const domElements = {};

function createMockElement(id, tag = 'div') {
  const classSet = new Set();
  const styleObj = {
    removeProperty(p) { delete this[p]; }
  };
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      add: (...cls) => cls.forEach(c => c && classSet.add(c)),
      remove: (...cls) => cls.forEach(c => classSet.delete(c)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
        } else if (force) {
          classSet.add(c);
        } else {
          classSet.delete(c);
        }
      },
      contains: c => classSet.has(c)
    },
    style: styleObj,
    dataset: {},
    textContent: '',
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(val) {
      this._innerHTML = val;
      // Parse child ids from innerHTML
      const idMatches = val.matchAll(/id="([^"]+)"/g);
      for (const m of idMatches) {
        if (!domElements[m[1]]) {
          domElements[m[1]] = createMockElement(m[1]);
        }
      }
    },
    children: [],
    appendChild(child) { this.children.push(child); if (child) child.parentElement = this; },
    addEventListener(event, fn) {
      if (!this._listeners) this._listeners = {};
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },
    dispatchEvent(event) {
      if (this._listeners && this._listeners[event.type]) {
        this._listeners[event.type].forEach(fn => fn(event));
      }
    },
    querySelector(sel) {
      if (sel.startsWith('#')) return domElements[sel.slice(1)] || null;
      return null;
    },
    querySelectorAll() { return []; },
    closest(sel) {
      if (sel.includes(this.id)) return this;
      return null;
    }
  };
}

global.document = {
  readyState: 'complete',
  getElementById(id) {
    if (!domElements[id]) {
      domElements[id] = createMockElement(id);
    }
    return domElements[id];
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) { return createMockElement('', tag); },
  addEventListener() {}
};

// 3. Load Modules
require(path.join(__dirname, '../js/courseConfig.js'));
require(path.join(__dirname, '../js/roadmapRenderer.js'));

console.log('--- TEST 1: Initial Locked State Rendering for Unit 1 Boss ---');
// Node 1, 2, 3 not cleared yet -> Boss locked
localStorage.setItem('vocadash_prog_es_main_u1_n1', '1');
localStorage.setItem('vocadash_prog_es_main_u1_n2', '0');
localStorage.setItem('vocadash_prog_es_main_u1_n3', '0');

window.updateRoadmapNodesUI();

const u1Slot = document.getElementById('u1-boss-slot');
assert(u1Slot.innerHTML.includes('id="node-boss-container"'), 'Boss slot must render #node-boss-container');
assert(u1Slot.innerHTML.includes('id="node-boss-target"'), 'Boss slot must render #node-boss-target');
assert(u1Slot.innerHTML.includes('id="node-boss-btn"'), 'Boss slot must render #node-boss-btn');
assert(u1Slot.innerHTML.includes('data-node-id="node-boss"'), 'Boss slot must have data-node-id="node-boss"');
assert(u1Slot.innerHTML.includes('data-is-locked="true"'), 'Boss node must be locked when Stage 3 is not cleared');
assert(u1Slot.innerHTML.includes('lock'), 'Locked badge icon must be present');
assert(u1Slot.innerHTML.includes('3과 완료 후 해금'), 'Lock badge message must be present');
console.log('✅ PASS: Unit 1 Boss is rendered locked with unified markup in #u1-boss-slot.');

console.log('--- TEST 2: Active State Rendering for Unit 1 Boss (Stage 3 Mastered) ---');
// Stage 1, 2, 3 mastered (3/3), boss 0
localStorage.setItem('vocadash_prog_es_main_u1_n1', '3');
localStorage.setItem('vocadash_prog_es_main_u1_n2', '3');
localStorage.setItem('vocadash_prog_es_main_u1_n3', '3');
localStorage.setItem('vocadash_prog_es_main_u1_n6', '0');
localStorage.setItem('vocadash_es_bonus_u1', 'done');
localStorage.setItem('vocadash_es_review_u1', 'done');

window.updateRoadmapNodesUI();

assert(u1Slot.innerHTML.includes('data-is-locked="false"'), 'Boss node must be unlocked');
assert(u1Slot.innerHTML.includes('START'), 'Boss node must render START badge when active');
assert(u1Slot.innerHTML.includes('FINAL BOSS EXAM'), 'Boss badge must show FINAL BOSS EXAM');
assert(!u1Slot.innerHTML.includes('3과 완료 후 해금'), 'Lock message must not appear');
console.log('✅ PASS: Unit 1 Boss is rendered active with START pulse badge in #u1-boss-slot.');

console.log('--- TEST 3: Completed State Rendering for Unit 1 Boss ---');
// Boss cleared (1/1)
localStorage.setItem('vocadash_prog_es_main_u1_n6', '1');

window.updateRoadmapNodesUI();

assert(u1Slot.innerHTML.includes('check'), 'Checkmark icon must be rendered on cleared boss node');
assert(u1Slot.innerHTML.includes('BOSS CLEAR!'), 'Boss pill badge must show BOSS CLEAR!');
assert(u1Slot.innerHTML.includes('data-is-locked="false"'), 'Boss node is unlocked');
console.log('✅ PASS: Unit 1 Boss is rendered with BOSS CLEAR! and checkmark badge in #u1-boss-slot.');

console.log('--- TEST 4: Unified Markup Consistency (Unit 1 vs Unit 2) ---');
const u1Html = window.renderUnitBossHtml({
  unitNum: 1,
  align: 'mx-auto mb-6',
  width: '290px',
  isCompleted: false,
  isActive: true,
  isLocked: false,
  nodeId: 'node-boss'
});

const u2Html = window.renderUnitBossHtml({
  unitNum: 2,
  align: 'mx-auto mb-6',
  width: '290px',
  isCompleted: false,
  isActive: true,
  isLocked: false,
  nodeId: 'u2_node-boss'
});

// Both must share identical structural classes: 84px button, 290px container, start badge, etc.
assert(u1Html.includes('w-[84px] h-[84px]'), 'Unit 1 must use 84px button');
assert(u2Html.includes('w-[84px] h-[84px]'), 'Unit 2 must use 84px button');
assert(u1Html.includes('FINAL BOSS EXAM'), 'Unit 1 must use unified badge label');
assert(u2Html.includes('FINAL BOSS EXAM'), 'Unit 2 must use unified badge label');
console.log('✅ PASS: Unit 1 and Unit 2 share 100% unified boss renderer markup and styling.');

console.log('\n🎉 ALL TESTS IN test_unit1_boss_slot_refactor.js PASSED SUCCESSFULLY! 🚀');
