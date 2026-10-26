// tests/test_review_node_to_node3_isolation.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_review_node_to_node3_isolation.js...');

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
  IntersectionObserver: MockIntersectionObserver,
  location: { reload: () => { }, href: 'http://localhost/' },
  navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' }
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

// Load data files
const footballCode = fs.readFileSync(path.join(__dirname, '../js/data_football.js'), 'utf-8');
vm.runInContext(footballCode, context);

const dataEsCode = fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8');
vm.runInContext(dataEsCode, context);

const dataEnCode = fs.readFileSync(path.join(__dirname, '../js/data_en.js'), 'utf-8');
vm.runInContext(dataEnCode, context);

const appJsCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
vm.runInContext(appJsCode, context);

if (domContentLoadedHandler) {
  domContentLoadedHandler();
}

const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8');
vm.runInContext(gameEngineCode, context);

// --- TEST 1: completeReviewNode strictly completes node-review and leaves node-3 at 0 ---
console.log('\n--- TEST 1: completeReviewNode Isolation & 0-Progress Retention ---');
mockLocalStorage.clear();

// 1과 3회, 2과 3회 클리어 및 보너스 수령 세팅
win.setNodeProgress('node-1', 3, 3, 'es', 'main');
win.setNodeProgress('node-2', 3, 3, 'es', 'main');
if (typeof win.claimBonus === 'function') win.claimBonus('node-bonus', 1);

// currentGameLessonId가 임의로 세팅되어 있더라도
win.currentGameLessonId = 'node-3';

// 복습 노드 완료 호출
win.completeReviewNode('node-review');

// 검증 1: node-review 완료 여부
const isReviewDone = win.isReviewNodeCompleted('node-review');
assert.strictEqual(isReviewDone, true, 'node-review must be marked completed');
console.log('✅ PASS: node-review is marked as completed');

// 검증 2: node-3 진행도가 0인지 검증
const node3Progress = win.getNodeProgress('node-3', 'es', 'main');
assert.strictEqual(node3Progress.clearedCount, 0, 'node-3 progress must remain 0 after review complete');
assert.strictEqual(win.nodeProgressMap['node-3'], 0, 'window.nodeProgressMap["node-3"] must be 0');
console.log('✅ PASS: node-3 clearedCount is strictly 0');

// 검증 3: localStorage에 node-3 오염 키가 없는지 확인
const n3Storage = mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3');
assert.ok(!n3Storage || n3Storage === '0', 'vocadash_prog_es_main_u1_n3 must not be set to 1');
console.log('✅ PASS: vocadash_prog_es_main_u1_n3 is not contaminated with 1');

// --- TEST 2: openLessonModal('node-3') renders accurate title and pure 0/3 progress ---
console.log('\n--- TEST 2: openLessonModal("node-3") Bottom Sheet Rendering ---');

// UI 요소 준비
const modalTitle = mockDocument.getElementById('lesson-modal-title');
const modalDesc = mockDocument.getElementById('lesson-modal-desc');
const modalBadge = mockDocument.getElementById('lesson-modal-badge');
const modalProgText = mockDocument.getElementById('lesson-modal-progress-text');
const startBtnText = mockDocument.getElementById('lesson-start-btn-text');
const progBar = mockDocument.getElementById('lesson-modal-progress-bar');

win.openLessonModal('node-3');

console.log('Modal Title:', modalTitle.textContent);
console.log('Modal Desc:', modalDesc.textContent);
console.log('Modal Badge:', modalBadge.textContent);
console.log('Modal Progress Text:', modalProgText.textContent);
console.log('Modal Start Button:', startBtnText.textContent);
console.log('Modal Progress Bar Width:', progBar.style.width);

// 1) 타이틀 검증: 3과 고유 단어 주제 타이틀이어야 하며, '약점 복습'이 아니어야 함
assert.ok(!modalTitle.textContent.includes('복습'), 'Title must NOT contain 복습');
assert.ok(modalTitle.textContent.includes('3과') || modalTitle.textContent.includes('자기소개'), 'Title must contain 3과 or topic');
console.log('✅ PASS: Title is genuine Unit 3 topic title without review residue');

// 2) 진행도 검증: 0회차일 경우 0%, '0/3', '학습 시작하기', '3과 · 현재 도전 중'
assert.strictEqual(modalProgText.textContent, '0/3', 'Progress text must be 0/3');
assert.strictEqual(progBar.style.width, '0%', 'Progress bar width must be 0%');
assert.strictEqual(startBtnText.textContent, '학습 시작하기', 'Button text must be 학습 시작하기');
assert.strictEqual(modalBadge.textContent, '3과 · 현재 도전 중', 'Badge must indicate 현재 도전 중');
console.log('✅ PASS: Progress is strictly 0/3 with button "학습 시작하기" and bar 0%');

