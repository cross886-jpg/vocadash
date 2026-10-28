// js/roadmapRenderer.js - VocaDash Unit 2+ Dynamic Roadmap HTML Renderer
(function () {
  'use strict';

  // SVG Running Track Layer Generator
  function renderUnitTrackSvgHtml() {
    return `
      <!-- Curved Running Track SVG Layer -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200" fill="none" preserveAspectRatio="none" viewBox="0 0 380 960">
        <path d="M 110 70 C 110 160, 270 140, 270 230 C 270 320, 120 300, 120 390 C 120 480, 260 460, 260 550 C 260 640, 110 620, 110 710 C 110 805, 190 795, 190 880" stroke="#dae2fd" stroke-linecap="round" stroke-width="14"></path>
        <path d="M 110 70 C 110 160, 270 140, 270 230 C 270 320, 120 300, 120 390 C 120 480, 260 460, 260 550 C 260 640, 110 620, 110 710 C 110 805, 190 795, 190 880" stroke="#38bdf8" stroke-dasharray="8 10" stroke-linecap="round" stroke-width="4"></path>
      </svg>
    `;
  }

  function renderUnitNodeHtml(opt) {
    const { unitNum, stageNum, title, align, width, isCompleted, isActive, isLocked, nodeKey, nodeId } = opt;
    const resolvedId = nodeId || nodeKey || `u${unitNum}_stage-${stageNum}`;

    // 🛡️ [우선순위 방어] 잠금(isLocked)을 최우선으로 판정!
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const getNodeProg = (typeof window.getNodeProgress === 'function')
      ? window.getNodeProgress
      : ((typeof getNodeProgress === 'function') ? getNodeProgress : null);
    const nodeData = getNodeProg ? getNodeProg(resolvedId) : { clearedCount: 0, stars: 0 };
    const pCount = effectiveCompleted ? 3 : (effectiveActive ? (nodeData.clearedCount || 0) : 0);

    // 심플 별 3개 점등 생성 (글자 배제)
    const s1 = pCount >= 1 ? '⭐' : '<span class="opacity-30">⭐</span>';
    const s2 = pCount >= 2 ? '⭐' : '<span class="opacity-30">⭐</span>';
    const s3 = pCount >= 3 ? '⭐' : '<span class="opacity-30">⭐</span>';

    const btnClass = isLocked
      ? 'bg-slate-300 text-slate-500 font-black text-2xl border-b-4 border-slate-400 shadow-sm'
      : (effectiveCompleted
        ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white font-black text-2xl border-b-[5px] border-emerald-800 shadow-[0_6px_14px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/40'
        : (effectiveActive
          ? 'bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-black text-2xl border-b-[6px] border-blue-800 shadow-[0_8px_20px_rgba(2,132,199,0.45)] ring-4 ring-sky-300/70'
          : 'bg-slate-300 text-slate-500 font-black text-2xl border-b-4 border-slate-400 shadow-sm'));

    const esc = (typeof window.escapeHTML === 'function')
      ? window.escapeHTML
      : ((typeof escapeHTML === 'function') ? escapeHTML : (str) => String(str || ''));

    return `
      <div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : (effectiveActive ? 'active' : 'unlocked'))}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center my-1 node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[100px] h-[100px] rounded-full bg-sky-400/25 animate-ping pointer-events-none"></span>
            <span class="absolute w-[90px] h-[90px] rounded-full bg-sky-200/50 pointer-events-none"></span>
          ` : ''}

          <button class="subsequent-node-btn node-btn btn-3d relative ${effectiveActive ? 'w-[76px] h-[76px]' : 'w-[68px] h-[68px]'} rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden" type="button" title="${esc(title)}" data-unit-number="${unitNum}" data-node-type="stage" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <div class="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/35 blur-[0.5px] pointer-events-none"></div>
            <span class="node-stage-num ${effectiveActive ? 'text-sm font-extrabold tracking-tight' : 'font-black text-2xl'} select-none leading-none drop-shadow-xs relative z-10 text-white">${effectiveActive ? 'START' : stageNum}</span>
          </button>

          ${effectiveActive ? `
            <div class="node-badge-start absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}

          ${effectiveCompleted ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white pointer-events-none">
              <span class="material-symbols-outlined text-[15px] font-black">check</span>
            </div>
          ` : ''}

          ${isLocked ? `
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none">
              <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
            </div>
          ` : ''}
        </div>

        <!-- 심플 별 3개 캡슐 -->
        <div class="mt-2 flex items-center justify-center bg-white/95 px-3 py-1 rounded-full shadow-sm border ${effectiveCompleted ? 'border-emerald-300' : (effectiveActive ? 'border-2 border-sky-400 ring-2 ring-sky-100' : 'border-slate-200/60')} pointer-events-none ${isLocked ? 'opacity-80' : ''}">
          <div class="flex items-center gap-1">
            <span class="text-sm">${s1}</span>
            <span class="text-sm">${s2}</span>
            <span class="text-sm">${s3}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderUnitBonusHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-bonus`;

    // 🛡️ [우선순위 방어] 잠금(isLocked)을 최우선으로 판정!
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const btnClass = isLocked
      ? 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm'
      : (effectiveCompleted
        ? 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300/60'
        : 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-yellow-400 text-white border-b-[5px] border-amber-700 shadow-[0_6px_16px_rgba(245,158,11,0.4)] ring-4 ring-amber-300/80');

    return `
      <div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'bonus')}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center my-1 node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[94px] h-[94px] rounded-full bg-amber-400/25 animate-ping pointer-events-none"></span>
            <span class="absolute w-[86px] h-[86px] rounded-full bg-amber-200/50 pointer-events-none"></span>
          ` : ''}

          <button class="subsequent-node-btn node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="보너스 선물 상자" data-unit-number="${unitNum}" data-node-type="bonus" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <div class="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/40 blur-[0.5px] pointer-events-none"></div>
            <span class="text-3xl select-none leading-none drop-shadow-sm ${isLocked ? '' : (effectiveCompleted ? '' : (effectiveActive ? 'animate-bounce' : 'animate-wiggle'))} relative z-10">${isLocked ? '🎁' : (effectiveCompleted ? '📦' : '🎁')}</span>
          </button>

          ${isLocked ? `
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20">
              <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
            </div>
          ` : ''}

          ${effectiveActive ? `
            <div class="node-badge-start absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}
        </div>
        <!-- 심플 보너스 캡슐 -->
        <div class="mt-2 flex items-center justify-center bg-white/95 px-2.5 py-1 rounded-full shadow-sm border ${isLocked ? 'border-slate-200 opacity-60' : (effectiveCompleted ? 'border-slate-200 opacity-80' : (effectiveActive ? 'border-2 border-amber-400 ring-2 ring-amber-100' : 'border-amber-200'))} pointer-events-none">
          <div class="flex items-center gap-1">
            <span class="text-xs">${isLocked ? '🔒' : (effectiveCompleted ? '📦' : '🎁')}</span>
            <span class="text-[11px] ${isLocked ? 'text-slate-400' : (effectiveCompleted ? 'text-slate-500' : 'text-amber-600')} font-extrabold">${isLocked ? '잠김' : (effectiveCompleted ? '수령 완료' : '+15 💎')}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderUnitReviewHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-review`;

    // 🛡️ [우선순위 방어] 잠금(isLocked)을 최우선으로 판정!
    // 잠겨있는 상태라면 완료(isCompleted) 플래그가 어떻게 되어 있든 절대 초록색 체크(✔/✅)를 렌더링하지 않음!
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let reviewWrongCount = 0;
    if (typeof window.loadWrongWords === 'function') {
      const loaded = window.loadWrongWords(currentLang) || [];
      reviewWrongCount = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else if (Array.isArray(window.wrongWords)) {
      reviewWrongCount = window.wrongWords.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else {
      try {
        const getStorageKeyFn = (typeof window.getWrongStorageKey === 'function')
          ? window.getWrongStorageKey
          : ((typeof getWrongStorageKey === 'function') ? getWrongStorageKey : null);
        const storageKey = getStorageKeyFn ? getStorageKeyFn(currentLang) : `vocadash_wrong_answers_${currentLang}`;
        const raw = localStorage.getItem(storageKey) || localStorage.getItem(`vocadash_weakness_words_${currentLang}`) || (currentLang === 'es' ? localStorage.getItem('vocadash_wrong_words') : null);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            reviewWrongCount = parsed.filter(w => (w.lang || currentLang) === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
          }
        }
      } catch (_) { }
    }

    const reviewBadgeLabel = reviewWrongCount > 0
      ? `오답 탈출 (${reviewWrongCount})`
      : (effectiveCompleted ? '복습 완료' : '스피드 복습');
    const reviewBadgeIcon = (effectiveCompleted && reviewWrongCount === 0) ? '✅' : '⚡️';

    let btnClass = '';
    let btnIcon = '⚡️';

    if (isLocked) {
      btnClass = 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm';
      btnIcon = '⚡️';
    } else if (effectiveCompleted) {
      btnClass = 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300/60';
      btnIcon = '✅';
    } else if (effectiveActive) {
      btnClass = 'bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] ring-4 ring-orange-300/80';
      btnIcon = '⚡️';
    } else {
      btnClass = 'bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] ring-4 ring-orange-300/80';
      btnIcon = '⚡️';
    }

    return `
      <div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'review')}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center my-1 node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[94px] h-[94px] rounded-full bg-orange-400/25 animate-ping pointer-events-none"></span>
            <span class="absolute w-[86px] h-[86px] rounded-full bg-orange-200/50 pointer-events-none"></span>
          ` : ''}

          <button class="subsequent-node-btn node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="약점 복습 드릴" data-unit-number="${unitNum}" data-node-type="review" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <div class="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/35 blur-[0.5px] pointer-events-none"></div>
            <div class="relative flex items-center justify-center z-10">
              <span class="text-3xl select-none leading-none drop-shadow-sm">${btnIcon}</span>
              ${!isLocked && !effectiveCompleted ? '<span class="absolute -bottom-1 -right-1 text-sm">🩹</span>' : ''}
            </div>
          </button>

          ${isLocked ? `
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20">
              <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
            </div>
          ` : ''}

          ${effectiveActive ? `
            <div class="node-badge-start absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}
        </div>
        <!-- 심플 약점 복습 캡슐 (잠김 시 렌더링 생략) -->
        ${isLocked ? '' : `
        <div class="mt-2 flex items-center justify-center bg-white/95 px-2.5 py-1 rounded-full shadow-sm border ${effectiveCompleted && reviewWrongCount === 0 ? 'border-slate-200 opacity-85' : 'border-orange-200'} pointer-events-none">
          <div class="flex items-center gap-1">
            <span class="text-xs">${reviewBadgeIcon}</span>
            <span class="text-[11px] text-orange-600 font-extrabold">${reviewBadgeLabel}</span>
          </div>
        </div>
        `}
      </div>
    `;
  }

  function renderUnitBossHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-boss`;
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const btnClass = isLocked
      ? 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 shadow-sm ring-2 ring-slate-300'
      : (effectiveCompleted
        ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white border-b-[6px] border-emerald-800 shadow-xl ring-4 ring-emerald-300/70'
        : (effectiveActive
          ? 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-white border-b-[6px] border-amber-800 shadow-[0_8px_24px_rgba(245,158,11,0.5)] ring-4 ring-amber-300/90'
          : 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-white border-b-[6px] border-amber-800 shadow-xl ring-4 ring-amber-300/70'));

    return `
      <div class="roadmap-node relative z-20 flex flex-col items-center ${align} ${isLocked ? 'opacity-80' : ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : (effectiveActive ? 'active' : 'boss'))}" data-unit-index="${unitNum - 1}">
        <div class="relative flex items-center justify-center node-target cursor-pointer">
          ${effectiveActive ? `
            <span class="absolute w-[116px] h-[116px] rounded-full bg-amber-400/30 animate-ping pointer-events-none"></span>
            <span class="absolute w-[104px] h-[104px] rounded-full bg-amber-200/50 pointer-events-none"></span>
          ` : (!isLocked && !effectiveCompleted ? `
            <div class="absolute w-[104px] h-[104px] rounded-full bg-amber-400 blur-md opacity-80 animate-pulse pointer-events-none"></div>
          ` : '')}
          <button class="subsequent-node-btn node-btn btn-3d relative ${effectiveActive ? 'w-[96px] h-[96px]' : 'w-[92px] h-[92px]'} rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="보스전" data-unit-number="${unitNum}" data-node-type="boss" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}">
            <span class="text-[44px] select-none leading-none drop-shadow-md">👑</span>
            ${isLocked ? `
              <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-900/80 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none">
                <span class="material-symbols-outlined text-[13px] font-bold">lock</span>
              </div>
            ` : ''}
          </button>
          ${effectiveActive ? `
            <div class="node-badge-start absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse">
                <span>▶</span><span>START</span>
                <div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div>
              </div>
            </div>
          ` : ''}
          ${effectiveCompleted ? `
            <div class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-4 ring-white pointer-events-none">
              <span class="material-symbols-outlined text-[16px] font-black">check</span>
            </div>
          ` : ''}
        </div>
        <!-- 보스전 하단 미니 캡슐 -->
        <div class="mt-2.5 flex items-center justify-center px-3.5 py-1 rounded-full ${isLocked ? 'bg-slate-400 text-slate-200 shadow-sm' : (effectiveCompleted ? 'bg-emerald-600 text-white shadow-[0_2px_0_0_#065f46]' : 'bg-amber-500 text-white shadow-[0_2px_0_0_#b45309]')} text-center pointer-events-none font-black text-[11px] uppercase tracking-wide">
          <div class="flex items-center gap-1.5">
            <span class="text-xs">${isLocked ? '🔒' : (effectiveCompleted ? '👑' : '🔥')}</span>
            <span>${isLocked ? 'LOCKED' : (effectiveCompleted ? 'BOSS CLEAR!' : (effectiveActive ? 'START EXAM' : 'FINAL BOSS EXAM'))}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderSubsequentUnits(activeCourse, unlockedLevel) {
    const container = document.getElementById('roadmap-subsequent-units');
    if (!container) return;

    const getCourseDataFn = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData
      : ((typeof getCurrentCourseData === 'function') ? getCurrentCourseData : null);
    const course = activeCourse || (getCourseDataFn ? getCourseDataFn() : null);
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let units = (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS[lang])
      || (typeof UNIT_LIST_PRESETS !== 'undefined' && UNIT_LIST_PRESETS[lang])
      || (window.UNIT_LIST_PRESETS && window.UNIT_LIST_PRESETS.es)
      || [];
    if (course && Array.isArray(course.units) && course.units.length > 0) {
      units = course.units;
    }

    const totalUnits = units.length;
    let html = '';

    const esc = (typeof window.escapeHTML === 'function')
      ? window.escapeHTML
      : ((typeof escapeHTML === 'function') ? escapeHTML : (str) => String(str || ''));
    const isClaimedFn = (typeof window.isBonusClaimed === 'function')
      ? window.isBonusClaimed
      : ((typeof isBonusClaimed === 'function') ? isBonusClaimed : () => false);
    const isReviewCompletedFn = (typeof window.isReviewNodeCompleted === 'function')
      ? window.isReviewNodeCompleted
      : ((typeof isReviewNodeCompleted === 'function') ? isReviewNodeCompleted : () => false);
    const getNodeProgFn = (typeof window.getNodeProgress === 'function')
      ? window.getNodeProgress
      : ((typeof getNodeProgress === 'function') ? getNodeProgress : () => ({ clearedCount: 0, stars: 0 }));
    const isUnlockedFn = (typeof window.isNodeUnlocked === 'function')
      ? window.isNodeUnlocked
      : ((typeof isNodeUnlocked === 'function') ? isNodeUnlocked : () => true);

    for (let idx = 1; idx < totalUnits; idx++) {
      const unit = units[idx];
      const unitNum = idx + 1;
      const isCompleted = unitNum < unlockedLevel;
      const isActive = unitNum === unlockedLevel;
      const isLocked = unitNum > unlockedLevel;

      const unitIcon = unit.icon || (course?.id === 'pack_football' ? '⚽' : (lang === 'en' ? '🗽' : '🇪🇸'));
      const unitTitle = unit.title || `Unit ${unitNum}`;
      const unitDesc = unit.desc || unit.subtitle || '';

      // [유닛 구분 섹션 헤더 컴포넌트] (요구사항 마크업 정확히 일치)
      html += `
        <div class="unit-section-divider py-8 my-6 text-center select-none" data-unit-index="${idx}">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md">
            <span>${esc(unitIcon)}</span>
            <span>${esc(unitTitle)}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">${esc(unitDesc)}</p>
        </div>
      `;

      // 유닛별 노드 정보 추출 (표준 복합 키 네임스페이스 적용: u${unitNum}_...)
      const uNodes = (unit && Array.isArray(unit.nodes)) ? unit.nodes : [];
      const n1 = uNodes.find(n => n.type === 'stage' && (n.stageNumber === 1 || n.id?.endsWith('_n1'))) || { id: `u${unitNum}_stage-1`, title: `1과: ${unitTitle}`, type: 'stage' };
      const n2 = uNodes.find(n => n.type === 'stage' && (n.stageNumber === 2 || n.id?.endsWith('_n2'))) || { id: `u${unitNum}_stage-2`, title: `2과: ${unitDesc || '핵심 회화'}`, type: 'stage' };
      const nBonus = uNodes.find(n => n.type === 'bonus' || n.id?.endsWith('_n3')) || { id: `u${unitNum}_node-bonus`, title: '보너스 상자', type: 'bonus' };
      const nReview = uNodes.find(n => n.type === 'review' || n.id?.endsWith('_n4')) || { id: `u${unitNum}_node-review`, title: '약점 복습', type: 'review' };
      const n3 = uNodes.find(n => ((n.type === 'stage' && n.stageNumber === 3) || n.id?.endsWith('_n5') || (n.type === 'sentence' && !n.id?.includes('review') && !n.id?.endsWith('_n4')))) || { id: `u${unitNum}_stage-3`, title: '3과: 자기소개와 소통', type: 'stage' };
      const nBoss = uNodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6')) || { id: `u${unitNum}_node-boss`, title: `Unit ${unit.unitNumber || unitNum} 보스전`, type: 'boss' };

      const bonusId = nBonus.id || `u${unitNum}_node-bonus`;
      const reviewId = nReview.id || `u${unitNum}_node-review`;

      const isBonusDone = isClaimedFn(bonusId);
      const isReviewDone = isReviewCompletedFn(reviewId, unitNum);

      const n1Data = getNodeProgFn(n1.id || `u${unitNum}_stage-1`);
      const n2Data = getNodeProgFn(n2.id || `u${unitNum}_stage-2`);
      const n3Data = getNodeProgFn(n3.id || `u${unitNum}_stage-3`);
      const bossData = getNodeProgFn(nBoss.id || `u${unitNum}_node-boss`);

      // 노드별 잠금 해제 판정
      const isN1Unlocked = isUnlockedFn(idx, 0, n1, course);
      const isN2Unlocked = isN1Unlocked && (n1Data.clearedCount >= 3 || unitNum < unlockedLevel);
      const isBonusUnlocked = isN2Unlocked && (n2Data.clearedCount >= 3 || unitNum < unlockedLevel);
      const isReviewUnlocked = isBonusUnlocked && (isBonusDone || unitNum < unlockedLevel);
      const isN3Unlocked = isReviewUnlocked && (isReviewDone || unitNum < unlockedLevel);
      const isBossUnlocked = isN3Unlocked && (n3Data.clearedCount >= 3 || unitNum < unlockedLevel);

      // 활성 START 뱃지 판정 (가장 첫 번째로 미완료된 해금 노드에만 START 부여)
      const isN1Active = isN1Unlocked && n1Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isN2Active = !isN1Active && isN2Unlocked && n2Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isBonusActive = !isN1Active && !isN2Active && isBonusUnlocked && !isBonusDone && unitNum >= unlockedLevel;
      const isReviewActive = !isN1Active && !isN2Active && !isBonusActive && isReviewUnlocked && !isReviewDone && unitNum >= unlockedLevel;
      const isN3Active = !isN1Active && !isN2Active && !isBonusActive && !isReviewActive && isN3Unlocked && n3Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isBossActive = !isN1Active && !isN2Active && !isBonusActive && !isReviewActive && !isN3Active && isBossUnlocked && bossData.clearedCount < 1 && unitNum >= unlockedLevel;

      const bossTitle = nBoss.title || `Unit ${unit.unitNumber || unitNum} 보스전`;

      const renderNodeFn = window.renderUnitNodeHtml || renderUnitNodeHtml;
      const renderBonusFn = window.renderUnitBonusHtml || renderUnitBonusHtml;
      const renderReviewFn = window.renderUnitReviewHtml || renderUnitReviewHtml;
      const renderBossFn = window.renderUnitBossHtml || renderUnitBossHtml;
      const renderSvgFn = window.renderUnitTrackSvgHtml || renderUnitTrackSvgHtml;

      // 유닛 섹션 블록 컨테이너
      html += `
        <div class="unit-section-block relative w-full min-h-[960px] pb-6" data-unit-index="${idx}" id="unit-section-${idx}">
          ${renderSvgFn()}

          <!-- Node 1 -->
          ${renderNodeFn({
            unitNum,
            nodeKey: `u${unitNum}_stage-1`,
            nodeId: n1.id,
            type: 'stage',
            stageNum: 1,
            title: n1.title,
            align: 'ml-5 mb-11',
            width: '200px',
            isCompleted: (!isN1Unlocked) ? false : (n1Data.clearedCount >= 3 || unitNum < unlockedLevel),
            isActive: isN1Active,
            isLocked: !isN1Unlocked
          })}

          <!-- Node 2 -->
          ${renderNodeFn({
            unitNum,
            nodeKey: `u${unitNum}_stage-2`,
            nodeId: n2.id,
            type: 'stage',
            stageNum: 2,
            title: n2.title,
            align: 'ml-auto mr-5 mb-11',
            width: '210px',
            isCompleted: (!isN2Unlocked) ? false : (n2Data.clearedCount >= 3 || unitNum < unlockedLevel),
            isActive: isN2Active,
            isLocked: !isN2Unlocked
          })}

          <!-- Node Bonus -->
          ${renderBonusFn({
            unitNum,
            nodeKey: `u${unitNum}_node-bonus`,
            nodeId: bonusId,
            align: 'ml-7 mb-11',
            width: '170px',
            isCompleted: (!isBonusUnlocked) ? false : (isBonusDone || unitNum < unlockedLevel),
            isActive: isBonusActive,
            isLocked: !isBonusUnlocked
          })}

          <!-- Node Review -->
          ${renderReviewFn({
            unitNum,
            nodeKey: `u${unitNum}_node-review`,
            nodeId: reviewId,
            align: 'ml-auto mr-7 mb-11',
            width: '170px',
            isCompleted: (!isReviewUnlocked) ? false : (isReviewDone || unitNum < unlockedLevel),
            isActive: isReviewActive,
            isLocked: !isReviewUnlocked
          })}

          <!-- Node 3 -->
          ${renderNodeFn({
            unitNum,
            nodeKey: `u${unitNum}_stage-3`,
            nodeId: n3.id,
            type: 'stage',
            stageNum: 3,
            title: n3.title,
            align: 'ml-5 mb-14',
            width: '190px',
            isCompleted: (!isN3Unlocked) ? false : (n3Data.clearedCount >= 3 || unitNum < unlockedLevel),
            isActive: isN3Active,
            isLocked: !isN3Unlocked
          })}

          <!-- Node Boss -->
          ${renderBossFn({
            unitNum,
            nodeKey: `u${unitNum}_node-boss`,
            nodeId: nBoss.id,
            title: bossTitle,
            desc: `${unitTitle} 총정리 & 특별 보상`,
            align: 'mx-auto mb-6',
            width: '290px',
            isCompleted: (!isBossUnlocked) ? false : (bossData.clearedCount >= 1 || unitNum < unlockedLevel),
            isActive: isBossActive,
            isLocked: !isBossUnlocked
          })}
        </div>
      `;
    }

    container.innerHTML = html;

    // Subsequent nodes interaction handling
    container.querySelectorAll('.subsequent-node-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uNum = parseInt(btn.dataset.unitNumber, 10);
        const nType = btn.dataset.nodeType;
        const nId = btn.dataset.nodeId;
        const isLocked = btn.dataset.isLocked === 'true' || btn.getAttribute('data-is-locked') === 'true';

        // 🛑 잠겨있는 노드 클릭 차단
        if (isLocked) {
          if (nType === 'bonus') {
            if (typeof window.showToast === 'function') {
              window.showToast('🔒 1과와 2과를 모두 마스터해야 보너스 상자를 열 수 있어요! 🎁');
            } else {
              alert('1과와 2과를 모두 마스터해야 보너스 상자를 열 수 있어요! 🎁');
            }
            return;
          }
          // 일반 스테이지 잠김 -> Unit Skip Modal
          const targetUnitObj = units[uNum - 1];
          if (typeof window.openUnitSkipModal === 'function') {
            window.openUnitSkipModal(uNum, targetUnitObj?.title || `Unit ${uNum}`, lang);
          }
          return;
        }

        if (nType === 'bonus') {
          if (typeof window.openBonusModal === 'function') {
            window.openBonusModal(nId || `u${uNum}_node-bonus`);
          } else if (typeof openBonusModal === 'function') {
            openBonusModal(nId || `u${uNum}_node-bonus`);
          }
        } else if (nType === 'review') {
          if (typeof window.openReviewSpeedrunModal === 'function') {
            window.openReviewSpeedrunModal(uNum, nId || `u${uNum}_node-review`);
          } else if (typeof openReviewSpeedrunModal === 'function') {
            openReviewSpeedrunModal(uNum, nId || `u${uNum}_node-review`);
          }
        } else {
          // Unlocked node (stage or boss) -> start lesson!
          if (typeof window.openLessonModal === 'function') {
            window.openLessonModal(nId);
          } else if (typeof window.showToast === 'function') {
            window.showToast(`🚀 Unit ${uNum} (${btn.title || '레슨'}) 시작!`);
          }
        }
      });
    });
  }

  // =========================================================================
  // 🎯 활성 노드(START 노드) 정밀 탐색 및 즉각 중앙 배치 (Instant Snap Focus)
  // =========================================================================

  function isElementVisible(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains('hidden')) return false;
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return false;
    return true;
  }

  function isNodeCompleted(node) {
    if (!node) return false;
    if (node.dataset && node.dataset.nodeType === 'completed') return true;
    const checkBadge = node.querySelector ? (node.querySelector('[id$="-check-badge"]') || node.querySelector('.material-symbols-outlined')) : null;
    if (checkBadge && isElementVisible(checkBadge)) {
      const text = (checkBadge.textContent || '').trim();
      if (text === 'check' || checkBadge.id?.includes('check-badge')) return true;
    }
    const btn = node.querySelector ? node.querySelector('.node-btn') : null;
    if (btn && btn.title && (btn.title.includes('완료') || btn.classList.contains('from-emerald-400'))) {
      return true;
    }
    return false;
  }

  function isNodeLocked(node) {
    if (!node) return false;
    if (node.dataset && node.dataset.nodeType === 'locked' && !node.classList.contains('active')) return true;
    return false;
  }

  function getActiveRoadmapNodeElement() {
    const roadmapScreen = document.getElementById('roadmap-screen') || document;
    // ⚠️ [중요] 반드시 개별 노드 엘리먼트(.roadmap-node)만 탐색해야 함!
    const allNodes = Array.from(roadmapScreen.querySelectorAll('.roadmap-node'));

    // 1순위: '▶ START' 뱃지가 실제로 표시되어 있는 미완료 활성 노드
    // ⚠️ 절대 "방금 클리어한 노드"나 "초록색 체크(완료)된 노드"는 스크롤 타겟으로 삼지 않음!
    for (const node of allNodes) {
      if (isNodeCompleted(node) || isNodeLocked(node)) continue;

      // A) .node-badge-start 또는 [id$="-start-pill"] 뱃지가 가시 상태인 경우
      const startBadge = node.querySelector('.node-badge-start, [id$="-start-pill"]');
      if (startBadge && isElementVisible(startBadge)) {
        return node;
      }

      // B) .animate-pulse 내에 'START' 텍스트를 가진 뱃지가 가시 상태인 경우
      const pulseEl = node.querySelector('.animate-pulse');
      if (pulseEl && isElementVisible(pulseEl) && pulseEl.textContent.includes('START')) {
        return node;
      }

      // C) 버튼 안의 stage-num에 'START' 텍스트가 가시 상태인 경우 (예: 1번 노드)
      const stageNumEl = node.querySelector('.node-stage-num');
      if (stageNumEl && isElementVisible(stageNumEl) && stageNumEl.textContent.trim().toUpperCase() === 'START') {
        return node;
      }

      // D) .active 또는 .node-pulse 클래스를 보유하고 미완료인 경우
      if (node.classList.contains('active') || node.classList.contains('node-pulse') || node.dataset.nodeType === 'active') {
        return node;
      }
    }

    // 2순위: 1순위가 없을 경우 (전체 코스 완주/클리어 시), 가장 마지막 열린 노드 (잠기지 않은 노드 중 맨 뒤)
    const openNodes = allNodes.filter(n => !isNodeLocked(n));
    if (openNodes.length > 0) {
      return openNodes[openNodes.length - 1];
    }

    // 3순위: 신규 시작 시 첫 번째 노드 (u1_node-1 / node-1-container)
    return document.getElementById('u1_node-1') ||
      document.getElementById('node-1-container') ||
      (allNodes.length > 0 ? allNodes[0] : null);
  }

  function focusActiveRoadmapNode(explicitTarget) {
    const roadmapScreen = document.getElementById('roadmap-screen');
    // 로드맵 화면이 존재하지 않거나 숨겨져(hidden) 있다면 스크롤 스냅 생략
    if (roadmapScreen && (roadmapScreen.classList.contains('hidden') || roadmapScreen.style.display === 'none')) {
      return;
    }

    let targetNode = null;
    if (explicitTarget && typeof explicitTarget === 'object' && explicitTarget.nodeType) {
      targetNode = explicitTarget;
    } else {
      targetNode = getActiveRoadmapNodeElement();
    }
    if (!targetNode) return;

    const performSnap = () => {
      // 1) scrollIntoView (instant + center)
      try {
        if (typeof targetNode.scrollIntoView === 'function') {
          targetNode.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      } catch (_) {
        try {
          targetNode.scrollIntoView(true);
        } catch (_) {}
      }

      // 2) 고정 상단 헤더(roadmap-header) 및 하단 탭바(bottom-nav)를 고려한 정밀 가용 영역 중앙 정렬
      try {
        if (typeof targetNode.getBoundingClientRect === 'function') {
          const rect = targetNode.getBoundingClientRect();
          const header = document.getElementById('roadmap-header');
          const headerHeight = header ? (header.offsetHeight || 140) : 140;
          const nav = document.getElementById('bottom-nav') || document.querySelector('nav');
          const navHeight = nav ? (nav.offsetHeight || 70) : 70;
          const viewportHeight = window.innerHeight || 800;

          const visibleCenterY = headerHeight + ((viewportHeight - headerHeight - navHeight) / 2);
          const currentY = (typeof window.scrollY === 'number') ? window.scrollY : 0;
          const nodeCenterY = currentY + rect.top + (rect.height / 2);
          const scrollTargetY = Math.max(0, Math.round(nodeCenterY - visibleCenterY));

          if (typeof window.scrollTo === 'function') {
            window.scrollTo({
              top: scrollTargetY,
              behavior: 'instant'
            });
          }
        }
      } catch (_) {}
    };

    // 롤링 애니메이션 없이 0ms 즉각 배치
    performSnap();

    // 레이아웃 지연 대비 RAF 1회 보장
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(performSnap);
    }
  }

  // 전역 노출 바인딩
  window.renderUnitTrackSvgHtml = renderUnitTrackSvgHtml;
  window.renderUnitNodeHtml = renderUnitNodeHtml;
  window.renderUnitBonusHtml = renderUnitBonusHtml;
  window.renderUnitReviewHtml = renderUnitReviewHtml;
  window.renderUnitBossHtml = renderUnitBossHtml;
  window.renderSubsequentUnits = renderSubsequentUnits;
  window.getActiveRoadmapNodeElement = getActiveRoadmapNodeElement;
  window.focusActiveRoadmapNode = focusActiveRoadmapNode;
  window.autoScrollToActiveNode = focusActiveRoadmapNode;
})();

