// ==============================================================================
// VocaDash Game Result Modal Module (js/gameResultModal.js) - 최적화 통합 버전
// ==============================================================================
(function () {
  "use strict";

  let isStageFinishing = false, isHandlingResultPrimary = false, stageFinishingTimer = null;

  window.resetStageFinishingFlag = () => {
    if (stageFinishingTimer) { clearTimeout(stageFinishingTimer); stageFinishingTimer = null; }
    isStageFinishing = window.isStageFinishing = isHandlingResultPrimary = window.isHandlingResultPrimary = false;
  };

  const calculateStarsByAccuracy = acc => (acc = Number(acc) || 0) >= 90 ? 3 : (acc >= 70 ? 2 : (acc >= 50 ? 1 : 0));

  function renderModalStars(starCount) {
    const count = Math.max(0, Math.min(3, Number(starCount) || 0));
    [1, 2, 3].forEach((n, idx) => {
      const el = document.getElementById(`result-star-${n}`);
      if (el) { el.classList.toggle("active", idx < count); el.style.opacity = idx < count ? "1" : "0.25"; }
    });
  }

  function renderResultModal(isClear) {
    isHandlingResultPrimary = window.isHandlingResultPrimary = false;
    const modal = document.getElementById("game-result-modal");
    if (modal) {
      modal.classList.remove("hidden", "opacity-0", "pointer-events-none");
      modal.classList.add("opacity-100", "pointer-events-auto");
      modal.style.display = "flex";
      modal.style.pointerEvents = "auto";
      modal.style.removeProperty("pointer-events");
      modal.style.zIndex = "9999";
    }

    const confetti = document.getElementById("result-confetti-container");
    if (confetti) {
      confetti.style.pointerEvents = "none";
    }

    const clearCard = document.getElementById("game-result-clear-card");
    if (clearCard) {
      clearCard.classList.remove("hidden");
      clearCard.classList.toggle("hidden", !isClear);
      clearCard.style.display = isClear ? "flex" : "none";
      clearCard.style.pointerEvents = isClear ? "auto" : "none";
      if (isClear) {
        clearCard.style.removeProperty("pointer-events");
        clearCard.style.pointerEvents = "auto";
      }
    }

    const nextBtn = document.getElementById("btn-next-stage");
    if (nextBtn) {
      nextBtn.style.pointerEvents = "auto";
      nextBtn.disabled = false;
    }
    const secBtn = document.getElementById("btn-result-secondary");
    if (secBtn) {
      secBtn.style.pointerEvents = "auto";
      secBtn.disabled = false;
    }

    const overCard = document.getElementById("game-result-gameover-card");
    if (overCard) {
      overCard.classList.remove("hidden");
      overCard.classList.toggle("hidden", isClear);
      overCard.style.display = isClear ? "none" : "flex";
      overCard.style.pointerEvents = isClear ? "none" : "auto";

      if (!isClear && window.isUnitSkipTestMode) {
        overCard.innerHTML = `
          <div class="flex flex-col items-center text-center p-6 space-y-4">
            <div class="text-6xl animate-bounce">💔</div>
            <div class="text-2xl font-black text-slate-800">아쉬워요! 시험 불합격</div>
            <p class="text-sm font-bold text-slate-500 leading-relaxed">모든 기회를 소진했습니다.<br/>단어를 복습하고 다시 도전해보세요!</p>
            <button id="btn-skip-test-fail-exit" class="w-full py-3.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-black text-base rounded-2xl shadow-md transition cursor-pointer">로드맵으로 돌아가기</button>
          </div>
        `;
        const btnSkipExit = document.getElementById("btn-skip-test-fail-exit");
        if (btnSkipExit) {
          btnSkipExit.onclick = () => {
            window.isUnitSkipTestMode = false;
            modal?.classList.add("hidden");
            window.setUserHearts?.(0);
            window._shouldOpenAdRechargeOnRoadmap = true;
            window.exitGameToRoadmap?.(true);
          };
        }
      }
    }
  }

  function closeResultModal() {
    if (typeof window.resetStageFinishingFlag === "function") {
      window.resetStageFinishingFlag();
    }
    const modal = document.getElementById("game-result-modal");
    if (modal) {
      modal.classList.add("hidden", "opacity-0", "pointer-events-none");
      modal.classList.remove("opacity-100", "pointer-events-auto");
      modal.style.display = "none";
      modal.style.pointerEvents = "none";
    }
    const clearCard = document.getElementById("game-result-clear-card");
    if (clearCard) {
      clearCard.classList.add("hidden");
      clearCard.style.display = "none";
      clearCard.style.pointerEvents = "none";
    }
    const overCard = document.getElementById("game-result-gameover-card");
    if (overCard) {
      overCard.classList.add("hidden");
      overCard.style.display = "none";
      overCard.style.pointerEvents = "none";
    }
  }

  function triggerGameOver() {
    window.clearAllGameTimers?.();
    window.cancelGameLoop?.();
    window.stopTTS?.();
    try { window.speechSynthesis?.cancel(); } catch (_) { }
    window.isGameActive = false;
    finishGameStage(false);
  }

  function finishGameStage(isClear = true, customAccuracy = null) {
    if (window.isStageFinishing || isStageFinishing) return false;

    isStageFinishing = window.isStageFinishing = true;
    if (stageFinishingTimer) clearTimeout(stageFinishingTimer);
    stageFinishingTimer = setTimeout(() => { isStageFinishing = window.isStageFinishing = false; }, 800);

    const currentLessonId = window.currentGameLessonId || window.currentSelectedNodeId || "node-2";
    const questions = (Array.isArray(window.gameQuestions) && window.gameQuestions.length > 0) ? window.gameQuestions : (window.currentSessionQuestions || []);
    const missed = window.missedWords || [];
    const qIdx = window.currentQuestionIdx || 0;

    window.clearAllGameTimers?.();
    window.cancelGameLoop?.();
    window.stopTTS?.();
    if (window.dropRafId) { cancelAnimationFrame(window.dropRafId); window.dropRafId = null; }
    try { window.speechSynthesis?.cancel(); } catch (_) { }
    window.isGameActive = window.isQuestionActive = false;

    renderResultModal(isClear);
    const bubble = document.getElementById("game-dropping-bubble") || document.getElementById("dropping-word");
    if (bubble) { bubble.classList.add("hidden"); bubble.style.display = "none"; }

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    setTxt("result-score", window.score || 0);
    setTxt("result-correct-count", questions.length || 10);
    setTxt("result-combo-text", `x${window.maxCombo || 10}`);

    if (isClear) {
      window.playSound?.("clear");
      const totalQ = questions.length || 10;
      let calculatedAcc = 100;

      if (customAccuracy !== null && !isNaN(Number(customAccuracy))) {
        calculatedAcc = Math.max(0, Math.min(100, Math.round(Number(customAccuracy))));
      } else {
        const attempts = Number(window.totalAttemptCount) || 0;
        const correct = Array.isArray(window.correctWords) ? window.correctWords.length : 0;
        if (attempts > 0 && correct > 0) {
          calculatedAcc = Math.max(0, Math.min(100, Math.round((correct / attempts) * 100)));
        } else if (attempts > 0 && correct === 0) {
          calculatedAcc = 0;
        } else if (missed.length === 0) {
          calculatedAcc = 100;
        } else {
          const distinctMissed = new Set(missed.map(w => w.id || w.word || w.term)).size;
          calculatedAcc = Math.max(0, Math.min(100, Math.round(((totalQ - distinctMissed) / totalQ) * 100)));
        }
      }

      // 💡 완주(isClear = true) 시 최소 1별 및 50% 정확도 보장 (부활 후 완주했는데 실패 뜨는 UX 모순 방지)
      if (calculatedAcc < 50) {
        calculatedAcc = 50;
      }

      const stars = calculateStarsByAccuracy(calculatedAcc);
      window.lastEarnedStars = stars;
      renderModalStars(stars);
      setTxt("result-accuracy-text", `${calculatedAcc}%`);
      const accAlt = document.getElementById("result-accuracy"); if (accAlt) accAlt.textContent = `${calculatedAcc}%`;

      let saveRes = null;
      if (!window.isUnitSkipTestMode && typeof window.saveStageClearResult === "function") {
        saveRes = window.saveStageClearResult({
          nodeId: currentLessonId, isClear: true, accuracy: calculatedAcc,
          questions, missedWords: missed, isReviewMode: !!window.isReviewGameMode, isSpeedrun: !!window.isRoadmapReviewSpeedrun
        });
      }

      const nextCount = saveRes?.nextCount ?? 1;
      const isBoss = saveRes ? saveRes.isBoss : (String(currentLessonId).includes("boss") || currentLessonId === "node-boss");
      const actualTitle = window.actualUnitTitle || window.currentUnit?.title || "생존 첫걸음";

      let title = "¡STAGE CLEAR!", sub = `${actualTitle} (${nextCount}/3) 클리어!`, btn = nextCount < 3 ? `다음 라운드 (${nextCount + 1}/3) ▶` : "다음 스테이지 ▶";
      const isReviewNode = window.isReviewGameMode || window.isRoadmapReviewSpeedrun || String(currentLessonId).includes("review");
      if (stars === 0) { title = "클리어 실패"; sub = "아쉬워요! 다시 도전해 보세요 💪"; btn = "다시 도전하기 🔄"; }
      else if (isReviewNode) { title = "⚡ 약점 복습 완료!"; sub = "핵심 단어 복습을 성공적으로 마쳤습니다! 👏"; btn = "다음 스테이지 이동 ▶"; }
      else if (isBoss) { sub = `${actualTitle} 보스전 완파! 🏆`; btn = "다음 유닛 도전하기 🚀"; }
      else if (nextCount >= 3) { sub = `${actualTitle} (3/3) 마스터!`; }

      if (window.isUnitSkipTestMode) {
        const isPassed = stars > 0 || calculatedAcc >= 70;
        const targetUnit = window.currentSkipTestUnit || 2;
        title = isPassed ? "⚡ 건너뛰기 시험 통과!" : "⚡ 건너뛰기 시험 결과";
        sub = isPassed ? `Unit ${targetUnit} 해금 완료!` : "통과 기준에 미달했습니다";
        btn = isPassed ? `Unit ${targetUnit} 이동 🚀` : "로드맵으로 돌아가기";

        if (isPassed) {
          window.unlockUnitsUpTo?.(targetUnit);
          window.currentUnitNumber = targetUnit;
          window._currentVisibleUnitIndex = targetUnit - 1;
          window.setUserHearts?.(window.skipTestOriginalHearts ?? 5);
        } else {
          window.setUserHearts?.(0);
          window._shouldOpenAdRechargeOnRoadmap = true;
        }
        window.isUnitSkipTestMode = false;
      }

      setTxt("result-title", title); setTxt("result-subtitle", sub); setTxt("btn-result-primary-text", btn);

      const btnWrong = document.getElementById("btn-result-wrong-review");
      const missedSec = document.getElementById("result-missed-section");
      if (missed.length > 0) {
        btnWrong?.classList.remove("hidden"); if (btnWrong) btnWrong.style.display = "flex";
        setTxt("btn-result-wrong-review-text", `⚠️ 헷갈린 단어 ${missed.length}개 복습하기`);
        missedSec?.classList.remove("hidden"); if (missedSec) missedSec.style.display = "block";
        setTxt("result-missed-word", missed[0].word || missed[0].term || ""); setTxt("result-missed-meaning", missed[0].meaning || "");
      } else {
        btnWrong?.classList.add("hidden"); if (btnWrong) btnWrong.style.display = "none";
        missedSec?.classList.add("hidden"); if (missedSec) missedSec.style.display = "none";
      }

      if (saveRes?.curGems) setTxt("header-gems-count", saveRes.curGems);
      setTxt("result-gems-text", `+${saveRes?.addGems ?? 10} 💎`);
      setTxt("result-xp-text", `+${saveRes?.addXp ?? 50} XP`);
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
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
    if (isHandlingResultPrimary) return false;
    isHandlingResultPrimary = true;
    setTimeout(() => { isHandlingResultPrimary = false; }, 600);

    closeResultModal();
    window.closeGameScreen?.(true);

    if (window.isUnitSkipTestMode) {
      const targetUnit = window.currentSkipTestUnit || 2;
      window.isUnitSkipTestMode = false;
      window.renderRoadmap?.();
      window.exitGameToRoadmap?.(true);
      setTimeout(() => {
        if (typeof window.switchToUnit === 'function') window.switchToUnit(targetUnit);
        else {
          const s = document.querySelector(`.unit-section-block[data-unit-index="${targetUnit - 1}"]`);
          if (s) s.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.updateTopUnitBanner?.(targetUnit - 1);
        }
      }, 50);
      return false;
    }

    const currentPlayingId = window.currentGameLessonId || window.currentSelectedNodeId || "node-1";
    const isReview = window.isReviewGameMode || window.isRoadmapReviewSpeedrun || String(currentPlayingId).includes("review") || String(currentPlayingId).endsWith("_n4");

    if (isReview) {
      const isRoadmapSpeedrun = !!window.isRoadmapReviewSpeedrun || String(currentPlayingId).includes("review") || String(currentPlayingId).endsWith("_n4");
      window.isReviewGameMode = window.isRoadmapReviewSpeedrun = false;
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
    const step = (typeof window.getNextStageStep === "function")
      ? window.getNextStageStep(currentPlayingId, window.lastEarnedStars)
      : { action: "learning_pipeline", nextNodeId: "u1_node-2", nextRound: 1 };

    if (step.action === "course_complete") {
      window.exitGameToRoadmap?.(true);
      if (typeof window.showCourseCompletionModal === "function") window.showCourseCompletionModal();
      else window.showToast?.("🏆 축하합니다! 모든 코스 유닛을 완벽 마스터했습니다!", "🎉");
      return false;
    }

    window.currentSelectedNodeId = window.currentGameLessonId = window.currentLessonId = step.nextNodeId;
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
      ? window.currentSessionWrongWords : (window.missedWords || []);

    if (!wrongWords || wrongWords.length === 0) {
      window.showToast?.("복습할 오답 단어가 없습니다! 다음으로 진행합니다.", "👍");
      return handleResultPrimary();
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
    window.openFlashcardScreen?.({ words: wrongWords, onComplete: () => window.closeFlashcardScreen?.(true) });
  }

  function handleResultSecondary(e) {
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
    closeResultModal();
    window.isUnitSkipTestMode = false;
    window.isReviewGameMode = window.isRoadmapReviewSpeedrun = window.isWrongWordsMiniReviewActive = false;
    window.currentGameLessonId = window.currentSelectedNodeId = null;
    window.renderRoadmap?.();
    window.exitGameToRoadmap?.(true);

    const targetUnit = window.currentUnitNumber;
    if (targetUnit && targetUnit > 1) {
      setTimeout(() => {
        if (typeof window.switchToUnit === 'function') window.switchToUnit(targetUnit);
        else {
          const s = document.querySelector(`.unit-section-block[data-unit-index="${targetUnit - 1}"]`);
          if (s) s.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.updateTopUnitBanner?.(targetUnit - 1);
        }
      }, 50);
    } else {
      window.focusActiveRoadmapNode?.();
    }
  }

  function showCourseCompletionModal() {
    let modal = document.getElementById("course-completion-modal");
    if (!modal) {
      modal = document.createElement("div"); modal.id = "course-completion-modal";
      modal.className = "fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 select-none";
      modal.innerHTML = `
        <div class="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
          <span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full mb-2">🎉 COURSE COMPLETED</span>
          <h2 class="text-xl font-black text-slate-900 mb-1">모든 코스 완주 달성! 🏆</h2>
          <p class="text-xs text-slate-600 mb-6 leading-relaxed">축하합니다! 코스의 모든 유닛과 보스전을 마스터했습니다!</p>
          <button id="btn-close-completion-modal" type="button" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 hover:brightness-105 active:scale-95 transition-all cursor-pointer">로드맵으로 돌아가기 🗺️</button>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector("#btn-close-completion-modal").onclick = () => { modal.classList.add("hidden"); modal.style.display = "none"; window.exitGameToRoadmap?.(true); };
    }
    modal.classList.remove("hidden"); modal.style.display = "flex";
  }

  function bindResultModalEvents() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    on("btn-result-wrong-review", e => { e?.preventDefault?.(); startWrongWordsMiniReview(); });
    ["btn-next-stage", "btn-result-primary"].forEach(id => on(id, e => { e?.preventDefault?.(); handleResultPrimary(e); }));
    on("btn-result-secondary", handleResultSecondary);
    const handleExit = e => { e?.preventDefault?.(); closeResultModal(); window.exitGameToRoadmap?.(true); };
    ["game-over-exit-btn", "btn-gameover-roadmap", "btn-gameover-close"].forEach(id => on(id, handleExit));
    on("btn-gameover-retry", e => { e?.preventDefault?.(); window.restartStageInMemory?.(e); });

    // 💡 [핵심 보완] 광고 보고 하트 채워 이어하기 핸들러 (gameEngine reviveGameWithAd로 단일 책임 일원화)
    on("btn-gameover-ad-revive", e => {
      e?.preventDefault?.();
      closeResultModal();

      if (typeof window.reviveGameWithAd === "function") {
        window.reviveGameWithAd();
      } else {
        // Fallback: 전역 하트 및 상태 복구
        if (typeof window.setUserHearts === "function") window.setUserHearts(3);
        if (typeof window.updateHeaderHearts === "function") window.updateHeaderHearts(3);
        window.hearts = 3;
        window.isGameActive = true;
        window.isQuestionActive = true;
        if (typeof window.spawnQuestion === "function") {
          window.spawnQuestion(window.currentQuestionIdx || 0);
        }
      }

      window.showToast?.("❤️ 하트 3개가 충전되어 게임을 이어갑니다!", "✨");
    });

    const modal = document.getElementById("game-result-modal");
    if (modal && !modal._delegationBound) {
      modal._delegationBound = true;
      modal.addEventListener("click", e => {
        const target = e.target;
        if (!target) return;
        const btnNext = target.closest("#btn-next-stage, #btn-result-primary");
        if (btnNext) {
          e.preventDefault?.();
          handleResultPrimary(e);
          return;
        }
        const btnSec = target.closest("#btn-result-secondary");
        if (btnSec) {
          e.preventDefault?.();
          handleResultSecondary(e);
          return;
        }
        const btnWrong = target.closest("#btn-result-wrong-review");
        if (btnWrong) {
          e.preventDefault?.();
          startWrongWordsMiniReview();
          return;
        }
        const btnExit = target.closest("#game-over-exit-btn, #btn-gameover-roadmap, #btn-gameover-close");
        if (btnExit) {
          e.preventDefault?.();
          closeResultModal();
          window.exitGameToRoadmap?.(true);
          return;
        }
        const btnRetry = target.closest("#btn-gameover-retry");
        if (btnRetry) {
          e.preventDefault?.();
          window.restartStageInMemory?.(e);
          return;
        }
        const btnRevive = target.closest("#btn-gameover-ad-revive");
        if (btnRevive) {
          e.preventDefault?.();
          closeResultModal();
          if (typeof window.reviveGameWithAd === "function") {
            window.reviveGameWithAd();
          } else {
            if (typeof window.setUserHearts === "function") window.setUserHearts(3);
            if (typeof window.updateHeaderHearts === "function") window.updateHeaderHearts(3);
            window.hearts = 3;
            window.isGameActive = true;
            window.isQuestionActive = true;
            if (typeof window.spawnQuestion === "function") {
              window.spawnQuestion(window.currentQuestionIdx || 0);
            }
          }
          window.showToast?.("❤️ 하트 3개가 충전되어 게임을 이어갑니다!", "✨");
          return;
        }
      });
    }
  }

  Object.assign(window, {
    calculateStarsByAccuracy, renderModalStars, renderResultModal, closeResultModal,
    triggerGameOver, finishGameStage, handleResultPrimary, proceedNextStage: handleResultPrimary,
    moveToNextStage: handleResultPrimary, onClearModalNextClick: handleResultPrimary,
    startWrongWordsMiniReview, showCourseCompletionModal, handleResultSecondary, bindResultModalEvents,
    gameResultModal: {
      finishGameStage, triggerGameOver, calculateStarsByAccuracy, renderModalStars,
      renderResultModal, closeResultModal, handleResultPrimary, resetStageFinishingFlag: window.resetStageFinishingFlag
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindResultModalEvents);
  else bindResultModalEvents();
})();
