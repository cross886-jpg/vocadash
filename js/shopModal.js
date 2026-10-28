// =============================================================================
// 🛍️ VocaDash 초경량 독립 상점 모달 (js/shopModal.js - 무조건 닫히는 최종본)
// =============================================================================
(function () {
  'use strict';

  const DEF_INV = { pass: 2, freeze: 1, bomb: 1, heal: 1 };
  const ITEMS = [
    { id: 'pass', name: '번개 패스', icon: '⚡', price: 15, desc: '어려운 위기 즉시 탈출', box: 'bg-amber-50 border-amber-100 text-amber-500' },
    { id: 'freeze', name: '절대 빙결', icon: '❄️', price: 20, desc: '5초간 카운트다운 멈춤', box: 'bg-sky-50 border-sky-100 text-sky-500' },
    { id: 'bomb', name: '단어 폭탄', icon: '💣', price: 25, desc: '오답 보기 2개 즉시 제거', box: 'bg-purple-50 border-purple-100 text-purple-600' },
    { id: 'heal', name: '하트 충전', icon: '❤️', price: 20, desc: '실수한 라이프 +1 즉시 회복', box: 'bg-rose-50 border-rose-100 text-rose-500' }
  ];

  const getInv = () => {
    try {
      const v = JSON.parse(localStorage.getItem('vocadash_inventory'));
      if (v && typeof v === 'object') return { pass: v.pass ?? 2, freeze: v.freeze ?? 1, bomb: v.bomb ?? 1, heal: v.heal ?? 1 };
    } catch (_) { }
    saveInv(DEF_INV);
    return { ...DEF_INV };
  };

  const saveInv = (inv) => {
    const clean = { pass: Math.min(5, Math.max(0, inv?.pass || 0)), freeze: Math.min(5, Math.max(0, inv?.freeze || 0)), bomb: Math.min(5, Math.max(0, inv?.bomb || 0)), heal: Math.min(5, Math.max(0, inv?.heal || 0)) };
    try { localStorage.setItem('vocadash_inventory', JSON.stringify(clean)); } catch (_) { }
    return clean;
  };

  const getGems = () => parseInt(localStorage.getItem('vocadash_gems') || '120', 10) || 0;
  const setGems = (n) => {
    const val = Math.max(0, n);
    try { localStorage.setItem('vocadash_gems', String(val)); } catch (_) { }
    ['header-gems-count', 'shop-gem-count', 'shop-modal-gems-count', 'stats-gems-count'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = id === 'header-gems-count' ? String(val) : `${val}개`;
    });
    return val;
  };

  const showToast = (msg, icon = '💎') => {
    let t = document.getElementById('vocadash-global-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'vocadash-global-toast';
      t.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[9999999] pointer-events-none transition-all duration-300 opacity-0 -translate-y-4';
      t.innerHTML = '<div class="px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white text-xs font-bold shadow-2xl flex items-center gap-2 max-w-sm text-center"><span id="global-toast-icon"></span><span id="global-toast-text"></span></div>';
      document.body.appendChild(t);
    }
    const txt = document.getElementById('global-toast-text'), ic = document.getElementById('global-toast-icon');
    if (txt) txt.textContent = msg; if (ic) ic.textContent = icon;
    t.classList.remove('opacity-0', '-translate-y-4'); t.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => { t.classList.remove('opacity-100', 'translate-y-0'); t.classList.add('opacity-0', '-translate-y-4'); }, 2000);
  };

  function handleBuy(id, pr) {
    const inv = getInv(), cur = getGems();
    if ((inv[id] || 0) >= 5) return showToast('최대 5개까지만 보유 가능합니다!', '⚠️');
    if (cur < pr) { showToast('보석이 부족합니다', '💎'); if (window.playSound) window.playSound('wrong'); return; }
    setGems(cur - pr);
    inv[id] = (inv[id] || 0) + 1;
    saveInv(inv);
    if (window.playSound) window.playSound('gem');
    renderCards();
    showToast('구매가 완료되었습니다!', '🛍️');
  }

  function renderCards() {
    const c = document.getElementById('shop-items-container');
    if (!c) return;
    const inv = getInv(); setGems(getGems());
    c.innerHTML = ITEMS.map(it => {
      const cnt = inv[it.id] ?? 0, isMax = cnt >= 5;
      return `<div class="flex flex-col justify-between h-full p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs select-none">
        <div>
          <div class="flex items-start justify-between w-full mb-2.5">
            <div class="w-10 h-10 rounded-xl border ${it.box} flex justify-center items-center text-xl shadow-2xs flex-shrink-0">${it.icon}</div>
            <span class="bg-slate-100 text-slate-600 font-semibold text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap">보유: ${cnt}</span>
          </div>
          <h3 class="font-bold text-sm text-slate-800 leading-tight">${it.name}</h3>
          <p class="text-xs text-slate-500 mt-1 leading-snug line-clamp-1">${it.desc}</p>
        </div>
        <button type="button" data-item-id="${it.id}" data-item-price="${it.price}" ${isMax ? 'disabled' : ''} class="shop-buy-btn w-full mt-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all select-none ${isMax ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-70 shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-white shadow-sm cursor-pointer'}">${isMax ? 'MAX' : `💎 ${it.price} 구매`}</button>
      </div>`;
    }).join('');
    c.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.onclick = () => handleBuy(btn.getAttribute('data-item-id'), parseInt(btn.getAttribute('data-item-price'), 10) || 0);
    });
  }

  function initModal() {
    let bd = document.getElementById('shop-modal-backdrop');
    if (bd) return bd;
    bd = document.createElement('div');
    bd.id = 'shop-modal-backdrop';
    bd.className = 'hidden fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none opacity-0 pointer-events-none transition-opacity duration-200';
    bd.style.pointerEvents = 'auto';

    bd.innerHTML = `<main id="shop-modal-card" style="pointer-events: auto; position: relative; z-index: 100000;" class="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl flex flex-col relative overflow-hidden pb-6 border border-slate-100">
      <div class="w-full pt-3 pb-1 flex justify-center"><div class="w-12 h-1.5 bg-slate-200 rounded-full"></div></div>
      <div class="px-5 py-3 flex items-center justify-between border-b border-slate-100 relative">
        <div class="flex items-center gap-2.5">
          <h2 id="shop-modal-title" class="text-lg font-bold text-slate-800">아이템 상점</h2>
          <div class="flex items-center gap-1 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-full text-sky-700 font-bold text-xs"><span>💎</span><span id="shop-modal-gems-count">120개</span><span id="shop-gem-count" class="hidden">120개</span></div>
        </div>
        <!-- 인라인 직접 호출로 레이어 간섭 완전 박멸 -->
        <button id="close-modal-btn" type="button" aria-label="닫기" onclick="event.preventDefault(); event.stopPropagation(); window.closeShopModal();" style="cursor: pointer !important; pointer-events: auto !important; position: relative; z-index: 100001;" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 active:scale-95 flex items-center justify-center">
          <span style="pointer-events: none;" class="material-symbols-outlined text-lg font-bold">close</span>
        </button>
      </div>
      <div class="px-5 pt-3 pb-1 text-xs text-slate-400">즉시 사용 가능</div>
      <div class="p-4 grid grid-cols-2 gap-3" id="shop-items-container"></div>
    </main>`;
    document.body.appendChild(bd);

    const closeBtn = document.getElementById('close-modal-btn') || (bd.querySelector && bd.querySelector('#close-modal-btn'));
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        window.closeShopModal();
      };
    }

    const card = document.getElementById('shop-modal-card') || (bd.querySelector && bd.querySelector('#shop-modal-card'));
    if (card) {
      card.onclick = (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      };
    }

    // 바깥 어두운 배경(Backdrop) 클릭 시 닫기
    bd.onclick = (e) => {
      if (e.target === bd) {
        window.closeShopModal();
      }
    };

    return bd;
  }

  function openShop() {
    if (window.isGameActive || window.isActive) return;
    const gs = document.getElementById('game-screen');
    if (gs && !gs.classList.contains('hidden')) return;
    const bd = initModal();
    renderCards();
    bd.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    bd.classList.add('opacity-100');
    bd.style.display = 'flex';
    bd.style.pointerEvents = 'auto';
    if (window.playSound) window.playSound('click');
  }

  function closeShop() {
    const bd = document.getElementById('shop-modal-backdrop');
    if (bd) {
      bd.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      bd.classList.remove('opacity-100');
      bd.style.display = 'none';
      bd.style.pointerEvents = 'none';
    }
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShop(); });
  document.addEventListener('click', (e) => { if (e.target?.closest?.('#header-gems-badge')) { e.preventDefault(); openShop(); } });

  window.openShopModal = openShop;
  window.closeShopModal = closeShop;
  window.getVocaInventory = getInv;
  window.saveVocaInventory = saveInv;
  window.getStoredGems = getGems;
  window.setStoredGems = setGems;
  window.showShopToast = showToast;
  window.showToast = showToast;
  window.renderShopItems = renderCards;
})();
