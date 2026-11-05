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
    if (cid === 'es_soccer' || cid === 'pack_football') {
      return (getLang(lang) !== 'en') ? 'pack_football' : 'main';
    }
    return 'main';
  };
  function getCompositeNodeKey(nodeId, unitId = null) {
    if (!nodeId) return `u${unitId || 1}_node-1`;
    const str = String(nodeId).trim();
    return /^u\d+_/i.test(str) ? str : `u${unitId || target.currentUnitNumber || 1}_${str}`;
  }
  function parseNodeCoordinates(nodeId, defaultUnit = null) {
    const fallbackUnit = defaultUnit || target.currentUnitNumber || 1;
    if (!nodeId) return { unitIndex: fallbackUnit, nodeIndex: 1 };
    const str = String(nodeId).trim();
    const uM = str.match(/(?:^|[_uU])(\d+)(?:[_nN-]|$)/);
    const u = uM ? (parseInt(uM[1], 10) || fallbackUnit) : fallbackUnit;
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
  function getMaxCourseUnits(courseId, targetLang) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId => targetCourseId, lang);
    const resolvedCid = (cid === 'pack_football' || courseId === 'es_soccer') ? 'es_soccer' : (lang === 'en' ? 'en_main' : 'es_main');
    const cs = target.courseSections;
    if (cs && cs[resolvedCid] && Array.isArray(cs[resolvedCid].sections)) {
      const lastSec = cs[resolvedCid].sections[cs[resolvedCid].sections.length - 1];
      if (lastSec && typeof lastSec.unitEnd === 'number') return lastSec.unitEnd;
    }
    return (lang === 'en') ? 166 : 216;
  }
  function getUnlockedUnitLevel(targetLang, targetCourseId) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId, lang);
    const maxUnits = getMaxCourseUnits(cid, lang);
    try {
      const val = storage.get(`vocadash_unlocked_${lang}_${cid}`);
      if (val !== null) { const num = parseInt(val, 10); if (!isNaN(num) && num >= 1 && num <= maxUnits) return num; }
    } catch (_) { }
    return 1;
  }
  function setUnlockedUnitLevel(level, targetLang, targetCourseId) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId, lang);
    const maxUnits = getMaxCourseUnits(cid, lang);
    const lvl = Math.max(1, Math.min(maxUnits, parseInt(level, 10) || 1));
    storage.set(`vocadash_unlocked_${lang}_${cid}`, String(lvl));
    storage.set(`vocadash_unlocked_unit_${lang}_${cid}`, String(lvl));
    storage.set(`vocadash_unlocked_unit_${cid}`, String(lvl));
    storage.set(`vocadash_unlocked_unit_${lang}`, String(lvl));
    storage.set('vocadash_current_unit', String(lvl));
    const prog = getCourseProgress(cid, lang);
    if (!prog.unlockedUnits) prog.unlockedUnits = [1];
    for (let u = 1; u <= lvl; u++) if (!prog.unlockedUnits.includes(u)) prog.unlockedUnits.push(u);
    prog.currentUnit = lvl;
    target.currentUnitNumber = lvl;
    target._currentVisibleUnitIndex = lvl - 1;
    saveCourseProgress(prog, cid, lang);

    // 💡 [Back-fill Unlock] 상위 유닛 도달 시 이전 번호(1 ~ lvl-1) 모든 게이트/노드 자동 완벽 해금
    if (!target.nodeProgressMap) target.nodeProgressMap = {};
    for (let u = 1; u < lvl; u++) {
      [1, 2, 3].forEach(n => {
        const stdKey = `vocadash_prog_${lang}_${cid}_u${u}_n${n}`;
        storage.set(stdKey, '3');
        storage.set(`node_progress_${lang}_${cid}_u${u}_node-${n}`, '3');
        storage.set(`node_progress_${lang}_${cid}_u${u}_stage-${n}`, '3');
        target.nodeProgressMap[`u${u}_node-${n}`] = 3;
        target.nodeProgressMap[`u${u}_stage-${n}`] = 3;
        target.nodeProgressMap[`${lang}_${cid}_u${u}_n${n}`] = 3;
        if (u === 1) {
          storage.set(`node_progress_${lang}_${cid}_node-${n}`, '3');
          target.nodeProgressMap[`node-${n}`] = 3;
        }
      });
      const bossKey = `vocadash_prog_${lang}_${cid}_u${u}_n6`;
      storage.set(bossKey, '1');
      storage.set(`node_progress_${lang}_${cid}_u${u}_node-boss`, '1');
      target.nodeProgressMap[`u${u}_node-boss`] = 1;
      target.nodeProgressMap[`${lang}_${cid}_u${u}_n6`] = 1;
      if (u === 1) {
        storage.set(`node_progress_${lang}_${cid}_node-boss`, '1');
        target.nodeProgressMap['node-boss'] = 1;
      }

      // 보너스 및 복습 완료 상태도 이전 유닛들에 대해 안전하게 동기화
      const bonusKey = `u${u}_node-bonus`;
      markBonusClaimed(bonusKey);
      target.nodeProgressMap[bonusKey] = 1;
      if (u === 1) target.nodeProgressMap['node-bonus'] = 1;

      const reviewKey = `u${u}_node-review`;
      markReviewNodeCompleted(reviewKey, u);
      target.nodeProgressMap[reviewKey] = 1;
      if (u === 1) target.nodeProgressMap['node-review'] = 1;
    }

    // 목표 유닛의 첫 번째 스테이지 활성화 보장
    if (target.nodeProgressMap[`u${lvl}_node-1`] === undefined) {
      target.nodeProgressMap[`u${lvl}_node-1`] = 0;
    }
    if (lvl === 1 && target.nodeProgressMap['node-1'] === undefined) {
      target.nodeProgressMap['node-1'] = 0;
    }
    try {
      if (typeof saveNodeProgressData === 'function') saveNodeProgressData();
    } catch (_) { }

    return lvl;
  }

  function unlockUnitsUpTo(maxLevel, targetLang, targetCourseId) {
    const lvl = setUnlockedUnitLevel(maxLevel, targetLang, targetCourseId);
    target.currentUnitNumber = lvl;
    target._currentVisibleUnitIndex = lvl - 1;
    target.renderRoadmap?.();
    return lvl;
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
    const unitNum = currentUnitIndex + 1;
    const unlockedLevel = (typeof target.getUnlockedUnitLevel === 'function' ? target.getUnlockedUnitLevel(lang, courseId) : 1) || 1;
    if (unitNum < unlockedLevel) return true;
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
      if (nodeId === 'node-1' || nodeId === 'fb_1_n1' || nodeId === 'es_1_n1' || nodeId === 'en_1_n1' || nodeIndex === 0) return true;
      const p1 = (getNodeProgress('node-1', lang, courseId)?.clearedCount || 0);
      if (nodeId === 'node-2' || nodeId === 'fb_1_n2' || nodeId === 'es_1_n2' || nodeId === 'en_1_n2' || (nodeIndex === 1 && (nodeType === 'stage' || !nodeType))) return p1 >= 3;
      const p2 = (getNodeProgress('node-2', lang, courseId)?.clearedCount || 0);
      const isBonusDone = isBonusClaimed('node-bonus') || isBonusClaimed('fb_1_n3') || isBonusClaimed('es_1_n3') || isBonusClaimed('en_1_n3');
      if (nodeId === 'node-bonus' || nodeId === 'fb_1_n3' || nodeId === 'es_1_n3' || nodeId === 'en_1_n3' || nodeType === 'bonus' || nodeIndex === 2 || String(nodeId).includes('bonus')) return p2 >= 3;
      if (nodeId === 'node-review' || nodeId === 'fb_1_n4' || nodeId === 'es_1_n4' || nodeId === 'en_1_n4' || nodeType === 'review' || nodeIndex === 3 || String(nodeId).includes('review')) return p2 >= 3 && isBonusDone;
      const isReviewDone = isReviewNodeCompleted('node-review', 1) || isReviewNodeCompleted('fb_1_n4', 1) || isReviewNodeCompleted('es_1_n4', 1) || isReviewNodeCompleted('en_1_n4', 1);
      if (nodeId === 'node-3' || nodeId === 'u1_node-3' || nodeId === 'fb_1_n5' || nodeId === 'es_1_n5' || nodeId === 'en_1_n5' || nodeIndex === 4 || (nodeType === 'stage' && (node?.stageNumber === 3 || String(nodeId).endsWith('3')))) return isReviewDone;
      if (nodeId === 'node-boss' || nodeId === 'u1_node-boss' || nodeId === 'fb_1_n6' || nodeId === 'es_1_n6' || nodeId === 'en_1_n6' || nodeType === 'boss' || nodeIndex === 5 || String(nodeId).includes('boss')) return (getNodeProgress('node-3', lang, courseId)?.clearedCount || 0) >= 3;
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
      if (!(uData.clearedNodes?.['node-3']?.actuallyPlayed || uData.clearedNodes?.['u1_node-3']?.actuallyPlayed) && result['node-3'] > 0) {
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
  const isBonusClaimed = (nodeId = 'node-bonus') => {
    const list = getClaimedBonuses();
    if (list.includes(nodeId)) return true;
    if (nodeId === 'node-bonus' || nodeId === 'u1_node-bonus' || nodeId === 'es_1_n3' || nodeId === 'en_1_n3' || nodeId === 'fb_1_n3') {
      return list.includes('node-bonus') || list.includes('u1_node-bonus') || list.includes('es_1_n3') || list.includes('en_1_n3') || list.includes('fb_1_n3');
    }
    const coords = parseNodeCoordinates(nodeId);
    if (coords.unitIndex) {
      const u = coords.unitIndex;
      return list.includes(`u${u}_node-bonus`) || list.includes(`u${u}-bonus`) || list.includes(`es_${u}_n3`) || list.includes(`en_${u}_n3`) || list.includes(`fb_${u}_n3`);
    }
    return false;
  };
  function markBonusClaimed(nodeId = 'node-bonus') {
    const list = getClaimedBonuses();
    if (!list.includes(nodeId)) list.push(nodeId);
    if (nodeId === 'node-bonus' || String(nodeId).endsWith('_n3') || String(nodeId).includes('bonus')) {
      const coords = parseNodeCoordinates(nodeId);
      const u = coords.unitIndex || 1;
      const aliases = [`u${u}_node-bonus`, `u${u}-bonus`, `es_${u}_n3`, `en_${u}_n3`, `fb_${u}_n3`];
      if (u === 1) aliases.push('node-bonus');
      aliases.forEach(a => { if (!list.includes(a)) list.push(a); });
      try {
        const lang = getLang();
        localStorage.setItem(`vocadash_${lang}_bonus_u${u}`, 'done');
      } catch (_) {}
    }
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
    if (!isNodeUnlocked(unitNum - 1, 2, { type: 'bonus', id: nodeId })) return target.showToast?.('2과를 먼저 완료해야 열려요! 🔒');
    if (isBonusClaimed(nodeId)) return target.showToast?.('이미 수령한 보너스 선물입니다. 📦');
    let curGems = (parseInt(storage.get('vocadash_gems'), 10) || 120) + 15;
    storage.set('vocadash_gems', String(curGems));
    const gemsEl = document.getElementById('header-gems-count'); if (gemsEl) gemsEl.textContent = curGems;
    target.playSound?.('gem');
    markBonusClaimed(nodeId);
    target.showToast?.('🎁 보너스 선물 도착! 보석 +15개를 획득했습니다! 💎', '🎉');
    target.openBonusModal?.(nodeId); target.updateRoadmapNodesUI?.(); target.renderRoadmap?.();
  }

  // 💡 [단일 책임] 보너스 상자 모달 '보상 받기' 클릭 시 전용 수령 처리 함수
  function claimBonusReward(nodeId = 'node-bonus') {
    if (!nodeId) nodeId = 'node-bonus';
    if (isBonusClaimed(nodeId)) {
      target.showToast?.('이미 수령한 보너스 선물입니다. 📦');
      return false;
    }

    // 1. 보석 +15개 합산 및 로컬스토리지 / 상단 헤더 UI 즉시 갱신
    let curGems = (parseInt(storage.get('vocadash_gems'), 10) || 120) + 15;
    storage.set('vocadash_gems', String(curGems));
    const gemsEl = document.getElementById('header-gems-count');
    if (gemsEl) gemsEl.textContent = curGems;

    // 2. 수령 완료 상태 확정 저장 (isBonusClaimed(nodeId) -> true)
    markBonusClaimed(nodeId);
    target.playSound?.('gem');

    // 3. 로드맵 노드 UI 및 순차 해금 파이프라인(약점 복습 해금) 즉시 재렌더링
    target.updateRoadmapNodesUI?.();
    target.renderRoadmap?.();

    target.showToast?.('🎁 보너스 선물 수령 완료! 💎 +15 다이아몬드 획득!', '🎉');
    return true;
  }
  function handleReviewNodeClick(nodeId = 'node-review', unitNum = 1) {
    const bonusId = (unitNum === 1) ? 'node-bonus' : `u${unitNum}-bonus`;
    if (!isBonusClaimed(bonusId)) return target.showToast?.('보너스 선물상자를 먼저 수령해 주세요! 🎁');

    if (typeof target.openReviewSpeedrunModal === 'function') {
      target.openReviewSpeedrunModal(unitNum, nodeId);
    } else if (typeof target.startRoadmapReviewSpeedrun === 'function') {
      target.startRoadmapReviewSpeedrun();
    } else {
      const session = (typeof target.generateReviewSession === 'function') ? target.generateReviewSession(unitNum, getLang()) : [];
      target.isReviewGameMode = true;
      target.isRoadmapReviewSpeedrun = true;
      target.openGameScreen?.(nodeId, session, { mode: 'review', isInfiniteHeart: false, isRoadmap: true });
    }
  }

  function resolveCurrentNode(lessonId) {
    const targetId = lessonId || target.currentGameLessonId || target.currentSelectedNodeId || 'node-2';
    const activeCourse = (typeof target.getCurrentCourseData === 'function') ? target.getCurrentCourseData() : (target.packFootballData || target.courseData);

    // 1. Direct ID match across all units
    if (activeCourse?.units) {
      for (const u of activeCourse.units) {
        const match = u.nodes?.find(n => n.id === targetId);
        if (match) return match;
      }
    }

    // 2. Lookup within the unit determined by targetId's coordinates
    const coords = parseNodeCoordinates(targetId);
    const uIndex = coords?.unitIndex || target.currentUnitNumber || 1;
    const curUnit = activeCourse?.units?.find(u => (u.unitNumber || u.id || u.unitId) === uIndex) || activeCourse?.units?.[uIndex - 1];

    if (curUnit?.nodes) {
      const s = String(targetId).toLowerCase();
      let foundNode = null;
      if (s === 'node-1' || s.endsWith('_n1') || coords.nodeIndex === 1) foundNode = curUnit.nodes.find(n => n.stageNumber === 1 || n.id?.endsWith('_n1'));
      else if (s === 'node-2' || s.endsWith('_n2') || coords.nodeIndex === 2) foundNode = curUnit.nodes.find(n => n.stageNumber === 2 || n.id?.endsWith('_n2'));
      else if (s === 'node-3' || s.endsWith('_n5') || coords.nodeIndex === 3) foundNode = curUnit.nodes.find(n => n.stageNumber === 3 || n.id?.endsWith('_n5'));
      else if (s === 'node-boss' || s.includes('boss') || s.endsWith('_n6') || coords.nodeIndex === 6) foundNode = curUnit.nodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6'));
      if (foundNode) return foundNode;
    }

    const sNum = coords.nodeIndex === 'boss' ? 6 : (Number(coords.nodeIndex) || 1);
    const isBoss = sNum === 6 || String(targetId).includes('boss');
    const isReview = coords.nodeIndex === 'review' || String(targetId).includes('review');
    const isBonus = coords.nodeIndex === 'bonus' || String(targetId).includes('bonus');
    const type = isBoss ? 'boss' : (isReview ? 'review' : (isBonus ? 'bonus' : 'stage'));
    return { id: targetId, stageNumber: sNum, type, unitNumber: uIndex };
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

  function getNextRoadmapNode(nodeId, unitNum = null) {
    const coords = parseNodeCoordinates(nodeId, unitNum || 1);
    const uIndex = unitNum || coords.unitIndex || target.currentUnitNumber || 1;
    const activeCourse = (typeof target.getCurrentCourseData === 'function')
      ? target.getCurrentCourseData()
      : (target.packFootballData || target.courseData);
    const curUnit = activeCourse?.units?.[uIndex - 1];

    if (curUnit && Array.isArray(curUnit.nodes) && curUnit.nodes.length > 0) {
      const nodes = curUnit.nodes;
      const idx = nodes.findIndex(n => {
        if (n.id === nodeId) return true;
        const c = parseNodeCoordinates(n.id, uIndex);
        if (c && c.nodeIndex === coords.nodeIndex) return true;
        if (coords.nodeIndex === 1 && (n.stageNumber === 1 || n.id?.endsWith('_n1') || n.id === 'node-1')) return true;
        if (coords.nodeIndex === 2 && (n.stageNumber === 2 || n.id?.endsWith('_n2') || n.id === 'node-2')) return true;
        if (coords.nodeIndex === 'bonus' && (n.type === 'bonus' || n.id?.includes('bonus') || n.id?.endsWith('_n3'))) return true;
        if (coords.nodeIndex === 'review' && (n.type === 'review' || n.id?.includes('review') || n.id?.endsWith('_n4'))) return true;
        if (coords.nodeIndex === 3 && (n.stageNumber === 3 || n.id?.endsWith('_n5') || n.id === 'node-3')) return true;
        if ((coords.nodeIndex === 6 || coords.nodeIndex === 'boss') && (n.type === 'boss' || n.id?.includes('boss') || n.id?.endsWith('_n6'))) return true;
        return false;
      });

      if (idx >= 0 && idx < nodes.length - 1) {
        return nodes[idx + 1];
      } else if (idx === nodes.length - 1) {
        const nextUnit = activeCourse.units?.[uIndex];
        if (nextUnit && Array.isArray(nextUnit.nodes) && nextUnit.nodes.length > 0) {
          return nextUnit.nodes[0];
        }
        return { id: `u${uIndex + 1}_stage-1`, stageNumber: 1, type: 'stage', title: '1과' };
      }
    }

    const isU1 = uIndex === 1;
    const nIdx = coords.nodeIndex;
    if (nIdx === 1) return { id: isU1 ? 'node-2' : `u${uIndex}_stage-2`, stageNumber: 2, type: 'stage', title: '2과' };
    if (nIdx === 2) return { id: isU1 ? 'node-bonus' : `u${uIndex}_node-bonus`, type: 'bonus', title: '보너스 상자' };
    if (nIdx === 'bonus') return { id: isU1 ? 'node-review' : `u${uIndex}_node-review`, type: 'review', title: '약점 복습' };
    if (nIdx === 'review') return { id: isU1 ? 'node-3' : `u${uIndex}_stage-3`, stageNumber: 3, type: 'stage', title: '3과' };
    if (nIdx === 3) return { id: isU1 ? 'node-boss' : `u${uIndex}_node-boss`, type: 'boss', title: `Unit ${uIndex} 보스전` };
    return { id: `u${uIndex + 1}_stage-1`, stageNumber: 1, type: 'stage', title: '1과' };
  }

  function saveStageClearResult(resultData = {}) {
    const { nodeId, accuracy = null, questions = [], missedWords = [], isReviewMode = false, isSpeedrun = false } = resultData, lang = getLang();
    let rawTarget = nodeId || target.currentGameLessonId || target.currentSelectedNodeId || 'node-1';
    let cid = (String(rawTarget).startsWith('fb_') || target.isFootballMode) ? 'pack_football' : getCourse(target.activeCourseId, lang);
    target.activeCourseId = cid;
    const currentNode = resolveCurrentNode(rawTarget), activeNodeId = (rawTarget === 'node-1') ? 'node-1' : (currentNode?.id || rawTarget);
    const isBossNode = currentNode?.type === 'boss' || String(activeNodeId).includes('boss'), coords = parseNodeCoordinates(activeNodeId);
    const uNum = coords.unitIndex || target.currentUnitNumber || 1, nIdx = coords.nodeIndex || 1;
    let currentCount = Number(getNodeProgress(activeNodeId, lang, cid)) || 0, nextCount = isBossNode ? 3 : Math.min(3, currentCount + 1);
    let calculatedAccuracy = 100;
    if (accuracy !== null && !isNaN(Number(accuracy))) calculatedAccuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy))));
    else {
      const attempts = Number(target.totalAttemptCount) || 0;
      const correct = Array.isArray(target.correctWords) ? target.correctWords.length : 0;
      if (attempts > 0 && correct > 0) {
        calculatedAccuracy = Math.max(0, Math.min(100, Math.round((correct / attempts) * 100)));
      } else if (attempts > 0 && correct === 0) {
        calculatedAccuracy = 0;
      } else {
        const wrongCount = Array.isArray(missedWords) ? missedWords.length : 0, totalQ = (Array.isArray(questions) && questions.length) || 10;
        calculatedAccuracy = wrongCount === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((totalQ - wrongCount) / totalQ) * 100)));
      }
    }
    // 💡 완주(saveStageClearResult 호출) 시 최소 50% 정확도 보장 (부활 후 완주 판정 정합성)
    if (calculatedAccuracy < 50) calculatedAccuracy = 50;
    const stars = calculatedAccuracy >= 90 ? 3 : (calculatedAccuracy >= 70 ? 2 : (calculatedAccuracy >= 50 ? 1 : 0));
    target.lastEarnedStars = stars;
    if (Array.isArray(questions) && questions.length > 0) target.addMasteredWords?.(questions);
    target.updateProfileStats?.();
    const addGems = isBossNode ? 20 : 10, addXp = isBossNode ? 100 : 50;
    let curGems = (parseInt(storage.get('vocadash_gems'), 10) || 120) + addGems;
    storage.set('vocadash_gems', String(curGems));
    if (isBossNode) setUnlockedUnitLevel(uNum + 1, lang, cid);
    const isStrictReview = Boolean(isReviewMode || isSpeedrun || (activeNodeId && String(activeNodeId).includes('review')));
    if (isStrictReview) {
      if (activeNodeId && String(activeNodeId).includes('review')) {
        completeReviewNode(activeNodeId, uNum);
      }
    } else {
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
      const nextNode = getNextRoadmapNode(currentPlayingId, currentUnitId);
      if (nextNode) {
        nextNodeId = nextNode.id;
        if (nextNode.type === 'bonus' || String(nextNode.id).includes('bonus')) {
          return { action: 'bonus', currentPlayingId, nextNodeId, nextRound: 1, unitIndex: currentUnitId, nextNode };
        }
        if (nextNode.type === 'review' || String(nextNode.id).includes('review')) {
          return { action: 'review', currentPlayingId, nextNodeId, nextRound: 1, unitIndex: currentUnitId, nextNode };
        }
        if (isCurrentBoss) {
          const nextUnitId = currentUnitId + 1;
          setUnlockedUnitLevel(nextUnitId, lang, cid);
          target.currentUnitNumber = nextUnitId;
          if (!target.nodeProgressMap) target.nodeProgressMap = {};
          target.nodeProgressMap[nextNodeId] = 0;
          return { action: 'next_unit', currentPlayingId, nextNodeId, nextUnitId, unitIndex: nextUnitId };
        }
      } else {
        if (isCurrentBoss) {
          const nextUnitId = currentUnitId + 1;
          nextNodeId = `u${nextUnitId}_node-1`;
          setUnlockedUnitLevel(nextUnitId, lang, cid);
          target.currentUnitNumber = nextUnitId;
          if (!target.nodeProgressMap) target.nodeProgressMap = {};
          target.nodeProgressMap[nextNodeId] = 0;
          return { action: 'next_unit', currentPlayingId, nextNodeId, nextUnitId, unitIndex: nextUnitId };
        } else if (currentNodeIdx === 1 || String(currentPlayingId).endsWith('1')) nextNodeId = `u${currentUnitId}_node-2`;
        else if (currentNodeIdx === 2 || String(currentPlayingId).endsWith('2')) {
          return { action: 'bonus', currentPlayingId, nextNodeId: (currentUnitId === 1) ? 'node-bonus' : `u${currentUnitId}_node-bonus`, nextRound: 1, unitIndex: currentUnitId };
        }
        else if (currentNodeIdx === 3 || String(currentPlayingId).endsWith('3')) nextNodeId = `u${currentUnitId}_node-boss`;
      }
    }
    if (!Array.isArray(target.unlockedNodes)) target.unlockedNodes = [];
    if (!target.unlockedNodes.includes(nextNodeId)) target.unlockedNodes.push(nextNodeId);
    if (currentUnitId === 1 && nextNodeId.includes('boss') && !target.unlockedNodes.includes('node-boss')) target.unlockedNodes.push('node-boss');
    const nextSession = (target.quizSessionGenerator?.generateDeckForStage) ? target.quizSessionGenerator.generateDeckForStage(nextNodeId, lang, nextRound) : null;
    return { action: 'learning_pipeline', currentPlayingId, nextNodeId, nextRound, nextSession };
  }

  function getActiveCEFRLevel(lang) {
    const curLang = lang || getLang();
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('vocadash_active_level_' + curLang);
        if (saved && ['a1', 'a2', 'b1', 'b2'].includes(saved.toLowerCase())) {
          return saved.toLowerCase();
        }
      }
    } catch (_) {}
    return 'a1';
  }

  function setActiveCEFRLevel(level, lang) {
    const curLang = lang || getLang();
    const lvl = String(level || 'a1').toLowerCase();
    const validLevel = ['a1', 'a2', 'b1', 'b2'].includes(lvl) ? lvl : 'a1';
    target.currentLevel = validLevel;
    if (typeof window !== 'undefined') window.currentLevel = validLevel;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vocadash_active_level_' + curLang, validLevel);
      }
    } catch (_) {}
    return validLevel;
  }

  function openCourseDrawerWrapper(sectionId) {
    if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
    if (typeof target.closeLessonModal === 'function') target.closeLessonModal();
    if (typeof window.closeBonusModal === 'function') window.closeBonusModal();
    if (typeof window.closeReviewSpeedrunModal === 'function') window.closeReviewSpeedrunModal();
    if (window.courseDrawer && typeof window.courseDrawer.open === 'function') {
      window.courseDrawer.open(sectionId);
    } else {
      const bd = document.getElementById('course-drawer-backdrop') || document.getElementById('unit-overview-modal-backdrop');
      const card = document.getElementById('course-drawer-card') || document.getElementById('unit-overview-modal-card');
      if (bd && card) {
        bd.classList.remove('pointer-events-none', 'opacity-0');
        bd.classList.add('opacity-100');
        card.classList.remove('pointer-events-none', 'translate-y-full', 'opacity-0');
        card.classList.add('translate-y-0', 'opacity-100');
      }
    }
  }

  function closeCourseDrawerWrapper() {
    if (window.courseDrawer && typeof window.courseDrawer.close === 'function') {
      window.courseDrawer.close();
    } else {
      const bd = document.getElementById('course-drawer-backdrop') || document.getElementById('unit-overview-modal-backdrop');
      const card = document.getElementById('course-drawer-card') || document.getElementById('unit-overview-modal-card');
      if (bd && card) {
        bd.classList.remove('opacity-100');
        bd.classList.add('pointer-events-none', 'opacity-0');
        card.classList.remove('translate-y-0', 'opacity-100');
        card.classList.add('pointer-events-none', 'translate-y-full', 'opacity-0');
      }
    }
  }

  function openUnitSkipModal(unitNum, unitTitle) {
    if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
    if (typeof target.closeLessonModal === 'function') target.closeLessonModal();
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
    if (typeof target.closeResultModal === 'function') target.closeResultModal();
    const uNum = parseInt(String(targetUnit).replace(/[^\d]/g, ''), 10) || 2;
    target.isUnitSkipTestMode = true;
    target.isJumpTestSession = true;
    target.currentSkipTestUnit = uNum;
    window.jumpTestHearts = 3;

    let questions = [];
    if (typeof target.generateJumpTestSession === 'function') {
      questions = target.generateJumpTestSession(uNum, 10);
    } else if (typeof window.generateJumpTestSession === 'function') {
      questions = window.generateJumpTestSession(uNum, 10);
    } else if (target.quizSessionGenerator?.generateJumpTestSession) {
      questions = target.quizSessionGenerator.generateJumpTestSession(uNum, 10);
    } else if (target.quizSessionGenerator?.generateDeckForStage) {
      questions = (target.quizSessionGenerator.generateDeckForStage('node-boss', getLang(), 1) || []).slice(0, 10);
    }
    target.currentSessionQuestions = questions;
    target.openGameScreen?.('node-skip-test', questions);
  }

  function initUnitOverviewEvents() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el && !el._bound) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fn(e);
        });
        el._bound = true;
      }
    };
    on('unit-banner', () => openCourseDrawerWrapper());
    on('unit-dropdown-btn', () => openCourseDrawerWrapper());
    on('unit-banner-content', () => openCourseDrawerWrapper());
    on('btn-close-unit-skip-modal', closeUnitSkipModal);
    on('btn-start-unit-skip-test', () => { closeUnitSkipModal(); closeCourseDrawerWrapper(); startUnitSkipTest(target.currentSkipTestUnit || 2); });

    const skipBd = document.getElementById('unit-skip-modal-backdrop');
    if (skipBd && !skipBd._bound) { skipBd.addEventListener('click', (e) => { if (e.target === skipBd) closeUnitSkipModal(); }); skipBd._bound = true; }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUnitOverviewEvents);
    else initUnitOverviewEvents();
  }
  try { target.nodeProgressMap = loadNodeProgress(); } catch (_) { target.nodeProgressMap = { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 }; }

  function getActiveLocation() {
    const lang = getLang();
    const courseId = target.currentCourseId || target.activeCourseId || (lang === 'en' ? 'en_main' : 'es_main');
    const unitNumber = getUnlockedUnitLevel(lang, courseId) || target.currentUnitNumber || 1;
    return { courseId, unitNumber, lang };
  }

  function setActiveLocation(loc = {}) {
    const lang = getLang(loc.lang);
    const cid = getCourse(loc.courseId, lang);
    if (loc.unitNumber) {
      const uNum = parseInt(loc.unitNumber, 10);
      if (!isNaN(uNum) && uNum >= 1) {
        target.currentUnitNumber = uNum;
        target._currentVisibleUnitIndex = uNum - 1;
        setUnlockedUnitLevel(uNum, lang, cid);
        try {
          storage.set(`vocadash_active_unit_${lang}_${cid}`, String(uNum));
          storage.set(`vocadash_unlocked_${lang}_${cid}`, String(uNum));
          storage.set(`vocadash_unlocked_unit_${lang}_${cid}`, String(uNum));
          storage.set(`vocadash_unlocked_unit_${cid}`, String(uNum));
          storage.set(`vocadash_unlocked_unit_${lang}`, String(uNum));
          storage.set('vocadash_current_unit', String(uNum));
        } catch (_) { }
      }
    }
    if (loc.courseId) {
      target.currentCourseId = loc.courseId;
      try {
        storage.set(`vocadash_active_course_${lang}`, loc.courseId);
        storage.set('vocadash_active_course', loc.courseId);
      } catch (_) { }
    }
    saveNodeProgress();
    return getActiveLocation();
  }

  function save() {
    saveNodeProgress();
    const lang = getLang();
    const cid = getCourse(target.activeCourseId, lang);
    const prog = getCourseProgress(cid, lang);
    saveCourseProgress(prog, cid, lang);
  }

  function unlockNextUnit() {
    const loc = getActiveLocation();
    const nextUnit = (loc.unitNumber || 1) + 1;
    unlockUnitsUpTo(nextUnit, loc.lang, loc.courseId);
    setActiveLocation({ unitNumber: nextUnit, courseId: loc.courseId, lang: loc.lang });
    save();
    return nextUnit;
  }

  const courseMapModal = {
    open: openCourseDrawerWrapper,
    close: closeCourseDrawerWrapper
  };

  const progressManager = {
    getActiveLocation,
    setActiveLocation,
    getUnlockedUnitLevel,
    setUnlockedUnitLevel,
    unlockUnitsUpTo,
    unlockNextUnit,
    save,
    getNodeProgress,
    saveCourseProgress,
    getCourseProgress
  };

  Object.assign(target, {
    progressManager,
    getActiveLocation,
    setActiveLocation,
    unlockNextUnit,
    saveProgress: save,
    getCompositeNodeKey, parseNodeCoordinates, getCourseProgress, saveCourseProgress, getUnlockedUnitLevel, setUnlockedUnitLevel,
    unlockUnitsUpTo, getNodeProgress, getNodeProgressData: getNodeProgress, setNodeProgress, saveNodeProgressData: setNodeProgress,
    resolveNodeData, isNodeUnlocked, getNodeStatus, loadNodeProgress, saveNodeProgress, getClaimedBonuses, isBonusClaimed,
    markBonusClaimed, handleClaimBonus, claimBonusReward, claimBonus: claimBonusReward, migrateLegacyReviewData, isReviewNodeCompleted, isReviewCompleted: isReviewNodeCompleted, markReviewNodeCompleted, completeReviewNode,
    handleReviewNodeClick, resolveCurrentNode, getSlotAlias, getNextNodeId, getNextRoadmapNode, saveStageClearResult, getNextStageStep,
    openCourseDrawer: openCourseDrawerWrapper, closeCourseDrawer: closeCourseDrawerWrapper,
    openUnitOverviewModal: openCourseDrawerWrapper, closeUnitOverviewModal: closeCourseDrawerWrapper,
    openCourseMapModal: openCourseDrawerWrapper, closeCourseMapModal: closeCourseDrawerWrapper,
    openUnitSkipModal, closeUnitSkipModal, startUnitSkipTest,
    courseMapModal,
    getActiveCEFRLevel, setActiveCEFRLevel
  });
  if (typeof window !== 'undefined') {
    window.progressManager = progressManager;
    window.getActiveLocation = getActiveLocation;
    window.setActiveLocation = setActiveLocation;
    window.unlockNextUnit = unlockNextUnit;
    window.courseMapModal = courseMapModal;
    window.openCourseDrawer = openCourseDrawerWrapper;
    window.closeCourseDrawer = closeCourseDrawerWrapper;
    window.openCourseMapModal = openCourseDrawerWrapper;
    window.closeCourseMapModal = closeCourseDrawerWrapper;
    window.openUnitOverviewModal = openCourseDrawerWrapper;
    window.closeUnitOverviewModal = closeCourseDrawerWrapper;
    window.getActiveCEFRLevel = getActiveCEFRLevel;
    window.setActiveCEFRLevel = setActiveCEFRLevel;
  }
})(typeof window !== 'undefined' ? window : this);
