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
  } catch (_) {}

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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('설정 로드 실패, 기본값 사용:', e);
    }
    return { ...DEFAULT_SETTINGS };
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
      } catch (_) {}
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
      if (!isInitial) {
        if (val && typeof window.playSuccessChime === 'function') {
          try { window.playSuccessChime(); } catch (_) {}
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
        const src = `assets/profiles/${file}?v=20`;
        if (settingsAvatarImg) settingsAvatarImg.src = src;
        if (statsAvatarImg) statsAvatarImg.src = src;
        if (hallUserAvatar) hallUserAvatar.src = src;
        if (hallHeaderAvatar) hallHeaderAvatar.src = src;
      }
    } catch (_) {}
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
    if (sDesc) sDesc.textContent = (curLang === 'en') ? '영어 (필수 회화 & 어휘)' : '스페인어 (여행 필수 패턴)';

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
    } catch (_) {}

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
