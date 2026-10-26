// ==============================================================================
// VocaDash Combined App Logic (Sound + Settings + Flashcard + Core App)
// ==============================================================================

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
      audioCtx.resume().catch(() => { });
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
    } catch (_) { }
    return true; // 기본값: 켜짐
  }
  window.isSoundEnabled = isSoundEnabled;

  function setSoundEnabled(enabled) {
    try {
      localStorage.setItem('vocadash_sound_enabled', enabled ? 'true' : 'false');
      if (window.vocadashSettings) {
        window.vocadashSettings.soundEffects = !!enabled;
      }
    } catch (_) { }
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
        if (ctx.state === 'suspended') ctx.resume().catch(() => { });
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (_) { }

    // 2) SpeechSynthesis unlock
    try {
      if ('speechSynthesis' in window) {
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0;
        dummy.rate = 2.0;
        window.speechSynthesis.speak(dummy);
      }
    } catch (_) { }

    ['touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
      document.removeEventListener(evt, unlockAudio, true);
    });
  }
  window.unlockAudioPolicy = unlockAudio;

  ['touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  });

  // 메뉴/탭 클릭 비프음 제거 완료 (게임 내 정답/오답/보석 사운드만 재생)
})();


// =================================================
// VocaDash Settings Module (js/settings.js)
// 설정 상태 관리, localStorage 연동, 실시간 토글 및 사운드/발음/햅틱 제어
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
  } catch (_) { }

  const DEFAULT_SETTINGS = {
    showPhonetic: true,    // 한글 발음 표기 ([발음] 힌트)
    autoPlayAudio: true,   // 원어민 발음 자동 재생
    soundEffects: true,    // 효과음 및 배경음악
    hapticFeedback: true,  // 햅틱 진동 피드백
    dailyReminder: true,   // 매일 학습 리마인더
    reminderTime: "20:00"  // 알림 시간 설정
  };

  const STORAGE_KEY = 'vocadash_settings';

  function loadSettings() {
    let settings = { ...DEFAULT_SETTINGS };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
      const soundDirect = localStorage.getItem('vocadash_sound_enabled');
      if (soundDirect !== null) {
        settings.soundEffects = (soundDirect === 'true' || soundDirect === '1');
      }
      return settings;
    } catch (e) {
      console.warn('설정 로드 실패, 기본값 사용:', e);
    }
    return settings;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('설정 저장 실패:', e);
    }
  }

  const currentSettings = loadSettings();
  window.vocadashSettings = currentSettings;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;

  // 햅틱 진동 피드백
  function triggerHaptic(pattern = 40) {
    if (!window.vocadashSettings || window.vocadashSettings.hapticFeedback === false) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (_) { }
    }
  }
  window.triggerHaptic = triggerHaptic;

  // 한국어 시간 표기 포맷팅 (예: 20:00 -> "매일 오후 08:00")
  function formatKoreanTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return '매일 오후 08:00';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    if (isNaN(hour)) return '매일 오후 08:00';
    const ampm = hour < 12 ? '오전' : '오후';
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    const padHour = String(hour12).padStart(2, '0');
    const padMin = String(minute).padStart(2, '0');
    return `매일 ${ampm} ${padHour}:${padMin}`;
  }
  window.formatKoreanTime = formatKoreanTime;

  // 설정값 적용
  function applySetting(key, val, isInitial = false) {
    if (key === 'showPhonetic') {
      if (document.body) {
        document.body.classList.toggle('hide-phonetics', !val);
      }
      if (document.documentElement) {
        document.documentElement.classList.toggle('hide-phonetics', !val);
      }
      const phoneticElements = document.querySelectorAll(
        '#flashcard-phonetic, #flashcard-behind-phonetic, #game-dropping-phonetic, .review-word-phonetic, .phonetic-hint, .book-phonetic, #result-missed-phonetic, #gameover-missed-phonetic'
      );
      phoneticElements.forEach((el) => {
        if (val) {
          el.classList.remove('hidden');
          el.style.display = '';
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });
      document.querySelectorAll('.book-phonetic-dot').forEach((el) => {
        el.style.display = val ? '' : 'none';
      });
    } else if (key === 'autoPlayAudio') {
      // no toast
    } else if (key === 'soundEffects') {
      try {
        localStorage.setItem('vocadash_sound_enabled', val ? 'true' : 'false');
      } catch (_) { }
      if (!isInitial) {
        if (val && typeof window.playSound === 'function') {
          try { window.playSound('correct'); } catch (_) { }
        } else if (val && typeof window.playSuccessChime === 'function') {
          try { window.playSuccessChime(); } catch (_) { }
        }
      }
    } else if (key === 'hapticFeedback') {
      if (!isInitial) {
        if (val) triggerHaptic(40);
      }
    } else if (key === 'dailyReminder') {
      // no toast
    } else if (key === 'reminderTime') {
      const timeText = document.getElementById('settings-reminder-time-text');
      if (timeText) {
        timeText.textContent = formatKoreanTime(val);
      }
      const timeInput = document.getElementById('settings-reminder-time-input');
      if (timeInput) {
        timeInput.value = val;
      }
    }
  }
  window.applySetting = applySetting;

  // 스위치 UI 업데이트
  function updateToggleUI(button, isChecked) {
    if (!button) return;
    const thumb = button.querySelector('span');
    button.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    if (isChecked) {
      button.classList.add('bg-primary-container');
      button.classList.remove('bg-surface-variant', 'bg-slate-300');
      if (thumb) {
        thumb.classList.add('translate-x-[22px]');
        thumb.classList.remove('translate-x-0');
      }
    } else {
      button.classList.remove('bg-primary-container');
      button.classList.add('bg-surface-variant');
      if (thumb) {
        thumb.classList.remove('translate-x-[22px]');
        thumb.classList.add('translate-x-0');
      }
    }
  }

  // 설정 화면 UI 전체 동기화
  function syncSettingsUI() {
    const s = window.vocadashSettings;
    const toggles = [
      { key: 'showPhonetic', id: 'toggle-show-phonetic' },
      { key: 'autoPlayAudio', id: 'toggle-auto-play-audio' },
      { key: 'soundEffects', id: 'toggle-sound-effects' },
      { key: 'hapticFeedback', id: 'toggle-haptic-feedback' },
      { key: 'dailyReminder', id: 'toggle-daily-reminder' }
    ];

    toggles.forEach(({ key, id }) => {
      const btn = document.getElementById(id) || document.querySelector(`[data-setting-key="${key}"]`);
      if (btn) {
        updateToggleUI(btn, !!s[key]);
      }
    });

    // 알림 시간 텍스트 동기화
    const timeText = document.getElementById('settings-reminder-time-text');
    if (timeText) {
      timeText.textContent = formatKoreanTime(s.reminderTime);
    }
    const timeInput = document.getElementById('settings-reminder-time-input');
    if (timeInput) {
      timeInput.value = s.reminderTime || '20:00';
    }

    // 상단 프로필 배너 및 명예의 전당 아바타 & 닉네임 동기화
    const statsAvatarImg = document.getElementById('stats-avatar-img');
    const settingsAvatarImg = document.getElementById('settings-streak-avatar-img') || document.querySelector('#settings-streak-banner img');
    const hallUserAvatar = document.getElementById('hall-user-avatar');
    const hallHeaderAvatar = document.getElementById('hall-header-avatar');
    try {
      const profileVal = localStorage.getItem('vocadash_profile') || 'profile-spanish.webp';
      if (typeof window.applyProfileAvatar === 'function') {
        window.applyProfileAvatar(profileVal);
      } else {
        const file = (profileVal.split('/').pop().split('?')[0]) || 'profile-spanish.webp';
        const src = `assets/profiles/${file}?v=45`;
        if (settingsAvatarImg) settingsAvatarImg.src = src;
        if (statsAvatarImg) statsAvatarImg.src = src;
        if (hallUserAvatar) hallUserAvatar.src = src;
        if (hallHeaderAvatar) hallHeaderAvatar.src = src;
      }
    } catch (_) { }
    const statsNick = document.getElementById('stats-nickname');
    const settingsNick = document.getElementById('settings-streak-nickname') || document.querySelector('#settings-streak-banner .font-headline-sm');
    if (statsNick && settingsNick && statsNick.textContent) {
      settingsNick.textContent = statsNick.textContent;
    }

    // 학습 언어 설정 표시 동기화
    const curLang = (window.currentLanguage || window.currentActiveCourse || localStorage.getItem('vocadash_language') || 'es') === 'en' ? 'en' : 'es';
    const sFlag = document.getElementById('settings-current-lang-flag');
    if (sFlag) sFlag.textContent = (curLang === 'en') ? '🇺🇸' : '🇪🇸';
    const sDesc = document.getElementById('settings-current-lang-desc');
    if (sDesc) sDesc.textContent = (curLang === 'en') ? '영어 (필수 회화 & 어휘)' : '스페인어 (일상 실전 패턴)';

    // 전체 발음 힌트 표시 상태 재적용
    applySetting('showPhonetic', !!s.showPhonetic, true);

    // 하단 인증 버튼 (로그인/로그아웃) 동기화
    if (typeof window.syncAuthButtonUI === 'function') {
      window.syncAuthButtonUI();
    }
  }
  window.syncSettingsUI = syncSettingsUI;

  function syncBookScreenSettings() {
    let isPhonetic = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.showPhonetic !== undefined) {
          isPhonetic = !!parsed.showPhonetic;
        }
      } else if (window.vocadashSettings && window.vocadashSettings.showPhonetic !== undefined) {
        isPhonetic = !!window.vocadashSettings.showPhonetic;
      }
    } catch (_) { }

    const bookScreen = document.getElementById('book-screen');
    if (bookScreen) {
      bookScreen.querySelectorAll('.book-phonetic, .phonetic-hint').forEach((el) => {
        if (isPhonetic) {
          el.classList.remove('hidden');
          el.style.display = '';
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });
      bookScreen.querySelectorAll('.book-phonetic-dot').forEach((el) => {
        el.style.display = isPhonetic ? '' : 'none';
      });
    }
  }
  window.syncBookScreenSettings = syncBookScreenSettings;

  // 스위치 클릭 토글 함수
  window.toggleSwitch = function (button) {
    if (!button) return;
    const key = button.dataset.settingKey;
    if (!key) return;

    const currentVal = !!window.vocadashSettings[key];
    const nextVal = !currentVal;

    window.vocadashSettings[key] = nextVal;
    saveSettings(window.vocadashSettings);

    updateToggleUI(button, nextVal);
    applySetting(key, nextVal, false);
  };

  // ===================================================
  // 커스텀 알림 시간 설정 모달 컨트롤러
  // ===================================================
  let currentModalAmPm = 'pm'; // 'am' | 'pm'
  let currentModalHour = 8;    // 1 ~ 12
  let currentModalMinute = '00'; // '00' | '15' | '30' | '45'

  function getModal24HourTime() {
    let h = parseInt(currentModalHour, 10);
    if (isNaN(h)) h = 8;
    if (currentModalAmPm === 'am') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    const padH = String(h).padStart(2, '0');
    const padM = String(currentModalMinute).padStart(2, '0');
    return `${padH}:${padM}`;
  }

  function setModalStateFrom24Time(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') timeStr = '20:00';
    const parts = timeStr.split(':');
    let h24 = parseInt(parts[0], 10);
    if (isNaN(h24)) h24 = 20;
    let m = parts[1] || '00';
    if (!['00', '15', '30', '45'].includes(m)) {
      const mNum = parseInt(m, 10) || 0;
      if (mNum < 8) m = '00';
      else if (mNum < 23) m = '15';
      else if (mNum < 38) m = '30';
      else m = '45';
    }

    currentModalMinute = m;
    if (h24 < 12) {
      currentModalAmPm = 'am';
      currentModalHour = h24 === 0 ? 12 : h24;
    } else {
      currentModalAmPm = 'pm';
      currentModalHour = h24 === 12 ? 12 : h24 - 12;
    }
  }

  function updateReminderModalUI() {
    const amBtn = document.getElementById('reminder-ampm-am');
    const pmBtn = document.getElementById('reminder-ampm-pm');
    if (amBtn && pmBtn) {
      const isAm = currentModalAmPm === 'am';
      if (isAm) {
        amBtn.className = 'px-2.5 py-2 text-xs font-bold rounded-lg bg-white text-emerald-700 shadow-sm transition-all cursor-pointer';
        pmBtn.className = 'px-2.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer';
      } else {
        pmBtn.className = 'px-2.5 py-2 text-xs font-bold rounded-lg bg-white text-emerald-700 shadow-sm transition-all cursor-pointer';
        amBtn.className = 'px-2.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer';
      }
    }

    const hourSelect = document.getElementById('reminder-hour-select');
    if (hourSelect) {
      hourSelect.value = String(currentModalHour);
    }

    const minuteSelect = document.getElementById('reminder-minute-select');
    if (minuteSelect) {
      minuteSelect.value = String(currentModalMinute);
    }

    const time24 = getModal24HourTime();
    const previewEl = document.getElementById('reminder-selected-preview');
    if (previewEl) {
      previewEl.textContent = formatKoreanTime(time24);
    }

    // 퀵 프리셋 칩 하이라이트 동기화
    document.querySelectorAll('.reminder-preset-chip').forEach((chip) => {
      const chipTime = chip.dataset.time;
      const isMatch = chipTime === time24;
      if (isMatch) {
        chip.classList.add('border-emerald-500', 'bg-emerald-50/90', 'ring-2', 'ring-emerald-500/20');
        chip.classList.remove('border-slate-200', 'bg-slate-50/70');
        const titleEl = chip.querySelector('.text-xs');
        if (titleEl) {
          titleEl.classList.add('text-emerald-800');
          titleEl.classList.remove('text-slate-700');
        }
        const timeEl = chip.querySelector('.text-\\[11px\\]');
        if (timeEl) {
          timeEl.classList.add('text-emerald-700');
          timeEl.classList.remove('text-slate-500');
        }
      } else {
        chip.classList.remove('border-emerald-500', 'bg-emerald-50/90', 'ring-2', 'ring-emerald-500/20');
        chip.classList.add('border-slate-200', 'bg-slate-50/70');
        const titleEl = chip.querySelector('.text-xs');
        if (titleEl) {
          titleEl.classList.remove('text-emerald-800');
          titleEl.classList.add('text-slate-700');
        }
        const timeEl = chip.querySelector('.text-\\[11px\\]');
        if (timeEl) {
          timeEl.classList.remove('text-emerald-700');
          timeEl.classList.add('text-slate-500');
        }
      }
    });
  }

  function openReminderModal() {
    const backdrop = document.getElementById('reminder-time-modal');
    const card = document.getElementById('reminder-modal-card');
    if (!backdrop || !card) return;

    const currentSavedTime = (window.vocadashSettings && window.vocadashSettings.reminderTime) || '20:00';
    setModalStateFrom24Time(currentSavedTime);
    updateReminderModalUI();

    if (typeof window.toggleModal === 'function') {
      window.toggleModal(backdrop, card, true);
    } else {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
      card.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
      card.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
    }
  }
  window.openReminderModal = openReminderModal;

  function closeReminderModal() {
    const backdrop = document.getElementById('reminder-time-modal');
    const card = document.getElementById('reminder-modal-card');
    if (!backdrop || !card) return;

    if (typeof window.toggleModal === 'function') {
      window.toggleModal(backdrop, card, false);
    } else {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
      card.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
      card.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
    }
  }
  window.closeReminderModal = closeReminderModal;

  function applySelectedReminderTime() {
    const finalTime = getModal24HourTime();
    window.vocadashSettings.reminderTime = finalTime;
    if (!window.vocadashSettings.dailyReminder) {
      window.vocadashSettings.dailyReminder = true;
      const reminderToggle = document.getElementById('toggle-daily-reminder');
      if (reminderToggle) updateToggleUI(reminderToggle, true);
    }
    saveSettings(window.vocadashSettings);
    applySetting('reminderTime', finalTime, false);

    closeReminderModal();
    triggerHaptic(40);
  }

  // 초기 로드 시 및 DOMContentLoaded 시 바인딩
  function initSettings() {
    // 1) 초기 발음 표기 상태 즉시 적용
    applySetting('showPhonetic', !!window.vocadashSettings.showPhonetic, true);

    // 2) 토글 버튼 이벤트 바인딩
    document.querySelectorAll('.settings-toggle-btn').forEach((btn) => {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.toggleSwitch(this);
      };
    });

    // 3) 커스텀 알림 시간 설정 모달 이벤트 바인딩
    const reminderRow = document.getElementById('settings-reminder-time-row');
    if (reminderRow) {
      reminderRow.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openReminderModal();
      };
    }

    const closeReminderBtn = document.getElementById('close-reminder-modal-btn');
    if (closeReminderBtn) {
      closeReminderBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeReminderModal();
      };
    }

    const reminderBackdrop = document.getElementById('reminder-time-modal');
    if (reminderBackdrop) {
      reminderBackdrop.onclick = function (e) {
        if (e.target === reminderBackdrop) {
          closeReminderModal();
        }
      };
    }

    document.querySelectorAll('.reminder-preset-chip').forEach((chip) => {
      chip.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const timeVal = this.dataset.time;
        if (timeVal) {
          setModalStateFrom24Time(timeVal);
          updateReminderModalUI();
          triggerHaptic(20);
        }
      };
    });

    const amBtn = document.getElementById('reminder-ampm-am');
    if (amBtn) {
      amBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        currentModalAmPm = 'am';
        updateReminderModalUI();
        triggerHaptic(20);
      };
    }

    const pmBtn = document.getElementById('reminder-ampm-pm');
    if (pmBtn) {
      pmBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        currentModalAmPm = 'pm';
        updateReminderModalUI();
        triggerHaptic(20);
      };
    }

    const hourSelect = document.getElementById('reminder-hour-select');
    if (hourSelect) {
      hourSelect.onchange = function () {
        currentModalHour = parseInt(this.value, 10) || 8;
        updateReminderModalUI();
      };
    }

    const minuteSelect = document.getElementById('reminder-minute-select');
    if (minuteSelect) {
      minuteSelect.onchange = function () {
        currentModalMinute = this.value || '00';
        updateReminderModalUI();
      };
    }

    const applyReminderBtn = document.getElementById('apply-reminder-time-btn');
    if (applyReminderBtn) {
      applyReminderBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        applySelectedReminderTime();
      };
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const backdrop = document.getElementById('reminder-time-modal');
        if (backdrop && !backdrop.classList.contains('pointer-events-none')) {
          closeReminderModal();
        }
      }
    });

    // 4) 초기 UI 동기화
    syncSettingsUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
})();


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
  } catch (_) { }

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

  function stopTTS() {
    if (currentPlayingAudio) {
      try {
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      } catch (_) { }
      currentPlayingAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
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
    window.currentGameLessonId = currentFlashcardLessonId;
    window.currentSelectedNodeId = currentFlashcardLessonId;

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

    // 회차별 단어 수 보장: 1회차 기본 10개 단어만 1:1 주입 (더미/패딩 제거), 2회차 13개, 3회차 15개
    activeDeck = deck.map((item, idx) => ({
      ...item,
      word: item.word || item.term || '',
      term: item.term || item.word || '',
      meaning: item.meaning || item.korean || '',
      phonetic: item.phonetic || (item.pronunciation ? `[${item.pronunciation}]` : ''),
      exampleTarget: item.exampleTarget || item.example || '',
      exampleMeaning: item.exampleMeaning || item.exampleKo || item.example_ko || '',
      isSentence: Boolean(item.type === 'sentence' || item.isSentence || (item.word && item.word.includes(' ') && item.word.length > 20)),
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
    window.currentGameLessonId = currentFlashcardLessonId || 'node-1';


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
    window.currentGameLessonId = currentFlashcardLessonId;
    window.currentSelectedNodeId = currentFlashcardLessonId;
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
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (_) { }
    currentPlayingAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) { }
  }
  document.querySelectorAll('.tts-speaking').forEach(el => {
    resetUiSpeakerActive(el);
  });
}
window.stopTTS = stopAllTTS;

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

// =================================================
// 스페인어 원어민 TTS 엔진 (es-ES 강제 지정, pitch: 1.0, rate: 0.95)
// =================================================
function playSpanishTTS(text, buttonEl = null) {
  stopAllTTS();

  const cleanWord = sanitizeTTSText(text);
  if (!cleanWord) return;

  if (buttonEl) {
    setUiSpeakerActive(buttonEl);
  }

  if (!('speechSynthesis' in window)) {
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
window.playSpanishTTS = playSpanishTTS;

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

function safePlayTTS(text, lang = 'es', buttonEl = null) {
  const isEs = !lang || lang === 'es' || lang === 'es-ES';
  if (isEs) {
    return playSpanishTTS(text, buttonEl);
  }
  return playDualTTS(text, lang, buttonEl);
}

window.speakWord = safePlayTTS;
window.playTTS = safePlayTTS;
window.safePlayTTS = safePlayTTS;
window.playDualTTS = playDualTTS;

document.addEventListener('DOMContentLoaded', () => {
  // ===================================================
  // URL ?clean 파라미터 완전 초기화 감지 (localStorage & sessionStorage 완전 리셋)
  // ===================================================
  (function handleCleanParam() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('clean')) {
          console.log('🧹 [URL Clean] ?clean 파라미터 감지: localStorage 및 sessionStorage 완전 초기화 실행');
          if (typeof localStorage !== 'undefined' && localStorage.clear) {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined' && sessionStorage.clear) {
            sessionStorage.clear();
          }

          const DEFAULT_STATE = {
            currentCourse: 'pack_football',
            currentUnit: 0,
            currentNode: 0,
            stars: {},
            clearedNodes: {},
            unlockedNodes: ['fb_1_n1', 'node-1'],
            weakWords: [],
            gems: 0,
            hearts: 5
          };
          try {
            localStorage.setItem('vocadash_user_data', JSON.stringify(DEFAULT_STATE));
            localStorage.setItem('vocadash_active_course', 'pack_football');
            localStorage.setItem('vocadash_current_course', 'pack_football');
            localStorage.setItem('vocadash_language', 'es');
            localStorage.setItem('vocadash_hearts', '5');
            localStorage.setItem('vocadash_gems', '0');
          } catch (_) { }

          window.activeCourseId = 'pack_football';
          window.currentCourseId = 'pack_football';
          window.currentActiveCourse = 'es';
          window.currentLanguage = 'es';
          window.nodeProgressMap = {
            'fb_1_n1': 0,
            'node-1': 0,
            'node-2': 0,
            'node-3': 0,
            'node-boss': 0
          };

          urlParams.delete('clean');
          const remainingSearch = urlParams.toString();
          const cleanUrl = window.location.pathname + (remainingSearch ? '?' + remainingSearch : '') + window.location.hash;
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, cleanUrl);
          }
          console.log('✨ [URL Clean] 초기화 완료 및 URL clean 파라미터 제거됨:', cleanUrl);
        }
      }
    } catch (e) {
      console.warn('⚠️ [URL Clean] 파라미터 처리 예외 방어:', e);
    }
  })();

  // ===================================================
  // 0. BRAND SPLASH INTRO CONTROLLER (1.2s auto + tap to skip)
  // ===================================================
  const splashScreen = document.getElementById('splash-screen');
  const splashProgressBar = document.getElementById('splash-progress-bar');
  const splashMascot = document.getElementById('splash-mascot-img');
  let splashDismissed = false;

  function dismissSplash() {
    splashDismissed = true;
    if (!splashScreen) return;
    splashScreen.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      splashScreen.classList.add('hidden');
      splashScreen.style.display = 'none';
    }, 400);
  }
  window.dismissSplash = dismissSplash;

  if (splashScreen) {
    if (splashMascot) {
      let savedLang = 'es';
      try { savedLang = localStorage.getItem('vocadash_language') || 'es'; } catch (_) { }
      splashMascot.src = `assets/characters/${savedLang}-idle.webp?v=68`;
    }
    if (splashProgressBar) {
      setTimeout(() => {
        splashProgressBar.style.width = '100%';
      }, 50);
    }
    splashScreen.addEventListener('click', dismissSplash);
    splashScreen.addEventListener('touchstart', dismissSplash, { passive: true });

    // 리소스 로드 후 약 1.2초 동안 머문 뒤 부드럽게 페이드아웃
    if (document.readyState === 'complete') {
      setTimeout(dismissSplash, 1200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(dismissSplash, 1200);
      });
    }
    // 안전 타임아웃
    setTimeout(dismissSplash, 3000);
  }

  // 보안 유틸: HTML 특수문자 이스케이프 (XSS 취약점 원천 차단)
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.escapeHTML = escapeHTML;

  // 1. 활성 코스 상태값 (activeCourseId) 관리
  let activeCourseId = 'main';
  try {
    activeCourseId = localStorage.getItem('vocadash_active_course') || 'main';
  } catch (_) {
    activeCourseId = 'main';
  }
  window.activeCourseId = activeCourseId;

  // ===================================================
  // 코스 데이터 레지스트리 (COURSES) 및 getCurrentCourseData() 일원화
  // ===================================================
  const COURSES = {
    get 'es_main'() { return window.courseData_es || window.courseData; },
    get 'pack_football'() { return window.packFootballData; },
    get 'en_main'() { return window.courseData_en; },
    get 'main'() {
      const curLang = (typeof window !== 'undefined' && (window.currentLanguage || window.currentActiveCourse)) || 'es';
      return (curLang === 'en' && window.courseData_en) ? window.courseData_en : (window.courseData_es || window.courseData);
    },
    get 'main_en'() { return window.courseData_en; },
    get 'main_es'() { return window.courseData_es || window.courseData; }
  };
  window.COURSES = COURSES;

  // 레거시 호환용 기본 fallback 보장
  if (typeof window !== 'undefined' && window.courseData_es && !window.courseData) {
    window.courseData = window.courseData_es;
  }

  function getCurrentCourseData() {
    let activeId = 'es_main';
    try {
      activeId = localStorage.getItem('vocadash_active_course') || (typeof window !== 'undefined' && window.activeCourseId) || 'es_main';
    } catch (_) {
      activeId = (typeof window !== 'undefined' && window.activeCourseId) || 'es_main';
    }
    if (activeId === 'main') {
      const curLang = (typeof window !== 'undefined' && (window.currentLanguage || window.currentActiveCourse)) || 'es';
      activeId = (curLang === 'en' && window.courseData_en) ? 'en_main' : 'es_main';
    }
    return (window.COURSES && window.COURSES[activeId]) || window.courseData_es || window.courseData;
  }
  window.getCurrentCourseData = getCurrentCourseData;

  // 단어 ID 탐색 대상 확대: getCurrentCourseData() 우선 탐색
  function getWordById(wordId) {
    const course = getCurrentCourseData();
    if (course && Array.isArray(course.units)) {
      for (const unit of course.units) {
        if (unit && Array.isArray(unit.words)) {
          const found = unit.words.find(w => w.id === wordId);
          if (found) return found;
        }
      }
    }
    if (window.packFootballData && Array.isArray(window.packFootballData.units)) {
      for (const unit of window.packFootballData.units) {
        if (unit && Array.isArray(unit.words)) {
          const found = unit.words.find(w => w.id === wordId);
          if (found) return found;
        }
      }
    }
    return null;
  }
  window.getWordById = getWordById;

  // ===================================================
  // 코스별 진행도 및 해금 상태(localStorage) 표준화 및 격리 시스템
  // 키 규격:
  // - 스테이지 진행도: vocadash_prog_${lang}_${courseId}_u${unitIndex}_n${nodeIndex}
  // - 유닛 해금 레벨: vocadash_unlocked_${lang}_${courseId}
  // - 현재 활성 코스: vocadash_active_course_${lang}
  // ===================================================

  // ===================================================
  // 🔑 [복합 키(Composite Key) 네임스페이스 표준화]
  // 모든 노드의 진행도/완료 판정 키: u${unitId}_${nodeId} 형태
  // (예: u1_node-review, u2_node-review, u1_stage-1, u2_stage-1)
  // ===================================================
  function getCompositeNodeKey(nodeId, unitId = null) {
    if (!nodeId) return `u${unitId || 1}_stage-1`;
    const str = String(nodeId).trim();
    let u = unitId;
    if (!u) {
      const matchComposite = str.match(/^u(\d+)[-_]/i) || str.match(/^(?:fb|es|en)?[_]?(\d+)_/i) || str.match(/(?:unit|u|_)?(\d+)/i);
      u = matchComposite ? (parseInt(matchComposite[1], 10) || 1) : 1;
    }
    if (str.includes('review') || str.endsWith('_n4')) {
      return `u${u}_node-review`;
    }
    if (str.includes('bonus') || str.endsWith('_n3')) {
      return `u${u}_node-bonus`;
    }
    if (str.includes('boss') || str.endsWith('_n6')) {
      return `u${u}_node-boss`;
    }
    const matchStage = str.match(/(?:stage|node|n)[-_]?(\d+)/i);
    const n = matchStage ? parseInt(matchStage[1], 10) : 1;
    return `u${u}_stage-${n}`;
  }
  window.getCompositeNodeKey = getCompositeNodeKey;

  function parseNodeCoordinates(nodeId, defaultUnit = 1) {
    if (!nodeId) return { unitIndex: defaultUnit, nodeIndex: 1 };
    const str = String(nodeId).trim();

    // 1) u${unit}_stage-${stage} or u${unit}_node-${node} 형태 직접 정합
    const matchComposite = str.match(/^u(\d+)[-_](?:stage|node)[-_](\d+)$/i);
    if (matchComposite) {
      return { unitIndex: parseInt(matchComposite[1], 10) || defaultUnit, nodeIndex: parseInt(matchComposite[2], 10) || 1 };
    }
    const match1 = str.match(/^(?:fb|es|en)?[_]?(\d+)_n(\d+)$/i);
    if (match1) {
      return { unitIndex: parseInt(match1[1], 10) || defaultUnit, nodeIndex: parseInt(match1[2], 10) || 1 };
    }
    const match2 = str.match(/^u(\d+)[-_]n(\d+)$/i);
    if (match2) {
      return { unitIndex: parseInt(match2[1], 10) || defaultUnit, nodeIndex: parseInt(match2[2], 10) || 1 };
    }
    const match3 = str.match(/^node-(\d+)$/i);
    if (match3) {
      return { unitIndex: defaultUnit, nodeIndex: parseInt(match3[1], 10) || 1 };
    }
    if (str.includes('boss') || str.endsWith('_n6')) {
      const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
      const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
      return { unitIndex: u, nodeIndex: 6 };
    }
    if (str.endsWith('_n5') || str.endsWith('-n3') || str === 'node-3') {
      const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
      const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
      return { unitIndex: u, nodeIndex: 3 };
    }
    if (str.includes('review') || str.endsWith('_n4')) {
      const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
      const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
      return { unitIndex: u, nodeIndex: 'review' };
    }
    if (str.includes('bonus') || str.endsWith('_n3')) {
      const matchU = str.match(/(?:unit|u|_)?(\d+)/i);
      const u = matchU ? (parseInt(matchU[1], 10) || defaultUnit) : defaultUnit;
      return { unitIndex: u, nodeIndex: 'bonus' };
    }
    const uMatch = str.match(/(?:unit|u|_)?(\d+)/i);
    const u = uMatch ? (parseInt(uMatch[1], 10) || defaultUnit) : defaultUnit;
    const nMatch = str.match(/(?:node|stage|n|-)?(\d+)$/i);
    const n = nMatch ? (parseInt(nMatch[1], 10) || 1) : 1;
    return { unitIndex: u, nodeIndex: n };
  }
  window.parseNodeCoordinates = parseNodeCoordinates;

  function getCourseProgress(courseId, targetLang) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let cid = courseId || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || 'main';
    cid = (cid === 'pack_football') ? 'pack_football' : 'main';
    const key = `vocadash_progress_${lang}_${cid}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            completedNodes: Array.isArray(parsed.completedNodes) ? parsed.completedNodes : [],
            claimedBonuses: Array.isArray(parsed.claimedBonuses) ? parsed.claimedBonuses : [],
            unlockedUnits: Array.isArray(parsed.unlockedUnits) && parsed.unlockedUnits.length > 0 ? parsed.unlockedUnits : [1],
            nodeProgressMap: (parsed.nodeProgressMap && typeof parsed.nodeProgressMap === 'object') ? parsed.nodeProgressMap : { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 }
          };
        }
      }
    } catch (_) { }

    return {
      completedNodes: [],
      claimedBonuses: [],
      unlockedUnits: [1],
      nodeProgressMap: { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 }
    };
  }
  window.getCourseProgress = getCourseProgress;

  function saveCourseProgress(progressObj, courseId, targetLang) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let cid = courseId || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || 'main';
    cid = (cid === 'pack_football') ? 'pack_football' : 'main';
    const key = `vocadash_progress_${lang}_${cid}`;
    try {
      const dataToSave = {
        completedNodes: Array.isArray(progressObj.completedNodes) ? progressObj.completedNodes : [],
        claimedBonuses: Array.isArray(progressObj.claimedBonuses) ? progressObj.claimedBonuses : [],
        unlockedUnits: Array.isArray(progressObj.unlockedUnits) ? progressObj.unlockedUnits : [1],
        nodeProgressMap: progressObj.nodeProgressMap || window.nodeProgressMap || {}
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
    } catch (_) { }
  }
  window.saveCourseProgress = saveCourseProgress;

  function getUnlockedUnitLevel(targetLang, targetCourseId) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let courseId = targetCourseId;
    if (!courseId) {
      if (targetLang === 'pack_football' || targetLang === 'main') {
        courseId = targetLang;
      } else {
        courseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || window.activeCourseId || 'main';
      }
    }
    courseId = (courseId === 'pack_football') ? 'pack_football' : 'main';
    const key = `vocadash_unlocked_${lang}_${courseId}`;
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 1 && num <= 10) return num;
      }
    } catch (_) { }

    return 1;
  }
  window.getUnlockedUnitLevel = getUnlockedUnitLevel;

  function setUnlockedUnitLevel(level, targetLang, targetCourseId) {
    const lvl = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let courseId = targetCourseId;
    if (!courseId) {
      if (targetLang === 'pack_football' || targetLang === 'main') {
        courseId = targetLang;
      } else {
        courseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || window.activeCourseId || 'main';
      }
    }
    courseId = (courseId === 'pack_football') ? 'pack_football' : 'main';
    const key = `vocadash_unlocked_${lang}_${courseId}`;
    try {
      localStorage.setItem(key, String(lvl));
    } catch (_) { }
  }
  window.setUnlockedUnitLevel = setUnlockedUnitLevel;

  function getNodeProgress(nodeId, targetLang, targetCourseId) {
    if (!nodeId) return { clearedCount: 0, stars: 0, valueOf() { return 0; }, toString() { return '0'; } };
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let courseId = targetCourseId;
    if (!courseId) {
      if (String(nodeId).startsWith('fb_')) {
        courseId = 'pack_football';
      } else {
        courseId = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || 'main';
      }
    }
    courseId = (courseId === 'pack_football') ? 'pack_football' : 'main';

    const { unitIndex, nodeIndex } = parseNodeCoordinates(nodeId);
    const key = `vocadash_prog_${lang}_${courseId}_u${unitIndex}_n${nodeIndex}`;

    let count = 0;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'number') count = parsed;
        else if (parsed && typeof parsed.clearedCount === 'number') count = parsed.clearedCount;
        else if (parsed && typeof parsed.stars === 'number') count = parsed.stars;
      }
    } catch (_) {
      try {
        const num = parseInt(localStorage.getItem(key), 10);
        if (!isNaN(num)) count = num;
      } catch (_) { }
    }

    count = Math.max(0, Math.min(3, count));
    return {
      clearedCount: count,
      stars: count,
      valueOf() { return count; },
      toString() { return String(count); }
    };
  }
  window.getNodeProgress = getNodeProgress;
  window.getNodeProgressData = getNodeProgress;

  function setNodeProgress(nodeId, clearedCount, stars, targetLang, targetCourseId) {
    if (!nodeId) return { clearedCount: 0, stars: 0, valueOf() { return 0; }, toString() { return '0'; } };
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let courseId = targetCourseId;
    if (!courseId) {
      if (String(nodeId).startsWith('fb_')) {
        courseId = 'pack_football';
      } else {
        courseId = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || 'main';
      }
    }
    courseId = (courseId === 'pack_football') ? 'pack_football' : 'main';

    const { unitIndex, nodeIndex } = parseNodeCoordinates(nodeId);
    const count = Math.min(3, Math.max(0, Number(clearedCount) || 0));
    const s = Math.min(3, Math.max(0, stars !== undefined ? Number(stars) : count));
    const data = {
      clearedCount: count,
      stars: s,
      valueOf() { return count; },
      toString() { return String(count); }
    };

    const key = `vocadash_prog_${lang}_${courseId}_u${unitIndex}_n${nodeIndex}`;
    const compositeStageKey = `u${unitIndex}_stage-${nodeIndex}`;
    const compositeNodeKey = `u${unitIndex}_node-${nodeIndex}`;

    try {
      localStorage.setItem(key, String(count));
      localStorage.setItem(`node_progress_${lang}_${courseId}_${compositeNodeKey}`, String(count));
      localStorage.setItem(`node_progress_${lang}_${courseId}_${compositeStageKey}`, String(count));
      if (courseId === 'main' && lang === 'es') {
        localStorage.setItem(compositeNodeKey, String(count));
        localStorage.setItem(compositeStageKey, String(count));
      }
      if (nodeIndex === 3 || String(nodeId).includes('node-3') || String(nodeId).includes('stage-3')) {
        const rawUserData = localStorage.getItem('vocadash_user_data');
        let uData = rawUserData ? JSON.parse(rawUserData) : {};
        if (!uData.clearedNodes) uData.clearedNodes = {};
        uData.clearedNodes['node-3'] = { cleared: count >= 3, clearedCount: count, actuallyPlayed: true };
        uData.clearedNodes[compositeNodeKey] = { cleared: count >= 3, clearedCount: count, actuallyPlayed: true };
        uData.clearedNodes[compositeStageKey] = { cleared: count >= 3, clearedCount: count, actuallyPlayed: true };
        localStorage.setItem('vocadash_user_data', JSON.stringify(uData));
      }
      if (courseId === 'pack_football' && String(nodeId).startsWith('fb_')) {
        localStorage.setItem(`vocadash_node_progress_${nodeId}`, JSON.stringify({ clearedCount: count, stars: s }));
      }
    } catch (_) { }

    if (!window.nodeProgressMap) window.nodeProgressMap = {};
    window.nodeProgressMap[`${lang}_${courseId}_u${unitIndex}_n${nodeIndex}`] = count;
    window.nodeProgressMap[nodeId] = count;
    if (courseId === 'pack_football') {
      window.nodeProgressMap[`fb_${unitIndex}_n${nodeIndex}`] = count;
    } else {
      window.nodeProgressMap[`${lang}_${unitIndex}_n${nodeIndex}`] = count;
    }

    // 🔑 복합 키(Composite Key) 네임스페이스 동기화
    window.nodeProgressMap[compositeStageKey] = count;
    window.nodeProgressMap[compositeNodeKey] = count;
    window.nodeProgressMap[`u${unitIndex}_n${nodeIndex}`] = count;
    if (String(nodeIndex) === '6' || String(nodeId).includes('boss')) {
      window.nodeProgressMap[`u${unitIndex}_node-boss`] = count;
    }
    if (String(nodeIndex) === 'review' || String(nodeId).includes('review')) {
      window.nodeProgressMap[`u${unitIndex}_node-review`] = count;
    }
    if (String(nodeIndex) === 'bonus' || String(nodeId).includes('bonus')) {
      window.nodeProgressMap[`u${unitIndex}_node-bonus`] = count;
    }

    // completedStages 동기화
    if (!window.completedStages) window.completedStages = [];
    const isCompletedClear = (String(nodeIndex) === '6' || String(nodeId).includes('boss')) ? count >= 1 : count >= 3;
    if (isCompletedClear) {
      if (!window.completedStages.includes(compositeStageKey)) window.completedStages.push(compositeStageKey);
      if (!window.completedStages.includes(compositeNodeKey)) window.completedStages.push(compositeNodeKey);
      if (!window.completedStages.includes(nodeId)) window.completedStages.push(nodeId);
      try {
        localStorage.setItem('vocadash_completed_stages', JSON.stringify(window.completedStages));
      } catch (_) { }
    }

    const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const curCourse = window.currentCourseId || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + curLang) : null) || 'main';
    if (curLang === lang && curCourse === courseId && unitIndex === 1) {
      window.nodeProgressMap[`node-${nodeIndex}`] = count;
    }

    return data;
  }
  window.setNodeProgress = setNodeProgress;
  window.saveNodeProgressData = setNodeProgress;

  // 🐾 고양이 발바닥 진행도 뱃지 렌더러 (클리어 시 주황색 발바닥 점등)
  function renderStarsBadge(clearedCount, stars, isLocked, lockMsg) {
    const count = Math.max(0, Math.min(3, Number(clearedCount) || 0));

    // 1) 잠금 상태
    if (isLocked) {
      return `
        <span class="text-xs text-slate-300 opacity-30">🐾</span>
        <span class="text-xs text-slate-300 opacity-30">🐾</span>
        <span class="text-xs text-slate-300 opacity-30">🐾</span>
        <span class="font-label-sm text-[10px] text-slate-400 font-semibold ml-1">${(typeof escapeHTML === 'function') ? escapeHTML(lockMsg || '이전 레슨 완료 후') : (lockMsg || '이전 레슨 완료 후')}</span>
      `;
    }

    // 2) 3회 완주 상태
    if (count >= 3) {
      return `
        <span class="text-xs text-amber-500 text-amber-400 font-bold drop-shadow-xs" style="color: #f59e0b;">🐾</span>
        <span class="text-xs text-amber-500 text-amber-400 font-bold drop-shadow-xs" style="color: #f59e0b;">🐾</span>
        <span class="text-xs text-amber-500 text-amber-400 font-bold drop-shadow-xs" style="color: #f59e0b;">🐾</span>
        <span class="font-label-sm text-[10px] text-emerald-600 font-bold ml-1">완료!</span>
      `;
    }

    // 3) 진행 중 상태 (count 개수만큼 주황색 불 점등!)
    let pawHtml = '';
    for (let i = 1; i <= 3; i++) {
      if (i <= count) {
        // 활성화된 발바닥 (따뜻한 주황색)
        pawHtml += '<span class="text-xs text-amber-500 text-amber-400 font-bold drop-shadow-xs transform scale-110 inline-block" style="color: #f59e0b;">🐾</span>';
      } else {
        // 꺼진 발바닥 (흐린 회색)
        pawHtml += '<span class="text-xs text-slate-300 opacity-30 inline-block">🐾</span>';
      }
    }
    return `${pawHtml}<span class="font-label-sm text-[10px] text-sky-600 font-black ml-1">${count}/3 레슨 진행중</span>`;
  }
  window.renderStarsBadge = renderStarsBadge;

  // 🔍 노드 진행도 정밀 복원 함수 (언어별 격리 적용)
  function resolveNodeData(specificId, slotId, targetLang) {
    const curLang = targetLang || ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es');
    if (typeof getNodeProgress === 'function') {
      const p1 = getNodeProgress(specificId, curLang);
      if (p1 && p1.clearedCount > 0) return p1;
      if (slotId && slotId !== specificId) {
        const p2 = getNodeProgress(slotId, curLang);
        if (p2 && p2.clearedCount > 0) return p2;
      }
    }
    return { clearedCount: 0, stars: 0 };
  }
  window.resolveNodeData = resolveNodeData;


  // 노드 잠금 해제 판정 로직 (각 유닛 1과 및 이전 보스 클리어 연동)
  function isNodeUnlocked(currentUnitIndex, nodeIndex, node, course) {
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let courseId = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || 'main';
    courseId = (courseId === 'pack_football') ? 'pack_football' : 'main';

    // 1) Unit 1 (index 0)의 첫 번째 노드(index 0)는 무조건 해금
    if (currentUnitIndex === 0 && nodeIndex === 0) return true;

    const targetCourse = course || (typeof getCurrentCourseData === 'function' ? getCurrentCourseData() : (window.packFootballData || window.courseData));

    // 2) 각 유닛의 첫 번째 노드 (nodeIndex === 0, 예: fb_2_n1, es_2_n1)
    if (nodeIndex === 0) {
      if (currentUnitIndex === 0) return true;
      // 바로 이전 유닛(currentUnitIndex - 1)의 마지막 보스 노드가 clearedCount >= 1 인지 검사
      if (targetCourse && Array.isArray(targetCourse.units)) {
        const prevUnit = targetCourse.units[currentUnitIndex - 1];
        if (prevUnit && Array.isArray(prevUnit.nodes)) {
          const prevBoss = prevUnit.nodes.find(n => n.type === 'boss' || (n.id && (n.id.endsWith('_n6') || n.id.includes('boss'))));
          if (prevBoss && prevBoss.id) {
            const p = (typeof getNodeProgress === 'function') ? getNodeProgress(prevBoss.id, lang, courseId) : { clearedCount: 0 };
            const count = p.clearedCount || 0;
            if (count >= 1) return true;
          }
        }
      }
      // unlockedLevel 확인 (unlockedLevel >= currentUnitIndex + 1 이면 해금)
      const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang, courseId) : 1) || 1;
      if (unlockedLevel >= currentUnitIndex + 1) return true;

      return false;
    }

    // 3) 같은 유닛 내의 후속 노드 (nodeIndex > 0)
    const nodeId = node?.id || (typeof node === 'string' ? node : '');
    const nodeType = node?.type || '';

    // Unit 1 전용 슬롯 fallback 판정
    if (currentUnitIndex === 0) {
      if (nodeId === 'node-1' || nodeId === 'fb_1_n1' || nodeId === 'es_1_n1' || nodeIndex === 0) return true;

      const p1 = (typeof getNodeProgress === 'function')
        ? (getNodeProgress('node-1', lang, courseId)?.clearedCount || 0)
        : (window.nodeProgressMap?.['node-1'] || 0);

      const isBonusDone = (typeof isBonusClaimed === 'function') ? (isBonusClaimed('node-bonus') || isBonusClaimed('fb_1_n2') || isBonusClaimed('es_1_bonus')) : false;

      // 1과를 3회 완주(p1 >= 3)해야 2과 및 보너스 상자 해금
      if (nodeId === 'node-bonus' || nodeId === 'fb_1_n2' || nodeType === 'bonus' || nodeIndex === 1) {
        return p1 >= 3;
      }
      if (nodeId === 'node-2' || nodeId === 'fb_1_n3' || (nodeIndex === 2 && (nodeType === 'stage' || !nodeType))) {
        return p1 >= 3;
      }

      const p2 = (typeof getNodeProgress === 'function')
        ? (getNodeProgress('node-2', lang, courseId)?.clearedCount || 0)
        : (window.nodeProgressMap?.['node-2'] || 0);
      const isReviewDone = (typeof isReviewNodeCompleted === 'function') ? (isReviewNodeCompleted('node-review') || isReviewNodeCompleted('fb_1_n5') || isReviewNodeCompleted('es_1_review')) : false;

      if (nodeId === 'node-review' || nodeId === 'fb_1_n5' || nodeType === 'review') {
        return p2 >= 3 && isBonusDone;
      }
      if (nodeId === 'node-3' || nodeId === 'fb_1_n4' || nodeType === 'sentence' || (nodeIndex === 3 && nodeType === 'sentence') || nodeIndex === 4) {
        return p2 >= 3;
      }
      if (nodeId === 'node-boss' || nodeId === 'fb_1_n6' || nodeType === 'boss' || nodeIndex === 5) {
        const p3 = (typeof getNodeProgress === 'function')
          ? (getNodeProgress('node-3', lang, courseId)?.clearedCount || 0)
          : (window.nodeProgressMap?.['node-3'] || 0);
        return p3 >= 3;
      }
    }

    if (targetCourse && Array.isArray(targetCourse.units)) {
      const curUnit = targetCourse.units[currentUnitIndex];
      if (curUnit && Array.isArray(curUnit.nodes)) {
        const actualNodeIdx = (typeof nodeIndex === 'number' && nodeIndex >= 0 && nodeIndex < curUnit.nodes.length)
          ? nodeIndex
          : curUnit.nodes.findIndex(n => n.id === nodeId);

        if (actualNodeIdx > 0) {
          const prevNode = curUnit.nodes[actualNodeIdx - 1];
          if (prevNode && prevNode.id) {
            if (curUnit.nodes[actualNodeIdx].type === 'bonus') {
              const p = (typeof getNodeProgress === 'function') ? getNodeProgress(prevNode.id, lang, courseId) : { clearedCount: 0 };
              return (p.clearedCount || 0) >= 3;
            }
            if (prevNode.type === 'bonus') {
              return (typeof isBonusClaimed === 'function') ? isBonusClaimed(prevNode.id) : false;
            }
            if (prevNode.type === 'review') {
              return (typeof isReviewNodeCompleted === 'function') ? isReviewNodeCompleted(prevNode.id) : false;
            }
            const p = (typeof getNodeProgress === 'function') ? getNodeProgress(prevNode.id, lang, courseId) : { clearedCount: 0 };
            return (p.clearedCount || 0) >= 3;
          }
        }
      }
    }
    return false;
  }
  window.isNodeUnlocked = isNodeUnlocked;

  function loadNodeProgress(targetLang, targetCourseId) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : (targetLang === 'es' ? 'es' : ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es'));
    let courseId = targetCourseId || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + lang) : null) || 'main';
    courseId = (courseId === 'pack_football') ? 'pack_football' : 'main';

    const result = {
      'node-1': 0,
      'node-2': 0,
      'node-3': 0,
      'node-boss': 0
    };

    [1, 2, 3].forEach(n => {
      const stdKey = `vocadash_prog_${lang}_${courseId}_u1_n${n}`;
      let c = 0;
      try {
        const raw = localStorage.getItem(stdKey);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'number') c = parsed;
          else if (parsed && typeof parsed.clearedCount === 'number') c = parsed.clearedCount;
          else if (parsed && typeof parsed.stars === 'number') c = parsed.stars;
        }
      } catch (_) {
        try {
          const num = parseInt(localStorage.getItem(stdKey), 10);
          if (!isNaN(num)) c = num;
        } catch (_) { }
      }
      // 복합 키 및 대체 키 fallback 확인 (코스 격리 준수)
      if (c === 0) {
        const compNodeKey = `u1_node-${n}`;
        const compStageKey = `u1_stage-${n}`;
        const altKey = `node_progress_${lang}_${courseId}_node-${n}`;
        const altCompKey = `node_progress_${lang}_${courseId}_u1_node-${n}`;
        let rawAlt = localStorage.getItem(altKey) || localStorage.getItem(altCompKey);
        if (!rawAlt && courseId === 'main' && lang === 'es' && n === 3) {
          rawAlt = localStorage.getItem(compNodeKey) || localStorage.getItem(compStageKey);
        }
        if (rawAlt !== null && rawAlt !== undefined) {
          try {
            const parsedAlt = JSON.parse(rawAlt);
            if (typeof parsedAlt === 'number') c = parsedAlt;
            else if (parsedAlt && typeof parsedAlt.clearedCount === 'number') c = parsedAlt.clearedCount;
            else if (parsedAlt && typeof parsedAlt.stars === 'number') c = parsedAlt.stars;
          } catch (_) {
            const numAlt = parseInt(rawAlt, 10);
            if (!isNaN(numAlt)) c = numAlt;
          }
        }
      }

      c = Math.max(0, Math.min(3, c));
      result[`node-${n}`] = c;
      result[`${lang}_${courseId}_u1_n${n}`] = c;
      result[`u1_stage-${n}`] = c;
      result[`u1_node-${n}`] = c;
      result[`u1_n${n}`] = c;
      if (courseId === 'pack_football') {
        result[`fb_1_n${n}`] = c;
      } else {
        result[`${lang}_1_n${n}`] = c;
      }
    });

    // 🛑 [3번 노드 오염 방어] 복습 노드 완료 처리가 3번 노드 진행도를 침범하여 오염된 잔여 데이터 안전 정화
    try {
      const rawUserData = localStorage.getItem('vocadash_user_data');
      const uData = rawUserData ? JSON.parse(rawUserData) : null;
      const isN3ActuallyPlayed = !!(uData && uData.clearedNodes && (
        (uData.clearedNodes['node-3'] && uData.clearedNodes['node-3'].actuallyPlayed) ||
        (uData.clearedNodes['u1_node-3'] && uData.clearedNodes['u1_node-3'].actuallyPlayed) ||
        (uData.clearedNodes['u1_stage-3'] && uData.clearedNodes['u1_stage-3'].actuallyPlayed)
      ));
      if (!isN3ActuallyPlayed && result['node-3'] > 0) {
        // 실제로 3번 노드를 플레이하지 않고 복습 버그로 1이 남아있는 잔여 데이터 정화
        result['node-3'] = 0;
        result[`${lang}_${courseId}_u1_n3`] = 0;
        result['u1_stage-3'] = 0;
        result['u1_node-3'] = 0;
        result['u1_n3'] = 0;
        if (courseId === 'pack_football') {
          result['fb_1_n3'] = 0;
          result['fb_1_n5'] = 0;
        } else {
          result[`${lang}_1_n3`] = 0;
        }
        try {
          localStorage.removeItem(`vocadash_prog_${lang}_${courseId}_u1_n3`);
          localStorage.removeItem(`node_progress_${lang}_${courseId}_node-3`);
          localStorage.removeItem(`node_progress_${lang}_${courseId}_1_3`);
          localStorage.removeItem('u1_node-3');
          localStorage.removeItem('u1_stage-3');
        } catch (_) { }
      }
    } catch (_) { }

    const bossKey = `vocadash_prog_${lang}_${courseId}_u1_n6`;
    let bossCount = 0;
    try {
      const rawBoss = localStorage.getItem(bossKey);
      if (rawBoss !== null) {
        const parsed = JSON.parse(rawBoss);
        if (typeof parsed === 'number') bossCount = parsed;
        else if (parsed && typeof parsed.clearedCount === 'number') bossCount = parsed.clearedCount;
      }
    } catch (_) {
      const num = parseInt(localStorage.getItem(bossKey), 10);
      if (!isNaN(num)) bossCount = num;
    }
    result['node-boss'] = bossCount;
    result[`${lang}_${courseId}_u1_n6`] = bossCount;
    result['u1_node-boss'] = bossCount;
    result['u1_stage-6'] = bossCount;

    return result;
  }

  function saveNodeProgress() {
    const prog = getCourseProgress(window.activeCourseId);
    prog.nodeProgressMap = window.nodeProgressMap || {};
    if (!prog.completedNodes) prog.completedNodes = [];
    ['node-1', 'node-2', 'node-3', 'node-boss'].forEach(nodeId => {
      if (prog.nodeProgressMap[nodeId] >= 3 && !prog.completedNodes.includes(nodeId)) {
        prog.completedNodes.push(nodeId);
      }
    });
    saveCourseProgress(prog, window.activeCourseId);
  }

  window.loadNodeProgress = loadNodeProgress;
  window.nodeProgressMap = loadNodeProgress();
  window.saveNodeProgress = saveNodeProgress;
  window.currentSessionQuestions = [];

  // 초기 사용자 상태(DEFAULT_USER_PROGRESS) 클린 초기화
  const DEFAULT_USER_PROGRESS = {
    currentCourse: 'pack_football',
    currentUnit: 0,
    currentNode: 0,
    stars: {},
    clearedNodes: [],
    unlockedNodes: ['fb_1_n1', 'es_1_n1', 'node-1'],
    weakWords: [],
    gems: 0,
    hearts: 5
  };
  window.DEFAULT_USER_PROGRESS = DEFAULT_USER_PROGRESS;

  // 전역 강제 초기화 함수 구현 (window.forceHardReset)
  window.forceHardReset = function () {
    window._isHardResetting = true;
    window.onbeforeunload = null;
    window.onunload = null;
    try {
      localStorage.clear();
      sessionStorage.clear();
      const cleanState = {
        currentUnit: 0,
        clearedNodes: {},
        weakWords: []
      };
      localStorage.setItem('vocadash_user_data', JSON.stringify(cleanState));
    } catch (_) { }
    location.replace(location.pathname + '?v=' + Date.now());
  };

  function getSavedLanguage() {
    try {
      const val = localStorage.getItem('vocadash_language');
      if (val === 'en' || val === 'es') return val;
    } catch (_) { }
    return 'es';
  }
  window.getSavedLanguage = getSavedLanguage;
  window.currentActiveCourse = getSavedLanguage();
  window.currentLanguage = window.currentActiveCourse;

  function getSavedCourseId() {
    try {
      const val = localStorage.getItem('vocadash_current_course');
      if (val && typeof val === 'string' && /^[a-zA-Z0-9_-]+$/.test(val)) {
        return val;
      }
      return 'basic';
    } catch (_) {
      return 'basic';
    }
  }
  window.currentCourseId = getSavedCourseId();
  window.currentBookCourseId = window.currentCourseId;

  const COURSE_PRESETS = {
    es: [
      { id: 'basic', icon: '🌱', title: '기초 회화', desc: '인사, 감사, 숫자 등 매일 쓰는 첫걸음' },
      { id: 'travel', icon: '✈️', title: '여행 스페인어', desc: '공항, 숙소, 식당 필수 회화' },
      { id: 'dele', icon: '🎓', title: 'DELE 준비과정', desc: 'A1~B2 등급별 어휘 및 실전 대비' },
      { id: 'business', icon: '💼', title: '비즈니스 스페인어', desc: '오피스 일상, 미팅, 이메일' }
    ],
    en: [
      { id: 'basic', icon: '🌱', title: '기초 회화', desc: '인사, 감사, 숫자 등 매일 쓰는 첫걸음' },
      { id: 'travel', icon: '✈️', title: '여행 영어', desc: '공항, 호텔, 카페 실전 회화' },
      { id: 'toeic', icon: '🎓', title: '토익/오픽 대비', desc: '필수 기출 어휘 및 빈출 표현' },
      { id: 'business', icon: '💼', title: '비즈니스 영어', desc: '오피스 실무, 미팅, 이메일' }
    ]
  };
  window.COURSE_PRESETS = COURSE_PRESETS;

  window.courseData = {
    es: { code: 'es', name: '스페인어', flag: '🇪🇸', title: '일상 실전 패턴', mascotImg: 'assets/characters/es-study.webp?v=68', ctaText: '스페인어로 학습하기', desc: '스페인어 (일상 실전 패턴)' },
    en: { code: 'en', name: '영어', flag: '🇺🇸', title: '필수 회화 & 어휘', mascotImg: 'assets/characters/en-study.webp?v=68', ctaText: '영어로 학습하기', desc: '영어 (필수 회화 & 어휘)' },
    get units() {
      const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const baseUnits = (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS[lang]) || (typeof UNIT_LIST_PRESETS !== 'undefined' ? UNIT_LIST_PRESETS[lang] : []);
      const db = (window.VOCA_DATA && window.VOCA_DATA.database) || (typeof database !== 'undefined' ? database : null);
      return baseUnits.map((u, idx) => {
        if (Array.isArray(u.words) && u.words.length > 0) return u;
        const dbKey = idx === 0 ? 'node-1' : idx === 1 ? 'node-2' : idx === 2 ? 'node-3' : 'node-boss';
        const wList = (db && db[dbKey] && (db[dbKey][lang] || db[dbKey].es || [])) || [];
        return { ...u, words: wList };
      });
    }
  };

  const COURSE_LESSONS = {
    es: {
      basic: {
        'node-1': { title: '1과: 인사/안부', desc: '¡Hola!, ¿Cómo estás? 등 매일 쓰는 첫인사와 안부 표현을 마스터하세요!', icon: '🌱', level: '기초', category: '인사/안부', tags: ['인사/안부', '인사', '안부'] },
        'node-2': { title: '2과: 감사/사과', desc: 'Gracias, Por favor, Lo siento 등 필수 예절 표현과 핵심 어휘를 완벽하게 학습해보세요!', icon: '🙏', level: '기초', category: '감사/사과', tags: ['감사/사과', '감사', '사과'] },
        'node-3': { title: '3과: 숫자/시간', desc: '1부터 100까지의 숫자와 시각 표현, 요일을 쉽고 빠르게 익혀보세요!', icon: '⏰', level: '기초', category: '숫자/시간', tags: ['숫자/시간', '숫자', '시간'] },
        'node-boss': { title: '4과: 일상 기초 (보스전)', desc: '기초 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '일상 기초', tags: ['일상 기초', '일상', '기초', '보스전'] }
      },
      travel: {
        'node-1': { title: '1과: 기내 기본 표현', desc: '좌석 요청, 음료 주문, 착륙 안내 등 비행기 탑승 필수 단어와 표현을 완벽하게 복습해보세요!', icon: '✈️', level: '초급', category: '공항/기내', tags: ['공항/기내', '공항', '기내', '비행기'] },
        'node-2': { title: '2과: 입국 심사', desc: '입국 목적, 체류 기간, 숙소 위치 등 필수 공항 인터뷰 질문과 핵심 어휘 10개 및 실전 문장 3개를 마스터하세요!', icon: '🛂', level: '초중급', category: '교통/길찾기', tags: ['교통/길찾기', '입국 심사', '인터뷰', '심사'] },
        'node-3': { title: '3과: 수하물 찾기와 세관', desc: '수하물 수취대 찾기, 분실물 신고, 세관 검사 필수 표현과 실전문장 13개를 마스터해보세요!', icon: '🧳', level: '중급', category: '호텔/숙소', tags: ['호텔/숙소', '수하물 찾기와 세관', '수하물', '세관'] },
        'node-boss': { title: '보스전: 공항 마스터 관문', desc: '입국 심사 완벽 통과 & 특별 보상', icon: '👑', level: '보스전', category: '식당/카페', tags: ['식당/카페', '공항 마스터', '보스전'] }
      },
      dele: {
        'node-1': { title: '1과: DELE A1 (우리 몸 1)', desc: '신체 기본 부위 및 A1 기초 어휘 50선', icon: '📝', level: 'DELE A1', category: 'DELE A1', tags: ['DELE A1', 'A1', '우리 몸 1', '우리 몸'] },
        'node-2': { title: '2과: DELE A1 (우리 몸 2)', desc: '얼굴 및 감각 기관 핵심 어휘', icon: '👀', level: 'DELE A1', category: 'DELE A1', tags: ['DELE A1', 'A1', '우리 몸 2', '우리 몸'] },
        'node-3': { title: '3과: DELE A2 (세부 부위/장기)', desc: '세부 신체 부위 및 A2 실전 독해 어휘', icon: '🫀', level: 'DELE A2', category: 'DELE A2', tags: ['DELE A2', 'A2', '세부 부위/장기', '장기'] },
        'node-boss': { title: '4과: DELE 실전 모의테스트', desc: 'DELE B1/B2 실전 모의테스트 & 최종 관문', icon: '👑', level: 'DELE B2', category: 'DELE B2', tags: ['DELE B1', 'DELE B2', 'B1', 'B2', '모의테스트', '실전 모의테스트'] }
      },
      business: {
        'node-1': { title: '1과: 첫 출근과 인사', desc: '비즈니스 자기소개와 명함 교환, 직급 호칭', icon: '🤝', level: '실무', category: '오피스 일상', tags: ['오피스 일상', '출근', '인사'] },
        'node-2': { title: '2과: 오피스 일상과 회의', desc: '회의 일정 잡기, 업무 협업 및 보고 표현', icon: '💼', level: '실무', category: '이메일/문서', tags: ['이메일/문서', '회의', '보고'] },
        'node-3': { title: '3과: 이메일과 전화 응대', desc: '비즈니스 이메일 작성 및 바이어 통화 표현', icon: '📧', level: '실무', category: '미팅/협상', tags: ['미팅/협상', '이메일', '전화'] },
        'node-boss': { title: '4과: 비즈니스 협상 마스터', desc: '비즈니스 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '비자/행정', tags: ['비자/행정', '협상', '보스전'] }
      }
    },
    en: {
      basic: {
        'node-1': { title: '1과: 인사/기초 표현', desc: 'Hello, Thank you, Please 등 매일 쓰는 첫인사와 필수 기초 회화를 마스터하세요!', icon: '🌱', level: '기초', category: '인사/안부', tags: ['인사/안부', '인사'] },
        'node-2': { title: '2과: 감사/사과 표현', desc: 'Thank you, Sorry, Excuse me 등 필수 영어 예절 표현과 핵심 어휘를 완벽하게 학습해보세요!', icon: '🙏', level: '기초', category: '감사/사과', tags: ['감사/사과', '감사'] },
        'node-3': { title: '3과: 숫자와 시간', desc: '1부터 100까지의 영어 숫자와 시각 표현, 요일을 쉽고 빠르게 익혀보세요!', icon: '⏰', level: '기초', category: '숫자/시간', tags: ['숫자/시간', '숫자'] },
        'node-boss': { title: '4과: 필수 회화 (보스전)', desc: '기초 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '일상 기초', tags: ['일상 기초', '보스전'] }
      },
      travel: {
        'node-1': { title: '1과: 기내 필수 영어', desc: 'Water, Blanket, Aisle seat 등 비행기 탑승 필수 영어 단어와 표현을 완벽하게 복습해보세요!', icon: '✈️', level: '초급', category: '공항/기내', tags: ['공항/기내', '공항'] },
        'node-2': { title: '2과: 공항 & 입국 심사', desc: 'Passport, Purpose of visit 등 입국 심사 핵심 영어 어휘와 문장 마스터!', icon: '🛂', level: '초중급', category: '교통/길찾기', tags: ['교통/길찾기', '입국 심사'] },
        'node-3': { title: '3과: 수하물 찾기와 세관', desc: 'Baggage claim, Customs 등 수하물 분실 신고와 세관 통관 표현 마스터!', icon: '🧳', level: '중급', category: '호텔/숙소', tags: ['호텔/숙소', '수하물'] },
        'node-boss': { title: '보스전: 여행 영어 마스터', desc: '여행 영어 완벽 마스터 & 특별 보상', icon: '👑', level: '보스전', category: '식당/카페', tags: ['식당/카페', '보스전'] }
      },
      toeic: {
        'node-1': { title: '1과: Part 1/2 빈출 어휘', desc: '사진 묘사 및 질의응답 핵심 단어', icon: '🎧', level: '초급', category: 'Part 1/2', tags: ['Part 1/2', 'Part 1', 'Part 2'] },
        'node-2': { title: '2과: Part 3/4 비즈니스 회화', desc: '대화 및 설명문 빈출 표현', icon: '💬', level: '중급', category: 'Part 3/4', tags: ['Part 3/4', 'Part 3', 'Part 4'] },
        'node-3': { title: '3과: Part 5/6 문법/어휘', desc: '단문 및 장문 공란 메우기 핵심 단어', icon: '📄', level: '중상급', category: 'Part 5/6', tags: ['Part 5/6', 'Part 5', 'Part 6'] },
        'node-boss': { title: '4과: Part 7 독해 실전 마스터', desc: '장문 독해 및 이메일/기사 지문 완성', icon: '👑', level: '실전', category: 'Part 7', tags: ['Part 7', '독해', '보스전'] }
      },
      business: {
        'node-1': { title: '1과: 첫 출근과 인사', desc: '비즈니스 자기소개와 명함 교환, 직급 호칭', icon: '🤝', level: '실무', category: '오피스 일상', tags: ['오피스 일상', '출근'] },
        'node-2': { title: '2과: 오피스 일상과 회의', desc: '회의 일정 잡기, 업무 협업 및 보고 표현', icon: '💼', level: '실무', category: '이메일/문서', tags: ['이메일/문서', '회의'] },
        'node-3': { title: '3과: 이메일과 전화 응대', desc: '비즈니스 이메일 작성 및 바이어 통화 표현', icon: '📧', level: '실무', category: '미팅/협상', tags: ['미팅/협상', '이메일'] },
        'node-boss': { title: '4과: 비즈니스 협상 마스터', desc: '비즈니스 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '비자/행정', tags: ['비자/행정', '협상'] }
      }
    }
  };
  Object.assign(COURSE_LESSONS, COURSE_LESSONS.es);
  window.COURSE_LESSONS = COURSE_LESSONS;
  window.nodeLessonData = COURSE_LESSONS.basic;

  const courseCategoryMap = {
    basic: { icon: '🌱', titles: { es: '기초 회화', en: '기초 회화' }, categories: ['전체', '인사/안부', '감사/사과', '숫자/시간', '일상 기초'] },
    travel: { icon: '✈️', titles: { es: '여행 스페인어', en: '여행 영어' }, categories: ['전체', '공항/기내', '교통/길찾기', '호텔/숙소', '식당/카페'] },
    dele: { icon: '🎓', titles: { es: 'DELE 준비과정', en: 'DELE 준비과정' }, categories: ['전체', 'DELE A1', 'DELE A2', 'DELE B1', 'DELE B2'] },
    business: { icon: '💼', titles: { es: '비즈니스 스페인어', en: '비즈니스 영어' }, categories: ['전체', '오피스 일상', '이메일/문서', '미팅/협상', '비자/행정'] },
    toeic: { icon: '🎓', titles: { es: '토익/오픽 대비', en: '토익/오픽 대비' }, categories: ['전체', 'Part 1/2', 'Part 3/4', 'Part 5/6', 'Part 7'] }
  };

  let currentSelectedNodeId = 'node-2', modalSelectedCourse = 'es', lockedTooltipTimer = null;

  // DOM Helpers
  const el = (id) => document.getElementById(id), setText = (id, txt) => { const node = el(id); if (node) node.textContent = txt; }, on = (id, evt, fn) => { const node = el(id); if (node) node.addEventListener(evt, fn); };

  // 2. Global Toast & Notifications completely disabled per requirements
  window.showToast = function () { };
  window.showNotification = function () { };

  function toggleModal(backdrop, card, open, anim = 'fade') {
    if (backdrop) {
      backdrop.classList.toggle('opacity-0', !open); backdrop.classList.toggle('pointer-events-none', !open);
      backdrop.classList.toggle('opacity-100', open); backdrop.classList.toggle('pointer-events-auto', open);
    }
    if (card) {
      card.classList.toggle('opacity-0', !open); card.classList.toggle('pointer-events-none', !open);
      card.classList.toggle('opacity-100', open); card.classList.toggle('pointer-events-auto', open);
      if (anim === 'slide') { card.classList.toggle('translate-y-full', !open); card.classList.toggle('translate-y-0', open); }
      else {
        card.classList.toggle('scale-95', !open); card.classList.toggle('scale-100', open);
      }
    }
  }

  // 3.0 미등록 / 빈 스테이지 안내 모달 (Empty State Modal)
  window.showEmptyStageModal = function (msg = '🚧 단어장 준비 중! 곧 업데이트될 스테이지입니다.') {
    const backdrop = document.getElementById('empty-stage-modal-backdrop');
    const card = document.getElementById('empty-stage-card');
    const desc = document.getElementById('empty-stage-desc');
    if (desc && msg) desc.textContent = msg;
    if (backdrop && card) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
      card.classList.remove('scale-95', 'opacity-0');
      card.classList.add('scale-100', 'opacity-100');
    }
  };

  window.closeEmptyStageModal = function () {
    const backdrop = document.getElementById('empty-stage-modal-backdrop');
    const card = document.getElementById('empty-stage-card');
    if (backdrop && card) {
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      card.classList.remove('scale-100', 'opacity-100');
      card.classList.add('scale-95', 'opacity-0');
    }
  };

  const emptyConfirmBtn = document.getElementById('empty-stage-confirm-btn');
  if (emptyConfirmBtn) {
    emptyConfirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.closeEmptyStageModal();
    });
  }
  const emptyStageBackdrop = document.getElementById('empty-stage-modal-backdrop');
  if (emptyStageBackdrop) {
    emptyStageBackdrop.addEventListener('click', (e) => {
      if (e.target === emptyStageBackdrop) window.closeEmptyStageModal();
    });
  }

  // 3. Roadmap Nodes & Lesson Bottom Sheet
  const lessonBackdrop = el('lesson-modal-backdrop') || el('stage-modal-backdrop'), lessonSheet = el('lesson-card-sheet') || el('stage-modal') || el('node-detail-modal'), lockedTooltip = el('locked-node-tooltip');

  window.openLessonModal = function (nodeId) {
    if (typeof checkAndRechargeHearts === 'function') checkAndRechargeHearts();
    if (window.userHearts <= 0) {
      console.warn(`[VocaDash] 하트 0개 상태에서 스테이지(${nodeId}) 클릭 차단 -> 하트 충전 모달 팝업`);
      if (typeof openHeartRechargeModal === 'function') openHeartRechargeModal();
      return;
    }

    const gScreen = document.getElementById('game-screen');
    if (gScreen && gScreen.classList.contains('opacity-100') && !gScreen.classList.contains('pointer-events-none')) {
      console.warn('🛑 게임 화면 활성 중 openLessonModal 호출 차단됨!');
      return;
    }

    // 데이터 미등록 스테이지 방어 (Empty State Check)
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const db = (window.VOCA_DATA && window.VOCA_DATA.database) || (typeof database !== 'undefined' ? database : null);

    let hasWords = false;
    const curCourse = (typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : null;
    if (nodeId === 'node-boss' || String(nodeId).includes('boss')) {
      hasWords = true;
    } else if (window.activeCourseId === 'pack_football' && window.packFootballData) {
      hasWords = true;
    } else if (curCourse && Array.isArray(curCourse.units) && curCourse.units.length > 0) {
      hasWords = true;
    } else if (db && Object.prototype.hasOwnProperty.call(db, nodeId)) {
      const entry = db[nodeId];
      if (entry) {
        const words = entry[lang] || entry.words || entry.all || (Array.isArray(entry) ? entry : null);
        if (Array.isArray(words) && words.length > 0) {
          hasWords = true;
        }
      }
    }

    if (!hasWords) {
      console.warn(`[VocaDash] 미등록 또는 빈 스테이지(${nodeId}) 탭 감지됨 -> 안내 모달 표시`);
      window.showEmptyStageModal('🚧 단어장 준비 중! 곧 업데이트될 스테이지입니다.');
      return;
    }

    currentSelectedNodeId = nodeId;
    window.currentSelectedNodeId = nodeId;
    window.currentGameLessonId = nodeId;
    window.currentLessonId = nodeId;
    if (nodeId !== 'node-review' && !String(nodeId).includes('review')) {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }
    const isFootball = (window.activeCourseId === 'pack_football');
    const courseId = isFootball ? 'pack_football' : (window.currentCourseId || 'basic');
    let data = null;
    let matchedNode = null;

    const activeCourse = (typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : (window.packFootballData || window.courseData_es || window.courseData);
    const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const curUnitLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(curLang) : 1) || 1;
    let curUnit = null;

    if (activeCourse && Array.isArray(activeCourse.units)) {
      curUnit = activeCourse.units.find(u => (u.id === curUnitLevel || u.unitId === curUnitLevel || u.unitNumber === curUnitLevel)) || activeCourse.units[0];
      if (curUnit && Array.isArray(curUnit.nodes)) {
        if (nodeId === 'node-1') {
          matchedNode = curUnit.nodes.find(x => x.stageNumber === 1 || (x.id && x.id.endsWith('_n1')));
        } else if (nodeId === 'node-2') {
          matchedNode = curUnit.nodes.find(x => x.stageNumber === 2 || (x.id && (x.id.endsWith('_n2') || x.id.endsWith('_n3'))));
        } else if (nodeId === 'node-3') {
          // 💡 [핵심 버그 수정] 약점 복습(_n4, review) 절대 배제, 오직 순수 3과(stageNumber 3, _n5)만 정밀 매칭
          matchedNode = curUnit.nodes.find(x => (x.stageNumber === 3 || (x.id && (x.id.endsWith('_n5') || x.id.endsWith('-n3')))) && x.type !== 'review' && !x.id?.includes('review'));
          if (!matchedNode) {
            matchedNode = curUnit.nodes.find(x => x.stageNumber === 3 && x.type !== 'review');
          }
        } else if (nodeId === 'node-boss' || String(nodeId).includes('boss')) {
          matchedNode = curUnit.nodes.find(x => x.type === 'boss' || (x.id && x.id.endsWith('_n6')) || (x.id && x.id.includes('boss')));
        } else {
          matchedNode = curUnit.nodes.find(x => x.id === nodeId);
        }

        if (matchedNode) {
          let nodeTitle = matchedNode.title;
          if (nodeId === 'node-3' && (!nodeTitle || nodeTitle.includes('복습') || nodeTitle.includes('Review'))) {
            nodeTitle = `${curUnit.unitNumber || curUnitLevel || 1}과: 자기소개와 소통`;
          }

          let nodeDesc = matchedNode.meaning
            ? `${matchedNode.targetSentence || ''} (${matchedNode.meaning})`
            : (matchedNode.desc || curUnit.desc || curUnit.subtitle || '핵심 어휘와 문장을 마스터하세요!');

          if (nodeId === 'node-3' && (nodeDesc.includes('복습') || nodeDesc.includes('오답') || !matchedNode.meaning)) {
            // 3과 실제 어휘 주제(자기소개와 소통 등) 설명 노출
            nodeDesc = matchedNode.desc || curUnit.desc || '자기소개와 일상 소통을 위한 핵심 표현을 마스터하세요!';
          }

          data = {
            title: nodeTitle,
            desc: nodeDesc,
            icon: curUnit.icon || activeCourse.icon || (isFootball ? '⚽' : '🌱')
          };
        }
      }
      if (!data && activeCourse.lessons && activeCourse.lessons[nodeId]) {
        data = activeCourse.lessons[nodeId];
      }
    }

    // 💡 [보스 판정 및 유닛 번호 추출]
    const isBossNode = (nodeId === 'node-boss' || String(nodeId).includes('boss') || (matchedNode && matchedNode.type === 'boss'));
    const coords = (typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(nodeId) : null;
    const unitX = (coords && coords.unitIndex) || (matchedNode && matchedNode.unitNumber) || curUnit?.unitNumber || curUnitLevel || 1;

    if (isBossNode) {
      data = {
        title: `Unit ${unitX} 총괄 보스전`,
        desc: '이번 유닛에서 배운 모든 단어가 총출동합니다!<br>단판 승부로 다음 유닛을 해금하세요.',
        icon: '👑'
      };
    }

    if (!data || (nodeId === 'node-3' && (data.title?.includes('복습') || data.title?.includes('Review')))) {
      const lessons = (window.COURSE_LESSONS && window.COURSE_LESSONS[courseId]) || (COURSE_LESSONS && COURSE_LESSONS[courseId]) || (COURSE_LESSONS && COURSE_LESSONS.basic);
      data = (lessons && lessons[nodeId]) || (window.nodeLessonData && window.nodeLessonData[nodeId]);
      if (!data || (nodeId === 'node-3' && (data.title?.includes('복습') || data.title?.includes('Review')))) {
        data = {
          title: isBossNode ? `Unit ${unitX} 총괄 보스전` : '3과: 자기소개와 소통',
          desc: isBossNode ? '이번 유닛에서 배운 모든 단어가 총출동합니다!<br>단판 승부로 다음 유닛을 해금하세요.' : '자기소개와 일상 소통을 위한 핵심 표현을 마스터하세요!',
          icon: isBossNode ? '👑' : (isFootball ? '🏆' : '🌱')
        };
      }
    }


    // ⭕ 언어 및 코스 격리된 실제 진행도 계산
    const modalLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let modalPack = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + modalLang) : null) || 'main';
    modalPack = (modalPack === 'pack_football') ? 'pack_football' : 'main';

    let progress = 0;
    if (typeof getNodeProgress === 'function') {
      const p = getNodeProgress(nodeId, modalLang, modalPack);
      progress = p?.clearedCount || 0;
    }

    // 🛑 [핵심 버그 수정] 복습 노드 완료 직후 3번 노드가 실제로 플레이되지 않았는데 오염되어 1이 되어있는 경우 0으로 강제 보정
    // 🛑 [핵심 버그 수정] 복습 노드 완료 직후 3번 노드가 실제로 플레이되지 않았는데 오염되어 1이 되어있는 경우 0으로 강제 보정
    if (nodeId === 'node-3' || nodeId === 'u1_node-3' || nodeId === 'u1_stage-3') {
      let isActuallyCleared = false;
      try {
        const uData = JSON.parse(localStorage.getItem('vocadash_user_data') || '{}');
        if (uData && uData.clearedNodes && (
          (uData.clearedNodes['node-3'] && uData.clearedNodes['node-3'].actuallyPlayed) ||
          (uData.clearedNodes['u1_node-3'] && uData.clearedNodes['u1_node-3'].actuallyPlayed) ||
          (uData.clearedNodes['u1_stage-3'] && uData.clearedNodes['u1_stage-3'].actuallyPlayed)
        )) {
          isActuallyCleared = true;
        }
      } catch (_) { }

      if (!isActuallyCleared) {
        // 복습 완료로 인한 오염 잔여물이거나 미플레이 0회차 상태 보장
        progress = 0;
        try {
          localStorage.removeItem(`vocadash_prog_${modalLang}_${modalPack}_u1_n3`);
          localStorage.removeItem(`node_progress_${modalLang}_${modalPack}_node-3`);
          localStorage.removeItem(`node_progress_${modalLang}_${modalPack}_1_3`);
          localStorage.removeItem('u1_node-3');
          localStorage.removeItem('u1_stage-3');
        } catch (_) { }
        if (window.nodeProgressMap) {
          window.nodeProgressMap['node-3'] = 0;
          window.nodeProgressMap['u1_node-3'] = 0;
          window.nodeProgressMap['u1_stage-3'] = 0;
          window.nodeProgressMap[`${modalLang}_${modalPack}_u1_n3`] = 0;
        }
      }
    }

    progress = Math.max(0, Math.min(3, Number(progress) || 0));

    // 🎯 [UI 분기 처리] 보스 노드 전용 UI vs 일반 노드 UI
    const iconBox = el('lesson-modal-icon-box');
    const badgeEl = el('lesson-modal-badge');
    const progSection = el('lesson-modal-progress-section');
    const bossSection = el('lesson-modal-boss-section');
    const startBtn = el('lesson-start-btn');
    const startBtnIcon = el('lesson-start-btn-icon');
    const progBar = el('lesson-modal-progress-bar');

    if (isBossNode) {
      // 1) 아이콘 & 아이콘 박스 (강렬한 레드/로즈 톤)
      setText('lesson-modal-icon', data.icon || '👑');
      if (iconBox) {
        iconBox.className = 'w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-2xl shadow-sm ring-1 ring-rose-300 flex-shrink-0';
      }

      // 2) 상단 배지 (주황/빨강 배지: 🔥 FINAL BOSS EXAM)
      setText('lesson-modal-badge', '🔥 FINAL BOSS EXAM');
      if (badgeEl) {
        badgeEl.className = 'font-label-sm text-[11px] text-rose-600 font-black uppercase tracking-wider';
      }

      // 3) 타이틀 & 설명
      setText('lesson-modal-title', data.title || `Unit ${unitX} 총괄 보스전`);
      setText('lesson-modal-desc', data.desc || '이번 유닛에서 배운 모든 단어가 총출동합니다! 단판 승부로 다음 유닛을 해금하세요.');

      // 4) 진행 상태 0/3 영역 대체 -> 단판 조건 박스 노출
      if (progSection) {
        progSection.classList.add('hidden');
        progSection.style.display = 'none';
      }
      if (bossSection) {
        bossSection.classList.remove('hidden');
        bossSection.classList.add('flex');
        bossSection.style.display = 'flex';
      }
      setText('lesson-modal-boss-condition-badge', '🎯 단판 총괄 시험');
      setText('lesson-modal-boss-condition-text', '통과 기준: 80% 이상');

      // 5) 보상 배지 상향 (+50 XP, +30 💎)
      setText('lesson-modal-xp', '+50 XP');
      setText('lesson-modal-gems', '+30');

      // 6) 메인 CTA 버튼 (⚔️ 보스전 도전하기 & 강렬한 그라데이션)
      if (startBtn) {
        startBtn.className = 'w-full h-12 rounded-2xl font-label-lg text-base bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black flex items-center justify-center gap-2 shadow-[0_4px_0_#be123c,0_8px_18px_-2px_rgba(244,63,94,0.45)] active:translate-y-1 active:shadow-none transition-all cursor-pointer';
      }
      if (startBtnIcon) {
        startBtnIcon.style.display = 'none';
      }
      setText('lesson-start-btn-text', '⚔️ 보스전 도전하기');
    } else {
      // 🔄 일반 노드 복귀 처리
      // 1) 아이콘 & 아이콘 박스 복원
      setText('lesson-modal-icon', data.icon);
      if (iconBox) {
        iconBox.className = 'w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center font-black text-2xl shadow-sm ring-1 ring-secondary-container/40 flex-shrink-0';
      }

      // 2) 상단 배지 복원
      if (badgeEl) {
        badgeEl.className = 'font-label-sm text-[11px] text-secondary font-extrabold uppercase tracking-wide';
      }
      setText('lesson-modal-badge', `${nodeId === 'node-1' ? '1과' : nodeId === 'node-3' ? '3과' : '2과'} · ${progress >= 3 ? '레슨 완료' : '현재 도전 중'}`);

      // 3) 타이틀 & 설명 복원
      setText('lesson-modal-title', data.title);
      const descEl = document.getElementById('lesson-modal-desc');
      if (descEl) descEl.innerHTML = data.desc;

      // 4) 진행 상태 0/3 영역 복원

      if (progSection) {
        progSection.classList.remove('hidden');
        progSection.style.display = '';
      }
      if (bossSection) {
        bossSection.classList.add('hidden');
        bossSection.classList.remove('flex');
        bossSection.style.display = 'none';
      }
      setText('lesson-modal-progress-text', `${progress}/3`);
      if (progBar) {
        progBar.style.width = progress >= 3 ? '100%' : progress === 2 ? '67%' : progress === 1 ? '33%' : '0%';
        progBar.className = `h-full rounded-full transition-all duration-300 ${progress >= 3 ? 'bg-primary' : 'bg-secondary'}`;
      }

      // 5) 보상 배지 복원 (+20 XP, +10 💎)
      setText('lesson-modal-xp', '+20 XP');
      setText('lesson-modal-gems', '+10');

      // 6) 메인 CTA 버튼 복원 (에메랄드 그린)
      if (startBtn) {
        startBtn.className = 'w-full h-12 rounded-2xl font-label-lg text-base bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_0_#15803d,0_8px_16px_-2px_rgba(34,197,94,0.4)] active:translate-y-1 active:shadow-none transition-all cursor-pointer';
      }
      if (startBtnIcon) {
        startBtnIcon.textContent = 'play_arrow';
        startBtnIcon.style.display = '';
      }
      setText('lesson-start-btn-text', progress >= 3 ? '복습 시작하기' : progress === 2 ? '마지막 레슨 도전!' : progress === 1 ? '다음 레슨 계속하기' : '학습 시작하기');
    }

    if (lessonBackdrop) {
      lessonBackdrop.classList.remove('opacity-0', 'pointer-events-none');
      lessonBackdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (lessonSheet) {
      lessonSheet.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');
      lessonSheet.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto', 'scale-100');
    }
  };
  window.showLessonModal = window.openLessonModal;
  window.openLessonPreview = window.openLessonModal;

  window.closeLessonModal = function () {
    if (lessonBackdrop) {
      lessonBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
      lessonBackdrop.classList.add('opacity-0', 'pointer-events-none');
    }
    if (lessonSheet) {
      lessonSheet.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto', 'scale-100');
      lessonSheet.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');
    }
  };

  // 전체 코스 맵 유닛 프리셋 정의 (1~10 유닛)
  const UNIT_LIST_PRESETS = {
    es: [
      { unit: 1, title: '생존 첫걸음', subtitle: '인사, 감사, 숫자 등 기초 표현 마스터', progress: 60, status: 'active', icon: '🇪🇸' },
      { unit: 2, title: '카페 & 주문', subtitle: '커피, 타파스, 메뉴 주문 & 계산', progress: 0, status: 'locked', icon: '☕' },
      { unit: 3, title: '길찾기 & 교통', subtitle: '지하철, 버스, 택시 & 위치 묻기', progress: 0, status: 'locked', icon: '🧭' },
      { unit: 4, title: '쇼핑 & 환전', subtitle: '가격 흥정, 사이즈 & 결제 표현', progress: 0, status: 'locked', icon: '🛍️' },
      { unit: 5, title: '호텔 & 숙소', subtitle: '체크인, 룸서비스 & 어메니티 요청', progress: 0, status: 'locked', icon: '🏨' },
      { unit: 6, title: '병원 & 약국', subtitle: '증상 설명, 응급처치 & 분실물 신고', progress: 0, status: 'locked', icon: '🏥' },
      { unit: 7, title: '친구 사귀기 & 취미', subtitle: '자기소개, 취향 & 주말 약속', progress: 0, status: 'locked', icon: '🎉' },
      { unit: 8, title: '날씨 & 일상 대화', subtitle: '사계절, 감정 표현 & 스몰토크', progress: 0, status: 'locked', icon: '☀️' },
      { unit: 9, title: '비즈니스 기초', subtitle: '이메일, 오피스 미팅 & 명함 교환', progress: 0, status: 'locked', icon: '💼' },
      { unit: 10, title: '현지 문화 & 관용구', subtitle: '스페인 속담, 슬랭 & 마스터 시험', progress: 0, status: 'locked', icon: '👑' }
    ],
    en: [
      { unit: 1, title: '생존 첫걸음', subtitle: 'Greeting, Thanks & Numbers Master', progress: 60, status: 'active', icon: '🇺🇸' },
      { unit: 2, title: '카페 & 주문', subtitle: 'Cafe, Food Ordering & The Check', progress: 0, status: 'locked', icon: '☕' },
      { unit: 3, title: '길찾기 & 교통', subtitle: 'Subway, Taxi & Asking Directions', progress: 0, status: 'locked', icon: '🧭' },
      { unit: 4, title: '쇼핑 & 환전', subtitle: 'Prices, Sizing & Credit Card', progress: 0, status: 'locked', icon: '🛍️' },
      { unit: 5, title: '호텔 & 숙소', subtitle: 'Check-in, Amenities & Front Desk', progress: 0, status: 'locked', icon: '🏨' },
      { unit: 6, title: '병원 & 약국', subtitle: 'Symptoms, Pharmacy & Emergencies', progress: 0, status: 'locked', icon: '🏥' },
      { unit: 7, title: '친구 사귀기 & 취미', subtitle: 'Small Talk, Hobbies & Weekend', progress: 0, status: 'locked', icon: '🎉' },
      { unit: 8, title: '날씨 & 일상 대화', subtitle: 'Weather, Mood & Daily Life', progress: 0, status: 'locked', icon: '☀️' },
      { unit: 9, title: '비즈니스 기초', subtitle: 'Emails, Business Meetings & Office', progress: 0, status: 'locked', icon: '💼' },
      { unit: 10, title: '현지 문화 & 관용구', subtitle: 'Native Idioms, Slang & Master Exam', progress: 0, status: 'locked', icon: '👑' }
    ]
  };
  window.UNIT_LIST_PRESETS = UNIT_LIST_PRESETS;

  // ===================================================
  // 보너스 선물(type: bonus) 1회 한정 수령 및 재수령 방지 상태 관리
  // ===================================================
  function getClaimedBonuses() {
    if (window.activeCourseId === 'main') {
      try {
        const raw = localStorage.getItem('vocadash_claimed_bonuses');
        if (raw === null) {
          const prog = getCourseProgress('main');
          if (prog.claimedBonuses && prog.claimedBonuses.length > 0) {
            prog.claimedBonuses = [];
            saveCourseProgress(prog, 'main');
            return [];
          }
        }
      } catch (_) { }
    }
    const prog = getCourseProgress(window.activeCourseId);
    return Array.isArray(prog.claimedBonuses) ? prog.claimedBonuses : [];
  }
  function isBonusClaimed(nodeId = 'node-bonus') {
    return getClaimedBonuses().includes(nodeId);
  }
  function markBonusClaimed(nodeId = 'node-bonus') {
    try {
      let list = [];
      const raw = localStorage.getItem('vocadash_claimed_bonuses');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
      if (!list.includes(nodeId)) list.push(nodeId);
      localStorage.setItem('vocadash_claimed_bonuses', JSON.stringify(list));
    } catch (_) { }
    const prog = getCourseProgress(window.activeCourseId);
    if (!prog.claimedBonuses) prog.claimedBonuses = [];
    if (!prog.claimedBonuses.includes(nodeId)) {
      prog.claimedBonuses.push(nodeId);
      saveCourseProgress(prog, window.activeCourseId);
    }
  }
  window.getClaimedBonuses = getClaimedBonuses;
  window.isBonusClaimed = isBonusClaimed;
  window.markBonusClaimed = markBonusClaimed;

  // ===================================================
  // 🛡️ [복습 노드 네임스페이스 및 마이그레이션 관리]
  // ===================================================
  function migrateLegacyReviewData() {
    try {
      const legacyReview = localStorage.getItem('vocadash_review_completed_node-review');
      if (legacyReview === 'true') {
        localStorage.setItem('vocadash_review_completed_u1_node-review', 'true');
        localStorage.setItem('vocadash_review_completed_u1-review', 'true');
        if (!window.nodeProgressMap) window.nodeProgressMap = {};
        window.nodeProgressMap['u1_node-review'] = 1;
        window.nodeProgressMap['u1_review'] = 1;
        window.nodeProgressMap['node-review'] = 1;
      }
      const prog = getCourseProgress(window.activeCourseId);
      if (Array.isArray(prog.completedReviews)) {
        if (prog.completedReviews.includes('node-review') && !prog.completedReviews.includes('u1_node-review')) {
          prog.completedReviews.push('u1_node-review');
          saveCourseProgress(prog, window.activeCourseId);
        }
      }
    } catch (_) { }
  }
  window.migrateLegacyReviewData = migrateLegacyReviewData;

  function isReviewNodeCompleted(nodeId = 'node-review', unitId = null) {
    let uIndex = unitId;
    if (!uIndex) {
      const coords = (typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(nodeId) : null;
      if (coords && coords.unitIndex) {
        uIndex = coords.unitIndex;
      } else {
        uIndex = 1;
      }
    }
    const compositeKey = `u${uIndex}_node-review`;
    const specificKey = `u${uIndex}-review`;
    const altKey = `u${uIndex}_review`;
    const isGenericReviewId = (nodeId === 'node-review' || nodeId === 'review');
    const allowRawNodeIdCheck = nodeId && (!isGenericReviewId || uIndex === 1);

    // 1) localStorage 직접 플래그 검사 (유닛 네임스페이스 격리)
    try {
      if (localStorage.getItem(`vocadash_review_completed_${compositeKey}`) === 'true') return true;
      if (allowRawNodeIdCheck && localStorage.getItem(`vocadash_review_completed_${nodeId}`) === 'true') return true;
      if (localStorage.getItem(`vocadash_review_completed_${specificKey}`) === 'true') return true;
      if (localStorage.getItem(`vocadash_review_completed_${altKey}`) === 'true') return true;
      // ⚠️ Unit 1 구버전 잔여 데이터 호환 (오직 1유닛일 때만 fallback 허용!)
      if (uIndex === 1 && localStorage.getItem('vocadash_review_completed_node-review') === 'true') return true;
    } catch (_) { }

    // 2) CourseProgress 검사
    const prog = getCourseProgress(window.activeCourseId);
    if (Array.isArray(prog.completedReviews)) {
      if (prog.completedReviews.includes(compositeKey) ||
        prog.completedReviews.includes(specificKey) ||
        (allowRawNodeIdCheck && prog.completedReviews.includes(nodeId)) ||
        (uIndex === 1 && prog.completedReviews.includes('node-review'))) {
        return true;
      }
    }

    // 3) user_data.clearedNodes 검사
    try {
      const rawUserData = localStorage.getItem('vocadash_user_data');
      if (rawUserData) {
        const u = JSON.parse(rawUserData);
        if (u.clearedNodes) {
          if (u.clearedNodes[compositeKey]?.cleared ||
            u.clearedNodes[specificKey]?.cleared ||
            (allowRawNodeIdCheck && u.clearedNodes[nodeId]?.cleared) ||
            (uIndex === 1 && u.clearedNodes['node-review']?.cleared)) {
            return true;
          }
        }
      }
    } catch (_) { }

    // 4) cleared_nodes 리스트 검사
    try {
      const rawList = localStorage.getItem('vocadash_cleared_nodes');
      if (rawList) {
        const list = JSON.parse(rawList);
        if (Array.isArray(list)) {
          if (list.includes(compositeKey) ||
            list.includes(specificKey) ||
            (allowRawNodeIdCheck && list.includes(nodeId)) ||
            (uIndex === 1 && list.includes('node-review'))) {
            return true;
          }
        }
      }
    } catch (_) { }

    // 5) window.nodeProgressMap 검사
    if (window.nodeProgressMap) {
      if (window.nodeProgressMap[compositeKey] >= 1 ||
        window.nodeProgressMap[specificKey] >= 1 ||
        (allowRawNodeIdCheck && window.nodeProgressMap[nodeId] >= 1) ||
        (uIndex === 1 && window.nodeProgressMap['node-review'] >= 1)) {
        return true;
      }
    }

    // 6) getNodeProgress 검사
    try {
      if (typeof getNodeProgress === 'function') {
        const p1 = getNodeProgress(compositeKey);
        if (p1 && p1.clearedCount >= 1) return true;
        if (allowRawNodeIdCheck && nodeId !== compositeKey) {
          const p2 = getNodeProgress(nodeId);
          if (p2 && p2.clearedCount >= 1) return true;
        }
        if (uIndex === 1) {
          const pDef = getNodeProgress('node-review');
          if (pDef && pDef.clearedCount >= 1) return true;
        }
      }
    } catch (_) { }

    return false;
  }

  function markReviewNodeCompleted(nodeId = 'node-review', unitId = null) {
    let uIndex = unitId;
    if (!uIndex) {
      const coords = (typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(nodeId) : null;
      if (coords && coords.unitIndex) {
        uIndex = coords.unitIndex;
      } else {
        uIndex = 1;
      }
    }
    const compositeKey = `u${uIndex}_node-review`;
    const isGenericReviewId = (nodeId === 'node-review' || nodeId === 'review');
    const allowRawNodeId = nodeId && (!isGenericReviewId || uIndex === 1);

    try {
      localStorage.setItem(`vocadash_review_completed_${compositeKey}`, 'true');
      if (allowRawNodeId && nodeId !== compositeKey) {
        localStorage.setItem(`vocadash_review_completed_${nodeId}`, 'true');
      }
      if (uIndex === 1) {
        localStorage.setItem('vocadash_review_completed_node-review', 'true');
      }
    } catch (_) { }

    const prog = getCourseProgress(window.activeCourseId);
    if (!prog.completedReviews) prog.completedReviews = [];
    if (!prog.completedReviews.includes(compositeKey)) {
      prog.completedReviews.push(compositeKey);
    }
    if (allowRawNodeId && !prog.completedReviews.includes(nodeId)) {
      prog.completedReviews.push(nodeId);
    }
    if (uIndex === 1 && !prog.completedReviews.includes('node-review')) {
      prog.completedReviews.push('node-review');
    }
    saveCourseProgress(prog, window.activeCourseId);
  }

  function completeReviewNode(nodeId = 'node-review', unitId = null) {
    let targetId = nodeId || 'node-review';
    let uIndex = unitId;
    if (!uIndex) {
      const coords = (typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(targetId) : null;
      if (coords && coords.unitIndex) {
        uIndex = coords.unitIndex;
      } else if (window.currentReviewUnitNumber) {
        uIndex = window.currentReviewUnitNumber;
      } else if (window.currentUnitNumber) {
        uIndex = window.currentUnitNumber;
      } else {
        uIndex = 1;
      }
    }
    const compositeKey = `u${uIndex}_node-review`;
    const isGenericReviewId = (targetId === 'node-review' || targetId === 'review');
    const allowRawTargetId = targetId && (!isGenericReviewId || uIndex === 1);
    console.log(`✅ [Review Node Complete] 약점 복습 완료 처리 시작: ${compositeKey} (unit: ${uIndex}, raw: ${targetId})`);

    if (typeof markReviewNodeCompleted === 'function') {
      markReviewNodeCompleted(compositeKey, uIndex);
      if (allowRawTargetId && targetId !== compositeKey) {
        markReviewNodeCompleted(targetId, uIndex);
      }
    }

    // 1) nodeProgress 등록
    const progressData = { cleared: true, clearedCount: 1, stars: 3 };
    try {
      localStorage.setItem(`vocadash_node_progress_${compositeKey}`, JSON.stringify(progressData));
      if (uIndex === 1) {
        localStorage.setItem('vocadash_node_progress_node-review', JSON.stringify(progressData));
      }
    } catch (_) { }

    if (!window.nodeProgressMap) window.nodeProgressMap = {};
    window.nodeProgressMap[compositeKey] = 1;
    window.nodeProgressMap[`u${uIndex}_review`] = 1;
    if (uIndex === 1) {
      window.nodeProgressMap['node-review'] = 1;
    }

    if (!window.completedStages) window.completedStages = [];
    if (!window.completedStages.includes(compositeKey)) window.completedStages.push(compositeKey);
    if (!window.completedStages.includes(`u${uIndex}_review`)) window.completedStages.push(`u${uIndex}_review`);
    if (uIndex === 1 && !window.completedStages.includes('node-review')) window.completedStages.push('node-review');
    try {
      localStorage.setItem('vocadash_completed_stages', JSON.stringify(window.completedStages));
    } catch (_) { }

    // 🛑 [핵심 버그 수정] 3번 노드 오염 완전 방어 (오직 유닛 1에 대해서만 실행):
    // 복습 노드가 완료될 때 node-3의 진행도는 절대 1로 올리지 않고 순수 0회차 미클리어 상태(0/3)를 유지.
    if (uIndex === 1) {
      const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const curCourse = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + curLang) : null) || 'main';
      const packCourse = (curCourse === 'pack_football') ? 'pack_football' : 'main';

      let n3Progress = 0;
      try {
        const rawN3 = localStorage.getItem(`vocadash_prog_${curLang}_${packCourse}_u1_n3`) || localStorage.getItem(`node_progress_${curLang}_${packCourse}_node-3`);
        if (rawN3) n3Progress = parseInt(rawN3, 10) || 0;
      } catch (_) { }

      if (n3Progress <= 0) {
        try {
          localStorage.removeItem(`vocadash_prog_${curLang}_${packCourse}_u1_n3`);
          localStorage.removeItem(`node_progress_${curLang}_${packCourse}_node-3`);
          localStorage.removeItem(`node_progress_${curLang}_${packCourse}_1_3`);
          localStorage.removeItem('vocadash_prog_es_main_u1_n3');
          localStorage.removeItem('node_progress_es_main_node-3');
          localStorage.removeItem('node_progress_es_main_1_3');
        } catch (_) { }

        if (window.nodeProgressMap) {
          window.nodeProgressMap['node-3'] = 0;
          window.nodeProgressMap[`${curLang}_${packCourse}_u1_n3`] = 0;
          window.nodeProgressMap['u1_stage-3'] = 0;
          window.nodeProgressMap['u1_node-3'] = 0;
          window.nodeProgressMap['u1_n3'] = 0;
          if (packCourse === 'pack_football') {
            window.nodeProgressMap['fb_1_n5'] = 0;
          } else {
            window.nodeProgressMap[`${curLang}_1_n3`] = 0;
          }
        }
      }
    }

    // 2) localStorage clearedNodes 목록에 등록하고, 미완료 시 잔여 node-3 오염 삭제
    try {
      const rawUserData = localStorage.getItem('vocadash_user_data');
      let userData = rawUserData ? JSON.parse(rawUserData) : {};
      if (!userData.clearedNodes) userData.clearedNodes = {};
      userData.clearedNodes[compositeKey] = { cleared: true, clearedCount: 1 };
      if (uIndex === 1) {
        userData.clearedNodes['node-review'] = { cleared: true, clearedCount: 1 };
        let n3Progress = 0;
        try {
          const rawN3 = localStorage.getItem('vocadash_prog_es_main_u1_n3');
          if (rawN3) n3Progress = parseInt(rawN3, 10) || 0;
        } catch (_) { }
        if (n3Progress <= 0) {
          delete userData.clearedNodes['node-3'];
          delete userData.clearedNodes['es_1_n5'];
          delete userData.clearedNodes['fb_1_n5'];
        }
      }
      localStorage.setItem('vocadash_user_data', JSON.stringify(userData));
    } catch (_) { }

    try {
      const rawList = localStorage.getItem('vocadash_cleared_nodes');
      let list = rawList ? JSON.parse(rawList) : [];
      if (!Array.isArray(list)) list = [];
      if (!list.includes(compositeKey)) list.push(compositeKey);
      if (uIndex === 1) {
        if (!list.includes('node-review')) list.push('node-review');
        list = list.filter(item => item !== 'node-3' && item !== 'es_1_n5' && item !== 'fb_1_n5');
      }
      localStorage.setItem('vocadash_cleared_nodes', JSON.stringify(list));
    } catch (_) { }

    // 3) 로드맵 UI 갱신 (복습 완료 마크 및 3번 노드 START 뱃지 정상 갱신)
    if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
    if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
    if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
  }
  window.isReviewNodeCompleted = isReviewNodeCompleted;
  window.markReviewNodeCompleted = markReviewNodeCompleted;
  window.completeReviewNode = completeReviewNode;



  function handleClaimBonus(nodeId = 'node-bonus', unitNum = 1) {
    const isUnlocked = (unitNum === 1)
      ? (resolveNodeData('fb_1_n1', 'node-1').clearedCount >= 1 || (window.nodeProgressMap && window.nodeProgressMap['node-1'] >= 1))
      : isNodeUnlocked(unitNum - 1, 1, { type: 'bonus', id: nodeId });

    if (!isUnlocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('1과를 먼저 완료해야 열려요! 🔒');
      }
      return;
    }

    if (isBonusClaimed(nodeId)) {
      if (typeof window.showToast === 'function') {
        window.showToast('이미 수령한 보너스 선물입니다. 📦');
      }
      return;
    }

    let curGems = 120;
    try {
      const saved = localStorage.getItem('vocadash_gems');
      if (saved !== null) curGems = parseInt(saved, 10) || 120;
    } catch (_) { }
    curGems += 15;
    try {
      localStorage.setItem('vocadash_gems', String(curGems));
    } catch (_) { }
    const gemsCountEl = el('header-gems-count');
    if (gemsCountEl) gemsCountEl.textContent = curGems;

    if (typeof window.playSound === 'function') window.playSound('gem');
    markBonusClaimed(nodeId);

    if (typeof window.showToast === 'function') {
      window.showToast('🎁 보너스 선물 도착! 보석 +15개를 획득했습니다! 💎', '🎉');
    }
    if (typeof window.openBonusModal === 'function') {
      window.openBonusModal(nodeId);
    }

    if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
    if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
  }
  window.handleClaimBonus = handleClaimBonus;

  function handleReviewNodeClick(nodeId = 'node-review', unitNum = 1) {
    const bonusId = (unitNum === 1) ? 'node-bonus' : `u${unitNum}-bonus`;
    const isUnlocked = isBonusClaimed(bonusId);

    if (!isUnlocked) {
      if (typeof window.showToast === 'function') {
        window.showToast('보너스 선물상자를 먼저 수령해 주세요! 🎁');
      }
      return;
    }

    let weakWords = [];
    try {
      const savedWeak = localStorage.getItem('vocadash_weak_word_ids');
      if (savedWeak) {
        const parsed = JSON.parse(savedWeak);
        if (Array.isArray(parsed)) weakWords = parsed.filter(Boolean);
      }
    } catch (_) { }

    if (weakWords.length > 0) {
      if (typeof openReviewSpeedrunModal === 'function') {
        openReviewSpeedrunModal();
      } else if (typeof startRoadmapReviewSpeedrun === 'function') {
        startRoadmapReviewSpeedrun();
      } else if (typeof window.showToast === 'function') {
        window.showToast('⚡ 오답 단어 복습 세션을 시작합니다!');
      }
    } else {
      markReviewNodeCompleted(nodeId);

      let curXp = 0;
      try {
        const savedXp = localStorage.getItem('vocadash_user_xp');
        if (savedXp) curXp = parseInt(savedXp, 10) || 0;
        curXp += 10;
        localStorage.setItem('vocadash_user_xp', String(curXp));
      } catch (_) { }
      const headerXpEl = el('header-exp-count');
      if (headerXpEl) headerXpEl.textContent = curXp;

      if (typeof window.showToast === 'function') {
        window.showToast('멋져요! 틀린 단어가 없어 약점 복습을 패스합니다. (+10 XP) ✨', '🎉');
      }

      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
    }
  }
  window.handleReviewNodeClick = handleReviewNodeClick;

  // 상단 유닛 카드 배너 (Unit Banner) 동적 동기화 함수
  function updateTopUnitBanner(activeIdx) {
    const activeCourse = getCurrentCourseData();
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const courseId = window.currentCourseId || 'basic';
    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang) : 1;

    let units = (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS[lang]) || UNIT_LIST_PRESETS[lang] || UNIT_LIST_PRESETS.es;
    if (activeCourse && Array.isArray(activeCourse.units) && activeCourse.units.length > 0) {
      units = activeCourse.units;
    }
    const totalUnits = units.length || 10;
    const targetIdx = (typeof activeIdx === 'number' && !isNaN(activeIdx))
      ? Math.max(0, Math.min(totalUnits - 1, activeIdx))
      : (window._currentVisibleUnitIndex !== undefined ? window._currentVisibleUnitIndex : Math.max(0, Math.min(totalUnits - 1, unlockedLevel - 1)));
    const targetUnit = units[targetIdx] || units[0];

    const unitSubBadge = el('unit-sub-badge');
    const unitLangBadge = el('unit-lang-badge');
    const unitMainTitle = el('unit-main-title');
    const unitProgressBar = el('unit-progress-bar');
    const unitThumbIcon = el('unit-thumb-icon');

    const isFootball = (window.activeCourseId === 'pack_football' || (activeCourse && (activeCourse.id === 'pack_football' || activeCourse.courseId === 'pack_football')));

    if (unitSubBadge) {
      unitSubBadge.textContent = `UNIT ${targetIdx + 1} / ${totalUnits}`;
    }

    if (isFootball) {
      const fbData = window.packFootballData;
      const fbCourseName = (fbData && fbData.courseName) || '스페인 축구 실전팩';
      const fbBadge = (fbData && fbData.badge) || '스페셜 팩';
      if (unitLangBadge) unitLangBadge.textContent = `⚽ ${fbBadge}`;
      if (unitThumbIcon) unitThumbIcon.textContent = targetUnit?.icon || '⚽';
      if (unitMainTitle) {
        unitMainTitle.textContent = targetUnit ? `${fbCourseName} · ${targetUnit.title}` : fbCourseName;
      }
    } else {
      if (targetIdx === 0) {
        if (unitLangBadge) {
          unitLangBadge.textContent = lang === 'en' ? '🇺🇸 영어 정규 코스' : '🇪🇸 스페인어 첫걸음';
        }
        if (unitThumbIcon) {
          unitThumbIcon.textContent = courseId === 'travel' ? '✈️' : (courseId === 'business' ? '💼' : (courseId === 'dele' || courseId === 'toeic' ? '🎓' : (lang === 'en' ? '🗽' : '🇪🇸')));
        }
        if (unitMainTitle) {
          if (courseId === 'travel') {
            unitMainTitle.textContent = lang === 'en' ? '일상 회화 & 실전 필수 어휘 마스터' : '일상 회화 & 실전 기초 어휘 마스터';
          } else if (courseId === 'dele') {
            unitMainTitle.textContent = 'DELE A1~B2 등급별 실전 어휘';
          } else if (courseId === 'toeic') {
            unitMainTitle.textContent = '토익/오픽 필수 빈출 어휘 마스터';
          } else if (courseId === 'business') {
            unitMainTitle.textContent = '글로벌 비즈니스 실전 커뮤니케이션';
          } else {
            unitMainTitle.textContent = lang === 'en' ? '일상 회화 & 실전 필수 어휘 마스터' : '일상 회화 & 실전 기초 어휘 마스터';
          }
        }
      } else {
        if (unitLangBadge) {
          unitLangBadge.textContent = lang === 'en' ? `🇺🇸 영어 : ${targetUnit.title}` : `🇪🇸 스페인어 : ${targetUnit.title}`;
        }
        if (unitThumbIcon) {
          unitThumbIcon.textContent = targetUnit.icon || (lang === 'en' ? '🗽' : '🇪🇸');
        }
        if (unitMainTitle) {
          const sub = targetUnit.desc || targetUnit.subtitle || '';
          unitMainTitle.textContent = sub ? `${targetUnit.title} (${sub.split(',')[0].trim()})` : targetUnit.title;
        }
      }
    }

    if (unitProgressBar) {
      const curUnitNum = targetIdx + 1;
      let pct = 0;
      if (curUnitNum < unlockedLevel) {
        pct = 100;
      } else if (curUnitNum === unlockedLevel) {
        const prog1 = window.nodeProgressMap['node-1'] !== undefined ? window.nodeProgressMap['node-1'] : 0;
        const prog2 = window.nodeProgressMap['node-2'] || 0;
        const prog3 = window.nodeProgressMap['node-3'] || 0;
        const progBoss = window.nodeProgressMap['node-boss'] || 0;
        if (progBoss >= 3) pct = 100;
        else if (prog3 >= 3) pct = 85;
        else if (prog2 >= 3) pct = 65;
        else if (prog1 >= 3) pct = 35;
        else pct = 10;
      } else {
        pct = 0;
      }
      unitProgressBar.style.width = `${pct}%`;
    }
  }
  window.updateTopUnitBanner = updateTopUnitBanner;

  function updateRoadmapNodesUI() {
    if (typeof migrateLegacyReviewData === 'function') {
      migrateLegacyReviewData();
    }
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const courseId = window.currentCourseId || 'basic';
    const langPresets = COURSE_LESSONS[lang] || COURSE_LESSONS.es;
    const activeCourse = getCurrentCourseData();
    let lessons = (activeCourse && activeCourse.lessons) ? activeCourse.lessons : (langPresets[courseId] || langPresets.basic || COURSE_LESSONS.es.basic);

    // 상단 유닛 카드 배너 (Unit Banner) 동적 동기화
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let currentCoursePack = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentLang) : null) || 'main';
    currentCoursePack = (currentCoursePack === 'pack_football') ? 'pack_football' : 'main';

    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentLang, currentCoursePack) : 1;
    const bannerIdx = (window._currentVisibleUnitIndex !== undefined) ? window._currentVisibleUnitIndex : (unlockedLevel - 1);
    updateTopUnitBanner(bannerIdx);

    if (activeCourse && Array.isArray(activeCourse.units) && activeCourse.units[0]) {
      const curUnit = activeCourse.units[0];
      const unitNum = curUnit.unitNumber || 1;

      if (curUnit && Array.isArray(curUnit.nodes)) {
        const n1 = curUnit.nodes.find(n => n.stageNumber === 1 || (n.id && n.id.endsWith('_n1')));
        const n2 = curUnit.nodes.find(n => n.stageNumber === 2 || (n.id && (n.id.endsWith('_n2') || n.id.endsWith('_n3'))));
        const n3 = curUnit.nodes.find(n => (n.stageNumber === 3 || (n.id && (n.id.endsWith('_n5') || n.id.endsWith('-n3'))) || n.type === 'sentence') && n.type !== 'review' && !n.id?.includes('review') && !n.id?.endsWith('_n4'));
        const nBoss = curUnit.nodes.find(n => n.type === 'boss' || (n.id && n.id.endsWith('_n6')));
        lessons = {
          'node-1': { title: n1?.title || '1과 학습', desc: curUnit.subtitle || curUnit.desc, icon: curUnit.icon || '🌱' },
          'node-2': { title: n2?.title || '2과 학습', desc: curUnit.subtitle || curUnit.desc, icon: curUnit.icon || '🌱' },
          'node-3': { title: (n3?.title && !n3.title.includes('복습')) ? n3.title : '3과: 자기소개와 소통', desc: n3?.targetSentence || curUnit.subtitle || curUnit.desc, icon: '💬' },
          'node-boss': { title: nBoss?.title || `Unit ${unitNum} 보스전`, desc: '실전 테스트 & 특별 보상', icon: '👑' }
        };
      }
    }

    // ----------------------------------------------------
    // [노드 진행도 표준화 격리 조회: vocadash_prog_${lang}_${courseId}_u1_n${nodeIndex}]
    // ----------------------------------------------------
    const readProgForNode = (nIndex) => {
      const stdKey = `vocadash_prog_${currentLang}_${currentCoursePack}_u1_n${nIndex}`;
      let c = 0;
      try {
        const raw = localStorage.getItem(stdKey);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'number') c = parsed;
          else if (parsed && typeof parsed.clearedCount === 'number') c = parsed.clearedCount;
          else if (parsed && typeof parsed.stars === 'number') c = parsed.stars;
        }
      } catch (_) {
        const num = parseInt(localStorage.getItem(stdKey), 10);
        if (!isNaN(num)) c = num;
      }

      if (c === 0) {
        // 복합 키 및 대체 키 fallback 확인 (코스 격리 준수)
        const compNodeKey = `u1_node-${nIndex}`;
        const compStageKey = `u1_stage-${nIndex}`;
        const altKey = `node_progress_${currentLang}_${currentCoursePack}_node-${nIndex}`;
        const altCompKey = `node_progress_${currentLang}_${currentCoursePack}_u1_node-${nIndex}`;
        let rawAlt = localStorage.getItem(altKey) || localStorage.getItem(altCompKey);
        if (!rawAlt && currentCoursePack === 'main' && currentLang === 'es' && nIndex === 3) {
          rawAlt = localStorage.getItem(compNodeKey) || localStorage.getItem(compStageKey);
        }
        if (rawAlt !== null && rawAlt !== undefined) {
          try {
            const parsedAlt = JSON.parse(rawAlt);
            if (typeof parsedAlt === 'number') c = parsedAlt;
            else if (parsedAlt && typeof parsedAlt.clearedCount === 'number') c = parsedAlt.clearedCount;
            else if (parsedAlt && typeof parsedAlt.stars === 'number') c = parsedAlt.stars;
          } catch (_) {
            const numAlt = parseInt(rawAlt, 10);
            if (!isNaN(numAlt)) c = numAlt;
          }
        }
        if (c === 0 && window.nodeProgressMap) {
          c = Number(window.nodeProgressMap[altCompKey] || window.nodeProgressMap[altKey] || 0);
          if (c === 0 && currentCoursePack === 'main' && currentLang === 'es') {
            c = Number(window.nodeProgressMap[compNodeKey] || window.nodeProgressMap[compStageKey] || window.nodeProgressMap[`node-${nIndex}`] || 0);
          }
        }
      }

      return Math.max(0, Math.min(3, c));
    };

    const prog1 = readProgForNode(1);
    const prog2 = (prog1 >= 3) ? readProgForNode(2) : 0;
    const prog3 = (prog2 >= 3) ? readProgForNode(3) : 0;
    const progBoss = (prog3 >= 3) ? readProgForNode(6) : 0;

    // 현재 언어/코스에 격리된 진행도 맵 갱신
    if (!window.nodeProgressMap) window.nodeProgressMap = {};
    window.nodeProgressMap['node-1'] = prog1;
    window.nodeProgressMap['node-2'] = prog2;
    window.nodeProgressMap['node-3'] = prog3;
    window.nodeProgressMap['node-boss'] = progBoss;
    window.nodeProgressMap[`${currentLang}_${currentCoursePack}_u1_n1`] = prog1;
    window.nodeProgressMap[`${currentLang}_${currentCoursePack}_u1_n2`] = prog2;
    window.nodeProgressMap[`${currentLang}_${currentCoursePack}_u1_n3`] = prog3;
    window.nodeProgressMap[`${currentLang}_${currentCoursePack}_u1_n6`] = progBoss;
    window.nodeProgressMap['u1_stage-1'] = prog1;
    window.nodeProgressMap['u1_stage-2'] = prog2;
    window.nodeProgressMap['u1_stage-3'] = prog3;
    window.nodeProgressMap['u1_node-1'] = prog1;
    window.nodeProgressMap['u1_node-2'] = prog2;
    window.nodeProgressMap['u1_node-3'] = prog3;
    window.nodeProgressMap['u1_node-boss'] = progBoss;
    if (currentCoursePack === 'pack_football') {
      window.nodeProgressMap['fb_1_n1'] = prog1;
      window.nodeProgressMap['fb_1_n2'] = prog2;
      window.nodeProgressMap['fb_1_n3'] = prog2;
      window.nodeProgressMap['fb_1_n5'] = prog3;
      window.nodeProgressMap['fb_1_n6'] = progBoss;
    } else {
      window.nodeProgressMap[`${currentLang}_1_n1`] = prog1;
      window.nodeProgressMap[`${currentLang}_1_n2`] = prog2;
      window.nodeProgressMap[`${currentLang}_1_n3`] = prog3;
    }

    // 노드 해금 및 활성 판정
    const isBonusDone = (typeof isBonusClaimed === 'function') && isBonusClaimed('node-bonus');
    const isReviewDone = (typeof isReviewNodeCompleted === 'function') && isReviewNodeCompleted('u1_node-review', 1);
    const isNode1Active = (prog1 < 3);
    const isNode2Unlocked = (prog1 >= 3);
    const isNode2Active = (!isNode1Active && isNode2Unlocked && prog2 < 3);
    const isBonusUnlocked = (prog1 >= 3);
    const isBonusActive = (!isNode1Active && !isNode2Active && isBonusUnlocked && !isBonusDone);
    const isReviewUnlocked = (prog1 >= 3 && isBonusDone);
    const isReviewActive = (!isNode1Active && !isNode2Active && !isBonusActive && isReviewUnlocked && !isReviewDone);
    const isNode3Unlocked = (prog2 >= 3 && isBonusDone && isReviewDone);
    const isNode3Active = (!isNode1Active && !isNode2Active && !isBonusActive && !isReviewActive && isNode3Unlocked && prog3 < 3);
    const isBossUnlocked = (prog3 >= 3);
    // ----------------------------------------------------

    // Node 1 요소 레퍼런스 및 하단 둥근 뱃지 컨테이너 정밀 탐색
    const node1Container = el('node-1-container') || document.querySelector('[data-node-id="node-1"]');
    const target1 = el('node-1-target') || node1Container?.querySelector('#node-1-target');
    const ping1 = el('node-1-ping') || node1Container?.querySelector('#node-1-ping');
    const pulseRing1 = el('node-1-pulse-ring') || node1Container?.querySelector('#node-1-pulse-ring');
    const checkBadge1 = el('node-1-check-badge') || node1Container?.querySelector('#node-1-check-badge');
    const startPill1 = el('node-1-start-pill') || node1Container?.querySelector('#node-1-start-pill');
    const btn1 = el('node-1-btn') || node1Container?.querySelector('#node-1-btn');
    const card1 = el('node-1-label-card') || node1Container?.querySelector('#node-1-label-card') || node1Container?.querySelector('.rounded-full');
    let badge1 = el('node-1-label-badge') || card1?.querySelector('#node-1-label-badge') || card1?.querySelector('.flex') || node1Container?.querySelector('#node-1-label-badge');

    // 🐾 3단계 발바닥 점등 함수 (주황색 점등 버전)
    const getSimpleStarsHTML = (prog) => {
      const p = Number(prog) || 0;

      const renderPaw = (isActive) => {
        // 활성화 시 따뜻한 주황색(#f59e0b), 비활성화 시 연한 회색(#cbd5e1)
        const fillColor = isActive ? '#f59e0b' : '#cbd5e1';
        const opacity = isActive ? '1' : '0.35';
        const glowStyle = isActive
          ? 'filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.45)); transform: scale(1.15);'
          : 'transform: scale(1.0);';

        return `
          <div class="inline-flex items-center justify-center p-0.5" style="width: 18px; height: 18px;">
            <svg viewBox="0 0 44 42" class="transition-all duration-200" style="width: 100%; height: 100%; fill: ${fillColor}; opacity: ${opacity}; ${glowStyle}" xmlns="http://www.w3.org/2000/svg">
              <!-- 4개의 타원형 발가락 젤리 -->
              <ellipse cx="8.5" cy="13" rx="4.0" ry="5.6" transform="rotate(-26 8.5 13)"></ellipse>
              <ellipse cx="17.2" cy="7.2" rx="4.3" ry="6.2" transform="rotate(-8 17.2 7.2)"></ellipse>
              <ellipse cx="26.8" cy="7.2" rx="4.3" ry="6.2" transform="rotate(8 26.8 7.2)"></ellipse>
              <ellipse cx="35.5" cy="13" rx="4.0" ry="5.6" transform="rotate(26 35.5 13)"></ellipse>
              <!-- 하단 메인 젤리 패드 -->
              <path d="M 22 17.5 C 17.2 17.5 13.0 19.3 9.6 22.8 C 6.5 26.0 5.6 30.5 7.4 34.6 C 9.5 39.4 15.2 42.0 22 42.0 C 28.8 42.0 34.5 39.4 36.6 34.6 C 38.4 30.5 37.5 26.0 34.4 22.8 C 31.0 19.3 26.8 17.5 22 17.5 Z"></path>
            </svg>
          </div>
        `;
      };

      const paw1 = renderPaw(p >= 1);
      const paw2 = renderPaw(p >= 2);
      const paw3 = renderPaw(p >= 3);

      return `<div class="flex items-center justify-center gap-1.5 select-none py-0.5">${paw1}${paw2}${paw3}</div>`;
    };


    // 1번 노드 알약 뱃지 발바닥 UI 안전 주입 함수
    const syncNode1StarsBadge = (starsHtml) => {
      if (badge1) {
        badge1.innerHTML = starsHtml;
      }
      if (card1) {
        const innerBadge = card1.querySelector('#node-1-label-badge') || card1.querySelector('.flex') || badge1;
        if (innerBadge) {
          innerBadge.innerHTML = starsHtml;
        } else {
          card1.innerHTML = `<span id="node-1-title" class="hidden">1과</span><div id="node-1-label-badge" class="flex items-center gap-1">${starsHtml}</div>`;
        }
      }
    };

    if (prog1 >= 3) {
      if (node1Container) node1Container.classList.remove('active', 'node-pulse');
      if (ping1) ping1.classList.add('hidden');
      if (pulseRing1) pulseRing1.classList.add('hidden');
      if (startPill1) {
        startPill1.classList.add('hidden');
        startPill1.style.display = 'none';
      }
      if (checkBadge1) {
        checkBadge1.classList.remove('hidden');
        checkBadge1.style.display = 'flex';
      }
      if (target1) target1.dataset.nodeType = 'completed';

      if (btn1) {
        btn1.className = 'node-btn btn-3d relative w-[74px] h-[74px] rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white font-black text-2xl flex items-center justify-center border-b-[5px] border-emerald-800 shadow-[0_6px_14px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/40 active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden';
        btn1.title = '1과 (완료)';
        const stageNum1 = btn1.querySelector('.node-stage-num');
        if (stageNum1) {
          stageNum1.textContent = '1';
          stageNum1.className = 'node-stage-num font-black text-2xl select-none leading-none drop-shadow-xs relative z-10 text-white';
        }
      }
      if (card1) {
        card1.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border border-emerald-300 pointer-events-none';
      }
      syncNode1StarsBadge(getSimpleStarsHTML(prog1));
    } else if (isNode1Active) {
      if (node1Container) node1Container.classList.add('active', 'node-pulse');
      if (ping1) ping1.classList.remove('hidden');
      if (pulseRing1) pulseRing1.classList.remove('hidden');
      if (startPill1) {
        startPill1.classList.add('hidden');
        startPill1.style.display = 'none';
      }
      if (checkBadge1) {
        checkBadge1.classList.add('hidden');
        checkBadge1.style.display = 'none';
      }
      if (target1) target1.dataset.nodeType = 'active';

      if (btn1) {
        btn1.className = 'node-btn btn-3d relative w-[76px] h-[76px] rounded-full bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-black text-2xl flex items-center justify-center border-b-[6px] border-blue-800 shadow-[0_8px_20px_rgba(2,132,199,0.45)] ring-4 ring-sky-300/70 active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden';
        btn1.title = '1과';
        const stageNum1 = btn1.querySelector('.node-stage-num');
        if (stageNum1) {
          stageNum1.textContent = prog1 > 0 ? '1' : 'START';
          stageNum1.className = prog1 > 0
            ? 'node-stage-num font-black text-2xl select-none leading-none drop-shadow-xs relative z-10 text-white'
            : 'node-stage-num text-sm font-extrabold tracking-tight select-none leading-none drop-shadow-xs relative z-10 text-white';
        }
      }
      if (card1) {
        card1.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border-2 border-sky-400 pointer-events-none ring-2 ring-sky-100';
      }
      syncNode1StarsBadge(getSimpleStarsHTML(prog1));
    } else {
      if (node1Container) node1Container.classList.remove('active', 'node-pulse');
      if (ping1) ping1.classList.add('hidden');
      if (pulseRing1) pulseRing1.classList.add('hidden');
      if (startPill1) {
        startPill1.classList.add('hidden');
        startPill1.style.display = 'none';
      }
      if (checkBadge1) {
        checkBadge1.classList.add('hidden');
        checkBadge1.style.display = 'none';
      }
      if (target1) target1.dataset.nodeType = 'active';

      if (btn1) {
        btn1.className = 'node-btn btn-3d relative w-[74px] h-[74px] rounded-full bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-black text-2xl flex items-center justify-center border-b-[5px] border-blue-800 shadow-md active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden';
        btn1.title = '1과';
        const stageNum1 = btn1.querySelector('.node-stage-num');
        if (stageNum1) {
          stageNum1.textContent = '1';
          stageNum1.className = 'node-stage-num font-black text-2xl select-none leading-none drop-shadow-xs relative z-10 text-white';
        }
      }
      if (card1) {
        card1.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border border-sky-300 pointer-events-none';
      }
      syncNode1StarsBadge(getSimpleStarsHTML(prog1));
    }

    // Node 2 요소 레퍼런스
    const node2Container = el('node-2-container');
    const banner2 = el('node-2-start-banner');
    const target2 = el('node-2-target');
    const ping2 = el('node-2-ping');
    const pulseRing2 = el('node-2-pulse-ring');
    const checkBadge2 = el('node-2-check-badge');
    const lockBadge2 = el('node-2-lock-badge');
    const badge2 = el('node-2-label-badge');
    const btn2 = el('node-2-btn');
    const card2 = el('node-2-label-card');
    const startPill2 = el('node-2-start-pill');

    if (prog2 >= 3) {
      if (node2Container) {
        node2Container.classList.remove('opacity-80', 'active', 'node-pulse');
        node2Container.classList.add('opacity-100');
        node2Container.style.opacity = '1';
      }
      if (banner2) banner2.classList.add('hidden');
      if (ping2) ping2.classList.add('hidden');
      if (pulseRing2) pulseRing2.classList.add('hidden');
      if (startPill2) {
        startPill2.classList.add('hidden');
        startPill2.style.display = 'none';
      }
      if (lockBadge2) {
        lockBadge2.classList.add('hidden');
        lockBadge2.style.display = 'none';
      }
      if (checkBadge2) {
        checkBadge2.classList.remove('hidden');
        checkBadge2.style.display = 'flex';
      }
      if (target2) {
        target2.dataset.nodeType = 'completed';
        target2.removeAttribute('data-lock-msg');
        target2.removeAttribute('data-lock-icon');
      }

      if (btn2) {
        btn2.className = 'node-btn btn-3d relative w-[74px] h-[74px] rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white font-black text-2xl flex items-center justify-center border-b-[5px] border-emerald-800 shadow-[0_6px_14px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/40 active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden';
        btn2.title = '2과 (완료)';
        const numSpan2 = btn2.querySelector('.node-stage-num');
        if (numSpan2) numSpan2.textContent = '2';
      }

      if (card2) {
        card2.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border border-emerald-300 pointer-events-none';
      }

      if (badge2) {
        badge2.innerHTML = getSimpleStarsHTML(prog2);
      }
    } else if (isNode2Active) {
      if (node2Container) {
        node2Container.classList.remove('opacity-80');
        node2Container.classList.add('opacity-100', 'active', 'node-pulse');
        node2Container.style.opacity = '1';
      }
      if (banner2) banner2.classList.add('hidden');
      if (ping2) ping2.classList.remove('hidden');
      if (pulseRing2) pulseRing2.classList.remove('hidden');
      if (startPill2) {
        startPill2.classList.remove('hidden');
        startPill2.style.display = 'flex';
      }
      if (lockBadge2) {
        lockBadge2.classList.add('hidden');
        lockBadge2.style.display = 'none';
      }
      if (checkBadge2) {
        checkBadge2.classList.add('hidden');
        checkBadge2.style.display = 'none';
      }
      if (target2) {
        target2.dataset.nodeType = 'active';
        target2.removeAttribute('data-lock-msg');
        target2.removeAttribute('data-lock-icon');
      }

      if (btn2) {
        btn2.className = 'node-btn btn-3d relative w-[76px] h-[76px] rounded-full bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-black text-2xl flex items-center justify-center border-b-[6px] border-blue-800 shadow-[0_8px_20px_rgba(2,132,199,0.45)] ring-4 ring-sky-300/70 active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden';
        btn2.title = '2과';
        const numSpan2 = btn2.querySelector('.node-stage-num');
        if (numSpan2) numSpan2.textContent = '2';
      }

      if (card2) {
        card2.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border-2 border-sky-400 pointer-events-none ring-2 ring-sky-100';
      }

      if (badge2) {
        badge2.innerHTML = getSimpleStarsHTML(prog2);
      }
    } else {
      if (node2Container) {
        node2Container.classList.remove('opacity-100', 'active', 'node-pulse');
        node2Container.classList.add('opacity-80');
        node2Container.style.opacity = '0.8';
      }
      if (banner2) banner2.classList.add('hidden');
      if (ping2) ping2.classList.add('hidden');
      if (pulseRing2) pulseRing2.classList.add('hidden');
      if (startPill2) {
        startPill2.classList.add('hidden');
        startPill2.style.display = 'none';
      }
      if (checkBadge2) {
        checkBadge2.classList.add('hidden');
        checkBadge2.style.display = 'none';
      }
      if (lockBadge2) {
        lockBadge2.classList.remove('hidden');
        lockBadge2.style.display = 'flex';
      }

      const lockMsg2 = isBonusUnlocked ? '보너스 선물을 먼저 받아주세요!' : '1과를 먼저 완료해야 열려요!';

      if (target2) {
        target2.dataset.nodeType = 'locked';
        target2.setAttribute('data-lock-msg', lockMsg2);
        target2.setAttribute('data-lock-icon', '🔒');
      }

      if (btn2) {
        btn2.className = 'node-btn btn-3d w-[68px] h-[68px] rounded-full bg-slate-300 text-slate-500 font-black text-2xl flex items-center justify-center border-b-4 border-slate-400 shadow-sm active:translate-y-1 active:border-b-0 transition-all cursor-pointer';
        btn2.title = '2과: 잠김';
        const numSpan2 = btn2.querySelector('.node-stage-num');
        if (numSpan2) numSpan2.textContent = '2';
      }

      if (card2) {
        card2.className = 'mt-2 flex items-center justify-center bg-white/90 px-3 py-1 rounded-full shadow-sm border border-slate-200/60 pointer-events-none opacity-80';
      }

      if (badge2) {
        badge2.innerHTML = getSimpleStarsHTML(0);
      }
    }

    // ----------------------------------------------------
    // [Node Bonus: 선물상자 상태 렌더링]
    // ----------------------------------------------------
    const bonusContainer = el('node-bonus-container');
    const bonusTarget = el('node-bonus-target');
    const bonusBtn = el('node-bonus-btn');
    const bonusIcon = el('node-bonus-icon');
    const bonusBadgeText = el('node-bonus-badge-text');
    const bonusBadgeIcon = el('node-bonus-badge-icon');
    const bonusLabelCard = el('node-bonus-label-card');
    const bonusPing = el('node-bonus-ping');
    const bonusPulseRing = el('node-bonus-pulse-ring');
    const bonusStartPill = el('node-bonus-start-pill');
    let lockBadgeBonus = el('node-bonus-lock-badge');

    if (!lockBadgeBonus && bonusTarget) {
      lockBadgeBonus = document.createElement('div');
      lockBadgeBonus.id = 'node-bonus-lock-badge';
      lockBadgeBonus.className = 'absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20';
      lockBadgeBonus.innerHTML = '<span class="material-symbols-outlined text-[13px] font-bold">lock</span>';
      bonusTarget.appendChild(lockBadgeBonus);
    }

    const bonusGiftBubble = el('node-bonus-gift-bubble');
    if (bonusGiftBubble) {
      if (isBonusUnlocked && !isBonusDone) {
        bonusGiftBubble.classList.remove('hidden');
        bonusGiftBubble.style.display = 'flex';
      } else {
        bonusGiftBubble.classList.add('hidden');
        bonusGiftBubble.style.display = 'none';
      }
    }

    if (isBonusDone) {
      if (bonusContainer) bonusContainer.classList.remove('opacity-80', 'active', 'node-pulse');
      if (bonusTarget) {
        bonusTarget.dataset.nodeType = 'bonus';
        bonusTarget.removeAttribute('data-lock-msg');
      }
      if (bonusPing) bonusPing.classList.add('hidden');
      if (bonusPulseRing) bonusPulseRing.classList.add('hidden');
      if (bonusStartPill) { bonusStartPill.classList.add('hidden'); bonusStartPill.style.display = 'none'; }
      if (lockBadgeBonus) { lockBadgeBonus.classList.add('hidden'); lockBadgeBonus.style.display = 'none'; }
      if (bonusBtn) {
        bonusBtn.className = 'node-btn btn-3d relative w-[68px] h-[68px] rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center border-b-[5px] border-slate-400 shadow-sm active:translate-y-1 active:border-b-0 transition-all cursor-pointer ring-2 ring-slate-300/60';
        bonusBtn.title = '보너스 선물 (수령 완료)';
      }
      if (bonusIcon) { bonusIcon.textContent = '📦'; bonusIcon.className = 'text-3xl select-none leading-none drop-shadow-sm relative z-10'; }
      if (bonusBadgeText) { bonusBadgeText.textContent = '수령 완료 ✅'; bonusBadgeText.className = 'font-label-sm text-[10px] text-slate-500 font-bold'; }
      if (bonusBadgeIcon) bonusBadgeIcon.textContent = '📦';
      if (bonusLabelCard) bonusLabelCard.className = 'mt-2 flex flex-col items-center bg-white/95 px-3 py-1.5 rounded-2xl shadow-sm border border-slate-200 text-center pointer-events-none opacity-85';
    } else if (isBonusActive) {
      if (bonusContainer) bonusContainer.classList.add('active', 'node-pulse');
      if (bonusTarget) {
        bonusTarget.dataset.nodeType = 'bonus';
        bonusTarget.removeAttribute('data-lock-msg');
      }
      if (bonusPing) bonusPing.classList.remove('hidden');
      if (bonusPulseRing) bonusPulseRing.classList.remove('hidden');
      if (bonusStartPill) { bonusStartPill.classList.remove('hidden'); bonusStartPill.style.display = 'flex'; }
      if (lockBadgeBonus) { lockBadgeBonus.classList.add('hidden'); lockBadgeBonus.style.display = 'none'; }
      if (bonusBtn) {
        bonusBtn.className = 'node-btn btn-3d relative w-[68px] h-[68px] rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-yellow-400 text-white flex items-center justify-center border-b-[5px] border-amber-700 shadow-[0_6px_16px_rgba(245,158,11,0.4)] active:translate-y-1 active:border-b-0 transition-all cursor-pointer ring-4 ring-amber-300/80';
        bonusBtn.title = '보너스 선물 상자 (열기)';
      }
      if (bonusIcon) { bonusIcon.textContent = '🎁'; bonusIcon.className = 'text-3xl select-none leading-none drop-shadow-sm animate-bounce relative z-10'; }
      if (bonusBadgeText) { bonusBadgeText.textContent = '+15 💎 보너스'; bonusBadgeText.className = 'font-label-sm text-[10px] text-amber-600 font-bold'; }
      if (bonusBadgeIcon) bonusBadgeIcon.textContent = '🎁';
      if (bonusLabelCard) bonusLabelCard.className = 'mt-2 flex flex-col items-center bg-white/95 px-3 py-1.5 rounded-2xl shadow-sm border-2 border-amber-400 ring-2 ring-amber-100 text-center pointer-events-none';
    } else {
      if (bonusContainer) bonusContainer.classList.add('opacity-80');
      if (bonusTarget) {
        bonusTarget.dataset.nodeType = 'locked';
        bonusTarget.setAttribute('data-lock-msg', '1과를 먼저 완료해야 열려요!');
        bonusTarget.setAttribute('data-lock-icon', '🔒');
      }
      if (bonusPing) bonusPing.classList.add('hidden');
      if (bonusPulseRing) bonusPulseRing.classList.add('hidden');
      if (bonusStartPill) { bonusStartPill.classList.add('hidden'); bonusStartPill.style.display = 'none'; }
      if (lockBadgeBonus) {
        lockBadgeBonus.classList.remove('hidden');
        lockBadgeBonus.style.display = 'flex';
      }
      if (bonusBtn) {
        bonusBtn.className = 'node-btn btn-3d relative w-[68px] h-[68px] rounded-full bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm flex items-center justify-center';
        bonusBtn.title = '보너스 선물 (잠김)';
      }
      if (bonusIcon) { bonusIcon.textContent = '🎁'; bonusIcon.className = 'text-3xl select-none leading-none drop-shadow-sm relative z-10 opacity-60'; }
      if (bonusBadgeText) { bonusBadgeText.textContent = '+15 💎 보너스'; bonusBadgeText.className = 'font-label-sm text-[10px] text-slate-400 font-bold'; }
      if (bonusBadgeIcon) bonusBadgeIcon.textContent = '🎁';
      if (bonusLabelCard) bonusLabelCard.className = 'mt-2 flex flex-col items-center bg-white/95 px-3 py-1.5 rounded-2xl shadow-sm border border-slate-200 text-center pointer-events-none opacity-80';
    }

    // ----------------------------------------------------
    // [Node Review: 오답 탈출 / 스피드 복습 상태 렌더링]
    // ----------------------------------------------------
    const reviewContainer = el('node-review-container');
    const reviewTarget = el('node-review-target');
    const reviewBtn = el('node-review-btn');
    const reviewIcon = el('node-review-icon');
    const reviewBadgeText = el('node-review-badge-text') || reviewContainer?.querySelector('.text-orange-600') || reviewContainer?.querySelector('span.font-extrabold');
    const reviewLabelCard = el('node-review-label-card') || reviewContainer?.querySelector('#node-review-label-card') || reviewContainer?.querySelector('.rounded-full.border-orange-200') || reviewContainer?.querySelector('.mt-2');
    const reviewBadgeIcon = el('node-review-badge-icon') || reviewContainer?.querySelector('.text-xs');
    const reviewPing = el('node-review-ping');
    const reviewPulseRing = el('node-review-pulse-ring');
    const reviewStartPill = el('node-review-start-pill');
    const reviewCheckBadge = el('node-review-check-badge');
    const reviewExcl = el('node-review-excl');
    let lockBadgeReview = el('node-review-lock-badge');

    if (!lockBadgeReview && reviewTarget) {
      lockBadgeReview = document.createElement('div');
      lockBadgeReview.id = 'node-review-lock-badge';
      lockBadgeReview.className = 'absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20';
      lockBadgeReview.innerHTML = '<span class="material-symbols-outlined text-[13px] font-bold">lock</span>';
      reviewTarget.appendChild(lockBadgeReview);
    }

    let reviewWrongCount = 0;
    if (typeof window.loadWrongWords === 'function') {
      const loaded = window.loadWrongWords(currentLang) || [];
      reviewWrongCount = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else if (Array.isArray(window.wrongWords)) {
      reviewWrongCount = window.wrongWords.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else {
      try {
        const storageKey = (typeof getWrongStorageKey === 'function') ? getWrongStorageKey(currentLang) : `vocadash_wrong_answers_${currentLang}`;
        const raw = localStorage.getItem(storageKey) || localStorage.getItem(`vocadash_weakness_words_${currentLang}`) || (currentLang === 'es' ? localStorage.getItem('vocadash_wrong_words') : null);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            reviewWrongCount = parsed.filter(w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
          }
        }
      } catch (_) { }
    }

    if (!isReviewUnlocked) {
      // 1) 노드가 잠겨있는 경우 (최우선 방어): 하단 뱃지 렌더링 생략, 회색 번개 + 자물쇠만 노출
      if (reviewContainer) {
        reviewContainer.classList.add('opacity-80');
        reviewContainer.classList.remove('active', 'node-pulse');
      }
      if (reviewTarget) {
        reviewTarget.dataset.nodeType = 'locked';
        reviewTarget.setAttribute('data-lock-msg', '보너스 선물을 먼저 수령해야 열려요!');
        reviewTarget.setAttribute('data-lock-icon', '🔒');
      }
      if (reviewPing) reviewPing.classList.add('hidden');
      if (reviewPulseRing) reviewPulseRing.classList.add('hidden');
      if (reviewStartPill) { reviewStartPill.classList.add('hidden'); reviewStartPill.style.display = 'none'; }
      if (reviewCheckBadge) { reviewCheckBadge.classList.add('hidden'); reviewCheckBadge.style.display = 'none'; }
      if (reviewExcl) { reviewExcl.classList.add('hidden'); reviewExcl.style.display = 'none'; }
      if (lockBadgeReview) {
        lockBadgeReview.classList.remove('hidden');
        lockBadgeReview.style.display = 'flex';
      }
      if (reviewBtn) {
        reviewBtn.className = 'node-btn btn-3d w-[68px] h-[68px] rounded-full bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm flex items-center justify-center';
        reviewBtn.title = '약점 복습 (잠김)';
      }
      if (reviewIcon) reviewIcon.textContent = '⚡️';
      if (reviewLabelCard) {
        reviewLabelCard.classList.add('hidden');
        reviewLabelCard.style.display = 'none';
      }
    } else if (isReviewDone) {
      if (reviewContainer) reviewContainer.classList.remove('opacity-80', 'active', 'node-pulse');
      if (reviewTarget) {
        reviewTarget.dataset.nodeType = 'completed';
        reviewTarget.removeAttribute('data-lock-msg');
      }
      if (reviewPing) reviewPing.classList.add('hidden');
      if (reviewPulseRing) reviewPulseRing.classList.add('hidden');
      if (reviewStartPill) { reviewStartPill.classList.add('hidden'); reviewStartPill.style.display = 'none'; }
      if (reviewCheckBadge) { reviewCheckBadge.classList.remove('hidden'); reviewCheckBadge.style.display = 'flex'; }
      if (lockBadgeReview) { lockBadgeReview.classList.add('hidden'); lockBadgeReview.style.display = 'none'; }
      if (reviewExcl) { reviewExcl.classList.add('hidden'); reviewExcl.style.display = 'none'; }
      if (reviewBtn) {
        reviewBtn.className = 'node-btn btn-3d relative w-[68px] h-[68px] rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center border-b-[5px] border-slate-400 shadow-sm active:translate-y-1 active:border-b-0 transition-all cursor-pointer ring-2 ring-slate-300/60';
        reviewBtn.title = '약점 복습 (완료)';
      }
      if (reviewIcon) reviewIcon.textContent = '✅';
      if (reviewLabelCard) {
        reviewLabelCard.classList.remove('hidden');
        reviewLabelCard.style.display = 'flex';
        reviewLabelCard.className = 'mt-2 flex items-center justify-center bg-white/95 px-2.5 py-1 rounded-full shadow-sm border border-slate-200 pointer-events-none opacity-85';
      }
      if (reviewBadgeIcon) reviewBadgeIcon.textContent = reviewWrongCount > 0 ? '⚡️' : '✅';
      if (reviewBadgeText) {
        reviewBadgeText.textContent = reviewWrongCount > 0 ? `오답 탈출 (${reviewWrongCount})` : '복습 완료';
      }
    } else if (isReviewUnlocked) {
      if (isReviewActive) {
        if (reviewContainer) reviewContainer.classList.add('active', 'node-pulse');
        if (reviewPing) reviewPing.classList.remove('hidden');
        if (reviewPulseRing) reviewPulseRing.classList.remove('hidden');
        if (reviewStartPill) { reviewStartPill.classList.remove('hidden'); reviewStartPill.style.display = 'flex'; }
        if (reviewExcl) { reviewExcl.classList.remove('hidden'); reviewExcl.style.display = 'flex'; }
      } else {
        if (reviewContainer) reviewContainer.classList.remove('active', 'node-pulse');
        if (reviewPing) reviewPing.classList.add('hidden');
        if (reviewPulseRing) reviewPulseRing.classList.add('hidden');
        if (reviewStartPill) { reviewStartPill.classList.add('hidden'); reviewStartPill.style.display = 'none'; }
        if (reviewExcl) { reviewExcl.classList.add('hidden'); reviewExcl.style.display = 'none'; }
      }
      if (reviewContainer) reviewContainer.classList.remove('opacity-80');
      if (reviewTarget) {
        reviewTarget.dataset.nodeType = 'review';
        reviewTarget.removeAttribute('data-lock-msg');
      }
      if (reviewCheckBadge) { reviewCheckBadge.classList.add('hidden'); reviewCheckBadge.style.display = 'none'; }
      if (lockBadgeReview) { lockBadgeReview.classList.add('hidden'); lockBadgeReview.style.display = 'none'; }
      if (reviewBtn) {
        reviewBtn.className = 'node-btn btn-3d relative w-[68px] h-[68px] rounded-full bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white flex items-center justify-center border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] active:translate-y-1 active:border-b-0 transition-all cursor-pointer ring-4 ring-orange-300/80';
        reviewBtn.title = '약점 복습 드릴 (시작)';
      }
      if (reviewIcon) reviewIcon.textContent = '⚡️';
      if (reviewBadgeIcon) reviewBadgeIcon.textContent = '⚡️';
      if (reviewBadgeText) {
        reviewBadgeText.textContent = reviewWrongCount > 0 ? `오답 탈출 (${reviewWrongCount})` : '스피드 복습';
      }
      if (reviewLabelCard) {
        reviewLabelCard.classList.remove('hidden');
        reviewLabelCard.style.display = 'flex';
        reviewLabelCard.className = 'mt-2 flex items-center justify-center bg-white/95 px-2.5 py-1 rounded-full shadow-sm border border-orange-200 pointer-events-none';
      }
    }

    // Node 3 (오답 탈출까지 완료 시 해제, 3회 달성 시 완료 체크)
    const node3Container = el('node-3-container');
    const banner3 = el('node-3-start-banner');
    const node3Target = el('node-3-target');
    const ping3 = el('node-3-ping');
    const pulseRing3 = el('node-3-pulse-ring');
    const checkBadge3 = el('node-3-check-badge');
    const lockBadge3 = el('node-3-lock-badge');
    const btn3 = el('node-3-btn');
    const badge3 = el('node-3-label-badge');
    const startPill3 = el('node-3-start-pill');
    const card3 = el('node-3-label-card');

    const renderNode3Stars = (prog) => {
      if (typeof getSimpleStarsHTML === 'function') {
        return getSimpleStarsHTML(prog);
      }
      const p = Number(prog) || 0;
      const s1 = p >= 1 ? '⭐' : '<span class="opacity-30">⭐</span>';
      const s2 = p >= 2 ? '⭐' : '<span class="opacity-30">⭐</span>';
      const s3 = p >= 3 ? '⭐' : '<span class="opacity-30">⭐</span>';
      return `<div class="flex items-center gap-1">${s1}${s2}${s3}</div>`;
    };

    if (prog3 >= 3) {
      if (node3Container) {
        node3Container.classList.remove('opacity-75', 'opacity-80', 'active', 'node-pulse');
        node3Container.classList.add('opacity-100');
        node3Container.style.opacity = '1';
      }
      if (banner3) banner3.classList.add('hidden');
      if (ping3) ping3.classList.add('hidden');
      if (pulseRing3) pulseRing3.classList.add('hidden');
      if (startPill3) {
        startPill3.classList.add('hidden');
        startPill3.style.display = 'none';
      }
      if (lockBadge3) {
        lockBadge3.classList.add('hidden');
        lockBadge3.style.display = 'none';
      }
      if (checkBadge3) {
        checkBadge3.classList.remove('hidden');
        checkBadge3.style.display = 'flex';
      }
      if (node3Target) {
        node3Target.dataset.nodeType = 'completed';
        node3Target.removeAttribute('data-lock-msg');
        node3Target.removeAttribute('data-lock-icon');
      }
      if (btn3) {
        btn3.className = 'node-btn btn-3d w-[72px] h-[72px] rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl flex items-center justify-center border-b-4 border-emerald-700 shadow-md active:translate-y-1 active:border-b-0 transition-all cursor-pointer';
        btn3.title = '3과 (완료)';
        const numSpan3 = btn3.querySelector('.node-stage-num');
        if (numSpan3) numSpan3.textContent = '3';
      }
      if (card3) {
        card3.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border border-emerald-300 pointer-events-none';
      }
      if (badge3) {
        badge3.innerHTML = renderNode3Stars(prog3);
      }
    } else if (isNode3Active) {
      if (node3Container) {
        node3Container.classList.remove('opacity-75', 'opacity-80');
        node3Container.classList.add('opacity-100', 'active', 'node-pulse');
        node3Container.style.opacity = '1';
      }
      if (banner3) banner3.classList.add('hidden');
      if (ping3) ping3.classList.remove('hidden');
      if (pulseRing3) pulseRing3.classList.remove('hidden');
      if (startPill3) {
        startPill3.classList.remove('hidden');
        startPill3.style.display = 'flex';
      }
      if (lockBadge3) {
        lockBadge3.classList.add('hidden');
        lockBadge3.style.display = 'none';
      }
      if (checkBadge3) {
        checkBadge3.classList.add('hidden');
        checkBadge3.style.display = 'none';
      }

      if (node3Target) {
        node3Target.dataset.nodeType = 'active';
        node3Target.removeAttribute('data-lock-msg');
        node3Target.removeAttribute('data-lock-icon');
      }
      if (btn3) {
        btn3.className = 'node-btn btn-3d relative w-[76px] h-[76px] rounded-full bg-sky-500 hover:bg-sky-400 text-white font-black text-2xl flex items-center justify-center border-b-4 border-sky-700 shadow-lg active:translate-y-1 active:border-b-0 transition-all cursor-pointer ring-4 ring-sky-300/50';
        btn3.title = '3과';
        const numSpan3 = btn3.querySelector('.node-stage-num');
        if (numSpan3) numSpan3.textContent = '3';
      }
      if (card3) {
        card3.className = 'mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border-2 border-sky-400 pointer-events-none ring-2 ring-sky-100';
      }
      if (badge3) {
        badge3.innerHTML = renderNode3Stars(prog3);
      }
    } else {
      if (node3Container) {
        node3Container.classList.remove('opacity-100', 'active', 'node-pulse');
        node3Container.classList.add('opacity-80');
        node3Container.style.opacity = '0.8';
      }
      if (banner3) banner3.classList.add('hidden');
      if (ping3) ping3.classList.add('hidden');
      if (pulseRing3) pulseRing3.classList.add('hidden');
      if (startPill3) {
        startPill3.classList.add('hidden');
        startPill3.style.display = 'none';
      }
      if (lockBadge3) {
        lockBadge3.classList.remove('hidden');
        lockBadge3.style.display = 'flex';
      }
      if (checkBadge3) {
        checkBadge3.classList.add('hidden');
        checkBadge3.style.display = 'none';
      }

      if (node3Target) {
        node3Target.dataset.nodeType = 'locked';
        node3Target.setAttribute('data-lock-msg', '오답 탈출을 먼저 완료해야 3과가 열려요!');
        node3Target.setAttribute('data-lock-icon', '🔒');
      }
      if (btn3) {
        btn3.className = 'node-btn btn-3d w-[68px] h-[68px] rounded-full bg-slate-300 text-slate-500 font-black text-2xl flex items-center justify-center border-b-4 border-slate-400 shadow-sm active:translate-y-1 active:border-b-0 transition-all cursor-pointer';
        btn3.title = '3과: 잠김';
        const numSpan3 = btn3.querySelector('.node-stage-num');
        if (numSpan3) numSpan3.textContent = '3';
      }
      if (card3) {
        card3.className = 'mt-2 flex items-center justify-center bg-white/90 px-3 py-1 rounded-full shadow-sm border border-slate-200/60 pointer-events-none opacity-80';
      }
      if (badge3) {
        badge3.innerHTML = renderNode3Stars(0);
      }
    }

    // 💡 [전 유닛 공통] Unit 1~4 모든 보스 노드 상단 배너 영구 제거 및 하단 라벨 통일
    document.querySelectorAll('[data-node-id*="boss"], [id*="node-boss"], [id*="boss-container"]').forEach(container => {
      // 1) 상단에 뜬 FINAL BOSS EXAM 배너 완전 삭제
      container.querySelectorAll('div, span').forEach(el => {
        if (el.textContent.includes('FINAL BOSS EXAM') && (el.classList.contains('absolute') || el.id.includes('banner') || el.className.includes('-top-'))) {
          el.remove();
        }
      });

      // 2) 하단 라벨 카드를 주황색 그라데이션 배지로 통일
      const bottomCard = container.querySelector('[id*="label-card"], .node-label-card, .mt-2, .mt-2\\.5');
      const bottomBadge = container.querySelector('[id*="label-badge"], .node-label-badge');
      if (bottomCard) {
        bottomCard.className = 'mt-2.5 flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 rounded-full shadow-md border border-orange-400 pointer-events-none opacity-90';
      }
      if (bottomBadge) {
        bottomBadge.innerHTML = '<span class="text-[11px] text-white font-black tracking-wide flex items-center gap-1 drop-shadow-sm"><span>🔥</span><span>FINAL BOSS EXAM</span></span>';
      }
    });

    // Node Boss (3과 3회 달성 시 영구 해제 & START 배너)
    const nodeBossContainer = el('node-boss-container') || document.querySelector('[data-node-id*="boss"]');
    const bannerBoss = el('node-boss-start-banner') || el('node-boss-banner') || el('node-boss-exam-banner');
    const targetBoss = el('node-boss-target') || (nodeBossContainer && nodeBossContainer.querySelector('.node-target'));
    const glowBoss = el('node-boss-glow') || (nodeBossContainer && nodeBossContainer.querySelector('[id*="glow"]'));
    const btnBoss = el('node-boss-btn') || (nodeBossContainer && nodeBossContainer.querySelector('.node-btn'));
    const lockBadgeBoss = el('node-boss-lock-badge') || (nodeBossContainer && nodeBossContainer.querySelector('[id*="lock"]'));
    const checkBadgeBoss = el('node-boss-check-badge') || (nodeBossContainer && nodeBossContainer.querySelector('[id*="check"]'));
    const badgeBoss = el('node-boss-label-badge') || (nodeBossContainer && nodeBossContainer.querySelector('[id*="label-badge"]'));
    const cardBoss = el('node-boss-label-card') || (nodeBossContainer && nodeBossContainer.querySelector('[id*="label-card"]'));
    const startPillBoss = el('node-boss-start-pill') || (nodeBossContainer && nodeBossContainer.querySelector('[id*="start-pill"]'));


    // 💡 [핵심] 상태(클리어/도전/잠김)에 상관없이 상단 주황색 배너는 영구 무조건 완전 삭제
    if (bannerBoss) {
      bannerBoss.remove();
    }
    // 컨테이너 내부의 상단 배지 흔적 및 텍스트 강제 색출 삭제
    if (nodeBossContainer) {
      const topBadges = nodeBossContainer.querySelectorAll('div, span');
      topBadges.forEach(el => {
        if (el.textContent.includes('FINAL BOSS EXAM') && el !== badgeBoss && !cardBoss?.contains(el)) {
          el.remove();
        }
      });
    }

    if (prog3 >= 3) {
      if (nodeBossContainer) {
        nodeBossContainer.classList.remove('opacity-75', 'opacity-80');
        nodeBossContainer.classList.add('opacity-100');
        nodeBossContainer.style.opacity = '1';
      }
      if (lockBadgeBoss) {
        lockBadgeBoss.classList.add('hidden');
        lockBadgeBoss.style.display = 'none';
      }
      if (glowBoss) {
        glowBoss.classList.remove('hidden');
        glowBoss.classList.add('animate-pulse');
      }

      if (progBoss >= 1) {
        // [1] 이미 보스를 깬 완료 상태
        if (nodeBossContainer) nodeBossContainer.classList.remove('active', 'node-pulse');
        if (startPillBoss) {
          startPillBoss.classList.add('hidden');
          startPillBoss.style.display = 'none';
        }
        if (targetBoss) {
          targetBoss.dataset.nodeType = 'completed';
          targetBoss.removeAttribute('data-lock-msg');
          targetBoss.removeAttribute('data-lock-icon');
        }
        if (checkBadgeBoss) {
          checkBadgeBoss.classList.remove('hidden');
          checkBadgeBoss.style.display = 'flex';
        }
        if (cardBoss) {
          cardBoss.className = 'mt-2.5 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border border-emerald-400 pointer-events-none';
        }
        if (badgeBoss) {
          badgeBoss.innerHTML = '<span class="text-[11px] text-emerald-600 font-black flex items-center gap-1"><span>👑</span><span>BOSS CLEAR!</span></span>';
        }
      } else {
        // [2] 3과 클리어 후 보스전 도전 가능(START) 상태
        if (nodeBossContainer) nodeBossContainer.classList.add('active', 'node-pulse');

        // 💡 상단에는 '▶ START' 칩만 단독 노출
        if (startPillBoss) {
          startPillBoss.classList.remove('hidden');
          startPillBoss.style.display = 'flex';
        }
        if (targetBoss) {
          targetBoss.dataset.nodeType = 'active';
          targetBoss.removeAttribute('data-lock-msg');
          targetBoss.removeAttribute('data-lock-icon');
        }
        if (checkBadgeBoss) {
          checkBadgeBoss.classList.add('hidden');
          checkBadgeBoss.style.display = 'none';
        }
        if (btnBoss) {
          btnBoss.title = '보스전 (FINAL BOSS EXAM)';
        }

        // 💡 하단 카드: 주황색 그라데이션 스타일
        if (cardBoss) {
          cardBoss.className = 'mt-2.5 flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 rounded-full shadow-md border border-orange-400 pointer-events-none';
        }
        // 💡 하단 라벨: 흰색 글씨 + 불꽃 + 문구
        if (badgeBoss) {
          badgeBoss.innerHTML = '<span class="text-[11px] text-white font-black tracking-wide flex items-center gap-1 drop-shadow-sm"><span>🔥</span><span>FINAL BOSS EXAM</span></span>';
        }
      }
    } else {
      // [3] 이전 스테이지 미완료로 잠겨있는 상태
      if (nodeBossContainer) {
        nodeBossContainer.classList.remove('active', 'node-pulse');
        nodeBossContainer.classList.add('opacity-80');
      }
      if (startPillBoss) {
        startPillBoss.classList.add('hidden');
        startPillBoss.style.display = 'none';
      }
      if (glowBoss) {
        glowBoss.classList.add('hidden');
        glowBoss.classList.remove('animate-pulse');
      }
      if (targetBoss) {
        targetBoss.dataset.nodeType = 'locked';
        targetBoss.setAttribute('data-lock-msg', '1~3과를 모두 통과해야 보스전에 도전할 수 있어요!');
        targetBoss.setAttribute('data-lock-icon', '👑');
      }
      if (lockBadgeBoss) {
        lockBadgeBoss.classList.remove('hidden');
        lockBadgeBoss.style.display = 'flex';
      }
      if (checkBadgeBoss) {
        checkBadgeBoss.classList.add('hidden');
        checkBadgeBoss.style.display = 'none';
      }
      if (btnBoss) {
        btnBoss.title = '보스전: 잠김';
      }
      // 💡 하단 카드: 주황색 그라데이션 배지
      if (cardBoss) {
        cardBoss.className = 'mt-2.5 flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 rounded-full shadow-md border border-orange-400 pointer-events-none opacity-90';
      }
      // 💡 하단 라벨: 흰색 볼드체 + 🔥 FINAL BOSS EXAM
      if (badgeBoss) {
        badgeBoss.innerHTML = '<span class="text-[11px] text-white font-black tracking-wide flex items-center gap-1 drop-shadow-sm"><span>🔥</span><span>FINAL BOSS EXAM</span></span>';
      }
    }

    // 최신 활성 노드 위치에 고양이 캐릭터 아바타 마커 위치 동적 갱신
    if (typeof updateCatMarkerPosition === 'function') {
      updateCatMarkerPosition();
    }

    // 각 스테이지 노드 DOM에 category/level/tags 메타데이터 동기화
    ['node-1', 'node-2', 'node-3', 'node-boss'].forEach((nid) => {
      const nodeEl = document.querySelector(`.roadmap-node[data-node-id="${nid}"]`);
      if (nodeEl && lessons && lessons[nid]) {
        const item = lessons[nid];
        nodeEl.setAttribute('data-category', item.category || item.level || '');
        nodeEl.setAttribute('data-level', item.level || item.category || '');
        nodeEl.setAttribute('data-tags', Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || ''));
      }
    });

    // 현재 활성화된 서브 필터 적용
    if (typeof filterRoadmapByCategory === 'function') {
      filterRoadmapByCategory(window.currentCategoryFilter || '전체');
    }
  }
  window.updateRoadmapNodesUI = updateRoadmapNodesUI;


  // ===================================================
  // 듀오링고 스타일 전체 유닛 연속 스크롤 로드맵 & 렌더링 시스템
  // ===================================================
  function renderUnitNodeHtml(opt) {
    const { unitNum, stageNum, title, align, width, isCompleted, isActive, isLocked, nodeKey, nodeId } = opt;
    const resolvedId = nodeId || nodeKey || `u${unitNum}_stage-${stageNum}`;

    // 🛡️ [우선순위 방어] 잠금(isLocked)을 최우선으로 판정!
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const nodeData = (typeof getNodeProgress === 'function') ? getNodeProgress(resolvedId) : { clearedCount: 0, stars: 0 };
    const pCount = effectiveCompleted ? 3 : (effectiveActive ? nodeData.clearedCount : 0);

    // 심플 별 3개 점등 생성 (글자 배제)
    const s1 = pCount >= 1 ? '⭐' : '<span class="opacity-30">⭐</span>';
    const s2 = pCount >= 2 ? '⭐' : '<span class="opacity-30">⭐</span>';
    const s3 = pCount >= 3 ? '⭐' : '<span class="opacity-30">⭐</span>';

    const btnClass = isLocked
      ? 'bg-slate-300 text-slate-500 font-black text-2xl border-b-4 border-slate-400 shadow-sm'
      : (effectiveCompleted
        ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white font-black text-2xl border-b-[5px] border-emerald-800 shadow-[0_6px_14px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/40'
        : (effectiveActive
          ? 'bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-black text-2xl border-b-[6px] border-blue-800 shadow-[0_8px_20px_rgba(2,132,199,0.45)] ring-4 ring-sky-300/70'
          : 'bg-slate-300 text-slate-500 font-black text-2xl border-b-4 border-slate-400 shadow-sm'));

    return `
      <div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : (effectiveActive ? 'active' : 'unlocked'))}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center my-1 node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[100px] h-[100px] rounded-full bg-sky-400/25 animate-ping pointer-events-none"></span>
            <span class="absolute w-[90px] h-[90px] rounded-full bg-sky-200/50 pointer-events-none"></span>
          ` : ''}

          <button class="subsequent-node-btn node-btn btn-3d relative ${effectiveActive ? 'w-[76px] h-[76px]' : 'w-[68px] h-[68px]'} rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden" type="button" title="${escapeHTML(title)}" data-unit-number="${unitNum}" data-node-type="stage" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <div class="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/35 blur-[0.5px] pointer-events-none"></div>
            <span class="node-stage-num ${effectiveActive ? 'text-sm font-extrabold tracking-tight' : 'font-black text-2xl'} select-none leading-none drop-shadow-xs relative z-10 text-white">${effectiveActive ? 'START' : stageNum}</span>
          </button>

          ${effectiveActive ? `
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}

          ${effectiveCompleted ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white pointer-events-none">
              <span class="material-symbols-outlined text-[15px] font-black">check</span>
            </div>
          ` : ''}

          ${isLocked ? `
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none">
              <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
            </div>
          ` : ''}
        </div>

        <!-- 심플 별 3개 캡슐 -->
        <div class="mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border ${effectiveCompleted ? 'border-emerald-300' : (effectiveActive ? 'border-2 border-sky-400 ring-2 ring-sky-100' : 'border-slate-200/60')} pointer-events-none ${isLocked ? 'opacity-80' : ''}">
          <div class="flex items-center gap-1">
            <span class="text-sm">${s1}</span>
            <span class="text-sm">${s2}</span>
            <span class="text-sm">${s3}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderUnitBonusHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-bonus`;

    // 🛡️ [우선순위 방어] 잠금(isLocked)을 최우선으로 판정!
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const btnClass = isLocked
      ? 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm'
      : (effectiveCompleted
        ? 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300/60'
        : 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-yellow-400 text-white border-b-[5px] border-amber-700 shadow-[0_6px_16px_rgba(245,158,11,0.4)] ring-4 ring-amber-300/80');

    return `
      <div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'bonus')}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center my-1 node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[94px] h-[94px] rounded-full bg-amber-400/25 animate-ping pointer-events-none"></span>
            <span class="absolute w-[86px] h-[86px] rounded-full bg-amber-200/50 pointer-events-none"></span>
          ` : ''}

          <button class="subsequent-node-btn node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="보너스 선물 상자" data-unit-number="${unitNum}" data-node-type="bonus" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <div class="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/40 blur-[0.5px] pointer-events-none"></div>
            <span class="text-3xl select-none leading-none drop-shadow-sm ${isLocked ? '' : (effectiveCompleted ? '' : (effectiveActive ? 'animate-bounce' : 'animate-wiggle'))} relative z-10">${isLocked ? '🎁' : (effectiveCompleted ? '📦' : '🎁')}</span>
          </button>

          ${isLocked ? `
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20">
              <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
            </div>
          ` : ''}

          ${effectiveActive ? `
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}
        </div>
        <!-- 심플 보너스 캡슐 -->
        <div class="mt-2 flex items-center justify-center bg-white/95 px-2.5 py-1 rounded-full shadow-sm border ${isLocked ? 'border-slate-200 opacity-60' : (effectiveCompleted ? 'border-slate-200 opacity-80' : (effectiveActive ? 'border-2 border-amber-400 ring-2 ring-amber-100' : 'border-amber-200'))} pointer-events-none">
          <div class="flex items-center gap-1">
            <span class="text-xs">${isLocked ? '🔒' : (effectiveCompleted ? '📦' : '🎁')}</span>
            <span class="text-[11px] ${isLocked ? 'text-slate-400' : (effectiveCompleted ? 'text-slate-500' : 'text-amber-600')} font-extrabold">${isLocked ? '잠김' : (effectiveCompleted ? '수령 완료' : '+15 💎')}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderUnitReviewHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-review`;

    // 🛡️ [우선순위 방어] 잠금(isLocked)을 최우선으로 판정!
    // 잠겨있는 상태라면 완료(isCompleted) 플래그가 어떻게 되어 있든 절대 초록색 체크(✔/✅)를 렌더링하지 않음!
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let reviewWrongCount = 0;
    if (typeof window.loadWrongWords === 'function') {
      const loaded = window.loadWrongWords(currentLang) || [];
      reviewWrongCount = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else if (Array.isArray(window.wrongWords)) {
      reviewWrongCount = window.wrongWords.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else {
      try {
        const storageKey = (typeof getWrongStorageKey === 'function') ? getWrongStorageKey(currentLang) : `vocadash_wrong_answers_${currentLang}`;
        const raw = localStorage.getItem(storageKey) || localStorage.getItem(`vocadash_weakness_words_${currentLang}`) || (currentLang === 'es' ? localStorage.getItem('vocadash_wrong_words') : null);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            reviewWrongCount = parsed.filter(w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
          }
        }
      } catch (_) { }
    }

    const reviewBadgeLabel = reviewWrongCount > 0
      ? `오답 탈출 (${reviewWrongCount})`
      : (effectiveCompleted ? '복습 완료' : '스피드 복습');
    const reviewBadgeIcon = (effectiveCompleted && reviewWrongCount === 0) ? '✅' : '⚡️';

    let btnClass = '';
    let btnIcon = '⚡️';

    if (isLocked) {
      btnClass = 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm';
      btnIcon = '⚡️';
    } else if (effectiveCompleted) {
      btnClass = 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300/60';
      btnIcon = '✅';
    } else if (effectiveActive) {
      btnClass = 'bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] ring-4 ring-orange-300/80';
      btnIcon = '⚡️';
    } else {
      btnClass = 'bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] ring-4 ring-orange-300/80';
      btnIcon = '⚡️';
    }

    return `
      <div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'review')}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center my-1 node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[94px] h-[94px] rounded-full bg-orange-400/25 animate-ping pointer-events-none"></span>
            <span class="absolute w-[86px] h-[86px] rounded-full bg-orange-200/50 pointer-events-none"></span>
          ` : ''}

          <button class="subsequent-node-btn node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="약점 복습 드릴" data-unit-number="${unitNum}" data-node-type="review" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <div class="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/35 blur-[0.5px] pointer-events-none"></div>
            <div class="relative flex items-center justify-center z-10">
              <span class="text-3xl select-none leading-none drop-shadow-sm">${btnIcon}</span>
              ${!isLocked && !effectiveCompleted ? '<span class="absolute -bottom-1 -right-1 text-sm">🩹</span>' : ''}
            </div>
          </button>

          ${isLocked ? `
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20">
              <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
            </div>
          ` : ''}

          ${effectiveActive ? `
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}
        </div>
        <!-- 심플 약점 복습 캡슐 (잠김 시 렌더링 생략) -->
        ${isLocked ? '' : `
        <div class="mt-2 flex items-center justify-center bg-white/95 px-2.5 py-1 rounded-full shadow-sm border ${effectiveCompleted && reviewWrongCount === 0 ? 'border-slate-200 opacity-85' : 'border-orange-200'} pointer-events-none">
          <div class="flex items-center gap-1">
            <span class="text-xs">${reviewBadgeIcon}</span>
            <span class="text-[11px] text-orange-600 font-extrabold">${reviewBadgeLabel}</span>
          </div>
        </div>
        `}
      </div>
    `;
  }

  function renderUnitBossHtml(opt) {
    const { unitNum, align, width, isCompleted, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-boss`;
    const effectiveCompleted = isLocked ? false : !!isCompleted;

    const btnClass = isLocked
      ? 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm ring-2 ring-slate-300'
      : (effectiveCompleted
        ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white border-b-[6px] border-emerald-800 shadow-xl ring-4 ring-emerald-300/70'
        : 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-white border-b-[6px] border-amber-800 shadow-xl ring-4 ring-amber-300/70');

    return `
      <div class="roadmap-node relative z-20 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'boss')}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center node-target cursor-pointer">
          ${!isLocked && !effectiveCompleted ? `
            <div class="absolute w-[104px] h-[104px] rounded-full bg-amber-400 blur-md opacity-80 animate-pulse pointer-events-none"></div>
          ` : ''}
          <button class="subsequent-node-btn node-btn btn-3d relative w-[92px] h-[92px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="보스전" data-unit-number="${unitNum}" data-node-type="boss" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <span class="text-[44px] select-none leading-none drop-shadow-md">👑</span>
            ${isLocked ? `
              <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-900/80 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none">
                <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
              </div>
            ` : ''}
          </button>
          ${effectiveCompleted ? `
            <div class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-4 ring-white pointer-events-none">
              <span class="material-symbols-outlined text-[16px] font-black">check</span>
            </div>
          ` : ''}
        </div>
        <!-- 보스전 하단 미니 캡슐 -->
        <div class="mt-2.5 flex items-center justify-center px-3.5 py-1 rounded-full ${isLocked ? 'bg-slate-400 text-slate-200 shadow-sm' : (effectiveCompleted ? 'bg-emerald-600 text-white shadow-[0_2px_0_0_#065f46]' : 'bg-amber-500 text-white shadow-[0_2px_0_0_#b45309]')} text-center pointer-events-none font-black text-[11px] uppercase tracking-wide">
          <div class="flex items-center gap-1.5">
            <span class="text-xs">${isLocked ? '🔒' : (effectiveCompleted ? '👑' : '🔥')}</span>
            <span>${isLocked ? 'LOCKED' : (effectiveCompleted ? 'BOSS CLEAR!' : 'FINAL BOSS EXAM')}</span>
          </div>
        </div>
      </div>
    `;
  }
  window.renderUnitNodeHtml = renderUnitNodeHtml;
  window.renderUnitBonusHtml = renderUnitBonusHtml;
  window.renderUnitReviewHtml = renderUnitReviewHtml;
  window.renderUnitBossHtml = renderUnitBossHtml;

  function renderSubsequentUnits(activeCourse, unlockedLevel) {
    const container = document.getElementById('roadmap-subsequent-units');
    if (!container) return;

    const course = activeCourse || getCurrentCourseData();
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let units = (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS[lang]) || UNIT_LIST_PRESETS[lang] || UNIT_LIST_PRESETS.es;
    if (course && Array.isArray(course.units) && course.units.length > 0) {
      units = course.units;
    }

    const totalUnits = units.length;
    let html = '';

    for (let idx = 1; idx < totalUnits; idx++) {
      const unit = units[idx];
      const unitNum = idx + 1;
      const isCompleted = unitNum < unlockedLevel;
      const isActive = unitNum === unlockedLevel;
      const isLocked = unitNum > unlockedLevel;

      const unitIcon = unit.icon || (course?.id === 'pack_football' ? '⚽' : (lang === 'en' ? '🗽' : '🇪🇸'));
      const unitTitle = unit.title || `Unit ${unitNum}`;
      const unitDesc = unit.desc || unit.subtitle || '';

      // [유닛 구분 섹션 헤더 컴포넌트] (요구사항 마크업 정확히 일치)
      html += `
        <div class="unit-section-divider py-8 my-6 text-center select-none" data-unit-index="${idx}">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md">
            <span>${escapeHTML(unitIcon)}</span>
            <span>${escapeHTML(unitTitle)}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">${escapeHTML(unitDesc)}</p>
        </div>
      `;

      // 유닛별 노드 정보 추출 (표준 복합 키 네임스페이스 적용: u${unitNum}_...)
      const uNodes = (unit && Array.isArray(unit.nodes)) ? unit.nodes : [];
      const n1 = uNodes.find(n => n.type === 'stage' && (n.stageNumber === 1 || n.id?.endsWith('_n1'))) || { id: `u${unitNum}_stage-1`, title: `1과: ${unitTitle}`, type: 'stage' };
      const n2 = uNodes.find(n => n.type === 'stage' && (n.stageNumber === 2 || n.id?.endsWith('_n2'))) || { id: `u${unitNum}_stage-2`, title: `2과: ${unitDesc || '핵심 회화'}`, type: 'stage' };
      const nBonus = uNodes.find(n => n.type === 'bonus' || n.id?.endsWith('_n3')) || { id: `u${unitNum}_node-bonus`, title: '보너스 상자', type: 'bonus' };
      const nReview = uNodes.find(n => n.type === 'review' || n.id?.endsWith('_n4')) || { id: `u${unitNum}_node-review`, title: '약점 복습', type: 'review' };
      const n3 = uNodes.find(n => ((n.type === 'stage' && n.stageNumber === 3) || n.id?.endsWith('_n5') || (n.type === 'sentence' && !n.id?.includes('review') && !n.id?.endsWith('_n4')))) || { id: `u${unitNum}_stage-3`, title: '3과: 자기소개와 소통', type: 'stage' };
      const nBoss = uNodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6')) || { id: `u${unitNum}_node-boss`, title: `Unit ${unit.unitNumber || unitNum} 보스전`, type: 'boss' };

      const bonusId = nBonus.id || `u${unitNum}_node-bonus`;
      const reviewId = nReview.id || `u${unitNum}_node-review`;

      const isBonusDone = isBonusClaimed(bonusId);
      const isReviewDone = isReviewNodeCompleted(reviewId, unitNum);

      const n1Data = (typeof getNodeProgress === 'function') ? getNodeProgress(n1.id || `u${unitNum}_stage-1`) : { clearedCount: 0, stars: 0 };
      const n2Data = (typeof getNodeProgress === 'function') ? getNodeProgress(n2.id || `u${unitNum}_stage-2`) : { clearedCount: 0, stars: 0 };
      const n3Data = (typeof getNodeProgress === 'function') ? getNodeProgress(n3.id || `u${unitNum}_stage-3`) : { clearedCount: 0, stars: 0 };
      const bossData = (typeof getNodeProgress === 'function') ? getNodeProgress(nBoss.id || `u${unitNum}_node-boss`) : { clearedCount: 0, stars: 0 };

      // 노드별 잠금 해제 판정
      const isN1Unlocked = isNodeUnlocked(idx, 0, n1, course);
      const isN2Unlocked = isN1Unlocked && (n1Data.clearedCount >= 3 || unitNum < unlockedLevel);
      const isBonusUnlocked = isN2Unlocked && (n2Data.clearedCount >= 3 || unitNum < unlockedLevel);
      const isReviewUnlocked = isBonusUnlocked && (isBonusDone || unitNum < unlockedLevel);
      const isN3Unlocked = isReviewUnlocked && (isReviewDone || unitNum < unlockedLevel);
      const isBossUnlocked = isN3Unlocked && (n3Data.clearedCount >= 3 || unitNum < unlockedLevel);

      // 활성 START 뱃지 판정 (가장 첫 번째로 미완료된 해금 노드에만 START 부여)
      const isN1Active = isN1Unlocked && n1Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isN2Active = !isN1Active && isN2Unlocked && n2Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isBonusActive = !isN1Active && !isN2Active && isBonusUnlocked && !isBonusDone && unitNum >= unlockedLevel;
      const isReviewActive = !isN1Active && !isN2Active && !isBonusActive && isReviewUnlocked && !isReviewDone && unitNum >= unlockedLevel;
      const isN3Active = !isN1Active && !isN2Active && !isBonusActive && !isReviewActive && isN3Unlocked && n3Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isBossActive = !isN1Active && !isN2Active && !isBonusActive && !isReviewActive && !isN3Active && isBossUnlocked && bossData.clearedCount < 1 && unitNum >= unlockedLevel;

      const bossTitle = nBoss.title || `Unit ${unit.unitNumber || unitNum} 보스전`;

      // 유닛 섹션 블록 컨테이너
      html += `
        <div class="unit-section-block relative w-full min-h-[960px] pb-6" data-unit-index="${idx}" id="unit-section-${idx}">
          <!-- Curved Running Track SVG Layer -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200" fill="none" preserveAspectRatio="none" viewBox="0 0 380 960">
            <path d="M 110 70 C 110 160, 270 140, 270 230 C 270 320, 120 300, 120 390 C 120 480, 260 460, 260 550 C 260 640, 110 620, 110 710 C 110 805, 190 795, 190 880" stroke="#dae2fd" stroke-linecap="round" stroke-width="14"></path>
            <path d="M 110 70 C 110 160, 270 140, 270 230 C 270 320, 120 300, 120 390 C 120 480, 260 460, 260 550 C 260 640, 110 620, 110 710 C 110 805, 190 795, 190 880" stroke="#38bdf8" stroke-dasharray="8 10" stroke-linecap="round" stroke-width="4"></path>
          </svg>

          <!-- Node 1 -->
          ${renderUnitNodeHtml({
        unitNum,
        nodeKey: `u${unitNum}_stage-1`,
        nodeId: n1.id,
        type: 'stage',
        stageNum: 1,
        title: n1.title,
        align: 'ml-5 mb-11',
        width: '200px',
        isCompleted: (!isN1Unlocked) ? false : (n1Data.clearedCount >= 3 || unitNum < unlockedLevel),
        isActive: isN1Active,
        isLocked: !isN1Unlocked
      })}

          <!-- Node 2 -->
          ${renderUnitNodeHtml({
        unitNum,
        nodeKey: `u${unitNum}_stage-2`,
        nodeId: n2.id,
        type: 'stage',
        stageNum: 2,
        title: n2.title,
        align: 'ml-auto mr-5 mb-11',
        width: '210px',
        isCompleted: (!isN2Unlocked) ? false : (n2Data.clearedCount >= 3 || unitNum < unlockedLevel),
        isActive: isN2Active,
        isLocked: !isN2Unlocked
      })}

          <!-- Node Bonus -->
          ${renderUnitBonusHtml({
        unitNum,
        nodeKey: `u${unitNum}_node-bonus`,
        nodeId: bonusId,
        align: 'ml-7 mb-11',
        width: '170px',
        isCompleted: (!isBonusUnlocked) ? false : (isBonusDone || unitNum < unlockedLevel),
        isActive: isBonusActive,
        isLocked: !isBonusUnlocked
      })}

          <!-- Node Review -->
          ${renderUnitReviewHtml({
        unitNum,
        nodeKey: `u${unitNum}_node-review`,
        nodeId: reviewId,
        align: 'ml-auto mr-7 mb-11',
        width: '170px',
        isCompleted: (!isReviewUnlocked) ? false : (isReviewDone || unitNum < unlockedLevel),
        isActive: isReviewActive,
        isLocked: !isReviewUnlocked
      })}

          <!-- Node 3 -->
          ${renderUnitNodeHtml({
        unitNum,
        nodeKey: `u${unitNum}_stage-3`,
        nodeId: n3.id,
        type: 'stage',
        stageNum: 3,
        title: n3.title,
        align: 'ml-5 mb-14',
        width: '190px',
        isCompleted: (!isN3Unlocked) ? false : (n3Data.clearedCount >= 3 || unitNum < unlockedLevel),
        isActive: isN3Active,
        isLocked: !isN3Unlocked
      })}

          <!-- Node Boss -->
          ${renderUnitBossHtml({
        unitNum,
        nodeKey: `u${unitNum}_node-boss`,
        nodeId: nBoss.id,
        title: bossTitle,
        desc: `${unitTitle} 총정리 & 특별 보상`,
        align: 'mx-auto mb-6',
        width: '290px',
        isCompleted: (!isBossUnlocked) ? false : (bossData.clearedCount >= 1 || unitNum < unlockedLevel),
        isActive: isBossActive,
        isLocked: !isBossUnlocked
      })}
        </div>
      `;
    }

    container.innerHTML = html;

    // Subsequent nodes interaction handling
    container.querySelectorAll('.subsequent-node-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uNum = parseInt(btn.dataset.unitNumber, 10);
        const nType = btn.dataset.nodeType;
        const nId = btn.dataset.nodeId;
        const isLocked = btn.dataset.isLocked === 'true' || btn.getAttribute('data-is-locked') === 'true';

        // 🛑 잠겨있는 노드 클릭 차단
        if (isLocked) {
          if (nType === 'bonus') {
            if (typeof window.showToast === 'function') {
              window.showToast('🔒 1과와 2과를 모두 마스터해야 보너스 상자를 열 수 있어요! 🎁');
            } else {
              alert('1과와 2과를 모두 마스터해야 보너스 상자를 열 수 있어요! 🎁');
            }
            return;
          }
          // 일반 스테이지 잠김 -> Unit Skip Modal
          const targetUnitObj = units[uNum - 1];
          if (typeof window.openUnitSkipModal === 'function') {
            window.openUnitSkipModal(uNum, targetUnitObj?.title || `Unit ${uNum}`, lang);
          }
          return;
        }

        if (nType === 'bonus') {
          openBonusModal(nId || `u${uNum}_node-bonus`);
        } else if (nType === 'review') {
          openReviewSpeedrunModal(uNum, nId || `u${uNum}_node-review`);
        } else {
          // Unlocked node (stage or boss) -> start lesson!
          if (typeof window.openLessonModal === 'function') {
            window.openLessonModal(nId);
          } else if (typeof window.showToast === 'function') {
            window.showToast(`🚀 Unit ${uNum} (${btn.title || '레슨'}) 시작!`);
          }
        }
      });
    });
  }
  window.renderSubsequentUnits = renderSubsequentUnits;

  // 🛑 [Unit 1 보너스 상자 잠금 가드 추가]
  // Unit 1의 선물 상자 클릭 시 1과, 2과 완료 여부(clearedCount >= 3) 강제 검증 후 미달 시 차단
  document.addEventListener('click', (e) => {
    const bonusBtn = e.target.closest('#node-bonus, [data-node-id="node-bonus"], .node-bonus-btn');
    if (!bonusBtn) return;

    // 1과, 2과 진행도 확인
    const readProg = (id) => (typeof getNodeProgress === 'function') ? (getNodeProgress(id)?.clearedCount || 0) : 0;
    const prog1 = Math.max(readProg('node-1'), window.nodeProgressMap?.['node-1'] || 0);
    const prog2 = Math.max(readProg('node-2'), window.nodeProgressMap?.['node-2'] || 0);

    // 둘 중 하나라도 3회 미만이면 클릭 이벤트 강제 중단
    if (prog1 < 3 || prog2 < 3) {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (typeof window.showToast === 'function') {
        window.showToast('🔒 1과와 2과를 먼저 완료해야 보너스를 열 수 있어요! 🎁');
      } else {
        alert('1과와 2과를 모두 완료해야 보너스 상자를 열 수 있어요! 🎁');
      }
    }
  }, true);

  let _hasUserScrolledRoadmap = false;
  if (!window._scrollRoadmapListenerAttached) {
    window._scrollRoadmapListenerAttached = true;
    window.addEventListener('scroll', () => {
      _hasUserScrolledRoadmap = true;
    }, { passive: true });
  }

  // 스크롤 위치 기반 상단 배너 동적 갱신 (IntersectionObserver)
  function setupRoadmapObserver() {
    if (window._roadmapObserver) {
      window._roadmapObserver.disconnect();
      window._roadmapObserver = null;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!_hasUserScrolledRoadmap && window.scrollY < 10) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const activeIdx = parseInt(entry.target.dataset.unitIndex, 10);
          if (!isNaN(activeIdx)) {
            window._currentVisibleUnitIndex = activeIdx;
            updateTopUnitBanner(activeIdx);
          }
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.unit-section-block').forEach(el => observer.observe(el));
    window._roadmapObserver = observer;
  }
  window.setupRoadmapObserver = setupRoadmapObserver;

  // 현재 진행 중인 노드로 자동 스크롤 (Auto Scroll to Active Node)
  function autoScrollToActiveNode() {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const currentActiveNode = document.querySelector('.roadmap-node.active, .node-pulse');
        if (currentActiveNode && typeof currentActiveNode.getBoundingClientRect === 'function') {
          const rect = currentActiveNode.getBoundingClientRect();
          if (window.scrollY === 0 && rect && rect.top >= 100 && rect.bottom <= (window.innerHeight || 800)) {
            return;
          }
          if (typeof currentActiveNode.scrollIntoView === 'function') {
            currentActiveNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    });
  }
  window.autoScrollToActiveNode = autoScrollToActiveNode;

  // 로드맵 전체 리렌더링 헬퍼 함수
  function renderRoadmap() {
    const activeCourse = getCurrentCourseData();
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const activeCourseId = activeCourse?.id || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : 'main') || 'main';

    // getUnlockedUnitLevel에 코스 ID까지 함께 전달
    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function'
      ? window.getUnlockedUnitLevel(lang, activeCourseId)
      : 1;

    updateRoadmapNodesUI();
    renderSubsequentUnits(activeCourse, unlockedLevel);
    setupRoadmapObserver();

    if (typeof updateCatMarkerPosition === 'function') {
      updateCatMarkerPosition();
    }
    autoScrollToActiveNode();
  }
  window.renderRoadmap = renderRoadmap;


  function loadUnit(unitIndexOrId) {
    const activeCourse = getCurrentCourseData();
    if (!activeCourse || !Array.isArray(activeCourse.units)) return null;

    let unitIndex = 0;
    if (typeof unitIndexOrId === 'number') {
      unitIndex = (unitIndexOrId >= 1 && unitIndexOrId <= activeCourse.units.length) ? unitIndexOrId - 1 : Math.max(0, Math.min(activeCourse.units.length - 1, unitIndexOrId));
    } else if (typeof unitIndexOrId === 'string') {
      const parsed = parseInt(unitIndexOrId.replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= activeCourse.units.length) {
        unitIndex = parsed - 1;
      } else {
        const foundIdx = activeCourse.units.findIndex(u => u.id === unitIndexOrId || u.unit === unitIndexOrId);
        if (foundIdx >= 0) unitIndex = foundIdx;
      }
    }

    const targetUnit = (activeCourse && Array.isArray(activeCourse.units)) ? (activeCourse.units[unitIndex] || activeCourse.units[0]) : null;
    const unitLevel = unitIndex + 1;
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';

    if (typeof setUnlockedUnitLevel === 'function') {
      setUnlockedUnitLevel(unitLevel, lang);
    }

    const activeCourseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.activeCourseId || 'main';
    window.activeCourseId = activeCourseId;
    try {
      localStorage.setItem('vocadash_active_course', activeCourseId);
    } catch (_) { }

    renderRoadmap();
    return targetUnit;
  }
  window.loadUnit = loadUnit;

  function nextUnit() {
    const activeCourse = getCurrentCourseData();
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const activeCourseId = activeCourse?.id || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : 'main') || 'main';

    // getUnlockedUnitLevel에 activeCourseId까지 함께 전달
    const curLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang, activeCourseId) : 1) || 1;
    const nextLevel = curLevel + 1;
    if (activeCourse && Array.isArray(activeCourse.units) && nextLevel <= activeCourse.units.length) {
      return loadUnit(nextLevel);
    }
    return null;
  }
  window.nextUnit = nextUnit;


  // 코스 스위처 선택 상태 동기화 (모달 & 단어장 드롭다운)
  function updateCourseSwitcherUI(selectedCourseId) {
    const activeId = selectedCourseId || window.activeCourseId || 'main';

    const cards = document.querySelectorAll('.course-switcher-card');
    cards.forEach(card => {
      const cid = card.dataset.courseId;
      const isSelected = (cid === activeId);
      const check = card.querySelector('.course-switcher-check');
      if (isSelected) {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.remove('hidden');
      } else {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.add('hidden');
      }
    });

    const bookItems = document.querySelectorAll('.book-course-item');
    bookItems.forEach(item => {
      const cid = item.dataset.courseId;
      const isSelected = (cid === activeId);
      const check = item.querySelector('.book-course-check');
      if (isSelected) {
        item.className = 'book-course-item flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-bold cursor-pointer transition-all hover:bg-emerald-100/80';
        if (check) check.classList.remove('hidden');
      } else {
        item.className = 'book-course-item flex items-center justify-between p-2.5 rounded-xl border border-transparent text-slate-700 text-xs font-medium cursor-pointer transition-all hover:bg-slate-100';
        if (check) check.classList.add('hidden');
      }
    });
    if (typeof updateBookCourseBadge === 'function') {
      updateBookCourseBadge(window.currentLanguage || 'es', activeId);
    }
    if (typeof updateBookProgressHero === 'function') {
      updateBookProgressHero();
    }
    if (typeof renderPacksScreenUI === 'function') {
      renderPacksScreenUI();
    }
  }
  window.updateCourseSwitcherUI = updateCourseSwitcherUI;

  // 단어팩 보관함 화면 UI 렌더링 함수
  function renderPacksScreenUI(lang) {
    const packsScreen = document.getElementById('packs-screen');
    if (!packsScreen) return;

    // 언어 탭 상태 결정: 파라미터 -> window.currentPacksLang -> window.currentLanguage -> 'es'
    const currentLang = lang || window.currentPacksLang || (window.currentLanguage === 'en' ? 'en' : 'es');
    window.currentPacksLang = currentLang;

    // 0) 언어 세그먼트 탭 UI 갱신
    const tabEs = document.getElementById('packs-tab-es');
    const tabEn = document.getElementById('packs-tab-en');
    if (tabEs && tabEn) {
      if (currentLang === 'es') {
        tabEs.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer bg-white text-emerald-800 shadow-xs font-black';
        tabEn.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer text-slate-600 hover:text-slate-900 font-bold';
      } else {
        tabEn.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer bg-white text-blue-800 shadow-xs font-black';
        tabEs.className = 'packs-lang-tab flex-1 py-2 rounded-xl text-center transition-all cursor-pointer text-slate-600 hover:text-slate-900 font-bold';
      }
    }

    const activeId = window.activeCourseId || localStorage.getItem('vocadash_active_course') || 'main';

    // 1) Active Hero Banner
    const heroTitle = document.getElementById('packs-hero-title');
    const heroDesc = document.getElementById('packs-hero-desc');
    const heroIcon = document.getElementById('packs-hero-icon');
    const heroStatusPill = document.getElementById('packs-hero-status-pill');

    if (activeId === 'pack_football') {
      if (heroTitle) heroTitle.textContent = '스페인 축구 실전팩 (Official DLC)';
      if (heroDesc) heroDesc.textContent = '스페인 현지 경기장 & 피치 콜 필수 어휘 60개';
      if (heroIcon) heroIcon.textContent = '⚽';
    } else if ((window.currentLanguage || 'es') === 'en') {
      if (heroTitle) heroTitle.textContent = '영어 정규 코스 (기본 코스)';
      if (heroDesc) heroDesc.textContent = '일상 회화 & 실전 기초 어휘 마스터 40개';
      if (heroIcon) heroIcon.textContent = '🇺🇸';
    } else {
      if (heroTitle) heroTitle.textContent = '스페인어 정규 코스 (기본 코스)';
      if (heroDesc) heroDesc.textContent = '일상 회화 & 실전 기초 어휘 마스터 40개';
      if (heroIcon) heroIcon.textContent = '🇪🇸';
    }

    // 2) Pack Cards Status & Buttons
    const packCards = packsScreen.querySelectorAll('.pack-card[data-pack-id]');
    let visibleCount = 0;
    packCards.forEach(card => {
      const cardLang = card.dataset.packLang || 'es';
      if (cardLang === currentLang) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }

      const pid = card.dataset.packId;
      const isEquipped = (pid === activeId) || (pid === 'main_en' && activeId === 'main' && (window.currentLanguage || 'es') === 'en') || (pid === 'main' && activeId === 'main' && (window.currentLanguage || 'es') === 'es');
      const equipBtn = card.querySelector('.btn-pack-equip');

      if (pid === 'pack_football' || pid === 'main' || pid === 'main_en') {
        if (isEquipped) {
          card.classList.remove('border-slate-200/90', 'border-slate-200');
          card.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500/20', 'bg-emerald-50/20');
          if (equipBtn) {
            equipBtn.className = 'btn-pack-equip px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 bg-emerald-500 text-white shadow-xs cursor-default pointer-events-none';
            equipBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check_circle</span> 장착 중';
            equipBtn.disabled = true;
          }
        } else {
          card.classList.remove('border-emerald-500', 'ring-2', 'ring-emerald-500/20', 'bg-emerald-50/20');
          card.classList.add('border-slate-200/90');
          if (equipBtn) {
            equipBtn.className = 'btn-pack-equip px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 bg-slate-900 hover:bg-emerald-600 text-white shadow-xs';
            equipBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">bolt</span> 장착하기';
            equipBtn.disabled = false;
          }
        }
      }
    });

    const countLabel = document.getElementById('packs-count-label');
    if (countLabel) {
      countLabel.textContent = `${visibleCount}개 사용 가능`;
    }

    initPacksScreenEvents();
  }
  window.renderPacksScreenUI = renderPacksScreenUI;

  function initPacksScreenEvents() {
    const packsScreen = document.getElementById('packs-screen');
    if (!packsScreen || packsScreen.dataset.eventsBound === 'true') return;
    packsScreen.dataset.eventsBound = 'true';

    // 언어 세그먼트 탭 클릭 이벤트
    const tabEs = document.getElementById('packs-tab-es');
    const tabEn = document.getElementById('packs-tab-en');
    if (tabEs) {
      tabEs.addEventListener('click', () => {
        renderPacksScreenUI('es');
        if (typeof window.triggerHaptic === 'function') window.triggerHaptic(15);
      });
    }
    if (tabEn) {
      tabEn.addEventListener('click', () => {
        renderPacksScreenUI('en');
        if (typeof window.triggerHaptic === 'function') window.triggerHaptic(15);
      });
    }

    packsScreen.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-pack-equip');
      if (!btn || btn.disabled) return;
      const packId = btn.dataset.packId;
      if (!packId || packId === window.activeCourseId) return;

      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic(25);
      }
      if (typeof window.playGameSFX === 'function') {
        window.playGameSFX('powerup');
      }

      if (typeof window.switchCourse === 'function') {
        window.switchCourse(packId);
      } else {
        window.activeCourseId = packId;
        window.currentBookCourseId = packId;
        try {
          localStorage.setItem('vocadash_active_course', packId);
        } catch (_) { }
      }
      renderPacksScreenUI();
    });
  }
  window.initPacksScreenEvents = initPacksScreenEvents;

  // 단어팩(DLC/확장팩) 및 메인 코스 전환 함수
  function switchCourse(courseId) {
    let targetId = courseId || 'main';
    if (targetId === 'main_en') {
      targetId = 'main';
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('en');
      } else {
        window.currentLanguage = 'en';
        window.currentActiveCourse = 'en';
      }
    } else if (targetId === 'pack_football') {
      if ((window.currentLanguage || 'es') !== 'es' && typeof window.setLanguage === 'function') {
        window.setLanguage('es');
      }
    }

    const activeLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    targetId = (targetId === 'pack_football') ? 'pack_football' : 'main';

    window.activeCourseId = targetId;
    window.currentCourseId = targetId;
    window.currentBookCourseId = targetId;
    try {
      localStorage.setItem(`vocadash_active_course_${activeLang}`, targetId);
      localStorage.setItem('vocadash_active_course', targetId);
      localStorage.setItem('vocadash_current_course', targetId);
    } catch (_) { }

    // 진행도 상태를 해당 activeLang과 targetId 기준으로 새로고침
    window.nodeProgressMap = loadNodeProgress(activeLang, targetId);

    // 새 코스의 로드맵 화면 리렌더링
    const curUnlocked = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(activeLang, targetId) : 1;
    window._currentVisibleUnitIndex = curUnlocked - 1;
    if (typeof updateRoadmapNodesUI === 'function') {
      updateRoadmapNodesUI();
    }
    renderRoadmap();

    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    if (typeof renderUnitOverviewList === 'function') {
      renderUnitOverviewList(lang, targetId);
    }
    if (typeof renderBookWords === 'function') {
      renderBookWords(lang, targetId);
    }
    if (typeof renderBookCourseDropdown === 'function') {
      renderBookCourseDropdown(lang, targetId);
    }
    updateCourseSwitcherUI(targetId);

    const title = targetId === 'pack_football' ? (lang === 'en' ? '축구 실전팩 (DLC)' : '스페인 축구 실전팩') : (targetId === 'main_en' || lang === 'en' ? '영어 정규 코스' : '스페인어 정규 코스');
    const icon = targetId === 'pack_football' ? '⚽' : (targetId === 'main_en' || lang === 'en' ? '🇺🇸' : '🇪🇸');
    if (typeof window.showToast === 'function') {
      window.showToast(`${icon} '${title}' 코스로 전환되었습니다!`, '🚀');
    }
  }
  window.switchCourse = switchCourse;


  // 고양이 캐릭터 아바타 바운스 위치 마커 동적 갱신 함수
  function updateCatMarkerPosition() {
    const marker = el('roadmap-cat-marker');
    if (!marker) return;

    const prog1 = window.nodeProgressMap['node-1'] !== undefined ? window.nodeProgressMap['node-1'] : 0;
    const prog2 = window.nodeProgressMap['node-2'] || 0;
    const prog3 = window.nodeProgressMap['node-3'] || 0;
    const progBoss = window.nodeProgressMap['node-boss'] || 0;

    let targetParent = el('node-1-target');
    if (prog1 < 3) {
      targetParent = el('node-1-target');
    } else if (prog2 < 3) {
      targetParent = el('node-2-target');
    } else if (prog3 < 3) {
      targetParent = el('node-3-target');
    } else {
      targetParent = el('node-boss-target');
    }

    if (targetParent && marker.parentElement !== targetParent) {
      targetParent.appendChild(marker);
    }

    // 마커 아바타 이미지 src를 상단 헤더 프로필과 동기화
    const markerImg = el('cat-marker-img');
    const headerImg = el('header-mascot-img');
    if (markerImg && headerImg && headerImg.src) {
      markerImg.src = headerImg.src;
    }
  }
  window.updateCatMarkerPosition = updateCatMarkerPosition;

  function showLockedTooltip(targetBtn) {
    if (!lockedTooltip || !targetBtn) return;
    clearTimeout(lockedTooltipTimer); targetBtn.appendChild(lockedTooltip);
    lockedTooltip.classList.remove('hidden', 'opacity-0', 'scale-95'); lockedTooltip.classList.add('opacity-100', 'scale-100');
    lockedTooltipTimer = setTimeout(() => { lockedTooltip.classList.add('opacity-0', 'scale-95'); setTimeout(() => lockedTooltip.classList.add('hidden'), 200); }, 2400);
  }

  // 보너스 선물 상자 모달 제어 (1회 한정 수령 및 재수령 방지)
  function openBonusModal(nodeId = 'node-bonus') {
    window.currentBonusNodeId = nodeId;
    const backdrop = el('bonus-modal-backdrop');
    const card = el('bonus-modal-card');
    if (!backdrop || !card) return;

    const claimed = isBonusClaimed(nodeId);
    const titleEl = el('bonus-modal-title');
    const descEl = el('bonus-modal-desc');
    const claimBtn = el('bonus-claim-btn');
    const rewardCard = card.querySelector('.border-amber-200') || card.querySelector('.bg-gradient-to-r');

    if (claimed) {
      if (titleEl) titleEl.textContent = '보너스 선물 (수령 완료)';
      if (descEl) descEl.textContent = '이미 수령한 보너스 선물입니다! 🎁 (획득 완료)\n응원 팁: 매일 꾸준히 달리면 실력이 쑥쑥 늘어요!';
      if (claimBtn) {
        claimBtn.textContent = '확인 (수령 완료)';
        claimBtn.className = 'w-full py-3 px-4 rounded-xl bg-slate-300 hover:bg-slate-400 text-slate-700 font-extrabold text-xs shadow-sm transition-all cursor-pointer';
      }
      if (rewardCard) {
        rewardCard.innerHTML = '<span class="text-xl">📦</span><span class="font-black text-sm text-slate-600">수령 완료 (보석 +15 지급됨)</span>';
      }
    } else {
      if (titleEl) titleEl.textContent = '깜짝 보너스 상자 오픈!';
      if (descEl) descEl.textContent = '열심히 달린 러너를 위한 특별 응원 선물이에요!';
      if (claimBtn) {
        claimBtn.textContent = '보상 받기 ✨';
        claimBtn.className = 'w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer';
      }
      if (rewardCard) {
        rewardCard.innerHTML = '<span class="text-xl">💎</span><span class="font-black text-sm text-amber-900">+15 다이아몬드</span>';
      }
    }

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');
    card.classList.remove('opacity-0', 'scale-95');
    card.classList.add('opacity-100', 'scale-100');
  }
  window.openBonusModal = openBonusModal;

  function closeBonusModal() {
    const backdrop = el('bonus-modal-backdrop');
    const card = el('bonus-modal-card');
    if (!backdrop || !card) return;
    backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    card.classList.remove('opacity-100', 'scale-100');
    card.classList.add('opacity-0', 'scale-95');
  }
  window.closeBonusModal = closeBonusModal;

  // 현재 유닛 및 코스의 일반 단어 풀 추출 헬퍼 함수
  function getCurrentUnitGeneralWords(currentLang) {
    const lang = (currentLang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let pool = [];

    const db = (window.VOCA_DATA && window.VOCA_DATA.database) || (typeof database !== 'undefined' ? database : null);
    if (db) {
      ['node-1', 'node-2', 'node-3', 'node-boss'].forEach(nid => {
        if (db[nid]) {
          const arr = db[nid][lang] || db[nid].words || db[nid].all || (Array.isArray(db[nid]) ? db[nid] : []);
          if (Array.isArray(arr)) {
            arr.forEach(w => {
              if (w && (w.term || w.word)) {
                pool.push({
                  id: w.id || `gen_${w.term || w.word}`,
                  term: w.term || w.word || '',
                  meaning: w.meaning || w.kor || w.ko || '',
                  phonetic: w.phonetic || '',
                  lang: lang
                });
              }
            });
          }
        }
      });
    }

    if (pool.length < 10 && window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      const s1 = window.VOCA_DATA.generateStageSession('node-1', lang) || [];
      const s2 = window.VOCA_DATA.generateStageSession('node-2', lang) || [];
      [...s1, ...s2].forEach(w => {
        if (w && (w.term || w.word)) {
          pool.push({
            id: w.id || `sess_${w.term || w.word}`,
            term: w.term || w.word || '',
            meaning: w.meaning || w.kor || w.ko || '',
            phonetic: w.phonetic || '',
            lang: lang
          });
        }
      });
    }

    if (pool.length < 10 && window.VOCA_DATA && Array.isArray(window.VOCA_DATA.words)) {
      window.VOCA_DATA.words.forEach(w => {
        if (w && (w.term || w.word)) {
          pool.push({
            id: w.id || `voca_${w.term || w.word}`,
            term: w.term || w.word || '',
            meaning: w.meaning || w.kor || w.ko || '',
            phonetic: w.phonetic || '',
            lang: lang
          });
        }
      });
    }

    const seen = new Set();
    const deduped = [];
    for (const item of pool) {
      const key = (item.term || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    return deduped;
  }
  window.getCurrentUnitGeneralWords = getCurrentUnitGeneralWords;

  // ===================================================
  // SPEED RUN REVIEW MODAL (약점 극복 스피드 런 모달) 로직
  // ===================================================
  function openReviewSpeedrunModal(unitNum = null, nodeId = null) {
    const backdrop = el('review-speedrun-modal-backdrop');
    const card = el('review-speedrun-modal-card');
    if (!backdrop || !card) return;

    const resolvedUnit = unitNum || (nodeId ? parseNodeCoordinates(nodeId).unitIndex : null) || window.currentUnitNumber || 1;
    const resolvedNodeId = nodeId || (typeof getCompositeNodeKey === 'function' ? getCompositeNodeKey('node-review', resolvedUnit) : `u${resolvedUnit}_node-review`);
    window.currentReviewUnitNumber = resolvedUnit;
    window.currentReviewNodeId = resolvedNodeId;

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
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

    const titleEl = el('review-speedrun-modal-title');
    const descEl = el('review-speedrun-modal-desc');
    const countText = el('review-speedrun-target-count');
    const rewardEl = card.querySelector('.text-amber-700 span:last-child') || card.querySelector('.text-amber-700');

    if (titleEl) {
      titleEl.textContent = '⚡ 약점 극복 스피드 런 (10문제)';
    }

    const wrongCount = wrongList.length;
    if (wrongCount === 0) {
      if (descEl) {
        descEl.textContent = '오답 노트가 깨끗합니다! 👏 현재 유닛 복습 런을 진행하고 보너스 보석 5개를 받으세요!';
      }
      if (countText) {
        countText.textContent = '현재 유닛 복습 10문제 코스';
      }
      if (rewardEl) {
        rewardEl.textContent = '+5 💎';
      }
    } else if (wrongCount >= 10) {
      if (descEl) {
        descEl.textContent = '틀렸던 약점 단어를 포함해 총 10문제를 달립니다! (각 단어 5회 연속 정답 시 오답 노트에서 영구 탈출)';
      }
      if (countText) {
        countText.textContent = '오답 단어 10개 코스';
      }
      if (rewardEl) {
        rewardEl.textContent = '+10 💎';
      }
    } else {
      // 1 ~ 9개
      if (descEl) {
        descEl.textContent = '틀렸던 약점 단어를 포함해 총 10문제를 달립니다! (각 단어 5회 연속 정답 시 오답 노트에서 영구 탈출)';
      }
      if (countText) {
        countText.textContent = `오답 ${wrongCount}개 + 유닛 단어 ${10 - wrongCount}개 코스`;
      }
      if (rewardEl) {
        rewardEl.textContent = '+10 💎';
      }
    }

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    card.classList.remove('opacity-0', 'scale-95');
    card.classList.add('opacity-100', 'scale-100');
  }
  window.openReviewSpeedrunModal = openReviewSpeedrunModal;

  function closeReviewSpeedrunModal() {
    const backdrop = el('review-speedrun-modal-backdrop');
    const card = el('review-speedrun-modal-card');
    if (!backdrop || !card) return;
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    card.classList.remove('opacity-100', 'scale-100');
    card.classList.add('opacity-0', 'scale-95');
  }
  window.closeReviewSpeedrunModal = closeReviewSpeedrunModal;

  function startRoadmapReviewSpeedrun() {
    if (typeof closeReviewSpeedrunModal === 'function') closeReviewSpeedrunModal();
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';

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

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // 💡 유저가 지금까지 실제로 통과/학습한 이전 노드들의 단어만 수집하는 헬퍼 함수
    function getLearnedWordsPool() {
      let learnedPool = [];
      const db = (window.VOCA_DATA && window.VOCA_DATA.database) || (typeof database !== 'undefined' ? database : null);
      const curCourse = (typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : (window.packFootballData || window.courseData_es || window.courseData);

      // 1) 코스 데이터 트리에서 이전 노드들의 단어 수집
      if (curCourse && Array.isArray(curCourse.units)) {
        curCourse.units.forEach(unit => {
          if (Array.isArray(unit.nodes)) {
            unit.nodes.forEach(node => {
              if (Array.isArray(node.words) && node.words.length > 0) {
                learnedPool = learnedPool.concat(node.words);
              }
            });
          }
        });
      }

      // 2) 데이터베이스(VOCA_DATA.database) 형태일 경우 (node-1, node-2 등)
      if (learnedPool.length === 0 && db) {
        ['node-1', 'node-2', 'node-3', 'node-boss'].forEach(nId => {
          if (db[nId]) {
            const words = db[nId][currentLang] || db[nId].words || db[nId].all || (Array.isArray(db[nId]) ? db[nId] : null);
            if (Array.isArray(words)) {
              learnedPool = learnedPool.concat(words);
            }
          }
        });
      }

      // 3) 혹시 비어있을 경우 현재 코스의 기본 단어 리스트 활용
      if (learnedPool.length === 0 && Array.isArray(window.currentCourseWordList)) {
        learnedPool = window.currentCourseWordList;
      }

      return learnedPool;
    }

    let selectedWords = [];
    window.isSpeedrunZeroWrongBonus = false;

    if (wrongList.length >= 10) {
      // 1) 오답 10개 이상: 오답 단어 풀에서 10단어를 무작위 선정
      const shuffledWrong = shuffleArray(wrongList);
      selectedWords = shuffledWrong.slice(0, 10);
    } else if (wrongList.length >= 1) {
      // 2) 오답 1~9개: 오답 단어들만 반복 순환하여 10문제 완성
      const shuffledWrong = shuffleArray(wrongList);
      let idx = 0;
      while (selectedWords.length < 10) {
        selectedWords.push({ ...shuffledWrong[idx % shuffledWrong.length] });
        idx++;
      }
      selectedWords = shuffleArray(selectedWords);
    } else {
      // 🌟 3) 오답 0개 (만점자 복습 모드): 지금까지 학습한 단어들 중에서 10단어 추출
      window.isSpeedrunZeroWrongBonus = true;
      const learnedPool = getLearnedWordsPool();
      const shuffledLearned = shuffleArray(learnedPool);

      if (shuffledLearned.length > 0) {
        let gIdx = 0;
        while (selectedWords.length < 10) {
          selectedWords.push({ ...shuffledLearned[gIdx % shuffledLearned.length] });
          gIdx++;
        }
        selectedWords = shuffleArray(selectedWords);
      }
    }

    // fallback: 혹시 모를 빈 배열 방지 (10개 미만일 때 이전 학습 단어로 채움)
    if (selectedWords.length < 10) {
      const fallbackPool = getLearnedWordsPool();
      let fIdx = 0;
      while (selectedWords.length < 10 && fallbackPool.length > 0) {
        selectedWords.push({ ...fallbackPool[fIdx % fallbackPool.length] });
        fIdx++;
      }
    }


    // 세션 문제 데이터 객체 매핑
    const sessionQuestions = selectedWords.slice(0, 10).map((item, idx) => ({
      id: item.id || `speedrun-q-${idx}`,
      word: item.term || item.word || '',
      term: item.term || item.word || '',
      meaning: item.meaning || item.kor || item.ko || '',
      phonetic: item.phonetic || '',
      correctStreak: Number(item.correctStreak) || 0,
      type: 'word',
      isSentence: false,
      tag: '약점 복습',
      isReviewMode: true,
      lang: item.lang || currentLang
    }));

    const targetReviewUnit = window.currentReviewUnitNumber || window.currentUnitNumber || 1;
    const targetReviewId = window.currentReviewNodeId || (typeof getCompositeNodeKey === 'function' ? getCompositeNodeKey('node-review', targetReviewUnit) : `u${targetReviewUnit}_node-review`);

    window.isReviewGameMode = true;
    window.isRoadmapReviewSpeedrun = true;
    window.currentReviewSpeedrunWords = selectedWords;
    window.currentSpeedrunSessionWords = selectedWords;
    window.currentSessionQuestions = sessionQuestions;

    // 게임 화면 실행
    if (typeof window.launchGameWithWords === 'function') {
      window.launchGameWithWords('wrong_answer', selectedWords, targetReviewId);
    } else if (typeof window.openGameScreen === 'function') {
      window.openGameScreen(targetReviewId, sessionQuestions);
    } else if (typeof window.startGameSession === 'function') {
      window.startGameSession(targetReviewId, sessionQuestions);
    } else if (typeof window.launchGame === 'function') {
      window.launchGame('wrong_answer');
    }

    const titleEl = document.getElementById('game-stage-title');
    if (titleEl) {
      titleEl.textContent = '⚡ 약점 극복 스피드 런 (10문제)';
    }
  }
  window.startRoadmapReviewSpeedrun = startRoadmapReviewSpeedrun;

  function removeClearedWrongWords(clearedQuestions) {
    if (!Array.isArray(clearedQuestions) || clearedQuestions.length === 0) {
      if (typeof updateWrongWordsBadge === 'function') updateWrongWordsBadge();
      if (typeof renderReviewWords === 'function') renderReviewWords(window.currentReviewFilter || 'waiting');
      return;
    }
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';

    const termsToRemove = new Set();
    const idsToRemove = new Set();
    clearedQuestions.forEach(q => {
      if (q.id) idsToRemove.add(String(q.id));
      if (q.term) termsToRemove.add(String(q.term).trim().toLowerCase());
      if (q.word) termsToRemove.add(String(q.word).trim().toLowerCase());
    });

    const currentList = Array.isArray(window.wrongWords) ? window.wrongWords : (typeof loadWrongWords === 'function' ? loadWrongWords(lang) : []);
    const updated = currentList.filter(item => {
      const idMatch = item.id && idsToRemove.has(String(item.id));
      const termMatch = item.term && termsToRemove.has(String(item.term).trim().toLowerCase());
      const wordMatch = item.word && termsToRemove.has(String(item.word).trim().toLowerCase());
      return !(idMatch || termMatch || wordMatch);
    });
    window.wrongWords = updated;
    if (typeof saveWrongWords === 'function') {
      saveWrongWords(updated, lang);
    }

    try {
      const raw = localStorage.getItem('vocadash_wrong_words');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filteredRaw = parsed.filter(item => {
            const idMatch = item.id && idsToRemove.has(String(item.id));
            const termMatch = item.term && termsToRemove.has(String(item.term).trim().toLowerCase());
            const wordMatch = item.word && termsToRemove.has(String(item.word).trim().toLowerCase());
            return !(idMatch || termMatch || wordMatch);
          });
          localStorage.setItem('vocadash_wrong_words', JSON.stringify(filteredRaw));
        }
      }
    } catch (_) { }

    if (typeof updateWrongWordsBadge === 'function') {
      updateWrongWordsBadge();
    }
    if (typeof renderReviewWords === 'function') {
      renderReviewWords(window.currentReviewFilter || 'waiting');
    }

    try {
      let curGems = 120;
      const savedGems = localStorage.getItem('vocadash_gems');
      if (savedGems !== null) curGems = parseInt(savedGems, 10) || 120;
      curGems += 10;
      localStorage.setItem('vocadash_gems', curGems.toString());
      const gemsEl = document.getElementById('header-gems-count');
      if (gemsEl) gemsEl.textContent = curGems;
    } catch (_) { }
  }
  window.removeClearedWrongWords = removeClearedWrongWords;


  document.querySelectorAll('.roadmap-node').forEach((node) => {
    const nid = node.dataset.nodeId;
    node.addEventListener('click', (e) => {
      if (nid === 'node-1') {
        window.openLessonModal('node-1');
        return;
      }
      if (nid === 'node-2') {
        const btn2 = el('node-2-btn') || node;
        if ((window.nodeProgressMap['node-1'] || 0) < 3) {
          btn2.classList.add('animate-lock-shake'); setTimeout(() => btn2.classList.remove('animate-lock-shake'), 450); showLockedTooltip(btn2);
          return;
        }
      } else if (nid === 'node-bonus') {
        const btnBonus = el('node-bonus-btn') || node;
        if ((window.nodeProgressMap['node-1'] || 0) < 3) {
          btnBonus.classList.add('animate-lock-shake'); setTimeout(() => btnBonus.classList.remove('animate-lock-shake'), 450); showLockedTooltip(btnBonus);
          return;
        }
        openBonusModal();
        return;
      } else if (nid === 'node-review') {
        const btnReview = el('node-review-btn') || node;
        if ((window.nodeProgressMap['node-1'] || 0) < 3 || !isBonusClaimed('node-bonus')) {
          btnReview.classList.add('animate-lock-shake'); setTimeout(() => btnReview.classList.remove('animate-lock-shake'), 450); showLockedTooltip(btnReview);
          return;
        }
        openReviewSpeedrunModal();
        return;
      } else if (nid === 'node-3') {
        const btn3 = el('node-3-btn') || node;
        const isN3Unlocked = (typeof isNodeUnlocked === 'function')
          ? isNodeUnlocked(0, 4, { id: 'node-3', type: 'stage' })
          : isReviewNodeCompleted('node-review');
        if (!isN3Unlocked) {
          btn3.classList.add('animate-lock-shake'); setTimeout(() => btn3.classList.remove('animate-lock-shake'), 450); showLockedTooltip(btn3);
          return;
        }
      } else if (nid === 'node-boss') {
        const btnBoss = el('node-boss-btn') || node.querySelector('.node-btn') || node;
        if ((window.nodeProgressMap['node-3'] || 0) < 3) {
          btnBoss.classList.add('animate-lock-shake');
          setTimeout(() => btnBoss.classList.remove('animate-lock-shake'), 450);
          showLockedTooltip(btnBoss);
          return;
        }
      }
      window.openLessonModal(nid);
    });
  });

  on('node-1-btn', 'click', () => window.openLessonModal('node-1'));
  on('node-2-btn', 'click', (e) => {
    if ((window.nodeProgressMap['node-1'] || 0) < 3) {
      e.stopPropagation();
      const btn2 = el('node-2-btn');
      if (btn2) {
        btn2.classList.add('animate-lock-shake');
        setTimeout(() => btn2.classList.remove('animate-lock-shake'), 450);
        showLockedTooltip(btn2);
      }
      return;
    }
    window.openLessonModal('node-2');
  });
  on('node-bonus-btn', 'click', (e) => {
    e.stopPropagation();
    openBonusModal();
  });
  on('node-review-btn', 'click', (e) => {
    e.stopPropagation();
    if ((window.nodeProgressMap['node-2'] || 0) < 1 || !isBonusClaimed('node-bonus')) {
      const btnReview = el('node-review-btn');
      if (btnReview) {
        btnReview.classList.add('animate-lock-shake');
        setTimeout(() => btnReview.classList.remove('animate-lock-shake'), 450);
        showLockedTooltip(btnReview);
      }
      return;
    }
    openReviewSpeedrunModal();
  });
  on('node-3-btn', 'click', (e) => {
    const isN3Unlocked = (typeof isNodeUnlocked === 'function')
      ? isNodeUnlocked(0, 4, { id: 'node-3', type: 'stage' })
      : isReviewNodeCompleted('node-review');
    if (!isN3Unlocked) {
      e.stopPropagation();
      const btn3 = el('node-3-btn');
      if (btn3) {
        btn3.classList.add('animate-lock-shake');
        setTimeout(() => btn3.classList.remove('animate-lock-shake'), 450);
        showLockedTooltip(btn3);
      }
      return;
    }
    window.openLessonModal('node-3');
  });
  on('btn-start-speedrun-game', 'click', () => {
    startRoadmapReviewSpeedrun();
  });
  on('btn-close-speedrun-modal', 'click', () => {
    closeReviewSpeedrunModal();
  });
  const speedrunBackdrop = el('review-speedrun-modal-backdrop');
  if (speedrunBackdrop) {
    speedrunBackdrop.addEventListener('click', (e) => {
      if (e.target === speedrunBackdrop) closeReviewSpeedrunModal();
    });
  }
  // ===================================================
  // UNIT OVERVIEW BOTTOM SHEET & SKIP TEST RUNNING GAME
  // ===================================================
  function unlockUnitsUpTo(targetUnit, targetLang) {
    const lang = targetLang || ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es');
    const currentUnlocked = getUnlockedUnitLevel(lang);
    const newLevel = Math.max(currentUnlocked, Math.min(10, parseInt(targetUnit, 10) || 1));
    setUnlockedUnitLevel(newLevel, lang);
    window._currentVisibleUnitIndex = newLevel - 1;
    _hasUserScrolledRoadmap = false;

    // 목표 유닛 진입: 1번 노드만 0(active/도전 가능), 2번 노드부터 끝까지 0(locked)으로 설정
    window.nodeProgressMap = {
      'node-1': 0,
      'node-2': 0,
      'node-3': 0,
      'node-boss': 0
    };

    if (typeof window.saveNodeProgress === 'function') {
      window.saveNodeProgress();
    }
    if (typeof window.closeUnitSkipModal === 'function') {
      window.closeUnitSkipModal();
    }
    if (typeof window.closeUnitOverviewModal === 'function') {
      window.closeUnitOverviewModal();
    }
    if (typeof window.updateRoadmapNodesUI === 'function') {
      window.updateRoadmapNodesUI();
    }
    if (typeof window.updateCatMarkerPosition === 'function') {
      window.updateCatMarkerPosition();
    }
    if (typeof renderUnitOverviewList === 'function') {
      renderUnitOverviewList(lang);
    }

    // 시험 통과 후 모달을 닫고, 목표 유닛의 1번 노드 위치로 로드맵 스크롤 뷰 이동
    const targetNodeEl = document.getElementById('node-1-btn') || document.querySelector('[data-node-id="node-1"]');
    if (targetNodeEl) {
      targetNodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  window.unlockUnitsUpTo = unlockUnitsUpTo;

  function renderUnitOverviewList(targetLang) {
    const lang = targetLang === 'en' ? 'en' : 'es';
    const listEl = el('unit-overview-list');
    const titleEl = el('unit-overview-title');
    const subtitleEl = el('unit-overview-subtitle');
    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang) : 1;

    const activeCourse = getCurrentCourseData();
    let units = (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS[lang]) || UNIT_LIST_PRESETS[lang] || UNIT_LIST_PRESETS.es;
    if (activeCourse && (activeCourse.id === 'pack_football' || activeCourse.courseId === 'pack_football') && activeCourse.units) {
      if (Array.isArray(activeCourse.units)) {
        units = activeCourse.units;
      } else if (activeCourse.units[lang]) {
        units = activeCourse.units[lang];
      }
    }

    if (titleEl) {
      if (window.activeCourseId === 'pack_football') {
        titleEl.textContent = '⚽ 축구 단어팩 코스 맵';
      } else {
        titleEl.textContent = lang === 'en' ? '영어 코스 맵' : '스페인어 코스 맵';
      }
    }
    if (subtitleEl) {
      subtitleEl.textContent = `총 ${units.length}개 유닛 중 Unit ${unlockedLevel} 진행 중`;
    }
    if (!listEl) return;
    let html = '';

    units.forEach((item) => {
      const isCompleted = item.unit < unlockedLevel;
      const isActive = item.unit === unlockedLevel;
      const progress = isCompleted ? 100 : (isActive ? 35 : 0);

      if (isCompleted) {
        html += `
          <div class="unit-item-card p-3.5 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 shadow-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between" data-unit="${item.unit}" data-title="${escapeHTML(item.title)}" data-status="completed">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                U${item.unit}
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-black text-emerald-950 leading-tight">Unit ${item.unit} : ${escapeHTML(item.title)}</span>
                  <span class="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-tight leading-none border border-emerald-300">완료됨</span>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 mt-0.5 truncate">${escapeHTML(item.subtitle)}</span>
                <div class="w-36 bg-emerald-200/80 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div class="h-full bg-emerald-600 rounded-full" style="width: 100%;"></div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 text-emerald-700 font-extrabold text-xs flex-shrink-0 ml-2">
              <span class="material-symbols-outlined text-base text-emerald-600 font-bold">check_circle</span>
            </div>
          </div>
        `;
      } else if (isActive) {
        html += `
          <div class="unit-item-card p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 shadow-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between" data-unit="${item.unit}" data-title="${escapeHTML(item.title)}" data-status="active">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                U${item.unit}
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-black text-emerald-900 leading-tight">Unit ${item.unit} : ${escapeHTML(item.title)}</span>
                  <span class="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-tight leading-none">진행 중</span>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 mt-0.5 truncate">${escapeHTML(item.subtitle)}</span>
                <div class="w-36 bg-emerald-200/80 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div class="h-full bg-emerald-600 rounded-full" style="width: ${progress}%;"></div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 text-emerald-700 font-extrabold text-xs flex-shrink-0 ml-2">
              <span>${progress}%</span>
              <span class="material-symbols-outlined text-sm">arrow_forward_ios</span>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="unit-item-card p-3 rounded-2xl border border-slate-200/80 bg-white/90 hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between opacity-85 hover:opacity-100" data-unit="${item.unit}" data-title="${escapeHTML(item.title)}" data-status="locked">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
                U${item.unit}
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-slate-800 leading-tight">Unit ${item.unit} : ${escapeHTML(item.title)}</span>
                </div>
                <span class="text-[11px] font-medium text-slate-400 mt-0.5 truncate">${escapeHTML(item.subtitle)}</span>
              </div>
            </div>
            <div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 ml-2 shadow-2xs">
              <span class="material-symbols-outlined text-[15px] font-bold">lock</span>
            </div>
          </div>
        `;
      }
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.unit-item-card').forEach((card) => {
      card.addEventListener('click', () => {
        const uNum = parseInt(card.dataset.unit, 10);
        const uTitle = card.dataset.title || '';
        const status = card.dataset.status;
        if (status === 'active' || status === 'completed') {
          window.closeUnitOverviewModal();
          const targetSection = document.querySelector(`.unit-section-block[data-unit-index="${uNum - 1}"]`);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          if (typeof window.showToast === 'function') {
            window.showToast(`🚀 Unit ${uNum} (${uTitle || '학습'}) 화면입니다!`);
          }
        } else {
          // 🔒 잠긴 유닛 카드 클릭 시 '건너뛰기 시험 안내 모달' 즉시 노출
          window.openUnitSkipModal(uNum, uTitle, lang);
        }
      });
    });
  }

  const unitOverviewBackdrop = el('unit-overview-modal-backdrop');
  const unitOverviewCard = el('unit-overview-modal-card');

  window.openUnitOverviewModal = function () {
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    renderUnitOverviewList(lang);
    if (unitOverviewBackdrop && unitOverviewCard) {
      unitOverviewBackdrop.classList.remove('pointer-events-none', 'opacity-0');
      unitOverviewBackdrop.classList.add('opacity-100');
      unitOverviewCard.classList.remove('pointer-events-none', 'translate-y-full', 'sm:scale-95', 'opacity-0');
      unitOverviewCard.classList.add('translate-y-0', 'sm:scale-100', 'opacity-100');
    }
  };

  window.closeUnitOverviewModal = function () {
    if (unitOverviewBackdrop && unitOverviewCard) {
      unitOverviewBackdrop.classList.remove('opacity-100');
      unitOverviewBackdrop.classList.add('pointer-events-none', 'opacity-0');
      unitOverviewCard.classList.remove('translate-y-0', 'sm:scale-100', 'opacity-100');
      unitOverviewCard.classList.add('pointer-events-none', 'translate-y-full', 'sm:scale-95', 'opacity-0');
    }
  };

  // ===================================================
  // UNIT SKIP TEST MODAL (잠긴 유닛 건너뛰기 실전 시험 모달)
  // ===================================================
  const unitSkipModalBackdrop = el('unit-skip-modal-backdrop');
  const unitSkipModalCard = el('unit-skip-modal-card');
  const unitSkipModalTitle = el('unit-skip-modal-title');
  const unitSkipModalDesc = el('unit-skip-modal-desc');

  window.openUnitSkipModal = function (unitNum, unitTitle, targetLang) {
    const lang = targetLang || ((window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es');
    const uNum = parseInt(unitNum, 10) || 2;
    const activeCourse = getCurrentCourseData();
    let units = (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS[lang]) || UNIT_LIST_PRESETS[lang] || UNIT_LIST_PRESETS.es;
    if (activeCourse && (activeCourse.id === 'pack_football' || activeCourse.courseId === 'pack_football') && activeCourse.units) {
      if (Array.isArray(activeCourse.units)) {
        units = activeCourse.units;
      } else if (activeCourse.units[lang]) {
        units = activeCourse.units[lang];
      }
    }
    const preset = units.find(u => u.unit === uNum);
    const title = unitTitle || (preset ? preset.title : `Unit ${uNum}`);
    const displayName = preset ? (preset.title.startsWith('Unit') ? preset.title : `Unit ${uNum} ${preset.title}`) : `Unit ${uNum}`;

    window.currentSkipTestUnit = uNum;
    window.currentSkipTestUnitTitle = title;

    if (unitSkipModalTitle) {
      unitSkipModalTitle.textContent = `⚡ ${displayName} 건너뛰기 시험`;
    }
    if (unitSkipModalDesc) {
      unitSkipModalDesc.innerHTML = `앞선 과정을 건너뛰고 이 유닛을 바로 해금할까요?<br>실전 테스트 통과 시 이전 유닛들이 모두 오픈됩니다!`;
    }

    if (unitSkipModalBackdrop && unitSkipModalCard) {
      unitSkipModalBackdrop.classList.remove('pointer-events-none', 'opacity-0');
      unitSkipModalBackdrop.classList.add('opacity-100');
      unitSkipModalCard.classList.remove('pointer-events-none', 'scale-95', 'opacity-0');
      unitSkipModalCard.classList.add('scale-100', 'opacity-100');
    }
  };

  window.closeUnitSkipModal = function () {
    if (unitSkipModalBackdrop && unitSkipModalCard) {
      unitSkipModalBackdrop.classList.remove('opacity-100');
      unitSkipModalBackdrop.classList.add('pointer-events-none', 'opacity-0');
      unitSkipModalCard.classList.remove('scale-100', 'opacity-100');
      unitSkipModalCard.classList.add('pointer-events-none', 'scale-95', 'opacity-0');
    }
  };

  // ===================================================
  // [startRunningGame]: 플래시카드 단계 스킵 및 인게임 직행
  // - 문제 풀: 해당 유닛 이전까지의 모든 단어 데이터 중 무작위 15문제 선정
  // ===================================================
  function startRunningGame(mode, options) {
    const opts = (typeof mode === 'object' && mode !== null) ? mode : (options || {});
    const targetUnit = opts.targetUnit || window.currentSkipTestUnit || 2;
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';

    // 1) Set global test mode flags for gameEngine.js
    window.isUnitSkipTestMode = true;
    window.currentSkipTestUnit = targetUnit;
    window.isReviewGameMode = false;
    window.isRoadmapReviewSpeedrun = false;

    // 2) Collect all vocabulary data from units/stages prior to targetUnit
    let rawPool = [];
    const db = (window.VOCA_DATA && window.VOCA_DATA.database) || (typeof database !== 'undefined' ? database : {});
    const stageKeys = ['node-1'];
    if (targetUnit >= 3) stageKeys.push('node-2');
    if (targetUnit >= 4) stageKeys.push('node-3');
    if (targetUnit >= 5) stageKeys.push('node-boss');

    stageKeys.forEach(k => {
      if (db[k]) {
        const arr = db[k][currentLang] || db[k].words || db[k].all || [];
        if (Array.isArray(arr) && arr.length > 0) {
          rawPool = rawPool.concat(arr);
        }
      }
    });

    // Fallback: if rawPool is insufficient, draw from all available stages in database
    if (rawPool.length < 15) {
      ['node-1', 'node-2', 'node-3', 'node-boss'].forEach(k => {
        if (db[k]) {
          const arr = db[k][currentLang] || db[k].words || db[k].all || [];
          if (Array.isArray(arr) && arr.length > 0) rawPool = rawPool.concat(arr);
        }
      });
    }

    // Secondary fallback: if still insufficient, use VOCA_DATA defaults
    if (rawPool.length < 15 && window.VOCA_DATA) {
      if (Array.isArray(window.VOCA_DATA.words)) {
        rawPool = rawPool.concat(window.VOCA_DATA.words);
      }
      if (typeof window.VOCA_DATA.generateStageSession === 'function') {
        const s1 = window.VOCA_DATA.generateStageSession('node-1', currentLang);
        const s2 = window.VOCA_DATA.generateStageSession('node-2', currentLang);
        rawPool = rawPool.concat(s1).concat(s2);
      }
    }

    // 3) Shuffle and pick exactly 15 questions
    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const shuffled = shuffleArray(rawPool);
    const selected = shuffled.slice(0, 15);
    let sIdx = 0;
    while (selected.length < 15 && rawPool.length > 0) {
      selected.push(rawPool[sIdx % rawPool.length]);
      sIdx++;
    }

    const sessionQuestions = selected.map((item, idx) => {
      const isSent = Boolean(item.type === 'sentence' || item.isSentence);
      return {
        ...item,
        id: item.id || `skip-q-${idx + 1}`,
        word: item.term || item.word || '',
        term: item.term || item.word || '',
        meaning: item.meaning || item.korean || item.kor || '',
        phonetic: item.phonetic || '',
        exampleTarget: item.example || item.exampleTarget || '',
        exampleMeaning: item.exampleKo || item.example_ko || item.exampleMeaning || '',
        isSentence: isSent,
        tag: item.tag || (isSent ? '실전 문장' : '핵심 어휘')
      };
    });

    window.currentSessionQuestions = sessionQuestions;

    // 4) DIRECTLY jump to game screen (BYPASSING flashcards preview!)
    if (typeof window.openGameScreen === 'function') {
      window.openGameScreen('node-skip-test', sessionQuestions);
    } else if (typeof window.startGameSession === 'function') {
      window.startGameSession('node-skip-test', sessionQuestions);
    }

    const stageTitleEl = document.getElementById('game-stage-title');
    if (stageTitleEl) {
      stageTitleEl.textContent = `⚡ Unit ${targetUnit} 건너뛰기 실전 시험`;
    }
  }
  window.startRunningGame = startRunningGame;

  // 이벤트 바인딩
  on('btn-close-unit-skip-modal', 'click', window.closeUnitSkipModal);
  if (unitSkipModalBackdrop) {
    unitSkipModalBackdrop.addEventListener('click', (e) => {
      if (e.target === unitSkipModalBackdrop) {
        window.closeUnitSkipModal();
      }
    });
  }

  on('btn-start-unit-skip-test', 'click', () => {
    window.closeUnitSkipModal();
    window.closeUnitOverviewModal();
    const targetUnit = window.currentSkipTestUnit || 2;
    window.startRunningGame('skip_test', { targetUnit });
  });

  on('unit-banner', 'click', (e) => {
    e.stopPropagation();
    window.openUnitOverviewModal();
  });
  on('unit-dropdown-btn', 'click', (e) => {
    e.stopPropagation();
    window.openUnitOverviewModal();
  });
  on('close-unit-overview-btn', 'click', window.closeUnitOverviewModal);
  on('unit-overview-confirm-btn', 'click', window.closeUnitOverviewModal);
  if (unitOverviewBackdrop) {
    unitOverviewBackdrop.addEventListener('click', (e) => {
      if (e.target === unitOverviewBackdrop) {
        window.closeUnitOverviewModal();
      }
    });
  }

  const bonusClaimBtn = el('bonus-claim-btn');
  if (bonusClaimBtn) {
    bonusClaimBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nodeId = window.currentBonusNodeId || 'node-bonus';
      if (isBonusClaimed(nodeId)) {
        closeBonusModal();
        if (typeof window.showToast === 'function') {
          window.showToast('이미 수령한 보너스 선물입니다! 🎁 (획득 완료)');
        }
        return;
      }

      let curGems = 120;
      try {
        const saved = localStorage.getItem('vocadash_gems');
        if (saved !== null) curGems = parseInt(saved, 10) || 120;
      } catch (err) { }
      curGems += 15;
      try {
        localStorage.setItem('vocadash_gems', curGems.toString());
      } catch (err) { }
      const gemsCountEl = el('header-gems-count');
      if (gemsCountEl) gemsCountEl.textContent = curGems;

      markBonusClaimed(nodeId);
      if (typeof updateRoadmapNodesUI === 'function') {
        updateRoadmapNodesUI();
      }

      if (typeof window.playSound === 'function') {
        window.playSound('gem');
      }

      closeBonusModal();
      if (typeof window.showToast === 'function') {
        window.showToast('💎 보너스 다이아몬드 +15 획득!');
      }
    });
  }
  const bonusBackdrop = el('bonus-modal-backdrop');
  if (bonusBackdrop) {
    bonusBackdrop.addEventListener('click', (e) => {
      if (e.target === bonusBackdrop) closeBonusModal();
    });
  }
  const node3Btn = el('node-3-btn');
  if (node3Btn) {
    node3Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if ((window.nodeProgressMap['node-2'] || 0) < 3) {
        node3Btn.classList.add('animate-lock-shake'); setTimeout(() => node3Btn.classList.remove('animate-lock-shake'), 450); showLockedTooltip(node3Btn);
      } else { window.openLessonModal('node-3'); }
    });
  }
  const nodeBossBtn = el('node-boss-btn');
  if (nodeBossBtn) {
    nodeBossBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p3 = (typeof getNodeProgress === 'function')
        ? (getNodeProgress('node-3')?.clearedCount || 0)
        : (window.nodeProgressMap?.['node-3'] || window.nodeProgressMap?.['u1_node-3'] || 0);
      if (p3 < 3) {
        nodeBossBtn.classList.add('animate-lock-shake'); setTimeout(() => nodeBossBtn.classList.remove('animate-lock-shake'), 450); showLockedTooltip(nodeBossBtn);
      } else { window.openLessonModal('node-boss'); }
    });
  }

  on('lesson-modal-close-btn', 'click', window.closeLessonModal);
  if (lessonBackdrop) lessonBackdrop.addEventListener('click', (e) => { if (e.target === lessonBackdrop) window.closeLessonModal(); });

  // 스페인 축구 실전팩 스테이지 세션 문제 생성기 (Unit 1~4 1:1 정밀 매칭)
  function getFootballStageSession(nodeId) {
    const fb = window.packFootballData;
    if (!fb || !Array.isArray(fb.units) || fb.units.length === 0) return [];

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel('es') : 1) || 1;
    let targetUnit = fb.units.find(u => u.id === unlockedLevel) || fb.units[0];

    let targetNode = null;
    for (const u of fb.units) {
      const found = Array.isArray(u.nodes) ? u.nodes.find(n => n.id === nodeId) : null;
      if (found) {
        targetUnit = u;
        targetNode = found;
        break;
      }
    }

    if (!targetNode && targetUnit && Array.isArray(targetUnit.nodes)) {
      if (nodeId === 'node-1') {
        targetNode = targetUnit.nodes.find(n => n.stageNumber === 1 || n.id.endsWith('_n1'));
      } else if (nodeId === 'node-2') {
        targetNode = targetUnit.nodes.find(n => n.stageNumber === 2 || n.id.endsWith('_n2'));
      } else if (nodeId === 'node-3') {
        targetNode = targetUnit.nodes.find(n => (n.stageNumber === 3 || n.id.endsWith('_n5') || n.type === 'sentence') && !n.id.endsWith('_n4') && !n.id.includes('review'));
      } else if (nodeId === 'node-boss') {
        targetNode = targetUnit.nodes.find(n => n.type === 'boss' || n.id.endsWith('_n6'));
      }
    }

    let words = [];
    if (targetNode && Array.isArray(targetNode.wordIds) && targetNode.wordIds.length > 0) {
      const idSet = new Set(targetNode.wordIds);
      words = (targetUnit.words || []).filter(w => idSet.has(w.id));
    } else if (targetNode && (targetNode.targetSentence || targetNode.type === 'sentence')) {
      const sentObj = {
        id: targetNode.id || `fb_${targetUnit.id}_sent`,
        term: targetNode.targetSentence || '¡Vamos al partido!',
        meaning: targetNode.meaning || '경기를 시작하자!',
        pron: targetNode.pron || '',
        phonetic: targetNode.pron ? `[${targetNode.pron}]` : '',
        type: 'sentence',
        isSentence: true
      };
      words = [sentObj, ...(targetUnit.words || []).slice(0, 5)];
    } else if (nodeId === 'node-boss' || (targetNode && targetNode.type === 'boss')) {
      words = (targetUnit.words || []).slice();
    } else {
      words = (targetUnit.words || []).slice(0, 6);
    }

    if (!words || words.length === 0) return [];

    let session = [];
    const count = Math.max(10, words.length);
    for (let i = 0; i < count; i++) {
      const w = words[i % words.length];
      const isSent = Boolean(w.type === 'sentence' || w.isSentence);
      session.push({
        id: w.id || `fb-q-${i + 1}`,
        term: w.term,
        word: w.term,
        meaning: w.meaning,
        pron: w.pron || '',
        phonetic: w.phonetic || (w.pron ? `[${w.pron}]` : ''),
        exampleTarget: isSent ? w.term : `El ${w.term} está en el campo.`,
        exampleMeaning: isSent ? w.meaning : `${w.meaning}가 경기장에 있다.`,
        type: isSent ? 'sentence' : 'word',
        isSentence: isSent,
        tag: `⚽ ${targetUnit.title ? targetUnit.title.split('.')[0] : '축구 실전'}`
      });
    }
    return session;
  }
  window.getFootballStageSession = getFootballStageSession;

  on('lesson-start-btn', 'click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof checkAndRechargeHearts === 'function') checkAndRechargeHearts();
    if (window.userHearts <= 0) {
      if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
      if (typeof openHeartRechargeModal === 'function') openHeartRechargeModal();
      return;
    }
    const targetNodeId = currentSelectedNodeId || window.currentSelectedNodeId || window.currentGameLessonId || 'node-2';
    window.currentSelectedNodeId = targetNodeId;
    window.currentGameLessonId = targetNodeId;
    window.currentLessonId = targetNodeId;
    if (targetNodeId !== 'node-review') {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }
    const round = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;

    const activeCourseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.activeCourseId || 'main';
    window.activeCourseId = activeCourseId;
    const activeCourse = getCurrentCourseData();

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(window.currentActiveCourse || 'es') : 1) || 1;
    const unitIndex = Math.max(0, unlockedLevel - 1);
    const targetUnit = (activeCourse && Array.isArray(activeCourse.units))
      ? (activeCourse.units[unitIndex] || activeCourse.units[0])
      : null;
    const currentWords = (targetUnit && Array.isArray(targetUnit.words)) ? targetUnit.words : [];

    let session = [];
    if (activeCourseId === 'pack_football' && typeof getFootballStageSession === 'function') {
      session = getFootballStageSession(targetNodeId);
    } else if (typeof window.generateStageSession === 'function') {
      session = window.generateStageSession(targetNodeId, window.currentActiveCourse, round);
    } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      session = window.VOCA_DATA.generateStageSession(targetNodeId, window.currentActiveCourse, round);
    }

    if (!session || !Array.isArray(session) || session.length === 0) {
      if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
      window.showEmptyStageModal('🚧 단어장 준비 중! 곧 업데이트될 스테이지입니다.');
      return;
    }

    if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
    window.currentSessionQuestions = session;
    if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen(targetNodeId, session);
    } else if (typeof window.launchGame === 'function') {
      window.launchGame('falling', session, { lessonId: targetNodeId });
    } else if (typeof window.openGameScreen === 'function') {
      window.openGameScreen(targetNodeId, session);
    }
  });

  function startLesson(nodeId) {
    const targetNodeId = nodeId || currentSelectedNodeId || window.currentSelectedNodeId || window.currentGameLessonId || 'node-2';
    window.currentSelectedNodeId = targetNodeId;
    window.currentGameLessonId = targetNodeId;
    window.currentLessonId = targetNodeId;
    if (targetNodeId !== 'node-review') {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }
    const activeCourseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.activeCourseId || 'main';
    window.activeCourseId = activeCourseId;
    const activeCourse = getCurrentCourseData();

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(window.currentActiveCourse || 'es') : 1) || 1;
    const unitIndex = Math.max(0, unlockedLevel - 1);
    const targetUnit = (activeCourse && Array.isArray(activeCourse.units))
      ? (activeCourse.units[unitIndex] || activeCourse.units[0])
      : null;
    const currentWords = (targetUnit && Array.isArray(targetUnit.words)) ? targetUnit.words : [];

    const round = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;
    let session = [];
    if (activeCourseId === 'pack_football' && typeof getFootballStageSession === 'function') {
      session = getFootballStageSession(targetNodeId);
    } else if (typeof window.generateStageSession === 'function') {
      session = window.generateStageSession(targetNodeId, window.currentActiveCourse, round);
    } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      session = window.VOCA_DATA.generateStageSession(targetNodeId, window.currentActiveCourse, round);
    }
    window.currentSessionQuestions = session;
    if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen(targetNodeId, session);
    } else if (typeof window.launchGame === 'function') {
      window.launchGame('falling', session, { lessonId: targetNodeId });
    }
    return session;
  }
  window.startLesson = startLesson;
  on('continueStreakBtn', 'click', () => { window.closeStreakModal(); window.openLessonModal('node-2'); });

  // 4. Header Category Chips & Subcategory Dropdown & Stage Filter (Removed per requirements)
  function filterRoadmapByCategory() {
    const svgPath = document.getElementById('roadmap-svg-path') || document.querySelector('#roadmap-screen svg');
    const nodes = document.querySelectorAll('.roadmap-node');
    nodes.forEach((node) => {
      node.classList.remove('hidden');
      node.style.display = '';
    });
    if (svgPath) {
      svgPath.classList.remove('hidden');
      svgPath.style.display = '';
      svgPath.style.opacity = '1';
    }
  }
  window.filterRoadmapByCategory = filterRoadmapByCategory;

  function renderCategoryChips() { }
  window.renderCategoryChips = renderCategoryChips;
  function bindCategoryPills() { }
  window.bindCategoryPills = bindCategoryPills;

  const courseSelectBtn = el('course-selector-btn'), courseDropdown = el('course-dropdown-menu'), chevronIcon = el('dropdown-chevron-icon');

  window.openCourseDropdown = () => {
    if (!courseDropdown) return;
    renderCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es', window.currentCourseId);
    courseDropdown.classList.remove('hidden', 'opacity-0', '-translate-y-2', 'pointer-events-none');
    courseDropdown.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    if (chevronIcon) chevronIcon.classList.add('rotate-180');
  };

  window.closeCourseDropdown = () => {
    if (!courseDropdown) return;
    courseDropdown.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    courseDropdown.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
    if (chevronIcon) chevronIcon.classList.remove('rotate-180');
    setTimeout(() => {
      if (courseDropdown.classList.contains('opacity-0')) courseDropdown.classList.add('hidden');
    }, 200);
  };

  if (courseSelectBtn) {
    courseSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (courseDropdown && !courseDropdown.classList.contains('hidden') && !courseDropdown.classList.contains('opacity-0')) {
        window.closeCourseDropdown();
      } else {
        window.openCourseDropdown();
      }
    });
  }

  // 2. 외부 영역 클릭 시 닫기(Click Outside) 충돌 방어
  document.addEventListener('click', (e) => {
    if (e.target.closest('#course-dropdown-menu') || e.target.closest('#course-selector-btn')) {
      return;
    }
    if (courseDropdown && !courseDropdown.classList.contains('hidden') && !courseDropdown.classList.contains('opacity-0')) {
      window.closeCourseDropdown();
    }
  });

  // 1. 코스 드롭다운 동적 렌더링 함수 구현 (renderCourseDropdown)
  function renderCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), selectedCourseId) {
    const menu = document.getElementById('course-dropdown-menu');
    if (!menu) return;

    const targetCourseId = selectedCourseId || window.currentCourseId || getSavedCourseId() || 'basic';
    const presets = COURSE_PRESETS[lang] || COURSE_PRESETS.es;
    const currentSelected = presets.find((p) => p.id === targetCourseId) || presets[0];
    if (selectedCourseId === 'pack_football' || window.currentCourseId === 'pack_football') {
      window.currentCourseId = 'pack_football';
    } else if (!window.currentCourseId || window.currentCourseId === 'basic') {
      window.currentCourseId = 'main';
    }
    window.currentBookCourseId = currentSelected.id;
    window.currentCourseCategory = currentSelected.id;
    window.currentCategoryFilter = '전체';
    try {
      localStorage.setItem('vocadash_current_course', currentSelected.id);
    } catch (_) { }

    menu.innerHTML = presets.map((course) => {
      const isSelected = course.id === currentSelected.id;
      const btnClass = isSelected
        ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 font-semibold'
        : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50';
      const titleClass = isSelected ? 'text-emerald-950' : 'text-slate-700';
      const descClass = isSelected ? 'text-emerald-800/80' : 'text-slate-500';
      return `
        <button type="button" data-course-id="${escapeHTML(course.id)}" class="course-dropdown-item flex items-center justify-between p-2.5 rounded-xl ${btnClass} cursor-pointer transition-all" role="menuitem">
          <div class="flex items-center gap-2.5 pointer-events-none">
            <span class="text-base p-1.5 rounded-lg bg-surface-container-lowest shadow-xs border border-slate-100">${escapeHTML(course.icon)}</span>
            <div class="flex flex-col text-left">
              <span class="font-bold text-xs ${titleClass} item-title">${escapeHTML(course.title)}</span>
              <span class="text-[10px] ${descClass}">${escapeHTML(course.desc)}</span>
            </div>
          </div>
          <span class="item-check ${isSelected ? '' : 'hidden'} material-symbols-outlined text-[18px] text-emerald-600 font-bold">check</span>
        </button>
      `;
    }).join('');

    // 상단 드롭다운 메인 버튼 정보 세팅
    const dropdownTitle = document.getElementById('dropdown-course-title');
    const dropdownIcon = document.getElementById('dropdown-course-icon');
    if (dropdownTitle) dropdownTitle.textContent = currentSelected.title;
    if (dropdownIcon) dropdownIcon.textContent = currentSelected.icon;

    // 카테고리 칩 목록 동기화
    if (courseCategoryMap && courseCategoryMap[currentSelected.id]) {
      renderCategoryChips(courseCategoryMap[currentSelected.id].categories);
    }
  }
  window.renderCourseDropdown = renderCourseDropdown;

  // 드롭다운 아이템 클릭 이벤트 위임 및 상단 UI 반영
  const courseMenu = document.getElementById('course-dropdown-menu');
  if (courseMenu) {
    courseMenu.onclick = function (e) {
      e.stopPropagation();
      const itemBtn = e.target.closest('.course-dropdown-item');
      if (!itemBtn) return;

      const courseId = itemBtn.dataset.courseId;
      const titleEl = itemBtn.querySelector('.item-title');
      const title = titleEl ? titleEl.textContent.trim() : itemBtn.innerText.trim();

      const currentLang = window.currentLanguage || window.currentActiveCourse || 'es';
      const presets = COURSE_PRESETS[currentLang] || COURSE_PRESETS.es;
      const matched = presets.find((c) => c.id === courseId);
      const icon = matched ? matched.icon : (courseCategoryMap[courseId] ? courseCategoryMap[courseId].icon : '🌱');

      window.currentCourseId = courseId;
      window.currentBookCourseId = courseId;
      window.currentCategoryFilter = '전체';
      try {
        localStorage.setItem('vocadash_current_course', courseId);
      } catch (_) { }

      const dropdownTitle = document.getElementById('dropdown-course-title');
      const dropdownIcon = document.getElementById('dropdown-course-icon');
      if (dropdownTitle) dropdownTitle.textContent = title;
      if (dropdownIcon) dropdownIcon.textContent = icon;

      document.querySelectorAll('#course-dropdown-menu .course-dropdown-item').forEach((btn) => {
        const isSelected = btn.dataset.courseId === courseId;
        const check = btn.querySelector('.item-check');
        const titleSpan = btn.querySelector('.item-title');

        btn.className = `course-dropdown-item flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
          ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 font-semibold'
          : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50'
          }`;
        if (check) check.classList.toggle('hidden', !isSelected);
        if (titleSpan) {
          titleSpan.classList.toggle('text-emerald-950', isSelected);
          titleSpan.classList.toggle('text-slate-700', !isSelected);
        }
      });

      if (courseCategoryMap && courseCategoryMap[courseId]) {
        renderCategoryChips(courseCategoryMap[courseId].categories);
      }

      if (typeof loadNodeProgress === 'function') {
        window.nodeProgressMap = loadNodeProgress(currentLang);
      }

      if (typeof updateRoadmapNodesUI === 'function') {
        updateRoadmapNodesUI();
      }

      if (typeof renderRoadmap === 'function') {
        renderRoadmap();
      }

      if (typeof window.renderBookCourseDropdown === 'function') {
        window.renderBookCourseDropdown(currentLang, courseId);
      }

      if (typeof closeCourseDropdown === 'function') {
        closeCourseDropdown();
      } else if (typeof window.closeCourseDropdown === 'function') {
        window.closeCourseDropdown();
      } else {
        courseMenu.classList.add('hidden', 'opacity-0', '-translate-y-2', 'pointer-events-none');
        courseMenu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      }
    };
  }

  // 5. Language Modal
  const langBackdrop = el('language-modal-backdrop'), langCard = el('language-modal-card'), cardEs = el('card-es'), cardEn = el('card-en'), badgeEs = el('badge-es'), badgeEn = el('badge-en');
  let modalPendingLanguage = 'es';
  let modalPendingCourseId = 'main';

  const MODAL_COURSES = {
    es: [
      {
        id: 'main',
        icon: '🇪🇸',
        title: '스페인어 정규 코스',
        desc: '일상 회화 & 실전 기초 어휘 마스터',
        badge: ''
      },
      {
        id: 'pack_football',
        icon: '⚽',
        title: '스페인 축구 실전팩',
        desc: '스페셜 팩 · 경기장 어휘 & 피치 콜',
        badge: 'Official DLC'
      }
    ],
    en: [
      {
        id: 'main',
        icon: '🇺🇸',
        title: '영어 정규 코스',
        desc: '일상 회화 & 실전 필수 어휘 마스터',
        badge: ''
      }
    ]
  };

  function renderModalCourseList(targetLang, selectedCourseId) {
    const list = document.getElementById('course-switcher-list');
    if (!list) return;

    const lang = (targetLang === 'en') ? 'en' : 'es';
    const courses = MODAL_COURSES[lang] || MODAL_COURSES.es;

    // 언어에 해당 코스가 없으면 기본 코스('main')로 설정
    let activeId = selectedCourseId;
    if (!courses.some(c => c.id === activeId)) {
      activeId = 'main';
    }
    modalPendingCourseId = activeId;

    list.innerHTML = courses.map(course => {
      const isSelected = (course.id === activeId);
      const borderClass = isSelected
        ? 'border-2 border-emerald-500 bg-emerald-50/70 text-slate-800'
        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700';
      const checkClass = isSelected ? '' : 'hidden';
      const badgeHtml = course.badge
        ? `<span class="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">${course.badge}</span>`
        : '';
      const descColor = course.badge ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-medium';

      return `
        <button type="button" data-course-id="${course.id}" class="course-switcher-card flex items-center justify-between p-2.5 rounded-2xl ${borderClass} text-xs font-bold cursor-pointer transition-all active:scale-98">
          <div class="flex items-center gap-2.5 pointer-events-none">
            <span class="text-xl">${course.icon}</span>
            <div class="flex flex-col text-left">
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-slate-900 leading-tight">${course.title}</span>
                ${badgeHtml}
              </div>
              <span class="text-[10px] ${descColor}">${course.desc}</span>
            </div>
          </div>
          <span class="course-switcher-check ${checkClass} material-symbols-outlined text-[18px] text-emerald-600 font-black">check_circle</span>
        </button>
      `;
    }).join('');
  }
  window.renderModalCourseList = renderModalCourseList;

  function updateModalCardsUI(lang) {
    modalPendingLanguage = lang;
    modalSelectedCourse = lang;
    const isEs = lang === 'es';

    const setCardStyle = (card, badge, isSelected) => {
      if (!card) return;
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      card.className = `course-card relative p-3.5 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#22c55e] ${isSelected
        ? 'border-[#22c55e] bg-[#f0fdf4] ring-2 ring-[#22c55e]/20 scale-[1.02] shadow-xs'
        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200'
        }`;

      if (badge) {
        badge.className = `absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#22c55e] bg-[#22c55e]' : 'border-slate-300 bg-transparent'
          }`;
        const dot = badge.querySelector('.badge-dot') || badge.firstElementChild;
        if (dot) {
          dot.className = `badge-dot w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-transparent'}`;
        }
      }

      const nameEl = card.querySelector('.card-lang-name');
      if (nameEl) {
        nameEl.className = `card-lang-name font-bold text-sm tracking-tight transition-colors ${isSelected ? 'text-[#15803d]' : 'text-slate-700'
          }`;
      }

      const subEl = card.querySelector('.card-lang-sub');
      if (subEl) {
        subEl.className = `card-lang-sub text-[11px] transition-colors ${isSelected ? 'text-[#22c55e] font-semibold' : 'text-slate-400 font-medium'
          }`;
      }
    };

    setCardStyle(cardEs, badgeEs, isEs);
    setCardStyle(cardEn, badgeEn, !isEs);
  }

  function updateModalCourseCardsUI(selectedCourseId) {
    modalPendingCourseId = selectedCourseId || 'main';
    const cards = document.querySelectorAll('.course-switcher-card');
    cards.forEach(card => {
      const cid = card.dataset.courseId;
      const isSelected = (cid === modalPendingCourseId);
      const check = card.querySelector('.course-switcher-check');
      if (isSelected) {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.remove('hidden');
      } else {
        card.className = 'course-switcher-card flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all active:scale-98';
        if (check) check.classList.add('hidden');
      }
    });
  }
  window.updateModalCourseCardsUI = updateModalCourseCardsUI;

  window.openLanguageModal = () => {
    if (typeof window.closeCourseDropdown === 'function') {
      window.closeCourseDropdown();
    }
    modalPendingLanguage = window.currentLanguage || window.currentActiveCourse || localStorage.getItem('vocadash_selected_lang') || localStorage.getItem('vocadash_language') || 'es';
    modalPendingCourseId = window.activeCourseId || localStorage.getItem('vocadash_active_course') || 'main';

    if (modalPendingLanguage === 'en' && modalPendingCourseId !== 'main') {
      modalPendingCourseId = 'main';
    }

    updateModalCardsUI(modalPendingLanguage);
    renderModalCourseList(modalPendingLanguage, modalPendingCourseId);
    toggleModal(langBackdrop, langCard, true);
  };
  window.closeLanguageModal = () => toggleModal(langBackdrop, langCard, false);
  on('logo-lang-trigger', 'click', window.openLanguageModal);
  on('close-modal-btn', 'click', window.closeLanguageModal);

  // 코스 스위처 카드 탭 이벤트 바인딩 (즉시 닫히지 않고 pending 상태 및 UI만 변경)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.course-switcher-card');
    if (!card) return;
    const cid = card.dataset.courseId;
    if (cid) {
      modalPendingCourseId = cid;
      updateModalCourseCardsUI(cid);
    }
  });

  // 하단 고정 '선택 완료' Primary CTA 버튼 클릭 이벤트
  const btnConfirmLangCourse = document.getElementById('btn-confirm-language-course');
  if (btnConfirmLangCourse) {
    btnConfirmLangCourse.addEventListener('click', () => {
      const finalLang = modalPendingLanguage || window.currentLanguage || localStorage.getItem('vocadash_selected_lang') || 'es';
      const finalCourseId = modalPendingCourseId || window.activeCourseId || 'main';

      // 2) 선택된 언어와 코스(activeCourseId)를 localStorage에 최종 확정 저장
      try {
        localStorage.setItem('vocadash_language', finalLang);
        localStorage.setItem('vocadash_selected_lang', finalLang);
        localStorage.setItem('vocadash_active_course', finalCourseId);
      } catch (_) { }

      // 3) 언어 적용 (내부에서 로드맵/단어장/UI 등 언어별 갱신 수행 및 모달 닫기)
      if (typeof window.setLanguage === 'function') {
        window.setLanguage(finalLang);
      }

      // 4) 코스 적용 (로드맵 및 상단 배너 리렌더링)
      if (typeof window.switchCourse === 'function') {
        window.switchCourse(finalCourseId);
      }

      // 5) 모달 닫기 확정
      if (typeof window.closeLanguageModal === 'function') {
        window.closeLanguageModal();
      }
    });
  }
  // ===================================================
  // 5-B. 마스코트 고양이 캐릭터 및 전역 언어 상태 동기화
  // ===================================================
  function updateMascotCharacters(targetLang) {
    const lang = (targetLang === 'en') ? 'en' : 'es';
    const charPrefix = lang === 'en' ? 'en' : 'es';
    const v = '?v=68';

    // 1. Flashcard mascot
    const flashcardMascot = document.getElementById('flashcard-mascot-img');
    if (flashcardMascot) {
      flashcardMascot.src = 'assets/characters/' + charPrefix + '-study.webp' + v;
    }

    // 2. Game result clear mascot
    const resultMascot = document.getElementById('result-mascot-img');
    if (resultMascot) {
      resultMascot.src = 'assets/characters/' + charPrefix + '-victory.webp' + v;
    }

    // 3. Game over card mascot
    const gameoverMascots = document.querySelectorAll('#game-result-gameover-card img, #result-gameover-card img');
    gameoverMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-sad.webp' + v;
    });

    // 4. Roadmap speed review banner mascot & roadmap decorative runner cat
    const reviewMascots = document.querySelectorAll('#review-cat-banner-tile img, #roadmap-runner-cat-img, #roadmap-screen img[src*="characters/"]');
    reviewMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-run.webp' + v;
    });
    const bubbleText = document.getElementById('runner-cat-bubble-text');
    if (bubbleText) {
      bubbleText.textContent = lang === 'en' ? "Let's Go! 출발!" : "¡Vamos! 출발!";
    }

    // 4-B. Roadmap decors: 이정표 표지판 동적 갱신 (마드리드 <-> 뉴욕 등)
    updateRoadmapSignpost(lang);

    // 5. Book sticker mascot
    const bookMascots = document.querySelectorAll('#book-screen img[alt*="scholarly"], #book-screen img[src*="characters/"]');
    bookMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-study.webp' + v;
    });

    // 6. Language modal preview mascots
    const modalEs = document.getElementById('mascot-img-es');
    if (modalEs) modalEs.src = 'assets/characters/es-study.webp' + v;
    const modalEn = document.getElementById('mascot-img-en');
    if (modalEn) modalEn.src = 'assets/characters/en-study.webp' + v;

    // 7. Streak celebration modal mascot (fever)
    const streakMascots = document.querySelectorAll('#streak-modal img, #streak-modal-card img');
    streakMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-fever.webp' + v;
    });

    // 8. Study profile screen scholar mascot
    const profileMascot = document.querySelector('#study-profile-screen img[alt*="Scholar Mascot"]') || document.querySelector('img[alt="VocaDash Scholar Mascot"]');
    if (profileMascot) {
      profileMascot.src = 'assets/characters/' + charPrefix + '-study.webp' + v;
    }

    // 9. Splash screen mascot
    const splashMascot = document.getElementById('splash-mascot-img');
    if (splashMascot) {
      splashMascot.src = 'assets/characters/' + charPrefix + '-idle.webp' + v;
    }
  }
  window.updateMascotCharacters = updateMascotCharacters;

  // ===================================================
  // 로드맵 이정표 표지판 언어별 프리셋 & 동적 업데이트
  // ===================================================
  const SIGNPOST_PRESETS = {
    es: {
      icon: '🏛️',
      text: 'MADRID 2.4km',
      code: 'ES',
      codeClass: 'bg-red-600 text-yellow-300',
      flag: '🇪🇸'
    },
    en: {
      icon: '🗽',
      text: 'NEW YORK 2.4km',
      code: 'US',
      codeClass: 'bg-blue-600 text-white',
      flag: '🇺🇸'
    },
    fr: {
      icon: '🗼',
      text: 'PARIS 2.4km',
      code: 'FR',
      codeClass: 'bg-blue-700 text-white',
      flag: '🇫🇷'
    },
    ja: {
      icon: '⛩️',
      text: 'TOKYO 2.4km',
      code: 'JP',
      codeClass: 'bg-red-600 text-white',
      flag: '🇯🇵'
    },
    zh: {
      icon: '🏮',
      text: 'BEIJING 2.4km',
      code: 'CN',
      codeClass: 'bg-red-600 text-yellow-300',
      flag: '🇨🇳'
    },
    de: {
      icon: '🏰',
      text: 'BERLIN 2.4km',
      code: 'DE',
      codeClass: 'bg-slate-900 text-yellow-300',
      flag: '🇩🇪'
    }
  };

  function updateRoadmapSignpost(targetLang) {
    const lang = targetLang === 'en' ? 'en' : (targetLang || 'es');
    const preset = SIGNPOST_PRESETS[lang] || SIGNPOST_PRESETS.es;

    const iconEl = document.getElementById('signpost-icon');
    if (iconEl) iconEl.textContent = preset.icon;

    const textEl = document.getElementById('signpost-text');
    if (textEl) textEl.textContent = preset.text;

    const codeEl = document.getElementById('signpost-code-badge');
    if (codeEl) {
      codeEl.textContent = preset.code;
      codeEl.className = `text-[8px] ${preset.codeClass} px-1 py-0.2 rounded font-extrabold leading-none`;
    }

    const flagEl = document.getElementById('signpost-flag');
    if (flagEl) flagEl.textContent = preset.flag;
  }
  window.updateRoadmapSignpost = updateRoadmapSignpost;

  // 단어장 우측 상단 활성 코스 뱃지 동적 갱신
  function updateBookCourseBadge(targetLang, courseId) {
    const lang = (targetLang === 'en' || window.currentLanguage === 'en' || window.currentActiveCourse === 'en') ? 'en' : 'es';
    let activeId = courseId || window.activeCourseId;
    if (!activeId || activeId === 'basic') {
      try {
        activeId = localStorage.getItem('vocadash_active_course') || 'main';
      } catch (_) {
        activeId = 'main';
      }
    }
    const isFootball = (activeId === 'pack_football');
    const courseData = (typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : null;

    let icon = isFootball ? '⚽' : (lang === 'en' ? '🇺🇸' : '🇪🇸');
    let title = isFootball ? '스페인 축구 실전팩' : (lang === 'en' ? '영어 정규 코스' : '스페인어 정규 코스');

    if (courseData) {
      if (courseData.icon) icon = courseData.icon;
      if (courseData.title && courseData.title !== '축구 실전 단어팩 (DLC)' && courseData.title !== '일상 실전 패턴' && courseData.title !== '필수 회화 & 어휘') {
        title = courseData.title;
      } else if (courseData.courseName) {
        title = courseData.courseName;
      }
    }

    const titleEl = document.getElementById('book-course-title');
    const iconEl = document.getElementById('book-course-icon');
    if (titleEl) titleEl.textContent = title;
    if (iconEl) iconEl.textContent = icon;
  }
  window.updateBookCourseBadge = updateBookCourseBadge;

  // 단어장 중간 학습 진도 배너 및 필터 칩 개수 동적 동기화
  function updateBookProgressHero() {
    const courseData = (typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : null;
    let storedCourse = 'main';
    try {
      storedCourse = localStorage.getItem('vocadash_active_course') || 'main';
    } catch (_) { }

    const isFootball = (window.activeCourseId === 'pack_football' || storedCourse === 'pack_football' || (courseData && courseData.id === 'pack_football'));

    let totalWords = 0;
    if (isFootball) {
      if (courseData && Array.isArray(courseData.units)) {
        totalWords = courseData.units.reduce(function (sum, u) {
          return sum + (Array.isArray(u.words) ? u.words.length : 0);
        }, 0);
      }
      if (!totalWords) totalWords = 180;
    } else if (courseData && courseData.id && courseData.id !== 'main' && courseData.id !== 'es_main' && Array.isArray(courseData.units)) {
      totalWords = courseData.units.reduce(function (sum, u) {
        return sum + (Array.isArray(u.words) ? u.words.length : 0);
      }, 0);
      if (!totalWords) totalWords = 120;
    } else {
      totalWords = 120;
    }

    // 🛑 초기화 상태 대응: 저장된 데이터가 없으면 무조건 0부터 시작
    let memorizedCount = 0;
    try {
      const storageKey = isFootball ? 'vocadash_memorized_count_pack_football' : 'vocadash_memorized_count_main';
      const savedCount = localStorage.getItem(storageKey);
      if (savedCount !== null) {
        const parsed = parseInt(savedCount, 10);
        if (!isNaN(parsed) && parsed >= 0) memorizedCount = parsed;
      } else {
        const rawMastered = localStorage.getItem('vocadash_mastered_words') || localStorage.getItem('vocadash_learned_words');
        if (rawMastered) {
          const parsedArr = JSON.parse(rawMastered);
          if (Array.isArray(parsedArr)) memorizedCount = parsedArr.length;
        }
      }
    } catch (_) {
      memorizedCount = 0;
    }

    // 오답 단어 수 파악 (저장소 비어있으면 0)
    let wrongCount = 0;
    try {
      const rawWrong = localStorage.getItem('vocadash_weakness_words') || localStorage.getItem('vocadash_wrong_words');
      if (rawWrong) {
        const parsedWrong = JSON.parse(rawWrong);
        if (Array.isArray(parsedWrong)) wrongCount = parsedWrong.length;
      }
    } catch (_) {
      wrongCount = 0;
    }

    memorizedCount = Math.min(memorizedCount, totalWords);
    const percent = totalWords > 0 ? Math.round((memorizedCount / totalWords) * 100) : 0;
    const unmemorizedCount = Math.max(0, totalWords - memorizedCount);

    const countEl = document.getElementById('book-progress-count');
    const percentEl = document.getElementById('book-progress-percent');
    const barEl = document.getElementById('book-progress-bar-fill');

    if (countEl) {
      countEl.textContent = '외운 단어 ' + memorizedCount + ' / ' + totalWords + '개';
    }
    if (percentEl) {
      percentEl.textContent = '(' + percent + '% 달성)';
    }
    if (barEl) {
      barEl.style.width = percent + '%';
    }

    const allCountEl = document.getElementById('book-filter-all-count');
    if (allCountEl) allCountEl.textContent = String(totalWords);

    const wrongCountEl = document.getElementById('book-filter-wrong-count');
    if (wrongCountEl) wrongCountEl.textContent = String(wrongCount);

    const unmemorizedCountEl = document.getElementById('book-filter-unmemorized-count');
    if (unmemorizedCountEl) unmemorizedCountEl.textContent = String(unmemorizedCount);

    const memorizedCountEl = document.getElementById('book-filter-memorized-count');
    if (memorizedCountEl) memorizedCountEl.textContent = String(memorizedCount);
  }
  window.updateBookProgressHero = updateBookProgressHero;

  function renderBookWords(targetLang, courseId) {
    const lang = (targetLang === 'en') ? 'en' : 'es';
    const container = document.getElementById('book-words-container');
    if (!container) return;

    const activeCourse = (typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : null;
    let storedCourse = 'main';
    try {
      storedCourse = localStorage.getItem('vocadash_active_course') || 'main';
    } catch (_) { }
    const isFootball = (courseId === 'pack_football' || window.activeCourseId === 'pack_football' || storedCourse === 'pack_football' || (activeCourse && activeCourse.id === 'pack_football'));

    // 단어장 상단 코스 뱃지 & 학습 진도 배너 동적 동기화
    if (typeof updateBookCourseBadge === 'function') updateBookCourseBadge(lang, courseId);
    if (typeof updateBookProgressHero === 'function') updateBookProgressHero();

    const chapterTitleEl = document.getElementById('book-chapter-title');
    const chapterSubtitleEl = document.getElementById('book-chapter-subtitle');
    const chapterCountEl = document.getElementById('book-chapter-count');
    if (chapterTitleEl) {
      if (isFootball) {
        chapterTitleEl.textContent = '⚽ 스페인 축구 실전팩 (Unit 1~4)';
      } else {
        chapterTitleEl.textContent = lang === 'en'
          ? '1과: 인사/기초 표현'
          : '1과: 인사/안부';
      }
    }
    if (chapterSubtitleEl && !isFootball) {
      chapterSubtitleEl.textContent = lang === 'en'
        ? 'Greeting, Thanks & Numbers Master'
        : '인사, 감사, 숫자 등 기초 표현 마스터';
    }
    if (chapterCountEl && !isFootball) {
      chapterCountEl.textContent = '12단어';
    }

    const wrongBanner = document.getElementById('book-wrong-run-banner');
    if (wrongBanner) wrongBanner.classList.add('hidden');
    const oldEmpty = container.querySelector('#book-wrong-empty-state');
    if (oldEmpty) oldEmpty.remove();

    const oldItems = container.querySelectorAll('.book-word-card, .book-category-header, .book-unit-container');
    oldItems.forEach(c => c.remove());

    const isPhoneticVisible = window.vocadashSettings ? !!window.vocadashSettings.showPhonetic : true;
    const phoneticStyle = isPhoneticVisible ? '' : 'style="display: none;"';

    const ch1Header = document.getElementById('book-chapter-header');
    const ch2Toggle = document.getElementById('book-chapter-2-toggle');
    const ch3Locked = document.getElementById('book-chapter-3-locked');

    if (activeCourse && Array.isArray(activeCourse.units) && activeCourse.units.length > 0) {
      if (ch1Header) { ch1Header.style.display = 'none'; ch1Header.classList.add('hidden'); }
      if (ch2Toggle) { ch2Toggle.style.display = 'none'; ch2Toggle.classList.add('hidden'); }
      if (ch3Locked) { ch3Locked.style.display = 'none'; ch3Locked.classList.add('hidden'); }

      const iconPrefix = isFootball ? '⚽' : (activeCourse.icon || (lang === 'en' ? '🇺🇸' : '🇪🇸'));

      // 실제 저장된 즐겨찾기 데이터 로드
      let starredList = [];
      try {
        const rawStar = localStorage.getItem('vocadash_starred_words') ||
          localStorage.getItem('vocadash_favorites') ||
          localStorage.getItem('starredWords');
        if (rawStar) {
          const parsed = JSON.parse(rawStar);
          if (Array.isArray(parsed)) starredList = parsed;
        }
      } catch (_) { }

      activeCourse.units.forEach((u, uIdx) => {
        // 유닛 전체를 묶어줄 컨테이너 생성
        const unitContainer = document.createElement('div');
        unitContainer.className = 'book-unit-container mb-4';

        const wordCount = (u.words || []).length;
        const subtitleText = u.subtitle || u.desc || '';
        const safeSubtitle = typeof escapeHTML === 'function' ? escapeHTML(subtitleText) : subtitleText;
        const subtitleHtml = subtitleText ? `<p class="mt-1 pl-0.5 text-xs text-slate-500 font-medium leading-relaxed">${safeSubtitle}</p>` : '';
        const safeUnitTitle = typeof escapeHTML === 'function' ? escapeHTML(u.title) : u.title;

        // 클릭 가능한 아코디언 헤더
        const catHeader = document.createElement('div');
        catHeader.className = 'book-category-header flex flex-col mt-4 mb-2 px-1 pt-1 border-t border-slate-100 first:border-0 first:mt-1 cursor-pointer select-none group';
        catHeader.innerHTML = `
          <div class="flex items-center justify-between w-full">
            <span class="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs group-hover:bg-emerald-100 transition-colors">${iconPrefix} ${safeUnitTitle}</span>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="text-xs font-semibold">${wordCount}단어</span>
              <span class="material-symbols-outlined text-[18px] unit-toggle-icon transition-transform duration-200">expand_less</span>
            </div>
          </div>
          ${subtitleHtml}
        `;

        // 단어 카드들을 담는 컨테이너
        const wordsListContainer = document.createElement('div');
        wordsListContainer.className = 'book-unit-words-wrap flex flex-col gap-3 mt-2.5';

        (u.words || []).forEach((w, wIdx) => {
          const termStr = w.word || w.term || '';
          const meaningStr = w.meaning || '';

          const isStar = starredList.some(item => {
            if (typeof item === 'string') return item === termStr;
            return (item.term || item.word || item.id) === termStr;
          });

          const art = document.createElement('article');
          art.className = 'book-word-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md';
          art.dataset.term = termStr;
          art.dataset.meaning = meaningStr;
          art.dataset.category = u.title;
          const phonetic = w.pronunciation ? `[${w.pronunciation}]` : (w.pron ? `[${w.pron}]` : (w.phonetic || ''));

          const starFillStyle = isStar ? 'style="font-variation-settings: &quot;FILL&quot; 1;"' : '';
          const safeTerm = typeof escapeHTML === 'function' ? escapeHTML(termStr) : termStr;
          const safePhonetic = typeof escapeHTML === 'function' ? escapeHTML(phonetic) : phonetic;
          const safeMeaning = typeof escapeHTML === 'function' ? escapeHTML(meaningStr) : meaningStr;

          art.innerHTML = `
            <div class="flex flex-col min-w-0 pr-2">
              <div class="flex items-center gap-2">
                <span class="text-xl font-bold text-slate-800 tracking-tight">${safeTerm}</span>
                <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-0.5 transition-colors cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[20px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
                </button>
              </div>
              <span class="text-xs text-slate-400 font-medium mt-0.5">
                <span class="book-phonetic phonetic-hint" ${phoneticStyle}>${safePhonetic}</span>
                <span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>
                <span class="text-slate-700 font-semibold text-[13px]">${safeMeaning}</span>
              </span>
            </div>
            <button aria-label="즐겨찾기" class="book-star-btn w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center ${isStar ? 'text-amber-400' : 'text-slate-300'} active:scale-90 transition-all cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px]" ${starFillStyle}>star</span>
            </button>
          `;
          wordsListContainer.appendChild(art);
        });

        // 헤더 클릭 시 단어 목록 열고 닫는 토글 핸들러
        catHeader.addEventListener('click', () => {
          const isCollapsed = wordsListContainer.classList.contains('hidden');
          const arrowIcon = catHeader.querySelector('.unit-toggle-icon');
          if (isCollapsed) {
            wordsListContainer.classList.remove('hidden');
            if (arrowIcon) arrowIcon.textContent = 'expand_less';
          } else {
            wordsListContainer.classList.add('hidden');
            if (arrowIcon) arrowIcon.textContent = 'expand_more';
          }
        });

        unitContainer.appendChild(catHeader);
        unitContainer.appendChild(wordsListContainer);

        if (ch2Toggle && ch2Toggle.parentNode === container) {
          container.insertBefore(unitContainer, ch2Toggle);
        } else {
          container.appendChild(unitContainer);
        }
      });

      if (typeof initBookScreenEvents === 'function') initBookScreenEvents();
      return;
    }

    if (ch1Header) { ch1Header.style.display = ''; ch1Header.classList.remove('hidden'); }
    if (ch2Toggle) { ch2Toggle.style.display = ''; ch2Toggle.classList.remove('hidden'); }
    if (ch3Locked) { ch3Locked.style.display = ''; ch3Locked.classList.remove('hidden'); }

    // 기본 단어 목록의 모든 star 기본값을 false로 초기화
    const standardWords = lang === 'en' ? [
      { term: 'Hello', meaning: '안녕 / 안녕하세요', phonetic: '[헬로우]', star: false },
      { term: 'Water', meaning: '물', phonetic: '[워터]', star: false },
      { term: 'Please', meaning: '부탁합니다 / 제발', phonetic: '[플리즈]', star: false },
      { term: 'Thank you', meaning: '감사합니다 / 고마워', phonetic: '[땡큐]', star: false },
      { term: 'Coffee', meaning: '커피', phonetic: '[커피]', star: false },
      { term: 'Excuse me', meaning: '실례합니다', phonetic: '[익스큐즈 미]', star: false },
      { term: 'Restroom', meaning: '화장실', phonetic: '[레스트룸]', star: false }
    ] : [
      { term: '¡Hola!', meaning: '안녕 / 안녕하세요', phonetic: '[올라]', star: false },
      { term: 'Buenos días', meaning: '좋은 아침이에요', phonetic: '[부에노스 디아스]', star: false },
      { term: 'Por favor', meaning: '부탁합니다 / 제발', phonetic: '[포르 파보르]', star: false },
      { term: 'Gracias', meaning: '감사합니다 / 고마워', phonetic: '[그라시아스]', star: false },
      { term: 'De nada', meaning: '천만에요 / 별말씀을요', phonetic: '[데 나다]', star: false },
      { term: 'Lo siento', meaning: '죄송합니다', phonetic: '[로 시엔토]', star: false },
      { term: 'Mucho gusto', meaning: '만나서 반갑습니다', phonetic: '[무초 구스토]', star: false }
    ];

    let wordsData = standardWords;

    const cards = container.querySelectorAll('.book-word-card');
    cards.forEach(c => c.remove());

    wordsData.forEach(item => {
      const art = document.createElement('article');
      art.className = 'book-word-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between mb-3 transition-all hover:shadow-md';
      art.dataset.term = item.term;
      art.dataset.meaning = item.meaning;

      const starFillStyle = item.star ? 'style="font-variation-settings: &quot;FILL&quot; 1;"' : '';
      const safeTerm = typeof escapeHTML === 'function' ? escapeHTML(item.term) : item.term;
      const safePhonetic = typeof escapeHTML === 'function' ? escapeHTML(item.phonetic) : item.phonetic;
      const safeMeaning = typeof escapeHTML === 'function' ? escapeHTML(item.meaning) : item.meaning;

      art.innerHTML = `
        <div class="flex flex-col min-w-0 pr-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-slate-800 tracking-tight">${safeTerm}</span>
            <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-0.5 transition-colors cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
            </button>
          </div>
          <span class="text-xs text-slate-400 font-medium mt-0.5">
            <span class="book-phonetic phonetic-hint" ${phoneticStyle}>${safePhonetic}</span>
            <span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>
            <span class="text-slate-700 font-semibold text-[13px]">${safeMeaning}</span>
          </span>
        </div>
        <button aria-label="즐겨찾기" class="book-star-btn w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center ${item.star ? 'text-amber-400' : 'text-slate-300'} active:scale-90 transition-all cursor-pointer" type="button">
          <span class="material-symbols-outlined text-[20px]" ${starFillStyle}>star</span>
        </button>
      `;
      if (ch2Toggle && ch2Toggle.parentNode === container) {
        container.insertBefore(art, ch2Toggle);
      } else {
        container.appendChild(art);
      }
    });

    if (typeof initBookScreenEvents === 'function') initBookScreenEvents();
  }
  window.renderBookWords = renderBookWords;


  // 교재·단어장 오답 단어 목록 렌더링 함수
  function renderBookWrongWords() {
    const container = document.getElementById('book-words-container');
    if (!container) return;

    const chapterTitleEl = document.getElementById('book-chapter-title');
    if (chapterTitleEl) {
      chapterTitleEl.textContent = '🔥 취약 단어 집중 복습 (오답 단어장)';
    }

    const wrongBanner = document.getElementById('book-wrong-run-banner');
    if (wrongBanner) {
      wrongBanner.classList.remove('hidden');
    }

    const cards = container.querySelectorAll('.book-word-card');
    cards.forEach(c => c.remove());
    const oldEmpty = container.querySelector('#book-wrong-empty-state');
    if (oldEmpty) oldEmpty.remove();

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let wrongList = [];

    // 🛑 초기화 상태 검증: 저장소에 실제 오답 데이터가 없으면 무조건 빈 배열(0개) 처리
    const hasStoredWrong = !!(
      localStorage.getItem('vocadash_weakness_words') ||
      localStorage.getItem('vocadash_wrong_words') ||
      localStorage.getItem('wrongWords_' + currentLang) ||
      localStorage.getItem('wrongWords')
    );

    if (!hasStoredWrong) {
      wrongList = [];
      if (Array.isArray(window.wrongWords)) {
        window.wrongWords = [];
      }
    } else if (typeof window.loadWrongWords === 'function') {
      wrongList = (window.loadWrongWords(currentLang) || []).filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    } else {
      wrongList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
        w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5
      );
    }

    const wrongCountEl = document.getElementById('book-filter-wrong-count');
    if (wrongCountEl) wrongCountEl.textContent = String(wrongList.length);

    if (wrongList.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.id = 'book-wrong-empty-state';
      emptyDiv.className = 'py-12 flex flex-col items-center justify-center text-center bg-white rounded-3xl p-6 border border-slate-100 shadow-sm';
      emptyDiv.innerHTML = `
        <span class="text-4xl mb-2">🎉</span>
        <p class="text-sm font-bold text-slate-800 mb-1">틀린 단어가 없습니다! 완벽해요 👏</p>
        <p class="text-xs text-slate-400 font-medium">모든 단어를 마스터했어요! 새로운 스테이지에 도전해 보세요.</p>
      `;
      container.appendChild(emptyDiv);
      return;
    }


    const isPhoneticVisible = window.vocadashSettings ? !!window.vocadashSettings.showPhonetic : true;
    const phoneticStyle = isPhoneticVisible ? '' : 'style="display: none;"';

    wrongList.forEach(item => {
      const term = item.word || item.term || '';
      const meaning = item.meaning || item.kor || item.ko || '';
      const phonetic = item.phonetic || '';
      const streak = Number(item.correctStreak) || 0;

      const art = document.createElement('article');
      art.className = 'book-word-card book-word-card-wrong bg-white rounded-2xl p-4 shadow-sm border border-rose-100/90 flex items-center justify-between mb-3 transition-all hover:shadow-md';
      art.dataset.term = term;
      art.dataset.meaning = meaning;
      art.dataset.streak = String(streak);
      art.innerHTML = `
        <div class="flex flex-col min-w-0 pr-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-slate-800 tracking-tight">${escapeHTML(term)}</span>
            <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-0.5 transition-colors cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
            </button>
          </div>
          <span class="text-xs text-slate-400 font-medium mt-0.5">
            <span class="book-phonetic phonetic-hint" ${phoneticStyle}>${escapeHTML(phonetic)}</span>
            <span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>
            <span class="text-slate-700 font-semibold text-[13px]">${escapeHTML(meaning)}</span>
          </span>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-extrabold text-xs border border-rose-200 flex items-center gap-1 shadow-2xs">
            <span>🔥</span>
            <span>${streak}/5</span>
          </span>
        </div>
      `;

      const audioBtn = art.querySelector('.book-audio-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof safePlayTTS === 'function') {
            safePlayTTS(term, currentLang, audioBtn);
          }
        });
      }

      container.appendChild(art);
    });
  }
  window.renderBookWrongWords = renderBookWrongWords;

  function setLanguage(targetLang) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : 'es';
    window.currentActiveCourse = lang;
    window.currentLanguage = lang;
    try {
      localStorage.setItem('vocadash_language', lang);
      localStorage.setItem('vocadash_selected_lang', lang);
    } catch (_) { }

    // 1. Settings screen 학습 언어 UI 즉시 갱신
    const settingsFlag = document.getElementById('settings-current-lang-flag');
    if (settingsFlag) {
      settingsFlag.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
    }
    const settingsDesc = document.getElementById('settings-current-lang-desc');
    if (settingsDesc) {
      settingsDesc.textContent = (lang === 'en') ? '영어 (필수 회화 & 어휘)' : '스페인어 (일상 실전 패턴)';
    }

    // 2. 상단 헤더 국기 이모지 및 언어명 배지 텍스트 즉시 갱신
    const headerFlag = document.getElementById('header-flag-emoji');
    if (headerFlag) {
      headerFlag.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
    }
    const headerLangName = document.getElementById('header-lang-name');
    if (headerLangName) {
      headerLangName.textContent = (lang === 'en') ? '영어' : '스페인어';
    }

    // 3. 코스 및 단어장 드롭다운 목록 즉시 갱신 (저장소와 상태값 동기화)
    let selectedCourse = 'main';
    try {
      selectedCourse = localStorage.getItem(`vocadash_active_course_${lang}`) || 'main';
    } catch (_) { }

    // 축구팩(pack_football)인 상태에서 영어(en)로 바뀔 경우 기본 코스('main')로 안전하게 폴백
    if (lang === 'en' && selectedCourse === 'pack_football') {
      selectedCourse = 'main';
    }
    window.currentCourseId = selectedCourse;
    window.activeCourseId = selectedCourse;
    try {
      localStorage.setItem(`vocadash_active_course_${lang}`, selectedCourse);
      localStorage.setItem('vocadash_active_course', selectedCourse);
    } catch (_) { }

    renderCourseDropdown(lang, selectedCourse);
    if (typeof window.renderBookCourseDropdown === 'function') {
      window.renderBookCourseDropdown(lang, selectedCourse);
    }

    // 4. 로드맵 노드 및 스테이지 타이틀 갱신 (진행도 언어/코스별 격리 로드)
    if (typeof loadNodeProgress === 'function') {
      window.nodeProgressMap = loadNodeProgress(lang, selectedCourse);
    }
    const unlocked = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang, selectedCourse) : 1;
    window._currentVisibleUnitIndex = Math.max(0, unlocked - 1);
    updateRoadmapNodesUI();
    if (typeof renderRoadmap === 'function') {
      renderRoadmap();
    }

    // 5. 단어장 단어 갱신 (선택된 언어와 코스로 아코디언/단어 목록 리렌더링)
    if (typeof renderBookWords === 'function') {
      renderBookWords(lang, selectedCourse);
    }

    // 6. 캐릭터 마스코트 prefix (es-* <-> en-*) 및 로드맵 이정표 갱신
    updateMascotCharacters(lang);
    updateRoadmapSignpost(lang);

    // 7. 언어 선택 모달 내 상태 갱신 및 창 닫기
    updateModalCardsUI(lang);
    window.closeLanguageModal();

    // 8. 오답 노트 데이터 언어별(es/en) 격리 로드 및 오답 탭 즉시 리렌더링 (더미 배제)
    if (typeof loadWrongWords === 'function') {
      window.wrongWords = loadWrongWords(lang);
    } else {
      window.wrongWords = [];
    }
    if (typeof updateWrongWordsBadge === 'function') {
      updateWrongWordsBadge();
    }
    if (typeof renderReviewWords === 'function') {
      renderReviewWords(window.currentReviewFilter || 'waiting');
    }

    // 9. 내 기록(통계) 화면 언어별 UI 갱신
    if (typeof updateStatsScreenUI === 'function') {
      updateStatsScreenUI();
    }
  }
  window.setLanguage = setLanguage;
  window.changeCourse = setLanguage;
  window.changeLanguage = setLanguage;
  window.switchLanguage = setLanguage;

  function handleCardLanguageSelect(targetLang) {
    const langChanged = (modalPendingLanguage !== targetLang);
    modalPendingLanguage = targetLang;
    if (langChanged) {
      // 언어 전환 시 기본 코스('main')로 자동 선택
      modalPendingCourseId = 'main';
    }
    // 탭한 카드에 초록색 선택 테두리/체크 활성화 및 해당 언어의 코스 목록 동적 갱신
    updateModalCardsUI(targetLang);
    renderModalCourseList(targetLang, modalPendingCourseId);
  }

  if (cardEs) {
    cardEs.addEventListener('click', () => handleCardLanguageSelect('es'));
    cardEs.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardLanguageSelect('es');
      }
    });
  }

  if (cardEn) {
    cardEn.addEventListener('click', () => handleCardLanguageSelect('en'));
    cardEn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardLanguageSelect('en');
      }
    });
  }

  // 6. Streak & Profile Modals & Bottom Tabs
  const streakModal = el('streak-modal');
  const streakBackdrop = el('streak-modal-backdrop') || streakModal;
  const streakCard = el('streak-modal-card');

  // 🔥 스트릭 데이터 계산 및 UI(헤더 & 모달) 전면 동기화 함수
  function syncStreakUI() {
    let streakCount = 0;
    try {
      // 로컬스토리지에 저장된 다양한 포맷의 스트릭 키 확인
      const raw = localStorage.getItem('vocadash_streak') ||
        localStorage.getItem('vocadash_user_streak') ||
        localStorage.getItem('streakData');
      if (raw) {
        const parsed = JSON.parse(raw);
        streakCount = typeof parsed === 'object' ? (parsed.count || parsed.currentStreak || 0) : Number(parsed) || 0;
      }
    } catch (_) { }

    // 1) 상단 헤더 불꽃 숫자 반영
    const headerCount = document.getElementById('header-streak-count');
    if (headerCount) {
      headerCount.textContent = streakCount;
    }

    // 2) 스트릭 모달 내부 큰 타이틀 텍스트 반영 (예: 🔥 0일 연속 질주 중!)
    const modalStreakText = streakCard?.querySelector('h3') ||
      document.querySelector('#streak-modal-card h3') ||
      document.getElementById('modal-streak-count');
    if (modalStreakText) {
      modalStreakText.innerHTML = `🔥 ${streakCount}일 연속 질주 중!`;
    }
  }
  window.syncStreakUI = syncStreakUI;

  // 화면 로드 즉시 헤더 숫자 동기화 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncStreakUI);
  } else {
    syncStreakUI();
  }

  window.openStreakModal = () => {
    // 모달 열기 직전 최신 스트릭 수치 갱신
    syncStreakUI();

    const sModal = el('streak-modal');
    if (sModal) sModal.classList.remove('hidden');
    if (streakBackdrop) {
      streakBackdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      streakBackdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (streakCard) {
      streakCard.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-full');
      streakCard.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
    toggleModal(streakBackdrop, streakCard, true, 'slide');
  };

  window.closeStreakModal = () => {
    toggleModal(streakBackdrop, streakCard, false, 'slide');
    setTimeout(() => {
      const sModal = el('streak-modal');
      if (sModal && streakBackdrop && streakBackdrop.classList.contains('opacity-0')) {
        sModal.classList.add('hidden');
      }
    }, 220);
  };

  function showStreakModal() {
    const sModal = document.getElementById('streak-modal');
    if (sModal) {
      sModal.classList.remove('hidden');
    }
    if (typeof window.openStreakModal === 'function') {
      window.openStreakModal();
    } else {
      toggleModal(streakBackdrop, streakCard, true, 'slide');
    }
  }
  window.showStreakModal = showStreakModal;

  const handleOpenStreakModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sModal = document.getElementById('streak-modal');
    if (sModal) {
      sModal.classList.remove('hidden');
    }
    showStreakModal();
  };

  on('streak-trigger', 'click', handleOpenStreakModal);
  on('close-streak-modal-btn', 'click', (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    window.closeStreakModal();
  });
  on('btn-open-streak-modal', 'click', handleOpenStreakModal);
  on('stats-streak-card', 'click', handleOpenStreakModal);

  // ⚡ [오늘의 단어 질주 시작하기] 클릭 시 미완료 과(1과 우선)로 똑똑하게 연결
  const handleStartTodaySprint = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.closeStreakModal();

    // 현재 언어 및 팩 기준 진행도 확인
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentCoursePack = window.currentCourseId ||
      window.activeCourseId ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentLang) : null) ||
      'main';

    let n1Prog = 0;
    if (typeof getNodeProgress === 'function') {
      n1Prog = Number(getNodeProgress('node-1', currentLang, currentCoursePack)) || 0;
    }

    // 1과가 3회 미만이면 무조건 1과, 3회 이상 완료면 2과
    const targetNode = (n1Prog < 3) ? 'node-1' : 'node-2';

    // 전역 선택 노드 상태 동기화
    window.currentSelectedNodeId = targetNode;
    if (typeof currentSelectedNodeId !== 'undefined') {
      currentSelectedNodeId = targetNode;
    }

    setTimeout(() => {
      if (typeof window.openLessonModal === 'function') {
        window.openLessonModal(targetNode);
      } else {
        const targetBtn = document.getElementById(`${targetNode}-btn`) || document.getElementById(targetNode);
        if (targetBtn) targetBtn.click();
      }
    }, 220);
  };

  // '오늘의 단어 질주 시작하기' 버튼 이벤트 등록
  on('btn-today-sprint', 'click', handleStartTodaySprint);
  on('btn-start-streak-sprint', 'click', handleStartTodaySprint);
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent && btn.textContent.includes('오늘의 단어 질주 시작하기')) {
      btn.onclick = handleStartTodaySprint;
    }
  });

  if (streakBackdrop) {
    streakBackdrop.addEventListener('click', (e) => {
      if (e.target === streakBackdrop) {
        window.closeStreakModal();
      }
    });
  }

  // 스트릭 모달 마일스톤 버튼 (7일 / 14일 / 30일) 탭 전환
  document.querySelectorAll('.milestone-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.milestone-btn').forEach((b) => {
        b.className = 'milestone-btn flex-1 py-1.5 px-2 rounded-lg bg-white text-slate-600 font-semibold text-[12px] text-center truncate cursor-pointer hover:bg-slate-50 transition active:scale-95';
      });
      btn.className = 'milestone-btn flex-1 py-1.5 px-2 rounded-lg bg-[#FF9600] text-white font-bold text-[12px] text-center shadow-sm border-b-2 border-[#E07900] truncate cursor-pointer transition active:scale-95';
    });
  });

  const profileBackdrop = el('profile-modal-backdrop'), profileCard = el('profile-modal-card');
  window.openProfileModal = () => toggleModal(profileBackdrop, profileCard, true, 'slide');
  window.closeProfileModal = () => toggleModal(profileBackdrop, profileCard, false, 'slide');
  on('close-profile-modal-btn', 'click', window.closeProfileModal);

  // ===================================================
  // 6-B. 오답노트 (오답 탈출) 데이터 및 화면 로직 (언어별 독립 격리)
  // ===================================================
  const DEFAULT_WRONG_WORDS_ES = [
    { id: 'w_es_1', term: 'Adiós', meaning: '잘 가요', phonetic: '[아디오스]', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_2', term: 'Equipaje', meaning: '수하물 / 짐', phonetic: '[에키파헤]', correctStreak: 0, wrongCount: 2, escaped: false, lang: 'es' },
    { id: 'w_es_3', term: 'Boleto', meaning: '티켓 / 표', phonetic: '[볼레토]', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_4', term: 'Pasaporte', meaning: '여권', phonetic: '[파사포르테]', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_5', term: 'Maleta', meaning: '여행 가방 / 캐리어', phonetic: '[말레타]', correctStreak: 0, wrongCount: 2, escaped: false, lang: 'es' },
    { id: 'w_es_6', term: 'Aduana', meaning: '세관', phonetic: '[아두아나]', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_7', term: 'Vuelo', meaning: '항공편 / 비행', phonetic: '[부에글로]', correctStreak: 0, wrongCount: 1, escaped: false, lang: 'es' }
  ];
  const DEFAULT_WRONG_WORDS_EN = [];

  function getWrongStorageKey(lang) {
    const curLang = (lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
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
    const lang = (targetLang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const key = (typeof getWrongStorageKey === 'function') ? getWrongStorageKey(lang) : `vocadash_weakness_words_${lang}`;
    try {
      let saved = localStorage.getItem(key);
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
                  meaning: '',
                  phonetic: '',
                  correctStreak: 0,
                  wrongCount: 1,
                  escaped: false,
                  lang: lang
                };
              }
              return {
                id: String(item.id || `w_${lang}_${idx + 1}`),
                term: String(item.term || item.word || ''),
                meaning: String(item.meaning || item.kor || item.ko || ''),
                phonetic: String(item.phonetic || ''),
                correctStreak: typeof item.correctStreak === 'number' ? item.correctStreak : (parseInt(item.correctStreak, 10) || 0),
                wrongCount: Number(item.wrongCount) || 1,
                escaped: !!item.escaped,
                lang: item.lang || lang
              };
            })
            .filter((item) => item.lang === lang && (Number(item.correctStreak) || 0) < 5);
        }
      }
    } catch (e) {
      console.warn('오답 단어 로드 파싱 오류 방어:', e);
    }

    // 저장된 오답이 없으면 더미를 생성하거나 저장하지 않고 빈 배열 반환
    return [];
  }


  function saveWrongWords(words, targetLang) {
    const lang = (targetLang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const key = getWrongStorageKey(lang);
    try {
      // 5회 연속 정답 달성한 단어는 완전 졸업(영구 삭제)
      const validated = (words || [])
        .filter(w => (Number(w.correctStreak) || 0) < 5)
        .map((w, idx) => ({
          id: String(w.id || `w_${lang}_${idx + 1}`),
          term: String(w.term || w.word || ''),
          meaning: String(w.meaning || w.kor || w.ko || ''),
          phonetic: String(w.phonetic || ''),
          correctStreak: Number(w.correctStreak) || 0,
          wrongCount: Number(w.wrongCount) || 1,
          escaped: !!w.escaped,
          lang: w.lang || lang
        }));
      localStorage.setItem(key, JSON.stringify(validated));
      if (lang === 'es') {
        localStorage.setItem('vocadash_wrong_words', JSON.stringify(validated));
      }
    } catch (e) {
      console.warn('오답 단어 저장 실패:', e);
    }
  }

  window.loadWrongWords = loadWrongWords;
  window.saveWrongWords = saveWrongWords;
  window.wrongWords = loadWrongWords(window.currentLanguage || 'es');
  // ===================================================
  // 하트(HP) 영구 유지 및 30분 자동 충전 / 충전 모달 제어 시스템
  // ===================================================
  function getUserHearts() {
    try {
      const val = localStorage.getItem('vocadash_hearts');
      if (val !== null) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) return Math.max(0, Math.min(5, parsed));
      }
    } catch (_) { }
    return 5;
  }

  function updateHeartsUI() {
    const hearts = (typeof window.userHearts === 'number' && window.userHearts >= 0 && window.userHearts <= 5)
      ? window.userHearts
      : getUserHearts();
    window.userHearts = hearts;

    const headerHeart = document.getElementById('header-hearts-count');
    const headerHeartIcon = document.getElementById('header-hearts-icon');
    const headerHeartBadge = document.getElementById('header-hearts-badge');

    if (headerHeart) {
      headerHeart.textContent = String(hearts);
    }
    if (headerHeartIcon) {
      headerHeartIcon.textContent = hearts === 0 ? '💔' : '❤️';
    }
    if (headerHeartBadge) {
      if (hearts === 0) {
        headerHeartBadge.classList.remove('bg-rose-50', 'text-rose-600', 'border-rose-200/80', 'bg-red-50/80', 'text-red-500', 'border-red-200/80');
        headerHeartBadge.classList.add('bg-slate-100', 'text-slate-600', 'border-slate-300');
        headerHeartBadge.title = '하트 소진 (충전 필요)';
      } else {
        headerHeartBadge.classList.remove('bg-slate-100', 'text-slate-600', 'border-slate-300', 'bg-rose-50', 'text-rose-600', 'border-rose-200/80');
        headerHeartBadge.classList.add('bg-red-50/80', 'text-red-500', 'border-red-200/80');
        headerHeartBadge.title = `남은 하트: ${hearts}개`;
      }
    }

    const reviewHeart = document.getElementById('review-hearts-display');
    if (reviewHeart) reviewHeart.textContent = `${hearts}/5`;
    if (typeof window.syncInGameHearts === 'function') {
      window.syncInGameHearts(hearts);
    }
  }
  window.updateUserHeartsUI = updateHeartsUI;

  function setUserHearts(val) {
    const clamped = Math.max(0, Math.min(5, parseInt(val, 10) || 0));
    window.userHearts = clamped;
    try {
      localStorage.setItem('vocadash_hearts', String(clamped));
      if (clamped < 5) {
        if (!localStorage.getItem('vocadash_hearts_timer_start')) {
          localStorage.setItem('vocadash_hearts_timer_start', String(Date.now()));
        }
      } else {
        localStorage.removeItem('vocadash_hearts_timer_start');
      }
    } catch (_) { }
    updateHeartsUI();
    return clamped;
  }
  window.getUserHearts = getUserHearts;
  window.setUserHearts = setUserHearts;

  // 30분 타이머 및 백그라운드 경과 시간 계산 연동
  function checkAndRechargeHearts() {
    let hearts = getUserHearts();
    const RECHARGE_INTERVAL = 30 * 60 * 1000; // 30분 (1,800,000ms)

    if (hearts >= 5) {
      try { localStorage.removeItem('vocadash_hearts_timer_start'); } catch (_) { }
      window.userHearts = 5;
      updateHeartsUI();
      return { hearts: 5, remainingSeconds: 0, isMax: true };
    }

    const now = Date.now();
    let timerStart = 0;
    try {
      const raw = localStorage.getItem('vocadash_hearts_timer_start');
      timerStart = raw ? parseInt(raw, 10) : 0;
    } catch (_) { }

    if (!timerStart || isNaN(timerStart) || timerStart > now) {
      timerStart = now;
      try { localStorage.setItem('vocadash_hearts_timer_start', String(timerStart)); } catch (_) { }
    }

    const elapsed = now - timerStart;
    const recovered = Math.floor(elapsed / RECHARGE_INTERVAL);

    if (recovered > 0) {
      hearts = Math.min(5, hearts + recovered);
      try {
        localStorage.setItem('vocadash_hearts', String(hearts));
        if (hearts >= 5) {
          localStorage.removeItem('vocadash_hearts_timer_start');
          window.userHearts = 5;
          updateHeartsUI();
          return { hearts: 5, remainingSeconds: 0, isMax: true };
        } else {
          timerStart += recovered * RECHARGE_INTERVAL;
          localStorage.setItem('vocadash_hearts_timer_start', String(timerStart));
        }
      } catch (_) { }
    }

    window.userHearts = hearts;
    updateHeartsUI();
    const remainingMs = Math.max(0, RECHARGE_INTERVAL - (now - timerStart));
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    return { hearts, remainingSeconds, isMax: false };
  }
  window.checkAndRechargeHearts = checkAndRechargeHearts;

  window.userHearts = getUserHearts();

  // 하트 충전 모달 제어
  let heartTimerInterval = null;

  function updateHeartModalCountdownDisplay() {
    const status = (typeof checkAndRechargeHearts === 'function') ? checkAndRechargeHearts() : { isMax: false, hearts: Number(window.userHearts) || 0, remainingSeconds: 0 };
    const display = document.getElementById('heart-countdown-display');
    const icon = document.getElementById('heart-modal-icon');
    const title = document.getElementById('heart-modal-title');
    const desc = document.getElementById('heart-modal-desc');

    if (status.isMax || status.hearts >= 5) {
      if (display) display.textContent = '완전 충전됨 (5/5)';
      if (icon) icon.textContent = '💖';
      if (title) title.textContent = '❤️ 하트 풀 충전 상태';
      if (desc) desc.textContent = '하트가 가득 차 있습니다! 힘차게 단어를 마스터해 보세요.';
      return;
    }

    const mm = String(Math.floor(status.remainingSeconds / 60)).padStart(2, '0');
    const ss = String(status.remainingSeconds % 60).padStart(2, '0');
    if (display) display.textContent = `${mm}:${ss}`;

    if (status.hearts === 0) {
      if (icon) icon.textContent = '💔';
      if (title) title.textContent = '💔 하트가 모두 소진되었습니다!';
      if (desc) desc.textContent = '잠시 휴식하거나 아래 방법으로 하트를 채워보세요.';
    } else {
      if (icon) icon.textContent = '💖';
      if (title) title.textContent = `❤️ 현재 하트: ${status.hearts}/5`;
      if (desc) desc.textContent = '잠시 휴식하거나 아래 방법으로 하트를 채워보세요.';
    }
  }

  function openHeartRechargeModal() {
    const backdrop = document.getElementById('heart-modal-backdrop');
    const card = document.getElementById('heart-modal-card');
    if (!backdrop || !card) return;

    updateHeartModalCountdownDisplay();

    clearInterval(heartTimerInterval);
    heartTimerInterval = setInterval(updateHeartModalCountdownDisplay, 1000);

    // 1. 현재 유저 상태값 파악 (보석 잔여량, 오늘 무료 오답런 사용 여부)
    let curGems = 0;
    const gemsEl = document.getElementById('header-gems-count');
    if (gemsEl && !isNaN(parseInt(gemsEl.textContent, 10))) {
      curGems = parseInt(gemsEl.textContent, 10);
    } else if (typeof window.userGems === 'number') {
      curGems = window.userGems;
    } else {
      try {
        const saved = localStorage.getItem('vocadash_gems') || localStorage.getItem('vocadash_user_gems');
        if (saved !== null) curGems = parseInt(saved, 10) || 0;
      } catch (_) { }
    }

    // 🔥 현재 하트 개수 파악 (하트 5개 이상 여부 확인)
    let curHearts = Number(window.userHearts) || 0;
    try {
      const savedHearts = localStorage.getItem('vocadash_hearts');
      if (savedHearts !== null) curHearts = parseInt(savedHearts, 10);
    } catch (_) { }
    const headerHeartEl = document.getElementById('header-hearts-count');
    if (headerHeartEl && !isNaN(parseInt(headerHeartEl.textContent, 10))) {
      curHearts = Math.max(curHearts, parseInt(headerHeartEl.textContent, 10));
    }
    const isFullHearts = curHearts >= 5;

    const todayStr = new Date().toISOString().split('T')[0];
    const isReviewUsedToday = (localStorage.getItem('vocadash_last_heart_review_date') === todayStr);
    const hasEnoughGems = curGems >= 100;

    const gemBtn = document.getElementById('btn-recharge-with-gems');
    const reviewBtn = document.getElementById('btn-recharge-with-review');

    // 📺 공통 3초 광고 재생 연출 함수
    const runAdSimulation = (rewardCallback, completeMsg) => {
      if (typeof closeHeartRechargeModal === 'function') closeHeartRechargeModal();

      const adOverlay = document.createElement('div');
      adOverlay.id = 'temp-ad-overlay';
      adOverlay.className = 'fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-white px-6 text-center select-none';
      adOverlay.innerHTML = `
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl mb-4 animate-bounce">
          📺
        </div>
        <div class="text-lg font-black tracking-tight mb-1">광고 시청 중...</div>
        <div class="text-xs text-slate-400 mb-6">광고가 끝나면 보상이 즉시 지급됩니다.</div>
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold">
          <span id="ad-timer-count" class="text-emerald-400 text-base font-black">3</span>초 후 완료
        </div>
      `;
      document.body.appendChild(adOverlay);

      let leftSec = 3;
      const timerEl = document.getElementById('ad-timer-count');
      const interval = setInterval(() => {
        leftSec -= 1;
        if (timerEl) timerEl.textContent = leftSec;

        if (leftSec <= 0) {
          clearInterval(interval);
          adOverlay.remove();
          if (typeof rewardCallback === 'function') rewardCallback();
          if (typeof window.playSound === 'function') window.playSound('gem');
          if (typeof window.showToast === 'function') window.showToast(completeMsg, '🎉');
        }
      }, 1000);
    };

    // ========================================================
    // 2. [조건별 분기]: 버튼 렌더링
    // ========================================================

    // 💖 [상태 0]: 하트가 이미 5개 풀 충전일 때 -> 충전 버튼 대신 단일 도전 버튼 노출
    if (isFullHearts) {
      if (gemBtn) {
        gemBtn.style.display = 'flex';
        gemBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl transition active:scale-98 cursor-pointer shadow-md";
        gemBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl font-bold">🚀</div>
            <div class="text-left">
              <div class="text-sm font-black text-white">하트 가득! 바로 도전하기</div>
              <div class="text-xs text-emerald-100 font-medium">실수 걱정 없이 마음껏 달려보세요!</div>
            </div>
          </div>
          <span class="px-3 py-1.5 bg-white text-emerald-600 text-xs font-black rounded-xl shadow-xs">출발 →</span>
        `;
        gemBtn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          closeHeartRechargeModal();
          if (typeof autoScrollToActiveNode === 'function') {
            autoScrollToActiveNode();
          }
        };
      }

      // 5개일 때는 불필요한 오답런 충전 버튼 숨김
      if (reviewBtn) {
        reviewBtn.style.display = 'none';
      }

    } else if (!hasEnoughGems && isReviewUsedToday) {
      // 🔴 [상태 4]: 하트 부족 + 보석 부족(<100) + 오늘 무료 오답런 완료 -> '광고 완충' 단 하나만 노출
      if (gemBtn) {
        gemBtn.style.display = 'flex';
        gemBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 border border-emerald-200 rounded-2xl transition active:scale-98 cursor-pointer shadow-xs";
        gemBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">📺</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">광고 보고 하트 완충</div>
              <div class="text-xs text-emerald-600 font-medium">무료 광고 1회 시청하고 하트 5개 풀 충전</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-2xs">무료 +5❤️</span>
        `;
        gemBtn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          runAdSimulation(() => {
            if (typeof setUserHearts === 'function') setUserHearts(5);
          }, '📺 광고 시청 완료! 하트 5개 풀 충전! 💖');
        };
      }

      if (reviewBtn) {
        reviewBtn.style.display = 'none';
      }

    } else {
      // 🟢 [상태 1, 2, 3]: 하트 부족 시 정상 충전 옵션 노출
      if (reviewBtn) reviewBtn.style.display = 'flex';
      if (gemBtn) gemBtn.style.display = 'flex';

      // 1) 첫 번째 버튼 (보석 충전 or 광고 완충)
      if (hasEnoughGems) {
        gemBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 border border-sky-200 rounded-2xl transition active:scale-98 cursor-pointer shadow-xs";
        gemBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">💎</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">보석으로 즉시 완충</div>
              <div class="text-xs text-slate-500">보석 100개로 하트 5개 풀 충전</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-sky-500 text-white text-xs font-black rounded-xl shadow-2xs">100 💎</span>
        `;
        gemBtn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          curGems -= 100;
          window.userGems = curGems;
          try {
            localStorage.setItem('vocadash_gems', String(curGems));
            localStorage.setItem('vocadash_user_gems', String(curGems));
          } catch (_) { }
          if (gemsEl) gemsEl.textContent = curGems;
          if (typeof updateHeaderGemsUI === 'function') updateHeaderGemsUI();
          if (typeof setUserHearts === 'function') setUserHearts(5);
          if (typeof window.playSound === 'function') window.playSound('gem');
          if (typeof closeHeartRechargeModal === 'function') closeHeartRechargeModal();
          if (typeof window.showToast === 'function') window.showToast('💖 보석 100개로 하트 5개 풀 충전 완료!', '🎉');
        };
      } else {
        gemBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 border border-emerald-200 rounded-2xl transition active:scale-98 cursor-pointer shadow-xs";
        gemBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">📺</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">광고 보고 즉시 완충</div>
              <div class="text-xs text-emerald-600 font-medium">보석 부족 (보유: ${curGems}개) · 광고로 무료 충전</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-2xs">무료 +5❤️</span>
        `;
        gemBtn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          runAdSimulation(() => {
            if (typeof setUserHearts === 'function') setUserHearts(5);
          }, '📺 무료 광고 시청 완료! 하트 5개 풀 충전! 💖');
        };
      }

      // 2) 두 번째 버튼 (오답런)
      if (isReviewUsedToday) {
        reviewBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 border border-purple-200 rounded-2xl transition active:scale-98 cursor-pointer shadow-xs";
        reviewBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">📺</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">광고 보고 오답런 뛰기</div>
              <div class="text-xs text-purple-600 font-medium">오늘 무료 완료 · 광고 시청 후 오답런 완충 도전</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-purple-500 text-white text-xs font-black rounded-xl shadow-2xs">+5❤️ 도전</span>
        `;
        reviewBtn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          runAdSimulation(() => {
            window.pendingHeartReward = 5;
            if (typeof window.startRoadmapReviewSpeedrun === 'function') {
              window.startRoadmapReviewSpeedrun();
            }
          }, '📺 광고 시청 완료! 특별 오답런 시작! 🏃‍♂️');
        };
      } else {
        reviewBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 border border-amber-200 rounded-2xl transition active:scale-98 cursor-pointer shadow-xs";
        reviewBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#FF9600] text-white flex items-center justify-center text-lg font-bold shadow-xs">⚡</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">약점 극복 오답런 뛰기</div>
              <div class="text-xs text-amber-600 font-medium">오늘 1회 무료 · 80% 완주 시 하트 3개 보충!</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-[#FF9600] text-white text-xs font-black rounded-xl shadow-2xs">무료 +3❤️</span>
        `;
        reviewBtn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          try {
            localStorage.setItem('vocadash_last_heart_review_date', todayStr);
          } catch (_) { }
          window.pendingHeartReward = 3;
          if (typeof closeHeartRechargeModal === 'function') closeHeartRechargeModal();
          if (typeof window.startRoadmapReviewSpeedrun === 'function') {
            window.startRoadmapReviewSpeedrun();
          }
        };
      }
    }

    // 3. 모달 화면 표시
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
  }
  window.openHeartRechargeModal = openHeartRechargeModal;

  function closeHeartRechargeModal() {
    clearInterval(heartTimerInterval);
    heartTimerInterval = null;
    const backdrop = document.getElementById('heart-modal-backdrop');
    const card = document.getElementById('heart-modal-card');
    if (!backdrop || !card) return;
    backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
  }
  window.closeHeartRechargeModal = closeHeartRechargeModal;

  function initHeartModalEvents() {
    const closeBtn = document.getElementById('btn-close-heart-modal');
    if (closeBtn) closeBtn.onclick = closeHeartRechargeModal;

    const backdrop = document.getElementById('heart-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeHeartRechargeModal();
      });
    }

    // [옵션 A]: 보석 수량에 따라 '보석 완충' 또는 '광고 완충'으로 자동 변신
    const gemBtn = document.getElementById('btn-recharge-with-gems');
    if (gemBtn) {
      // 1) 현재 보유 보석 확인 (헤더 DOM > 전역변수 > localStorage)
      let curGems = 0;
      const gemsEl = document.getElementById('header-gems-count');
      if (gemsEl && !isNaN(parseInt(gemsEl.textContent, 10))) {
        curGems = parseInt(gemsEl.textContent, 10);
      } else if (typeof window.userGems === 'number') {
        curGems = window.userGems;
      } else {
        try {
          const saved = localStorage.getItem('vocadash_gems') || localStorage.getItem('vocadash_user_gems');
          if (saved !== null) curGems = parseInt(saved, 10) || 0;
        } catch (_) { }
      }

      // 2) 보석 부족 시 -> 버튼을 '무료 광고 보고 완충' 디자인으로 자동 전환
      if (curGems < 100) {
        gemBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 border border-emerald-200 rounded-2xl transition active:scale-98 cursor-pointer";
        gemBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">📺</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">광고 보고 즉시 완충</div>
              <div class="text-xs text-emerald-600 font-medium">보석 부족 (보유: ${curGems}개) · 광고로 무료 충전</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-2xs">무료 +5❤️</span>
        `;
      } else {
        // 보석 충분 시 -> 원래 보석 모드
        gemBtn.className = "w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 border border-sky-200 rounded-2xl transition active:scale-98 cursor-pointer";
        gemBtn.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">💎</div>
            <div class="text-left">
              <div class="text-sm font-bold text-slate-800">보석으로 즉시 완충</div>
              <div class="text-xs text-slate-500">보석 100개로 하트 5개 풀 충전</div>
            </div>
          </div>
          <span class="px-2.5 py-1.5 bg-sky-500 text-white text-xs font-black rounded-xl shadow-2xs">100 💎</span>
        `;
      }

      // 3) 클릭 시 동작 (팝업 없이 직관적 실행)
      gemBtn.onclick = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        // 하트가 이미 5개면 차단
        let curHearts = Number(window.userHearts) || 0;
        try {
          const savedHearts = localStorage.getItem('vocadash_hearts');
          if (savedHearts !== null) curHearts = parseInt(savedHearts, 10);
        } catch (_) { }
        const headerHeartEl = document.getElementById('header-hearts-count');
        if (headerHeartEl && !isNaN(parseInt(headerHeartEl.textContent, 10))) {
          curHearts = Math.max(curHearts, parseInt(headerHeartEl.textContent, 10));
        }

        if (curHearts >= 5) {
          if (typeof window.showToast === 'function') {
            window.showToast('💖 이미 하트가 가득 차 있어서 충전할 필요가 없어요!', '✨');
          }
          return;
        }

        // 보석이 100개 이상일 때: 보석 차감 후 완충
        if (curGems >= 100) {
          curGems -= 100;
          window.userGems = curGems;
          try {
            localStorage.setItem('vocadash_gems', String(curGems));
            localStorage.setItem('vocadash_user_gems', String(curGems));
          } catch (_) { }

          if (gemsEl) gemsEl.textContent = curGems;
          if (typeof updateHeaderGemsUI === 'function') updateHeaderGemsUI();

          setUserHearts(5);
          if (typeof window.playSound === 'function') window.playSound('gem');
          closeHeartRechargeModal();
          if (typeof window.showToast === 'function') {
            window.showToast('💖 보석으로 하트 5개 풀 충전 완료!', '🎉');
          }
        } else {
          // 보석이 부족할 때: 팝업창 없이 바로 광고 보고 완충
          if (typeof window.playRewardAdForHeart === 'function') {
            window.playRewardAdForHeart();
          } else {
            setUserHearts(5);
            if (typeof window.playSound === 'function') window.playSound('gem');
            closeHeartRechargeModal();
            if (typeof window.showToast === 'function') {
              window.showToast('📺 무료 광고 시청 완료! 하트 5개 풀 충전!', '💖');
            }
          }
        }
      };
    }



    // 옵션 B: 약점 극복 오답런 뛰기 (하루 1회 무료 +5❤️ 완충 / 2회차부터는 광고 보고 +5❤️ 완충)
    const reviewBtn = document.getElementById('btn-recharge-with-review');
    if (reviewBtn) {
      reviewBtn.onclick = function () {
        // 1) 이미 하트가 5개 가득 찼으면 불필요한 실행 방지
        let curHearts = Number(window.userHearts) || 0;
        try {
          const savedHearts = localStorage.getItem('vocadash_hearts');
          if (savedHearts !== null) curHearts = parseInt(savedHearts, 10) || curHearts;
        } catch (_) { }

        if (curHearts >= 5) {
          if (typeof window.showToast === 'function') {
            window.showToast('💖 이미 하트가 가득 차 있어서 오답런을 뛸 필요가 없어요!', '✨');
          }
          return;
        }

        // 2) 오늘 무료 기회 사용 여부 확인 (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const lastReviewDate = localStorage.getItem('vocadash_last_heart_review_date');

        if (lastReviewDate === today) {
          // 2회차 이상: 짧은 광고 시청 후 하트 5개 즉시 완충
          const watchAd = confirm(
            "⚡ 오늘의 무료 오답런 기회를 이미 사용하셨습니다!\n\n📺 짧은 광고를 시청하고 하트 5개를 즉시 풀 충전하시겠습니까?"
          );
          if (watchAd) {
            if (typeof window.playRewardAdForHeart === 'function') {
              window.playRewardAdForHeart();
            } else {
              // 광고 완료 시뮬레이션: 하트 5개 즉시 충전
              setUserHearts(5);
              closeHeartRechargeModal();
              if (typeof window.playSound === 'function') window.playSound('gem');
              if (typeof window.showToast === 'function') {
                window.showToast('📺 광고 시청 완료! 하트 5개 풀 충전 완료! 💖', '🎉');
              }
            }
          }
          return;
        }

        // 3) 오늘 첫 판: 오답런 완주 시 +5개를 주기 위한 플래그 저장 후 오답런 시작
        try {
          localStorage.setItem('vocadash_last_heart_review_date', today);
        } catch (_) { }

        // 이번 오답런 완료 시 지급할 하트 수량을 전역에 지정
        window.pendingHeartReward = 5;

        closeHeartRechargeModal();
        if (typeof window.startRoadmapReviewSpeedrun === 'function') {
          window.startRoadmapReviewSpeedrun();
        }
      };
    }

    // 상단 헤더 하트 칩 터치 이벤트
    const headerHeartsBadge = document.getElementById('header-hearts-badge');
    if (headerHeartsBadge) {
      headerHeartsBadge.onclick = function () {
        openHeartRechargeModal();
      };
    }
  }
  window.initHeartModalEvents = initHeartModalEvents;

  function updateWrongWordsBadge() {
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const list = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const waitingWords = list.filter((w) => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    const count = waitingWords.length;

    updateHeartsUI();

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
      bookWrongCount.textContent = count;
    }

    // 1-C) 교재·단어장 상단 배너 내 [⚡ 오답 탈출 런] 액션 버튼 상태 갱신
    updateHeroWrongRunButton(count);

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
  }
  window.updateWrongWordsBadge = updateWrongWordsBadge;

  // 교재·단어장 상단 배너 내 [⚡ 오답 탈출 런] 버튼 상태 갱신 함수 (하트 언급 제거 버전)
  function updateHeroWrongRunButton(overrideCount) {
    const heroWrongRunBtn = document.getElementById('btn-hero-wrong-run');
    if (!heroWrongRunBtn) return;
    let count = typeof overrideCount === 'number' ? overrideCount : null;
    if (count === null) {
      const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      let wrongList = [];
      if (typeof window.loadWrongWords === 'function') {
        wrongList = window.loadWrongWords(currentLang) || [];
      } else {
        try {
          const raw = localStorage.getItem('vocadash_wrong_words');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              wrongList = parsed.filter(w => (w.lang || 'es') === currentLang);
            }
          }
        } catch (_) { }
      }
      count = wrongList.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    }

    if (count > 0) {
      heroWrongRunBtn.disabled = false;
      heroWrongRunBtn.className = 'w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm py-2 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer opacity-100';
      // 💡 하트 언급 대신 오답 단어 개수와 순수 복습 문구로 변경
      heroWrongRunBtn.innerHTML = `<span>⚡ 오답 탈출 런 시작 (${count}단어 복습)</span>`;
    } else {
      heroWrongRunBtn.disabled = true;
      heroWrongRunBtn.className = 'w-full bg-slate-200 text-slate-400 font-bold text-xs sm:text-sm py-2 px-3 rounded-xl shadow-none flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80';
      heroWrongRunBtn.innerHTML = '<span>🎉 모든 오답 정복 완료!</span>';
    }
  }
  window.updateHeroWrongRunButton = updateHeroWrongRunButton;


  // 인게임 문제 정답/오답 판정 및 연속 정답 5회(Mastery 5) 졸업 시스템
  function recordAnswerResult(question, isCorrect) {
    if (!question) return;
    try {
      const qTerm = (question.term || question.word || '').trim();
      const qId = question.id ? String(question.id).trim() : '';
      if (!qTerm && !qId) return;

      const lang = (question.lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
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
          item.correctStreak = (Number(item.correctStreak) || 0) + 1;
          console.log(`✅ [Weakness Review] '${item.term}' 정답! 연속 정답수: ${item.correctStreak}/5`);
          if (item.correctStreak >= 5) {
            // 5회 연속 정답 시 오답 목록에서 완전히 삭제 (마스터 졸업)
            list.splice(itemIdx, 1);
            if (typeof window.showToast === 'function') {
              window.showToast(`🎓 '${item.term}' 5연속 정답으로 오답 탈출 졸업!`, '🎉');
            }
          }
          saveWrongWords(list, lang);
          const currentActiveLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          if (currentActiveLang === lang) {
            window.wrongWords = list;
            updateWrongWordsBadge();
            if (typeof renderReviewWords === 'function') {
              renderReviewWords(window.currentReviewFilter || 'waiting');
            }
          }
        }
      } else {
        // 문제 오답 시: 해당 단어의 correctStreak를 즉시 0으로 리셋
        if (itemIdx !== -1) {
          const item = list[itemIdx];
          item.correctStreak = 0;
          item.wrongCount = (Number(item.wrongCount) || 1) + 1;
          item.escaped = false;
          console.log(`❌ [Weakness Review] '${item.term}' 오답! 연속 정답수 리셋 (0/5)`);
        } else {
          list.unshift({
            id: qId || ('w_' + lang + '_' + Date.now()),
            term: qTerm,
            meaning: question.meaning || question.kor || question.ko || '뜻 없음',
            phonetic: question.phonetic || `[${qTerm}]`,
            correctStreak: 0,
            wrongCount: 1,
            escaped: false,
            lang: lang
          });
          console.log(`📝 [Weakness Review] '${qTerm}' 신규 오답 등록`);
        }
        saveWrongWords(list, lang);
        const currentActiveLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        if (currentActiveLang === lang) {
          window.wrongWords = list;
          updateWrongWordsBadge();
          if (typeof renderReviewWords === 'function') {
            renderReviewWords(window.currentReviewFilter || 'waiting');
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ recordAnswerResult 예외 방어:', err);
    }
  }
  window.recordAnswerResult = recordAnswerResult;

  window.addWrongWord = function (wordObj) {
    recordAnswerResult(wordObj, false);
  };

  // ===================================================
  // 단어 정렬 전용 텍스트 정제 헬퍼 함수
  // ===================================================
  function getSortableWord(word) {
    if (!word || typeof word !== 'string') return '';
    // 문장/단어 맨 앞의 ¿, ¡, 따옴표(", '), 괄호((, [), 특수문자, 공백 완전 제거
    return word.replace(/^[¿¡"'\(\[\s\-]+/g, '').trim().toLowerCase();
  }
  window.getSortableWord = getSortableWord;

  const SORT_MODES = [
    { id: 'wrong_desc', label: '🚨 오답 많은순' },
    { id: 'recent', label: '⏱️ 최신 오답순' },
    { id: 'alpha', label: '🔤 알파벳순' }
  ];
  let currentSortMode = 'wrong_desc';
  let currentReviewFilter = 'waiting';
  window.currentReviewFilter = currentReviewFilter;

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
      const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      arr.sort((a, b) => {
        const strA = getSortableWord(a.word || a.term);
        const strB = getSortableWord(b.word || b.term);
        return strA.localeCompare(strB, curLang, { sensitivity: 'base' });
      });
    }
    return arr;
  }
  function sortReviewWords(list = window.wrongWords, mode = currentSortMode) {
    const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const langList = (Array.isArray(list) ? list : []).filter(item => (item.lang || curLang) === curLang);
    return sortWords(langList, mode);
  }
  window.sortWords = sortWords;
  window.sortReviewWords = sortReviewWords;

  function renderReviewWords(filter = currentReviewFilter) {
    currentReviewFilter = filter;
    window.currentReviewFilter = filter;
    if (typeof updateReviewFilterTabs === 'function') {
      updateReviewFilterTabs(filter);
    }
    const container = document.getElementById('review-word-list');
    if (!container) return;

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentWrongList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
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
        <p class="phonetic-hint review-word-phonetic text-xs font-normal text-slate-400 mt-1 select-none ${(!window.vocadashSettings || window.vocadashSettings.showPhonetic !== false) ? '' : 'hidden'}" style="${(!window.vocadashSettings || window.vocadashSettings.showPhonetic !== false) ? '' : 'display: none;'}">
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
        const activeCourse = window.currentLanguage || window.currentActiveCourse || 'es';
        if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, activeCourse, audioBtn);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, activeCourse, audioBtn);
        }
      };
    });

    updateWrongWordsBadge();
  }
  window.renderReviewWords = renderReviewWords;

  // 2. 하단 탭 네비게이션 & 오답노트 / 내 기록 화면 전환
  function updateStatsScreenUI() {
    try {
      const statsAvatarImg = document.getElementById('stats-avatar-img');
      const hallUserAvatar = document.getElementById('hall-user-avatar');
      const hallHeaderAvatar = document.getElementById('hall-header-avatar');
      let avatarSrc = (typeof selectedAvatarSrc !== 'undefined' && selectedAvatarSrc) ? selectedAvatarSrc : null;
      if (!avatarSrc) {
        try {
          const userProfileStr = localStorage.getItem('userProfile');
          if (userProfileStr) {
            const parsed = JSON.parse(userProfileStr);
            if (parsed && parsed.avatar) avatarSrc = parsed.avatar;
          }
        } catch (_) { }
      }
      if (!avatarSrc) {
        try {
          avatarSrc = localStorage.getItem('vocadash_profile_avatar');
        } catch (_) { }
      }
      const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      if (!avatarSrc) {
        avatarSrc = currentLang === 'en' ? 'assets/profiles/profile-english.webp?v=68' : 'assets/profiles/profile-spanish.webp?v=68';
      }
      if (avatarSrc && !avatarSrc.includes('lh3.googleusercontent.com/aida/')) {
        if (statsAvatarImg) statsAvatarImg.src = avatarSrc;
        if (hallUserAvatar) hallUserAvatar.src = avatarSrc;
        if (hallHeaderAvatar) hallHeaderAvatar.src = avatarSrc;
      }

      const statsNickname = document.getElementById('stats-nickname');
      const nicknameInput = document.getElementById('nickname-input');
      if (statsNickname) {
        let nick = (nicknameInput && nicknameInput.value) ? nicknameInput.value.trim() : null;
        let hasCustomNick = false;
        if (!nick) {
          try {
            const userProfileStr = localStorage.getItem('userProfile');
            if (userProfileStr) {
              const parsed = JSON.parse(userProfileStr);
              if (parsed && parsed.nickname) { nick = parsed.nickname; hasCustomNick = true; }
            }
          } catch (_) { }
        }
        if (!nick) {
          try {
            const savedNick = localStorage.getItem('vocadash_profile_nickname');
            if (savedNick) { nick = savedNick; hasCustomNick = true; }
          } catch (_) { }
        }
        if (!hasCustomNick) {
          nick = currentLang === 'en' ? '영어 질주러' : '스페인어 질주러';
        }
        statsNickname.textContent = nick;
      }

      const statsTitleBadge = document.getElementById('stats-title-badge');
      if (statsTitleBadge) {
        try {
          const savedTitle = localStorage.getItem('vocadash_profile_title');
          if (savedTitle) statsTitleBadge.textContent = savedTitle;
        } catch (_) { }
      }

      // 1) 레벨 계산 (실제 저장된 XP 기준, 없으면 0)
      let currentXp = 0;
      try {
        currentXp = Number(localStorage.getItem('vocadash_xp') || localStorage.getItem('vocadash_user_xp') || 0);
      } catch (_) { }

      const currentLevel = Math.max(1, Math.floor(currentXp / 100) + 1);
      const levelTitle = currentLevel >= 5 ? '실전 마스터 🚀' : (currentLevel >= 3 ? '열정 러너 🏃' : '비기너 🌱');

      const statsLevelBadge = document.getElementById('stats-level-badge');
      if (statsLevelBadge) {
        statsLevelBadge.textContent = `Lv.${currentLevel} ${levelTitle}`;
      }

      // 2) 외운 단어 수 계산 (localStorage에 저장된 실제 단어 수)
      let masteredCount = 0;
      try {
        const rawMastered = localStorage.getItem('vocadash_mastered_words') ||
          localStorage.getItem('vocadash_learned_words') ||
          localStorage.getItem('vocadash_completed_words');
        if (rawMastered) {
          const parsed = JSON.parse(rawMastered);
          masteredCount = Array.isArray(parsed) ? parsed.length : (Number(parsed) || 0);
        }
      } catch (_) { }

      const statsWordsCount = document.getElementById('stats-words-count');
      if (statsWordsCount) {
        statsWordsCount.textContent = `${masteredCount}개`;
      }

      // 3) 정답률 (저장된 값 없으면 0%)
      const statsAccuracyRate = document.getElementById('stats-accuracy-rate');
      if (statsAccuracyRate) {
        let accuracyRate = 0;
        try {
          const savedAcc = localStorage.getItem('vocadash_overall_accuracy');
          if (savedAcc !== null) accuracyRate = parseInt(savedAcc, 10) || 0;
        } catch (_) { }
        statsAccuracyRate.textContent = `${accuracyRate}%`;
      }

      // 4) 보유 보석 (저장된 값 없으면 0개)
      const statsGemsCount = document.getElementById('stats-gems-count');
      if (statsGemsCount) {
        let gems = 0;
        try {
          const savedGems = localStorage.getItem('vocadash_gems');
          if (savedGems !== null) gems = parseInt(savedGems, 10) || 0;
        } catch (_) { }
        statsGemsCount.textContent = `${gems}개`;
      }
    } catch (err) {
      console.warn('[VocaDash] updateStatsScreenUI error ignored:', err);
    }
  }
  window.updateStatsScreenUI = updateStatsScreenUI;
  window.updateStatsUI = updateStatsScreenUI;
  window.renderUserStats = updateStatsScreenUI;


  let isAppSwitchingTab = false;
  function switchMainTab(tabName) {
    if (typeof window.switchMainTab === 'function' && window.switchMainTab !== switchMainTab) {
      window.switchMainTab(tabName);
      return;
    }
    if (isAppSwitchingTab) return;
    isAppSwitchingTab = true;
    try {
      window.isActive = false;
      window.isGameActive = false;
      if (typeof window.clearAllGameTimers === 'function') window.clearAllGameTimers();
      if (typeof window.stopTTS === 'function') window.stopTTS();
      if (typeof window.closeGameScreen === 'function') window.closeGameScreen();
      if (typeof window.closeFlashcardScreen === 'function') window.closeFlashcardScreen();

      const roadmapScreen = document.getElementById('roadmap-screen');
      const roadmapHeader = document.getElementById('roadmap-header');
      const packsScreen = document.getElementById('packs-screen');
      const reviewScreen = document.getElementById('review-screen');
      const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
      const settingsScreen = document.getElementById('settings-screen');
      const bookScreen = document.getElementById('book-screen');
      const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
      const loginScreen = document.getElementById('login-screen');

      let normTab = String(tabName || 'home').toLowerCase().trim();
      if (normTab === 'packs' || normTab === 'pack') normTab = 'packs';
      if (normTab === 'stats' || normTab === 'my-records' || normTab === 'record') normTab = 'records';
      if (normTab === 'study' || normTab === 'wordbook') normTab = 'book';
      if (normTab === 'roadmap') normTab = 'home';

      const screenMap = {
        home: { screen: roadmapScreen, header: roadmapHeader, tab: document.getElementById('tab-home') },
        packs: { screen: packsScreen, header: null, tab: document.querySelector('#tab-packs, .nav-packs') },
        review: { screen: reviewScreen, header: null, tab: document.getElementById('tab-review') },
        book: { screen: bookScreen, header: null, tab: document.querySelector('#tab-book, #tab-study, .nav-book, .nav-study') },
        records: { screen: statsScreen, header: null, tab: document.querySelector('#tab-records, #tab-stats, .nav-stats, .nav-records') }
      };

      const allScreens = [roadmapScreen, packsScreen, reviewScreen, bookScreen, statsScreen, settingsScreen, hallOfFameScreen, loginScreen];
      allScreens.forEach((sc) => {
        if (sc) {
          sc.classList.add('hidden');
          sc.style.display = 'none';
        }
      });

      if (roadmapHeader) {
        if (normTab === 'home') {
          roadmapHeader.classList.remove('hidden');
          roadmapHeader.style.removeProperty('display');
          roadmapHeader.style.display = '';
        } else {
          roadmapHeader.classList.add('hidden');
          roadmapHeader.style.display = 'none';
        }
      }

      const targetConfig = screenMap[normTab] || screenMap.home;
      if (targetConfig && targetConfig.screen) {
        targetConfig.screen.classList.remove('hidden');
        targetConfig.screen.style.removeProperty('display');
        targetConfig.screen.style.display = '';
      }

      const activeTabEl = targetConfig ? targetConfig.tab : null;
      if (typeof window.setTabActive === 'function') {
        window.setTabActive(activeTabEl);
      } else {
        document.querySelectorAll('.nav-item').forEach((n) => {
          n.classList.remove('text-primary', 'font-bold', 'text-[#22c55e]');
          n.classList.add('text-on-surface-variant');
          n.removeAttribute('aria-current');
        });
        if (activeTabEl) {
          activeTabEl.classList.remove('text-on-surface-variant');
          activeTabEl.classList.add('text-primary', 'font-bold');
          activeTabEl.setAttribute('aria-current', 'page');
        }
      }

      if (normTab === 'records') {
        try {
          updateStatsScreenUI();
        } catch (_) { }
      } else if (normTab === 'packs') {
        try {
          if (typeof renderPacksScreenUI === 'function') renderPacksScreenUI();
        } catch (_) { }
      } else if (normTab === 'review') {
        try {
          if (typeof renderReviewWords === 'function') renderReviewWords('waiting');
        } catch (_) { }
      } else if (normTab === 'book') {
        try {
          const curLang = window.currentLanguage || 'es';
          const curCourse = (typeof getCurrentCourseData === 'function' && getCurrentCourseData() === window.packFootballData)
            ? 'pack_football'
            : (window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || 'main');
          if (typeof renderBookCourseDropdown === 'function') renderBookCourseDropdown(curLang, curCourse);
          if (typeof renderBookWords === 'function') renderBookWords(curLang, curCourse);
          if (typeof syncBookPhoneticSetting === 'function') syncBookPhoneticSetting();
          if (typeof initBookScreenEvents === 'function') initBookScreenEvents();
          if (typeof updateHeroWrongRunButton === 'function') updateHeroWrongRunButton();
        } catch (_) { }
      } else if (normTab === 'home') {
        try {
          if (typeof updateRoadmapNodesUI === 'function') updateRoadmapNodesUI();
        } catch (_) { }
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
    } finally {
      isAppSwitchingTab = false;
    }
  }
  if (!window.switchMainTab) {
    window.switchMainTab = switchMainTab;
  }

  // 1번째 아이콘 '홈' (#tab-home)
  const tabHomeBtn = document.getElementById('tab-home');
  if (tabHomeBtn) {
    tabHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('home');
    });
  }

  // 2번째 아이콘 '단어팩' (#tab-packs, .nav-packs)
  const tabPacksBtns = document.querySelectorAll('#tab-packs, .nav-packs');
  tabPacksBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('packs');
    });
  });

  // 오답 탈출 호환용 (#tab-review -> 단어장 오답 필터로 연결)
  const tabReviewBtn = document.getElementById('tab-review');
  if (tabReviewBtn) {
    tabReviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('book');
      setTimeout(() => {
        const wrongChip = document.getElementById('book-filter-wrong-chip') || document.querySelector('.book-filter-chip[data-filter="wrong"]');
        if (wrongChip) {
          wrongChip.click();
        } else if (typeof window.applyBookFilter === 'function') {
          window.applyBookFilter('wrong');
        }
      }, 50);
    });
  }

  // 3번째 아이콘 '단어장' (#tab-book, #tab-study, .nav-book, .nav-study)
  const tabBookBtns = document.querySelectorAll('#tab-book, #tab-study, .nav-book, .nav-study');
  tabBookBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('book');
    });
  });

  // 4번째 아이콘 '내 기록' (#tab-records, #tab-stats, .nav-stats, .nav-records)
  const tabRecordsBtns = document.querySelectorAll('#tab-records, #tab-stats, .nav-stats, .nav-records');
  tabRecordsBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('records');
    });
  });

  // 오답탈출 헤더의 프로필 아이콘 클릭 시 '내 기록' 화면(#stats-screen)으로 자연스럽게 전환
  const profileBtns = document.querySelectorAll('#btn-profile');
  profileBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('records');
    });
  });

  // '내 기록' 내 '외운 단어' 카드 클릭 시 교재/단어장 '암기 완료' 필터 탭으로 이동 (STEP 1)
  const cardMasteredWords = document.getElementById('card-mastered-words');
  if (cardMasteredWords) {
    cardMasteredWords.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('book');
      setTimeout(() => {
        const memorizedChip = document.querySelector('.book-filter-chip[data-filter="memorized"]');
        if (memorizedChip) {
          memorizedChip.click();
        } else if (typeof window.applyBookFilter === 'function') {
          window.applyBookFilter('memorized');
        }
        const wordsContainer = document.getElementById('book-words-container');
        if (wordsContainer) {
          wordsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic(25);
      }
    });
  }

  // ===================================================
  // 6-C. 설정(Settings) 화면 전환
  // ===================================================
  function showSettingsScreen() {
    if (typeof window.openSettingsScreen === 'function') {
      window.openSettingsScreen();
      return;
    }
    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const roadmapScreen = document.getElementById('roadmap-screen');
    const roadmapHeader = document.getElementById('roadmap-header');
    const reviewScreen = document.getElementById('review-screen');
    const bookScreen = document.getElementById('book-screen');
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    if (roadmapScreen) roadmapScreen.classList.add('hidden');
    if (roadmapHeader) roadmapHeader.classList.add('hidden');
    if (statsScreen) statsScreen.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (bookScreen) {
      bookScreen.classList.add('hidden');
      bookScreen.style.display = 'none';
    }
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }
    if (settingsScreen) {
      settingsScreen.classList.remove('hidden');
      settingsScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (typeof window.syncSettingsUI === 'function') {
      window.syncSettingsUI();
    }
  }
  window.showSettingsScreen = showSettingsScreen;

  function hideSettingsScreen() {
    if (typeof window.closeSettingsScreen === 'function') {
      window.closeSettingsScreen();
      return;
    }
    const settingsScreen = document.getElementById('settings-screen');
    if (settingsScreen) {
      settingsScreen.classList.add('hidden');
      settingsScreen.style.display = 'none';
    }
    if (typeof switchMainTab === 'function') {
      switchMainTab('home');
    }
  }
  window.hideSettingsScreen = hideSettingsScreen;

  // ===================================================
  // 6-C-2. 명예의 전당(Hall of Fame) 화면 전환 & 인터랙션 연동
  // ===================================================
  function showHallOfFameScreen() {
    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    const roadmapScreen = document.getElementById('roadmap-screen');
    const roadmapHeader = document.getElementById('roadmap-header');
    const reviewScreen = document.getElementById('review-screen');
    const bookScreen = document.getElementById('book-screen');
    const settingsScreen = document.getElementById('settings-screen');

    if (statsScreen) {
      statsScreen.classList.add('hidden');
      statsScreen.style.display = 'none';
    }
    if (roadmapScreen) roadmapScreen.classList.add('hidden');
    if (roadmapHeader) roadmapHeader.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (bookScreen) {
      bookScreen.classList.add('hidden');
      bookScreen.style.display = 'none';
    }
    if (settingsScreen) {
      settingsScreen.classList.add('hidden');
      settingsScreen.style.display = 'none';
    }

    if (hallOfFameScreen) {
      hallOfFameScreen.classList.remove('hidden');
      hallOfFameScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    syncHallOfFameAvatar();
    initHallOfFameEvents();
  }
  window.showHallOfFameScreen = showHallOfFameScreen;

  function hideHallOfFameScreen() {
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }

    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    if (statsScreen) {
      statsScreen.classList.remove('hidden');
      statsScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (typeof switchMainTab === 'function') {
      switchMainTab('records');
    }
  }
  window.hideHallOfFameScreen = hideHallOfFameScreen;

  function initHallOfFameEvents() {
    const screen = document.getElementById('hall-of-fame-screen');
    if (!screen) return;

    // 1. 상단 좌측 뒤로가기 화살표(←) 클릭 시 #stats-screen 복귀
    const backBtn = screen.querySelector('#btn-hall-of-fame-back');
    if (backBtn && backBtn.dataset.bound !== 'true') {
      backBtn.dataset.bound = 'true';
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideHallOfFameScreen();
      });
    }

    // 2. 상단 공유 아이콘 클릭 핸들러
    const shareBtn = screen.querySelector('#btn-hall-of-fame-share');
    if (shareBtn && shareBtn.dataset.bound !== 'true') {
      shareBtn.dataset.bound = 'true';
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
          navigator.share({
            title: 'VocaDash 명예의 전당',
            text: 'VocaDash에서 달성한 멋진 배지들을 확인해보세요!',
            url: (typeof document !== 'undefined' && document.URL) || 'https://vocadash.app'
          }).catch(() => { });
        } else if (typeof window.showToast === 'function') {
          window.showToast('🏆 명예의 전당 배지 링크가 복사되었습니다!', '✨');
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    }

    // 3. 상단 우측 프로필 아이콘 클릭 시 프로필 편집 또는 내 기록으로 복귀
    const profileBtn = screen.querySelector('#btn-hall-of-fame-profile');
    if (profileBtn && profileBtn.dataset.bound !== 'true') {
      profileBtn.dataset.bound = 'true';
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.openProfileEditModal === 'function') {
          window.openProfileEditModal();
        } else if (typeof window.openProfileModal === 'function') {
          window.openProfileModal();
        } else {
          hideHallOfFameScreen();
        }
      });
    }

    // 4. 배지 분류 탭 필터 인터랙션 (전체 보기 8 / 달성 완료 2 / 도전 중 6)
    const filterBtns = screen.querySelectorAll('.badge-filter-btn');
    const cards = screen.querySelectorAll('.badge-card');

    filterBtns.forEach((btn) => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 활성 스타일(다크 네이비 배경 & 볼드 텍스트) 이동
        filterBtns.forEach((b) => {
          b.className = 'badge-filter-btn flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs hover:bg-slate-200 hover:text-slate-800 active:scale-95 transition-all cursor-pointer';
        });
        btn.className = 'badge-filter-btn flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm active:scale-95 transition-transform flex items-center gap-1 cursor-pointer';

        // 해당하는 배지 카드들만 보이도록 가벼운 필터링 처리
        const filter = btn.dataset.badgeFilter || 'all';
        cards.forEach((card) => {
          const status = card.dataset.badgeStatus;
          if (filter === 'all') {
            card.classList.remove('hidden');
          } else if (filter === 'completed') {
            if (status === 'completed') card.classList.remove('hidden');
            else card.classList.add('hidden');
          } else if (filter === 'in-progress') {
            if (status === 'in-progress') card.classList.remove('hidden');
            else card.classList.add('hidden');
          }
        });

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(15);
        }
      });
    });

    // 5. 배지 카드 클릭 마이크로 피드백
    cards.forEach((card) => {
      if (card.dataset.cardBound === 'true') return;
      card.dataset.cardBound = 'true';
      card.addEventListener('click', () => {
        const title = card.querySelector('h2')?.textContent?.trim() || '배지';
        const isCompleted = card.dataset.badgeStatus === 'completed';
        if (typeof window.showToast === 'function') {
          if (isCompleted) {
            window.showToast(`✨ '${title}' 배지를 획득하셨습니다!`, '🎖️');
          } else {
            window.showToast(`🎯 '${title}' 배지를 향해 도전 중입니다!`, '🔥');
          }
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    });
  }
  window.initHallOfFameEvents = initHallOfFameEvents;

  // ===================================================
  // 6-D. 교재·단어장 화면(#book-screen) 설정 동기화 & 인터랙션 연동
  // ===================================================
  function syncBookPhoneticSetting() {
    let showPhonetic = true;
    try {
      const raw = localStorage.getItem('vocadash_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.showPhonetic !== undefined) {
          showPhonetic = !!parsed.showPhonetic;
        }
      } else if (window.vocadashSettings && window.vocadashSettings.showPhonetic !== undefined) {
        showPhonetic = !!window.vocadashSettings.showPhonetic;
      }
    } catch (_) { }

    const bookScreen = document.getElementById('book-screen');
    if (bookScreen) {
      const phonetics = bookScreen.querySelectorAll('.book-phonetic, .phonetic-hint');
      phonetics.forEach((el) => {
        if (showPhonetic) {
          el.classList.remove('hidden');
          el.style.removeProperty('display');
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });
      const dots = bookScreen.querySelectorAll('.book-phonetic-dot');
      dots.forEach((dot) => {
        dot.style.display = showPhonetic ? '' : 'none';
      });
    }

    if (typeof window.syncBookScreenSettings === 'function') {
      window.syncBookScreenSettings();
    }
  }
  window.syncBookPhoneticSetting = syncBookPhoneticSetting;

  function applyBookFilter(filterType) {
    const bookScreen = document.getElementById('book-screen');
    if (!bookScreen) return;

    const wrongBanner = document.getElementById('book-wrong-run-banner');

    if (filterType === 'wrong') {
      if (wrongBanner) wrongBanner.classList.remove('hidden');
      renderBookWrongWords();
      return;
    }

    if (wrongBanner) wrongBanner.classList.add('hidden');

    // 오답 목록이나 오답 빈 화면이 떠 있던 상태라면 일반 코스 단어 목록 복원
    const wrongEmpty = document.getElementById('book-wrong-empty-state');
    const wrongCards = bookScreen.querySelectorAll('.book-word-card-wrong');
    if (wrongEmpty || wrongCards.length > 0) {
      const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      renderBookWords(currentLang, window.activeCourseId || window.currentBookCourseId || 'main');
    }

    const cards = bookScreen.querySelectorAll('.book-word-card');
    cards.forEach((card) => {
      const term = (card.dataset.term || '').trim();
      const isStarred = !!card.querySelector('.book-star-btn.text-amber-400, .book-star-btn.text-amber-500, button[aria-label="즐겨찾기"].text-amber-400, button[aria-label="즐겨찾기"].text-amber-500');
      // 1과 단어 중 ¡Hola!, Por favor -> 암기 완료 / Agua, Gracias -> 미암기
      const isMemorized = term === '¡Hola!' || term === 'Por favor';

      if (filterType === 'all') {
        card.classList.remove('hidden');
      } else if (filterType === 'memorized') {
        if (isMemorized) card.classList.remove('hidden');
        else card.classList.add('hidden');
      } else if (filterType === 'unmemorized') {
        if (!isMemorized) card.classList.remove('hidden');
        else card.classList.add('hidden');
      } else if (filterType === 'starred') {
        if (isStarred) card.classList.remove('hidden');
        else card.classList.add('hidden');
      }
    });

    if (filterType === 'alpha' || filterType === 'alphabet') {
      sortBookWords();
    }
  }
  window.applyBookFilter = applyBookFilter;

  function sortBookWords(itemsOrContainer, mode = 'alphabet') {
    if (Array.isArray(itemsOrContainer)) {
      const arr = [...itemsOrContainer];
      if (mode === 'alpha' || mode === 'alphabet') {
        arr.sort((a, b) => {
          const strA = getSortableWord(typeof a === 'string' ? a : (a.word || a.term || ''));
          const strB = getSortableWord(typeof b === 'string' ? b : (b.word || b.term || ''));
          return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
        });
      }
      return arr;
    }

    // DOM 환경에서 호출 시 #book-words-container 내부 단어 카드들을 알파벳순으로 정렬
    const bookWordsContainer = document.getElementById('book-words-container');
    if (!bookWordsContainer) return [];

    const cards = Array.from(bookWordsContainer.querySelectorAll('.book-word-card'));
    if (cards.length === 0) return [];

    cards.sort((a, b) => {
      const termA = a.dataset.term || a.querySelector('span.text-xl')?.textContent?.trim() || '';
      const termB = b.dataset.term || b.querySelector('span.text-xl')?.textContent?.trim() || '';
      const strA = getSortableWord(termA);
      const strB = getSortableWord(termB);
      return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
    });

    // 1과 섹션 헤더 뒤에 정렬된 순서대로 재배치
    const header = bookWordsContainer.firstElementChild;
    if (header) {
      let anchor = header;
      cards.forEach((card) => {
        anchor.after(card);
        anchor = card;
      });
    } else {
      cards.forEach((card) => bookWordsContainer.appendChild(card));
    }

    return cards;
  }
  window.sortBookWords = sortBookWords;

  const BOOK_COURSE_PRESETS = {
    es: [
      { id: 'main', icon: '🇪🇸', title: '스페인어 정규 코스' },
      { id: 'pack_football', icon: '⚽', title: '스페인 축구 실전팩' },
      { id: 'dele', icon: '🎓', title: 'DELE 준비과정' },
      { id: 'business', icon: '💼', title: '비즈니스 스페인어' }
    ],
    en: [
      { id: 'main', icon: '🇺🇸', title: '영어 정규 코스' },
      { id: 'pack_football', icon: '⚽', title: '축구 실전팩 (DLC)' },
      { id: 'toeic', icon: '🎓', title: '토익/오픽 대비' },
      { id: 'business', icon: '💼', title: '비즈니스 영어' }
    ]
  };
  window.BOOK_COURSE_PRESETS = BOOK_COURSE_PRESETS;
  window.currentBookCourseId = window.activeCourseId || window.currentCourseId || 'main';

  function renderBookCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), selectedCourseId) {
    const currentLang = lang === 'en' ? 'en' : 'es';
    const presets = BOOK_COURSE_PRESETS[currentLang] || BOOK_COURSE_PRESETS.es;
    const storedCourse = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null);
    const activeId = (selectedCourseId && selectedCourseId !== 'basic') ? selectedCourseId : (storedCourse || window.activeCourseId || window.currentBookCourseId || 'main');
    const currentSelected = presets.find((p) => p.id === activeId) || presets[0];
    window.currentBookCourseId = currentSelected.id;
    window.activeCourseId = currentSelected.id;
    try {
      localStorage.setItem('vocadash_active_course', currentSelected.id);
    } catch (_) { }

    // 상단 뱃지 텍스트/아이콘 및 학습 진도 배너 즉시 갱신
    if (typeof updateBookCourseBadge === 'function') {
      updateBookCourseBadge(currentLang, currentSelected.id);
    }
    if (typeof updateBookProgressHero === 'function') {
      updateBookProgressHero();
    }

    const menu = document.getElementById('book-course-dropdown-menu');
    if (!menu) return;

    menu.innerHTML = presets.map((course) => {
      const isSelected = course.id === currentSelected.id;
      return `
        <button type="button" data-course-id="${escapeHTML(course.id)}" class="book-course-item flex items-center justify-between p-2.5 rounded-xl ${isSelected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold' : 'border border-transparent text-slate-700 font-medium'} text-xs cursor-pointer transition-all hover:bg-slate-100" role="menuitem">
          <div class="flex items-center gap-2 pointer-events-none">
            <span class="text-sm">${escapeHTML(course.icon)}</span>
            <span class="book-course-item-title">${escapeHTML(course.title)}</span>
          </div>
          <span class="material-symbols-outlined text-[16px] text-emerald-600 font-bold book-course-check ${isSelected ? '' : 'hidden'}">check</span>
        </button>
      `;
    }).join('');
  }
  window.renderBookCourseDropdown = renderBookCourseDropdown;

  function closeBookCourseDropdown() {
    const menu = document.getElementById('book-course-dropdown-menu');
    const btn = document.getElementById('book-course-btn') || document.querySelector('.book-course-selector');
    const chevron = document.getElementById('book-course-chevron');
    if (menu) menu.classList.add('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
  window.closeBookCourseDropdown = closeBookCourseDropdown;

  function initBookScreenEvents() {
    const bookScreen = document.getElementById('book-screen');
    if (!bookScreen) return;

    // 1. 단어 옆 스피커 아이콘(🔊) 클릭 시 safePlayTTS() 연동
    const audioBtns = bookScreen.querySelectorAll('.book-audio-btn, button[aria-label="발음 듣기"], .sound-btn');
    audioBtns.forEach((btn) => {
      if (btn.dataset.audioBound === 'true') return;
      btn.dataset.audioBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.book-word-card') || btn.closest('article');
        const term = (card && (card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim())) || '¡Hola!';

        // Micro-interaction bounce
        btn.classList.add('scale-125', 'text-emerald-500');
        setTimeout(() => {
          btn.classList.remove('scale-125', 'text-emerald-500');
        }, 350);

        // TTS 발음 재생 (es-ES 원어민 엔진 호출 & 버튼 UI 상태 전달)
        if (typeof window.playSpanishTTS === 'function' && (!window.currentLanguage || window.currentLanguage === 'es')) {
          window.playSpanishTTS(term, btn);
        } else if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, window.currentActiveCourse || 'es-ES', btn);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, window.currentActiveCourse || 'es-ES', btn);
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(30);
        }
      });
    });

    // 단어 카드 본문 터치 시에도 자연스러운 TTS 발음 재생 지원
    const wordCards = bookScreen.querySelectorAll('.book-word-card');
    wordCards.forEach((card) => {
      if (card.dataset.cardClickBound === 'true') return;
      card.dataset.cardClickBound = 'true';
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const term = card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim() || '¡Hola!';
        const speaker = card.querySelector('.book-audio-btn, button[aria-label="발음 듣기"]');
        if (typeof window.playSpanishTTS === 'function' && (!window.currentLanguage || window.currentLanguage === 'es')) {
          window.playSpanishTTS(term, speaker);
        } else if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, window.currentActiveCourse || 'es-ES', speaker);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, window.currentActiveCourse || 'es-ES', speaker);
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    });

    // 2. 즐겨찾기 별(★) 토글
    const starBtns = bookScreen.querySelectorAll('.book-star-btn, button[aria-label="즐겨찾기"], .star-btn');
    starBtns.forEach((btn) => {
      if (btn.dataset.starBound === 'true') return;
      btn.dataset.starBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const icon = btn.querySelector('.material-symbols-outlined');
        const isStarred = btn.classList.contains('text-amber-400') || btn.classList.contains('text-amber-500');

        if (isStarred) {
          btn.classList.remove('text-amber-400', 'text-amber-500');
          btn.classList.add('text-slate-300');
          if (icon) icon.style.fontVariationSettings = "'FILL' 0";
          if (typeof window.showToast === 'function') {
            window.showToast('즐겨찾기에서 제거되었습니다', '☆');
          }
        } else {
          btn.classList.remove('text-slate-300');
          btn.classList.add('text-amber-400');
          if (icon) icon.style.fontVariationSettings = "'FILL' 1";
          if (typeof window.showToast === 'function') {
            window.showToast('즐겨찾기에 추가되었습니다 ⭐', '★');
          }
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(25);
        }
      });
    });

    // 3. 필터 칩 토글
    const filterChips = bookScreen.querySelectorAll('.book-filter-chip, .filter-chip');
    filterChips.forEach((chip) => {
      if (chip.dataset.filterBound === 'true') return;
      chip.dataset.filterBound = 'true';
      chip.addEventListener('click', () => {
        filterChips.forEach((c) => {
          c.className = 'book-filter-chip flex items-center gap-1 flex-shrink-0 px-3.5 py-1.5 rounded-full bg-white text-slate-600 font-medium border border-slate-100 text-xs shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer';
          const dot = c.querySelector('.animate-pulse');
          if (dot) dot.remove();
        });

        chip.className = 'book-filter-chip flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 text-xs shadow-sm active:scale-95 transition-all cursor-pointer';
        if (!chip.querySelector('.animate-pulse')) {
          const pulseDot = document.createElement('span');
          pulseDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
          chip.prepend(pulseDot);
        }

        // 검색창에 검색어가 남아있다면 초기화
        const searchInput = bookScreen.querySelector('#book-search-input, input[type="search"]');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          if (typeof window.applyBookSearchState === 'function') {
            window.applyBookSearchState('');
          }
        }

        const filterType = chip.dataset.filter || 'all';
        applyBookFilter(filterType);

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(15);
        }
      });
    });

    // 4. 검색창 실시간 필터링 및 키보드 내림/레이아웃 즉시 표시 UX
    const searchInput = bookScreen.querySelector('#book-search-input, input[type="search"]');
    const searchBtn = bookScreen.querySelector('#book-search-btn');
    const searchClearBtn = bookScreen.querySelector('#book-search-clear-btn');
    const progressHero = bookScreen.querySelector('#book-progress-hero');
    const filterChipsSection = bookScreen.querySelector('#book-filter-chips');
    const wrongBanner = bookScreen.querySelector('#book-wrong-run-banner');
    const ch1Header = bookScreen.querySelector('#book-chapter-header');
    const ch2Toggle = bookScreen.querySelector('#book-chapter-2-toggle');
    const ch3Locked = bookScreen.querySelector('#book-chapter-3-locked');

    function applyBookSearchState(queryStr) {
      const query = (queryStr || '').trim().toLowerCase();
      const isSearching = query.length > 0;

      // 1) X 클리어 버튼 토글
      if (searchClearBtn) {
        if (isSearching) {
          searchClearBtn.classList.remove('hidden');
        } else {
          searchClearBtn.classList.add('hidden');
        }
      }

      // 2) 검색 중에는 '학습 진도' 배너와 '1과, 2과, 3과' 등의 챕터 아코디언 헤더를 임시 숨김(display: none)
      //    일치하는 단어 카드 목록이 검색창 바로 아래에 곧바로 이어져 스크롤 없이 한눈에 보이도록 처리
      if (isSearching) {
        if (progressHero) progressHero.style.display = 'none';
        if (filterChipsSection) filterChipsSection.style.display = 'none';
        if (wrongBanner) wrongBanner.style.display = 'none';
        if (ch1Header) ch1Header.style.display = 'none';
        if (ch2Toggle) ch2Toggle.style.display = 'none';
        if (ch3Locked) ch3Locked.style.display = 'none';
        bookScreen.querySelectorAll('.book-category-header').forEach(el => el.style.display = 'none');
      } else {
        if (progressHero) progressHero.style.display = '';
        if (filterChipsSection) filterChipsSection.style.display = '';
        if (wrongBanner) {
          const activeWrongChip = bookScreen.querySelector('#book-filter-wrong-chip.bg-emerald-50');
          wrongBanner.style.display = activeWrongChip ? '' : 'none';
        }
        const isFootball = (window.activeCourseId === 'pack_football' || (typeof getCurrentCourseData === 'function' && getCurrentCourseData() === window.packFootballData));
        if (ch1Header) { ch1Header.style.display = isFootball ? 'none' : ''; if (isFootball) ch1Header.classList.add('hidden'); else ch1Header.classList.remove('hidden'); }
        if (ch2Toggle) { ch2Toggle.style.display = isFootball ? 'none' : ''; if (isFootball) ch2Toggle.classList.add('hidden'); else ch2Toggle.classList.remove('hidden'); }
        if (ch3Locked) { ch3Locked.style.display = isFootball ? 'none' : ''; if (isFootball) ch3Locked.classList.add('hidden'); else ch3Locked.classList.remove('hidden'); }
        bookScreen.querySelectorAll('.book-category-header').forEach(el => el.style.display = '');
      }

      // 3) 카드 필터링
      const cleanQuery = typeof getSortableWord === 'function' ? getSortableWord(query) : query;
      const cards = bookScreen.querySelectorAll('.book-word-card');
      cards.forEach((card) => {
        if (!isSearching) {
          card.classList.remove('hidden');
          return;
        }
        const rawTerm = (card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim() || '');
        const term = rawTerm.toLowerCase();
        const cleanTerm = typeof getSortableWord === 'function' ? getSortableWord(rawTerm) : rawTerm;
        const meaning = (card.dataset.meaning || card.querySelector('.text-slate-700')?.textContent?.trim() || '').toLowerCase();
        const text = (card.textContent || '').toLowerCase();

        if (term.includes(query) || meaning.includes(query) || text.includes(query) || (cleanQuery && cleanTerm.includes(cleanQuery))) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }
    window.applyBookSearchState = applyBookSearchState;

    if (searchInput && searchInput.dataset.searchBound !== 'true') {
      searchInput.dataset.searchBound = 'true';

      searchInput.addEventListener('input', (e) => {
        applyBookSearchState(e.target.value);
      });

      // 엔터(Enter) 키 입력 시 스마트폰 가상 키보드 즉시 내림 (input.blur())
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchInput.blur();
        }
      });
    }

    if (searchBtn && searchBtn.dataset.bound !== 'true') {
      searchBtn.dataset.bound = 'true';
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (searchInput) searchInput.blur();
      });
    }

    if (searchClearBtn && searchClearBtn.dataset.bound !== 'true') {
      searchClearBtn.dataset.bound = 'true';
      searchClearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (searchInput) {
          searchInput.value = '';
          applyBookSearchState('');
          searchInput.blur();
        }
      });
    }

    // 5. 2과 섹션 클릭 피드백
    if (ch2Toggle && ch2Toggle.dataset.toggleBound !== 'true') {
      ch2Toggle.dataset.toggleBound = 'true';
      ch2Toggle.addEventListener('click', () => {
        if (typeof window.showToast === 'function') {
          window.showToast('📖 2과 입국 심사는 현재 학습 진행 중입니다!', '✈️');
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    }

    // 6. 상단 우측 코스 안내 뱃지 갱신
    renderBookCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es');

    const bookCourseBtn = bookScreen.querySelector('#book-course-btn, .book-course-selector');
    const bookCourseMenu = bookScreen.querySelector('#book-course-dropdown-menu');
    const bookCourseChevron = bookScreen.querySelector('#book-course-chevron');

    if (bookCourseBtn && bookCourseMenu && bookCourseBtn.dataset.bound !== 'true') {
      bookCourseBtn.dataset.bound = 'true';
      bookCourseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isHidden = bookCourseMenu.classList.contains('hidden');
        if (isHidden) {
          renderBookCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es');
          bookCourseMenu.classList.remove('hidden');
          bookCourseBtn.setAttribute('aria-expanded', 'true');
          if (bookCourseChevron) bookCourseChevron.style.transform = 'rotate(180deg)';
        } else {
          closeBookCourseDropdown();
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(15);
        }
      });

      bookCourseMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemBtn = e.target.closest('.book-course-item') || e.target.closest('button[data-course-id]');
        if (!itemBtn) return;

        const courseId = itemBtn.dataset.courseId;
        closeBookCourseDropdown();

        // switchCourse() 호출로 단어장 및 메인 로드맵, 진행도 데이터 일원화 즉시 전환
        if (typeof window.switchCourse === 'function') {
          window.switchCourse(courseId);
        } else {
          window.activeCourseId = courseId;
          window.currentBookCourseId = courseId;
          try {
            localStorage.setItem('vocadash_active_course', courseId);
          } catch (_) { }
          const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
          renderBookCourseDropdown(currentLang, courseId);
          renderBookWords(currentLang, courseId);
          renderRoadmap();
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(25);
        }
      });
    }

    // 7. 오답 목록 최상단 [⚡ 약점 극복 런 달리기 🏃] 버튼 바인딩
    const wrongRunBanner = bookScreen.querySelector('#book-wrong-run-banner');
    const wrongRunBtn = bookScreen.querySelector('#btn-book-start-wrong-run');
    const startWrongRunHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 💡 단어장 복습 모드 설정 (하트 충전 플래그 OFF)
      window.isHeartRechargeRun = false;
      window.pendingHeartReward = 0;

      if (typeof window.startRoadmapReviewSpeedrun === 'function') {
        window.startRoadmapReviewSpeedrun();
      } else if (typeof window.startWrongRun === 'function') {
        window.startWrongRun();
      }
    };
    if (wrongRunBanner && wrongRunBanner.dataset.runBound !== 'true') {
      wrongRunBanner.dataset.runBound = 'true';
      wrongRunBanner.addEventListener('click', startWrongRunHandler);
    }
    if (wrongRunBtn && wrongRunBtn.dataset.runBound !== 'true') {
      wrongRunBtn.dataset.runBound = 'true';
      wrongRunBtn.addEventListener('click', startWrongRunHandler);
    }

    // 7-B. 중간 배너 내 [⚡ 오답 탈출 런] 액션 버튼 바인딩
    const heroWrongRunBtn = bookScreen.querySelector('#btn-hero-wrong-run');
    if (heroWrongRunBtn && heroWrongRunBtn.dataset.runBound !== 'true') {
      heroWrongRunBtn.dataset.runBound = 'true';
      heroWrongRunBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (heroWrongRunBtn.disabled) return;

        // 💡 단어장 복습 모드 설정
        window.isHeartRechargeRun = false;
        window.pendingHeartReward = 0;

        if (typeof window.launchGame === 'function') {
          window.launchGame('wrong_answer');
        } else if (typeof window.startRoadmapReviewSpeedrun === 'function') {
          window.startRoadmapReviewSpeedrun();
        }
      });
    }
    updateHeroWrongRunButton();
  }
  window.initBookScreenEvents = initBookScreenEvents;


  // 메뉴 바깥 영역 클릭 시 열려 있는 #book-course-dropdown-menu 자동 닫기 (Click Outside)
  document.addEventListener('click', (e) => {
    const bookMenu = document.getElementById('book-course-dropdown-menu');
    const bookBtn = document.getElementById('book-course-btn') || document.querySelector('.book-course-selector');
    if (!bookMenu || bookMenu.classList.contains('hidden')) return;

    if (!bookMenu.contains(e.target) && (!bookBtn || !bookBtn.contains(e.target))) {
      closeBookCourseDropdown();
    }
  });

  // 1) 설정 화면 진입: '내 기록' 우측 상단 (#btn-open-settings, #btn-stats-settings), 프로필 모달 내 (#btn-profile-settings), 오답탈출 (#btn-review-settings)
  const openSettingsBtns = document.querySelectorAll('#btn-main-settings, #btn-review-settings, #btn-open-settings, #btn-stats-settings, #btn-profile-settings, .btn-open-settings');
  openSettingsBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
      showSettingsScreen();
    });
  });

  // 2) 설정 화면 뒤로가기: 좌측 상단 뒤로가기 버튼(←) 클릭 시 #settings-screen 숨김 -> #stats-screen 복귀
  const btnSettingsBack = document.getElementById('btn-settings-back');
  if (btnSettingsBack) {
    btnSettingsBack.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideSettingsScreen();
    });
  }

  // 2-B) 명예의 전당 진입: '내 기록' 화면 내의 '명예의 전당 (배지 2/8)' 우측 [전체보기 >] 링크 (#btn-view-all-badges)
  const viewBadgesBtns = document.querySelectorAll('#btn-view-all-badges, .btn-view-all-badges');
  viewBadgesBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showHallOfFameScreen();
    });
  });

  // 3) 프로필 편집 진입:
  // - '내 기록' 상단의 프로필 카드 영역 (#user-profile-card 또는 프로필 아바타/닉네임 영역)
  // - 설정 화면 상단 프로필 카드의 [수정 >] 버튼 (#btn-edit-profile-header, #btn-settings-edit-profile-quick)
  const profileEditTriggers = document.querySelectorAll(
    '#user-profile-card, #btn-edit-profile-header, #btn-settings-edit-profile-quick'
  );
  profileEditTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.openProfileModal();
    });
  });

  // 4) 설정 화면 내부 스위치 토글 기능
  // (js/settings.js의 toggleSwitch 및 localStorage 연동 함수가 존재할 경우 우선 위임)
  if (!window.toggleSwitch || typeof window.applySetting !== 'function') {
    window.toggleSwitch = function (button) {
      if (!button) return;
      const key = button.dataset.settingKey;
      if (window.vocadashSettings && key) {
        window.vocadashSettings[key] = !window.vocadashSettings[key];
        try { localStorage.setItem('vocadash_settings', JSON.stringify(window.vocadashSettings)); } catch (_) { }
      }
      const isChecked = button.getAttribute('aria-checked') === 'true';
      const thumb = button.querySelector('span');

      if (isChecked) {
        button.setAttribute('aria-checked', 'false');
        button.classList.remove('bg-primary-container');
        button.classList.add('bg-surface-variant');
        if (thumb) {
          thumb.classList.remove('translate-x-[22px]');
          thumb.classList.add('translate-x-0');
        }
      } else {
        button.setAttribute('aria-checked', 'true');
        button.classList.add('bg-primary-container');
        button.classList.remove('bg-surface-variant');
        if (thumb) {
          thumb.classList.remove('translate-x-0');
          thumb.classList.add('translate-x-[22px]');
        }
      }
    };
  }

  document.querySelectorAll('.settings-toggle-btn, .toggle-btn').forEach((btn) => {
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleSwitch === 'function') {
        window.toggleSwitch(this);
      }
    };
  });

  // 5) 설정 화면 부가 기능 (캐시 정리, 학습 언어 변경, 로그아웃 등)
  window.clearCacheAlert = function (btn) {
    const target = btn || document.getElementById('btn-settings-clear-cache');
    const desc = document.getElementById('settings-cache-desc') || (target ? target.querySelector('.text-on-surface-variant') : null);
    if (desc) {
      desc.textContent = '캐시가 성공적으로 비워졌습니다 (0 MB)';
      desc.classList.remove('text-on-surface-variant');
      desc.classList.add('text-primary', 'font-bold');
    }
    if (window.showToast) {
      window.showToast('🧹 임시 음성 캐시가 정리되었습니다 (0 MB)', '✨');
    }
  };

  const clearCacheBtn = document.getElementById('btn-settings-clear-cache');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.clearCacheAlert(this);
    });
  }

  const settingsLangRow = document.getElementById('settings-lang-change-row');
  if (settingsLangRow) {
    settingsLangRow.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openLanguageModal === 'function') {
        window.openLanguageModal();
      }
    });
  }

  // 인증 액션(#btn-auth-action) 및 로그인 화면 인터랙션은 js/navigation.js에서 전담 관리


  const settingsContactBtn = document.getElementById('btn-settings-contact');
  if (settingsContactBtn) {
    settingsContactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showToast) {
        window.showToast('💬 고객센터: support@vocadash.app', '📩');
      }
    });
  }

  const settingsTermsBtn = document.getElementById('btn-settings-terms');
  if (settingsTermsBtn) {
    settingsTermsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showToast) {
        window.showToast('📄 이용약관 및 개인정보처리방침 (v1.0.0)', '📋');
      }
    });
  }

  // 프로필 편집 및 고양이 아바타 연동 로직
  const VALID_AVATAR_FILES = [
    'profile-spanish.webp',
    'profile-english.webp',
    'profile-artist.webp',
    'profile-explorer.webp'
  ];

  function resolveAvatarFile(val) {
    if (!val) return 'profile-spanish.webp';
    const clean = String(val).split('?')[0];
    const filename = clean.split('/').pop();
    if (VALID_AVATAR_FILES.includes(filename)) return filename;
    if (clean.includes('english') || clean.includes('sunglass')) return 'profile-english.webp';
    if (clean.includes('artist') || clean.includes('scholar')) return 'profile-artist.webp';
    if (clean.includes('explorer') || clean.includes('relax')) return 'profile-explorer.webp';
    return 'profile-spanish.webp';
  }

  function resolveAvatarSrc(val) {
    const file = resolveAvatarFile(val);
    return `assets/profiles/${file}?v=68`;
  }

  let selectedAvatarFile = 'profile-spanish.webp';
  try {
    const savedProfile = localStorage.getItem('vocadash_profile');
    if (savedProfile) {
      selectedAvatarFile = resolveAvatarFile(savedProfile);
    } else {
      const savedAvatar = localStorage.getItem('vocadash_profile_avatar');
      if (savedAvatar && !savedAvatar.includes('lh3.googleusercontent.com/aida/')) {
        selectedAvatarFile = resolveAvatarFile(savedAvatar);
      } else {
        const userProfileStr = localStorage.getItem('userProfile');
        if (userProfileStr) {
          const parsed = JSON.parse(userProfileStr);
          if (parsed && (parsed.profile || parsed.avatar)) {
            selectedAvatarFile = resolveAvatarFile(parsed.profile || parsed.avatar);
          }
        }
      }
    }
  } catch (_) { }

  let selectedAvatarSrc = resolveAvatarSrc(selectedAvatarFile);

  let selectedTitle = '초급 마스터';
  try {
    const userProfileStr = localStorage.getItem('userProfile');
    if (userProfileStr) {
      const parsed = JSON.parse(userProfileStr);
      if (parsed && parsed.title) selectedTitle = parsed.title;
      if (parsed && parsed.nickname) {
        const statsNickname = document.getElementById('stats-nickname');
        if (statsNickname) statsNickname.textContent = parsed.nickname;
        const nicknameInput = document.getElementById('nickname-input');
        if (nicknameInput) nicknameInput.value = parsed.nickname;
      }
    }
  } catch (_) { }
  try {
    const savedTitle = localStorage.getItem('vocadash_profile_title');
    if (savedTitle) selectedTitle = savedTitle;
    const savedNick = localStorage.getItem('vocadash_profile_nickname');
    if (savedNick) {
      const statsNickname = document.getElementById('stats-nickname');
      if (statsNickname) statsNickname.textContent = savedNick;
      const nicknameInput = document.getElementById('nickname-input');
      if (nicknameInput) nicknameInput.value = savedNick;
    }
    const statsTitleBadge = document.getElementById('stats-title-badge');
    if (statsTitleBadge) statsTitleBadge.textContent = selectedTitle;
  } catch (_) { }

  function applyProfileAvatar(srcOrFile) {
    if (!srcOrFile) return;
    const file = resolveAvatarFile(srcOrFile);
    const src = resolveAvatarSrc(file);
    selectedAvatarFile = file;
    selectedAvatarSrc = src;

    // 1. 헤더 아바타
    const headerMascotImg = document.getElementById('header-mascot-img');
    if (headerMascotImg) {
      headerMascotImg.src = src;
      headerMascotImg.className = 'w-full h-full object-cover rounded-full';
    }

    // 1-B. 로드맵 최신 활성 노드 바운스 고양이 마커
    const catMarkerImg = document.getElementById('cat-marker-img');
    if (catMarkerImg) {
      catMarkerImg.src = src;
    }

    // 2. 모달 내 메인 프리뷰
    const currentAvatarImg = document.getElementById('current-avatar-img');
    if (currentAvatarImg) {
      currentAvatarImg.src = src;
      currentAvatarImg.className = 'w-full h-full object-cover rounded-full transition-transform duration-200';
    }

    // 3. 통계 화면 아바타
    const statsAvatarImg = document.getElementById('stats-avatar-img');
    if (statsAvatarImg) statsAvatarImg.src = src;

    // 4. 설정 화면 배너 아바타
    const settingsAvatarImg = document.getElementById('settings-streak-avatar-img') || document.getElementById('settings-avatar-img');
    if (settingsAvatarImg) settingsAvatarImg.src = src;

    const settingsStreakBanner = document.getElementById('settings-streak-banner');
    if (settingsStreakBanner) {
      const bannerImg = settingsStreakBanner.querySelector('img');
      if (bannerImg) bannerImg.src = src;
    }

    // 5. 명예의 전당 아바타 동기화
    const hallUserAvatar = document.getElementById('hall-user-avatar');
    if (hallUserAvatar) hallUserAvatar.src = src;
    const hallHeaderAvatar = document.getElementById('hall-header-avatar');
    if (hallHeaderAvatar) hallHeaderAvatar.src = src;

    // 6. 설정 화면 빠른 선택 그리드 UI 동기화
    document.querySelectorAll('.quick-avatar-btn').forEach((btn) => {
      const btnFile = btn.dataset.avatarFile;
      const isSelected = (btnFile === file);
      const ring = btn.querySelector('.quick-avatar-ring');
      const chk = btn.querySelector('.quick-avatar-check');
      const lbl = btn.querySelector('.quick-avatar-label');
      if (ring) {
        ring.className = isSelected
          ? 'quick-avatar-ring relative w-12 h-12 rounded-full p-0.5 border-2 border-primary bg-white shadow-xs transition-all ring-2 ring-primary/20'
          : 'quick-avatar-ring relative w-12 h-12 rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
      }
      if (chk) chk.classList.toggle('hidden', !isSelected);
      if (lbl) {
        lbl.className = isSelected
          ? 'quick-avatar-label text-[11px] font-bold text-primary mt-1.5 truncate max-w-[64px]'
          : 'quick-avatar-label text-[11px] font-medium text-slate-500 mt-1.5 truncate max-w-[64px]';
      }
    });

    // 7. 모달 내 아바타 선택 그리드 UI 동기화
    document.querySelectorAll('.avatar-option').forEach((opt) => {
      const optFile = resolveAvatarFile(opt.dataset.avatarFile || opt.dataset.avatarSrc);
      const isSelected = (optFile === file);
      const ring = opt.querySelector('.avatar-ring') || opt.querySelector('div');
      const chk = opt.querySelector('.avatar-check');
      const lbl = opt.querySelector('.avatar-label');
      if (ring) {
        ring.className = isSelected
          ? 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border-2 border-[#22c55e] bg-white transition-all shadow-xs ring-2 ring-emerald-400/20'
          : 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
      }
      if (chk) chk.classList.toggle('hidden', !isSelected);
      if (lbl) {
        lbl.className = isSelected
          ? 'avatar-label text-xs font-bold text-[#22c55e] mt-1.5 truncate max-w-[68px]'
          : 'avatar-label text-xs font-medium text-slate-500 mt-1.5 truncate max-w-[68px]';
      }
    });
  }

  function syncHallOfFameAvatar() {
    let avatarSrc = null;
    try {
      const savedProfile = localStorage.getItem('vocadash_profile');
      if (savedProfile) {
        avatarSrc = resolveAvatarSrc(savedProfile);
      }
    } catch (_) { }
    if (!avatarSrc) {
      try {
        const saved = localStorage.getItem('vocadash_profile_avatar');
        if (saved && !saved.includes('lh3.googleusercontent.com/aida/')) {
          avatarSrc = resolveAvatarSrc(saved);
        }
      } catch (_) { }
    }
    if (!avatarSrc && typeof selectedAvatarSrc !== 'undefined' && selectedAvatarSrc) {
      avatarSrc = selectedAvatarSrc;
    }
    if (avatarSrc) {
      const hallUserAvatar = document.getElementById('hall-user-avatar');
      if (hallUserAvatar) hallUserAvatar.src = avatarSrc;
      const hallHeaderAvatar = document.getElementById('hall-header-avatar');
      if (hallHeaderAvatar) hallHeaderAvatar.src = avatarSrc;
    }
  }
  window.syncHallOfFameAvatar = syncHallOfFameAvatar;
  window.applyProfileAvatar = applyProfileAvatar;

  // 초기 렌더링 시 아바타 및 UI 동기화
  applyProfileAvatar(selectedAvatarFile);

  // 상단 헤더 프로필 버튼 클릭 이벤트 (프로필 선택 모달 열기)
  const headerProfileBtn = document.getElementById('btn-header-profile');
  if (headerProfileBtn) {
    headerProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openProfileModal === 'function') {
        window.openProfileModal();
      }
    });
  }

  // 설정 화면 스트릭 배너 아바타 클릭 이벤트
  const settingsStreakAvatarContainer = document.getElementById('settings-streak-avatar-container');
  if (settingsStreakAvatarContainer) {
    settingsStreakAvatarContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openProfileModal === 'function') {
        window.openProfileModal();
      }
    });
  }

  // 설정 화면 내 4종 고양이 즉시 변경 버튼 이벤트 바인딩
  document.querySelectorAll('.quick-avatar-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetFile = this.dataset.avatarFile || 'profile-spanish.webp';
      const targetName = this.dataset.avatarName || '프로필 고양이';
      selectedAvatarFile = targetFile;
      selectedAvatarSrc = resolveAvatarSrc(targetFile);

      try {
        localStorage.setItem('vocadash_profile', selectedAvatarFile);
        localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
        const userProfileStr = localStorage.getItem('userProfile');
        const parsed = userProfileStr ? JSON.parse(userProfileStr) : {};
        parsed.profile = selectedAvatarFile;
        parsed.avatar = selectedAvatarSrc;
        localStorage.setItem('userProfile', JSON.stringify(parsed));
      } catch (_) { }

      applyProfileAvatar(selectedAvatarFile);
      syncHallOfFameAvatar();
    });
  });

  // 프로필 모달 내 아바타 선택 상태 및 클릭 이벤트 바인딩
  document.querySelectorAll('.avatar-option').forEach((opt) => {
    opt.addEventListener('click', function () {
      const targetFile = this.dataset.avatarFile || resolveAvatarFile(this.dataset.avatarSrc);
      selectedAvatarFile = targetFile;
      selectedAvatarSrc = resolveAvatarSrc(targetFile);

      document.querySelectorAll('.avatar-option').forEach((o) => {
        const oFile = o.dataset.avatarFile || resolveAvatarFile(o.dataset.avatarSrc);
        const isCur = (oFile === targetFile);
        const oRing = o.querySelector('.avatar-ring') || o.querySelector('div');
        const oChk = o.querySelector('.avatar-check');
        const oLbl = o.querySelector('.avatar-label');
        if (oRing) {
          oRing.className = isCur
            ? 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border-2 border-[#22c55e] bg-white transition-all shadow-xs ring-2 ring-emerald-400/20'
            : 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
        }
        if (oChk) oChk.classList.toggle('hidden', !isCur);
        if (oLbl) {
          oLbl.className = isCur
            ? 'avatar-label text-xs font-bold text-[#22c55e] mt-1.5 truncate max-w-[68px]'
            : 'avatar-label text-xs font-medium text-slate-500 mt-1.5 truncate max-w-[68px]';
        }
      });

      const currentAvatarImg = document.getElementById('current-avatar-img');
      if (currentAvatarImg) currentAvatarImg.src = selectedAvatarSrc;

      // 즉시 상단 헤더 및 통계 아바타 동기화 & 로컬스토리지 즉시 영구 저장
      if (typeof applyProfileAvatar === 'function') {
        applyProfileAvatar(targetFile);
      }
      try {
        localStorage.setItem('vocadash_profile', targetFile);
        localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
      } catch (_) { }
    });
  });

  document.querySelectorAll('.title-pill').forEach((pill) => {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.title-pill').forEach((p) => {
        p.className = 'title-pill bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-sm py-2.5 px-3 rounded-xl border-b-4 border-slate-200 flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-1 transition-all cursor-pointer w-full';
        const check = p.querySelector('.material-symbols-outlined');
        if (check) check.classList.add('hidden');
      });

      this.className = 'title-pill bg-[#22c55e] text-white font-bold text-sm py-2.5 px-3 rounded-xl border-b-4 border-[#16a34a] flex items-center justify-center gap-1.5 shadow-sm active:border-b-0 active:translate-y-1 transition-all cursor-pointer w-full';
      const check = this.querySelector('.material-symbols-outlined');
      if (check) check.classList.remove('hidden');

      selectedTitle = this.dataset.title || selectedTitle;
    });
  });

  const saveProfileBtn = document.getElementById('save-profile-btn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const nicknameInput = document.getElementById('nickname-input');
      const newNickname = nicknameInput ? nicknameInput.value.trim() : '스페인어 질주러';

      const statsNickname = document.getElementById('stats-nickname');
      if (statsNickname && newNickname) statsNickname.textContent = newNickname;

      const statsTitleBadge = document.getElementById('stats-title-badge');
      if (statsTitleBadge) statsTitleBadge.textContent = selectedTitle;

      applyProfileAvatar(selectedAvatarFile);

      const settingsStreakBanner = document.getElementById('settings-streak-banner');
      if (settingsStreakBanner) {
        const bannerNick = document.getElementById('settings-streak-nickname') || settingsStreakBanner.querySelector('.font-headline-sm');
        if (bannerNick && newNickname) bannerNick.textContent = newNickname;
        const bannerTitle = document.getElementById('settings-streak-level') || settingsStreakBanner.querySelector('.font-body-sm');
        if (bannerTitle && selectedTitle) bannerTitle.textContent = `레벨 12 · ${selectedTitle}`;
      }

      try {
        localStorage.setItem('vocadash_profile', selectedAvatarFile);
        localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
        localStorage.setItem('vocadash_profile_nickname', newNickname);
        localStorage.setItem('vocadash_profile_title', selectedTitle);
        localStorage.setItem('userProfile', JSON.stringify({
          profile: selectedAvatarFile,
          avatar: selectedAvatarSrc,
          nickname: newNickname,
          title: selectedTitle
        }));
      } catch (_) { }
      syncHallOfFameAvatar();

      window.closeProfileModal();
    });
  }

  // 필터 버튼 이벤트
  const filterWaitingBtn = document.getElementById('review-filter-waiting-btn') || document.getElementById('tab-review-pending');
  const filterEscapedBtn = document.getElementById('review-filter-escaped-btn') || document.getElementById('tab-review-escaped');

  function updateReviewFilterTabs(activeTab) {
    const isWaiting = (activeTab === 'waiting');
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
  window.updateReviewFilterTabs = updateReviewFilterTabs;

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

  // 정렬 기준 토글 버튼 이벤트
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
      window.showToast(`${SORT_MODES[currentIdx].label}으로 정렬되었습니다.`, '🔄');
    });
  }

  // 1분 스피드 복습 시작 로직
  function startGameWithWords(words, options = {}) {
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const fallbackList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const list = (words && words.length > 0)
      ? words.filter((item) => (item.lang || currentLang) === currentLang)
      : fallbackList;
    if (!list || list.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('복습할 오답 단어가 없습니다! 🎉', '💡');
      }
      return;
    }

    window.isReviewGameMode = true;

    // 13문제 세트로 순환 패딩
    const session = [];
    let idx = 0;
    while (session.length < 13) {
      const item = list[idx % list.length];
      session.push({
        id: item.id || `review-q-${idx}`,
        word: item.term || item.word || '',
        term: item.term || item.word || '',
        meaning: item.meaning || '',
        phonetic: item.phonetic || '',
        type: 'word',
        isSentence: false,
        tag: '오답 복습',
        isReviewMode: true,
        lang: currentLang
      });
      idx++;
    }

    window.currentSessionQuestions = session;

    if (window.openGameScreen) {
      window.openGameScreen('node-review', session);
    } else if (window.startGameSession) {
      window.startGameSession('node-review', session);
    }

    const titleEl = document.getElementById('game-stage-title');
    if (titleEl) {
      titleEl.textContent = '⚡ 1분 스피드 오답 복습';
    }
  }
  window.startGameWithWords = startGameWithWords;

  const handleStartReview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentWrongList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const waitingWords = currentWrongList.filter((w) => !w.escaped);
    const targetList = waitingWords.length > 0 ? waitingWords : currentWrongList;
    startGameWithWords(targetList, { isReviewMode: true });
  };

  const btnReviewSpeed = document.getElementById('btn-start-review-speed');
  if (btnReviewSpeed) {
    btnReviewSpeed.addEventListener('click', handleStartReview);
  }

  // 배너 우측 반창고 고양이 타일 & 하트 뱃지 클릭 시에도 1분 스피드 복습 시작
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

  // 7. Result Modal & Stage Progression
  window.showGameResultModal = function (status) {
    const type = (status === true || status === 'clear') ? 'clear' : 'gameover';
    const isClear = (type === 'clear');
    if (typeof window.finishGameStage === 'function') {
      return window.finishGameStage(isClear);
    }
    const modal = document.getElementById('game-result-modal'), clear = document.getElementById('game-result-clear-card'), over = document.getElementById('game-result-gameover-card');
    if (!modal) return;

    const gScreen = document.getElementById('game-screen'), gContainer = document.getElementById('game-container');
    if (gScreen) { gScreen.classList.remove('opacity-0', 'pointer-events-none'); gScreen.classList.add('opacity-100', 'pointer-events-auto'); }
    if (gContainer) { gContainer.classList.remove('translate-y-full'); gContainer.classList.add('translate-y-0'); }

    modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    modal.style.display = 'flex'; modal.style.pointerEvents = 'auto'; modal.style.zIndex = '9999';

    const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [], maxCombo: 0, totalQ: 13, currentHearts: 5 };
    const totalQ = stats.totalQ || 13, missedList = stats.missedWords || [];

    // ⭐️ 오답이 없으면 100%, 있으면 정상 계산
    const accuracy = missedList.length === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((totalQ - missedList.length) / totalQ) * 100)));

    if (missedList.length > 0 && typeof window.addWrongWord === 'function') {
      missedList.forEach(w => window.addWrongWord(w));
    }

    if (isClear) {
      if (clear) { clear.classList.remove('hidden'); clear.style.display = 'flex'; }
      if (over) { over.classList.add('hidden'); over.style.display = 'none'; }
      const confetti = el('result-confetti-container'); if (confetti) confetti.style.display = 'block';
      const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const mascotImg = el('result-mascot-img'); if (mascotImg) mascotImg.src = 'assets/characters/' + charPrefix + '-victory.webp?v=68';

      // 1) 현재 플레이 중인 정확한 타겟 노드 식별
      let targetNodeId = window.currentGameLessonId || window.currentLessonId || window.currentSelectedNodeId || 'node-1';
      const isBossNode = (targetNodeId === 'node-boss' || String(targetNodeId).includes('boss') || String(targetNodeId).endsWith('_n6') || targetNodeId === 'node-4');

      const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const activeCourseId = window.currentCourseId ||
        window.activeCourseId ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentLang) : null) ||
        'main';

      let curProg = 0;
      if (typeof getNodeProgress === 'function') {
        curProg = Number(getNodeProgress(targetNodeId, currentLang, activeCourseId)) || 0;
      }

      // 3) 누적 클리어 횟수 계산 (1회차: 1, 2회차: 2, 3회차: 3)
      const newClearedCount = isBossNode ? 3 : Math.min(3, curProg + 1);
      const finalStars = isBossNode ? 3 : newClearedCount;

      // 4) 진행도 저장 (언어/코스별 표준 격리 저장)
      const isReviewSession = !!(window.isReviewGameMode || window.isRoadmapReviewSpeedrun || targetNodeId === 'node-review' || String(targetNodeId).includes('review'));
      if (!isReviewSession && typeof setNodeProgress === 'function') {
        setNodeProgress(targetNodeId, newClearedCount, finalStars, currentLang, activeCourseId);
      }

      // 5) 모달 상단 서브타이틀 동적 갱신 (예: 2/3 클리어!)
      const clearSub = el('result-clear-subtitle') || document.querySelector('#game-result-clear-card p.text-slate-600') || document.querySelector('#game-result-clear-card p');
      if (clearSub) {
        let stageName = '생존 첫걸음';
        if (targetNodeId.includes('2')) stageName = '핵심 어휘 2';
        if (targetNodeId.includes('3')) stageName = '핵심 문장 3';
        if (isBossNode) stageName = 'FINAL BOSS';
        clearSub.textContent = `${stageName} (${newClearedCount}/3) 클리어!`;
      }

      // 6) 별 아이콘 3개 갱신 (표준 기준: 정확도 90% 이상 ⭐⭐⭐, 70~89% ⭐⭐☆, 70% 미만 ⭐☆☆)
      const modalStars = isBossNode ? 3 : (typeof window.calculateStarsByAccuracy === 'function'
        ? window.calculateStarsByAccuracy(accuracy)
        : (accuracy >= 90 ? 3 : (accuracy >= 70 ? 2 : 1)));
      window.lastEarnedStars = modalStars;
      if (typeof window.renderModalStars === 'function') {
        window.renderModalStars(modalStars);
      } else {
        [el('result-star-1'), el('result-star-2'), el('result-star-3')].forEach((s, idx) => {
          if (s) {
            const isActive = idx < modalStars;
            s.style.opacity = isActive ? '1' : '0.25';
            s.style.filter = isActive ? 'none' : 'grayscale(100%)';
            s.style.boxShadow = isActive ? '' : 'none';
            s.classList.toggle('grayscale', !isActive);
          }
        });
      }

      setText('result-accuracy-text', `${accuracy}%`);
      setText('result-combo-text', `x${stats.maxCombo || 0}`);

      // 7) 오답 단어 섹션 제어 (틀린 단어가 없으면 깔끔하게 숨김)
      const missedSec = el('result-missed-section');
      if (missedSec) {
        if (missedList.length === 0) {
          missedSec.classList.add('hidden');
          missedSec.style.display = 'none';
        } else {
          missedSec.classList.remove('hidden');
          missedSec.style.display = 'block';
          setText('result-missed-word', missedList[0].word || missedList[0].term || '');
          setText('result-missed-phonetic', missedList[0].phonetic || '');
          setText('result-missed-meaning', missedList[0].meaning || '');
        }
      }

      if (typeof window.playSuccessChime === 'function') window.playSuccessChime();

      // 8) 하단 버튼 텍스트 계산
      if (window.isReviewGameMode) {
        if (accuracy >= 80) {
          setText('btn-result-primary-text', '다음 스테이지 ▶');
          if (window.isRoadmapReviewSpeedrun) {
            completeReviewNode('node-review');
          }
        } else {
          setText('btn-result-primary-text', '다시 도전하기 🔄');
        }
      } else if (isBossNode) {
        setText('btn-result-primary-text', '다음 유닛 도전하기 🚀');
      } else {
        // 3회차 미만이면 "다음 라운드 (현재+1/3) ▶", 3회차 완료면 "다음 스테이지 ▶"
        if (newClearedCount < 3) {
          setText('btn-result-primary-text', `다음 라운드 (${newClearedCount + 1}/3) ▶`);
        } else {
          setText('btn-result-primary-text', '다음 스테이지 ▶');
        }
      }
      const pIcon = el('btn-result-primary-icon');
      if (pIcon) pIcon.style.display = 'none';
    } else {
      // Gameover 카드 처리
      try {
        if (clear) { clear.classList.add('hidden'); clear.style.display = 'none'; }
        if (over) { over.classList.remove('hidden'); over.style.display = 'flex'; }
        const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const goMascots = document.querySelectorAll('#game-result-gameover-card img, #result-gameover-card img');
        goMascots.forEach(img => {
          img.src = 'assets/characters/' + charPrefix + '-sad.webp?v=68';
        });
        const lastFailed = missedList.length > 0 ? missedList[missedList.length - 1] : null;
        if (lastFailed) {
          setText('gameover-missed-word', lastFailed.word || lastFailed.term || '¡Buenos días!');
          setText('gameover-missed-phonetic', lastFailed.phonetic ? `[${lastFailed.phonetic.replace(/[\[\]]/g, '')}]` : '');
          setText('gameover-missed-meaning', lastFailed.meaning || '');
        }
        const solvedQ = Math.max(0, (stats.currentQuestionIdx || 0)), progPct = Math.round((solvedQ / totalQ) * 100);
        setText('gameover-progress-text', `${solvedQ} / ${totalQ} 단어 (${progPct}%)`);
        const goProgBar = el('gameover-progress-bar'); if (goProgBar) goProgBar.style.width = `${progPct}%`;
      } catch (err) {
        console.warn('⚠️ showGameResultModal gameover 렌더링 예외:', err);
      }
    }
  };

  // ===================================================
  // [게임 화면 제어 단일화: gameEngine.js 전담 위임 및 중복 정의 제거]
  // ===================================================
  function showRoadmap() {
    if (typeof window.exitGameToRoadmap === 'function') {
      window.exitGameToRoadmap();
    } else {
      if (typeof window.closeGameScreen === 'function') window.closeGameScreen();
      switchMainTab('home');
      updateRoadmapNodesUI();
    }
  }
  window.showRoadmap = showRoadmap;

  // ===================================================
  // [결과 모달 버튼 처리: gameEngine.js 단일 전담 위임]
  // ===================================================
  function proceedNextStage(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (typeof window.handleResultPrimary === 'function') {
      window.handleResultPrimary(e);
    }
  }
  window.proceedNextStage = proceedNextStage;
  window.moveToNextStage = proceedNextStage;
  window.onClearModalNextClick = proceedNextStage;

  const missedCard = el('result-gameover-card') || el('gameover-missed-card');
  if (missedCard) missedCard.addEventListener('click', (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [] };
    const lastFailed = stats.missedWords && stats.missedWords.length > 0 ? stats.missedWords[stats.missedWords.length - 1] : null;
    const btn = missedCard.querySelector('button');
    if (lastFailed && window.speakWord) window.speakWord(lastFailed.word || lastFailed.term, window.currentActiveCourse, btn);
  });

  const clearMissedCard = el('result-missed-card');
  if (clearMissedCard) clearMissedCard.addEventListener('click', (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [] };
    const btn = clearMissedCard.querySelector('button');
    if (stats.missedWords && stats.missedWords.length > 0 && window.speakWord) {
      window.speakWord(stats.missedWords[0].word || stats.missedWords[0].term, window.currentActiveCourse, btn);
    }
  });

  // 전역 링크 / 폼 전송 브라우저 내비게이션 원천 차단 (순수 SPA 보장)
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    const form = e.target && e.target.closest ? e.target.closest('form') : null;
    if (form) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  const initialCourse = window.currentCourseId || getSavedCourseId() || 'basic';
  const initialLang = getSavedLanguage();
  setLanguage(initialLang);
  renderRoadmap();
  updateWrongWordsBadge();
  renderReviewWords('waiting');
  syncBookPhoneticSetting();
  initHallOfFameEvents();
  checkAndRechargeHearts();
  initHeartModalEvents();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkAndRechargeHearts();
  });
  window.addEventListener('focus', () => {
    checkAndRechargeHearts();
  });

  // 인게임 세션 생성 및 이전 챕터 오답 단어 복습 혼합 시스템 별칭 연동
  window.createGameSession = window.createGameSession || function (lessonId, lang, round) {
    if (typeof window.generateStageSession === 'function') {
      return window.generateStageSession(lessonId, lang, round);
    }
    if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
      return window.VOCA_DATA.generateStageSession(lessonId, lang, round);
    }
    return [];
  };
  window.initStageWords = window.initStageWords || window.createGameSession;

  // ----------------------------------------------------
  // 로드맵 각 유닛/챕터 블록마다 4개 오브젝트(🌸, 🌼, 🍀, 🌿) S자 곡선 자동 배치
  // ----------------------------------------------------
  function renderInfiniteRoadmapDecors() {
    const unitBlocks = document.querySelectorAll('.unit-section-block');
    if (!unitBlocks || unitBlocks.length === 0) return;

    const unitPattern = [
      { left: '28px', top: '110px', icon: '🌸', size: '17px', opacity: '0.85', anim: 'animate-pulse' },
      { right: '32px', top: '290px', icon: '🌼', size: '16px', opacity: '0.8' },
      { left: '42px', top: '490px', icon: '🍀', size: '15px', opacity: '0.75' },
      { right: '40px', top: '720px', icon: '🌿', size: '15px', opacity: '0.7' }
    ];

    unitBlocks.forEach((unit, unitIdx) => {
      unit.querySelectorAll('.auto-roadmap-decor').forEach(el => el.remove());

      unitPattern.forEach((p, pIdx) => {
        const jitterX = ((pIdx * 7 + unitIdx * 11) % 14) - 7;
        const jitterY = ((pIdx * 5 + unitIdx * 13) % 20) - 10;

        const decor = document.createElement('div');
        decor.className = `auto-roadmap-decor absolute pointer-events-none select-none filter drop-shadow-xs ${p.anim || ''}`;
        decor.textContent = p.icon;
        decor.style.fontSize = p.size;
        decor.style.opacity = p.opacity;
        decor.style.zIndex = '5';

        const calculatedTop = parseInt(p.top, 10) + jitterY;
        decor.style.top = `${calculatedTop}px`;

        if (p.left) {
          decor.style.left = `${parseInt(p.left, 10) + jitterX}px`;
        } else if (p.right) {
          decor.style.right = `${parseInt(p.right, 10) - jitterX}px`;
        }

        unit.appendChild(decor);
      });
    });
  }

  // 로드맵 재렌더링 시 데코도 함께 자동 호출되도록 등록
  if (typeof window.renderRoadmap === 'function') {
    const origRenderRoadmap = window.renderRoadmap;
    window.renderRoadmap = function (...args) {
      const res = origRenderRoadmap.apply(this, args);
      setTimeout(renderInfiniteRoadmapDecors, 30);
      return res;
    };
  }

  window.renderInfiniteRoadmapDecors = renderInfiniteRoadmapDecors;
  setTimeout(renderInfiniteRoadmapDecors, 50);
});


