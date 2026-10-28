// tests/test_header_and_badge_unification.js
// 플래시카드 헤더 및 인게임 상단 스테이지 표시 규격 일원화 검증 테스트

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting test_header_and_badge_unification.js...');

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
        querySelector() {
          return {
            textContent: '',
            style: {}
          };
        },
        closest() {
          return {
            querySelector: () => ({
              textContent: '',
              style: {}
            })
          };
        },
        querySelectorAll() { return []; },
        scrollIntoView() {}
      };
    }
    return elements[id];
  }

  [
    'flashcard-screen', 'flashcard-container', 'flashcard-close-btn', 'flashcard-skip-btn',
    'flashcard-lesson-title', 'flashcard-progress-bar', 'flashcard-card-wrapper', 'flashcard-active-card',
    'flashcard-card-behind', 'flashcard-behind-tag', 'flashcard-behind-word', 'flashcard-behind-phonetic',
    'flashcard-deck-layer-2', 'flashcard-front', 'flashcard-back', 'flashcard-front-word',
    'flashcard-front-phonetic', 'flashcard-front-tag', 'flashcard-back-meaning', 'flashcard-back-detail',
    'flashcard-back-tag', 'flashcard-hint-text', 'flashcard-speaker-btn', 'flashcard-prev-btn',
    'flashcard-next-btn', 'flashcard-step-text', 'flashcard-cta-btn', 'flashcard-cta-text',
    'flashcard-cta-icon', 'roadmap-screen', 'roadmap-header', 'game-screen', 'bottom-nav',
    'game-result-modal', 'game-stage-title', 'game-pause-dialog', 'game-freeze-overlay',
    'game-floating-effect', 'game-result-clear-card', 'game-result-gameover-card',
    'game-hearts-container', 'game-progress-bar', 'game-progress-text'
  ].forEach(id => makeEl(id));

  const documentMock = {
    getElementById(id) { return elements[id] || makeEl(id); },
    querySelector(sel) {
      if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
      return {
        textContent: '',
        style: {},
        querySelector: () => null,
        closest: () => null
      };
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement() {
      return {
        classList: { add() {}, remove() {}, toggle() {} },
        style: {},
        setAttribute() {},
        appendChild() {},
        querySelector() { return null; },
        querySelectorAll() { return []; }
      };
    },
    readyState: 'complete'
  };

  return { elements, documentMock };
}

function parseNodeCoordinates(nodeId, defaultUnit = 1) {
  if (!nodeId) return { unitIndex: defaultUnit, nodeIndex: 1 };
  const str = String(nodeId).trim();
  const matchComposite = str.match(/^u(\d+)[-_](?:stage|node)[-_](\d+)$/i);
  if (matchComposite) {
    return { unitIndex: parseInt(matchComposite[1], 10) || defaultUnit, nodeIndex: parseInt(matchComposite[2], 10) || 1 };
  }
  const match1 = str.match(/^(?:fb|es|en)?[_]?(\d+)_n(\d+)$/i);
  if (match1) {
    return { unitIndex: parseInt(match1[1], 10) || defaultUnit, nodeIndex: parseInt(match1[2], 10) || 1 };
  }
  const match2 = str.match(/^u(\d+)[-_]n(\d+)$/i);
  if (match2) {
    return { unitIndex: parseInt(match2[1], 10) || defaultUnit, nodeIndex: parseInt(match2[2], 10) || 1 };
  }
  const match3 = str.match(/^node-(\d+)$/i);
  if (match3) {
    return { unitIndex: defaultUnit, nodeIndex: parseInt(match3[1], 10) || 1 };
  }
  if (str.includes('boss') || str.endsWith('_n6')) {
    const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
    const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
    return { unitIndex: u, nodeIndex: 6 };
  }
  if (str.endsWith('_n5') || str.endsWith('-n3') || str === 'node-3') {
    const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
    const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
    return { unitIndex: u, nodeIndex: 3 };
  }
  if (str.includes('review') || str.endsWith('_n4')) {
    const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
    const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
    return { unitIndex: u, nodeIndex: 'review' };
  }
  const uMatch = str.match(/(?:unit|u|_)?(\d+)/i);
  const u = uMatch ? (parseInt(uMatch[1], 10) || defaultUnit) : defaultUnit;
  const nMatch = str.match(/(?:node|stage|n|-)?(\d+)$/i);
  const n = nMatch ? (parseInt(nMatch[1], 10) || 1) : 1;
  return { unitIndex: u, nodeIndex: n };
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
    sessionStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    setTimeout(fn) { return 1; },
    clearTimeout() {},
    requestAnimationFrame(fn) { return 1; },
    cancelAnimationFrame() {},
    Audio: function() {
      return { play() { return Promise.resolve(); }, pause() {} };
    },
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    userHearts: 5,
    courseData: {
      units: [
        { title: 'Unit 1. 생존 첫걸음 어휘', words: [{ term: 'hola', meaning: '안녕' }] },
        { title: 'Unit 2. 일상 대화 어휘', words: [{ term: 'gracias', meaning: '감사' }] }
      ]
    },
    getCurrentCourseData: () => sandbox.courseData,
    currentActiveCourse: 'es',
    activeCourseId: 'main',
    parseNodeCoordinates: parseNodeCoordinates,
    getNodeProgress: (nodeId) => {
      const count = sandbox.window.nodeProgressMap ? (sandbox.window.nodeProgressMap[nodeId] || 0) : 0;
      return { clearedCount: count, stars: count, valueOf() { return count; } };
    }
  };

  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);

  const flashcardCode = fs.readFileSync(path.join(__dirname, '../js/flashcard.js'), 'utf8');
  vm.runInContext(flashcardCode, context);

  const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf8');
  vm.runInContext(gameEngineCode, context);

  return { sandbox, elements };
}

