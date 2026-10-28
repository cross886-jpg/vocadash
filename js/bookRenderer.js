// ==============================================================================
// VocaDash Book & Vocabulary Renderer Module (js/bookRenderer.js)
// 단어장(Book) 탭 UI 렌더링, 코스 뱃지, 진도율 배너, 아코디언, 필터링 및 검색/이벤트 전담
// ==============================================================================

(function (global) {
  'use strict';
  const target = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function getSortableWord(word) {
    if (!word) return '';
    return word.trim()
      .replace(/^[¡¿'"\(\[\{]+/g, '')
      .replace(/[!?'"\)\]\}]+$/g, '')
      .toLowerCase();
  }

  // 1. 단어장 상단 코스 뱃지 갱신
  function updateBookCourseBadge(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), courseId) {
    let icon = '🇪🇸';
    let title = '일상 실전 패턴';

    const activeCourseId = courseId || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : 'main');
    if (activeCourseId === 'pack_football') {
      icon = '⚽';
      title = '스페인 축구 실전팩';
    } else if (lang === 'en') {
      icon = '🇺🇸';
      title = '필수 회화 & 어휘';
    }

    const courseData = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : null;
    if (courseData) {
      if (courseData.icon) icon = courseData.icon;
      if (courseData.title && courseData.title !== '축구 실전 단어팩 (DLC)' && courseData.title !== '일상 실전 패턴' && courseData.title !== '필수 회화 & 어휘') {
        title = courseData.title;
      } else if (courseData.courseName) {
        title = courseData.courseName;
      }
    }

    const titleEl = document.getElementById('book-course-title');
    const iconEl = document.getElementById('book-course-icon');
    if (titleEl) titleEl.textContent = title;
    if (iconEl) iconEl.textContent = icon;
  }

  // 2. 단어장 중간 학습 진도 배너 및 필터 칩 개수 동적 동기화
  function updateBookProgressHero() {
    const courseData = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : null;
    let storedCourse = 'main';
    try {
      storedCourse = localStorage.getItem('vocadash_active_course') || 'main';
    } catch (_) { }

    const isFootball = (window.activeCourseId === 'pack_football' || storedCourse === 'pack_football' || (courseData && courseData.id === 'pack_football'));

    let totalWords = 0;
    if (isFootball) {
      if (courseData && Array.isArray(courseData.units)) {
        totalWords = courseData.units.reduce(function (sum, u) {
          return sum + (Array.isArray(u.words) ? u.words.length : 0);
        }, 0);
      }
      if (!totalWords) totalWords = 180;
    } else if (courseData && courseData.id && courseData.id !== 'main' && courseData.id !== 'es_main' && Array.isArray(courseData.units)) {
      totalWords = courseData.units.reduce(function (sum, u) {
        return sum + (Array.isArray(u.words) ? u.words.length : 0);
      }, 0);
      if (!totalWords) totalWords = 120;
    } else {
      totalWords = 120;
    }

    let memorizedCount = 0;
    try {
      const storageKey = isFootball ? 'vocadash_memorized_count_pack_football' : 'vocadash_memorized_count_main';
      const savedCount = localStorage.getItem(storageKey);
      if (savedCount !== null) {
        const parsed = parseInt(savedCount, 10);
        if (!isNaN(parsed) && parsed >= 0) memorizedCount = parsed;
      } else {
        const rawMastered = localStorage.getItem('vocadash_mastered_words') || localStorage.getItem('vocadash_learned_words');
        if (rawMastered) {
          const parsedArr = JSON.parse(rawMastered);
          if (Array.isArray(parsedArr)) memorizedCount = parsedArr.length;
        }
      }
    } catch (_) {
      memorizedCount = 0;
    }

    let wrongCount = 0;
    try {
      const rawWrong = localStorage.getItem('vocadash_weakness_words') || localStorage.getItem('vocadash_wrong_words');
      if (rawWrong) {
        const parsedWrong = JSON.parse(rawWrong);
        if (Array.isArray(parsedWrong)) wrongCount = parsedWrong.length;
      }
    } catch (_) {
      wrongCount = 0;
    }

    memorizedCount = Math.min(memorizedCount, totalWords);
    const percent = totalWords > 0 ? Math.round((memorizedCount / totalWords) * 100) : 0;
    const unmemorizedCount = Math.max(0, totalWords - memorizedCount);

    const countEl = document.getElementById('book-progress-count');
    const percentEl = document.getElementById('book-progress-percent');
    const barEl = document.getElementById('book-progress-bar-fill');

    if (countEl) countEl.textContent = '외운 단어 ' + memorizedCount + ' / ' + totalWords + '개';
    if (percentEl) percentEl.textContent = '(' + percent + '% 달성)';
    if (barEl) barEl.style.width = percent + '%';

    const allCountEl = document.getElementById('book-filter-all-count');
    if (allCountEl) allCountEl.textContent = String(totalWords);

    const wrongCountEl = document.getElementById('book-filter-wrong-count');
    if (wrongCountEl) wrongCountEl.textContent = String(wrongCount);

    const unmemorizedCountEl = document.getElementById('book-filter-unmemorized-count');
    if (unmemorizedCountEl) unmemorizedCountEl.textContent = String(unmemorizedCount);

    const memorizedCountEl = document.getElementById('book-filter-memorized-count');
    if (memorizedCountEl) memorizedCountEl.textContent = String(memorizedCount);
  }

  // 3. 전체 단어 렌더링 (아코디언 및 유닛별 그룹화)
  function renderBookWords(targetLang, courseId) {
    const lang = (targetLang === 'en') ? 'en' : 'es';
    const container = document.getElementById('book-words-container');
    if (!container) return;

    const activeCourse = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : null;
    let storedCourse = 'main';
    try {
      storedCourse = localStorage.getItem('vocadash_active_course') || 'main';
    } catch (_) { }
    const isFootball = (courseId === 'pack_football' || window.activeCourseId === 'pack_football' || storedCourse === 'pack_football' || (activeCourse && activeCourse.id === 'pack_football'));

    updateBookCourseBadge(lang, courseId);
    updateBookProgressHero();

    const chapterTitleEl = document.getElementById('book-chapter-title');
    const chapterSubtitleEl = document.getElementById('book-chapter-subtitle');
    const chapterCountEl = document.getElementById('book-chapter-count');
    if (chapterTitleEl) {
      if (isFootball) {
        chapterTitleEl.textContent = '⚽ 스페인 축구 실전팩 (Unit 1~4)';
      } else {
        chapterTitleEl.textContent = lang === 'en' ? '1과: 인사/기초 표현' : '1과: 인사/안부';
      }
    }
    if (chapterSubtitleEl && !isFootball) {
      chapterSubtitleEl.textContent = lang === 'en' ? 'Greeting, Thanks & Numbers Master' : '인사, 감사, 숫자 등 기초 표현 마스터';
    }
    if (chapterCountEl && !isFootball) {
      chapterCountEl.textContent = '12단어';
    }

    const wrongBanner = document.getElementById('book-wrong-run-banner');
    if (wrongBanner) wrongBanner.classList.add('hidden');
    const oldEmpty = container.querySelector('#book-wrong-empty-state');
    if (oldEmpty) oldEmpty.remove();

    const oldItems = container.querySelectorAll('.book-word-card, .book-category-header, .book-unit-container');
    oldItems.forEach(c => c.remove());

    const isPhoneticVisible = window.vocadashSettings ? !!window.vocadashSettings.showPhonetic : true;
    const phoneticStyle = isPhoneticVisible ? '' : 'style="display: none;"';

    const ch1Header = document.getElementById('book-chapter-header');
    const ch2Toggle = document.getElementById('book-chapter-2-toggle');
    const ch3Locked = document.getElementById('book-chapter-3-locked');

    if (activeCourse && Array.isArray(activeCourse.units) && activeCourse.units.length > 0) {
      if (ch1Header) { ch1Header.style.display = 'none'; ch1Header.classList.add('hidden'); }
      if (ch2Toggle) { ch2Toggle.style.display = 'none'; ch2Toggle.classList.add('hidden'); }
      if (ch3Locked) { ch3Locked.style.display = 'none'; ch3Locked.classList.add('hidden'); }

      const iconPrefix = isFootball ? '⚽' : (activeCourse.icon || (lang === 'en' ? '🇺🇸' : '🇪🇸'));

      let starredList = [];
      try {
        const rawStar = localStorage.getItem('vocadash_starred_words') ||
          localStorage.getItem('vocadash_favorites') ||
          localStorage.getItem('starredWords');
        if (rawStar) {
          const parsed = JSON.parse(rawStar);
          if (Array.isArray(parsed)) starredList = parsed;
        }
      } catch (_) { }

      activeCourse.units.forEach((u) => {
        const unitContainer = document.createElement('div');
        unitContainer.className = 'book-unit-container mb-4';

        const wordCount = (u.words || []).length;
        const subtitleText = u.subtitle || u.desc || '';
        const safeSubtitle = escapeHTML(subtitleText);
        const subtitleHtml = subtitleText ? `<p class="mt-1 pl-0.5 text-xs text-slate-500 font-medium leading-relaxed">${safeSubtitle}</p>` : '';
        const safeUnitTitle = escapeHTML(u.title);

        const catHeader = document.createElement('div');
        catHeader.className = 'book-category-header flex flex-col mt-4 mb-2 px-1 pt-1 border-t border-slate-100 first:border-0 first:mt-1 cursor-pointer select-none group';
        catHeader.innerHTML = `
          <div class="flex items-center justify-between w-full">
            <span class="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs group-hover:bg-emerald-100 transition-colors">${iconPrefix} ${safeUnitTitle}</span>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="text-xs font-semibold">${wordCount}단어</span>
              <span class="material-symbols-outlined text-[18px] unit-toggle-icon transition-transform duration-200">expand_less</span>
            </div>
          </div>
          ${subtitleHtml}
        `;

        const wordsListContainer = document.createElement('div');
        wordsListContainer.className = 'book-unit-words-wrap unit-word-list flex flex-col gap-3 mt-2.5';

        (u.words || []).forEach((w) => {
          const termStr = w.word || w.term || '';
          const meaningStr = w.meaning || '';

          const isStar = starredList.some(item => {
            if (typeof item === 'string') return item === termStr;
            return (item.term || item.word || item.id) === termStr;
          });

          const art = document.createElement('article');
          art.className = 'book-word-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md';
          art.dataset.term = termStr;
          art.dataset.meaning = meaningStr;
          art.dataset.category = u.title;
          const phonetic = w.pronunciation ? `[${w.pronunciation}]` : (w.pron ? `[${w.pron}]` : (w.phonetic || ''));

          const starFillStyle = isStar ? 'style="font-variation-settings: &quot;FILL&quot; 1;"' : '';
          const safeTerm = escapeHTML(termStr);
          const safePhonetic = escapeHTML(phonetic);
          const safeMeaning = escapeHTML(meaningStr);

          art.innerHTML = `
            <div class="flex flex-col min-w-0 pr-2">
              <div class="flex items-center gap-2">
                <span class="text-xl font-bold text-slate-800 tracking-tight">${safeTerm}</span>
                <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-0.5 transition-colors cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[20px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
                </button>
              </div>
              <span class="text-xs text-slate-400 font-medium mt-0.5">
                <span class="book-phonetic phonetic-hint" ${phoneticStyle}>${safePhonetic}</span>
                <span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>
                <span class="text-slate-700 font-semibold text-[13px]">${safeMeaning}</span>
              </span>
            </div>
            <button aria-label="즐겨찾기" class="book-star-btn w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center ${isStar ? 'text-amber-400' : 'text-slate-300'} active:scale-90 transition-all cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px]" ${starFillStyle}>star</span>
            </button>
          `;
          wordsListContainer.appendChild(art);
        });

        catHeader.addEventListener('click', () => {
          const isCollapsed = wordsListContainer.classList.contains('hidden');
          const arrowIcon = catHeader.querySelector('.unit-toggle-icon');
          if (isCollapsed) {
            wordsListContainer.classList.remove('hidden');
            if (arrowIcon) arrowIcon.textContent = 'expand_less';
          } else {
            wordsListContainer.classList.add('hidden');
            if (arrowIcon) arrowIcon.textContent = 'expand_more';
          }
        });

        unitContainer.appendChild(catHeader);
        unitContainer.appendChild(wordsListContainer);

        if (ch2Toggle && ch2Toggle.parentNode === container) {
          container.insertBefore(unitContainer, ch2Toggle);
        } else {
          container.appendChild(unitContainer);
        }
      });

      initBookScreenEvents();
      return;
    }

    if (ch1Header) { ch1Header.style.display = ''; ch1Header.classList.remove('hidden'); }
    if (ch2Toggle) { ch2Toggle.style.display = ''; ch2Toggle.classList.remove('hidden'); }
    if (ch3Locked) { ch3Locked.style.display = ''; ch3Locked.classList.remove('hidden'); }

    initBookScreenEvents();
  }

  // 4. 오답 단어 목록 렌더링
  function renderBookWrongWords() {
    const container = document.getElementById('book-words-container');
    if (!container) return;

    const chapterTitleEl = document.getElementById('book-chapter-title');
    if (chapterTitleEl) {
      chapterTitleEl.textContent = '🔥 취약 단어 집중 복습 (오답 단어장)';
    }

    const wrongBanner = document.getElementById('book-wrong-run-banner');
    if (wrongBanner) {
      wrongBanner.classList.remove('hidden');
    }

    const oldItems = container.querySelectorAll('.book-word-card, .book-category-header, .book-unit-container, #book-wrong-empty-state');
    oldItems.forEach(c => c.remove());

    const ch1Header = document.getElementById('book-chapter-header');
    const ch2Toggle = document.getElementById('book-chapter-2-toggle');
    const ch3Locked = document.getElementById('book-chapter-3-locked');
    if (ch1Header) { ch1Header.style.display = 'none'; ch1Header.classList.add('hidden'); }
    if (ch2Toggle) { ch2Toggle.style.display = 'none'; ch2Toggle.classList.add('hidden'); }
    if (ch3Locked) { ch3Locked.style.display = 'none'; ch3Locked.classList.add('hidden'); }

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let wrongList = [];

    const hasStoredWrong = !!(
      localStorage.getItem('vocadash_weakness_words') ||
      localStorage.getItem('vocadash_wrong_words') ||
      localStorage.getItem('wrongWords_' + currentLang) ||
      localStorage.getItem('wrongWords')
    );

    if (!hasStoredWrong) {
      wrongList = [];
      if (Array.isArray(window.wrongWords)) {
        window.wrongWords = [];
      }
    } else if (typeof window.loadWrongWords === 'function') {
      wrongList = (window.loadWrongWords(currentLang) || []).filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    } else {
      wrongList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
        w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5
      );
    }

    const wrongCountEl = document.getElementById('book-filter-wrong-count');
    if (wrongCountEl) wrongCountEl.textContent = String(wrongList.length);

    if (wrongList.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.id = 'book-wrong-empty-state';
      emptyDiv.className = 'py-12 flex flex-col items-center justify-center text-center bg-white rounded-3xl p-6 border border-slate-100 shadow-sm';
      emptyDiv.innerHTML = `
        <span class="text-4xl mb-2">🎉</span>
        <p class="text-sm font-bold text-slate-800 mb-1">틀린 단어가 없습니다! 완벽해요 👏</p>
        <p class="text-xs text-slate-400 font-medium">모든 단어를 마스터했어요! 새로운 스테이지에 도전해 보세요.</p>
      `;
      container.appendChild(emptyDiv);
      initBookScreenEvents();
      return;
    }

    const isPhoneticVisible = window.vocadashSettings ? !!window.vocadashSettings.showPhonetic : true;
    const phoneticStyle = isPhoneticVisible ? '' : 'style="display: none;"';

    wrongList.forEach(item => {
      const term = item.word || item.term || '';
      const meaning = item.meaning || item.kor || item.ko || '';
      const phonetic = item.phonetic || '';
      const streak = Number(item.correctStreak) || 0;

      const safeTerm = escapeHTML(term);
      const safePhonetic = escapeHTML(phonetic);
      const safeMeaning = escapeHTML(meaning);

      const art = document.createElement('article');
      art.className = 'book-word-card book-word-card-wrong bg-white rounded-2xl p-4 shadow-sm border border-rose-100/90 flex items-center justify-between transition-all hover:shadow-md mb-3';
      art.dataset.term = term;
      art.dataset.meaning = meaning;
      art.dataset.streak = String(streak);
      art.innerHTML = `
        <div class="flex flex-col min-w-0 pr-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-slate-800 tracking-tight">${safeTerm}</span>
            <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-0.5 transition-colors cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
            </button>
          </div>
          <span class="text-xs text-slate-400 font-medium mt-0.5">
            <span class="book-phonetic phonetic-hint" ${phoneticStyle}>${safePhonetic}</span>
            <span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>
            <span class="text-slate-700 font-semibold text-[13px]">${safeMeaning}</span>
          </span>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-extrabold text-xs border border-rose-200 flex items-center gap-1 shadow-2xs">
            <span>🔥</span>
            <span>${streak}/5</span>
          </span>
        </div>
      `;

      const audioBtn = art.querySelector('.book-audio-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof window.safePlayTTS === 'function') {
            window.safePlayTTS(term, currentLang, audioBtn);
          }
        });
      }

      container.appendChild(art);
    });

    initBookScreenEvents();
  }

  // 5. 필터 및 정렬
  function applyBookFilter(filterType) {
    const bookScreen = document.getElementById('book-screen');
    if (!bookScreen) return;

    const wrongBanner = document.getElementById('book-wrong-run-banner');

    if (filterType === 'wrong') {
      if (wrongBanner) wrongBanner.classList.remove('hidden');
      renderBookWrongWords();
      return;
    }

    if (wrongBanner) wrongBanner.classList.add('hidden');

    const wrongEmpty = document.getElementById('book-wrong-empty-state');
    const wrongCards = bookScreen.querySelectorAll('.book-word-card-wrong');
    if (wrongEmpty || wrongCards.length > 0) {
      const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      renderBookWords(currentLang, window.activeCourseId || window.currentBookCourseId || 'main');
    }

    const cards = bookScreen.querySelectorAll('.book-word-card');
    cards.forEach((card) => {
      const isStarred = !!card.querySelector('.book-star-btn.text-amber-400, .book-star-btn.text-amber-500, button[aria-label="즐겨찾기"].text-amber-400, button[aria-label="즐겨찾기"].text-amber-500');

      if (filterType === 'all') {
        card.classList.remove('hidden');
      } else if (filterType === 'starred') {
        if (isStarred) card.classList.remove('hidden');
        else card.classList.add('hidden');
      }
    });

    if (filterType === 'alpha' || filterType === 'alphabet') {
      sortBookWords();
    }
  }

  function sortBookWords(itemsOrContainer, mode = 'alphabet') {
    if (Array.isArray(itemsOrContainer)) {
      const arr = [...itemsOrContainer];
      if (mode === 'alpha' || mode === 'alphabet') {
        arr.sort((a, b) => {
          const strA = getSortableWord(typeof a === 'string' ? a : (a.word || a.term || ''));
          const strB = getSortableWord(typeof b === 'string' ? b : (b.word || b.term || ''));
          return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
        });
      }
      return arr;
    }

    const bookWordsContainer = document.getElementById('book-words-container');
    if (!bookWordsContainer) return [];

    const cards = Array.from(bookWordsContainer.querySelectorAll('.book-word-card'));
    if (cards.length === 0) return [];

    cards.sort((a, b) => {
      const termA = a.dataset.term || a.querySelector('span.text-xl')?.textContent?.trim() || '';
      const termB = b.dataset.term || b.querySelector('span.text-xl')?.textContent?.trim() || '';
      const strA = getSortableWord(termA);
      const strB = getSortableWord(termB);
      return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
    });

    const header = bookWordsContainer.firstElementChild;
    if (header) {
      let anchor = header;
      cards.forEach((card) => {
        anchor.after(card);
        anchor = card;
      });
    } else {
      cards.forEach((card) => bookWordsContainer.appendChild(card));
    }

    return cards;
  }

  function renderBookCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), selectedCourseId) {
    const currentLang = lang === 'en' ? 'en' : 'es';
    const presets = (window.BOOK_COURSE_PRESETS && (window.BOOK_COURSE_PRESETS[currentLang] || window.BOOK_COURSE_PRESETS.es)) || [
      { id: 'main', icon: '🇪🇸', title: '일상 실전 패턴' },
      { id: 'pack_football', icon: '⚽', title: '스페인 축구 실전팩' }
    ];
    const storedCourse = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null);
    const activeId = (selectedCourseId && selectedCourseId !== 'basic') ? selectedCourseId : (storedCourse || window.activeCourseId || window.currentBookCourseId || 'main');
    const currentSelected = presets.find((p) => p.id === activeId) || presets[0];
    window.currentBookCourseId = currentSelected.id;
    window.activeCourseId = currentSelected.id;
    try {
      localStorage.setItem('vocadash_active_course', currentSelected.id);
    } catch (_) { }

    updateBookCourseBadge(currentLang, currentSelected.id);
    updateBookProgressHero();

    const menu = document.getElementById('book-course-dropdown-menu');
    if (!menu) return;

    menu.innerHTML = presets.map((course) => {
      const isSelected = course.id === currentSelected.id;
      return `
        <button type="button" data-course-id="${escapeHTML(course.id)}" class="book-course-item flex items-center justify-between p-2.5 rounded-xl ${isSelected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold' : 'border border-transparent text-slate-700 font-medium'} text-xs cursor-pointer transition-all hover:bg-slate-100" role="menuitem">
          <div class="flex items-center gap-2 pointer-events-none">
            <span class="text-sm">${escapeHTML(course.icon)}</span>
            <span class="book-course-item-title">${escapeHTML(course.title)}</span>
          </div>
          <span class="material-symbols-outlined text-[16px] text-emerald-600 font-bold book-course-check ${isSelected ? '' : 'hidden'}">check</span>
        </button>
      `;
    }).join('');
  }

  function closeBookCourseDropdown() {
    const menu = document.getElementById('book-course-dropdown-menu');
    const btn = document.getElementById('book-course-btn') || document.querySelector('.book-course-selector');
    const chevron = document.getElementById('book-course-chevron');
    if (menu) menu.classList.add('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }

  // 6. 단어장 화면 이벤트 바인딩
  function initBookScreenEvents() {
    const bookScreen = document.getElementById('book-screen');
    if (!bookScreen) return;

    // 1) 발음 듣기 버튼
    const audioBtns = bookScreen.querySelectorAll('.book-audio-btn, button[aria-label="발음 듣기"], .sound-btn');
    audioBtns.forEach((btn) => {
      if (btn.dataset.audioBound === 'true') return;
      btn.dataset.audioBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.book-word-card') || btn.closest('article');
        const term = (card && (card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim())) || '¡Hola!';

        btn.classList.add('scale-125', 'text-emerald-500');
        setTimeout(() => {
          btn.classList.remove('scale-125', 'text-emerald-500');
        }, 350);

        if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, window.currentActiveCourse || 'es-ES', btn);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, window.currentActiveCourse || 'es-ES', btn);
        }
      });
    });

    // 2) 즐겨찾기 별(★) 토글
    const starBtns = bookScreen.querySelectorAll('.book-star-btn, button[aria-label="즐겨찾기"], .star-btn');
    starBtns.forEach((btn) => {
      if (btn.dataset.starBound === 'true') return;
      btn.dataset.starBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const icon = btn.querySelector('.material-symbols-outlined');
        const isStarred = btn.classList.contains('text-amber-400') || btn.classList.contains('text-amber-500');

        if (isStarred) {
          btn.classList.remove('text-amber-400', 'text-amber-500');
          btn.classList.add('text-slate-300');
          if (icon) icon.style.fontVariationSettings = "'FILL' 0";
          if (typeof window.showToast === 'function') {
            window.showToast('즐겨찾기에서 제거되었습니다', '☆');
          }
        } else {
          btn.classList.remove('text-slate-300');
          btn.classList.add('text-amber-400');
          if (icon) icon.style.fontVariationSettings = "'FILL' 1";
          if (typeof window.showToast === 'function') {
            window.showToast('즐겨찾기에 추가되었습니다 ⭐', '★');
          }
        }
      });
    });

    // 3) 필터 칩 토글
    const filterChips = bookScreen.querySelectorAll('.book-filter-chip, .filter-chip');
    filterChips.forEach((chip) => {
      if (chip.dataset.filterBound === 'true') return;
      chip.dataset.filterBound = 'true';
      chip.addEventListener('click', () => {
        filterChips.forEach((c) => {
          c.className = 'book-filter-chip flex items-center gap-1 flex-shrink-0 px-3.5 py-1.5 rounded-full bg-white text-slate-600 font-medium border border-slate-100 text-xs shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer';
          const dot = c.querySelector('.animate-pulse');
          if (dot) dot.remove();
        });

        chip.className = 'book-filter-chip flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 text-xs shadow-sm active:scale-95 transition-all cursor-pointer';
        if (!chip.querySelector('.animate-pulse')) {
          const pulseDot = document.createElement('span');
          pulseDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
          chip.prepend(pulseDot);
        }

        const filterType = chip.dataset.filter || 'all';
        applyBookFilter(filterType);
      });
    });

    // 4) 코스 드롭다운 열기/닫기
    const bookCourseBtn = bookScreen.querySelector('#book-course-btn, .book-course-selector');
    const bookCourseMenu = bookScreen.querySelector('#book-course-dropdown-menu');
    const bookCourseChevron = bookScreen.querySelector('#book-course-chevron');

    if (bookCourseBtn && bookCourseMenu && bookCourseBtn.dataset.bound !== 'true') {
      bookCourseBtn.dataset.bound = 'true';
      bookCourseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isHidden = bookCourseMenu.classList.contains('hidden');
        if (isHidden) {
          renderBookCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es');
          bookCourseMenu.classList.remove('hidden');
          bookCourseBtn.setAttribute('aria-expanded', 'true');
          if (bookCourseChevron) bookCourseChevron.style.transform = 'rotate(180deg)';
        } else {
          closeBookCourseDropdown();
        }
      });

      bookCourseMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemBtn = e.target.closest('.book-course-item') || e.target.closest('button[data-course-id]');
        if (!itemBtn) return;

        const courseId = itemBtn.dataset.courseId;
        closeBookCourseDropdown();

        if (typeof window.switchCourse === 'function') {
          window.switchCourse(courseId);
        } else {
          window.activeCourseId = courseId;
          window.currentBookCourseId = courseId;
          try {
            localStorage.setItem('vocadash_active_course', courseId);
          } catch (_) { }
          const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          renderBookCourseDropdown(currentLang, courseId);
          renderBookWords(currentLang, courseId);
        }
      });
    }

    // 5) 오답런 버튼 바인딩
    const wrongRunBanner = bookScreen.querySelector('#book-wrong-run-banner');
    const wrongRunBtn = bookScreen.querySelector('#btn-book-start-wrong-run');
    const startWrongRunHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.isHeartRechargeRun = false;
      window.pendingHeartReward = 0;
      if (typeof window.startRoadmapReviewSpeedrun === 'function') {
        window.startRoadmapReviewSpeedrun();
      }
    };
    if (wrongRunBanner && wrongRunBanner.dataset.runBound !== 'true') {
      wrongRunBanner.dataset.runBound = 'true';
      wrongRunBanner.addEventListener('click', startWrongRunHandler);
    }
    if (wrongRunBtn && wrongRunBtn.dataset.runBound !== 'true') {
      wrongRunBtn.dataset.runBound = 'true';
      wrongRunBtn.addEventListener('click', startWrongRunHandler);
    }
  }

  // Export to Global
  target.updateBookCourseBadge = updateBookCourseBadge;
  target.updateBookProgressHero = updateBookProgressHero;
  target.renderBookWords = renderBookWords;
  target.renderBookWrongWords = renderBookWrongWords;
  target.applyBookFilter = applyBookFilter;
  target.sortBookWords = sortBookWords;
  target.renderBookCourseDropdown = renderBookCourseDropdown;
  target.closeBookCourseDropdown = closeBookCourseDropdown;
  target.initBookScreenEvents = initBookScreenEvents;

})(typeof window !== 'undefined' ? window : this);
