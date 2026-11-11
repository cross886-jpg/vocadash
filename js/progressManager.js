// js/progressManager.js - Single Source of Truth for User Progress & Stage Unlocks
(function (root) {
  'use strict';
  const target = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : root);
  const storage = {
    get: (k) => { try { return (typeof localStorage !== 'undefined' ? localStorage : target.localStorage)?.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { (typeof localStorage !== 'undefined' ? localStorage : target.localStorage)?.setItem(k, String(v)); } catch (_) { } },
    remove: (k) => { try { (typeof localStorage !== 'undefined' ? localStorage : target.localStorage)?.removeItem(k); } catch (_) { } }
  };
  const getLang = (l) => (l || target.currentLanguage || target.currentActiveCourse || storage.get('vocadash_language') || 'en') === 'es' ? 'es' : 'en';
  const getCourse = (c, lang) => {
    let cid = c || target.currentCourseId || target.activeCourseId;
    if (!cid && storage.get) cid = storage.get(`vocadash_active_course_${getLang(lang)}`) || storage.get('vocadash_active_course');
    if (cid === 'es_soccer' || cid === 'pack_football') {
      return (getLang(lang) !== 'en') ? 'pack_football' : 'main';
    }
    return 'main';
  };
  function getCoursePrefix(lang, cid) {
    return (cid === 'pack_football') ? 'fb' : (lang === 'en' ? 'en' : 'es');
  }
  function getStageDataSlot(nodeIndex) {
    if (nodeIndex === 3) return 5;
    if (nodeIndex === 'bonus') return 3;
    if (nodeIndex === 'review') return 4;
    return nodeIndex;
  }
  function safeParseObject(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : null;
    } catch (_) {
      return null;
    }
  }
  function safeParseArray(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }
  function getSafeUserData() {
    const raw = storage.get('vocadash_user_data');
    if (raw === null || raw === undefined || raw === '') return {};
    const parsed = safeParseObject(raw);
    if (parsed) return parsed;
    storage.remove('vocadash_user_data');
    return {};
  }
  function parseRawCount(raw) {
    if (raw === null || raw === undefined || raw === '') return null;
    try {
      const p = JSON.parse(raw);
      if (typeof p === 'number' && !isNaN(p)) return p;
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        const val = p.clearedCount ?? p.stars ?? (p.cleared ? 3 : 0);
        return isNaN(Number(val)) ? 0 : Number(val);
      }
    } catch (_) {
      if (/^-?\d+$/.test(String(raw).trim())) {
        const num = parseInt(raw, 10);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }
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
    if (str.includes('boss') || /_n6$/i.test(str)) return { unitIndex: u, nodeIndex: 6 };
    if (/_n5$/i.test(str) || /(?:^|[_-])(?:node|stage)-3$/i.test(str) || /_u\d+_n3$/i.test(str) || /^u\d+_n3$/i.test(str)) return { unitIndex: u, nodeIndex: 3 };
    if (str.includes('review') || /_n4$/i.test(str)) return { unitIndex: u, nodeIndex: 'review' };
    if (str.includes('bonus') || /^(?:es|en|fb)_\d+_n3$/i.test(str)) return { unitIndex: u, nodeIndex: 'bonus' };
    const nM = str.match(/(?:node|stage|n|-)?(\d+)$/i);
    return { unitIndex: u, nodeIndex: nM ? (parseInt(nM[1], 10) || 1) : 1 };
  }
  function getDefaultCourseProgress() {
    return { completedNodes: [], claimedBonuses: [], unlockedUnits: [1], unlockedNodes: [], nodeProgressMap: { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 } };
  }
  function getCourseProgress(courseId, targetLang) {
    const lang = getLang(targetLang), cid = getCourse(courseId, lang);
    const key = `vocadash_progress_${lang}_${cid}`;
    const raw = storage.get(key);
    if (raw !== null && raw !== undefined && raw !== '') {
      const p = safeParseObject(raw);
      if (p) {
        const npm = (p.nodeProgressMap && typeof p.nodeProgressMap === 'object' && !Array.isArray(p.nodeProgressMap))
          ? p.nodeProgressMap
          : { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 };
        return {
          completedNodes: Array.isArray(p.completedNodes) ? p.completedNodes : [],
          claimedBonuses: Array.isArray(p.claimedBonuses) ? p.claimedBonuses : [],
          unlockedUnits: Array.isArray(p.unlockedUnits) && p.unlockedUnits.length > 0 ? p.unlockedUnits : [1],
          unlockedNodes: Array.isArray(p.unlockedNodes) ? p.unlockedNodes : [],
          nodeProgressMap: npm
        };
      }
      // 손상된/비정상 문자열("done", 깨진 JSON 등) 자동 정리 후 안전 기본값 복구
      storage.remove(key);
    }
    return getDefaultCourseProgress();
  }
  function saveCourseProgress(progressData, courseId, targetLang) {
    storage.set(`vocadash_progress_${getLang(targetLang)}_${getCourse(courseId, targetLang)}`, JSON.stringify(progressData || {}));
  }
  function getMaxCourseUnits(courseId, targetLang) {
    const lang = getLang(targetLang), cid = getCourse(courseId, lang);
    const resolvedCid = (cid === 'pack_football' || courseId === 'es_soccer') ? 'es_soccer' : (lang === 'en' ? 'en_main' : 'es_main');
    const cs = target.courseSections;
    if (cs && cs[resolvedCid] && Array.isArray(cs[resolvedCid].sections)) {
      const lastSec = cs[resolvedCid].sections[cs[resolvedCid].sections.length - 1];
      if (lastSec && typeof lastSec.unitEnd === 'number') return lastSec.unitEnd;
    }
    return 166;
  }
  function getUnlockedUnitLevel(targetLang, targetCourseId) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId, lang);
    const maxUnits = getMaxCourseUnits(cid, lang);
    try {
      const candidates = [
        storage.get(`vocadash_unlocked_${lang}_${cid}`),
        storage.get(`vocadash_unlocked_unit_${lang}_${cid}`),
        (cid === 'main') ? storage.get(`vocadash_unlocked_unit_${lang}`) : null
      ];
      for (const val of candidates) {
        if (val !== null && val !== undefined && val !== '') {
          const num = parseInt(val, 10);
          if (!isNaN(num) && num >= 1 && num <= maxUnits) return num;
        }
      }
    } catch (_) { }
    return 1;
  }
  function setUnlockedUnitLevel(level, targetLang, targetCourseId) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId, lang), prefix = getCoursePrefix(lang, cid);
    const maxUnits = getMaxCourseUnits(cid, lang);
    const lvl = Math.max(1, Math.min(maxUnits, parseInt(level, 10) || 1));
    storage.set(`vocadash_unlocked_${lang}_${cid}`, String(lvl));
    storage.set(`vocadash_unlocked_unit_${lang}_${cid}`, String(lvl));
    storage.set(`vocadash_unlocked_unit_${lang}`, String(lvl));
    storage.set(`vocadash_current_unit_${lang}`, String(lvl));
    const prog = getCourseProgress(cid, lang);
    if (!prog.unlockedUnits) prog.unlockedUnits = [1];
    for (let u = 1; u <= lvl; u++) if (!prog.unlockedUnits.includes(u)) prog.unlockedUnits.push(u);
    prog.currentUnit = lvl;
    target.currentUnitNumber = lvl;
    target._currentVisibleUnitIndex = lvl - 1;
    saveCourseProgress(prog, cid, lang);

    // 💡 [Back-fill Unlock] 상위 유닛 도달 시 이전 번호(1 ~ lvl-1) 모든 게이트/노드 자동 완벽 해금
    if (!target.nodeProgressMap) target.nodeProgressMap = {};
    const uData = getSafeUserData();
    if (!uData.clearedNodes || typeof uData.clearedNodes !== 'object' || Array.isArray(uData.clearedNodes)) uData.clearedNodes = {};

    for (let u = 1; u < lvl; u++) {
      [1, 2, 3].forEach(n => {
        const dataSlot = getStageDataSlot(n);
        const stdKey = `vocadash_prog_${lang}_${cid}_u${u}_n${n}`;
        storage.set(stdKey, '3');
        storage.set(`node_progress_${lang}_${cid}_u${u}_node-${n}`, '3');
        storage.set(`node_progress_${lang}_${cid}_u${u}_stage-${n}`, '3');
        target.nodeProgressMap[`u${u}_node-${n}`] = 3;
        target.nodeProgressMap[`u${u}_stage-${n}`] = 3;
        target.nodeProgressMap[`u${u}_n${dataSlot}`] = 3;
        target.nodeProgressMap[`${prefix}_${u}_n${dataSlot}`] = 3;
        target.nodeProgressMap[`${lang}_${cid}_u${u}_n${n}`] = 3;
        if (u === 1) {
          storage.set(`node_progress_${lang}_${cid}_node-${n}`, '3');
          target.nodeProgressMap[`node-${n}`] = 3;
        }
        if (n === 3) {
          uData.clearedNodes[`u${u}_node-3`] = { cleared: true, clearedCount: 3, actuallyPlayed: true };
          uData.clearedNodes[`${prefix}_${u}_n5`] = { cleared: true, clearedCount: 3, actuallyPlayed: true };
          if (u === 1) uData.clearedNodes['node-3'] = { cleared: true, clearedCount: 3, actuallyPlayed: true };
        }
      });
      const bossKey = `vocadash_prog_${lang}_${cid}_u${u}_n6`;
      storage.set(bossKey, '1');
      storage.set(`node_progress_${lang}_${cid}_u${u}_node-boss`, '1');
      target.nodeProgressMap[`u${u}_node-boss`] = 1;
      target.nodeProgressMap[`${prefix}_${u}_n6`] = 1;
      target.nodeProgressMap[`${lang}_${cid}_u${u}_n6`] = 1;
      if (u === 1) {
        storage.set(`node_progress_${lang}_${cid}_node-boss`, '1');
        target.nodeProgressMap['node-boss'] = 1;
      }

      // 보너스 및 복습 완료 상태도 이전 유닛들에 대해 안전하게 동기화
      const bonusKey = `u${u}_node-bonus`;
      markBonusClaimed(bonusKey);
      target.nodeProgressMap[bonusKey] = 1;
      target.nodeProgressMap[`${prefix}_${u}_n3`] = 1;
      if (u === 1) target.nodeProgressMap['node-bonus'] = 1;

      const reviewKey = `u${u}_node-review`;
      markReviewNodeCompleted(reviewKey, u);
      target.nodeProgressMap[reviewKey] = 1;
      target.nodeProgressMap[`${prefix}_${u}_n4`] = 1;
      if (u === 1) target.nodeProgressMap['node-review'] = 1;
    }
    try { storage.set('vocadash_user_data', JSON.stringify(uData)); } catch (_) { }

    // 목표 유닛의 첫 번째 스테이지 활성화 보장
    if (target.nodeProgressMap[`u${lvl}_node-1`] === undefined) target.nodeProgressMap[`u${lvl}_node-1`] = 0;
    if (target.nodeProgressMap[`${prefix}_${lvl}_n1`] === undefined) target.nodeProgressMap[`${prefix}_${lvl}_n1`] = 0;
    if (lvl === 1 && target.nodeProgressMap['node-1'] === undefined) target.nodeProgressMap['node-1'] = 0;

    syncUnlockedNodesForCourse(lang, cid, lvl);
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

  function syncUnlockedNodesForCourse(targetLang, targetCourseId, hintUnit = 1) {
    const lang = getLang(targetLang), cid = getCourse(targetCourseId, lang);
    const prefix = getCoursePrefix(lang, cid);
    const unlockedLevel = getUnlockedUnitLevel(lang, cid);
    const maxCheckUnit = Math.max(unlockedLevel, parseInt(hintUnit, 10) || 1);
    const activeLang = getLang(), activeCid = getCourse(target.currentCourseId || target.activeCourseId, activeLang);
    const isActiveCourse = (lang === activeLang && cid === activeCid);

    const prog = getCourseProgress(cid, lang);
    const unlockedSet = new Set(Array.isArray(prog.unlockedNodes) ? prog.unlockedNodes : []);
    if (isActiveCourse && Array.isArray(target.unlockedNodes)) {
      target.unlockedNodes.forEach(id => {
        if (String(id).startsWith(`${prefix}_`) || String(id).startsWith('u') || String(id).startsWith('node-')) {
          unlockedSet.add(id);
        }
      });
    }

    if (!target.nodeProgressMap) target.nodeProgressMap = {};
    const ensureMapDefault = (keys) => {
      if (!isActiveCourse) return;
      keys.forEach(k => { if (target.nodeProgressMap[k] === undefined) target.nodeProgressMap[k] = 0; });
    };

    for (let u = 1; u <= maxCheckUnit; u++) {
      const p1 = getNodeProgress(`${prefix}_${u}_n1`, lang, cid).clearedCount;
      const p2 = getNodeProgress(`${prefix}_${u}_n2`, lang, cid).clearedCount;
      const p3 = getNodeProgress(`${prefix}_${u}_n5`, lang, cid).clearedCount;
      const pBoss = getNodeProgress(`${prefix}_${u}_n6`, lang, cid).clearedCount;
      const prevBossCleared = (u > 1) ? ((getNodeProgress(`${prefix}_${u - 1}_n6`, lang, cid).clearedCount || 0) >= 1) : true;
      const unitOpen = (u === 1) || (u <= unlockedLevel) || prevBossCleared;
      if (!unitOpen) continue;

      // Stage 1 unlocks when unit is open
      const s1Keys = [`${prefix}_${u}_n1`, `u${u}_n1`, `u${u}_node-1`, `u${u}_stage-1`];
      if (u === 1) s1Keys.push('node-1');
      s1Keys.forEach(k => unlockedSet.add(k));
      ensureMapDefault(s1Keys);

      // Stage 2 unlocks when Stage 1 >= 3 (or has progress)
      if (p1 >= 3 || p2 > 0) {
        const s2Keys = [`${prefix}_${u}_n2`, `u${u}_n2`, `u${u}_node-2`, `u${u}_stage-2`];
        if (u === 1) s2Keys.push('node-2');
        s2Keys.forEach(k => unlockedSet.add(k));
        ensureMapDefault(s2Keys);
      }

      // Sequential Chain: Stage 2 cleared -> Bonus -> Review claimed/completed -> Stage 3 -> Boss
      if (p2 >= 3) {
        const bonusKeys = [`${prefix}_${u}_n3`, `u${u}_node-bonus`];
        if (u === 1) bonusKeys.push('node-bonus');
        bonusKeys.forEach(k => unlockedSet.add(k));
      }

      const bonusClaimedForU = hasClaimedBonusForUnit(u, prefix, cid, lang);
      if (bonusClaimedForU) {
        const reviewKeys = [`${prefix}_${u}_n4`, `u${u}_node-review`];
        if (u === 1) reviewKeys.push('node-review');
        reviewKeys.forEach(k => unlockedSet.add(k));
      }

      const reviewCompletedForU = Boolean(
        isReviewNodeCompleted(`${prefix}_${u}_n4`, u) ||
        isReviewNodeCompleted(`u${u}_node-review`, u) ||
        (u === 1 && isReviewNodeCompleted('node-review', 1))
      );
      if (reviewCompletedForU || p3 > 0) {
        const s3Keys = [`${prefix}_${u}_n5`, `u${u}_n5`, `u${u}_node-3`, `u${u}_stage-3`];
        if (u === 1) s3Keys.push('node-3');
        s3Keys.forEach(k => unlockedSet.add(k));
        ensureMapDefault(s3Keys);
      }

      // Boss (n6) unlocks when Stage 3 >= 3 (or has progress)
      if (p3 >= 3 || pBoss > 0) {
        const bossKeys = [`${prefix}_${u}_n6`, `u${u}_n6`, `u${u}_node-boss`];
        if (u === 1) bossKeys.push('node-boss');
        bossKeys.forEach(k => unlockedSet.add(k));
        ensureMapDefault(bossKeys);
      }
    }

    const updatedList = Array.from(unlockedSet);
    prog.unlockedNodes = updatedList;
    saveCourseProgress(prog, cid, lang);
    if (isActiveCourse) {
      target.unlockedNodes = updatedList;
    }
    return updatedList;
  }

  function getNodeProgress(nodeId, targetLang, targetCourseId) {
    if (!nodeId) return { clearedCount: 0, stars: 0, valueOf() { return 0; }, toString() { return '0'; } };
    const strId = String(nodeId);
    const inferredLang = targetLang || (strId.startsWith('en_') ? 'en' : ((strId.startsWith('es_') || strId.startsWith('fb_')) ? 'es' : undefined));
    const lang = getLang(inferredLang), cid = strId.startsWith('fb_') ? 'pack_football' : getCourse(targetCourseId, lang);
    const prefix = getCoursePrefix(lang, cid);
    const { unitIndex, nodeIndex } = parseNodeCoordinates(nodeId);
    const dataSlot = getStageDataSlot(nodeIndex);
    const dataNodeId = `${prefix}_${unitIndex}_n${dataSlot}`;
    const key = `vocadash_prog_${lang}_${cid}_u${unitIndex}_n${nodeIndex}`;

    let count = parseRawCount(storage.get(key));
    if (!count) {
      const storageCandidates = [
        dataSlot !== nodeIndex ? `vocadash_prog_${lang}_${cid}_u${unitIndex}_n${dataSlot}` : null,
        `vocadash_prog_${lang}_${cid}_${dataNodeId}`,
        `node_progress_${lang}_${cid}_u${unitIndex}_node-${nodeIndex}`,
        `node_progress_${lang}_${cid}_u${unitIndex}_stage-${nodeIndex}`,
        unitIndex === 1 ? `node_progress_${lang}_${cid}_node-${nodeIndex}` : null,
        dataNodeId
      ].filter(Boolean);

      for (const sk of storageCandidates) {
        const parsed = parseRawCount(storage.get(sk));
        if (parsed !== null && parsed > 0) { count = parsed; break; }
      }
    }
    if (!count && cid === 'main' && lang === 'es' && unitIndex === 1 && nodeIndex === 3) {
      const legacyEs = parseRawCount(storage.get('u1_node-3') || storage.get('u1_stage-3'));
      if (legacyEs !== null && legacyEs > 0) count = legacyEs;
    }

    if (!count) {
      const savedProg = getCourseProgress(cid, lang);
      const pm = savedProg.nodeProgressMap || {};
      const mapVal = parseRawCount(pm[dataNodeId] ?? pm[`${lang}_${cid}_u${unitIndex}_n${nodeIndex}`] ?? pm[`u${unitIndex}_node-${nodeIndex}`] ?? (unitIndex === 1 ? pm[`node-${nodeIndex}`] : undefined));
      if (mapVal !== null && mapVal > 0) count = mapVal;
      else if (Array.isArray(savedProg.completedNodes) && (savedProg.completedNodes.includes(dataNodeId) || savedProg.completedNodes.includes(`u${unitIndex}_node-${nodeIndex}`))) {
        count = 3;
      }
    }

    if (!count) {
      const uData = getSafeUserData();
      const starVal = parseRawCount(uData?.stars?.[dataNodeId]);
      if (starVal !== null && starVal > 0) count = starVal;
      else {
        const clearedEntry = uData?.clearedNodes?.[dataNodeId];
        if (clearedEntry) {
          const cVal = (typeof clearedEntry === 'object' && !Array.isArray(clearedEntry))
            ? (clearedEntry.clearedCount ?? (clearedEntry.cleared ? 3 : 0))
            : parseRawCount(clearedEntry);
          if (cVal > 0) count = cVal;
        }
      }
    }

    if (!count && target.nodeProgressMap) {
      count = Number(target.nodeProgressMap[`${lang}_${cid}_u${unitIndex}_n${nodeIndex}`] || target.nodeProgressMap[dataNodeId] || 0);
      if (count === 0 && cid === getCourse(undefined, lang) && lang === getLang()) {
        count = Number(target.nodeProgressMap[nodeId] || target.nodeProgressMap[`u${unitIndex}_n${dataSlot}`] || target.nodeProgressMap[`u${unitIndex}_node-${nodeIndex}`] || target.nodeProgressMap[`u${unitIndex}_stage-${nodeIndex}`] || (unitIndex === 1 ? target.nodeProgressMap[`node-${nodeIndex}`] : 0) || 0);
      }
    }
    count = Math.max(0, Math.min(3, Number(count) || 0));
    return { clearedCount: count, stars: count, valueOf() { return count; }, toString() { return String(count); } };
  }

  function setNodeProgress(nodeId, clearedCount, stars, targetLang, targetCourseId) {
    if (!nodeId) return { clearedCount: 0, stars: 0, valueOf() { return 0; }, toString() { return '0'; } };
    const strId = String(nodeId);
    const inferredLang = targetLang || (strId.startsWith('en_') ? 'en' : ((strId.startsWith('es_') || strId.startsWith('fb_')) ? 'es' : undefined));
    const lang = getLang(inferredLang), cid = strId.startsWith('fb_') ? 'pack_football' : getCourse(targetCourseId, lang);
    const prefix = getCoursePrefix(lang, cid);
    const { unitIndex, nodeIndex } = parseNodeCoordinates(nodeId);
    const dataSlot = getStageDataSlot(nodeIndex);
    const dataNodeId = `${prefix}_${unitIndex}_n${dataSlot}`;
    const count = Math.min(3, Math.max(0, Number(clearedCount) || 0)), s = Math.min(3, Math.max(0, stars !== undefined ? Number(stars) : count));
    const key = `vocadash_prog_${lang}_${cid}_u${unitIndex}_n${nodeIndex}`, compNodeKey = `u${unitIndex}_node-${nodeIndex}`, compStageKey = `u${unitIndex}_stage-${nodeIndex}`;

    storage.set(key, String(count));
    storage.set(`node_progress_${lang}_${cid}_${compNodeKey}`, String(count));
    storage.set(`node_progress_${lang}_${cid}_${compStageKey}`, String(count));
    if (cid === 'main' && lang === 'es') { storage.set(compNodeKey, String(count)); storage.set(compStageKey, String(count)); }
    if (nodeIndex === 3 || strId.includes('node-3') || strId.includes('stage-3') || strId.endsWith('_n5')) {
      try {
        const uData = getSafeUserData();
        if (!uData.clearedNodes || typeof uData.clearedNodes !== 'object' || Array.isArray(uData.clearedNodes)) uData.clearedNodes = {};
        const entry = { cleared: count >= 3, clearedCount: count, actuallyPlayed: true };
        uData.clearedNodes[compNodeKey] = uData.clearedNodes[compStageKey] = uData.clearedNodes[dataNodeId] = entry;
        if (unitIndex === 1) uData.clearedNodes['node-3'] = entry;
        storage.set('vocadash_user_data', JSON.stringify(uData));
      } catch (_) { }
    }
    if (cid === 'pack_football' && strId.startsWith('fb_')) storage.set(`vocadash_node_progress_${nodeId}`, JSON.stringify({ clearedCount: count, stars: s }));
    if (!target.nodeProgressMap) target.nodeProgressMap = {};
    target.nodeProgressMap[`${lang}_${cid}_u${unitIndex}_n${nodeIndex}`] = target.nodeProgressMap[nodeId] = target.nodeProgressMap[dataNodeId] = target.nodeProgressMap[compStageKey] = target.nodeProgressMap[compNodeKey] = target.nodeProgressMap[`u${unitIndex}_n${dataSlot}`] = count;
    if (String(nodeIndex) === '6' || strId.includes('boss')) target.nodeProgressMap[`u${unitIndex}_node-boss`] = count;
    if (String(nodeIndex) === 'review' || strId.includes('review')) target.nodeProgressMap[`u${unitIndex}_node-review`] = count;
    if (String(nodeIndex) === 'bonus' || strId.includes('bonus')) target.nodeProgressMap[`u${unitIndex}_node-bonus`] = count;
    const activeLang = getLang(), activeCid = getCourse(target.currentCourseId || target.activeCourseId, activeLang);
    if (activeLang === lang && activeCid === cid && unitIndex === 1) target.nodeProgressMap[`node-${nodeIndex}`] = count;

    if (!Array.isArray(target.completedStages)) target.completedStages = [];
    if (count >= 3) {
      for (const k of [nodeId, dataNodeId, compNodeKey, compStageKey]) if (!target.completedStages.includes(k)) target.completedStages.push(k);
    }

    // 스테이지 마스터 또는 보스 클리어 시 후속 노드(특히 2과 -> 3과 _n5 / 보너스 / 복습) 해금 동기화
    if (count >= 3 || (nodeIndex === 6 && count >= 1)) {
      syncUnlockedNodesForCourse(lang, cid, unitIndex);
    }
    return { clearedCount: count, stars: s, valueOf() { return count; }, toString() { return String(count); } };
  }
  function resolveNodeData(rawId, fallbackId) {
    const curLang = getLang(), curCourse = getCourse(target.activeCourseId, curLang), p1 = getNodeProgress(rawId, curLang, curCourse);
    if (p1.clearedCount > 0) return p1;
    if (fallbackId && fallbackId !== rawId) return getNodeProgress(fallbackId, curLang, curCourse);
    return { clearedCount: 0, stars: 0 };
  }

  function resolveCanonicalSlot(nodeIndex, node) {
    const nodeId = node?.id || (typeof node === 'string' ? node : '');
    const nodeType = node?.type || '';
    if (nodeType === 'boss' || String(nodeId).includes('boss') || /_n6$/i.test(String(nodeId)) || nodeIndex === 5) return 6;
    if (nodeType === 'review' || String(nodeId).includes('review') || /_n4$/i.test(String(nodeId)) || nodeIndex === 3 || nodeIndex === 'review') return 'review';
    if (nodeType === 'bonus' || String(nodeId).includes('bonus') || /^(?:es|en|fb)_\d+_n3$/i.test(String(nodeId)) || nodeIndex === 2 || nodeIndex === 'bonus') return 'bonus';
    if ((nodeType === 'stage' && node?.stageNumber === 3) || /_n5$/i.test(String(nodeId)) || /(?:^|[_-])(?:node|stage)-3$/i.test(String(nodeId)) || nodeIndex === 4) return 3;
    if ((nodeType === 'stage' && node?.stageNumber === 2) || /_n2$/i.test(String(nodeId)) || /(?:^|[_-])(?:node|stage)-2$/i.test(String(nodeId)) || nodeIndex === 1) return 2;
    if ((nodeType === 'stage' && node?.stageNumber === 1) || /_n1$/i.test(String(nodeId)) || /(?:^|[_-])(?:node|stage)-1$/i.test(String(nodeId)) || nodeIndex === 0) return 1;
    if (nodeId) {
      const parsed = parseNodeCoordinates(nodeId).nodeIndex;
      if (parsed) return parsed;
    }
    return 1;
  }

  function getNormalizedUnitBonusKeys(unitNum, prefix) {
    const keys = [`${prefix}_${unitNum}_n3`, `u${unitNum}_node-bonus`, `u${unitNum}-bonus`, `u${unitNum}_bonus`];
    if (unitNum === 1) keys.push('node-bonus');
    return keys;
  }

  function hasClaimedBonusForUnit(unitNum, prefix, courseId, lang) {
    const resolvedLang = getLang(lang);
    const resolvedCourse = getCourse(courseId, resolvedLang);
    const resolvedPrefix = prefix || getCoursePrefix(resolvedLang, resolvedCourse);
    const courseBonuses = getCourseProgress(resolvedCourse, resolvedLang).claimedBonuses || [];
    let altCourseBonuses = [];
    try {
      const rawAlt = storage.get(`vocadash_progress_${resolvedCourse}`);
      if (rawAlt) {
        const parsedAlt = JSON.parse(rawAlt);
        if (Array.isArray(parsedAlt?.claimedBonuses)) altCourseBonuses = parsedAlt.claimedBonuses;
      }
    } catch (_) { }
    const claimedSet = new Set([...getClaimedBonuses(), ...courseBonuses, ...altCourseBonuses]);
    return getNormalizedUnitBonusKeys(unitNum, resolvedPrefix).some(k => claimedSet.has(k));
  }

  function isNodeUnlocked(currentUnitIndex, nodeIndex, node, course) {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    const prefix = getCoursePrefix(lang, courseId);
    const unitNum = currentUnitIndex + 1;
    const unlockedLevel = (typeof target.getUnlockedUnitLevel === 'function' ? target.getUnlockedUnitLevel(lang, courseId) : 1) || 1;

    const slot = resolveCanonicalSlot(nodeIndex, node);
    const targetCourse = course || (typeof target.getCurrentCourseData === 'function' ? target.getCurrentCourseData() : (target.packFootballData || target.courseData));

    // 1. 유닛 진입 조건 (유닛 오픈과 내부 노드 순차 해금 분리 - 상위 유닛 프리패스 조기 반환 없음)
    let isUnitOpen = (unitNum === 1) || (unlockedLevel >= unitNum);
    if (!isUnitOpen && currentUnitIndex > 0) {
      const prevBoss = targetCourse?.units?.[currentUnitIndex - 1]?.nodes?.find(n => n.type === 'boss' || (n.id && (n.id.endsWith('_n6') || n.id.includes('boss'))));
      const prevBossId = prevBoss?.id || `${prefix}_${unitNum - 1}_n6`;
      if ((getNodeProgress(prevBossId, lang, courseId)?.clearedCount || 0) >= 1) isUnitOpen = true;
    }
    if (!isUnitOpen) return false;

    // 2. 노드별 순차 해금 체인: 1단계 ➔ 2단계 ➔ 선물 ➔ 오답 ➔ 3단계 ➔ 보스
    if (slot === 1) return true;

    const p1 = getNodeProgress(`${prefix}_${unitNum}_n1`, lang, courseId)?.clearedCount || 0;
    const p2 = getNodeProgress(`${prefix}_${unitNum}_n2`, lang, courseId)?.clearedCount || 0;
    const p3 = getNodeProgress(`${prefix}_${unitNum}_n5`, lang, courseId)?.clearedCount || 0;
    const pBoss = getNodeProgress(`${prefix}_${unitNum}_n6`, lang, courseId)?.clearedCount || 0;

    if (slot === 2) return p1 >= 3 || p2 > 0;
    if (slot === 'bonus' || node?.type === 'bonus') return p2 >= 3;
    if (slot === 'review' || node?.type === 'review') {
      return hasClaimedBonusForUnit(unitNum, prefix, courseId, lang);
    }
    if (slot === 3) {
      const reviewCheckFn = (typeof target.isReviewNodeCompleted === 'function') ? target.isReviewNodeCompleted : isReviewNodeCompleted;
      const reviewDone = Boolean(
        reviewCheckFn(`${prefix}_${unitNum}_n4`, unitNum) ||
        reviewCheckFn(`u${unitNum}_node-review`, unitNum) ||
        (unitNum === 1 && reviewCheckFn('node-review', 1))
      );
      return reviewDone || p3 > 0;
    }
    if (slot === 6 || node?.type === 'boss') return p3 >= 3 || pBoss > 0;
    return false;
  }

  function loadNodeProgress(targetLang, targetCourseId) {
    const lang = getLang(targetLang), courseId = getCourse(targetCourseId, lang);
    const prefix = getCoursePrefix(lang, courseId);
    const unlockedLevel = getUnlockedUnitLevel(lang, courseId);
    const result = { 'node-1': 0, 'node-2': 0, 'node-3': 0, 'node-boss': 0 };
    [1, 2, 3].forEach(n => {
      const dataSlot = getStageDataSlot(n);
      const dataNodeId = `${prefix}_1_n${dataSlot}`;
      let c = getNodeProgress(dataNodeId, lang, courseId).clearedCount;
      result[`node-${n}`] = result[`${lang}_${courseId}_u1_n${n}`] = result[`u1_stage-${n}`] = result[`u1_node-${n}`] = result[`u1_n${dataSlot}`] = result[dataNodeId] = c;
    });
    if (unlockedLevel <= 1) {
      const uData = getSafeUserData();
      const hasPlayedN3 = Boolean(
        uData.clearedNodes?.['node-3']?.actuallyPlayed ||
        uData.clearedNodes?.['u1_node-3']?.actuallyPlayed ||
        uData.clearedNodes?.['u1_stage-3']?.actuallyPlayed ||
        uData.clearedNodes?.[`${prefix}_1_n5`]?.actuallyPlayed ||
        uData.clearedNodes?.['u1_n5']?.actuallyPlayed
      );
      if (!hasPlayedN3 && result['node-3'] > 0) {
        result['node-3'] = result[`${lang}_${courseId}_u1_n3`] = result['u1_stage-3'] = result['u1_node-3'] = result['u1_n5'] = result[`${prefix}_1_n5`] = 0;
        storage.remove(`vocadash_prog_${lang}_${courseId}_u1_n3`); storage.remove('u1_node-3');
      }
    }
    const bossCount = getNodeProgress(`${prefix}_1_n6`, lang, courseId).clearedCount;
    result['node-boss'] = result[`${lang}_${courseId}_u1_n6`] = result['u1_node-boss'] = result['u1_n6'] = result[`${prefix}_1_n6`] = bossCount;

    try { syncUnlockedNodesForCourse(lang, courseId, unlockedLevel); } catch (_) { }
    return result;
  }

  function getNodeStatus(nodeId, unitIndex = 0) {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    const prefix = getCoursePrefix(lang, courseId);
    const coords = parseNodeCoordinates(nodeId, unitIndex + 1);
    const uNum = coords.unitIndex || (unitIndex + 1);
    const slot = resolveCanonicalSlot(undefined, { id: nodeId });

    const p1 = getNodeProgress(`${prefix}_${uNum}_n1`, lang, courseId).clearedCount;
    const p2 = getNodeProgress(`${prefix}_${uNum}_n2`, lang, courseId).clearedCount;
    const p3 = getNodeProgress(`${prefix}_${uNum}_n5`, lang, courseId).clearedCount;
    const pBoss = getNodeProgress(`${prefix}_${uNum}_n6`, lang, courseId).clearedCount;

    const isBonusDone = hasClaimedBonusForUnit(uNum, prefix, courseId, lang);
    const isReviewDone = isReviewNodeCompleted(`${prefix}_${uNum}_n4`, uNum) || (uNum === 1 && isReviewNodeCompleted('node-review', 1));

    let clearedCount = 0, isLocked = false, isCompleted = false, isActive = false, type = 'stage';
    const unlocked = isNodeUnlocked(uNum - 1, undefined, { id: nodeId });
    isLocked = !unlocked;

    if (slot === 1) { clearedCount = p1; isCompleted = !isLocked && p1 >= 3; isActive = !isLocked && !isCompleted; }
    else if (slot === 2) { clearedCount = p2; isCompleted = !isLocked && p2 >= 3; isActive = !isLocked && !isCompleted; }
    else if (slot === 'bonus') { clearedCount = isBonusDone ? 1 : 0; isCompleted = isBonusDone; isActive = !isLocked && !isCompleted; type = 'bonus'; }
    else if (slot === 'review') { clearedCount = isReviewDone ? 1 : 0; isCompleted = isReviewDone; isActive = !isLocked && !isCompleted; type = 'review'; }
    else if (slot === 3) { clearedCount = p3; isCompleted = !isLocked && p3 >= 3; isActive = !isLocked && !isCompleted; }
    else if (slot === 6) { clearedCount = pBoss; isCompleted = !isLocked && pBoss >= 1; isActive = !isLocked && !isCompleted; type = 'boss'; }

    return { nodeId, unitIndex: uNum - 1, type, clearedCount, stars: clearedCount, isLocked, isCompleted, isActive, status: isLocked ? 'locked' : (isCompleted ? 'completed' : (isActive ? 'active' : 'unlocked')) };
  }
  function saveNodeProgress() {
    const prog = getCourseProgress(target.activeCourseId);
    prog.nodeProgressMap = target.nodeProgressMap || {};
    saveCourseProgress(prog, target.activeCourseId);
  }
  function getClaimedBonuses() {
    const raw = storage.get('vocadash_claimed_bonuses');
    if (raw) {
      const parsed = safeParseArray(raw);
      if (parsed) return parsed;
      storage.remove('vocadash_claimed_bonuses');
    }
    return getCourseProgress(target.activeCourseId).claimedBonuses || [];
  }
  const isBonusClaimed = (nodeId = 'node-bonus') => {
    const list = getClaimedBonuses();
    if (list.includes(nodeId)) return true;
    if (nodeId === 'node-bonus' || nodeId === 'u1_node-bonus' || nodeId === 'u1-bonus' || nodeId === 'es_1_n3' || nodeId === 'en_1_n3' || nodeId === 'fb_1_n3') {
      return list.includes('node-bonus') || list.includes('u1_node-bonus') || list.includes('u1-bonus') || list.includes('es_1_n3') || list.includes('en_1_n3') || list.includes('fb_1_n3');
    }
    const coords = parseNodeCoordinates(nodeId);
    if (coords.unitIndex) {
      const u = coords.unitIndex;
      return list.includes(`u${u}_node-bonus`) || list.includes(`u${u}-bonus`) || list.includes(`es_${u}_n3`) || list.includes(`en_${u}_n3`) || list.includes(`fb_${u}_n3`);
    }
    return false;
  };
  function markBonusClaimed(nodeId = 'node-bonus') {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    const list = getClaimedBonuses();
    if (!list.includes(nodeId)) list.push(nodeId);
    let claimedUnit = 1;
    if (nodeId === 'node-bonus' || String(nodeId).endsWith('_n3') || String(nodeId).includes('bonus')) {
      const coords = parseNodeCoordinates(nodeId);
      claimedUnit = coords.unitIndex || 1;
      const aliases = [`u${claimedUnit}_node-bonus`, `u${claimedUnit}-bonus`, `es_${claimedUnit}_n3`, `en_${claimedUnit}_n3`, `fb_${claimedUnit}_n3`];
      if (claimedUnit === 1) aliases.push('node-bonus');
      aliases.forEach(a => { if (!list.includes(a)) list.push(a); });
      try {
        localStorage.setItem(`vocadash_${lang}_bonus_u${claimedUnit}`, 'done');
      } catch (_) {}
    }
    storage.set('vocadash_claimed_bonuses', JSON.stringify(list));
    const prog = getCourseProgress(courseId, lang);
    prog.claimedBonuses = list;
    saveCourseProgress(prog, courseId, lang);
    try { syncUnlockedNodesForCourse(lang, courseId, claimedUnit); } catch (_) { }
  }
  function migrateLegacyReviewData() {
    let list = [];
    const raw = storage.get('vocadash_completed_reviews');
    if (raw) {
      const parsed = safeParseArray(raw);
      if (parsed) list = parsed;
      else storage.remove('vocadash_completed_reviews');
    }
    if (storage.get('vocadash_review_completed_node-review') === 'true' && !list.includes('u1_node-review')) {
      list.push('u1_node-review', 'node-review');
      storage.set('vocadash_completed_reviews', JSON.stringify(list));
    }
    return list;
  }
  function isReviewNodeCompleted(nodeId = 'node-review', unitNum = 1) {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    const prefix = getCoursePrefix(lang, courseId);
    const coords = parseNodeCoordinates(nodeId, unitNum);
    const uIndex = (/^u\d+_/i.test(nodeId)) ? coords.unitIndex : (unitNum || coords.unitIndex || 1);
    const compositeKey = `u${uIndex}_node-review`, canonicalKey = `${prefix}_${uIndex}_n4`, list = migrateLegacyReviewData();
    const directMatchKey = (nodeId && (nodeId !== 'node-review' || uIndex === 1)) ? nodeId : null;
    if (list.includes(compositeKey) || list.includes(canonicalKey) || (directMatchKey && list.includes(directMatchKey)) || (uIndex === 1 && (list.includes('node-review') || list.includes('u1_node-review')))) return true;
    if (target.nodeProgressMap && (target.nodeProgressMap[compositeKey] || target.nodeProgressMap[canonicalKey] || (directMatchKey && target.nodeProgressMap[directMatchKey]) || (uIndex === 1 && target.nodeProgressMap['node-review']))) return true;
    const uData = getSafeUserData();
    if (uData.clearedNodes?.[compositeKey]?.cleared || uData.clearedNodes?.[canonicalKey]?.cleared || (directMatchKey && uData.clearedNodes?.[directMatchKey]?.cleared) || (uIndex === 1 && uData.clearedNodes?.['node-review']?.cleared)) return true;
    return false;
  }
  function markReviewNodeCompleted(nodeId = 'node-review', unitNum = 1) {
    const lang = getLang(), courseId = getCourse(target.activeCourseId, lang);
    const prefix = getCoursePrefix(lang, courseId);
    const coords = parseNodeCoordinates(nodeId, unitNum);
    const uIndex = (/^u\d+_/i.test(nodeId)) ? coords.unitIndex : (unitNum || coords.unitIndex || 1);
    const compositeKey = `u${uIndex}_node-review`, canonicalKey = `${prefix}_${uIndex}_n4`, list = migrateLegacyReviewData();
    [compositeKey, canonicalKey].forEach(k => { if (!list.includes(k)) list.push(k); });
    if (uIndex === 1 && !list.includes('node-review')) list.push('node-review');
    storage.set('vocadash_completed_reviews', JSON.stringify(list));
    if (uIndex === 1) storage.set('vocadash_review_completed_node-review', 'true');
    const prog = getCourseProgress(courseId, lang);
    if (!prog.completedReviews) prog.completedReviews = [];
    [compositeKey, canonicalKey].forEach(k => { if (!prog.completedReviews.includes(k)) prog.completedReviews.push(k); });
    if (uIndex === 1 && !prog.completedReviews.includes('node-review')) prog.completedReviews.push('node-review');
    saveCourseProgress(prog, courseId, lang);
    try { syncUnlockedNodesForCourse(lang, courseId, uIndex); } catch (_) { }
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
      const uData = getSafeUserData();
      if (!uData.clearedNodes || typeof uData.clearedNodes !== 'object' || Array.isArray(uData.clearedNodes)) uData.clearedNodes = {};
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
    if (!isNodeUnlocked(unitNum - 1, 3, { type: 'review', id: nodeId })) {
      return target.showToast?.('보너스 선물을 먼저 수령해야 열려요! 🔒');
    }

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
      const slot = resolveCanonicalSlot(undefined, { id: targetId });
      let foundNode = null;
      if (slot === 1) foundNode = curUnit.nodes.find(n => n.stageNumber === 1 || n.id?.endsWith('_n1'));
      else if (slot === 2) foundNode = curUnit.nodes.find(n => n.stageNumber === 2 || n.id?.endsWith('_n2'));
      else if (slot === 3) foundNode = curUnit.nodes.find(n => n.stageNumber === 3 || n.id?.endsWith('_n5'));
      else if (slot === 6) foundNode = curUnit.nodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6'));
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
      const slot = resolveCanonicalSlot(undefined, { id });
      if (slot === 1) return 'node-1';
      if (slot === 2) return 'node-2';
      if (slot === 3) return 'node-3';
      if (slot === 6) return 'node-boss';
      return null;
    };
    return check(targetNodeId) || check(activeNodeId) || null;
  }
  function getNextNodeId(curNodeId, curUnit) {
    const slot = getSlotAlias(curNodeId, curNodeId);
    if (curUnit?.nodes) {
      if (slot === 'node-1') return curUnit.nodes.find(n => n.stageNumber === 2 || n.id?.endsWith('_n2'))?.id || 'node-2';
      if (slot === 'node-2') return curUnit.nodes.find(n => n.stageNumber === 3 || n.id?.endsWith('_n5'))?.id || 'node-3';
      if (slot === 'node-3') return curUnit.nodes.find(n => n.type === 'boss' || n.id?.endsWith('_n6'))?.id || 'node-boss';
    }
    return slot === 'node-1' ? 'node-2' : (slot === 'node-2' ? 'node-3' : 'node-boss');
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
        return Boolean(c && c.nodeIndex === coords.nodeIndex);
      });

      if (idx >= 0 && idx < nodes.length - 1) {
        // 정규 학습 파이프라인은 선택 노드(보너스/복습)에 가로막히지 않고 다음 정규 스테이지로 직행
        const nextRegular = nodes.slice(idx + 1).find(n => n.type !== 'bonus' && n.type !== 'review');
        if (nextRegular) return nextRegular;
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
    if (nIdx === 2 || nIdx === 'bonus' || nIdx === 'review') return { id: isU1 ? 'node-3' : `u${uIndex}_stage-3`, stageNumber: 3, type: 'stage', title: '3과' };
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
    const isStrictReview = Boolean(isReviewMode || isSpeedrun || (activeNodeId && (String(activeNodeId).includes('review') || String(activeNodeId).endsWith('_n4'))));
    if (isStrictReview) {
      if (activeNodeId && (String(activeNodeId).includes('review') || String(activeNodeId).endsWith('_n4'))) {
        completeReviewNode(activeNodeId, uNum);
      }
    } else {
      setNodeProgress(activeNodeId, nextCount, nextCount, lang, cid);
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
        } else if (currentNodeIdx === 1) nextNodeId = `u${currentUnitId}_node-2`;
        else if (currentNodeIdx === 2) nextNodeId = `u${currentUnitId}_node-3`;
        else if (currentNodeIdx === 3) nextNodeId = `u${currentUnitId}_node-boss`;
      }
    }
    syncUnlockedNodesForCourse(lang, cid, currentUnitId);
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
  function listStorageKeys() {
    try {
      const ls = (typeof localStorage !== 'undefined') ? localStorage : target.localStorage;
      if (!ls) return [];
      if (typeof ls.length === 'number' && typeof ls.key === 'function') {
        const out = [];
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k) out.push(k);
        }
        return out;
      }
      return Object.keys(ls).filter(k => typeof ls.getItem !== 'function' || ls.getItem(k) !== null);
    } catch (_) {
      return [];
    }
  }

  function migrateLegacyProgressStorage() {
    const keys = listStorageKeys();
    const dirtyCourses = new Map();
    const getProgBucket = (lang, cid) => {
      const mapKey = `${lang}_${cid}`;
      if (!dirtyCourses.has(mapKey)) {
        dirtyCourses.set(mapKey, { lang, cid, prog: getCourseProgress(cid, lang), changed: false });
      }
      return dirtyCourses.get(mapKey);
    };

    for (const key of keys) {
      const raw = storage.get(key);
      if (raw === null || raw === undefined) continue;

      // 1. 손상/비정상 문자열("done", 깨진 JSON 등) 방어 및 정리
      if (key === 'vocadash_user_data' || key.startsWith('vocadash_progress_')) {
        if (raw !== '' && !safeParseObject(raw)) {
          storage.remove(key);
        }
        continue;
      }
      if (key === 'vocadash_claimed_bonuses' || key === 'vocadash_completed_reviews') {
        if (raw !== '' && !safeParseArray(raw)) {
          storage.remove(key);
        }
        continue;
      }

      // 2. 레거시 분산 진행도 키 흡수 통합 -> vocadash_progress_${lang}_${cid}.nodeProgressMap
      let targetLang = null, targetCid = null, nodePart = null, shouldRemoveLegacy = true;
      let m = key.match(/^node_progress_(es|en)_(main|pack_football)_(.+)$/);
      if (m) {
        targetLang = m[1]; targetCid = m[2]; nodePart = m[3];
      } else if ((m = key.match(/^node_progress_(es_main|en_main|pack_football|es_soccer|main)_(.+)$/))) {
        targetLang = m[1].startsWith('en') ? 'en' : 'es';
        targetCid = (m[1] === 'pack_football' || m[1] === 'es_soccer') ? 'pack_football' : 'main';
        nodePart = m[2];
      } else if ((m = key.match(/^vocadash_node_progress_(node-\d+|node-boss|u\d+_.+)$/))) {
        targetLang = getLang();
        targetCid = getCourse(target.activeCourseId, targetLang);
        nodePart = m[1];
      } else if ((m = key.match(/^(u\d+_(?:node-(?:\d+|boss)|stage-\d+))$/))) {
        targetLang = 'es'; targetCid = 'main'; nodePart = m[1];
      } else {
        shouldRemoveLegacy = false;
      }

      if (!nodePart) continue;

      const parsedCount = parseRawCount(raw);
      if (parsedCount !== null && parsedCount >= 0) {
        const prefix = getCoursePrefix(targetLang, targetCid);
        const { unitIndex, nodeIndex } = parseNodeCoordinates(nodePart);
        const dataSlot = getStageDataSlot(nodeIndex);
        const dataNodeId = `${prefix}_${unitIndex}_n${dataSlot}`;
        const clamped = Math.max(0, Math.min(3, parsedCount));
        const bucket = getProgBucket(targetLang, targetCid);
        const npm = bucket.prog.nodeProgressMap || (bucket.prog.nodeProgressMap = {});
        const absorbKeys = [dataNodeId, `${targetLang}_${targetCid}_u${unitIndex}_n${nodeIndex}`, `u${unitIndex}_node-${nodeIndex}`];
        if (unitIndex === 1) absorbKeys.push(`node-${nodeIndex}`);
        absorbKeys.forEach(ak => {
          const prev = Number(npm[ak]) || 0;
          if (clamped > prev) {
            npm[ak] = clamped;
            bucket.changed = true;
          }
        });
        const stdSlotKey = `vocadash_prog_${targetLang}_${targetCid}_u${unitIndex}_n${nodeIndex}`;
        if ((parseRawCount(storage.get(stdSlotKey)) ?? 0) < clamped) {
          storage.set(stdSlotKey, String(clamped));
        }
      }
      if (shouldRemoveLegacy) storage.remove(key);
    }

    for (const entry of dirtyCourses.values()) {
      if (entry.changed) {
        saveCourseProgress(entry.prog, entry.cid, entry.lang);
      }
    }
    migrateLegacyReviewData();
  }

  try { migrateLegacyProgressStorage(); } catch (_) { }
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
          storage.set(`vocadash_unlocked_unit_${lang}`, String(uNum));
          storage.set(`vocadash_current_unit_${lang}`, String(uNum));
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
    syncUnlockedNodesForCourse, unlockUnitsUpTo, getNodeProgress, getNodeProgressData: getNodeProgress, setNodeProgress, saveNodeProgressData: setNodeProgress,
    resolveNodeData, isNodeUnlocked, getNodeStatus, loadNodeProgress, saveNodeProgress, getClaimedBonuses, isBonusClaimed,
    markBonusClaimed, handleClaimBonus, claimBonusReward, claimBonus: claimBonusReward, migrateLegacyReviewData, migrateLegacyProgressStorage, isReviewNodeCompleted, isReviewCompleted: isReviewNodeCompleted, markReviewNodeCompleted, completeReviewNode,
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