const { sandbox, elements } = setupEnvironment();

console.log('\n--- TEST 1: Unit 1, Node 2, Round 2 Synchronization ---');
// Node 2 with 1 round cleared (so entering round 2)
sandbox.window.nodeProgressMap = { 'node-2': 1 };
sandbox.window.currentUnitNumber = 1;

// 1) Open Flashcard
sandbox.window.openFlashcardScreen('node-2');
const flashcardTitleEl = elements['flashcard-lesson-title'];
console.log('Flashcard Header:', flashcardTitleEl.textContent);
assert.strictEqual(
  flashcardTitleEl.textContent,
  'Unit 1 · Stage 2 (2/3) · 단어 예습',
  'Flashcard title must be "Unit 1 · Stage 2 (2/3) · 단어 예습"'
);

// 2) Open Game
sandbox.window.openGameScreen('node-2');
const gameTitleEl = elements['game-stage-title'];
console.log('In-Game Badge:', gameTitleEl.textContent);
assert.strictEqual(
  gameTitleEl.textContent,
  'Unit 1 · Stage 2 (2/3)',
  'In-Game badge must be "Unit 1 · Stage 2 (2/3)"'
);
console.log('✅ PASS: Unit 1 · Stage 2 (2/3) perfectly synchronized between Flashcard and In-Game!');

console.log('\n--- TEST 2: Boss Stage Specifications ---');
// 1) Flashcard Boss
sandbox.window.openFlashcardScreen('node-boss');
console.log('Flashcard Boss Header:', flashcardTitleEl.textContent);
assert.strictEqual(
  flashcardTitleEl.textContent,
  'Unit 1 · 🔥 FINAL BOSS · 단어 예습',
  'Flashcard boss header must be "Unit 1 · 🔥 FINAL BOSS · 단어 예습"'
);

// 2) In-Game Boss
sandbox.window.openGameScreen('node-boss');
console.log('In-Game Boss Badge:', gameTitleEl.textContent);
assert.strictEqual(
  gameTitleEl.textContent,
  'Unit 1 · 🔥 FINAL BOSS',
  'In-Game boss badge must be "Unit 1 · 🔥 FINAL BOSS"'
);
console.log('✅ PASS: Boss Stage format matches specifications!');

console.log('\n--- TEST 3: Review Node Specifications ---');
// 1) Flashcard Review Node
sandbox.window.openFlashcardScreen('node-review');
console.log('Flashcard Review Header:', flashcardTitleEl.textContent);
assert.strictEqual(
  flashcardTitleEl.textContent,
  'Unit 1 · 🔄 약점 극복 · 단어 예습',
  'Flashcard review header must be "Unit 1 · 🔄 약점 극복 · 단어 예습"'
);

// 2) In-Game Review Node
sandbox.window.openGameScreen('node-review');
console.log('In-Game Review Badge:', gameTitleEl.textContent);
assert.strictEqual(
  gameTitleEl.textContent,
  'Unit 1 · 🔄 약점 복습',
  'In-Game review badge must be "Unit 1 · 🔄 약점 복습"'
);
console.log('✅ PASS: Review Node format matches specifications!');

console.log('\n--- TEST 4: Unit 2+ Composite Nodes (e.g., u2_stage-3, u2_node-boss, u2_node-review) ---');
sandbox.window.nodeProgressMap['u2_stage-3'] = 2; // 2 clears -> entering round 3

// Unit 2 Stage 3 (3/3)
sandbox.window.openFlashcardScreen('u2_stage-3');
assert.strictEqual(flashcardTitleEl.textContent, 'Unit 2 · Stage 3 (3/3) · 단어 예습');
sandbox.window.openGameScreen('u2_stage-3');
assert.strictEqual(gameTitleEl.textContent, 'Unit 2 · Stage 3 (3/3)');

// Unit 2 Boss
sandbox.window.openFlashcardScreen('u2_node-boss');
assert.strictEqual(flashcardTitleEl.textContent, 'Unit 2 · 🔥 FINAL BOSS · 단어 예습');
sandbox.window.openGameScreen('u2_node-boss');
assert.strictEqual(gameTitleEl.textContent, 'Unit 2 · 🔥 FINAL BOSS');

// Unit 2 Review
sandbox.window.openFlashcardScreen('u2_node-review');
assert.strictEqual(flashcardTitleEl.textContent, 'Unit 2 · 🔄 약점 극복 · 단어 예습');
sandbox.window.openGameScreen('u2_node-review');
assert.strictEqual(gameTitleEl.textContent, 'Unit 2 · 🔄 약점 복습');

console.log('✅ PASS: Unit 2+ composite node formats verified successfully!');

console.log('\n🎉 ALL TESTS IN test_header_and_badge_unification.js PASSED! 🚀');
