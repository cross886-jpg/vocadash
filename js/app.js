// ==============================================================================
// VocaDash Application Bootstrap & Main Entry Point (js/app.js)
// URL 파라미터 감지, 브랜드 스플래시 화면 제어, 전체 모듈 초기화 부트스트랩 (~70줄)
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. URL ?clean 파라미터 완전 초기화 감지 (localStorage & sessionStorage 완전 리셋)
  (function handleCleanParam() {
    try {
      if (typeof window === 'undefined' || !window.location || !window.location.search) return;
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('clean')) return;
      console.log('🧹 [URL Clean] ?clean 감지: 스토리지 완전 초기화 실행');
      if (typeof localStorage !== 'undefined') localStorage.clear();
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();

      const DEFAULT_STATE = { currentCourse: 'pack_football', currentUnit: 0, currentNode: 0, stars: {}, clearedNodes: {}, unlockedNodes: ['fb_1_n1', 'node-1'], weakWords: [], gems: 0, hearts: 5 };
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
      window.nodeProgressMap = { 'fb_1_n1': 0, 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 };

      urlParams.delete('clean');
      const cleanUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
      if (window.history && window.history.replaceState) window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {
      console.warn('⚠️ [URL Clean] 예외 방어:', e);
    }
  })();

  // 2. 브랜드 스플래시 인트로 컨트롤러 (1.2초 자동 + 터치 시 스킵)
  const splashScreen = document.getElementById('splash-screen');
  const splashProgressBar = document.getElementById('splash-progress-bar');
  const splashMascot = document.getElementById('splash-mascot-img');

  function dismissSplash() {
    if (!splashScreen) return;
    splashScreen.style.pointerEvents = "none";
    splashScreen.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => {
      splashScreen.classList.add("hidden");
      splashScreen.style.display = "none";
      splashScreen.style.pointerEvents = "none";
    }, 300);
  }
  window.dismissSplash = dismissSplash;

  if (splashScreen) {
    if (splashMascot) {
      let savedLang = 'es';
      try { savedLang = localStorage.getItem('vocadash_language') || 'es'; } catch (_) { }
      splashMascot.src = `assets/characters/${savedLang}-idle.webp?v=68`;
    }
    if (splashProgressBar) setTimeout(() => { splashProgressBar.style.width = '100%'; }, 50);
    ['click', 'touchstart'].forEach(evt => splashScreen.addEventListener(evt, dismissSplash, { passive: true }));
    const autoDismiss = () => setTimeout(dismissSplash, 1200);
    if (document.readyState === 'complete') autoDismiss(); else window.addEventListener('load', autoDismiss);
    setTimeout(dismissSplash, 3000);
  }

  // 3. 애플리케이션 초기화 부트스트랩 (각 모듈 진입점 순차 호출)
  const initialLang = (typeof window.getSavedLanguage === 'function') ? window.getSavedLanguage() : 'es';
  if (typeof window.setLanguage === 'function') window.setLanguage(initialLang);

  [
    window.renderRoadmap,
    window.focusActiveRoadmapNode,
    window.updateWrongWordsBadge,
    () => window.renderReviewWords && window.renderReviewWords('waiting'),
    window.syncBookPhoneticSetting,
    window.initSettingsEvents,
    window.initHallOfFameEvents,
    window.initProfileManager,
    window.checkAndRechargeHearts,
    window.initHeartModalEvents
  ].forEach(fn => { try { if (typeof fn === 'function') fn(); } catch (_) { } });

  // 백그라운드 복귀 시 하트 충전 확인
  const syncHearts = () => { if (typeof window.checkAndRechargeHearts === 'function') window.checkAndRechargeHearts(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncHearts(); });
  window.addEventListener('focus', syncHearts);

  // 인게임 세션 생성 표준 단일화 호환 바인딩
  window.createGameSession = window.generateStageSession;
  window.initStageWords = window.generateStageSession;
});
