// =================================================
// VocaDash Web Audio API SFX Engine (js/sound.js)
// 외부 음원 파일(mp3) 로딩 렉 없이 100% Web Audio API Oscillator 기반 무지연 합성음 (0KB)
// =================================================

(function () {
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
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }
  window.getAudioContext = getAudioContext;

  // 효과음 활성화 여부 확인 (localStorage: 'vocadash_sound_enabled' 연동)
  function isSoundEnabled() {
    try {
      const direct = localStorage.getItem('vocadash_sound_enabled');
      if (direct !== null) {
        return direct === 'true' || direct === '1';
      }
      if (window.vocadashSettings && window.vocadashSettings.soundEffects !== undefined) {
        return !!window.vocadashSettings.soundEffects;
      }
    } catch (_) {}
    return true; // 기본값: 켜짐
  }
  window.isSoundEnabled = isSoundEnabled;

  function setSoundEnabled(enabled) {
    try {
      localStorage.setItem('vocadash_sound_enabled', enabled ? 'true' : 'false');
      if (window.vocadashSettings) {
        window.vocadashSettings.soundEffects = !!enabled;
      }
    } catch (_) {}
  }
  window.setSoundEnabled = setSoundEnabled;

  // Web Audio API 오실레이터(Oscillator) 기반 무지연 효과음 재생기
  function playSound(type = 'click') {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      // 1. playSound('correct'): 경쾌한 상승 2단음 (도 C5: 523.25Hz -> 솔 G5: 783.99Hz, 정답 징글)
      case 'correct':
      case 'success': {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now); // C5 (도)
        gain1.gain.setValueAtTime(0.24, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.09); // G5 (솔)
        gain2.gain.setValueAtTime(0.28, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.09);
        osc2.stop(now + 0.38);
        break;
      }

      // 2. playSound('wrong'): 짧고 둔탁한 하강 톱니파음 (180Hz -> 70Hz, 오답/장애물 충돌음)
      case 'wrong':
      case 'error':
      case 'buzzer': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      // 3. playSound('gem'): 맑고 청명한 고주파 벨소리 (보석 획득 및 하트 회복 찰랑음)
      case 'gem':
      case 'bonus':
      case 'heal':
      case 'reward': {
        const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.055;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.32);
        });
        break;
      }

      // 4. playSound('click'): 가벼운 틱(Tick) UI 탭 버튼음 (초단파 피치 스윕)
      case 'click':
      case 'tap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }

      // 5. playSound('clear'): 스테이지 클리어 팡파레
      case 'clear':
      case 'victory': {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.08;

          osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.45);
        });
        break;
      }

      default: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
    }
  }
  window.playSound = playSound;

  // 모바일 오디오 정책 잠금 해제 (iOS Safari/Android Chrome First Interaction Unlock)
  let isUnlocked = false;
  function unlockAudio() {
    if (isUnlocked) return;
    isUnlocked = true;

    // 1) Web Audio API Context unlock
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (_) {}

    // 2) SpeechSynthesis unlock
    try {
      if ('speechSynthesis' in window) {
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0;
        dummy.rate = 2.0;
        window.speechSynthesis.speak(dummy);
      }
    } catch (_) {}

    ['touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
      document.removeEventListener(evt, unlockAudio, true);
    });
  }
  window.unlockAudioPolicy = unlockAudio;

  ['touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  });

  // =================================================
  // [고품질 듀얼 사운드 재생 엔진 (Dual TTS Player)]
  // 1순위: Google Translate 고음질 원어민 CDN 오디오 스트림 재생
  // 2순위: 네트워크 차단/에러 시 Web Speech API 고음질 보이스 선별 폴백
  // =================================================
  let currentPlayingAudio = null;
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
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadSynthesisVoices;
    }
  }

  function getBestNaturalVoice(targetLang = 'es') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (cachedSynthesisVoices.length === 0) loadSynthesisVoices();

    const isEn = (targetLang === 'en' || targetLang === 'en-US');
    const langPrefix = isEn ? 'en' : 'es';

    // 1) 사용자 지정 고음질 자연어 보이스 우선순위 키워드
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

    // 2) 언어 접두사 매칭 중 natural / google 포함 보이스 또는 첫 번째 매칭
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

  function stopAllTTS() {
    if (currentPlayingAudio || window.currentPlayingAudio) {
      try {
        const a = currentPlayingAudio || window.currentPlayingAudio;
        a.pause();
        a.currentTime = 0;
      } catch (_) { }
      currentPlayingAudio = null;
      window.currentPlayingAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) { }
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.tts-speaking').forEach(el => {
        resetUiSpeakerActive(el);
      });
    }
  }

  function speakWithWebSpeechFallback(cleanWord, targetLangCode, buttonEl) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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

  // =================================================
  // 스페인어 원어민 TTS 엔진 (es-ES 강제 지정, pitch: 1.0, rate: 0.95)
  // =================================================
  function playSpanishTTS(text, arg2 = null, arg3 = null) {
    stopAllTTS();

    let buttonEl = null;
    if (arg2 && typeof arg2 === 'object' && (arg2.nodeType || arg2.tagName || arg2.classList)) {
      buttonEl = arg2;
    } else if (arg3 && typeof arg3 === 'object' && (arg3.nodeType || arg3.tagName || arg3.classList)) {
      buttonEl = arg3;
    }

    const cleanWord = sanitizeTTSText(text);
    if (!cleanWord) return;

    if (buttonEl) {
      setUiSpeakerActive(buttonEl);
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (typeof playDualTTS === 'function') {
        playDualTTS(cleanWord, 'es', buttonEl);
      } else if (buttonEl) {
        resetUiSpeakerActive(buttonEl);
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = 'es-ES'; // 스페인 본토 발음 강제 지정
      utterance.pitch = 1.0;
      utterance.rate = 0.95; // 자연스럽고 명확한 전달 속도 설정

      const bestVoice = getBestNaturalVoice('es');
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => {
        if (buttonEl) resetUiSpeakerActive(buttonEl);
      };
      utterance.onerror = () => {
        if (buttonEl) resetUiSpeakerActive(buttonEl);
        if (typeof playDualTTS === 'function') {
          playDualTTS(cleanWord, 'es', buttonEl);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (buttonEl) resetUiSpeakerActive(buttonEl);
      if (typeof playDualTTS === 'function') {
        playDualTTS(cleanWord, 'es', buttonEl);
      }
    }
  }

  function playDualTTS(text, lang = 'es', buttonEl = null) {
    stopAllTTS();

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
      if (typeof Audio === 'undefined') {
        triggerFallback();
        return;
      }
      const audio = new Audio();
      currentPlayingAudio = audio;
      window.currentPlayingAudio = audio;
      audio.playbackRate = 0.98;
      audio.src = cdnUrl;

      audio.onended = () => {
        if (currentPlayingAudio === audio) currentPlayingAudio = null;
        if (window.currentPlayingAudio === audio) window.currentPlayingAudio = null;
        if (buttonEl) resetUiSpeakerActive(buttonEl);
      };

      audio.onerror = () => {
        if (currentPlayingAudio === audio) currentPlayingAudio = null;
        if (window.currentPlayingAudio === audio) window.currentPlayingAudio = null;
        triggerFallback();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (currentPlayingAudio === audio) currentPlayingAudio = null;
          if (window.currentPlayingAudio === audio) window.currentPlayingAudio = null;
          triggerFallback();
        });
      }
    } catch (err) {
      triggerFallback();
    }
  }

  function safePlayTTS(text, lang = 'es', buttonEl = null) {
    if (lang && typeof lang === 'object' && (lang.nodeType || lang.tagName || lang.classList)) {
      buttonEl = lang;
      lang = 'es';
    }
    const cleanLang = (typeof lang === 'string') ? lang.toLowerCase() : 'es';
    const isEs = !cleanLang || cleanLang === 'es' || cleanLang === 'es-es';
    if (isEs) {
      return playSpanishTTS(text, buttonEl);
    }
    return playDualTTS(text, cleanLang, buttonEl);
  }

  // Global Exports (단일 진실 공급원: 전역 바인딩 보장)
  window.speakWord = safePlayTTS;
  window.playTTS = safePlayTTS;
  window.safePlayTTS = safePlayTTS;
  window.playSpanishTTS = playSpanishTTS;
  window.playDualTTS = playDualTTS;
  window.stopAllTTS = stopAllTTS;
  window.stopTTS = stopAllTTS;
  window.stopSpeechSynthesis = stopAllTTS;
  window.playSound = playSound;
  window.getAudioContext = getAudioContext;
  window.isSoundEnabled = isSoundEnabled;
  window.setSoundEnabled = setSoundEnabled;
})();
