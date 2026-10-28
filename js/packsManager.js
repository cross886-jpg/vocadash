// ==============================================================================
// VocaDash Packs & Course Library Manager (js/packsManager.js)
// 단어팩(DLC/확장팩) 카탈로그 렌더링, 코스 전환 및 스위처 UI 상태 동기화 전담 모듈
// ==============================================================================

(function () {
  'use strict';

  function safeEscapeHTML(str) {
    if (typeof window.escapeHTML === 'function') return window.escapeHTML(str);
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 단어팩/코스 카드 동적 템플릿 생성 헬퍼
  function renderPackCardHtml(pack, isEquipped) {
    const isComingSoon = !!pack.isComingSoon;
    if (isComingSoon) {
      return `
        <article class="pack-card relative bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-300 flex flex-col gap-3 opacity-80" data-pack-id="${pack.id}" data-pack-lang="${pack.lang}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-slate-200 text-2xl flex items-center justify-center flex-shrink-0">
                ${pack.icon}
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h3 class="text-sm font-extrabold text-slate-700 tracking-tight">${safeEscapeHTML(pack.title)}</h3>
                  <span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black">${safeEscapeHTML(pack.badge || '출시 예정')}</span>
                </div>
                <p class="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">${safeEscapeHTML(pack.desc)}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-400">
            <span class="font-medium">${pack.unitsCount ? `Unit 1~${pack.unitsCount} 제작 중` : '오픈 준비 중'}</span>
            <span class="px-3 py-1 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center gap-1 cursor-not-allowed">
              <span class="material-symbols-outlined text-[14px]">lock</span> 준비 중
            </span>
          </div>
        </article>
      `;
    }

    const borderClass = isEquipped
      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
      : 'border-slate-200/90 hover:shadow-md';

    const btnClass = isEquipped
      ? 'btn-pack-equip px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 bg-emerald-500 text-white shadow-xs cursor-default pointer-events-none'
      : 'btn-pack-equip px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 bg-slate-900 hover:bg-emerald-600 text-white shadow-xs';

    const btnContent = isEquipped
      ? '<span class="material-symbols-outlined text-[16px]">check_circle</span> 장착 중'
      : '<span class="material-symbols-outlined text-[16px]">bolt</span> 장착하기';

    const badgeClass = isEquipped ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800';

    return `
      <article class="pack-card relative bg-white rounded-2xl p-4 shadow-sm border ${borderClass} flex flex-col gap-3 transition-all" data-pack-id="${pack.id}" data-pack-lang="${pack.lang}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-2xl flex items-center justify-center border border-emerald-100 flex-shrink-0 shadow-2xs">
              ${pack.icon}
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h3 class="text-sm font-extrabold text-slate-900 tracking-tight">${safeEscapeHTML(pack.title)}</h3>
                ${pack.badge ? `<span class="px-2 py-0.5 rounded-full ${badgeClass} text-[10px] font-black">${safeEscapeHTML(pack.badge)}</span>` : ''}
              </div>
              <p class="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">${safeEscapeHTML(pack.desc)}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1 font-semibold text-slate-600">
              <span class="material-symbols-outlined text-[15px] text-slate-400">layers</span>
              총 ${pack.wordsCount}단어 (${pack.unitsCount} Units)
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" class="${btnClass}" data-pack-id="${pack.id}" ${isEquipped ? 'disabled' : ''}>
              ${btnContent}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // 단어팩/코스 보관함 화면 UI 렌더링 함수
  function renderPacksScreenUI(lang) {
    if (typeof document === 'undefined') return;
    const packsScreen = document.getElementById('packs-screen');
    if (!packsScreen) return;

    // 언어 탭 상태 결정: 파라미터 -> window.currentPacksLang -> window.currentLanguage -> 'es'
    const currentLang = lang || window.currentPacksLang || (window.currentLanguage === 'en' ? 'en' : 'es');
    window.currentPacksLang = currentLang;

    const supportedLangs = window.SUPPORTED_LANGUAGES || [
      { code: 'es', label: '스페인어', flag: '🇪🇸' },
      { code: 'en', label: '영어', flag: '🇺🇸' }
    ];

    // 0) 언어 세그먼트 탭 동적 렌더링
    const langTabsContainer = document.getElementById('packs-lang-tabs');
    if (langTabsContainer) {
      langTabsContainer.innerHTML = supportedLangs.map(item => {
        const isSelected = item.code === currentLang;
        const activeClass = isSelected
          ? (item.code === 'en' ? 'bg-white text-blue-800 shadow-xs font-black' : 'bg-white text-emerald-800 shadow-xs font-black')
          : 'text-slate-600 hover:text-slate-900 font-bold';
        return `
          <button id="packs-tab-${item.code}" type="button"
            class="packs-lang-tab flex-1 py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${activeClass} shrink-0 whitespace-nowrap"
            data-pack-lang="${item.code}">
            ${item.flag} ${item.label}
          </button>
        `;
      }).join('');
    } else {
      const tabEs = document.getElementById('packs-tab-es');
      const tabEn = document.getElementById('packs-tab-en');
      if (tabEs && tabEn) {
        if (currentLang === 'es') {
          tabEs.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer bg-white text-emerald-800 shadow-xs font-black shrink-0';
          tabEn.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer text-slate-600 hover:text-slate-900 font-bold shrink-0';
        } else {
          tabEn.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer bg-white text-blue-800 shadow-xs font-black shrink-0';
          tabEs.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer text-slate-600 hover:text-slate-900 font-bold shrink-0';
        }
      }
    }

    const activeId = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || 'main';

    // 1) Active Hero Banner
    const heroTitle = document.getElementById('packs-hero-title');
    const heroDesc = document.getElementById('packs-hero-desc');
    const heroIcon = document.getElementById('packs-hero-icon');

    if (activeId === 'pack_football') {
      if (heroTitle) heroTitle.textContent = '스페인 축구 실전 (Official DLC)';
      if (heroDesc) heroDesc.textContent = '스페인 현지 경기장 & 피치 콜 필수 어휘 60개';
      if (heroIcon) heroIcon.textContent = '⚽';
    } else if ((window.currentLanguage || 'es') === 'en') {
      if (heroTitle) heroTitle.textContent = '영어 정규 코스 (기본 코스)';
      if (heroDesc) heroDesc.textContent = '일상 회화 & 실전 기초 어휘 마스터 40개';
      if (heroIcon) heroIcon.textContent = '🇺🇸';
    } else {
      if (heroTitle) heroTitle.textContent = '스페인어 정규 코스 (기본 코스)';
      if (heroDesc) heroDesc.textContent = '일상 회화 & 실전 기초 어휘 마스터 40개';
      if (heroIcon) heroIcon.textContent = '🇪🇸';
    }

    // 2) 동적 코스/테마 팩 카드 렌더링
    const packCardsContainer = document.getElementById('packs-card-list');
    const packCatalog = window.PACK_CATALOG || {};
    const catalog = packCatalog[currentLang] || [];
    let visibleCount = 0;

    if (packCardsContainer) {
      packCardsContainer.innerHTML = catalog.map(pack => {
        const isEquipped = !pack.isComingSoon && (
          (pack.id === activeId) ||
          (pack.id === 'main_en' && activeId === 'main' && (window.currentLanguage || 'es') === 'en') ||
          (pack.id === 'main' && activeId === 'main' && (window.currentLanguage || 'es') === 'es')
        );
        visibleCount++;
        return renderPackCardHtml(pack, isEquipped);
      }).join('');
    } else {
      const packCards = packsScreen.querySelectorAll('.pack-card[data-pack-id]');
      packCards.forEach(card => {
        const cardLang = card.dataset.packLang || 'es';
        if (cardLang === currentLang) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }

        const pid = card.dataset.packId;
        const isEquipped = (pid === activeId) || (pid === 'main_en' && activeId === 'main' && (window.currentLanguage || 'es') === 'en') || (pid === 'main' && activeId === 'main' && (window.currentLanguage || 'es') === 'es');
        const equipBtn = card.querySelector('.btn-pack-equip');

        if (isEquipped) {
          card.classList.remove('border-slate-200/90', 'border-slate-200');
          card.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500/20', 'bg-emerald-50/20');
          if (equipBtn) {
            equipBtn.className = 'btn-pack-equip px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 bg-emerald-500 text-white shadow-xs cursor-default pointer-events-none';
            equipBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check_circle</span> 장착 중';
            equipBtn.disabled = true;
          }
        } else {
          card.classList.remove('border-emerald-500', 'ring-2', 'ring-emerald-500/20', 'bg-emerald-50/20');
          card.classList.add('border-slate-200/90');
          if (equipBtn) {
            equipBtn.className = 'btn-pack-equip px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 bg-slate-900 hover:bg-emerald-600 text-white shadow-xs';
            equipBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">bolt</span> 장착하기';
            equipBtn.disabled = false;
          }
        }
      });
    }

    const countLabel = document.getElementById('packs-count-label');
    if (countLabel) {
      countLabel.textContent = `${visibleCount}개 사용 가능`;
    }

    initPacksScreenEvents();
  }

  function initPacksScreenEvents() {
    if (typeof document === 'undefined') return;
    const packsScreen = document.getElementById('packs-screen');
    if (!packsScreen || packsScreen.dataset.eventsBound === 'true') return;
    packsScreen.dataset.eventsBound = 'true';

    // 이벤트 위임(Event Delegation)으로 동적 언어 탭 및 장착 버튼 모두 안전 바인딩
    packsScreen.addEventListener('click', (e) => {
      // 1) 언어 탭 클릭
      const langTab = e.target.closest('.packs-lang-tab');
      if (langTab) {
        const targetLang = langTab.dataset.packLang;
        if (targetLang) {
          renderPacksScreenUI(targetLang);
          if (typeof window.triggerHaptic === 'function') window.triggerHaptic(15);
        }
        return;
      }

      // 2) 코스/팩 장착 버튼 클릭
      const btn = e.target.closest('.btn-pack-equip');
      if (!btn || btn.disabled) return;
      const packId = btn.dataset.packId;
      if (!packId || packId === window.activeCourseId) return;

      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic(25);
      }
      if (typeof window.playGameSFX === 'function') {
        window.playGameSFX('powerup');
      }

      if (typeof window.switchCourse === 'function') {
        window.switchCourse(packId);
      } else {
        window.activeCourseId = packId;
        window.currentBookCourseId = packId;
        try {
          localStorage.setItem('vocadash_active_course', packId);
        } catch (_) { }
      }
      renderPacksScreenUI();
    });
  }

  // 단어팩(DLC/확장팩) 및 메인 코스 전환 함수
  function switchCourse(courseId) {
    let targetId = courseId || 'main';
    if (targetId === 'main_en') {
      targetId = 'main';
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('en');
      } else {
        window.currentLanguage = 'en';
        window.currentActiveCourse = 'en';
      }
    } else if (targetId === 'pack_football') {
      if ((window.currentLanguage || 'es') !== 'es' && typeof window.setLanguage === 'function') {
        window.setLanguage('es');
      }
    }

    const activeLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    targetId = (targetId === 'pack_football') ? 'pack_football' : 'main';

    window.activeCourseId = targetId;
    window.currentCourseId = targetId;
    window.currentBookCourseId = targetId;
    try {
      localStorage.setItem(`vocadash_active_course_${activeLang}`, targetId);
      localStorage.setItem('vocadash_active_course', targetId);
      localStorage.setItem('vocadash_current_course', targetId);
    } catch (_) { }

    // 진행도 상태를 해당 activeLang과 targetId 기준으로 새로고침
    if (typeof window.loadNodeProgress === 'function') {
      window.nodeProgressMap = window.loadNodeProgress(activeLang, targetId);
    }

    // 새 코스의 로드맵 화면 리렌더링
    const curUnlocked = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(activeLang, targetId) : 1;
    window._currentVisibleUnitIndex = curUnlocked - 1;
    if (typeof window.updateRoadmapNodesUI === 'function') {
      window.updateRoadmapNodesUI();
    }
    if (typeof window.renderRoadmap === 'function') {
      window.renderRoadmap();
    }

    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    if (typeof window.renderUnitOverviewList === 'function') {
      window.renderUnitOverviewList(lang, targetId);
    }
    if (typeof window.renderBookWords === 'function') {
      window.renderBookWords(lang, targetId);
    }
    if (typeof window.renderBookCourseDropdown === 'function') {
      window.renderBookCourseDropdown(lang, targetId);
    }
    updateCourseSwitcherUI(targetId);

    const title = targetId === 'pack_football' ? (lang === 'en' ? '축구 실전팩 (DLC)' : '스페인 축구 실전팩') : (targetId === 'main_en' || lang === 'en' ? '영어 정규 코스' : '스페인어 정규 코스');
    const icon = targetId === 'pack_football' ? '⚽' : (targetId === 'main_en' || lang === 'en' ? '🇺🇸' : '🇪🇸');
    if (typeof window.showToast === 'function') {
      window.showToast(`${icon} '${title}' 코스로 전환되었습니다!`, '🚀');
    }
  }

  // 코스 스위처 선택 상태 동기화 (모달 & 단어장 드롭다운)
  function updateCourseSwitcherUI(selectedCourseId) {
    if (typeof document === 'undefined') return;
    const activeId = selectedCourseId || window.activeCourseId || 'main';

    const cards = document.querySelectorAll('.course-switcher-card');
    cards.forEach(card => {
      const cid = card.dataset.courseId;
      const isSelected = (cid === activeId);
      const check = card.querySelector('.course-switcher-check');
      if (isSelected) {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.remove('hidden');
      } else {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.add('hidden');
      }
    });

    const bookItems = document.querySelectorAll('.book-course-item');
    bookItems.forEach(item => {
      const cid = item.dataset.courseId;
      const isSelected = (cid === activeId);
      const check = item.querySelector('.book-course-check');
      if (isSelected) {
        item.className = 'book-course-item flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold cursor-pointer transition-all hover:bg-emerald-100/80';
        if (check) check.classList.remove('hidden');
      } else {
        item.className = 'book-course-item flex items-center justify-between p-2.5 rounded-xl border border-transparent text-slate-700 text-xs font-medium cursor-pointer transition-all hover:bg-slate-100';
        if (check) check.classList.add('hidden');
      }
    });
    if (typeof window.updateBookCourseBadge === 'function') {
      window.updateBookCourseBadge(window.currentLanguage || 'es', activeId);
    }
    if (typeof window.updateBookProgressHero === 'function') {
      window.updateBookProgressHero();
    }
    if (typeof renderPacksScreenUI === 'function') {
      renderPacksScreenUI();
    }
  }

  // 전역 노출
  window.renderPackCardHtml = renderPackCardHtml;
  window.renderPacksScreenUI = renderPacksScreenUI;
  window.initPacksScreenEvents = initPacksScreenEvents;
  window.switchCourse = switchCourse;
  window.updateCourseSwitcherUI = updateCourseSwitcherUI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      renderPackCardHtml,
      renderPacksScreenUI,
      initPacksScreenEvents,
      switchCourse,
      updateCourseSwitcherUI
    };
  }
})();
