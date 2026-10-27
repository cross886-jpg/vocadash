// tests/test_game_quiz_tts_isolation.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_game_quiz_tts_isolation.js...');

let ttsCancelCallCount = 0;
let ttsSpeakCallCount = 0;
let lastSpokenText = '';
let playSoundCalls = [];

const mockSpeechSynthesis = {
  cancel: () => {
    ttsCancelCallCount++;
  },
  speak: (utterance) => {
    ttsSpeakCallCount++;
    lastSpokenText = utterance.text || '';
  },
  getVoices: () => [],
  onvoiceschanged: null
};

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
    dataset: {},
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
      top: '',
      transform: '',
      transition: '',
      opacity: '',
      removeProperty: function (p) { delete this[p]; },
      setProperty: function (p, v) { this[p] = v; }
    },
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
    offsetWidth: 100,
    innerHTML: '',
    textContent: '',
    className: '',
    disabled: false
  };
}

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
  addEventListener: () => { },
  removeEventListener: () => { }
};

const win = {
  addEventListener: () => { },
  removeEventListener: () => { },
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: function (text) { this.text = text; },
  Audio: function () {
    this.play = () => Promise.reject(new Error('Audio mock reject to trigger WebSpeech'));
    this.pause = () => { };
  },
  playSound: (type) => {
    playSoundCalls.push(type);
  },
  location: { reload: () => { }, href: 'http://localhost/' },
  navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
  scrollTo: () => { },
  scroll: () => { }
};

let queuedTimeouts = [];
function flushTimeouts() {
  const pending = queuedTimeouts.slice();
  queuedTimeouts = [];
  pending.forEach(fn => fn());
}

