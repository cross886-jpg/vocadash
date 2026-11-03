// =================================================
// VocaDash Settings Store Module (js/settingsStore.js)
// 설정 데이터 및 Storage 단일 진실 공급원 (SSOT)
// =================================================

(function () {
  const DEFAULT_SETTINGS = {
    showPhonetic: true,    // 한글 발음 표기 ([발음] 힌트)
    autoPlayAudio: true,   // 원어민 발음 자동 재생
    soundEffects: true,    // 효과음 및 배경음악
    hapticFeedback: true,  // 햅틱 진동 피드백
    dailyReminder: true,   // 매일 학습 리마인더
    reminderTime: "20:00"  // 알림 시간 설정
  };

  const STORAGE_KEY = 'vocadash_settings';

  function getSettings() {
    let settings = { ...DEFAULT_SETTINGS };
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          settings = { ...DEFAULT_SETTINGS, ...parsed };
        }
        const soundDirect = localStorage.getItem('vocadash_sound_enabled');
        if (soundDirect !== null) {
          settings.soundEffects = (soundDirect === 'true' || soundDirect === '1');
        }
      }
    } catch (e) {
      console.warn('settingsStore: 설정 로드 실패, 기본값 사용:', e);
    }
    return settings;
  }

  function saveSettings(settings) {
    try {
      const data = settings || DEFAULT_SETTINGS;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        if (typeof data.soundEffects === 'boolean') {
          localStorage.setItem('vocadash_sound_enabled', data.soundEffects ? 'true' : 'false');
        }
      }
      return data;
    } catch (e) {
      console.warn('settingsStore: 설정 저장 실패:', e);
      return settings;
    }
  }

  function setSetting(key, value) {
    const current = getSettings();
    current[key] = value;
    saveSettings(current);
    return current;
  }

  function resetSettings() {
    const reset = { ...DEFAULT_SETTINGS };
    saveSettings(reset);
    return reset;
  }

  window.settingsStore = {
    DEFAULT_SETTINGS,
    STORAGE_KEY,
    getSettings,
    saveSettings,
    setSetting,
    resetSettings
  };
})();

