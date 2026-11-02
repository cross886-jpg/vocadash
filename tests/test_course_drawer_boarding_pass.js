// tests/test_course_drawer_boarding_pass.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 [Test] Starting test_course_drawer_boarding_pass.js...');

// 1. Verify index.html does not have legacy center modal or simple CEFR text tabs
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert.strictEqual(
  indexHtml.includes('id="unit-overview-modal-backdrop"'),
  false,
  'Legacy #unit-overview-modal-backdrop must be deleted from index.html'
);
assert.strictEqual(
  indexHtml.includes('id="unit-overview-modal-card"'),
  false,
  'Legacy #unit-overview-modal-card must be deleted from index.html'
);
assert.strictEqual(
  indexHtml.includes('id="unit-overview-cefr-tabs"'),
  false,
  'Legacy #unit-overview-cefr-tabs must be deleted from index.html'
);
assert.strictEqual(
  indexHtml.includes('id="course-drawer-backdrop"'),
  true,
  'New #course-drawer-backdrop must be present in index.html'
);
assert.strictEqual(
  indexHtml.includes('id="course-drawer-card"'),
  true,
  'New #course-drawer-card must be present in index.html'
);
assert.strictEqual(
  indexHtml.includes('js/data/courseSections.js'),
  true,
  'js/data/courseSections.js must be included in index.html'
);
assert.strictEqual(
  indexHtml.includes('js/courseDrawer.js'),
  true,
  'js/courseDrawer.js must be included in index.html'
);

console.log('✅ PASS: Step 1 clean-up verified in index.html');

// Mock DOM & Environment
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
    style: {},
    attributes: {},
    setAttribute: function (k, v) { this.attributes[k] = String(v); },
    getAttribute: function (k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    addEventListener: function (evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: function (evt, fn) {
      if (!listeners[evt]) return;
      listeners[evt] = listeners[evt].filter(f => f !== fn);
    },
    dispatchEvent: function (event) {
      const type = typeof event === 'string' ? event : event.type;
      const fns = listeners[type] || [];
      const ev = typeof event === 'object' ? event : { type, target: el };
      if (!ev.target) ev.target = el;
      fns.forEach(fn => fn.call(el, ev));
      if (typeof el['on' + type] === 'function') {
        el['on' + type].call(el, ev);
      }
    },
    click: function () {
      this.dispatchEvent({ type: 'click', target: this, stopPropagation: () => {} });
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

function parseHtmlToMockChildren(html, parent = null) {
  const root = { children: [], tag: 'root', el: null };
  const stack = [root];
  const tagRegex = /<(\/)?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const isClose = match[1] === '/';
    const tag = match[2];
    const attrsStr = match[3] || '';
    const text = match[4];

    if (text) continue;
    if (isClose) {
      if (stack.length > 1 && stack[stack.length - 1].tag.toLowerCase() === tag.toLowerCase()) {
        stack.pop();
      }
    } else {
      const isSelfClosing = attrsStr.trim().endsWith('/') || ['input', 'img', 'br', 'hr'].includes(tag.toLowerCase());
      const el = createMockElement('', tag);
      el.parentElement = stack[stack.length - 1].el || parent;

      const idMatch = attrsStr.match(/id="([^"]+)"/);
      if (idMatch) el.id = idMatch[1];

      const classMatch = attrsStr.match(/class="([^"]+)"/);
      if (classMatch) {
        classMatch[1].trim().split(/\s+/).forEach(c => el.classList.add(c));
      }

      const dataMatches = attrsStr.matchAll(/data-([a-z0-9-]+)="([^"]+)"/gi);
      for (const dm of dataMatches) {
        const camel = dm[1].replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        el.dataset[camel] = dm[2];
      }

      const node = { tag, el };
      if (!stack[stack.length - 1].el) {
        root.children.push(el);
      } else {
        stack[stack.length - 1].el.children.push(el);
      }

      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }
  return root.children;
}

// Sandbox context
const mockDocElements = {
  'course-drawer-backdrop': createMockElement('course-drawer-backdrop'),
  'course-drawer-card': createMockElement('course-drawer-card'),
  'unit-banner': createMockElement('unit-banner'),
  'unit-dropdown-btn': createMockElement('unit-dropdown-btn')
};

mockDocElements['course-drawer-backdrop'].classList.add('opacity-0', 'pointer-events-none');
mockDocElements['course-drawer-card'].classList.add('translate-y-full');

