// tests/test_languages_registry_and_dynamic_modal.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_languages_registry_and_dynamic_modal.js...');

// 1. Verify index.html includes languagesRegistry.js and dynamic carousel container
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert.ok(
  indexHtml.includes('js/data/languagesRegistry.js'),
  'index.html must load js/data/languagesRegistry.js'
);
assert.ok(
  indexHtml.includes('id="language-grid"'),
  'index.html must have #language-grid'
);
assert.ok(
  indexHtml.includes('overflow-x-auto') && indexHtml.includes('snap-x') && indexHtml.includes('px-4'),
  '#language-grid must have horizontal snap scroll classes and px-4 padding for left-aligned peek affordance'
);
assert.strictEqual(
  indexHtml.includes('id="card-es"'),
  false,
  'Static #card-es must NOT be hardcoded in index.html (dynamic generation)'
);
assert.strictEqual(
  indexHtml.includes('id="card-en"'),
  false,
  'Static #card-en must NOT be hardcoded in index.html (dynamic generation)'
);

console.log('✅ PASS: index.html markup check passed');

// 2. Mock DOM & Environment
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
      contains: function (c) { return this._classes.has(c); }
    },
    attributes: {},
    setAttribute: function (k, v) { this.attributes[k] = String(v); },
    getAttribute: function (k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    addEventListener: function (evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    click: function () {
      if (typeof this.onclick === 'function') {
        this.onclick({ stopPropagation: () => {} });
      }
      const fns = listeners['click'] || [];
      fns.forEach(fn => fn.call(this, { stopPropagation: () => {} }));
    },
    scrollIntoView: function (opts) {
      this._lastScrollIntoView = opts;
    },
    _innerHTML: '',
    children: [],
    get innerHTML() { return this._innerHTML; },
    set innerHTML(val) {
      this._innerHTML = val;
      this.children = parseHtmlToMockChildren(val);
    },
    querySelector: function (sel) {
      return querySelectorMock(this, sel);
    },
    querySelectorAll: function (sel) {
      return querySelectorAllMock(this, sel);
    },
    closest: function (sel) {
      if (matchesSel(this, sel)) return this;
      return null;
    }
  };
  return el;
}

function matchesSel(el, sel) {
  if (!el) return false;
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  return el.tagName === sel.toUpperCase();
}

function querySelectorMock(root, sel) {
  for (const child of root.children) {
    if (matchesSel(child, sel)) return child;
    const found = querySelectorMock(child, sel);
    if (found) return found;
  }
  return null;
}

function querySelectorAllMock(root, sel, acc = []) {
  for (const child of root.children) {
    if (matchesSel(child, sel)) acc.push(child);
    querySelectorAllMock(child, sel, acc);
  }
  return acc;
}

function parseHtmlToMockChildren(html) {
  const root = { children: [], tag: 'root' };
  const stack = [root];
  const tagRegex = /<(\/)?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const isClose = match[1] === '/';
    const tag = match[2];
    const attrsStr = match[3] || '';
    const text = match[4];

    if (text) continue;
    if (!tag) continue;
    if (isClose) {
      if (stack.length > 1 && stack[stack.length - 1].tag && stack[stack.length - 1].tag.toLowerCase() === tag.toLowerCase()) {
        stack.pop();
      }
    } else {
      const isSelfClosing = attrsStr.trim().endsWith('/') || ['input', 'img', 'br', 'hr'].includes(tag.toLowerCase());
      const node = createMockElement('', tag);
      node.tag = tag;

      const idM = attrsStr.match(/id="([^"]+)"/);
      if (idM) node.id = idM[1];

      const classM = attrsStr.match(/class="([^"]+)"/);
      if (classM) {
        classM[1].split(/\s+/).filter(Boolean).forEach(c => node.classList.add(c));
      }

      const dataRegex = /data-([a-zA-Z0-9-]+)="([^"]+)"/g;
      let dMatch;
      while ((dMatch = dataRegex.exec(attrsStr)) !== null) {
        const camelKey = dMatch[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        node.dataset[camelKey] = dMatch[2];
      }

      stack[stack.length - 1].children.push(node);
      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }
  return root.children;
}

