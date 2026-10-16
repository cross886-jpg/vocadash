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
  } catch (_) {}

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
      const ctx = window._vocaAudioCtx;
      if (ctx.state === 'suspended') {
        try { ctx.resume().catch(() => {}); } catch (_) {}
      }
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.08);
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.32);
    } catch (e) {}
  }

  function playWrongBuzzer() {
    if (window.vocadashSettings && window.vocadashSettings.soundEffects === false) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._vocaAudioCtx) {
        window._vocaAudioCtx = new AudioCtx();
      }
      const ctx = window._vocaAudioCtx;
      if (ctx.state === 'suspended') {
        try { ctx.resume().catch(() => {}); } catch (_) {}
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (_) {}
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
        try { ctx.resume().catch(() => {}); } catch (_) {}
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
    } catch (_) {}
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
  window.gameItemCounts = { pass: 2, freeze: 1, bomb: 1, heal: 1 };
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
    currentHearts = Math.max(0, currentHearts - 1);
    combo = 0;
    speedMultiplier = 1.0;
    updateHeartsUI();
    updateHeaderStatusUI();
    return currentHearts;
  }
  window.decreaseHeart = decreaseHeart;

  function triggerGameOver() {
    console.log('💀 triggerGameOver: 게임오버 처리 시작 (순수 SPA 모달 표출, 리로드/퇴장 완전 금지)');
    // ① 모든 게임 타이머 정지 (clearInterval, clearTimeout)
    clearAllGameTimers();
    cancelGameLoop();
    dropRafId = null;
    if (window.stopTTS) window.stopTTS();
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
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
    clearAllGameTimers();
    cancelGameLoop();
    dropRafId = null;
    currentHearts = 5;
    combo = 0;
    maxCombo = 0;
    score = 0;
    speedMultiplier = 1.0;
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
    const counts = window.gameItemCounts || itemCounts;
    if (gameItemPassCount) gameItemPassCount.textContent = `x${counts.pass}`;
    if (gameItemPass) {
      gameItemPass.disabled = counts.pass <= 0;
      gameItemPass.classList.toggle('opacity-40', counts.pass <= 0);
      gameItemPass.classList.toggle('cursor-not-allowed', counts.pass <= 0);
    }
    if (gameItemFreezeCount) gameItemFreezeCount.textContent = `x${counts.freeze}`;
    if (gameItemFreeze) {
      gameItemFreeze.disabled = counts.freeze <= 0;
      gameItemFreeze.classList.toggle('opacity-40', counts.freeze <= 0);
      gameItemFreeze.classList.toggle('cursor-not-allowed', counts.freeze <= 0);
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

    setTimeout(() => {
      if (gameFloatingEffect) gameFloatingEffect.classList.add('hidden');
    }, 900);
  }

  function renderResultModal(isClear) {
    if (typeof this !== 'undefined' && this) {
      this.isGameActive = false;
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }
    }
    isActive = false;
    isGameActive = false;
    window.isActive = false;
    window.isGameActive = false;
    isQuestionActive = false;
    cancelGameLoop();
    clearAllGameTimers();
    dropRafId = null;
    if (window.stopTTS) window.stopTTS();
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }

    const modal = document.getElementById('game-result-modal');
    const clearCard = document.getElementById('game-result-clear-card');
    const overCard = document.getElementById('game-result-gameover-card');
    const gScreen = document.getElementById('game-screen');
    const gContainer = document.getElementById('game-container');

    // 🛑 게임 화면은 배경에 그대로 두고 모달만 상단에 표출 (로드맵 강제 퇴장 방어)
    if (gScreen) {
      gScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      gScreen.classList.add('opacity-100', 'pointer-events-auto');
      gScreen.style.removeProperty('display');
      gScreen.style.display = 'flex';
    }
    if (gContainer) {
      gContainer.classList.remove('translate-y-full');
      gContainer.classList.add('translate-y-0');
    }

    if (modal) {
      modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100', 'pointer-events-auto');
      modal.style.display = 'flex';
      modal.style.pointerEvents = 'auto';
      modal.style.zIndex = '9999';
    }

    if (isClear) {
      if (clearCard) {
        clearCard.classList.remove('hidden');
        clearCard.style.display = 'flex';
      }
      if (overCard) {
        overCard.classList.add('hidden');
        overCard.style.display = 'none';
      }

      // 결과 마스코트 (승리 고양이) 언어별 동적 바인딩
      try {
        const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const resultMascot = document.getElementById('result-mascot-img');
        if (resultMascot) resultMascot.src = `assets/characters/${charPrefix}-victory.webp?v=9`;
      } catch (_) {}

      // 낙하 중이던 단어 DOM 숨김
      const droppingEl = document.getElementById('dropping-word') || document.getElementById('game-dropping-bubble') || document.getElementById('game-dropping-word');
      if (droppingEl) droppingEl.style.display = 'none';
      const dropBubble = document.getElementById('game-dropping-bubble');
      if (dropBubble) {
        dropBubble.classList.add('hidden');
        dropBubble.style.display = 'none';
        dropBubble.style.opacity = '0';
      }
      const dropWord = document.getElementById('game-dropping-word');
      if (dropWord) dropWord.style.display = 'none';

      // 보상/점수/경험치/콤보 텍스트 안전 대입 (null 체크 & 옵셔널 체이닝 & try-catch)
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

        const targetNodeId = currentGameLessonId || window.currentSelectedNodeId || 'node-2';
        const curProg = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;
        const btnPrimaryText = document.getElementById('btn-result-primary-text');
        if (btnPrimaryText) {
          if (window.isReviewGameMode) {
            btnPrimaryText.textContent = '오답노트로 복귀';
          } else if (targetNodeId === 'node-3' || String(targetNodeId).includes('3')) {
            btnPrimaryText.textContent = '3과 마스터 & 4과(보스전) 도전!';
          } else if (targetNodeId === 'node-boss' || String(targetNodeId).includes('boss')) {
            btnPrimaryText.textContent = '보스전 클리어 & 로드맵으로';
          } else if (curProg >= 3) {
            btnPrimaryText.textContent = '2과 마스터 완료 & 3과 열기';
          } else {
            btnPrimaryText.textContent = `다음 스테이지 (${Math.min(3, curProg + 1)}/3)`;
          }
        }
      } catch (err) {}
    } else {
      // 💀 게임오버: 클리어 카드 완벽 숨김 & 오직 게임오버 카드(#game-result-gameover-card)만 화면에 표출
      if (clearCard) {
        clearCard.classList.add('hidden');
        clearCard.style.display = 'none';
      }
      if (overCard) {
        overCard.classList.remove('hidden');
        overCard.style.display = 'flex';
      }

      // 게임오버 마스코트 (슬픈 고양이) 언어별 동적 바인딩
      try {
        const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const goMascots = document.querySelectorAll('#game-result-gameover-card img, #result-gameover-card img');
        goMascots.forEach(img => {
          img.src = `assets/characters/${charPrefix}-sad.webp?v=9`;
        });
      } catch (_) {}

      // 게임오버 카드 내 통계 & 마지막 오답 데이터 직접 바인딩
      try {
        const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [], totalQ: 13, currentQuestionIdx: currentQuestionIdx };
        const totalQ = (gameQuestions && gameQuestions.length) || stats.totalQ || 13;
        const missedList = missedWords || stats.missedWords || [];
        const lastFailed = missedList.length > 0 ? missedList[missedList.length - 1] : (gameQuestions && gameQuestions[currentQuestionIdx]);

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
        if (goProgText) {
          goProgText.textContent = `${solvedQ} / ${totalQ} 단어 (${progPct}%)`;
        }

        const goProgBar = document.getElementById('gameover-progress-bar');
        if (goProgBar) {
          goProgBar.style.width = `${progPct}%`;
        }
      } catch (uiErr) {
        console.warn('⚠️ 게임오버 카드 바인딩 예외 안전 방어:', uiErr);
      }
    }

    if (typeof window.showGameResultModal === 'function') {
      try {
        window.showGameResultModal(isClear ? 'clear' : 'gameover');
      } catch (err) {
        console.warn('⚠️ showGameResultModal 호출 예외 방어:', err);
      }
    }
  }

  function finishGameStage(isClear = true) {
    console.log('🏁 finishGameStage 안전 호출: isClear =', isClear, '결과 모달(#game-result-modal) 안전하게 렌더링');
    try {
      // 0) [최상단] 결과 모달 즉시 노출 & 카드/버블 hidden 조정
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

      if (isClear) {
        clearCard?.classList.remove('hidden');
        if (clearCard) clearCard.style.display = 'flex';
        gameoverCard?.classList.add('hidden');
        if (gameoverCard) gameoverCard.style.display = 'none';
      } else {
        clearCard?.classList.add('hidden');
        if (clearCard) clearCard.style.display = 'none';
        gameoverCard?.classList.remove('hidden');
        if (gameoverCard) gameoverCard.style.display = 'flex';
      }

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
      cancelGameLoop();
      clearAllGameTimers();
      isActive = false;
      isGameActive = false;
      window.isActive = false;
      window.isGameActive = false;
      isQuestionActive = false;
      if (window.stopTTS) window.stopTTS();
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }

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
      } catch (err) {}

      // 사운드 안전 재생
      try {
        if (isClear) {
          if (typeof playSound === 'function') {
            playSound?.('clear');
          } else if (typeof window?.playSound === 'function') {
            window.playSound?.('clear');
          } else if (typeof playSuccessChime === 'function') {
            playSuccessChime?.();
          } else if (typeof window?.playSuccessChime === 'function') {
            window.playSuccessChime?.();
          }
        }
      } catch(e) {}

      // 스테이지 클리어(isClear = true) 시 진척도 갱신 및 영구 저장
      if (isClear) {
        const targetNodeId = currentGameLessonId || window.currentSelectedNodeId || 'node-2';
        if (!window.nodeProgressMap) window.nodeProgressMap = {};
        const curProg = window.nodeProgressMap[targetNodeId] || 0;
        let nextProg = Math.min(3, curProg + 1);

        // 3과 완료 시 확실하게 3(완료)으로 저장하여 보스전(node-boss) 잠금 해제
        if (targetNodeId === 'node-3' || String(targetNodeId).includes('3')) {
          nextProg = 3;
        } else if (targetNodeId === 'node-boss' || String(targetNodeId).includes('boss')) {
          nextProg = 3;
        }
        window.nodeProgressMap[targetNodeId] = nextProg;

        if ((targetNodeId === 'node-2' || String(targetNodeId).includes('2')) && nextProg >= 3) {
          if (window.nodeProgressMap['node-3'] === undefined || window.nodeProgressMap['node-3'] === 0) {
            window.nodeProgressMap['node-3'] = 0;
          }
        } else if ((targetNodeId === 'node-3' || String(targetNodeId).includes('3')) && nextProg >= 3) {
          if (window.nodeProgressMap['node-boss'] === undefined || window.nodeProgressMap['node-boss'] === 0) {
            window.nodeProgressMap['node-boss'] = 0;
          }
        }

        if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
        if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      }
    } catch (err) {
      console.error('클리어 모달 표시 중 오류 발생:', err);
    }

    try {
      renderResultModal(isClear);
    } catch (modalErr) {
      console.error('⚠️ renderResultModal 실행 예외 방어:', modalErr);
    }
  }
  window.finishGameStage = finishGameStage;

  function spawnQuestion(index) {
    try {
      clearAllGameTimers();
      if (window.stopTTS) window.stopTTS();

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
      if (gameDroppingWord) {
        gameDroppingWord.classList.remove('hidden');
        gameDroppingWord.style.display = 'inline-block';
        gameDroppingWord.style.opacity = '1';
        gameDroppingWord.textContent = qTerm;
        const len = qTerm.length;
        if (len <= 7) {
          gameDroppingWord.className = 'font-headline-xl text-[26px] font-extrabold text-[#1E293B] tracking-tight drop-shadow-sm select-none break-keep text-center leading-snug';
        } else if (len <= 14) {
          gameDroppingWord.className = 'font-headline-xl text-[20px] font-extrabold text-[#1E293B] tracking-tight drop-shadow-sm select-none break-keep text-center leading-snug';
        } else if (len <= 22) {
          gameDroppingWord.className = 'font-headline-xl text-[16px] font-bold text-[#1E293B] tracking-tight drop-shadow-sm select-none break-keep text-center leading-snug';
        } else {
          gameDroppingWord.className = 'font-headline-xl text-[14px] font-bold text-[#1E293B] tracking-tight drop-shadow-sm select-none break-keep text-center leading-tight';
        }
      }

      const currentCourse = window.currentActiveCourse || 'es';
      const correctAnswer = (q.meaning || q.answer || q.korean || q.ko || '').trim();
      const trimmedAnswer = correctAnswer;

      let choices = [];
      try {
        if (window.VOCA_DATA && typeof window.VOCA_DATA.generateQuestionChoices === 'function') {
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

      const defaultFallbacks = ['여권', '관광', '감사합니다', '안녕하세요', '비자'];
      let dfIdx = 0;
      while (choices.length < 4) {
        const df = defaultFallbacks[dfIdx % defaultFallbacks.length];
        if (!choices.includes(df)) choices.push(df);
        dfIdx++;
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
            safePlayTTS(qTerm, currentCourse);
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
    const isSentence = currentQ && (currentQ.isSentence || currentQuestionIdx >= 10);
    const sentenceMultiplier = isSentence ? 1.25 : 1.0;
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

      // 오답 발생 시 로컬스토리지 오답노트에 즉시 영구 저장
      if (q && typeof window.addWrongWord === 'function') {
        try { window.addWrongWord(q); } catch (_) {}
      }

      if (gameArena) {
        gameArena.classList.add('animate-game-shake');
        setTimeout(() => gameArena && gameArena.classList.remove('animate-game-shake'), 450);
      }

      try {
        playWrongBuzzer();
      } catch (_) {}
      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic([80, 50, 80]);
      }

      showGameFloatingEffect('위험선 도달! -1 ❤️', false);

      const targetAnswer = ((q && (q.meaning || q.answer || q.korean || '')) || '').trim();
      const correctBtn = gameChoiceBtns.find(b => b && checkAnswerMatch((b.dataset.choice || b.textContent || '').trim(), targetAnswer)) || gameChoiceBtns[currentCorrectChoiceIdx];
      if (correctBtn) {
        correctBtn.className = 'game-choice-btn h-[44px] rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-400 border-b-[4px] border-b-emerald-500 flex items-center justify-center px-2 font-headline-sm text-[15px] font-extrabold';
      }

      // 하트 1개 차감
      const remainingHearts = decreaseHeart();

      clearTimeout(gameNextQuestionTimer);
      gameNextQuestionTimer = setTimeout(() => {
        if (!isActive || !isGameActive) return;
        // 하트가 0개가 된 경우에만 타이머 멈추고 게임오버 모달 표출 (로드맵 강제 이동 금지!)
        if (remainingHearts <= 0 || currentHearts <= 0) {
          triggerGameOver();
        } else {
          // 하트가 남아있다면 즉시 다음 단어 낙하 진행
          nextQuestion();
        }
      }, 700);
    } catch (err) {
      console.warn('⚠️ handleDeadlineBreached 예외 안전 방어:', err);
      if (currentHearts <= 0) {
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
      if (!isLast && (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || !isQuestionActive)) return;
      isQuestionActive = false;
      cancelGameLoop();
      if (window.stopTTS) window.stopTTS();

      const currentQ = gameQuestions[currentQuestionIdx];
      const targetAns = ((currentQ && (currentQ.meaning || currentQ.answer || currentQ.korean || currentQ.ko || '')) || '').trim();

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
      const gainedScore = 100 + (combo * 20);
      score += gainedScore;
      speedMultiplier = Math.min(1.8, 1.0 + (combo * 0.05));
      updateHeaderStatusUI();

      showGameFloatingEffect(`정답! +${gainedScore}${combo >= 2 ? ` (🔥x${combo})` : ''}`, true);

      if (gameDroppingBubble) {
        gameDroppingBubble.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        gameDroppingBubble.style.transform = 'translate(-50%, 0) scale(1.25)';
        gameDroppingBubble.style.opacity = '0';
      }

      try {
        if (combo >= 2) {
          playComboChime(combo);
        } else {
          playSuccessChime();
        }
      } catch (_) {}

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
          } catch (textErr) {}

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
          } catch(soundErr) {}
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

  function handleWrongAnswer(btn, selectedText) {
    try {
      if (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false || !isQuestionActive) return;

      const currentQ = gameQuestions[currentQuestionIdx];

      if (!isCurrentQuestionFailed && currentQ) {
        isCurrentQuestionFailed = true;
        if (!missedWords.some(item => (item.id && item.id === currentQ.id) || item.term === (currentQ.term || currentQ.word))) {
          missedWords.push(currentQ);
        }
      }

      // 오답 발생 시 로컬스토리지 오답노트에 즉시 영구 저장
      if (currentQ && typeof window.addWrongWord === 'function') {
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

      // 2) 하트 1개 차감 & 콤보 초기화
      const remainingHearts = decreaseHeart();

      showGameFloatingEffect('오답! -1 ❤️', false);

      try {
        playWrongBuzzer();
      } catch (_) {}

      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic([60, 40, 60]);
      }

      if (gameArena) {
        gameArena.classList.add('animate-game-shake');
        setTimeout(() => gameArena.classList.remove('animate-game-shake'), 300);
      }

      // 3) 오답으로 인해 하트가 0개가 되면 그 즉시 게임오버 모달 표출 (리로드/이동 없음)
      if (remainingHearts <= 0 || currentHearts <= 0) {
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
    try {
      if (!btn || btn.disabled) return false;
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

      const correctAns = (currentQ.meaning || currentQ.answer || currentQ.korean || currentQ.ko || '').trim();
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
  function triggerFreezeEffect(duration = 3500) {
    if (!isQuestionActive || isPaused) return;
    isFrozen = true;
    if (gameFreezeOverlay) gameFreezeOverlay.classList.remove('hidden');
    showGameFloatingEffect('❄️ 3.5초 빙결!', true);

    clearTimeout(freezeTimer);
    freezeTimer = setTimeout(() => {
      isFrozen = false;
      if (gameFreezeOverlay) gameFreezeOverlay.classList.add('hidden');
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

    if (!isGameActive || isPaused || currentHearts <= 0) return;
    if (!window.gameItemCounts || window.gameItemCounts[itemType] <= 0) {
      if (window.showToast) window.showToast('⚠️ 아이템을 모두 사용했습니다!');
      return;
    }

    switch (itemType) {
      case 'pass':
        window.gameItemCounts.pass--;
        if (window.showToast) window.showToast('⚡ 패스 사용! 다음 단어로 넘어갑니다.');
        showGameFloatingEffect('⚡ 단어 패스!', true);
        handleCorrectAnswer();
        break;

      case 'freeze':
        if (isFrozen) {
          if (window.showToast) window.showToast('이미 빙결 효과가 적용 중입니다! ❄️');
          return;
        }
        window.gameItemCounts.freeze--;
        if (window.showToast) window.showToast('❄️ 빙결! 3.5초간 단어가 멈춥니다.');
        triggerFreezeEffect(3500);
        break;

      case 'bomb':
        window.gameItemCounts.bomb--;
        if (window.showToast) window.showToast('💣 폭탄 사용! 오답 2개 제거!');
        triggerBombEffect();
        break;

      case 'heal':
        if (currentHearts >= 5) {
          if (window.showToast) window.showToast('이미 하트가 가득 차 있습니다! ❤️');
          return;
        }
        currentHearts = Math.min(5, currentHearts + 1);
        window.gameItemCounts.heal--;
        updateHeartsUI();
        updateItemCountUI();
        if (window.showToast) window.showToast(`💖 하트 회복 완료! (현재 하트: ${currentHearts}/5)`);
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
    if (!gameScreen) initDOMElements();
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

    missedWords = [];
    isCurrentQuestionFailed = false;

    currentGameLessonId = lessonId || 'node-2';
    window.currentGameLessonId = currentGameLessonId;
    window.currentSelectedNodeId = currentGameLessonId;
    const round = (typeof window.nodeProgressMap !== 'undefined' && window.nodeProgressMap[currentGameLessonId]) || 0;
    const currentCourse = window.currentActiveCourse || 'es';

    if (session && Array.isArray(session) && session.length >= 13) {
      gameQuestions = session.slice();
      window.currentSessionQuestions = session;
    } else if (window.currentSessionQuestions && window.currentSessionQuestions.length >= 13) {
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

    // 13문제 완주 보장: 어떤 경우에도 문제 수가 13개 미만이면 전체 13개 세트로 재보충
    if (!gameQuestions || gameQuestions.length < 13) {
      if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
        gameQuestions = window.VOCA_DATA.generateStageSession(currentGameLessonId, currentCourse, round);
        window.currentSessionQuestions = gameQuestions;
      }
    }

    // 단어 부족 시 가지고 있는 단어들을 순환(fallback)하여 13문제 완주 보장
    if (gameQuestions && gameQuestions.length > 0 && gameQuestions.length < 13) {
      const orig = gameQuestions.slice();
      let padIdx = 0;
      while (gameQuestions.length < 13) {
        gameQuestions.push({ ...orig[padIdx % orig.length] });
        padIdx++;
      }
      window.currentSessionQuestions = gameQuestions;
    }

    const roundProg = (typeof window.nodeProgressMap !== 'undefined' && window.nodeProgressMap[currentGameLessonId]) || 0;
    const isBoss = (currentGameLessonId === 'node-boss' || String(currentGameLessonId).includes('boss'));
    const stageName = currentGameLessonId === 'node-1' ? 'Stage 1: 기내 기본 표현'
      : currentGameLessonId === 'node-3' ? 'Stage 3: 수하물과 세관'
      : isBoss ? 'Stage 4: 일상 기초 (보스전)'
      : 'Stage 2: 입국 심사';
    const subRoundText = isBoss ? '' : ` (${Math.min(3, roundProg + 1)}/3)`;
    if (gameStageTitle) gameStageTitle.textContent = `${stageName}${subRoundText}`;

    currentHearts = 5;
    combo = 0;
    maxCombo = 0;
    score = 0;
    speedMultiplier = 1.0;
    window.gameItemCounts = { pass: 2, freeze: 1, bomb: 1, heal: 1 };
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
      try { window.speechSynthesis.cancel(); } catch (_) {}
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

    if (typeof window.switchScreen === 'function') {
      window.switchScreen('home', true);
    } else if (typeof window.switchMainTab === 'function') {
      window.switchMainTab('home', true);
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

  let isHandlingResultPrimary = false;
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

    // 3) 오답 복습 모드 분기
    if (window.isReviewGameMode) {
      window.isReviewGameMode = false;
      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;
      if (typeof window.switchMainTab === 'function') window.switchMainTab('review', true);
      if (typeof window.showToast === 'function') window.showToast('🎉 오답 복습 완료! 오답노트로 복귀했습니다.', '✨');
      return false;
    }

    const targetNodeId = currentGameLessonId || window.currentSelectedNodeId || 'node-2';
    const curProg = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;
    const currentCourse = window.currentActiveCourse || 'es';

    let nextNodeId = targetNodeId;
    let nextRound = 0;

    if (targetNodeId === 'node-boss' || String(targetNodeId).includes('boss')) {
      // 4과(보스전) 완료 -> 로드맵 복귀 (전체 완료)
      if (!window.nodeProgressMap) window.nodeProgressMap = {};
      window.nodeProgressMap['node-boss'] = 3;
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.showToast === 'function') window.showToast('🏆 축하합니다! 모든 기초 회화 레슨을 완벽 마스터했습니다!', '🎉');
      return false;
    }

    if (targetNodeId === 'node-3' || String(targetNodeId).includes('3')) {
      // 3과 완료 -> 4과 (보스전) 플래시카드 예습 진입
      if (!window.nodeProgressMap) window.nodeProgressMap = {};
      window.nodeProgressMap['node-3'] = 3;
      if (window.nodeProgressMap['node-boss'] === undefined) {
        window.nodeProgressMap['node-boss'] = 0;
      }
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      window.currentSelectedNodeId = 'node-boss';
      currentGameLessonId = 'node-boss';
      nextNodeId = 'node-boss';
      nextRound = (window.nodeProgressMap && window.nodeProgressMap['node-boss']) || 0;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.showToast === 'function') window.showToast('🔥 3과 마스터 완료! 최종 4과(보스전) 단어 예습을 시작합니다!', '👑');
    } else if (curProg >= 3) {
      // 2과 완주(3/3) -> 3과 플래시카드 예습 진입
      if (!window.nodeProgressMap) window.nodeProgressMap = {};
      window.nodeProgressMap['node-2'] = 3;
      if (window.nodeProgressMap['node-3'] === undefined) {
        window.nodeProgressMap['node-3'] = 0;
      }
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      window.currentSelectedNodeId = 'node-3';
      currentGameLessonId = 'node-3';
      nextNodeId = 'node-3';
      nextRound = (window.nodeProgressMap && window.nodeProgressMap['node-3']) || 0;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.showToast === 'function') window.showToast('🎉 2과 마스터 완료! 3과(수하물 찾기와 세관) 단어 예습을 시작합니다!', '🧳');
    } else {
      // 아직 3회 미만 (1/3, 2/3) -> 동일 노드의 다음 서브 라운드 플래시카드 예습 진입
      nextNodeId = targetNodeId;
      nextRound = curProg;
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.showToast === 'function') window.showToast(`🔥 ${curProg}/3 완료! 다음 라운드 단어 예습 시작!`, '⚡');
    }

    // 4) 다음 스테이지 단어 세션 생성 및 플래시카드 화면으로 경유
    const nextSession = (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function')
      ? window.VOCA_DATA.generateStageSession(nextNodeId, currentCourse, nextRound)
      : null;

    console.log(`📚 [Flow] 다음 스테이지(${nextNodeId}) 플래시카드 화면으로 진입 (라운드: ${nextRound})`);

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

    if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen(nextNodeId, nextSession);
    } else if (typeof window.initFlashcardDeck === 'function') {
      window.initFlashcardDeck(nextNodeId, nextSession);
    } else if (typeof window.loadFlashcards === 'function') {
      window.loadFlashcards(nextNodeId, nextSession);
    } else if (typeof window.startStageLearningPipeline === 'function') {
      window.startStageLearningPipeline(nextNodeId, nextSession);
    } else {
      openGameScreen(nextNodeId, nextSession);
    }

    return false;
  }
  window.handleResultPrimary = handleResultPrimary;
  window.proceedNextStage = handleResultPrimary;

  function handleResultSecondary(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🚪 [로드맵으로 나가기] 버튼 클릭 이벤트 처리');
    closeResultModal();
    isExplicitExitRequested = true;
    window.isExplicitExitRequested = true;
    exitGameToRoadmap(true);
    isExplicitExitRequested = false;
    window.isExplicitExitRequested = false;

    if (window.isReviewGameMode) {
      window.isReviewGameMode = false;
      if (typeof window.switchMainTab === 'function') window.switchMainTab('review', true);
    } else {
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
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
    clearAllGameTimers();
    cancelGameLoop();
    dropRafId = null;

    currentHearts = 5;
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
      this.hearts = 5;
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
      try { this.spawnDroppingWord(0); } catch (_) {}
    } else if (typeof window.spawnDroppingWord === 'function' && window.spawnDroppingWord !== spawnQuestion) {
      try { window.spawnDroppingWord(0); } catch (_) {}
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
      isExplicitExitRequested = true;
      window.isExplicitExitRequested = true;
      exitGameToRoadmap(true);
      isExplicitExitRequested = false;
      window.isExplicitExitRequested = false;
      return false;
    };

    const btnGameoverRoadmap = document.getElementById('btn-gameover-roadmap');
    if (btnGameoverRoadmap) {
      btnGameoverRoadmap.onclick = handleGameoverExit;
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
  window.reviveGameHearts = function (amount = 3) {
    clearAllGameTimers();
    currentHearts = amount;
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
