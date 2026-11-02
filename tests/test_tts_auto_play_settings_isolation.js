// tests/test_tts_auto_play_settings_isolation.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_tts_auto_play_settings_isolation.js...');

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

function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
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
    addEventListener: function () {},
    removeEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
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
  addEventListener: () => {},
  removeEventListener: () => {}
};

const win = {
  addEventListener: () => {},
  removeEventListener: () => {},
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: function (text) { this.text = text; },
  Audio: function () {
    this.play = () => Promise.reject(new Error('Audio mock reject to trigger WebSpeech'));
    this.pause = () => {};
  },
  playSound: (type) => {
    playSoundCalls.push(type);
  },
  location: { reload: () => {}, href: 'http://localhost/' },
  navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', vibrate: () => {} },
  scrollTo: () => {},
  scroll: () => {}
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
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: (fn) => 1,
  cancelAnimationFrame: () => {},
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
const heartManagerCode = fs.readFileSync(path.join(__dirname, '../js/heartManager.js'), 'utf-8');
vm.runInContext(heartManagerCode, context);
const appJsCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
const courseConfigCode = fs.readFileSync(path.join(__dirname, '../js/courseConfig.js'), 'utf-8');
vm.runInContext(courseConfigCode, context);
const profileManagerCode = fs.readFileSync(path.join(__dirname, '../js/profileManager.js'), 'utf-8');
vm.runInContext(profileManagerCode, context);
const progressManagerCode = fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8');
vm.runInContext(progressManagerCode, context);
vm.runInContext(appJsCode, context);

const gameResultModalCode = fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf-8');
vm.runInContext(gameResultModalCode, context);

const quizSessionGeneratorCode = fs.readFileSync(path.join(__dirname, '../js/quizSessionGenerator.js'), 'utf-8');
vm.runInContext(quizSessionGeneratorCode, context);

const gameEngineCode = fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8');
vm.runInContext(gameEngineCode, context);

// ----------------------------------------------------
// TEST SUITE
// ----------------------------------------------------

console.log('\n--- TEST 1: autoPlayAudio === false blocks in-game spawn TTS ---');
win.vocadashSettings = { autoPlayAudio: false };
ttsSpeakCallCount = 0;
lastSpokenText = '';

win.userHearts = 5;
win.openGameScreen('node-1');
flushTimeouts();

assert.strictEqual(
  ttsSpeakCallCount,
  0,
  'TTS speak must NOT be called when autoPlayAudio is false during question spawn'
);
console.log('✅ PASS: spawnQuestion did NOT speak word when autoPlayAudio === false');

console.log('\n--- TEST 2: autoPlayAudio === false blocks playAutoWordAudio & general speakWord ---');
win.speakWord('Adiós', 'es');
assert.strictEqual(
  ttsSpeakCallCount,
  0,
  'speakWord without buttonEl must NOT trigger speech when autoPlayAudio is false'
);

win.playAutoWordAudio('Por favor', 'es');
assert.strictEqual(
  ttsSpeakCallCount,
  0,
  'playAutoWordAudio must NOT trigger speech when autoPlayAudio is false'
);
console.log('✅ PASS: Both speakWord(term, lang) and playAutoWordAudio were blocked when autoPlayAudio === false');

console.log('\n--- TEST 3: Manual click (buttonEl passed) ALWAYS speaks regardless of autoPlayAudio ---');
const speakerBtn = createMockElement('speaker-btn', 'button');
win.speakWord('Amigo', 'es', speakerBtn);

assert.strictEqual(ttsSpeakCallCount, 1, 'Manual button click MUST trigger TTS even if autoPlayAudio is false');
assert.strictEqual(lastSpokenText, 'Amigo', 'Correct word was spoken on manual click');
assert.strictEqual(
  speakerBtn.classList.contains('tts-speaking'),
  true,
  'Speaker button received active pulse class'
);
console.log('✅ PASS: Manual click with buttonEl played audio and updated button UI while autoPlayAudio === false');

console.log('\n--- TEST 4: autoPlayAudio === true (Re-enabled) restores in-game spawn TTS ---');
win.vocadashSettings.autoPlayAudio = true;
ttsSpeakCallCount = 0;
lastSpokenText = '';

win.openGameScreen('node-1');
flushTimeouts();

assert.strictEqual(ttsSpeakCallCount, 1, 'TTS speak MUST be called when autoPlayAudio is true');
assert.ok(lastSpokenText.length > 0, 'Spoken word must not be empty on spawn');
console.log('✅ PASS: spawnQuestion plays TTS normally when autoPlayAudio === true:', lastSpokenText);

console.log('\n--- TEST 5: Fallback to localStorage when window.vocadashSettings is undefined ---');
delete win.vocadashSettings;
mockLocalStorage.setItem('vocadash_settings', JSON.stringify({ autoPlayAudio: false }));

ttsSpeakCallCount = 0;
win.openGameScreen('node-1');
flushTimeouts();
assert.strictEqual(
  ttsSpeakCallCount,
  0,
  'TTS must read autoPlayAudio: false from localStorage when window.vocadashSettings is missing'
);
console.log('✅ PASS: Correctly respected autoPlayAudio === false from localStorage');

mockLocalStorage.setItem('vocadash_settings', JSON.stringify({ autoPlayAudio: true }));
ttsSpeakCallCount = 0;
win.openGameScreen('node-1');
flushTimeouts();
assert.strictEqual(
  ttsSpeakCallCount,
  1,
  'TTS must read autoPlayAudio: true from localStorage when window.vocadashSettings is missing'
);
console.log('✅ PASS: Correctly respected autoPlayAudio === true from localStorage');

console.log('\n🎉 ALL AUTO-PLAY AUDIO ISOLATION TESTS PASSED PERFECTLY! 🚀');
