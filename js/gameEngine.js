// =================================================
// VocaDash Game Engine Module (js/gameEngine.js)
// 단어 낙하 루프, 위험선 감지, 4지선다 판정, 4종 아이템(패스/빙결/폭탄/회복)
// =================================================

(function () {
  // =================================================
  // 브라우저 강제 이동 및 새로고침 차단 쉴드
  // =================================================
  try {
    if (typeof history !== 'undefined') {
      if (history.go) history.go = function (delta) { console.warn('🛑 history.go() 호출 차단됨:', delta); };
      if (history.back) history.back = function () { console.warn('🛑 history.back() 호출 차단됨'); };
      if (history.forward) history.forward = function () { console.warn('🛑 history.forward() 호출 차단됨'); };
    }
    if (typeof HTMLFormElement !== 'undefined' && HTMLFormElement.prototype) {
      HTMLFormElement.prototype.submit = function () {
        console.warn('🛑 HTMLFormElement.submit() 호출 차단됨');
        return false;
      };
    }
  } catch (_) { }

  // 전역 에러 / 비동기 예외 포착 (브라우저 크래시 및 새로고침 방어)
  window.addEventListener('error', (e) => {
    console.warn('⚠️ 스크립트 예외 안전 포착 (게임 진행 유지):', e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('⚠️ Promise 예외 안전 포착 (게임 진행 유지):', e.reason);
  });

  // Sound Effect Synthesis
  function playSuccessChime() {
    if (window.vocadashSettings && window.vocadashSettings.soundEffects === false) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._vocaAudioCtx) {
        window._vocaAudioCtx = new AudioCtx();
      }
      if (typeof window.playSound === 'function') {
        window.playSound('correct');
        return;
      }
      const ctx = window._vocaAudioCtx;
      if (ctx.state === 'suspended') {
        try { ctx.resume().catch(() => { }); } catch (_) { }
      }
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.09);
      gain2.gain.setValueAtTime(0.28, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.38);
    } catch (e) { }
  }

  function playWrongBuzzer() {
    if (typeof window.playSound === 'function') {
      window.playSound('wrong');
      return;
    }
    if (window.vocadashSettings && window.vocadashSettings.soundEffects === false) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._vocaAudioCtx) {
        window._vocaAudioCtx = new AudioCtx();
      }
      const ctx = window._vocaAudioCtx;
      if (ctx.state === 'suspended') {
        try { ctx.resume().catch(() => { }); } catch (_) { }
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_) { }
  }
  window.playWrongBuzzer = playWrongBuzzer;

  function playComboChime(comboCount = 2) {
    if (window.vocadashSettings && window.vocadashSettings.soundEffects === false) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._vocaAudioCtx) {
        window._vocaAudioCtx = new AudioCtx();
      }
      const ctx = window._vocaAudioCtx;
      if (ctx.state === 'suspended') {
        try { ctx.resume().catch(() => { }); } catch (_) { }
      }
      const now = ctx.currentTime;
      const baseFreq = 587.33; // D5
      const mult = Math.min(1 + (comboCount - 2) * 0.08, 1.6);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, now);
      osc.frequency.setValueAtTime(baseFreq * mult * 1.33, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_) { }
  }
  window.playComboChime = playComboChime;

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
      } catch (_) { }
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

  let ttsTimer = null;

  function stopTTS() {
    if (ttsTimer) {
      clearTimeout(ttsTimer);
      ttsTimer = null;
    }
    if (currentPlayingAudio) {
      try {
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      } catch (_) { }
      currentPlayingAudio = null;
    }
    if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) { }
    }
    if (typeof window.stopAllTTS === 'function' && window.stopAllTTS !== stopTTS) {
      try {
        window.stopAllTTS();
      } catch (_) { }
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

  window.safePlayTTS = safePlayTTS;
  window.speakWord = safePlayTTS;
  window.playTTS = safePlayTTS;

  // DOM Elements
  let gameScreen;
  let gameContainer;
  let gameHeartsContainer;
  let gameStageTitle;
  let gameCloseBtn;
  let gameProgressBar;
  let gameProgressText;
  let gameComboBadge;
  let gameComboText;
  let gameSpeedText;
  let gameArena;
  let gameFreezeOverlay;
  let gameFloatingEffect;
  let gameFloatingText;
  let gameDroppingBubble;
  let gameDroppingWord;
  let gameDeadline;

  // Dialogs
  let gamePauseDialog;
  let gameResumeBtn;
  let gameQuitBtn;

  // Items
  let gameItemPass;
  let gameItemPassCount;
  let gameItemFreeze;
  let gameItemFreezeCount;
  let gameItemBomb;
  let gameItemBombCount;
  let gameItemHeal;
  let gameItemHealCount;

  // Choices
  let choicesContainer;
  let gameChoiceBtns = [];

  // Game Engine State
  let currentGameLessonId = 'node-2';
  let gameQuestions = [];
  let currentQuestionIdx = 0;
  let currentHearts = 5;
  let combo = 0;
  let maxCombo = 0;
  let score = 0;
  let speedMultiplier = 1.0;

  const DEFAULT_INVENTORY_VALS = Object.freeze({ pass: 2, freeze: 1, bomb: 1, heal: 1 });
  function loadInventoryFromStorage() {
    if (typeof window.getVocaInventory === 'function') {
      return window.getVocaInventory();
    }
    try {
      const raw = localStorage.getItem('vocadash_inventory');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            pass: Math.max(0, Math.min(5, Number(parsed.pass ?? DEFAULT_INVENTORY_VALS.pass))),
            freeze: Math.max(0, Math.min(5, Number(parsed.freeze ?? DEFAULT_INVENTORY_VALS.freeze))),
            bomb: Math.max(0, Math.min(5, Number(parsed.bomb ?? DEFAULT_INVENTORY_VALS.bomb))),
            heal: Math.max(0, Math.min(5, Number(parsed.heal ?? DEFAULT_INVENTORY_VALS.heal)))
          };
        }
      }
    } catch (_) { }
    return { ...DEFAULT_INVENTORY_VALS };
  }

  function syncInventoryToStorage(inv) {
    if (typeof window.saveVocaInventory === 'function') {
      window.saveVocaInventory(inv);
      return;
    }
    try {
      localStorage.setItem('vocadash_inventory', JSON.stringify(inv));
    } catch (_) { }
  }

  window.gameItemCounts = loadInventoryFromStorage();
  let itemCounts = window.gameItemCounts;

  let isActive = false;
  let isGameActive = false;
  window.isActive = false;
  window.isGameActive = false;
  let isPaused = false;
  let isFrozen = false;
  let isQuestionActive = false;
  let dropRafId = null;
  let dropStartTime = 0;
  let lastFrameTimestamp = 0;
  let pauseStartTime = 0;
  let freezeTimer = null;
  let gameNextQuestionTimer = null;
  let gameTimer = null;
  window.gameTimer = null;
  let currentCorrectChoiceIdx = -1;
  const dropBaseDuration = 11500; // 약 11.5초

  let missedWords = [];
  let isCurrentQuestionFailed = false;

  function resolveCurrentNode(lessonId) {
    const targetId = lessonId || window.currentGameLessonId || window.currentSelectedNodeId || 'node-2';
    const activeCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : (window.packFootballData || window.courseData);
    const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourseLang) : 1) || 1;
    const currentUnitIndex = (typeof window.currentUnitIndex === 'number' && !isNaN(window.currentUnitIndex))
      ? window.currentUnitIndex
      : Math.max(0, unlockedLevel - 1);
    const curUnit = (activeCourse && Array.isArray(activeCourse.units))
      ? (activeCourse.units[currentUnitIndex] || activeCourse.units[0])
      : null;

    let foundNode = null;
    if (curUnit && Array.isArray(curUnit.nodes)) {
      foundNode = curUnit.nodes.find(n => n.id === targetId);
      if (!foundNode) {
        if (targetId === 'node-1' || String(targetId).endsWith('node-1') || String(targetId).endsWith('stage-1')) foundNode = curUnit.nodes.find(n => n.stageNumber === 1 || (n.id && n.id.endsWith('_n1')));
        else if (targetId === 'node-2' || String(targetId).endsWith('node-2') || String(targetId).endsWith('stage-2')) foundNode = curUnit.nodes.find(n => n.stageNumber === 2 || (n.id && n.id.endsWith('_n2')));
        else if (targetId === 'node-3' || String(targetId).endsWith('node-3') || String(targetId).endsWith('stage-3')) foundNode = curUnit.nodes.find(n => n.stageNumber === 3 || (n.id && n.id.endsWith('_n5')));
        else if (targetId === 'node-boss' || String(targetId).includes('boss')) foundNode = curUnit.nodes.find(n => n.type === 'boss' || (n.id && n.id.endsWith('_n6')));
      }
    }
    if (!foundNode && activeCourse && Array.isArray(activeCourse.units)) {
      for (const u of activeCourse.units) {
        if (Array.isArray(u.nodes)) {
          foundNode = u.nodes.find(n => n.id === targetId);
          if (foundNode) break;
        }
      }
    }
    if (!foundNode) {
      const coords = (typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(targetId) : null;
      const sNum = (coords && coords.nodeIndex === 'boss') ? 4 : (Number(coords?.nodeIndex) || (String(targetId).includes('1') ? 1 : String(targetId).includes('2') ? 2 : String(targetId).includes('3') ? 3 : 2));
      foundNode = { id: targetId, stageNumber: sNum, type: (sNum === 4 || String(targetId).includes('boss')) ? 'boss' : 'stage' };
    }
    return foundNode;
  }
  window.resolveCurrentNode = resolveCurrentNode;

  function getSlotAlias(activeNodeId, targetNodeId) {
    const check = (id) => {
      if (!id) return null;
      const s = String(id).toLowerCase();
      if (s === 'node-1' || s === 'node-2' || s === 'node-3' || s === 'node-boss') return s;

      // 언더바(_)와 하이픈(-) 둘 다 허용 및 복합 키 지원
      if (s.endsWith('_n1') || s.endsWith('-n1') || s.endsWith('node-1') || s.endsWith('stage-1')) return 'node-1';
      if (s.endsWith('_n2') || s.endsWith('-n2') || s.endsWith('node-2') || s.endsWith('stage-2')) return 'node-2';
      if (s.endsWith('_n5') || s.endsWith('-n5') || s.endsWith('node-3') || s.endsWith('stage-3')) return 'node-3';
      if (s.endsWith('_n6') || s.endsWith('-n6') || s.includes('boss')) return 'node-boss';

      return null;
    };
    return check(targetNodeId) || check(activeNodeId) || null;
  }
  window.getSlotAlias = getSlotAlias;


  function getNextNodeId(curNodeId, curUnit) {
    const slot = getSlotAlias(curNodeId, curNodeId);
    if (curUnit && Array.isArray(curUnit.nodes)) {
      if (slot === 'node-1') {
        const n2 = curUnit.nodes.find(n => n.stageNumber === 2 || (n.id && n.id.endsWith('_n2')));
        if (n2?.id) return n2.id;
      } else if (slot === 'node-2') {
        const bonus = curUnit.nodes.find(n => n.type === 'bonus' || (n.id && n.id.endsWith('_n3')));
        if (bonus?.id) return bonus.id;
      } else if (slot === 'node-3') {
        const nBoss = curUnit.nodes.find(n => n.type === 'boss' || (n.id && n.id.endsWith('_n6')));
        if (nBoss?.id) return nBoss.id;
      }
    }
    if (slot === 'node-1') return 'node-2';
    if (slot === 'node-2') return 'node-bonus';
    if (slot === 'node-3') return 'node-boss';
    return 'node-1';
  }


  window.getNextNodeId = getNextNodeId;

  // 모든 게임 타이머 (requestAnimationFrame, setTimeout, setInterval) 일괄 완전 초기화
  function clearAllGameTimers() {
    cancelGameLoop();
    if (gameNextQuestionTimer) {
      clearTimeout(gameNextQuestionTimer);
      gameNextQuestionTimer = null;
    }
    if (freezeTimer) {
      clearTimeout(freezeTimer);
      freezeTimer = null;
      isFrozen = false;
    }
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
    if (window.gameTimer) {
      clearInterval(window.gameTimer);
      window.gameTimer = null;
    }
    if (typeof this !== 'undefined' && this && this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }
  window.clearAllGameTimers = clearAllGameTimers;

  function initDOMElements() {
    gameScreen = document.getElementById('game-screen');
    gameContainer = document.getElementById('game-container');
    gameHeartsContainer = document.getElementById('game-hearts');
    gameStageTitle = document.getElementById('game-stage-title');
    gameCloseBtn = document.getElementById('game-close-btn');
    gameProgressBar = document.getElementById('game-progress-bar');
    gameProgressText = document.getElementById('game-progress-text');
    gameComboBadge = document.getElementById('game-combo-badge');
    gameComboText = document.getElementById('game-combo-text');
    gameSpeedText = document.getElementById('game-speed-text');
    gameArena = document.getElementById('game-arena');
    gameFreezeOverlay = document.getElementById('game-freeze-overlay');
    gameFloatingEffect = document.getElementById('game-floating-effect');
    gameFloatingText = document.getElementById('game-floating-text');
    gameDroppingBubble = document.getElementById('game-dropping-bubble');
    gameDroppingWord = document.getElementById('game-dropping-word');
    gameDeadline = document.getElementById('game-deadline');

    gamePauseDialog = document.getElementById('game-pause-dialog');
    gameResumeBtn = document.getElementById('game-resume-btn');
    gameQuitBtn = document.getElementById('game-quit-btn');

    gameItemPass = document.getElementById('game-item-pass');
    gameItemPassCount = document.getElementById('game-item-pass-count');
    gameItemFreeze = document.getElementById('game-item-freeze');
    gameItemFreezeCount = document.getElementById('game-item-freeze-count');
    gameItemBomb = document.getElementById('game-item-bomb');
    gameItemBombCount = document.getElementById('game-item-bomb-count');
    gameItemHeal = document.getElementById('game-item-heal');
    gameItemHealCount = document.getElementById('game-item-heal-count');

    choicesContainer = document.getElementById('game-choices-container');
    gameChoiceBtns = [
      document.getElementById('game-choice-0'),
      document.getElementById('game-choice-1'),
      document.getElementById('game-choice-2'),
      document.getElementById('game-choice-3')
    ];
  }

  function cancelGameLoop() {
    if (dropRafId !== null) {
      cancelAnimationFrame(dropRafId);
      dropRafId = null;
    }
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
    if (window.gameTimer) {
      clearInterval(window.gameTimer);
      window.gameTimer = null;
    }
    if (typeof this !== 'undefined' && this && this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  function updateHeartsUI() {
    if (!gameHeartsContainer) initDOMElements();
    if (!gameHeartsContainer) return;
    gameHeartsContainer.textContent = '';
    for (let i = 0; i < 5; i++) {
      const heartSpan = document.createElement('span');
      heartSpan.className = i < currentHearts
        ? 'game-heart material-symbols-outlined text-[14px] text-error transition-all transform hover:scale-110'
        : 'game-heart material-symbols-outlined text-[14px] text-slate-300 transition-all opacity-40';
      heartSpan.style.fontVariationSettings = i < currentHearts ? '"FILL" 1' : '"FILL" 0';
      heartSpan.textContent = 'favorite';
      gameHeartsContainer.appendChild(heartSpan);
    }
  }

  function decreaseHeart() {
    if (window.isRoadmapReviewSpeedrun || window.isReviewGameMode) {
      // 오답런 진행 중에는 문제를 틀려도 하트가 깎이지 않음!
      combo = 0;
      speedMultiplier = window.currentRoundBaseSpeed || 1.0;
      updateHeartsUI();
      updateHeaderStatusUI();
      return currentHearts;
    }

    currentHearts = Math.max(0, currentHearts - 1);
    if (typeof window.setUserHearts === 'function') {
      window.setUserHearts(currentHearts);
    } else {
      window.userHearts = currentHearts;
      try {
        localStorage.setItem('vocadash_hearts', String(currentHearts));
        if (currentHearts < 5 && !localStorage.getItem('vocadash_hearts_timer_start')) {
          localStorage.setItem('vocadash_hearts_timer_start', String(Date.now()));
        }
      } catch (_) { }
      if (typeof window.updateUserHeartsUI === 'function') window.updateUserHeartsUI();
    }
    combo = 0;
    speedMultiplier = window.currentRoundBaseSpeed || 1.0;
    updateHeartsUI();
    updateHeaderStatusUI();
    return currentHearts;
  }
  window.decreaseHeart = decreaseHeart;

  // 게임 세션 내 오답 단어 목록 수집 배열 (중복 없이 { id, word, pronunciation, meaning, example } 저장)
  if (!Array.isArray(window.currentSessionWrongWords)) {
    window.currentSessionWrongWords = [];
  }

  function recordSessionWrongWord(q) {
    if (!q) return;
    if (!Array.isArray(window.currentSessionWrongWords)) {
      window.currentSessionWrongWords = [];
    }
    const qWord = (q.isCloze ? (q.targetWord || q.word || q.term || '') : (q.word || q.term || '')).trim();
    const qMeaning = (q.meaning || q.korean || q.answer || '').trim();
    const qPron = (q.pronunciation || q.pron || q.phonetic || '').trim();
    const qExample = (q.targetSentence || q.example || q.example_es || q.exampleTarget || '').trim();
    const qId = q.id || `${qWord}_${qMeaning}`;

    const exists = window.currentSessionWrongWords.some(item =>
      (q.id && item.id === q.id) ||
      (qWord && (item.word === qWord || item.term === qWord))
    );
    if (!exists) {
      window.currentSessionWrongWords.push({
        id: qId,
        word: qWord,
        term: qWord,
        pronunciation: qPron,
        pron: qPron,
        phonetic: qPron,
        meaning: qMeaning,
        korean: qMeaning,
        example: qExample,
        exampleTarget: qExample
      });
      console.log(`📝 [오답 수집] "${qWord}" (${qMeaning}) 추가됨 (세션 총 ${window.currentSessionWrongWords.length}개)`);
    }
  }
  window.recordSessionWrongWord = recordSessionWrongWord;

  // 외운 단어(vocadash_mastered_words) 등록 헬퍼
  function addMasteredWord(item) {
    if (typeof window.addMasteredWord === 'function' && window.addMasteredWord !== addMasteredWord) {
      return window.addMasteredWord(item);
    }
    if (!item) return;
    const wordId = String(item.id || item.word || item.term || '').trim();
    if (!wordId) return;
    try {
      let list = [];
      const raw = localStorage.getItem('vocadash_mastered_words');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
      if (!list.includes(wordId)) {
        list.push(wordId);
        localStorage.setItem('vocadash_mastered_words', JSON.stringify(list));
      }
    } catch (_) { }
  }
  window.addMasteredWord = addMasteredWord;

  function addMasteredWords(items) {
    if (typeof window.addMasteredWords === 'function' && window.addMasteredWords !== addMasteredWords) {
      return window.addMasteredWords(items);
    }
    if (!Array.isArray(items) || items.length === 0) return;
    try {
      let list = [];
      const raw = localStorage.getItem('vocadash_mastered_words');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
      const set = new Set(list);
      items.forEach(item => {
        if (!item) return;
        const wordId = String(item.id || item.word || item.term || '').trim();
        if (wordId) set.add(wordId);
      });
      localStorage.setItem('vocadash_mastered_words', JSON.stringify(Array.from(set)));
    } catch (_) { }
  }
  window.addMasteredWords = addMasteredWords;

  // 문제 채점 시 통계 누적: vocadash_total_questions, vocadash_correct_answers, vocadash_mastered_words
  function recordQuizAttempt(isCorrect, question) {
    try {
      let total = parseInt(localStorage.getItem('vocadash_total_questions') || '0', 10);
      if (isNaN(total) || total < 0) total = 0;
      total += 1;
      localStorage.setItem('vocadash_total_questions', String(total));

      let correct = parseInt(localStorage.getItem('vocadash_correct_answers') || '0', 10);
      if (isNaN(correct) || correct < 0) correct = 0;
      if (isCorrect) {
        correct += 1;
        localStorage.setItem('vocadash_correct_answers', String(correct));
        addMasteredWord(question);
      }

      const accuracy = total > 0 ? Math.round((Math.min(correct, total) / total) * 100) : 0;
      localStorage.setItem('vocadash_overall_accuracy', String(accuracy));

      if (typeof window.updateProfileStats === 'function') {
        window.updateProfileStats();
      } else if (typeof window.updateStatsScreenUI === 'function') {
        window.updateStatsScreenUI();
      }
    } catch (e) {
      console.warn('[VocaDash] recordQuizAttempt error:', e);
    }
  }
  window.recordQuizAttempt = recordQuizAttempt;

  function triggerGameOver() {
    console.log('💀 triggerGameOver: 게임오버 처리 시작 (순수 SPA 모달 표출, 리로드/퇴장 완전 금지)');
    // ① 모든 게임 타이머 정지 (clearInterval, clearTimeout)
    clearAllGameTimers();
    cancelGameLoop();
    dropRafId = null;
    if (window.stopTTS) window.stopTTS();
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) { }
    }

    // ② this.isGameActive = false 설정
    this.isGameActive = false;
    isGameActive = false;
    isActive = false;
    isQuestionActive = false;
    window.isGameActive = false;
    window.isActive = false;

    // ③ 페이지를 새로고침하거나 로드맵으로 튕겨 나가지 말 것
    // ④ 오직 화면의 결과 모달(#game-result-modal)의 게임오버 카드(#game-result-gameover-card)만 화면에 띄움
    finishGameStage(false);
  }
  window.triggerGameOver = triggerGameOver;
  window.handleGameOver = triggerGameOver;

  function resetGame() {
    console.log('🔄 resetGame: 게임 리셋');
    window.currentSessionWrongWords = [];
    clearAllGameTimers();
    cancelGameLoop();
    dropRafId = null;
    currentHearts = (typeof window.userHearts === 'number' && window.userHearts >= 0) ? window.userHearts : 5;
    combo = 0;
    maxCombo = 0;
    score = 0;
    speedMultiplier = window.currentRoundBaseSpeed || 1.0;
    currentQuestionIdx = 0;
    missedWords = [];
    isQuestionActive = false;
    isFrozen = false;
    isCurrentQuestionFailed = false;
    this.isGameActive = false;
    isGameActive = false;
    isActive = false;
    window.isGameActive = false;
    window.isActive = false;
    updateHeartsUI();
    updateHeaderStatusUI();
  }
  window.resetGame = resetGame;

  function updateItemCountUI() {
    const counts = window.gameItemCounts || itemCounts || loadInventoryFromStorage();
    if (gameItemPassCount) gameItemPassCount.textContent = `x${counts.pass}`;
    if (gameItemPass) {
      gameItemPass.disabled = counts.pass <= 0;
      gameItemPass.classList.toggle('opacity-40', counts.pass <= 0);
      gameItemPass.classList.toggle('cursor-not-allowed', counts.pass <= 0);
    }
    if (gameItemFreezeCount) gameItemFreezeCount.textContent = `x${counts.freeze}`;
    if (gameItemFreeze) {
      const isFreezeDisabled = counts.freeze <= 0 || isFrozen;
      gameItemFreeze.disabled = isFreezeDisabled;
      gameItemFreeze.classList.toggle('opacity-40', isFreezeDisabled);
      gameItemFreeze.classList.toggle('cursor-not-allowed', isFreezeDisabled);
    }
    if (gameItemBombCount) gameItemBombCount.textContent = `x${counts.bomb}`;
    if (gameItemBomb) {
      gameItemBomb.disabled = counts.bomb <= 0;
      gameItemBomb.classList.toggle('opacity-40', counts.bomb <= 0);
      gameItemBomb.classList.toggle('cursor-not-allowed', counts.bomb <= 0);
    }
    if (gameItemHealCount) gameItemHealCount.textContent = `x${counts.heal}`;
    if (gameItemHeal) {
      gameItemHeal.disabled = counts.heal <= 0;
      gameItemHeal.classList.toggle('opacity-40', counts.heal <= 0);
      gameItemHeal.classList.toggle('cursor-not-allowed', counts.heal <= 0);
    }
  }

  function updateHeaderStatusUI() {
    const total = gameQuestions.length || 13;
    const currentNum = Math.min(currentQuestionIdx + 1, total);

    if (gameProgressText) gameProgressText.textContent = `${currentNum}/${total}`;
    if (gameProgressBar) {
      const pct = Math.round((currentNum / total) * 100);
      gameProgressBar.style.width = `${pct}%`;
    }

    if (gameComboText) gameComboText.textContent = `Combo x${combo}`;
    if (gameSpeedText) gameSpeedText.textContent = `${speedMultiplier.toFixed(1)}x`;

    if (gameComboBadge) {
      if (combo >= 3) {
        gameComboBadge.className = 'flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold border border-amber-600 shadow-sm animate-pulse transition-all';
      } else if (combo >= 1) {
        gameComboBadge.className = 'flex items-center gap-1 bg-tertiary-container/30 text-on-tertiary-container px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold border border-tertiary-container/40 transition-all';
      } else {
        gameComboBadge.className = 'flex items-center gap-1 bg-tertiary-container/10 text-on-tertiary-container/70 px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold border border-slate-200 transition-all';
      }
    }

    updateHeartsUI();
  }

  function showGameFloatingEffect(text, isPositive = true) {
    if (!gameFloatingEffect || !gameFloatingText) return;
    gameFloatingText.textContent = text;
    if (isPositive) {
      gameFloatingText.className = 'px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-headline-sm text-sm font-extrabold shadow-lg inline-block whitespace-nowrap';
    } else {
      gameFloatingText.className = 'px-3.5 py-1.5 rounded-full bg-rose-500 text-white font-headline-sm text-sm font-extrabold shadow-lg inline-block whitespace-nowrap';
    }

    gameFloatingEffect.classList.remove('hidden', 'animate-float-pop');
    void gameFloatingEffect.offsetWidth;
    gameFloatingEffect.classList.add('animate-float-pop');
  }

  // 별점 계산 함수 (표준 기준: 정확도 90% 이상 ⭐⭐⭐, 70~89% ⭐⭐☆, 50~69% ⭐☆☆, 50% 미만 별 0개)
  function calculateStarsByAccuracy(accuracy) {
    const acc = Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0)));
    if (acc >= 90) return 3;
    if (acc >= 70) return 2;
    if (acc >= 50) return 1;
    return 0;
  }
  window.calculateStarsByAccuracy = calculateStarsByAccuracy;

  // 클리어 모달 별점(0~3개) 렌더링 함수
  function renderModalStars(starCount) {
    const count = Math.max(0, Math.min(3, Number(starCount) || 0));
    const starIds = ['result-star-1', 'result-star-2', 'result-star-3'];

    starIds.forEach((id, idx) => {
      const starEl = document.getElementById(id);
      if (!starEl) return;
      const isActive = idx < count;
      const icon = starEl.querySelector('span');

      // DOM의 active 별 아이콘 클래스 정확히 토글
      starEl.classList.toggle('active', isActive);

      if (isActive) {
        starEl.style.opacity = '1';
        starEl.style.filter = 'none';
        starEl.classList.remove('grayscale', 'opacity-25', 'opacity-30', 'ring-slate-300/30');
        starEl.classList.add('opacity-100');
        if (idx === 1) {
          starEl.style.boxShadow = '0 0 18px rgba(245, 158, 11, 0.7)';
        } else {
          starEl.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.5)';
        }
        if (icon) {
          icon.style.color = '#b45309';
          icon.style.setProperty('font-variation-settings', "'FILL' 1");
          icon.classList.remove('text-slate-400', 'text-slate-300');
          icon.classList.add('text-amber-500', 'active');
        }
        if (idx === 2 && count === 3) {
          starEl.classList.add('scale-110', 'animate-bounce');
        } else {
          starEl.classList.remove('scale-110', 'animate-bounce');
        }
      } else {
        starEl.style.opacity = '0.25';
        starEl.style.filter = 'grayscale(100%)';
        starEl.style.boxShadow = 'none';
        starEl.classList.add('grayscale', 'opacity-30', 'ring-slate-300/30');
        starEl.classList.remove('opacity-100', 'scale-110', 'animate-bounce');
        if (icon) {
          icon.style.color = '#94a3b8';
          icon.style.setProperty('font-variation-settings', "'FILL' 0");
          icon.classList.remove('text-amber-500', 'active');
          icon.classList.add('text-slate-400');
        }
      }
    });
  }
  window.renderModalStars = renderModalStars;

  // 결과 모달 렌더링 단일화 (finishGameStage로 직접 위임하여 중복 및 덮어쓰기 버그 원천 차단)
  function renderResultModal(isClear) {
    return finishGameStage(isClear);
  }
  window.renderResultModal = renderResultModal;

  let isStageFinishing = false;
  window.isStageFinishing = false;
  let isHandlingResultPrimary = false;

  // 💡 플래그를 외부(치트 패널 등)에서도 언제든 풀 수 있도록 전역 헬퍼 제공
  window.resetStageFinishingFlag = function () {
    isStageFinishing = false;
    window.isStageFinishing = false;
    isHandlingResultPrimary = false;
  };

  function finishGameStage(isClear = true, customAccuracy = null) {
    if (isStageFinishing) {
      console.warn('🛑 [finishGameStage] 중복 호출 차단됨 (이미 완주 처리 진행 중)');
      return false;
    }
    isStageFinishing = true;
    window.isStageFinishing = true;

    // 💡 [핵심] 처리 완료 후 800ms 뒤에 자동으로 플래그를 해제하여 다음 클릭/치트 허용
    setTimeout(() => {
      isStageFinishing = false;
      window.isStageFinishing = false;
    }, 800);

    try {

      // 0) 결과 모달 노출 및 카드 상태 분기
      const resultModal = document.getElementById('game-result-modal');
      const clearCard = document.getElementById('game-result-clear-card');
      const gameoverCard = document.getElementById('game-result-gameover-card');
      const dropBubble = document.getElementById('game-dropping-bubble');

      if (resultModal) {
        resultModal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        resultModal.classList.add('opacity-100', 'pointer-events-auto');
        resultModal.style.display = 'flex';
        resultModal.style.pointerEvents = 'auto';
        resultModal.style.zIndex = '9999';
      }

      if (clearCard) {
        clearCard.classList.toggle('hidden', !isClear);
        clearCard.style.display = isClear ? 'flex' : 'none';
      }
      if (gameoverCard) {
        gameoverCard.classList.toggle('hidden', isClear);
        gameoverCard.style.display = isClear ? 'none' : 'flex';
      }

      if (dropBubble) {
        dropBubble.classList.add('hidden');
        dropBubble.style.display = 'none';
        dropBubble.style.opacity = '0';
      }

      // 1) 타이머 및 애니메이션 정리 단일화
      if (typeof clearAllGameTimers === 'function') clearAllGameTimers();
      if (typeof cancelGameLoop === 'function') cancelGameLoop();
      clearTimeout(gameNextQuestionTimer);
      gameNextQuestionTimer = null;

      if (typeof this !== 'undefined' && this) {
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.isGameActive = false;
      }
      if (typeof dropRafId !== 'undefined' && dropRafId !== null) {
        cancelAnimationFrame(dropRafId);
        dropRafId = null;
      }

      isActive = false;
      isGameActive = false;
      window.isActive = false;
      window.isGameActive = false;
      isQuestionActive = false;

      if (typeof window.stopTTS === 'function') window.stopTTS();
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (_) { }
      }

      // 2) 낙하 DOM 숨김
      const droppingEl = document.getElementById('dropping-word') || dropBubble || document.getElementById('game-dropping-word');
      if (droppingEl) droppingEl.style.display = 'none';

      // 3) 보상/점수/경험치/콤보 UI 텍스트 반영
      try {
        const scoreVal = (typeof this !== 'undefined' && this && this.score) || (typeof score !== 'undefined' ? score : 0);
        const scoreEl = document.getElementById('result-score');
        if (scoreEl) scoreEl.textContent = scoreVal;
        const expEl = document.getElementById('result-exp');
        if (expEl) expEl.textContent = '50';
        const corrEl = document.getElementById('result-correct-count');
        if (corrEl) corrEl.textContent = String(gameQuestions?.length || 13);
        const xpText = document.getElementById('result-xp-text');
        if (xpText) xpText.textContent = '+50 XP';
        const comboText = document.getElementById('result-combo-text');
        if (comboText) comboText.textContent = `x${(typeof maxCombo !== 'undefined' ? maxCombo : (typeof combo !== 'undefined' ? combo : 10))}`;
      } catch (_) { }

      // 사운드 재생
      if (isClear) {
        if (typeof playSound === 'function') playSound('clear');
        else if (typeof window.playSound === 'function') window.playSound('clear');
        else if (typeof playSuccessChime === 'function') playSuccessChime();
        else if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
      }

      // 스테이지 클리어 처리 및 저장
      if (isClear) {
        const actualUnitTitle = (typeof currentUnitTitle !== 'undefined' && currentUnitTitle)
          || (window.currentUnit?.title)
          || (window.courseData?.units?.[0]?.title)
          || '생존 첫걸음';
        window.actualUnitTitle = actualUnitTitle;

        // 1) 현재 언어 및 코스 식별
        const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        let rawTarget = window.currentGameLessonId || (typeof currentGameLessonId !== 'undefined' && currentGameLessonId) || window.currentSelectedNodeId || 'node-1';

        // 💡 [핵심 보정] 유저가 3번 노드 플레이 중이거나 3번 노드가 선택된 상태인데 rawTarget이 node-review로 남아있는 경우 원천 차단
        const isTargetReview = rawTarget === 'node-review' || rawTarget === 'review' || String(rawTarget).includes('review');
        const isNode3Selected = window.currentSelectedNodeId === 'node-3' || window.currentSelectedNodeId === 'u1_stage-3' || /(^|_)stage-?3$/.test(window.currentSelectedNodeId || '') || /(^|_)node-?3$/.test(window.currentSelectedNodeId || '') || window.currentLessonId === 'node-3';
        if (isTargetReview && isNode3Selected && !window.isReviewGameMode && !window.isRoadmapReviewSpeedrun) {
          console.log('🔄 [finishGameStage] 3번 노드 플레이 중 node-review 잔여값 감지 -> node-3으로 정규화 복원');
          rawTarget = 'node-3';
          currentGameLessonId = 'node-3';
          window.currentGameLessonId = 'node-3';
          window.currentSelectedNodeId = 'node-3';
        }

        let activeCourseId = (String(rawTarget).startsWith('fb_') || String(window.currentGameLessonId || '').startsWith('fb_'))
          ? 'pack_football'
          : (window.activeCourseId ||
            window.currentCourseId ||
            (window.isFootballMode || window.isFootballPack ? 'pack_football' : null) ||
            (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentCourseLang) : null) ||
            'main');
        if (currentCourseLang === 'en' && activeCourseId === 'pack_football') {
          activeCourseId = 'main';
        }
        window.activeCourseId = activeCourseId;
        window.currentCourseId = activeCourseId;

        // 1과가 3회 미만인데 2과로 튄 경우 방어
        let n1Saved = 0;
        if (typeof window.getNodeProgress === 'function') {
          n1Saved = Number(window.getNodeProgress('node-1', currentCourseLang, activeCourseId)) || 0;
        } else {
          try {
            const raw = localStorage.getItem(`vocadash_prog_${currentCourseLang}_${activeCourseId}_u1_n1`);
            if (raw) n1Saved = parseInt(raw, 10) || 0;
          } catch (_) { }
        }

        if (n1Saved < 3 && (rawTarget === 'node-2' || String(rawTarget).includes('n2') || String(rawTarget).includes('n3'))) {
          rawTarget = 'node-1';
        }

        const targetNodeId = rawTarget;
        const currentNode = (typeof resolveCurrentNode === 'function') ? resolveCurrentNode(targetNodeId) : { id: targetNodeId };
        const activeNodeId = currentNode?.id || targetNodeId;

        const aliasOf = (id) => (typeof getSlotAlias === 'function') ? getSlotAlias(id, id) : null;
        const slotAlias = aliasOf(activeNodeId) || aliasOf(targetNodeId) || (String(activeNodeId).includes('n1') ? 'node-1' : null);
        const isBossNode = (currentNode?.type === 'boss' || String(activeNodeId).includes('boss') || slotAlias === 'node-boss');
        const isNode1 = (slotAlias === 'node-1' || targetNodeId === 'node-1' || String(activeNodeId).includes('n1'));

        // 3) 기존 클리어 횟수 읽기 (언어/코스별 표준 격리 키 조회)
        let currentCount = 0;
        if (typeof window.getNodeProgress === 'function') {
          currentCount = Number(window.getNodeProgress(activeNodeId, currentCourseLang, activeCourseId)) || 0;
        } else {
          try {
            const coords = (typeof window.parseNodeCoordinates === 'function')
              ? window.parseNodeCoordinates(activeNodeId)
              : { unitIndex: 1, nodeIndex: 1 };
            const rawCount = localStorage.getItem(`vocadash_prog_${currentCourseLang}_${activeCourseId}_u${coords.unitIndex}_n${coords.nodeIndex}`);
            if (rawCount) currentCount = parseInt(rawCount, 10) || 0;
          } catch (_) { }
        }

        // 4) 회차 정직하게 +1 누적 (1회차 완료=1, 2회차 완료=2, 3회차 완료=3)
        const nextCount = isBossNode ? 3 : Math.min(3, currentCount + 1);
        const nodeData = { clearedCount: nextCount, stars: nextCount };

        // 🌟 [5] 순수 이번 게임 기준 오답 및 정확도 계산 (이전 세션 잔여 데이터 배제)
        const currentMissedList = (typeof missedWords !== 'undefined' && Array.isArray(missedWords) && missedWords.length > 0)
          ? missedWords
          : ((Array.isArray(window.missedWords) && window.missedWords.length > 0)
            ? window.missedWords
            : ((Array.isArray(window.currentSessionWrongWords) && window.currentSessionWrongWords.length > 0)
              ? window.currentSessionWrongWords
              : ((typeof missedWords !== 'undefined' && Array.isArray(missedWords)) ? missedWords : [])));
        const wrongCount = currentMissedList.length;
        const totalQ = (typeof gameQuestions !== 'undefined' && gameQuestions && gameQuestions.length) || (typeof window.gameQuestions !== 'undefined' && window.gameQuestions && window.gameQuestions.length) || 10;

        // 이번 게임 오답이 0개면 정확도 100% 보장 (customAccuracy 파라미터 지정 시 우선 반영)
        let calculatedAccuracy = 100;
        if (customAccuracy !== null && customAccuracy !== undefined && !isNaN(Number(customAccuracy))) {
          calculatedAccuracy = Math.max(0, Math.min(100, Math.round(Number(customAccuracy))));
        } else {
          calculatedAccuracy = wrongCount === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((totalQ - wrongCount) / totalQ) * 100)));
        }

        const applyAccuracyUI = () => {
          const accEl = document.getElementById('result-accuracy-text') ||
            document.getElementById('result-accuracy') ||
            document.querySelector('.result-accuracy-value') ||
            document.querySelector('[data-result-field="accuracy"]');
          if (accEl) {
            accEl.textContent = `${calculatedAccuracy}%`;
          }
          document.querySelectorAll('span, p').forEach(el => {
            const prev = el.previousElementSibling;
            if (prev && prev.textContent && prev.textContent.includes('정확도')) {
              el.textContent = `${calculatedAccuracy}%`;
            }
          });
        };
        applyAccuracyUI();

        // 🌟 스테이지 완주 시 출제 단어들을 외운 단어(vocadash_mastered_words)에 추가 & 통계 UI 실시간 동기화
        if (Array.isArray(gameQuestions) && gameQuestions.length > 0) {
          addMasteredWords(gameQuestions);
        }
        if (typeof window.updateProfileStats === 'function') {
          window.updateProfileStats();
        } else if (typeof window.updateStatsScreenUI === 'function') {
          window.updateStatsScreenUI();
        }

        // 🌟 [6] 별점 판정 (표준 기준: 정확도 90% 이상 ⭐⭐⭐, 70~89% ⭐⭐☆, 50~69% ⭐☆☆, 50% 미만 별 0개)
        const modalScoreStars = calculateStarsByAccuracy(calculatedAccuracy);
        window.lastEarnedStars = modalScoreStars;

        renderModalStars(modalScoreStars);

        // 🌟 [7] 상단 타이틀 & 서브타이틀 & 버튼 동적 갱신
        const resultTitle = document.getElementById('result-title');
        const resultSubtitle = document.getElementById('result-subtitle') || document.querySelector('#game-result-clear-card p');
        const btnPrimaryText = document.getElementById('btn-result-primary-text');
        const btnPrimaryIcon = document.getElementById('btn-result-primary-icon');
        if (btnPrimaryIcon) btnPrimaryIcon.style.display = 'none';

        if (window.isUnitSkipTestMode) {
          const skipTotalQ = (gameQuestions && gameQuestions.length) || 15;
          const skipMissed = (typeof missedWords !== 'undefined' && Array.isArray(missedWords)) ? missedWords : [];
          const correctCount = Math.max(0, skipTotalQ - skipMissed.length);
          const isPassed = correctCount >= 12;
          const targetUnit = window.currentSkipTestUnit || 2;
          if (resultTitle) resultTitle.textContent = isPassed ? '⚡ 건너뛰기 시험 통과!' : '⚡ 건너뛰기 시험 결과';
          if (resultSubtitle) {
            resultSubtitle.textContent = isPassed
              ? `정답 ${correctCount}/${skipTotalQ}개 (80% 이상 달성!) · Unit ${targetUnit} 해금 완료!`
              : `정답 ${correctCount}/${skipTotalQ}개 · 통과 기준(12문제)에 미달했습니다`;
          }
          if (btnPrimaryText) {
            btnPrimaryText.textContent = isPassed ? `해금된 Unit ${targetUnit}으로 이동 🚀` : '로드맵으로 돌아가기';
          }
        } else if (window.isReviewGameMode) {
          if (resultTitle) resultTitle.textContent = '⚡ 약점 극복 완료!';
          if (resultSubtitle) {
            resultSubtitle.textContent = window.isSpeedrunZeroWrongBonus
              ? '오답 없는 클린 런 완주! 3과가 해금되었습니다! 💎'
              : `정확도 ${calculatedAccuracy}% · 약점 극복 완료! 🔓`;
          }
          if (btnPrimaryText) {
            btnPrimaryText.textContent = window.isRoadmapReviewSpeedrun ? '다음 스테이지 ▶' : '오답노트로 복귀';
          }
        } else if (isBossNode) {
          if (resultTitle) resultTitle.textContent = modalScoreStars === 0 ? '클리어 실패' : '¡STAGE CLEAR!';
          if (resultSubtitle) {
            resultSubtitle.textContent = modalScoreStars === 0
              ? `${actualUnitTitle} 보스전 도전 실패 · 다시 도전하세요! 💪`
              : `${actualUnitTitle} 보스전 완파! 🏆`;
          }
          if (btnPrimaryText) {
            btnPrimaryText.textContent = modalScoreStars === 0 ? '다시 도전하기 🔄' : '다음 유닛 도전하기 🚀';
          }
        } else {
          if (resultTitle) resultTitle.textContent = modalScoreStars === 0 ? '클리어 실패' : '¡STAGE CLEAR!';
          if (resultSubtitle) {
            if (modalScoreStars === 0) {
              resultSubtitle.textContent = `${actualUnitTitle} 정확도 ${calculatedAccuracy}% · 아쉬워요! 다시 도전해 보세요 💪`;
            } else if (nextCount >= 3) {
              resultSubtitle.textContent = modalScoreStars === 3
                ? `${actualUnitTitle} (3/3) 클리어! ★ 3별 마스터!`
                : `${actualUnitTitle} (3/3) 클리어!`;
            } else {
              resultSubtitle.textContent = `${actualUnitTitle} (${nextCount}/3) 클리어!`;
            }
          }
          if (btnPrimaryText) {
            if (modalScoreStars === 0) {
              btnPrimaryText.textContent = '다시 도전하기 🔄';
            } else if (nextCount < 3) {
              btnPrimaryText.textContent = `다음 라운드 (${nextCount + 1}/3) ▶`;
            } else {
              btnPrimaryText.textContent = '다음 스테이지 ▶';
            }
          }
        }

        // 🌟 [9] 오답 단어 카드 및 복습 버튼 표시 제어
        const btnWrongReview = document.getElementById('btn-result-wrong-review');
        const missedSec = document.getElementById('result-missed-section');

        if (wrongCount > 0) {
          if (btnWrongReview) {
            btnWrongReview.classList.remove('hidden');
            btnWrongReview.style.display = 'flex';
            const btnWrongReviewText = document.getElementById('btn-result-wrong-review-text');
            if (btnWrongReviewText) btnWrongReviewText.textContent = `⚠️ 헷갈린 단어 ${wrongCount}개 복습하기`;
            btnWrongReview.onclick = function (e) {
              if (e) { e.preventDefault(); e.stopPropagation(); }
              if (typeof startWrongWordsMiniReview === 'function') startWrongWordsMiniReview();
              return false;
            };
          }
          if (missedSec) {
            missedSec.classList.remove('hidden');
            missedSec.style.display = 'block';
            const wWord = document.getElementById('result-missed-word');
            const wPhonetic = document.getElementById('result-missed-phonetic');
            const wMeaning = document.getElementById('result-missed-meaning');
            if (wWord) wWord.textContent = currentMissedList[0].word || currentMissedList[0].term || '';
            if (wPhonetic) wPhonetic.textContent = currentMissedList[0].phonetic || '';
            if (wMeaning) wMeaning.textContent = currentMissedList[0].meaning || '';
          }
        } else {
          // 다 맞혔을 경우 깔끔하게 완전 숨김
          if (btnWrongReview) {
            btnWrongReview.classList.add('hidden');
            btnWrongReview.style.display = 'none';
          }
          if (missedSec) {
            missedSec.classList.add('hidden');
            missedSec.style.display = 'none';
          }
          window.currentSessionWrongWords = [];
        }

        // 🌟 [10] 보상 지급
        const isBoss = isBossNode;
        const addGems = isBoss ? 20 : 10;
        const addXp = isBoss ? 100 : 50;

        let curGems = 120;
        try {
          const saved = localStorage.getItem('vocadash_gems');
          if (saved !== null) curGems = parseInt(saved, 10) || 120;
          curGems += addGems;
          localStorage.setItem('vocadash_gems', String(curGems));
        } catch (_) { }

        const gemsCountEl = document.getElementById('header-gems-count');
        if (gemsCountEl) gemsCountEl.textContent = curGems;
        const gemsText = document.getElementById('result-gems-text');
        if (gemsText) gemsText.textContent = `+${addGems} 💎`;
        const expEl = document.getElementById('result-exp');
        if (expEl) expEl.textContent = String(addXp);
        const xpText = document.getElementById('result-xp-text');
        if (xpText) xpText.textContent = `+${addXp} XP`;

        // 🌟 [11] 보스전 완료 시 다음 유닛 언락
        if (isBoss) {
          const activeCourse = (typeof window.getCurrentCourseData === 'function')
            ? window.getCurrentCourseData()
            : (window.packFootballData || window.courseData);
          let bossUnitIndex = 0;
          if (activeCourse?.units && Array.isArray(activeCourse.units)) {
            const idx = activeCourse.units.findIndex(u =>
              Array.isArray(u.nodes) && u.nodes.some(n => n.id === targetNodeId || n.id === activeNodeId)
            );
            if (idx !== -1) bossUnitIndex = idx;
          }
          const nextUnitLevel = bossUnitIndex + 2;
          if (typeof window.setUnlockedUnitLevel === 'function') {
            window.setUnlockedUnitLevel(nextUnitLevel, currentCourseLang, activeCourseId);
          }
          if (typeof window.unlockUnitsUpTo === 'function') {
            window.unlockUnitsUpTo(nextUnitLevel, currentCourseLang, activeCourseId);
          }
        }

        // 🌟 [12] 노드 진행도 동기화 (언어/코스별 표준 격리 저장)
        // 🌟 [12] 노드 진행도 동기화 (언어/코스별 표준 격리 저장)
        const isReviewNodeIdentifier = (id) => {
          if (!id) return false;
          const s = String(id);
          return s === 'node-review' || s === 'review' || s.includes('review');
        };
        const isStrictReviewNode = (isReviewNodeIdentifier(activeNodeId) || isReviewNodeIdentifier(targetNodeId))
          && (window.isReviewGameMode || window.isRoadmapReviewSpeedrun || isReviewNodeIdentifier(activeNodeId));

        if (isStrictReviewNode) {
          console.log('🛡️ [finishGameStage] 복습 노드 완료 격리 처리: 일반 노드 진행도 저장 차단');
          const coords = (typeof window.parseNodeCoordinates === 'function')
            ? window.parseNodeCoordinates(activeNodeId || targetNodeId)
            : { unitIndex: 1, nodeIndex: 4 };
          const uNum = coords.unitIndex || window.currentReviewUnitNumber || window.currentUnitNumber || 1;
          const reviewKey = (typeof window.getCompositeNodeKey === 'function')
            ? window.getCompositeNodeKey(activeNodeId || targetNodeId || 'node-review', uNum)
            : `u${uNum}_node-review`;

          if (!window.nodeProgressMap) window.nodeProgressMap = {};
          window.nodeProgressMap[reviewKey] = 1;
          if (uNum === 1) {
            window.nodeProgressMap['node-review'] = 1;
          }

          try {
            if (!Array.isArray(window.completedStages)) window.completedStages = [];
            if (!window.completedStages.includes(reviewKey)) window.completedStages.push(reviewKey);
            const savedStages = JSON.parse(localStorage.getItem('vocadash_completed_stages') || '[]');
            if (Array.isArray(savedStages) && !savedStages.includes(reviewKey)) {
              savedStages.push(reviewKey);
              localStorage.setItem('vocadash_completed_stages', JSON.stringify(savedStages));
            }
          } catch (_) { }

          if (typeof window.completeReviewNode === 'function') {
            window.completeReviewNode(reviewKey, uNum);
          }
          if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
          if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
        } else {
          const coords = (typeof window.parseNodeCoordinates === 'function')
            ? window.parseNodeCoordinates(activeNodeId)
            : { unitIndex: 1, nodeIndex: 1 };
          const uNum = coords.unitIndex || window.currentUnitNumber || 1;
          const nIdx = coords.nodeIndex || 1;
          const compositeStageKey = `u${uNum}_stage-${nIdx}`;
          const compositeNodeKey = `u${uNum}_node-${nIdx}`;

          // 1) 기본 저장 (기존 좌표 방식 및 복합 키 영구 저장)
          try {
            const progKey = `vocadash_prog_${currentCourseLang}_${activeCourseId}_u${coords.unitIndex}_n${coords.nodeIndex}`;
            localStorage.setItem(progKey, String(nextCount));
            localStorage.setItem(`node_progress_${currentCourseLang}_${activeCourseId}_${compositeNodeKey}`, String(nextCount));
            localStorage.setItem(`node_progress_${currentCourseLang}_${activeCourseId}_${compositeStageKey}`, String(nextCount));
            if (activeCourseId === 'main' && currentCourseLang === 'es') {
              localStorage.setItem(compositeNodeKey, String(nextCount));
              localStorage.setItem(compositeStageKey, String(nextCount));
            }

            if (!window.nodeProgressMap) window.nodeProgressMap = {};
            window.nodeProgressMap[activeNodeId] = nextCount;
            window.nodeProgressMap[compositeStageKey] = nextCount;
            window.nodeProgressMap[compositeNodeKey] = nextCount;
            if (uNum === 1) {
              window.nodeProgressMap[`node-${nIdx}`] = nextCount;
            }

            // completedStages 동기화
            if (!Array.isArray(window.completedStages)) window.completedStages = [];
            if (!window.completedStages.includes(compositeStageKey)) window.completedStages.push(compositeStageKey);
            if (!window.completedStages.includes(compositeNodeKey)) window.completedStages.push(compositeNodeKey);
            const savedStages = JSON.parse(localStorage.getItem('vocadash_completed_stages') || '[]');
            if (Array.isArray(savedStages)) {
              let updated = false;
              if (!savedStages.includes(compositeStageKey)) { savedStages.push(compositeStageKey); updated = true; }
              if (!savedStages.includes(compositeNodeKey)) { savedStages.push(compositeNodeKey); updated = true; }
              if (updated) localStorage.setItem('vocadash_completed_stages', JSON.stringify(savedStages));
            }

            // 💡 [핵심] 3번 노드 매핑 보정: 실제 3과 노드 완주 시 복합 키 규격 u${unitId}_node-3 및 actuallyPlayed 영구 저장
            const isActualNode3 = (
              nIdx === 3 ||
              activeNodeId === 'node-3' ||
              activeNodeId === `u${uNum}_node-3` ||
              activeNodeId === `u${uNum}_stage-3` ||
              String(activeNodeId).includes('node-3') ||
              String(activeNodeId).includes('stage-3') ||
              (String(activeNodeId).endsWith('_n5') && !String(activeNodeId).includes('review'))
            );
            if (isActualNode3) {
              localStorage.setItem(`vocadash_prog_${currentCourseLang}_${activeCourseId}_u${uNum}_n3`, String(nextCount));
              localStorage.setItem(`node_progress_${currentCourseLang}_${activeCourseId}_node-3`, String(nextCount));
              localStorage.setItem(`node_progress_${currentCourseLang}_${activeCourseId}_${uNum}_3`, String(nextCount));
              localStorage.setItem(`u${uNum}_node-3`, String(nextCount));
              localStorage.setItem(`u${uNum}_stage-3`, String(nextCount));
              localStorage.setItem(`node_progress_${currentCourseLang}_${activeCourseId}_u${uNum}_node-3`, String(nextCount));

              // vocadash_user_data에 actuallyPlayed: true 영구 저장 (새로고침 시 정화 방지)
              try {
                const rawUserData = localStorage.getItem('vocadash_user_data');
                let uData = rawUserData ? JSON.parse(rawUserData) : {};
                if (!uData.clearedNodes) uData.clearedNodes = {};
                uData.clearedNodes['node-3'] = { cleared: nextCount >= 3, clearedCount: nextCount, actuallyPlayed: true };
                uData.clearedNodes[`u${uNum}_node-3`] = { cleared: nextCount >= 3, clearedCount: nextCount, actuallyPlayed: true };
                uData.clearedNodes[`u${uNum}_stage-3`] = { cleared: nextCount >= 3, clearedCount: nextCount, actuallyPlayed: true };
                localStorage.setItem('vocadash_user_data', JSON.stringify(uData));
              } catch (_) { }

              window.nodeProgressMap['node-3'] = nextCount;
              window.nodeProgressMap[`u${uNum}_node-3`] = nextCount;
              window.nodeProgressMap[`u${uNum}_stage-3`] = nextCount;
              window.nodeProgressMap[`${currentCourseLang}_${activeCourseId}_u${uNum}_n3`] = nextCount;
            }
          } catch (_) { }

          // 2) setNodeProgress 함수가 지원되는 경우 호출
          if (typeof window.setNodeProgress === 'function') {
            window.setNodeProgress(activeNodeId, nextCount, nextCount, currentCourseLang, activeCourseId);
            window.setNodeProgress(compositeStageKey, nextCount, nextCount, currentCourseLang, activeCourseId);
            window.setNodeProgress(compositeNodeKey, nextCount, nextCount, currentCourseLang, activeCourseId);
            const isActualNode3 = (
              nIdx === 3 ||
              activeNodeId === 'node-3' ||
              activeNodeId === `u${uNum}_node-3` ||
              activeNodeId === `u${uNum}_stage-3` ||
              String(activeNodeId).includes('node-3') ||
              String(activeNodeId).includes('stage-3') ||
              (String(activeNodeId).endsWith('_n5') && !String(activeNodeId).includes('review'))
            );
            if (isActualNode3) {
              window.setNodeProgress('node-3', nextCount, nextCount, currentCourseLang, activeCourseId);
              window.setNodeProgress(`u${uNum}_node-3`, nextCount, nextCount, currentCourseLang, activeCourseId);
            }
          }

          // 3) 로드맵 UI 및 진행도 상태 즉시 반영
          if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
          if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
          if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
        }
      } else {

        // 게임오버 카드 내 통계 & 마지막 오답 데이터 직접 바인딩
        try {
          const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [], totalQ: 13, currentQuestionIdx: currentQuestionIdx };
          const totalQ = (gameQuestions && gameQuestions.length) || stats.totalQ || 13;
          const missedList = (typeof missedWords !== 'undefined' && Array.isArray(missedWords)) ? missedWords : (stats.missedWords || []);
          const lastFailed = missedList.length > 0 ? missedList[missedList.length - 1] : (gameQuestions && gameQuestions[currentQuestionIdx]);

          const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          const goMascots = document.querySelectorAll('#game-result-gameover-card img, #result-gameover-card img');
          goMascots.forEach(img => {
            img.src = `assets/characters/${charPrefix}-sad.webp?v=68`;
          });

          const activeCourse = (typeof window.getCurrentCourseData === 'function')
            ? window.getCurrentCourseData()
            : (window.packFootballData || window.courseData);
          const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourseLang) : 1) || 1;
          const currentUnitIndex = Math.max(0, unlockedLevel - 1);
          const targetUnit = activeCourse?.units?.[currentUnitIndex] || activeCourse?.units?.[0] || null;
          const actualUnitTitle = targetUnit ? (targetUnit.title || targetUnit.name) : `Unit ${currentUnitIndex + 1}`;

          const goMissedCourse = document.getElementById('gameover-missed-course');
          if (goMissedCourse) goMissedCourse.textContent = actualUnitTitle;

          const goMissedWord = document.getElementById('gameover-missed-word');
          if (goMissedWord && lastFailed) {
            goMissedWord.textContent = lastFailed.word || lastFailed.term || '¡Buenos días!';
          }

          const goMissedPhonetic = document.getElementById('gameover-missed-phonetic');
          if (goMissedPhonetic && lastFailed) {
            const ph = (lastFailed.phonetic || '').replace(/[\[\]]/g, '').trim();
            goMissedPhonetic.textContent = ph ? `[${ph}]` : '';
          }

          const goMissedMeaning = document.getElementById('gameover-missed-meaning');
          if (goMissedMeaning && lastFailed) {
            goMissedMeaning.textContent = lastFailed.meaning || '';
          }

          const solvedQ = Math.max(0, currentQuestionIdx);
          const progPct = Math.round((solvedQ / totalQ) * 100);
          const goProgText = document.getElementById('gameover-progress-text');
          if (goProgText) goProgText.textContent = `${solvedQ} / ${totalQ} 단어 (${progPct}%)`;

          const goProgBar = document.getElementById('gameover-progress-bar');
          if (goProgBar) goProgBar.style.width = `${progPct}%`;
        } catch (uiErr) {
          console.warn('⚠️ 게임오버 카드 바인딩 예외 방어:', uiErr);
        }
      }

      // 약점 극복 스피드런 모드 보상
      if (isClear && window.isRoadmapReviewSpeedrun) {
        let curGems = 120;
        try {
          const saved = localStorage.getItem('vocadash_gems');
          if (saved !== null) curGems = parseInt(saved, 10) || 120;
        } catch (_) { }
        const addedGems = window.isSpeedrunZeroWrongBonus ? 5 : 10;
        curGems += addedGems;
        try {
          localStorage.setItem('vocadash_gems', String(curGems));
        } catch (_) { }
        const gemsCountEl = document.getElementById('header-gems-count');
        if (gemsCountEl) gemsCountEl.textContent = curGems;
        const gemsText = document.getElementById('result-gems-text');
        if (gemsText) gemsText.textContent = `+${addedGems} 💎`;
      }
    } catch (err) {
      console.error('클리어/종료 처리 중 오류 발생:', err);
    }
  }
  window.finishGameStage = finishGameStage;


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
    const targetCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : ((window.COURSES && window.COURSES[lang]) ? window.COURSES[lang] : (window.courseData_es || window.courseData));

    if (!targetCourse || !Array.isArray(targetCourse.units) || targetCourse.units.length === 0) {
      return [];
    }

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

      // 1) 기본 단어(baseWords, 10개)
      let baseWords = pool.slice();
      if (baseWords.length < 10 && targetUnit && Array.isArray(targetUnit.words)) {
        for (const w of targetUnit.words) {
          if (!baseWords.some(bw => bw.id === w.id || (bw.word || bw.term || '').toLowerCase() === (w.word || w.term || '').toLowerCase())) {
            baseWords.push(w);
            if (baseWords.length >= 10) break;
          }
        }
      }
      if (baseWords.length < 10 && pool.length > 0) {
        let pIdx = 0;
        const origBase = baseWords.slice();
        while (baseWords.length < 10) {
          baseWords.push({ ...origBase[pIdx % origBase.length] });
          pIdx++;
        }
      }
      if (baseWords.length > 10) {
        baseWords = baseWords.slice(0, 10);
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
      if (subStage === 1) {
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

  function spawnQuestion(index) {
    try {
      clearAllGameTimers();
      if (window.stopTTS) window.stopTTS();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (currentPlayingAudio) { currentPlayingAudio.pause(); currentPlayingAudio = null; }

      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false) {
        return;
      }

      const totalQuestions = (gameQuestions && gameQuestions.length) || 13;
      if (!gameQuestions || gameQuestions.length === 0 || index >= totalQuestions) {
        console.log('🏁 단어 소진/인덱스 바운더리 도달 (인덱스:', index, '/', totalQuestions, ') -> finishGameStage(true) 안전 클리어');
        finishGameStage(true);
        return;
      }

      currentQuestionIdx = index;
      isQuestionActive = true;
      isFrozen = false;
      isCurrentQuestionFailed = false;
      if (gameFreezeOverlay) gameFreezeOverlay.classList.add('hidden');

      try {
        updateHeaderStatusUI();
      } catch (uiErr) {
        console.warn('⚠️ updateHeaderStatusUI 예외 방어:', uiErr);
      }

      const q = gameQuestions[currentQuestionIdx];
      if (!q) {
        console.warn('⚠️ 문제 데이터 undefined -> finishGameStage(true) 안전 클리어 (인덱스:', index, ')');
        finishGameStage(true);
        return;
      }

      if (!gameDroppingWord || !gameDroppingBubble || !gameChoiceBtns || gameChoiceBtns.length === 0) {
        initDOMElements();
      }

      const qTerm = String(q.word || q.term || '').trim() || 'VocaDash';
      const isSentenceOrCloze = Boolean(q.type === 'sentence' || q.isSentence || q.isCloze || qTerm.length >= 12);
      const innerCard = gameDroppingBubble ? gameDroppingBubble.querySelector('div') : null;

      if (gameDroppingWord) {
        gameDroppingWord.classList.remove('hidden');
        gameDroppingWord.style.display = 'inline-block';
        gameDroppingWord.style.opacity = '1';

        // 피날레 빈칸 채우기 [  ?  ] 시각적 앰버 펄스 배지 하이라이트
        if (q.isCloze || qTerm.includes('[  ?  ]')) {
          const highlighted = qTerm.replace(/\[\s*\?\s*\]/g, '<span class="cloze-blank-pill">[ ? ]</span>');
          gameDroppingWord.innerHTML = highlighted;
        } else {
          gameDroppingWord.textContent = qTerm;
        }

        const len = qTerm.length;
        if (isSentenceOrCloze) {
          // 문장/빈칸 카드 디자인 확장: max-w-[94%] w-auto px-6 py-4 적용
          if (gameDroppingBubble) {
            gameDroppingBubble.classList.add('wide-falling-card');
            gameDroppingBubble.style.maxWidth = '92%';
            gameDroppingBubble.style.width = 'auto';
          }
          if (innerCard) {
            innerCard.className = 'relative flex flex-col items-center px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-[0_8px_20px_-4px_rgba(0,110,47,0.15),0_3px_6px_rgba(0,0,0,0.06)] active:scale-95 transition-all group justify-center max-w-full text-center whitespace-nowrap';
          }
          // 폰트 크기 미세 조정: 긴 문장도 한 줄로 시원하게 떨어지도록 text-base 또는 text-[15px]
          let fontSizeClass = 'text-base';
          if (len > 35) {
            fontSizeClass = 'text-[14px]';
          } else if (len > 25) {
            fontSizeClass = 'text-[15px]';
          }
          gameDroppingWord.className = `font-headline-xl ${fontSizeClass} font-bold text-[#1E293B] tracking-tight drop-shadow-sm select-none whitespace-nowrap text-center leading-relaxed`;
        } else {
          if (gameDroppingBubble) {
            gameDroppingBubble.classList.remove('wide-falling-card');
            gameDroppingBubble.style.maxWidth = '85%';
            gameDroppingBubble.style.width = 'auto';
          }
          if (innerCard) {
            innerCard.className = 'relative flex flex-col items-center px-5 py-2.5 bg-white border-2 border-slate-100 rounded-2xl shadow-[0_8px_20px_-4px_rgba(0,110,47,0.15),0_3px_6px_rgba(0,0,0,0.06)] active:scale-95 transition-all group justify-center max-w-full text-center';
          }
          if (len <= 7) {
            gameDroppingWord.className = 'font-headline-xl text-[26px] font-extrabold text-[#1E293B] tracking-tight drop-shadow-sm select-none break-keep text-center leading-snug';
          } else {
            gameDroppingWord.className = 'font-headline-xl text-[20px] font-extrabold text-[#1E293B] tracking-tight drop-shadow-sm select-none break-keep text-center leading-snug';
          }
        }
      }

      const currentCourse = window.currentActiveCourse || 'es';
      let correctAnswer = (q.isCloze && q.answer) ? q.answer : (q.meaning || q.answer || q.korean || q.ko || '').trim();
      const trimmedAnswer = correctAnswer;

      let choices = [];
      if (q.isCloze && Array.isArray(q.choices) && q.choices.length >= 4) {
        choices = shuffleArray(q.choices.slice());
      } else {
        try {
          const distractors = getDistractorOptions(q, gameQuestions, currentGameLessonId, currentCourse);
          const distractorMeanings = distractors.map(d => String(d.meaning || d.answer || d.korean || d.ko || '').trim()).filter(Boolean);
          const candidateSet = [trimmedAnswer, ...distractorMeanings];
          const uniqueChoices = Array.from(new Set(candidateSet));
          if (uniqueChoices.length >= 4) {
            choices = shuffleArray(uniqueChoices).slice(0, 4);
          } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateQuestionChoices === 'function') {
            choices = window.VOCA_DATA.generateQuestionChoices(q, gameQuestions, currentGameLessonId, currentCourse);
          }
        } catch (choiceErr) {
          console.warn('⚠️ 보기 생성 예외 방어:', choiceErr);
        }

        if (!Array.isArray(choices) || choices.length === 0) {
          choices = [trimmedAnswer || '정답'];
        }

        if (trimmedAnswer && !choices.some(c => checkAnswerMatch(c, trimmedAnswer))) {
          if (choices.length >= 4) {
            choices[0] = trimmedAnswer;
          } else {
            choices.push(trimmedAnswer);
          }
        }

        // 오답 보기 풀은 반드시 getCurrentCourseData() 단어로만 한정
        if (choices.length < 4) {
          const currentCourseObj = (typeof window.getCurrentCourseData === 'function')
            ? window.getCurrentCourseData()
            : ((window.activeCourseId === 'pack_football' && window.packFootballData) ? window.packFootballData : (window.courseData || { units: [] }));
          const allCourseWords = (currentCourseObj && Array.isArray(currentCourseObj.units))
            ? currentCourseObj.units.flatMap(u => (Array.isArray(u.words) ? u.words : []))
            : [];
          for (const cw of allCourseWords) {
            const m = String(cw.meaning || cw.korean || '').trim();
            if (m && !choices.includes(m) && m !== trimmedAnswer) {
              choices.push(m);
            }
            if (choices.length >= 4) break;
          }
        }
      }

      currentCorrectChoiceIdx = choices.findIndex(c => checkAnswerMatch(c, trimmedAnswer));
      if (currentCorrectChoiceIdx < 0) currentCorrectChoiceIdx = 0;

      gameChoiceBtns.forEach((btn, idx) => {
        if (!btn) return;
        const choiceText = String(choices[idx] || '').trim();
        btn.dataset.choiceIdx = idx;
        btn.dataset.choice = choiceText;
        btn.textContent = choiceText;
        btn.disabled = !choiceText;
        btn.type = 'button';

        const fontSizeClass = choiceText.length > 13 ? 'text-[12px]' : choiceText.length > 8 ? 'text-[13px]' : 'text-[15px]';
        btn.className = `game-choice-btn h-[44px] rounded-xl bg-white text-on-surface border border-slate-200 border-b-[4px] border-b-slate-300 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center px-2 font-headline-sm ${fontSizeClass} font-extrabold shadow-sm hover:bg-slate-50 cursor-pointer text-center break-keep leading-tight`;

        btn.onclick = function (e) {
          if (e) {
            if (typeof e.preventDefault === 'function') e.preventDefault();
            if (typeof e.stopPropagation === 'function') e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          }
          if (btn.disabled) return false;
          if (btn && typeof btn.blur === 'function') btn.blur();
          if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
          const sText = (btn.dataset.choice || btn.innerText || btn.textContent || '').trim();
          if (!sText) return false;
          console.log('🔥 4지선다 버튼 직접 클릭 감지됨! 선택 텍스트:', sText);
          try {
            if (typeof window.handleChoiceClick === 'function') {
              window.handleChoiceClick(btn, sText, e);
            } else {
              judgeAnswerDirectly(btn, sText, e);
            }
          } catch (clickErr) {
            console.warn('클릭 처리 예외 안전 방어:', clickErr);
            judgeAnswerDirectly(btn, sText, e);
          }
          return false;
        };
      });

      bindChoiceDelegation();

      if (gameDroppingBubble) {
        gameDroppingBubble.classList.remove('hidden');
        gameDroppingBubble.style.display = 'flex';
        gameDroppingBubble.style.visibility = 'visible';
        gameDroppingBubble.style.transition = 'none';
        gameDroppingBubble.style.transform = 'translate(-50%, 0) scale(1)';
        gameDroppingBubble.style.opacity = '1';
        gameDroppingBubble.style.top = '3%';
        void gameDroppingBubble.offsetWidth;
      }

      const gameDroppingPhonetic = document.getElementById('game-dropping-phonetic');
      if (gameDroppingPhonetic) {
        gameDroppingPhonetic.textContent = '';
        gameDroppingPhonetic.classList.add('hidden');
        gameDroppingPhonetic.style.display = 'none';
      }

      try {
        if (q) {
          const canAutoPlay = !window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false;
          if (canAutoPlay) {
            // 💡 [다음 문제 낙하 시 음성 동기화] 이전 음성 및 Web Speech API 큐 완전 컷 후 이번 단어만 1회 발화
            stopTTS();
            const speechText = q.targetSentence || q.example || qTerm.replace(/\[\s*\?\s*\]/g, '...');
            if (currentCourse === 'es' || !currentCourse) {
              if (typeof window.playSpanishTTS === 'function') {
                window.playSpanishTTS(speechText);
              } else if (typeof safePlayTTS === 'function') {
                safePlayTTS(speechText, 'es-ES');
              }
            } else if (typeof safePlayTTS === 'function') {
              safePlayTTS(speechText, currentCourse);
            }
          }
        }
      } catch (ttsErr) {
        console.warn('TTS 재생 예외 방어 (게임 계속 진행):', ttsErr);
      }

      dropStartTime = performance.now();
      lastFrameTimestamp = dropStartTime;
      cancelGameLoop();
      dropRafId = requestAnimationFrame(dropLoop);
    } catch (spawnErr) {
      console.error('⚠️ spawnQuestion 실행 중 치명적 예외 안전 방어:', spawnErr);
      finishGameStage(true);
    }
  }

  // 단어 스폰 별칭 등록
  window.spawnQuestion = spawnQuestion;
  window.spawnDroppingWord = spawnQuestion;

  function dropLoop(timestamp) {
    if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || isPaused || !isQuestionActive) {
      cancelGameLoop();
      return;
    }

    if (isFrozen) {
      if (lastFrameTimestamp) {
        dropStartTime += (timestamp - lastFrameTimestamp);
      }
      lastFrameTimestamp = timestamp;
      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false) {
        cancelGameLoop();
        return;
      }
      dropRafId = requestAnimationFrame(dropLoop);
      return;
    }

    lastFrameTimestamp = timestamp;

    const currentQ = gameQuestions[currentQuestionIdx];
    const qTerm = String((currentQ && (currentQ.word || currentQ.term)) || '').trim();
    const isSentenceOrCloze = Boolean(currentQ && (currentQ.type === 'sentence' || currentQ.isSentence || currentQ.isCloze || qTerm.length >= 12));
    // 문장 퀴즈 낙하 속도 30% 감속 (duration에 1.43배 적용)
    const sentenceMultiplier = isSentenceOrCloze ? 1.43 : 1.0;
    const duration = Math.max(5000, (dropBaseDuration * sentenceMultiplier) / speedMultiplier);

    const elapsed = timestamp - dropStartTime;
    const progress = Math.min(1, Math.max(0, elapsed / duration));

    const startPct = 3;
    const deadlinePct = 81;
    const currentPct = startPct + progress * (deadlinePct - startPct);

    if (gameDroppingBubble) {
      gameDroppingBubble.style.top = `${currentPct.toFixed(2)}%`;
    }

    if (progress >= 1) {
      handleDeadlineBreached();
      return;
    }

    if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || isPaused || !isQuestionActive) {
      cancelGameLoop();
      return;
    }

    dropRafId = requestAnimationFrame(dropLoop);
  }

  function checkAnswerMatch(selected, correct) {
    if (!selected || !correct) return false;
    const cleanSel = String(selected).replace(/\s+/g, '').trim();
    const cleanCor = String(correct).replace(/\s+/g, '').trim();
    if (cleanSel === cleanCor) return true;

    // 슬래시, 쉼표, 물결표 등 분리 매칭 (예: '수하물 / 짐', '비자 / 입국 허가')
    const parts = String(correct).split(/[\/,()~]/).map(p => p.replace(/\s+/g, '').trim()).filter(Boolean);
    if (parts.some(p => p === cleanSel || (cleanSel.length > 2 && p.startsWith(cleanSel)) || (p.length > 2 && cleanSel.startsWith(p)))) return true;

    const selParts = String(selected).split(/[\/,()~]/).map(p => p.replace(/\s+/g, '').trim()).filter(Boolean);
    if (selParts.some(sp => parts.some(p => p === sp))) return true;

    // 만약 한쪽이 긴 문장이고 한쪽이 단어인 경우 (글자 수 차이 3글자 초과) 오인식 방지
    if (Math.abs(cleanSel.length - cleanCor.length) <= 3) {
      return cleanSel.includes(cleanCor) || cleanCor.includes(cleanSel);
    }
    return false;
  }

  function handleDeadlineBreached() {
    try {
      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || !isQuestionActive) {
        cancelGameLoop();
        return;
      }
      isQuestionActive = false;
      cancelGameLoop();
      clearAllGameTimers();
      if (window.stopTTS) window.stopTTS();

      const q = gameQuestions[currentQuestionIdx];
      if (!isCurrentQuestionFailed && q) {
        isCurrentQuestionFailed = true;
        if (!missedWords.some(item => (item.id && item.id === q.id) || item.term === (q.term || q.word))) {
          missedWords.push(q);
        }
      }

      // 오답 발생 시 연속 정답 리셋 및 로컬스토리지 오답노트에 즉시 영구 저장
      if (q && typeof window.recordAnswerResult === 'function') {
        try { window.recordAnswerResult(q, false); } catch (_) { }
      } else if (q && typeof window.addWrongWord === 'function') {
        try { window.addWrongWord(q); } catch (_) { }
      }

      if (gameArena) {
        gameArena.classList.add('animate-game-shake');
        setTimeout(() => gameArena && gameArena.classList.remove('animate-game-shake'), 450);
      }

      try {
        playWrongBuzzer();
      } catch (_) { }
      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic([80, 50, 80]);
      }

      showGameFloatingEffect('위험선 도달! -1 ❤️', false);

      const targetAnswer = ((q && (q.meaning || q.answer || q.korean || '')) || '').trim();
      const correctBtn = gameChoiceBtns.find(b => b && checkAnswerMatch((b.dataset.choice || b.textContent || '').trim(), targetAnswer)) || gameChoiceBtns[currentCorrectChoiceIdx];
      if (correctBtn) {
        correctBtn.className = 'game-choice-btn h-[44px] rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-400 border-b-[4px] border-b-emerald-500 flex items-center justify-center px-2 font-headline-sm text-[15px] font-extrabold';
      }

      // 하트 1개 차감 (오답런 모드 제외)
      const remainingHearts = decreaseHeart();
      if (q) {
        recordSessionWrongWord(q);
      }

      // 인게임 플레이 중 오답/놓침으로 하트 감소 시 'vocadash_weak_word_ids'에 기록 (중복 방지)
      if (q && q.id) {
        addWeakWordId(String(q.id));
      }

      clearTimeout(gameNextQuestionTimer);
      gameNextQuestionTimer = setTimeout(() => {
        if (!isActive || !isGameActive) return;
        // 하트가 0개가 된 경우에만 타이머 멈추고 게임오버 모달 표출 (오답런 모드는 게임오버 제외)
        if (!window.isRoadmapReviewSpeedrun && !window.isReviewGameMode && (remainingHearts <= 0 || currentHearts <= 0)) {
          triggerGameOver();
        } else {
          // 하트가 남아있거나 오답런인 경우 즉시 다음 단어 낙하 진행
          nextQuestion();
        }
      }, 700);
    } catch (err) {
      console.warn('⚠️ handleDeadlineBreached 예외 안전 방어:', err);
      if (!window.isRoadmapReviewSpeedrun && !window.isReviewGameMode && currentHearts <= 0) {
        triggerGameOver();
      } else {
        nextQuestion();
      }
    }
  }

  // 위험선 도달/오답 처리 별칭 등록
  window.handleDeadlineBreached = handleDeadlineBreached;
  window.handleDeadlineHit = handleDeadlineBreached;
  window.onWordMiss = handleDeadlineBreached;

  function checkStageClear() {
    if (isStageFinishing || window.isStageFinishing) return true;
    try {
      const totalCount = (gameQuestions && Array.isArray(gameQuestions) && gameQuestions.length) || (window.currentSessionQuestions && window.currentSessionQuestions.length) || 13;
      return (currentQuestionIdx + 1 >= totalCount);
    } catch (err) {
      console.error('checkStageClear 실행 중 오류 발생:', err);
      return false;
    }
  }
  window.checkStageClear = checkStageClear;

  function nextQuestion() {
    if (isStageFinishing || window.isStageFinishing) return;
    clearTimeout(gameNextQuestionTimer);
    gameNextQuestionTimer = null;

    try {
      if (checkStageClear()) {
        console.log('🏁 nextQuestion: checkStageClear() 확인 -> finishGameStage(true) 안전 클리어');
        finishGameStage(true);
        return;
      }

      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false) {
        console.warn('⚠️ nextQuestion: 게임이 비활성 상태이므로 진행하지 않음');
        return;
      }

      const totalCount = (gameQuestions && gameQuestions.length) || 13;
      const nextIdx = currentQuestionIdx + 1;

      // 바운더리 체크: 인덱스가 전체 덱 크기 이상이면 안전하게 스테이지 클리어
      if (!gameQuestions || gameQuestions.length === 0 || nextIdx >= totalCount) {
        console.log('🏁 전체 문제 완주/단어 소진 바운더리 도달 (인덱스:', nextIdx, '/', totalCount, ') -> finishGameStage(true) 안전 클리어');
        finishGameStage(true);
        return;
      }

      spawnQuestion(nextIdx);
    } catch (err) {
      console.error('⚠️ nextQuestion 실행 중 예외 방어:', err);
      // 예외 발생 시에도 게임이 강제 종료되거나 로드맵으로 튕기지 않고 클리어 모달 호출
      finishGameStage(true);
    }
  }

  // 다음 문제 호출 별칭 등록
  window.nextQuestion = nextQuestion;
  window.nextWord = nextQuestion;

  function handleCorrectAnswer(btn, selectedText, isLast = false) {
    try {
      if (isStageFinishing || window.isStageFinishing) return;
      if (!isLast && (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || !isQuestionActive)) return;
      isQuestionActive = false;
      cancelGameLoop();
      if (window.stopTTS) window.stopTTS();

      const currentQ = gameQuestions[currentQuestionIdx];
      const targetAns = ((currentQ && (currentQ.isCloze ? (currentQ.answer || currentQ.meaning) : (currentQ.meaning || currentQ.answer || currentQ.korean || currentQ.ko || ''))) || '').trim();

      // 문제 정답 시 연속 정답(correctStreak) +1 및 5회 달성 시 오답 탈출 졸업 처리
      if (currentQ && typeof window.recordAnswerResult === 'function') {
        try { window.recordAnswerResult(currentQ, true); } catch (_) { }
      }

      // 통계 누적: 이번 문제 최초 시도에 바로 맞혔다면 정답 수 누적 및 외운 단어 추가
      if (!isCurrentQuestionFailed && currentQ) {
        recordQuizAttempt(true, currentQ);
      } else if (currentQ) {
        addMasteredWord(currentQ);
      }

      // 이전 챕터 오답 단어를 맞혔을 경우: vocadash_weak_word_ids 목록에서 삭제하여 완전 마스터 처리
      if (currentQ && currentQ.id) {
        removeWeakWordId(String(currentQ.id));
      }

      if (!btn) {
        btn = gameChoiceBtns.find(b => checkAnswerMatch((b.dataset.choice || b.textContent || '').trim(), targetAns)) || gameChoiceBtns[currentCorrectChoiceIdx];
      }

      if (btn) {
        btn.classList.add('!bg-emerald-500', '!text-white', '!border-emerald-600', 'ring-4', 'ring-emerald-300/80', 'animate-pulse');
        const textVal = selectedText || (btn.dataset.choice || btn.innerText || btn.textContent || '').trim() || targetAns;
        btn.textContent = '';
        const textSpan = document.createElement('span');
        textSpan.textContent = textVal;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined text-[17px] text-white font-black';
        iconSpan.style.fontVariationSettings = "'FILL' 1";
        iconSpan.textContent = 'check_circle';
        const wrapSpan = document.createElement('span');
        wrapSpan.className = 'flex items-center gap-1.5';
        wrapSpan.appendChild(textSpan);
        wrapSpan.appendChild(iconSpan);
        btn.appendChild(wrapSpan);
      }

      combo++;
      if (combo > maxCombo) maxCombo = combo;
      const isMasterRound = (window.currentSubStageRound === 3);
      const gainedScore = isMasterRound ? (150 + (combo * 40)) : (100 + (combo * 20));
      score += gainedScore;
      const baseSpd = window.currentRoundBaseSpeed || 1.0;
      speedMultiplier = Math.min(2.4, baseSpd + (combo * 0.05));
      updateHeaderStatusUI();

      let floatText = '정답!';
      if (currentQ && currentQ.isCloze) {
        floatText = `🎉 피날레 문장 완성! +${gainedScore}${combo >= 2 ? ` (🔥x${combo})` : ''}`;
      } else if (isMasterRound) {
        floatText = `★ 마스터 정답! +${gainedScore}${combo >= 2 ? ` (🔥x${combo})` : ''}`;
      } else {
        floatText = `정답! +${gainedScore}${combo >= 2 ? ` (🔥x${combo})` : ''}`;
      }
      showGameFloatingEffect(floatText, true);

      if (gameDroppingBubble) {
        gameDroppingBubble.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        gameDroppingBubble.style.transform = 'translate(-50%, 0) scale(1.25)';
        gameDroppingBubble.style.opacity = '0';
      }

      try {
        if (typeof window.playSound === 'function') {
          window.playSound('correct');
        } else if (combo >= 2) {
          playComboChime(combo);
        } else {
          playSuccessChime();
        }
      } catch (_) { }

      // 🚨 [정답 맞힘 시 2차 TTS 발화 완전 제거] 정답 효과음(correct SFX)만 재생하고 단어 재발화는 수행하지 않음

      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic(40);
      }

      // 스테이지 완주(마지막 문제) 체크
      if (isLast || checkStageClear()) {
        console.log('🏁 마지막 문제 정답! checkStageClear() 확인 -> 완주 축하 후 finishGameStage(true) 순수 SPA 클리어');
        try {
          // 최상단에서 가장 먼저 결과 모달 및 클리어 카드 즉시 노출 / 게임오버 카드 및 버블 즉각 숨김
          const resultModal = document.getElementById('game-result-modal');
          const clearCard = document.getElementById('game-result-clear-card');
          const gameoverCard = document.getElementById('game-result-gameover-card');
          const dropBubble = document.getElementById('game-dropping-bubble');

          resultModal?.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
          resultModal?.classList.add('opacity-100', 'pointer-events-auto');
          if (resultModal) {
            resultModal.style.display = 'flex';
            resultModal.style.pointerEvents = 'auto';
            resultModal.style.zIndex = '9999';
          }

          clearCard?.classList.remove('hidden');
          if (clearCard) clearCard.style.display = 'flex';
          gameoverCard?.classList.add('hidden');
          if (gameoverCard) gameoverCard.style.display = 'none';

          dropBubble?.classList.add('hidden');
          if (dropBubble) {
            dropBubble.style.display = 'none';
            dropBubble.style.opacity = '0';
          }

          // 1) 게임 루프 및 타이머 정지
          if (typeof this !== 'undefined' && this) {
            if (this.gameTimer) {
              clearInterval(this.gameTimer);
              this.gameTimer = null;
            }
            if (this.animationFrameId) {
              cancelAnimationFrame(this.animationFrameId);
              this.animationFrameId = null;
            }
            this.isGameActive = false;
          }
          if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
          }
          if (window.gameTimer) {
            clearInterval(window.gameTimer);
            window.gameTimer = null;
          }
          if (dropRafId !== null) {
            cancelAnimationFrame(dropRafId);
            dropRafId = null;
          }
          window.isGameActive = false;
          isGameActive = false;
          isActive = false;
          window.isActive = false;

          // 2) 낙하 중이던 단어 DOM 숨김
          const droppingEl = document.getElementById('dropping-word') || dropBubble || document.getElementById('game-dropping-word');
          if (droppingEl) droppingEl.style.display = 'none';
          const dropWord = document.getElementById('game-dropping-word');
          if (dropWord) dropWord.style.display = 'none';

          // 3) 보상/점수/경험치/콤보 텍스트 안전 대입 (null 체크 및 옵셔널 체이닝 & try-catch)
          try {
            const scoreVal = (typeof this !== 'undefined' && this && this.score) || score || 0;
            const scoreEl = document.getElementById('result-score');
            if (scoreEl) scoreEl.textContent = scoreVal;
            const expEl = document.getElementById('result-exp');
            if (expEl) expEl.textContent = '50';
            const corrEl = document.getElementById('result-correct-count');
            if (corrEl) corrEl.textContent = String(gameQuestions?.length || 13);
            const xpText = document.getElementById('result-xp-text');
            if (xpText) xpText.textContent = '+50 XP';
            const comboText = document.getElementById('result-combo-text');
            if (comboText) comboText.textContent = `x${maxCombo || combo || 0}`;
          } catch (textErr) { }

          // 사운드 안전 재생
          try {
            if (typeof playSound === 'function') {
              playSound?.('clear');
            } else if (typeof window?.playSound === 'function') {
              window.playSound?.('clear');
            } else if (typeof playSuccessChime === 'function') {
              playSuccessChime?.();
            } else if (typeof window?.playSuccessChime === 'function') {
              window.playSuccessChime?.();
            }
          } catch (soundErr) { }
        } catch (err) {
          console.error('클리어 모달 표시 중 오류 발생:', err);
        }

        clearTimeout(gameNextQuestionTimer);
        gameNextQuestionTimer = setTimeout(() => {
          finishGameStage(true);
        }, 200);
        return;
      }

      clearTimeout(gameNextQuestionTimer);
      gameNextQuestionTimer = setTimeout(() => {
        if (isActive && isGameActive) {
          nextQuestion();
        }
      }, 300);
    } catch (err) {
      console.warn('⚠️ handleCorrectAnswer 예외 안전 방어:', err);
      if (isLast || checkStageClear()) {
        finishGameStage(true);
      } else {
        clearTimeout(gameNextQuestionTimer);
        gameNextQuestionTimer = setTimeout(() => {
          if (isActive && isGameActive) {
            nextQuestion();
          }
        }, 300);
      }
    }
  }
  window.handleCorrectAnswer = handleCorrectAnswer;

  function handleWrongAnswer(btn, selectedText) {
    try {
      // 🛑 [오답 판정 시에도 잔여 음성 즉시 컷]
      if (typeof stopTTS === 'function') stopTTS();
      else if (typeof window.stopTTS === 'function') window.stopTTS();

      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || !isQuestionActive) return;

      const currentQ = gameQuestions[currentQuestionIdx];

      if (!isCurrentQuestionFailed && currentQ) {
        isCurrentQuestionFailed = true;
        if (!missedWords.some(item => (item.id && item.id === currentQ.id) || item.term === (currentQ.term || currentQ.word))) {
          missedWords.push(currentQ);
        }
        // 문제 최초 시도 오답 통계 누적
        recordQuizAttempt(false, currentQ);
      }

      // 오답 발생 시 연속 정답(correctStreak) 리셋 및 로컬스토리지 오답노트에 즉시 영구 저장
      if (currentQ && typeof window.recordAnswerResult === 'function') {
        try {
          window.recordAnswerResult(currentQ, false);
        } catch (storageErr) {
          console.warn('⚠️ 오답노트 저장 예외 안전 방어:', storageErr);
        }
      } else if (currentQ && typeof window.addWrongWord === 'function') {
        try {
          window.addWrongWord(currentQ);
        } catch (storageErr) {
          console.warn('⚠️ 오답노트 저장 예외 안전 방어:', storageErr);
        }
      }

      // 1) 틀린 버튼만 즉시 빨간색(!bg-red-500 !text-white)으로 변경 및 disabled 처리
      if (btn) {
        btn.disabled = true;
        btn.classList.add('!bg-red-500', '!text-white', '!border-red-600', 'shake', 'opacity-90');
        const textVal = selectedText || (btn.dataset.choice || btn.innerText || btn.textContent || '').trim();
        btn.textContent = '';
        const textSpan = document.createElement('span');
        textSpan.textContent = textVal;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined text-[15px] text-white font-bold';
        iconSpan.textContent = 'close';
        const wrapSpan = document.createElement('span');
        wrapSpan.className = 'flex items-center gap-1';
        wrapSpan.appendChild(textSpan);
        wrapSpan.appendChild(iconSpan);
        btn.appendChild(wrapSpan);
      }

      // 2) 하트 1개 차감 & 콤보 초기화 (오답런 모드 제외)
      const remainingHearts = decreaseHeart();
      if (currentQ) {
        recordSessionWrongWord(currentQ);
      }

      // 인게임 플레이 중 오답 선택으로 하트 감소 시 'vocadash_weak_word_ids'에 기록 (중복 방지)
      if (currentQ && currentQ.id) {
        addWeakWordId(String(currentQ.id));
      }

      if (window.isRoadmapReviewSpeedrun || window.isReviewGameMode) {
        showGameFloatingEffect('오답! (하트 유지)', false);
      } else {
        showGameFloatingEffect('오답! -1 ❤️', false);
      }

      try {
        if (typeof window.playSound === 'function') {
          window.playSound('wrong');
        } else {
          playWrongBuzzer();
        }
      } catch (_) { }

      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic([60, 40, 60]);
      }

      if (gameArena) {
        gameArena.classList.add('animate-game-shake');
        setTimeout(() => gameArena.classList.remove('animate-game-shake'), 300);
      }

      // 3) 오답으로 인해 하트가 0개가 되면 그 즉시 게임오버 모달 표출 (오답런 모드는 게임오버 제외)
      if (!window.isRoadmapReviewSpeedrun && !window.isReviewGameMode && (remainingHearts <= 0 || currentHearts <= 0)) {
        console.log('💀 하트 소진 (0개) -> triggerGameOver() 실행');
        triggerGameOver();
        return;
      }
      // 하트가 1개 이상 남아있는 경우:
      // 절대 화면을 닫거나 새로고침하지 않고, 화면에 붉은색 흔들림(shake) 피드백을 준 뒤 단어를 계속 낙하시킴
    } catch (err) {
      console.warn('⚠️ handleWrongAnswer 예외 안전 방어:', err);
    }
  }

  let isAnswerJudging = false;

  function judgeAnswerDirectly(btn, selectedText, event) {
    if (event) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    if (btn && typeof btn === 'object') {
      if (typeof btn.preventDefault === 'function') btn.preventDefault();
      if (typeof btn.stopPropagation === 'function') btn.stopPropagation();
      if (typeof btn.stopImmediatePropagation === 'function') btn.stopImmediatePropagation();
    }

    // 🛑 [보기 클릭 즉시 잔여 음성 강제 컷 & Web Speech API 대기열 큐 즉각 취소]
    if (typeof stopTTS === 'function') stopTTS();
    else if (typeof window.stopTTS === 'function') window.stopTTS();

    try {
      if (!btn || btn.disabled) return false;
      if (isStageFinishing || window.isStageFinishing) return false;
      if (isAnswerJudging) return false;
      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || isPaused || !isQuestionActive) return false;

      isAnswerJudging = true;
      setTimeout(() => { isAnswerJudging = false; }, 350);

      const currentQ = gameQuestions[currentQuestionIdx];
      if (!currentQ) {
        console.warn('⚠️ judgeAnswerDirectly: 문제 데이터 없음 -> finishGameStage(true) 안전 클리어');
        finishGameStage(true);
        return false;
      }

      const correctAns = (currentQ.isCloze ? (currentQ.answer || currentQ.meaning) : (currentQ.meaning || currentQ.answer || currentQ.korean || currentQ.ko || '')).trim();
      const isCorrect = checkAnswerMatch(selectedText, correctAns);
      console.log(`판정 결과: ${isCorrect ? '정답 ⭕' : '오답 ❌'} (선택: "${selectedText}", 정답: "${correctAns}")`);

      if (isCorrect) {
        // 마지막 문제 완주 여부 즉각 판별: checkStageClear()
        const isLast = checkStageClear();
        if (isLast) {
          console.log('🏁 마지막 문제 정답 판정 직후: checkStageClear() 완주 확정 -> 순수 SPA 클리어 모달 직행');
        }
        handleCorrectAnswer(btn, selectedText, isLast);
        return false;
      } else {
        handleWrongAnswer(btn, selectedText);
      }
      return false;
    } catch (err) {
      console.warn('⚠️ judgeAnswerDirectly 예외 안전 방어:', err);
      return false;
    }
  }

  window.handleChoiceClick = function (btn, selectedText, event) {
    if (event) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    if (btn && typeof btn === 'object') {
      if (typeof btn.preventDefault === 'function') btn.preventDefault();
      if (typeof btn.stopPropagation === 'function') btn.stopPropagation();
      if (typeof btn.stopImmediatePropagation === 'function') btn.stopImmediatePropagation();
    }

    // 🛑 [보기 클릭 즉시 잔여 음성 강제 컷 & Web Speech API 대기열 큐 즉각 취소]
    if (typeof stopTTS === 'function') stopTTS();
    else if (typeof window.stopTTS === 'function') window.stopTTS();
    if (btn && btn.currentTarget) {
      btn = btn.currentTarget;
    } else if (btn && btn.target && btn.target.closest) {
      btn = btn.target.closest('button');
    } else if (typeof btn === 'number') {
      btn = gameChoiceBtns[btn];
    }

    if (!btn || btn.disabled) return false;
    if (!selectedText) {
      selectedText = (btn.dataset.choice || btn.innerText || btn.textContent || '').trim();
    } else {
      selectedText = String(selectedText).trim();
    }

    judgeAnswerDirectly(btn, selectedText, event);
    return false;
  };

  // 4대 아이템 로직 (패스, 빙결, 폭탄, 회복)
  function triggerFreezeEffect(duration = 5000) {
    if ((!isQuestionActive && !window.isQuestionActive) || isPaused) return;
    isFrozen = true;
    updateItemCountUI(); // 5초간 빙결 버튼 비활성화 (중복 소모 방지)
    if (gameFreezeOverlay) gameFreezeOverlay.classList.remove('hidden');
    showGameFloatingEffect('❄️ 5초 빙결!', true);

    clearTimeout(freezeTimer);
    freezeTimer = setTimeout(() => {
      isFrozen = false;
      if (gameFreezeOverlay) gameFreezeOverlay.classList.add('hidden');
      updateItemCountUI(); // 5초 후 버튼 상태 재평가 (남은 수량에 따라 해제)
    }, duration);
  }

  function triggerBombEffect() {
    if (!isQuestionActive || isPaused) return;
    const currentQ = gameQuestions[currentQuestionIdx];
    if (!currentQ) return;
    const correctMeaning = (currentQ.meaning || currentQ.answer || currentQ.korean || currentQ.ko || '').trim();

    const wrongBtns = gameChoiceBtns.filter(btn => {
      if (!btn || btn.disabled) return false;
      const choiceText = (btn.dataset.choice || btn.innerText || btn.textContent || '').trim();
      return !checkAnswerMatch(choiceText, correctMeaning);
    });

    const shuffledWrong = wrongBtns.sort(() => Math.random() - 0.5);
    const targetsToDisable = shuffledWrong.slice(0, 2);

    targetsToDisable.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('opacity-30', 'line-through', 'cursor-not-allowed', '!bg-slate-100', '!text-slate-400', '!border-slate-300');
    });

    showGameFloatingEffect('💣 오답 2개 제거!', true);

    if (gameArena) {
      gameArena.classList.add('animate-game-shake');
      setTimeout(() => gameArena.classList.remove('animate-game-shake'), 300);
    }
  }

  let lastItemUseTimestamp = 0;
  window.useGameItem = function (itemType) {
    if (itemType && typeof itemType === 'object') {
      if (typeof itemType.preventDefault === 'function') itemType.preventDefault();
      if (typeof itemType.stopPropagation === 'function') itemType.stopPropagation();
      const btn = itemType.target && itemType.target.closest ? itemType.target.closest('button[data-item]') : null;
      itemType = btn ? btn.dataset.item : null;
    }
    if (!itemType || typeof itemType !== 'string') return;

    const now = performance.now();
    if (now - lastItemUseTimestamp < 250) return;
    lastItemUseTimestamp = now;

    const gameActive = isGameActive || window.isGameActive;
    if (!gameActive || isPaused || currentHearts <= 0) return;
    if (!window.gameItemCounts || window.gameItemCounts[itemType] <= 0) {
      if (typeof window.showToast === 'function') window.showToast('⚠️ 아이템을 모두 사용했습니다!', '⚠️');
      return;
    }

    switch (itemType) {
      case 'pass':
        window.gameItemCounts.pass--;
        syncInventoryToStorage(window.gameItemCounts);
        if (typeof window.showToast === 'function') window.showToast('⚡ 번개 패스 사용! 다음 단어로 넘어갑니다.', '⚡');
        showGameFloatingEffect('⚡ 번개 패스!', true);
        handleCorrectAnswer();
        break;

      case 'freeze':
        if (isFrozen) {
          if (typeof window.showToast === 'function') window.showToast('이미 빙결 효과가 적용 중입니다! ❄️', '❄️');
          return;
        }
        window.gameItemCounts.freeze--;
        syncInventoryToStorage(window.gameItemCounts);
        if (typeof window.showToast === 'function') window.showToast('❄️ 절대 빙결! 5초간 단어가 멈춥니다.', '❄️');
        triggerFreezeEffect(5000);
        break;

      case 'bomb':
        window.gameItemCounts.bomb--;
        syncInventoryToStorage(window.gameItemCounts);
        if (typeof window.showToast === 'function') window.showToast('💣 단어 폭탄 사용! 오답 2개 제거!', '💣');
        triggerBombEffect();
        break;

      case 'heal':
        if (currentHearts >= 5) {
          showGameFloatingEffect('이미 체력이 가득 차 있습니다!', false);
          if (typeof window.showToast === 'function') window.showToast('이미 체력이 가득 차 있습니다!', '💖');
          return;
        }
        currentHearts = Math.min(5, currentHearts + 1);
        window.gameItemCounts.heal--;
        syncInventoryToStorage(window.gameItemCounts);
        updateHeartsUI();
        updateItemCountUI();
        if (typeof window.showToast === 'function') window.showToast(`💖 하트 회복 완료! (현재 하트: ${currentHearts}/5)`, '💖');
        showGameFloatingEffect('💖 하트 +1 회복!', true);
        break;
    }

    updateItemCountUI();
  };

  function openGamePauseDialog() {
    if (!isGameActive || isPaused) return;
    isPaused = true;
    pauseStartTime = performance.now();
    cancelGameLoop();
    if (window.stopTTS) window.stopTTS();
    clearTimeout(gameNextQuestionTimer);
    if (gamePauseDialog) gamePauseDialog.classList.remove('hidden');
  }

  function closeGamePauseDialog() {
    if (!isPaused) return;
    isPaused = false;
    if (gamePauseDialog) gamePauseDialog.classList.add('hidden');
    const pauseDuration = performance.now() - pauseStartTime;
    dropStartTime += pauseDuration;
    lastFrameTimestamp = performance.now();
    if (isQuestionActive) {
      cancelGameLoop();
      dropRafId = requestAnimationFrame(dropLoop);
    }
  }

  function openGameScreen(lessonId = 'node-2', session = null) {
    if (lessonId && typeof lessonId === 'object' && !Array.isArray(lessonId)) {
      session = lessonId.session || lessonId.words || session;
      lessonId = lessonId.lessonId || lessonId.nodeId || lessonId.id || 'node-2';
    }
    if (!gameScreen) initDOMElements();
    isStageFinishing = false;
    window.isStageFinishing = false;
    clearTimeout(gameNextQuestionTimer);
    gameNextQuestionTimer = null;
    clearAllGameTimers();
    isActive = false;
    isGameActive = false;
    window.isActive = false;
    window.isGameActive = false;
    isQuestionActive = false;
    if (window.stopTTS) window.stopTTS();

    if (window.closeCourseDropdown) window.closeCourseDropdown();
    if (window.closeLanguageModal) window.closeLanguageModal();
    if (window.closeStreakModal) window.closeStreakModal();
    if (window.closeProfileModal) window.closeProfileModal();
    if (window.closeLessonModal) window.closeLessonModal();
    if (window.closeFlashcardScreen) window.closeFlashcardScreen(false);
    if (window.closeGameResultModal) window.closeGameResultModal();

    // 💡 [핵심 추가] 결과 모달 및 게임오버 모달 레이어 강제 숨김 (잔여 화면 차단)
    const resModal = document.getElementById('game-result-modal') || document.getElementById('result-modal-backdrop');
    if (resModal) {
      resModal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      resModal.classList.remove('opacity-100', 'pointer-events-auto');
      resModal.style.display = 'none';
    }
    const resClearCard = document.getElementById('game-result-clear-card');
    if (resClearCard) {
      resClearCard.classList.add('hidden');
      resClearCard.style.display = 'none';
    }
    const resGameOverCard = document.getElementById('game-result-gameover-card');
    if (resGameOverCard) {
      resGameOverCard.classList.add('hidden');
      resGameOverCard.style.display = 'none';
    }

    // 0하트 검사: 약점 극복 오답런(node-review, window.isRoadmapReviewSpeedrun)을 제외하고는 하트 0개 시 게임 진입 불가
    const isReviewModeCheck = window.isRoadmapReviewSpeedrun || lessonId === 'node-review' || String(lessonId).includes('review');
    if (!isReviewModeCheck && !window.isUnitSkipTestMode) {
      if (typeof window.checkAndRechargeHearts === 'function') {
        window.checkAndRechargeHearts();
      }
      const curH = (typeof window.getUserHearts === 'function') ? window.getUserHearts() : (window.userHearts || 0);
      if (curH <= 0) {
        if (typeof window.openHeartRechargeModal === 'function') {
          window.openHeartRechargeModal();
        }
        return;
      }
    }

    missedWords = [];
    isCurrentQuestionFailed = false;
    window.currentSessionWrongWords = [];

    let targetLesson = lessonId;
    if (!targetLesson || targetLesson === 'node-2') {
      if (window.currentSelectedNodeId && window.currentSelectedNodeId !== 'node-2') {
        targetLesson = window.currentSelectedNodeId;
      } else if (window.currentGameLessonId && window.currentGameLessonId !== 'node-2') {
        targetLesson = window.currentGameLessonId;
      }
    }
    const isNode3Selected = window.currentSelectedNodeId === 'node-3' || window.currentSelectedNodeId === 'u1_stage-3' || /(^|_)stage-?3$/.test(window.currentSelectedNodeId || '') || /(^|_)node-?3$/.test(window.currentSelectedNodeId || '') || window.currentLessonId === 'node-3';
    if ((targetLesson === 'node-review' || targetLesson === 'review') && isNode3Selected && !window.isReviewGameMode && !window.isRoadmapReviewSpeedrun) {
      console.log('🔄 [openGameScreen] 3번 노드 선택 중 node-review 감지 -> node-3으로 정규화');
      targetLesson = 'node-3';
    }

    if (targetLesson !== 'node-review' && !String(targetLesson).includes('review')) {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }

    currentGameLessonId = targetLesson || 'node-2';
    window.currentGameLessonId = currentGameLessonId;
    window.currentSelectedNodeId = currentGameLessonId;
    const round = (typeof window.nodeProgressMap !== 'undefined' && window.nodeProgressMap[currentGameLessonId]) || 0;
    const currentCourse = window.currentActiveCourse || 'es';

    const activeCourseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.activeCourseId || 'main';
    window.activeCourseId = activeCourseId;
    const currentCourseData = typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : window.courseData;

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourse) : 1) || 1;
    const unitIndex = Math.max(0, unlockedLevel - 1);
    const targetUnit = (currentCourseData && Array.isArray(currentCourseData.units))
      ? (currentCourseData.units[unitIndex] || currentCourseData.units[0])
      : null;
    const currentWords = (targetUnit && Array.isArray(targetUnit.words)) ? targetUnit.words : [];

    if (window.isUnitSkipTestMode && session && Array.isArray(session) && session.length > 0) {
      gameQuestions = session.slice();
      window.currentSessionQuestions = session;
    } else if (window.isRoadmapReviewSpeedrun && session && Array.isArray(session) && session.length > 0) {
      gameQuestions = session.slice();
      window.currentSessionQuestions = session;
    } else if (activeCourseId === 'pack_football') {
      if (session && Array.isArray(session) && session.length > 0) {
        gameQuestions = session.slice();
      } else if (window.currentSessionQuestions && Array.isArray(window.currentSessionQuestions) && window.currentSessionQuestions.length > 0) {
        gameQuestions = window.currentSessionQuestions.slice();
      } else if (typeof window.getFootballStageSession === 'function') {
        gameQuestions = window.getFootballStageSession(currentGameLessonId);
      } else if (currentWords.length > 0) {
        gameQuestions = currentWords.map(w => ({ ...w, word: w.term, type: 'word' }));
      }
      window.currentSessionQuestions = gameQuestions;
    } else if (session && Array.isArray(session) && session.length >= 10) {
      gameQuestions = session.slice();
      window.currentSessionQuestions = session;
    } else if (window.currentSessionQuestions && window.currentSessionQuestions.length >= 10) {
      gameQuestions = window.currentSessionQuestions.slice();
    } else if (window.VOCA_DATA) {
      gameQuestions = window.VOCA_DATA.generateStageSession(currentGameLessonId, currentCourse, round);
      window.currentSessionQuestions = gameQuestions;
    } else if (session && Array.isArray(session) && session.length > 0) {
      gameQuestions = session.slice();
      window.currentSessionQuestions = session;
    } else {
      gameQuestions = [];
    }

    // 10문제 이상 완주 보장: 어떤 경우에도 문제 수가 10개 미만이면 전체 10개 세트로 재보충 (약점 극복 스피드런, 건너뛰기 시험 및 축구팩 제외)
    if (!window.isRoadmapReviewSpeedrun && !window.isUnitSkipTestMode && activeCourseId !== 'pack_football' && (!gameQuestions || gameQuestions.length < 10)) {
      if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
        gameQuestions = window.VOCA_DATA.generateStageSession(currentGameLessonId, currentCourse, round);
        window.currentSessionQuestions = gameQuestions;
      }
    }

    // 단어 부족 시 가지고 있는 단어들을 순환(fallback)하여 10문제 완주 보장 (약점 극복 스피드런 및 건너뛰기 시험 제외)
    if (!window.isRoadmapReviewSpeedrun && !window.isUnitSkipTestMode && gameQuestions && gameQuestions.length > 0 && gameQuestions.length < 10) {
      const orig = gameQuestions.slice();
      let padIdx = 0;
      while (gameQuestions.length < 10) {
        gameQuestions.push({ ...orig[padIdx % orig.length] });
        padIdx++;
      }
      window.currentSessionQuestions = gameQuestions;
    }

    const activeNode = (typeof resolveCurrentNode === 'function' ? resolveCurrentNode(currentGameLessonId) : null);
    const activeNodeId = activeNode?.id || currentGameLessonId || 'node-1';
    let roundProg = 0;
    if (typeof window.getNodeProgress === 'function') {
      roundProg = Number(window.getNodeProgress(activeNodeId, currentCourse, activeCourseId)) || 0;
    } else if (window.nodeProgressMap && typeof window.nodeProgressMap[activeNodeId] === 'number') {
      roundProg = window.nodeProgressMap[activeNodeId];
    }
    const isBoss = (currentGameLessonId === 'node-boss' || String(currentGameLessonId).includes('boss') || String(currentGameLessonId).endsWith('_n6') || (activeNode && activeNode.type === 'boss'));

    const activeCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : (typeof getCurrentCourseData === 'function' ? getCurrentCourseData() : (currentCourseData || window.courseData));
    const currentUnitIndex = unitIndex;
    const currentUnit = (activeCourse && Array.isArray(activeCourse.units))
      ? (activeCourse.units[currentUnitIndex] || activeCourse.units[0])
      : targetUnit;
    let unitTitle = currentUnit ? (currentUnit.title || currentUnit.name) : `Unit ${currentUnitIndex + 1}`;
    if (unitTitle) {
      unitTitle = unitTitle.replace(/^Unit\s*\d+\.\s*/i, '').trim();
      if (unitTitle.includes(' 필수 어휘')) {
        unitTitle = unitTitle.replace(' 필수 어휘', '').trim();
      }
    }

    const totalSubStages = isBoss ? 1 : 3;
    const maxSubStages = isBoss ? 1 : 3;
    const currentSubStage = isBoss ? 1 : Math.min(totalSubStages, Math.max(1, (roundProg || 0) + 1));
    window.currentSubStageRound = currentSubStage;
    window.maxSubStages = maxSubStages;

    // 회차별 기본 속도 차등 적용: 1회차 1.0x, 2회차 1.2x, 3회차(마스터) 1.35x, 보스전은 긴장감 있는 1.35x
    let roundBaseSpeed = 1.0;
    if (isBoss) {
      roundBaseSpeed = 1.35;
    } else if (currentSubStage === 2) {
      roundBaseSpeed = 1.2;
    } else if (currentSubStage === 3) {
      roundBaseSpeed = 1.35;
    }
    window.currentRoundBaseSpeed = roundBaseSpeed;

    // 2/3 회차 이상: 집중력 요구 문제 셔플 강화 (단, 보스전은 끝 2문제가 빈칸이므로 유지)
    if (!isBoss && currentSubStage >= 2 && Array.isArray(gameQuestions) && gameQuestions.length > 0) {
      gameQuestions = shuffleArray(gameQuestions);
      window.currentSessionQuestions = gameQuestions;
    }

    // [수정] 3회차/보스전에서도 문장(Cloze) 삽입 없이 순수 단어로만 13문제 완주 보장

    const coords = (typeof window.parseNodeCoordinates === 'function')
      ? window.parseNodeCoordinates(activeNodeId)
      : ((typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(activeNodeId) : null);

    let resolvedUnitId = (coords && coords.unitIndex) || window.currentUnitNumber || (currentUnitIndex + 1) || 1;
    const uMatch = String(activeNodeId).match(/^u(\d+)/i);
    if (uMatch) {
      resolvedUnitId = parseInt(uMatch[1], 10) || resolvedUnitId;
    }

    const isReview = (
      !isBoss && (
        activeNodeId === 'node-review' ||
        currentGameLessonId === 'node-review' ||
        String(activeNodeId).includes('review') ||
        String(activeNodeId).endsWith('_n4') ||
        (coords && coords.nodeIndex === 'review') ||
        (activeNode && activeNode.type === 'review') ||
        Boolean(window.isRoadmapReviewSpeedrun) ||
        Boolean(window.isReviewGameMode)
      )
    );

    let stageIndex = 1;
    if (coords && typeof coords.nodeIndex === 'number' && coords.nodeIndex !== 6) {
      stageIndex = coords.nodeIndex;
    } else {
      const match = String(activeNodeId).match(/(?:stage|node)[-_]?(\d+)/i);
      if (match) {
        stageIndex = parseInt(match[1], 10) || 1;
      }
    }

    let stageBadgeText = '';
    if (window.isUnitSkipTestMode) {
      stageBadgeText = `⚡ Unit ${window.currentSkipTestUnit || 2} 건너뛰기 실전 시험`;
    } else if (isBoss) {
      stageBadgeText = `Unit ${resolvedUnitId} · 🔥 FINAL BOSS`;
    } else if (isReview) {
      stageBadgeText = `Unit ${resolvedUnitId} · 🔄 약점 복습`;
    } else {
      stageBadgeText = `Unit ${resolvedUnitId} · Stage ${stageIndex} (${currentSubStage}/3)`;
    }

    const stageBadgeEl = gameStageTitle || document.getElementById('game-stage-title');
    if (stageBadgeEl) {
      stageBadgeEl.textContent = stageBadgeText;
      const badgeContainer = stageBadgeEl.closest('.flex');
      if (badgeContainer) {
        const badgeIcon = badgeContainer.querySelector('.material-symbols-outlined');
        if (badgeIcon) {
          if (isBoss || isReview) {
            badgeIcon.style.display = 'none';
          } else {
            badgeIcon.style.display = '';
            badgeIcon.textContent = activeCourseId === 'pack_football' ? 'inventory_2' : 'local_activity';
          }
        }
      }
    }

    if (window.isRoadmapReviewSpeedrun || window.isReviewGameMode) {
      currentHearts = (typeof window.userHearts === 'number' && window.userHearts > 0) ? window.userHearts : 3;
    } else if (typeof window.userHearts === 'number' && window.userHearts >= 0) {
      currentHearts = window.userHearts;
    } else if (typeof window.getUserHearts === 'function') {
      currentHearts = window.getUserHearts();
    } else {
      currentHearts = 5;
    }
    combo = 0;
    maxCombo = 0;
    score = 0;
    speedMultiplier = roundBaseSpeed;
    window.gameItemCounts = loadInventoryFromStorage();
    itemCounts = window.gameItemCounts;

    isActive = true;
    isGameActive = true;
    window.isActive = true;
    window.isGameActive = true;
    isPaused = false;
    isFrozen = false;
    isQuestionActive = false;
    clearAllGameTimers();

    if (gamePauseDialog) gamePauseDialog.classList.add('hidden');
    if (gameFreezeOverlay) gameFreezeOverlay.classList.add('hidden');
    if (gameFloatingEffect) gameFloatingEffect.classList.add('hidden');

    updateHeartsUI();
    updateItemCountUI();

    // 🛑 로드맵, 로드맵 헤더, 하단 네비게이션 바 완전 숨김 보장
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
    const bottomNav = document.getElementById('bottom-nav') || document.querySelector('nav');
    if (bottomNav) {
      bottomNav.classList.add('hidden');
      bottomNav.style.display = 'none';
    }

    if (gameScreen) {
      gameScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      gameScreen.classList.add('opacity-100', 'pointer-events-auto');
      gameScreen.style.removeProperty('display');
      gameScreen.style.display = 'flex';
    }
    if (gameContainer) {
      gameContainer.classList.remove('translate-y-full');
      gameContainer.classList.add('translate-y-0');
    }

    bindChoiceDelegation();

    clearAllGameTimers();
    gameNextQuestionTimer = setTimeout(() => {
      if (isActive && isGameActive) {
        spawnQuestion(0);
      }
    }, 250);
  }

  let isExplicitExitRequested = false;

  function closeResultModal() {
    const modal = document.getElementById('game-result-modal');
    if (modal) {
      modal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      modal.classList.remove('opacity-100', 'pointer-events-auto');
      modal.style.display = 'none';
      modal.style.pointerEvents = 'none';
    }
    if (typeof window.closeGameResultModal === 'function') {
      window.closeGameResultModal();
    }
  }

  // 1) closeGameScreen: 오직 게임 상태 정리와 DOM 숨김만 전담 (순환 호출 절대 금지)
  function closeGameScreen(force = false) {
    // 🛑 게임 진행 중(isGameActive=true) 무단 화면 닫기 방어
    if ((isGameActive || isActive || window.isGameActive || window.isActive) && !force && !isExplicitExitRequested && !window.isExplicitExitRequested) {
      console.warn('🛑 게임 진행 중(isGameActive=true) closeGameScreen() 무단 호출 차단됨!');
      return;
    }

    isActive = false;
    isGameActive = false;
    window.isActive = false;
    window.isGameActive = false;
    isQuestionActive = false;
    cancelGameLoop();
    clearAllGameTimers();
    if (window.stopTTS) window.stopTTS();
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) { }
    }

    closeResultModal();

    if (gameFreezeOverlay) gameFreezeOverlay.classList.add('hidden');
    if (gamePauseDialog) gamePauseDialog.classList.add('hidden');

    const gContainer = document.getElementById('game-container') || gameContainer;
    if (gContainer) {
      gContainer.classList.remove('translate-y-0');
      gContainer.classList.add('translate-y-full');
    }
    const gScreen = document.getElementById('game-screen') || gameScreen;
    if (gScreen) {
      gScreen.classList.remove('opacity-100', 'pointer-events-auto');
      gScreen.classList.add('opacity-0', 'pointer-events-none', 'hidden');
      gScreen.style.display = 'none';
    }
  }
  window.closeGameScreen = closeGameScreen;
  window._rawCloseGameScreen = closeGameScreen;

  // 2) exitGameToRoadmap: 게임 화면 정리 후 로드맵 표시
  function exitGameToRoadmap(force = false) {
    const resultModal = document.getElementById('game-result-modal');
    const isModalOpen = resultModal && !resultModal.classList.contains('hidden') && resultModal.style.display !== 'none';

    // 🛑 게임 진행 중(isGameActive=true)이거나 결과 모달 표출 중에는 무단 로드맵 전환 차단 (명시적 퇴장 요청일 때만 허용)
    if (((isGameActive || isActive || window.isGameActive || window.isActive) || isModalOpen) && !force && !isExplicitExitRequested && !window.isExplicitExitRequested) {
      console.warn('🛑 게임 진행 중 또는 결과 모달 표출 중 exitGameToRoadmap() 로드맵 무단 전환 차단됨! (로드맵 강제 퇴장 방어)');
      return;
    }

    closeGameScreen(true);

    if (typeof window.updateProfileStats === 'function') {
      window.updateProfileStats();
    } else if (typeof window.updateStatsScreenUI === 'function') {
      window.updateStatsScreenUI();
    }

    // 활성 노드 탐색 오염 방지: 이전 플레이 레슨 ID 리셋
    window.currentGameLessonId = null;
    window.currentSelectedNodeId = null;

    if (typeof window.switchScreen === 'function') {
      window.switchScreen('home', true);
    } else if (typeof window.switchMainTab === 'function') {
      window.switchMainTab('home', true);
    }
    if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
    if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
    if (typeof window.focusActiveRoadmapNode === 'function') {
      window.focusActiveRoadmapNode();
    } else if (typeof window.autoScrollToActiveNode === 'function') {
      window.autoScrollToActiveNode('instant');
    }
  }
  window.exitGameToRoadmap = exitGameToRoadmap;

  // 🛑 게임 도중 로드맵 무단 전환 함수 전면 차단 (showRoadmap, switchScreen, goHome)
  function showRoadmap(force = false) {
    if ((isGameActive || isActive || window.isGameActive || window.isActive) && !force && !isExplicitExitRequested && !window.isExplicitExitRequested) {
      console.warn('🛑 게임 진행 중(isGameActive=true) showRoadmap() 로드맵 무단 전환 차단됨! (로드맵 강제 퇴장 방어)');
      return;
    }
    if (typeof window.switchScreen === 'function') {
      window.switchScreen('home', force);
    } else {
      exitGameToRoadmap(force);
    }
  }
  window.showRoadmap = showRoadmap;

  function switchScreen(screenName, force = false) {
    const s = String(screenName || '').toLowerCase().trim();
    if ((s === 'roadmap' || s === 'home') && (isGameActive || isActive || window.isGameActive || window.isActive) && !force && !isExplicitExitRequested && !window.isExplicitExitRequested) {
      console.warn('🛑 게임 진행 중(isGameActive=true) switchScreen("roadmap") 로드맵 무단 전환 차단됨!');
      return;
    }
    if (typeof window.switchScreen === 'function' && window.switchScreen !== switchScreen) {
      window.switchScreen(s === 'roadmap' ? 'home' : s, force);
    } else if (typeof window.switchMainTab === 'function') {
      window.switchMainTab(s === 'roadmap' ? 'home' : s, force);
    }
  }
  window.switchScreen = switchScreen;

  function goHome(force = false) {
    if ((isGameActive || isActive || window.isGameActive || window.isActive) && !force && !isExplicitExitRequested && !window.isExplicitExitRequested) {
      console.warn('🛑 게임 진행 중(isGameActive=true) goHome() 로드맵 무단 전환 차단됨!');
      return;
    }
    if (typeof window.switchScreen === 'function') {
      window.switchScreen('home', force);
    } else {
      exitGameToRoadmap(force);
    }
  }
  window.goHome = goHome;

  function getNextStageInfo() {
    const targetNodeId = window.currentGameLessonId || currentGameLessonId || window.currentSelectedNodeId || 'node-2';
    const currentNode = (typeof resolveCurrentNode === 'function')
      ? resolveCurrentNode(targetNodeId)
      : { id: targetNodeId };
    const activeNodeId = currentNode?.id || targetNodeId;
    const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const activeCourseId = window.currentCourseId ||
      (window.isFootballMode || window.isFootballPack ? 'pack_football' : null) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentCourseLang) : null) ||
      'main';
    let curProg = 0;
    if (typeof window.getNodeProgress === 'function') {
      curProg = Number(window.getNodeProgress(activeNodeId, currentCourseLang, activeCourseId)) || 0;
    } else if (window.nodeProgressMap) {
      curProg = window.nodeProgressMap[activeNodeId] || window.nodeProgressMap[targetNodeId] || 0;
    }
    const activeCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : (window.packFootballData || window.courseData);
    let matchedUnitIdx = -1;
    if (activeCourse && Array.isArray(activeCourse.units)) {
      matchedUnitIdx = activeCourse.units.findIndex(u =>
        Array.isArray(u.nodes) && u.nodes.some(n => n.id === targetNodeId || n.id === activeNodeId)
      );
    }
    const currentUnitIndex = matchedUnitIdx !== -1
      ? matchedUnitIdx
      : ((typeof window.currentUnitIndex === 'number' && !isNaN(window.currentUnitIndex))
        ? window.currentUnitIndex
        : 0);
    const curUnit = (activeCourse && Array.isArray(activeCourse.units))
      ? (activeCourse.units[currentUnitIndex] || activeCourse.units[0])
      : null;

    const isBossNode = (targetNodeId === 'node-boss' || String(targetNodeId).includes('boss') || String(targetNodeId).endsWith('_n6') || String(targetNodeId) === 'node-4' || String(activeNodeId).endsWith('_n6') || String(activeNodeId).includes('boss'));
    const hasNextUnit = Boolean(activeCourse && Array.isArray(activeCourse.units) && activeCourse.units[currentUnitIndex + 1]);
    const slotAlias = (typeof getSlotAlias === 'function') ? getSlotAlias(activeNodeId, targetNodeId) : null;

    let nextNodeId = activeNodeId;
    let nextRound = 0;

    // 3회 미만 (1/3, 2/3) -> 동일 노드의 다음 서브 라운드
    if (curProg < 3) {
      nextNodeId = activeNodeId;
      nextRound = curProg;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
      if (typeof window.showToast === 'function') window.showToast(`🔥 ${curProg}/3 완료! 다음 라운드 진행!`, '⚡');
    } else if (isBossNode) {
      // 유닛 완주(보스전 클리어) 시 다음 유닛 자동 연계 로직
      if (hasNextUnit) {
        const nextUnitIndex = currentUnitIndex + 1;
        const nextUnitLevel = nextUnitIndex + 1;
        window.currentUnitIndex = nextUnitIndex;

        if (typeof window.setUnlockedUnitLevel === 'function') {
          window.setUnlockedUnitLevel(nextUnitLevel, currentCourseLang, activeCourseId);
        }
        if (typeof window.unlockUnitsUpTo === 'function') {
          window.unlockUnitsUpTo(nextUnitLevel, currentCourseLang, activeCourseId);
        }

        window.currentNodeIndex = 0;
        if (!window.nodeProgressMap) window.nodeProgressMap = {};
        const nextUnitObj = (activeCourse && Array.isArray(activeCourse.units)) ? activeCourse.units[nextUnitIndex] : null;
        const nextN1Obj = nextUnitObj && Array.isArray(nextUnitObj.nodes)
          ? nextUnitObj.nodes.find(n => n.stageNumber === 1 || (n.id && (n.id.endsWith('_n1') || n.id.endsWith('-n1'))))
          : null;
        const nextN1Id = nextN1Obj?.id || `u${nextUnitLevel}-n1`;

        window.currentSelectedNodeId = nextN1Id;
        currentGameLessonId = nextN1Id;
        nextNodeId = nextN1Id;
        nextRound = (window.nodeProgressMap && window.nodeProgressMap[nextN1Id]) || 0;

        if (typeof window.updateTopUnitBanner === 'function') window.updateTopUnitBanner(nextUnitIndex);
        if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
        if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
        if (typeof window.showToast === 'function') {
          window.showToast(`🚀 Unit ${nextUnitLevel} 해금! 1과 학습을 시작합니다!`, '✨');
        }
      } else {
        if (!window.nodeProgressMap) window.nodeProgressMap = {};
        window.nodeProgressMap['node-boss'] = 3;
        if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
        isExplicitExitRequested = true;
        window.isExplicitExitRequested = true;
        exitGameToRoadmap(true);
        isExplicitExitRequested = false;
        window.isExplicitExitRequested = false;
        if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
        if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
        if (typeof window.showCourseCompletionModal === 'function') {
          window.showCourseCompletionModal();
        } else {
          if (typeof window.showToast === 'function') {
            window.showToast('🏆 축하합니다! 모든 코스 유닛을 완벽 마스터했습니다!', '🎉');
          }
        }
        return { isAllCompleted: true, nextNodeId: 'node-boss', nextRound: 3, nextSession: null };
      }
    } else if (
      slotAlias === 'node-1' ||
      String(activeNodeId).endsWith('_n1') ||
      String(activeNodeId).endsWith('-n1') ||
      String(activeNodeId).includes('n1') ||
      activeNodeId === 'node-1'
    ) {
      // 1과 마스터(3별 완료) -> 2과로 정상 해금 이동
      nextNodeId = curUnit?.nodes?.[1]?.id || getNextNodeId(activeNodeId, curUnit) || 'node-2';
      if (!window.nodeProgressMap) window.nodeProgressMap = {};

      // 1) 1과의 모든 ID 키를 3별 완료로 확정 저장
      if (typeof window.setNodeProgress === 'function') {
        window.setNodeProgress(activeNodeId, 3, 3, currentCourseLang, activeCourseId);
        window.setNodeProgress(nextNodeId, 0, 0, currentCourseLang, activeCourseId);
      }
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();

      window.currentSelectedNodeId = nextNodeId;
      currentGameLessonId = nextNodeId;
      nextRound = 0;

      // 3) UI 및 로드맵 전체 강제 재렌더링
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
      if (typeof window.showToast === 'function') window.showToast('🎉 1과 마스터 완료! 2과 학습을 시작합니다!', '✨');
      // 2과 마스터 -> 바로 3과로 가지 않고 로비로 빠져서 [선물 상자] 유도
      if (!window.nodeProgressMap) window.nodeProgressMap = {};
      window.nodeProgressMap[activeNodeId] = 3;
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();

      const bonusNode = curUnit?.nodes?.find(n => n.type === 'bonus' || (n.id && n.id.endsWith('_n3')));
      if (bonusNode) {
        window.currentSelectedNodeId = bonusNode.id;
        currentGameLessonId = bonusNode.id;
      }

      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;

      if (typeof window.showToast === 'function') {
        window.showToast('🎁 2과 완료! 보너스 선물 상자를 열어보세요!', '✨');
      }
      return { isAllCompleted: false, nextNodeId: bonusNode?.id || activeNodeId, nextRound: 0, nextSession: null };

    } else if (slotAlias === 'node-3' || String(activeNodeId).endsWith('_n5')) {
      // 3과(순수단어) 마스터 -> 보스전(_n6)으로 이동
      const bossNode = curUnit?.nodes?.find(n => n.type === 'boss' || (n.id && n.id.endsWith('_n6')));
      nextNodeId = bossNode?.id || getNextNodeId(activeNodeId, curUnit);
      if (!window.nodeProgressMap) window.nodeProgressMap = {};
      window.nodeProgressMap[activeNodeId] = 3;
      if (window.nodeProgressMap[nextNodeId] === undefined) window.nodeProgressMap[nextNodeId] = 0;
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      window.currentSelectedNodeId = nextNodeId;
      currentGameLessonId = nextNodeId;
      nextRound = (window.nodeProgressMap && window.nodeProgressMap[nextNodeId]) || 0;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.showToast === 'function') window.showToast('🔥 3과 마스터 완료! 보스전에 도전하세요!', '👑');

    } else {
      nextNodeId = targetNodeId;
      nextRound = curProg;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
    }

    window.activeCourseId = activeCourseId;
    try {
      localStorage.setItem(`vocadash_active_course_${currentCourseLang}`, activeCourseId);
      localStorage.setItem('vocadash_active_course', activeCourseId);
    } catch (_) { }

    let nextSession = null;
    if (activeCourseId === 'pack_football' && typeof window.getFootballStageSession === 'function') {
      nextSession = window.getFootballStageSession(nextNodeId);
    } else if (typeof window.generateStageSession === 'function') {
      nextSession = window.generateStageSession(nextNodeId, currentCourseLang, nextRound);
    } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      nextSession = window.VOCA_DATA.generateStageSession(nextNodeId, currentCourseLang, nextRound);
    }
    return { isAllCompleted: false, nextNodeId, nextRound, nextSession };
  }

  window.getNextStageInfo = getNextStageInfo;

  isHandlingResultPrimary = false;
  function handleResultPrimary(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    }
    if (isHandlingResultPrimary) {
      console.warn('🛑 [다음 스테이지] 중복 클릭 방어 차단됨');
      return false;
    }
    isHandlingResultPrimary = true;
    setTimeout(() => { isHandlingResultPrimary = false; }, 600);

    console.log('🎉 [다음 스테이지] 버튼 단일 전담 처리 시작 (gameEngine.js)');

    // 1) 결과 모달 닫기
    closeResultModal();
    const resultModal = document.getElementById('game-result-modal');
    if (resultModal) {
      resultModal.classList.add('hidden');
      resultModal.style.display = 'none';
    }

    // 2) 액션 게임 화면 안전하게 닫기/정리
    closeGameScreen(true);

    // 2-B) 유닛 건너뛰기 시험 모드 분기
    if (window.isUnitSkipTestMode) {
      const targetUnit = window.currentSkipTestUnit || 2;
      const totalQ = (gameQuestions && gameQuestions.length) || 15;
      const missed = missedWords || [];
      const correctCount = Math.max(0, totalQ - missed.length);
      const isPassed = correctCount >= 12;

      window.isUnitSkipTestMode = false;
      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;

      if (isPassed) {
        if (typeof window.unlockUnitsUpTo === 'function') {
          window.unlockUnitsUpTo(targetUnit);
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 축하합니다! Unit ${targetUnit} 및 이전 유닛들이 모두 해금되었습니다! 🔓`, '✨');
        }
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast(`아쉽게도 불합격했습니다 (${correctCount}/15 정답). 다음에 다시 도전해 보세요! 💪`);
        }
      }
      return false;
    }

    // 3) 오답 복습 모드 분기
    if (window.isReviewGameMode) {
      const isRoadmapSpeedrun = !!window.isRoadmapReviewSpeedrun;
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;

      if (!isRoadmapSpeedrun) {
        isExplicitExitRequested = true;
        window.isExplicitExitRequested = true;
        exitGameToRoadmap(true);
        isExplicitExitRequested = false;
        window.isExplicitExitRequested = false;
        if (typeof window.switchMainTab === 'function') window.switchMainTab('review', true);
        if (typeof window.showToast === 'function') window.showToast('🎉 오답 복습 완료! 오답노트로 복귀했습니다.', '✨');
      } else {
        const targetReviewUnit = window.currentReviewUnitNumber || window.currentUnitNumber || 1;
        const targetReviewId = window.currentReviewNodeId || (typeof window.getCompositeNodeKey === 'function' ? window.getCompositeNodeKey('node-review', targetReviewUnit) : `u${targetReviewUnit}_node-review`);

        // ⚠️ [중요] exitGameToRoadmap 호출 전에 복습 노드를 먼저 완료 처리해야 로드맵 DOM에서 3과에 START 뱃지가 켜지고 즉각 중앙 스냅됨!
        if (typeof window.completeReviewNode === 'function') {
          window.completeReviewNode(targetReviewId, targetReviewUnit);
        }

        window.currentGameLessonId = null;
        window.currentSelectedNodeId = null;

        isExplicitExitRequested = true;
        window.isExplicitExitRequested = true;
        exitGameToRoadmap(true);
        isExplicitExitRequested = false;
        window.isExplicitExitRequested = false;

        if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
        if (typeof window.renderRoadmap === 'function') window.renderRoadmap();

        if (window.isSpeedrunZeroWrongBonus) {
          if (typeof window.showToast === 'function') window.showToast('🎉 약점 완벽 극복! 보석 +5개 획득! 💎', '🎁');
        } else {
          if (targetReviewUnit === 1) {
            if (typeof window.showToast === 'function') window.showToast('🎉 약점 탈출 성공! 3과가 잠금 해제되었습니다! 🔓', '✨');
          } else {
            if (typeof window.showToast === 'function') window.showToast(`🎉 Unit ${targetReviewUnit} 약점 탈출 성공! 🔓`, '✨');
          }
        }
        window.isSpeedrunZeroWrongBonus = false;

        if (typeof window.focusActiveRoadmapNode === 'function') {
          window.focusActiveRoadmapNode();
        }
      }
      return false;
    }

    // 4) 다음 스테이지 정보 획득 및 정밀 타겟팅
    // 🛑 현재 플레이한 노드 ID 확보 (1순위: 현재 실행 중인 레슨 ID)
    const currentPlayingId = window.currentGameLessonId || currentGameLessonId || window.currentSelectedNodeId || 'node-1';

    const coords = (typeof window.parseNodeCoordinates === 'function')
      ? window.parseNodeCoordinates(currentPlayingId)
      : { unitIndex: 1, nodeIndex: 1 };
    const currentUnitId = coords.unitIndex || window.currentUnitNumber || 1;
    const currentNodeIdx = coords.nodeIndex;

    const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const activeCourseId = window.currentCourseId ||
      (window.isFootballMode || window.isFootballPack ? 'pack_football' : null) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentCourseLang) : null) ||
      'main';

    let curCount = 0;
    if (typeof window.getNodeProgress === 'function') {
      const p = window.getNodeProgress(currentPlayingId, currentCourseLang, activeCourseId);
      curCount = (typeof p === 'object' && p !== null) ? Number(p.clearedCount || 0) : Number(p) || 0;
    } else if (window.nodeProgressMap) {
      curCount = window.nodeProgressMap[currentPlayingId] || 0;
    }
    if (window.nodeProgressMap && window.nodeProgressMap[currentPlayingId] !== undefined) {
      curCount = Math.max(curCount, Number(window.nodeProgressMap[currentPlayingId]) || 0);
    }

    const isCurrentBoss = (
      currentNodeIdx === 'boss' ||
      currentNodeIdx === 6 ||
      currentNodeIdx === 4 ||
      String(currentPlayingId).includes('boss') ||
      String(currentPlayingId).endsWith('_n6') ||
      currentPlayingId === 'node-boss'
    );

    // 복합 키 u${unitId}_node-${nextStage} 형식 유지
    let nextNodeId = `u${currentUnitId}_node-${currentNodeIdx}`;
    let nextRound = Math.min(3, curCount + 1);

    // 정확도 50% 미만으로 별 0개인 경우: 현재 라운드 재도전
    if (window.lastEarnedStars === 0) {
      nextNodeId = `u${currentUnitId}_node-${currentNodeIdx}`;
      nextRound = curCount;
    } else if (isCurrentBoss || curCount >= 3) {
      // 3회 완주 또는 보스전 클리어 시에만 순차적으로 다음 노드로 승급
      nextRound = 1;

      if (isCurrentBoss) {
        // 보스전 클리어 -> 다음 유닛 1번 노드로 진입
        const nextUnitId = currentUnitId + 1;
        nextNodeId = `u${nextUnitId}_node-1`;

        // 다음 유닛 잠금 상태 해제 및 활성화
        window.currentUnitIndex = nextUnitId - 1;
        window.currentUnitNumber = nextUnitId;
        if (typeof window.setUnlockedUnitLevel === 'function') {
          window.setUnlockedUnitLevel(nextUnitId, currentCourseLang, activeCourseId);
        }
        if (typeof window.unlockUnitsUpTo === 'function') {
          window.unlockUnitsUpTo(nextUnitId, currentCourseLang, activeCourseId);
        }
        if (!window.nodeProgressMap) window.nodeProgressMap = {};
        if (window.nodeProgressMap[nextNodeId] === undefined) window.nodeProgressMap[nextNodeId] = 0;
        if (!Array.isArray(window.unlockedNodes)) window.unlockedNodes = [];
        if (!window.unlockedNodes.includes(nextNodeId)) {
          window.unlockedNodes.push(nextNodeId);
        }
        try {
          const uData = JSON.parse(localStorage.getItem('vocadash_user_data') || '{}');
          if (!uData.unlockedNodes) uData.unlockedNodes = [];
          if (!uData.unlockedNodes.includes(nextNodeId)) uData.unlockedNodes.push(nextNodeId);
          localStorage.setItem('vocadash_user_data', JSON.stringify(uData));
        } catch (_) { }
        if (typeof window.updateTopUnitBanner === 'function') {
          window.updateTopUnitBanner(nextUnitId - 1);
        }
      } else if (currentNodeIdx === 1 || String(currentPlayingId).endsWith('1') || String(currentPlayingId).endsWith('_n1')) {
        nextNodeId = `u${currentUnitId}_node-2`;
      } else if (currentNodeIdx === 2 || String(currentPlayingId).endsWith('2') || String(currentPlayingId).endsWith('_n2')) {
        nextNodeId = `u${currentUnitId}_node-3`;
      } else if (currentNodeIdx === 3 || String(currentPlayingId).endsWith('3') || String(currentPlayingId).endsWith('_n5')) {
        // 3번 노드 완주 시 보스 노드로 진입 및 보스 잠금 해제
        nextNodeId = `u${currentUnitId}_node-boss`;

        if (!window.nodeProgressMap) window.nodeProgressMap = {};
        if (window.nodeProgressMap[nextNodeId] === undefined) window.nodeProgressMap[nextNodeId] = 0;
        if (currentUnitId === 1) {
          window.nodeProgressMap['node-boss'] = window.nodeProgressMap['node-boss'] || 0;
        }
        if (!Array.isArray(window.unlockedNodes)) window.unlockedNodes = [];
        if (!window.unlockedNodes.includes(nextNodeId)) window.unlockedNodes.push(nextNodeId);
        if (currentUnitId === 1 && !window.unlockedNodes.includes('node-boss')) window.unlockedNodes.push('node-boss');
        try {
          const uData = JSON.parse(localStorage.getItem('vocadash_user_data') || '{}');
          if (!uData.unlockedNodes) uData.unlockedNodes = [];
          if (!uData.unlockedNodes.includes(nextNodeId)) uData.unlockedNodes.push(nextNodeId);
          if (currentUnitId === 1 && !uData.unlockedNodes.includes('node-boss')) uData.unlockedNodes.push('node-boss');
          localStorage.setItem('vocadash_user_data', JSON.stringify(uData));
        } catch (_) { }
      }
    }

    // 모든 코스 유닛 완주 확인
    const activeCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : (window.packFootballData || window.courseData);
    const parsedNextCoords = (typeof window.parseNodeCoordinates === 'function')
      ? window.parseNodeCoordinates(nextNodeId)
      : { unitIndex: currentUnitId, nodeIndex: 1 };
    const nextUnitIdx = (parsedNextCoords.unitIndex || 1) - 1;

    if (isCurrentBoss && activeCourse?.units && Array.isArray(activeCourse.units) && nextUnitIdx >= activeCourse.units.length) {
      if (!window.nodeProgressMap) window.nodeProgressMap = {};
      window.nodeProgressMap[currentPlayingId] = 3;
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
      if (typeof window.showCourseCompletionModal === 'function') {
        window.showCourseCompletionModal();
      } else if (typeof window.showToast === 'function') {
        window.showToast('🏆 축하합니다! 모든 코스 유닛을 완벽 마스터했습니다!', '🎉');
      }
      return false;
    }

    // 다음 스테이지 세션 데이터 생성 (ReferenceError 방어)
    let nextSession = null;
    if (activeCourseId === 'pack_football' && typeof window.getFootballStageSession === 'function') {
      nextSession = window.getFootballStageSession(nextNodeId);
    } else if (typeof window.generateStageSession === 'function') {
      nextSession = window.generateStageSession(nextNodeId, currentCourseLang, nextRound);
    } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      nextSession = window.VOCA_DATA.generateStageSession(nextNodeId, currentCourseLang, nextRound);
    }

    window.currentSelectedNodeId = nextNodeId;
    window.currentGameLessonId = nextNodeId;
    window.currentLessonId = nextNodeId;
    currentGameLessonId = nextNodeId;

    console.log(`📚 [Flow] 다음 스테이지(${nextNodeId}) 학습 파이프라인 진입 (라운드: ${nextRound})`);

    // 🛑 배경 화면(로드맵, 로드맵 헤더, 게임 화면, 하단 네비) 완전 숨김 (화면 겹침 및 이탈 방어)
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
    const gScreen = document.getElementById('game-screen');
    if (gScreen) {
      gScreen.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      gScreen.classList.remove('opacity-100', 'pointer-events-auto');
      gScreen.style.display = 'none';
    }
    const bottomNav = document.getElementById('bottom-nav') || document.querySelector('nav');
    if (bottomNav) {
      bottomNav.classList.add('hidden');
      bottomNav.style.display = 'none';
    }

    // 🛑 플래시카드 화면(#flashcard-screen)의 hidden 제거 후 예습 화면 먼저 렌더링
    const flashcardScreen = document.getElementById('flashcard-screen');
    if (flashcardScreen) {
      flashcardScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      flashcardScreen.classList.add('opacity-100', 'pointer-events-auto');
      flashcardScreen.style.removeProperty('display');
      flashcardScreen.style.display = '';
    }

    // 3단계 학습 파이프라인(startStageLearningPipeline) 우선 호출 및 방어 처리
    if (typeof window.startStageLearningPipeline === 'function') {
      window.startStageLearningPipeline(nextNodeId, nextSession);
    } else if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen(nextNodeId, nextSession);
    } else if (typeof window.initFlashcardDeck === 'function') {
      window.initFlashcardDeck(nextNodeId, nextSession);
    } else if (typeof window.loadFlashcards === 'function') {
      window.loadFlashcards(nextNodeId, nextSession);
    } else {
      openGameScreen(nextNodeId, nextSession);
    }

    return false;
  }

  function startWrongWordsMiniReview() {
    console.log('⚠️ startWrongWordsMiniReview 실행');
    const wrongWords = (Array.isArray(window.currentSessionWrongWords) && window.currentSessionWrongWords.length > 0)
      ? window.currentSessionWrongWords
      : (Array.isArray(missedWords) && missedWords.length > 0 ? missedWords : []);

    if (!wrongWords || wrongWords.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('복습할 오답 단어가 없습니다! 다음 스테이지로 진행합니다. 👍', '✨');
      }
      handleResultPrimary();
      return;
    }

    // 1) 결과 모달 닫기
    closeResultModal();
    const resultModal = document.getElementById('game-result-modal');
    if (resultModal) {
      resultModal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      resultModal.style.display = 'none';
    }

    // 2) 액션 게임 화면 안전 닫기
    const gScreen = document.getElementById('game-screen');
    if (gScreen) {
      gScreen.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      gScreen.classList.remove('opacity-100', 'pointer-events-auto');
      gScreen.style.display = 'none';
    }

    // 3) 플래시카드 화면 오픈 및 완료 시 화면 닫기 콜백 주입
    const flashcardScreen = document.getElementById('flashcard-screen');
    if (flashcardScreen) {
      flashcardScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      flashcardScreen.classList.add('opacity-100', 'pointer-events-auto');
      flashcardScreen.style.removeProperty('display');
      flashcardScreen.style.display = '';
    }

    if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen({
        words: wrongWords,
        onComplete: () => {
          if (typeof window.closeFlashcardScreen === 'function') {
            window.closeFlashcardScreen(true);
          }
        }
      });
    } else if (typeof window.initFlashcardDeck === 'function') {
      window.initFlashcardDeck(wrongWords);
    }
  }
  window.startWrongWordsMiniReview = startWrongWordsMiniReview;

  function startNextRoundOrStageDirectly() {
    console.log('🚀 [오답 복습 완료] 다음 회차/스테이지 게임으로 직접 진입 시작');
    // 1) 결과 모달 닫기
    closeResultModal();
    const resultModal = document.getElementById('game-result-modal');
    if (resultModal) {
      resultModal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      resultModal.style.display = 'none';
    }

    // 2) 플래시카드 화면 완전 숨김
    if (typeof window.closeFlashcardScreen === 'function') {
      window.closeFlashcardScreen(false);
    }
    const flashcardScreen = document.getElementById('flashcard-screen');
    if (flashcardScreen) {
      flashcardScreen.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      flashcardScreen.style.display = 'none';
    }

    // 3) 다음 스테이지 정보 획득
    const nextStageInfo = getNextStageInfo();
    if (nextStageInfo.isAllCompleted || !nextStageInfo.nextSession || String(nextStageInfo.nextNodeId).endsWith('_n3') || String(nextStageInfo.nextNodeId).includes('bonus')) {
      return false;
    }
    const { nextNodeId, nextSession } = nextStageInfo;


    // 4) 게임 화면 열기 및 시작
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      gameScreen.classList.add('opacity-100', 'pointer-events-auto');
      gameScreen.style.removeProperty('display');
      gameScreen.style.display = 'flex';
    }

    if (typeof window.openGameScreen === 'function') {
      window.openGameScreen(nextNodeId, nextSession);
    }
  }
  window.startNextRoundOrStageDirectly = startNextRoundOrStageDirectly;
  window.handleResultPrimary = handleResultPrimary;
  window.proceedNextStage = handleResultPrimary;
  window.moveToNextStage = handleResultPrimary;
  window.onClearModalNextClick = handleResultPrimary;

  function showCourseCompletionModal() {
    let modal = document.getElementById('course-completion-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'course-completion-modal';
      modal.className = 'fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in';
      modal.innerHTML = `
        <div class="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
          <div class="w-24 h-24 mb-3 flex items-center justify-center">
            <img id="completion-mascot-img" class="w-20 h-20 object-contain drop-shadow-md" src="assets/characters/es-victory.webp?v=99" alt="Victory Mascot">
          </div>
          <span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full mb-2">🎉 COURSE COMPLETED</span>
          <h2 class="text-xl font-black text-slate-900 mb-1">모든 코스 완주 달성! 🏆</h2>
          <p class="text-xs text-slate-600 mb-6 leading-relaxed">
            축하합니다! 코스의 모든 유닛과 보스전을 성공적으로 마스터했습니다! 훌륭한 실력이에요!
          </p>
          <button id="btn-close-completion-modal" type="button" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 hover:brightness-105 active:scale-95 transition-all cursor-pointer">
            로드맵으로 돌아가기 🗺️
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      const closeBtn = modal.querySelector('#btn-close-completion-modal');
      if (closeBtn) {
        closeBtn.onclick = function () {
          modal.classList.add('hidden');
          modal.style.display = 'none';
          if (typeof window.exitGameToRoadmap === 'function') window.exitGameToRoadmap(true);
        };
      }
    }
    const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const mascotImg = document.getElementById('completion-mascot-img');
    if (mascotImg) mascotImg.src = `assets/characters/${charPrefix}-victory.webp?v=99`;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
  window.showCourseCompletionModal = showCourseCompletionModal;

  function handleResultSecondary(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeResultModal();

    window.currentGameLessonId = null;
    window.currentSelectedNodeId = null;

    isExplicitExitRequested = true;
    window.isExplicitExitRequested = true;
    exitGameToRoadmap(true);
    isExplicitExitRequested = false;
    window.isExplicitExitRequested = false;

    if (window.isReviewGameMode) {
      const isRoadmapSpeedrun = !!window.isRoadmapReviewSpeedrun;
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      if (!isRoadmapSpeedrun) {
        if (typeof window.switchMainTab === 'function') window.switchMainTab('review', true);
      } else {
        if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
        if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
        if (typeof window.focusActiveRoadmapNode === 'function') window.focusActiveRoadmapNode();
        if (typeof window.showToast === 'function') window.showToast('로드맵으로 돌아왔습니다.', '🗺️');
      }
    } else {
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
      if (typeof window.focusActiveRoadmapNode === 'function') window.focusActiveRoadmapNode();
      if (typeof window.showToast === 'function') window.showToast('로드맵으로 돌아왔습니다.', '🗺️');
    }
  }

  function restartStageInMemory(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    }
    console.log('🔄 게임오버 모달: [처음부터 다시 도전] 순수 SPA 인메모리 재시작');

    // 하트 수량 검사 (하트가 0개이면 충전 모달 오픈 후 재시작 차단)
    if (!window.isRoadmapReviewSpeedrun && !window.isReviewGameMode) {
      if (typeof window.checkAndRechargeHearts === 'function') {
        window.checkAndRechargeHearts();
      }
      const curH = (typeof window.getUserHearts === 'function') ? window.getUserHearts() : (window.userHearts || 0);
      if (curH <= 0) {
        closeResultModal();
        exitGameToRoadmap(true);
        if (typeof window.openHeartRechargeModal === 'function') {
          window.openHeartRechargeModal();
        }
        return;
      }
    }

    // ① 결과 모달 닫기
    const resultModal = document.getElementById('game-result-modal');
    if (resultModal) {
      resultModal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      resultModal.classList.remove('opacity-100', 'pointer-events-auto');
      resultModal.style.display = 'none';
      resultModal.style.pointerEvents = 'none';
    }
    const overCard = document.getElementById('game-result-gameover-card');
    if (overCard) {
      overCard.classList.add('hidden');
      overCard.style.display = 'none';
    }
    const clearCard = document.getElementById('game-result-clear-card');
    if (clearCard) {
      clearCard.classList.add('hidden');
      clearCard.style.display = 'none';
    }
    closeResultModal();

    // ② 게임 엔진 내부 상태 리셋
    isStageFinishing = false;
    window.isStageFinishing = false;
    clearTimeout(gameNextQuestionTimer);
    gameNextQuestionTimer = null;
    clearAllGameTimers();
    cancelGameLoop();
    dropRafId = null;

    const curH = (typeof window.getUserHearts === 'function') ? window.getUserHearts() : ((typeof window.userHearts === 'number') ? window.userHearts : 5);
    currentHearts = (window.isRoadmapReviewSpeedrun || window.isReviewGameMode) ? Math.max(1, curH) : curH;
    score = 0;
    combo = 0;
    maxCombo = 0;
    currentQuestionIdx = 0;
    speedMultiplier = 1.0;
    missedWords = [];
    isCurrentQuestionFailed = false;

    isActive = true;
    isGameActive = true;
    window.isActive = true;
    window.isGameActive = true;
    isPaused = false;
    isFrozen = false;
    isQuestionActive = false;

    if (typeof this !== 'undefined' && this) {
      this.hearts = currentHearts;
      this.score = 0;
      this.combo = 0;
      this.currentIndex = 0;
      this.isGameActive = true;
    }

    if (gamePauseDialog) gamePauseDialog.classList.add('hidden');
    if (gameFreezeOverlay) gameFreezeOverlay.classList.add('hidden');
    if (gameFloatingEffect) gameFloatingEffect.classList.add('hidden');

    // 게임 화면 표시 보장
    if (gameScreen) {
      gameScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      gameScreen.classList.add('opacity-100', 'pointer-events-auto');
      gameScreen.style.removeProperty('display');
      gameScreen.style.display = 'flex';
    }
    if (gameContainer) {
      gameContainer.classList.remove('translate-y-full');
      gameContainer.classList.add('translate-y-0');
    }

    // ③ 상단 UI 즉시 갱신
    updateHeartsUI();
    updateHeaderStatusUI();
    updateItemCountUI();

    // ④ 현재 스테이지 단어 덱으로 게임 루프 재시작
    const targetNodeId = currentGameLessonId || window.currentSelectedNodeId || 'node-2';
    const round = (typeof window.nodeProgressMap !== 'undefined' && window.nodeProgressMap[targetNodeId]) || 0;
    const currentCourse = window.currentActiveCourse || 'es';

    if (!gameQuestions || !Array.isArray(gameQuestions) || gameQuestions.length === 0) {
      if (window.currentSessionQuestions && window.currentSessionQuestions.length > 0) {
        gameQuestions = window.currentSessionQuestions.slice();
      } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
        gameQuestions = window.VOCA_DATA.generateStageSession(targetNodeId, currentCourse, round);
        window.currentSessionQuestions = gameQuestions;
      }
    }

    // 4지선다 선택지 버튼 렌더링 및 이벤트 갱신
    bindChoiceDelegation();

    // 첫 번째 단어 즉시 낙하 시작 (spawnQuestion(0))
    spawnQuestion(0);
    if (typeof this !== 'undefined' && this && typeof this.spawnDroppingWord === 'function') {
      try { this.spawnDroppingWord(0); } catch (_) { }
    } else if (typeof window.spawnDroppingWord === 'function' && window.spawnDroppingWord !== spawnQuestion) {
      try { window.spawnDroppingWord(0); } catch (_) { }
    }

    return false;
  }
  const restartGame = restartStageInMemory;
  window.restartGame = restartStageInMemory;
  window.restartStageInMemory = restartStageInMemory;
  const startNextSubRound = restartStageInMemory;
  window.startNextSubRound = restartStageInMemory;

  function bindChoiceDelegation() {
    const cContainer = document.getElementById('game-choices-container') || choicesContainer;
    if (cContainer) {
      cContainer.onclick = function (e) {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return false;
        if (btn && typeof btn.blur === 'function') btn.blur();
        if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();

        // 버튼에 적힌 텍스트 가져오기
        const selectedText = (btn.dataset.choice || btn.innerText || btn.textContent || '').trim();
        console.log('🔥 4지선다 클릭 감지됨! 선택 텍스트:', selectedText);

        // 정답 판정 함수 직접 호출
        if (typeof window.handleChoiceClick === 'function') {
          window.handleChoiceClick(btn, selectedText, e);
        } else {
          // 인라인 직접 판정 폴백
          judgeAnswerDirectly(btn, selectedText, e);
        }
        return false;
      };
    }
  }

  function bindEvents() {
    initDOMElements();

    if (gameCloseBtn) {
      gameCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openGamePauseDialog();
      });
    }

    if (gameResumeBtn) {
      gameResumeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeGamePauseDialog();
      });
    }

    if (gameQuitBtn) {
      gameQuitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeGamePauseDialog();
        isExplicitExitRequested = true;
        window.isExplicitExitRequested = true;
        exitGameToRoadmap(true);
        isExplicitExitRequested = false;
        window.isExplicitExitRequested = false;
        if (window.showToast) window.showToast('게임을 중단하고 로드맵으로 돌아왔습니다.', '🚪');
      });
    }

    // 1) 4지선다 버튼 컨테이너에 클릭 이벤트 위임(Event Delegation) 강제 연결
    bindChoiceDelegation();

    // 2) 아이템 버튼 클릭: #game-item-bar 부모에 이벤트 위임
    const gameItemBar = document.getElementById('game-item-bar');
    if (gameItemBar) {
      gameItemBar.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('button[data-item]');
        if (!btn || btn.disabled) return;
        const itemType = btn.dataset.item;
        if (itemType && window.useGameItem) {
          window.useGameItem(itemType);
        }
      };
    }

    // 각 4종 아이템 버튼 개별 리스너 연결
    [gameItemPass, gameItemFreeze, gameItemBomb, gameItemHeal].forEach((btn) => {
      if (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          const itemType = btn.dataset.item;
          if (itemType && window.useGameItem) {
            window.useGameItem(itemType);
          }
        };
      }
    });

    if (gameDroppingBubble) {
      gameDroppingBubble.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!isQuestionActive || !isGameActive || !isActive) return;
        const q = gameQuestions[currentQuestionIdx];
        if (q) {
          try {
            safePlayTTS(q.word || q.term, window.currentActiveCourse || 'es');
          } catch (ttsErr) {
            console.warn('TTS 재생 예외 방어:', ttsErr);
          }
          gameDroppingBubble.classList.add('scale-105');
          setTimeout(() => gameDroppingBubble.classList.remove('scale-105'), 150);
        }
      });
    }

    // 힌트 버튼 / 말풍선 클릭 방어 및 발음 재생
    const gameHintPills = document.querySelectorAll('#game-screen [class*="tips_and_updates"], #game-hint-pill');
    gameHintPills.forEach((p) => {
      const container = p.closest('div');
      if (container) {
        container.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (!isQuestionActive || !isGameActive || !isActive) return;
          const q = gameQuestions[currentQuestionIdx];
          if (q) {
            safePlayTTS(q.word || q.term, window.currentActiveCourse || 'es', container);
          }
        };
      }
    });

    // 결과 모달 버튼 이벤트 리스너 연결 (SPA 네비게이션 & 기본동작 차단: #btn-next-stage 및 #btn-result-primary)
    const btnResultWrongReview = document.getElementById('btn-result-wrong-review');
    if (btnResultWrongReview) {
      btnResultWrongReview.onclick = function (e) {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        startWrongWordsMiniReview();
        return false;
      };
    }

    const nextButtons = [
      document.getElementById('btn-next-stage'),
      document.getElementById('btn-result-primary')
    ].filter(Boolean);
    nextButtons.forEach((btn) => {
      btn.onclick = function (e) {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        handleResultPrimary(e);
        return false;
      };
    });

    const btnResultSecondary = document.getElementById('btn-result-secondary');
    if (btnResultSecondary) {
      btnResultSecondary.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleResultSecondary(e);
      };
    }

    const handleGameoverExit = function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      }
      console.log('🚪 게임오버 모달: [로드맵으로 나가기] 순수 DOM 전환 클릭');
      closeResultModal();
      const resultModal = document.getElementById('game-result-modal');
      if (resultModal) {
        resultModal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
        resultModal.style.display = 'none';
      }
      const overCard = document.getElementById('game-result-gameover-card');
      if (overCard) {
        overCard.classList.add('hidden');
        overCard.style.display = 'none';
      }
      window.isUnitSkipTestMode = false;
      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;
      return false;
    };

    const btnGameOverExit = document.getElementById('game-over-exit-btn') || document.getElementById('btn-gameover-roadmap');
    if (btnGameOverExit) {
      btnGameOverExit.onclick = handleGameoverExit;
      btnGameOverExit.addEventListener('click', handleGameoverExit);
    }

    const btnGameoverRoadmap = document.getElementById('btn-gameover-roadmap');
    if (btnGameoverRoadmap && btnGameoverRoadmap !== btnGameOverExit) {
      btnGameoverRoadmap.onclick = handleGameoverExit;
      btnGameoverRoadmap.addEventListener('click', handleGameoverExit);
    }

    const btnGameoverClose = document.getElementById('btn-gameover-close');
    if (btnGameoverClose) {
      btnGameoverClose.onclick = handleGameoverExit;
    }

    const btnGameoverRetry = document.getElementById('btn-gameover-retry');
    if (btnGameoverRetry) {
      btnGameoverRetry.onclick = function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        return restartStageInMemory(e);
      };
      btnGameoverRetry.addEventListener('click', function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        return restartStageInMemory(e);
      }, true);
    }

    const btnGameoverAd = document.getElementById('btn-gameover-ad-revive');
    if (btnGameoverAd) {
      btnGameoverAd.onclick = function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        closeResultModal();
        const resultModal = document.getElementById('game-result-modal');
        if (resultModal) {
          resultModal.classList.add('hidden', 'opacity-0', 'pointer-events-none');
          resultModal.style.display = 'none';
        }
        const overCard = document.getElementById('game-result-gameover-card');
        if (overCard) {
          overCard.classList.add('hidden');
          overCard.style.display = 'none';
        }
        if (typeof window.reviveGameHearts === 'function') {
          window.reviveGameHearts(3);
        } else {
          currentHearts = 3;
          updateHeartsUI();
          updateHeaderStatusUI();
          isQuestionActive = true;
          isActive = true;
          isGameActive = true;
          window.isActive = true;
          window.isGameActive = true;
          nextQuestion();
        }
        if (typeof window.showToast === 'function') window.showToast('❤️ 하트 3개가 충전되었습니다!', '✨');
        return false;
      };
    }

    // 전역 링크 클릭 / 폼 제출 브라우저 네비게이션 원천 차단 실드
    document.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (a) {
        const href = a.getAttribute('href');
        if (!href || href === '#' || href === '' || href.startsWith('javascript:')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, true);

    document.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (window.stopTTS) window.stopTTS();
        if (isGameActive && isActive && !isPaused && isQuestionActive) {
          openGamePauseDialog();
        }
      }
    });
  }

  // Public Session Reference
  const currentGameSession = {
    get questions() { return gameQuestions; },
    get currentDeck() { return gameQuestions; },
    get currentIndex() { return currentQuestionIdx; },
    get active() { return isActive && isGameActive && !isPaused && isQuestionActive; },
    get isActive() { return isActive; },
    get isGameActive() { return isGameActive; },
    get isPaused() { return isPaused; },
    get isQuestionActive() { return isQuestionActive; },
    get isGameOver() { return currentHearts <= 0 || !isGameActive || !isActive; },
    finishGameStage(isClear = true) { return finishGameStage(isClear); }
  };

  // Global Exports
  window.isActive = false;
  window.isGameActive = false;
  window.clearAllGameTimers = clearAllGameTimers;
  window.openGameScreen = openGameScreen;
  window.startGameSession = openGameScreen;
  window.showGameScreen = openGameScreen;
  window._rawCloseGameScreen = closeGameScreen;
  window.closeGameScreen = closeGameScreen;
  window.renderResultModal = renderResultModal;
  window.finishGameStage = finishGameStage;

  window.handleDeadlineBreached = handleDeadlineBreached;
  window.handleDeadlineHit = handleDeadlineBreached;
  window.onWordMiss = handleDeadlineBreached;
  window.nextQuestion = nextQuestion;
  window.nextWord = nextQuestion;
  window.spawnQuestion = spawnQuestion;
  window.spawnDroppingWord = spawnQuestion;

  window.showRoadmap = showRoadmap;
  window.switchScreen = switchScreen;
  window.goHome = goHome;
  window.exitGameToRoadmap = exitGameToRoadmap;
  window.exitGame = exitGameToRoadmap;
  window.closeGameModal = closeGameScreen;

  window.restartGame = restartGame;
  window.resetGame = resetGame;
  window.decreaseHeart = decreaseHeart;
  window.triggerGameOver = triggerGameOver;
  window.startNextSubRound = startNextSubRound;
  window.currentGameSession = currentGameSession;
  window.updateHeartsUI = updateHeartsUI;
  window.updateItemCountUI = updateItemCountUI;
  window.playSuccessChime = playSuccessChime;
  window.getGameEngineState = () => ({
    currentGameLessonId,
    currentHearts,
    score,
    combo,
    maxCombo,
    missedWords,
    totalQ: gameQuestions.length,
    currentQuestionIdx
  });

  function startFallingGame(lessonId = 'node-2', session = null, options = {}) {
    if (Array.isArray(lessonId)) {
      session = lessonId;
      lessonId = (options && options.lessonId) || window.currentSelectedNodeId || 'node-1';
    }
    return openGameScreen(lessonId, session);
  }

  function launchGame(gameType = 'falling', wordList = null, options = {}) {
    console.log(`🎮 [MiniGame Adapter] launchGame: gameType=${gameType}`, options);
    const lessonId = (options && options.lessonId) || (typeof options === 'string' ? options : 'node-2');
    const runner = (typeof window !== 'undefined' && window.startFallingGame) ? window.startFallingGame : startFallingGame;
    switch (gameType) {
      case 'wrong_answer':
      case 'wrong_run':
        if (typeof window.startRoadmapReviewSpeedrun === 'function') {
          return window.startRoadmapReviewSpeedrun();
        }
        return runner(lessonId, wordList, options);

      case 'falling':
      case 'runner':
      case 'default':
        return runner(lessonId, wordList, options);

      case 'card_flip':
      case 'flip':
        console.log('🃏 카드 뒤집기 미니게임 (준비 중)');
        if (typeof window.showToast === 'function') {
          window.showToast('🃏 카드 뒤집기 미니게임은 다음 업데이트에 제공됩니다!', '✨');
        }
        return false;

      case 'speed_quiz':
      case 'quiz':
        console.log('⚡ 4지선다 스피드 퀴즈 (준비 중)');
        if (typeof window.showToast === 'function') {
          window.showToast('⚡ 스피드 퀴즈 미니게임은 다음 업데이트에 제공됩니다!', '✨');
        }
        return false;

      default:
        console.warn(`⚠️ 알 수 없는 게임 모드(${gameType}) -> falling 게임 실행`);
        return runner(lessonId, wordList, options);
    }
  }

  window.startFallingGame = startFallingGame;
  window.launchGame = launchGame;
  window.reviveGameHearts = function (amount = 3) {
    clearAllGameTimers();
    currentHearts = amount;
    if (typeof window.setUserHearts === 'function') {
      window.setUserHearts(amount);
    } else {
      window.userHearts = amount;
      try { localStorage.setItem('vocadash_hearts', String(amount)); } catch (_) { }
    }
    updateHeartsUI();
    isActive = true;
    isGameActive = true;
    window.isActive = true;
    window.isGameActive = true;
    isQuestionActive = true;
    spawnQuestion(currentQuestionIdx);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
