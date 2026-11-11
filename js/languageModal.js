// ==============================================================================
// VocaDash Language & Course Switcher Modal Module (js/languageModal.js)
// 언어(스페인어/영어) 및 코스(메인/축구팩) 선택 모달 전담, 로컬스토리지 동기화 및 전역 상태 갱신
// ==============================================================================

(function (global) {
  'use strict';
  const target = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));

  let modalPendingLanguage = 'en';
  let modalPendingCourseId = 'main';

  function el(id) {
    return document.getElementById(id);
  }

  function getAvailableLanguages() {
    if (typeof window !== 'undefined' && Array.isArray(window.availableLanguages)) {
      return window.availableLanguages;
    }
    if (typeof target !== 'undefined' && Array.isArray(target.availableLanguages)) {
      return target.availableLanguages;
    }
    try {
      return require('./data/languagesRegistry.js');
    } catch (_) { }
    return [
      {
        code: "es",
        nameKo: "스페인어",
        nameNative: "Español",
        flag: "🇪🇸",
        mascotImg: "assets/characters/es-study.webp?v=88",
        isReady: true,
        courses: [
          { id: "es_main", title: "스페인어 정규 코스", desc: "일상 회화 & 실전 기초 어휘 마스터", isDlc: false, icon: "🇪🇸" },
          { id: "es_soccer", title: "스페인 축구 실전팩", desc: "스페셜 팩 · 경기장 어휘 & 피치 콜", isDlc: true, badge: "Official DLC", icon: "⚽" }
        ]
      },
      {
        code: "en",
        nameKo: "영어",
        nameNative: "English",
        flag: "🇺🇸",
        mascotImg: "assets/characters/en-study.webp?v=88",
        isReady: true,
        courses: [
          { id: "en_main", title: "영어 정규 코스", desc: "일상 회화 & 실전 필수 어휘 마스터", isDlc: false, icon: "🇺🇸" }
        ]
      }
    ];
  }

  function getLanguageConfig(langCode) {
    const list = getAvailableLanguages();
    return list.find(l => l.code === langCode) || list[0];
  }

  function getModalCourses(langCode) {
    const langCfg = getLanguageConfig(langCode);
    if (langCfg && Array.isArray(langCfg.courses) && langCfg.courses.length > 0) {
      return langCfg.courses.map(c => ({
        id: c.id,
        icon: c.icon || (c.id.includes('soccer') || c.id.includes('football') ? '⚽' : langCfg.flag),
        title: c.title,
        desc: c.desc,
        badge: c.badge || (c.isDlc ? 'Official DLC' : '')
      }));
    }
    const legacyModal = target.MODAL_COURSES || window.MODAL_COURSES;
    if (legacyModal && legacyModal[langCode]) {
      return legacyModal[langCode];
    }
    return [];
  }

  function scrollActiveCardIntoView(langCode, smooth = true) {
    const grid = document.getElementById('language-grid');
    const languages = getAvailableLanguages();
    const isFirstLang = languages.length > 0 && languages[0].code === langCode;

    if (isFirstLang && grid) {
      if (typeof grid.scrollTo === 'function') {
        grid.scrollTo({ left: 0, behavior: smooth ? 'smooth' : 'auto' });
      } else {
        grid.scrollLeft = 0;
      }
      return;
    }

    const cardEl = document.getElementById(`card-${langCode}`);
    if (cardEl && typeof cardEl.scrollIntoView === 'function') {
      try {
        cardEl.scrollIntoView({ inline: 'nearest', behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
      } catch (_) { }
    }
  }

  function renderModalLanguageCards(selectedLang) {
    const grid = document.getElementById('language-grid');
    if (!grid) return;

    // 모바일 뷰포트 스크롤 영역 명시적 높이/표시 속성 보장
    grid.className = 'flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none px-2 py-2 items-center w-full min-h-[140px]';

    const languages = getAvailableLanguages();
    grid.innerHTML = languages.map(lang => {
      const isSelected = (lang.code === selectedLang && lang.isReady);
      const isReady = !!lang.isReady;

      let cardClasses = 'course-card relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center group focus:outline-none focus:ring-2 focus:ring-[#22c55e] w-[115px] sm:w-[124px] shrink-0 snap-start select-none';

      if (!isReady) {
        cardClasses += ' border-slate-200 bg-slate-50/80 opacity-75 hover:opacity-100 cursor-pointer';
      } else if (isSelected) {
        cardClasses += ' border-[#22c55e] bg-[#f0fdf4] ring-2 ring-[#22c55e] shadow-sm cursor-pointer active:scale-95';
      } else {
        cardClasses += ' border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200 opacity-75 hover:opacity-100 cursor-pointer active:scale-95';
      }

      const radioBadge = isReady ? `
        <div class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#22c55e] bg-[#22c55e]' : 'border-slate-300 bg-transparent'}">
          <div class="badge-dot w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-transparent'}"></div>
        </div>
      ` : (lang.badge ? `
        <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-black tracking-tight leading-none">${lang.badge}</span>
      ` : '');

      const nameColor = isSelected ? 'text-[#15803d]' : (isReady ? 'text-slate-700' : 'text-slate-400');
      const subColor = isSelected ? 'text-[#22c55e] font-semibold' : 'text-slate-400 font-medium';

      return `
        <div id="card-${lang.code}" role="radio" aria-checked="${isSelected ? 'true' : 'false'}" tabindex="0"
          data-lang-code="${lang.code}" data-is-ready="${isReady}"
          class="${cardClasses}">
          ${radioBadge}
          <div class="relative mb-2 pointer-events-none">
            <img alt="${lang.nameKo} 마스코트" class="w-14 h-14 sm:w-16 sm:h-16 mx-auto object-cover rounded-xl"
              src="${lang.mascotImg || 'assets/characters/es-study.webp?v=88'}"
              onerror="this.onerror=null; this.src='assets/characters/es-study.webp?v=88';">
            <div class="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm text-xs border border-slate-100">
              ${lang.flag}
            </div>
          </div>
          <span class="card-lang-name font-bold text-sm ${nameColor} tracking-tight transition-colors">${lang.nameKo}</span>
          <span class="card-lang-sub text-[11px] ${subColor} transition-colors">${lang.nameNative}</span>
        </div>
      `;
    }).join('');

    // Bind click / keydown events for cards
    const cardEls = grid.querySelectorAll('.course-card');
    cardEls.forEach(cardEl => {
      const langCode = cardEl.dataset.langCode;
      const isReady = cardEl.dataset.isReady === 'true';

      const selectHandler = (e) => {
        if (e) e.stopPropagation();
        if (!isReady) {
          scrollActiveCardIntoView(langCode, true);
          if (typeof window.showToast === 'function') {
            window.showToast("곧 출시 예정입니다! 🌸", "🚀");
          } else {
            alert("곧 출시 예정입니다!");
          }
          return;
        }
        handleCardLanguageSelect(langCode);
      };

      cardEl.onclick = selectHandler;
      cardEl.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectHandler(e);
        }
      };
    });
  }

  function renderModalCourseList(targetLang, selectedCourseId) {
    const list = document.getElementById('course-switcher-list');
    if (!list) return;

    const lang = (targetLang === 'en') ? 'en' : 'es';
    const courses = getModalCourses(lang);

    let activeId = selectedCourseId;
    if (activeId === 'main') {
      activeId = (lang === 'en') ? 'en_main' : 'es_main';
    } else if (activeId === 'pack_football') {
      activeId = 'es_soccer';
    }

    if (!courses.some(c => c.id === activeId)) {
      activeId = courses[0] ? courses[0].id : (lang === 'en' ? 'en_main' : 'es_main');
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
    renderModalLanguageCards(lang);
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
    modalPendingLanguage = window.currentLanguage || window.currentActiveCourse || savedLang || 'en';
    modalPendingCourseId = window.activeCourseId || localStorage?.getItem('vocadash_active_course') || 'main';

    if (modalPendingLanguage === 'en') modalPendingCourseId = 'main';

    updateModalCardsUI(modalPendingLanguage);
    renderModalCourseList(modalPendingLanguage, modalPendingCourseId);

    const backdrop = el('language-modal-backdrop');
    const card = el('language-modal-card');
    if (backdrop && card) {
      backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      backdrop.style.display = 'flex';
      card.classList.remove('scale-95', 'opacity-0');
      card.style.display = 'flex';
    }

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollActiveCardIntoView(modalPendingLanguage, false);
      });
    } else {
      scrollActiveCardIntoView(modalPendingLanguage, false);
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
          backdrop.style.display = 'none';
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
    scrollActiveCardIntoView(targetLang, true);
  }

  function setLanguage(targetLang, explicitCourseId) {
    const lang = (targetLang === 'es' || targetLang === 'es-ES') ? 'es' : 'en';
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
    let selectedCourse = explicitCourseId;
    if (!selectedCourse) {
      try {
        selectedCourse = localStorage.getItem(`vocadash_active_course_${lang}`) || (lang === 'en' ? 'en_main' : 'es_main');
      } catch (_) { }
    }

    if (lang === 'en' && (selectedCourse === 'pack_football' || selectedCourse === 'es_soccer')) {
      selectedCourse = 'en_main';
    }
    window.currentCourseId = selectedCourse;
    window.activeCourseId = (selectedCourse === 'es_soccer' || selectedCourse === 'pack_football') ? 'pack_football' : 'main';
    try {
      localStorage.setItem(`vocadash_active_course_${lang}`, selectedCourse);
      localStorage.setItem('vocadash_active_course', selectedCourse);
      localStorage.setItem('vocadash_current_course', selectedCourse);
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
    window.currentUnitNumber = unlocked;
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
    try {
      if (!localStorage.getItem('vocadash_profile') && !localStorage.getItem('vocadash_profile_avatar') && typeof window.applyProfileAvatar === 'function') {
        window.applyProfileAvatar(lang === 'en' ? 'profile-english.webp' : 'profile-spanish.webp');
      }
      if (!localStorage.getItem('vocadash_profile_nickname')) {
        const defaultNick = (lang === 'en') ? '영어 질주러' : '스페인어 질주러';
        const statsNick = document.getElementById('stats-nickname'); if (statsNick) statsNick.textContent = defaultNick;
        const streakNick = document.getElementById('settings-streak-nickname'); if (streakNick) streakNick.textContent = defaultNick;
        const nickInput = document.getElementById('nickname-input'); if (nickInput) nickInput.value = defaultNick;
      }
    } catch (_) { }

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

    // 10. 비행 탑승권(Boarding Pass) 바텀시트 동기화
    if (typeof window.renderCourseDrawer === 'function') {
      const drawerCard = document.getElementById('course-drawer-card');
      const drawerBd = document.getElementById('course-drawer-backdrop');
      if (drawerCard && drawerBd && !drawerBd.classList.contains('pointer-events-none')) {
        window.renderCourseDrawer(lang);
      }
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
        const finalLang = modalPendingLanguage || window.currentLanguage || localStorage.getItem('vocadash_selected_lang') || 'en';
        const finalCourseId = modalPendingCourseId || window.currentCourseId || window.activeCourseId || (finalLang === 'en' ? 'en_main' : 'es_main');

        try {
          localStorage.setItem('vocadash_language', finalLang);
          localStorage.setItem('vocadash_selected_lang', finalLang);
          localStorage.setItem('vocadash_active_course', finalCourseId);
          localStorage.setItem('vocadash_current_course', finalCourseId);
        } catch (_) { }

        setLanguage(finalLang, finalCourseId);

        if (typeof window.switchCourse === 'function') {
          window.switchCourse(finalCourseId);
        } else {
          window.currentCourseId = finalCourseId;
          window.activeCourseId = (finalCourseId === 'es_soccer' || finalCourseId === 'pack_football') ? 'pack_football' : 'main';
        }

        if (typeof window.renderCourseDrawer === 'function') {
          window.renderCourseDrawer(finalCourseId);
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
    renderCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'en', window.currentCourseId);
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

  function renderCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'en'), selectedCourseId) {
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

        const currentLang = window.currentLanguage || window.currentActiveCourse || 'en';
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

