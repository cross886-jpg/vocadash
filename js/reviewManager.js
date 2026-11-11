// ==============================================================================
// VocaDash Review & Weakness Words (오답노트 / 복습 관리) Module (js/reviewManager.js)
// 오답 단어 로드/저장/마이그레이션, 5연속 정답 졸업 판정, 복습 탭 UI 및 1분 스피드 런 전담
// ==============================================================================

(function (global) {
  'use strict';
  const target = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);

  // 발음 단일 대괄호 정규화 유틸 (중복 대괄호 방지 및 안전한 [발음] 형태 보장)
  function formatPhonetic(raw) {
    if (!raw) return '';
    const cleaned = String(raw).trim().replace(/^\[+|\]+$/g, '').trim();
    return cleaned ? `[${cleaned}]` : '';
  }

  const DEFAULT_WRONG_WORDS_ES = [
    { id: 'w_es_1', term: 'Adiós', meaning: '잘 가요', phonetic: '[아디오스]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 1, escaped: false, lang: 'es', unitId: 1 },
    { id: 'w_es_2', term: 'Equipaje', meaning: '수하물 / 짐', phonetic: '[에키파헤]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 2, escaped: false, lang: 'es', unitId: 2 },
    { id: 'w_es_3', term: 'Boleto', meaning: '티켓 / 표', phonetic: '[볼레토]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 1, escaped: false, lang: 'es', unitId: 2 },
    { id: 'w_es_4', term: 'Pasaporte', meaning: '여권', phonetic: '[파사포르테]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 1, escaped: false, lang: 'es', unitId: 2 },
    { id: 'w_es_5', term: 'Maleta', meaning: '여행 가방 / 캐리어', phonetic: '[말레타]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 2, escaped: false, lang: 'es', unitId: 2 },
    { id: 'w_es_6', term: 'Aduana', meaning: '세관', phonetic: '[아두아나]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 1, escaped: false, lang: 'es', unitId: 2 },
    { id: 'w_es_7', term: 'Vuelo', meaning: '항공편 / 비행', phonetic: '[부에글로]', consecutiveCorrect: 0, correctStreak: 0, streakCorrectCount: 0, wrongCount: 1, escaped: false, lang: 'es', unitId: 2 }
  ];
  const DEFAULT_WRONG_WORDS_EN = [];

  function getWrongStorageKey(lang) {
    const curLang = (lang || target.currentLanguage || target.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    return `vocadash_wrong_answers_${curLang}`;
  }

  function migrateLegacyWrongWords() {
    try {
      const legacy = localStorage.getItem('vocadash_wrong_words');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const esKey = 'vocadash_wrong_answers_es';
          const enKey = 'vocadash_wrong_answers_en';
          if (!localStorage.getItem(esKey)) {
            const esItems = parsed
              .filter(item => (typeof item === 'string' ? true : (item.lang || 'es') === 'es'))
              .map(item => {
                if (typeof item === 'string') {
                  return { id: item, term: item, meaning: '', phonetic: '', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' };
                }
                return { ...item, correctStreak: Number(item.correctStreak) || 0, lang: 'es' };
              });
            if (esItems.length > 0) {
              localStorage.setItem(esKey, JSON.stringify(esItems));
            }
          }
          if (!localStorage.getItem(enKey)) {
            const enItems = parsed
              .filter(item => typeof item !== 'string' && item.lang === 'en')
              .map(item => ({ ...item, correctStreak: Number(item.correctStreak) || 0, lang: 'en' }));
            if (enItems.length > 0) {
              localStorage.setItem(enKey, JSON.stringify(enItems));
            }
          }
        }
      }
    } catch (_) { }
  }
  migrateLegacyWrongWords();

  function loadWrongWords(targetLang) {
    const lang = (targetLang || target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const key = (typeof getWrongStorageKey === 'function') ? getWrongStorageKey(lang) : `vocadash_wrong_answers_${lang}`;
    try {
      let saved = localStorage.getItem(key) || localStorage.getItem(`vocadash_wrong_words_${lang}`);
      if (!saved && lang === 'es') {
        saved = localStorage.getItem('vocadash_wrong_words');
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item, idx) => {
              if (typeof item === 'string') {
                return {
                  id: String(item),
                  term: String(item),
                  word: String(item),
                  meaning: '',
                  phonetic: '',
                  consecutiveCorrect: 0,
                  correctStreak: 0,
                  streakCorrectCount: 0,
                  wrongCount: 1,
                  escaped: false,
                  lang: lang
                };
              }
              const termStr = String(item.term || item.word || '');
              const streak = typeof item.consecutiveCorrect === 'number'
                ? item.consecutiveCorrect
                : (typeof item.correctStreak === 'number'
                  ? item.correctStreak
                  : (parseInt(item.streakCorrectCount ?? item.consecutiveCorrect ?? item.correctStreak, 10) || 0));
              return {
                id: String(item.id || `w_${lang}_${idx + 1}`),
                term: termStr,
                word: String(item.word || termStr),
                meaning: String(item.meaning || item.kor || item.ko || ''),
                phonetic: formatPhonetic(item.phonetic || item.pronunciation),
                consecutiveCorrect: streak,
                correctStreak: streak,
                streakCorrectCount: streak,
                wrongCount: Number(item.wrongCount) || 1,
                escaped: !!item.escaped,
                unitId: item.unitId || item.unit || item.unitNumber,
                lang: item.lang || lang
              };
            })
            .filter((item) => item.lang === lang && (Number(item.consecutiveCorrect ?? item.correctStreak ?? item.streakCorrectCount) || 0) < 5);
        }
      }
    } catch (e) {
      console.warn('오답 단어 로드 파싱 오류 방어:', e);
    }
    return [];
  }

  function saveWrongWords(words, targetLang) {
    const lang = (targetLang || target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const key = getWrongStorageKey(lang);
    try {
      // 5회 연속 정답 달성한 단어는 완전 졸업(영구 삭제)
      const validated = (words || [])
        .filter(w => (Number(w.consecutiveCorrect ?? w.correctStreak ?? w.streakCorrectCount) || 0) < 5)
        .map((w, idx) => {
          const termStr = String(w.term || w.word || '');
          const streak = Number(w.consecutiveCorrect ?? w.correctStreak ?? w.streakCorrectCount) || 0;
          return {
            id: String(w.id || `w_${lang}_${idx + 1}`),
            term: termStr,
            word: String(w.word || termStr),
            meaning: String(w.meaning || w.kor || w.ko || ''),
            phonetic: formatPhonetic(w.phonetic || w.pronunciation),
            consecutiveCorrect: streak,
            correctStreak: streak,
            streakCorrectCount: streak,
            wrongCount: Number(w.wrongCount) || 1,
            escaped: !!w.escaped,
            unitId: w.unitId || w.unit || w.unitNumber,
            lang: w.lang || lang
          };
        });
      localStorage.setItem(key, JSON.stringify(validated));
      localStorage.setItem(`vocadash_wrong_words_${lang}`, JSON.stringify(validated));
      if (lang === 'es') {
        localStorage.setItem('vocadash_wrong_words', JSON.stringify(validated));
      }
    } catch (e) {
      console.warn('오답 단어 저장 실패:', e);
    }
  }

  function updateWrongWordsBadge() {
    const currentLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const list = (typeof loadWrongWords === 'function') ? loadWrongWords(currentLang) : (Array.isArray(target.wrongWords) ? target.wrongWords : []);
    target.wrongWords = list;
    const waitingWords = list.filter((w) => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    const count = waitingWords.length;
    if (typeof target.updateHeartsUI === 'function') {
      target.updateHeartsUI();
    }

    // 1) 하단 탭 빨간 뱃지 숫자 (#tab-review-badge)
    const tabBadge = document.getElementById('tab-review-badge');
    if (tabBadge) {
      tabBadge.textContent = count;
      if (count > 0) {
        tabBadge.classList.remove('hidden');
      } else {
        tabBadge.classList.add('hidden');
      }
    }

    // 1-B) 교재·단어장 오답 필터 칩 숫자 (#book-filter-wrong-count)
    const bookWrongCount = document.getElementById('book-filter-wrong-count');
    if (bookWrongCount) {
      bookWrongCount.textContent = String(count);
    }

    // 2) 상단 배너 '탈출 대기 중인 단어 N개' (#review-waiting-count-text)
    const waitingCountText = document.getElementById('review-waiting-count-text');
    if (waitingCountText) {
      waitingCountText.textContent = `탈출 대기 중인 단어 ${count}개`;
    }

    // 3) 필터 세그먼트 뱃지 (#review-filter-waiting-count, #review-filter-escaped-count)
    const filterWaitingBadge = document.getElementById('review-filter-waiting-count');
    if (filterWaitingBadge) {
      filterWaitingBadge.textContent = count;
    }
    const escapedCount = list.filter((w) => w.escaped).length;
    const filterEscapedBadge = document.getElementById('review-filter-escaped-count');
    if (filterEscapedBadge) {
      filterEscapedBadge.textContent = escapedCount;
    }

    // 4) 로드맵 화면 약점 복습(오답 탈출) 노드 UI 동기화
    if (typeof target.updateRoadmapNodesUI === 'function') {
      try {
        target.updateRoadmapNodesUI();
      } catch (_) { }
    }
  }

  // 인게임 문제 정답/오답 판정 및 연속 정답 5회(Mastery 5) 졸업 시스템
  function recordAnswerResult(question, isCorrect) {
    if (!question) return;
    try {
      const qTerm = (question.term || question.word || '').trim();
      const qId = question.id ? String(question.id).trim() : '';
      if (!qTerm && !qId) return;

      const lang = (question.lang || target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const list = loadWrongWords(lang);

      const itemIdx = list.findIndex(w => {
        if (qId && w.id && String(w.id) === qId) return true;
        if (qTerm && (w.term || w.word)) {
          return (w.term || w.word).trim().toLowerCase() === qTerm.toLowerCase();
        }
        return false;
      });

      if (isCorrect) {
        if (itemIdx !== -1) {
          const item = list[itemIdx];
          const nextStreak = (Number(item.consecutiveCorrect ?? item.correctStreak ?? item.streakCorrectCount) || 0) + 1;
          item.consecutiveCorrect = nextStreak;
          item.correctStreak = nextStreak;
          item.streakCorrectCount = nextStreak;

          if (nextStreak >= 5) {
            // 5회 연속 정답 시 오답 목록에서 완전히 삭제 (마스터 졸업)
            list.splice(itemIdx, 1);
            if (typeof target.showToast === 'function') {
              target.showToast(`마스터 완료! '${item.term}' 오답 노트에서 제외되었습니다 🎉`, '🎉');
            }
          }
          saveWrongWords(list, lang);
          const currentActiveLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          if (currentActiveLang === lang) {
            target.wrongWords = list;
            updateWrongWordsBadge();
            if (typeof renderReviewWords === 'function') {
              renderReviewWords(target.currentReviewFilter || 'waiting');
            }
          }
        }
      } else {
        // 문제 오답 시: 해당 단어의 consecutiveCorrect를 즉시 0으로 초기화
        if (itemIdx !== -1) {
          const item = list[itemIdx];
          item.consecutiveCorrect = 0;
          item.correctStreak = 0;
          item.streakCorrectCount = 0;
          item.wrongCount = (Number(item.wrongCount) || 1) + 1;
          item.escaped = false;
          if (!item.unitId) {
            item.unitId = question.unitId || question.unit || question.unitNumber || (typeof target.currentUnitNumber !== 'undefined' ? target.currentUnitNumber : 1);
          }
        } else {
          list.unshift({
            id: qId || ('w_' + lang + '_' + Date.now()),
            term: qTerm,
            word: qTerm,
            meaning: question.meaning || question.kor || question.ko || '뜻 없음',
            phonetic: formatPhonetic(question.phonetic || question.pronunciation || qTerm),
            consecutiveCorrect: 0,
            correctStreak: 0,
            streakCorrectCount: 0,
            wrongCount: 1,
            escaped: false,
            lang: lang,
            unitId: question.unitId || question.unit || question.unitNumber || (typeof target.currentUnitNumber !== 'undefined' ? target.currentUnitNumber : 1)
          });
        }
        saveWrongWords(list, lang);
        const currentActiveLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        if (currentActiveLang === lang) {
          target.wrongWords = list;
          updateWrongWordsBadge();
          if (typeof renderReviewWords === 'function') {
            renderReviewWords(target.currentReviewFilter || 'waiting');
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ recordAnswerResult 예외 방어:', err);
    }
  }

  function addWrongWord(wordObj) {
    recordAnswerResult(wordObj, false);
  }

  function getSortableWord(word) {
    if (!word || typeof word !== 'string') return '';
    return word.replace(/^[¿¡"'\(\[\s\-]+/g, '').trim().toLowerCase();
  }

  const SORT_MODES = [
    { id: 'wrong_desc', label: '🚨 오답 많은순' },
    { id: 'recent', label: '⏱️ 최신 오답순' },
    { id: 'alpha', label: '🔤 알파벳순' }
  ];
  let currentSortMode = 'wrong_desc';
  let currentReviewFilter = 'waiting';
  target.currentReviewFilter = currentReviewFilter;

  function sortWords(list, mode) {
    const arr = [...list];
    if (mode === 'wrong_desc') {
      arr.sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1));
    } else if (mode === 'recent') {
      arr.sort((a, b) => {
        const idA = String(a.id || '');
        const idB = String(b.id || '');
        return idB.localeCompare(idA);
      });
    } else if (mode === 'alpha' || mode === 'alphabet') {
      const curLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      arr.sort((a, b) => {
        const strA = getSortableWord(a.word || a.term);
        const strB = getSortableWord(b.word || b.term);
        return strA.localeCompare(strB, curLang, { sensitivity: 'base' });
      });
    }
    return arr;
  }

  function sortReviewWords(list = target.wrongWords, mode = currentSortMode) {
    const curLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const langList = (Array.isArray(list) ? list : []).filter(item => (item.lang || curLang) === curLang);
    return sortWords(langList, mode);
  }

  function escapeHTML(str) {
    if (typeof target.escapeHTML === 'function') return target.escapeHTML(str);
    return String(str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function renderReviewWords(filter = currentReviewFilter) {
    currentReviewFilter = filter;
    target.currentReviewFilter = filter;
    if (typeof updateReviewFilterTabs === 'function') {
      updateReviewFilterTabs(filter);
    }
    const container = document.getElementById('review-word-list');
    if (!container) return;

    const currentLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentWrongList = (Array.isArray(target.wrongWords) ? target.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );

    const baseWords = filter === 'escaped'
      ? currentWrongList.filter((w) => w.escaped)
      : currentWrongList.filter((w) => !w.escaped);

    const words = sortWords(baseWords, currentSortMode);

    if (words.length === 0) {
      container.innerHTML = `
        <div class="py-12 px-4 text-center bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 flex flex-col items-center">
          <span class="text-4xl mb-2">🎉</span>
          <p class="font-headline-sm font-bold text-on-surface">틀린 단어가 없습니다! 완벽해요 🎉</p>
          <p class="text-xs text-on-surface-variant mt-1">모든 단어를 완벽하게 마스터했어요.</p>
        </div>
      `;
      updateWrongWordsBadge();
      return;
    }

    container.innerHTML = words.map((w, idx) => {
      const word = w.term || w.word || '';
      const rawPhonetic = (w.phonetic || '').replace(/^\[+|\]+$/g, '').trim();
      const phoneticFormatted = rawPhonetic ? `[${rawPhonetic}]` : '';
      const isEscaped = !!w.escaped;
      const count = Number(w.wrongCount) || 1;
      const streak = Number(w.correctStreak) || 0;
      const badgeClass = isEscaped
        ? 'shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-[11px]'
        : 'shrink-0 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-semibold text-[11px]';
      const badgeText = isEscaped ? '🎉 탈출 완료' : `🚨 오답 ${count}회`;
      const streakHtml = (!isEscaped && streak > 0)
        ? `<span class="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] flex items-center gap-0.5"><span>⭐</span><span>연속 ${streak}/5</span></span>`
        : '';

      return `
      <div data-word-id="${escapeHTML(w.id || idx)}" data-term="${escapeHTML(word)}" class="review-word-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99] select-none">
        <!-- 1행: 표제어 + 발음 듣기 버튼 / 우측 오답 횟수 및 연속 정답 뱃지 -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
              ${escapeHTML(word)}
            </span>
            <button type="button" aria-label="발음 듣기" class="speaker-btn btn-review-audio text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center p-0.5" data-word="${escapeHTML(word)}" data-term="${escapeHTML(word)}">
              <span class="material-symbols-outlined text-[18px]">volume_up</span>
            </button>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${streakHtml}
            <span class="${badgeClass}">
              ${badgeText}
            </span>
          </div>
        </div>

        <!-- 2행: 한글 발음 기호 (무조건 단어 아래 독립된 행으로 고정) -->
        <p class="phonetic-hint review-word-phonetic text-xs font-normal text-slate-400 mt-1 select-none ${(!target.vocadashSettings || target.vocadashSettings.showPhonetic !== false) ? '' : 'hidden'}" style="${(!target.vocadashSettings || target.vocadashSettings.showPhonetic !== false) ? '' : 'display: none;'}">
          ${escapeHTML(phoneticFormatted)}
        </p>

        <!-- 3행: 한국어 뜻 -->
        <p class="text-sm font-medium text-slate-700 mt-1 leading-snug">
          ${escapeHTML(w.meaning || '')}
        </p>
      </div>
    `;
    }).join('');

    // 단어 카드 전체 클릭 시 safePlayTTS 호출 & 스피커 아이콘 펄스 애니메이션
    container.querySelectorAll('.review-word-card').forEach((card) => {
      card.onclick = function (e) {
        const term = this.dataset.term;
        const audioBtn = this.querySelector('.speaker-btn') || this.querySelector('.btn-review-audio');
        if (audioBtn) {
          audioBtn.classList.add('scale-125', 'text-emerald-600');
          setTimeout(() => {
            audioBtn.classList.remove('scale-125', 'text-emerald-600');
          }, 300);
        }
        const activeCourse = target.currentLanguage || target.currentActiveCourse || 'es';
        if (typeof target.safePlayTTS === 'function') {
          target.safePlayTTS(term, activeCourse, audioBtn);
        } else if (typeof target.speakWord === 'function') {
          target.speakWord(term, activeCourse, audioBtn);
        }
      };
    });

    updateWrongWordsBadge();
  }

  function updateReviewFilterTabs(activeTab) {
    const isWaiting = (activeTab === 'waiting');
    const filterWaitingBtn = document.getElementById('review-filter-waiting-btn') || document.getElementById('tab-review-pending');
    const filterEscapedBtn = document.getElementById('review-filter-escaped-btn') || document.getElementById('tab-review-escaped');

    if (filterWaitingBtn) {
      filterWaitingBtn.className = isWaiting
        ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xs font-bold text-slate-900 text-xs transition-all cursor-pointer'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-medium text-xs hover:text-slate-800 transition-colors cursor-pointer';

      const waitingLabel = filterWaitingBtn.querySelector('span:not([id]):not(.w-2)');
      if (waitingLabel) {
        waitingLabel.className = isWaiting ? 'font-bold' : 'font-medium';
      }

      const waitingDot = filterWaitingBtn.querySelector('.w-2');
      if (waitingDot) {
        waitingDot.className = isWaiting ? 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' : 'w-2 h-2 rounded-full bg-slate-300';
      }

      const waitingBadge = document.getElementById('review-filter-waiting-count');
      if (waitingBadge) {
        waitingBadge.className = isWaiting
          ? 'font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]'
          : 'font-medium px-1.5 py-0.5 rounded-full bg-slate-100/70 text-slate-500 text-[11px]';
      }
    }

    if (filterEscapedBtn) {
      filterEscapedBtn.className = !isWaiting
        ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xs font-bold text-slate-900 text-xs transition-all cursor-pointer'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-medium text-xs hover:text-slate-800 transition-colors cursor-pointer';

      const escapedLabel = filterEscapedBtn.querySelector('span:not([id]):not(.w-2)');
      if (escapedLabel) {
        escapedLabel.className = !isWaiting ? 'font-bold' : 'font-medium';
      }

      const escapedBadge = document.getElementById('review-filter-escaped-count');
      if (escapedBadge) {
        escapedBadge.className = !isWaiting
          ? 'font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]'
          : 'font-medium px-1.5 py-0.5 rounded-full bg-slate-100/70 text-slate-500 text-[11px]';
      }
    }
  }

  // 단어장 오답 연습 시작 로직 (하트 무제한, 전체 누적 오답 무작위 10문항)
  function startGameWithWords(words, options = {}) {
    if (typeof target.closeResultModal === 'function') target.closeResultModal();
    const currentLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const allStoredWrongs = loadWrongWords(currentLang) || [];
    const sourceList = (words && words.length > 0)
      ? words.filter((item) => (item.lang || currentLang) === currentLang)
      : allStoredWrongs.filter((item) => (item.lang || currentLang) === currentLang);

    target.isReviewGameMode = true;
    target.isRoadmapReviewSpeedrun = false;
    target.isVocaBookMode = true;
    if (typeof window !== 'undefined') window.isVocaBookMode = true;

    // 미졸업 오답 리스트 (유닛 제한 없는 전체 누적 오답 풀)
    const activeList = sourceList.filter(
      (w) => !w.escaped && (Number(w.consecutiveCorrect ?? w.correctStreak ?? w.streakCorrectCount) || 0) < 5
    );

    let session = [];
    const targetUnit = target.currentReviewUnitNumber || target.currentUnitNumber || 1;

    if (activeList.length === 0) {
      // 🌟 오답 0개 시: 완벽 복습 모드 안전 Fallback
      if (typeof target.showToast === 'function') {
        target.showToast('오답이 없습니다! 🌟 완벽 복습 런에 도전하세요', '👏');
      }
      if (typeof target.generateReviewSession === 'function') {
        session = target.generateReviewSession(targetUnit, currentLang);
      } else if (typeof window.generateReviewSession === 'function') {
        session = window.generateReviewSession(targetUnit, currentLang);
      }
    } else {
      // 전체 누적 오답 풀에서 무작위(Random) 추출 (최대 10개, 무패딩)
      const shuffleFn = (typeof target.shuffleArray === 'function')
        ? target.shuffleArray
        : (typeof window.quizSessionGenerator?.shuffleArray === 'function')
          ? window.quizSessionGenerator.shuffleArray
          : (arr) => [...arr].sort(() => Math.random() - 0.5);

      const shuffled = shuffleFn([...activeList]);
      const queue = shuffled.slice(0, Math.min(10, shuffled.length));
      queue.forEach((item, idx) => {
        const streak = Number(item.consecutiveCorrect ?? item.correctStreak ?? item.streakCorrectCount) || 0;
        session.push({
          ...item,
          id: item.id || `voca-review-q-${idx}`,
          word: item.term || item.word || '',
          term: item.term || item.word || '',
          meaning: item.meaning || '',
          phonetic: item.phonetic || '',
          consecutiveCorrect: streak,
          correctStreak: streak,
          streakCorrectCount: streak,
          type: 'word',
          isSentence: false,
          tag: '오답 복습',
          isReviewMode: true,
          isVocaBook: true,
          lang: currentLang
        });
      });
    }

    // 세션이 그래도 비어있다면 generateReviewSession 직접 호출
    if (!session || session.length === 0) {
      if (typeof target.generateReviewSession === 'function') {
        session = target.generateReviewSession(targetUnit, currentLang);
      } else if (typeof window.generateReviewSession === 'function') {
        session = window.generateReviewSession(targetUnit, currentLang);
      }
    }

    target.currentSessionQuestions = session;

    if (typeof target.openGameScreen === 'function') {
      target.openGameScreen('voca-book-practice', session, {
        mode: 'review',
        isInfiniteHeart: true,
        source: 'vocaBook',
        isRoadmap: false
      });
    }

    const titleEl = document.getElementById('game-stage-title');
    if (titleEl) {
      titleEl.textContent = '📖 단어장 · 무제한 오답 연습';
    }
  }

  const handleStartReview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const currentLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const allWrong = loadWrongWords(currentLang) || [];
    const currentWrongList = allWrong.filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const waitingWords = currentWrongList.filter(
      (w) => !w.escaped && (Number(w.consecutiveCorrect ?? w.correctStreak ?? w.streakCorrectCount) || 0) < 5
    );
    const targetList = waitingWords.length > 0 ? waitingWords : currentWrongList;
    startGameWithWords(targetList, { isReviewMode: true });
  };

  function initReviewEvents() {
    const filterWaitingBtn = document.getElementById('review-filter-waiting-btn') || document.getElementById('tab-review-pending');
    const filterEscapedBtn = document.getElementById('review-filter-escaped-btn') || document.getElementById('tab-review-escaped');

    if (filterWaitingBtn) {
      filterWaitingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateReviewFilterTabs('waiting');
        renderReviewWords('waiting');
      });
    }

    if (filterEscapedBtn) {
      filterEscapedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateReviewFilterTabs('escaped');
        renderReviewWords('escaped');
      });
    }

    const btnSortFilter = document.getElementById('btn-sort-filter');
    if (btnSortFilter) {
      btnSortFilter.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        let currentIdx = SORT_MODES.findIndex((m) => m.id === currentSortMode);
        currentIdx = (currentIdx + 1) % SORT_MODES.length;
        currentSortMode = SORT_MODES[currentIdx].id;

        const filterTextEl = document.getElementById('sort-filter-text');
        if (filterTextEl) {
          filterTextEl.textContent = SORT_MODES[currentIdx].label;
        }

        renderReviewWords(currentReviewFilter);
        if (typeof target.showToast === 'function') {
          target.showToast(`${SORT_MODES[currentIdx].label}으로 정렬되었습니다.`, '🔄');
        }
      });
    }

    const btnReviewSpeed = document.getElementById('btn-start-review-speed');
    if (btnReviewSpeed) {
      btnReviewSpeed.addEventListener('click', handleStartReview);
    }

    const catBannerTile = document.getElementById('review-cat-banner-tile');
    if (catBannerTile) {
      catBannerTile.addEventListener('click', handleStartReview);
      catBannerTile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleStartReview(e);
        }
      });
    }

    const catHeartBadge = document.getElementById('review-cat-heart-badge');
    if (catHeartBadge) {
      catHeartBadge.addEventListener('click', handleStartReview);
    }
  }

  // DOM 로드 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewEvents);
  } else {
    initReviewEvents();
  }

  // 초기 상태 로드
  target.wrongWords = loadWrongWords(target.currentLanguage || 'en');

  // Exports to Window / Global
  target.DEFAULT_WRONG_WORDS_ES = DEFAULT_WRONG_WORDS_ES;
  target.DEFAULT_WRONG_WORDS_EN = DEFAULT_WRONG_WORDS_EN;
  target.getWrongStorageKey = getWrongStorageKey;
  target.migrateLegacyWrongWords = migrateLegacyWrongWords;
  target.loadWrongWords = loadWrongWords;
  target.saveWrongWords = saveWrongWords;
  target.updateWrongWordsBadge = updateWrongWordsBadge;
  target.recordAnswerResult = recordAnswerResult;
  target.addWrongWord = addWrongWord;
  target.getSortableWord = getSortableWord;
  target.sortWords = sortWords;
  target.sortReviewWords = sortReviewWords;
  target.renderReviewWords = renderReviewWords;
  target.updateReviewFilterTabs = updateReviewFilterTabs;
  target.startGameWithWords = startGameWithWords;
  target.initReviewEvents = initReviewEvents;
  target.getWrongWords = (lang) => loadWrongWords(lang);
  target.getWrongWordList = (lang) => loadWrongWords(lang);
  target.wrong_words_store = {
    load: loadWrongWords,
    save: saveWrongWords,
    getAll: () => loadWrongWords(target.currentLanguage || 'en'),
    recordResult: recordAnswerResult
  };

})(typeof window !== 'undefined' ? window : this);
