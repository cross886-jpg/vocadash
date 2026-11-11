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

  function isCLevelSection(secOrId) {
    if (!secOrId) return false;
    if (typeof secOrId === 'object') {
      const id = String(secOrId.id || '').toUpperCase();
      const code = String(secOrId.ticketCode || '').toUpperCase();
      const tier = String(secOrId.tier || '').toUpperCase();
      return id === 'C1' || id === 'C2' || id === 'ES_SEC_5' || id === 'ES_SEC_6' || code.includes('C1') || code.includes('C2') || tier.includes('C1') || tier.includes('C2');
    }
    const str = String(secOrId).trim().toUpperCase();
    return str === 'C1' || str === 'C2' || str === 'ES_SEC_5' || str === 'ES_SEC_6' || str.includes('C1') || str.includes('C2');
  }

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

    const lang = (typeof window !== 'undefined' && ((window.currentLanguage || window.currentActiveCourse || 'en') === 'es')) ? 'es' : 'en';

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
    // 3. Fallback to active language main course
    const fallbackLang = (typeof window !== 'undefined' && ((window.currentLanguage || window.currentActiveCourse || 'en') === 'es')) ? 'es' : 'en';
    return (fallbackLang === 'en' ? allSections.en_main : allSections.es_main) || allSections.en_main || allSections.es_main || allSections.es || null;
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

    const visibleSections = config.sections.filter(s => !isCLevelSection(s));
    const pool = visibleSections.length > 0 ? visibleSections : config.sections;

    const lang = getLangFromCourseKey(cKey);
    const unlockedLevel = getUnlockedLevel(lang, cKey);

    let activeSection = null;
    if (sectionId) {
      activeSection = pool.find(s => s.id === sectionId);
    }
    if (!activeSection && typeof window !== 'undefined' && window.currentSectionId) {
      activeSection = pool.find(s => s.id === window.currentSectionId);
    }
    if (!activeSection) {
      let savedSecId = null;
      try {
        if (typeof localStorage !== 'undefined') {
          savedSecId = localStorage.getItem('vocadash_active_section_' + cKey);
        }
      } catch (_) { }
      if (savedSecId) {
        activeSection = pool.find(s => s.id === savedSecId);
      }
    }
    if (!activeSection) {
      activeSection = pool.find(s => unlockedLevel >= s.unitStart && unlockedLevel <= s.unitEnd);
    }
    if (!activeSection) {
      activeSection = pool[0];
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
   * 상단 티켓 카드의 active/inactive UI 상태 클래스 토글 (DOM 파괴 방지)
   */
  function updateTicketCardsUI(card, activeSectionId, config) {
    const ticketElements = card.querySelectorAll('.course-ticket-card');
    ticketElements.forEach(tEl => {
      const sId = tEl.dataset.sectionId;
      const sec = config.sections.find(s => s.id === sId);
      if (!sec) return;
      const isActive = (sId === activeSectionId);
      const isLockedLevel = isCLevelSection(sec);
      const theme = THEME_CONFIG[sec.themeColor] || THEME_CONFIG.primary;

      // 1. 컨테이너 클래스 갱신
      tEl.className = `course-ticket-card w-full rounded-2xl p-4 transition-all ${
        isLockedLevel
          ? 'opacity-60 cursor-not-allowed bg-slate-50 border-2 border-dashed border-slate-200'
          : (isActive
              ? `bg-white border-2 ${theme.activeBorder} shadow-md ring-2 cursor-pointer`
              : 'bg-white border-2 border-slate-200/90 hover:border-slate-300 hover:shadow-xs opacity-90 hover:opacity-100 cursor-pointer')
      }`;

      // 2. 비행 시간 / 상태 뱃지
      const durationBadge = tEl.querySelector('.ticket-duration-badge');
      if (durationBadge) {
        if (isLockedLevel) {
          durationBadge.className = 'ticket-duration-badge px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-300';
          durationBadge.textContent = '업데이트 예정';
        } else if (isActive) {
          durationBadge.className = `ticket-duration-badge px-2 py-0.5 rounded-md text-[10px] font-black ${theme.activeDuration} border border-emerald-300 flex items-center gap-1`;
          durationBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>현재 코스';
        } else {
          durationBadge.className = 'ticket-duration-badge px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500';
          durationBadge.textContent = sec.duration;
        }
      }

      // 3. 비행 루트 박스
      const routeBox = tEl.querySelector('.ticket-route-box');
      if (routeBox) {
        routeBox.className = `ticket-route-box flex items-center justify-between px-3.5 py-2 ${
          isActive && !isLockedLevel ? theme.activeRouteBg : 'bg-slate-50/80'
        } rounded-xl mb-2.5 transition-colors`;
      }

      // 4. 비행기 아이콘
      const planeIcon = tEl.querySelector('.ticket-plane-icon');
      if (planeIcon) {
        planeIcon.className = `ticket-plane-icon text-sm ${isActive && !isLockedLevel ? theme.activeIcon : 'text-slate-400'}`;
      }

      // 5. 타이틀
      const titleEl = tEl.querySelector('.ticket-title');
      if (titleEl) {
        titleEl.className = `ticket-title text-sm font-black ${isActive && !isLockedLevel ? 'text-slate-900' : 'text-slate-800'} leading-snug flex items-center justify-between`;
      }
    });
  }

  /**
   * 활성 섹션 전환
   */
  function switchSection(card, sectionId, courseKey, userInitiated = false) {
    if (isCLevelSection(sectionId)) {
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast('C1·C2 고급 코스는 단어 데이터 업데이트 준비 중입니다.');
      }
      return;
    }

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

    if (card) {
      updateTicketCardsUI(card, section.id, config);
    }

    if (userInitiated) {
      if (typeof window !== 'undefined') {
        window._currentVisibleUnitIndex = section.unitStart - 1;
        window.currentUnitNumber = section.unitStart;
      }
    }

    if (typeof window !== 'undefined' && typeof window.renderRoadmap === 'function') {
      window.renderRoadmap();
    }
  }

  /**
   * 바텀시트 내용 렌더링 (대분류 코스 선택 컴팩트 모달)
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

    // 동일 코스로 이미 렌더링되어 있으면 카드 UI 상태만 업데이트
    const existingList = card.querySelector('#course-ticket-list');
    if (existingList && card.dataset.renderedCourse === courseKey) {
      currentActiveSectionId = activeSection.id;
      if (typeof window !== 'undefined') {
        window.currentSectionId = activeSection.id;
      }
      updateTicketCardsUI(card, activeSection.id, config);
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
                이동할 코스(레벨)를 선택하세요
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

    // 2. Ticket Pass List (대분류 코스 카드 세로 목록 - A1~B2까지만 노출)
    const visibleSections = config.sections.filter(sec => !isCLevelSection(sec));
    const ticketsHtml = `
      <div id="course-ticket-list" class="flex flex-col gap-3 p-4 overflow-y-auto max-h-[72vh] no-scrollbar">
        ${visibleSections.map(sec => {
          const isActive = (sec.id === activeSection.id);
          const isLockedLevel = isCLevelSection(sec);
          const theme = THEME_CONFIG[sec.themeColor] || THEME_CONFIG.primary;
          return `
            <div class="course-ticket-card w-full rounded-2xl p-4 transition-all ${
              isLockedLevel
                ? 'opacity-60 cursor-not-allowed bg-slate-50 border-2 border-dashed border-slate-200'
                : (isActive
                    ? `bg-white border-2 ${theme.activeBorder} shadow-md ring-2 cursor-pointer`
                    : 'bg-white border-2 border-slate-200/90 hover:border-slate-300 hover:shadow-xs opacity-90 hover:opacity-100 cursor-pointer')
            }" data-section-id="${sec.id}">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg ${isLockedLevel ? 'bg-slate-300 text-slate-700' : (isActive ? 'bg-slate-900 text-white' : 'bg-slate-800 text-white')} font-mono text-[11px] font-black tracking-wider shadow-2xs">${sec.ticketCode}</span>
                  <span class="text-xs font-black ${isActive ? 'text-slate-900' : 'text-slate-600'}">${sec.tier}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  ${isLockedLevel
                    ? '<span class="ticket-duration-badge px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-300">업데이트 예정</span>'
                    : (isActive
                        ? `<span class="ticket-duration-badge px-2 py-0.5 rounded-md text-[10px] font-black ${theme.activeDuration} border border-emerald-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>현재 코스</span>`
                        : `<span class="ticket-duration-badge px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-500">${sec.duration}</span>`
                      )
                  }
                </div>
              </div>
              <div class="ticket-route-box flex items-center justify-between px-3.5 py-2 ${isActive && !isLockedLevel ? theme.activeRouteBg : 'bg-slate-50/80'} rounded-xl mb-2.5 transition-colors">
                <div class="text-left">
                  <div class="text-base font-black text-slate-900 leading-none">${sec.fromCode}</div>
                  <div class="text-[10px] font-bold text-slate-400 mt-1">${sec.fromName}</div>
                </div>
                <div class="flex flex-col items-center flex-1 px-3">
                  <span class="ticket-plane-icon text-sm ${isActive && !isLockedLevel ? theme.activeIcon : 'text-slate-400'}">${isLockedLevel ? '🔒' : (isSoccer ? '⚽' : '✈️')}</span>
                  <div class="w-full border-t border-dashed border-slate-300 my-1"></div>
                  <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">${isLockedLevel ? 'LOCKED' : (isSoccer ? 'MATCH' : 'FLIGHT')}</span>
                </div>
                <div class="text-right">
                  <div class="text-base font-black text-slate-900 leading-none">${sec.toCode}</div>
                  <div class="text-[10px] font-bold text-slate-400 mt-1">${sec.toName}</div>
                </div>
              </div>
              <div>
                <div class="ticket-title text-sm font-black ${isActive && !isLockedLevel ? 'text-slate-900' : 'text-slate-800'} leading-snug flex items-center justify-between">
                  <span>${sec.title}</span>
                  ${!isLockedLevel ? '<span class="material-symbols-outlined text-[16px] text-slate-400 font-bold">chevron_right</span>' : ''}
                </div>
                <div class="text-[11px] font-semibold text-slate-500 mt-0.5 leading-relaxed">${isLockedLevel ? 'C1·C2 고급 코스는 단어 데이터 업데이트 준비 중입니다.' : sec.desc}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // 3. Assemble card DOM (GATE 리스트 완전 제거)
    card.innerHTML = headerHtml + ticketsHtml;

    // 4. Bind close button
    const closeBtn = document.getElementById('close-course-drawer-btn');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeCourseDrawer();
      };
    }

    // 5. Bind ticket click events (클릭 시 해당 코스 로드맵으로 즉시 이동 후 모달 닫기)
    const ticketElements = card.querySelectorAll('.course-ticket-card');
    ticketElements.forEach(tEl => {
      tEl.onclick = (e) => {
        e.stopPropagation();
        const sId = tEl.dataset.sectionId;
        const sec = config.sections.find(s => s.id === sId);
        if (!sec) return;

        if (isCLevelSection(sec)) {
          if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
            window.showToast('C1·C2 고급 코스는 단어 데이터 업데이트 준비 중입니다.');
          }
          return;
        }

        // 모달 닫기
        closeCourseDrawer();

        // 섹션 상태 동기화
        currentActiveSectionId = sec.id;
        if (typeof window !== 'undefined') {
          window.currentSectionId = sec.id;
        }
        try {
          localStorage.setItem('vocadash_active_section_' + courseKey, sec.id);
        } catch (_) { }

        // 섹션 내 적절한 유닛 산출 (진도 내 위치 또는 섹션 시작 유닛)
        const targetUnit = (unlockedLevel >= sec.unitStart && unlockedLevel <= sec.unitEnd)
          ? unlockedLevel
          : sec.unitStart;

        // 메인 로드맵으로 전환 및 유닛 포커스
        if (typeof window !== 'undefined') {
          if (typeof window.switchMainTab === 'function') {
            window.switchMainTab('home', true);
          }
          if (typeof window.switchToUnit === 'function') {
            window.switchToUnit(targetUnit);
          } else {
            window._currentVisibleUnitIndex = targetUnit - 1;
            window.currentUnitNumber = targetUnit;
            if (typeof window.renderRoadmap === 'function') {
              window.renderRoadmap();
            }
          }
        }
      };
    });
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
