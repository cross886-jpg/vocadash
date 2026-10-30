// ==============================================================================
// VocaDash - Review Modal Button Click & Event Delegation Test
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Setup mock DOM environment
global.window = global;
global.document = {
  readyState: 'complete',
  _elements: {},
  getElementById(id) {
    if (!this._elements[id]) {
      const classSet = new Set();
      const styleObj = {
        removeProperty(p) { delete this[p]; }
      };
      this._elements[id] = {
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
        textContent: '',
        children: [],
        addEventListener(event, fn) {
          this[`_on_${event}`] = fn;
        },
        dispatchEvent(event) {
          if (this[`_on_${event.type}`]) {
            this[`_on_${event.type}`](event);
          }
        },
        closest(sel) {
          if (sel.includes(this.id)) return this;
          return null;
        }
      };
    }
    return this._elements[id];
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) {
    return {
      tagName: tag,
      classList: new Set(),
      style: {},
      children: [],
      appendChild() {},
      querySelector() { return null; }
    };
  },
  addEventListener() {}
};

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Load progressManager & gameResultModal
eval(fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf-8'));

console.log('🧪 Starting test_review_modal_button_clicks.js...');

// --- TEST 1: Pointer-events auto verification on Clear Modal ---
console.log('\n--- TEST 1: Pointer-events auto verification on Clear Modal ---');
window.isReviewGameMode = true;
window.isRoadmapReviewSpeedrun = true;
window.currentGameLessonId = 'u1_node-review';
window.currentReviewUnitNumber = 1;
window.currentUnitNumber = 1;

window.renderResultModal(true);

const modal = document.getElementById('game-result-modal');
const clearCard = document.getElementById('game-result-clear-card');
const confetti = document.getElementById('result-confetti-container');
const btnNext = document.getElementById('btn-next-stage');
const btnSec = document.getElementById('btn-result-secondary');

assert.strictEqual(modal.style.pointerEvents, 'auto', 'Modal must have pointerEvents: auto');
assert.strictEqual(clearCard.style.pointerEvents, 'auto', 'ClearCard must have pointerEvents: auto');
assert.strictEqual(confetti.style.pointerEvents, 'none', 'Confetti must have pointerEvents: none');
assert.strictEqual(btnNext.style.pointerEvents, 'auto', 'btnNext must have pointerEvents: auto');
assert.strictEqual(btnSec.style.pointerEvents, 'auto', 'btnSec must have pointerEvents: auto');
console.log('✅ PASS: All modal cards and buttons have pointerEvents: auto, confetti is pointerEvents: none');

// --- TEST 2: Review mode modal finishGameStage text verification ---
console.log('\n--- TEST 2: Review mode modal finishGameStage text verification ---');
window.finishGameStage(true, 100);

const titleEl = document.getElementById('result-title');
const subtitleEl = document.getElementById('result-subtitle');
const btnNextText = document.getElementById('btn-result-primary-text');

assert.strictEqual(titleEl.textContent, '⚡ 약점 복습 완료!', 'Title should indicate review completion');
assert.strictEqual(subtitleEl.textContent, '핵심 단어 복습을 성공적으로 마쳤습니다! 👏', 'Subtitle should match review completion');
assert.strictEqual(btnNextText.textContent, '다음 스테이지 이동 ▶', 'Button text should be 다음 스테이지 이동 ▶');
console.log('✅ PASS: Review completion text and button title properly configured');

// --- TEST 3: Click Next Stage Button Unlocks Stage 3 ---
console.log('\n--- TEST 3: Click Next Stage Button Unlocks Stage 3 ---');
let roadmapExited = false;
let focusedNode = false;

window.exitGameToRoadmap = () => { roadmapExited = true; };
window.focusActiveRoadmapNode = () => { focusedNode = true; };

// Re-bind events to ensure delegation & direct handlers are attached
window.bindResultModalEvents();

// Simulate click on btn-next-stage
assert(typeof btnNext.onclick === 'function', 'btnNext.onclick handler must be bound');
btnNext.onclick({ preventDefault() {}, stopPropagation() {} });

assert.strictEqual(roadmapExited, true, 'exitGameToRoadmap should be called');
assert.strictEqual(window.isReviewCompleted('u1_node-review', 1), true, 'Review node must be marked completed');
assert.strictEqual(window.isNodeUnlocked(0, 4, 'node-3'), true, 'Stage 3 (node-3) must be unlocked now');
assert.strictEqual(window.isReviewGameMode, false, 'Review game mode flag must be reset');
assert.strictEqual(window.isRoadmapReviewSpeedrun, false, 'Roadmap speedrun flag must be reset');
console.log('✅ PASS: Next stage button click unlocks Stage 3 and safely exits to roadmap');

// --- TEST 4: Click Secondary Button Resets Review State and Exits ---
console.log('\n--- TEST 4: Click Secondary Button Resets Review State and Exits ---');
window.isReviewGameMode = true;
window.isRoadmapReviewSpeedrun = true;
window.isWrongWordsMiniReviewActive = true;
roadmapExited = false;

assert(typeof btnSec.onclick === 'function', 'btnSec.onclick handler must be bound');
btnSec.onclick({ preventDefault() {}, stopPropagation() {} });

assert.strictEqual(roadmapExited, true, 'exitGameToRoadmap should be called on secondary click');
assert.strictEqual(window.isReviewGameMode, false, 'Review game mode flag must be reset');
assert.strictEqual(window.isRoadmapReviewSpeedrun, false, 'Roadmap speedrun flag must be reset');
assert.strictEqual(window.isWrongWordsMiniReviewActive, false, 'Wrong words mini review flag must be reset');
console.log('✅ PASS: Secondary button click cleanly resets all review flags and exits to roadmap');

// --- TEST 5: Event delegation via #game-result-modal for child elements ---
console.log('\n--- TEST 5: Event delegation via #game-result-modal for child elements ---');
window.isReviewGameMode = true;
window.isRoadmapReviewSpeedrun = true;
window.currentGameLessonId = 'u1_node-review';
window.currentReviewUnitNumber = 1;
window.currentUnitNumber = 1;
roadmapExited = false;

// Child span element with closest returning btnNext
const childSpan = {
  id: 'btn-result-primary-text',
  textContent: '다음 스테이지 이동 ▶',
  closest(sel) {
    if (sel.includes('btn-next-stage') || sel.includes('btn-result-primary')) return btnNext;
    return null;
  }
};

modal.dispatchEvent({
  type: 'click',
  target: childSpan,
  preventDefault() {}
});

assert.strictEqual(roadmapExited, true, 'Event delegation on modal must trigger handleResultPrimary');
assert.strictEqual(window.isReviewGameMode, false, 'Review game mode flag must be reset via delegation');
console.log('✅ PASS: Modal event delegation safely captures clicks on child elements');

console.log('\n🎉 ALL TESTS IN test_review_modal_button_clicks.js PASSED PERFECTLY! 🚀');
