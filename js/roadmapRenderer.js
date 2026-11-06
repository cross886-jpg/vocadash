// js/roadmapRenderer.js - VocaDash Dynamic Roadmap Renderer
(function () {
  'use strict';

  // 템플릿 모듈(js/roadmapTemplates.js) 위임 바인딩
  const tpl = window.roadmapTemplates || {};
  const UNIT_THEMES = tpl.UNIT_THEMES || [];
  const getUnitTheme = (uNum) => (tpl.getUnitTheme ? tpl.getUnitTheme(uNum) : (UNIT_THEMES[(Math.max(1, parseInt(uNum, 10) || 1) - 1) % (UNIT_THEMES.length || 1)] || {}));
  const renderSinglePawSvg = (isActive) => (tpl.renderSinglePawSvg ? tpl.renderSinglePawSvg(isActive) : '');
  const renderPawBadge = (prog) => (tpl.renderPawBadge ? tpl.renderPawBadge(prog) : '');
  const renderStarsBadge = (c, s, l) => (tpl.renderStarsBadge ? tpl.renderStarsBadge(c, s, l) : '');
  const renderUnitTrackSvgHtml = () => (tpl.renderUnitTrackSvgHtml ? tpl.renderUnitTrackSvgHtml() : '');
  const renderStartBadgeHtml = (isActive) => (tpl.renderStartBadgeHtml ? tpl.renderStartBadgeHtml(isActive) : '');
  const renderUnitNodeHtml = (opt) => (tpl.renderUnitNodeHtml ? tpl.renderUnitNodeHtml(opt) : '');
  const renderUnitBonusHtml = (opt) => (tpl.renderUnitBonusHtml ? tpl.renderUnitBonusHtml(opt) : '');
  const renderUnitReviewHtml = (opt) => (tpl.renderUnitReviewHtml ? tpl.renderUnitReviewHtml(opt) : '');
  const renderUnitBossHtml = (opt) => (tpl.renderUnitBossHtml ? tpl.renderUnitBossHtml(opt) : '');

  function renderSubsequentUnits(activeCourse, unlockedLevel) {
    const container = document.getElementById('roadmap-subsequent-units');
    const u1Container = document.getElementById('unit-1-nodes-container');
    const u0Section = document.getElementById('unit-section-0');

    const course = activeCourse
      || (typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null)
      || (window.activeCourseId === 'pack_football' ? window.packFootballData : null);
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const courseId = window.currentCourseId || window.activeCourseId || (lang === 'en' ? 'en_main' : 'es_main');

    // Section 데이터에서 현재 활성 섹션 파악 (SSOT)
    const activeSection = (typeof window.getActiveSection === 'function')
      ? window.getActiveSection(courseId)
      : null;

    const startUnit = activeSection ? activeSection.unitStart : 1;
    const endUnit = activeSection ? activeSection.unitEnd : 30;

    const baseUnits = course?.units || window.UNIT_LIST_PRESETS?.[lang] || [];

    const getUnitAt = (i) => {
      if (baseUnits[i]) return baseUnits[i];
      if (typeof window.getUnitDataWithFallback === 'function') {
        return window.getUnitDataWithFallback(courseId, i + 1);
      }
      return { unitNumber: i + 1, title: `Unit ${i + 1}`, subtitle: '' };
    };

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

    if (startUnit === 1) {
      if (u0Section) u0Section.style.display = '';
      if (u1Container) {
        u1Container.innerHTML = buildUnitNodesHtml(0, getUnitAt(0), true);
      }
    } else {
      if (u0Section) u0Section.style.display = 'none';
    }

    if (!container) return;

    let html = '';
    const loopStartIdx = (startUnit === 1) ? 1 : (startUnit - 1);
    for (let idx = loopStartIdx; idx < endUnit; idx++) {
      const unit = getUnitAt(idx), unitNum = idx + 1;
      const unitIcon = unit?.icon || (courseId.includes('soccer') || courseId.includes('football') ? '⚽' : (lang === 'en' ? '🗽' : '🇪🇸'));
      const unitTitle = `Unit ${unitNum}`;
      const theme = getUnitTheme(unitNum);

      html += `<div class="unit-section-divider py-8 my-6 text-center select-none" data-unit-index="${idx}"><div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${theme.dividerBadge} text-xs font-bold shadow-md"><span>${esc(unitIcon)}</span><span>${esc(unitTitle)}</span></div></div>`;
      html += `<div class="unit-section-block relative w-full min-h-[960px] pb-6" data-unit-index="${idx}" id="unit-section-${idx}">${renderUnitTrackSvgHtml()}${buildUnitNodesHtml(idx, unit, false)}</div>`;
    }

    container.innerHTML = html;
  }

  function isElementVisible(el) {
    if (!el) return false;
    if (el.classList?.contains('hidden') || el.style?.display === 'none' || el.style?.visibility === 'hidden') return false;
    if (typeof el.closest === 'function' && el.closest('[style*="display: none"], .hidden')) return false;
    return true;
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
      if (!isElementVisible(node)) continue;
      if (isNodeCompleted(node) || isNodeLocked(node)) continue;
      const startBadge = node.querySelector('.node-badge-start, [id$="-start-pill"]');
      if (startBadge && isElementVisible(startBadge)) return node;
      const pulseEl = node.querySelector('.animate-pulse');
      if (pulseEl && isElementVisible(pulseEl) && pulseEl.textContent.includes('START')) return node;
      const stageNumEl = node.querySelector('.node-stage-num');
      if (stageNumEl && isElementVisible(stageNumEl) && stageNumEl.textContent.trim().toUpperCase() === 'START') return node;
      if (node.classList.contains('active') || node.classList.contains('node-pulse') || node.dataset.nodeType === 'active') return node;
    }
    const openNodes = allNodes.filter(n => isElementVisible(n) && !isNodeLocked(n));
    return openNodes[openNodes.length - 1] || allNodes.find(n => isElementVisible(n)) || null;
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

    const courseId = window.currentCourseId || window.activeCourseId || (lang === 'en' ? 'en_main' : 'es_main');
    const sectionsConfig = (typeof window.courseSections !== 'undefined') ? (window.courseSections[courseId] || window.courseSections.es_main) : null;
    const lastSection = sectionsConfig?.sections?.[sectionsConfig.sections.length - 1];
    const totalGates = lastSection?.unitEnd || 30;

    const activeSection = (typeof window.getActiveSection === 'function')
      ? window.getActiveSection(courseId)
      : null;
    const startUnit = activeSection ? activeSection.unitStart : 1;
    const endUnit = activeSection ? activeSection.unitEnd : totalGates;

    const units = course?.units || window.UNIT_LIST_PRESETS?.[lang] || [];
    const totalUnits = Math.max(units.length || 1, totalGates);
    const unlockedLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(lang) : 1;
    const fallbackIdx = (unlockedLevel >= startUnit && unlockedLevel <= endUnit) ? (unlockedLevel - 1) : (startUnit - 1);
    let targetIdx = (typeof activeIdx === 'number' && !isNaN(activeIdx))
      ? activeIdx
      : (window._currentVisibleUnitIndex ?? fallbackIdx);

    targetIdx = Math.max(startUnit - 1, Math.min(endUnit - 1, targetIdx));

    if (!force && _lastRenderedBannerUnitIndex === targetIdx) {
      return;
    }
    _lastRenderedBannerUnitIndex = targetIdx;

    const unitNum = targetIdx + 1;
    const targetUnit = (typeof window.getUnitDataWithFallback === 'function')
      ? window.getUnitDataWithFallback(courseId, unitNum)
      : (units[targetIdx] || units[0] || { unitNumber: unitNum, title: `Unit ${unitNum}`, subtitle: '' });

    if (!targetUnit) return;

    const subBadgeEl = document.getElementById('unit-sub-badge');
    const mainTitleEl = document.getElementById('unit-main-title');
    const langBadgeEl = document.getElementById('unit-lang-badge');
    const bannerContent = document.getElementById('unit-banner-content');
    const bannerEl = document.getElementById('unit-banner');

    const applyContentAndTheme = () => {
      if (subBadgeEl) {
        subBadgeEl.textContent = activeSection?.ticketCode
          ? `${activeSection.ticketCode} · UNIT ${unitNum} / ${endUnit}`
          : `UNIT ${unitNum} / ${totalUnits}`;
      }
      if (mainTitleEl) mainTitleEl.textContent = `Unit ${unitNum}`;
      if (langBadgeEl) {
        langBadgeEl.textContent = activeSection?.title || (lang === 'en' ? '영어 정규 코스' : '스페인어 첫걸음');
      }

      const badgeEl = document.getElementById('top-unit-badge-text'); if (badgeEl) badgeEl.textContent = `UNIT ${unitNum}`;
      const titleEl = document.getElementById('top-unit-title'); if (titleEl) titleEl.textContent = `Unit ${unitNum}`;
      const descEl = document.getElementById('top-unit-desc'); if (descEl) descEl.textContent = '';

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
    const uNum = Math.max(1, parseInt(unitNumber, 10) || 1);
    const activeIdx = uNum - 1;
    window._currentVisibleUnitIndex = activeIdx;
    window.currentUnitNumber = uNum;

    const courseId = window.currentCourseId || window.activeCourseId || ((window.currentLanguage === 'en' || window.currentActiveCourse === 'en') ? 'en_main' : 'es_main');
    const sectionsConfig = (typeof window.courseSections !== 'undefined') ? (window.courseSections[courseId] || window.courseSections.es_main) : null;
    const targetSection = sectionsConfig?.sections?.find(s => uNum >= s.unitStart && uNum <= s.unitEnd);

    // If target unit belongs to a different section, switch active section and re-render roadmap!
    if (targetSection && (!window.currentSectionId || window.currentSectionId !== targetSection.id)) {
      window.currentSectionId = targetSection.id;
      try {
        const cKey = (typeof window.getActiveCourseKey === 'function') ? window.getActiveCourseKey(courseId) : courseId;
        localStorage.setItem('vocadash_active_section_' + cKey, targetSection.id);
      } catch (_) { }
      if (typeof window.renderRoadmap === 'function') {
        window.renderRoadmap();
      }
    }

    updateTopUnitBanner(activeIdx, true);

    if (uNum === 1 && (!targetSection || targetSection.unitStart === 1)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const targetSectionBlock = document.querySelector(`.unit-section-block[data-unit-index="${activeIdx}"]`);
    if (targetSectionBlock) {
      const activeNode = targetSectionBlock.querySelector('.roadmap-node.active, .node-target[data-node-type="active"]') || targetSectionBlock.querySelector('.roadmap-node');
      if (activeNode && typeof focusActiveRoadmapNode === 'function') {
        focusActiveRoadmapNode(activeNode);
      } else {
        const headerHeight = document.getElementById('roadmap-header')?.offsetHeight || 140;
        const rect = targetSectionBlock.getBoundingClientRect();
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
    updateTopUnitBanner((window._currentVisibleUnitIndex !== undefined) ? window._currentVisibleUnitIndex : (unlockedLevel - 1), true);

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
        const activeSection = (typeof window.getActiveSection === 'function') ? window.getActiveSection() : null;
        const defaultIdx = activeSection ? (activeSection.unitStart - 1) : 0;
        window._currentVisibleUnitIndex = defaultIdx;
        updateTopUnitBanner(defaultIdx);
      }
      if (typeof updateQuickScrollFabState === 'function') {
        updateQuickScrollFabState();
      } else if (typeof syncQuickScrollFab === 'function') {
        syncQuickScrollFab();
      }
    });
  }

  if (typeof window !== 'undefined' && !window._scrollRoadmapListenerAttached) {
    window._scrollRoadmapListenerAttached = true;
    window.addEventListener('scroll', handleRoadmapScrollThrottled, { passive: true, capture: true });
    document.addEventListener('scroll', handleRoadmapScrollThrottled, { passive: true, capture: true });
  }

  function setupRoadmapObserver() {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (window._roadmapObserver) { window._roadmapObserver.disconnect(); window._roadmapObserver = null; }

    const observer = new IntersectionObserver((entries) => {
      const activeSection = (typeof window.getActiveSection === 'function') ? window.getActiveSection() : null;
      const defaultIdx = activeSection ? (activeSection.unitStart - 1) : 0;

      if (!_hasUserScrolledRoadmap && window.scrollY < 60) {
        window._currentVisibleUnitIndex = defaultIdx;
        updateTopUnitBanner(defaultIdx);
        return;
      }

      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topEntry = visibleEntries[0];
        const activeIdx = parseInt(topEntry.target.dataset.unitIndex, 10);
        if (!isNaN(activeIdx)) {
          window._currentVisibleUnitIndex = activeIdx;
          updateTopUnitBanner(activeIdx, true);
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
    if (typeof updateQuickScrollFabState === 'function') setTimeout(updateQuickScrollFabState, 100);
    else if (typeof syncQuickScrollFab === 'function') setTimeout(syncQuickScrollFab, 100);
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

    let targetParent = null;
    if (typeof getActiveRoadmapNodeElement === 'function') {
      const activeNode = getActiveRoadmapNodeElement();
      if (activeNode) {
        targetParent = activeNode.querySelector('.node-target') || activeNode;
      }
    }

    if (!targetParent) {
      const progMap = window.nodeProgressMap || {};
      const prog1 = progMap['node-1'] !== undefined ? progMap['node-1'] : 0, prog2 = progMap['node-2'] || 0, prog3 = progMap['node-3'] || 0;
      if (prog1 < 3) targetParent = document.getElementById('node-1-target');
      else if (prog2 < 3) targetParent = document.getElementById('node-2-target');
      else if (prog3 < 3) targetParent = document.getElementById('node-3-target');
      else targetParent = document.getElementById('node-boss-target');
    }

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
      if (e.target.closest('#lesson-modal, #lesson-card-sheet, #lesson-modal-backdrop, #bonus-modal, #review-speedrun-modal, #unit-skip-modal, #unit-overview-modal, #course-drawer-backdrop, #course-drawer-card')) return;

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
        if (typeof window.openLessonModal === 'function') window.openLessonModal(rawNodeId, uNum);
      }
    });
  }

  // ===================================================
  // Quick Scroll FAB (활성 노드 복귀 플로팅 버튼)
  // ===================================================

  // 1) 활성/진행 중인 타겟 노드 탐색
  function getFabTargetNode() {
    if (typeof window.getActiveRoadmapNodeElement === 'function') {
      const el = window.getActiveRoadmapNodeElement();
      if (el) return el;
    }
    return document.getElementById('cat-marker') ||
      document.getElementById('roadmap-cat-marker') ||
      document.querySelector('.node-current') ||
      document.querySelector('.roadmap-node:not([data-locked="true"])') ||
      document.querySelector('[id^="node-"]');
  }

  // 2) 스크롤에 따른 FAB 가시성 및 화살표 방향 동기화 (홈 탭 전용 가드 적용)
  function updateQuickScrollFabState() {
    const fab = document.getElementById('quick-scroll-fab');
    if (!fab) return;

    // 홈(로드맵) 탭이 아니거나 로드맵 화면이 숨겨진 경우 무조건 hidden 처리 후 즉시 반환
    const currentTab = window.currentTab || window.currentMainTab || 'home';
    const roadmapScreen = document.getElementById('roadmap-screen');
    const isHomeActive = currentTab === 'home' &&
      roadmapScreen && !roadmapScreen.classList.contains('hidden') && roadmapScreen.style.display !== 'none';

    if (!isHomeActive) {
      fab.classList.add('hidden');
      return;
    }

    const targetNode = getFabTargetNode();
    if (!targetNode || typeof targetNode.getBoundingClientRect !== 'function') {
      fab.classList.add('hidden');
      return;
    }

    const rect = targetNode.getBoundingClientRect();
    const vh = window.innerHeight || 800;

    // 상단 헤더 뒤로 숨거나 하단 바텀바 밑으로 가려졌을 때만 이탈로 판정
    const isAboveScreen = rect.bottom < 90;
    const isBelowScreen = rect.top > (vh - 100);

    if (isAboveScreen || isBelowScreen) {
      fab.classList.remove('hidden');

      const arrowUp = document.getElementById('quick-arrow-up');
      const arrowDown = document.getElementById('quick-arrow-down');
      if (arrowUp && arrowDown) {
        if (isAboveScreen) {
          arrowUp.classList.remove('hidden');
          arrowDown.classList.add('hidden');
        } else {
          arrowDown.classList.remove('hidden');
          arrowUp.classList.add('hidden');
        }
      }
    } else {
      fab.classList.add('hidden');
    }
  }

  // 3) 클릭 이벤트 및 스크롤 리스너 바인딩
  const initFabControls = () => {
    const fab = document.getElementById('quick-scroll-fab');
    if (fab) {
      fab.onclick = () => {
        const target = getFabTargetNode();
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
    }

    const scrollHandler = () => {
      const curTab = window.currentTab || window.currentMainTab || 'home';
      if (curTab !== 'home') return;
      window.requestAnimationFrame(updateQuickScrollFabState);
    };

    // window 기본 스크롤 등록
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // main 및 내부 스크롤 컨테이너 전수 등록
    const bindScrollContainers = () => {
      document.querySelectorAll('#roadmap-container, main, main.overflow-y-auto, .overflow-y-auto').forEach(container => {
        container.removeEventListener('scroll', scrollHandler);
        container.addEventListener('scroll', scrollHandler, { passive: true });
      });
    };

    bindScrollContainers();

    // 동적 렌더링 대비 지연 체크 및 다중 바인딩
    setTimeout(() => {
      bindScrollContainers();
      updateQuickScrollFabState();
    }, 400);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFabControls);
  } else {
    initFabControls();
  }

  Object.assign(window, {
    UNIT_THEMES, getUnitTheme,
    renderUnitTrackSvgHtml, renderUnitNodeHtml, renderUnitBonusHtml, renderUnitReviewHtml, renderUnitBossHtml,
    renderSubsequentUnits, getActiveRoadmapNodeElement, focusActiveRoadmapNode, autoScrollToActiveNode: focusActiveRoadmapNode,
    renderStarsBadge, renderPawBadge, updateTopUnitBanner, updateRoadmapNodesUI, setupRoadmapObserver,
    renderRoadmap, loadUnit, nextUnit, switchToUnit, updateCatMarkerPosition, showLockedTooltip, updateMascotCharacters, updateRoadmapSignpost,
    getFabTargetNode, updateQuickScrollFabState, syncQuickScrollFab: updateQuickScrollFabState,
    scrollToActiveStageNode: () => { const t = getFabTargetNode(); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
})();
