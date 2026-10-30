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
    if (s.endsWith('_n5') || s.includes('3')) return 'node-3';
    if (s.endsWith('_n1') || s.includes('1')) return 'node-1';
    return 'node-2';
  }

  // 현재 스테이지/유닛에 배정된 단어 풀 추출
  function getStageWordPool(lessonId, lang) {
    const rawId = lessonId || window.currentGameLessonId || 'node-2';
    const normId = normalizeLessonId(rawId);
    const courseLang = (window.currentLanguage || lang || 'es') === 'en' ? 'en' : 'es';
    const course = window.getCurrentCourseData?.() || (courseLang === 'en' ? window.courseData_en : window.courseData_es) || window.courseData;

    if (!course || !Array.isArray(course.units) || course.units.length === 0) return [];

    const unitIdx = typeof window.currentUnitIndex === 'number' ? window.currentUnitIndex : 0;
    const targetUnit = course.units.find(u => u.nodes?.some(n => n.id === rawId)) || course.units[unitIdx] || course.units[0];

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

    // 💡 핵심: 플래시카드 순서와 겹치지 않도록 단어 풀을 즉시 무작위 셔플
    const pool = shuffleArray(rawPool);

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
      // 보스전: 유닛 전체 단어 셔플 중 13개 + 오답 3개 (총 16개)
      const core = pool.slice(0, 13);
      const wrong = wrongList.slice(0, 3);
      selected = shuffleArray([...core, ...wrong]);
    } else if (subStage === 1) {
      // 1회차: 기본 10단어 랜덤 출제
      selected = pool.slice(0, 10);
    } else if (subStage === 2) {
      // 2회차: 기본 10단어 + 최근 오답 3개 (총 13개)
      const wrong = wrongList.slice(0, 3);
      selected = shuffleArray([...pool.slice(0, 10), ...wrong]);
    } else {
      // 3회차: 기본 10단어 + 누적 오답 3~4개 (총 13~14개)
      const wrong = wrongList.slice(0, 4);
      selected = shuffleArray([...pool.slice(0, 10), ...wrong]);
    }

    // 최종 출제 순서도 한 번 더 셔플하여 완전 무작위 보장
    return shuffleArray(selected).map((item, idx) => {
      const wordStr = item.word || item.term || '';
      const meanStr = item.meaning || item.answer || item.korean || item.ko || '';
      const pronStr = item.pronunciation || item.pron || item.phonetic || '';
      return {
        ...item,
        id: item.id || `q_${idx + 1}`,
        word: wordStr,
        term: wordStr,
        meaning: meanStr,
        pronunciation: pronStr,
        phonetic: pronStr ? `[${pronStr}]` : '',
        type: 'word',
        isSentence: false,
        isWeakReview: Boolean(item.isWeakReview),
        tag: item.tag || '핵심 어휘'
      };
    });
  }

  // 약점 복습 세션 생성기
  function generateReviewSession(unitNum = 1, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || 'es') === 'en' ? 'en' : 'es';
    let wrongList = [];
    try {
      const raw = localStorage.getItem('vocadash_wrong_words');
      if (raw) {
        wrongList = JSON.parse(raw).filter(w => (w.lang || 'es') === courseLang && !w.escaped);
      }
    } catch (_) { }

    const pool = getStageWordPool('node-1', courseLang);
    let selected = wrongList.length >= 10 ? wrongList.slice(0, 10) : [...wrongList, ...pool].slice(0, 10);

    return shuffleArray(selected).map((item, idx) => ({
      ...item,
      id: item.id || `review-q-${idx}`,
      word: item.term || item.word || '',
      term: item.term || item.word || '',
      meaning: item.meaning || item.kor || item.ko || '',
      phonetic: item.pronunciation || item.phonetic || '',
      type: 'word',
      tag: '약점 복습',
      isReviewMode: true
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
  window.generateStageSession = generateStageSession;
  window.generateReviewSession = generateReviewSession;
  window.generateQuestionChoices = generateQuestionChoices;

  window.quizSessionGenerator = {
    shuffleArray,
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