const mockDocElements = {
  'language-modal-backdrop': createMockElement('language-modal-backdrop'),
  'language-modal-card': createMockElement('language-modal-card'),
  'language-grid': createMockElement('language-grid'),
  'course-switcher-list': createMockElement('course-switcher-list'),
  'btn-confirm-language-course': createMockElement('btn-confirm-language-course', 'button'),
  'close-modal-btn': createMockElement('close-modal-btn', 'button'),
  'logo-lang-trigger': createMockElement('logo-lang-trigger', 'button')
};

const mockDocListeners = {};
const mockDocument = {
  readyState: 'complete',
  getElementById: (id) => mockDocElements[id] || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return mockDocElements[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel === '.course-switcher-card') {
      return mockDocElements['course-switcher-list'].querySelectorAll('.course-switcher-card');
    }
    return [];
  },
  addEventListener: (evt, fn) => {
    if (!mockDocListeners[evt]) mockDocListeners[evt] = [];
    mockDocListeners[evt].push(fn);
  },
  dispatchEvent: (ev) => {
    const fns = mockDocListeners[ev.type] || [];
    fns.forEach(fn => fn(ev));
  }
};

let toastMsg = null;
const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  showToast: (msg) => { toastMsg = msg; },
  currentLanguage: 'es',
  currentCourseId: 'es_main',
  activeCourseId: 'main'
};
sandbox.window = sandbox;

// 3. Load modules
const regCode = fs.readFileSync(path.join(__dirname, '../js/data/languagesRegistry.js'), 'utf8');
vm.runInNewContext(regCode, sandbox);

const secCode = fs.readFileSync(path.join(__dirname, '../js/data/courseSections.js'), 'utf8');
vm.runInNewContext(secCode, sandbox);

const lmCode = fs.readFileSync(path.join(__dirname, '../js/languageModal.js'), 'utf8');
vm.runInNewContext(lmCode, sandbox);

const cdCode = fs.readFileSync(path.join(__dirname, '../js/courseDrawer.js'), 'utf8');
vm.runInNewContext(cdCode, sandbox);

// 4. Test registry declaration
assert.ok(Array.isArray(sandbox.availableLanguages), 'availableLanguages must be an array');
assert.strictEqual(sandbox.availableLanguages.length, 4, 'Should have 4 languages: es, en, ja, fr');
assert.strictEqual(sandbox.availableLanguages[0].code, 'es');
assert.strictEqual(sandbox.availableLanguages[1].code, 'en');
assert.strictEqual(sandbox.availableLanguages[2].code, 'ja');
assert.strictEqual(sandbox.availableLanguages[2].isReady, false);
assert.strictEqual(sandbox.availableLanguages[3].code, 'fr');
assert.strictEqual(sandbox.availableLanguages[3].isReady, false);

console.log('✅ PASS: languagesRegistry.js loaded with es, en, ja, fr');

// 5. Test opening modal & dynamic carousel rendering
sandbox.openLanguageModal();

const langGrid = mockDocElements['language-grid'];
const renderedCards = langGrid.querySelectorAll('.course-card');
assert.strictEqual(renderedCards.length, 4, 'Must render 4 language cards in carousel');
assert.ok(langGrid.innerHTML.includes('스페인어'), 'Must contain Spanish card');
assert.ok(langGrid.innerHTML.includes('영어'), 'Must contain English card');
assert.ok(langGrid.innerHTML.includes('일본어'), 'Must contain Japanese card');
assert.ok(langGrid.innerHTML.includes('프랑스어'), 'Must contain French card');
assert.ok(langGrid.innerHTML.includes('오픈 예정 🌸'), 'Must contain Japanese badge');
assert.ok(langGrid.innerHTML.includes('준비 중 🥐'), 'Must contain French badge');