const mockDocument = {
  readyState: 'complete',
  getElementById: (id) => mockDocElements[id] || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return mockDocElements[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  UNIT_LIST_PRESETS: {
    es: [
      { unit: 1, title: 'Unit 1. 생존 첫걸음 & 일상 인사', subtitle: '매일 주고받는 첫인사, 감사, 사과' },
      { unit: 2, title: 'Unit 2. 카페, 식당 & 타파스 주문', subtitle: '커피, 물, 타파스 주문' }
    ],
    en: [
      { unit: 1, title: 'Unit 1. 필수 여행 영어', subtitle: '공항 및 호텔 체크인' }
    ]
  },
  currentLanguage: 'es',
  currentUnitNumber: 1,
  switchToUnit: null
};
sandbox.window = sandbox;

// Load courseSections.js
const courseSectionsCode = fs.readFileSync(path.join(__dirname, '../js/data/courseSections.js'), 'utf8');
vm.runInNewContext(courseSectionsCode, sandbox);

// Verify courseSections SSOT
assert.ok(sandbox.courseSections, 'window.courseSections should be defined');
assert.ok(sandbox.courseSections.es, 'courseSections.es must exist');
assert.strictEqual(sandbox.courseSections.es.sections.length, 6, 'ES should have 6 sections (A1 to C2)');

const esSecs = sandbox.courseSections.es.sections;
assert.strictEqual(esSecs[0].ticketCode, 'VD-A1');
assert.strictEqual(esSecs[0].fromCode, 'ICN');
assert.strictEqual(esSecs[0].toCode, 'BCN');
assert.strictEqual(esSecs[1].fromCode, 'BCN');
assert.strictEqual(esSecs[1].toCode, 'MAD');
assert.strictEqual(esSecs[2].ticketCode, 'VD-B1');
assert.strictEqual(esSecs[2].fromCode, 'MAD');
assert.strictEqual(esSecs[2].toCode, 'SVQ');
assert.strictEqual(esSecs[2].unitStart, 71);
assert.strictEqual(esSecs[2].unitEnd, 120);
assert.strictEqual(esSecs[3].ticketCode, 'VD-B2');
assert.strictEqual(esSecs[3].fromCode, 'SVQ');
assert.strictEqual(esSecs[3].toCode, 'VLC');
assert.strictEqual(esSecs[4].ticketCode, 'VD-C1');
assert.strictEqual(esSecs[4].fromCode, 'VLC');
assert.strictEqual(esSecs[4].toCode, 'AGP');
assert.strictEqual(esSecs[5].ticketCode, 'VD-C2');
assert.strictEqual(esSecs[5].fromCode, 'AGP');
assert.strictEqual(esSecs[5].toCode, 'BIO');
assert.strictEqual(esSecs[5].unitEnd, 216);

const totalGates = esSecs.reduce((sum, s) => sum + (s.unitEnd - s.unitStart + 1), 0);
assert.strictEqual(totalGates, 216, 'Total gates for A1~C2 should be 216');

const enSecs = sandbox.courseSections.en.sections;
assert.strictEqual(enSecs.length, 4, 'EN should have 4 sections');
assert.strictEqual(enSecs[0].ticketCode, 'VD-EN1');
assert.strictEqual(enSecs[0].fromCode, 'ICN');
assert.strictEqual(enSecs[0].toCode, 'SFO');
assert.strictEqual(enSecs[1].fromCode, 'SFO');
assert.strictEqual(enSecs[1].toCode, 'LAX');
assert.strictEqual(enSecs[2].fromCode, 'LAX');
assert.strictEqual(enSecs[2].toCode, 'ORD');
assert.strictEqual(enSecs[3].fromCode, 'ORD');
assert.strictEqual(enSecs[3].toCode, 'NYC');
assert.strictEqual(enSecs[3].unitEnd, 166);
const totalEnGates = enSecs.reduce((sum, s) => sum + (s.unitEnd - s.unitStart + 1), 0);
assert.strictEqual(totalEnGates, 166, 'Total gates for English A1~B2 should be 166');
console.log('✅ PASS: Step 2 courseSections.js ES (6 sections, 216 gates) & EN (4 sections, 166 gates) verified');

// Load courseDrawer.js
const courseDrawerCode = fs.readFileSync(path.join(__dirname, '../js/courseDrawer.js'), 'utf8');
vm.runInNewContext(courseDrawerCode, sandbox);

assert.strictEqual(typeof sandbox.openCourseDrawer, 'function', 'openCourseDrawer must be exported');
assert.strictEqual(typeof sandbox.closeCourseDrawer, 'function', 'closeCourseDrawer must be exported');
assert.strictEqual(typeof sandbox.renderCourseDrawer, 'function', 'renderCourseDrawer must be exported');
assert.strictEqual(typeof sandbox.openCourseMapModal, 'function', 'openCourseMapModal alias must be supported');
console.log('✅ PASS: Step 3 courseDrawer module exports verified');

// TEST 4: Open Drawer
sandbox.openCourseDrawer();
const backdrop = mockDocElements['course-drawer-backdrop'];
const card = mockDocElements['course-drawer-card'];

assert.strictEqual(backdrop.classList.contains('opacity-100'), true, 'Backdrop should have opacity-100');
assert.strictEqual(backdrop.classList.contains('pointer-events-none'), false, 'Backdrop pointer-events-none should be removed');
assert.strictEqual(card.classList.contains('translate-y-0'), true, 'Card should slide up to translate-y-0');
assert.strictEqual(card.classList.contains('translate-y-full'), false, 'Card translate-y-full should be removed');
console.log('✅ PASS: Drawer opens with bottom sheet slide-up animation');

// TEST 5: Tickets and Gates rendering
const ticketCards = card.querySelectorAll('.course-ticket-card');
assert.strictEqual(ticketCards.length, 6, 'ES should render all 6 ticket cards');
assert.ok(card.innerHTML.includes('VD-A1'), 'Card must contain ticket code VD-A1');
assert.ok(card.innerHTML.includes('VD-B1'), 'Card must contain ticket code VD-B1');
assert.ok(card.innerHTML.includes('VD-C2'), 'Card must contain ticket code VD-C2');
assert.ok(card.innerHTML.includes('ICN'), 'Card must contain fromCode ICN');
assert.ok(card.innerHTML.includes('BCN'), 'Card must contain toCode BCN');

const gateCards = card.querySelectorAll('.course-gate-card');
assert.strictEqual(gateCards.length, 30, 'Section 1 (unitStart: 1, unitEnd: 30) should render 30 gates');

// Check Gate 1 is active (current)
const gate1 = gateCards[0];
assert.strictEqual(gate1.dataset.unit, '1', 'First gate is unit 1');
assert.strictEqual(gate1.dataset.status, 'active', 'Unit 1 should be active (출발)');
const gatesContainer = card.querySelector('#course-gate-list');
assert.ok(gatesContainer.innerHTML.includes('출발'), 'Gate list should contain [출발] badge');

// Check Gate 2 is closed
const gate2 = gateCards[1];
assert.strictEqual(gate2.dataset.unit, '2', 'Second gate is unit 2');
assert.strictEqual(gate2.dataset.status, 'closed', 'Unit 2 should be closed when unlocked level is 1');
assert.ok(gatesContainer.innerHTML.includes('CLOSED'), 'Gate list should contain [CLOSED] badge');
console.log('✅ PASS: Ticket carousel and gate cards rendered with correct badges');

// TEST 6: Sub-view Swap & Carousel Preservation Verification
const carouselBefore = card.querySelector('#course-ticket-carousel');
carouselBefore.scrollLeft = 120; // simulate user scroll offset

// Clicking Ticket 3 (B1 세비야 SVQ) switches section to Gates 71~120
const ticket3 = ticketCards[2];
ticket3.click();

const carouselAfter = card.querySelector('#course-ticket-carousel');
assert.strictEqual(carouselBefore, carouselAfter, 'CRITICAL: Carousel DOM must NOT be destroyed or recreated on ticket click');
assert.strictEqual(carouselAfter.scrollLeft, 120, 'CRITICAL: scrollLeft must be preserved and not reset to 0');

const b1GateCards = card.querySelectorAll('.course-gate-card');
assert.strictEqual(b1GateCards.length, 50, 'Section 3 (B1) should have 50 gates (71 to 120)');
assert.strictEqual(b1GateCards[0].dataset.unit, '71', 'First gate in section 3 is unit 71');
assert.strictEqual(b1GateCards[49].dataset.unit, '120', 'Last gate in section 3 is unit 120');
assert.ok(card.innerHTML.includes('SVQ'), 'Active section should show SVQ');
assert.strictEqual(sandbox.currentSectionId, 'es_sec_3', 'SSOT window.currentSectionId should be es_sec_3');
console.log('✅ PASS: B1 ticket switching preserves carousel DOM and updates gate list dynamically (Gate 71~120)');

// TEST 6-B: Clicking Ticket 6 (C2 빌바오 BIO) switches section to Gates 197~216
const ticket6 = card.querySelectorAll('.course-ticket-card')[5];
ticket6.click();
assert.strictEqual(card.querySelector('#course-ticket-carousel'), carouselBefore, 'Carousel DOM still preserved on C2 click');
const c2GateCards = card.querySelectorAll('.course-gate-card');
assert.strictEqual(c2GateCards.length, 20, 'Section 6 (C2) should have 20 gates (197 to 216)');
assert.strictEqual(c2GateCards[0].dataset.unit, '197', 'First gate in section 6 is unit 197');
assert.strictEqual(c2GateCards[19].dataset.unit, '216', 'Last gate in section 6 is unit 216');
assert.ok(card.innerHTML.includes('BIO'), 'Active section should show BIO');
assert.strictEqual(sandbox.currentSectionId, 'es_sec_6', 'SSOT window.currentSectionId should be es_sec_6');
console.log('✅ PASS: C2 ticket switching updates gate list dynamically to Gate 197~216');

// TEST 7: Gate click navigation
let switchedUnitNum = null;
sandbox.switchToUnit = (u) => {
  switchedUnitNum = u;
};

// Switch back to section 1
const updatedTicketCards = card.querySelectorAll('.course-ticket-card');
updatedTicketCards[0].click();

const s1Gate1 = card.querySelectorAll('.course-gate-card')[0];
s1Gate1.click();

assert.strictEqual(switchedUnitNum, 1, 'Clicking unlocked Gate 1 should call switchToUnit(1)');
assert.strictEqual(backdrop.classList.contains('pointer-events-none'), true, 'Clicking gate should close drawer');
assert.strictEqual(card.classList.contains('translate-y-full'), true, 'Card should slide down when closed');
console.log('✅ PASS: Unlocked gate click triggers navigation and closes drawer');

// TEST 8: Language synchronization (English 4 Sections / 166 Gates)
sandbox.currentLanguage = 'en';
sandbox.openCourseDrawer();

const enCard = mockDocElements['course-drawer-card'];
assert.ok(enCard.innerHTML.includes('미국행 어드벤처 탑승권'), 'Header title must show American Adventure banner');

const enTickets = enCard.querySelectorAll('.course-ticket-card');
assert.strictEqual(enTickets.length, 4, 'EN course must have 4 sections (A1 to B2)');
assert.ok(enCard.innerHTML.includes('VD-EN1'), 'EN card must contain ticket VD-EN1');
assert.ok(enCard.innerHTML.includes('VD-EN2'), 'EN card must contain ticket VD-EN2');
assert.ok(enCard.innerHTML.includes('VD-EN3'), 'EN card must contain ticket VD-EN3');
assert.ok(enCard.innerHTML.includes('VD-EN4'), 'EN card must contain ticket VD-EN4');
assert.ok(enCard.innerHTML.includes('ICN'), 'EN card must contain fromCode ICN');
assert.ok(enCard.innerHTML.includes('SFO'), 'EN card must contain SFO');
assert.ok(enCard.innerHTML.includes('LAX'), 'EN card must contain LAX');
assert.ok(enCard.innerHTML.includes('ORD'), 'EN card must contain ORD');
assert.ok(enCard.innerHTML.includes('NYC'), 'EN card must contain NYC');

// Verify initial Gate count for en_sec_1 (1 to 27 = 27 gates)
const enGates = enCard.querySelectorAll('.course-gate-card');
assert.strictEqual(enGates.length, 27, 'EN Section 1 (en_sec_1) must render 27 gates');
assert.strictEqual(enGates[0].dataset.unit, '1', 'First gate is 1');
assert.strictEqual(enGates[26].dataset.unit, '27', 'Last gate is 27');

// Click EN Ticket 4 (en_sec_4: ORD -> NYC, gates 118 to 166 = 49 gates)
enTickets[3].click();
const enSec4Gates = enCard.querySelectorAll('.course-gate-card');
assert.strictEqual(enSec4Gates.length, 49, 'EN Section 4 (en_sec_4) must render 49 gates (118 to 166)');
assert.strictEqual(enSec4Gates[0].dataset.unit, '118', 'First gate is 118');
assert.strictEqual(enSec4Gates[48].dataset.unit, '166', 'Last gate is 166');
assert.strictEqual(sandbox.currentSectionId, 'en_sec_4', 'SSOT currentSectionId should be en_sec_4');
console.log('✅ PASS: English 4 sections (166 gates) verified with ICN -> SFO -> LAX -> ORD -> NYC');

// TEST 9: Switch back to Spanish (es)
sandbox.currentLanguage = 'es';
sandbox.openCourseDrawer();
const esCard = mockDocElements['course-drawer-card'];
assert.ok(esCard.innerHTML.includes('스페인행 모험 탑승권'), 'Header title must switch back to Spain Adventure banner');
const esTicketsAgain = esCard.querySelectorAll('.course-ticket-card');
assert.strictEqual(esTicketsAgain.length, 6, 'ES course must restore 6 sections');
assert.ok(esCard.innerHTML.includes('VD-A1'), 'ES card must contain VD-A1');
console.log('✅ PASS: Language switch back to Spanish restores 6 sections immediately');

// TEST 10: Course switcher to Football Expansion Pack (pack_football / es_soccer)
sandbox.currentLanguage = 'es';
sandbox.activeCourseId = 'pack_football';
sandbox.openCourseDrawer();

const soccerCard = mockDocElements['course-drawer-card'];
assert.ok(soccerCard.innerHTML.includes('라리가 피치 실전 마스터 패스'), 'Header title must show Soccer Pass title');
assert.ok(soccerCard.innerHTML.includes('피치 위 1초 외침과 실전 축구 스페인어를 마스터하세요'), 'Header desc must match soccer desc');

const soccerTickets = soccerCard.querySelectorAll('.course-ticket-card');
assert.strictEqual(soccerTickets.length, 2, 'Soccer DLC course must have 2 match sections');
assert.ok(soccerCard.innerHTML.includes('MATCH-01'), 'Soccer card must contain MATCH-01 code');
assert.ok(soccerCard.innerHTML.includes('MATCH-02'), 'Soccer card must contain MATCH-02 code');
assert.ok(soccerCard.innerHTML.includes('LOCKER'), 'Soccer card must contain LOCKER fromCode');
assert.ok(soccerCard.innerHTML.includes('PITCH'), 'Soccer card must contain PITCH toCode');

const soccerGates = soccerCard.querySelectorAll('.course-gate-card');
assert.strictEqual(soccerGates.length, 4, 'Soccer Section 1 must render 4 gates (1 to 4)');
assert.strictEqual(soccerGates[0].dataset.unit, '1', 'First gate is 1');
const soccerGl1 = soccerCard.querySelector('#course-gate-list');
assert.ok(soccerGl1.innerHTML.includes('포지션, 피치 & 장비'), 'Soccer Unit 1 title must be rendered');

// Switch to Match 2
soccerTickets[1].click();
const soccerSec2Gates = soccerCard.querySelectorAll('.course-gate-card');
assert.strictEqual(soccerSec2Gates.length, 4, 'Soccer Section 2 must render 4 gates (5 to 8)');
assert.strictEqual(soccerSec2Gates[0].dataset.unit, '5', 'First gate is 5');
const gl2 = soccerCard.querySelector('#course-gate-list');
assert.ok(gl2.innerHTML.includes('부상, 피지컬 & 컨디션'), 'Soccer Unit 5 title must be rendered');
console.log('✅ PASS: Soccer expansion pack (pack_football) dynamically rendered with match tickets & pitch gates');

// TEST 11: Switch back to Spanish Main course (es_main / main)
sandbox.activeCourseId = 'main';
sandbox.openCourseDrawer();
const esMainCard = mockDocElements['course-drawer-card'];
assert.ok(esMainCard.innerHTML.includes('스페인행 모험 탑승권'), 'Restoring to main course shows Spain Adventure banner');
assert.strictEqual(esMainCard.querySelectorAll('.course-ticket-card').length, 6, 'Main course restores 6 flight tickets');
console.log('✅ PASS: Switching back to main restores flight pass and 6 sections seamlessly');

console.log('🎉 ALL 11 TESTS PASSED PERFECTLY! 🚀');
