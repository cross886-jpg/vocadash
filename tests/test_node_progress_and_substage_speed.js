const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_node_progress_and_substage_speed.js...');

// Set up mock DOM and localStorage
const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

function createMockElement(id = '') {
  return {
    id,
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c, force) {
        if (force === true) this._classes.add(c);
        else if (force === false) this._classes.delete(c);
        else if (this._classes.has(c)) this._classes.delete(c);
        else this._classes.add(c);
      }
    },
    style: {
      removeProperty: function() {},
      setProperty: function() {}
    },
    dataset: {},
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k]; },
    removeAttribute: function(k) { delete this[k]; },
    querySelector: function(sel) { return createMockElement(); },
    querySelectorAll: function(sel) { return []; },
    closest: function(sel) { return createMockElement(); },
    appendChild: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    remove: function() {},
    innerHTML: '',
    textContent: ''
  };
}

let domContentLoadedHandler = null;
const mockDocument = {
  getElementById: (id) => createMockElement(id),
  querySelector: (sel) => createMockElement(),
  querySelectorAll: (sel) => [],
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body'),
  addEventListener: (evt, fn) => {
    if (evt === 'DOMContentLoaded') domContentLoadedHandler = fn;
  },
  removeEventListener: () => {}
};

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const win = {
  addEventListener: () => {},
  removeEventListener: () => {},
  IntersectionObserver: MockIntersectionObserver
};

const context = {
  console,
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  IntersectionObserver: MockIntersectionObserver,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: (fn) => 1,
  clearTimeout: () => {},
  setInterval: (fn) => 1,
  clearInterval: () => {},
  requestAnimationFrame: (fn) => 1,
  cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  escapeHTML: (str) => String(str || '')
};
win.window = win;
win.document = mockDocument;
win.localStorage = mockLocalStorage;

vm.createContext(context);

// Load data_football.js, app.js, and gameEngine.js
const footballCode = fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const engineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf8');

vm.runInContext(footballCode, context);
vm.runInContext(appCode, context);
if (domContentLoadedHandler) {
  domContentLoadedHandler();
}
vm.runInContext(engineCode, context);

// 1. Verify renderStarsBadge
console.log('--- Test 1: renderStarsBadge ---');
const badge0 = win.renderStarsBadge(0, 0, false);
console.log('Badge 0/3:', badge0);
assert(badge0.includes('0/3 레슨 진행중'), 'Should show 0/3');
assert((badge0.match(/opacity-30/g) || []).length === 3, 'Should have 3 empty stars');

const badge1 = win.renderStarsBadge(1, 1, false);
console.log('Badge 1/3:', badge1);
assert(badge1.includes('1/3 레슨 진행중'), 'Should show 1/3');
assert((badge1.match(/text-amber-400/g) || []).length === 1, 'Should have 1 gold star');
assert((badge1.match(/opacity-30/g) || []).length === 2, 'Should have 2 empty stars');

const badge2 = win.renderStarsBadge(2, 2, false);
console.log('Badge 2/3:', badge2);
assert(badge2.includes('2/3 레슨 진행중'), 'Should show 2/3');
assert((badge2.match(/text-amber-400/g) || []).length === 2, 'Should have 2 gold stars');

const badge3 = win.renderStarsBadge(3, 3, false);
console.log('Badge 3/3:', badge3);
assert(badge3.includes('완료!'), 'Should show 완료!');
assert((badge3.match(/text-amber-400/g) || []).length === 3, 'Should have 3 gold stars');

const badgeLocked = win.renderStarsBadge(0, 0, true, '이전 레슨 완료 후');
console.log('Badge Locked:', badgeLocked);
assert(badgeLocked.includes('이전 레슨 완료 후'), 'Should show lock message');

console.log('✅ Test 1 passed!');

// 2. Verify getNodeProgress & setNodeProgress
console.log('--- Test 2: getNodeProgress & setNodeProgress ---');
const pInit = win.getNodeProgress('fb_1_n1');
assert.strictEqual(pInit.clearedCount, 0);
assert.strictEqual(pInit.stars, 0);

win.setNodeProgress('fb_1_n1', 1, 1);
const p1 = win.getNodeProgress('fb_1_n1');
assert.strictEqual(p1.clearedCount, 1);
assert.strictEqual(p1.stars, 1);
assert.strictEqual(win.nodeProgressMap['fb_1_n1'], 1);

// Test resolveNodeData
const resolvedData = win.resolveNodeData('fb_1_n1', 'node-1');
assert.strictEqual(resolvedData.clearedCount, 1);

console.log('✅ Test 2 passed!');

