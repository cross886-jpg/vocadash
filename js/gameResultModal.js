// ==============================================================================
// VocaDash Game Result Modal Module (js/gameResultModal.js)
// [Karpathy 원칙] 순수 모달 UI 전담: 결과 카드 표출, 별점 애니메이션, 이벤트 바인딩
// 진행도 영구 저장 및 다음 스테이지 계산은 js/progressManager.js로 완전 위임
// ==============================================================================
(function () {
  "use strict";

  let isStageFinishing = false, isHandlingResultPrimary = false;

  window.resetStageFinishingFlag = function () {
    isStageFinishing = false; window.isStageFinishing = false;
    isHandlingResultPrimary = false; window.isHandlingResultPrimary = false;
  };

  function calculateStarsByAccuracy(acc) {
    const a = Number(acc) || 0;
    return a >= 90 ? 3 : (a >= 70 ? 2 : (a >= 50 ? 1 : 0));
  }

  function renderModalStars(starCount) {
    const count = Math.max(0, Math.min(3, Number(starCount) || 0));
    ["result-star-1", "result-star-2", "result-star-3"].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      const isActive = idx < count;
      el.classList.toggle("active", isActive);
      el.style.opacity = isActive ? "1" : "0.25";
    });
  }

  function renderResultModal(isClear) {
    const modal = document.getElementById("game-result-modal");
    if (modal) { modal.classList.remove("hidden", "opacity-0", "pointer-events-none"); modal.classList.add("opacity-100", "pointer-events-auto"); modal.style.display = "flex"; modal.style.zIndex = "9999"; }
    const clearCard = document.getElementById("game-result-clear-card");
    if (clearCard) { clearCard.classList.toggle("hidden", !isClear); clearCard.style.display = isClear ? "flex" : "none"; }
    const overCard = document.getElementById("game-result-gameover-card");
    if (overCard) { overCard.classList.toggle("hidden", isClear); overCard.style.display = isClear ? "none" : "flex"; }
  }

  function closeResultModal() {
    const modal = document.getElementById("game-result-modal");
    if (modal) { modal.classList.add("hidden", "opacity-0", "pointer-events-none"); modal.classList.remove("opacity-100", "pointer-events-auto"); modal.style.display = "none"; }
  }

  function triggerGameOver() {
    window.clearAllGameTimers?.(); window.cancelGameLoop?.(); window.stopTTS?.();
    if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch (_) { } }
    window.isGameActive = false;
    finishGameStage(false);
  }

  function finishGameStage(isClear = true, customAccuracy = null) {
    const currentLessonId = window.currentGameLessonId || window.currentSelectedNodeId || "node-2";
    const questions = (Array.isArray(window.gameQuestions) && window.gameQuestions.length > 0)
      ? window.gameQuestions : (Array.isArray(window.currentSessionQuestions) ? window.currentSessionQuestions : []);
    const missed = Array.isArray(window.missedWords) ? window.missedWords : [];
    const qIdx = (typeof window.currentQuestionIdx === "number") ? window.currentQuestionIdx : 0;
    const combo = (typeof window.maxCombo === "number") ? window.maxCombo : 0;
    const scoreVal = (typeof window.score === "number") ? window.score : 0;

    if (window.isStageFinishing && isStageFinishing) return false;
    isStageFinishing = true; window.isStageFinishing = true;
    setTimeout(() => { isStageFinishing = false; window.isStageFinishing = false; }, 800);

    window.clearAllGameTimers?.(); window.cancelGameLoop?.(); window.stopTTS?.();
    if (window.dropRafId) { cancelAnimationFrame(window.dropRafId); window.dropRafId = null; }
    if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch (_) { } }
    window.isGameActive = false; window.isQuestionActive = false;

    renderResultModal(isClear);
    const bubble = document.getElementById("game-dropping-bubble") || document.getElementById("dropping-word");
    if (bubble) { bubble.classList.add("hidden"); bubble.style.display = "none"; }

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    setTxt("result-score", scoreVal);
    setTxt("result-correct-count", questions.length || 10);
    setTxt("result-combo-text", `x${combo || 10}`);

    if (isClear) {
      window.playSound?.("clear");

      const totalQ = questions.length || 10;
      const calculatedAcc = (customAccuracy !== null && !isNaN(Number(customAccuracy)))
        ? Math.max(0, Math.min(100, Math.round(Number(customAccuracy))))
        : (missed.length === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((totalQ - missed.length) / totalQ) * 100))));

      const stars = calculateStarsByAccuracy(calculatedAcc);
      window.lastEarnedStars = stars;
      renderModalStars(stars);
      setTxt("result-accuracy-text", `${calculatedAcc}%`);
      const accAlt = document.getElementById("result-accuracy"); if (accAlt) accAlt.textContent = `${calculatedAcc}%`;

      let saveRes = null;
      if (typeof window.saveStageClearResult === "function") {
        saveRes = window.saveStageClearResult({
          nodeId: currentLessonId, isClear: true, accuracy: calculatedAcc,
          questions, missedWords: missed, isReviewMode: !!window.isReviewGameMode, isSpeedrun: !!window.isRoadmapReviewSpeedrun
        });
      }

      const nextCount = saveRes ? saveRes.nextCount : 1;
      const isBoss = saveRes ? saveRes.isBoss : (String(currentLessonId).includes("boss") || currentLessonId === "node-boss");
      const actualTitle = window.actualUnitTitle || window.currentUnit?.title || "생존 첫걸음";

      let title = "¡STAGE CLEAR!", sub = `${actualTitle} (${nextCount}/3) 클리어!`, btn = nextCount < 3 ? `다음 라운드 (${nextCount + 1}/3) ▶` : "다음 스테이지 ▶";
      if (stars === 0) { title = "클리어 실패"; sub = "아쉬워요! 다시 도전해 보세요 💪"; btn = "다시 도전하기 🔄"; }
      else if (isBoss) { sub = `${actualTitle} 보스전 완파! 🏆`; btn = "다음 유닛 도전하기 🚀"; }
      else if (nextCount >= 3) { sub = `${actualTitle} (3/3) 마스터!`; }

      if (window.isUnitSkipTestMode) {
        const isPassed = Math.max(0, (questions.length || 15) - missed.length) >= 12;
        const targetUnit = window.currentSkipTestUnit || 2;
        title = isPassed ? "⚡ 건너뛰기 시험 통과!" : "⚡ 건너뛰기 시험 결과";
        sub = isPassed ? `Unit ${targetUnit} 해금 완료!` : "통과 기준에 미달했습니다";
        btn = isPassed ? `Unit ${targetUnit} 이동 🚀` : "로드맵으로 돌아가기";
      } else if (window.isReviewGameMode) {
        title = "⚡ 약점 극복 완료!"; sub = `정확도 ${calculatedAcc}% · 약점 극복 완료! 🔓`;
        btn = window.isRoadmapReviewSpeedrun ? "다음 스테이지 ▶" : "오답노트로 복귀";
      }
      setTxt("result-title", title); setTxt("result-subtitle", sub); setTxt("btn-result-primary-text", btn);

      const btnWrong = document.getElementById("btn-result-wrong-review");
      const missedSec = document.getElementById("result-missed-section");
      if (missed.length > 0) {
        if (btnWrong) { btnWrong.classList.remove("hidden"); btnWrong.style.display = "flex"; setTxt("btn-result-wrong-review-text", `⚠️ 헷갈린 단어 ${missed.length}개 복습하기`); }
        if (missedSec) { missedSec.classList.remove("hidden"); missedSec.style.display = "block"; setTxt("result-missed-word", missed[0].word || missed[0].term || ""); setTxt("result-missed-meaning", missed[0].meaning || ""); }
      } else {
        if (btnWrong) { btnWrong.classList.add("hidden"); btnWrong.style.display = "none"; }
        if (missedSec) { missedSec.classList.add("hidden"); missedSec.style.display = "none"; }
      }

      const addGems = saveRes ? saveRes.addGems : 10, addXp = saveRes ? saveRes.addXp : 50;
      if (saveRes?.curGems) setTxt("header-gems-count", saveRes.curGems);
      setTxt("result-gems-text", `+${addGems} 💎`);
      setTxt("result-xp-text", `+${addXp} XP`);
    } else {
      const lastFailed = missed[missed.length - 1] || questions[qIdx];
      const charPrefix = (window.currentLanguage || window.currentActiveCourse || "es") === "en" ? "en" : "es";
      document.querySelectorAll("#game-result-gameover-card img").forEach(img => { img.src = `assets/characters/${charPrefix}-sad.webp?v=68`; });
      if (lastFailed) { setTxt("gameover-missed-word", lastFailed.word || lastFailed.term || ""); setTxt("gameover-missed-meaning", lastFailed.meaning || ""); }
      const totalQ = questions.length || 10, progPct = Math.round((qIdx / totalQ) * 100);
      setTxt("gameover-progress-text", `${qIdx} / ${totalQ} 단어 (${progPct}%)`);
      const goProgBar = document.getElementById("gameover-progress-bar"); if (goProgBar) goProgBar.style.width = `${progPct}%`;
    }
    return true;
  }

  function handleResultPrimary(e) {
    if (e) { if (typeof e.preventDefault === "function") e.preventDefault(); if (typeof e.stopPropagation === "function") e.stopPropagation(); }
    if (isHandlingResultPrimary) return false;
    isHandlingResultPrimary = true;
    setTimeout(() => { isHandlingResultPrimary = false; }, 600);

    closeResultModal();
    window.closeGameScreen?.(true);

    if (window.isUnitSkipTestMode) {
      const targetUnit = window.currentSkipTestUnit || 2;
      const totalQ = (window.gameQuestions && window.gameQuestions.length) || 15;
      const missed = window.missedWords || [];
      const isPassed = Math.max(0, totalQ - missed.length) >= 12;
      window.isUnitSkipTestMode = false;
      window.exitGameToRoadmap?.(true);
      if (isPassed) window.unlockUnitsUpTo?.(targetUnit);
      window.showToast?.(isPassed ? `🎉 Unit ${targetUnit} 해금 완료!` : "불합격했습니다. 다음에 다시 도전해 보세요!");
      return false;
    }

    if (window.isReviewGameMode) {
      const isRoadmapSpeedrun = !!window.isRoadmapReviewSpeedrun;
      window.isReviewGameMode = false; window.isRoadmapReviewSpeedrun = false;
      if (!isRoadmapSpeedrun) {
        window.exitGameToRoadmap?.(true); window.switchMainTab?.("review", true);
      } else {
        const uNum = window.currentReviewUnitNumber || window.currentUnitNumber || 1;
        const reviewKey = (typeof window.getCompositeNodeKey === "function") ? window.getCompositeNodeKey("node-review", uNum) : `u${uNum}_node-review`;
        window.completeReviewNode?.(reviewKey, uNum);
        window.exitGameToRoadmap?.(true);
        window.focusActiveRoadmapNode?.();
      }
      return false;
    }

    const currentPlayingId = window.currentGameLessonId || window.currentSelectedNodeId || "node-1";
    const step = (typeof window.getNextStageStep === "function")
      ? window.getNextStageStep(currentPlayingId, window.lastEarnedStars)
      : { action: "learning_pipeline", nextNodeId: "u1_node-2", nextRound: 1 };

    if (step.action === "course_complete") {
      window.exitGameToRoadmap?.(true);
      if (typeof window.showCourseCompletionModal === "function") window.showCourseCompletionModal();
      else window.showToast?.("🏆 축하합니다! 모든 코스 유닛을 완벽 마스터했습니다!", "🎉");
      return false;
    }

    window.currentSelectedNodeId = step.nextNodeId;
    window.currentGameLessonId = step.nextNodeId;
    window.currentLessonId = step.nextNodeId;

    const flashcardScreen = document.getElementById("flashcard-screen");
    if (flashcardScreen) {
      flashcardScreen.classList.remove("hidden", "opacity-0", "pointer-events-none");
      flashcardScreen.classList.add("opacity-100", "pointer-events-auto");
      flashcardScreen.style.removeProperty("display");
      flashcardScreen.style.display = "";
    }

    if (typeof window.startStageLearningPipeline === "function") window.startStageLearningPipeline(step.nextNodeId, step.nextSession);
    else if (typeof window.openFlashcardScreen === "function") window.openFlashcardScreen(step.nextNodeId, step.nextSession);
    else if (typeof window.openGameScreen === "function") window.openGameScreen(step.nextNodeId, step.nextSession);
    return false;
  }

  function startWrongWordsMiniReview() {
    const wrongWords = (Array.isArray(window.currentSessionWrongWords) && window.currentSessionWrongWords.length > 0)
      ? window.currentSessionWrongWords
      : (Array.isArray(window.missedWords) && window.missedWords.length > 0 ? window.missedWords : []);

    if (!wrongWords || wrongWords.length === 0) {
      window.showToast?.("복습할 오답 단어가 없습니다! 다음으로 진행합니다.", "👍");
      handleResultPrimary();
      return;
    }

    closeResultModal();
    const gScreen = document.getElementById("game-screen");
    if (gScreen) { gScreen.classList.add("hidden", "opacity-0", "pointer-events-none"); gScreen.style.display = "none"; }
    const flashcardScreen = document.getElementById("flashcard-screen");
    if (flashcardScreen) {
      flashcardScreen.classList.remove("hidden", "opacity-0", "pointer-events-none");
      flashcardScreen.classList.add("opacity-100", "pointer-events-auto");
      flashcardScreen.style.removeProperty("display");
      flashcardScreen.style.display = "";
    }
    window.openFlashcardScreen?.({
      words: wrongWords,
      onComplete: () => { window.closeFlashcardScreen?.(true); }
    });
  }

  function handleResultSecondary(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    closeResultModal();
    window.currentGameLessonId = null; window.currentSelectedNodeId = null;
    window.exitGameToRoadmap?.(true);
    window.focusActiveRoadmapNode?.();
  }

  function showCourseCompletionModal() {
    let modal = document.getElementById("course-completion-modal");
    if (!modal) {
      modal = document.createElement("div"); modal.id = "course-completion-modal";
      modal.className = "fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 select-none";
      modal.innerHTML = `<div class="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full mb-2">🎉 COURSE COMPLETED</span>
        <h2 class="text-xl font-black text-slate-900 mb-1">모든 코스 완주 달성! 🏆</h2>
        <p class="text-xs text-slate-600 mb-6 leading-relaxed">축하합니다! 코스의 모든 유닛과 보스전을 마스터했습니다!</p>
        <button id="btn-close-completion-modal" type="button" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 hover:brightness-105 active:scale-95 transition-all cursor-pointer">로드맵으로 돌아가기 🗺️</button>
      </div>`;
      document.body.appendChild(modal);
      const closeBtn = modal.querySelector("#btn-close-completion-modal");
      if (closeBtn) closeBtn.onclick = () => { modal.classList.add("hidden"); modal.style.display = "none"; window.exitGameToRoadmap?.(true); };
    }
    modal.classList.remove("hidden"); modal.style.display = "flex";
  }

  function bindResultModalEvents() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    on("btn-result-wrong-review", (e) => { if (e) e.preventDefault(); startWrongWordsMiniReview(); });
    ["btn-next-stage", "btn-result-primary"].forEach(id => on(id, (e) => { if (e) e.preventDefault(); handleResultPrimary(e); }));
    on("btn-result-secondary", handleResultSecondary);
    const handleExit = (e) => { if (e) e.preventDefault(); closeResultModal(); window.exitGameToRoadmap?.(true); };
    ["game-over-exit-btn", "btn-gameover-roadmap", "btn-gameover-close"].forEach(id => on(id, handleExit));
    on("btn-gameover-retry", (e) => { if (e) e.preventDefault(); window.restartStageInMemory?.(e); });
    on("btn-gameover-ad-revive", (e) => {
      if (e) e.preventDefault(); closeResultModal(); window.reviveGameHearts?.(3); window.showToast?.("❤️ 하트 3개가 충전되었습니다!", "✨");
    });
  }

  Object.assign(window, {
    calculateStarsByAccuracy, renderModalStars, renderResultModal, closeResultModal,
    triggerGameOver, finishGameStage, handleResultPrimary, proceedNextStage: handleResultPrimary,
    moveToNextStage: handleResultPrimary, onClearModalNextClick: handleResultPrimary,
    startWrongWordsMiniReview, showCourseCompletionModal, handleResultSecondary,
    bindResultModalEvents,
    gameResultModal: {
      finishGameStage, triggerGameOver, calculateStarsByAccuracy, renderModalStars,
      renderResultModal, closeResultModal, handleResultPrimary, resetStageFinishingFlag: window.resetStageFinishingFlag
    }
  });

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", bindResultModalEvents); } else { bindResultModalEvents(); }
})();
