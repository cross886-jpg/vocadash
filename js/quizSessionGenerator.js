// =================================================
// VocaDash Quiz Session Generator (Clean & Optimized)
// 셔플 보장, 오답 복습 믹스, 4지선다 보기 생성
// =================================================

(function () {
  "use strict";

  // 1. 단어 배열 랜덤 셔플 (Fisher-Yates)
  function shuffleArray(arr) {
    const copy = Array.isArray(arr) ? arr.slice() : [];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  window.shuffleArray = shuffleArray;

  const WEAK_KEY = 'vocadash_weak_word_ids';

  function getWeakWordIds() {
    try {
      const raw = localStorage.getItem(WEAK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function addWeakWordId(wordId) {
    if (!wordId) return;
    try {
      const list = getWeakWordIds();
      if (!list.includes(String(wordId))) {
        list.push(String(wordId));
        localStorage.setItem(WEAK_KEY, JSON.stringify(list));
      }
    } catch (_) { }
  }

  function removeWeakWordId(wordId) {
    if (!wordId) return;
    try {
      const list = getWeakWordIds().filter(id => id !== String(wordId));
      localStorage.setItem(WEAK_KEY, JSON.stringify(list));
    } catch (_) { }
  }

  function findWordInCourse(wordId, course) {
    if (!wordId) return null;
    const courses = [
      course,
      window.getCurrentCourseData?.(),
      window.courseData_es,
      window.courseData_en,
      window.packFootballData,
      window.courseData
    ].filter(Boolean);

    for (const c of courses) {
      if (Array.isArray(c.units)) {
        for (const u of c.units) {
          const found = u.words?.find(w => w && w.id === wordId);
          if (found) return found;
        }
      }
      if (Array.isArray(c.allWords)) {
        const found = c.allWords.find(w => w && w.id === wordId);
        if (found) return found;
      }
    }
    return null;
  }

  function normalizeLessonId(id) {
    if (!id) return 'node-2';
    const s = String(id).toLowerCase();
    if (s.includes('boss') || s.endsWith('_n6') || s === 'node-boss') return 'node-boss';
    if (s.includes('review') || s.endsWith('_n4') || s === 'node-review') return 'node-review';
    if (s.includes('bonus') || (s.endsWith('_n3') && s.includes('bonus'))) return 'node-bonus';
    if (s.endsWith('_n5') || s.endsWith('node-3') || s.endsWith('stage-3')) return 'node-3';
    const match = s.match(/(?:node|stage|n|-)(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num === 1) return 'node-1';
      if (num === 2) return 'node-2';
      if (num === 3) return 'node-3';
      return 'node-' + num;
    }
    return 'node-2';
  }

  // 현재 스테이지/유닛에 배정된 단어 풀 추출
  function getStageWordPool(lessonId, lang) {
    const rawId = lessonId || window.currentGameLessonId || 'node-2';
    const normId = normalizeLessonId(rawId);
    const courseLang = (window.currentLanguage || lang || 'es') === 'en' ? 'en' : 'es';
    const course = window.getCurrentCourseData?.() || (courseLang === 'en' ? window.courseData_en : window.courseData_es) || window.courseData;

    if (!course || !Array.isArray(course.units) || course.units.length === 0) return [];

    const coords = (typeof window.parseNodeCoordinates === 'function') ? window.parseNodeCoordinates(rawId) : null;
    const targetUnitNum = coords ? coords.unitIndex : ((typeof window.currentUnitNumber === 'number' ? window.currentUnitNumber : 1));
    const unitIdx = typeof window.currentUnitIndex === 'number' ? window.currentUnitIndex : 0;
    let targetUnit = course.units.find(u => (u.unitNumber || u.unit) === targetUnitNum) ||
      course.units.find(u => u.nodes?.some(n => n.id === rawId));

    if (!targetUnit && typeof window.getUnitDataWithFallback === 'function') {
      const courseId = window.currentCourseId || window.activeCourseId || (courseLang === 'en' ? 'en_main' : 'es_main');
      targetUnit = window.getUnitDataWithFallback(courseId, targetUnitNum);
    }
    if (!targetUnit) {
      targetUnit = course.units[unitIdx] || course.units[0];
    }

    let nodePool = [];
    if (targetUnit?.nodes) {
      const node = targetUnit.nodes.find(n => n.id === rawId) ||
        targetUnit.nodes.find(n => (normId === 'node-1' && n.stageNumber === 1) ||
          (normId === 'node-2' && n.stageNumber === 2) ||
          (normId === 'node-3' && n.stageNumber === 3) ||
          (normId === 'node-boss' && n.type === 'boss'));
      if (node?.wordIds && targetUnit.words) {
        nodePool = targetUnit.words.filter(w => node.wordIds.includes(w.id));
      }
    }

    if (nodePool.length > 0) return nodePool;
    if (targetUnit?.words?.length > 0) return targetUnit.words;
    return course.allWords || [];
  }

  // 🎲 스테이지 세션 퀴즈 덱 생성 (플래시카드 순서 탈피: 무조건 셔플 보장)
  function generateStageSession(lessonId = 'node-2', lang = 'es', roundIndex = 0) {
    const rawLessonId = lessonId || 'node-2';
    const normId = normalizeLessonId(rawLessonId);
    const courseLang = (window.currentLanguage || window.currentActiveCourse || lang || 'es') === 'en' ? 'en' : 'es';

    // 복습 노드 인입 분기
    if (normId === 'node-review' || String(rawLessonId).includes('review')) {
      const uNum = (window.currentUnitNumber || 1);
      return generateReviewSession(uNum, courseLang);
    }

    const course = window.getCurrentCourseData?.() || (courseLang === 'en' ? window.courseData_en : window.courseData_es) || window.courseData;
    const rawPool = getStageWordPool(rawLessonId, courseLang);
    if (!rawPool || rawPool.length === 0) return [];

    // 스테이지 배정 단어 풀 (원본 불변 복사본)
    const pool = rawPool.slice();

    const isBoss = (normId === 'node-boss');
    let subStage = 1;
    if (typeof roundIndex === 'number') subStage = roundIndex + 1;
    else if (typeof window.currentSubStageRound === 'number') subStage = window.currentSubStageRound;

    const weakWordIds = getWeakWordIds();
    const currentWordIds = new Set(pool.map(w => w.id));
    const wrongList = weakWordIds
      .filter(wid => !currentWordIds.has(wid))
      .map(wid => findWordInCourse(wid, course))
      .filter(Boolean)
      .map(w => ({ ...w, isWeakReview: true, tag: '오답 복습' }));

    let selected = [];

    if (isBoss) {
      // 보스전 강화: 유닛 핵심 단어 15개 + 오답 최대 3개 (총 15~18개 출제)
      const core = pool.slice(0, 15);
      const wrong = Array.isArray(wrongList) ? wrongList.slice(0, 3) : [];
      selected = shuffleArray([...core, ...wrong]);
    } else if (subStage === 1) {
      // 1회차: 기본 10단어 정규 배정 (단어 예습 1~10번 순서 보존)
      selected = pool.slice(0, 10);
    } else if (subStage === 2) {
      // 2회차: 기본 10단어 + 최근 오답 3개 (총 13개)
      const wrong = wrongList.slice(0, 3);
      selected = [...pool.slice(0, 10), ...wrong];
    } else {
      // 3회차: 기본 10단어 + 누적 오답 3~4개 (총 13~14개)
      const wrong = wrongList.slice(0, 4);
      selected = [...pool.slice(0, 10), ...wrong];
    }

    return selected.map((item, idx) => {
      const wordStr = item.word || item.term || '';
      const meanStr = item.meaning || item.answer || item.korean || item.ko || '';
      const pronStr = item.pronunciation || item.pron || item.phonetic || '';
      const genderStr = item.gender === 'm' ? '남성' : (item.gender === 'f' ? '여성' : (item.gender || ''));
      const posStr = item.partOfSpeech || item.pos || '';
      const grammarHint = [genderStr, posStr].filter(Boolean).join(' · ');

      return {
        ...item,
        id: item.id || `q_${idx + 1}`,
        word: wordStr,
        term: wordStr,
        meaning: meanStr,
        pronunciation: pronStr,
        phonetic: pronStr ? `[${pronStr}]` : '',
        gender: item.gender || null,
        partOfSpeech: posStr || null,
        grammarHint: grammarHint || '',
        exampleTarget: item.exampleTarget || item.example || item.sentence || '',
        exampleMeaning: item.exampleMeaning || item.exampleKo || item.example_ko || item.sentenceKo || item.sentence_ko || '',
        type: 'word',
        isSentence: Boolean(item.type === 'sentence' || item.isSentence),
        isWeakReview: Boolean(item.isWeakReview),
        tag: item.tag || (grammarHint ? grammarHint : '핵심 어휘')
      };
    });
  }

  // 🎲 순수 오답 단어로만 10문제 큐(Queue) 빌드 유틸 (외부 일반 단어 혼입 원천 차단)
  function buildWeaknessQuizQueue(wrongWords, targetCount = 10) {
    if (!wrongWords || !Array.isArray(wrongWords) || wrongWords.length === 0) return [];
    const queue = [];
    while (queue.length < targetCount) {
      // 10개가 찰 때까지 오답 배열을 순환 추가
      const needed = targetCount - queue.length;
      const batch = shuffleArray([...wrongWords]);
      queue.push(...batch.slice(0, needed));
    }
    return queue;
  }

  // 📚 이미 학습한 단어 풀(현재 유닛 또는 직전 클리어한 유닛들) 추출 헬퍼
  function getLearnedWordsPool(unitNum = 1, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const course = window.getCurrentCourseData?.() || (courseLang === 'en' ? window.courseData_en : window.courseData_es) || window.courseData;
    const targetU = parseInt(unitNum, 10) || (window.currentUnitNumber || 1);
    const pool = [];

    // 1. 현재 유닛 및 직전 유닛 단어 우선 수집
    if (course && Array.isArray(course.units)) {
      for (let u = targetU; u >= 1; u--) {
        let uData = course.units.find(x => (x.unitNumber || x.unitId || x.unit || x.id) === u);
        if (!uData && typeof window.getUnitDataWithFallback === 'function') {
          const courseId = window.currentCourseId || window.activeCourseId || (courseLang === 'en' ? 'en_main' : 'es_main');
          uData = window.getUnitDataWithFallback(courseId, u);
        }
        if (uData && Array.isArray(uData.words) && uData.words.length > 0) {
          pool.push(...uData.words);
        }
      }
    }

    // 2. 단어 풀이 비어있다면 코스 전체 단어 또는 fallback 단어 보강
    if (pool.length === 0) {
      if (course && Array.isArray(course.allWords) && course.allWords.length > 0) {
        pool.push(...course.allWords);
      } else if (typeof window.getUnitDataWithFallback === 'function') {
        const courseId = window.currentCourseId || window.activeCourseId || (courseLang === 'en' ? 'en_main' : 'es_main');
        const fallbackUnit = window.getUnitDataWithFallback(courseId, targetU);
        if (fallbackUnit && Array.isArray(fallbackUnit.words)) {
          pool.push(...fallbackUnit.words);
        }
      }
    }

    return pool;
  }

  // 약점 복습 세션 생성기 (오답 0개 시 '랜덤 복습 모드' 안전 Fallback 지원)
  function generateReviewSession(unitNum = 1, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let wrongList = [];
    try {
      if (typeof window.loadWrongWords === 'function') {
        wrongList = window.loadWrongWords(courseLang) || [];
      } else {
        const raw = localStorage.getItem('vocadash_wrong_words_' + courseLang) ||
          localStorage.getItem('vocadash_wrong_answers_' + courseLang) ||
          localStorage.getItem('vocadash_wrong_words');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) wrongList = parsed;
        }
      }
    } catch (_) { }

    const activeWrongList = (Array.isArray(wrongList) ? wrongList : [])
      .filter(w => (w.lang || courseLang) === courseLang && !w.escaped && (w.correctStreak === undefined || Number(w.correctStreak) < 5));

    let queue = [];
    const isPureRandomReview = (activeWrongList.length === 0);

    if (activeWrongList.length >= 10) {
      // 10개 이상이면 순수 오답으로만 10개 생성
      queue = buildWeaknessQuizQueue(activeWrongList, 10);
    } else if (activeWrongList.length > 0) {
      // 1~9개로 부족한 경우: 오답을 먼저 넣고, 부족한 개수만큼 학습 완료 단어에서 채워 넣어 10문제 보장
      const wrongIds = new Set(activeWrongList.map(w => String(w.id || w.word || w.term)));
      const learnedPool = getLearnedWordsPool(unitNum, courseLang)
        .filter(w => !wrongIds.has(String(w.id || w.word || w.term)));
      const shuffledLearned = shuffleArray(learnedPool);

      queue = [...activeWrongList];
      const needed = 10 - queue.length;
      if (shuffledLearned.length > 0) {
        queue.push(...shuffledLearned.slice(0, needed));
      }
      // 그래도 부족하면(단어 풀이 극히 작은 경우) 순환하여 10개 완비
      while (queue.length < 10 && (activeWrongList.length > 0 || learnedPool.length > 0)) {
        const fillBatch = shuffleArray([...activeWrongList, ...learnedPool]);
        if (fillBatch.length === 0) break;
        queue.push(...fillBatch.slice(0, 10 - queue.length));
      }
      queue = shuffleArray(queue);
    } else {
      // 오답이 0개인 경우: 현재 유닛(또는 직전 유닛들) 학습 단어 중 10개를 랜덤 추출
      const learnedPool = getLearnedWordsPool(unitNum, courseLang);
      const shuffled = shuffleArray(learnedPool);
      queue = shuffled.slice(0, 10);
      while (queue.length < 10 && shuffled.length > 0) {
        queue.push(...shuffleArray(learnedPool).slice(0, 10 - queue.length));
      }
    }

    return queue.map((item, idx) => ({
      ...item,
      id: item.id || `review-q-${idx}`,
      word: item.term || item.word || '',
      term: item.term || item.word || '',
      meaning: item.meaning || item.kor || item.ko || '',
      phonetic: item.pronunciation || item.phonetic || '',
      type: 'word',
      tag: isPureRandomReview ? '랜덤 복습' : (item.escaped === false || activeWrongList.some(w => w.id === item.id) ? '약점 복습' : '핵심 복습'),
      isReviewMode: true,
      lang: item.lang || courseLang
    }));
  }

  // 4지선다 오답 보기 생성기 (현재 스테이지 풀 우선 격리)
  function generateQuestionChoices(q, sessionQuestions, lessonId = 'node-2', lang = 'es') {
    try {
      if (!q) return [];
      const correct = String(q.meaning || q.answer || q.korean || q.ko || '').trim();
      const stagePool = getStageWordPool(lessonId, lang);

      let candidates = stagePool
        .filter(w => w && w.id !== q.id)
        .map(w => String(w.meaning || w.answer || w.korean || w.ko || '').trim())
        .filter(m => m && m !== correct);

      let uniqueDistractors = Array.from(new Set(candidates));
      let distractors = shuffleArray(uniqueDistractors).slice(0, 3);

      if (distractors.length < 3) {
        const fallbacks = ['안녕하세요', '감사합니다', '부탁합니다', '좋은 아침이에요', '미안해요', '잘 부탁해요'];
        for (const fb of fallbacks) {
          if (fb !== correct && !distractors.includes(fb)) {
            distractors.push(fb);
            if (distractors.length >= 3) break;
          }
        }
      }
      return shuffleArray([correct, ...distractors]);
    } catch (_) {
      return [q.meaning || '정답', '감사합니다', '안녕하세요', '미안해요'];
    }
  }

  // 전역 등록 및 내보내기
  window.getWeakWordIds = getWeakWordIds;
  window.addWeakWordId = addWeakWordId;
  window.removeWeakWordId = removeWeakWordId;
  window.findWordInCourse = findWordInCourse;
  window.normalizeLessonId = normalizeLessonId;
  window.getStageWordPool = getStageWordPool;
  window.buildWeaknessQuizQueue = buildWeaknessQuizQueue;
  window.generateStageSession = generateStageSession;
  window.generateReviewSession = generateReviewSession;
  window.generateQuestionChoices = generateQuestionChoices;

  window.quizSessionGenerator = {
    shuffleArray,
    buildWeaknessQuizQueue,
    getWeakWordIds,
    addWeakWordId,
    removeWeakWordId,
    findWordInCourse,
    normalizeLessonId,
    getStageWordPool,
    generateReviewSession,
    generateStageSession,
    generateDeckForStage: generateStageSession,
    generateQuestionChoices
  };

  if (!window.VOCA_DATA) window.VOCA_DATA = {};
  window.VOCA_DATA.generateStageSession = generateStageSession;
  window.VOCA_DATA.generateQuestionChoices = generateQuestionChoices;
})();