// 3. Verify finishGameStage clear progression with unique node IDs
console.log('--- Test 3: finishGameStage unique node progress synchronization ---');
mockLocalStorage.clear();
win.nodeProgressMap = {};
win.activeCourseId = 'pack_football';
win.currentGameLessonId = 'fb_1_n1';

// Round 1 Clear
win.openGameScreen('fb_1_n1');
win.finishGameStage(true);
let savedData = JSON.parse(mockLocalStorage.getItem('vocadash_node_progress_fb_1_n1'));
console.log('After 1st clear:', savedData);
assert.strictEqual(savedData.clearedCount, 1);
assert.strictEqual(savedData.stars, 1);
assert.strictEqual(win.nodeProgressMap['fb_1_n1'], 1);

// Round 2 Clear
win.openGameScreen('fb_1_n1');
win.finishGameStage(true);
savedData = JSON.parse(mockLocalStorage.getItem('vocadash_node_progress_fb_1_n1'));
console.log('After 2nd clear:', savedData);
assert.strictEqual(savedData.clearedCount, 2);
assert.strictEqual(savedData.stars, 2);

// Round 3 Clear (Completed!)
win.openGameScreen('fb_1_n1');
win.finishGameStage(true);
savedData = JSON.parse(mockLocalStorage.getItem('vocadash_node_progress_fb_1_n1'));
console.log('After 3rd clear:', savedData);
assert.strictEqual(savedData.clearedCount, 3);
assert.strictEqual(savedData.stars, 3);

console.log('✅ Test 3 passed!');

// 4. Verify sub-stage speed scaling and master combo scoring
console.log('--- Test 4: Sub-stage speed scaling and round 3 master combo scoring ---');
// Test openGameScreen with 0 clears (Round 1)
mockLocalStorage.clear();
win.nodeProgressMap = {};
win.openGameScreen('fb_1_n1');
assert.strictEqual(win.currentSubStageRound, 1, 'Should be Round 1');
assert.strictEqual(win.currentRoundBaseSpeed, 1.0, 'Round 1 base speed should be 1.0x');

// Simulate 1 clear (Round 2)
win.setNodeProgress('fb_1_n1', 1, 1);
win.openGameScreen('fb_1_n1');
assert.strictEqual(win.currentSubStageRound, 2, 'Should be Round 2');
assert.strictEqual(win.currentRoundBaseSpeed, 1.2, 'Round 2 base speed should be 1.2x');

// Simulate 2 clears (Round 3)
win.setNodeProgress('fb_1_n1', 2, 2);
win.openGameScreen('fb_1_n1');
assert.strictEqual(win.currentSubStageRound, 3, 'Should be Round 3');
assert.strictEqual(win.currentRoundBaseSpeed, 1.35, 'Round 3 base speed should be 1.35x');

// Test handleCorrectAnswer in round 3 (Master weighting: 150 + combo * 40)
win.currentSubStageRound = 3;
win.currentRoundBaseSpeed = 1.35;
win.gameQuestions = [{ term: '골', meaning: '골', korean: '골' }];
win.currentQuestionIdx = 0;
win.isActive = true;
win.isGameActive = true;
win.score = 0;
win.handleCorrectAnswer(null, '골', true);
const engineState = win.getGameEngineState();
console.log('Round 3 correct score:', engineState.score);
// At combo=1: 150 + (1 * 40) = 190
assert.strictEqual(engineState.score, 190, 'Round 3 correct answer should add 150 + 40 = 190 points');

console.log('✅ Test 4 passed!');

// 5. Test getNextNodeId
console.log('--- Test 5: getNextNodeId ---');
const footballUnit = win.packFootballData.units[0];
const nextAfterN1 = win.getNextNodeId('fb_1_n1', footballUnit);
console.log('Next after fb_1_n1:', nextAfterN1);
assert.strictEqual(nextAfterN1, 'fb_1_n2', 'Next node after stage 1 should be stage 2 (fb_1_n2)');

const nextAfterN2 = win.getNextNodeId('fb_1_n2', footballUnit);
console.log('Next after fb_1_n2:', nextAfterN2);
assert.strictEqual(nextAfterN2, 'fb_1_n3', 'Next node after stage 2 should be bonus (fb_1_n3)');

const nextAfterN5 = win.getNextNodeId('fb_1_n5', footballUnit);
console.log('Next after fb_1_n5:', nextAfterN5);
assert.strictEqual(nextAfterN5, 'fb_1_n6', 'Next node after stage 3 should be boss (fb_1_n6)');

console.log('✅ Test 5 passed!');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
