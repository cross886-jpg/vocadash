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
  }

  target.applyProfileAvatar = applyProfileAvatar;
  target.syncHallOfFameAvatar = syncHallOfFameAvatar;
  target.resolveAvatarFile = resolveAvatarFile;
  target.resolveAvatarSrc = resolveAvatarSrc;
  target.initProfileManager = initProfileManager;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      applyProfileAvatar,
      syncHallOfFameAvatar,
      resolveAvatarFile,
      resolveAvatarSrc,
      initProfileManager
    };
  }
})(typeof window !== 'undefined' ? window : this);
