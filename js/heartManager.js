// ==============================================================================
// VocaDash Heart (HP) System Manager Module (js/heartManager.js)
// 하트(HP) 영구 유지(localStorage), 30분 자동 자연 충전, 충전 모달 제어 및 광고 시뮬레이션 전담
// ==============================================================================

(function (global) {
  'use strict';
  const target = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));

  let heartTimerInterval = null;

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

  function updateHeartModalCountdownDisplay() {
    const status = checkAndRechargeHearts();
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

  // 3초 광고 시뮬레이션
  function runAdSimulation(rewardCallback, completeMsg) {
    closeHeartRechargeModal();

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
  }

  function openHeartRechargeModal() {
    const backdrop = document.getElementById('heart-modal-backdrop');
    const card = document.getElementById('heart-modal-card');
    if (!backdrop || !card) return;

    updateHeartModalCountdownDisplay();

    clearInterval(heartTimerInterval);
    heartTimerInterval = setInterval(updateHeartModalCountdownDisplay, 1000);

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
          if (typeof window.autoScrollToActiveNode === 'function') {
            window.autoScrollToActiveNode();
          }
        };
      }
      if (reviewBtn) reviewBtn.style.display = 'none';

    } else if (!hasEnoughGems && isReviewUsedToday) {
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
            setUserHearts(5);
          }, '📺 광고 시청 완료! 하트 5개 풀 충전! 💖');
        };
      }
      if (reviewBtn) reviewBtn.style.display = 'none';

    } else {
      if (reviewBtn) reviewBtn.style.display = 'flex';
      if (gemBtn) gemBtn.style.display = 'flex';

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
          if (typeof window.updateHeaderGemsUI === 'function') window.updateHeaderGemsUI();
          setUserHearts(5);
          if (typeof window.playSound === 'function') window.playSound('gem');
          closeHeartRechargeModal();
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
            setUserHearts(5);
          }, '📺 무료 광고 시청 완료! 하트 5개 풀 충전! 💖');
        };
      }

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
          closeHeartRechargeModal();
          if (typeof window.startRoadmapReviewSpeedrun === 'function') {
            window.startRoadmapReviewSpeedrun();
          }
        };
      }
    }

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
  }

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

  function initHeartModalEvents() {
    const closeBtn = document.getElementById('btn-close-heart-modal');
    if (closeBtn) closeBtn.onclick = closeHeartRechargeModal;

    const backdrop = document.getElementById('heart-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeHeartRechargeModal();
      });
    }

    const headerHeartsBadge = document.getElementById('header-hearts-badge');
    if (headerHeartsBadge) {
      headerHeartsBadge.onclick = function () {
        openHeartRechargeModal();
      };
    }
  }

  // 초기 하트 및 복구 상태 확인
  window.userHearts = getUserHearts();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkAndRechargeHearts();
      initHeartModalEvents();
    });
  } else {
    checkAndRechargeHearts();
    initHeartModalEvents();
  }

  // Export to Global
  target.getUserHearts = getUserHearts;
  target.setUserHearts = setUserHearts;
  target.updateHeartsUI = updateHeartsUI;
  target.updateUserHeartsUI = updateHeartsUI;
  target.checkAndRechargeHearts = checkAndRechargeHearts;
  target.openHeartRechargeModal = openHeartRechargeModal;
  target.closeHeartRechargeModal = closeHeartRechargeModal;
  target.runAdSimulation = runAdSimulation;
  target.initHeartModalEvents = initHeartModalEvents;

})(typeof window !== 'undefined' ? window : this);
