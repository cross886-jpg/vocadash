// =================================================
// VocaDash Quiz Session Generator (Clean & Optimized)
// 셔플 보장, 오답 복습 믹스, 4지선다 보기 생성
// =================================================

(function () {
  "use strict";

  // 발음 단일 대괄호 정규화 유틸 (중복 대괄호 방지 및 안전한 [발음] 형태 보장)
  function formatPhonetic(raw) {
    if (!raw) return '';
    const cleaned = String(raw).trim().replace(/^\[+|\]+$/g, '').trim();
    return cleaned ? `[${cleaned}]` : '';
  }

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
    const curLang = ((typeof window !== 'undefined' && (window.currentLanguage || window.currentActiveCourse)) || 'en') === 'es' ? 'es' : 'en';
    const courses = [
      course,
      window.getCurrentCourseData?.(),
      (curLang === 'en' ? window.courseData_en : (window.courseData_es || window.courseData))
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
    if (s.includes('bonus') || /^(?:es|en|fb)_\d+_n3$/i.test(s)) return 'node-bonus';
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
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    const course = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : (courseLang === 'en' ? window.courseData_en : (window.courseData_es || window.courseData));

    const coords = (typeof window.parseNodeCoordinates === 'function') ? window.parseNodeCoordinates(rawId) : null;
    const targetUnitNum = coords ? coords.unitIndex : ((typeof window.currentUnitNumber === 'number' ? window.currentUnitNumber : 1));

    let targetUnit = course?.units?.find?.(u => parseInt(u.unitNumber || u.unit || u.id, 10) === targetUnitNum) ||
      course?.units?.find?.(u => u.nodes?.some(n => n.id === rawId));

    if (!targetUnit && typeof window.getUnitDataWithFallback === 'function') {
      const courseId = window.currentCourseId || window.activeCourseId || (courseLang === 'en' ? 'en_main' : 'es_main');
      targetUnit = window.getUnitDataWithFallback(courseId, targetUnitNum);
    }
    if (!targetUnit && course?.units) {
      const unitIdx = typeof window.currentUnitIndex === 'number' ? window.currentUnitIndex : 0;
      targetUnit = course.units[unitIdx] || course.units[0];
    }

    let nodePool = [];
    if (targetUnit?.nodes) {
      const node = targetUnit.nodes.find(n => n.id === rawId) ||
        targetUnit.nodes.find(n => (normId === 'node-1' && n.stageNumber === 1) ||
          (normId === 'node-2' && n.stageNumber === 2) ||
          (normId === 'node-3' && n.stageNumber === 3) ||
          (normId === 'node-boss' && n.type === 'boss'));
      if (node?.wordIds && Array.isArray(targetUnit.words)) {
        nodePool = targetUnit.words.filter(w => node.wordIds.includes(w.id));
      }
    }

    if (nodePool.length > 0) return nodePool;

    // 노드별 기본 슬라이스 (1과: 0~10, 2과: 10~20, 3과: 20~30, 보스전: 0~15)
    const baseWords = targetUnit?.words || [];
    if (baseWords.length > 0) {
      if (normId === 'node-1') return baseWords.slice(0, 10);
      if (normId === 'node-2') return baseWords.length >= 20 ? baseWords.slice(10, 20) : baseWords.slice(0, 10);
      if (normId === 'node-3') return baseWords.length >= 30 ? baseWords.slice(20, 30) : baseWords.slice(0, 10);
      if (normId === 'node-boss') return baseWords.slice(0, 15);
      return baseWords.slice(0, 10);
    }

    if (course?.allWords?.length > 0) return course.allWords;
    return [];
  }

  // 🎲 스테이지 세션 퀴즈 덱 생성 (플래시카드 순서 탈피: 무조건 셔플 보장)
  function generateStageSession(lessonId = 'node-2', lang = 'en', roundIndex = 0) {
    const rawLessonId = lessonId || 'node-2';
    const normId = normalizeLessonId(rawLessonId);
    const courseLang = (window.currentLanguage || window.currentActiveCourse || lang || 'en') === 'es' ? 'es' : 'en';

    // 복습 노드 인입 분기
    if (normId === 'node-review' || String(rawLessonId).includes('review')) {
      const coords = (typeof window.parseNodeCoordinates === 'function') ? window.parseNodeCoordinates(rawLessonId) : null;
      const uNum = coords ? coords.unitIndex : (window.currentUnitNumber || 1);
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
        phonetic: formatPhonetic(item.phonetic || pronStr),
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

  // 🎲 순수 오답 단어로만 퀴즈 큐 빌드 (외부 일반 단어 혼입 및 억지 패딩 금지)
  function buildWeaknessQuizQueue(wrongWords, targetCount = 10) {
    if (!wrongWords || !Array.isArray(wrongWords) || wrongWords.length === 0) return [];
    const count = parseInt(targetCount, 10) || 10;
    if (wrongWords.length >= count) {
      const sorted = [...wrongWords].sort((a, b) => (Number(b.wrongCount ?? b.count ?? 1)) - (Number(a.wrongCount ?? a.count ?? 1)));
      return shuffleArray(sorted.slice(0, count));
    }
    const result = [...wrongWords];
    while (result.length < count) {
      result.push(wrongWords[Math.floor(Math.random() * wrongWords.length)]);
    }
    return shuffleArray(result);
  }

  // 📚 특정 유닛(Unit)에 속한 전체 단어 목록 추출 유틸
  function getUnitWords(unitNum = 1, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    const targetU = parseInt(unitNum, 10) || (window.currentUnitNumber || 1);

    const course = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : (courseLang === 'en' ? window.courseData_en : (window.courseData_es || window.courseData));

    let uData = null;
    if (course && Array.isArray(course.units)) {
      uData = course.units.find(x => parseInt(x.unitNumber || x.unitId || x.unit || x.id, 10) === targetU);
    }
    if (!uData && typeof window.getUnitDataWithFallback === 'function') {
      const courseId = window.currentCourseId || window.activeCourseId || (courseLang === 'en' ? 'en_main' : 'es_main');
      uData = window.getUnitDataWithFallback(courseId, targetU);
    }
    if (uData && Array.isArray(uData.words) && uData.words.length > 0) {
      return uData.words;
    }

    return [];
  }

  // 📚 이미 학습한 단어 풀(현재 유닛 또는 직전 클리어한 유닛들) 추출 헬퍼
  function getLearnedWordsPool(unitNum = 1, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    const targetU = parseInt(unitNum, 10) || (window.currentUnitNumber || 1);
    const pool = [];

    // 1. 현재 유닛 및 직전 유닛 단어 수집
    for (let u = targetU; u >= 1; u--) {
      const uWords = getUnitWords(u, courseLang);
      if (Array.isArray(uWords) && uWords.length > 0) {
        pool.push(...uWords);
      }
    }

    // 2. 단어 풀이 비어있다면 코스 전체 단어 보강
    if (pool.length === 0) {
      const course = (typeof window.getCurrentCourseData === 'function')
        ? window.getCurrentCourseData()
        : (courseLang === 'en' ? window.courseData_en : (window.courseData_es || window.courseData));
      if (course && Array.isArray(course.allWords) && course.allWords.length > 0) {
        return course.allWords;
      }
    }
    return pool;
  }

  // 오답 스테이지 단어 풀 생성 로직 (10문제 고정 풀이 시스템)
  function buildReviewQuestionQueue(unitId, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    const targetU = parseInt(unitId, 10) || (window.currentUnitNumber || 1);

    // 1. 현재 저장된 유효 오답 리스트 조회
    let wrongWords = [];
    try {
      if (typeof window.loadWrongWords === 'function') {
        wrongWords = window.loadWrongWords(courseLang) || [];
      } else {
        const raw = localStorage.getItem('vocadash_wrong_answers_' + courseLang) ||
          localStorage.getItem('vocadash_wrong_words_' + courseLang) ||
          localStorage.getItem('vocadash_wrong_words');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) wrongWords = parsed;
        }
      }
    } catch (_) { }

    const unitWords = getUnitWords(targetU, courseLang);
    const normalizeTerm = (s) => String(s || '').replace(/[¡!¿?.,\s]/g, '').toLowerCase();
    const unitWordIds = new Set(unitWords.map(w => String(w.id || '').toLowerCase()));
    const unitWordTerms = new Set(unitWords.map(w => normalizeTerm(w.word || w.term)));

    // 현재 챕터(Unit)에 해당하는 오답만 엄격하게 격리 필터링
    const chapterWrongList = (Array.isArray(wrongWords) ? wrongWords : [])
      .filter(w => {
        if (!w) return false;
        if ((w.lang || courseLang) !== courseLang) return false;
        if (w.escaped) return false;
        if (w.correctStreak !== undefined && Number(w.correctStreak) >= 5) return false;

        // 1) 명시적 unitId 매칭
        const wUnit = parseInt(w.unitId || w.unit || w.unitNumber, 10);
        if (wUnit) return wUnit === targetU;

        // 2) 현재 유닛 단어 ID 매칭
        const wId = String(w.id || '').toLowerCase();
        if (wId && unitWordIds.has(wId)) return true;

        // 3) 현재 유닛 단어 텍스트(term) 매칭
        const wTerm = normalizeTerm(w.word || w.term);
        if (wTerm && unitWordTerms.has(wTerm)) return true;

        // 4) ID 패턴 매칭 (예: dummy_..._u1_..., u1_..., es_101)
        if (wId) {
          if (wId.includes(`_u${targetU}_`) || wId.startsWith(`u${targetU}_`)) return true;
          const reg = new RegExp(`^e[sn]_${targetU}\\d+`, 'i');
          if (reg.test(wId)) return true;
        }

        // 5) unit 정보가 없는 mock 오답은 Unit 1 기본 수용
        if (!wUnit && targetU === 1) return true;

        return false;
      });

    // =========================================================================
    // 규칙 1. 오답이 10개 이상인 경우:
    // 누적 오답 횟수(틀린 횟수) 기준 내림차순으로 정렬하여 가장 많이 틀린 상위 10개 단어를 선별하여 출제
    // =========================================================================
    if (chapterWrongList.length >= 10) {
      const sorted = [...chapterWrongList].sort((a, b) => {
        const countA = Number(a.wrongCount ?? a.count ?? 1);
        const countB = Number(b.wrongCount ?? b.count ?? 1);
        return countB - countA;
      });
      return shuffleArray(sorted.slice(0, 10));
    }

    // =========================================================================
    // 규칙 2. 오답이 1~9개인 경우 (예: 3개):
    // 보유한 오답 단어들을 반드시 포함하되, 총 10문제가 될 때까지 해당 오답 단어 풀 내에서
    // 무작위로 반복 보충하여 10문제를 구성한 뒤 셔플
    // =========================================================================
    if (chapterWrongList.length > 0) {
      const result = [...chapterWrongList];
      while (result.length < 10) {
        const randomPick = chapterWrongList[Math.floor(Math.random() * chapterWrongList.length)];
        result.push(randomPick);
      }
      return shuffleArray(result);
    }

    // =========================================================================
    // 규칙 3. 해당 챕터(Unit)에 오답이 0개인 경우 (클린 상태):
    // - 이전 챕터(Unit 1 ~ 현재 Unit - 1)의 전체 단어 풀에서 무작위(랜덤)로 10문제를 추출하여 누적 복습 세션 구성
    // - 단, 현재가 Unit 1이라 이전 챕터가 없는 경우에는 현재 Unit 1의 선행 스테이지(1과/2과) 단어들 중에서 랜덤 10문제를 추출
    // =========================================================================
    let candidatePool = [];

    if (targetU > 1) {
      // 3-A. 이전 챕터(Unit 1 ~ Unit targetU - 1)의 전체 단어 풀 수집
      for (let u = 1; u < targetU; u++) {
        const wordsOfU = getUnitWords(u, courseLang);
        if (Array.isArray(wordsOfU) && wordsOfU.length > 0) {
          candidatePool.push(...wordsOfU);
        }
      }
    } else {
      // 3-B. 현재가 Unit 1인 경우: 선행 스테이지(1과/2과, 즉 첫 20개 단어)에서 수집
      const u1Words = (Array.isArray(unitWords) && unitWords.length > 0)
        ? unitWords
        : getUnitWords(1, courseLang);
      candidatePool = u1Words.slice(0, 20);
    }

    // 만약 이전 챕터나 선행 스테이지 단어가 부족할 경우 현재 유닛 전체 풀로 보강
    if (candidatePool.length === 0) {
      candidatePool = (Array.isArray(unitWords) && unitWords.length > 0) ? unitWords : getLearnedWordsPool(targetU, courseLang);
    }
    if (candidatePool.length === 0) {
      const defaultPool = getStageWordPool(`u${targetU}_stage-1`, courseLang);
      candidatePool = (defaultPool && defaultPool.length > 0) ? defaultPool : [];
    }

    if (candidatePool.length === 0) return [];

    // candidatePool에서 무작위(랜덤)로 10문제 추출 (풀 크기가 10개 미만일 경우 반복 보충)
    const shuffledPool = shuffleArray([...candidatePool]);
    const result = shuffledPool.slice(0, 10).map(w => ({ ...w, tag: '랜덤 복습' }));
    while (result.length < 10) {
      const randomPick = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      result.push({ ...randomPick, tag: '랜덤 복습' });
    }
    return shuffleArray(result);
  }

  // 약점 복습 세션 생성기 (10문제 고정 풀이 시스템 및 인게임 엔진 표준 규격)
  function generateReviewSession(unitNum = 1, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    const targetU = parseInt(unitNum, 10) || (window.currentUnitNumber || 1);

    const queue = buildReviewQuestionQueue(targetU, courseLang);

    // 오답 리스트에 포함되어 있었는지 확인용 Set
    let wrongWords = [];
    try {
      if (typeof window.loadWrongWords === 'function') wrongWords = window.loadWrongWords(courseLang) || [];
    } catch (_) {}
    const normalizeTerm = (s) => String(s || '').replace(/[¡!¿?.,\s]/g, '').toLowerCase();
    const activeWrongSet = new Set(
      (Array.isArray(wrongWords) ? wrongWords : [])
        .filter(w => (w.lang || courseLang) === courseLang && !w.escaped && (w.correctStreak === undefined || Number(w.correctStreak) < 5))
        .map(w => normalizeTerm(w.term || w.word || w.id))
    );

    return queue.map((item, idx) => {
      const itemKey = normalizeTerm(item.term || item.word || item.id);
      const isWeakness = activeWrongSet.has(itemKey);
      const wordStr = String(item.term || item.word || '').trim();
      const meanStr = String(item.meaning || item.kor || item.ko || item.answer || '').trim();
      const rawPron = item.pronunciation || item.pron || item.phonetic || '';
      const phoneticStr = formatPhonetic(rawPron);
      const cleanPron = phoneticStr.replace(/^\[+|\]+$/g, '');
      const exTarget = String(item.exampleTarget || item.example_es || item.example || item.sentence || '').trim();
      const exMeaning = String(item.exampleMeaning || item.example_ko || item.exampleKo || item.sentenceKo || '').trim();

      return {
        ...item,
        id: item.id || `review-q-${idx + 1}`,
        word: wordStr,
        term: wordStr,
        meaning: meanStr,
        pronunciation: cleanPron,
        pron: cleanPron,
        phonetic: phoneticStr,
        exampleTarget: exTarget,
        exampleMeaning: exMeaning,
        example_es: item.example_es || exTarget,
        example_ko: item.example_ko || exMeaning,
        unitId: targetU,
        type: 'word',
        tag: isWeakness ? '약점 복습' : '랜덤 복습',
        isReviewMode: true,
        isWeakReview: isWeakness,
        lang: item.lang || courseLang
      };
    });
  }

  // 🎯 4지선다 보기 추출 로직 (해당 챕터 Unit 단어 풀 안에서만 엄격 격리 및 빈칸 방어)
  function generateOptionsForUnit(correctWord, unitWords) {
    if (!correctWord) return ['선택지 1', '선택지 2', '선택지 3', '선택지 4'];
    let correctMeaning = String(correctWord.meaning || correctWord.answer || correctWord.korean || correctWord.ko || '').trim();
    if (!correctMeaning) {
      correctMeaning = String(correctWord.word || correctWord.term || '정답').trim();
    }
    const correctTerm = String(correctWord.word || correctWord.term || '').trim();

    const pool = Array.isArray(unitWords) ? unitWords : [];

    // 1) 해당 챕터 단어 중 유효한 뜻이 있고, 정답이 아닌 단어들만 필터링
    const candidates = pool.filter(w => {
      if (!w) return false;
      const m = String(w.meaning || w.answer || w.korean || w.ko || w.word || '').trim();
      const t = String(w.word || w.term || '').trim();
      return m !== '' && m !== correctMeaning && t !== correctTerm;
    });

    // 2) 중복 뜻 제거 후 해당 챕터 내부에서만 무작위 셔플 후 오답 3개 추출
    const uniqueCandidates = [];
    const seenMeanings = new Set([correctMeaning]);
    for (const c of candidates) {
      const m = String(c.meaning || c.answer || c.korean || c.ko || c.word || '').trim();
      if (m && !seenMeanings.has(m)) {
        seenMeanings.add(m);
        uniqueCandidates.push(c);
      }
    }

    const shuffled = uniqueCandidates.sort(() => 0.5 - Math.random());
    const distractors = shuffled.slice(0, 3).map(w => String(w.meaning || w.answer || w.korean || w.ko || w.word || '').trim());

    // 3) 오답 선지가 3개 미만일 경우 같은 코스(active course) 내 다른 단어들의 뜻(meaning)에서 무작위 보강
    if (distractors.length < 3) {
      const activeCourse = course || (typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null);
      const allWords = activeCourse?.allWords || [];
      if (Array.isArray(allWords) && allWords.length > 0) {
        const extraShuffled = allWords.slice().sort(() => 0.5 - Math.random());
        for (const ew of extraShuffled) {
          if (distractors.length >= 3) break;
          const em = String(ew.meaning || ew.answer || ew.korean || ew.ko || '').trim();
          const et = String(ew.word || ew.term || '').trim();
          if (em && !seenMeanings.has(em) && em !== correctMeaning && et !== correctTerm) {
            seenMeanings.add(em);
            distractors.push(em);
          }
        }
      }
    }

    // 4개 보기가 모자랄 경우 대체 텍스트로 보강하여 절대 빈 버튼이 되지 않도록 보장
    let dIdx = 1;
    while (distractors.length < 3) {
      const fallbackText = `선택지 ${dIdx + 1}`;
      if (!distractors.includes(fallbackText) && fallbackText !== correctMeaning) {
        distractors.push(fallbackText);
      }
      dIdx++;
    }

    // 4) 정답과 오답 3개를 합친 뒤 최종 셔플 (총 4개)
    const finalOptions = [correctMeaning, ...distractors].sort(() => 0.5 - Math.random());
    return finalOptions;
  }

  // 4지선다 오답 보기 생성기 (현재 챕터 Unit 단어 풀 엄격 격리)
  function generateQuestionChoices(q, sessionQuestions, lessonId = 'node-2', lang = 'es') {
    try {
      if (!q) return [];
      const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
      const course = (typeof window.getCurrentCourseData === 'function')
        ? window.getCurrentCourseData()
        : (courseLang === 'en' ? window.courseData_en : (window.courseData_es || window.courseData));

      // 1. 현재 질문이 속한 목표 유닛(Unit) 식별
      let targetU = q.unitNumber || parseInt(String(q.unitId || '').replace(/[^\d]/g, ''), 10);
      if (!targetU) {
        if (lessonId === 'node-skip-test' || window.isUnitSkipTestMode) {
          targetU = window.currentSkipTestUnit || 2;
        } else {
          const coords = (typeof window.parseNodeCoordinates === 'function') ? window.parseNodeCoordinates(lessonId) : null;
          targetU = coords ? coords.unitIndex : (window.currentUnitNumber || 1);
        }
      }

      // 2. 해당 챕터 단어 풀 바인딩 (활성 코스 데이터 기반)
      let unitPool = getUnitWords(targetU, courseLang);
      if ((!Array.isArray(unitPool) || unitPool.length === 0) && Array.isArray(sessionQuestions) && sessionQuestions.length > 0) {
        unitPool = sessionQuestions;
      }

      // 3. 해당 챕터 단어 풀만 사용하여 4지선다 옵션 생성 (기초 단어 외부 주입 완전 제거)
      return generateOptionsForUnit(q, unitPool, course);
    } catch (_) {
      const correctMeaning = String(q?.meaning || q?.answer || '정답').trim();
      return [correctMeaning];
    }
  }

  // ⚡ 챕터 건너뛰기 시험(Jump Test) 세션 생성기
  // 오직 targetUnitId(목표 Unit)의 단어 풀 안에서만 100% 무작위 셔플 추출 (타 챕터 및 이전 기초 단어 혼합 완전 차단)
  function generateJumpTestSession(targetUnitId = 2, count = 10, lang = 'es') {
    const courseLang = (lang || window.currentLanguage || window.currentActiveCourse || 'en') === 'es' ? 'es' : 'en';
    const uNum = parseInt(String(targetUnitId).replace(/[^\d]/g, ''), 10) || 2;
    const uKey = 'unit-' + uNum;
    const totalCount = Math.min(15, Math.max(10, parseInt(count, 10) || 10));

    // 1. 목표 챕터 단어 풀 조회
    const targetPool = getUnitWords(uNum, courseLang) || [];

    // 2. 해당 챕터 내부에서만 무작위 셔플 후 totalCount만큼 추출
    const shuffledTarget = shuffleArray(targetPool.slice());
    const selected = shuffledTarget.slice(0, Math.min(totalCount, shuffledTarget.length));

    // 3. 세션 퀴즈 객체 매핑
    return selected.map((item, idx) => {
      const wordStr = item.word || item.term || '';
      const meanStr = item.meaning || item.answer || item.korean || item.ko || '';
      const pronStr = item.pronunciation || item.pron || item.phonetic || '';
      const genderStr = item.gender === 'm' ? '남성' : (item.gender === 'f' ? '여성' : (item.gender || ''));
      const posStr = item.partOfSpeech || item.pos || '';
      const grammarHint = [genderStr, posStr].filter(Boolean).join(' · ');

      return {
        ...item,
        id: item.id || `jump_q_${idx + 1}`,
        word: wordStr,
        term: wordStr,
        meaning: meanStr,
        pronunciation: pronStr,
        phonetic: formatPhonetic(item.phonetic || pronStr),
        gender: item.gender || null,
        partOfSpeech: posStr || null,
        grammarHint: grammarHint || '',
        exampleTarget: item.exampleTarget || item.example || item.sentence || '',
        exampleMeaning: item.exampleMeaning || item.exampleKo || item.example_ko || item.sentenceKo || '',
        type: 'word',
        unitNumber: uNum,
        unitId: uKey,
        isSentence: Boolean(item.type === 'sentence' || item.isSentence),
        isJumpTest: true,
        tag: `Unit ${uNum} 핵심`
      };
    });
  }

  // 전역 등록 및 내보내기
  window.getWeakWordIds = getWeakWordIds;
  window.addWeakWordId = addWeakWordId;
  window.removeWeakWordId = removeWeakWordId;
  window.findWordInCourse = findWordInCourse;
  window.normalizeLessonId = normalizeLessonId;
  window.getUnitWords = getUnitWords;
  window.getStageWordPool = getStageWordPool;
  window.buildWeaknessQuizQueue = buildWeaknessQuizQueue;
  window.buildReviewQuestionQueue = buildReviewQuestionQueue;
  window.generateStageSession = generateStageSession;
  window.generateReviewSession = generateReviewSession;
  window.generateJumpTestSession = generateJumpTestSession;
  window.generateQuestionChoices = generateQuestionChoices;
  window.generateOptionsForUnit = generateOptionsForUnit;

  window.quizSessionGenerator = {
    shuffleArray,
    getUnitWords,
    buildWeaknessQuizQueue,
    buildReviewQuestionQueue,
    getWeakWordIds,
    addWeakWordId,
    removeWeakWordId,
    findWordInCourse,
    normalizeLessonId,
    getStageWordPool,
    generateReviewSession,
    generateStageSession,
    generateDeckForStage: generateStageSession,
    generateJumpTestSession,
    generateQuestionChoices,
    generateOptionsForUnit
  };

  if (!window.VOCA_DATA) window.VOCA_DATA = {};
  window.VOCA_DATA.generateStageSession = generateStageSession;
  window.VOCA_DATA.generateJumpTestSession = generateJumpTestSession;
  window.VOCA_DATA.generateQuestionChoices = generateQuestionChoices;
  window.VOCA_DATA.generateOptionsForUnit = generateOptionsForUnit;
})();