// 3) 설명 문구 검증: 3과 어휘/표현 설명 문구여야 함
assert.ok(!modalDesc.textContent.includes('복습'), 'Description must NOT contain 복습');
console.log('✅ PASS: Description properly reflects Unit 3 vocabulary content');

// --- TEST 3: finishGameStage in review mode does NOT contaminate node-3 ---
console.log('\n--- TEST 3: finishGameStage in Review Mode Protection ---');
win.isReviewGameMode = true;
win.isRoadmapReviewSpeedrun = true;
win.currentGameLessonId = 'node-review';

win.finishGameStage(true);

const n3AfterFinish = win.getNodeProgress('node-3', 'es', 'main');
assert.strictEqual(n3AfterFinish.clearedCount, 0, 'finishGameStage in review mode must not increase node-3 progress');
console.log('✅ PASS: finishGameStage in review mode does not alter node-3 progress');

// --- TEST 4: Cleanup & Sanitization of Pre-existing Contamination ---
console.log('\n--- TEST 4: Sanitization of Contaminated Residual Data ---');
// 시뮬레이션: 과거 버그로 인해 vocadash_prog_es_main_u1_n3에 '1'이 남아있던 상태
mockLocalStorage.setItem('vocadash_prog_es_main_u1_n3', '1');

// loadNodeProgress 호출 시 자동으로 0으로 정화되는지 검증
const loaded = win.loadNodeProgress('es', 'main');
assert.strictEqual(loaded['node-3'], 0, 'Contaminated node-3 progress must be sanitized to 0');
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3'), null, 'Contaminated storage key must be removed');
console.log('✅ PASS: Sanitization routine successfully cleared contaminated node-3 data');

// --- TEST 5: Legitimate Node-3 Game Completion & Progress Save (Not mistaken for node-review) ---
console.log('\n--- TEST 5: Legitimate Node-3 Game Completion & Progress Save ---');
// 1) 3번 노드 모달 열기
win.openLessonModal('node-3');
assert.strictEqual(win.currentSelectedNodeId, 'node-3', 'currentSelectedNodeId must be node-3');
assert.strictEqual(win.isReviewGameMode, false, 'isReviewGameMode must be reset to false');

// 2) 3번 노드 게임 시작
win.openGameScreen('node-3');
assert.strictEqual(win.currentGameLessonId, 'node-3', 'currentGameLessonId must be node-3');
assert.strictEqual(win.isStageFinishing, false, 'isStageFinishing must be reset to false on new game');

// 3) 3번 노드 완주 시 finishGameStage(true) 호출
const finishResult1 = win.finishGameStage(true);
assert.notStrictEqual(finishResult1, false, 'First finishGameStage call must succeed');

// 4) 3번 노드 진행도 1회차 정상 저장 검증
const n3ProgressAfterClear1 = win.getNodeProgress('node-3', 'es', 'main');
assert.strictEqual(n3ProgressAfterClear1.clearedCount, 1, 'node-3 progress must be incremented to 1 after clear');
assert.strictEqual(mockLocalStorage.getItem('vocadash_prog_es_main_u1_n3'), '1', 'storage key vocadash_prog_es_main_u1_n3 must be 1');
console.log('✅ PASS: Node-3 completion correctly recognized, saved as 1, and NOT mistaken for node-review');

// --- TEST 6: Duplicate finishGameStage Call Defense ---
console.log('\n--- TEST 6: Duplicate finishGameStage Call Defense (4x Invocations Prevention) ---');
const duplicateCall2 = win.finishGameStage(true);
const duplicateCall3 = win.finishGameStage(true);
const duplicateCall4 = win.finishGameStage(true);

assert.strictEqual(duplicateCall2, false, '2nd duplicate finishGameStage must be blocked');
assert.strictEqual(duplicateCall3, false, '3rd duplicate finishGameStage must be blocked');
assert.strictEqual(duplicateCall4, false, '4th duplicate finishGameStage must be blocked');

const n3ProgressAfterDuplicates = win.getNodeProgress('node-3', 'es', 'main');
assert.strictEqual(n3ProgressAfterDuplicates.clearedCount, 1, 'Progress must remain 1 and not be corrupted by duplicate calls');
console.log('✅ PASS: All duplicate finishGameStage calls successfully blocked by isStageFinishing');

// 다음 게임 세션 진입 시 클린업 검증
win.openGameScreen('node-3');
assert.strictEqual(win.isStageFinishing, false, 'isStageFinishing must be cleaned up for the next session');
console.log('✅ PASS: Next session properly reset isStageFinishing to false');

console.log('\n🎉 ALL TESTS IN test_review_node_to_node3_isolation.js PASSED PERFECTLY! 🚀');
