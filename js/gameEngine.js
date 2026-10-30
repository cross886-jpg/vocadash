// ==============================================================================
// VocaDash Game Engine Module (js/gameEngine.js)
// 단어 낙하 루프, 4지선다 판정, 콤보/하트 및 4종 아이템 (순수 인게임 상태 머신)
// ==============================================================================

(function () {
  "use strict";

  // --- 1. 인게임 코어 상태 변수 ---
  let currentGameLessonId = "node-2", gameQuestions = [], currentQuestionIdx = 0, currentHearts = 5;
  let combo = 0, maxCombo = 0, score = 0, speedMultiplier = 1.0;
  let isActive = false, isGameActive = false, isPaused = false, isFrozen = false;
  let isQuestionActive = false, isStageFinishing = false, isCurrentQuestionFailed = false;
  let dropRafId = null, dropStartTime = 0, freezeTimer = null, gameNextQuestionTimer = null;
  let currentCorrectChoiceIdx = -1, missedWords = [], correctWords = [], totalAttemptCount = 0, sessionStartTime = 0;
  const dropBaseDuration = 11500;

  const getInventory = () => (typeof window.getVocaInventory === "function" ? window.getVocaInventory() : { pass: 2, freeze: 1, bomb: 1, heal: 1 });
  const saveInventory = inv => { if (typeof window.saveVocaInventory === "function") window.saveVocaInventory(inv); else try { localStorage.setItem("vocadash_inventory", JSON.stringify(inv)); } catch (_) { } };
  window.gameItemCounts = getInventory();

  // --- 2. DOM 엘리먼트 캐싱 & 타이머 관리 ---
  let gameScreen, gameContainer, gameHeartsContainer, gameStageTitle, gameProgressBar, gameProgressText;
  let gameComboBadge, gameComboText, gameSpeedText, gameArena, gameFreezeOverlay, gameFloatingEffect, gameFloatingText;
  let gameDroppingBubble, gameDroppingWord, choicesContainer, gameChoiceBtns = [];

  function initDOMElements() {
    const el = id => document.getElementById(id);
    gameScreen = el("game-screen"); gameContainer = el("game-container");
    gameHeartsContainer = el("game-hearts"); gameStageTitle = el("game-stage-title");

    gameProgressBar = el("game-progress-bar"); gameProgressText = el("game-progress-text");
    gameComboBadge = el("game-combo-badge"); gameComboText = el("game-combo-text"); gameSpeedText = el("game-speed-text");
    gameArena = el("game-arena"); gameFreezeOverlay = el("game-freeze-overlay");
    gameFloatingEffect = el("game-floating-effect"); gameFloatingText = el("game-floating-text");
    gameDroppingBubble = el("game-dropping-bubble");
    gameDroppingWord = el("game-dropping-word") || el("dropping-word");
    choicesContainer = el("game-choices-container");
    gameChoiceBtns = Array.from(document.querySelectorAll(".game-choice-btn"));
  }
  function clearAllGameTimers() {
    if (dropRafId) { cancelAnimationFrame(dropRafId); dropRafId = null; }
    if (freezeTimer) { clearTimeout(freezeTimer); freezeTimer = null; }
    if (gameNextQuestionTimer) { clearTimeout(gameNextQuestionTimer); gameNextQuestionTimer = null; }
  }
  function cancelGameLoop() { if (dropRafId) { cancelAnimationFrame(dropRafId); dropRafId = null; } }
  window.clearAllGameTimers = clearAllGameTimers;
  window.cancelGameLoop = cancelGameLoop;

  // --- 3. UI 갱신 & 피드백 ---
  function updateHeartsUI() {
    if (!gameHeartsContainer) return;
    gameHeartsContainer.querySelectorAll(".game-heart").forEach((icon, idx) => {
      const active = idx < currentHearts;
      icon.className = active ? "game-heart material-symbols-outlined text-[14px] text-error transition-all" : "game-heart material-symbols-outlined text-[14px] text-slate-300 transition-all opacity-40";
      icon.textContent = "favorite";
    });
    window.userHearts = currentHearts;
  }


  function decreaseHeart() {
    if (currentHearts <= 0) return 0;
    currentHearts = Math.max(0, currentHearts - 1);
    updateHeartsUI();
    if (typeof window.setUserHearts === "function") window.setUserHearts(currentHearts);
    return currentHearts;
  }

  function updateItemCountUI() {
    const inv = getInventory(); window.gameItemCounts = inv;
    ["pass", "freeze", "bomb", "heal"].forEach(t => { const el = document.getElementById(`game-item-${t}-count`); if (el) el.textContent = inv[t] ?? 0; });
  }

  function updateHeaderStatusUI() {
    if (gameProgressText) gameProgressText.textContent = `${currentQuestionIdx + 1}/${gameQuestions.length || 10}`;
    if (gameProgressBar) gameProgressBar.style.width = `${Math.round(((currentQuestionIdx) / (gameQuestions.length || 10)) * 100)}%`;
    if (gameComboBadge && gameComboText) {
      gameComboBadge.classList.toggle("hidden", combo < 2);
      if (combo >= 2) gameComboText.textContent = `${combo} COMBO`;
    }
    if (gameSpeedText) gameSpeedText.textContent = `${speedMultiplier.toFixed(1)}x`;
  }

  function showGameFloatingEffect(text, isPositive = true) {
    if (!gameFloatingEffect || !gameFloatingText) return;
    gameFloatingText.textContent = text;
    gameFloatingText.className = isPositive ? "px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs shadow-md" : "px-3.5 py-1.5 rounded-full bg-rose-500 text-white font-black text-xs shadow-md";
    gameFloatingEffect.classList.remove("hidden", "animate-float-pop");
    void gameFloatingEffect.offsetWidth; gameFloatingEffect.classList.add("animate-float-pop");
  }

  // --- 4. 문제 출제 및 낙하 루프 ---
  function spawnQuestion(index) {
    clearAllGameTimers();
    if (window.stopTTS) window.stopTTS();
    if (typeof speechSynthesis !== "undefined") { try { speechSynthesis.cancel(); } catch (_) { } }

    if (!isActive || !isGameActive) return;
    if (!Array.isArray(gameQuestions) || gameQuestions.length === 0) {
      console.warn("[GameEngine] spawnQuestion: gameQuestions is empty. Safely returning to roadmap.");
      if (typeof window.showToast === "function") {
        window.showToast("학습할 단어가 없습니다. 로드맵으로 돌아갑니다.", "⚠️");
      }
      (typeof window.exitGameToRoadmap === "function" ? window.exitGameToRoadmap : exitGameToRoadmap)(true);
      return;
    }
    if (index >= gameQuestions.length) {
      finishGameStage(true);
      return;
    }

    currentQuestionIdx = index;
    window.currentQuestionIdx = index;
    isQuestionActive = true;
    isFrozen = false;
    isCurrentQuestionFailed = false;
    if (gameFreezeOverlay) gameFreezeOverlay.classList.add("hidden");
    updateHeaderStatusUI();

    const q = gameQuestions[currentQuestionIdx];
    if (!q) { finishGameStage(true); return; }

    if (!gameDroppingBubble || gameChoiceBtns.length === 0) initDOMElements();

    const qTerm = String(q.word || q.term || "").trim() || "VocaDash";
    if (gameDroppingWord) {
      gameDroppingWord.style.display = "inline-block";
      gameDroppingWord.style.opacity = "1";
      if (q.isCloze || qTerm.includes("[  ?  ]")) {
        gameDroppingWord.innerHTML = qTerm.replace(/\[\s*\?\s*\]/g, '<span class="cloze-blank-pill">[ ? ]</span>');
      } else {
        gameDroppingWord.textContent = qTerm;
      }
    }

    // 4지선다 보기 세팅
    const currentLang = window.currentActiveCourse || "es";
    let choices = (window.quizSessionGenerator?.generateQuestionChoices)
      ? window.quizSessionGenerator.generateQuestionChoices(q, gameQuestions, currentGameLessonId, currentLang)
      : [q.meaning || q.answer || "정답", "보기1", "보기2", "보기3"];

    const correctAns = String(q.isCloze ? (q.answer || q.meaning) : (q.meaning || q.answer || "")).trim();
    currentCorrectChoiceIdx = choices.findIndex(c => String(c).trim() === correctAns);
    if (currentCorrectChoiceIdx === -1) { choices[0] = correctAns; currentCorrectChoiceIdx = 0; }

    gameChoiceBtns.forEach((btn, idx) => {
      const choiceText = choices[idx] || "";
      btn.textContent = choiceText;
      btn.dataset.choice = choiceText;
      btn.dataset.index = idx;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.display = "";
      btn.className = "game-choice-btn h-[44px] rounded-xl bg-white text-on-surface border border-slate-200 font-bold text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer";
    });

    if (gameDroppingBubble) {
      gameDroppingBubble.style.transition = "none";
      gameDroppingBubble.style.transform = "translate3d(0, 0px, 0)";
      gameDroppingBubble.classList.remove("hidden");
      gameDroppingBubble.style.display = "flex";
      gameDroppingBubble.style.opacity = "1";
    }

    // 단어 음성 발음 1회 재생 (sound.js 단일화)
    if (typeof window.speakWord === "function") {
      window.speakWord(q.word || q.term, currentLang);
    }

    dropStartTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    dropRafId = requestAnimationFrame(dropLoop);
  }

  function dropLoop(timestamp) {
    if (!isQuestionActive || isPaused || !isActive || !isGameActive) return;
    if (isFrozen) { dropRafId = requestAnimationFrame(dropLoop); return; }

    const elapsed = timestamp - dropStartTime;
    const duration = dropBaseDuration / speedMultiplier;
    const progress = Math.min(1.0, elapsed / duration);
    const arenaH = (gameArena ? gameArena.clientHeight : 320) || 320;
    const maxDrop = Math.max(80, arenaH - 90);
    const curY = progress * maxDrop;

    if (gameDroppingBubble) {
      gameDroppingBubble.style.transform = `translate3d(0, ${curY}px, 0)`;
    }

    if (progress >= 1.0) {
      handleDeadlineBreached();
      return;
    }
    dropRafId = requestAnimationFrame(dropLoop);
  }

  function checkAnswerMatch(selected, correct) {
    if (!selected || !correct) return false;
    const s = String(selected).trim().toLowerCase(), c = String(correct).trim().toLowerCase();
    return s === c || s.includes(c) || c.includes(s);
  }

  // --- 5. 채점 & 상태 전이 ---
  function handleDeadlineBreached() {
    if (isStageFinishing || !isQuestionActive) return;
    isQuestionActive = false; cancelGameLoop(); window.stopTTS?.();
    totalAttemptCount++;
    combo = 0; speedMultiplier = 1.0;
    const q = gameQuestions[currentQuestionIdx];
    if (q) missedWords.push(q);
    window.missedWords = missedWords;
    window.totalAttemptCount = totalAttemptCount;
    const remaining = decreaseHeart();
    if (gameArena) { gameArena.classList.add("animate-game-shake"); setTimeout(() => gameArena?.classList.remove("animate-game-shake"), 400); }
    showGameFloatingEffect("위험선 도달! -1 ❤️", false);
    window.playSound?.("wrong");
    remaining <= 0 ? triggerGameOver() : (gameNextQuestionTimer = setTimeout(nextQuestion, 900));
  }

  function handleCorrectAnswer(btn, selectedText, isLast = false) {
    if (isStageFinishing || window.isStageFinishing) return;
    if (!isLast && (!isActive || !isGameActive || window.isActive === false || window.isGameActive === false)) return;
    isQuestionActive = false;
    cancelGameLoop();
    if (window.stopTTS) window.stopTTS();

    // ⚡ [핵심] 내려오던 타일을 즉시 화면에서 제거/숨김
    const bubble = document.getElementById("game-dropping-bubble") || document.getElementById("dropping-word");
    if (bubble) {
      bubble.classList.add("hidden");
      bubble.style.display = "none";
    }

    const currentQ = (gameQuestions && gameQuestions[currentQuestionIdx]) || (window.gameQuestions && window.gameQuestions[currentQuestionIdx]);
    if (currentQ) {
      correctWords.push(currentQ);
      window.correctWords = correctWords;
    }
    totalAttemptCount++;
    window.totalAttemptCount = totalAttemptCount;

    if (currentQ && typeof window.recordAnswerResult === "function") {
      try { window.recordAnswerResult(currentQ, true); } catch (_) { }
    }
    if (currentQ && typeof window.addMasteredWord === "function") {
      try { window.addMasteredWord(currentQ); } catch (_) { }
    }

    if (btn) {
      btn.classList.add("!bg-emerald-500", "!text-white", "!border-emerald-600", "ring-4", "ring-emerald-300");
    }

    combo++;
    if (combo > maxCombo) maxCombo = combo;
    const isMasterRound = (window.currentSubStageRound === 3);
    score += isMasterRound ? (150 + (combo * 40)) : (100 + (combo * 20));
    window.score = score;
    window.maxCombo = maxCombo;
    speedMultiplier = Math.min(2.4, 1.0 + (combo * 0.05));
    updateHeaderStatusUI();

    showGameFloatingEffect(combo >= 3 ? `🔥 ${combo} 콤보!` : "정답!", true);
    if (typeof window.playSound === "function") window.playSound("correct");

    // ⚡ [핵심] 600ms 대기 제거: 버튼 초록색 피드백만 스치듯 보여주고(70ms) 바로 다음 문제 생성
    if (gameNextQuestionTimer) clearTimeout(gameNextQuestionTimer);
    gameNextQuestionTimer = setTimeout(nextQuestion, 70);
  }


  function handleWrongAnswer(btn, selectedText) {
    if (isStageFinishing || !isQuestionActive) return;
    isCurrentQuestionFailed = true; combo = 0; speedMultiplier = 1.0; updateHeaderStatusUI();
    totalAttemptCount++;
    const currentQ = gameQuestions[currentQuestionIdx];
    if (currentQ) missedWords.push(currentQ);
    window.missedWords = missedWords;
    window.totalAttemptCount = totalAttemptCount;
    if (btn) { btn.classList.add("!bg-red-500", "!text-white", "!border-red-600"); setTimeout(() => btn?.classList.remove("!bg-red-500", "!text-white", "!border-red-600"), 500); }
    const remaining = decreaseHeart();
    showGameFloatingEffect("오답! -1 ❤️", false);
    window.playSound?.("wrong");
    if (remaining <= 0) { isQuestionActive = false; cancelGameLoop(); triggerGameOver(); }
  }

  function judgeAnswerDirectly(btn, selectedText) {
    if (!isQuestionActive || !isActive || !isGameActive || isStageFinishing) return;
    const q = gameQuestions[currentQuestionIdx];
    if (!q) { finishGameStage(true); return; }

    const targetAns = String(q.isCloze ? (q.answer || q.meaning) : (q.meaning || q.answer || "")).trim();
    const isCorrect = checkAnswerMatch(selectedText, targetAns);

    if (isCorrect) {
      handleCorrectAnswer(btn, selectedText);
    } else {
      handleWrongAnswer(btn, selectedText);
    }
  }

  function nextQuestion() {
    clearAllGameTimers();
    (currentQuestionIdx + 1 >= gameQuestions.length) ? finishGameStage(true) : spawnQuestion(currentQuestionIdx + 1);
  }

  // --- 6. 부스터 아이템 사용 ---
  function useGameItem(itemType) {
    if (!isGameActive && !window.isGameActive) return;
    const inv = (typeof window.getVocaInventory === "function") ? window.getVocaInventory() : (window.gameItemCounts || getInventory());
    if ((inv[itemType] ?? 0) <= 0) {
      if (window.showToast) window.showToast("⚠️ 아이템을 모두 사용했습니다!", "⚠️");
      return;
    }

    if (itemType === "pass") {
      inv.pass--;
      saveInventory(inv);
      window.gameItemCounts = inv;
      updateItemCountUI();
      showGameFloatingEffect("⚡ 번개 패스!", true);
      handleCorrectAnswer(null, "패스");
    } else if (itemType === "freeze") {
      inv.freeze--;
      saveInventory(inv);
      window.gameItemCounts = inv;
      updateItemCountUI();
      isFrozen = true;
      const freezeBtn = document.getElementById("game-item-freeze");
      if (freezeBtn) freezeBtn.disabled = true;
      if (gameFreezeOverlay) gameFreezeOverlay.classList.remove("hidden");
      showGameFloatingEffect("❄️ 5초 빙결!", true);
      freezeTimer = setTimeout(() => {
        isFrozen = false;
        if (freezeBtn) freezeBtn.disabled = false;
        if (gameFreezeOverlay) gameFreezeOverlay.classList.add("hidden");
      }, 5000);
    } else if (itemType === "bomb") {
      inv.bomb--;
      saveInventory(inv);
      window.gameItemCounts = inv;
      updateItemCountUI();
      showGameFloatingEffect("💣 오답 제거!", true);
      const q = gameQuestions[currentQuestionIdx];
      const targetAns = String(q?.isCloze ? (q.answer || q.meaning) : (q?.meaning || q?.answer || "")).trim();
      let removed = 0;
      gameChoiceBtns.forEach(btn => {
        if (removed < 2 && !checkAnswerMatch(btn.dataset.choice, targetAns)) {
          btn.style.opacity = "0.2";
          btn.disabled = true;
          removed++;
        }
      });
    } else if (itemType === "heal") {
      if (currentHearts >= 5) {
        if (window.showToast) window.showToast("이미 체력이 가득 차 있습니다!", "💖");
        showGameFloatingEffect("이미 체력이 가득 차 있습니다!", false);
        return;
      }
      inv.heal--;
      saveInventory(inv);
      window.gameItemCounts = inv;
      updateItemCountUI();
      currentHearts = Math.min(5, currentHearts + 1);
      updateHeartsUI();
      showGameFloatingEffect("💖 하트 +1 회복!", true);
    }
  }
  window.useGameItem = useGameItem;

  // --- 7. 화면 라이프사이클 & 모달 위임 ---
  function openGameScreen(lessonId = "node-2", session = null) {
    // 💡 1. Pre-flight Clean: 이전 결과 모달 즉시 닫기 및 스타일 완전 초기화
    if (typeof window.closeResultModal === "function") {
      window.closeResultModal();
    }
    const resultModal = document.getElementById("game-result-modal");
    if (resultModal) {
      resultModal.classList.add("hidden", "opacity-0", "pointer-events-none");
      resultModal.classList.remove("opacity-100", "pointer-events-auto");
      resultModal.style.display = "none";
      resultModal.style.pointerEvents = "none";
    }

    // 💡 2. 타이머 & 종료 플래그 완전 초기화
    initDOMElements();
    clearAllGameTimers();
    cancelGameLoop();
    if (window.stopTTS) window.stopTTS();
    try { window.speechSynthesis?.cancel(); } catch (_) { }
    isStageFinishing = false;
    window.isStageFinishing = false;
    if (typeof window.resetStageFinishingFlag === "function") window.resetStageFinishingFlag();
    sessionStartTime = Date.now();
    window.currentSessionStartTime = sessionStartTime;

    // 💡 화면부터 최우선으로 복구하여 display none 상태 탈출
    if (gameScreen) {
      gameScreen.classList.remove("hidden", "opacity-0", "pointer-events-none");
      gameScreen.style.display = "flex";
    }
    if (gameContainer) {
      gameContainer.classList.remove("translate-y-full", "opacity-0");
      gameContainer.classList.add("translate-y-0", "opacity-100");
      gameContainer.style.transform = "none";
      gameContainer.style.opacity = "1";
    }


    currentGameLessonId = (typeof lessonId === "object" && lessonId ? (lessonId.lessonId || lessonId.id) : lessonId) || "node-2";
    window.currentGameLessonId = currentGameLessonId;
    if (currentGameLessonId !== "node-skip-test") window.isUnitSkipTestMode = false;



    const currentLang = window.currentActiveCourse || "es";
    if (Array.isArray(session) && session.length > 0) {
      gameQuestions = session.slice();
    } else if (Array.isArray(window.currentSessionQuestions) && window.currentSessionQuestions.length > 0) {
      gameQuestions = window.currentSessionQuestions.slice();
    } else if (window.quizSessionGenerator?.generateStageSession) {
      gameQuestions = window.quizSessionGenerator.generateStageSession(currentGameLessonId, currentLang, 0) || [];
    } else if (typeof window.generateStageSession === "function") {
      gameQuestions = window.generateStageSession(currentGameLessonId, currentLang, 0) || [];
    } else {
      const course = (typeof window.getCurrentCourseData === "function") ? window.getCurrentCourseData() : (window.courseData_es || window.courseData);
      const curUnit = course?.units?.[0];
      if (curUnit && Array.isArray(curUnit.words)) {
        gameQuestions = curUnit.words.slice(0, 10).map((w, idx) => ({ id: w.id || `q-${idx}`, word: w.word || '', term: w.word || '', meaning: w.meaning || '' }));
      } else {
        gameQuestions = [];
      }
    }

    // 💡 약점 복습 진입 시 빈 배열 방어: fallback 데이터(해당 유닛 1·2과 핵심 단어) 자동 보충
    const isReview = (currentGameLessonId === "node-review" || String(currentGameLessonId).includes("review") || window.isRoadmapReviewSpeedrun || window.isReviewGameMode);
    if (isReview && (!Array.isArray(gameQuestions) || gameQuestions.length === 0)) {
      const coords = (typeof window.parseNodeCoordinates === "function") ? window.parseNodeCoordinates(currentGameLessonId) : null;
      const uNum = (coords && coords.unitIndex) ? coords.unitIndex : ((typeof window.currentUnitNumber === "number" ? window.currentUnitNumber : 1) || 1);
      if (typeof window.generateReviewSession === "function") {
        gameQuestions = window.generateReviewSession(uNum, currentLang);
      } else if (window.quizSessionGenerator?.generateReviewSession) {
        gameQuestions = window.quizSessionGenerator.generateReviewSession(uNum, currentLang);
      }
    }

    // 💡 게임 엔진 최종 가드: 단어 데이터가 유효하지 않을 경우 결과 화면으로 직행하지 않고 안전하게 로드맵 복귀
    if (!Array.isArray(gameQuestions) || gameQuestions.length === 0) {
      console.warn("[GameEngine] No valid questions for:", currentGameLessonId, "Returning to roadmap.");
      if (typeof window.showToast === "function") {
        window.showToast("학습할 단어가 없습니다. 로드맵으로 돌아갑니다.", "⚠️");
      }
      (typeof window.exitGameToRoadmap === "function" ? window.exitGameToRoadmap : exitGameToRoadmap)(true);
      return;
    }


    currentQuestionIdx = 0;
    currentHearts = (typeof window.getUserHearts === "function") ? window.getUserHearts() : (window.userHearts || 5);
    combo = 0;
    maxCombo = 0;
    score = 0;
    speedMultiplier = 1.0;
    missedWords = [];
    correctWords = [];
    totalAttemptCount = 0;
    isActive = true;
    isGameActive = true;
    isPaused = false;
    isStageFinishing = false;
    if (typeof window.resetStageFinishingFlag === "function") window.resetStageFinishingFlag();

    window.isActive = true;
    window.isGameActive = true;
    window.isStageFinishing = false;
    window.gameQuestions = gameQuestions;
    window.currentQuestionIdx = 0;
    window.score = 0;
    window.maxCombo = 0;
    window.missedWords = missedWords;
    window.correctWords = correctWords;
    window.totalAttemptCount = totalAttemptCount;
    const clearedCount = (window.nodeProgressMap?.[currentGameLessonId] || (typeof window.getNodeProgress === "function" ? window.getNodeProgress(currentGameLessonId)?.clearedCount : 0) || 0);
    const currentSubStage = Math.max(1, Math.min(3, clearedCount + 1));
    window.currentSubStageRound = currentSubStage;
    const baseSpd = currentSubStage === 3 ? 1.35 : (currentSubStage === 2 ? 1.2 : 1.0);
    window.currentRoundBaseSpeed = baseSpd;
    speedMultiplier = baseSpd;

    // 헤더 타이틀 동기화 규격
    if (gameStageTitle) {
      const isSkipTest = window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test";
      const isBoss = (currentGameLessonId === "node-boss" || String(currentGameLessonId).includes("boss"));
      const isReview = (currentGameLessonId === "node-review" || String(currentGameLessonId).includes("review") || window.isRoadmapReviewSpeedrun);
      const coords = (typeof window.parseNodeCoordinates === "function") ? window.parseNodeCoordinates(currentGameLessonId) : null;
      const uNum = (coords && coords.unitIndex) ? coords.unitIndex : ((typeof window.currentUnitNumber === "number" ? window.currentUnitNumber : 1) || 1);

      if (isSkipTest) {
        const targetUnit = window.currentSkipTestUnit || (uNum + 1);
        gameStageTitle.textContent = `⚡ Unit ${targetUnit} 건너뛰기 시험`;
      } else if (isBoss) {
        gameStageTitle.textContent = `Unit ${uNum} · 🔥 FINAL BOSS`;
      } else if (isReview) {
        gameStageTitle.textContent = `Unit ${uNum} · 🔄 약점 복습`;
      } else {
        const match = String(currentGameLessonId).match(/(?:stage|node)[-_]?(\d+)/i);
        const stageNum = (coords && coords.nodeIndex) ? coords.nodeIndex : (match ? match[1] : "2");
        const curProg = (window.nodeProgressMap?.[currentGameLessonId] || (typeof window.getNodeProgress === "function" ? window.getNodeProgress(currentGameLessonId)?.clearedCount : 0) || 0) + 1;
        const roundStr = Math.min(3, curProg);
        gameStageTitle.textContent = `Unit ${uNum} · Stage ${stageNum} (${roundStr}/3)`;
      }
    }


    if (gameScreen) {
      gameScreen.classList.remove("hidden", "opacity-0", "pointer-events-none");
      gameScreen.style.display = "flex";
    }
    updateHeartsUI();
    updateItemCountUI();
    updateHeaderStatusUI();

    spawnQuestion(0);
  }

  function finishGameStage(isClear = true, customAccuracy = null) {
    clearAllGameTimers(); cancelGameLoop();
    isActive = false; isGameActive = false; window.isActive = false; window.isGameActive = false; isQuestionActive = false;
    window.currentGameLessonId = currentGameLessonId; window.gameQuestions = gameQuestions;
    window.currentQuestionIdx = currentQuestionIdx; window.score = score; window.maxCombo = maxCombo;
    window.missedWords = missedWords; window.correctWords = correctWords; window.totalAttemptCount = totalAttemptCount;
    return window.gameResultModal?.finishGameStage?.(isClear, customAccuracy);
  }

  function triggerGameOver() {
    clearAllGameTimers(); cancelGameLoop();
    isActive = false; isGameActive = false; window.isActive = false; window.isGameActive = false; isQuestionActive = false;
    return window.gameResultModal?.triggerGameOver ? window.gameResultModal.triggerGameOver() : finishGameStage(false);
  }

  function closeGameScreen(force = false) {
    clearAllGameTimers(); cancelGameLoop();
    isActive = false; isGameActive = false; window.isActive = false; window.isGameActive = false;
    if (gameScreen) { gameScreen.classList.add("hidden", "opacity-0", "pointer-events-none"); gameScreen.style.display = "none"; }
  }
  function exitGameToRoadmap(force = false) {
    closeGameScreen(force);
    window.switchMainTab?.("home");

    if (window._shouldOpenAdRechargeOnRoadmap) {
      window._shouldOpenAdRechargeOnRoadmap = false;

      const runDummyAd = () => {
        let sec = 3;
        const ad = document.createElement("div");
        ad.className = "fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center text-white select-none";
        ad.innerHTML = `
          <div class="absolute top-5 right-5 px-3 py-1 bg-black/60 rounded-full text-xs font-bold text-slate-300">
            광고 <span id="ad-sec" class="text-amber-400 font-extrabold text-sm ml-1">${sec}</span>초 후 완료
          </div>
          <div class="text-6xl mb-4 animate-pulse">🎬</div>
          <div class="text-xl font-black mb-1">스폰서 광고 재생 중</div>
          <p class="text-xs text-slate-400 mb-6">시청 완료 시 하트 5개가 즉시 충전됩니다</p>
          <div class="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div id="ad-bar" class="h-full bg-amber-400 transition-all duration-1000 ease-linear" style="width: 0%"></div>
          </div>
        `;
        document.body.appendChild(ad);

        const timer = setInterval(() => {
          sec--;
          const secEl = ad.querySelector("#ad-sec");
          const barEl = ad.querySelector("#ad-bar");
          if (secEl) secEl.textContent = sec;
          if (barEl) barEl.style.width = `${((3 - sec) / 3) * 100}%`;

          if (sec <= 0) {
            clearInterval(timer);
            ad.remove();
            window.setUserHearts?.(5);
          }
        }, 1000);
      };

      if (typeof window.showRewardAd === "function") {
        window.showRewardAd({ onReward: () => window.setUserHearts?.(5) });
      } else {
        setTimeout(runDummyAd, 300);
      }
    }
  }



  function restartStageInMemory() {
    clearAllGameTimers();
    cancelGameLoop();
    if (typeof window.closeResultModal === "function") window.closeResultModal();
    openGameScreen(currentGameLessonId, gameQuestions);
  }

  // 💡 [단일 책임] 광고 보고 하트 채워 이어하기 (부활 전용 함수)
  function reviveGameWithAd() {
    clearAllGameTimers();
    cancelGameLoop();

    // 1. 인게임 코어 생명 수치 = 3으로 강제 설정 및 UI 즉시 동기화
    currentHearts = 3;
    updateHeartsUI();
    if (typeof window.setUserHearts === "function") window.setUserHearts(3);
    if (typeof window.updateHeaderHearts === "function") window.updateHeaderHearts(3);
    window.hearts = 3;

    // 2. 게임오버 및 일시정지 플래그 해제, 게임 활성화
    isActive = true;
    isGameActive = true;
    isPaused = false;
    isFrozen = false;
    isStageFinishing = false;
    if (typeof window.resetStageFinishingFlag === "function") window.resetStageFinishingFlag();

    window.isActive = true;
    window.isGameActive = true;
    window.isPaused = false;
    window.isStageFinishing = false;

    // 3. 기존 잔여 버블 DOM 및 화면 상태 클린업
    if (gameDroppingBubble) {
      gameDroppingBubble.style.transition = "none";
      gameDroppingBubble.style.transform = "translate3d(0, 0px, 0)";
      gameDroppingBubble.classList.remove("hidden");
      gameDroppingBubble.style.display = "flex";
      gameDroppingBubble.style.opacity = "1";
    }
    if (gameFreezeOverlay) gameFreezeOverlay.classList.add("hidden");

    // 4. 현재 진행 중이던 문제 번호로 즉시 단어 버블 재생성 및 낙하 루프 재가동
    const targetQIdx = Math.max(0, Math.min((gameQuestions.length || 1) - 1, currentQuestionIdx));
    spawnQuestion(targetQIdx);

    showGameFloatingEffect("❤️ 부활! 하트 3개 충전!", true);
  }

  // startWrongWordsMiniReview: onComplete: () => closeFlashcardScreen()
  function startWrongWordsMiniReview() {
    if (window.gameResultModal?.startWrongWordsMiniReview) return window.gameResultModal.startWrongWordsMiniReview();
    window.openFlashcardScreen?.({ words: missedWords, onComplete: () => { window.closeFlashcardScreen?.(); } });
  }

  // --- 8. 이벤트 바인딩 및 전역 익스포트 ---
  function bindChoiceDelegation() {
    const c = document.getElementById("game-choices-container");
    if (!c || c._bound) return; c._bound = true;
    c.addEventListener("click", e => {
      const btn = e.target.closest(".game-choice-btn");
      if (btn && !btn.disabled) window.handleChoiceClick(btn, btn.dataset.choice || btn.textContent);
    });
  }
  window.handleChoiceClick = (btn, selectedText) => { window.stopTTS?.(); judgeAnswerDirectly(btn, selectedText); };

  function bindEvents() {
    initDOMElements(); bindChoiceDelegation();
    const closeBtn = document.getElementById("game-close-btn");
    if (closeBtn) closeBtn.onclick = () => exitGameToRoadmap();
    const itemBar = document.getElementById("game-item-bar");
    if (itemBar) itemBar.onclick = e => { const btn = e.target.closest("button[data-item]"); if (btn?.dataset.item) useGameItem(btn.dataset.item); };
  }

  // Public Exports
  Object.assign(window, {
    openGameScreen, closeGameScreen, exitGameToRoadmap,
    restartGame: restartStageInMemory, restartStageInMemory, reviveGameWithAd,
    finishGameStage, triggerGameOver, renderResultModal: isClear => finishGameStage(isClear),
    decreaseHeart, updateHeartsUI, updateItemCountUI,
    handleCorrectAnswer, judgeAnswerDirectly, spawnQuestion, startWrongWordsMiniReview,
    startFallingGame: (lessonId, session) => openGameScreen(lessonId, session),
    launchGame: (type, list, opt) => openGameScreen(opt?.lessonId || "node-2", list),
    getGameEngineState: () => ({ currentGameLessonId, currentHearts, score, combo, maxCombo, missedWords, correctWords, totalAttemptCount, totalQ: gameQuestions.length, currentQuestionIdx })
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindEvents);
  } else {
    bindEvents();
  }
})();
