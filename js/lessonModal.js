/**
 * js/lessonModal.js
 * VocaDash - Stage & Boss Node Lesson Detail Bottom Sheet Modal Controller
 */
(function (window) {
  'use strict';

  const el = (id) => document.getElementById(id);
  const setText = (id, txt) => {
    const node = el(id);
    if (node) node.textContent = txt;
  };

  function getLessonBackdrop() {
    return el('lesson-modal-backdrop') || el('stage-modal-backdrop');
  }

  function getLessonSheet() {
    return el('lesson-card-sheet') || el('stage-modal') || el('node-detail-modal');
  }

  function openLessonModal(nodeId) {
    if (typeof window.checkAndRechargeHearts === 'function') {
      window.checkAndRechargeHearts();
    } else if (typeof checkAndRechargeHearts === 'function') {
      checkAndRechargeHearts();
    }

    if (window.userHearts <= 0) {
      console.warn(`[VocaDash] 하트 0개 상태에서 스테이지(${nodeId}) 클릭 차단 -> 하트 충전 모달 팝업`);
      if (typeof window.openHeartRechargeModal === 'function') {
        window.openHeartRechargeModal();
      } else if (typeof openHeartRechargeModal === 'function') {
        openHeartRechargeModal();
      }
      return;
    }

    const gScreen = document.getElementById('game-screen');
    if (gScreen && gScreen.classList.contains('opacity-100') && !gScreen.classList.contains('pointer-events-none')) {
      console.warn('🛑 게임 화면 활성 중 openLessonModal 호출 차단됨!');
      return;
    }

    // 데이터 미등록 스테이지 방어 (Empty State Check)
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const db = (window.VOCA_DATA && window.VOCA_DATA.database) || (typeof database !== 'undefined' ? database : null);

    let hasWords = false;
    const curCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : ((typeof getCurrentCourseData === 'function') ? getCurrentCourseData() : null);

    const activeCourseId = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course') : null) || 'main';

    if (nodeId === 'node-boss' || String(nodeId).includes('boss')) {
      hasWords = true;
    } else if (activeCourseId === 'pack_football' && window.packFootballData) {
      hasWords = true;
    } else if (curCourse && Array.isArray(curCourse.units) && curCourse.units.length > 0) {
      hasWords = true;
    } else if (db && Object.prototype.hasOwnProperty.call(db, nodeId)) {
      const entry = db[nodeId];
      if (entry) {
        const words = entry[lang] || entry.words || entry.all || (Array.isArray(entry) ? entry : null);
        if (Array.isArray(words) && words.length > 0) {
          hasWords = true;
        }
      }
    }

    if (!hasWords) {
      console.warn(`[VocaDash] 미등록 또는 빈 스테이지(${nodeId}) 탭 감지됨 -> 안내 모달 표시`);
      if (typeof window.showEmptyStageModal === 'function') {
        window.showEmptyStageModal('🚧 단어장 준비 중! 곧 업데이트될 스테이지입니다.');
      }
      return;
    }

    window.currentSelectedNodeId = nodeId;
    window.currentGameLessonId = nodeId;
    window.currentLessonId = nodeId;
    if (nodeId !== 'node-review' && !String(nodeId).includes('review')) {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }
    const isFootball = (activeCourseId === 'pack_football');
    const courseId = isFootball ? 'pack_football' : (window.currentCourseId || 'basic');
    let data = null;
    let matchedNode = null;

    const activeCourse = (typeof window.getCurrentCourseData === 'function')
      ? window.getCurrentCourseData()
      : ((typeof getCurrentCourseData === 'function')
        ? getCurrentCourseData()
        : (window.packFootballData || window.courseData_es || window.courseData));

    const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const curUnitLevel = (typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel(curLang) : 1) || 1;
    let curUnit = null;

    if (activeCourse && Array.isArray(activeCourse.units)) {
      curUnit = activeCourse.units.find(u => (u.id === curUnitLevel || u.unitId === curUnitLevel || u.unitNumber === curUnitLevel)) || activeCourse.units[0];
      if (curUnit && Array.isArray(curUnit.nodes)) {
        if (nodeId === 'node-1') {
          matchedNode = curUnit.nodes.find(x => x.stageNumber === 1 || (x.id && x.id.endsWith('_n1')));
        } else if (nodeId === 'node-2') {
          matchedNode = curUnit.nodes.find(x => x.stageNumber === 2 || (x.id && (x.id.endsWith('_n2') || x.id.endsWith('_n3'))));
        } else if (nodeId === 'node-3') {
          // 💡 [핵심 버그 수정] 약점 복습(_n4, review) 절대 배제, 오직 순수 3과(stageNumber 3, _n5)만 정밀 매칭
          matchedNode = curUnit.nodes.find(x => (x.stageNumber === 3 || (x.id && (x.id.endsWith('_n5') || x.id.endsWith('-n3')))) && x.type !== 'review' && !x.id?.includes('review'));
          if (!matchedNode) {
            matchedNode = curUnit.nodes.find(x => x.stageNumber === 3 && x.type !== 'review');
          }
        } else if (nodeId === 'node-boss' || String(nodeId).includes('boss')) {
          matchedNode = curUnit.nodes.find(x => x.type === 'boss' || (x.id && x.id.endsWith('_n6')) || (x.id && x.id.includes('boss')));
        } else {
          matchedNode = curUnit.nodes.find(x => x.id === nodeId);
        }

        if (matchedNode) {
          let nodeTitle = matchedNode.title;
          if (nodeId === 'node-3' && (!nodeTitle || nodeTitle.includes('복습') || nodeTitle.includes('Review'))) {
            nodeTitle = `${curUnit.unitNumber || curUnitLevel || 1}과: 자기소개와 소통`;
          }

          let nodeDesc = matchedNode.meaning
            ? `${matchedNode.targetSentence || ''} (${matchedNode.meaning})`
            : (matchedNode.desc || curUnit.desc || curUnit.subtitle || '핵심 어휘와 문장을 마스터하세요!');

          if (nodeId === 'node-3' && (nodeDesc.includes('복습') || nodeDesc.includes('오답') || !matchedNode.meaning)) {
            // 3과 실제 어휘 주제(자기소개와 소통 등) 설명 노출
            nodeDesc = matchedNode.desc || curUnit.desc || '자기소개와 일상 소통을 위한 핵심 표현을 마스터하세요!';
          }

          data = {
            title: nodeTitle,
            desc: nodeDesc,
            icon: curUnit.icon || activeCourse.icon || (isFootball ? '🏆' : '🌱')
          };
        }
      }
      if (!data && activeCourse.lessons && activeCourse.lessons[nodeId]) {
        data = activeCourse.lessons[nodeId];
      }
    }

    // 💡 [보스 판정 및 유닛 번호 추출]
    const isBossNode = (nodeId === 'node-boss' || String(nodeId).includes('boss') || (matchedNode && matchedNode.type === 'boss'));
    const coords = (typeof window.parseNodeCoordinates === 'function')
      ? window.parseNodeCoordinates(nodeId)
      : ((typeof parseNodeCoordinates === 'function') ? parseNodeCoordinates(nodeId) : null);
    const unitX = (coords && coords.unitIndex) || (matchedNode && matchedNode.unitNumber) || curUnit?.unitNumber || curUnitLevel || 1;

    if (isBossNode) {
      data = {
        title: `Unit ${unitX} 총괄 보스전`,
        desc: '이번 유닛에서 배운 모든 단어가 총출동합니다!<br>단판 승부로 다음 유닛을 해금하세요.',
        icon: '👑'
      };
    }

    if (!data || (nodeId === 'node-3' && (data.title?.includes('복습') || data.title?.includes('Review')))) {
      const lessons = (window.COURSE_LESSONS && window.COURSE_LESSONS[courseId]) || (typeof COURSE_LESSONS !== 'undefined' && COURSE_LESSONS && (COURSE_LESSONS[courseId] || COURSE_LESSONS.basic));
      data = (lessons && lessons[nodeId]) || (window.nodeLessonData && window.nodeLessonData[nodeId]);
      if (!data || (nodeId === 'node-3' && (data.title?.includes('복습') || data.title?.includes('Review')))) {
        data = {
          title: isBossNode ? `Unit ${unitX} 총괄 보스전` : '3과: 자기소개와 소통',
          desc: isBossNode ? '이번 유닛에서 배운 모든 단어가 총출동합니다!<br>단판 승부로 다음 유닛을 해금하세요.' : '자기소개와 일상 소통을 위한 핵심 표현을 마스터하세요!',
          icon: isBossNode ? '👑' : (isFootball ? '🏆' : '🌱')
        };
      }
    }

    // ⭕ 언어 및 코스 격리된 실제 진행도 계산
    const modalLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    let modalPack = window.activeCourseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('vocadash_active_course_' + modalLang) : null) || 'main';
    modalPack = (modalPack === 'pack_football') ? 'pack_football' : 'main';

    let progress = 0;
    const getProgFn = (typeof window.getNodeProgress === 'function')
      ? window.getNodeProgress
      : ((typeof getNodeProgress === 'function') ? getNodeProgress : null);

    if (getProgFn) {
      const p = getProgFn(nodeId, modalLang, modalPack);
      progress = p?.clearedCount || 0;
    }

    // 🛑 [핵심 버그 수정] 복습 노드 완료 직후 3번 노드가 실제로 플레이되지 않았는데 오염되어 1이 되어있는 경우 0으로 강제 보정
    if (nodeId === 'node-3' || nodeId === 'u1_node-3' || nodeId === 'u1_stage-3') {
      let isActuallyCleared = false;
      try {
        const uData = JSON.parse(localStorage.getItem('vocadash_user_data') || '{}');
        if (uData && uData.clearedNodes && (
          (uData.clearedNodes['node-3'] && uData.clearedNodes['node-3'].actuallyPlayed) ||
          (uData.clearedNodes['u1_node-3'] && uData.clearedNodes['u1_node-3'].actuallyPlayed) ||
          (uData.clearedNodes['u1_stage-3'] && uData.clearedNodes['u1_stage-3'].actuallyPlayed)
        )) {
          isActuallyCleared = true;
        }
      } catch (_) { }

      if (!isActuallyCleared) {
        // 복습 완료로 인한 오염 잔여물이거나 미플레이 0회차 상태 보장
        progress = 0;
        try {
          localStorage.removeItem(`vocadash_prog_${modalLang}_${modalPack}_u1_n3`);
          localStorage.removeItem(`node_progress_${modalLang}_${modalPack}_node-3`);
          localStorage.removeItem(`node_progress_${modalLang}_${modalPack}_1_3`);
          localStorage.removeItem('u1_node-3');
          localStorage.removeItem('u1_stage-3');
        } catch (_) { }
        if (window.nodeProgressMap) {
          window.nodeProgressMap['node-3'] = 0;
          window.nodeProgressMap['u1_node-3'] = 0;
          window.nodeProgressMap['u1_stage-3'] = 0;
          window.nodeProgressMap[`${modalLang}_${modalPack}_u1_n3`] = 0;
        }
      }
    }

    progress = Math.max(0, Math.min(3, Number(progress) || 0));

    // 🎯 [UI 분기 처리] 보스 노드 전용 UI vs 일반 노드 UI
    const iconBox = el('lesson-modal-icon-box');
    const badgeEl = el('lesson-modal-badge');
    const progSection = el('lesson-modal-progress-section');
    const bossSection = el('lesson-modal-boss-section');
    const startBtn = el('lesson-start-btn');
    const startBtnIcon = el('lesson-start-btn-icon');
    const progBar = el('lesson-modal-progress-bar');
    const descEl = el('lesson-modal-desc');

    if (isBossNode) {
      // 1) 아이콘 & 아이콘 박스 (강렬한 레드/로즈 톤)
      setText('lesson-modal-icon', data.icon || '👑');
      if (iconBox) {
        iconBox.className = 'w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-2xl shadow-sm ring-1 ring-rose-300 flex-shrink-0';
      }

      // 2) 상단 배지 (주황/빨강 배지: 🔥 FINAL BOSS EXAM)
      setText('lesson-modal-badge', '🔥 FINAL BOSS EXAM');
      if (badgeEl) {
        badgeEl.className = 'font-label-sm text-[11px] text-rose-600 font-black uppercase tracking-wider';
      }

      // 3) 타이틀 & 설명 (보스전 설명 <br> 줄바꿈 innerHTML 적용)
      setText('lesson-modal-title', data.title || `Unit ${unitX} 총괄 보스전`);
      const bossDescText = data.desc || '이번 유닛에서 배운 모든 단어가 총출동합니다!<br>단판 승부로 다음 유닛을 해금하세요.';
      if (descEl) {
        descEl.innerHTML = bossDescText;
        if (!descEl.textContent) descEl.textContent = bossDescText;
      }

      // 4) 진행 상태 0/3 영역 대체 -> 단판 조건 박스 노출
      if (progSection) {
        progSection.classList.add('hidden');
        progSection.style.display = 'none';
      }
      if (bossSection) {
        bossSection.classList.remove('hidden');
        bossSection.classList.add('flex');
        bossSection.style.display = 'flex';
      }
      setText('lesson-modal-boss-condition-badge', '🎯 단판 총괄 시험');
      setText('lesson-modal-boss-condition-text', '통과 기준: 80% 이상');

      // 5) 보상 배지 상향 (+50 XP, +30 💎)
      setText('lesson-modal-xp', '+50 XP');
      setText('lesson-modal-gems', '+30');

      // 6) 메인 CTA 버튼 (⚔️ 보스전 도전하기 & 강렬한 그라데이션)
      if (startBtn) {
        startBtn.className = 'w-full h-12 rounded-2xl font-label-lg text-base bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black flex items-center justify-center gap-2 shadow-[0_4px_0_#be123c,0_8px_18px_-2px_rgba(244,63,94,0.45)] active:translate-y-1 active:shadow-none transition-all cursor-pointer';
      }
      if (startBtnIcon) {
        startBtnIcon.style.display = 'none';
      }
      setText('lesson-start-btn-text', '⚔️ 보스전 도전하기');
    } else {
      // 🔄 일반 노드 복귀 처리
      // 1) 아이콘 & 아이콘 박스 복원
      setText('lesson-modal-icon', data.icon);
      if (iconBox) {
        iconBox.className = 'w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center font-black text-2xl shadow-sm ring-1 ring-secondary-container/40 flex-shrink-0';
      }

      // 2) 상단 배지 복원
      if (badgeEl) {
        badgeEl.className = 'font-label-sm text-[11px] text-secondary font-extrabold uppercase tracking-wide';
      }
      setText('lesson-modal-badge', `${nodeId === 'node-1' ? '1과' : nodeId === 'node-3' ? '3과' : '2과'} · ${progress >= 3 ? '레슨 완료' : '현재 도전 중'}`);

      // 3) 타이틀 & 설명 복원
      setText('lesson-modal-title', data.title);
      if (descEl) {
        descEl.innerHTML = data.desc || '';
        if (!descEl.textContent && data.desc) descEl.textContent = data.desc;
      }

      // 4) 진행 상태 0/3 영역 복원
      if (progSection) {
        progSection.classList.remove('hidden');
        progSection.style.display = '';
      }
      if (bossSection) {
        bossSection.classList.add('hidden');
        bossSection.classList.remove('flex');
        bossSection.style.display = 'none';
      }
      setText('lesson-modal-progress-text', `${progress}/3`);
      if (progBar) {
        progBar.style.width = progress >= 3 ? '100%' : progress === 2 ? '67%' : progress === 1 ? '33%' : '0%';
        progBar.className = `h-full rounded-full transition-all duration-300 ${progress >= 3 ? 'bg-primary' : 'bg-secondary'}`;
      }

      // 5) 보상 배지 복원 (+20 XP, +10 💎)
      setText('lesson-modal-xp', '+20 XP');
      setText('lesson-modal-gems', '+10');

      // 6) 메인 CTA 버튼 복원 (에메랄드 그린)
      if (startBtn) {
        startBtn.className = 'w-full h-12 rounded-2xl font-label-lg text-base bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_0_#15803d,0_8px_16px_-2px_rgba(34,197,94,0.4)] active:translate-y-1 active:shadow-none transition-all cursor-pointer';
      }
      if (startBtnIcon) {
        startBtnIcon.textContent = 'play_arrow';
        startBtnIcon.style.display = '';
      }
      setText('lesson-start-btn-text', progress >= 3 ? '복습 시작하기' : progress === 2 ? '마지막 레슨 도전!' : progress === 1 ? '다음 레슨 계속하기' : '학습 시작하기');
    }

    const lessonBackdrop = getLessonBackdrop();
    const lessonSheet = getLessonSheet();

    if (lessonBackdrop) {
      lessonBackdrop.classList.remove('opacity-0', 'pointer-events-none');
      lessonBackdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (lessonSheet) {
      lessonSheet.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');
      lessonSheet.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto', 'scale-100');
    }
  }

  function closeLessonModal() {
    const lessonBackdrop = getLessonBackdrop();
    const lessonSheet = getLessonSheet();

    if (lessonBackdrop) {
      lessonBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
      lessonBackdrop.classList.add('opacity-0', 'pointer-events-none');
    }
    if (lessonSheet) {
      lessonSheet.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto', 'scale-100');
      lessonSheet.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');
    }
  }

  // Bind close buttons and backdrop click
  function setupLessonModalEvents() {
    const closeBtn = el('lesson-modal-close-btn');
    if (closeBtn && !closeBtn._lessonModalBound) {
      closeBtn.addEventListener('click', closeLessonModal);
      closeBtn._lessonModalBound = true;
    }
    const backdrop = getLessonBackdrop();
    if (backdrop && !backdrop._lessonModalBound) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeLessonModal();
      });
      backdrop._lessonModalBound = true;
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupLessonModalEvents);
    } else {
      setupLessonModalEvents();
    }
  }

  // Global exports
  window.openLessonModal = openLessonModal;
  window.showLessonModal = openLessonModal;
  window.openLessonPreview = openLessonModal;
  window.closeLessonModal = closeLessonModal;

})(typeof window !== 'undefined' ? window : globalThis);
