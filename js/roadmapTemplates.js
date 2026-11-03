// js/roadmapTemplates.js - VocaDash Roadmap HTML & SVG Templates Module
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

  const templates = {
    UNIT_THEMES,
    getUnitTheme,
    renderSinglePawSvg,
    renderPawBadge,
    renderStarsBadge,
    renderStartBadgeHtml,
    renderUnitTrackSvgHtml,
    renderUnitTracksSvgHtml: renderUnitTrackSvgHtml,
    renderUnitNodeHtml,
    renderUnitBonusHtml,
    renderUnitReviewHtml,
    renderUnitBossHtml
  };

  window.roadmapTemplates = templates;
})();

