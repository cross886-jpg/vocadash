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
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const activeCourse = (typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null)
      || (window.activeCourseId === 'pack_football' ? window.packFootballData : null)
      || (currentLang === 'en' ? window.courseData_en : (window.courseData_es || window.courseData));

    // 마스터(암기 완료) 단어 집합 로드 (언어별 키 우선, 공용 키 폴백)
    const masteredSet = new Set();
    try {
      const rawMastered = (currentLang && localStorage.getItem('vocadash_mastered_words_' + currentLang))
        || localStorage.getItem('vocadash_mastered_words')
        || localStorage.getItem('vocadash_learned_words');
      if (rawMastered) {
        const parsedArr = JSON.parse(rawMastered);
        if (Array.isArray(parsedArr)) {
          parsedArr.forEach((item) => {
            const id = String(item?.id || item?.word || item?.term || item || '').trim();
            if (id) masteredSet.add(id);
          });
        }
      }
    } catch (_) { }

    // 전체 단어 수 및 현재 활성 코스 기준 암기 완료 단어 수 계산 (w.id 및 w.word/term 1:1 매칭)
    let totalWords = 0;
    let memorizedCount = 0;
    if (activeCourse && Array.isArray(activeCourse.units)) {
      activeCourse.units.forEach((u) => {
        if (Array.isArray(u.words)) {
          totalWords += u.words.length;
          if (masteredSet.size > 0) {
            u.words.forEach((w) => {
              const wid = String(w.id || '').trim();
              const term = String(w.word || w.term || '').trim();
              if ((wid && masteredSet.has(wid)) || (term && masteredSet.has(term))) {
                memorizedCount++;
              }
            });
          }
        }
      });
    }

    let wrongCount = 0;
    try {
      if (typeof window.loadWrongWords === 'function') {
        const loaded = window.loadWrongWords(currentLang) || [];
        wrongCount = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
      } else {
        const rawWrong = localStorage.getItem('vocadash_wrong_words_' + currentLang) || localStorage.getItem('vocadash_wrong_answers_' + currentLang) || localStorage.getItem('vocadash_wrong_words');
        if (rawWrong) {
          const parsedWrong = JSON.parse(rawWrong);
          if (Array.isArray(parsedWrong)) {
            wrongCount = parsedWrong.filter(w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
          }
        }
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

  // 발음 단일 대괄호 정규화 헬퍼 (중복 대괄호 방지 및 안전한 [발음] 형태 보장)
  function formatPronunciation(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    if (!str) return '';
    while (str.startsWith('[') && str.endsWith(']') && str.length >= 2) {
      str = str.slice(1, -1).trim();
    }
    return str ? `[${str}]` : '';
  }

  // 개별 유닛 단어 카드 렌더링 (단어 표기 + 예문 컨텍스트 박스)
  function renderUnitWordCards(container, words, unitTitle, starredList, phoneticStyle) {
    if (!container || !Array.isArray(words) || words.length === 0) return;
    const frag = document.createDocumentFragment();

    words.forEach((w) => {
      const termStr = String(w.word || w.term || '').trim();
      const meaningStr = String(w.meaning || '').trim();

      const isStar = (starredList || []).some((item) => {
        if (typeof item === 'string') return item === termStr;
        return (item?.term || item?.word || item?.id) === termStr;
      });

      const art = document.createElement('article');
      art.className = 'book-word-card bg-white rounded-xl p-3.5 shadow-2xs border border-slate-100 hover:border-emerald-200 hover:shadow-xs transition-all';
      art.dataset.term = termStr;
      art.dataset.meaning = meaningStr;
      if (w.id) art.dataset.id = String(w.id).trim();
      art.dataset.category = unitTitle || '';

      const rawPron = w.pronunciation || w.pron || w.phonetic || '';
      const safePhonetic = escapeHTML(formatPronunciation(rawPron));
      const starFillStyle = isStar ? 'style="font-variation-settings: &quot;FILL&quot; 1;"' : '';
      const safeTerm = escapeHTML(termStr);
      const safeMeaning = escapeHTML(meaningStr);

      // 예문 컨텍스트 박스 (스페인어 예문 + 한국어 해석, 쉼표 정규화)
      let exampleBoxHtml = '';
      const rawExEs = w.example_es || w.exampleTarget || w.example || '';
      const rawExKo = w.example_ko || w.exampleMeaning || w.exampleKo || '';
      const exEs = String(rawExEs).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      const exKo = String(rawExKo).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

      if (exEs) {
        exampleBoxHtml = `
          <div class="book-example-box bg-slate-50 rounded-lg p-2.5 mt-2.5 border border-slate-100 flex items-start gap-2 text-left">
            <span class="text-slate-400 text-xs mt-0.5 select-none font-serif text-[14px] leading-none">“</span>
            <div class="flex flex-col min-w-0 flex-1">
              <p class="text-xs font-semibold text-slate-700 leading-snug">${escapeHTML(exEs)}</p>
              ${exKo ? `<p class="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">${escapeHTML(exKo)}</p>` : ''}
            </div>
          </div>
        `;
      }

      art.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col min-w-0 pr-1 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">${safeTerm}</span>
              <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-1 rounded-full hover:bg-emerald-50 transition-colors cursor-pointer" type="button">
                <span class="material-symbols-outlined text-[18px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
              </button>
            </div>
            <div class="text-xs text-slate-400 font-medium mt-1 flex items-baseline flex-wrap gap-1 leading-snug">
              ${safePhonetic ? `<span class="book-phonetic phonetic-hint text-emerald-600/90 font-medium" ${phoneticStyle}>${safePhonetic}</span><span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>` : ''}
              <span class="text-slate-700 font-semibold text-[13px]">${safeMeaning}</span>
            </div>
          </div>
          <button aria-label="즐겨찾기" class="book-star-btn w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center flex-shrink-0 ${isStar ? 'text-amber-400' : 'text-slate-300'} active:scale-90 transition-all cursor-pointer" type="button">
            <span class="material-symbols-outlined text-[20px]" ${starFillStyle}>star</span>
          </button>
        </div>
        ${exampleBoxHtml}
      `;
      frag.appendChild(art);
    });

    container.appendChild(frag);
  }

  // CEFR 레벨 프리셋 (A1 ~ C2)
  const CEFR_LEVEL_PRESETS = [
    { id: 'all', label: '전체' },
    { id: 'A1', label: 'A1 입문' },
    { id: 'A2', label: 'A2 초급' },
    { id: 'B1', label: 'B1 중급' },
    { id: 'B2', label: 'B2 중상급' },
    { id: 'C1', label: 'C1 고급' },
    { id: 'C2', label: 'C2 최고급' }
  ];

  // 유닛 CEFR 레벨 판별 헬퍼 (단어 레벨 > 코스 섹션 메타 > 유닛 인덱스 구간)
  function getUnitCefrLevel(u, uNum, lang) {
    if (u?.level && /^[ABC][12]$/i.test(String(u.level).trim())) {
      return String(u.level).trim().toUpperCase();
    }
    const firstWordLevel = u?.words?.[0]?.level;
    if (firstWordLevel && /^[ABC][12]$/i.test(String(firstWordLevel).trim())) {
      return String(firstWordLevel).trim().toUpperCase();
    }
    const cs = (typeof window !== 'undefined' ? window.courseSections : null);
    const cid = (lang === 'en') ? 'en_main' : 'es_main';
    const sections = cs?.[cid]?.sections || cs?.es_main?.sections || [];
    const sec = sections.find(s => uNum >= s.unitStart && uNum <= s.unitEnd);
    if (sec && sec.tier) {
      const match = sec.tier.match(/\b([ABC][12])\b/i);
      if (match) return match[1].toUpperCase();
    }
    if (uNum <= 30) return 'A1';
    if (uNum <= 70) return 'A2';
    if (uNum <= 120) return 'B1';
    if (uNum <= 166) return 'B2';
    if (uNum <= 196) return 'C1';
    return 'C2';
  }

  // 유닛 타이틀 정규화 헬퍼 (프리셋/노드 데이터 보강 및 'Unit X. 제목' 온전한 표기 보장)
  function resolveUnitTitle(u, uNum, lang) {
    let title = (u?.title || '').trim();

    if (!title || /^Unit\s*\d+$/i.test(title)) {
      const preset = window.UNIT_LIST_PRESETS?.[lang]?.find(p => p.unit === uNum)
        || window.UNIT_LIST_PRESETS?.en?.find(p => p.unit === uNum);
      if (preset && preset.title && !/^Unit\s*\d+$/i.test(preset.title)) {
        title = `Unit ${uNum}. ${preset.title}`;
      } else if (u?.nodes?.[0]?.title) {
        const cleanNodeTitle = u.nodes[0].title.replace(/^\d+과[:\s-]*/, '').trim();
        title = `Unit ${uNum}. ${cleanNodeTitle}`;
      } else if (u?.desc && !/^Unit\s*\d+/i.test(u.desc)) {
        title = `Unit ${uNum}. ${u.desc}`;
      } else {
        title = `Unit ${uNum}`;
      }
    }

    if (!/^Unit\s*\d+/i.test(title)) {
      title = `Unit ${uNum}. ${title}`;
    }

    return title;
  }

  // CEFR 레벨 기준 유닛 필터링 순수 함수 (5,000단어 DOM 무재렌더링 초고속 전환)
  function filterUnitsByLevel(targetLevel) {
    const container = document.getElementById('book-words-container');
    if (!container) return;

    const unitSections = container.querySelectorAll('.book-unit-container');
    let visibleCount = 0;

    unitSections.forEach(sec => {
      const secLevel = sec.dataset.level || 'A1';
      if (targetLevel === 'all' || secLevel === targetLevel) {
        sec.classList.remove('hidden');
        visibleCount++;
      } else {
        sec.classList.add('hidden');
      }
    });

    let emptyNotice = document.getElementById('book-level-empty-notice');
    if (visibleCount === 0) {
      if (!emptyNotice) {
        emptyNotice = document.createElement('div');
        emptyNotice.id = 'book-level-empty-notice';
        emptyNotice.className = 'py-12 px-4 text-center text-slate-400 text-xs font-medium';
        container.appendChild(emptyNotice);
      }
      emptyNotice.textContent = `선택하신 ${targetLevel} 레벨에 해당하는 유닛이 없습니다.`;
      emptyNotice.classList.remove('hidden');
    } else if (emptyNotice) {
      emptyNotice.classList.add('hidden');
    }
  }

  // 2-1. 상단 유닛 CEFR 레벨 필터 바 렌더링
  function renderUnitQuickNav(units, activeCourseId) {
    const container = document.getElementById('book-words-container');
    if (!container || !container.parentNode) return;

    let quickNav = document.getElementById('book-unit-quick-nav');
    if (!quickNav) {
      quickNav = document.createElement('nav');
      quickNav.id = 'book-unit-quick-nav';
      quickNav.className = 'flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar scroll-smooth';
      quickNav.setAttribute('aria-label', 'CEFR 레벨 필터');
      container.parentNode.insertBefore(quickNav, container);
    }

    quickNav.classList.remove('hidden');

    const activeLevel = quickNav.dataset.currentLevel || 'all';

    let chipsHtml = '';
    CEFR_LEVEL_PRESETS.forEach(lvl => {
      const isActive = (lvl.id === activeLevel);
      const activeClass = 'bg-primary text-white shadow-2xs font-bold';
      const inactiveClass = 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-primary font-semibold';
      chipsHtml += `
        <button type="button" class="book-unit-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${isActive ? activeClass : inactiveClass}" data-level="${lvl.id}">
          ${lvl.label}
        </button>
      `;
    });

    quickNav.innerHTML = chipsHtml;

    // 칩 클릭 이벤트 바인딩 (순수 DOM 필터링으로 5,000단어 무재렌더링 초고속 전환)
    const chips = quickNav.querySelectorAll('.book-unit-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const targetLevel = chip.dataset.level || 'all';
        quickNav.dataset.currentLevel = targetLevel;

        chips.forEach(c => {
          c.className = 'book-unit-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-primary';
        });
        chip.className = 'book-unit-chip active flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-primary text-white shadow-2xs';

        filterUnitsByLevel(targetLevel);
      });
    });

    filterUnitsByLevel(activeLevel);
  }

  // 2-2. 단어장 실시간 검색 핸들러 (5,000단어 디바운스 필터 및 플랫 리스트 렌더링)
  let _searchDebounceTimer = null;

  function handleBookSearch(query) {
    const trimmed = (query || '').trim().toLowerCase();
    const clearBtn = document.getElementById('book-search-clear-btn');
    const quickNav = document.getElementById('book-unit-quick-nav');
    const container = document.getElementById('book-words-container');
    if (!container) return;

    if (clearBtn) {
      if (trimmed) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    // 1) 검색어가 비어있는 경우: 기존 Unit 아코디언 목록 및 퀵 네비 복원
    if (!trimmed) {
      if (quickNav) quickNav.classList.remove('hidden');
      const searchWrap = document.getElementById('book-search-results-wrap');
      if (searchWrap) searchWrap.remove();
      const currentLevel = quickNav?.dataset.currentLevel || 'all';
      filterUnitsByLevel(currentLevel);
      return;
    }

    // 2) 검색어가 있는 경우: 퀵 네비 및 Unit 아코디언 숨김
    if (quickNav) quickNav.classList.add('hidden');
    container.querySelectorAll('.book-unit-container').forEach(el => el.classList.add('hidden'));
    const emptyNotice = document.getElementById('book-level-empty-notice');
    if (emptyNotice) emptyNotice.classList.add('hidden');
    container.querySelectorAll('.book-unit-container').forEach(el => el.classList.add('hidden'));

    // 검색 결과 래퍼 준비
    let searchWrap = document.getElementById('book-search-results-wrap');
    if (!searchWrap) {
      searchWrap = document.createElement('div');
      searchWrap.id = 'book-search-results-wrap';
      searchWrap.className = 'flex flex-col gap-2.5 w-full';
      container.prepend(searchWrap);
    }
    searchWrap.innerHTML = '';

    // 현재 활성화된 코스의 전체 단어 수집
    const activeCourse = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : null;
    const allWords = [];
    if (activeCourse && Array.isArray(activeCourse.units)) {
      activeCourse.units.forEach(u => {
        if (Array.isArray(u.words)) {
          allWords.push(...u.words);
        }
      });
    }

    // 스페인어 단어(word/term) 또는 한국어 뜻(meaning/korean/ko) 매칭 필터링
    const matchedWords = allWords.filter(w => {
      const term = String(w.word || w.term || '').toLowerCase();
      const meaning = String(w.meaning || w.korean || w.ko || '').toLowerCase();
      return term.includes(trimmed) || meaning.includes(trimmed);
    });

    // 3) 검색 결과 없음 뷰
    if (matchedWords.length === 0) {
      searchWrap.innerHTML = `
        <div id="book-search-empty-state" class="py-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl p-6 border border-slate-100 shadow-sm my-2">
          <span class="text-4xl mb-2">🔍</span>
          <p class="text-sm font-bold text-slate-800 mb-1">검색 결과가 없습니다</p>
          <p class="text-xs text-slate-400 font-medium">'${escapeHTML(trimmed)}'에 대한 단어를 찾을 수 없습니다.</p>
        </div>
      `;
      return;
    }

    // 4) 검색 결과 수 배지 및 플랫 단어 리스트 렌더링
    const countBadge = document.createElement('div');
    countBadge.className = 'flex items-center justify-between px-1 py-1 text-xs text-slate-500 font-medium';
    countBadge.innerHTML = `
      <span>검색 결과 <strong class="text-emerald-600 font-bold">${matchedWords.length}</strong>개</span>
      <span class="text-[11px] text-slate-400">전체 어휘 대상</span>
    `;
    searchWrap.appendChild(countBadge);

    let starredList = [];
    try {
      const rawStar = localStorage.getItem('vocadash_starred_words') || localStorage.getItem('vocadash_favorites') || localStorage.getItem('starredWords');
      if (rawStar) {
        const parsed = JSON.parse(rawStar);
        if (Array.isArray(parsed)) starredList = parsed;
      }
    } catch (_) { }

    const isPhoneticVisible = window.vocadashSettings ? !!window.vocadashSettings.showPhonetic : true;
    const phoneticStyle = isPhoneticVisible ? '' : 'style="display: none;"';

    renderUnitWordCards(searchWrap, matchedWords, '검색 결과', starredList, phoneticStyle);
    initBookScreenEvents();
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
    const oldSearchWrap = container.querySelector('#book-search-results-wrap');
    if (oldSearchWrap) oldSearchWrap.remove();

    const searchInput = document.getElementById('book-search-input');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      const clearBtn = document.getElementById('book-search-clear-btn');
      if (clearBtn) clearBtn.classList.add('hidden');
    }

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

      const unitFragment = document.createDocumentFragment();

      // 마스터된 단어 집합 (진도율 산출용)
      const masteredSet = new Set();
      try {
        const rawMastered = (lang && localStorage.getItem('vocadash_mastered_words_' + lang))
          || localStorage.getItem('vocadash_mastered_words')
          || localStorage.getItem('vocadash_learned_words');
        if (rawMastered) {
          const parsedArr = JSON.parse(rawMastered);
          if (Array.isArray(parsedArr)) {
            parsedArr.forEach((item) => {
              const id = String(item?.id || item?.word || item?.term || item || '').trim();
              if (id) masteredSet.add(id);
            });
          }
        }
      } catch (_) { }

      activeCourse.units.forEach((u, uIdx) => {
        const uNum = parseInt(u.unitNumber || u.unitId || u.unit || u.id, 10) || (uIdx + 1);
        const unitKey = 'unit-' + uNum;

        // 1:1 정확한 코스 유닛 단어 우선 매핑 (SSOT)
        const unitWords = (Array.isArray(u.words) && u.words.length > 0)
          ? u.words
          : ((typeof window !== 'undefined' && window.VOCA_DATA?.getWordsByUnit)
            ? window.VOCA_DATA.getWordsByUnit(unitKey)
            : (window.VOCA_DATA?.byUnit?.[unitKey] || []));

        const wordCount = (unitWords || []).length;
        const unitCefrLevel = getUnitCefrLevel(u, uNum, lang);
        const safeUnitTitle = escapeHTML(resolveUnitTitle(u, uNum, lang));

        // Rank 범위 및 유닛 진도율 계산
        let rankMin = Infinity;
        let rankMax = -Infinity;
        let masteredInUnit = 0;

        unitWords.forEach((w) => {
          const r = parseInt(w.rank, 10);
          if (!isNaN(r)) {
            if (r < rankMin) rankMin = r;
            if (r > rankMax) rankMax = r;
          }
          const wid = String(w.id || '').trim();
          const termStr = String(w.word || w.term || '').trim();
          if ((wid && masteredSet.has(wid)) || (termStr && masteredSet.has(termStr))) {
            masteredInUnit++;
          }
        });

        const rankRangeText = (rankMin !== Infinity && rankMax !== -Infinity)
          ? `Rank ${rankMin}~${rankMax}`
          : `Rank ${(uIdx * 30) + 1}~${(uIdx + 1) * 30}`;

        const unitProgressPercent = unitWords.length > 0
          ? Math.round((masteredInUnit / unitWords.length) * 100)
          : 0;

        // 초기 상태: 첫 번째 유닛(uIdx === 0)만 기본 펼침
        const isInitiallyOpen = uIdx === 0;

        const unitContainer = document.createElement('section');
        unitContainer.id = `book-unit-${uNum}-section`;
        unitContainer.className = 'book-unit-container mb-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200';
        unitContainer.dataset.unitNumber = String(uNum);
        unitContainer.dataset.level = unitCefrLevel;

        const catHeader = document.createElement('header');
        catHeader.className = `book-category-header flex items-center justify-between p-3.5 cursor-pointer select-none group transition-colors ${isInitiallyOpen ? 'bg-slate-50/80 border-b border-slate-100/90' : 'hover:bg-slate-50/80'}`;
        catHeader.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0 pr-2">
            <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex-shrink-0 shadow-2xs">
              ${iconPrefix} Unit ${uNum}
            </span>
            <div class="flex flex-col min-w-0">
              <h3 class="text-sm font-bold text-slate-800 tracking-tight truncate leading-tight group-hover:text-emerald-700 transition-colors">
                ${safeUnitTitle}
              </h3>
              <span class="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                ${rankRangeText} · 진도율 ${unitProgressPercent}%
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 text-slate-400">
            <span class="text-xs font-semibold text-slate-400">${wordCount}단어</span>
            <span class="material-symbols-outlined text-[20px] unit-toggle-icon transition-transform duration-200 ${isInitiallyOpen ? 'rotate-180 text-emerald-600' : ''}">
              expand_more
            </span>
          </div>
        `;

        const wordsListContainer = document.createElement('div');
        wordsListContainer.className = 'book-unit-words-wrap unit-word-list flex flex-col gap-2.5 px-3.5 pb-3.5 pt-2 border-t border-slate-100/80 bg-slate-50/30' + (isInitiallyOpen ? '' : ' hidden');

        // 해당 유닛 카드 마운트 클로저 (지연 렌더링 최적화)
        const mountThisUnitCards = () => {
          if (wordsListContainer.children.length === 0 && unitWords.length > 0) {
            renderUnitWordCards(wordsListContainer, unitWords, u.title, starredList, phoneticStyle);

            // 최하단 유닛 집중 단어 퀴즈 액션 버튼
            const quizActionBox = document.createElement('div');
            quizActionBox.className = 'mt-2 pt-2 border-t border-slate-100/90';
            quizActionBox.innerHTML = `
              <button type="button" class="btn-unit-quiz-action w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer" data-unit-num="${uNum}">
                <span class="material-symbols-outlined text-[16px]">play_circle</span>
                <span>Unit ${uNum} 집중 단어 퀴즈 풀기</span>
              </button>
            `;
            wordsListContainer.appendChild(quizActionBox);

            initBookScreenEvents();
          }
        };
        wordsListContainer._mountCards = mountThisUnitCards;

        // 첫 번째 유닛은 즉시 30단어 마운트
        if (isInitiallyOpen) {
          mountThisUnitCards();
        }

        catHeader.addEventListener('click', () => {
          const isCollapsed = wordsListContainer.classList.contains('hidden');
          const arrowIcon = catHeader.querySelector('.unit-toggle-icon');
          if (isCollapsed) {
            mountThisUnitCards();
            wordsListContainer.classList.remove('hidden');
            catHeader.classList.add('bg-slate-50/80', 'border-b', 'border-slate-100/90');
            if (arrowIcon) arrowIcon.classList.add('rotate-180', 'text-emerald-600');
          } else {
            wordsListContainer.classList.add('hidden');
            catHeader.classList.remove('bg-slate-50/80', 'border-b', 'border-slate-100/90');
            if (arrowIcon) arrowIcon.classList.remove('rotate-180', 'text-emerald-600');
          }
        });

        unitContainer.appendChild(catHeader);
        unitContainer.appendChild(wordsListContainer);
        unitFragment.appendChild(unitContainer);
      });

      if (ch2Toggle && ch2Toggle.parentNode === container) {
        container.insertBefore(unitFragment, ch2Toggle);
      } else {
        container.appendChild(unitFragment);
      }

      // 상단 가로 스크롤 유닛 퀵 네비게이션 점프 바 렌더링
      renderUnitQuickNav(activeCourse.units, activeCourse.id);

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

    const quickNav = document.getElementById('book-unit-quick-nav');
    if (quickNav) {
      quickNav.classList.add('hidden');
    }

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
    if (typeof window.loadWrongWords === 'function') {
      wrongList = (window.loadWrongWords(currentLang) || []).filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    } else {
      try {
        const rawWrong = localStorage.getItem('vocadash_wrong_words_' + currentLang) || localStorage.getItem('vocadash_wrong_answers_' + currentLang) || localStorage.getItem('vocadash_wrong_words');
        if (rawWrong) {
          const parsedWrong = JSON.parse(rawWrong);
          if (Array.isArray(parsedWrong)) {
            wrongList = parsedWrong.filter(w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5);
          }
        }
      } catch (_) { }
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
      const rawPron = item.pronunciation || item.pron || item.phonetic || '';
      const safePhonetic = escapeHTML(formatPronunciation(rawPron));
      const streak = Number(item.correctStreak) || 0;

      const safeTerm = escapeHTML(term);
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

    if (filterType === 'starred' || filterType === 'memorized' || filterType === 'unmemorized' || filterType === 'alpha' || filterType === 'alphabet') {
      bookScreen.querySelectorAll('.book-unit-words-wrap').forEach((wrap) => {
        if (typeof wrap._mountCards === 'function' && wrap.children.length === 0) {
          wrap._mountCards();
        }
      });
    }

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let masteredSet = null;
    if (filterType === 'memorized' || filterType === 'unmemorized') {
      masteredSet = new Set();
      try {
        const rawMastered = (currentLang && localStorage.getItem('vocadash_mastered_words_' + currentLang))
          || localStorage.getItem('vocadash_mastered_words')
          || localStorage.getItem('vocadash_learned_words');
        if (rawMastered) {
          const parsedArr = JSON.parse(rawMastered);
          if (Array.isArray(parsedArr)) {
            parsedArr.forEach((item) => {
              const id = String(item?.id || item?.word || item?.term || item || '').trim();
              if (id) masteredSet.add(id);
            });
          }
        }
      } catch (_) { }
    }

    const cards = bookScreen.querySelectorAll('.book-word-card');
    cards.forEach((card) => {
      const isStarred = !!card.querySelector('.book-star-btn.text-amber-400, .book-star-btn.text-amber-500, button[aria-label="즐겨찾기"].text-amber-400, button[aria-label="즐겨찾기"].text-amber-500');
      const cardTerm = card.dataset.term || '';
      const cardId = card.dataset.id || '';
      const isMastered = masteredSet ? ((cardId && masteredSet.has(cardId)) || (cardTerm && masteredSet.has(cardTerm))) : false;

      if (filterType === 'all') {
        card.classList.remove('hidden');
      } else if (filterType === 'starred') {
        if (isStarred) card.classList.remove('hidden');
        else card.classList.add('hidden');
      } else if (filterType === 'memorized') {
        if (isMastered) card.classList.remove('hidden');
        else card.classList.add('hidden');
      } else if (filterType === 'unmemorized') {
        if (!isMastered) card.classList.remove('hidden');
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

    // 6) 유닛 집중 단어 퀴즈 풀기 액션 버튼 바인딩
    const quizActionBtns = bookScreen.querySelectorAll('.btn-unit-quiz-action');
    quizActionBtns.forEach((btn) => {
      if (btn.dataset.quizBound === 'true') return;
      btn.dataset.quizBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const uNum = parseInt(btn.dataset.unitNum, 10) || 1;
        const activeCourse = (typeof window.getCurrentCourseData === 'function')
          ? window.getCurrentCourseData()
          : ((window.currentLanguage === 'en' ? window.courseData_en : window.courseData_es) || null);
        let targetNodeId = null;
        let unitWords = [];

        if (activeCourse && Array.isArray(activeCourse.units)) {
          const uObj = activeCourse.units.find(u => (parseInt(u.unitNumber || u.unitId || u.unit || u.id, 10) === uNum));
          if (uObj) {
            if (Array.isArray(uObj.words) && uObj.words.length > 0) {
              unitWords = uObj.words;
            }
            if (Array.isArray(uObj.nodes) && uObj.nodes.length > 0) {
              targetNodeId = uObj.nodes[0].id;
            }
          }
        }

        if (!targetNodeId) {
          const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          targetNodeId = (lang === 'en') ? `en_u${uNum}_n1` : `es_u${uNum}_n1`;
        }

        if (typeof window.openLessonModal === 'function') {
          window.openLessonModal(targetNodeId, uNum, unitWords);
        } else if (typeof window.openStageModal === 'function') {
          window.openStageModal(targetNodeId, uNum, unitWords);
        }
      });
    });

    // 7) 단어 검색 인풋 & 클리어 버튼 바인딩 (150ms 디바운스 실시간 검색)
    const searchInput = bookScreen.querySelector('#book-search-input') || document.getElementById('book-search-input');
    const searchClearBtn = bookScreen.querySelector('#book-search-clear-btn') || document.getElementById('book-search-clear-btn');

    if (searchInput && searchInput.dataset.searchBound !== 'true') {
      searchInput.dataset.searchBound = 'true';

      const onSearchInput = (e) => {
        if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
        const val = e.target.value;
        _searchDebounceTimer = setTimeout(() => {
          handleBookSearch(val);
        }, 150);
      };

      searchInput.addEventListener('input', onSearchInput);
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          handleBookSearch('');
        }
      });
    }

    if (searchClearBtn && searchClearBtn.dataset.clearBound !== 'true') {
      searchClearBtn.dataset.clearBound = 'true';
      searchClearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        handleBookSearch('');
      });
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
  target.handleBookSearch = handleBookSearch;

})(typeof window !== 'undefined' ? window : this);
