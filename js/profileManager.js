// ==============================================================================
// VocaDash Profile & Avatar Manager (js/profileManager.js)
// 프로필 편집 모달, 4종 고양이 아바타 선택, 칭호 설정 및 UI 실시간 동기화
// ==============================================================================

(function (global) {
  'use strict';
  const target = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));

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
  let selectedAvatarSrc = resolveAvatarSrc(selectedAvatarFile);
  let selectedTitle = '초급 마스터';

  function loadSavedProfileData() {
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

    selectedAvatarSrc = resolveAvatarSrc(selectedAvatarFile);

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
  }

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

  function initProfileManager() {
    loadSavedProfileData();

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
        applyProfileAvatar(targetFile);
        try {
          localStorage.setItem('vocadash_profile', targetFile);
          localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
        } catch (_) { }
      });
    });

    // 칭호 선택 이벤트 바인딩
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

    // 프로필 저장 버튼 클릭 이벤트
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

        if (typeof window.closeProfileModal === 'function') {
          window.closeProfileModal();
        }
      });
    }

    // 초기 통계 UI 렌더링
    updateProfileStats();
  }

  // 외운 단어(vocadash_mastered_words) 단일 추가
  function addMasteredWord(item) {
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
    } catch (e) {
      console.warn('[VocaDash] addMasteredWord error:', e);
    }
  }

  // 외운 단어(vocadash_mastered_words) 복수 일괄 추가
  function addMasteredWords(items) {
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
    } catch (e) {
      console.warn('[VocaDash] addMasteredWords error:', e);
    }
  }

  // 내 기록 탭 통계(외운 단어 수, 정답률, 보유 보석, XP) 실시간 바인딩
  function updateProfileStats() {
    try {
      // 1) 외운 단어 수: vocadash_mastered_words에 저장된 고유 단어 개수(중복 제외)
      let masteredCount = 0;
      try {
        const rawMastered = localStorage.getItem('vocadash_mastered_words') ||
          localStorage.getItem('vocadash_learned_words') ||
          localStorage.getItem('vocadash_completed_words');
        if (rawMastered) {
          const parsed = JSON.parse(rawMastered);
          if (Array.isArray(parsed)) {
            masteredCount = new Set(parsed).size;
          } else if (typeof parsed === 'number') {
            masteredCount = parsed;
          }
        }
      } catch (_) { }

      const wordsCountEl = document.getElementById('stats-words-count');
      if (wordsCountEl) {
        wordsCountEl.textContent = `${masteredCount}개`;
      }

      // 2) 정답률: (누적 정답 수 / 누적 시도 문제 수) * 100을 반올림하여 X%로 계산 (시도 문제 수 0일 때 0%)
      let totalQuestions = 0;
      let correctAnswers = 0;
      try {
        const totalRaw = localStorage.getItem('vocadash_total_questions');
        if (totalRaw !== null) totalQuestions = parseInt(totalRaw, 10) || 0;
        const correctRaw = localStorage.getItem('vocadash_correct_answers');
        if (correctRaw !== null) correctAnswers = parseInt(correctRaw, 10) || 0;
      } catch (_) { }

      let accuracy = 0;
      if (totalQuestions > 0) {
        accuracy = Math.round((Math.min(correctAnswers, totalQuestions) / totalQuestions) * 100);
      } else {
        try {
          const savedAcc = localStorage.getItem('vocadash_overall_accuracy');
          if (savedAcc !== null) accuracy = parseInt(savedAcc, 10) || 0;
        } catch (_) { }
      }
      accuracy = Math.max(0, Math.min(100, accuracy));

      const accuracyEl = document.getElementById('stats-accuracy-rate');
      if (accuracyEl) {
        accuracyEl.textContent = `${accuracy}%`;
      }

      // 3) 보유 보석 수치 반영
      const gemsCountEl = document.getElementById('stats-gems-count');
      if (gemsCountEl) {
        let gems = 0;
        try {
          const savedGems = localStorage.getItem('vocadash_gems');
          if (savedGems !== null) gems = parseInt(savedGems, 10) || 0;
        } catch (_) { }
        gemsCountEl.textContent = `${gems}개`;
      }

      // 4) 레벨 및 XP 진행도 카드 동기화
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

      const currentXpEl = document.getElementById('stats-current-xp');
      const maxXpEl = document.getElementById('stats-max-xp');
      const xpPercentEl = document.getElementById('stats-xp-percent');
      const xpBarEl = document.getElementById('stats-xp-bar');
      const levelProgressXp = currentXp % 100;
      const levelPercent = Math.min(100, Math.round((levelProgressXp / 100) * 100));

      if (currentXpEl) currentXpEl.textContent = String(levelProgressXp);
      if (maxXpEl) maxXpEl.textContent = '100';
      if (xpPercentEl) xpPercentEl.textContent = `${levelPercent}%`;
      if (xpBarEl) xpBarEl.style.width = `${levelPercent}%`;
    } catch (err) {
      console.warn('[VocaDash] updateProfileStats error:', err);
    }
  }

  // ===================================================
  // 명예의 전당 (Hall of Fame) 화면 전환 & 인터랙션 연동
  // ===================================================
  function showHallOfFameScreen() {
    if (typeof document === 'undefined') return;
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
      if (typeof window !== 'undefined' && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }

    syncHallOfFameAvatar();
    initHallOfFameEvents();
  }

  function hideHallOfFameScreen() {
    if (typeof document === 'undefined') return;
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }

    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    if (statsScreen) {
      statsScreen.classList.remove('hidden');
      statsScreen.style.removeProperty('display');
      if (typeof window !== 'undefined' && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else if (typeof target.switchMainTab === 'function') {
      target.switchMainTab('records');
    }
  }

  function initHallOfFameEvents() {
    if (typeof document === 'undefined') return;
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
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator.share({
            title: 'VocaDash 명예의 전당',
            text: 'VocaDash에서 달성한 멋진 배지들을 확인해보세요!',
            url: (typeof document !== 'undefined' && document.URL) || 'https://vocadash.app'
          }).catch(() => { });
        } else if (typeof target.showToast === 'function') {
          target.showToast('🏆 명예의 전당 배지 링크가 복사되었습니다!', '✨');
        }
        if (typeof target.triggerHaptic === 'function') {
          target.triggerHaptic(20);
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
        if (typeof target.openProfileEditModal === 'function') {
          target.openProfileEditModal();
        } else if (typeof target.openProfileModal === 'function') {
          target.openProfileModal();
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

        if (typeof target.triggerHaptic === 'function') {
          target.triggerHaptic(15);
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
        if (typeof target.showToast === 'function') {
          if (isCompleted) {
            target.showToast(`✨ '${title}' 배지를 획득하셨습니다!`, '🎖️');
          } else {
            target.showToast(`🎯 '${title}' 배지를 향해 도전 중입니다!`, '🔥');
          }
        }
        if (typeof target.triggerHaptic === 'function') {
          target.triggerHaptic(20);
        }
      });
    });
  }

  // 🌟 [Karpathy 원칙] 스트릭(연속 출석) 모달 및 동기화 전담
  function syncStreakUI() {
    let streakCount = 0;
    try {
      const raw = localStorage.getItem('vocadash_streak') ||
        localStorage.getItem('vocadash_user_streak') ||
        localStorage.getItem('streakData');
      if (raw) {
        const parsed = JSON.parse(raw);
        streakCount = typeof parsed === 'object' ? (parsed.count || parsed.currentStreak || 0) : Number(parsed) || 0;
      }
    } catch (_) { }

    const headerCount = document.getElementById('header-streak-count');
    if (headerCount) headerCount.textContent = streakCount;

    const streakCard = document.getElementById('streak-modal-card');
    const modalStreakText = streakCard?.querySelector('h3') ||
      document.querySelector('#streak-modal-card h3') ||
      document.getElementById('modal-streak-count');
    if (modalStreakText) {
      modalStreakText.innerHTML = `🔥 ${streakCount}일 연속 질주 중!`;
    }
  }

  function openStreakModal() {
    syncStreakUI();
    const sModal = document.getElementById('streak-modal');
    const streakBackdrop = document.getElementById('streak-modal-backdrop') || sModal;
    const streakCard = document.getElementById('streak-modal-card');

    if (sModal) sModal.classList.remove('hidden');
    if (streakBackdrop) {
      streakBackdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      streakBackdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (streakCard) {
      streakCard.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-full');
      streakCard.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
    if (typeof target.toggleModal === 'function') {
      target.toggleModal(streakBackdrop, streakCard, true, 'slide');
    }
  }

  function closeStreakModal() {
    const sModal = document.getElementById('streak-modal');
    const streakBackdrop = document.getElementById('streak-modal-backdrop') || sModal;
    const streakCard = document.getElementById('streak-modal-card');
    if (typeof target.toggleModal === 'function') {
      target.toggleModal(streakBackdrop, streakCard, false, 'slide');
    } else {
      if (streakBackdrop) streakBackdrop.classList.add('opacity-0', 'pointer-events-none');
      if (streakCard) streakCard.classList.add('opacity-0', 'pointer-events-none', 'translate-y-full');
    }
    setTimeout(() => {
      if (sModal && streakBackdrop && streakBackdrop.classList.contains('opacity-0')) {
        sModal.classList.add('hidden');
      }
    }, 220);
  }

  function showStreakModal() {
    const sModal = document.getElementById('streak-modal');
    if (sModal) sModal.classList.remove('hidden');
    openStreakModal();
  }

  function handleOpenStreakModal(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    showStreakModal();
  }

  function handleStartTodaySprint(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    closeStreakModal();

    const currentLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentCoursePack = target.currentCourseId ||
      target.activeCourseId ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentLang) : null) ||
      'main';

    let n1Prog = 0;
    if (typeof target.getNodeProgress === 'function') {
      n1Prog = Number(target.getNodeProgress('node-1', currentLang, currentCoursePack)) || 0;
    }

    const targetNode = (n1Prog < 3) ? 'node-1' : 'node-2';
    target.currentSelectedNodeId = targetNode;

    setTimeout(() => {
      if (typeof target.openLessonModal === 'function') {
        target.openLessonModal(targetNode);
      } else {
        const targetBtn = document.getElementById(`${targetNode}-btn`) || document.getElementById(targetNode);
        if (targetBtn) targetBtn.click();
      }
    }, 220);
  }

  function initStreakEvents() {
    const on = (id, event, handler) => {
      const node = document.getElementById(id);
      if (node && !node._streakBound) {
        node.addEventListener(event, handler);
        node._streakBound = true;
      }
    };
    on('streak-trigger', 'click', handleOpenStreakModal);
    on('streak-badge', 'click', handleOpenStreakModal);
    on('btn-open-streak', 'click', handleOpenStreakModal);
    on('close-streak-modal-btn', 'click', (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      closeStreakModal();
    });
    on('btn-streak-modal-close', 'click', (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      closeStreakModal();
    });
    on('btn-streak-modal-action', 'click', handleStartTodaySprint);
    const backdrop = document.getElementById('streak-modal-backdrop') || document.getElementById('streak-modal');
    if (backdrop && !backdrop._streakBackdropBound) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeStreakModal();
      });
      backdrop._streakBackdropBound = true;
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initStreakEvents);
    } else {
      initStreakEvents();
    }
  }

  target.applyProfileAvatar = applyProfileAvatar;
  target.syncHallOfFameAvatar = syncHallOfFameAvatar;
  target.resolveAvatarFile = resolveAvatarFile;
  target.resolveAvatarSrc = resolveAvatarSrc;
  target.initProfileManager = initProfileManager;
  target.updateProfileStats = updateProfileStats;
  target.renderRecordStats = updateProfileStats;
  target.addMasteredWord = addMasteredWord;
  target.addMasteredWords = addMasteredWords;
  target.showHallOfFameScreen = showHallOfFameScreen;
  target.hideHallOfFameScreen = hideHallOfFameScreen;
  target.initHallOfFameEvents = initHallOfFameEvents;
  target.syncStreakUI = syncStreakUI;
  target.openStreakModal = openStreakModal;
  target.closeStreakModal = closeStreakModal;
  target.showStreakModal = showStreakModal;
  target.handleOpenStreakModal = handleOpenStreakModal;
  target.handleStartTodaySprint = handleStartTodaySprint;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      applyProfileAvatar,
      syncHallOfFameAvatar,
      resolveAvatarFile,
      resolveAvatarSrc,
      initProfileManager,
      updateProfileStats,
      renderRecordStats: updateProfileStats,
      addMasteredWord,
      addMasteredWords,
      showHallOfFameScreen,
      hideHallOfFameScreen,
      initHallOfFameEvents
    };
  }
})(typeof window !== 'undefined' ? window : this);
