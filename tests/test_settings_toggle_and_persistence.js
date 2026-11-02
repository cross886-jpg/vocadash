// tests/test_settings_toggle_and_persistence.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_settings_toggle_and_persistence.js...');

let ttsCancelCallCount = 0;
let ttsSpeakCallCount = 0;
let lastSpokenText = '';

const mockSpeechSynthesis = {
  cancel: () => { ttsCancelCallCount++; },
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
  const listeners = {};
  const el = {
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
    attributes: {},
    setAttribute: function (k, v) { this.attributes[k] = String(v); },
    getAttribute: function (k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    addEventListener: function (evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: function (evt, fn) {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter(f => f !== fn);
      }
    },
    dispatchEvent: function (event) {
      if (this.onclick && event.type === 'click') {
        this.onclick(event);
      }
      if (listeners[event.type]) {
        listeners[event.type].forEach(fn => fn(event));
      }
      if (!event.propagationStopped && this.parentElement) {
        this.parentElement.dispatchEvent(event);
      }
    },
    click: function () {
      const evt = {
        type: 'click',
        target: this,
        currentTarget: this,
        defaultPrevented: false,
        propagationStopped: false,
        preventDefault: function () { this.defaultPrevented = true; },
        stopPropagation: function () { this.propagationStopped = true; }
      };
      this.dispatchEvent(evt);
    },
    querySelector: function (sel) {
      if (sel === 'span') return this.children?.find(c => c.tagName === 'SPAN') || null;
      return null;
    },
    querySelectorAll: function () { return []; },
    closest: function (sel) {
      if (sel === '.settings-toggle-btn' && this.classList.contains('settings-toggle-btn')) return this;
      if (sel === '.flex.items-center.justify-between') {
        let p = this.parentElement;
        while (p) {
          if (p.classList.contains('justify-between')) return p;
          p = p.parentElement;
        }
      }
      return null;
    },
    children: [],
    parentElement: null
  };
  return el;
}

// Build Settings UI DOM structure matching index.html
const settingsScreen = createMockElement('settings-screen');
const toggleRow = createMockElement('setting-row-autoplay');
toggleRow.classList.add('flex', 'items-center', 'justify-between');

const toggleBtn = createMockElement('toggle-auto-play-audio', 'button');
toggleBtn.classList.add('settings-toggle-btn', 'bg-primary-container');
toggleBtn.dataset.settingKey = 'autoPlayAudio';
toggleBtn.setAttribute('data-setting-key', 'autoPlayAudio');
toggleBtn.setAttribute('aria-checked', 'true');
toggleBtn.parentElement = toggleRow;

const toggleThumb = createMockElement('toggle-thumb', 'span');
toggleThumb.classList.add('translate-x-[22px]');
toggleThumb.parentElement = toggleBtn;
toggleBtn.children = [toggleThumb];

toggleRow.children = [toggleBtn];
settingsScreen.children = [toggleRow];

const elementsById = {
  'settings-screen': settingsScreen,
  'toggle-auto-play-audio': toggleBtn,
  'setting-row-autoplay': toggleRow
};

const docListeners = {};
const mockDocument = {
  getElementById: (id) => elementsById[id] || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return elementsById[sel.slice(1)] || null;
    if (sel.includes('autoPlayAudio')) return toggleBtn;
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('.settings-toggle-btn')) return [toggleBtn];
    return [];
  },
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body'),
  addEventListener: (evt, fn) => {
    if (!docListeners[evt]) docListeners[evt] = [];
    docListeners[evt].push(fn);
  },
  removeEventListener: (evt, fn) => {
    if (docListeners[evt]) {
      docListeners[evt] = docListeners[evt].filter(f => f !== fn);
    }
  },
  dispatchEvent: (event) => {
    if (docListeners[event.type]) {
      docListeners[event.type].forEach(fn => fn(event));
    }
  }
};

const win = {
  addEventListener: () => {},
  removeEventListener: () => {},
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: function (text) { this.text = text; },
  Audio: function () {
    this.play = () => Promise.reject(new Error('Audio mock reject'));
    this.pause = () => {};
  },
  playSound: () => {},
  location: { reload: () => {}, href: 'http://localhost/' },
  navigator: { userAgent: 'Mozilla/5.0', vibrate: () => {} },
  scrollTo: () => {},
  scroll: () => {}
};

