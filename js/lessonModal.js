// ==============================================================================
// VocaDash Lesson Modal Module (js/lessonModal.js)
// [Karpathy 원칙] 순수 스테이지 진입 모달: 단어 프리뷰, 회차별 CTA 바인딩, 보너스 상자
// 스트릭 모달은 profileManager.js, 유닛 개요/건너뛰기는 progressManager.js로 위임
// ==============================================================================

(function () {
  "use strict";

  const el = id => document.getElementById(id);
  const setText = (id, text) => { const node = el(id); if (node) node.textContent = text; };
  const getLessonBackdrop = () => el("lesson-card-backdrop");
  const getLessonSheet = () => el("lesson-card-sheet");

  function openLessonModal(nodeId) {
    if (typeof window.checkAndRechargeHearts === "function") window.checkAndRechargeHearts();
    if (window.userHearts <= 0) {
      if (typeof window.openHeartRechargeModal === "function") window.openHeartRechargeModal();
      return;
    }

    // 💡 약점 복습 노드 인입 시 전용 스피드런 모달로 안전하게 전환
    if (nodeId === "node-review" || String(nodeId).includes("review")) {
      const coords = (typeof window.parseNodeCoordinates === "function") ? window.parseNodeCoordinates(nodeId) : null;
      const uNum = (coords && coords.unitIndex) ? coords.unitIndex : (window.currentUnitNumber || 1);
      openReviewSpeedrunModal(uNum, nodeId);
      return;
    }

    const gScreen = el("game-screen");
    if (gScreen && gScreen.classList.contains("opacity-100") && !gScreen.classList.contains("pointer-events-none")) return;

    window.currentSelectedNodeId = nodeId;
    window.currentGameLessonId = nodeId;
    window.currentLessonId = nodeId;
    if (nodeId !== "node-review" && !String(nodeId).includes("review")) {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }

    const modalLang = (window.currentLanguage || window.currentActiveCourse || "es") === "en" ? "en" : "es";
    let modalPack = window.activeCourseId || (typeof localStorage !== "undefined" ? localStorage.getItem("vocadash_active_course_" + modalLang) : null) || "main";
    modalPack = (modalPack === "pack_football") ? "pack_football" : "main";

    const activeCourse = (typeof window.getCurrentCourseData === "function")
      ? window.getCurrentCourseData()
      : (window.packFootballData || window.courseData_es || window.courseData);

    const curUnitLevel = (typeof window.getUnlockedUnitLevel === "function" ? window.getUnlockedUnitLevel(modalLang) : 1) || 1;
    let curUnit = (activeCourse && Array.isArray(activeCourse.units))
      ? (activeCourse.units.find(u => (u.id === curUnitLevel || u.unitId === curUnitLevel || u.unitNumber === curUnitLevel)) || activeCourse.units[0])
      : null;

    let matchedNode = null;
    if (curUnit && Array.isArray(curUnit.nodes)) {
      if (nodeId === "node-1") {
        matchedNode = curUnit.nodes.find(x => x.stageNumber === 1 || (x.id && x.id.endsWith("_n1")));
      } else if (nodeId === "node-2") {
        matchedNode = curUnit.nodes.find(x => x.stageNumber === 2 || (x.id && (x.id.endsWith("_n2") || x.id.endsWith("_n3"))));
      } else if (nodeId === "node-3") {
        matchedNode = curUnit.nodes.find(x => (x.stageNumber === 3 || (x.id && (x.id.endsWith("_n5") || x.id.endsWith("-n3")))) && x.type !== "review" && !x.id?.includes("review"));
        if (!matchedNode) matchedNode = curUnit.nodes.find(x => x.stageNumber === 3 && x.type !== "review");
      } else if (nodeId === "node-boss" || String(nodeId).includes("boss")) {
        matchedNode = curUnit.nodes.find(x => x.type === "boss" || (x.id && (x.id.endsWith("_n6") || x.id.includes("boss"))));
      } else {
        matchedNode = curUnit.nodes.find(x => x.id === nodeId);
      }
    }

    const isBossNode = (nodeId === "node-boss" || String(nodeId).includes("boss") || (matchedNode && matchedNode.type === "boss"));
    const coords = (typeof window.parseNodeCoordinates === "function")
      ? window.parseNodeCoordinates(nodeId)
      : { unitIndex: curUnitLevel, nodeIndex: 1 };
    const unitX = (coords && coords.unitIndex) || (matchedNode && matchedNode.unitNumber) || curUnit?.unitNumber || curUnitLevel || 1;

    let nodeTitle = isBossNode ? `Unit ${unitX} 총괄 보스전` : (matchedNode?.title || (nodeId === "node-3" ? `${unitX}과: 자기소개와 소통` : "기초 어휘"));
    if (!isBossNode && (nodeId === "node-3" || String(nodeId).includes("node-3")) && (!nodeTitle || nodeTitle.includes("복습") || nodeTitle.includes("Review"))) {
      nodeTitle = `${unitX}과: 자기소개와 소통`;
    }
    let nodeDesc = isBossNode
      ? "이번 유닛에서 배운 모든 단어가 총출동합니다!<br>단판 승부로 다음 유닛을 해금하세요."
      : (matchedNode?.meaning ? `${matchedNode.targetSentence || ""} (${matchedNode.meaning})` : (matchedNode?.desc || curUnit?.desc || "핵심 어휘와 문장을 마스터하세요!"));
    if (!isBossNode && (nodeId === "node-3" || String(nodeId).includes("node-3")) && (nodeDesc.includes("복습") || nodeDesc.includes("오답") || !matchedNode?.meaning)) {
      nodeDesc = matchedNode?.desc || curUnit?.desc || "자기소개와 일상 소통을 위한 핵심 표현을 마스터하세요!";
    }
    const nodeIcon = isBossNode ? "👑" : (curUnit?.icon || activeCourse?.icon || "🌱");

    let progress = 0;
    if (typeof window.getNodeProgress === "function") {
      const p = window.getNodeProgress(nodeId, modalLang, modalPack);
      progress = p?.clearedCount || 0;
    }

    if (nodeId === "node-3" || nodeId === "u1_node-3" || nodeId === "u1_stage-3") {
      let isActuallyCleared = false;
      try {
        const uData = JSON.parse(localStorage.getItem("vocadash_user_data") || "{}");
        if (uData?.clearedNodes && (
          uData.clearedNodes["node-3"]?.actuallyPlayed ||
          uData.clearedNodes["u1_node-3"]?.actuallyPlayed ||
          uData.clearedNodes["u1_stage-3"]?.actuallyPlayed
        )) isActuallyCleared = true;
      } catch (_) { }

      if (!isActuallyCleared) {
        progress = 0;
        try {
          localStorage.removeItem(`vocadash_prog_${modalLang}_${modalPack}_u1_n3`);
          localStorage.removeItem(`node_progress_${modalLang}_${modalPack}_node-3`);
          localStorage.removeItem(`node_progress_${modalLang}_${modalPack}_1_3`);
          localStorage.removeItem("u1_node-3");
          localStorage.removeItem("u1_stage-3");
        } catch (_) { }
        if (window.nodeProgressMap) {
          window.nodeProgressMap["node-3"] = 0;
          window.nodeProgressMap["u1_node-3"] = 0;
          window.nodeProgressMap["u1_stage-3"] = 0;
          window.nodeProgressMap[`${modalLang}_${modalPack}_u1_n3`] = 0;
        }
      }
    }
    progress = Math.max(0, Math.min(3, Number(progress) || 0));

    const iconBox = el("lesson-modal-icon-box");
    const badgeEl = el("lesson-modal-badge");
    const progSection = el("lesson-modal-progress-section");
    const bossSection = el("lesson-modal-boss-section");
    const startBtn = el("lesson-start-btn");
    const startBtnIcon = el("lesson-start-btn-icon");
    const progBar = el("lesson-modal-progress-bar");
    const descEl = el("lesson-modal-desc");

    if (isBossNode) {
      setText("lesson-modal-icon", "👑");
      if (iconBox) iconBox.className = "w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-2xl shadow-sm ring-1 ring-rose-300 flex-shrink-0";
      setText("lesson-modal-badge", "🔥 FINAL BOSS EXAM");
      if (badgeEl) badgeEl.className = "font-label-sm text-[11px] text-rose-600 font-black uppercase tracking-wider";
      setText("lesson-modal-title", nodeTitle);
      if (descEl) { descEl.innerHTML = nodeDesc; descEl.textContent = nodeDesc; }
      if (progSection) { progSection.classList.add("hidden"); progSection.style.display = "none"; }
      if (bossSection) { bossSection.classList.remove("hidden"); bossSection.classList.add("flex"); bossSection.style.display = "flex"; }
      setText("lesson-modal-boss-condition-badge", "🎯 단판 총괄 시험");
      setText("lesson-modal-boss-condition-text", "통과 기준: 80% 이상");
      setText("lesson-modal-xp", "+50 XP");
      setText("lesson-modal-gems", "+30");
      if (startBtn) startBtn.className = "w-full h-12 rounded-2xl font-label-lg text-base bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black flex items-center justify-center gap-2 shadow-[0_4px_0_#be123c,0_8px_18px_-2px_rgba(244,63,94,0.45)] active:translate-y-1 active:shadow-none transition-all cursor-pointer";
      if (startBtnIcon) startBtnIcon.style.display = "none";
      setText("lesson-start-btn-text", "⚔️ 보스전 도전하기");
    } else {
      setText("lesson-modal-icon", nodeIcon);
      if (iconBox) iconBox.className = "w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center font-black text-2xl shadow-sm ring-1 ring-secondary-container/40 flex-shrink-0";
      const sIdx = (nodeId === "node-1" || String(nodeId).includes("1")) ? "1과" : ((nodeId === "node-3" || String(nodeId).includes("3")) ? "3과" : "2과");
      setText("lesson-modal-badge", `${sIdx} · ${progress >= 3 ? "레슨 완료" : "현재 도전 중"}`);
      if (badgeEl) badgeEl.className = "font-label-sm text-[11px] text-secondary font-extrabold uppercase tracking-wide";
      setText("lesson-modal-title", nodeTitle);
      if (descEl) { descEl.innerHTML = nodeDesc; descEl.textContent = nodeDesc; }
      if (progSection) { progSection.classList.remove("hidden"); progSection.style.display = ""; }
      if (bossSection) { bossSection.classList.add("hidden"); bossSection.classList.remove("flex"); bossSection.style.display = "none"; }
      setText("lesson-modal-progress-text", `${progress}/3`);
      if (progBar) {
        progBar.style.width = progress >= 3 ? "100%" : progress === 2 ? "67%" : progress === 1 ? "33%" : "0%";
        progBar.className = `h-full rounded-full transition-all duration-300 ${progress >= 3 ? "bg-primary" : "bg-secondary"}`;
      }
      setText("lesson-modal-xp", "+20 XP");
      setText("lesson-modal-gems", "+10");
      if (startBtn) startBtn.className = "w-full h-12 rounded-2xl font-label-lg text-base bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_0_#15803d,0_8px_16px_-2px_rgba(34,197,94,0.4)] active:translate-y-1 active:shadow-none transition-all cursor-pointer";
      if (startBtnIcon) { startBtnIcon.textContent = "play_arrow"; startBtnIcon.style.display = ""; }
      setText("lesson-start-btn-text", progress >= 3 ? "복습 시작하기" : progress === 2 ? "마지막 레슨 도전!" : progress === 1 ? "다음 레슨 계속하기" : "학습 시작하기");
    }

    const backdrop = getLessonBackdrop();
    const sheet = getLessonSheet();
    if (backdrop) {
      backdrop.classList.remove("opacity-0", "pointer-events-none");
      backdrop.classList.add("opacity-100", "pointer-events-auto");
      backdrop.style.pointerEvents = "auto";
    }
    if (sheet) {
      sheet.classList.remove("opacity-0", "translate-y-8", "pointer-events-none", "scale-95");
      sheet.classList.add("opacity-100", "translate-y-0", "pointer-events-auto", "scale-100");
      sheet.style.pointerEvents = "auto";
    }
  }

  function closeLessonModal() {
    const backdrop = getLessonBackdrop();
    const sheet = getLessonSheet();
    if (backdrop) {
      backdrop.classList.remove("opacity-100", "pointer-events-auto");
      backdrop.classList.add("opacity-0", "pointer-events-none");
      backdrop.style.pointerEvents = "none";
    }
    if (sheet) {
      sheet.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto", "scale-100");
      sheet.classList.add("opacity-0", "translate-y-8", "pointer-events-none", "scale-95");
      sheet.style.pointerEvents = "none";
    }
  }

  function openBonusModal(nodeId = "node-bonus") {
    window.currentBonusNodeId = nodeId;
    const backdrop = el("bonus-modal-backdrop");
    const card = el("bonus-modal-card");
    if (!backdrop || !card) return;

    const claimed = (typeof window.isBonusClaimed === "function") ? window.isBonusClaimed(nodeId) : false;
    const titleEl = el("bonus-modal-title");
    const descEl = el("bonus-modal-desc");
    const claimBtn = el("bonus-claim-btn");
    const rewardCard = card.querySelector(".border-amber-200") || card.querySelector(".bg-gradient-to-r");

    if (claimed) {
      if (titleEl) titleEl.textContent = "보너스 선물 (수령 완료)";
      if (descEl) descEl.textContent = "이미 수령한 보너스 선물입니다! 🎁 (획득 완료)";
      if (claimBtn) {
        claimBtn.textContent = "확인 (수령 완료)";
        claimBtn.className = "w-full py-3 px-4 rounded-xl bg-slate-300 hover:bg-slate-400 text-slate-700 font-extrabold text-xs shadow-sm transition-all cursor-pointer";
      }
      if (rewardCard) rewardCard.innerHTML = '<span class="text-xl">📦</span><span class="font-black text-sm text-slate-600">수령 완료 (보석 +15 지급됨)</span>';
    } else {
      if (titleEl) titleEl.textContent = "깜짝 보너스 상자 오픈!";
      if (descEl) descEl.textContent = "열심히 달린 러너를 위한 특별 응원 선물이에요!";
      if (claimBtn) {
        claimBtn.textContent = "보상 받기 ✨";
        claimBtn.className = "w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer";
      }
      if (rewardCard) rewardCard.innerHTML = '<span class="text-xl">💎</span><span class="font-black text-sm text-amber-900">+15 다이아몬드</span>';
    }

    backdrop.classList.remove("opacity-0", "pointer-events-none");
    backdrop.classList.add("opacity-100", "pointer-events-auto");
    card.classList.remove("opacity-0", "scale-95");
    card.classList.add("opacity-100", "scale-100");
  }

  function closeBonusModal() {
    const backdrop = el("bonus-modal-backdrop");
    const card = el("bonus-modal-card");
    if (!backdrop || !card) return;
    backdrop.classList.remove("opacity-100", "pointer-events-auto");
    backdrop.classList.add("opacity-0", "pointer-events-none");
    card.classList.remove("opacity-100", "scale-100");
    card.classList.add("opacity-0", "scale-95");
  }

  // 💡 약점 복습 스피드런 모달 제어 함수
  function openReviewSpeedrunModal(unitNum = null, nodeId = null) {
    const backdrop = el("review-speedrun-modal-backdrop");
    const card = el("review-speedrun-modal-card");
    if (!backdrop || !card) return;

    const resolvedUnit = unitNum || (nodeId && typeof window.parseNodeCoordinates === "function" ? window.parseNodeCoordinates(nodeId).unitIndex : null) || window.currentUnitNumber || 1;
    const resolvedNodeId = nodeId || (typeof window.getCompositeNodeKey === "function" ? window.getCompositeNodeKey("node-review", resolvedUnit) : `u${resolvedUnit}_node-review`);
    window.currentReviewUnitNumber = resolvedUnit;
    window.currentReviewNodeId = resolvedNodeId;

    const currentLang = (window.currentLanguage || window.currentActiveCourse || "es") === "en" ? "en" : "es";
    let wrongList = [];
    if (typeof window.loadWrongWords === "function") {
      const loaded = window.loadWrongWords(currentLang) || [];
      wrongList = loaded.filter(w => !w.escaped && (Number(w.correctStreak) || 0) < 5);
    } else {
      try {
        const raw = localStorage.getItem("vocadash_wrong_words");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            wrongList = parsed.filter(w => (w.lang || "es") === currentLang && !w.escaped && (Number(w.correctStreak) || 0) < 5);
          }
        }
      } catch (_) { }
    }

    const titleEl = el("review-speedrun-modal-title");
    const descEl = el("review-speedrun-modal-desc");
    const countText = el("review-speedrun-target-count");
    if (titleEl) titleEl.textContent = "⚡ 약점 극복 스피드 런 (10문제)";

    const wrongCount = wrongList.length;
    if (wrongCount === 0) {
      if (descEl) descEl.textContent = "오답 노트가 깨끗합니다! 👏 현재 유닛의 핵심 단어 전체 복습 런으로 진행됩니다.";
      if (countText) countText.textContent = "유닛 핵심 단어 10개 코스";
    } else {
      if (descEl) descEl.textContent = "틀렸던 약점 단어를 포함해 총 10문제를 달립니다! (각 단어 5회 연속 정답 시 오답 노트에서 영구 탈출)";
      if (countText) countText.textContent = `오답 단어 ${Math.min(10, wrongCount)}개 코스`;
    }

    backdrop.classList.remove("opacity-0", "pointer-events-none");
    backdrop.classList.add("opacity-100", "pointer-events-auto");
    card.classList.remove("opacity-0", "scale-95");
    card.classList.add("opacity-100", "scale-100");
  }

  function closeReviewSpeedrunModal() {
    const backdrop = el("review-speedrun-modal-backdrop");
    const card = el("review-speedrun-modal-card");
    if (!backdrop || !card) return;
    backdrop.classList.remove("opacity-100", "pointer-events-auto");
    backdrop.classList.add("opacity-0", "pointer-events-none");
    card.classList.remove("opacity-100", "scale-100");
    card.classList.add("opacity-0", "scale-95");
  }

  function startRoadmapReviewSpeedrun() {
    closeReviewSpeedrunModal();
    if (typeof window.closeResultModal === "function") window.closeResultModal();
    const currentLang = (window.currentLanguage || window.currentActiveCourse || "es") === "en" ? "en" : "es";
    const targetReviewUnit = window.currentReviewUnitNumber || window.currentUnitNumber || 1;
    const targetReviewId = window.currentReviewNodeId || (typeof window.getCompositeNodeKey === "function" ? window.getCompositeNodeKey("node-review", targetReviewUnit) : `u${targetReviewUnit}_node-review`);

    let sessionQuestions = [];
    if (typeof window.generateReviewSession === "function") {
      sessionQuestions = window.generateReviewSession(targetReviewUnit, currentLang);
    } else if (window.quizSessionGenerator?.generateReviewSession) {
      sessionQuestions = window.quizSessionGenerator.generateReviewSession(targetReviewUnit, currentLang);
    }

    window.isReviewGameMode = true;
    window.isRoadmapReviewSpeedrun = true;
    window.currentReviewSpeedrunWords = sessionQuestions;
    window.currentSpeedrunSessionWords = sessionQuestions;
    window.currentSessionQuestions = sessionQuestions;

    if (typeof window.openGameScreen === "function") {
      window.openGameScreen(targetReviewId, sessionQuestions);
    }

    const titleEl = document.getElementById("game-stage-title");
    if (titleEl) {
      titleEl.textContent = `Unit ${targetReviewUnit} · 🔄 약점 복습`;
    }
  }

  function startLesson(nodeId) {
    closeLessonModal();
    if (typeof window.closeResultModal === "function") window.closeResultModal();
    const targetNodeId = nodeId || window.currentSelectedNodeId || window.currentGameLessonId || "node-2";
    window.currentSelectedNodeId = targetNodeId;
    window.currentGameLessonId = targetNodeId;
    window.currentLessonId = targetNodeId;
    if (targetNodeId !== "node-review") {
      window.isReviewGameMode = false;
      window.isRoadmapReviewSpeedrun = false;
      window.isWrongWordsMiniReviewActive = false;
    }

    const currentLang = (window.currentLanguage || window.currentActiveCourse || "es") === "en" ? "en" : "es";
    let activeCourseId = window.activeCourseId || (typeof localStorage !== "undefined" ? localStorage.getItem("vocadash_active_course_" + currentLang) : null) || "main";
    activeCourseId = (activeCourseId === "pack_football") ? "pack_football" : "main";
    const round = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;

    let session = [];
    if (activeCourseId === "pack_football" && typeof window.getFootballStageSession === "function") {
      session = window.getFootballStageSession(targetNodeId);
    } else if (window.quizSessionGenerator && typeof window.quizSessionGenerator.generateDeckForStage === "function") {
      session = window.quizSessionGenerator.generateDeckForStage(targetNodeId, currentLang, round);
    } else if (typeof window.generateStageSession === "function") {
      session = window.generateStageSession(targetNodeId, currentLang, round);
    } else if (window.VOCA_DATA && typeof window.VOCA_DATA.generateStageSession === "function") {
      session = window.VOCA_DATA.generateStageSession(targetNodeId, currentLang, round);
    }

    closeLessonModal();
    window.currentSessionQuestions = session;
    const nodeData = { nodeId: targetNodeId, lessonId: targetNodeId, session, words: session };

    if (typeof window.openFlashcardScreen === "function") {
      window.openFlashcardScreen({
        words: session,
        lessonId: targetNodeId,
        nodeData: nodeData,
        onComplete: () => {
          if (typeof window.openGameScreen === "function") {
            window.openGameScreen(targetNodeId, session);
          }
        }
      });
    } else if (typeof window.openGameScreen === "function") {
      window.openGameScreen(targetNodeId, session);
    }
    return session;
  }


  function initLessonModalEvents() {
    const on = (id, event, handler) => {
      const node = el(id);
      if (node && !node._lessonModalBound) {
        node.addEventListener(event, handler);
        node._lessonModalBound = true;
      }
    };

    on("lesson-start-btn", "click", (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      startLesson();
    });

    on("lesson-modal-close-btn", "click", closeLessonModal);

    const backdrop = getLessonBackdrop();
    if (backdrop && !backdrop._backdropBound) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeLessonModal();
      });
      backdrop._backdropBound = true;
    }

    const bonusClaimBtn = el("bonus-claim-btn");
    if (bonusClaimBtn && !bonusClaimBtn._bonusBound) {
      bonusClaimBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nodeId = window.currentBonusNodeId || "node-bonus";
        if (typeof window.claimBonusReward === "function") window.claimBonusReward(nodeId);
        closeBonusModal();
      });
      bonusClaimBtn._bonusBound = true;
    }

    const bonusBackdrop = el("bonus-modal-backdrop");
    if (bonusBackdrop && !bonusBackdrop._bonusBackdropBound) {
      bonusBackdrop.addEventListener("click", (e) => {
        if (e.target === bonusBackdrop) closeBonusModal();
      });
      bonusBackdrop._bonusBackdropBound = true;
    }
    on("btn-close-bonus-modal", "click", closeBonusModal);

    // 약점 극복 스피드런 모달 이벤트 바인딩
    on("btn-start-speedrun-game", "click", startRoadmapReviewSpeedrun);
    on("btn-close-speedrun-modal", "click", closeReviewSpeedrunModal);
    const speedrunBackdrop = el("review-speedrun-modal-backdrop");
    if (speedrunBackdrop && !speedrunBackdrop._speedrunBound) {
      speedrunBackdrop.addEventListener("click", (e) => {
        if (e.target === speedrunBackdrop) closeReviewSpeedrunModal();
      });
      speedrunBackdrop._speedrunBound = true;
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initLessonModalEvents);
    } else {
      initLessonModalEvents();
    }
  }

  window.openLessonModal = openLessonModal;
  window.closeLessonModal = closeLessonModal;
  window.openBonusModal = openBonusModal;
  window.closeBonusModal = closeBonusModal;
  window.openReviewSpeedrunModal = openReviewSpeedrunModal;
  window.closeReviewSpeedrunModal = closeReviewSpeedrunModal;
  window.startRoadmapReviewSpeedrun = startRoadmapReviewSpeedrun;
  window.startLesson = startLesson;
  window.initLessonModalEvents = initLessonModalEvents;
  window.setupLessonModalEvents = initLessonModalEvents;
})();