const context = {
  console,
  setTimeout: (fn, ms) => {
    if (typeof fn === 'function') {
      if (!ms || ms <= 0) {
        fn();
        return 1;
      }
      queuedTimeouts.push(fn);
      return queuedTimeouts.length;
    }
    return 1;
  },
  clearTimeout: (id) => {
    // optional clear
  },
  setInterval: () => 1,
  clearInterval: () => { },
  requestAnimationFrame: (fn) => 1,
  cancelAnimationFrame: () => { },
  performance: { now: () => Date.now() },
  escapeHTML: (str) => String(str || ''),
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: win.SpeechSynthesisUtterance,
  Audio: win.Audio,
  playSound: win.playSound,
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

// Load files
const soundCode = fs.readFileSync(path.join(__dirname, '../js/sound.js'), 'utf-8');
vm.runInContext(soundCode, context);

const dataEsCode = fs.readFileSync(path.join(__dirname, '../js/data_es.js'), 'utf-8');
vm.runInContext(dataEsCode, context);

const appJsCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
const courseConfigCode = fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8');
vm.runInContext(courseConfigCode, context);
const profileManagerCode = fs.readFileSync(path.join(__dirname, "../js/profileManager.js"), "utf-8");
vm.runInContext(profileManagerCode, context);
vm.runInContext(appJsCode, context);

const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8');
vm.runInContext(gameEngineCode, context);

win.playSound = (type) => {
  playSoundCalls.push(type);
};

// --- TEST 1: Question Drop (spawnQuestion) plays TTS exactly 1 time ---
console.log('\n--- TEST 1: spawnQuestion 1st TTS Play & Queue Clean ---');
ttsCancelCallCount = 0;
ttsSpeakCallCount = 0;
lastSpokenText = '';

win.userHearts = 5;
win.openGameScreen('node-1');
flushTimeouts();
assert.strictEqual(win.isGameActive, true, 'Game must be active');

// Verify initial question spawned
assert.strictEqual(ttsSpeakCallCount, 1, 'Question drop must trigger speech exactly 1 time');
assert.ok(lastSpokenText.length > 0, 'Spoken text must not be empty');
console.log('✅ PASS: spawnQuestion triggered 1st TTS speech for dropped word:', lastSpokenText);

// --- TEST 2: Answer Click Immediately Cuts In-Flight Speech ---
console.log('\n--- TEST 2: Choice Click Immediately Cancels Audio ---');
const prevCancelCount = ttsCancelCallCount;
const choiceBtn = mockDocument.getElementById('game-choice-0');
choiceBtn.dataset.choice = '임의의선택지';

// Simulate choice click
win.handleChoiceClick(choiceBtn, '임의의선택지');
assert.ok(ttsCancelCallCount > prevCancelCount, 'Choice click must immediately invoke stopTTS / speechSynthesis.cancel');
console.log('✅ PASS: Choice click immediately called stopTTS() and cancelled speech queue');

// Flush answer judgment throttle timeout (350ms)
flushTimeouts();

// --- TEST 3: Correct Answer Does NOT Trigger 2nd TTS ---
console.log('\n--- TEST 3: Correct Answer Does NOT Re-speak Word ---');
const qList = win.currentSessionQuestions || win.gameQuestions || [];
const st = win.getGameEngineState ? win.getGameEngineState() : { currentQuestionIdx: 0 };
const curQ = qList[st.currentQuestionIdx] || {};
const correctAns = ((curQ.isCloze ? (curQ.answer || curQ.meaning) : (curQ.meaning || curQ.answer || curQ.korean || curQ.ko || '')) || '').trim();

const correctBtn = mockDocument.getElementById('game-choice-1');
correctBtn.disabled = false;
correctBtn.dataset.choice = correctAns;

const speakCountBeforeCorrect = ttsSpeakCallCount;
playSoundCalls = [];

win.handleChoiceClick(correctBtn, correctAns);

// Verify playSound('correct') was called
assert.ok(playSoundCalls.includes('correct'), 'playSound("correct") must be triggered for right answer');
console.log('✅ PASS: playSound("correct") played SFX chime');

// Verify NO additional TTS speak calls happened on correct answer
assert.strictEqual(ttsSpeakCallCount, speakCountBeforeCorrect, 'No 2nd TTS speak call must happen on correct answer');
console.log('✅ PASS: 2nd TTS speech on correct answer is completely eliminated (0 repeat)');

// --- TEST 4: Next Question Spawn Cancels Previous Queue & Speaks Exactly 1 Time ---
console.log('\n--- TEST 4: Next Question Spawn Speech Sync ---');
const cancelCountBeforeNext = ttsCancelCallCount;
const speakCountBeforeNext = ttsSpeakCallCount;

// Flush 300ms transition timer from handleCorrectAnswer -> nextQuestion() -> spawnQuestion(nextIdx)
flushTimeouts();

// Verify queue was cancelled prior to new question speech
assert.ok(ttsCancelCallCount > cancelCountBeforeNext, 'spawnQuestion must clear Web Speech API queue before starting new question audio');
// Verify new question speech was called exactly 1 time
assert.strictEqual(ttsSpeakCallCount, speakCountBeforeNext + 1, 'Next question must speak exactly 1 time');
console.log('✅ PASS: Next question queue cleared and spoken exactly 1 time without overlapping');

// --- TEST 5: Wrong Answer Also Cancels In-Flight Speech Immediately ---
console.log('\n--- TEST 5: Wrong Answer Also Cuts Off Audio ---');
const cancelCountBeforeWrong = ttsCancelCallCount;
const wrongBtn = mockDocument.getElementById('game-choice-1');
wrongBtn.dataset.choice = '틀린답';

win.handleChoiceClick(wrongBtn, '틀린답');
assert.ok(ttsCancelCallCount > cancelCountBeforeWrong, 'Wrong answer click must also immediately cancel speech');
console.log('✅ PASS: Wrong answer click cut off in-flight audio');

console.log('\n🎉 ALL TTS ISOLATION AND DUP-REMOVAL TESTS PASSED PERFECTLY! 🚀');
