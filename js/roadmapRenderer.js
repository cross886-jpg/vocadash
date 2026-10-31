// js/roadmapRenderer.js - VocaDash Dynamic Roadmap Renderer
(function () {
  'use strict';

  // 챕터(Unit)별 점진적 고조 테마 팔레트 (7종 순환 마스터 테마)
  const UNIT_THEMES = [
    {
      // 1. Emerald (시작 / 안정)
      name: 'emerald',
      activeBtn: 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white font-black text-2xl border-b-[6px] border-emerald-800 shadow-[0_8px_20px_rgba(16,185,129,0.45)] ring-4 ring-emerald-300/70',
      pingBg: 'bg-emerald-400/25',
      pulseRingBg: 'bg-emerald-200/50',
      activeBorder: 'border-emerald-400 ring-2 ring-emerald-100',
      bannerBg: 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900',
      bannerBorder: 'border-emerald-700/50',
      bannerSubText: 'text-emerald-200',
      bannerDropdownBg: 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border-emerald-600/50',
      bannerGlow: 'bg-emerald-500/20',
      dividerBadge: 'bg-emerald-800 text-emerald-100'
    },
    {
      // 2. Teal (활력)
      name: 'teal',
      activeBtn: 'bg-gradient-to-b from-teal-400 via-teal-500 to-emerald-600 hover:from-teal-300 hover:to-emerald-500 text-white font-black text-2xl border-b-[6px] border-teal-800 shadow-[0_8px_20px_rgba(20,184,166,0.45)] ring-4 ring-teal-300/70',
      pingBg: 'bg-teal-400/25',
      pulseRingBg: 'bg-teal-200/50',
      activeBorder: 'border-teal-400 ring-2 ring-teal-100',
      bannerBg: 'bg-gradient-to-r from-teal-950 via-teal-900 to-cyan-950',
      bannerBorder: 'border-teal-700/50',
      bannerSubText: 'text-teal-200',
      bannerDropdownBg: 'bg-teal-800/80 hover:bg-teal-700 text-teal-100 border-teal-600/50',
      bannerGlow: 'bg-teal-500/20',
      dividerBadge: 'bg-teal-800 text-teal-100'
    },
    {
      // 3. Cyan / Sky (확장)
      name: 'cyan',
      activeBtn: 'bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white font-black text-2xl border-b-[6px] border-sky-800 shadow-[0_8px_20px_rgba(14,165,233,0.45)] ring-4 ring-sky-300/70',
      pingBg: 'bg-sky-400/25',
      pulseRingBg: 'bg-sky-200/50',
      activeBorder: 'border-sky-400 ring-2 ring-sky-100',
      bannerBg: 'bg-gradient-to-r from-cyan-950 via-sky-900 to-indigo-950',
      bannerBorder: 'border-sky-700/50',
      bannerSubText: 'text-sky-200',
      bannerDropdownBg: 'bg-sky-800/80 hover:bg-sky-700 text-sky-100 border-sky-600/50',
      bannerGlow: 'bg-sky-500/20',
      dividerBadge: 'bg-sky-800 text-sky-100'
    },
    {
      // 4. Indigo (도약)
      name: 'indigo',
      activeBtn: 'bg-gradient-to-b from-indigo-400 via-indigo-500 to-blue-700 hover:from-indigo-300 hover:to-indigo-600 text-white font-black text-2xl border-b-[6px] border-indigo-900 shadow-[0_8px_20px_rgba(99,102,241,0.45)] ring-4 ring-indigo-300/70',
      pingBg: 'bg-indigo-400/25',
      pulseRingBg: 'bg-indigo-200/50',
      activeBorder: 'border-indigo-400 ring-2 ring-indigo-100',
      bannerBg: 'bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950',
      bannerBorder: 'border-indigo-700/50',
      bannerSubText: 'text-indigo-200',
      bannerDropdownBg: 'bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 border-indigo-600/50',
      bannerGlow: 'bg-indigo-500/20',
      dividerBadge: 'bg-indigo-800 text-indigo-100'
    },
    {
      // 5. Violet / Purple (심화)
      name: 'purple',
      activeBtn: 'bg-gradient-to-b from-purple-400 via-violet-500 to-purple-700 hover:from-purple-300 hover:to-violet-600 text-white font-black text-2xl border-b-[6px] border-purple-900 shadow-[0_8px_20px_rgba(168,85,247,0.45)] ring-4 ring-purple-300/70',
      pingBg: 'bg-purple-400/25',
      pulseRingBg: 'bg-purple-200/50',
      activeBorder: 'border-purple-400 ring-2 ring-purple-100',
      bannerBg: 'bg-gradient-to-r from-purple-950 via-slate-900 to-fuchsia-950',
      bannerBorder: 'border-purple-700/50',
      bannerSubText: 'text-purple-200',
      bannerDropdownBg: 'bg-purple-800/80 hover:bg-purple-700 text-purple-100 border-purple-600/50',
      bannerGlow: 'bg-purple-500/20',
      dividerBadge: 'bg-purple-800 text-purple-100'
    },
    {
      // 6. Rose / Coral (열정)
      name: 'rose',
      activeBtn: 'bg-gradient-to-b from-rose-400 via-rose-500 to-pink-600 hover:from-rose-300 hover:to-pink-500 text-white font-black text-2xl border-b-[6px] border-rose-800 shadow-[0_8px_20px_rgba(244,63,94,0.45)] ring-4 ring-rose-300/70',
      pingBg: 'bg-rose-400/25',
      pulseRingBg: 'bg-rose-200/50',
      activeBorder: 'border-rose-400 ring-2 ring-rose-100',
      bannerBg: 'bg-gradient-to-r from-rose-950 via-slate-900 to-pink-950',
      bannerBorder: 'border-rose-700/50',
      bannerSubText: 'text-rose-200',
      bannerDropdownBg: 'bg-rose-800/80 hover:bg-rose-700 text-rose-100 border-rose-600/50',
      bannerGlow: 'bg-rose-500/20',
      dividerBadge: 'bg-rose-800 text-rose-100'
    },
    {
      // 7. Amber Gold (마스터 / 성취)
      name: 'amber',
      activeBtn: 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-white font-black text-2xl border-b-[6px] border-amber-800 shadow-[0_8px_20px_rgba(245,158,11,0.45)] ring-4 ring-amber-300/70',
      pingBg: 'bg-amber-400/25',
      pulseRingBg: 'bg-amber-200/50',
      activeBorder: 'border-amber-400 ring-2 ring-amber-100',
      bannerBg: 'bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950',
      bannerBorder: 'border-amber-700/50',
      bannerSubText: 'text-amber-200',
      bannerDropdownBg: 'bg-amber-800/80 hover:bg-amber-700 text-amber-100 border-amber-600/50',
      bannerGlow: 'bg-amber-500/20',
      dividerBadge: 'bg-amber-800 text-amber-100'
    }
  ];

  function getUnitTheme(unitNumber) {
    const uNum = Math.max(1, parseInt(unitNumber, 10) || 1);
    const idx = (uNum - 1) % UNIT_THEMES.length;
    return UNIT_THEMES[idx];
  }

  // 🐾 전용 고양이 발바닥 벡터 SVG 렌더러 (불투명 색상으로 통일)
  function renderSinglePawSvg(isActive) {
    const fill = isActive ? '#f59e0b' : '#cbd5e1';
    const glow = isActive ? 'filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.45)); transform: scale(1.15);' : 'transform: scale(1.0);';
    return `<div class="inline-flex items-center justify-center p-0.5" style="width: 18px; height: 18px;"><svg viewBox="0 0 44 42" class="transition-all duration-200" style="width: 100%; height: 100%; fill: ${fill}; ${glow}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="8.5" cy="13" rx="4.0" ry="5.6" transform="rotate(-26 8.5 13)"></ellipse><ellipse cx="17.2" cy="7.2" rx="4.3" ry="6.2" transform="rotate(-8 17.2 7.2)"></ellipse><ellipse cx="26.8" cy="7.2" rx="4.3" ry="6.2" transform="rotate(8 26.8 7.2)"></ellipse><ellipse cx="35.5" cy="13" rx="4.0" ry="5.6" transform="rotate(26 35.5 13)"></ellipse><path d="M 22 17.5 C 17.2 17.5 13.0 19.3 9.6 22.8 C 6.5 26.0 5.6 30.5 7.4 34.6 C 9.5 39.4 15.2 42.0 22 42.0 C 28.8 42.0 34.5 39.4 36.6 34.6 C 38.4 30.5 37.5 26.0 34.4 22.8 C 31.0 19.3 26.8 17.5 22 17.5 Z"></path></svg></div>`;
  }

  function renderPawBadge(prog) {
    const p = Math.max(0, Math.min(3, Number(prog) || 0));
    return `<div class="flex items-center justify-center gap-1.5 select-none py-0.5">${renderSinglePawSvg(p >= 1)}${renderSinglePawSvg(p >= 2)}${renderSinglePawSvg(p >= 3)}</div>`;
  }

  function renderStarsBadge(clearedCount, stars, isLocked) {
    if (isLocked) {
      return `<div class="flex items-center justify-center gap-1.5 select-none py-0.5">${renderSinglePawSvg(false)}${renderSinglePawSvg(false)}${renderSinglePawSvg(false)}</div>`;
    }
    const c = Math.max(0, Math.min(3, Number(clearedCount) || 0));
    const label = c >= 3
      ? '<span class="font-label-sm text-[10px] text-emerald-600 font-bold ml-1">완료!</span>'
      : (c > 0 ? `<span class="font-label-sm text-[10px] text-amber-600 font-black ml-1">${c}/3</span>` : '');
    return `<div class="flex items-center justify-center gap-1.5 select-none py-0.5">${renderSinglePawSvg(c >= 1)}${renderSinglePawSvg(c >= 2)}${renderSinglePawSvg(c >= 3)}${label}</div>`;
  }

  function renderUnitTrackSvgHtml() {
    return `<svg class="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200" fill="none" preserveAspectRatio="none" viewBox="0 0 380 960"><path d="M 110 70 C 110 160, 270 140, 270 230 C 270 320, 120 300, 120 390 C 120 480, 260 460, 260 550 C 260 640, 110 620, 110 710 C 110 805, 190 795, 190 880" stroke="#dae2fd" stroke-linecap="round" stroke-width="14"></path><path d="M 110 70 C 110 160, 270 140, 270 230 C 270 320, 120 300, 120 390 C 120 480, 260 460, 260 550 C 260 640, 110 620, 110 710 C 110 805, 190 795, 190 880" stroke="#38bdf8" stroke-dasharray="8 10" stroke-linecap="round" stroke-width="4"></path></svg>`;
  }

  function renderStartBadgeHtml(isActive) {
    if (!isActive) return '';
    return `<div class="node-badge-start absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center"><div class="relative px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 text-[10px] font-black rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.5)] border border-yellow-200 tracking-wider uppercase leading-none flex items-center gap-0.5 animate-pulse"><span>▶</span><span>START</span><div class="w-2 h-2 bg-yellow-400 border-r border-b border-yellow-500 absolute" style="bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);"></div></div></div>`;
  }

  function renderUnitNodeHtml(opt) {
    const { unitNum, stageNum, title, align, width, isCompleted, isActive, isLocked, nodeKey, nodeId } = opt;
    const resolvedId = nodeId || nodeKey || `u${unitNum}_stage-${stageNum}`;
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);
    const theme = getUnitTheme(unitNum);
    const getNodeProg = (typeof window.getNodeProgress === 'function') ? window.getNodeProgress : null;
    const nodeData = getNodeProg ? getNodeProg(resolvedId) : { clearedCount: 0, stars: 0 };
    const pCount = effectiveCompleted ? 3 : (effectiveActive ? (nodeData.clearedCount || 0) : 0);

    // 100% 불투명 솔리드 배경 적용
    const btnClass = isLocked
      ? 'bg-slate-200 text-slate-400 font-black text-2xl border-b-4 border-slate-300 shadow-sm pointer-events-none'
      : (effectiveCompleted || effectiveActive
        ? theme.activeBtn
        : 'bg-slate-200 text-slate-400 font-black text-2xl border-b-4 border-slate-300 shadow-sm');
    const esc = (typeof window.escapeHTML === 'function') ? window.escapeHTML : ((str) => String(str || ''));

    const isU1 = unitNum === 1;
    const containerIdAttr = isU1 ? `id="node-${stageNum}-container"` : '';
    const targetIdAttr = isU1 ? `id="node-${stageNum}-target"` : '';
    const btnIdAttr = isU1 ? `id="node-${stageNum}-btn"` : '';
    const checkIdAttr = isU1 ? `id="node-${stageNum}-check-badge"` : '';
    const lockIdAttr = isU1 ? `id="node-${stageNum}-lock-badge"` : '';
    const cardIdAttr = isU1 ? `id="node-${stageNum}-label-card"` : '';
    const badgeIdAttr = isU1 ? `id="node-${stageNum}-label-badge"` : '';
    const textColor = isLocked ? 'text-slate-400' : 'text-white';

    return `<div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-id="${resolvedId}" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : (effectiveActive ? 'active' : 'unlocked'))}" data-unit-index="${unitNum - 1}" ${containerIdAttr}>
      <div class="relative flex items-center justify-center my-1 node-target cursor-pointer" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : (effectiveActive ? 'active' : 'unlocked'))}" ${targetIdAttr}>
        ${effectiveActive ? `<span class="absolute w-[94px] h-[94px] rounded-full ${theme.pingBg} animate-ping pointer-events-none"></span><span class="absolute w-[86px] h-[86px] rounded-full ${theme.pulseRingBg} pointer-events-none"></span>` : ''}
        <button class="subsequent-node-btn node-btn btn-3d relative w-[72px] h-[72px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden" type="button" title="${esc(title || `${stageNum}과`)}" data-unit-number="${unitNum}" data-node-type="stage" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}" ${btnIdAttr}>
          <div class="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/40 blur-[0.5px] pointer-events-none"></div>
          <span class="node-stage-num font-black text-2xl select-none leading-none drop-shadow-xs relative z-10 ${textColor}">${stageNum}</span>
        </button>
        ${effectiveCompleted ? `<div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white pointer-events-none" ${checkIdAttr}><span class="material-symbols-outlined text-[15px] font-black">check</span></div>` : ''}
        ${isLocked ? `<div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20" ${lockIdAttr}><span class="material-symbols-outlined text-[13px] font-bold">lock</span></div>` : ''}
        ${renderStartBadgeHtml(effectiveActive)}
      </div>
      <div class="mt-2 flex items-center justify-center bg-white px-3 py-1 rounded-full shadow-sm border ${isLocked ? 'border-slate-200' : theme.activeBorder} pointer-events-none" ${cardIdAttr}>
        <div class="flex items-center gap-1" ${badgeIdAttr}>${renderPawBadge(pCount)}</div>
      </div>
    </div>`;
  }

  function renderUnitBonusHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-bonus`;
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const btnClass = isLocked
      ? 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 shadow-sm pointer-events-none'
      : (effectiveCompleted
        ? 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300'
        : 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-yellow-400 text-white border-b-[5px] border-amber-700 shadow-[0_6px_16px_rgba(245,158,11,0.4)] ring-4 ring-amber-300/80');

    const isU1 = unitNum === 1;
    const containerIdAttr = isU1 ? 'id="node-bonus-container"' : '';
    const targetIdAttr = isU1 ? 'id="node-bonus-target"' : '';
    const btnIdAttr = isU1 ? 'id="node-bonus-btn"' : '';
    const iconIdAttr = isU1 ? 'id="node-bonus-icon"' : '';
    const lockIdAttr = isU1 ? 'id="node-bonus-lock-badge"' : '';
    const cardIdAttr = isU1 ? 'id="node-bonus-label-card"' : '';
    const badgeIconIdAttr = isU1 ? 'id="node-bonus-badge-icon"' : '';
    const badgeTextIdAttr = isU1 ? 'id="node-bonus-badge-text"' : '';

    return `<div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-id="${resolvedId}" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'bonus')}" data-unit-index="${unitNum - 1}" ${containerIdAttr}>
      <div class="relative flex items-center justify-center my-1 node-target cursor-pointer" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'bonus')}" ${targetIdAttr}>
        ${effectiveActive ? '<span class="absolute w-[94px] h-[94px] rounded-full bg-amber-400/25 animate-ping pointer-events-none"></span><span class="absolute w-[86px] h-[86px] rounded-full bg-amber-200/50 pointer-events-none"></span>' : ''}
        <button class="subsequent-node-btn node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="보너스 선물 상자" data-unit-number="${unitNum}" data-node-type="bonus" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}" ${btnIdAttr}>
          <div class="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/40 blur-[0.5px] pointer-events-none"></div>
          <span class="text-3xl select-none leading-none drop-shadow-sm ${isLocked ? '' : (effectiveCompleted ? '' : (effectiveActive ? 'animate-bounce' : 'animate-wiggle'))} relative z-10" ${iconIdAttr}>${isLocked ? '🎁' : (effectiveCompleted ? '📦' : '🎁')}</span>
        </button>
        ${isLocked ? `<div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20" ${lockIdAttr}><span class="material-symbols-outlined text-[13px] font-bold">lock</span></div>` : ''}
        ${renderStartBadgeHtml(effectiveActive)}
      </div>
      <div class="mt-2 flex items-center justify-center bg-white px-2.5 py-1 rounded-full shadow-sm border ${isLocked ? 'border-slate-200' : (effectiveCompleted ? 'border-slate-200' : (effectiveActive ? 'border-2 border-amber-400 ring-2 ring-amber-100' : 'border-amber-200'))} pointer-events-none" ${cardIdAttr}>
        <div class="flex items-center gap-1"><span class="text-xs" ${badgeIconIdAttr}>${isLocked ? '🔒' : (effectiveCompleted ? '📦' : '🎁')}</span><span class="text-[11px] ${isLocked ? 'text-slate-400' : (effectiveCompleted ? 'text-slate-500' : 'text-amber-600')} font-extrabold" ${badgeTextIdAttr}>${isLocked ? '잠김' : (effectiveCompleted ? '수령 완료' : '+15 💎')}</span></div>
      </div>
    </div>`;
  }

  function renderUnitReviewHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || `u${unitNum}_node-review`;
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let reviewWrongCount = 0;
    if (typeof window.loadWrongWords === 'function') {
      const loaded = window.loadWrongWords(currentLang) || [];
      reviewWrongCount = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    } else if (Array.isArray(window.wrongWords)) {
      reviewWrongCount = window.wrongWords.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
    }

    const reviewBadgeLabel = reviewWrongCount > 0 ? `오답 탈출 (${reviewWrongCount})` : (effectiveCompleted ? '복습 완료' : '스피드 복습');
    const reviewBadgeIcon = (effectiveCompleted && reviewWrongCount === 0) ? '✅' : '⚡️';

    const btnClass = isLocked
      ? 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 shadow-sm pointer-events-none'
      : (effectiveCompleted
        ? 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300'
        : 'bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] ring-4 ring-orange-300/80');

    const isU1 = unitNum === 1;
    const containerIdAttr = isU1 ? 'id="node-review-container"' : '';
    const targetIdAttr = isU1 ? 'id="node-review-target"' : '';
    const btnIdAttr = isU1 ? 'id="node-review-btn"' : '';
    const iconIdAttr = isU1 ? 'id="node-review-icon"' : '';
    const lockIdAttr = isU1 ? 'id="node-review-lock-badge"' : '';
    const cardIdAttr = isU1 ? 'id="node-review-label-card"' : '';
    const badgeIconIdAttr = isU1 ? 'id="node-review-badge-icon"' : '';
    const badgeTextIdAttr = isU1 ? 'id="node-review-badge-text"' : '';

    return `<div class="roadmap-node relative z-10 flex flex-col items-center ${align} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width};" data-node-id="${resolvedId}" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'review')}" data-unit-index="${unitNum - 1}" ${containerIdAttr}>
      <div class="relative flex items-center justify-center my-1 node-target cursor-pointer" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'review')}" ${targetIdAttr}>
        ${effectiveActive ? '<span class="absolute w-[94px] h-[94px] rounded-full bg-orange-400/25 animate-ping pointer-events-none"></span><span class="absolute w-[86px] h-[86px] rounded-full bg-orange-200/50 pointer-events-none"></span>' : ''}
        <button class="subsequent-node-btn node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer" type="button" title="약점 복습 드릴" data-unit-number="${unitNum}" data-node-type="review" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}" ${btnIdAttr}>
          <div class="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/35 blur-[0.5px] pointer-events-none"></div>
          <div class="relative flex items-center justify-center z-10"><span class="text-3xl select-none leading-none drop-shadow-sm" ${iconIdAttr}>${effectiveCompleted ? '✅' : '⚡️'}</span>${!isLocked && !effectiveCompleted ? '<span class="absolute -bottom-1 -right-1 text-sm">🩹</span>' : ''}</div>
        </button>
        ${isLocked ? `<div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20" ${lockIdAttr}><span class="material-symbols-outlined text-[13px] font-bold">lock</span></div>` : ''}
        ${renderStartBadgeHtml(effectiveActive)}
      </div>
      ${isLocked ? '' : `<div class="mt-2 flex items-center justify-center bg-white px-2.5 py-1 rounded-full shadow-sm border ${effectiveCompleted && reviewWrongCount === 0 ? 'border-slate-200' : 'border-orange-200'} pointer-events-none" ${cardIdAttr}><div class="flex items-center gap-1"><span class="text-xs" ${badgeIconIdAttr}>${reviewBadgeIcon}</span><span class="text-[11px] text-orange-600 font-extrabold" ${badgeTextIdAttr}>${reviewBadgeLabel}</span></div></div>`}
    </div>`;
  }

  function renderUnitBossHtml(opt) {
    const { unitNum, align, width, isCompleted, isActive, isLocked, nodeId } = opt;
    const resolvedId = nodeId || (unitNum === 1 ? 'node-boss' : `u${unitNum}_node-boss`);
    const effectiveCompleted = isLocked ? false : !!isCompleted;
    const effectiveActive = isLocked ? false : (!effectiveCompleted && !!isActive);
    const theme = getUnitTheme(unitNum);

    const btnClass = isLocked
      ? 'bg-[#E2E8F0] border-2 border-slate-300 shadow-sm pointer-events-none'
      : (effectiveCompleted || effectiveActive
        ? theme.activeBtn
        : 'bg-slate-200 border-b-4 border-slate-300');

    const containerId = unitNum === 1 ? 'node-boss-container' : `u${unitNum}_node-boss-container`;
    const targetId = unitNum === 1 ? 'node-boss-target' : `u${unitNum}_node-boss-target`;
    const btnId = unitNum === 1 ? 'node-boss-btn' : `u${unitNum}_node-boss-btn`;
    const lockBadgeId = unitNum === 1 ? 'node-boss-lock-badge' : `u${unitNum}_node-boss-lock-badge`;
    const checkBadgeId = unitNum === 1 ? 'node-boss-check-badge' : `u${unitNum}_node-boss-check-badge`;
    const labelCardId = unitNum === 1 ? 'node-boss-label-card' : `u${unitNum}_node-boss-label-card`;
    const labelBadgeId = unitNum === 1 ? 'node-boss-label-badge' : `u${unitNum}_node-boss-label-badge`;

    return `<div class="roadmap-node relative z-20 flex flex-col items-center mx-auto mb-6 ${align || ''} ${effectiveActive ? 'active node-pulse' : ''}" style="width: ${width || '290px'};" data-node-id="${resolvedId}" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : 'boss')}" data-unit-index="${unitNum - 1}" id="${containerId}">
      <div class="relative flex items-center justify-center node-target ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}" data-node-type="${isLocked ? 'locked' : (effectiveCompleted ? 'completed' : (effectiveActive ? 'active' : 'unlocked'))}" id="${targetId}" data-lock-msg="1~3과를 모두 통과해야 보스전에 도전할 수 있어요!" data-lock-icon="👑">
        
        ${effectiveActive ? `<span class="absolute w-[94px] h-[94px] rounded-full ${theme.pingBg} animate-ping pointer-events-none"></span><span class="absolute w-[86px] h-[86px] rounded-full ${theme.pulseRingBg} pointer-events-none"></span>` : ''}

        <button class="node-btn relative w-[84px] h-[84px] rounded-full ${btnClass} flex items-center justify-center active:translate-y-1 transition-all ${isLocked ? '' : 'cursor-pointer'}" type="button" title="Unit ${unitNum} 보스전" data-unit-number="${unitNum}" data-node-type="boss" data-node-id="${resolvedId}" data-is-locked="${isLocked ? 'true' : 'false'}" id="${btnId}" ${isLocked ? 'disabled' : ''}>
          <span class="text-[34px] select-none leading-none drop-shadow-sm relative z-10">${effectiveCompleted ? '👑' : (isLocked ? '👑' : '🔥')}</span>
        </button>

        ${isLocked ? `<div class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#855B32] text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20" id="${lockBadgeId}"><span class="material-symbols-outlined text-[13px] font-bold">lock</span></div>` : ''}
        ${effectiveCompleted ? `<div class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-4 ring-white pointer-events-none z-20" id="${checkBadgeId}"><span class="material-symbols-outlined text-[16px] font-black">check</span></div>` : ''}
        ${renderStartBadgeHtml(effectiveActive)}
      </div>

      <div class="mt-2.5 flex items-center justify-center ${isLocked ? 'bg-white border-slate-200' : 'bg-gradient-to-r from-amber-500 to-orange-500 border-orange-400 shadow-md'} px-3 py-0.5 rounded-full border pointer-events-none shadow-xs" id="${labelCardId}">
        <span class="text-[11px] ${isLocked ? 'text-slate-500 font-bold' : 'text-white font-black'} tracking-wide flex items-center gap-1" id="${labelBadgeId}">
          ${isLocked ? '<span class="text-[11px]">🔒</span><span>3과 완료 후 해금</span>' : (effectiveCompleted ? '<span>👑</span><span>BOSS CLEAR!</span>' : '<span>🔥</span><span>FINAL BOSS EXAM</span>')}
        </span>
      </div>
    </div>`;
  }

  function renderSubsequentUnits(activeCourse, unlockedLevel) {
    const container = document.getElementById('roadmap-subsequent-units');
    const u1Container = document.getElementById('unit-1-nodes-container');

    const course = activeCourse
      || (typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null)
      || (window.activeCourseId === 'pack_football' ? window.packFootballData : null);
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const units = course?.units || window.UNIT_LIST_PRESETS?.[lang] || [];

    const esc = (typeof window.escapeHTML === 'function') ? window.escapeHTML : ((str) => String(str || ''));
    const isClaimedFn = (typeof window.isBonusClaimed === 'function') ? window.isBonusClaimed : () => false;
    const isReviewCompletedFn = (typeof window.isReviewNodeCompleted === 'function') ? window.isReviewNodeCompleted : () => false;
    const getNodeProgFn = (typeof window.getNodeProgress === 'function') ? window.getNodeProgress : () => ({ clearedCount: 0, stars: 0 });
    const isUnlockedFn = (typeof window.isNodeUnlocked === 'function') ? window.isNodeUnlocked : () => true;

    function buildUnitNodesHtml(idx, unit, isUnit1 = false) {
      const unitNum = idx + 1;
      const unitTitle = unit?.title || `Unit ${unitNum}`;
      const unitDesc = unit?.desc || unit?.subtitle || '';

      const uNodes = (unit && Array.isArray(unit.nodes)) ? unit.nodes : [];
      const n1 = uNodes.find(n => n.type === 'stage' && (n.stageNumber === 1 || n.id?.endsWith('_n1') || n.id === 'node-1')) || { id: isUnit1 ? 'node-1' : `u${unitNum}_stage-1`, title: `1과: ${unitTitle}`, type: 'stage' };
      const n2 = uNodes.find(n => n.type === 'stage' && (n.stageNumber === 2 || n.id?.endsWith('_n2') || n.id === 'node-2')) || { id: isUnit1 ? 'node-2' : `u${unitNum}_stage-2`, title: `2과: ${unitDesc || '핵심 회화'}`, type: 'stage' };
      const nBonus = uNodes.find(n => n.type === 'bonus' || n.id?.endsWith('_n3') || n.id === 'node-bonus') || { id: isUnit1 ? 'node-bonus' : `u${unitNum}_node-bonus`, title: '보너스 상자', type: 'bonus' };
      const nReview = uNodes.find(n => n.type === 'review' || n.id?.endsWith('_n4') || n.id === 'node-review') || { id: isUnit1 ? 'node-review' : `u${unitNum}_node-review`, title: '약점 복습', type: 'review' };
      const n3 = uNodes.find(n => ((n.type === 'stage' && n.stageNumber === 3) || n.id?.endsWith('_n5') || n.id === 'node-3' || (n.type === 'sentence' && !n.id?.includes('review') && !n.id?.endsWith('_n4')))) || { id: isUnit1 ? 'node-3' : `u${unitNum}_stage-3`, title: '3과: 자기소개와 소통', type: 'stage' };
      const nBoss = uNodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6') || n.id === 'node-boss') || { id: isUnit1 ? 'node-boss' : `u${unitNum}_node-boss`, title: `Unit ${unit?.unitNumber || unitNum} 보스전`, type: 'boss' };

      const bonusId = nBonus.id, reviewId = nReview.id;
      const isBonusDone = isClaimedFn(bonusId) || unitNum < unlockedLevel;
      const isReviewDone = isReviewCompletedFn(reviewId, unitNum) || unitNum < unlockedLevel;

      const n1Data = getNodeProgFn(n1.id), n2Data = getNodeProgFn(n2.id), n3Data = getNodeProgFn(n3.id), bossData = getNodeProgFn(nBoss.id);

      const isN1Unlocked = isUnit1 ? true : isUnlockedFn(idx, 0, n1, course);
      const isN2Unlocked = isN1Unlocked && (n1Data.clearedCount >= 3 || unitNum < unlockedLevel);
      const isBonusUnlocked = isN2Unlocked && (n2Data.clearedCount >= 3 || unitNum < unlockedLevel);
      const isReviewUnlocked = isBonusUnlocked && (isBonusDone || unitNum < unlockedLevel);
      const isN3Unlocked = isReviewUnlocked && (isReviewDone || unitNum < unlockedLevel);
      const isBossUnlocked = isN3Unlocked && (n3Data.clearedCount >= 3 || unitNum < unlockedLevel);

      const isN1Active = isN1Unlocked && n1Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isN2Active = !isN1Active && isN2Unlocked && n2Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isBonusActive = !isN1Active && !isN2Active && isBonusUnlocked && !isBonusDone && unitNum >= unlockedLevel;
      const isReviewActive = !isN1Active && !isN2Active && !isBonusActive && isReviewUnlocked && !isReviewDone && unitNum >= unlockedLevel;
      const isN3Active = !isN1Active && !isN2Active && !isBonusActive && !isReviewActive && isN3Unlocked && n3Data.clearedCount < 3 && unitNum >= unlockedLevel;
      const isBossActive = !isN1Active && !isN2Active && !isBonusActive && !isReviewActive && !isN3Active && isBossUnlocked && bossData.clearedCount < 1 && unitNum >= unlockedLevel;

      return `${renderUnitNodeHtml({ unitNum, stageNum: 1, title: n1.title, align: 'ml-5 mb-11', width: '200px', isCompleted: (!isN1Unlocked) ? false : (n1Data.clearedCount >= 3 || unitNum < unlockedLevel), isActive: isN1Active, isLocked: !isN1Unlocked, nodeId: n1.id })}`
        + `${renderUnitNodeHtml({ unitNum, stageNum: 2, title: n2.title, align: 'mr-7 ml-auto mb-11', width: '200px', isCompleted: (!isN2Unlocked) ? false : (n2Data.clearedCount >= 3 || unitNum < unlockedLevel), isActive: isN2Active, isLocked: !isN2Unlocked, nodeId: n2.id })}`
        + `${renderUnitBonusHtml({ unitNum, align: 'ml-6 mb-11', width: '170px', isCompleted: isBonusDone, isActive: isBonusActive, isLocked: !isBonusUnlocked, nodeId: bonusId })}`
        + `${renderUnitReviewHtml({ unitNum, align: 'ml-auto mr-7 mb-11', width: '170px', isCompleted: isReviewDone, isActive: isReviewActive, isLocked: !isReviewUnlocked, nodeId: reviewId })}`
        + `${renderUnitNodeHtml({ unitNum, stageNum: 3, title: n3.title, align: 'ml-6 mb-11', width: '210px', isCompleted: (!isN3Unlocked) ? false : (n3Data.clearedCount >= 3 || unitNum < unlockedLevel), isActive: isN3Active, isLocked: !isN3Unlocked, nodeId: n3.id })}`
        + `${renderUnitBossHtml({ unitNum, align: 'mx-auto mb-6', width: '290px', isCompleted: (!isBossUnlocked) ? false : (bossData.clearedCount >= 1 || unitNum < unlockedLevel), isActive: isBossActive, isLocked: !isBossUnlocked, nodeId: nBoss.id })}`;
    }

    if (u1Container && units.length > 0) {
      u1Container.innerHTML = buildUnitNodesHtml(0, units[0], true);
    }

    if (!container) return;

    let html = '';
    for (let idx = 1; idx < units.length; idx++) {
      const unit = units[idx], unitNum = idx + 1;
      const unitIcon = unit?.icon || (course?.id === 'pack_football' ? '⚽' : (lang === 'en' ? '🗽' : '🇪🇸'));
      const unitTitle = unit?.title || `Unit ${unitNum}`, unitDesc = unit?.desc || unit?.subtitle || '';
      const theme = getUnitTheme(unitNum);

      html += `<div class="unit-section-divider py-8 my-6 text-center select-none" data-unit-index="${idx}"><div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${theme.dividerBadge} text-xs font-bold shadow-md"><span>${esc(unitIcon)}</span><span>${esc(unitTitle)}</span></div><p class="text-xs text-slate-500 mt-1">${esc(unitDesc)}</p></div>`;
      html += `<div class="unit-section-block relative w-full min-h-[960px] pb-6" data-unit-index="${idx}" id="unit-section-${idx}">${renderUnitTrackSvgHtml()}${buildUnitNodesHtml(idx, unit, false)}</div>`;
    }

    container.innerHTML = html;
  }

  function isElementVisible(el) {
    return !!(el && !el.classList?.contains('hidden') && el.style?.display !== 'none' && el.style?.visibility !== 'hidden');
  }

  function isNodeCompleted(node) {
    if (!node) return false;
    if (node.dataset?.nodeType === 'completed') return true;
    const checkBadge = node.querySelector ? (node.querySelector('[id$="-check-badge"]') || node.querySelector('.material-symbols-outlined')) : null;
    if (checkBadge && isElementVisible(checkBadge)) {
      const text = (checkBadge.textContent || '').trim();
      if (text === 'check' || checkBadge.id?.includes('check-badge')) return true;
    }
    const btn = node.querySelector?.('.node-btn');
    return !!(btn && btn.title && (btn.title.includes('완료') || btn.classList.contains('from-emerald-400')));
  }

  function isNodeLocked(node) {
    return !!(node?.dataset?.nodeType === 'locked' && !node.classList.contains('active'));
  }

  function getActiveRoadmapNodeElement() {
    const roadmapScreen = document.getElementById('roadmap-screen') || document;
    const allNodes = Array.from(roadmapScreen.querySelectorAll('.roadmap-node'));
    for (const node of allNodes) {
      if (isNodeCompleted(node) || isNodeLocked(node)) continue;
      const startBadge = node.querySelector('.node-badge-start, [id$="-start-pill"]');
      if (startBadge && isElementVisible(startBadge)) return node;
      const pulseEl = node.querySelector('.animate-pulse');
      if (pulseEl && isElementVisible(pulseEl) && pulseEl.textContent.includes('START')) return node;
      const stageNumEl = node.querySelector('.node-stage-num');
      if (stageNumEl && isElementVisible(stageNumEl) && stageNumEl.textContent.trim().toUpperCase() === 'START') return node;
      if (node.classList.contains('active') || node.classList.contains('node-pulse') || node.dataset.nodeType === 'active') return node;
    }
    const openNodes = allNodes.filter(n => !isNodeLocked(n));
    return openNodes[openNodes.length - 1] || document.getElementById('u1_node-1') || document.getElementById('node-1-container') || allNodes[0] || null;
  }

  function focusActiveRoadmapNode(explicitTarget) {
    const roadmapScreen = document.getElementById('roadmap-screen');
    if (roadmapScreen && (roadmapScreen.classList.contains('hidden') || roadmapScreen.style.display === 'none')) return;
    const targetNode = (explicitTarget && typeof explicitTarget === 'object' && explicitTarget.nodeType) ? explicitTarget : getActiveRoadmapNodeElement();
    if (!targetNode) return;

    const performSnap = () => {
      try {
        if (typeof targetNode.scrollIntoView === 'function') targetNode.scrollIntoView({ behavior: 'instant', block: 'center' });
      } catch (_) { try { targetNode.scrollIntoView(true); } catch (_) { } }
      try {
        if (typeof targetNode.getBoundingClientRect === 'function') {
          const rect = targetNode.getBoundingClientRect(), headerHeight = document.getElementById('roadmap-header')?.offsetHeight || 140, navHeight = document.getElementById('bottom-nav')?.offsetHeight || 70;
          const visibleCenterY = headerHeight + (((window.innerHeight || 800) - headerHeight - navHeight) / 2), currentY = window.scrollY || 0;
          if (typeof window.scrollTo === 'function') window.scrollTo({ top: Math.max(0, Math.round(currentY + rect.top + (rect.height / 2) - visibleCenterY)), behavior: 'instant' });
        }
      } catch (_) { }
    };
    performSnap();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(performSnap);
  }

  let _lastRenderedBannerUnitIndex = null;
  let _bannerFadeTimeout = null;

  function updateTopUnitBanner(activeIdx, force = false) {
    const course = (typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null)
      || (window.activeCourseId === 'pack_football' ? window.packFootballData : null);
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';

    const units = course?.units || window.UNIT_LIST_PRESETS?.[lang] || [];
    const totalUnits = units.length || 1;
    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang) : 1;
    const targetIdx = (typeof activeIdx === 'number' && !isNaN(activeIdx))
      ? Math.max(0, Math.min(totalUnits - 1, activeIdx))
      : (window._currentVisibleUnitIndex ?? Math.max(0, Math.min(totalUnits - 1, unlockedLevel - 1)));

    if (!force && _lastRenderedBannerUnitIndex === targetIdx) {
      return;
    }
    _lastRenderedBannerUnitIndex = targetIdx;

    const targetUnit = units[targetIdx] || units[0];
    if (!targetUnit) return;
    const unitNum = targetIdx + 1;

    const subBadgeEl = document.getElementById('unit-sub-badge');
    const mainTitleEl = document.getElementById('unit-main-title');
    const langBadgeEl = document.getElementById('unit-lang-badge');
    const bannerContent = document.getElementById('unit-banner-content');
    const bannerEl = document.getElementById('unit-banner');

    const applyContentAndTheme = () => {
      if (subBadgeEl) subBadgeEl.textContent = `UNIT ${unitNum} / ${totalUnits}`;
      if (mainTitleEl) mainTitleEl.textContent = targetUnit.title || `Unit ${unitNum}`;
      if (langBadgeEl) langBadgeEl.textContent = targetUnit.subtitle || (lang === 'en' ? '영어 정규 코스' : '스페인어 첫걸음');

      const badgeEl = document.getElementById('top-unit-badge-text'); if (badgeEl) badgeEl.textContent = `UNIT ${unitNum}`;
      const titleEl = document.getElementById('top-unit-title'); if (titleEl) titleEl.textContent = targetUnit.title || `Unit ${unitNum}`;
      const descEl = document.getElementById('top-unit-desc'); if (descEl) descEl.textContent = targetUnit.desc || targetUnit.subtitle || '';

      if (bannerEl) {
        const theme = getUnitTheme(unitNum);
        UNIT_THEMES.forEach(t => {
          bannerEl.classList.remove(...t.bannerBg.split(' '), ...t.bannerBorder.split(' '));
        });
        bannerEl.classList.add(...theme.bannerBg.split(' '), ...theme.bannerBorder.split(' '));

        if (subBadgeEl) {
          UNIT_THEMES.forEach(t => subBadgeEl.classList.remove(t.bannerSubText));
          subBadgeEl.classList.add(theme.bannerSubText);
        }

        const dropBtn = document.getElementById('unit-dropdown-btn');
        if (dropBtn) {
          UNIT_THEMES.forEach(t => dropBtn.classList.remove(...t.bannerDropdownBg.split(' ')));
          dropBtn.classList.add(...theme.bannerDropdownBg.split(' '));
        }

        const bannerGlow = bannerEl.querySelector('.rounded-full.blur-xl');
        if (bannerGlow) {
          UNIT_THEMES.forEach(t => bannerGlow.classList.remove(t.bannerGlow));
          bannerGlow.classList.add(theme.bannerGlow);
        }
      }

      if (bannerContent) {
        bannerContent.style.opacity = '1';
      }
    };

    if (bannerContent && !force) {
      bannerContent.style.opacity = '0.4';
      if (_bannerFadeTimeout) clearTimeout(_bannerFadeTimeout);
      _bannerFadeTimeout = setTimeout(() => {
        applyContentAndTheme();
        _bannerFadeTimeout = null;
      }, 75);
    } else {
      applyContentAndTheme();
    }
  }

  function switchToUnit(unitNumber) {
    const uNum = Math.max(1, Math.min(10, parseInt(unitNumber, 10) || 1));
    const activeIdx = uNum - 1;
    window._currentVisibleUnitIndex = activeIdx;
    window.currentUnitNumber = uNum;
    updateTopUnitBanner(activeIdx);

    if (uNum === 1) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const targetSection = document.querySelector(`.unit-section-block[data-unit-index="${activeIdx}"]`);
    if (targetSection) {
      const activeNode = targetSection.querySelector('.roadmap-node.active, .node-target[data-node-type="active"]') || targetSection.querySelector('.roadmap-node');
      if (activeNode && typeof focusActiveRoadmapNode === 'function') {
        focusActiveRoadmapNode(activeNode);
      } else {
        const headerHeight = document.getElementById('roadmap-header')?.offsetHeight || 140;
        const rect = targetSection.getBoundingClientRect();
        const top = (window.scrollY || 0) + rect.top - headerHeight - 12;
        window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'instant' });
      }
    }
  }

  function updateRoadmapNodesUI() {
    if (typeof window.migrateLegacyReviewData === 'function') window.migrateLegacyReviewData();
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let currentCoursePack = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + currentLang) : null) || 'main';
    currentCoursePack = (currentCoursePack === 'pack_football') ? 'pack_football' : 'main';

    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(currentLang, currentCoursePack) : 1;
    updateTopUnitBanner((window._currentVisibleUnitIndex !== undefined) ? window._currentVisibleUnitIndex : (unlockedLevel - 1));

    if (!window.nodeProgressMap) window.nodeProgressMap = {};

    const readProgForNode = (nIndex) => {
      const stdKey = `vocadash_prog_${currentLang}_${currentCoursePack}_u1_n${nIndex}`;
      let c = 0;
      try {
        const raw = localStorage.getItem(stdKey);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          c = typeof parsed === 'number' ? parsed : (parsed?.clearedCount ?? 0);
        }
      } catch (_) { }
      if (c === 0) {
        let rawAlt = localStorage.getItem(`node_progress_${currentLang}_${currentCoursePack}_node-${nIndex}`) || localStorage.getItem(`node_progress_${currentLang}_${currentCoursePack}_u1_node-${nIndex}`);
        if (!rawAlt && currentCoursePack === 'main' && currentLang === 'es' && nIndex === 3) rawAlt = localStorage.getItem(`u1_node-${nIndex}`) || localStorage.getItem(`u1_stage-${nIndex}`);
        if (rawAlt !== null && rawAlt !== undefined) {
          const numAlt = parseInt(rawAlt, 10);
          if (!isNaN(numAlt)) c = numAlt;
        }
        if (c === 0 && window.nodeProgressMap) c = Number(window.nodeProgressMap[`u1_node-${nIndex}`] || window.nodeProgressMap[`node-${nIndex}`] || 0);
      }
      return Math.max(0, Math.min(3, c));
    };

    const isUnit1Completed = unlockedLevel > 1 || (typeof window.isUnitCompleted === 'function' && window.isUnitCompleted(1)) || (Array.isArray(window.completedUnits) && window.completedUnits.includes(1));

    const prog1 = isUnit1Completed ? Math.max(3, readProgForNode(1)) : readProgForNode(1);
    const prog2 = isUnit1Completed ? Math.max(3, readProgForNode(2)) : ((prog1 >= 3) ? readProgForNode(2) : 0);
    const prog3 = isUnit1Completed ? Math.max(3, readProgForNode(3)) : ((prog2 >= 3) ? readProgForNode(3) : 0);
    const progBoss = isUnit1Completed ? Math.max(1, readProgForNode(6)) : ((prog3 >= 3) ? readProgForNode(6) : 0);

    [1, 2, 3].forEach(n => {
      const val = n === 1 ? prog1 : (n === 2 ? prog2 : prog3);
      window.nodeProgressMap[`node-${n}`] = val;
      window.nodeProgressMap[`u1_node-${n}`] = val;
      window.nodeProgressMap[`${currentLang}_${currentCoursePack}_u1_n${n}`] = val;
    });
    window.nodeProgressMap['node-boss'] = progBoss;
    window.nodeProgressMap['u1_node-boss'] = progBoss;
    window.nodeProgressMap[`${currentLang}_${currentCoursePack}_u1_n6`] = progBoss;

    const isBonusDone = isUnit1Completed || ((typeof window.isBonusClaimed === 'function') && (window.isBonusClaimed('node-bonus') || window.isBonusClaimed('u1_node-bonus')));
    const isReviewDone = isUnit1Completed || ((typeof window.isReviewNodeCompleted === 'function') && (window.isReviewNodeCompleted('u1_node-review', 1) || window.isReviewNodeCompleted('node-review', 1)));

    const currentCourseLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const unitIndex = typeof window.currentUnitIndex === 'number' ? window.currentUnitIndex : 0;
    const currentTheme = getUnitTheme(1);

    const safeUnitCompleted = typeof isUnit1Completed === 'boolean'
      ? (isUnit1Completed && (window.lastCompletedCourseLang === currentCourseLang))
      : false;
    const safeBonusDone = typeof isBonusDone === 'boolean'
      ? (isBonusDone && (localStorage.getItem(`vocadash_${currentCourseLang}_bonus_u${unitIndex + 1}`) === 'done'))
      : false;
    const safeReviewDone = typeof isReviewDone === 'boolean'
      ? (isReviewDone && (localStorage.getItem(`vocadash_${currentCourseLang}_review_u${unitIndex + 1}`) === 'done'))
      : false;

    const bonusClaimed = Boolean(isBonusDone || safeBonusDone || localStorage.getItem(`vocadash_${currentCourseLang}_bonus_u${unitIndex + 1}`) === 'done');
    const reviewCompleted = Boolean(isReviewDone || safeReviewDone || localStorage.getItem(`vocadash_${currentCourseLang}_review_u${unitIndex + 1}`) === 'done');

    const isNode1Unlocked = true;
    const isNode2Unlocked = safeUnitCompleted || (prog1 >= 3);
    const isBonusUnlocked = safeUnitCompleted || (prog2 >= 3);
    const isReviewUnlocked = safeUnitCompleted || (isBonusUnlocked && bonusClaimed);
    const isNode3Unlocked = safeUnitCompleted || (isReviewUnlocked && reviewCompleted);
    const isBossUnlocked = safeUnitCompleted || (prog3 >= 3);

    const isNode1Active = !safeUnitCompleted && (prog1 < 3);
    const isNode2Active = !safeUnitCompleted && (!isNode1Active && prog2 < 3);
    const isBonusActive = !safeUnitCompleted && (!isNode1Active && !isNode2Active && isBonusUnlocked && !bonusClaimed);
    const isReviewActive = !safeUnitCompleted && (!isNode1Active && !isNode2Active && !isBonusActive && isReviewUnlocked && !reviewCompleted);
    const isNode3Active = !safeUnitCompleted && (!isNode1Active && !isNode2Active && !isBonusActive && !isReviewActive && isNode3Unlocked && prog3 < 3);
    const isBossActive = !safeUnitCompleted && (!isNode1Active && !isNode2Active && !isBonusActive && !isReviewActive && !isNode3Active && isBossUnlocked && progBoss < 1);

    const el = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
    const setVis = (node, isVisible) => {
      if (!node) return;
      node.classList.toggle('hidden', !isVisible);
      node.style.display = isVisible ? 'flex' : 'none';
    };

    // 1. Unit 1 Stage Nodes (1과, 2과, 3과) - Unit 2~4와 100% 동일한 불투명 솔리드 규격 적용
    [
      { n: 1, c: prog1, isL: false, isC: safeUnitCompleted || prog1 >= 3, isA: isNode1Active },
      { n: 2, c: prog2, isL: !isNode2Unlocked, isC: safeUnitCompleted || prog2 >= 3, isA: isNode2Active },
      { n: 3, c: prog3, isL: !isNode3Unlocked, isC: safeUnitCompleted || prog3 >= 3, isA: isNode3Active }
    ].forEach(({ n, c, isL, isC, isA }) => {
      const nid = `node-${n}`;
      const container = el(`${nid}-container`) || document.querySelector(`[data-node-id="${nid}"]`);
      const target = el(`${nid}-target`) || container?.querySelector('.node-target');
      const ping = el(`${nid}-ping`) || container?.querySelector(`[id$="-ping"]`);
      const pulseRing = el(`${nid}-pulse-ring`) || container?.querySelector(`[id$="-pulse-ring"]`);
      const startPill = el(`${nid}-start-pill`) || container?.querySelector(`[id$="-start-pill"]`);
      const checkBadge = el(`${nid}-check-badge`) || container?.querySelector(`[id$="-check-badge"]`);
      const lockBadge = el(`${nid}-lock-badge`) || container?.querySelector(`[id$="-lock-badge"]`);
      const btn = el(`${nid}-btn`) || container?.querySelector('.node-btn');
      const card = el(`${nid}-label-card`) || container?.querySelector(`[id$="-label-card"]`);
      const badge = el(`${nid}-label-badge`) || card?.querySelector(`[id$="-label-badge"]`);

      if (container) {
        container.classList.toggle('active', isA);
        container.classList.toggle('node-pulse', isA);
        container.classList.remove('opacity-80', 'opacity-60'); // [핵심] 투명도 강제 제거
        container.dataset.nodeType = isL ? 'locked' : (isC ? 'completed' : (isA ? 'active' : 'unlocked'));
      }
      if (ping) ping.classList.toggle('hidden', !isA);
      if (pulseRing) pulseRing.classList.toggle('hidden', !isA);
      setVis(startPill, isA);
      setVis(checkBadge, isC);
      setVis(lockBadge, isL);

      if (target) target.dataset.nodeType = isL ? 'locked' : (isC ? 'completed' : (isA ? 'active' : 'unlocked'));

      if (btn) {
        const btnStateClass = isL
          ? 'bg-slate-200 text-slate-400 font-black text-2xl border-b-4 border-slate-300 shadow-sm pointer-events-none'
          : (isC || isA
            ? currentTheme.activeBtn
            : 'bg-slate-200 text-slate-400 font-black text-2xl border-b-4 border-slate-300 shadow-sm');
        btn.className = `node-btn btn-3d relative w-[72px] h-[72px] rounded-full ${btnStateClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer overflow-hidden`;
        btn.title = isL ? `${n}과: 잠김` : (isC ? `${n}과 (완료)` : `${n}과`);
        btn.dataset.isLocked = isL ? 'true' : 'false';

        const numSpan = btn.querySelector('.node-stage-num');
        if (numSpan) {
          numSpan.textContent = String(n);
          numSpan.className = `node-stage-num font-black text-2xl select-none leading-none drop-shadow-xs relative z-10 ${isL ? 'text-slate-400' : 'text-white'}`;
        }
      }

      if (card) {
        card.className = `mt-2 flex items-center justify-center bg-white px-3 py-1 rounded-full shadow-sm border ${isL ? 'border-slate-200' : currentTheme.activeBorder} pointer-events-none`;
      }

      if (badge) badge.innerHTML = renderPawBadge(c);
    });

    // 2. Bonus Node (Unit 2~4와 100% 동일한 불투명 솔리드 규격)
    const bCont = el('node-bonus-container'), bTgt = el('node-bonus-target'), bBtn = el('node-bonus-btn'), bIco = el('node-bonus-icon'), bTxt = el('node-bonus-badge-text'), bCard = el('node-bonus-label-card'), bPill = el('node-bonus-start-pill');
    let bLock = el('node-bonus-lock-badge');
    if (!bLock && bTgt) {
      bLock = document.createElement('div');
      bLock.id = 'node-bonus-lock-badge';
      bLock.className = 'absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20';
      bLock.innerHTML = '<span class="material-symbols-outlined text-[13px] font-bold">lock</span>';
      bTgt.appendChild(bLock);
    }
    if (bCont) {
      bCont.classList.toggle('active', isBonusActive);
      bCont.classList.toggle('node-pulse', isBonusActive);
      bCont.classList.remove('opacity-80', 'opacity-60'); // [핵심] 투명도 강제 제거
      bCont.dataset.nodeType = !isBonusUnlocked ? 'locked' : (isBonusDone ? 'completed' : 'bonus');
    }
    setVis(bPill, isBonusActive);
    setVis(bLock, !isBonusUnlocked);
    if (bTgt) bTgt.dataset.nodeType = !isBonusUnlocked ? 'locked' : (isBonusDone ? 'completed' : (isBonusActive ? 'active' : 'bonus'));
    if (bBtn) {
      const bBtnClass = !isBonusUnlocked
        ? 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 shadow-sm pointer-events-none'
        : (isBonusDone
          ? 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300'
          : 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-yellow-400 text-white border-b-[5px] border-amber-700 shadow-[0_6px_16px_rgba(245,158,11,0.4)] ring-4 ring-amber-300/80');
      bBtn.className = `node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${bBtnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer`;
      bBtn.title = !isBonusUnlocked ? '보너스 선물 (잠김)' : (isBonusDone ? '보너스 선물 (수령 완료)' : '보너스 선물 상자 (열기)');
      bBtn.dataset.isLocked = !isBonusUnlocked ? 'true' : 'false';
    }
    if (bIco) {
      bIco.textContent = !isBonusUnlocked ? '🎁' : (isBonusDone ? '📦' : '🎁');
      bIco.className = `text-3xl select-none leading-none drop-shadow-sm ${!isBonusUnlocked ? '' : (isBonusDone ? '' : (isBonusActive ? 'animate-bounce' : 'animate-wiggle'))} relative z-10`;
    }
    if (el('node-bonus-badge-icon')) el('node-bonus-badge-icon').textContent = !isBonusUnlocked ? '🔒' : (isBonusDone ? '📦' : '🎁');
    if (bTxt) {
      bTxt.textContent = !isBonusUnlocked ? '잠김' : (isBonusDone ? '수령 완료' : '+15 💎');
      bTxt.className = `text-[11px] ${!isBonusUnlocked ? 'text-slate-400' : (isBonusDone ? 'text-slate-500' : 'text-amber-600')} font-extrabold`;
    }
    if (bCard) {
      bCard.className = `mt-2 flex items-center justify-center bg-white px-2.5 py-1 rounded-full shadow-sm border ${!isBonusUnlocked ? 'border-slate-200' : (isBonusDone ? 'border-slate-200' : (isBonusActive ? 'border-2 border-amber-400 ring-2 ring-amber-100' : 'border-amber-200'))} pointer-events-none`;
    }

    // 3. Review Node (Unit 2~4와 100% 동일한 불투명 솔리드 규격)
    const rCont = el('node-review-container'), rTgt = el('node-review-target'), rBtn = el('node-review-btn'), rIco = el('node-review-icon'), rTxt = el('node-review-badge-text'), rCard = el('node-review-label-card'), rCheck = el('node-review-check-badge'), rPill = el('node-review-start-pill'), rExcl = el('node-review-excl');
    let rLock = el('node-review-lock-badge');
    if (!rLock && rTgt) {
      rLock = document.createElement('div');
      rLock.id = 'node-review-lock-badge';
      rLock.className = 'absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs ring-2 ring-white pointer-events-none z-20';
      rLock.innerHTML = '<span class="material-symbols-outlined text-[13px] font-bold">lock</span>';
      rTgt.appendChild(rLock);
    }

    let reviewWrongCount = 0;
    try {
      if (typeof window.loadWrongWords === 'function') {
        const loaded = window.loadWrongWords(currentLang) || [];
        reviewWrongCount = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5).length;
      }
    } catch (_) { }

    if (rCont) {
      rCont.classList.toggle('active', isReviewActive);
      rCont.classList.toggle('node-pulse', isReviewActive);
      rCont.classList.remove('opacity-80', 'opacity-60'); // [핵심] 투명도 강제 제거
      rCont.dataset.nodeType = !isReviewUnlocked ? 'locked' : (isReviewDone ? 'completed' : 'review');
    }
    setVis(rPill, isReviewActive);
    setVis(rCheck, isReviewDone);
    setVis(rLock, !isReviewUnlocked);
    if (rExcl) setVis(rExcl, isReviewUnlocked && !isReviewDone && reviewWrongCount > 0);
    if (rTgt) rTgt.dataset.nodeType = !isReviewUnlocked ? 'locked' : (isReviewDone ? 'completed' : 'review');
    if (rBtn) {
      const rBtnClass = !isReviewUnlocked
        ? 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 shadow-sm pointer-events-none'
        : (isReviewDone
          ? 'bg-slate-200 hover:bg-slate-300 text-slate-500 border-b-[5px] border-slate-400 shadow-sm ring-2 ring-slate-300'
          : 'bg-gradient-to-b from-orange-400 via-orange-500 to-amber-600 hover:from-orange-300 hover:to-amber-500 text-white border-b-[5px] border-orange-800 shadow-[0_6px_16px_rgba(249,115,22,0.4)] ring-4 ring-orange-300/80');
      rBtn.className = `node-btn btn-3d relative w-[68px] h-[68px] rounded-full ${rBtnClass} flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all cursor-pointer`;
      rBtn.title = !isReviewUnlocked ? '약점 복습 (잠김)' : (isReviewDone ? '약점 복습 (완료)' : '약점 복습 드릴 (시작)');
      rBtn.dataset.isLocked = !isReviewUnlocked ? 'true' : 'false';
    }
    if (rIco) rIco.textContent = isReviewDone ? '✅' : '⚡️';
    if (el('node-review-badge-icon')) el('node-review-badge-icon').textContent = (isReviewDone && reviewWrongCount === 0) ? '✅' : '⚡️';
    if (rTxt) rTxt.textContent = reviewWrongCount > 0 ? `오답 탈출 (${reviewWrongCount})` : (isReviewDone ? '복습 완료' : '스피드 복습');
    if (rCard) {
      if (!isReviewUnlocked) {
        rCard.classList.add('hidden');
        rCard.style.display = 'none';
      } else {
        rCard.classList.remove('hidden', 'opacity-85', 'opacity-80');
        rCard.style.display = 'flex';
        rCard.className = 'mt-2 flex items-center justify-center bg-white px-2.5 py-1 rounded-full shadow-sm border ' + (isReviewDone && reviewWrongCount === 0 ? 'border-slate-200' : 'border-orange-200') + ' pointer-events-none';
      }
    }

    // 4. Boss Node (Unit 1 슬롯 또는 기존 컨테이너 모두 대응)
    const isBossCleared = Boolean(isUnit1Completed || progBoss >= 1);
    const u1BossSlot = el('u1-boss-slot');
    if (u1BossSlot) {
      u1BossSlot.innerHTML = renderUnitBossHtml({
        unitNum: 1,
        align: 'mx-auto mb-6',
        width: '290px',
        isCompleted: isBossCleared,
        isActive: isBossActive,
        isLocked: !isBossUnlocked,
        nodeId: 'node-boss'
      });
    } else {
      const bossCont = el('node-boss-container');
      if (bossCont) {
        bossCont.outerHTML = renderUnitBossHtml({
          unitNum: 1,
          align: 'mx-auto mb-6',
          width: '290px',
          isCompleted: isBossCleared,
          isActive: isBossActive,
          isLocked: !isBossUnlocked,
          nodeId: 'node-boss'
        });
      }
    }

    if (typeof window.updateCatMarkerPosition === 'function') window.updateCatMarkerPosition();
  }

  let _hasUserScrolledRoadmap = false;
  let _scrollRafId = null;

  function handleRoadmapScrollThrottled() {
    _hasUserScrolledRoadmap = true;
    if (_scrollRafId) return;
    _scrollRafId = requestAnimationFrame(() => {
      _scrollRafId = null;
      if (window.scrollY < 60) {
        window._currentVisibleUnitIndex = 0;
        updateTopUnitBanner(0);
      }
    });
  }

  if (typeof window !== 'undefined' && !window._scrollRoadmapListenerAttached) {
    window._scrollRoadmapListenerAttached = true;
    window.addEventListener('scroll', handleRoadmapScrollThrottled, { passive: true });
  }

  function setupRoadmapObserver() {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (window._roadmapObserver) { window._roadmapObserver.disconnect(); window._roadmapObserver = null; }

    const observer = new IntersectionObserver((entries) => {
      if (!_hasUserScrolledRoadmap && window.scrollY < 60) {
        window._currentVisibleUnitIndex = 0;
        updateTopUnitBanner(0);
        return;
      }

      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topEntry = visibleEntries[0];
        const activeIdx = parseInt(topEntry.target.dataset.unitIndex, 10);
        if (!isNaN(activeIdx)) {
          window._currentVisibleUnitIndex = activeIdx;
          updateTopUnitBanner(activeIdx);
        }
      }
    }, {
      rootMargin: '-140px 0px -40% 0px',
      threshold: [0.15, 0.3, 0.5, 0.7]
    });

    document.querySelectorAll('.unit-section-block').forEach(el => observer.observe(el));
    window._roadmapObserver = observer;
  }

  function renderRoadmap() {
    const getCurrentCourse = typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData : () => null;
    const activeCourse = getCurrentCourse();
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const activeCourseId = activeCourse?.id || window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : 'main') || 'main';
    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang, activeCourseId) : 1;

    if (typeof window.renderSubsequentUnits === 'function') window.renderSubsequentUnits(activeCourse, unlockedLevel);
    if (typeof updateRoadmapNodesUI === 'function') updateRoadmapNodesUI();
    if (typeof setupRoadmapObserver === 'function') setupRoadmapObserver();
    if (typeof updateCatMarkerPosition === 'function') updateCatMarkerPosition();
    if (typeof window.autoScrollToActiveNode === 'function') window.autoScrollToActiveNode();
  }

  function loadUnit(unitIndexOrId) {
    const activeCourse = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : null;
    if (!activeCourse?.units) return null;
    let unitIndex = 0;
    if (typeof unitIndexOrId === 'number') unitIndex = Math.max(0, Math.min(activeCourse.units.length - 1, unitIndexOrId - 1));
    else if (typeof unitIndexOrId === 'string') {
      const parsed = parseInt(unitIndexOrId.replace(/\D/g, ''), 10);
      unitIndex = !isNaN(parsed) ? Math.max(0, Math.min(activeCourse.units.length - 1, parsed - 1)) : Math.max(0, activeCourse.units.findIndex(u => u.id === unitIndexOrId || u.unit === unitIndexOrId));
    }
    const unitLevel = unitIndex + 1;
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    if (typeof window.setUnlockedUnitLevel === 'function') window.setUnlockedUnitLevel(unitLevel, lang);
    renderRoadmap();
    return activeCourse.units[unitIndex] || activeCourse.units[0];
  }

  function nextUnit() {
    const activeCourse = (typeof window.getCurrentCourseData === 'function') ? window.getCurrentCourseData() : null;
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const curLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang) : 1) || 1;
    return (activeCourse?.units && curLevel < activeCourse.units.length) ? loadUnit(curLevel + 1) : null;
  }

  function updateCatMarkerPosition() {
    if (typeof document === 'undefined') return;
    const marker = document.getElementById('roadmap-cat-marker');
    if (!marker) return;

    const progMap = window.nodeProgressMap || {};
    const prog1 = progMap['node-1'] !== undefined ? progMap['node-1'] : 0, prog2 = progMap['node-2'] || 0, prog3 = progMap['node-3'] || 0;
    let targetParent = document.getElementById('node-1-target');
    if (prog1 < 3) targetParent = document.getElementById('node-1-target');
    else if (prog2 < 3) targetParent = document.getElementById('node-2-target');
    else if (prog3 < 3) targetParent = document.getElementById('node-3-target');
    else targetParent = document.getElementById('node-boss-target');

    if (targetParent && marker.parentElement !== targetParent) targetParent.appendChild(marker);
    const markerImg = document.getElementById('cat-marker-img'), headerImg = document.getElementById('header-mascot-img');
    if (markerImg && headerImg && headerImg.src) markerImg.src = headerImg.src;
  }

  let lockedTooltipTimer = null;
  function showLockedTooltip(targetBtn) {
    if (typeof document === 'undefined') return;
    const lockedTooltip = document.getElementById('locked-tooltip');
    if (!lockedTooltip || !targetBtn) return;
    clearTimeout(lockedTooltipTimer);
    targetBtn.appendChild(lockedTooltip);
    lockedTooltip.classList.remove('hidden', 'opacity-0', 'scale-95');
    lockedTooltip.classList.add('opacity-100', 'scale-100');
    lockedTooltipTimer = setTimeout(() => {
      lockedTooltip.classList.add('opacity-0', 'scale-95');
      setTimeout(() => lockedTooltip.classList.add('hidden'), 200);
    }, 2400);
  }

  function updateMascotCharacters(targetLang) {
    const lang = (targetLang === 'en') ? 'en' : 'es';
    const v = '?v=68';
    [['#flashcard-mascot-img, #book-screen img[alt*="scholarly"], #book-screen img[src*="characters/"], #study-profile-screen img[alt*="Scholar Mascot"], img[alt="VocaDash Scholar Mascot"]', '-study.webp'], ['#result-mascot-img', '-victory.webp'], ['#game-result-gameover-card img, #result-gameover-card img', '-sad.webp'], ['#review-cat-banner-tile img, #roadmap-runner-cat-img, #roadmap-screen img[src*="characters/"]', '-run.webp'], ['#streak-modal img, #streak-modal-card img', '-fever.webp'], ['#splash-mascot-img', '-idle.webp']].forEach(([sel, suf]) => {
      document.querySelectorAll(sel).forEach(img => { img.src = `assets/characters/${lang}${suf}${v}`; });
    });
    const bubble = document.getElementById('runner-cat-bubble-text');
    if (bubble) bubble.textContent = lang === 'en' ? "Let's Go! 출발!" : "¡Vamos! 출발!";
    updateRoadmapSignpost(lang);
    const mEs = document.getElementById('mascot-img-es'); if (mEs) mEs.src = `assets/characters/es-study.webp${v}`;
    const mEn = document.getElementById('mascot-img-en'); if (mEn) mEn.src = `assets/characters/en-study.webp${v}`;
  }

  function updateRoadmapSignpost(targetLang) {
    const lang = targetLang === 'en' ? 'en' : 'es';
    const presets = window.SIGNPOST_PRESETS || (typeof SIGNPOST_PRESETS !== 'undefined' ? SIGNPOST_PRESETS : {
      es: { icon: '🇪🇸', text: '마드리드행 쾌속선', code: 'MAD-01', codeClass: 'bg-emerald-100 text-emerald-800', flag: '🇪🇸' },
      en: { icon: '🇺🇸', text: '뉴욕행 직항로', code: 'NYC-01', codeClass: 'bg-sky-100 text-sky-800', flag: '🇺🇸' }
    });
    const p = presets[lang] || presets.es;
    const el = id => document.getElementById(id);
    if (el('signpost-icon')) el('signpost-icon').textContent = p.icon;
    if (el('signpost-text')) el('signpost-text').textContent = p.text;
    if (el('signpost-flag')) el('signpost-flag').textContent = p.flag || p.icon;
    const c = el('signpost-code-badge');
    if (c) { c.textContent = p.code; c.className = `text-[8px] ${p.codeClass} px-1 py-0.2 rounded font-extrabold leading-none`; }
  }

  if (typeof document !== 'undefined' && !window._roadmapClickDelegationAttached) {
    window._roadmapClickDelegationAttached = true;
    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-node-id], .roadmap-node, .node-btn, .subsequent-node-btn');
      if (!targetBtn) return;
      if (e.target.closest('#lesson-modal, #lesson-card-sheet, #lesson-modal-backdrop, #bonus-modal, #review-speedrun-modal, #unit-skip-modal, #unit-overview-modal')) return;

      const nodeContainer = targetBtn.closest('.roadmap-node') || targetBtn;
      const rawNodeId = targetBtn.dataset.nodeId || targetBtn.id?.replace('-btn', '') || targetBtn.id?.replace('-container', '') || nodeContainer.dataset?.nodeId;
      if (!rawNodeId) return;

      const nType = targetBtn.dataset.nodeType || nodeContainer.dataset?.nodeType;
      const isLocked = targetBtn.dataset.isLocked === 'true' || targetBtn.getAttribute('data-is-locked') === 'true' || nodeContainer.dataset?.nodeType === 'locked';
      const uNum = parseInt(targetBtn.dataset.unitNumber || nodeContainer.dataset?.unitIndex || '0', 10) + (targetBtn.dataset.unitNumber ? 0 : 1);

      if (isLocked) {
        if (nType === 'bonus' || rawNodeId.includes('bonus')) {
          if (typeof window.showToast === 'function') window.showToast('🔒 1과와 2과를 모두 마스터해야 보너스 상자를 열 수 있어요! 🎁');
          else alert('1과와 2과를 모두 마스터해야 보너스 상자를 열 수 있어요! 🎁');
          return;
        }
        if (typeof window.showLockedTooltip === 'function') window.showLockedTooltip(targetBtn);
        if (uNum > 1 && typeof window.openUnitSkipModal === 'function') window.openUnitSkipModal(uNum, `Unit ${uNum}`);
        return;
      }

      if (nType === 'bonus' || rawNodeId.includes('bonus')) {
        if (typeof window.openBonusModal === 'function') window.openBonusModal(rawNodeId);
      } else if (nType === 'review' || rawNodeId.includes('review')) {
        if (typeof window.openReviewSpeedrunModal === 'function') window.openReviewSpeedrunModal(uNum, rawNodeId);
      } else {
        if (typeof window.openLessonModal === 'function') window.openLessonModal(rawNodeId);
      }
    });
  }

  Object.assign(window, {
    UNIT_THEMES, getUnitTheme,
    renderUnitTrackSvgHtml, renderUnitNodeHtml, renderUnitBonusHtml, renderUnitReviewHtml, renderUnitBossHtml,
    renderSubsequentUnits, getActiveRoadmapNodeElement, focusActiveRoadmapNode, autoScrollToActiveNode: focusActiveRoadmapNode,
    renderStarsBadge, renderPawBadge, updateTopUnitBanner, updateRoadmapNodesUI, setupRoadmapObserver,
    renderRoadmap, loadUnit, nextUnit, switchToUnit, updateCatMarkerPosition, showLockedTooltip, updateMascotCharacters, updateRoadmapSignpost
  });
})();
