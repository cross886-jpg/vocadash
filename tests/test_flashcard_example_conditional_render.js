// ==============================================================================
// VocaDash - Flashcard Example Conditional Rendering Test (Karpathy Guidelines)
// 예문 부재 시 빈 따옴표 박스("") 미노출 및 조건부 렌더링 검증
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock DOM
global.window = global;
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.addEventListener = () => {};
global.removeEventListener = () => {};

const domElements = {};
function createMockEl(id, tagName = 'div') {
  const classSet = new Set();
  const children = [];
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    parentElement: null,
    children,
    classList: {
      add: (...cls) => cls.forEach(c => classSet.add(c)),
      remove: (...cls) => cls.forEach(c => classSet.delete(c)),
      contains: c => classSet.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
        } else if (force) classSet.add(c);
        else classSet.delete(c);
      }
    },
    style: {
      display: '',
      removeProperty: p => { delete el.style[p]; },
      setProperty: (p, v) => { el.style[p] = v; }
    },
    textContent: '',
    innerHTML: '',
    dataset: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild(child) {
      child.parentElement = el;
      children.push(child);
      return child;
    },
    querySelectorAll: () => [],
    querySelector: () => null
  };
  return el;
}

// Pre-create container hierarchy for flashcard back
const flashcardExampleContainer = createMockEl('flashcard-example-container');
const flashcardExampleTarget = createMockEl('flashcard-example-target', 'p');
const flashcardExampleMeaning = createMockEl('flashcard-example-meaning', 'p');
flashcardExampleContainer.appendChild(flashcardExampleTarget);
flashcardExampleContainer.appendChild(flashcardExampleMeaning);

domElements['flashcard-example-container'] = flashcardExampleContainer;
domElements['flashcard-example-target'] = flashcardExampleTarget;
domElements['flashcard-example-meaning'] = flashcardExampleMeaning;

global.document = {
  readyState: 'complete',
  getElementById(id) {
    if (!domElements[id]) domElements[id] = createMockEl(id);
    return domElements[id];
  },
  createElement(tag) {
    return createMockEl('', tag);
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
    return createMockEl(sel);
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Modules
eval(fs.readFileSync(path.join(__dirname, '../js/flashcard.js'), 'utf-8'));

async function runTests() {
  console.log('🧪 Starting test_flashcard_example_conditional_render.js...');

  // TEST 1: Word with NO example data (standard course word)
  const wordWithoutExample = {
    id: 'es_101',
    word: '¡Hola!',
    pronunciation: '올라!',
    meaning: '안녕하세요 / 안녕'
  };

  window.openFlashcardScreen({
    words: [wordWithoutExample],
    lessonId: 'node-2'
  });

  // Flip card to back
  window.toggleCardFlip?.();

  // Assertions for word WITHOUT example
  assert(
    flashcardExampleContainer.classList.contains('hidden') || flashcardExampleContainer.style.display === 'none',
    'flashcard-example-container MUST be hidden when word has no example'
  );
  assert.strictEqual(
    flashcardExampleTarget.textContent,
    '',
    'flashcard-example-target textContent must be empty (NOT `""`)'
  );
  assert.strictEqual(
    flashcardExampleMeaning.textContent,
    '',
    'flashcard-example-meaning textContent must be empty (NOT `""`)'
  );
  console.log('✅ PASS: Word without example cleanly hides the entire example container without empty quotes');

  // TEST 2: Word WITH example data
  const wordWithExample = {
    id: 'es_test_ex',
    word: 'Pasaporte',
    meaning: '여권',
    exampleTarget: 'Aquí tiene mi pasaporte.',
    exampleMeaning: '여기 제 여권이 있습니다.'
  };

  window.openFlashcardScreen({
    words: [wordWithExample],
    lessonId: 'node-2'
  });

  window.toggleCardFlip?.();

  // Assertions for word WITH example
  assert(
    !flashcardExampleContainer.classList.contains('hidden') && flashcardExampleContainer.style.display !== 'none',
    'flashcard-example-container MUST be visible when word has example'
  );
  assert.strictEqual(
    flashcardExampleTarget.textContent,
    '"Aquí tiene mi pasaporte."',
    'flashcard-example-target must display the formatted example quote'
  );
  assert.strictEqual(
    flashcardExampleMeaning.textContent,
    '"여기 제 여권이 있습니다."',
    'flashcard-example-meaning must display the formatted meaning quote'
  );
  console.log('✅ PASS: Word with example cleanly shows container with formatted quotes');

  // TEST 3: Dynamic transition across deck (Word with example -> Word without example)
  const mixedDeck = [
    { id: '1', word: 'W1', meaning: 'M1', example: 'Example 1', exampleKo: '예문 1' },
    { id: '2', word: 'W2', meaning: 'M2' } // No example
  ];

  window.openFlashcardScreen({
    words: mixedDeck,
    lessonId: 'node-2'
  });

  // Card 1: should show example
  window.toggleCardFlip?.();
  assert(!flashcardExampleContainer.classList.contains('hidden'), 'Card 1 must show example');
  assert.strictEqual(flashcardExampleTarget.textContent, '"Example 1"');

  // Advance to Card 2 via handleNextCard (wait for 220ms slide transition)
  window.handleNextCard?.();
  await new Promise(res => setTimeout(res, 260));

  // Flip Card 2 to back
  window.toggleCardFlip?.();
  assert(
    flashcardExampleContainer.classList.contains('hidden') || flashcardExampleContainer.style.display === 'none',
    'Card 2 (no example) must hide example container immediately'
  );
  assert.strictEqual(flashcardExampleTarget.textContent, '', 'Card 2 target must be empty');
  assert.strictEqual(flashcardExampleMeaning.textContent, '', 'Card 2 meaning must be empty');
  console.log('✅ PASS: Sequential navigation dynamically toggles example box per card');

  console.log('🎉 ALL TESTS IN test_flashcard_example_conditional_render.js PASSED PERFECTLY! 🚀');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
