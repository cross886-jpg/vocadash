// ==============================================================================
// VocaDash Language & Course Switcher Modal Module (js/languageModal.js)
// 언어(스페인어/영어) 및 코스(메인/축구팩) 선택 모달 전담, 로컬스토리지 동기화 및 전역 상태 갱신
// ==============================================================================

(function (global) {
  'use strict';
  const target = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));

  let modalPendingLanguage = 'es';
  let modalPendingCourseId = 'main';

  function el(id) {
    return document.getElementById(id);
  }

  function getModalCourses() {
    return target.MODAL_COURSES || window.MODAL_COURSES || {
      es: [
        { id: 'main', icon: '🇪🇸', title: '일상 실전 패턴', desc: 'Duolingo 스타일 필수 실전 패턴 120개', badge: '기본' },
        { id: 'pack_football', icon: '⚽', title: '스페인 축구 실전팩', desc: '라리가 직관, 포지션, 전술, 라커룸 필수 회화', badge: '인기' }
      ],
      en: [
        { id: 'main', icon: '🇺🇸', title: '필수 회화 & 어휘', desc: '일상 필수 표현 및 영단어 120개', badge: '기본' }
      ]
    };
  }

  function renderModalCourseList(targetLang, selectedCourseId) {
    const list = document.getElementById('course-switcher-list');
    if (!list) return;

    const lang = (targetLang === 'en') ? 'en' : 'es';
    const modalCourses = getModalCourses();
    const courses = modalCourses[lang] || modalCourses.es;

    let activeId = selectedCourseId;
    if (!courses.some(c => c.id === activeId)) {
      activeId = 'main';
    }
    modalPendingCourseId = activeId;

    list.innerHTML = courses.map(course => {
      const isSelected = (course.id === activeId);
      const borderClass = isSelected
        ? 'border-2 border-emerald-500 bg-emerald-50/70 text-slate-800'
        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700';
      const checkClass = isSelected ? '' : 'hidden';
      const badgeHtml = course.badge
        ? `<span class="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">${course.badge}</span>`
        : '';
      const descColor = course.badge ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-medium';

      return `
        <button type="button" data-course-id="${course.id}" class="course-switcher-card flex items-center justify-between p-2.5 rounded-2xl ${borderClass} text-xs font-bold cursor-pointer transition-all active:scale-98">
          <div class="flex items-center gap-2.5 pointer-events-none">
            <span class="text-xl">${course.icon}</span>
            <div class="flex flex-col text-left">
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-slate-900 leading-tight">${course.title}</span>
                ${badgeHtml}
              </div>
              <span class="text-[10px] ${descColor}">${course.desc}</span>
            </div>
          </div>
          <span class="course-switcher-check ${checkClass} material-symbols-outlined text-[18px] text-emerald-600 font-black">check_circle</span>
        </button>
      `;
    }).join('');
  }

  function updateModalCardsUI(lang) {
    modalPendingLanguage = lang;
    const isEs = lang === 'es';
    const cardEs = el('card-es');
    const cardEn = el('card-en');
    const badgeEs = el('badge-es');
    const badgeEn = el('badge-en');

    const setCardStyle = (card, badge, isSelected) => {
      if (!card) return;
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      card.className = `course-card relative p-3.5 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#22c55e] ${isSelected
        ? 'border-[#22c55e] bg-[#f0fdf4] ring-2 ring-[#22c55e]/20 scale-[1.02] shadow-xs'
        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200'
        }`;

      if (badge) {
        badge.className = `absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#22c55e] bg-[#22c55e]' : 'border-slate-300 bg-transparent'
          }`;
        const dot = badge.querySelector('.badge-dot') || badge.firstElementChild;
        if (dot) {
          dot.className = `badge-dot w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-transparent'}`;
        }
      }

      const nameEl = card.querySelector('.card-lang-name');
      if (nameEl) {
        nameEl.className = `card-lang-name font-bold text-sm tracking-tight transition-colors ${isSelected ? 'text-[#15803d]' : 'text-slate-700'
          }`;
      }

      const subEl = card.querySelector('.card-lang-sub');
      if (subEl) {
        subEl.className = `card-lang-sub text-[11px] transition-colors ${isSelected ? 'text-[#22c55e] font-semibold' : 'text-slate-400 font-medium'
          }`;
      }
    };

    setCardStyle(cardEs, badgeEs, isEs);
    setCardStyle(cardEn, badgeEn, !isEs);
  }

  function updateModalCourseCardsUI(selectedCourseId) {
    modalPendingCourseId = selectedCourseId || 'main';
    const cards = document.querySelectorAll('.course-switcher-card');
    cards.forEach(card => {
      const cid = card.dataset.courseId;
      const isSelected = (cid === modalPendingCourseId);
      const check = card.querySelector('.course-switcher-check');
      if (isSelected) {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.remove('hidden');
      } else {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.add('hidden');
      }
    });
  }

  function openLanguageModal() {
    window.closeCourseDropdown?.();
    const savedLang = localStorage?.getItem('vocadash_selected_lang') || localStorage?.getItem('vocadash_language');
    modalPendingLanguage = window.currentLanguage || window.currentActiveCourse || savedLang || 'es';
    modalPendingCourseId = window.activeCourseId || localStorage?.getItem('vocadash_active_course') || 'main';

    if (modalPendingLanguage === 'en') modalPendingCourseId = 'main';

    updateModalCardsUI(modalPendingLanguage);
    renderModalCourseList(modalPendingLanguage, modalPendingCourseId);

    const backdrop = el('language-modal-backdrop');
    const card = el('language-modal-card');
    if (backdrop && card) {
      backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      card.classList.remove('scale-95', 'opacity-0');
    }
  }

  function closeLanguageModal() {
    const backdrop = el('language-modal-backdrop');
    const card = el('language-modal-card');
    if (backdrop && card) {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      card.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        if (backdrop.classList.contains('opacity-0')) {
          backdrop.classList.add('hidden');
        }
      }, 200);
    }
  }


  function handleCardLanguageSelect(targetLang) {
    const langChanged = (modalPendingLanguage !== targetLang);
    modalPendingLanguage = targetLang;
    if (langChanged) {
      modalPendingCourseId = 'main';
    }
    updateModalCardsUI(targetLang);
    renderModalCourseList(targetLang, modalPendingCourseId);
  }

  function setLanguage(targetLang) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : 'es';
    window.currentActiveCourse = lang;
    window.currentLanguage = lang;
    try {
      localStorage.setItem('vocadash_language', lang);
      localStorage.setItem('vocadash_selected_lang', lang);
    } catch (_) { }

    // 1. Settings screen 학습 언어 UI 즉시 갱신
    const settingsFlag = document.getElementById('settings-current-lang-flag');
    if (settingsFlag) {
      settingsFlag.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
    }
    const settingsDesc = document.getElementById('settings-current-lang-desc');
    if (settingsDesc) {
      settingsDesc.textContent = (lang === 'en') ? '영어 (필수 회화 & 어휘)' : '스페인어 (일상 실전 패턴)';
    }

    // 2. 상단 헤더 국기 이모지 및 언어명 배지 텍스트 즉시 갱신
    const headerFlag = document.getElementById('header-flag-emoji');
    if (headerFlag) {
      headerFlag.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
    }
    const headerLangName = document.getElementById('header-lang-name');
    if (headerLangName) {
      headerLangName.textContent = (lang === 'en') ? '영어' : '스페인어';
    }

    // 3. 코스 및 단어장 드롭다운 목록 즉시 갱신
    let selectedCourse = 'main';
    try {
      selectedCourse = localStorage.getItem(`vocadash_active_course_${lang}`) || 'main';
    } catch (_) { }

    if (lang === 'en' && selectedCourse === 'pack_football') {
      selectedCourse = 'main';
    }
    window.currentCourseId = selectedCourse;
    window.activeCourseId = selectedCourse;
    try {
      localStorage.setItem(`vocadash_active_course_${lang}`, selectedCourse);
      localStorage.setItem('vocadash_active_course', selectedCourse);
    } catch (_) { }

    if (typeof window.renderCourseDropdown === 'function') {
      window.renderCourseDropdown(lang, selectedCourse);
    }
    if (typeof window.renderBookCourseDropdown === 'function') {
      window.renderBookCourseDropdown(lang, selectedCourse);
    }

    // 4. 로드맵 노드 및 스테이지 타이틀 갱신
    if (typeof window.loadNodeProgress === 'function') {
      window.nodeProgressMap = window.loadNodeProgress(lang, selectedCourse);
    }
    const unlocked = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang, selectedCourse) : 1;
    window._currentVisibleUnitIndex = Math.max(0, unlocked - 1);
    if (typeof window.updateRoadmapNodesUI === 'function') {
      window.updateRoadmapNodesUI();
    }
    if (typeof window.renderRoadmap === 'function') {
      window.renderRoadmap();
    }

    // 5. 단어장 단어 갱신
    if (typeof window.renderBookWords === 'function') {
      window.renderBookWords(lang, selectedCourse);
    }

    // 6. 캐릭터 마스코트 prefix 및 로드맵 이정표 갱신
    if (typeof window.updateMascotCharacters === 'function') {
      window.updateMascotCharacters(lang);
    }
    if (typeof window.updateRoadmapSignpost === 'function') {
      window.updateRoadmapSignpost(lang);
    }

    // 7. 언어 선택 모달 내 상태 갱신 및 창 닫기
    updateModalCardsUI(lang);
    closeLanguageModal();

    // 8. 오답 노트 데이터 언어별 격리 로드 및 오답 탭 즉시 리렌더링
    if (typeof window.loadWrongWords === 'function') {
      window.wrongWords = window.loadWrongWords(lang);
    } else {
      window.wrongWords = [];
    }
    if (typeof window.updateWrongWordsBadge === 'function') {
      window.updateWrongWordsBadge();
    }
    if (typeof window.renderReviewWords === 'function') {
      window.renderReviewWords(window.currentReviewFilter || 'waiting');
    }

    // 9. 내 기록(통계) 화면 언어별 UI 갱신
    if (typeof window.updateStatsScreenUI === 'function') {
      window.updateStatsScreenUI();
    }
  }

  function initLanguageModalEvents() {
    const triggerBtn = document.getElementById('logo-lang-trigger');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', openLanguageModal);
    }
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLanguageModal);
    }

    const cardEs = el('card-es');
    if (cardEs) {
      cardEs.addEventListener('click', () => handleCardLanguageSelect('es'));
      cardEs.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardLanguageSelect('es');
        }
      });
    }

    const cardEn = el('card-en');
    if (cardEn) {
      cardEn.addEventListener('click', () => handleCardLanguageSelect('en'));
      cardEn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardLanguageSelect('en');
        }
      });
    }

    // 코스 스위처 카드 클릭 이벤트 (위임)
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.course-switcher-card');
      if (!card) return;
      const cid = card.dataset.courseId;
      if (cid) {
        modalPendingCourseId = cid;
        updateModalCourseCardsUI(cid);
      }
    });

    // 하단 고정 '선택 완료' Primary CTA 버튼 클릭 이벤트
    const btnConfirmLangCourse = document.getElementById('btn-confirm-language-course');
    if (btnConfirmLangCourse) {
      btnConfirmLangCourse.addEventListener('click', () => {
        const finalLang = modalPendingLanguage || window.currentLanguage || localStorage.getItem('vocadash_selected_lang') || 'es';
        const finalCourseId = modalPendingCourseId || window.activeCourseId || 'main';

        try {
          localStorage.setItem('vocadash_language', finalLang);
          localStorage.setItem('vocadash_selected_lang', finalLang);
          localStorage.setItem('vocadash_active_course', finalCourseId);
        } catch (_) { }

        setLanguage(finalLang);

        if (typeof window.switchCourse === 'function') {
          window.switchCourse(finalCourseId);
        }

        closeLanguageModal();
      });
    }
  }

  // ===================================================
  // COURSE DROPDOWN MENU MODULE (코스 선택 드롭다운 메뉴)
  // ===================================================
  function openCourseDropdown() {
    const courseDropdown = document.getElementById('course-dropdown-menu');
    const chevronIcon = document.getElementById('dropdown-chevron-icon');
    if (!courseDropdown) return;
    renderCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es', window.currentCourseId);
    courseDropdown.classList.remove('hidden', 'opacity-0', '-translate-y-2', 'pointer-events-none');
    courseDropdown.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    if (chevronIcon) chevronIcon.classList.add('rotate-180');
  }

  function closeCourseDropdown() {
    const courseDropdown = document.getElementById('course-dropdown-menu');
    const chevronIcon = document.getElementById('dropdown-chevron-icon');
    if (!courseDropdown) return;
    courseDropdown.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    courseDropdown.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
    if (chevronIcon) chevronIcon.classList.remove('rotate-180');
    setTimeout(() => {
      if (courseDropdown.classList.contains('opacity-0')) courseDropdown.classList.add('hidden');
    }, 200);
  }

  function renderCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), selectedCourseId) {
    const menu = document.getElementById('course-dropdown-menu');
    if (!menu) return;

    const targetCourseId = selectedCourseId || window.currentCourseId || (typeof window.getSavedCourseId === 'function' ? window.getSavedCourseId() : null) || 'basic';
    const presets = (window.COURSE_PRESETS && window.COURSE_PRESETS[lang]) || (typeof COURSE_PRESETS !== 'undefined' ? COURSE_PRESETS[lang] || COURSE_PRESETS.es : []) || [];
    const currentSelected = presets.find((p) => p.id === targetCourseId) || presets[0] || { id: 'main', title: '기본 코스', icon: '🌱', desc: '' };
    if (selectedCourseId === 'pack_football' || window.currentCourseId === 'pack_football') {
      window.currentCourseId = 'pack_football';
    } else if (!window.currentCourseId || window.currentCourseId === 'basic') {
      window.currentCourseId = 'main';
    }
    window.currentBookCourseId = currentSelected.id;
    window.currentCourseCategory = currentSelected.id;
    window.currentCategoryFilter = '전체';
    try {
      localStorage.setItem('vocadash_current_course', currentSelected.id);
    } catch (_) { }

    const escapeHTML = (typeof window.escapeHTML === 'function') ? window.escapeHTML : (str => str ? String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '');

    menu.innerHTML = presets.map((course) => {
      const isSelected = course.id === currentSelected.id;
      const btnClass = isSelected
        ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 font-semibold'
        : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50';
      const titleClass = isSelected ? 'text-emerald-950' : 'text-slate-700';
      const descClass = isSelected ? 'text-emerald-800/80' : 'text-slate-500';
      return `
        <button type="button" data-course-id="${escapeHTML(course.id)}" class="course-dropdown-item flex items-center justify-between p-2.5 rounded-xl ${btnClass} cursor-pointer transition-all" role="menuitem">
          <div class="flex items-center gap-2.5 pointer-events-none">
            <span class="text-base p-1.5 rounded-lg bg-surface-container-lowest shadow-xs border border-slate-100">${escapeHTML(course.icon)}</span>
            <div class="flex flex-col text-left">
              <span class="font-bold text-xs ${titleClass} item-title">${escapeHTML(course.title)}</span>
              <span class="text-[10px] ${descClass}">${escapeHTML(course.desc)}</span>
            </div>
          </div>
          <span class="item-check ${isSelected ? '' : 'hidden'} material-symbols-outlined text-[18px] text-emerald-600 font-bold">check</span>
        </button>
      `;
    }).join('');

    // 상단 드롭다운 메인 버튼 정보 세팅
    const dropdownTitle = document.getElementById('dropdown-course-title');
    const dropdownIcon = document.getElementById('dropdown-course-icon');
    if (dropdownTitle) dropdownTitle.textContent = currentSelected.title;
    if (dropdownIcon) dropdownIcon.textContent = currentSelected.icon;

    // 카테고리 칩 목록 동기화
    const courseCatMap = window.courseCategoryMap || (typeof courseCategoryMap !== 'undefined' ? courseCategoryMap : null);
    if (courseCatMap && courseCatMap[currentSelected.id] && typeof window.renderCategoryChips === 'function') {
      window.renderCategoryChips(courseCatMap[currentSelected.id].categories);
    }
  }

  function initCourseDropdownEvents() {
    const courseSelectBtn = document.getElementById('course-selector-btn');
    const courseDropdown = document.getElementById('course-dropdown-menu');

    if (courseSelectBtn) {
      courseSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (courseDropdown && !courseDropdown.classList.contains('hidden') && !courseDropdown.classList.contains('opacity-0')) {
          closeCourseDropdown();
        } else {
          openCourseDropdown();
        }
      });
    }

    // 외부 영역 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (e.target.closest('#course-dropdown-menu') || e.target.closest('#course-selector-btn')) {
        return;
      }
      if (courseDropdown && !courseDropdown.classList.contains('hidden') && !courseDropdown.classList.contains('opacity-0')) {
        closeCourseDropdown();
      }
    });

    // 드롭다운 아이템 클릭 이벤트 위임
    if (courseDropdown) {
      courseDropdown.onclick = function (e) {
        e.stopPropagation();
        const itemBtn = e.target.closest('.course-dropdown-item');
        if (!itemBtn) return;

        const courseId = itemBtn.dataset.courseId;
        const titleEl = itemBtn.querySelector('.item-title');
        const title = titleEl ? titleEl.textContent.trim() : itemBtn.innerText.trim();

        const currentLang = window.currentLanguage || window.currentActiveCourse || 'es';
        const presets = (window.COURSE_PRESETS && window.COURSE_PRESETS[currentLang]) || (typeof COURSE_PRESETS !== 'undefined' ? COURSE_PRESETS[currentLang] || COURSE_PRESETS.es : []) || [];
        const matched = presets.find((c) => c.id === courseId);
        const courseCatMap = window.courseCategoryMap || (typeof courseCategoryMap !== 'undefined' ? courseCategoryMap : null);
        const icon = matched ? matched.icon : (courseCatMap && courseCatMap[courseId] ? courseCatMap[courseId].icon : '🌱');

        window.currentCourseId = courseId;
        window.currentBookCourseId = courseId;
        window.currentCategoryFilter = '전체';
        try {
          localStorage.setItem('vocadash_current_course', courseId);
        } catch (_) { }

        const dropdownTitle = document.getElementById('dropdown-course-title');
        const dropdownIcon = document.getElementById('dropdown-course-icon');
        if (dropdownTitle) dropdownTitle.textContent = title;
        if (dropdownIcon) dropdownIcon.textContent = icon;

        document.querySelectorAll('#course-dropdown-menu .course-dropdown-item').forEach((btn) => {
          const isSelected = btn.dataset.courseId === courseId;
          const check = btn.querySelector('.item-check');
          const titleSpan = btn.querySelector('.item-title');

          btn.className = `course-dropdown-item flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
            ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 font-semibold'
            : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50'
            }`;
          if (check) check.classList.toggle('hidden', !isSelected);
          if (titleSpan) {
            titleSpan.classList.toggle('text-emerald-950', isSelected);
            titleSpan.classList.toggle('text-slate-700', !isSelected);
          }
        });

        if (courseCatMap && courseCatMap[courseId] && typeof window.renderCategoryChips === 'function') {
          window.renderCategoryChips(courseCatMap[courseId].categories);
        }

        if (typeof window.loadNodeProgress === 'function') {
          window.nodeProgressMap = window.loadNodeProgress(currentLang);
        }

        if (typeof window.updateRoadmapNodesUI === 'function') {
          window.updateRoadmapNodesUI();
        }

        if (typeof window.renderRoadmap === 'function') {
          window.renderRoadmap();
        }

        if (typeof window.renderBookCourseDropdown === 'function') {
          window.renderBookCourseDropdown(currentLang, courseId);
        }

        closeCourseDropdown();
      };
    }
  }

  // DOM 로드 완료 시 이벤트 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLanguageModalEvents();
      initCourseDropdownEvents();
    });
  } else {
    initLanguageModalEvents();
    initCourseDropdownEvents();
  }

  // Export to Window / Global
  target.openLanguageModal = openLanguageModal;
  target.closeLanguageModal = closeLanguageModal;
  target.renderModalCourseList = renderModalCourseList;
  target.updateModalCardsUI = updateModalCardsUI;
  target.updateModalCourseCardsUI = updateModalCourseCardsUI;
  target.setLanguage = setLanguage;
  target.changeCourse = setLanguage;
  target.changeLanguage = setLanguage;
  target.switchLanguage = setLanguage;
  target.initLanguageModalEvents = initLanguageModalEvents;

  // Course dropdown exports
  target.openCourseDropdown = openCourseDropdown;
  target.closeCourseDropdown = closeCourseDropdown;
  target.renderCourseDropdown = renderCourseDropdown;
  target.initCourseDropdownEvents = initCourseDropdownEvents;

})(typeof window !== 'undefined' ? window : this);

