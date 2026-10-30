// =================================================
// VocaDash Web Audio & High-Quality TTS Engine (js/sound.js)
// 100% Web Audio API 무지연 합성음 + 고품질 네이티브 자연어 TTS
// =================================================

(function () {
  'use strict';

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        window._vocaAudioCtx = audioCtx;
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
    return audioCtx;
  }

  function isSoundEnabled() {
    try {
      const direct = localStorage.getItem('vocadash_sound_enabled');
      if (direct !== null) return direct === 'true' || direct === '1';
      if (window.vocadashSettings?.soundEffects !== undefined) {
        return !!window.vocadashSettings.soundEffects;
      }
    } catch (_) { }
    return true;
  }

  function setSoundEnabled(enabled) {
    try {
      localStorage.setItem('vocadash_sound_enabled', enabled ? 'true' : 'false');
      if (window.vocadashSettings) window.vocadashSettings.soundEffects = !!enabled;
    } catch (_) { }
  }

  // Web Audio API 오실레이터 기반 무지연 효과음 재생기
  function playSound(type = 'click') {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (type) {
      case 'correct':
      case 'success': {
        const osc1 = ctx.createOscillator(), gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.24, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1); gain1.connect(ctx.destination);
        osc1.start(now); osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator(), gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.09);
        gain2.gain.setValueAtTime(0.28, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.start(now + 0.09); osc2.stop(now + 0.38);
        break;
      }

      case 'wrong':
      case 'error':
      case 'buzzer': {
        const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.22);
        break;
      }

      case 'gem':
      case 'bonus':
      case 'heal':
      case 'reward': {
        [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
          const osc = ctx.createOscillator(), gain = ctx.createGain();
          const t = now + idx * 0.055;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t); osc.stop(t + 0.32);
        });
        break;
      }

      case 'click':
      case 'tap': {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.035);
        break;
      }

      case 'clear':
      case 'victory': {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx, arr) => {
          const osc = ctx.createOscillator(), gain = ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = idx === arr.length - 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t); osc.stop(t + 0.45);
        });
        break;
      }

      default: {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.05);
        break;
      }
    }
  }

  // 모바일 오디오 정책 잠금 해제
  let isUnlocked = false;
  function unlockAudio() {
    if (isUnlocked) return;
    isUnlocked = true;

    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => { });
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (_) { }

    try {
      if ('speechSynthesis' in window) {
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0;
        dummy.rate = 2.0;
        window.speechSynthesis.speak(dummy);
      }
    } catch (_) { }

    ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
      document.removeEventListener(evt, unlockAudio, true);
    });
  }

  ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  });

  // =================================================
  // [고품질 네이티브 TTS 엔진 (High-Definition Natural TTS)]
  // =================================================
  let cachedSynthesisVoices = [];

  function loadSynthesisVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        cachedSynthesisVoices = window.speechSynthesis.getVoices() || [];
      } catch (_) { }
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadSynthesisVoices();
    window.speechSynthesis.onvoiceschanged = loadSynthesisVoices;
  }

  // 고품질 내추럴 원어민 보이스 탐색기
  function getBestNaturalVoice(targetLang = 'es') {
    if (cachedSynthesisVoices.length === 0) loadSynthesisVoices();
    const isEn = String(targetLang).toLowerCase().startsWith('en');
    const langPrefix = isEn ? 'en' : 'es';

    // 최우선 순위 고품질 보이스 키워드 (iOS/macOS Enhanced & Google Natural)
    const priorityKeywords = isEn
      ? ['natural', 'samantha (enhanced)', 'google us english', 'samantha', 'alex', 'karen', 'victoria']
      : ['google español', 'monica (enhanced)', 'natural', 'jorge (enhanced)', 'monica', 'jorge', 'paulina', 'elvira', 'diego'];

    const langMatches = cachedSynthesisVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if (!langMatches.length) return null;

    for (const kw of priorityKeywords) {
      const found = langMatches.find(v => v.name && v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
    return langMatches.find(v => v.localService) || langMatches[0];
  }

  function sanitizeTTSText(text) {
    return String(text || '').replace(/[¡!¿?"'\[\]()“”‘’]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function setUiSpeakerActive(el) {
    if (!el?.classList) return;
    el.classList.add('tts-speaking', 'text-emerald-500', 'animate-pulse');
    el.classList.remove('text-slate-400', 'text-slate-500', 'text-on-surface-variant');
  }

  function resetUiSpeakerActive(el) {
    if (!el?.classList) return;
    el.classList.remove('tts-speaking', 'text-emerald-500', 'animate-pulse');
  }

  function stopAllTTS() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) { }
    }
    document.querySelectorAll('.tts-speaking').forEach(resetUiSpeakerActive);
  }

  // 단일화된 초고속 고음질 TTS 발음 함수
  function playTTS(text, lang = 'es', buttonEl = null) {
    stopAllTTS();

    if (lang && typeof lang === 'object' && (lang.nodeType || lang.classList)) {
      buttonEl = lang;
      lang = 'es';
    }

    const cleanWord = sanitizeTTSText(text);
    if (!cleanWord || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (buttonEl) setUiSpeakerActive(buttonEl);

    try {
      const isEn = String(lang).toLowerCase().startsWith('en');
      const utterance = new SpeechSynthesisUtterance(cleanWord);

      utterance.lang = isEn ? 'en-US' : 'es-ES'; // 스페인 본토 / 미국 표준
      utterance.rate = isEn ? 0.90 : 0.92;       // 원어민 발음 최적 청취 템포
      utterance.pitch = 1.0;

      const voice = getBestNaturalVoice(utterance.lang);
      if (voice) utterance.voice = voice;

      const clearState = () => { if (buttonEl) resetUiSpeakerActive(buttonEl); };
      utterance.onend = clearState;
      utterance.onerror = clearState;

      window.speechSynthesis.speak(utterance);
    } catch (_) {
      if (buttonEl) resetUiSpeakerActive(buttonEl);
    }
  }

  // Global Exports (단일 진실 공급원 전역 바인딩)
  window.getAudioContext = getAudioContext;
  window.isSoundEnabled = isSoundEnabled;
  window.setSoundEnabled = setSoundEnabled;
  window.playSound = playSound;
  window.unlockAudioPolicy = unlockAudio;

  window.speakWord = playTTS;
  window.playTTS = playTTS;
  window.safePlayTTS = playTTS;
  window.playSpanishTTS = (text, b) => playTTS(text, 'es', b);
  window.playDualTTS = playTTS;
  window.stopAllTTS = stopAllTTS;
  window.stopTTS = stopAllTTS;
  window.stopSpeechSynthesis = stopAllTTS;
})();
