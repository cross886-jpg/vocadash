/**
 * js/courseDrawer.js
 * 신규 듀오링고 스타일 비행 여정 탑승권(Boarding Pass) 바텀시트 모듈
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.courseDrawer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let currentActiveSectionId = null;

  const THEME_CONFIG = {
    primary: {
      activeBorder: 'border-emerald-600 ring-emerald-500/20',
      activeDuration: 'bg-emerald-100 text-emerald-800',
      activeIcon: 'text-emerald-600',
      activeRouteBg: 'bg-emerald-50/60',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    secondary: {
      activeBorder: 'border-sky-600 ring-sky-500/20',
      activeDuration: 'bg-sky-100 text-sky-800',
      activeIcon: 'text-sky-600',
      activeRouteBg: 'bg-sky-50/60',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    tertiary: {
      activeBorder: 'border-amber-600 ring-amber-500/20',
      activeDuration: 'bg-amber-100 text-amber-800',
      activeIcon: 'text-amber-600',
      activeRouteBg: 'bg-amber-50/60',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    indigo: {
      activeBorder: 'border-indigo-600 ring-indigo-500/20',
      activeDuration: 'bg-indigo-100 text-indigo-800',
      activeIcon: 'text-indigo-600',
      activeRouteBg: 'bg-indigo-50/60',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    rose: {
      activeBorder: 'border-rose-600 ring-rose-500/20',
      activeDuration: 'bg-rose-100 text-rose-800',
      activeIcon: 'text-rose-600',
      activeRouteBg: 'bg-rose-50/60',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    emerald: {
      activeBorder: 'border-emerald-600 ring-emerald-500/20',
      activeDuration: 'bg-emerald-100 text-emerald-800',
      activeIcon: 'text-emerald-600',
      activeRouteBg: 'bg-emerald-50/60',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  };

  function getActiveCourseKey(targetCourseId) {
    let cid = targetCourseId;
    if (!cid && typeof window !== 'undefined') {
      cid = window.currentCourseId || window.activeCourseId;
    }
    if (!cid) {
      try {
        if (typeof localStorage !== 'undefined') {
          cid = localStorage.getItem('vocadash_current_course') || localStorage.getItem('vocadash_active_course');
        }
      } catch (_) { }
    }

    const lang = (typeof window !== 'undefined' && (window.currentLanguage === 'en' || window.currentActiveCourse === 'en')) ? 'en' : 'es';

    if (!cid || cid === 'main' || cid === 'basic') {
      return (lang === 'en') ? 'en_main' : 'es_main';
    }
    if (cid === 'main_en' || cid === 'en') return 'en_main';
    if (cid === 'main_es' || cid === 'es') return 'es_main';
    if (cid === 'pack_football' || cid === 'es_soccer' || cid === 'es_football' || cid === 'soccer') {
      return 'es_soccer';
    }
    return cid;
  }

  function getLangFromCourseKey(courseKey) {
    if (courseKey && (courseKey === 'en' || courseKey === 'en-US' || String(courseKey).startsWith('en'))) {
      return 'en';
    }
    return 'es';
  }

  function getSectionsConfig(targetCourseKey) {
    const cKey = getActiveCourseKey(targetCourseKey);
    let allSections = null;
    if (typeof window !== 'undefined' && window.courseSections) {
      allSections = window.courseSections;
    } else {
      try {
        allSections = require('./data/courseSections.js');
      } catch (_) {
        allSections = null;
      }
    }
    if (!allSections) return null;

    // 1. Direct courseKey match (e.g. es_soccer, es_main, en_main)
    if (allSections[cKey] && Array.isArray(allSections[cKey].sections) && allSections[cKey].sections.length > 0) {
      return allSections[cKey];
    }
    // 2. Direct lookup for targetCourseKey
    if (targetCourseKey && allSections[targetCourseKey] && Array.isArray(allSections[targetCourseKey].sections) && allSections[targetCourseKey].sections.length > 0) {
      return allSections[targetCourseKey];
    }
    // 3. Fallback to es_main
    return allSections.es_main || allSections.es || null;
  }

  function getUnlockedLevel(lang, courseKey) {
    if (typeof window !== 'undefined' && typeof window.getUnlockedUnitLevel === 'function') {
      return window.getUnlockedUnitLevel(lang, courseKey);
    }
    try {
      const cKey = getActiveCourseKey(courseKey);
      const saved = localStorage.getItem('vocadash_unlocked_' + lang + '_' + cKey)
                 || localStorage.getItem('vocadash_unlocked_' + lang + '_' + (cKey === 'es_soccer' ? 'pack_football' : 'main'))
                 || localStorage.getItem('vocadash_unlocked_unit_' + lang + '_' + cKey)
                 || localStorage.getItem('vocadash_unlocked_unit_' + cKey)
                 || localStorage.getItem('vocadash_unlocked_unit_' + lang);
      if (saved) return parseInt(saved, 10) || 1;
    } catch (_) { }
    return 1;
  }

  /**
   * 활성 섹션 조회 SSOT (단일 진실 공급원)
   */
  function getActiveSection(courseKey, sectionId) {
    const cKey = getActiveCourseKey(courseKey);
    const config = getSectionsConfig(cKey);
    if (!config || !Array.isArray(config.sections) || config.sections.length === 0) return null;

    const lang = getLangFromCourseKey(cKey);
    const unlockedLevel = getUnlockedLevel(lang, cKey);

    let activeSection = null;
    if (sectionId) {
      activeSection = config.sections.find(s => s.id === sectionId);
    }
    if (!activeSection && typeof window !== 'undefined' && window.currentSectionId) {
      activeSection = config.sections.find(s => s.id === window.currentSectionId);
    }
    if (!activeSection) {
      let savedSecId = null;
      try {
        if (typeof localStorage !== 'undefined') {
          savedSecId = localStorage.getItem('vocadash_active_section_' + cKey);
        }
      } catch (_) { }
      if (savedSecId) {
        activeSection = config.sections.find(s => s.id === savedSecId);
      }
    }
    if (!activeSection) {
      activeSection = config.sections.find(s => unlockedLevel >= s.unitStart && unlockedLevel <= s.unitEnd);
    }
    if (!activeSection) {
      activeSection = config.sections[0];
    }
    return activeSection;
  }

  /**
   * 바텀시트 열기 (슬라이드 업)
   */
  function openCourseDrawer(targetSectionId) {
    const backdrop = document.getElementById('course-drawer-backdrop');
    const card = document.getElementById('course-drawer-card');
    if (!backdrop || !card) return;

    const courseKey = getActiveCourseKey();
    renderCourseDrawer(courseKey, targetSectionId);

    // Show backdrop
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');

    // Slide up card
    card.classList.remove('translate-y-full');
    card.classList.add('translate-y-0');
  }

  /**
   * 바텀시트 닫기 (슬라이드 다운)
   */
  function closeCourseDrawer() {
    const backdrop = document.getElementById('course-drawer-backdrop');
    const card = document.getElementById('course-drawer-card');
    if (!backdrop || !card) return;

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');

    card.classList.remove('translate-y-0');
    card.classList.add('translate-y-full');
  }

  /**
   * 하단 게이트 목록만 렌더링 (DOM 재생성 스코프 최소화)
   */
  function renderGateList(card, activeSection, courseKey) {
    const gatesContainer = card.querySelector('#course-gate-list');
    if (!gatesContainer) return;

    const cKey = getActiveCourseKey(courseKey);
    const lang = getLangFromCourseKey(cKey);
    const config = getSectionsConfig(cKey);
    const configUnits = config?.units || {};

    const unlockedLevel = getUnlockedLevel(lang, cKey);
    const courseData = (typeof window !== 'undefined' ? (window.getCurrentCourseData?.() || window.courseData) : null);
    const presetUnits = (typeof window !== 'undefined' && window.UNIT_LIST_PRESETS ? window.UNIT_LIST_PRESETS[lang] : []);

    const gates = [];
    for (let uNum = activeSection.unitStart; uNum <= activeSection.unitEnd; uNum++) {
      const isPassed = (uNum < unlockedLevel);
      const isCurrent = (uNum === unlockedLevel);
      const status = isPassed ? 'passed' : (isCurrent ? 'active' : 'closed');
      const badgeText = isPassed ? 'PASSED' : (isCurrent ? '출발' : 'CLOSED');
      const badgeClass = isPassed
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : (isCurrent ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200');
      const cardBorderClass = isPassed
        ? 'border-emerald-500/70 bg-emerald-50/40 hover:bg-emerald-50'
        : (isCurrent ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20' : 'border-slate-200/80 bg-white/70 opacity-60');
      const gateIcon = isPassed ? 'check_circle' : (isCurrent ? 'flight_takeoff' : 'lock');

      const unitMeta = configUnits[uNum] || configUnits[String(uNum)];
      const cUnit = (courseData && courseData.units && courseData.units[uNum - 1]) || null;
      const pUnit = (presetUnits && presetUnits[uNum - 1]) || null;

      let rawTitle = unitMeta?.title || cUnit?.title || pUnit?.title || `Unit ${uNum} 코스 학습`;
      let rawDesc = unitMeta?.desc || cUnit?.desc || cUnit?.subtitle || pUnit?.desc || pUnit?.subtitle || `Gate ${uNum} 어휘 런 및 스테이지 도전`;

      gates.push(`
        <div class="course-gate-card p-3 rounded-2xl border-2 ${cardBorderClass} flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
             data-unit="${uNum}" data-status="${status}" data-title="${rawTitle}">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-xl ${isPassed || isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'} flex flex-col items-center justify-center font-black shadow-xs flex-shrink-0">
              <span class="text-[9px] uppercase leading-none opacity-80">GATE</span>
              <span class="text-sm font-black leading-tight">${uNum}</span>
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black ${isPassed || isCurrent ? 'text-slate-900' : 'text-slate-500'} leading-tight truncate">${rawTitle}</span>
                <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight leading-none border ${badgeClass}">${badgeText}</span>
              </div>
              <span class="text-[10px] font-semibold ${isPassed || isCurrent ? 'text-emerald-700' : 'text-slate-400'} mt-0.5 truncate">${rawDesc}</span>
            </div>
          </div>
          <div class="flex items-center text-emerald-700 font-extrabold flex-shrink-0 ml-2">
            <span class="material-symbols-outlined text-[20px] ${isPassed ? 'text-emerald-600' : (isCurrent ? 'text-emerald-700' : 'text-slate-400')} font-bold">${gateIcon}</span>
          </div>
        </div>
      `);
    }

    gatesContainer.innerHTML = gates.join('');
    gatesContainer.scrollTop = 0;

    // Gate 클릭 이벤트 바인딩
    const gateElements = gatesContainer.querySelectorAll('.course-gate-card');
    gateElements.forEach(gEl => {
      gEl.onclick = (e) => {
        e.stopPropagation();
        const uNum = parseInt(gEl.dataset.unit, 10);
        const status = gEl.dataset.status;

        if (status === 'passed' || status === 'active') {
          closeCourseDrawer();
          if (typeof window.switchToUnit === 'function') {
            window.switchToUnit(uNum);
          } else if (typeof window.loadRoadmapUnit === 'function') {
            window.loadRoadmapUnit(uNum);
          }
        } else if (status === 'closed') {
          const uTitle = gEl.dataset.title || `Unit ${uNum}`;
          if (typeof window.openUnitSkipModal === 'function') {
            openUnitSkipModal(uNum, uTitle);
          }
        }
      };
    });
  }

  /**
   * 상단 티켓 캐러셀의 active/inactive UI 상태 클래스 토글 (DOM 파괴 금지)
   */
  function updateTicketCardsUI(card, activeSectionId, config) {
    const ticketElements = card.querySelectorAll('.course-ticket-card');
    ticketElements.forEach(tEl => {
      const sId = tEl.dataset.sectionId;
      const sec = config.sections.find(s => s.id === sId);
      if (!sec) return;
      const isActive = (sId === activeSectionId);
      const theme = THEME_CONFIG[sec.themeColor] || THEME_CONFIG.primary;

      // 1. 컨테이너 클래스 갱신
      tEl.className = `course-ticket-card flex-shrink-0 w-[270px] snap-center rounded-2xl p-3.5 cursor-pointer transition-all ${
        isActive
          ? `bg-white border-2 ${theme.activeBorder} shadow-lg ring-2`
          : 'bg-white/80 border border-slate-200/90 hover:border-slate-300 opacity-75 hover:opacity-100'
      }`;

      // 2. 비행 시간 뱃지
      const durationBadge = tEl.querySelector('.ticket-duration-badge');
      if (durationBadge) {
        durationBadge.className = `ticket-duration-badge px-1.5 py-0.5 rounded text-[9px] font-black ${
          isActive ? theme.activeDuration : 'bg-slate-100 text-slate-500'
        }`;
      }

      // 3. 비행 루트 박스
      const routeBox = tEl.querySelector('.ticket-route-box');
      if (routeBox) {
        routeBox.className = `ticket-route-box flex items-center justify-between px-2 py-1 ${
          isActive ? theme.activeRouteBg : 'bg-slate-50'
        } rounded-xl mb-2 transition-colors`;
      }

      // 4. 비행기 아이콘
      const planeIcon = tEl.querySelector('.ticket-plane-icon');
      if (planeIcon) {
        planeIcon.className = `ticket-plane-icon text-xs ${isActive ? theme.activeIcon : 'text-slate-400'}`;
      }

      // 5. 타이틀
      const titleEl = tEl.querySelector('.ticket-title');
      if (titleEl) {
        titleEl.className = `ticket-title text-xs font-black ${isActive ? 'text-slate-900' : 'text-slate-700'} leading-snug`;
      }
    });
  }

  /**
   * 활성 섹션 전환 (Sub-view Swap 패턴: 캐러셀 스크롤 오프셋 100% 보존)
   */
  function switchSection(card, sectionId, courseKey, userInitiated = false) {
    const cKey = getActiveCourseKey(courseKey);
    const config = getSectionsConfig(cKey);
    if (!config || !Array.isArray(config.sections)) return;

    const section = config.sections.find(s => s.id === sectionId);
    if (!section) return;

    currentActiveSectionId = section.id;
    if (typeof window !== 'undefined') {
      window.currentSectionId = section.id;
    }
    try {
      localStorage.setItem('vocadash_active_section_' + cKey, section.id);
    } catch (_) { }

    updateTicketCardsUI(card, section.id, config);
    renderGateList(card, section, cKey);

    if (userInitiated) {
      const targetCard = card.querySelector(`.course-ticket-card[data-section-id="${section.id}"]`);
      if (targetCard && typeof targetCard.scrollIntoView === 'function') {
        targetCard.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
      }
      if (typeof window !== 'undefined') {
        window._currentVisibleUnitIndex = section.unitStart - 1;
        window.currentUnitNumber = section.unitStart;
      }
    }

    // [Karpathy Guidelines - Step 3] 로드맵을 해당 섹션 유닛 범위로 즉시 전환
    if (typeof window !== 'undefined' && typeof window.renderRoadmap === 'function') {
      window.renderRoadmap();
    }
  }

  /**
   * 바텀시트 내용 렌더링
   */
  function renderCourseDrawer(targetCourseOrLang, sectionId) {
    const card = document.getElementById('course-drawer-card');
    if (!card) return;

    const courseKey = getActiveCourseKey(targetCourseOrLang);
    const config = getSectionsConfig(courseKey);
    if (!config || !Array.isArray(config.sections) || config.sections.length === 0) return;

    const lang = getLangFromCourseKey(courseKey);
    const unlockedLevel = getUnlockedLevel(lang, courseKey);

    // Active Section 선정 로직 (SSOT)
    const activeSection = getActiveSection(courseKey, sectionId);
    if (!activeSection) return;

    // 동일 코스로 이미 렌더링되어 있으면 상단 캐러셀 DOM을 파괴하지 않고 섹션만 전환
    const existingCarousel = card.querySelector('#course-ticket-carousel');
    if (existingCarousel && card.dataset.renderedCourse === courseKey) {
      switchSection(card, activeSection.id, courseKey, false);
      return;
    }

    // 새 코스 전체 렌더링
    card.dataset.renderedCourse = courseKey;
    card.dataset.renderedLang = lang;
    currentActiveSectionId = activeSection.id;
    if (typeof window !== 'undefined') {
      window.currentSectionId = activeSection.id;
    }
    try {
      localStorage.setItem('vocadash_active_section_' + courseKey, activeSection.id);
    } catch (_) { }

    const isSoccer = courseKey.includes('soccer') || courseKey.includes('football');
    const headerIcon = isSoccer ? '⚽' : (courseKey.startsWith('en') ? '🗽' : '✈️');

    // 1. Header & Drag handle
    const headerHtml = `
      <div class="px-5 pt-3 pb-3 border-b border-slate-100 flex-shrink-0 bg-white">
        <div class="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-3 cursor-grab"></div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
              ${headerIcon}
            </div>
            <div>
              <h2 id="course-drawer-title" class="text-base font-black text-slate-900 leading-tight">
                ${config.bannerTitle}
              </h2>
              <p id="course-drawer-desc" class="text-[11px] font-bold text-slate-500 mt-0.5">
                ${config.bannerDesc}
              </p>
            </div>
          </div>
          <button id="close-course-drawer-btn" type="button" aria-label="닫기"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 flex items-center justify-center text-slate-500 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-[18px] font-bold">close</span>
          </button>
        </div>
      </div>
    `;

    // 2. Ticket Pass Carousel
    const ticketsHtml = `
      <div id="course-ticket-carousel" class="flex items-center gap-3 overflow-x-auto px-4 py-3 snap-x snap-mandatory no-scrollbar bg-slate-50/70 border-b border-slate-100 flex-shrink-0">
        ${config.sections.map(sec => {
          const isActive = (sec.id === activeSection.id);
          const theme = THEME_CONFIG[sec.themeColor] || THEME_CONFIG.primary;
          return `
            <div class="course-ticket-card flex-shrink-0 w-[270px] snap-center rounded-2xl p-3.5 cursor-pointer transition-all ${
              isActive
                ? `bg-white border-2 ${theme.activeBorder} shadow-lg ring-2`
                : 'bg-white/80 border border-slate-200/90 hover:border-slate-300 opacity-75 hover:opacity-100'
            }" data-section-id="${sec.id}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-black tracking-wider">${sec.ticketCode}</span>
                  <span class="text-[10px] font-black text-slate-600">${sec.tier}</span>
                </div>
                <span class="ticket-duration-badge px-1.5 py-0.5 rounded text-[9px] font-black ${isActive ? theme.activeDuration : 'bg-slate-100 text-slate-500'}">${sec.duration}</span>
              </div>
              <div class="ticket-route-box flex items-center justify-between px-2 py-1 ${isActive ? theme.activeRouteBg : 'bg-slate-50'} rounded-xl mb-2 transition-colors">
                <div class="text-left">
                  <div class="text-base font-black text-slate-900 leading-none">${sec.fromCode}</div>
                  <div class="text-[9px] font-bold text-slate-400 mt-0.5">${sec.fromName}</div>
                </div>
                <div class="flex flex-col items-center flex-1 px-2">
                  <span class="ticket-plane-icon text-xs ${isActive ? theme.activeIcon : 'text-slate-400'}">${isSoccer ? '⚽' : '✈️'}</span>
                  <div class="w-full border-t border-dashed border-slate-300 my-0.5"></div>
                  <span class="text-[8px] font-bold text-slate-400">${isSoccer ? 'MATCH' : 'FLIGHT'}</span>
                </div>
                <div class="text-right">
                  <div class="text-base font-black text-slate-900 leading-none">${sec.toCode}</div>
                  <div class="text-[9px] font-bold text-slate-400 mt-0.5">${sec.toName}</div>
                </div>
              </div>
              <div class="mt-1">
                <div class="ticket-title text-xs font-black ${isActive ? 'text-slate-900' : 'text-slate-700'} leading-snug">${sec.title}</div>
                <div class="text-[10px] font-semibold text-slate-500 truncate mt-0.5">${sec.desc}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // 3. Gate Cards List Container
    const gatesListContainerHtml = `
      <div id="course-gate-list" class="flex-grow overflow-y-auto p-4 space-y-2.5 max-h-[50vh] no-scrollbar"></div>
    `;

    // 4. Assemble card DOM
    card.innerHTML = headerHtml + ticketsHtml + gatesListContainerHtml;

    // 5. Bind close button
    const closeBtn = document.getElementById('close-course-drawer-btn');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeCourseDrawer();
      };
    }

    // 6. Bind ticket click events once (Sub-view Swap pattern)
    const ticketElements = card.querySelectorAll('.course-ticket-card');
    ticketElements.forEach(tEl => {
      tEl.onclick = (e) => {
        e.stopPropagation();
        const sId = tEl.dataset.sectionId;
        if (sId && sId !== currentActiveSectionId) {
          switchSection(card, sId, courseKey, true);
        }
      };
    });

    // 7. Initial Gate List Render
    renderGateList(card, activeSection, courseKey);

    // 8. Auto-scroll carousel to active ticket initially
    try {
      const activeTicketEl = card.querySelector(`.course-ticket-card[data-section-id="${activeSection.id}"]`);
      if (activeTicketEl && typeof activeTicketEl.scrollIntoView === 'function') {
        activeTicketEl.scrollIntoView({ inline: 'nearest', behavior: 'auto', block: 'nearest' });
      }
    } catch (_) { }
  }

  function initCourseDrawerEvents() {
    const backdrop = document.getElementById('course-drawer-backdrop');
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          closeCourseDrawer();
        }
      };
    }

    // Attach to banner and dropdown button if present
    const unitBanner = document.getElementById('unit-banner');
    if (unitBanner) {
      unitBanner.onclick = () => openCourseDrawer();
    }
    const unitDropdownBtn = document.getElementById('unit-dropdown-btn');
    if (unitDropdownBtn) {
      unitDropdownBtn.onclick = () => openCourseDrawer();
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCourseDrawerEvents);
    } else {
      initCourseDrawerEvents();
    }
  }

  const courseDrawerModule = {
    open: openCourseDrawer,
    close: closeCourseDrawer,
    render: renderCourseDrawer,
    initEvents: initCourseDrawerEvents,
    getActiveCourseKey,
    getSectionsConfig,
    getActiveSection,
    switchSection
  };

  if (typeof window !== 'undefined') {
    window.openCourseDrawer = openCourseDrawer;
    window.closeCourseDrawer = closeCourseDrawer;
    window.renderCourseDrawer = renderCourseDrawer;
    window.getActiveSection = getActiveSection;
    window.getActiveCourseKey = getActiveCourseKey;
    // Backward compatibility aliases
    window.openCourseMapModal = openCourseDrawer;
    window.closeCourseMapModal = closeCourseDrawer;
    window.courseMapModal = courseDrawerModule;
    window.courseDrawer = courseDrawerModule;
  }

  return courseDrawerModule;
}));
