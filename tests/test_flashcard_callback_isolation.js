/**
 * test_flashcard_callback_isolation.js
 * 
 * [구조 리팩터링] 플래시카드 완료 핸들러와 게임 진입 로직의 결합 해제 검증 테스트
 * 1. flashcard 완료 시 openGameScreen 하드코딩 직접 호출 제거 검증
 * 2. 일반 스테이지 진입 (navigation.js) 시 onComplete -> openGameScreen(nodeData) 정상 호출 검증
 * 3. 결과창 오답 복습 (gameEngine.js) 시 onComplete -> closeFlashcardScreen() 호출 및 openGameScreen 미실행 검증
 * 4. 사족 플래그 없이 동적 콜백 주입에 의한 완료 동작 완벽 분리 검증
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_flashcard_callback_isolation.js...');

function createMockDOM() {
  const elements = {};

  function makeEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        classList: {
          classes: new Set(),
          add(...cls) { cls.forEach(c => this.classes.add(c)); },
          remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
          contains(c) { return this.classes.has(c); },
          toggle(c, force) {
            if (force === undefined) {
              if (this.classes.has(c)) this.classes.delete(c);
              else this.classes.add(c);
            } else if (force) {
              this.classes.add(c);
            } else {
              this.classes.delete(c);
            }
          }
        },
        style: {
          properties: {},
          removeProperty(p) { delete this.properties[p]; },
          setProperty(p, val) { this.properties[p] = val; }
        },
        textContent: '',
        innerHTML: '',
        onclick: null,
        appendChild(c) { if (!this.children) this.children = []; this.children.push(c); },
        removeChild() {},
        addEventListener(event, fn) { this[`on${event}`] = fn; },
        removeEventListener() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        scrollIntoView() {}
      };
    }
    return elements[id];
  }

  // Pre-register essential DOM IDs
  [
    'flashcard-screen', 'flashcard-container', 'flashcard-close-btn', 'flashcard-skip-btn',
    'flashcard-lesson-title', 'flashcard-progress-bar', 'flashcard-card-wrapper', 'flashcard-active-card',
    'flashcard-card-behind', 'flashcard-behind-tag', 'flashcard-behind-word', 'flashcard-behind-phonetic',
    'flashcard-deck-layer-2', 'flashcard-front', 'flashcard-back', 'flashcard-front-word',
    'flashcard-front-phonetic', 'flashcard-front-tag', 'flashcard-back-meaning', 'flashcard-back-detail',
    'flashcard-back-tag', 'flashcard-hint-text', 'flashcard-speaker-btn', 'flashcard-prev-btn',
    'flashcard-next-btn', 'flashcard-step-text', 'flashcard-cta-btn', 'flashcard-cta-text',
    'flashcard-cta-icon', 'roadmap-screen', 'roadmap-header', 'game-screen', 'bottom-nav',
    'game-result-modal'
  ].forEach(id => makeEl(id));

  const documentMock = {
    getElementById(id) { return elements[id] || makeEl(id); },
    querySelector(sel) {
      if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement() {
      return {
        classList: { add() {}, remove() {}, toggle() {} },
        style: {},
        setAttribute() {},
        appendChild() {}
      };
    },
    readyState: 'complete'
  };

  return { elements, documentMock };
}

function setupEnvironment() {
  const { elements, documentMock } = createMockDOM();

  const sandbox = {
    window: {},
    addEventListener() {},
    removeEventListener() {},
    document: documentMock,
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    setTimeout(fn) { if (typeof fn === 'function') fn(); return 1; },
    clearTimeout() {},
    requestAnimationFrame(fn) { return 1; },
    Audio: function() {
      return { play() { return Promise.resolve(); }, pause() {} };
    },
    console: {
      log: () => {},
      warn: () => {},
      error: console.error
    }
  };

  sandbox.window = sandbox;
  sandbox.global = sandbox;

  // Load modules
  const flashcardCode = fs.readFileSync(path.join(__dirname, '../js/flashcard.js'), 'utf8');
  vm.runInContext(flashcardCode, vm.createContext(sandbox));

  return { sandbox, elements };
}

// ==========================================
// TEST 1: Default completion without onComplete (NO openGameScreen called)
// ==========================================
console.log('\n--- TEST 1: Flashcard completion without callback does NOT launch game ---');
{
  const { sandbox, elements } = setupEnvironment();
  let gameScreenCallCount = 0;
  sandbox.openGameScreen = () => { gameScreenCallCount++; };

  const testWords = [
    { word: 'hola', meaning: '안녕' },
    { word: 'gracias', meaning: '감사합니다' }
  ];

  // Open flashcard with plain words (no callback)
  sandbox.openFlashcardScreen({ words: testWords });

  // Verify flashcard screen is visible
  assert.strictEqual(elements['flashcard-screen'].classList.contains('hidden'), false);

  // Trigger completion via finishFlashcards (e.g. last card CTA or skip)
  sandbox.finishFlashcards();

  // Verification:
  // 1. Flashcard screen is closed
  assert.strictEqual(elements['flashcard-screen'].classList.contains('hidden'), true);
  // 2. openGameScreen is NEVER called automatically
  assert.strictEqual(gameScreenCallCount, 0, 'openGameScreen must NOT be called without onComplete!');
  console.log('✅ PASS: finishFlashcards() cleanly closes flashcard without calling openGameScreen');
}

// ==========================================
// TEST 2: General stage learning pipeline (navigation.js)
//         onComplete -> openGameScreen(nodeData) is called
// ==========================================
console.log('\n--- TEST 2: General stage learning pipeline passes onComplete to openGameScreen ---');
{
  const { sandbox, elements } = setupEnvironment();
  let capturedNodeData = null;
  sandbox.openGameScreen = (nodeData) => { capturedNodeData = nodeData; };

  const targetNodeId = 'u1_node-2';
  const stageWords = [
    { word: 'amigo', meaning: '친구' },
    { word: 'casa', meaning: '집' }
  ];

  const nodeData = {
    nodeId: targetNodeId,
    lessonId: targetNodeId,
    session: stageWords,
    words: stageWords
  };

  // navigation.js pattern
  sandbox.openFlashcardScreen({
    words: stageWords,
    lessonId: targetNodeId,
    nodeData: nodeData,
    onComplete: () => {
      sandbox.openGameScreen(nodeData);
    }
  });

  // Verify UI displays "게임 시작" for last card
  sandbox.currentCardIndex = 1; // last card
  sandbox.renderCurrentCard = sandbox.window.handleNextCard ? sandbox.window.handleNextCard : null;

  // Complete flashcard
  sandbox.finishFlashcards();

  // Verification:
  assert.notStrictEqual(capturedNodeData, null, 'openGameScreen should be called via onComplete');
  assert.strictEqual(capturedNodeData.nodeId, 'u1_node-2');
  assert.strictEqual(capturedNodeData.words.length, 2);
  console.log('✅ PASS: Stage pipeline triggers onComplete -> openGameScreen(nodeData) accurately');
}

// ==========================================
// TEST 3: Result modal wrong words mini review (gameEngine.js)
//         onComplete -> closeFlashcardScreen() only, NO game launch
// ==========================================
console.log('\n--- TEST 3: Wrong words review passes onComplete -> closeFlashcardScreen (NO game launch) ---');
{
  const { sandbox, elements } = setupEnvironment();
  let gameScreenCallCount = 0;
  let closeScreenCallCount = 0;

  sandbox.openGameScreen = () => { gameScreenCallCount++; };
  const originalClose = sandbox.closeFlashcardScreen;
  sandbox.closeFlashcardScreen = (restoreRoadmap) => {
    closeScreenCallCount++;
    return originalClose(restoreRoadmap);
  };

  const wrongWords = [
    { word: 'difícil', meaning: '어려운' },
    { word: 'fácil', meaning: '쉬운' }
  ];

  // gameEngine.js pattern
  sandbox.openFlashcardScreen({
    words: wrongWords,
    onComplete: () => {
      sandbox.closeFlashcardScreen(true);
    }
  });

  // Verify flashcard is open
  assert.strictEqual(elements['flashcard-screen'].classList.contains('hidden'), false);

  // Complete wrong words review
  sandbox.finishFlashcards();

  // Verification:
  // 1. openGameScreen is NEVER called
  assert.strictEqual(gameScreenCallCount, 0, 'openGameScreen MUST NOT be called after wrong words review!');
  // 2. closeFlashcardScreen was executed
  assert(closeScreenCallCount >= 1, 'closeFlashcardScreen should be called upon review completion');
  // 3. Flashcard screen is hidden
  assert.strictEqual(elements['flashcard-screen'].classList.contains('hidden'), true);
  console.log('✅ PASS: Wrong words review completes cleanly by closing screen without launching game');
}

// ==========================================
// TEST 4: Full integration with gameEngine.js and navigation.js code files
// ==========================================
console.log('\n--- TEST 4: Code inspection of gameEngine.js and navigation.js ---');
{
  const navCode = fs.readFileSync(path.join(__dirname, '../js/navigation.js'), 'utf8');
  const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf8');
  const flashcardCode = fs.readFileSync(path.join(__dirname, '../js/flashcard.js'), 'utf8');

  // 1. flashcard.js must NOT have hardcoded openGameScreen inside finishFlashcards or launchGameDirectly
  const finishBody = flashcardCode.slice(flashcardCode.indexOf('function finishFlashcards'), flashcardCode.indexOf('const launchGameDirectly'));
  assert.strictEqual(finishBody.includes('window.openGameScreen('), false, 'finishFlashcards must not hardcode window.openGameScreen');
  assert.strictEqual(finishBody.includes('openGameScreen('), false, 'finishFlashcards must not hardcode openGameScreen');
  assert.strictEqual(finishBody.includes('startNextRoundOrStageDirectly('), false, 'finishFlashcards must not call startNextRoundOrStageDirectly');

  // 2. navigation.js must pass onComplete in startStageLearningPipeline
  assert(navCode.includes('onComplete: () =>'), 'navigation.js must pass onComplete callback');
  assert(navCode.includes('openGameScreen(nodeData)'), 'navigation.js onComplete must call openGameScreen(nodeData)');

  // 3. gameEngine.js must pass onComplete in startWrongWordsMiniReview
  assert(gameEngineCode.includes('onComplete: () =>'), 'gameEngine.js must pass onComplete callback');
  assert(gameEngineCode.includes('closeFlashcardScreen'), 'gameEngine.js onComplete must call closeFlashcardScreen');
  assert.strictEqual(gameEngineCode.includes('window.isWrongWordsMiniReviewActive = true;'), false, 'gameEngine.js must remove temporary isWrongWordsMiniReviewActive flag');

  console.log('✅ PASS: All files strictly comply with dynamic onComplete callback architecture');
}

console.log('\n🎉 ALL TESTS IN test_flashcard_callback_isolation.js PASSED SUCCESSFULLY! 🚀\n');
