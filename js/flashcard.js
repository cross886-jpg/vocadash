// =================================================
// VocaDash Flashcard Module (js/flashcard.js)
// 단어 예습 플래시카드 넘기기, 카드 덱 스택 제어, 제스처, TTS 음성 재생
// =================================================

(function () {
  // 브라우저 새로고침 및 강제 내비게이션 방어
  try {
    if (typeof history !== 'undefined') {
      if (history.go) history.go = function (delta) { console.warn('🛑 history.go() 호출 차단됨'); };
      if (history.back) history.back = function () { console.warn('🛑 history.back() 호출 차단됨'); };
      if (history.forward) history.forward = function () { console.warn('🛑 history.forward() 호출 차단됨'); };
    }
    if (typeof HTMLFormElement !== 'undefined' && HTMLFormElement.prototype) {
      HTMLFormElement.prototype.submit = function () {
        console.warn('🛑 HTMLFormElement.submit() 호출 차단됨');
        return false;
      };
    }
  } catch (_) {}

  // =================================================
  // [고품질 듀얼 사운드 재생 엔진 (Dual TTS Player)]
  // 1순위: Google Translate 고음질 원어민 CDN 오디오 스트림 재생
  // 2순위: 네트워크 차단/에러 시 Web Speech API 고음질 보이스 선별 폴백
  // =================================================
  let currentPlayingAudio = null;
  let cachedSynthesisVoices = [];

  function loadSynthesisVoices() {
    if ('speechSynthesis' in window) {
      try {
        cachedSynthesisVoices = window.speechSynthesis.getVoices() || [];
      } catch (_) {}
    }
  }
  if ('speechSynthesis' in window) {
    loadSynthesisVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadSynthesisVoices;
    }
  }

  function getBestNaturalVoice(targetLang = 'es') {
    if (!('speechSynthesis' in window)) return null;
    if (cachedSynthesisVoices.length === 0) loadSynthesisVoices();

    const isEn = (targetLang === 'en' || targetLang === 'en-US');
    const langPrefix = isEn ? 'en' : 'es';

    const priorityKeywords = isEn
      ? ['Google US English', 'Natural', 'Samantha', 'Alex', 'Victoria', 'Karen']
      : ['Google español', 'Natural', 'Monica', 'Jorge', 'Paulina', 'Elvira', 'Mónica', 'Diego'];

    for (const kw of priorityKeywords) {
      const found = cachedSynthesisVoices.find(v =>
        v.lang && v.lang.toLowerCase().startsWith(langPrefix) &&
        v.name && v.name.toLowerCase().includes(kw.toLowerCase())
      );
      if (found) return found;
    }

    const langMatches = cachedSynthesisVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if (langMatches.length > 0) {
      const naturalVoice = langMatches.find(v =>
        v.name && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))
      );
      return naturalVoice || langMatches[0];
    }
    return null;
  }

  function sanitizeTTSText(text) {
    if (!text) return '';
    return String(text)
      .replace(/[¡!¿?"'\[\]()“”‘’]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function setUiSpeakerActive(buttonEl) {
    if (!buttonEl) return;
    buttonEl.classList.add('tts-speaking', 'text-emerald-500', 'animate-pulse');
    buttonEl.classList.remove('text-slate-400', 'text-slate-500', 'text-on-surface-variant');
  }

  function resetUiSpeakerActive(buttonEl) {
    if (!buttonEl) return;
    buttonEl.classList.remove('tts-speaking', 'text-emerald-500', 'animate-pulse');
  }

  function stopTTS() {
    if (currentPlayingAudio) {
      try {
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      } catch (_) {}
      currentPlayingAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    document.querySelectorAll('.tts-speaking').forEach(el => {
      resetUiSpeakerActive(el);
    });
  }
  window.stopTTS = stopTTS;

  function speakWithWebSpeechFallback(cleanWord, targetLangCode, buttonEl) {
    if (!('speechSynthesis' in window)) {
      if (buttonEl) resetUiSpeakerActive(buttonEl);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const isEn = (targetLangCode === 'en' || targetLangCode === 'en-US');
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = isEn ? 'en-US' : 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const bestVoice = getBestNaturalVoice(targetLangCode);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => {
        if (buttonEl) resetUiSpeakerActive(buttonEl);
      };
      utterance.onerror = () => {
        if (buttonEl) resetUiSpeakerActive(buttonEl);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (buttonEl) resetUiSpeakerActive(buttonEl);
    }
  }

  function safePlayTTS(text, lang = 'es-ES', buttonEl = null) {
    stopTTS();

    const cleanWord = sanitizeTTSText(text);
    if (!cleanWord) return;

    const isEn = (lang === 'en' || lang === 'en-US');
    const targetLangCode = isEn ? 'en' : 'es';

    if (buttonEl) {
      setUiSpeakerActive(buttonEl);
    }

    // 1순위: Google Translate 고음질 CDN 오디오 스트림 재생
    const cdnUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLangCode}&q=${encodeURIComponent(cleanWord)}`;

    let fallbackTriggered = false;
    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      speakWithWebSpeechFallback(cleanWord, targetLangCode, buttonEl);
    };

    try {
      const audio = new Audio();
      currentPlayingAudio = audio;
      audio.playbackRate = 0.98;
      audio.src = cdnUrl;

      audio.onended = () => {
        if (currentPlayingAudio === audio) currentPlayingAudio = null;
        if (buttonEl) resetUiSpeakerActive(buttonEl);
      };

      audio.onerror = () => {
        if (currentPlayingAudio === audio) currentPlayingAudio = null;
        triggerFallback();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (currentPlayingAudio === audio) currentPlayingAudio = null;
          triggerFallback();
        });
      }
    } catch (err) {
      triggerFallback();
    }
  }

  function speakWord(word, lang = 'es', buttonEl = null) {
    safePlayTTS(word, lang, buttonEl);
  }

  window.stopTTS = stopTTS;
  window.speakWord = safePlayTTS;
  window.safePlayTTS = safePlayTTS;
  window.playTTS = safePlayTTS;

  const cheerMessages = [
    '첫 단어부터 신나게 질주해볼까요? 🐾',
    '좋은 페이스예요! 귀에 쏙쏙 들어오네요 🐱',
    '익숙한 표현들이 점점 늘어나고 있어요 ⚡',
    '벌써 4번째 단어 돌파! 아주 훌륭해요 👏',
    '절반이나 왔어요! 페이스를 유지해보세요 🏃‍♂️',
    '실전 여행에서 가장 많이 쓰이는 표현이에요 ✈️',
    '어려운 단어도 척척! 감각이 남다르시네요 🔥',
    '집중력 최고조! 단어 파트가 곧 끝나요 💫',
    '단어 완벽 정복! 이제 실전 문장으로 갑니다 🚀',
    '문장 보스 파트 시작! 귀를 기울여보세요 👑',
    '실전 회화 문장도 거침없이 술술! 💬',
    '거의 다 왔어요! 마지막 1문장 남았습니다 🔥',
    '대단해요! 13개 단어 & 실전 문장 완벽 예습 완료 🎉'
  ];

  let currentCardIndex = 0;
  let isCardFlipped = false;
  let isCardTransitioning = false;
  let activeDeck = [];
  let currentLessonDeckTitle = '2과: 입국 심사 · 단어 예습';
  let currentFlashcardLessonId = 'node-2';

  // DOM Elements
  let flashcardScreen;
  let flashcardContainer;
  let flashcardCloseBtn;
  let flashcardSkipBtn;
  let flashcardLessonTitle;
  let flashcardProgressBar;
  let flashcardWrapper;
  let flashcard;
  let flashcardBehind;
  let flashcardBehindTag;
  let flashcardBehindWord;
  let flashcardBehindPhonetic;
  let flashcardDeckLayer2;
  let flashcardTag;
  let flashcardFront;
  let flashcardBack;
  let flashcardSpeakerBtn;
  let flashcardWord;
  let flashcardPhonetic;
  let flashcardMeaning;
  let flashcardExampleTarget;
  let flashcardExampleMeaning;
  let flashcardHint;
  let flashcardMascotImg;
  let flashcardMascotMsg;
  let flashcardPrevBtn;
  let flashcardNextBtn;
  let flashcardDots;
  let flashcardStepText;
  let flashcardCtaBtn;
  let flashcardCtaText;
  let flashcardCtaIcon;

  function initDOMElements() {
    flashcardScreen = document.getElementById('flashcard-screen');
    flashcardContainer = document.getElementById('flashcard-container');
    flashcardCloseBtn = document.getElementById('flashcard-close-btn');
    flashcardSkipBtn = document.getElementById('flashcard-skip-btn');
    flashcardLessonTitle = document.getElementById('flashcard-lesson-title');
    flashcardProgressBar = document.getElementById('flashcard-progress-bar');
    flashcardWrapper = document.getElementById('flashcard-wrapper');
    flashcard = document.getElementById('flashcard') || document.getElementById('flashcard-card');
    flashcardBehind = document.getElementById('flashcard-behind');
    flashcardBehindTag = document.getElementById('flashcard-behind-tag');
    flashcardBehindWord = document.getElementById('flashcard-behind-word');
    flashcardBehindPhonetic = document.getElementById('flashcard-behind-phonetic');
    flashcardDeckLayer2 = document.getElementById('flashcard-deck-layer-2');
    flashcardTag = document.getElementById('flashcard-tag');
    flashcardFront = document.getElementById('flashcard-front');
    flashcardBack = document.getElementById('flashcard-back');
    flashcardSpeakerBtn = document.getElementById('flashcard-speaker-btn');
    flashcardWord = document.getElementById('flashcard-word');
    flashcardPhonetic = document.getElementById('flashcard-phonetic');
    flashcardMeaning = document.getElementById('flashcard-meaning');
    flashcardExampleTarget = document.getElementById('flashcard-example-target');
    flashcardExampleMeaning = document.getElementById('flashcard-example-meaning');
    flashcardHint = document.getElementById('flashcard-hint');
    flashcardMascotImg = document.getElementById('flashcard-mascot-img');
    flashcardMascotMsg = document.getElementById('flashcard-mascot-msg');
    flashcardPrevBtn = document.getElementById('flashcard-prev-btn');
    flashcardNextBtn = document.getElementById('flashcard-next-btn');
    flashcardDots = document.getElementById('flashcard-dots');
    flashcardStepText = document.getElementById('flashcard-step-text');
    flashcardCtaBtn = document.getElementById('flashcard-cta-btn');
    flashcardCtaText = document.getElementById('flashcard-cta-text');
    flashcardCtaIcon = document.getElementById('flashcard-cta-icon');
  }

  function openFlashcardScreen(lessonId = 'node-2', session = null) {
    initDOMElements();
    stopTTS();

    // 메뉴/모달 열려있으면 안전하게 닫기
    if (window.closeCourseDropdown) window.closeCourseDropdown();
    if (window.closeLanguageModal) window.closeLanguageModal();
    if (window.closeStreakModal) window.closeStreakModal();
    if (window.closeSettingsModal) window.closeSettingsModal();
    if (window.closeLessonModal) window.closeLessonModal();

    // 🛑 플래시카드 화면 진입 시 뒤쪽 배경(로드맵, 게임 화면, 하단 네비) 완전 숨김 (화면 겹침 원천 방지)
    const roadmapScreen = document.getElementById('roadmap-screen');
    if (roadmapScreen) {
      roadmapScreen.classList.add('hidden');
      roadmapScreen.style.display = 'none';
    }
    const roadmapHeader = document.getElementById('roadmap-header');
    if (roadmapHeader) {
      roadmapHeader.classList.add('hidden');
      roadmapHeader.style.display = 'none';
    }
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      gameScreen.classList.remove('opacity-100', 'pointer-events-auto');
      gameScreen.style.display = 'none';
    }
    const bottomNav = document.getElementById('bottom-nav') || document.querySelector('nav');
    if (bottomNav) {
      bottomNav.classList.add('hidden');
      bottomNav.style.display = 'none';
    }

    let isMiniWrongReview = false;
    if (Array.isArray(lessonId)) {
      session = lessonId;
      lessonId = window.currentGameLessonId || 'node-2';
      isMiniWrongReview = true;
      window.isWrongWordsMiniReviewActive = true;
    } else if (window.isWrongWordsMiniReviewActive) {
      isMiniWrongReview = true;
    }

    currentFlashcardLessonId = lessonId || 'node-2';
    if (currentFlashcardLessonId === 'node-boss' || currentFlashcardLessonId === 'boss' || currentFlashcardLessonId === 'stage-boss' || currentFlashcardLessonId === 'node-4' || currentFlashcardLessonId === '4') {
      currentFlashcardLessonId = 'node-boss';
    } else if (currentFlashcardLessonId === 'node-3' || currentFlashcardLessonId === 'node3' || currentFlashcardLessonId === '3' || currentFlashcardLessonId === 'stage-3') {
      currentFlashcardLessonId = 'node-3';
    } else if (currentFlashcardLessonId === 'node-2' || currentFlashcardLessonId === 'node2' || currentFlashcardLessonId === '2' || currentFlashcardLessonId === 'stage-2') {
      currentFlashcardLessonId = 'node-2';
    }

    const currentCourse = window.currentActiveCourse || 'es';
    const round = (typeof window.nodeProgressMap !== 'undefined' && window.nodeProgressMap[currentFlashcardLessonId]) || 0;

    const activeCourseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.activeCourseId || 'main';
    window.activeCourseId = activeCourseId;
    const currentCourseData = typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : ((activeCourseId === 'pack_football' && window.packFootballData) ? window.packFootballData : window.courseData);

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourse) : 1) || 1;
    const unitIndex = Math.max(0, unlockedLevel - 1);
    const targetUnit = (currentCourseData && Array.isArray(currentCourseData.units)) 
      ? (currentCourseData.units[unitIndex] || currentCourseData.units[0]) 
      : null;
    const currentWords = (targetUnit && Array.isArray(targetUnit.words)) ? targetUnit.words : [];

    console.log('현재 로드된 코스:', activeCourseId, '단어 목록:', currentWords);

    let deck = null;
    if (session && Array.isArray(session) && session.length > 0) {
      deck = session.slice();
    } else if (activeCourseId === 'pack_football' && typeof window.getFootballStageSession === 'function') {
      deck = window.getFootballStageSession(currentFlashcardLessonId);
    } else if (typeof window.generateStageSession === 'function') {
      deck = window.generateStageSession(currentFlashcardLessonId, currentCourse, round);
    } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      deck = window.VOCA_DATA.generateStageSession(currentFlashcardLessonId, currentCourse, round);
    }

    if (!deck || deck.length === 0) {
      if (currentWords && Array.isArray(currentWords) && currentWords.length > 0) {
        deck = currentWords.map((item, idx) => ({
          ...item,
          id: item.id || `fc_${idx + 1}`,
          term: item.word || item.term || '',
          word: item.word || item.term || '',
          meaning: item.meaning || '',
          phonetic: item.pronunciation ? `[${item.pronunciation}]` : (item.phonetic || ''),
          tag: item.tag || (targetUnit?.title ? targetUnit.title.split('.')[0] : '실전 학습')
        }));
      }
    }

    // 견고한 세이프 폴백 (어떤 상황에서도 빈 화면이나 1개짜리 단어가 되지 않도록 레슨별 기본 13개 단어/문장 세트 보장)
    if (!deck || deck.length === 0) {
      deck = [
        { id: 'fb-01', type: 'word', term: '¡Hola!', word: '¡Hola!', meaning: '안녕하세요 / 안녕', phonetic: '[올라!]', tag: '일상 인사' },
        { id: 'fb-02', type: 'word', term: 'Buenos días', word: 'Buenos días', meaning: '좋은 아침이에요', phonetic: '[부에노스 디아스]', tag: '일상 인사' },
        { id: 'fb-03', type: 'word', term: 'Buenas tardes', word: 'Buenas tardes', meaning: '좋은 오후예요', phonetic: '[부에나스 타르데스]', tag: '일상 인사' },
        { id: 'fb-04', type: 'word', term: 'Buenas noches', word: 'Buenas noches', meaning: '좋은 밤 되세요', phonetic: '[부에나스 노체스]', tag: '일상 인사' },
        { id: 'fb-05', type: 'word', term: 'Gracias', word: 'Gracias', meaning: '감사합니다', phonetic: '[그라시아스]', tag: '일상 인사' },
        { id: 'fb-06', type: 'word', term: 'Muchas gracias', word: 'Muchas gracias', meaning: '정말 감사합니다', phonetic: '[무차스 그라시아스]', tag: '일상 인사' },
        { id: 'fb-07', type: 'word', term: 'De nada', word: 'De nada', meaning: '천만에요 / 별말씀을요', phonetic: '[데 나다]', tag: '일상 인사' },
        { id: 'fb-08', type: 'word', term: 'Por favor', word: 'Por favor', meaning: '부탁합니다 / 제발', phonetic: '[포르 파보르]', tag: '일상 인사' },
        { id: 'fb-09', type: 'word', term: 'Perdón', word: 'Perdón', meaning: '미안해요 / 잠시만요', phonetic: '[페르돈]', tag: '일상 인사' },
        { id: 'fb-10', type: 'word', term: 'Lo siento', word: 'Lo siento', meaning: '죄송합니다', phonetic: '[로 시엔토]', tag: '일상 인사' },
        { id: 'fb-11', type: 'word', term: 'Mucho gusto', word: 'Mucho gusto', meaning: '만나서 반갑습니다', phonetic: '[무초 구스토]', tag: '일상 인사' },
        { id: 'fb-12', type: 'word', term: '¡Adiós!', word: '¡Adiós!', meaning: '안녕히 가세요', phonetic: '[아디오스!]', tag: '일상 인사' },
        { id: 'fb-13', type: 'sentence', term: '¡Hola! ¿Cómo estás? Muy bien, gracias.', word: '¡Hola! ¿Cómo estás? Muy bien, gracias.', meaning: '안녕! 어떻게 지내? 아주 잘 지내, 고마워.', phonetic: '[올라! 코모 에스타스? 무이 비엔, 그라시아스.]', tag: '실전 회화' }
      ];
    }

    // 최소 13개 보장 (일반 예습 모드에서만 순환 패딩, 오답 집중 미니 복습은 패딩 제외)
    if (!isMiniWrongReview && deck.length < 13) {
      const origDeck = deck.slice();
      let padIdx = 0;
      while (deck.length < 13) {
        deck.push({ ...origDeck[padIdx % origDeck.length] });
        padIdx++;
      }
    }

    activeDeck = deck.map((item, idx) => ({
      ...item,
      word: item.word || item.term || '',
      term: item.term || item.word || '',
      meaning: item.meaning || item.korean || '',
      phonetic: item.phonetic || (item.pronunciation ? `[${item.pronunciation}]` : ''),
      exampleTarget: item.exampleTarget || item.example || '',
      exampleMeaning: item.exampleMeaning || item.exampleKo || item.example_ko || '',
      isSentence: item.type === 'sentence' || item.isSentence || (!isMiniWrongReview && idx >= 10),
      tag: item.tag || (isMiniWrongReview ? '오답 복습' : (item.type === 'sentence' ? '실전 문장' : '핵심 어휘'))
    }));

    window.currentSessionQuestions = activeDeck;
    console.log('📚 [Flashcard] 단어 덱 주입 완료: 레슨', currentFlashcardLessonId, '총', activeDeck.length, '개 단어');
    const unitTitle = targetUnit ? (targetUnit.title || targetUnit.name) : `Unit ${unitIndex + 1}`;
    currentLessonDeckTitle = isMiniWrongReview ? `오답 집중 복습 (${deck.length}개)` : `${unitTitle} · 단어 예습`;
    currentCardIndex = 0;
    isCardFlipped = false;
    isCardTransitioning = false;
    isDragging = false;
    diffX = 0;
    diffY = 0;

    // 카드 비주얼 및 트랜스폼 상태 강제 리셋
    const topEl = flashcardWrapper || flashcard;
    if (topEl) {
      topEl.style.transition = '';
      topEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
      topEl.style.opacity = '1';
      topEl.style.removeProperty('--drag-x');
      topEl.style.removeProperty('--drag-y');
      topEl.style.removeProperty('--drag-rot');
    }
    if (flashcardFront) flashcardFront.classList.remove('hidden');
    if (flashcardBack) flashcardBack.classList.add('hidden');
    if (flashcardBehind) {
      flashcardBehind.style.transition = '';
      flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
      flashcardBehind.style.opacity = '0.7';
      flashcardBehind.style.display = 'flex';
    }
    if (flashcardDeckLayer2) {
      flashcardDeckLayer2.style.transition = '';
      flashcardDeckLayer2.style.transform = 'translateY(-16px) scale(0.90)';
      flashcardDeckLayer2.style.opacity = '0.8';
      flashcardDeckLayer2.style.display = 'block';
    }

    if (flashcardLessonTitle) {
      flashcardLessonTitle.textContent = currentLessonDeckTitle;
    }

    if (flashcardMascotImg) {
      const activeLang = (window.currentLanguage || window.currentActiveCourse || currentCourse || 'es') === 'en' ? 'en' : 'es';
      const activeCourse = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : window.courseData;
      if (activeCourse && activeCourse[activeLang] && activeCourse[activeLang].mascotImg) {
        flashcardMascotImg.src = activeCourse[activeLang].mascotImg;
      } else if (activeCourse && activeCourse.mascotImg) {
        flashcardMascotImg.src = activeCourse.mascotImg;
      } else {
        flashcardMascotImg.src = `assets/characters/${activeLang}-study.webp?v=88`;
      }
    }

    renderCurrentCard();

    // 최신 DOM에 이벤트 바인딩 보장
    bindEvents();

    // 첫 단어 발음 자동 재생
    if (activeDeck && activeDeck[0]) {
      setTimeout(() => {
        const canAutoPlay = !window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false;
        if (canAutoPlay) {
          speakWord(activeDeck[0].word || activeDeck[0].term, currentCourse);
        }
      }, 250);
    }

    if (flashcardScreen) {
      flashcardScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      flashcardScreen.classList.add('opacity-100', 'pointer-events-auto');
      flashcardScreen.style.removeProperty('display');
      flashcardScreen.style.display = 'flex';
    }
    if (flashcardContainer) {
      flashcardContainer.classList.remove('translate-y-full');
      flashcardContainer.classList.add('translate-y-0');
    }
  }

  function closeFlashcardScreen(restoreRoadmap = true) {
    isCardTransitioning = false;
    stopTTS();
    if (restoreRoadmap) {
      window.isWrongWordsMiniReviewActive = false;
    }
    if (flashcardContainer) {
      flashcardContainer.classList.remove('translate-y-0');
      flashcardContainer.classList.add('translate-y-full');
    }
    if (flashcardScreen) {
      flashcardScreen.classList.remove('opacity-100', 'pointer-events-auto');
      flashcardScreen.classList.add('opacity-0', 'pointer-events-none', 'hidden');
      flashcardScreen.style.display = 'none';
    }

    if (restoreRoadmap) {
      const roadmapScreen = document.getElementById('roadmap-screen');
      if (roadmapScreen) {
        roadmapScreen.classList.remove('hidden');
        roadmapScreen.style.removeProperty('display');
        roadmapScreen.style.display = '';
      }
      const roadmapHeader = document.getElementById('roadmap-header');
      if (roadmapHeader) {
        roadmapHeader.classList.remove('hidden');
        roadmapHeader.style.removeProperty('display');
        roadmapHeader.style.display = '';
      }
      const bottomNav = document.getElementById('bottom-nav') || document.querySelector('nav');
      if (bottomNav) {
        bottomNav.classList.remove('hidden');
        bottomNav.style.removeProperty('display');
      }
      if (typeof window.switchMainTab === 'function') {
        window.switchMainTab('home', true);
      }
    }
  }

  function renderCurrentCard() {
    if (!activeDeck || activeDeck.length === 0) return;
    const cardData = activeDeck[currentCardIndex];
    if (!cardData) return;

    isCardFlipped = false;
    if (flashcardFront) flashcardFront.classList.remove('hidden');
    if (flashcardBack) flashcardBack.classList.add('hidden');
    if (flashcardHint) {
      flashcardHint.textContent = '👆 탭: 뜻 확인 · ↔ 밀기: 단어 넘기기';
    }

    const isSentence = cardData.type === 'sentence' || cardData.isSentence || currentCardIndex >= 10;
    if (flashcardTag) {
      flashcardTag.textContent = cardData.tag || (isSentence ? '실전 문장' : '핵심 어휘');
    }
    if (flashcardWord) {
      const termText = cardData.word || cardData.term || '';
      flashcardWord.textContent = termText;
      const tLen = termText.length;
      if (tLen > 22) {
        flashcardWord.className = 'font-headline-xl text-[20px] font-extrabold text-[#1E293B] tracking-tight leading-snug break-keep text-center select-none';
      } else if (tLen > 14) {
        flashcardWord.className = 'font-headline-xl text-[24px] font-extrabold text-[#1E293B] tracking-tight leading-snug break-keep text-center select-none';
      } else {
        flashcardWord.className = 'font-headline-xl text-[30px] font-extrabold text-[#1E293B] tracking-tight leading-none break-keep text-center select-none';
      }
    }
    if (flashcardPhonetic) {
      flashcardPhonetic.textContent = cardData.phonetic || '';
      const isPhoneticVisible = !window.vocadashSettings || window.vocadashSettings.showPhonetic !== false;
      if (isPhoneticVisible) {
        flashcardPhonetic.classList.remove('hidden');
        flashcardPhonetic.style.display = '';
      } else {
        flashcardPhonetic.classList.add('hidden');
        flashcardPhonetic.style.display = 'none';
      }
    }
    if (flashcardMeaning) flashcardMeaning.textContent = cardData.meaning || '';
    if (flashcardExampleTarget) flashcardExampleTarget.textContent = `"${cardData.exampleTarget || cardData.example || ''}"`;
    if (flashcardExampleMeaning) flashcardExampleMeaning.textContent = `"${cardData.exampleMeaning || cardData.exampleKo || cardData.example_ko || ''}"`;

    const total = activeDeck.length;
    const stepNum = currentCardIndex + 1;
    if (flashcardStepText) {
      flashcardStepText.textContent = `(${stepNum}/${total})`;
    }
    if (flashcardProgressBar) {
      const pct = Math.round((stepNum / total) * 100);
      flashcardProgressBar.style.width = `${pct}%`;
    }

    if (flashcardMascotMsg) {
      const msg = cheerMessages[currentCardIndex] || cheerMessages[cheerMessages.length - 1];
      flashcardMascotMsg.textContent = msg;
    }

    if (flashcardDots) {
      flashcardDots.innerHTML = '';
      const dotSize = total > 10 ? 'w-1.5 h-1.5' : 'w-2 h-2';
      const dotGap = total > 10 ? 'gap-1' : 'gap-1.5';
      flashcardDots.className = `flex items-center justify-center shrink-0 overflow-hidden max-w-full ${dotGap}`;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        if (i <= currentCardIndex) {
          dot.className = `${dotSize} rounded-full bg-[#22C55E] shrink-0 transition-all`;
        } else {
          dot.className = `${dotSize} rounded-full bg-slate-200 shrink-0 transition-all`;
        }
        flashcardDots.appendChild(dot);
      }
    }

    // Prev / Next button state & anti-wrapping enforcement
    if (flashcardPrevBtn) {
      flashcardPrevBtn.disabled = currentCardIndex === 0;
      flashcardPrevBtn.classList.add('whitespace-nowrap', 'shrink-0', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-sm');
      flashcardPrevBtn.style.minWidth = '48px';
      flashcardPrevBtn.style.whiteSpace = 'nowrap';
      if (currentCardIndex === 0) {
        flashcardPrevBtn.classList.add('opacity-40', 'cursor-not-allowed');
      } else {
        flashcardPrevBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      }
    }
    const isLastCard = currentCardIndex >= total - 1;
    if (flashcardNextBtn) {
      flashcardNextBtn.classList.add('whitespace-nowrap', 'shrink-0', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-sm');
      flashcardNextBtn.style.minWidth = '48px';
      flashcardNextBtn.style.whiteSpace = 'nowrap';
      if (isLastCard) {
        flashcardNextBtn.innerHTML = window.isWrongWordsMiniReviewActive
          ? '<span>학습 완료</span><span class="material-symbols-outlined text-[16px] ml-0.5">check_circle</span>'
          : '<span>게임 시작</span><span class="material-symbols-outlined text-[16px] ml-0.5">sports_esports</span>';
      } else {
        flashcardNextBtn.innerHTML = '<span>다음</span><span class="material-symbols-outlined text-[16px]">chevron_right</span>';
      }
    }

    if (flashcardCtaBtn) {
      if (isLastCard) {
        flashcardCtaBtn.className = window.isWrongWordsMiniReviewActive
          ? 'w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 active:translate-y-0.5 text-white font-extrabold text-base tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_0_#b45309,0_10px_16px_-4px_rgba(245,158,11,0.4)] active:shadow-[0_2px_0_0_#b45309] transition-all cursor-pointer'
          : 'w-full h-14 bg-[#2563EB] hover:bg-[#1d4ed8] active:translate-y-0.5 text-white font-extrabold text-base tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_0_#1d4ed8,0_10px_16px_-4px_rgba(37,99,235,0.4)] active:shadow-[0_2px_0_0_#1d4ed8] transition-all cursor-pointer';
      } else {
        flashcardCtaBtn.className = 'w-full h-14 bg-[#22C55E] hover:bg-[#16a34a] active:translate-y-0.5 text-white font-extrabold text-base tracking-wide rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_6px_0_0_#15803d,0_10px_16px_-4px_rgba(34,197,94,0.4)] active:shadow-[0_2px_0_0_#15803d] transition-all cursor-pointer';
      }
    }
    if (flashcardCtaText) {
      if (isLastCard) {
        flashcardCtaText.textContent = window.isWrongWordsMiniReviewActive ? '학습 완료' : '⚡ 단어 예습 완료! 게임 시작';
      } else {
        flashcardCtaText.textContent = `다음 단어 보기 (${stepNum}/${total})`;
      }
    }
    if (flashcardCtaIcon) {
      flashcardCtaIcon.textContent = isLastCard ? (window.isWrongWordsMiniReviewActive ? 'check_circle' : 'sports_esports') : 'chevron_right';
    }

    // Behind card teaser
    const nextCardData = activeDeck[currentCardIndex + 1];
    if (nextCardData) {
      const nextIsSentence = nextCardData.type === 'sentence' || nextCardData.isSentence || (currentCardIndex + 1) >= 10;
      if (flashcardBehindTag) flashcardBehindTag.textContent = nextCardData.tag || (nextIsSentence ? '실전 문장' : '핵심 어휘');
      if (flashcardBehindWord) {
        const nwText = nextCardData.word || nextCardData.term || '';
        flashcardBehindWord.textContent = nwText;
        flashcardBehindWord.className = nwText.length > 18 ? 'font-headline-xl text-[18px] font-extrabold text-[#1E293B] tracking-tight' : 'font-headline-xl text-[28px] font-extrabold text-[#1E293B] tracking-tight';
      }
      if (flashcardBehindPhonetic) flashcardBehindPhonetic.textContent = nextCardData.phonetic || '';
      if (flashcardBehind) {
        flashcardBehind.style.display = 'flex';
        flashcardBehind.style.opacity = '0.7';
        flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
      }
      if (flashcardDeckLayer2) {
        flashcardDeckLayer2.style.display = 'block';
        flashcardDeckLayer2.style.opacity = '0.8';
        flashcardDeckLayer2.style.transform = 'translateY(-16px) scale(0.90)';
      }
    } else {
      if (flashcardBehindTag) flashcardBehindTag.textContent = '단어 예습';
      if (flashcardBehindWord) flashcardBehindWord.textContent = '🎉 완료!';
      if (flashcardBehindPhonetic) flashcardBehindPhonetic.textContent = '[퀴즈로 이동]';
      if (flashcardBehind) {
        flashcardBehind.style.display = 'flex';
        flashcardBehind.style.opacity = '0.5';
        flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
      }
      if (flashcardDeckLayer2) {
        flashcardDeckLayer2.style.opacity = '0';
      }
    }
  }

  function launchGameDirectly(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    stopTTS();

    // 1) 플래시카드 화면 완전 숨김 (로드맵 복원은 하지 않음: 바로 액션 게임으로 진입)
    closeFlashcardScreen(false);

    // 2) 오답 복습 완료 시: 바로 다음 회차/스테이지 게임으로 직행
    if (window.isWrongWordsMiniReviewActive) {
      window.isWrongWordsMiniReviewActive = false;
      if (window.showToast) window.showToast('🚀 오답 복습 완료! 게임을 시작합니다!', '✨');
      if (typeof window.startNextRoundOrStageDirectly === 'function') {
        window.startNextRoundOrStageDirectly();
        return;
      }
    }

    // 3) 액션 게임 화면(#game-screen)의 hidden 제거 및 안전 시작
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.remove('hidden');
      gameScreen.style.removeProperty('display');
      gameScreen.style.display = 'flex';
    }

    if (window.showToast) window.showToast('🎉 단어 예습 완료! 단어 낙하 액션 게임을 시작합니다!', '⚡');
    if (typeof window.launchGame === 'function') {
      window.launchGame('falling', window.currentSessionQuestions || activeDeck, { lessonId: currentFlashcardLessonId });
    } else if (window.openGameScreen) {
      window.openGameScreen(currentFlashcardLessonId, window.currentSessionQuestions || activeDeck);
    }
  }

  function toggleCardFlip() {
    isCardFlipped = !isCardFlipped;
    if (isCardFlipped) {
      if (flashcardFront) flashcardFront.classList.add('hidden');
      if (flashcardBack) flashcardBack.classList.remove('hidden');
      if (flashcardHint) {
        flashcardHint.textContent = '👆 다시 탭: 단어 보기 · ↔ 밀기: 단어 넘기기';
      }
    } else {
      if (flashcardBack) flashcardBack.classList.add('hidden');
      if (flashcardFront) flashcardFront.classList.remove('hidden');
      if (flashcardHint) {
        flashcardHint.textContent = '👆 탭: 뜻 확인 · ↔ 밀기: 단어 넘기기';
      }
    }

    if (flashcard) {
      flashcard.classList.add('scale-[0.98]');
      setTimeout(() => flashcard.classList.remove('scale-[0.98]'), 140);
    }
  }

  function transitionToNextCard() {
    if (isCardTransitioning) return;
    const total = activeDeck.length;

    if (currentCardIndex >= total - 1) {
      launchGameDirectly();
      return;
    }

    isCardTransitioning = true;
    const topEl = flashcardWrapper || flashcard;

    topEl.style.transition = 'transform 250ms ease-in, opacity 250ms ease-in';
    topEl.style.transform = 'translateX(-120%) rotate(-15deg)';
    topEl.style.opacity = '0';

    if (flashcardBehind) {
      flashcardBehind.style.transition = 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      flashcardBehind.style.transform = 'translateY(0px) scale(1)';
      flashcardBehind.style.opacity = '1';
    }

    if (flashcardDeckLayer2) {
      flashcardDeckLayer2.style.transition = 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      flashcardDeckLayer2.style.transform = 'translateY(-8px) scale(0.95)';
      flashcardDeckLayer2.style.opacity = '0.7';
    }

    setTimeout(() => {
      currentCardIndex++;
      renderCurrentCard();

      const currentCourse = window.currentActiveCourse || 'es';
      const nextCard = activeDeck[currentCardIndex];
      if (nextCard) {
        const canAutoPlay = !window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false;
        if (canAutoPlay) {
          speakWord(nextCard.word || nextCard.term, currentCourse);
        }
      }

      topEl.style.transition = 'none';
      topEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
      topEl.style.opacity = '1';
      topEl.style.removeProperty('--drag-x');
      topEl.style.removeProperty('--drag-y');
      topEl.style.removeProperty('--drag-rot');

      if (flashcardBehind) {
        flashcardBehind.style.transition = 'none';
        flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
        flashcardBehind.style.opacity = (currentCardIndex < total - 1) ? '0.7' : '0.5';
      }
      if (flashcardDeckLayer2) {
        flashcardDeckLayer2.style.transition = 'none';
        flashcardDeckLayer2.style.transform = 'translateY(-16px) scale(0.90)';
        flashcardDeckLayer2.style.opacity = (currentCardIndex < total - 2) ? '0.8' : '0';
      }

      void topEl.offsetWidth;

      setTimeout(() => {
        isCardTransitioning = false;
      }, 20);
    }, 250);
  }

  function transitionToPrevCard() {
    if (isCardTransitioning) return;
    if (currentCardIndex <= 0) {
      resetCardPosition();
      return;
    }

    isCardTransitioning = true;
    const topEl = flashcardWrapper || flashcard;
    const total = activeDeck.length;

    const currentCardData = activeDeck[currentCardIndex];
    if (flashcardBehind && currentCardData) {
      const isCurSentence = currentCardData.type === 'sentence' || currentCardData.isSentence || currentCardIndex >= 10;
      if (flashcardBehindTag) flashcardBehindTag.textContent = currentCardData.tag || (isCurSentence ? '실전 문장' : '핵심 어휘');
      if (flashcardBehindWord) flashcardBehindWord.textContent = currentCardData.word || currentCardData.term || '';
      if (flashcardBehindPhonetic) flashcardBehindPhonetic.textContent = currentCardData.phonetic || '';
      flashcardBehind.style.transition = 'none';
      flashcardBehind.style.transform = 'translateY(0px) scale(1)';
      flashcardBehind.style.opacity = '1';
    }

    currentCardIndex--;
    renderCurrentCard();

    const currentCourse = window.currentActiveCourse || 'es';
    const prevCard = activeDeck[currentCardIndex];
    if (prevCard) {
      const canAutoPlay = !window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false;
      if (canAutoPlay) {
        speakWord(prevCard.word || prevCard.term, currentCourse);
      }
    }

    topEl.style.transition = 'none';
    topEl.style.transform = 'translateX(-120%) rotate(-15deg)';
    topEl.style.opacity = '0';
    void topEl.offsetWidth;

    requestAnimationFrame(() => {
      topEl.style.transition = 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms ease-out';
      topEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
      topEl.style.opacity = '1';

      if (flashcardBehind) {
        flashcardBehind.style.transition = 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms ease-out';
        flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
        flashcardBehind.style.opacity = (currentCardIndex < total - 1) ? '0.7' : '0.5';
      }

      if (flashcardDeckLayer2) {
        flashcardDeckLayer2.style.transition = 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms ease-out';
        flashcardDeckLayer2.style.transform = 'translateY(-16px) scale(0.90)';
        flashcardDeckLayer2.style.opacity = (currentCardIndex < total - 2) ? '0.8' : '0';
      }

      setTimeout(() => {
        topEl.style.transition = '';
        topEl.style.transform = '';
        topEl.style.opacity = '';
        if (flashcardBehind) flashcardBehind.style.transition = '';
        if (flashcardDeckLayer2) flashcardDeckLayer2.style.transition = '';
        renderCurrentCard();
        isCardTransitioning = false;
      }, 250);
    });
  }

  function handleNextCard() {
    transitionToNextCard();
  }

  function handlePrevCard() {
    transitionToPrevCard();
  }

  // Drag & Swipe Gesture Handling
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let diffX = 0;
  let diffY = 0;

  function startDrag(clientX, clientY, target) {
    if (isCardTransitioning) return;
    if (target && target.closest('#flashcard-speaker-btn')) return;

    isDragging = true;
    startX = clientX;
    startY = clientY;
    currentX = clientX;
    currentY = clientY;
    diffX = 0;
    diffY = 0;

    const targetEl = flashcardWrapper || flashcard;
    if (targetEl) {
      targetEl.style.transition = 'none';
      targetEl.classList.add('cursor-grabbing');
      targetEl.classList.remove('cursor-grab');
    }
  }

  function moveDrag(clientX, clientY, e) {
    if (!isDragging || isCardTransitioning) return;

    currentX = clientX;
    currentY = clientY;
    diffX = currentX - startX;
    diffY = currentY - startY;

    if (e && e.cancelable) {
      e.preventDefault();
    }

    const targetEl = flashcardWrapper || flashcard;
    if (targetEl) {
      targetEl.style.transition = 'none';
      const rot = diffX * 0.08;
      targetEl.style.transform = `translate(${diffX}px, ${diffY * 0.3}px) rotate(${rot}deg)`;
      targetEl.style.setProperty('--drag-x', `${diffX}px`);
      targetEl.style.setProperty('--drag-y', `${diffY * 0.3}px`);
      targetEl.style.setProperty('--drag-rot', `${rot}deg`);
    }

    if (diffX < 0) {
      const progress = Math.min(1, Math.max(0, -diffX / 120));
      const behindScale = 0.95 + 0.05 * progress;
      const behindTranslateY = -8 + 8 * progress;
      const behindOpacity = 0.7 + 0.3 * progress;

      if (flashcardBehind) {
        flashcardBehind.style.transition = 'none';
        flashcardBehind.style.transform = `translateY(${behindTranslateY}px) scale(${behindScale})`;
        flashcardBehind.style.opacity = `${behindOpacity}`;
      }

      if (flashcardDeckLayer2) {
        const l2Scale = 0.90 + 0.05 * progress;
        const l2TranslateY = -16 + 8 * progress;
        flashcardDeckLayer2.style.transition = 'none';
        flashcardDeckLayer2.style.transform = `translateY(${l2TranslateY}px) scale(${l2Scale})`;
      }
    } else if (diffX > 0 && currentCardIndex > 0) {
      if (flashcardBehind) {
        flashcardBehind.style.transition = 'none';
        flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
        flashcardBehind.style.opacity = '0.7';
      }
    }
  }

  let lastFlipTimestamp = 0;
  function safeToggleCardFlip() {
    const now = Date.now();
    if (now - lastFlipTimestamp < 220) return;
    lastFlipTimestamp = now;
    toggleCardFlip();
  }

  function endDrag() {
    if (!isDragging || isCardTransitioning) return;
    isDragging = false;

    const targetEl = flashcardWrapper || flashcard;
    if (targetEl) {
      targetEl.classList.remove('cursor-grabbing');
      targetEl.classList.add('cursor-grab');
    }

    const moveDistance = Math.hypot(diffX, diffY);

    if (diffX <= -50) {
      transitionToNextCard();
      return;
    }

    if (diffX >= 50) {
      if (currentCardIndex > 0) {
        transitionToPrevCard();
      } else {
        resetCardPosition();
      }
      return;
    }

    resetCardPosition();
    if (moveDistance < 30) {
      safeToggleCardFlip();
    }
  }

  function resetCardPosition() {
    const targetEl = flashcardWrapper || flashcard;
    if (!targetEl) return;
    targetEl.style.removeProperty('--drag-x');
    targetEl.style.removeProperty('--drag-y');
    targetEl.style.removeProperty('--drag-rot');
    targetEl.style.transition = 'transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.22s ease';
    targetEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
    targetEl.style.opacity = '1';

    if (flashcardBehind) {
      flashcardBehind.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
      flashcardBehind.style.transform = 'translateY(-8px) scale(0.95)';
      flashcardBehind.style.opacity = (currentCardIndex < activeDeck.length - 1) ? '0.7' : '0.5';
    }

    if (flashcardDeckLayer2) {
      flashcardDeckLayer2.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
      flashcardDeckLayer2.style.transform = 'translateY(-16px) scale(0.90)';
      flashcardDeckLayer2.style.opacity = (currentCardIndex < activeDeck.length - 2) ? '0.8' : '0';
    }

    setTimeout(() => {
      if (!isDragging && !isCardTransitioning && targetEl) {
        targetEl.style.transition = '';
        targetEl.style.transform = '';
      }
      if (flashcardBehind) flashcardBehind.style.transition = '';
      if (flashcardDeckLayer2) flashcardDeckLayer2.style.transition = '';
    }, 220);
  }

  function bindEvents() {
    initDOMElements();

    const gestureTarget = flashcardWrapper || flashcard;
    if (gestureTarget && !gestureTarget._gesturesBound) {
      gestureTarget._gesturesBound = true;

      gestureTarget.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return;
        startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }, { passive: true });

      gestureTarget.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
      }, { passive: false });

      gestureTarget.addEventListener('touchend', () => {
        if (!isDragging) return;
        endDrag();
      }, { passive: true });

      gestureTarget.addEventListener('touchcancel', () => {
        if (!isDragging) return;
        endDrag();
      }, { passive: true });

      gestureTarget.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target && e.target.closest('#flashcard-speaker-btn')) return;
        startDrag(e.clientX, e.clientY, e.target);
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        moveDrag(e.clientX, e.clientY, e);
      });

      window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        endDrag();
      });

      gestureTarget.addEventListener('mouseleave', (e) => {
        if (isDragging && e.buttons === 0) endDrag();
      });

      gestureTarget.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          safeToggleCardFlip();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextCard();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevCard();
        }
      });
    }

    // 중앙 카드 직접 탭 / 클릭 이벤트 (뒤집기 보장)
    if (flashcard) {
      flashcard.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e && e.target && e.target.closest('#flashcard-speaker-btn')) return;
        safeToggleCardFlip();
      };
    }

    if (flashcardSpeakerBtn) {
      flashcardSpeakerBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        flashcardSpeakerBtn.classList.add('scale-110');
        setTimeout(() => flashcardSpeakerBtn.classList.remove('scale-110'), 180);
        const cardData = activeDeck[currentCardIndex];
        if (cardData) {
          speakWord(cardData.word || cardData.term, window.currentActiveCourse || 'es', flashcardSpeakerBtn);
        }
      };
    }

    // 힌트 텍스트 탭 시 뒤집기 (기본 동작 및 버블링 차단)
    if (flashcardHint) {
      flashcardHint.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        safeToggleCardFlip();
      };
    }

    // 상단 '✕' 닫기 버튼: 유저가 직접 누를 때만 로드맵으로 복귀하도록 이벤트 엄격 제한
    if (flashcardCloseBtn) {
      flashcardCloseBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        closeFlashcardScreen(true);
      };
    }

    // 건너뛰기 버튼: 로드맵으로 나가지 않고 곧바로 게임 시작
    if (flashcardSkipBtn) {
      flashcardSkipBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        launchGameDirectly(e);
      };
    }

    // 다음 버튼 클릭: preventDefault, stopPropagation 적용 및 다음 카드/게임 실행
    if (flashcardNextBtn) {
      flashcardNextBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNextCard();
      };
    }

    // 이전 버튼 클릭: preventDefault, stopPropagation 적용
    if (flashcardPrevBtn) {
      flashcardPrevBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handlePrevCard();
      };
    }

    // 하단 CTA 버튼 클릭: preventDefault, stopPropagation 적용
    if (flashcardCtaBtn) {
      flashcardCtaBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNextCard();
      };
    }

    // 배경 클릭(backdrop)에 의한 로드맵 튕김 완전 차단 (이벤트 등록 안 함)
  }

  // Export module functions globally
  window.openFlashcardScreen = openFlashcardScreen;
  window.openFlashcard = openFlashcardScreen;
  window.startFlashcard = openFlashcardScreen;
  window.showFlashcardScreen = openFlashcardScreen;
  window.closeFlashcardScreen = closeFlashcardScreen;
  window.initFlashcardDeck = openFlashcardScreen;
  window.loadFlashcards = openFlashcardScreen;
  window.toggleCardFlip = toggleCardFlip;
  window.handleNextCard = handleNextCard;
  window.handlePrevCard = handlePrevCard;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