// Left-aligned & Peek check on initial open
const esCardEl = renderedCards[0];
assert.ok(esCardEl.classList.contains('ring-emerald-500') || esCardEl.classList.contains('ring-[#22c55e]'), 'Active card must have emerald ring');
assert.ok(esCardEl.classList.contains('w-[120px]'), 'Card must have optimized width w-[120px]');
assert.ok(esCardEl.classList.contains('snap-start'), 'Card must have snap-start');

const unselectedCardEl = renderedCards[1];
assert.ok(unselectedCardEl.classList.contains('opacity-75'), 'Inactive card must have opacity-75');

// Check Spanish courses rendered in list
const courseList = mockDocElements['course-switcher-list'];
const spanishCourses = courseList.querySelectorAll('.course-switcher-card');
assert.strictEqual(spanishCourses.length, 2, 'Spanish has 2 courses (es_main, es_soccer)');
assert.ok(courseList.innerHTML.includes('스페인어 정규 코스'), 'Must render es_main title');
assert.ok(courseList.innerHTML.includes('스페인 축구 실전팩'), 'Must render es_soccer title');

console.log('✅ PASS: Modal opened and rendered 4 language cards & Spanish courses');

// 6. Click Japanese card (isReady: false) -> Toast notification
toastMsg = null;
const jaCard = renderedCards[2];
jaCard.click();
assert.ok(toastMsg && toastMsg.includes('곧 출시 예정입니다'), 'Clicking unready card shows coming soon toast');
// Spanish courses should remain
assert.ok(courseList.innerHTML.includes('스페인어 정규 코스'), 'Course list should remain Spanish');

console.log('✅ PASS: Unready language card triggers alert/toast and prevents selection');

// 7. Select Spanish Soccer Course (es_soccer) and Confirm
const soccerCourseBtn = spanishCourses[1];
assert.strictEqual(soccerCourseBtn.dataset.courseId, 'es_soccer');

// Simulate click on course button
mockDocument.dispatchEvent({
  type: 'click',
  target: soccerCourseBtn
});

let drawerRenderedCourse = null;
sandbox.renderCourseDrawer = (cid) => {
  drawerRenderedCourse = cid;
};

// Click Confirm button
mockDocElements['btn-confirm-language-course'].click();

assert.strictEqual(sandbox.currentLanguage, 'es', 'Language is es');
assert.strictEqual(sandbox.currentCourseId, 'es_soccer', 'currentCourseId is es_soccer');
assert.strictEqual(drawerRenderedCourse, 'es_soccer', 'courseDrawer re-rendered with es_soccer');
assert.strictEqual(sandbox.localStorage.getItem('vocadash_current_course'), 'es_soccer');

console.log('✅ PASS: Selecting Spanish Soccer Pack switches currentCourseId to es_soccer & syncs drawer');

// 8. Re-open modal, select English, confirm en_main
sandbox.openLanguageModal();
const enCard = mockDocElements['language-grid'].querySelectorAll('.course-card')[1];
enCard.click();

const enCourses = courseList.querySelectorAll('.course-switcher-card');
assert.strictEqual(enCourses.length, 1, 'English has 1 course');
assert.strictEqual(enCourses[0].dataset.courseId, 'en_main');
assert.ok(courseList.innerHTML.includes('영어 정규 코스'));

mockDocElements['btn-confirm-language-course'].click();

assert.strictEqual(sandbox.currentLanguage, 'en', 'Language updated to en');
assert.strictEqual(sandbox.currentCourseId, 'en_main', 'currentCourseId updated to en_main');
assert.strictEqual(drawerRenderedCourse, 'en_main', 'courseDrawer re-rendered with en_main');
assert.strictEqual(sandbox.localStorage.getItem('vocadash_current_course'), 'en_main');

console.log('✅ PASS: Selecting English course switches currentCourseId to en_main & syncs drawer');

console.log('🎉 ALL REGISTRY & DYNAMIC MODAL TESTS PASSED PERFECTLY! 🚀');
