// =================================================
// VocaDash Navigation & Routing Module (js/navigation.js)
// 하단 바 4개 탭 전환, 모달(스트릭, 설정, 명예의 전당) 열기/닫기 등 화면 라우팅 전담
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

  // DOM 헬퍼 함수
  const el = (id) => document.getElementById(id);
  const on = (id, evt, fn) => {
    const node = el(id);
    if (node) node.addEventListener(evt, fn);
  };

  // ===================================================
  // 1. 공통 모달 트랜지션 제어 엔진 (toggleModal)
  // ===================================================
  function toggleModal(backdrop, card, open, anim = 'fade') {
    if (backdrop) {
      backdrop.classList.toggle('opacity-0', !open);
      backdrop.classList.toggle('pointer-events-none', !open);
      backdrop.classList.toggle('opacity-100', open);
      backdrop.classList.toggle('pointer-events-auto', open);
      if (open) backdrop.classList.remove('hidden');
    }
    if (card) {
      card.classList.toggle('opacity-0', !open);
      card.classList.toggle('pointer-events-none', !open);
      card.classList.toggle('opacity-100', open);
      card.classList.toggle('pointer-events-auto', open);
      if (anim === 'slide') {
        card.classList.toggle('translate-y-full', !open);
        card.classList.toggle('translate-y-0', open);
      } else {
        card.classList.toggle('scale-95', !open);
        card.classList.toggle('scale-100', open);
      }
    }
  }
  window.toggleModal = toggleModal;

  // ===================================================
  // 2. 하단 탭 네비게이션 & 주요 화면 라우터 (switchMainTab)
  // ===================================================
  function setTabActive(activeTabEl) {
    const activeClasses = ['bg-emerald-500', 'text-white', 'shadow-lg', 'shadow-emerald-500/30'];
    const inactiveClasses = ['text-slate-400', 'hover:text-slate-200'];

    document.querySelectorAll('.nav-item').forEach((n) => {
      n.classList.remove('text-primary', 'font-bold', 'text-[#22c55e]');
      n.classList.add('text-on-surface-variant');
      n.removeAttribute('aria-current');
      const iconContainer = n.querySelector('.nav-icon-container');
      if (iconContainer) {
        iconContainer.classList.remove(...activeClasses);
        iconContainer.classList.remove('bg-white', 'text-slate-900', 'w-11', 'h-11', 'p-2', 'hover:text-white', 'shadow-md');
        iconContainer.classList.add(...inactiveClasses);
        iconContainer.classList.add('w-12', 'h-12', 'rounded-full');
      }
    });
    if (activeTabEl) {
      activeTabEl.classList.remove('text-on-surface-variant');
      activeTabEl.classList.add('text-primary', 'font-bold');
      activeTabEl.setAttribute('aria-current', 'page');
      const iconContainer = activeTabEl.querySelector('.nav-icon-container');
      if (iconContainer) {
        iconContainer.classList.remove(...inactiveClasses);
        iconContainer.classList.remove('bg-white', 'text-slate-900', 'w-11', 'h-11', 'p-2', 'hover:text-white');
        iconContainer.classList.add(...activeClasses);
        iconContainer.classList.add('w-12', 'h-12', 'rounded-full');
      }
    }
  }

  let isNavSwitchingTab = false;
  function switchMainTab(tabName, force = false) {
    let normTab = String(tabName || 'home').toLowerCase().trim();
    if (normTab === 'stats' || normTab === 'my-records' || normTab === 'record') {
      normTab = 'records';
    } else if (normTab === 'study' || normTab === 'wordbook') {
      normTab = 'book';
    } else if (normTab === 'roadmap') {
      normTab = 'home';
    }

    // 🛑 게임 진행 중(isGameActive=true) 로드맵 및 모든 탭 무단 강제 퇴장(강판) 전면 차단
    if ((window.isGameActive === true || window.isActive === true) && !force && !window.isExplicitExitRequested) {
      console.warn(`🛑 게임 진행 중(isGameActive=true) switchMainTab("${normTab}") 무단 전환 차단됨! (로드맵 강제 퇴장 방어)`);
      return;
    }

    if (isNavSwitchingTab) return;
    isNavSwitchingTab = true;
    try {
      // 명시적 종료 요청이거나 비게임 상태에서만 게임 엔진 상태 정리 수행
      if (!window.isGameActive || force || window.isExplicitExitRequested) {
        window.isActive = false;
        window.isGameActive = false;
        if (typeof window.clearAllGameTimers === 'function') {
          window.clearAllGameTimers();
        }
        if (typeof window.stopTTS === 'function') {
          window.stopTTS();
        }
        if (typeof window.closeGameScreen === 'function') {
          window.closeGameScreen();
        }
      }
      if (typeof window.closeFlashcardScreen === 'function') {
        window.closeFlashcardScreen();
      }

    const roadmapScreen = el('roadmap-screen');
    const roadmapHeader = el('roadmap-header');
    const packsScreen = el('packs-screen');
    const reviewScreen = el('review-screen');
    const statsScreen = el('stats-screen') || el('my-records-screen');
    const settingsScreen = el('settings-screen');
    const bookScreen = el('book-screen');
    const hallOfFameScreen = el('hall-of-fame-screen');
    const gameScreen = el('game-screen');
    const flashcardScreen = el('flashcard-screen');

    if (typeof window.closeBookCourseDropdown === 'function') {
      window.closeBookCourseDropdown();
    }

    const tabHome = el('tab-home');
    const tabPacks = document.querySelector('#tab-packs, .nav-packs');
    const tabReview = el('tab-review');
    const tabBook = document.querySelector('#tab-book, #tab-study, .nav-book, .nav-study');
    const tabRecords = document.querySelector('#tab-records, #tab-stats, .nav-stats, .nav-records');

    const loginScreen = el('login-screen');
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }
    const bottomNav = el('bottom-nav') || document.querySelector('nav');
    if (bottomNav) {
      bottomNav.classList.remove('hidden');
    }

    // 1) 탭 식별자 정규화 및 screenMap 일원화
    let normTab = String(tabName || 'home').toLowerCase().trim();
    if (normTab === 'packs' || normTab === 'pack') {
      normTab = 'packs';
    } else if (normTab === 'stats' || normTab === 'my-records' || normTab === 'record') {
      normTab = 'records';
    } else if (normTab === 'study' || normTab === 'wordbook') {
      normTab = 'book';
    } else if (normTab === 'roadmap') {
      normTab = 'home';
    }

    const screenMap = {
      home: { screen: roadmapScreen, header: roadmapHeader, tab: tabHome },
      packs: { screen: packsScreen, header: null, tab: tabPacks },
      review: { screen: reviewScreen, header: null, tab: tabReview },
      book: { screen: bookScreen, header: null, tab: tabBook },
      records: { screen: statsScreen, header: null, tab: tabRecords }
    };

    // 2) 모든 화면 일괄 숨김 (hidden 추가 및 인라인 display 잔여물 정리)
    const allScreens = [
      roadmapScreen,
      packsScreen,
      reviewScreen,
      bookScreen,
      statsScreen,
      settingsScreen,
      hallOfFameScreen,
      loginScreen
    ];
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

    if (gameScreen) {
      gameScreen.classList.remove('opacity-100', 'pointer-events-auto');
      gameScreen.classList.add('opacity-0', 'pointer-events-none', 'hidden');
      gameScreen.style.display = 'none';
    }
    if (flashcardScreen) {
      flashcardScreen.classList.remove('opacity-100', 'pointer-events-auto');
      flashcardScreen.classList.add('opacity-0', 'pointer-events-none', 'hidden');
      flashcardScreen.style.display = 'none';
    }

    // 3) 대상 화면 확실하게 활성화 (hidden 제거 및 display: none 인라인 스타일 완전 제거)
    const targetConfig = screenMap[normTab] || screenMap.home;
    if (targetConfig && targetConfig.screen) {
      targetConfig.screen.classList.remove('hidden');
      targetConfig.screen.style.removeProperty('display');
      targetConfig.screen.style.display = '';
    }

    // 4) 하단 탭 활성화 스타일 (초록색) 이동
    if (targetConfig && targetConfig.tab) {
      setTabActive(targetConfig.tab);
    } else if (normTab === 'records' && tabRecords) {
      setTabActive(tabRecords);
    }

    // 5) 각 탭별 전용 데이터 갱신 hook (try-catch 방어)
    if (normTab === 'records') {
      try {
        if (typeof window.updateStatsScreenUI === 'function') window.updateStatsScreenUI();
        if (typeof window.updateStatsUI === 'function' && window.updateStatsUI !== window.updateStatsScreenUI) window.updateStatsUI();
        if (typeof window.renderUserStats === 'function' && window.renderUserStats !== window.updateStatsScreenUI) window.renderUserStats();
      } catch (err) {
        console.warn('[VocaDash] stats update error caught:', err);
      }
    } else if (normTab === 'packs') {
      try {
        if (typeof window.renderPacksScreenUI === 'function') window.renderPacksScreenUI();
      } catch (err) {
        console.warn('[VocaDash] packs screen render error caught:', err);
      }
    } else if (normTab === 'review') {
      try {
        if (typeof window.renderReviewWords === 'function') window.renderReviewWords('waiting');
      } catch (err) {
        console.warn('[VocaDash] review words render error caught:', err);
      }
    } else if (normTab === 'book') {
      try {
        const curLang = window.currentLanguage || 'es';
        const curCourse = (typeof window.getCurrentCourseData === 'function' && window.getCurrentCourseData() === window.packFootballData)
          ? 'pack_football'
          : (window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.currentCourseId || 'main');
        if (typeof window.renderBookCourseDropdown === 'function') window.renderBookCourseDropdown(curLang, curCourse);
        if (typeof window.renderBookWords === 'function') window.renderBookWords(curLang, curCourse);
        if (typeof window.syncBookPhoneticSetting === 'function') window.syncBookPhoneticSetting();
        if (typeof window.initBookScreenEvents === 'function') window.initBookScreenEvents();
        if (typeof window.updateBookCourseBadge === 'function') window.updateBookCourseBadge(curLang, curCourse);
        if (typeof window.updateBookProgressHero === 'function') window.updateBookProgressHero();
      } catch (err) {
        console.warn('[VocaDash] book screen events error caught:', err);
      }
    } else if (normTab === 'home') {
      try {
        if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      } catch (err) {
        console.warn('[VocaDash] roadmap nodes UI update error caught:', err);
      }
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    } finally {
      isNavSwitchingTab = false;
    }
  }
  window.switchMainTab = switchMainTab;

  function switchScreen(screenName, force = false) {
    const s = String(screenName || 'home').toLowerCase().trim();
    if (s === 'flashcard' || s === 'flashcards') {
      if (typeof window.openFlashcardScreen === 'function') {
        window.openFlashcardScreen();
      }
      return;
    }
    if (s === 'game') {
      if (typeof window.openGameScreen === 'function') {
        window.openGameScreen();
      }
      return;
    }
    switchMainTab(s === 'roadmap' ? 'home' : s, force);
  }
  window.switchScreen = switchScreen;

  // ===================================================
  // 3. STEP 1: 외운 단어 카드 클릭 연동 (#card-mastered-words)
  // ===================================================
  function initMasteredWordsCard() {
    const card = el('card-mastered-words');
    if (card && card.dataset.navBound !== 'true') {
      card.dataset.navBound = 'true';
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1) 교재/단어장 화면(#book-screen)으로 전환
        switchMainTab('book');

        // 2) 단어장 화면 상단 '암기 완료' 필터 탭 자동 활성화
        setTimeout(() => {
          const memorizedChip = document.querySelector('.book-filter-chip[data-filter="memorized"]');
          if (memorizedChip) {
            memorizedChip.click();
          } else if (typeof window.applyBookFilter === 'function') {
            window.applyBookFilter('memorized');
          }

          const wordsContainer = el('book-words-container');
          if (wordsContainer) {
            wordsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(25);
        }
      });
    }
  }

  // ===================================================
  // 4. 연속학습(스트릭) 모달 라우팅
  // ===================================================
  const streakModalElem = el('streak-modal');
  const streakBackdrop = el('streak-modal-backdrop') || streakModalElem;
  const streakCard = el('streak-modal-card');

  window.openStreakModal = () => {
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
    if (sModal) sModal.classList.remove('hidden');
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
    if (sModal) sModal.classList.remove('hidden');
    showStreakModal();
  };

  // ===================================================
  // 5. 명예의 전당 (Hall of Fame) 화면 라우팅
  // ===================================================
  function showHallOfFameScreen() {
    const statsScreen = el('stats-screen') || el('my-records-screen');
    const hallOfFameScreen = el('hall-of-fame-screen');
    const roadmapScreen = el('roadmap-screen');
    const roadmapHeader = el('roadmap-header');
    const reviewScreen = el('review-screen');
    const bookScreen = el('book-screen');
    const settingsScreen = el('settings-screen');

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

    if (typeof window.syncHallOfFameAvatar === 'function') {
      window.syncHallOfFameAvatar();
    } else {
      try {
        let avatarSrc = null;
        const userProfileStr = localStorage.getItem('userProfile');
        if (userProfileStr) {
          const parsed = JSON.parse(userProfileStr);
          if (parsed && parsed.avatar && !parsed.avatar.includes('lh3.googleusercontent.com/aida/')) {
            avatarSrc = parsed.avatar;
          }
        }
        if (!avatarSrc) {
          const directSaved = localStorage.getItem('vocadash_profile_avatar');
          if (directSaved && !directSaved.includes('lh3.googleusercontent.com/aida/')) {
            avatarSrc = directSaved;
          }
        }
        if (avatarSrc) {
          const hallUserAvatar = el('hall-user-avatar');
          if (hallUserAvatar) hallUserAvatar.src = avatarSrc;
          const hallHeaderAvatar = el('hall-header-avatar');
          if (hallHeaderAvatar) hallHeaderAvatar.src = avatarSrc;
        }
      } catch (_) {}
    }

    if (typeof window.initHallOfFameEvents === 'function') {
      window.initHallOfFameEvents();
    }
  }
  window.showHallOfFameScreen = showHallOfFameScreen;

  function hideHallOfFameScreen() {
    const hallOfFameScreen = el('hall-of-fame-screen');
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }
    const statsScreen = el('stats-screen') || el('my-records-screen');
    if (statsScreen) {
      statsScreen.classList.remove('hidden');
      statsScreen.style.removeProperty('display');
    } else {
      switchMainTab('records');
    }
  }
  window.hideHallOfFameScreen = hideHallOfFameScreen;

  // ===================================================
  // 6. 설정 화면 (Settings Screen) 라우팅
  // ===================================================
  let previousScreenBeforeSettings = 'home';

  function openSettingsScreen() {
    const settingsScreen = el('settings-screen');
    const statsScreen = el('stats-screen') || el('my-records-screen');
    const roadmapScreen = el('roadmap-screen');
    const roadmapHeader = el('roadmap-header');
    const reviewScreen = el('review-screen');
    const bookScreen = el('book-screen');
    const hallOfFameScreen = el('hall-of-fame-screen');
    const loginScreen = el('login-screen');
    const bottomNav = el('bottom-nav') || document.querySelector('nav');

    if (roadmapScreen && !roadmapScreen.classList.contains('hidden')) {
      previousScreenBeforeSettings = 'home';
    } else if (statsScreen && !statsScreen.classList.contains('hidden')) {
      previousScreenBeforeSettings = 'records';
    } else if (bookScreen && !bookScreen.classList.contains('hidden')) {
      previousScreenBeforeSettings = 'book';
    } else if (reviewScreen && !reviewScreen.classList.contains('hidden')) {
      previousScreenBeforeSettings = 'review';
    } else {
      previousScreenBeforeSettings = 'home';
    }

    if (statsScreen) statsScreen.classList.add('hidden');
    if (roadmapScreen) roadmapScreen.classList.add('hidden');
    if (roadmapHeader) roadmapHeader.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (bookScreen) {
      bookScreen.classList.add('hidden');
      bookScreen.style.display = 'none';
    }
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }
    if (bottomNav) {
      bottomNav.classList.remove('hidden');
    }

    if (settingsScreen) {
      settingsScreen.classList.remove('hidden');
      settingsScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (typeof window.syncSettingsUI === 'function') {
      window.syncSettingsUI();
    }
    syncAuthButtonUI();
  }
  window.openSettingsModal = openSettingsScreen;
  window.openSettingsScreen = openSettingsScreen;

  function closeSettingsScreen() {
    const settingsScreen = el('settings-screen');
    if (settingsScreen) {
      settingsScreen.classList.add('hidden');
      settingsScreen.style.display = 'none';
    }
    if (previousScreenBeforeSettings === 'home') {
      switchMainTab('home');
    } else if (previousScreenBeforeSettings === 'book') {
      switchMainTab('book');
    } else if (previousScreenBeforeSettings === 'review') {
      switchMainTab('review');
    } else {
      const statsScreen = el('stats-screen') || el('my-records-screen');
      if (statsScreen) {
        statsScreen.classList.remove('hidden');
        statsScreen.style.removeProperty('display');
      } else {
        switchMainTab('records');
      }
    }
  }
  window.closeSettingsModal = closeSettingsScreen;
  window.closeSettingsScreen = closeSettingsScreen;

  // ===================================================
  // 6-B. 로그인 화면 (Login Screen) & 인증 상태 제어
  // ===================================================
  function isUserLoggedIn() {
    try {
      const loggedIn = localStorage.getItem('vocadash_is_logged_in');
      const user = localStorage.getItem('vocadash_user');
      return loggedIn === 'true' || !!user;
    } catch (_) {
      return false;
    }
  }
  window.isUserLoggedIn = isUserLoggedIn;

  function syncAuthButtonUI() {
    const btn = el('btn-auth-action');
    if (!btn) return;
    const loggedIn = isUserLoggedIn();

    if (loggedIn) {
      // 로그인 상태: 연한 회색 배경 & 붉은 텍스트의 '로그아웃' 버튼
      btn.className = 'w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 text-rose-500 font-bold text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-slate-200/60';
      btn.innerHTML = `
        <span class="material-symbols-outlined text-[18px]">logout</span>
        <span>로그아웃</span>
      `;
      try {
        const rawUser = localStorage.getItem('vocadash_user');
        if (rawUser) {
          const userObj = JSON.parse(rawUser);
          if (userObj && userObj.name) {
            const statsNick = el('stats-nickname');
            if (statsNick) statsNick.textContent = String(userObj.name);
            const settingsNick = el('settings-streak-nickname') || document.querySelector('#settings-streak-banner .font-headline-sm');
            if (settingsNick) settingsNick.textContent = String(userObj.name);
          }
        }
      } catch (_) {}
    } else {
      // 비로그인 상태: 기본 '로그인 / 회원가입' 에메랄드 녹색 버튼
      btn.className = 'w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer';
      btn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
        <span>로그인 / 회원가입</span>
      `;
      const statsNick = el('stats-nickname');
      if (statsNick) statsNick.textContent = '스페인어 질주러';
      const settingsNick = el('settings-streak-nickname') || document.querySelector('#settings-streak-banner .font-headline-sm');
      if (settingsNick) settingsNick.textContent = '스페인어 질주러';
    }
  }
  window.syncAuthButtonUI = syncAuthButtonUI;

  function openLoginScreen() {
    const loginScreen = el('login-screen');
    const settingsScreen = el('settings-screen');
    const statsScreen = el('stats-screen') || el('my-records-screen');
    const roadmapScreen = el('roadmap-screen');
    const roadmapHeader = el('roadmap-header');
    const reviewScreen = el('review-screen');
    const bookScreen = el('book-screen');
    const hallOfFameScreen = el('hall-of-fame-screen');
    const bottomNav = el('bottom-nav') || document.querySelector('nav');

    if (settingsScreen) {
      settingsScreen.classList.add('hidden');
      settingsScreen.style.display = 'none';
    }
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
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }
    if (bottomNav) {
      bottomNav.classList.add('hidden');
    }

    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      loginScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  window.openLoginScreen = openLoginScreen;

  function closeLoginScreen(targetTab = null) {
    const loginScreen = el('login-screen');
    const bottomNav = el('bottom-nav') || document.querySelector('nav');

    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }
    if (bottomNav) {
      bottomNav.classList.remove('hidden');
    }

    if (targetTab) {
      switchMainTab(targetTab);
    } else {
      openSettingsScreen();
    }
  }
  window.closeLoginScreen = closeLoginScreen;

  // ===================================================
  // 7. 프로필 & 언어 모달 제어
  // ===================================================
  const profileBackdrop = el('profile-modal-backdrop'), profileCard = el('profile-modal-card');
  window.openProfileModal = () => toggleModal(profileBackdrop, profileCard, true, 'slide');
  window.closeProfileModal = () => toggleModal(profileBackdrop, profileCard, false, 'slide');
  window.openProfileEditModal = window.openProfileModal;
  window.closeProfileEditModal = window.closeProfileModal;

  const langBackdrop = el('language-modal-backdrop'), langCard = el('language-modal-card');
  window.openLanguageModal = () => {
    if (typeof window.closeCourseDropdown === 'function') window.closeCourseDropdown();
    if (typeof window.updateModalCardsUI === 'function') window.updateModalCardsUI(window.currentActiveCourse || 'es');
    toggleModal(langBackdrop, langCard, true);
  };
  window.closeLanguageModal = () => toggleModal(langBackdrop, langCard, false);

  // ===================================================
  // 8. 전역 네비게이션 이벤트 바인딩
  // ===================================================
  function initNavigationEvents() {
    // 하단 탭 버튼 클릭
    const tabHome = el('tab-home');
    if (tabHome && tabHome.dataset.bound !== 'true') {
      tabHome.dataset.bound = 'true';
      tabHome.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchMainTab('home');
      });
    }

    const tabPacks = document.querySelector('#tab-packs, .nav-packs');
    if (tabPacks && tabPacks.dataset.bound !== 'true') {
      tabPacks.dataset.bound = 'true';
      tabPacks.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchMainTab('packs');
      });
    }

    const tabReview = el('tab-review');
    if (tabReview && tabReview.dataset.bound !== 'true') {
      tabReview.dataset.bound = 'true';
      tabReview.addEventListener('click', (e) => {
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

    const tabBook = document.querySelector('#tab-book, #tab-study, .nav-book, .nav-study');
    if (tabBook && tabBook.dataset.bound !== 'true') {
      tabBook.dataset.bound = 'true';
      tabBook.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchMainTab('book');
      });
    }

    const tabRecords = document.querySelector('#tab-records, #tab-stats, .nav-stats, .nav-records');
    if (tabRecords && tabRecords.dataset.bound !== 'true') {
      tabRecords.dataset.bound = 'true';
      tabRecords.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchMainTab('records');
      });
    }

    // 외운 단어 카드 (STEP 1)
    initMasteredWordsCard();

    // 스트릭 트리거들
    on('streak-trigger', 'click', handleOpenStreakModal);
    on('close-streak-modal-btn', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      window.closeStreakModal();
    });
    on('btn-open-streak-modal', 'click', handleOpenStreakModal);
    on('stats-streak-card', 'click', handleOpenStreakModal);

    const sBackdrop = el('streak-modal-backdrop') || el('streak-modal');
    if (sBackdrop && sBackdrop.dataset.bound !== 'true') {
      sBackdrop.dataset.bound = 'true';
      sBackdrop.addEventListener('click', (e) => {
        if (e.target === sBackdrop) window.closeStreakModal();
      });
    }

    // 명예의 전당 트리거들
    on('btn-view-all-badges', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      showHallOfFameScreen();
    });
    on('btn-hall-of-fame-back', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      hideHallOfFameScreen();
    });

    // 설정 화면 트리거들
    on('btn-open-settings', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      openSettingsScreen();
    });
    on('btn-main-settings', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      openSettingsScreen();
    });
    on('btn-profile-settings', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
      openSettingsScreen();
    });
    on('btn-review-settings', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      openSettingsScreen();
    });
    on('btn-settings-close', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      closeSettingsScreen();
    });
    on('btn-settings-back', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      closeSettingsScreen();
    });

    // 프로필 편집 트리거들
    on('btn-edit-profile-header', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      window.openProfileModal();
    });
    on('close-profile-modal-btn', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      window.closeProfileModal();
    });

    // 언어 선택 모달 트리거들
    on('logo-lang-trigger', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      window.openLanguageModal();
    });
    on('close-modal-btn', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      window.closeLanguageModal();
    });

    // 9. 인증(로그인 / 회원가입 / 로그아웃) 및 로그인 화면 인터랙션
    on('btn-auth-action', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (isUserLoggedIn()) {
        try {
          localStorage.removeItem('vocadash_is_logged_in');
          localStorage.removeItem('vocadash_user');
        } catch (_) {}
        syncAuthButtonUI();
        if (typeof window.showToast === 'function') {
          window.showToast('성공적으로 로그아웃되었습니다.', '👋');
        }
      } else {
        openLoginScreen();
      }
    });

    on('btn-login-close', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      closeLoginScreen();
    });

    on('btn-login-google', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      try {
        localStorage.setItem('vocadash_is_logged_in', 'true');
        localStorage.setItem('vocadash_user', JSON.stringify({
          provider: 'google',
          name: '질주하는 러너',
          email: 'runner@google.com'
        }));
      } catch (_) {}
      syncAuthButtonUI();
      closeLoginScreen('home');
      if (typeof window.showToast === 'function') {
        window.showToast('환영합니다! 스페인어 질주를 시작해보세요 ⚡', '🎉');
      }
    });

    on('btn-login-apple', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      try {
        localStorage.setItem('vocadash_is_logged_in', 'true');
        localStorage.setItem('vocadash_user', JSON.stringify({
          provider: 'apple',
          name: '질주하는 러너',
          email: 'runner@apple.com'
        }));
      } catch (_) {}
      syncAuthButtonUI();
      closeLoginScreen('home');
      if (typeof window.showToast === 'function') {
        window.showToast('환영합니다! 스페인어 질주를 시작해보세요 ⚡', '🎉');
      }
    });

    on('btn-login-guest', 'click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      closeLoginScreen('home');
    });

    // 앱 로드 시 인증 버튼 상태 동기화
    syncAuthButtonUI();

    // ===================================================
    // 바텀시트 [학습 시작하기] 버튼: 표준 3단계 파이프라인 (플래시카드 단어 예습 우선) 보장
    // ===================================================
    const lessonStartBtn = el('lesson-start-btn');
    if (lessonStartBtn && lessonStartBtn.dataset.pipelineBound !== 'true') {
      lessonStartBtn.dataset.pipelineBound = 'true';
      lessonStartBtn.addEventListener('click', (e) => {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        startStageLearningPipeline(window.currentSelectedNodeId);
        return false;
      }, true);
    }

    // ===================================================
    // 결과 모달 [다음 스테이지] 버튼: 3단계 파이프라인 (플래시카드 단어 예습) 연동
    // ===================================================
    const btnNextStage = el('btn-next-stage') || el('btn-result-primary');
    if (btnNextStage && btnNextStage.dataset.pipelineBound !== 'true') {
      btnNextStage.dataset.pipelineBound = 'true';
      btnNextStage.addEventListener('click', (e) => {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        if (typeof window.handleResultPrimary === 'function') {
          window.handleResultPrimary(e);
        } else if (typeof window.proceedNextStage === 'function') {
          window.proceedNextStage(e);
        }
        return false;
      }, true);
    }

    // ===================================================
    // 게임오버 모달 [처음부터 다시 도전] 버튼: 순수 SPA 인메모리 재시작 연동
    // ===================================================
    const btnGameOverRetry = el('btn-gameover-retry');
    if (btnGameOverRetry && btnGameOverRetry.dataset.bound !== 'true') {
      btnGameOverRetry.dataset.bound = 'true';
      btnGameOverRetry.addEventListener('click', (e) => {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
        if (typeof window.restartStageInMemory === 'function') {
          window.restartStageInMemory(e);
        } else if (typeof window.restartGame === 'function') {
          window.restartGame(e);
        }
        return false;
      }, true);
    }
  }

  // ===================================================
  // 10. 표준 3단계 파이프라인 (로드맵 -> 플래시카드 예습 -> 액션 낙하 테스트)
  // ===================================================
  function startStageLearningPipeline(nodeId, customSession = null) {
    const targetNodeId = nodeId || window.currentSelectedNodeId || 'node-2';
    window.currentSelectedNodeId = targetNodeId;
    if (typeof window.closeLessonModal === 'function') {
      window.closeLessonModal();
    }

    const currentCourse = window.currentActiveCourse || 'es';
    const round = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;

    const activeCourseId = (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || window.activeCourseId || 'main';
    window.activeCourseId = activeCourseId;
    const currentCourseData = typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : window.courseData;

    const unlockedLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentCourse) : 1) || 1;
    const unitIndex = Math.max(0, unlockedLevel - 1);
    const targetUnit = (currentCourseData && Array.isArray(currentCourseData.units)) 
      ? (currentCourseData.units[unitIndex] || currentCourseData.units[0]) 
      : null;
    const currentWords = (targetUnit && Array.isArray(targetUnit.words)) ? targetUnit.words : [];

    console.log('현재 로드된 코스:', activeCourseId, '단어 목록:', currentWords);

    let session = customSession;
    if (!session || !Array.isArray(session) || session.length === 0) {
      if (activeCourseId === 'pack_football' && typeof window.getFootballStageSession === 'function') {
        session = window.getFootballStageSession(targetNodeId);
      } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === 'function') {
        session = window.VOCA_DATA.generateStageSession(targetNodeId, currentCourse, round);
      }
    }
    window.currentSessionQuestions = session || [];

    console.log(`🚀 [Pipeline] ${targetNodeId} 3단계 파이프라인 진입: 플래시카드 단어 예습 화면 오픈`);

    // 🛑 배경 화면(로드맵, 로드맵 헤더, 게임 화면, 하단 네비) 완전 숨김 (화면 겹침 및 이탈 방어)
    const roadmapScreen = el('roadmap-screen');
    if (roadmapScreen) {
      roadmapScreen.classList.add('hidden');
      roadmapScreen.style.display = 'none';
    }
    const roadmapHeader = el('roadmap-header');
    if (roadmapHeader) {
      roadmapHeader.classList.add('hidden');
      roadmapHeader.style.display = 'none';
    }
    const gScreen = el('game-screen');
    if (gScreen) {
      gScreen.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      gScreen.classList.remove('opacity-100', 'pointer-events-auto');
      gScreen.style.display = 'none';
    }
    const bottomNav = el('bottom-nav') || document.querySelector('nav');
    if (bottomNav) {
      bottomNav.classList.add('hidden');
      bottomNav.style.display = 'none';
    }

    if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen(targetNodeId, session);
    } else if (typeof window.initFlashcardDeck === 'function') {
      window.initFlashcardDeck(targetNodeId, session);
    } else if (typeof window.loadFlashcards === 'function') {
      window.loadFlashcards(targetNodeId, session);
    } else if (typeof window.openGameScreen === 'function') {
      window.openGameScreen(targetNodeId, session);
    }
  }
  window.startStageLearningPipeline = startStageLearningPipeline;

  window.initNavigationEvents = initNavigationEvents;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationEvents);
  } else {
    initNavigationEvents();
  }
})();
