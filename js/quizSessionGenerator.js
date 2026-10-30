// =================================================
// VocaDash Quiz Session Generator Module (js/quizSessionGenerator.js)
// 스테이지 단어 풀 추출, 문제 세션 덱 빌더, 오답 선지(Distractor) 알고리즘,
// 문장 빈칸 채우기(Cloze) 퀴즈 생성 및 약점 단어 믹스
// =================================================

(function () {
  "use strict";

  function shuffleArray(arr) {
    const copy = Array.isArray(arr) ? arr.slice() : [];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  window.shuffleArray = shuffleArray;

  const WEAK_WORDS_STORAGE_KEY = 'vocadash_weak_word_ids';

  function getWeakWordIds() {
    try {
      const raw = localStorage.getItem(WEAK_WORDS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to get weak word IDs:', e);
      return [];
    }
  }
  window.getWeakWordIds = getWeakWordIds;

  function addWeakWordId(wordId) {
    if (!wordId) return;
    const sId = String(wordId).trim();
    if (!sId) return;
    try {
      const list = getWeakWordIds();
      if (!list.includes(sId)) {
        list.push(sId);
        localStorage.setItem(WEAK_WORDS_STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to add weak word ID:', e);
    }
  }
  window.addWeakWordId = addWeakWordId;

  function removeWeakWordId(wordId) {
    if (!wordId) return;
    const sId = String(wordId).trim();
    if (!sId) return;
    try {
      const list = getWeakWordIds();
      if (list.includes(sId)) {
        const updated = list.filter(id => id !== sId);
        localStorage.setItem(WEAK_WORDS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to remove weak word ID:', e);
    }
  }
  window.removeWeakWordId = removeWeakWordId;

  function findWordInCourse(wordId, course) {
    if (!wordId) return null;
    const checkCourse = (c) => {
      if (!c) return null;
      if (Array.isArray(c.units)) {
        for (const u of c.units) {
          if (Array.isArray(u.words)) {
            const found = u.words.find(w => w && w.id === wordId);
            if (found) return found;
          }
        }
      }
      if (Array.isArray(c.allWords)) {
        const found = c.allWords.find(w => w && w.id === wordId);
        if (found) return found;
      }
      return null;
    };

    let found = checkCourse(course);
    if (found) return found;

    const allCourses = [
      (typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null),
      window.courseData_es,
      window.courseData_en,
      window.packFootballData,
      window.courseData
    ];
    for (const c of allCourses) {
      found = checkCourse(c);
      if (found) return found;
    }
    return null;
  }
  window.findWordInCourse = findWordInCourse;

  function normalizeLessonId(id) {
    if (!id) return 'node-2';
    const s = String(id).trim().toLowerCase();
    if (s.includes('boss') || s.endsWith('_n6') || s === 'node-boss' || s === 'node-4') return 'node-boss';
    if (s.endsWith('_n5') || s === 'node-3') return 'node-3';
    if (s.endsWith('_n2') || s === 'node-2') return 'node-2';
    if (s.endsWith('_n1') || s === 'node-1') return 'node-1';
    if (s.includes('3')) return 'node-3';
    if (s.includes('1')) return 'node-1';
    return 'node-2';
  }

  window.normalizeLessonId = normalizeLessonId;

  // 단어 풀 격리 추출기: 현재 스테이지/유닛 내부에서만 단어 추출 (타 챕터 단어 보기 유출 차단)
  function getStageWordPool(lessonId, lang, sessionQuestions) {
    const targetCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : ((window.activeCourseId === 'pack_football' && window.packFootballData)
        ? window.packFootballData
        : ((window.COURSES && window.COURSES[lang]) ? window.COURSES[lang] : (window.courseData_es || window.courseData)));

    if (!targetCourse || !Array.isArray(targetCourse.units) || targetCourse.units.length === 0) {
      if (Array.isArray(sessionQuestions) && sessionQuestions.length > 0) return sessionQuestions;
      return [];
    }

    const rawLessonId = lessonId || (typeof currentGameLessonId !== 'undefined' ? currentGameLessonId : window.currentGameLessonId);
    const normId = normalizeLessonId(rawLessonId);
    const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || lang || 'es') === 'en' ? 'en' : 'es';
    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourseLang) : 1) || 1;
    const currentUnitIdx = (typeof window.currentUnitIndex === 'number' && !isNaN(window.currentUnitIndex))
      ? window.currentUnitIndex
      : Math.max(0, Math.min(targetCourse.units.length - 1, unlockedLevel - 1));

    let targetUnit = null;
    if (rawLessonId) {
      targetUnit = targetCourse.units.find(u => Array.isArray(u.nodes) && u.nodes.some(n => n.id === rawLessonId));
    }
    if (!targetUnit) {
      targetUnit = targetCourse.units[currentUnitIdx] || targetCourse.units[0];
    }

    let nodePool = [];
    if (targetUnit && Array.isArray(targetUnit.nodes)) {
      let matchedNode = null;
      if (rawLessonId) {
        matchedNode = targetUnit.nodes.find(n => n.id === rawLessonId);
      }
      if (!matchedNode) {
        if (normId === 'node-1') matchedNode = targetUnit.nodes.find(n => n.stageNumber === 1 || (n.id && n.id.endsWith('_n1')));
        else if (normId === 'node-2') matchedNode = targetUnit.nodes.find(n => n.stageNumber === 2 || (n.id && n.id.endsWith('_n2')));
        else if (normId === 'node-3') matchedNode = targetUnit.nodes.find(n => n.stageNumber === 3 || (n.id && n.id.endsWith('_n5')));
        else if (normId === 'node-boss') matchedNode = targetUnit.nodes.find(n => n.type === 'boss' || (n.id && n.id.endsWith('_n6')));
      }

      if (matchedNode && Array.isArray(matchedNode.wordIds) && Array.isArray(targetUnit.words)) {
        nodePool = targetUnit.words.filter(w => matchedNode.wordIds.includes(w.id));
      }
    }

    // 1. 노드 단어 풀이 4개 이상이면 현재 노드 단어들로만 엄격 격리
    if (nodePool.length >= 4) {
      return nodePool;
    }

    // 2. 현재 유닛 단어가 4개 이상이면 현재 유닛 단어들로만 격리
    if (targetUnit && Array.isArray(targetUnit.words) && targetUnit.words.length >= 4) {
      return targetUnit.words;
    }

    // 3. 전달된 세션 문제가 4개 이상이면 세션 문제 풀 사용
    if (Array.isArray(sessionQuestions) && sessionQuestions.length >= 4) {
      return sessionQuestions;
    }

    if (targetUnit && Array.isArray(targetUnit.words) && targetUnit.words.length > 0) {
      return targetUnit.words;
    }

    return (Array.isArray(targetCourse.allWords) && targetCourse.allWords.length > 0) ? targetCourse.allWords : [];
  }
  window.getStageWordPool = getStageWordPool;

  function getDistractorOptions(correctWord, sessionQuestions, lessonId, lang) {
    const rawLessonId = lessonId || (typeof currentGameLessonId !== 'undefined' ? currentGameLessonId : window.currentGameLessonId);
    const pool = getStageWordPool(
      rawLessonId,
      lang || window.currentLanguage || 'es',
      sessionQuestions || (typeof gameQuestions !== 'undefined' ? gameQuestions : window.currentSessionQuestions)
    );
    const correctId = correctWord ? (correctWord.id || '') : '';
    const correctMeaning = String(correctWord ? (correctWord.meaning || correctWord.answer || correctWord.korean || correctWord.ko || '') : '').trim();

    let candidates = pool.filter(w => {
      if (!w) return false;
      if (correctId && w.id === correctId) return false;
      const m = String(w.meaning || w.answer || w.korean || w.ko || '').trim();
      return m && m !== correctMeaning;
    });

    if (candidates.length < 3) {
      const targetCourse = (typeof window.getCurrentCourseData === 'function')
        ? window.getCurrentCourseData()
        : (window.courseData_es || window.courseData);
      const currentUnitIdx = (typeof window.currentUnitIndex === 'number' && !isNaN(window.currentUnitIndex))
        ? window.currentUnitIndex : 0;
      const unit = targetCourse && targetCourse.units && (targetCourse.units[currentUnitIdx] || targetCourse.units[0]);
      if (unit && Array.isArray(unit.words)) {
        const extra = unit.words.filter(w => {
          if (!w) return false;
          if (correctId && w.id === correctId) return false;
          const m = String(w.meaning || w.answer || w.korean || w.ko || '').trim();
          return m && m !== correctMeaning && !candidates.some(c => c.id === w.id);
        });
        candidates = candidates.concat(extra);
      }
    }

    return shuffleArray(candidates).slice(0, 3);
  }
  window.getDistractorOptions = getDistractorOptions;

  // 공통 스테이지 세션 문제 생성기 (이전 챕터 오답 2~3개 스마트 복습 혼합 시스템)
  function generateStageSession(lessonId = 'node-2', lang = 'es', roundIndex = 0) {
    const rawLessonId = lessonId || 'node-2';
    const normId = normalizeLessonId(rawLessonId);
    const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || lang || 'es') === 'en' ? 'en' : 'es';

    // 💡 약점 복습 노드 인입 시 전용 복습 세션 생성기로 즉시 라우팅
    if (normId === 'node-review' || String(rawLessonId).includes('review') || String(rawLessonId).endsWith('_n4')) {
      const coords = (typeof window.parseNodeCoordinates === 'function') ? window.parseNodeCoordinates(rawLessonId) : null;
      const uNum = (coords && coords.unitIndex) ? coords.unitIndex : ((typeof window.currentUnitNumber === 'number' ? window.currentUnitNumber : 1) || 1);
      return generateReviewSession(uNum, currentCourseLang);
    }

    const targetCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : ((window.COURSES && window.COURSES[lang]) ? window.COURSES[lang] : (window.courseData_es || window.courseData));

    if (!targetCourse || !Array.isArray(targetCourse.units) || targetCourse.units.length === 0) {
      return [];
    }

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourseLang) : 1) || 1;
    const currentUnitIdx = (typeof window.currentUnitIndex === 'number' && !isNaN(window.currentUnitIndex))
      ? window.currentUnitIndex
      : Math.max(0, Math.min(targetCourse.units.length - 1, unlockedLevel - 1));

    let targetUnit = null;
    if (rawLessonId) {
      targetUnit = targetCourse.units.find(u => Array.isArray(u.nodes) && u.nodes.some(n => n.id === rawLessonId));
    }
    if (!targetUnit) {
      targetUnit = targetCourse.units[currentUnitIdx] || targetCourse.units[0];
    }

    let pool = [];
    let matchedNode = null;
    if (targetUnit && Array.isArray(targetUnit.nodes)) {
      if (rawLessonId) {
        matchedNode = targetUnit.nodes.find(n => n.id === rawLessonId);
      }
      if (!matchedNode) {
        if (normId === 'node-1') matchedNode = targetUnit.nodes.find(n => n.stageNumber === 1 || (n.id && n.id.endsWith('_n1')));
        else if (normId === 'node-2') matchedNode = targetUnit.nodes.find(n => n.stageNumber === 2 || (n.id && n.id.endsWith('_n2')));
        else if (normId === 'node-3') matchedNode = targetUnit.nodes.find(n => n.stageNumber === 3 || (n.id && n.id.endsWith('_n5')));
        else if (normId === 'node-boss') matchedNode = targetUnit.nodes.find(n => n.type === 'boss' || (n.id && n.id.endsWith('_n6')));
      }

      if (matchedNode && Array.isArray(matchedNode.wordIds) && Array.isArray(targetUnit.words)) {
        pool = targetUnit.words.filter(w => matchedNode.wordIds.includes(w.id));
      }
    }

    if (pool.length === 0 && (normId === 'node-boss' || String(normId).includes('boss')) && Array.isArray(targetCourse.allWords) && targetCourse.allWords.length > 0) {
      pool = targetCourse.allWords.slice();
    }
    if (pool.length === 0 && targetUnit && Array.isArray(targetUnit.words)) {
      pool = targetUnit.words.slice();
    }
    if (pool.length === 0 && targetCourse.units[0] && Array.isArray(targetCourse.units[0].words)) {
      pool = targetCourse.units[0].words.slice();
    }

    if (pool.length === 0) return [];

    // 스마트 이전 챕터 오답 혼합 출제 시스템
    const weakWordIds = getWeakWordIds();
    const currentStageWordIds = new Set(pool.map(w => w.id).filter(Boolean));

    // 이전 챕터의 오답 단어만 선별 (현재 스테이지 단어는 제외)
    const eligibleWeakWords = [];
    for (const wid of weakWordIds) {
      if (!currentStageWordIds.has(wid)) {
        const wObj = findWordInCourse(wid, targetCourse);
        if (wObj && !eligibleWeakWords.some(ew => ew.id === wObj.id)) {
          eligibleWeakWords.push(wObj);
        }
      }
    }

    let selected = [];
    const isBossOrSpecial = (normId === 'node-boss' || String(normId).includes('boss') || String(normId).endsWith('_n6') || (matchedNode && matchedNode.type === 'boss'));

    if (isBossOrSpecial) {
      // ------------------------------------------------------------------
      // 보스전 파이널 챌린지: 문장 완전 배제, 순수 핵심 단어 16개 고정
      // (해당 유닛 핵심 단어 12~13개 + 누적 오답 복습 3~4개)
      // ------------------------------------------------------------------
      const targetCount = 16;
      const allUnitWords = (targetUnit && Array.isArray(targetUnit.words) && targetUnit.words.length > 0)
        ? targetUnit.words
        : pool;

      const shuffledUnitWords = shuffleArray(allUnitWords);
      const numCore = Math.min(shuffledUnitWords.length, 13);
      const coreWords = shuffledUnitWords.slice(0, numCore);

      // 누적 오답 복습 단어 최대 4개 우선 배치
      const weakList = [];
      for (const wid of weakWordIds) {
        const wObj = findWordInCourse(wid, targetCourse);
        if (wObj && !weakList.some(w => w.id === wObj.id) && !coreWords.some(w => w.id === wObj.id)) {
          weakList.push({
            ...wObj,
            isWeakReview: true,
            tag: '보스전 오답 복습'
          });
        }
        if (weakList.length >= 4) break;
      }

      // 부족한 분량은 유닛 단어 풀에서 중복 없이 보충하여 정확히 16문제 완성
      let baseWords = [...coreWords, ...weakList];
      let padIdx = 0;
      while (baseWords.length < targetCount && allUnitWords.length > 0) {
        const candidate = shuffledUnitWords[padIdx % shuffledUnitWords.length];
        if (!baseWords.some(w => (w.word || w.term || '').toLowerCase() === (candidate.word || candidate.term || '').toLowerCase())) {
          baseWords.push({ ...candidate });
        } else if (allUnitWords.length < targetCount) {
          baseWords.push({ ...candidate });
        }
        padIdx++;
        if (padIdx > 60) break;
      }

      // 문장(Cloze Test) 일체 배제하고 순수 단어 16개만 셔플
      selected = shuffleArray(baseWords).slice(0, targetCount);
    } else {

      // ------------------------------------------------------------------
      // 점진적 오답 누적 챌린지 시스템 (Progressive Weakness Challenge System)
      // 1회차: 기본 10단어 1:1 출제 (10문제, 더미/패딩 제거)
      // 2회차: 기본 10단어 + 최근 오답 3개 (부족 시 같은 유닛/이전 단어 보충, 총 13문제)
      // 3회차: 기본 10단어 + 누적 오답 3~5개 + 이전 노드 단어들 (총 14~15문제 마스터 챌린지)
      // ------------------------------------------------------------------

      // 회차(subStage / roundIndex) 판정 (1, 2, 3)
      let subStage = 1;
      if (typeof roundIndex === 'object' && roundIndex !== null) {
        if (typeof roundIndex.subStage === 'number') subStage = roundIndex.subStage;
        else if (typeof roundIndex.subStageIndex === 'number') subStage = roundIndex.subStageIndex + 1;
        else if (typeof roundIndex.round === 'number') subStage = roundIndex.round + 1;
      } else if (typeof roundIndex === 'number') {
        if (roundIndex === 0) subStage = 1;
        else if (roundIndex === 1) subStage = 2;
        else if (roundIndex >= 2) subStage = 3;
      } else if (typeof window.currentSubStageRound === 'number' && window.currentSubStageRound >= 1) {
        subStage = window.currentSubStageRound;
      }

      // 1) 기본 단어(baseWords)
      let baseWords = pool.slice();
      if (baseWords.length < 15 && targetUnit && Array.isArray(targetUnit.words)) {
        for (const w of targetUnit.words) {
          if (!baseWords.some(bw => bw.id === w.id || (bw.word || bw.term || '').toLowerCase() === (w.word || w.term || '').toLowerCase())) {
            baseWords.push(w);
            if (baseWords.length >= 15) break;
          }
        }
      }
      if (baseWords.length < 15 && pool.length > 0) {
        let pIdx = 0;
        const origBase = baseWords.slice();
        while (baseWords.length < 15) {
          baseWords.push({ ...origBase[pIdx % origBase.length] });
          pIdx++;
        }
      }

      const maxCount = window.isUnitSkipTestMode ? 15 : 10;
      if (baseWords.length > maxCount) {
        baseWords = baseWords.slice(0, maxCount);
      }
      const baseWordIds = new Set(baseWords.map(w => w.id).filter(Boolean));
      const baseWordTerms = new Set(baseWords.map(w => (w.word || w.term || '').toLowerCase()).filter(Boolean));

      // 2) 최근 누적 오답 단어 추출 (기본 단어와 겹치지 않는 단어들, 최신순)
      const recentWrongWords = [];
      const reversedWeakIds = [...weakWordIds].reverse();
      for (const wid of reversedWeakIds) {
        const wObj = findWordInCourse(wid, targetCourse);
        if (wObj) {
          const term = (wObj.word || wObj.term || '').toLowerCase();
          if (!baseWordIds.has(wObj.id) && !baseWordTerms.has(term) && !recentWrongWords.some(rw => rw.id === wObj.id || (rw.word || rw.term || '').toLowerCase() === term)) {
            recentWrongWords.push({
              ...wObj,
              isWeakReview: true,
              tag: '오답 복습'
            });
          }
        }
      }

      // vocadash_wrong_answers_${currentCourseLang} 에서도 보충
      try {
        const wrongRaw = localStorage.getItem(`vocadash_wrong_answers_${currentCourseLang}`) || localStorage.getItem('vocadash_wrong_answers_es');
        if (wrongRaw) {
          const parsedWrong = JSON.parse(wrongRaw);
          if (Array.isArray(parsedWrong)) {
            for (const item of [...parsedWrong].reverse()) {
              const wTerm = (item.word || item.term || '').toLowerCase();
              if (!baseWordTerms.has(wTerm) && !recentWrongWords.some(rw => (rw.word || rw.term || '').toLowerCase() === wTerm)) {
                const matchedInCourse = (item.id && findWordInCourse(item.id, targetCourse)) ||
                  (targetUnit?.words?.find(w => (w.word || w.term || '').toLowerCase() === wTerm)) ||
                  (targetCourse?.units?.flatMap(u => u.words || []).find(w => (w.word || w.term || '').toLowerCase() === wTerm));
                if (matchedInCourse) {
                  recentWrongWords.push({
                    ...matchedInCourse,
                    isWeakReview: true,
                    tag: '오답 복습'
                  });
                } else if (item.word && item.meaning) {
                  recentWrongWords.push({
                    id: item.id || `wrong_${wTerm}`,
                    word: item.word,
                    term: item.word,
                    meaning: item.meaning,
                    pronunciation: item.pronunciation || item.phonetic || '',
                    isWeakReview: true,
                    tag: '오답 복습'
                  });
                }
              }
            }
          }
        }
      } catch (_) { }

      // 3) 같은 유닛 내의 이전 노드 단어들(prevNodeWords) 및 기타 유닛 단어들(unitOtherWords)
      const prevNodeWords = [];
      const unitOtherWords = [];

      if (targetUnit && Array.isArray(targetUnit.nodes)) {
        const currentNodeIndex = matchedNode ? targetUnit.nodes.indexOf(matchedNode) : -1;
        targetUnit.nodes.forEach((n, nIdx) => {
          if (currentNodeIndex === -1 || nIdx < currentNodeIndex) {
            if (Array.isArray(n.wordIds) && Array.isArray(targetUnit.words)) {
              n.wordIds.forEach(wid => {
                const found = targetUnit.words.find(w => w && w.id === wid);
                if (found) {
                  const term = (found.word || found.term || '').toLowerCase();
                  if (!baseWordIds.has(found.id) && !baseWordTerms.has(term) && !prevNodeWords.some(pw => pw.id === found.id)) {
                    prevNodeWords.push(found);
                  }
                }
              });
            }
          }
        });
      }

      if (targetUnit && Array.isArray(targetUnit.words)) {
        targetUnit.words.forEach(w => {
          if (w) {
            const term = (w.word || w.term || '').toLowerCase();
            if (!baseWordIds.has(w.id) && !baseWordTerms.has(term)) {
              if (!unitOtherWords.some(uow => uow.id === w.id || (uow.word || uow.term || '').toLowerCase() === term)) {
                unitOtherWords.push(w);
              }
            }
          }
        });
      }

      const allOtherCourseWords = [];
      if (targetCourse && Array.isArray(targetCourse.units)) {
        targetCourse.units.forEach(u => {
          if (Array.isArray(u.words)) {
            u.words.forEach(w => {
              if (w) {
                const term = (w.word || w.term || '').toLowerCase();
                if (!baseWordIds.has(w.id) && !baseWordTerms.has(term) && !allOtherCourseWords.some(cw => (cw.word || cw.term || '').toLowerCase() === term)) {
                  allOtherCourseWords.push(w);
                }
              }
            });
          }
        });
      }

      // 회차별 분기 처리
      if (window.isUnitSkipTestMode) {
        selected = shuffleArray([...baseWords]).slice(0, 15);
      } else if (subStage === 1) {
        if (currentUnitIdx >= 1 && eligibleWeakWords.length > 0) {
          const numWeak = Math.min(eligibleWeakWords.length, 3);
          const weakSlice = eligibleWeakWords.slice(0, numWeak).map(w => ({
            ...w,
            isWeakReview: true,
            tag: '이전 챕터 오답 복습'
          }));

          const numBase = 10 - weakSlice.length;
          const baseSlice = shuffleArray(baseWords).slice(0, numBase);
          selected = shuffleArray([...baseSlice, ...weakSlice]);
        } else {
          // [1회차] 기본 10단어만 1:1 출제 (총 10문제, 더미/패딩 완전 제거)
          selected = shuffleArray([...baseWords]);
          if (selected.length > 10) {
            selected = selected.slice(0, 10);
          }
        }
      } else if (subStage === 2) {
        // [2회차] 목표 13문제: 기본 10단어 + 최근 오답 단어 3개 우선 추출
        // 만약 누적된 오답이 3개 미만이면 같은 유닛의 이전 단어에서 3개를 보충하여 총 13개 세트 구성
        const targetCount = 13;
        const additionalNeeded = Math.max(0, targetCount - baseWords.length);

        const wrongSlice = recentWrongWords.slice(0, additionalNeeded).map(w => ({
          ...w,
          isWeakReview: true,
          tag: '오답 복습'
        }));

        const stillNeeded = additionalNeeded - wrongSlice.length;
        const fillerList = [];

        if (stillNeeded > 0) {
          const availablePool = shuffleArray([...prevNodeWords, ...unitOtherWords, ...allOtherCourseWords]);
          for (const item of availablePool) {
            const term = (item.word || item.term || '').toLowerCase();
            if (!wrongSlice.some(w => (w.word || w.term || '').toLowerCase() === term) &&
              !fillerList.some(w => (w.word || w.term || '').toLowerCase() === term)) {
              fillerList.push({
                ...item,
                tag: '유닛 복습'
              });
              if (fillerList.length >= stillNeeded) break;
            }
          }
        }

        selected = shuffleArray([...baseWords, ...wrongSlice, ...fillerList]);
        if (selected.length > targetCount) {
          selected = selected.slice(0, targetCount);
        }
      } else {
        // [3회차] 최대 13단어 고정 (기본 10단어 + 누적 오답 3개)
        const targetCount = 13;
        const additionalNeeded = Math.max(0, targetCount - baseWords.length);

        const wrongCountToTake = Math.min(recentWrongWords.length, 3);
        const wrongSlice = recentWrongWords.slice(0, wrongCountToTake).map(w => ({
          ...w,
          isWeakReview: true,
          tag: '누적 오답 복습'
        }));

        const stillNeeded = Math.max(0, additionalNeeded - wrongSlice.length);
        const fillerList = [];

        if (stillNeeded > 0) {
          const availablePool = shuffleArray([...prevNodeWords, ...unitOtherWords, ...allOtherCourseWords]);
          for (const item of availablePool) {
            const term = (item.word || item.term || '').toLowerCase();
            if (!wrongSlice.some(w => (w.word || w.term || '').toLowerCase() === term) &&
              !fillerList.some(w => (w.word || w.term || '').toLowerCase() === term)) {
              fillerList.push({
                ...item,
                tag: '이전 학습 복습'
              });
              if (fillerList.length >= stillNeeded) break;
            }
          }
        }

        let combined = shuffleArray([...baseWords, ...wrongSlice, ...fillerList]);
        if (combined.length > targetCount) {
          combined = combined.slice(0, targetCount);
        }

        // 문장 강제 삽입(Cloze Test) 완전 제거 -> 순수 단어 13개 유지
        selected = combined;
      }
    }


    return selected.map((item, idx) => {
      const isSent = Boolean(item.type === 'sentence' || item.isSentence || (item.word && item.word.includes(' ') && item.word.length > 15));
      const wordStr = item.word || item.term || '';
      const meanStr = item.meaning || item.answer || item.korean || item.ko || '';
      const pronStr = item.pronunciation || item.pron || '';
      return {
        ...item,
        id: item.id || `q_${currentUnitIdx + 1}_${idx + 1}`,
        word: wordStr,
        term: wordStr,
        meaning: meanStr,
        pronunciation: pronStr,
        pron: pronStr,
        phonetic: item.phonetic || (pronStr ? `[${pronStr}]` : ''),
        example: item.example || item.exampleTarget || '',
        exampleTarget: item.example || item.exampleTarget || '',
        exampleKo: item.exampleKo || item.exampleMeaning || meanStr,
        exampleMeaning: item.exampleKo || item.exampleMeaning || meanStr,
        type: isSent ? 'sentence' : 'word',
        isSentence: isSent,
        isWeakReview: Boolean(item.isWeakReview),
        tag: item.tag || (isSent ? '실전 문장' : (targetUnit && targetUnit.title ? targetUnit.title.split('.')[0] : '핵심 어휘'))
      };
    });
  }
  window.generateStageSession = generateStageSession;
  window.createGameSession = generateStageSession;
  window.initStageWords = generateStageSession;

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 3/3 회차 피날레 빈칸 채우기(Cloze Test) 문제 생성기
  function generateClozeQuestionsForUnit(targetUnit, currentWords = [], currentCourse = 'es') {
    if (!targetUnit) return [];
    const clozeQuestions = [];

    // 1) targetUnit의 nodes 중 type === 'sentence' 또는 targetSentence를 가진 노드 수집
    const sentenceCandidates = [];
    if (Array.isArray(targetUnit.nodes)) {
      for (const n of targetUnit.nodes) {
        if (n && n.targetSentence) {
          sentenceCandidates.push({
            sentence: String(n.targetSentence).trim(),
            meaning: String(n.meaning || '').trim(),
            nodeId: n.id
          });
        }
      }
    }

    // 2) words 배열 내에 example, exampleTarget, targetSentence 또는 type === 'sentence'가 있는 경우 추가 수집
    const allUnitWords = (Array.isArray(targetUnit.words) && targetUnit.words.length > 0)
      ? targetUnit.words
      : (Array.isArray(currentWords) ? currentWords : []);

    for (const w of allUnitWords) {
      if (w.exampleTarget || w.example || w.targetSentence) {
        const sText = String(w.exampleTarget || w.example || w.targetSentence || '').trim();
        if (sText && sText.includes(' ') && sText.length >= 10 && !sentenceCandidates.some(c => c.sentence === sText)) {
          sentenceCandidates.push({
            sentence: sText,
            meaning: String(w.exampleMeaning || w.exampleKo || w.meaning || '').trim(),
            nodeId: w.id
          });
        }
      }
    }

    // fallback: 축구팩이나 특정 유닛 기본 문장 매핑
    if (sentenceCandidates.length === 0) {
      if (currentCourse === 'pack_football' || window.activeCourseId === 'pack_football') {
        sentenceCandidates.push({
          sentence: "Ponte las espinilleras antes de entrar.",
          meaning: "들어가기 전에 정강이 보호대를 착용해.",
          nodeId: "fb_cloze"
        });
      } else if (currentCourse === 'en') {
        sentenceCandidates.push({
          sentence: "Hello! How are you doing today?",
          meaning: "안녕하세요! 오늘 어떻게 지내세요?",
          nodeId: "en_cloze"
        });
      } else {
        sentenceCandidates.push({
          sentence: "¡Hola! ¿Cómo estás? Muy bien, gracias.",
          meaning: "안녕! 어떻게 지내? 아주 잘 지내, 고마워.",
          nodeId: "es_cloze"
        });
      }
    }

    // 3) 후보 문장에서 유닛 단어(vocabulary)와 매칭되는 단어를 찾아 [  ?  ] 로 블라인드 처리
    const cleanWordList = allUnitWords
      .map(w => ({
        id: w.id,
        word: String(w.word || w.term || '').trim(),
        meaning: String(w.meaning || w.korean || w.answer || '').trim(),
        pronunciation: String(w.pronunciation || w.pron || '').trim()
      }))
      .filter(w => w.word && w.word.length >= 3);

    // 긴 단어 우선 매칭 (예: 'espinilleras', 'por favor', 'estación')
    const sortedWordsByLen = cleanWordList.slice().sort((a, b) => b.word.length - a.word.length);

    for (const cand of sentenceCandidates) {
      const sentenceText = cand.sentence;

      // 해당 문장 내에 포함된 유닛 단어들 검색
      for (const matchedWord of sortedWordsByLen) {
        const cleanTerm = matchedWord.word.replace(/[¡!¿?.,]/g, '').trim();
        if (!cleanTerm || cleanTerm.length < 3) continue;

        const regex = new RegExp(`\\b${escapeRegExp(cleanTerm)}\\b`, 'i');
        const simpleIndex = sentenceText.toLowerCase().indexOf(cleanTerm.toLowerCase());

        if (regex.test(sentenceText) || simpleIndex !== -1) {
          // [  ?  ] 치환
          let maskedSentence = '';
          if (regex.test(sentenceText)) {
            maskedSentence = sentenceText.replace(regex, '[  ?  ]');
          } else {
            maskedSentence = sentenceText.substring(0, simpleIndex) + '[  ?  ]' + sentenceText.substring(simpleIndex + cleanTerm.length);
          }

          // 이미 등록된 문장인지 검사
          if (clozeQuestions.some(cq => cq.word === maskedSentence)) continue;

          // 오답 3개 선별: 같은 유닛의 다른 단어 3개
          const otherWords = cleanWordList.filter(w =>
            w.word.toLowerCase() !== cleanTerm.toLowerCase() &&
            w.word.toLowerCase() !== matchedWord.word.toLowerCase()
          );

          if (otherWords.length >= 3) {
            const shuffledOthers = shuffleArray(otherWords).slice(0, 3);
            const distractorWords = shuffledOthers.map(w => w.word);
            const choices = shuffleArray([cleanTerm, ...distractorWords]);

            clozeQuestions.push({
              id: `cloze_${cand.nodeId || 'c'}_${matchedWord.id || cleanTerm}`,
              word: maskedSentence,
              term: maskedSentence,
              answer: cleanTerm,
              targetWord: cleanTerm,
              meaning: matchedWord.meaning,
              korean: matchedWord.meaning,
              pronunciation: matchedWord.pronunciation,
              pron: matchedWord.pronunciation,
              example: sentenceText,
              targetSentence: sentenceText,
              type: 'sentence',
              isSentence: true,
              isCloze: true,
              choices: choices,
              tag: '피날레 빈칸 채우기'
            });

            if (clozeQuestions.length >= 2) break;
          }
        }
      }
      if (clozeQuestions.length >= 2) break;
    }

    return clozeQuestions;
  }
  window.generateClozeQuestionsForUnit = generateClozeQuestionsForUnit;

  // 4지선다 오답 보기 생성기 (현재 스테이지/유닛 단어 풀 엄격 격리)
  function generateQuestionChoices(q, sessionQuestions, lessonId = 'node-2', lang = 'es') {
    try {
      if (!q) return [];
      const correctMeaning = String(q.meaning || q.answer || q.korean || q.ko || '').trim();
      const rawLessonId = lessonId || (typeof currentGameLessonId !== 'undefined' ? currentGameLessonId : window.currentGameLessonId);
      const stagePool = getStageWordPool(rawLessonId, lang, sessionQuestions);

      // 현재 스테이지 단어 풀에서만 보기 추출 (타 챕터 단어 유출 차단)
      let candidates = stagePool
        .filter(w => {
          if (!w) return false;
          if (q.id && w.id === q.id) return false;
          const m = String(w.meaning || w.answer || w.korean || w.ko || '').trim();
          return m && m !== correctMeaning;
        })
        .map(w => String(w.meaning || w.answer || w.korean || w.ko || '').trim());

      let uniqueCandidates = Array.from(new Set(candidates));

      // 만약 3개 미만인 경우 현재 유닛 단어 풀로만 확장
      if (uniqueCandidates.length < 3) {
        const targetCourse = (typeof window.getCurrentCourseData === 'function')
          ? window.getCurrentCourseData()
          : (window.courseData_es || window.courseData);
        const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || lang || 'es') === 'en' ? 'en' : 'es';
        const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourseLang) : 1) || 1;
        const currentUnitIdx = (typeof window.currentUnitIndex === 'number' && !isNaN(window.currentUnitIndex))
          ? window.currentUnitIndex
          : Math.max(0, Math.min((targetCourse && targetCourse.units ? targetCourse.units.length - 1 : 0), unlockedLevel - 1));
        const currentUnit = targetCourse && targetCourse.units && targetCourse.units[currentUnitIdx];
        if (currentUnit && Array.isArray(currentUnit.words)) {
          const unitCandidates = currentUnit.words
            .filter(w => {
              if (!w) return false;
              if (q.id && w.id === q.id) return false;
              const m = String(w.meaning || w.answer || w.korean || w.ko || '').trim();
              return m && m !== correctMeaning;
            })
            .map(w => String(w.meaning || w.answer || w.korean || w.ko || '').trim());
          for (const uc of unitCandidates) {
            if (!uniqueCandidates.includes(uc)) uniqueCandidates.push(uc);
          }
        }
      }

      let distractors = shuffleArray(uniqueCandidates).slice(0, 3);
      if (distractors.length < 3) {
        const fallbacks = ['안녕하세요!', '감사합니다', '부탁합니다', '좋은 아침이에요', '미안해요', '잘 부탁해요', '얼마인가요?', '맛있어요'];
        for (const fb of fallbacks) {
          if (fb !== correctMeaning && !distractors.includes(fb)) {
            distractors.push(fb);
            if (distractors.length >= 3) break;
          }
        }
      }
      return shuffleArray([correctMeaning, ...distractors]);
    } catch (err) {
      console.warn('generateQuestionChoices error fallback:', err);
      const fallbackAns = String(q && (q.meaning || q.answer || '정답') || '정답').trim();
      return [fallbackAns, '감사합니다', '안녕하세요!', '좋은 아침이에요'];
    }
  }
  window.generateQuestionChoices = generateQuestionChoices;

  // 하위 호환성 레이어 (window.VOCA_DATA)
  if (!window.VOCA_DATA) window.VOCA_DATA = {};
  window.VOCA_DATA.generateStageSession = generateStageSession;
  window.VOCA_DATA.createGameSession = generateStageSession;
  window.VOCA_DATA.initStageWords = generateStageSession;
  window.VOCA_DATA.generateQuestionChoices = generateQuestionChoices;
  window.VOCA_DATA.getDistractorOptions = getDistractorOptions;
  window.VOCA_DATA.getStageWordPool = getStageWordPool;
  window.VOCA_DATA.getWeakWordIds = getWeakWordIds;
  window.VOCA_DATA.addWeakWordId = addWeakWordId;
  window.VOCA_DATA.removeWeakWordId = removeWeakWordId;
  if (!window.VOCA_DATA.database) {
    Object.defineProperty(window.VOCA_DATA, 'database', {
      configurable: true,
      get() {
        if (window._isResolvingVocaDatabase) return {};
        window._isResolvingVocaDatabase = true;
        try {
          const cd = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : (window.courseData_es || window.courseData);
          const units = (cd && Array.isArray(cd.units)) ? cd.units : [];
          return {
            'node-1': { title: units[0]?.title || '1과: 첫 만남과 감사', es: units[0]?.words || [], en: units[0]?.words || [] },
            'node-2': { title: units[1]?.title || '2과: 사과와 작별 인사', es: units[1]?.words || [], en: units[1]?.words || [], words: units[1]?.words || [], sentences: [] },
            'node-3': { title: units[2]?.title || '3과: 핵심 문장', es: units[2]?.words || [], en: units[2]?.words || [] },
            'node-boss': { title: units[3]?.title || 'Unit 1 보스전', es: units[3]?.words || (cd?.allWords || []), en: units[3]?.words || [] }
          };
        } finally {
          window._isResolvingVocaDatabase = false;
        }
      }
    });
  }
  if (!window.VOCA_DATA.words) {
    Object.defineProperty(window.VOCA_DATA, 'words', {
      configurable: true,
      get() {
        const cd = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : (window.courseData_es || window.courseData);
        return (cd && Array.isArray(cd.allWords)) ? cd.allWords : [];
      }
    });
  }


  // 해당 유닛(Unit)의 1과·2과 학습 단어 풀 추출 헬퍼 (퍼펙트 유저 복습 Fallback 전용)
  function getReviewFallbackWords(unitNum = 1, lang = 'es') {
    const currentLang = (lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const course = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : ((window.COURSES && window.COURSES[currentLang]) ? window.COURSES[currentLang] : (window.courseData_es || window.courseData));

    const targetUnit = course?.units?.find(u => (u.unitId || u.unitNumber || u.id) === unitNum)
      || course?.units?.[unitNum - 1]
      || course?.units?.[0];

    let pool = [];
    if (targetUnit) {
      const unitWords = Array.isArray(targetUnit.words) ? targetUnit.words : [];
      const stage1And2WordIds = [];
      if (Array.isArray(targetUnit.nodes)) {
        const s1 = targetUnit.nodes.find(n => n.stageNumber === 1 || (n.id && n.id.endsWith('_n1')) || (n.id && n.id.includes('stage-1')) || (n.id && n.id.includes('node-1')));
        const s2 = targetUnit.nodes.find(n => n.stageNumber === 2 || (n.id && n.id.endsWith('_n2')) || (n.id && n.id.includes('stage-2')) || (n.id && n.id.includes('node-2')));
        if (s1 && Array.isArray(s1.wordIds)) stage1And2WordIds.push(...s1.wordIds);
        if (s2 && Array.isArray(s2.wordIds)) stage1And2WordIds.push(...s2.wordIds);
      }
      if (stage1And2WordIds.length > 0) {
        pool = unitWords.filter(w => stage1And2WordIds.includes(w.id));
      }
      if (pool.length === 0) {
        pool = unitWords.slice(0, 20);
      }
    }

    if (pool.length === 0 && course && Array.isArray(course.allWords)) {
      pool = course.allWords.slice(0, 20);
    }
    return pool;
  }

  // 약점(오답) 복습 세션 전용 문제 생성기 (오답 우선 + 오답 0개 시 유닛 1·2과 핵심 단어 10개 완벽 주입)
  function generateReviewSession(unitNum = 1, lang = 'es') {
    const currentLang = (lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let wrongList = [];
    if (typeof window.loadWrongWords === 'function') {
      const loaded = window.loadWrongWords(currentLang) || [];
      wrongList = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    } else {
      try {
        const raw = localStorage.getItem('vocadash_wrong_words');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            wrongList = parsed.filter(w => (w.lang || 'es') === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5);
          }
        }
      } catch (_) { }
    }

    let selected = [];
    if (wrongList.length >= 10) {
      selected = shuffleArray([...wrongList]).slice(0, 10);
    } else if (wrongList.length >= 1) {
      const shuffledWrong = shuffleArray([...wrongList]);
      selected = [...shuffledWrong];
      const fallbackPool = shuffleArray(getReviewFallbackWords(unitNum, currentLang));
      let fIdx = 0;
      while (selected.length < 10 && fallbackPool.length > 0) {
        const candidate = fallbackPool[fIdx % fallbackPool.length];
        if (!selected.some(w => (w.word || w.term || '').toLowerCase() === (candidate.word || candidate.term || '').toLowerCase())) {
          selected.push(candidate);
        } else if (fallbackPool.length < 10) {
          selected.push({ ...candidate });
        }
        fIdx++;
        if (fIdx > 40) break;
      }
      let wIdx = 0;
      while (selected.length < 10 && wrongList.length > 0) {
        selected.push({ ...shuffledWrong[wIdx % shuffledWrong.length] });
        wIdx++;
      }
      selected = shuffleArray(selected);
    } else {
      // 🌟 오답 단어가 0개인 경우(퍼펙트 클리어 유저): 해당 유닛 1과·2과 핵심 단어 10개 추출
      const fallbackPool = shuffleArray(getReviewFallbackWords(unitNum, currentLang));
      let fIdx = 0;
      while (selected.length < 10 && fallbackPool.length > 0) {
        selected.push({ ...fallbackPool[fIdx % fallbackPool.length] });
        fIdx++;
      }
      selected = shuffleArray(selected);
    }

    return selected.slice(0, 10).map((item, idx) => ({
      id: item.id || `speedrun-q-${idx}`,
      word: item.term || item.word || '',
      term: item.term || item.word || '',
      meaning: item.meaning || item.kor || item.ko || '',
      phonetic: item.pronunciation || item.phonetic || '',
      correctStreak: Number(item.correctStreak) || 0,
      type: 'word',
      isSentence: false,
      tag: '약점 복습',
      isReviewMode: true,
      lang: item.lang || currentLang
    }));
  }

  // Window Exports
  window.shuffleArray = shuffleArray;
  window.getWeakWordIds = getWeakWordIds;
  window.addWeakWordId = addWeakWordId;
  window.removeWeakWordId = removeWeakWordId;
  window.findWordInCourse = findWordInCourse;
  window.normalizeLessonId = normalizeLessonId;
  window.getStageWordPool = getStageWordPool;
  window.getDistractorOptions = getDistractorOptions;
  window.getReviewFallbackWords = getReviewFallbackWords;
  window.generateReviewSession = generateReviewSession;
  window.generateStageSession = generateStageSession;
  window.generateClozeQuestionsForUnit = generateClozeQuestionsForUnit;
  window.generateQuestionChoices = generateQuestionChoices;

  window.quizSessionGenerator = {
    shuffleArray,
    getWeakWordIds,
    addWeakWordId,
    removeWeakWordId,
    findWordInCourse,
    normalizeLessonId,
    getStageWordPool,
    getDistractorOptions,
    getReviewFallbackWords,
    generateReviewSession,
    generateStageSession,
    generateDeckForStage: generateStageSession,
    generateClozeQuestionsForUnit,
    generateQuestionChoices
  };

  if (!window.VOCA_DATA) window.VOCA_DATA = {};
  window.VOCA_DATA.generateStageSession = generateStageSession;
  window.VOCA_DATA.generateQuestionChoices = generateQuestionChoices;
})();
