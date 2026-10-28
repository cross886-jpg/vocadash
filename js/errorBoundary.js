// ==============================================================================
// VocaDash Global Error Boundary & Crash Recovery (js/errorBoundary.js)
// ==============================================================================
(function (global) {
  'use strict';
  const target = typeof window !== 'undefined' ? window : global;

  // 개발 단계: false (콘솔 에러 확인용), 상용 배포: true (일반 사용자용 팝업)
  const ENABLE_CRASH_POPUP = false;

  function showEmergencyRecoveryModal(err) {
    if (!ENABLE_CRASH_POPUP) {
      console.warn('⚠️ [ErrorBoundary]: 개발 모드 - 팝업 미노출. 상세 오류 콘솔 참조');
      return;
    }

    try {
      let modal = document.getElementById('global-crash-recovery');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-crash-recovery';
        modal.className = 'fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 select-none';
        modal.innerHTML = `
          <div class="bg-white rounded-3xl p-6 sm:p-7 max-w-xs w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-3xl mb-3 shadow-xs">⚠️</div>
            <h3 class="font-bold text-base text-slate-800 mb-1">일시적인 오류가 발생했습니다.</h3>
            <p class="text-xs text-slate-500 leading-relaxed mb-5 font-medium">예기치 않은 문제가 발생했습니다.<br>페이지를 새로고침하거나 캐시를 초기화해 보세요.</p>
            <div class="w-full flex flex-col gap-2">
              <button id="crash-reload-btn" type="button" class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">refresh</span>
                <span>새로고침</span>
              </button>
              <button id="crash-reset-btn" type="button" class="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>캐시 비우고 다시 시작</span>
              </button>
            </div>
          </div>
        `;
        (document.body || document.documentElement).appendChild(modal);
      } else {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
      }

      document.getElementById('crash-reload-btn')?.addEventListener('click', () => window.location.reload());
      document.getElementById('crash-reset-btn')?.addEventListener('click', () => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if ('caches' in window) caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
        } catch (_) {}
        window.location.href = window.location.pathname + '?v=' + Date.now();
      });
    } catch (e) {
      console.error('Fatal crash recovery error:', e);
    }
  }

  window.addEventListener('error', function (event) {
    if (event.target && event.target !== window && ['IMG', 'LINK', 'SCRIPT', 'AUDIO', 'VIDEO'].includes(event.target.tagName)) return;
    if (event.message && (event.message.includes('ResizeObserver') || event.message.includes('Script error.'))) return;
    console.error('🚨 [VocaDash Global Error Caught]:', event.error || event.message);
    showEmergencyRecoveryModal(event.error || event.message);
  });

  window.addEventListener('unhandledrejection', function (event) {
    console.error('🚨 [VocaDash Unhandled Promise Rejection]:', event.reason);
    showEmergencyRecoveryModal(event.reason);
  });

  target.showEmergencyRecoveryModal = showEmergencyRecoveryModal;
})(typeof window !== 'undefined' ? window : this);