const context = {
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: (fn) => 1,
  cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: win,
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: win.SpeechSynthesisUtterance,
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

// Load sound.js and settings.js
const soundCode = fs.readFileSync(path.join(__dirname, '../js/sound.js'), 'utf-8');
vm.runInContext(soundCode, context);

const settingsCode = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf-8');
vm.runInContext(settingsCode, context);

// ----------------------------------------------------
// TEST SUITE
// ----------------------------------------------------

console.log('\n--- TEST 1: Initial state is autoPlayAudio: true ---');
assert.strictEqual(win.vocadashSettings.autoPlayAudio, true, 'Initial setting must be true');
assert.strictEqual(toggleBtn.getAttribute('aria-checked'), 'true');
console.log('✅ PASS: Initial settings loaded with autoPlayAudio: true');

console.log('\n--- TEST 2: Toggle click flips autoPlayAudio to false & immediately saves to localStorage ---');
// User clicks the toggle button
toggleBtn.click();

// 1. window.vocadashSettings updated
assert.strictEqual(win.vocadashSettings.autoPlayAudio, false, 'autoPlayAudio must become false');

// 2. localStorage saved
const savedRaw = mockLocalStorage.getItem('vocadash_settings');
assert.ok(savedRaw !== null, 'vocadash_settings must NOT be null in localStorage');
const savedObj = JSON.parse(savedRaw);
assert.strictEqual(savedObj.autoPlayAudio, false, 'localStorage JSON must contain autoPlayAudio: false');

// 3. UI updated
assert.strictEqual(toggleBtn.getAttribute('aria-checked'), 'false', 'aria-checked must be false');
assert.strictEqual(toggleBtn.classList.contains('bg-surface-variant'), true, 'Button must have bg-surface-variant');
assert.strictEqual(toggleThumb.classList.contains('translate-x-0'), true, 'Thumb must be at translate-x-0');
console.log('✅ PASS: Toggle click flipped autoPlayAudio to false and persisted JSON to localStorage');

console.log('\n--- TEST 3: Row click also flips autoPlayAudio back to true & persists ---');
// User clicks the row
toggleRow.click();

assert.strictEqual(win.vocadashSettings.autoPlayAudio, true, 'autoPlayAudio must become true again');
const savedRowObj = JSON.parse(mockLocalStorage.getItem('vocadash_settings'));
assert.strictEqual(savedRowObj.autoPlayAudio, true, 'localStorage JSON must contain autoPlayAudio: true');
assert.strictEqual(toggleBtn.getAttribute('aria-checked'), 'true');
console.log('✅ PASS: Row click flipped autoPlayAudio back to true and persisted to localStorage');

console.log('\n--- TEST 4: Toggling to false stops TTS auto play via sound.js SSOT ---');
// Toggle to false again
toggleBtn.click();
assert.strictEqual(win.vocadashSettings.autoPlayAudio, false);

ttsSpeakCallCount = 0;
// In-game spawn call (without buttonEl)
win.speakWord('Muchas gracias', 'es');
assert.strictEqual(ttsSpeakCallCount, 0, 'TTS speech must NOT trigger when autoPlayAudio is false');
console.log('✅ PASS: speakWord did not speak when autoPlayAudio is false');

console.log('\n--- TEST 5: syncSettingsUI restores UI state from localStorage ---');
// Simulate fresh UI state (e.g., initial button state was aria-checked="true")
toggleBtn.setAttribute('aria-checked', 'true');
toggleBtn.classList.add('bg-primary-container');
toggleBtn.classList.remove('bg-surface-variant');

// Open settings screen -> syncSettingsUI()
win.syncSettingsUI();

assert.strictEqual(toggleBtn.getAttribute('aria-checked'), 'false', 'syncSettingsUI must reflect saved false setting');
assert.strictEqual(toggleBtn.classList.contains('bg-surface-variant'), true);
console.log('✅ PASS: syncSettingsUI correctly synchronized UI toggle state to false');

console.log('\n🎉 ALL SETTINGS TOGGLE & PERSISTENCE TESTS PASSED PERFECTLY! 🚀');

