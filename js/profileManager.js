// ==============================================================================
// VocaDash Profile & Avatar Manager (js/profileManager.js) - 최종 경량화
// ==============================================================================
(function (global) {
  'use strict';
  const target = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);

  const VALID_AVATARS = ['profile-spanish.webp', 'profile-english.webp', 'profile-artist.webp', 'profile-explorer.webp'];

  const resolveAvatarFile = (val) => {
    if (!val) return 'profile-spanish.webp';
    const clean = String(val).split('?')[0].split('/').pop();
    if (VALID_AVATARS.includes(clean)) return clean;
    if (clean.includes('english') || clean.includes('sunglass')) return 'profile-english.webp';
    if (clean.includes('artist') || clean.includes('scholar')) return 'profile-artist.webp';
    if (clean.includes('explorer') || clean.includes('relax')) return 'profile-explorer.webp';
    return 'profile-spanish.webp';
  };

  const resolveAvatarSrc = (val) => `assets/profiles/${resolveAvatarFile(val)}?v=88`;

  let selectedAvatarFile = 'profile-spanish.webp';
  let selectedAvatarSrc = resolveAvatarSrc(selectedAvatarFile);
  let selectedTitle = '초급 마스터';

  const getStorage = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const setStorage = (key, val) => { try { localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : String(val)); } catch (_) { } };

  function loadSavedProfileData() {
    const saved = getStorage('vocadash_profile') || getStorage('vocadash_profile_avatar');
    selectedAvatarFile = resolveAvatarFile(saved);
    selectedAvatarSrc = resolveAvatarSrc(selectedAvatarFile);

    const userProfile = (() => { try { return JSON.parse(getStorage('userProfile')) || {}; } catch (_) { return {}; } })();
    selectedTitle = getStorage('vocadash_profile_title') || userProfile.title || '초급 마스터';
    const nickname = getStorage('vocadash_profile_nickname') || userProfile.nickname;

    if (nickname) {
      const statsNick = document.getElementById('stats-nickname');
      const nickInput = document.getElementById('nickname-input');
      if (statsNick) statsNick.textContent = nickname;
      if (nickInput) nickInput.value = nickname;
    }
    const badge = document.getElementById('stats-title-badge');
    if (badge) badge.textContent = selectedTitle;
  }

  function applyProfileAvatar(srcOrFile) {
    if (!srcOrFile) return;
    const file = resolveAvatarFile(srcOrFile);
    const src = resolveAvatarSrc(file);
    selectedAvatarFile = file;
    selectedAvatarSrc = src;

    // 프로필 이미지 일괄 동기화
    ['header-mascot-img', 'cat-marker-img', 'current-avatar-img', 'stats-avatar-img', 'settings-streak-avatar-img', 'settings-avatar-img', 'hall-user-avatar', 'hall-header-avatar'].forEach(id => {
      const img = document.getElementById(id);
      if (img) img.src = src;
    });

    const bannerImg = document.querySelector('#settings-streak-banner img');
    if (bannerImg) bannerImg.src = src;

    // 프로필 편집 모달 내부 선택 상태 동기화
    document.querySelectorAll('.avatar-option').forEach(btn => {
      const bFile = resolveAvatarFile(btn.dataset.avatarFile || btn.dataset.avatarSrc);
      const isCur = (bFile === file);
      const ring = btn.querySelector('.avatar-ring') || btn.querySelector('div');
      const chk = btn.querySelector('.avatar-check');
      const lbl = btn.querySelector('.avatar-label');

      if (ring) {
        ring.className = isCur
          ? 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border-2 border-[#22c55e] bg-white transition-all shadow-xs ring-2 ring-emerald-400/20'
          : 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
      }
      chk?.classList.toggle('hidden', !isCur);
      if (lbl) {
        lbl.className = isCur ? 'avatar-label text-xs font-bold text-[#22c55e] mt-1.5 truncate max-w-[68px]' : 'avatar-label text-xs font-medium text-slate-500 mt-1.5 truncate max-w-[68px]';
      }
    });
  }

  function syncHallOfFameAvatar() {
    const src = resolveAvatarSrc(getStorage('vocadash_profile') || selectedAvatarFile);
    ['hall-user-avatar', 'hall-header-avatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.src = src;
    });
  }

  const toggleProfileModal = (show) => {
    const b = document.getElementById('profile-modal-backdrop');
    const c = document.getElementById('profile-modal-card');
    b?.classList.toggle('opacity-0', !show);
    b?.classList.toggle('pointer-events-none', !show);
    c?.classList.toggle('translate-y-full', !show);
    c?.classList.toggle('opacity-0', !show);
    c?.classList.toggle('pointer-events-none', !show);
  };

  const toggleSettingsView = (open) => {
    const screens = ['stats-screen', 'my-records-screen', 'roadmap-screen', 'roadmap-header', 'review-screen', 'book-screen'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (open) {
          el.dataset.prevDisplay = el.style.display || '';
          el.style.display = 'none';
        } else {
          el.style.display = el.dataset.prevDisplay || '';
        }
      }
    });

    const settings = document.getElementById('settings-screen');
    if (settings) {
      settings.classList.toggle('hidden', !open);
      settings.style.display = open ? 'block' : 'none';
    }
    if (open) window.scrollTo(0, 0);
  };

  function initProfileManager() {
    loadSavedProfileData();
    applyProfileAvatar(selectedAvatarFile);
    updateProfileStats();

    // 프로필 모달 열기 (메인 우측 상단 고양이, 내 기록 프로필 카드, 설정 배너 및 수정 버튼)
    ['btn-header-profile', 'user-profile-card', 'settings-streak-avatar-container', 'btn-edit-profile-header'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfileModal(true);
      });
    });

    // 프로필 모달 닫기
    document.getElementById('profile-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.closest('#btn-profile-settings, .btn-open-settings')) return;

      const isBackdrop = e.target.id === 'profile-modal-backdrop';
      const isCloseBtn = e.target.closest('#btn-close-profile-modal, #btn-modal-close, [data-action="close"]');
      const isXIcon = e.target.closest('button')?.querySelector('.material-symbols-outlined')?.textContent?.trim().match(/close|clear/i);

      if (isBackdrop || isCloseBtn || isXIcon) {
        toggleProfileModal(false);
      }
    });

    // 설정 화면 열기
    const handleOpenSettings = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleProfileModal(false);
      toggleSettingsView(true);
    };

    document.querySelectorAll('#btn-profile-settings, .btn-open-settings').forEach(btn => {
      btn.removeEventListener('click', handleOpenSettings);
      btn.addEventListener('click', handleOpenSettings);
    });

    // 설정 화면 뒤로가기
    document.querySelector('#settings-screen [id*="back"], #btn-settings-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSettingsView(false);
    });

    // 모달 내부 아바타 선택
    document.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', function () {
        const file = resolveAvatarFile(this.dataset.avatarFile || this.dataset.avatarSrc);
        applyProfileAvatar(file);
        setStorage('vocadash_profile', file);
        setStorage('vocadash_profile_avatar', resolveAvatarSrc(file));
      });
    });

    // 모달 내부 칭호 선택
    document.querySelectorAll('.title-pill').forEach(pill => {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.title-pill').forEach(p => {
          p.className = 'title-pill bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-sm py-2.5 px-3 rounded-xl border-b-4 border-slate-200 flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-1 transition-all cursor-pointer w-full';
          p.querySelector('.material-symbols-outlined')?.classList.add('hidden');
        });
        this.className = 'title-pill bg-[#22c55e] text-white font-bold text-sm py-2.5 px-3 rounded-xl border-b-4 border-[#16a34a] flex items-center justify-center gap-1.5 shadow-sm active:border-b-0 active:translate-y-1 transition-all cursor-pointer w-full';
        this.querySelector('.material-symbols-outlined')?.classList.remove('hidden');
        selectedTitle = this.dataset.title || selectedTitle;
      });
    });

    // 프로필 저장 버튼
    const saveBtn = document.getElementById('save-profile-btn') || document.querySelector('#profile-modal-card button.bg-\\[\\#22c55e\\]');
    saveBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const nick = document.getElementById('nickname-input')?.value.trim() || '스페인어 질주러';
      const statsNick = document.getElementById('stats-nickname');
      if (statsNick) statsNick.textContent = nick;
      const statsBadge = document.getElementById('stats-title-badge');
      if (statsBadge) statsBadge.textContent = selectedTitle;

      setStorage('vocadash_profile_nickname', nick);
      setStorage('vocadash_profile_title', selectedTitle);
      setStorage('userProfile', { profile: selectedAvatarFile, avatar: selectedAvatarSrc, nickname: nick, title: selectedTitle });

      applyProfileAvatar(selectedAvatarFile);
      toggleProfileModal(false);
    });
  }

  function addMasteredWords(items) {
    if (!Array.isArray(items)) items = [items];
    try {
      const list = JSON.parse(getStorage('vocadash_mastered_words') || '[]');
      const set = new Set(list);
      items.forEach(it => {
        const id = String(it?.id || it?.word || it?.term || '').trim();
        if (id) set.add(id);
      });
      setStorage('vocadash_mastered_words', Array.from(set));
    } catch (_) { }
  }

  function updateProfileStats() {
    try {
      const words = JSON.parse(getStorage('vocadash_mastered_words') || '[]');
      const wordsEl = document.getElementById('stats-words-count');
      if (wordsEl) wordsEl.textContent = `${new Set(words).size}개`;

      const total = parseInt(getStorage('vocadash_total_questions') || '0', 10);
      const correct = parseInt(getStorage('vocadash_correct_answers') || '0', 10);
      const acc = total > 0 ? Math.round((Math.min(correct, total) / total) * 100) : 0;
      const accEl = document.getElementById('stats-accuracy-rate');
      if (accEl) accEl.textContent = `${acc}%`;

      const gemsEl = document.getElementById('stats-gems-count');
      if (gemsEl) gemsEl.textContent = `${getStorage('vocadash_gems') || 0}개`;

      const xp = Number(getStorage('vocadash_xp') || 0);
      const lv = Math.max(1, Math.floor(xp / 100) + 1);
      const lvBadge = document.getElementById('stats-level-badge');
      if (lvBadge) lvBadge.textContent = `Lv.${lv} ${lv >= 5 ? '실전 마스터 🚀' : (lv >= 3 ? '열정 러너 🏃' : '비기너 🌱')}`;

      const prog = xp % 100;
      const curXpEl = document.getElementById('stats-current-xp');
      const pctEl = document.getElementById('stats-xp-percent');
      const barEl = document.getElementById('stats-xp-bar');
      if (curXpEl) curXpEl.textContent = String(prog);
      if (pctEl) pctEl.textContent = `${prog}%`;
      if (barEl) barEl.style.width = `${prog}%`;
    } catch (_) { }
  }

  function showHallOfFameScreen() {
    ['stats-screen', 'my-records-screen', 'roadmap-screen', 'roadmap-header', 'review-screen', 'book-screen', 'settings-screen'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
    });
    const hall = document.getElementById('hall-of-fame-screen');
    if (hall) { hall.classList.remove('hidden'); hall.style.removeProperty('display'); }
    syncHallOfFameAvatar();
    initHallOfFameEvents();
  }

  function hideHallOfFameScreen() {
    const hall = document.getElementById('hall-of-fame-screen');
    if (hall) { hall.classList.add('hidden'); hall.style.display = 'none'; }
    const stats = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    if (stats) { stats.classList.remove('hidden'); stats.style.removeProperty('display'); }
    else target.switchMainTab?.('records');
  }

  function initHallOfFameEvents() {
    const screen = document.getElementById('hall-of-fame-screen');
    if (!screen || screen._bound) return;
    screen._bound = true;

    screen.querySelector('#btn-hall-of-fame-back')?.addEventListener('click', hideHallOfFameScreen);
    screen.querySelector('#btn-hall-of-fame-profile')?.addEventListener('click', () => toggleProfileModal(true));

    screen.querySelectorAll('.badge-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        screen.querySelectorAll('.badge-filter-btn').forEach(b => b.className = 'badge-filter-btn px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs');
        btn.className = 'badge-filter-btn px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center gap-1';
        const filter = btn.dataset.badgeFilter || 'all';
        screen.querySelectorAll('.badge-card').forEach(card => {
          card.classList.toggle('hidden', filter !== 'all' && card.dataset.badgeStatus !== filter);
        });
      });
    });
  }

  function syncStreakUI() {
    let count = 0;
    try {
      const raw = getStorage('vocadash_streak') || getStorage('vocadash_user_streak');
      count = raw ? (JSON.parse(raw)?.count || Number(raw) || 0) : 0;
    } catch (_) { }
    const headerEl = document.getElementById('header-streak-count');
    if (headerEl) headerEl.textContent = count;
    const modalText = document.querySelector('#streak-modal-card h3') || document.getElementById('modal-streak-count');
    if (modalText) modalText.innerHTML = `🔥 ${count}일 연속 질주 중!`;
  }

  const toggleStreakModal = (show) => {
    syncStreakUI();
    const modal = document.getElementById('streak-modal');
    const backdrop = document.getElementById('streak-modal-backdrop') || modal;
    const card = document.getElementById('streak-modal-card');

    modal?.classList.remove('hidden');
    backdrop?.classList.toggle('opacity-0', !show);
    backdrop?.classList.toggle('pointer-events-none', !show);
    card?.classList.toggle('translate-y-full', !show);
    card?.classList.toggle('opacity-0', !show);
    card?.classList.toggle('pointer-events-none', !show);

    if (!show) setTimeout(() => { if (backdrop?.classList.contains('opacity-0')) modal?.classList.add('hidden'); }, 200);
  };

  function initStreakEvents() {
    ['streak-trigger', 'streak-badge', 'btn-open-streak'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => toggleStreakModal(true));
    });
    ['close-streak-modal-btn', 'btn-streak-modal-close'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => toggleStreakModal(false));
    });
    document.getElementById('streak-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'streak-modal-backdrop') toggleStreakModal(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStreakEvents);
  } else {
    initStreakEvents();
  }

  // 모바일 뒤로가기(스와이프/하드웨어 버튼) 시 창만 닫기
  const pushState = () => history.pushState?.({ modal: true }, '');
  document.querySelectorAll('#btn-header-profile, #user-profile-card, #btn-profile-settings, .btn-open-settings').forEach(el => el.addEventListener('click', pushState));
  window.addEventListener('popstate', () => { toggleProfileModal(false); toggleSettingsView(false); });

  // 전역 메서드 노출
  target.openProfileModal = () => toggleProfileModal(true);
  target.closeProfileModal = () => toggleProfileModal(false);
  target.openStreakModal = () => toggleStreakModal(true);
  target.closeStreakModal = () => toggleStreakModal(false);
  target.showStreakModal = () => toggleStreakModal(true);
  target.applyProfileAvatar = applyProfileAvatar;
  target.initProfileManager = initProfileManager;
  target.updateProfileStats = updateProfileStats;
  target.addMasteredWord = (it) => addMasteredWords(it);
  target.addMasteredWords = addMasteredWords;
  target.showHallOfFameScreen = showHallOfFameScreen;
  target.hideHallOfFameScreen = hideHallOfFameScreen;
})(typeof window !== 'undefined' ? window : this);
