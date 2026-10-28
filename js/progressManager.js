// js/progressManager.js - Single Source of Truth for User Progress & Stage Unlocks
(function (root) {
  'use strict';
  const target = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : root);
  const storage = {
    get: (k) => { try { return (typeof localStorage !== 'undefined' ? localStorage : target.localStorage)?.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { (typeof localStorage !== 'undefined' ? localStorage : target.localStorage)?.setItem(k, String(v)); } catch (_) { } },
    remove: (k) => { try { (typeof localStorage !== 'undefined' ? localStorage : target.localStorage)?.removeItem(k); } catch (_) { } }
  };
  const getLang = (l) => (l || target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
  const getCourse = (c, lang) => {
    let cid = c || target.currentCourseId || target.activeCourseId;
    if (!cid && storage.get) cid = storage.get(`vocadash_active_course_${getLang(lang)}`) || storage.get('vocadash_active_course');
    return (cid === 'pack_football' && getLang(lang) !== 'en') ? 'pack_football' : 'main';
  };
  function getCompositeNodeKey(nodeId, unitId = null) {
    if (!nodeId) return `u${unitId || 1}_node-1`;
    const str = String(nodeId).trim();
    return /^u\d+_/i.test(str) ? str : `u${unitId || target.currentUnitNumber || 1}_${str}`;
  }
  function parseNodeCoordinates(nodeId, defaultUnit = 1) {
    if (!nodeId) return { unitIndex: defaultUnit, nodeIndex: 1 };
    const str = String(nodeId).trim(), uM = str.match(/(?:^|[_uU])(\d+)(?:[_nN-]|$)/), u = uM ? (parseInt(uM[1], 10) || defaultUnit) : defaultUnit;
    if (str.includes('boss') || str.endsWith('_n6')) return { unitIndex: u, nodeIndex: 6 };
    if (str.endsWith('_n5') || str.endsWith('-n3') || str === 'node-3') return { unitIndex: u, nodeIndex: 3 };
    if (str.includes('review') || str.endsWith('_n4')) return { unitIndex: u, nodeIndex: 'review' };
    if (str.includes('bonus') || str.endsWith('_n3')) return { unitIndex: u, nodeIndex: 'bonus' };
    const nM = str.match(/(?:node|stage|n|-)?(\d+)$/i);
    return { unitIndex: u, nodeIndex: nM ? (parseInt(nM[1], 10) || 1) : 1 };
  }
  function getCourseProgress(courseId, targetLang) {
    const lang = getLang(targetLang), cid = getCourse(courseId, lang);
    try {
      const raw = storage.get(`vocadash_progress_${lang}_${cid}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') return { completedNodes: p.completedNodes || [], claimedBonuses: p.claimedBonuses || [], unlockedUnits: p.unlockedUnits || [1], nodeProgressMap: p.nodeProgressMap || { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 } };
      }
    } catch (_) { }
    return { completedNodes: [], claimedBonuses: [], unlockedUnits: [1], nodeProgressMap: { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 } };
  }
  function saveCourseProgress(progressData, courseId, targetLang) {
    storage.set(`vocadash_progress_${getLang(targetLang)}_${getCourse(courseId, targetLang)}`, JSON.stringify(progressData || {}));
  }
  function getUnlockedUnitLevel(targetLang, targetCourseId) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId, lang);
    try {
      const val = storage.get(`vocadash_unlocked_${lang}_${cid}`);
      if (val !== null) { const num = parseInt(val, 10); if (!isNaN(num) && num >= 1 && num <= 10) return num; }
    } catch (_) { }
    return 1;
  }
  function setUnlockedUnitLevel(level, targetLang, targetCourseId) {
    const lvl = Math.max(1, Math.min(10, parseInt(level, 10) || 1)), lang = getLang(targetLang), cid = getCourse(targetCourseId, lang);
    storage.set(`vocadash_unlocked_${lang}_${cid}`, String(lvl));
    const prog = getCourseProgress(cid, lang);
    if (!prog.unlockedUnits) prog.unlockedUnits = [1];
    for (let u = 1; u <= lvl; u++) if (!prog.unlockedUnits.includes(u)) prog.unlockedUnits.push(u);
    saveCourseProgress(prog, cid, lang);
    return lvl;
  }
  function unlockUnitsUpTo(maxLevel, targetLang, targetCourseId) {
    return setUnlockedUnitLevel(maxLevel, targetLang, targetCourseId);
  }

  function getNodeProgress(nodeId, targetLang, targetCourseId) {
    if (!nodeId) return { clearedCount: 0, stars: 0, valueOf() { return 0; }, toString() { return '0'; } };
    const lang = getLang(targetLang), cid = String(nodeId).startsWith('fb_') ? 'pack_football' : getCourse(targetCourseId, lang);
    const { unitIndex, nodeIndex } = parseNodeCoordinates(nodeId), key = `vocadash_prog_${lang}_${cid}_u${unitIndex}_n${nodeIndex}`;
    let count = 0;
    try {
      const raw = storage.get(key);
      if (raw !== null) { const p = JSON.parse(raw); count = typeof p === 'number' ? p : (p?.clearedCount ?? p?.stars ?? 0); }
    } catch (_) { const num = parseInt(storage.get(key), 10); if (!isNaN(num)) count = num; }
    if (count === 0 && target.nodeProgressMap) {
      count = Number(target.nodeProgressMap[`${lang}_${cid}_u${unitIndex}_n${nodeIndex}`] || 0);
      if (count === 0 && cid === getCourse(undefined, lang) && lang === getLang()) {
        count = Number(target.nodeProgressMap[nodeId] || target.nodeProgressMap[`u${unitIndex}_node-${nodeIndex}`] || (unitIndex === 1 ? target.nodeProgressMap[`node-${nodeIndex}`] : 0) || 0);
      }
    }
    count = Math.max(0, Math.min(3, count));
    return { clearedCount: count, stars: count, valueOf() { return count; }, toString() { return String(count); } };
  }

  function setNodeProgress(nodeId, clearedCount, stars, targetLang, targetCourseId) {
    if (!nodeId) return { clearedCount: 0, stars: 0, valueOf() { return 0; }, toString() { return '0'; } };
    const lang = getLang(targetLang), cid = String(nodeId).startsWith('fb_') ? 'pack_football' : getCourse(targetCourseId, lang);
    const { unitIndex, nodeIndex } = parseNodeCoordinates(nodeId);
    const count = Math.min(3, Math.max(0, Number(clearedCount) || 0)), s = Math.min(3, Math.max(0, stars !== undefined ? Number(stars) : count));
    const key = `vocadash_prog_${lang}_${cid}_u${unitIndex}_n${nodeIndex}`, compNodeKey = `u${unitIndex}_node-${nodeIndex}`, compStageKey = `u${unitIndex}_stage-${nodeIndex}`;
    storage.set(key, String(count));
    storage.set(`node_progress_${lang}_${cid}_${compNodeKey}`, String(count));
    storage.set(`node_progress_${lang}_${cid}_${compStageKey}`, String(count));
    if (cid === 'main' && lang === 'es') { storage.set(compNodeKey, String(count)); storage.set(compStageKey, String(count)); }
    if (nodeIndex === 3 || String(nodeId).includes('node-3') || String(nodeId).includes('stage-3')) {
      try {
        let uData = JSON.parse(storage.get('vocadash_user_data') || '{}');
        if (!uData.clearedNodes) uData.clearedNodes = {};
        uData.clearedNodes['node-3'] = uData.clearedNodes[compNodeKey] = uData.clearedNodes[compStageKey] = { cleared: count >= 3, clearedCount: count, actuallyPlayed: true };
        storage.set('vocadash_user_data', JSON.stringify(uData));
      } catch (_) { }
    }
    if (cid === 'pack_football' && String(nodeId).startsWith('fb_')) storage.set(`vocadash_node_progress_${nodeId}`, JSON.stringify({ clearedCount: count, stars: s }));
    if (!target.nodeProgressMap) target.nodeProgressMap = {};
    target.nodeProgressMap[`${lang}_${cid}_u${unitIndex}_n${nodeIndex}`] = target.nodeProgressMap[nodeId] = target.nodeProgressMap[compStageKey] = target.nodeProgressMap[compNodeKey] = target.nodeProgressMap[`u${unitIndex}_n${nodeIndex}`] = count;
    if (cid === 'pack_football') target.nodeProgressMap[`fb_${unitIndex}_n${nodeIndex}`] = count;
    else target.nodeProgressMap[`${lang}_${unitIndex}_n${nodeIndex}`] = count;
    if (String(nodeIndex) === '6' || String(nodeId).includes('boss')) target.nodeProgressMap[`u${unitIndex}_node-boss`] = count;
    if (String(nodeIndex) === 'review' || String(nodeId).includes('review')) target.nodeProgressMap[`u${unitIndex}_node-review`] = count;
    if (String(nodeIndex) === 'bonus' || String(nodeId).includes('bonus')) target.nodeProgressMap[`u${unitIndex}_node-bonus`] = count;
    const curLang = (target.currentLanguage || target.currentActiveCourse || 'es') === 'en' ? 'en' : 'es', curCourse = target.currentCourseId || target.activeCourseId || 'main';
    if (curLang === lang && curCourse === cid && unitIndex === 1) target.nodeProgressMap[`node-${nodeIndex}`] = count;
    if (!Array.isArray(target.completedStages)) target.completedStages = [];
    if (count >= 3) { for (const k of [nodeId, compNodeKey, compStageKey]) if (!target.completedStages.includes(k)) target.completedStages.push(k); }
    return { clearedCount: count, stars: s, valueOf() { return count; }, toString() { return String(count); } };
  }
  function resolveNodeData(rawId, fallbackId) {
    const curLang = getLang(), curCourse = getCourse(target.activeCourseId, curLang), p1 = getNodeProgress(rawId, curLang, curCourse);
    if (p1.clearedCount > 0) return p1;
    if (fallbackId && fallbackId !== rawId) return getNodeProgress(fallbackId, curLang, curCourse);
    return { clearedCount: 0, stars: 0 };
  }

  function isNodeUnlocked(currentUnitIndex, nodeIndex, node, course) {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    if (currentUnitIndex === 0 && nodeIndex === 0) return true;
    const targetCourse = course || (typeof target.getCurrentCourseData === 'function' ? target.getCurrentCourseData() : (target.packFootballData || target.courseData));
    if (nodeIndex === 0) {
      if (currentUnitIndex === 0) return true;
      const prevBoss = targetCourse?.units?.[currentUnitIndex - 1]?.nodes?.find(n => n.type === 'boss' || (n.id && (n.id.endsWith('_n6') || n.id.includes('boss'))));
      if (prevBoss?.id && (getNodeProgress(prevBoss.id, lang, courseId)?.clearedCount || 0) >= 1) return true;
      return ((typeof target.getUnlockedUnitLevel === 'function' ? target.getUnlockedUnitLevel(lang, courseId) : 1) || 1) >= currentUnitIndex + 1;
    }
    const nodeId = node?.id || (typeof node === 'string' ? node : ''), nodeType = node?.type || '';
    if (currentUnitIndex === 0) {
      if (nodeId === 'node-1' || nodeId === 'fb_1_n1' || nodeId === 'es_1_n1' || nodeIndex === 0) return true;
      const p1 = (getNodeProgress('node-1', lang, courseId)?.clearedCount || 0), isBonusDone = isBonusClaimed('node-bonus') || isBonusClaimed('fb_1_n2');
      if (nodeId === 'node-bonus' || nodeId === 'fb_1_n2' || nodeType === 'bonus' || nodeIndex === 1) return p1 >= 3;
      if (nodeId === 'node-2' || nodeId === 'fb_1_n3' || (nodeIndex === 2 && (nodeType === 'stage' || !nodeType))) return p1 >= 3;
      const p2 = (getNodeProgress('node-2', lang, courseId)?.clearedCount || 0);
      if (nodeId === 'node-review' || nodeId === 'fb_1_n5' || nodeType === 'review') return p2 >= 3 && isBonusDone;
      if (nodeId === 'node-3' || nodeId === 'fb_1_n4' || nodeType === 'sentence' || (nodeIndex === 3 && nodeType === 'sentence') || nodeIndex === 4) return p2 >= 3;
      if (nodeId === 'node-boss' || nodeId === 'fb_1_n6' || nodeType === 'boss' || nodeIndex === 5) return (getNodeProgress('node-3', lang, courseId)?.clearedCount || 0) >= 3;
    }
    if (targetCourse?.units?.[currentUnitIndex]?.nodes) {
      const curNodes = targetCourse.units[currentUnitIndex].nodes, actualIdx = (typeof nodeIndex === 'number' && nodeIndex >= 0 && nodeIndex < curNodes.length) ? nodeIndex : curNodes.findIndex(n => n.id === nodeId);
      if (actualIdx > 0) {
        const prevNode = curNodes[actualIdx - 1];
        if (prevNode.type === 'bonus') return isBonusClaimed(prevNode.id);
        if (prevNode.type === 'review') return isReviewNodeCompleted(prevNode.id, currentUnitIndex + 1);
        return (getNodeProgress(prevNode.id, lang, courseId).clearedCount || 0) >= 3;
      }
    }
    return false;
  }

  function loadNodeProgress(targetLang, targetCourseId) {
    const lang = getLang(targetLang), courseId = getCourse(targetCourseId, lang);
    const result = { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 };
    [1, 2, 3].forEach(n => {
      const stdKey = `vocadash_prog_${lang}_${courseId}_u1_n${n}`;
      let c = 0;
      try {
        const raw = storage.get(stdKey);
        if (raw !== null) { const parsed = JSON.parse(raw); c = typeof parsed === 'number' ? parsed : (parsed?.clearedCount ?? parsed?.stars ?? 0); }
      } catch (_) { const num = parseInt(storage.get(stdKey), 10); if (!isNaN(num)) c = num; }
      if (c === 0) {
        let rawAlt = storage.get(`node_progress_${lang}_${courseId}_node-${n}`) || storage.get(`node_progress_${lang}_${courseId}_u1_node-${n}`);
        if (!rawAlt && courseId === 'main' && lang === 'es' && n === 3) rawAlt = storage.get('u1_node-3') || storage.get('u1_stage-3');
        if (rawAlt) { const num = parseInt(rawAlt, 10); if (!isNaN(num)) c = num; }
      }
      c = Math.max(0, Math.min(3, c));
      result[`node-${n}`] = result[`${lang}_${courseId}_u1_n${n}`] = result[`u1_stage-${n}`] = result[`u1_node-${n}`] = result[`u1_n${n}`] = c;
      if (courseId === 'pack_football') result[`fb_1_n${n}`] = c;
    });
    try {
      const uData = JSON.parse(storage.get('vocadash_user_data') || '{}');
      if (!(uData.clearedNodes?.[ 'node-3']?.actuallyPlayed || uData.clearedNodes?.[ 'u1_node-3']?.actuallyPlayed) && result['node-3'] > 0) {
        result['node-3'] = result[`${lang}_${courseId}_u1_n3`] = result['u1_stage-3'] = result['u1_node-3'] = 0;
        storage.remove(`vocadash_prog_${lang}_${courseId}_u1_n3`); storage.remove('u1_node-3');
      }
    } catch (_) { }
    let bossCount = 0;
    try {
      const rawBoss = storage.get(`vocadash_prog_${lang}_${courseId}_u1_n6`);
      if (rawBoss !== null) bossCount = parseInt(rawBoss, 10) || (JSON.parse(rawBoss)?.clearedCount ?? 0);
    } catch (_) { }
    result['node-boss'] = result[`${lang}_${courseId}_u1_n6`] = result['u1_node-boss'] = bossCount;
    if (courseId === 'pack_football') result['fb_1_n6'] = bossCount;
    return result;
  }

  function getNodeStatus(nodeId, unitIndex = 0) {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    let progMap = target.nodeProgressMap || {};
    if (!progMap['node-1'] && !progMap['node-2']) progMap = Object.assign({}, loadNodeProgress(lang, courseId), progMap);
    const normId = (nodeId || '').replace(/^u1_/, ''), prog1 = progMap['node-1'] || 0, prog2 = (prog1 >= 3) ? (progMap['node-2'] || 0) : 0;
    const isBonusDone = isBonusClaimed('node-bonus') || isBonusClaimed('u1_node-bonus'), isReviewDone = isReviewNodeCompleted('u1_node-review', 1) || isReviewNodeCompleted('node-review', 1);
    const prog3 = (prog2 >= 3) ? (progMap['node-3'] || 0) : 0, progBoss = (prog3 >= 3) ? (progMap['node-boss'] || 0) : 0;
    let clearedCount = 0, isLocked = false, isCompleted = false, isActive = false, type = 'stage';
    if (normId === 'node-1' || normId === 'stage-1') { clearedCount = prog1; isCompleted = prog1 >= 3; isActive = prog1 < 3; }
    else if (normId === 'node-2' || normId === 'stage-2') { clearedCount = prog2; isLocked = prog1 < 3; isCompleted = !isLocked && prog2 >= 3; isActive = !isLocked && !isCompleted; }
    else if (normId === 'node-bonus' || normId.includes('bonus')) { clearedCount = isBonusDone ? 1 : 0; isLocked = prog1 < 3; isCompleted = isBonusDone; isActive = !isLocked && !isCompleted; type = 'bonus'; }
    else if (normId === 'node-review' || normId.includes('review')) { clearedCount = isReviewDone ? 1 : 0; isLocked = !(prog1 >= 3 && isBonusDone); isCompleted = isReviewDone; isActive = !isLocked && !isCompleted; type = 'review'; }
    else if (normId === 'node-3' || normId === 'stage-3') { clearedCount = prog3; isLocked = !(prog2 >= 3 && isBonusDone && isReviewDone); isCompleted = !isLocked && prog3 >= 3; isActive = !isLocked && !isCompleted; }
    else if (normId === 'node-boss' || normId.includes('boss')) { clearedCount = progBoss; isLocked = prog3 < 3; isCompleted = !isLocked && progBoss >= 1; isActive = !isLocked && !isCompleted; type = 'boss'; }
    else {
      const p = getNodeProgress(nodeId, lang, courseId);
      clearedCount = p.clearedCount || 0; isLocked = !isNodeUnlocked(unitIndex, undefined, { id: nodeId });
      isCompleted = !isLocked && clearedCount >= 3; isActive = !isLocked && !isCompleted;
      type = nodeId.includes('boss') ? 'boss' : (nodeId.includes('bonus') ? 'bonus' : (nodeId.includes('review') ? 'review' : 'stage'));
    }
    return { nodeId, unitIndex, type, clearedCount, stars: clearedCount, isLocked, isCompleted, isActive, status: isLocked ? 'locked' : (isCompleted ? 'completed' : (isActive ? 'active' : 'unlocked')) };
  }
  function saveNodeProgress() {
    const prog = getCourseProgress(target.activeCourseId);
    prog.nodeProgressMap = target.nodeProgressMap || {};
    saveCourseProgress(prog, target.activeCourseId);
  }
  function getClaimedBonuses() {
    try {
      const raw = storage.get('vocadash_claimed_bonuses');
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
    } catch (_) { }
    return getCourseProgress(target.activeCourseId).claimedBonuses || [];
  }
  const isBonusClaimed = (nodeId = 'node-bonus') => getClaimedBonuses().includes(nodeId);
  function markBonusClaimed(nodeId = 'node-bonus') {
    const list = getClaimedBonuses();
    if (!list.includes(nodeId)) list.push(nodeId);
    if (nodeId === 'node-bonus' && !list.includes('u1_node-bonus')) list.push('u1_node-bonus');
    storage.set('vocadash_claimed_bonuses', JSON.stringify(list));
    const prog = getCourseProgress(target.activeCourseId);
    prog.claimedBonuses = list;
    saveCourseProgress(prog, target.activeCourseId);
  }
  function migrateLegacyReviewData() {
    let list = [];
    try {
      const raw = storage.get('vocadash_completed_reviews');
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) list = parsed; }
    } catch (_) { }
    if (storage.get('vocadash_review_completed_node-review') === 'true' && !list.includes('u1_node-review')) {
      list.push('u1_node-review', 'node-review');
      storage.set('vocadash_completed_reviews', JSON.stringify(list));
    }
    return list;
  }
  function isReviewNodeCompleted(nodeId = 'node-review', unitNum = 1) {
    const coords = parseNodeCoordinates(nodeId, unitNum);
    const uIndex = (/^u\d+_/i.test(nodeId)) ? coords.unitIndex : (unitNum || coords.unitIndex || 1);
    const compositeKey = `u${uIndex}_node-review`, list = migrateLegacyReviewData();
    if (list.includes(compositeKey) || (uIndex === 1 && (list.includes('node-review') || list.includes('u1_node-review')))) return true;
    if (target.nodeProgressMap && (target.nodeProgressMap[compositeKey] || (uIndex === 1 && target.nodeProgressMap['node-review']))) return true;
    try {
      const uData = JSON.parse(storage.get('vocadash_user_data') || '{}');
      if (uData.clearedNodes?.[compositeKey]?.cleared || (uIndex === 1 && uData.clearedNodes?.['node-review']?.cleared)) return true;
    } catch (_) { }
    return false;
  }
  function markReviewNodeCompleted(nodeId = 'node-review', unitNum = 1) {
    const coords = parseNodeCoordinates(nodeId, unitNum);
    const uIndex = (/^u\d+_/i.test(nodeId)) ? coords.unitIndex : (unitNum || coords.unitIndex || 1);
    const compositeKey = `u${uIndex}_node-review`, list = migrateLegacyReviewData();
    if (!list.includes(compositeKey)) list.push(compositeKey);
    if (uIndex === 1 && !list.includes('node-review')) list.push('node-review');
    storage.set('vocadash_completed_reviews', JSON.stringify(list));
    if (uIndex === 1) storage.set('vocadash_review_completed_node-review', 'true');
    const prog = getCourseProgress(target.activeCourseId);
    if (!prog.completedReviews) prog.completedReviews = [];
    if (!prog.completedReviews.includes(compositeKey)) prog.completedReviews.push(compositeKey);
    if (uIndex === 1 && !prog.completedReviews.includes('node-review')) prog.completedReviews.push('node-review');
    saveCourseProgress(prog, target.activeCourseId);
  }
  function completeReviewNode(nodeId = 'node-review', unitId = null) {
    const coords = parseNodeCoordinates(nodeId), uIndex = unitId || coords.unitIndex || target.currentUnitNumber || 1, compositeKey = `u${uIndex}_node-review`;
    markReviewNodeCompleted(compositeKey, uIndex);
    if (!target.nodeProgressMap) target.nodeProgressMap = {};
    target.nodeProgressMap[compositeKey] = target.nodeProgressMap[`u${uIndex}_review`] = 1;
    if (uIndex === 1) target.nodeProgressMap['node-review'] = 1;
    if (!Array.isArray(target.completedStages)) target.completedStages = [];
    for (const k of [nodeId, compositeKey]) if (!target.completedStages.includes(k)) target.completedStages.push(k);
    try {
      let uData = JSON.parse(storage.get('vocadash_user_data') || '{}');
      if (!uData.clearedNodes) uData.clearedNodes = {};
      uData.clearedNodes[compositeKey] = { cleared: true, clearedCount: 1 };
      if (uIndex === 1) uData.clearedNodes['node-review'] = { cleared: true, clearedCount: 1 };
      storage.set('vocadash_user_data', JSON.stringify(uData));
    } catch (_) { }
    target.saveNodeProgress?.(); target.updateRoadmapNodesUI?.(); target.renderRoadmap?.();
  }
  function handleClaimBonus(nodeId = 'node-bonus', unitNum = 1) {
    if (!isNodeUnlocked(unitNum - 1, 1, { type: 'bonus', id: nodeId })) return target.showToast?.('1과를 먼저 완료해야 열려요! 🔒');
    if (isBonusClaimed(nodeId)) return target.showToast?.('이미 수령한 보너스 선물입니다. 📦');
    let curGems = (parseInt(storage.get('vocadash_gems'), 10) || 120) + 15;
    storage.set('vocadash_gems', String(curGems));
    const gemsEl = document.getElementById('header-gems-count'); if (gemsEl) gemsEl.textContent = curGems;
    target.playSound?.('gem');
    markBonusClaimed(nodeId);
    target.showToast?.('🎁 보너스 선물 도착! 보석 +15개를 획득했습니다! 💎', '🎉');
    target.openBonusModal?.(nodeId); target.updateRoadmapNodesUI?.(); target.renderRoadmap?.();
  }
  function handleReviewNodeClick(nodeId = 'node-review', unitNum = 1) {
    const bonusId = (unitNum === 1) ? 'node-bonus' : `u${unitNum}-bonus`;
    if (!isBonusClaimed(bonusId)) return target.showToast?.('보너스 선물상자를 먼저 수령해 주세요! 🎁');
    let weakWords = [];
    try { const saved = JSON.parse(storage.get('vocadash_weak_word_ids') || '[]'); if (Array.isArray(saved)) weakWords = saved.filter(Boolean); } catch (_) { }
    if (weakWords.length > 0) {
      if (typeof target.openReviewSpeedrunModal === 'function') target.openReviewSpeedrunModal();
      else target.showToast?.('⚡ 오답 단어 복습 세션을 시작합니다!');
    } else {
      markReviewNodeCompleted(nodeId, unitNum);
      target.showToast?.('멋져요! 틀린 단어가 없어 약점 복습을 패스합니다. (+10 XP) ✨', '🎉');
      target.updateRoadmapNodesUI?.(); target.renderRoadmap?.();
    }
  }

  function resolveCurrentNode(lessonId) {
    const targetId = lessonId || target.currentGameLessonId || target.currentSelectedNodeId || 'node-2';
    const activeCourse = (typeof target.getCurrentCourseData === 'function') ? target.getCurrentCourseData() : (target.packFootballData || target.courseData);
    const lang = getLang(), curUnitIdx = Math.max(0, ((typeof target.getUnlockedUnitLevel === 'function' ? target.getUnlockedUnitLevel(lang) : 1) || 1) - 1);
    const curUnit = activeCourse?.units?.[curUnitIdx] || activeCourse?.units?.[0];
    let foundNode = curUnit?.nodes?.find(n => n.id === targetId);
    if (!foundNode && curUnit?.nodes) {
      const s = String(targetId).toLowerCase();
      if (s === 'node-1' || s.endsWith('_n1')) foundNode = curUnit.nodes.find(n => n.stageNumber === 1 || n.id?.endsWith('_n1'));
      else if (s === 'node-2' || s.endsWith('_n2')) foundNode = curUnit.nodes.find(n => n.stageNumber === 2 || n.id?.endsWith('_n2'));
      else if (s === 'node-3' || s.endsWith('_n5')) foundNode = curUnit.nodes.find(n => n.stageNumber === 3 || n.id?.endsWith('_n5'));
      else if (s === 'node-boss' || s.includes('boss') || s.endsWith('_n6')) foundNode = curUnit.nodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6'));
    }
    if (!foundNode && activeCourse?.units) {
      for (const u of activeCourse.units) { foundNode = u.nodes?.find(n => n.id === targetId); if (foundNode) break; }
    }
    if (!foundNode) {
      const coords = parseNodeCoordinates(targetId), sNum = coords.nodeIndex === 'boss' ? 4 : (Number(coords.nodeIndex) || 2);
      foundNode = { id: targetId, stageNumber: sNum, type: (sNum === 4 || String(targetId).includes('boss')) ? 'boss' : 'stage' };
    }
    return foundNode;
  }
  function getSlotAlias(activeNodeId, targetNodeId) {
    const check = (id) => {
      if (!id) return null;
      const s = String(id).toLowerCase();
      if (s === 'node-1' || s.endsWith('_n1') || s.endsWith('node-1') || s.endsWith('stage-1')) return 'node-1';
      if (s === 'node-2' || s.endsWith('_n2') || s.endsWith('node-2') || s.endsWith('stage-2')) return 'node-2';
      if (s.endsWith('_n5') || s.endsWith('node-3') || s.endsWith('stage-3')) return 'node-3';
      if (s.endsWith('_n6') || s.includes('boss')) return 'node-boss';
      return null;
    };
    return check(targetNodeId) || check(activeNodeId) || null;
  }
  function getNextNodeId(curNodeId, curUnit) {
    const slot = getSlotAlias(curNodeId, curNodeId);
    if (curUnit?.nodes) {
      if (slot === 'node-1') return curUnit.nodes.find(n => n.stageNumber === 2 || n.id?.endsWith('_n2'))?.id || 'node-2';
      if (slot === 'node-2') return curUnit.nodes.find(n => n.type === 'bonus' || n.id?.endsWith('_n3'))?.id || 'node-bonus';
      if (slot === 'node-3') return curUnit.nodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6'))?.id || 'node-boss';
    }
    return slot === 'node-1' ? 'node-2' : (slot === 'node-2' ? 'node-bonus' : 'node-boss');
  }

  function saveStageClearResult(resultData = {}) {
    const { nodeId, accuracy = null, questions = [], missedWords = [], isReviewMode = false, isSpeedrun = false } = resultData, lang = getLang();
    let rawTarget = nodeId || target.currentGameLessonId || target.currentSelectedNodeId || 'node-1';
    let cid = (String(rawTarget).startsWith('fb_') || target.isFootballMode) ? 'pack_football' : getCourse(target.activeCourseId, lang);
    target.activeCourseId = cid;
    let n1Saved = 0;
    try {
      const raw = storage.get(`vocadash_prog_${lang}_${cid}_u1_n1`);
      if (raw !== null) n1Saved = parseInt(raw, 10) || (JSON.parse(raw)?.clearedCount ?? 0);
    } catch (_) { }
    if (n1Saved < 3 && (rawTarget === 'node-2' || String(rawTarget).includes('n2') || String(rawTarget).includes('node-2'))) rawTarget = 'node-1';
    const currentNode = resolveCurrentNode(rawTarget), activeNodeId = (rawTarget === 'node-1') ? 'node-1' : (currentNode?.id || rawTarget);
    const isBossNode = currentNode?.type === 'boss' || String(activeNodeId).includes('boss'), coords = parseNodeCoordinates(activeNodeId);
    const uNum = coords.unitIndex || target.currentUnitNumber || 1, nIdx = coords.nodeIndex || 1;
    let currentCount = Number(getNodeProgress(activeNodeId, lang, cid)) || 0, nextCount = isBossNode ? 3 : Math.min(3, currentCount + 1);
    let calculatedAccuracy = 100;
    if (accuracy !== null && !isNaN(Number(accuracy))) calculatedAccuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy))));
    else {
      const wrongCount = Array.isArray(missedWords) ? missedWords.length : 0, totalQ = (Array.isArray(questions) && questions.length) || 10;
      calculatedAccuracy = wrongCount === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((totalQ - wrongCount) / totalQ) * 100)));
    }
    const stars = calculatedAccuracy >= 90 ? 3 : (calculatedAccuracy >= 70 ? 2 : (calculatedAccuracy >= 50 ? 1 : 0));
    target.lastEarnedStars = stars;
    if (Array.isArray(questions) && questions.length > 0) target.addMasteredWords?.(questions);
    target.updateProfileStats?.();
    const addGems = isBossNode ? 20 : 10, addXp = isBossNode ? 100 : 50;
    let curGems = (parseInt(storage.get('vocadash_gems'), 10) || 120) + addGems;
    storage.set('vocadash_gems', String(curGems));
    if (isBossNode) setUnlockedUnitLevel(uNum + 1, lang, cid);
    const isStrictReview = String(activeNodeId).includes('review') && (isReviewMode || isSpeedrun || String(activeNodeId).includes('review'));
    if (isStrictReview) completeReviewNode(activeNodeId, uNum);
    else {
      setNodeProgress(activeNodeId, nextCount, nextCount, lang, cid);
      if (uNum === 1 && (nIdx === 3 || String(activeNodeId).includes('3'))) {
        try {
          storage.set(`vocadash_prog_${lang}_${cid}_u1_n3`, String(nextCount)); storage.set('u1_node-3', String(nextCount)); storage.set('u1_stage-3', String(nextCount));
          let uData = JSON.parse(storage.get('vocadash_user_data') || '{}');
          if (!uData.clearedNodes) uData.clearedNodes = {};
          uData.clearedNodes['node-3'] = uData.clearedNodes['u1_node-3'] = { cleared: nextCount >= 3, clearedCount: nextCount, actuallyPlayed: true };
          storage.set('vocadash_user_data', JSON.stringify(uData));
        } catch (_) { }
        target.nodeProgressMap['node-3'] = target.nodeProgressMap['u1_node-3'] = nextCount;
      }
    }
    target.saveNodeProgress?.(); target.updateRoadmapNodesUI?.(); target.renderRoadmap?.();
    return { activeNodeId, nextCount, accuracy: calculatedAccuracy, stars, addGems, curGems, addXp, isBoss: isBossNode, unitIndex: uNum, nodeIndex: nIdx };
  }

  function getNextStageStep(nodeId, lastStars = 3) {
    const currentPlayingId = nodeId || target.currentGameLessonId || 'node-1', coords = parseNodeCoordinates(currentPlayingId);
    const currentUnitId = coords.unitIndex || 1, currentNodeIdx = coords.nodeIndex, lang = getLang(), cid = getCourse(target.activeCourseId, lang);
    let curCount = Number(getNodeProgress(currentPlayingId, lang, cid)) || 0;
    if (target.nodeProgressMap?.[currentPlayingId] !== undefined) curCount = Math.max(curCount, Number(target.nodeProgressMap[currentPlayingId]) || 0);
    const isCurrentBoss = currentNodeIdx === 'boss' || currentNodeIdx === 6 || String(currentPlayingId).includes('boss');
    let nextNodeId = `u${currentUnitId}_node-${currentNodeIdx}`, nextRound = Math.min(3, curCount + 1);
    if (lastStars === 0) nextRound = curCount;
    else if (isCurrentBoss || curCount >= 3) {
      nextRound = 1;
      if (isCurrentBoss) {
        const nextUnitId = currentUnitId + 1;
        nextNodeId = `u${nextUnitId}_node-1`;
        setUnlockedUnitLevel(nextUnitId, lang, cid);
        target.currentUnitNumber = nextUnitId;
        if (!target.nodeProgressMap) target.nodeProgressMap = {};
        target.nodeProgressMap[nextNodeId] = 0;
      } else if (currentNodeIdx === 1 || String(currentPlayingId).endsWith('1')) nextNodeId = `u${currentUnitId}_node-2`;
      else if (currentNodeIdx === 2 || String(currentPlayingId).endsWith('2')) nextNodeId = `u${currentUnitId}_node-3`;
      else if (currentNodeIdx === 3 || String(currentPlayingId).endsWith('3')) nextNodeId = `u${currentUnitId}_node-boss`;
    }
    if (!Array.isArray(target.unlockedNodes)) target.unlockedNodes = [];
    if (!target.unlockedNodes.includes(nextNodeId)) target.unlockedNodes.push(nextNodeId);
    if (currentUnitId === 1 && nextNodeId.includes('boss') && !target.unlockedNodes.includes('node-boss')) target.unlockedNodes.push('node-boss');
    const nextSession = (target.quizSessionGenerator?.generateDeckForStage) ? target.quizSessionGenerator.generateDeckForStage(nextNodeId, lang, nextRound) : null;
    return { action: 'learning_pipeline', currentPlayingId, nextNodeId, nextRound, nextSession };
  }

  function renderUnitOverviewList(targetLang) {
    const lang = getLang(targetLang), listEl = document.getElementById('unit-overview-list'), unlockedLevel = getUnlockedUnitLevel(lang);
    const activeCourse = (typeof target.getCurrentCourseData === 'function') ? target.getCurrentCourseData() : null;
    const presets = target.UNIT_LIST_PRESETS || null, units = (presets && presets[lang]) || activeCourse?.units || [];
    const titleEl = document.getElementById('unit-overview-title'), subEl = document.getElementById('unit-overview-subtitle');
    if (titleEl) titleEl.textContent = (target.activeCourseId === 'pack_football') ? '⚽ 축구 단어팩 코스 맵' : (lang === 'en' ? '영어 코스 맵' : '스페인어 코스 맵');
    if (subEl) subEl.textContent = `총 ${units.length}개 유닛 중 Unit ${unlockedLevel} 진행 중`;
    if (!listEl) return;
    listEl.innerHTML = units.map(item => {
      const isCompleted = item.unit < unlockedLevel, isCur = item.unit === unlockedLevel;
      const status = isCompleted ? 'completed' : (isCur ? 'active' : 'locked');
      const badgeText = isCompleted ? '완료됨' : (isCur ? '진행 중' : '잠김');
      const badgeClass = isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (isCur ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 border-slate-200');
      const icon = isCompleted ? 'check_circle' : (isCur ? 'chevron_right' : 'lock');
      return `<div class="unit-item-card p-3.5 rounded-2xl border-2 ${isCompleted ? 'border-emerald-500/80 bg-emerald-50/50' : (isCur ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200/80 bg-white/90 hover:bg-slate-50 opacity-85 hover:opacity-100')} flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all" data-unit="${item.unit}" data-title="${item.title || ''}" data-status="${status}">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl ${isCompleted || isCur ? 'bg-emerald-600' : 'bg-slate-100 text-slate-500'} text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">U${item.unit}</div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black ${isCompleted || isCur ? 'text-emerald-950' : 'text-slate-800'} leading-tight">Unit ${item.unit} : ${item.title}</span>
              <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight leading-none border ${badgeClass}">${badgeText}</span>
            </div>
            <span class="text-[11px] font-semibold ${isCompleted || isCur ? 'text-emerald-700' : 'text-slate-400'} mt-0.5 truncate">${item.subtitle || ''}</span>
          </div>
        </div>
        <div class="flex items-center text-emerald-700 font-extrabold flex-shrink-0 ml-2">
          <span class="material-symbols-outlined text-[20px] ${isCompleted ? 'text-emerald-600' : (isCur ? 'text-emerald-700' : 'text-slate-400')} font-bold">${icon}</span>
        </div>
      </div>`;
    }).join('');
  }

  function handleUnitOverviewListClick(e) {
    const card = e.target.closest('.unit-item-card');
    if (!card) return;
    const uNum = parseInt(card.dataset.unit, 10);
    const uTitle = card.dataset.title || '';
    const status = card.dataset.status;

    if (status === 'active' || status === 'completed') {
      closeUnitOverviewModal();
      const targetSection = document.querySelector(`.unit-section-block[data-unit-index="${uNum - 1}"]`);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      if (typeof target.showToast === 'function') {
        target.showToast(`🚀 Unit ${uNum} (${uTitle || '학습'}) 화면입니다!`);
      }
    } else {
      // 🔒 잠긴 유닛 카드 클릭 시 '건너뛰기 시험 안내 모달' 즉시 노출
      openUnitSkipModal(uNum, uTitle);
    }
  }

  function openUnitOverviewModal() {
    renderUnitOverviewList();
    const bd = document.getElementById('unit-overview-modal-backdrop'), card = document.getElementById('unit-overview-modal-card');
    if (bd && card) {
      bd.classList.remove('pointer-events-none', 'opacity-0');
      bd.classList.add('opacity-100');
      card.classList.remove('pointer-events-none', 'translate-y-full', 'sm:scale-95', 'opacity-0');
      card.classList.add('translate-y-0', 'sm:scale-100', 'opacity-100');
    }
  }
  function closeUnitOverviewModal() {
    const bd = document.getElementById('unit-overview-modal-backdrop'), card = document.getElementById('unit-overview-modal-card');
    if (bd && card) {
      bd.classList.remove('opacity-100');
      bd.classList.add('pointer-events-none', 'opacity-0');
      card.classList.remove('translate-y-0', 'sm:scale-100', 'opacity-100');
      card.classList.add('pointer-events-none', 'translate-y-full', 'sm:scale-95', 'opacity-0');
    }
  }
  function openUnitSkipModal(unitNum, unitTitle) {
    target.currentSkipTestUnit = parseInt(unitNum, 10) || 2;
    target.currentSkipTestUnitTitle = unitTitle || `Unit ${target.currentSkipTestUnit}`;
    const titleEl = document.getElementById('unit-skip-modal-title');
    if (titleEl) titleEl.textContent = `⚡ Unit ${target.currentSkipTestUnit} 건너뛰기 시험`;
    const bd = document.getElementById('unit-skip-modal-backdrop'), card = document.getElementById('unit-skip-modal-card');
    if (bd && card) {
      bd.classList.remove('pointer-events-none', 'opacity-0');
      bd.classList.add('opacity-100');
      card.classList.remove('pointer-events-none', 'scale-95', 'opacity-0');
      card.classList.add('scale-100', 'opacity-100');
    }
  }
  function closeUnitSkipModal() {
    const bd = document.getElementById('unit-skip-modal-backdrop'), card = document.getElementById('unit-skip-modal-card');
    if (bd && card) {
      bd.classList.remove('opacity-100');
      bd.classList.add('pointer-events-none', 'opacity-0');
      card.classList.remove('scale-100', 'opacity-100');
      card.classList.add('pointer-events-none', 'scale-95', 'opacity-0');
    }
  }
  function startUnitSkipTest(targetUnit = 2) {
    target.isUnitSkipTestMode = true; target.currentSkipTestUnit = targetUnit;
    const questions = (target.quizSessionGenerator?.generateDeckForStage?.('node-boss', getLang(), 1) || []).slice(0, 15);
    target.currentSessionQuestions = questions;
    target.openGameScreen?.('node-skip-test', questions);
  }
  function initUnitOverviewEvents() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el && !el._bound) { el.addEventListener('click', fn); el._bound = true; } };
    on('unit-banner', openUnitOverviewModal); on('unit-dropdown-btn', openUnitOverviewModal);
    on('close-unit-overview-btn', closeUnitOverviewModal); on('unit-overview-confirm-btn', closeUnitOverviewModal);
    on('btn-close-unit-skip-modal', closeUnitSkipModal);
    on('btn-start-unit-skip-test', () => { closeUnitSkipModal(); closeUnitOverviewModal(); startUnitSkipTest(target.currentSkipTestUnit || 2); });
    const listEl = document.getElementById('unit-overview-list');
    if (listEl && !listEl._bound) { listEl.addEventListener('click', handleUnitOverviewListClick); listEl._bound = true; }
    const overviewBd = document.getElementById('unit-overview-modal-backdrop');
    if (overviewBd && !overviewBd._bound) { overviewBd.addEventListener('click', (e) => { if (e.target === overviewBd) closeUnitOverviewModal(); }); overviewBd._bound = true; }
    const skipBd = document.getElementById('unit-skip-modal-backdrop');
    if (skipBd && !skipBd._bound) { skipBd.addEventListener('click', (e) => { if (e.target === skipBd) closeUnitSkipModal(); }); skipBd._bound = true; }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUnitOverviewEvents);
    else initUnitOverviewEvents();
  }
  try { target.nodeProgressMap = loadNodeProgress(); } catch (_) { target.nodeProgressMap = { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 }; }
  Object.assign(target, {
    getCompositeNodeKey, parseNodeCoordinates, getCourseProgress, saveCourseProgress, getUnlockedUnitLevel, setUnlockedUnitLevel,
    unlockUnitsUpTo, getNodeProgress, getNodeProgressData: getNodeProgress, setNodeProgress, saveNodeProgressData: setNodeProgress,
    resolveNodeData, isNodeUnlocked, getNodeStatus, loadNodeProgress, saveNodeProgress, getClaimedBonuses, isBonusClaimed,
    markBonusClaimed, handleClaimBonus, migrateLegacyReviewData, isReviewNodeCompleted, markReviewNodeCompleted, completeReviewNode,
    handleReviewNodeClick, resolveCurrentNode, getSlotAlias, getNextNodeId, saveStageClearResult, getNextStageStep,
    renderUnitOverviewList, openUnitOverviewModal, closeUnitOverviewModal, openUnitSkipModal, closeUnitSkipModal, startUnitSkipTest
  });
})(typeof window !== 'undefined' ? window : this);
