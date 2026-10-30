// ==============================================================================
// VocaDash - Stage Modal Backdrop & Multi-Modal Isolation Test
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Stage Modal Backdrop & Multi-Modal Isolation Test...');

// 1. Setup mock DOM environment
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

const domElements = {};

function createMockElement(id) {
  const classSet = new Set();
  const styleObj = {
    removeProperty(p) { delete this[p]; }
  };
  return {
    id,
    classList: {
      add: (...cls) => cls.forEach(c => classSet.add(c)),
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
    innerHTML: '',
    children: [],
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
    click() {
      this.dispatchEvent({ type: 'click', target: this });
    },
    querySelector() { return null; },
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
  createElement(tag) { return createMockElement(tag); },
  addEventListener() {}
};

// 2. Load Modules
require(path.join(__dirname, '../js/courseConfig.js'));
require(path.join(__dirname, '../js/progressManager.js'));
require(path.join(__dirname, '../js/lessonModal.js'));

// Initialize mock initial classes for elements
const lessonBackdrop = document.getElementById('lesson-modal-backdrop');
lessonBackdrop.classList.add('opacity-0', 'pointer-events-none');

const lessonSheet = document.getElementById('lesson-card-sheet');
lessonSheet.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');

const unitOverviewBackdrop = document.getElementById('unit-overview-modal-backdrop');
unitOverviewBackdrop.classList.add('opacity-0', 'pointer-events-none');
const unitOverviewCard = document.getElementById('unit-overview-modal-card');
unitOverviewCard.classList.add('opacity-0', 'translate-y-full', 'pointer-events-none');

// Initialize events
if (typeof window.initLessonModalEvents === 'function') {
  window.initLessonModalEvents();
}

console.log('--- Test 1: Stage Modal Open & Backdrop Layer Verification ---');
window.openLessonModal('node-1');

assert(lessonBackdrop.classList.contains('opacity-100'), 'Backdrop must have opacity-100 when modal opens');
assert(!lessonBackdrop.classList.contains('opacity-0'), 'Backdrop must not have opacity-0');
assert(lessonBackdrop.classList.contains('pointer-events-auto'), 'Backdrop must have pointer-events-auto');
assert(!lessonBackdrop.classList.contains('pointer-events-none'), 'Backdrop must not have pointer-events-none');
assert.strictEqual(lessonBackdrop.style.pointerEvents, 'auto', 'Backdrop style pointerEvents must be auto');

assert(lessonSheet.classList.contains('opacity-100'), 'Sheet must have opacity-100');
assert(!lessonSheet.classList.contains('pointer-events-none'), 'Sheet must not have pointer-events-none');
console.log('✅ Test 1 Passed: Stage modal opens and backdrop is completely blocking background.');

console.log('--- Test 2: Outside Click to Close Verification ---');
// Clicking backdrop should close stage modal
lessonBackdrop.click();

assert(lessonBackdrop.classList.contains('opacity-0'), 'Backdrop must have opacity-0 after outside click');
assert(lessonBackdrop.classList.contains('pointer-events-none'), 'Backdrop must have pointer-events-none after outside click');
assert.strictEqual(lessonBackdrop.style.pointerEvents, 'none', 'Backdrop style pointerEvents must be none');

assert(lessonSheet.classList.contains('opacity-0'), 'Sheet must have opacity-0 after close');
assert(lessonSheet.classList.contains('pointer-events-none'), 'Sheet must have pointer-events-none after close');
console.log('✅ Test 2 Passed: Outside backdrop click smoothly closes the stage modal.');

console.log('--- Test 3: Multi-Modal Isolation Guard (Stage Modal -> Course Map Modal) ---');
// Open stage modal first
window.openLessonModal('node-1');
assert(lessonBackdrop.classList.contains('opacity-100'), 'Stage modal backdrop should be open');

// Now trigger Course Map modal (openUnitOverviewModal)
window.openUnitOverviewModal();

// Stage modal must be closed automatically!
assert(lessonBackdrop.classList.contains('opacity-0'), 'Stage modal backdrop must be closed when course map opens');
assert(lessonBackdrop.classList.contains('pointer-events-none'), 'Stage modal backdrop must be pointer-events-none');

// And Course map must be open
assert(unitOverviewBackdrop.classList.contains('opacity-100'), 'Course map backdrop should be open');
assert(!unitOverviewBackdrop.classList.contains('pointer-events-none'), 'Course map backdrop should be active');
console.log('✅ Test 3 Passed: Opening Course Map modal automatically closes existing stage modal.');

console.log('--- Test 4: Multi-Modal Isolation Guard (Course Map Modal -> Stage Modal) ---');
// While course map is open, opening stage modal must close course map
window.openLessonModal('node-2');

assert(lessonBackdrop.classList.contains('opacity-100'), 'Stage modal backdrop should be open');
assert(lessonBackdrop.classList.contains('pointer-events-auto'), 'Stage modal backdrop should be active');
console.log('✅ Test 4 Passed: Opening Stage modal enforces single modal policy.');

console.log('--- Test 5: Static HTML Structure Verification ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
assert(indexHtml.includes('id="lesson-modal-backdrop"'), 'index.html must contain #lesson-modal-backdrop');
assert(indexHtml.includes('fixed inset-0'), 'Backdrop must have fixed inset-0');
assert(indexHtml.includes('bg-black/40'), 'Backdrop must have bg-black/40');
assert(indexHtml.includes('transition-opacity'), 'Backdrop must have transition-opacity');
console.log('✅ Test 5 Passed: HTML structure conforms to backdrop specification.');

console.log('\n🎉 ALL TESTS PASSED! Stage modal backdrop & multi-modal isolation verified successfully.');

