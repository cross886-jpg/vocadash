// ==============================================================================
// VocaDash Game Engine Module (js/gameEngine.js)
// 단어 낙하 루프, 4지선다 판정, 콤보/하트 및 4종 아이템 (순수 인게임 상태 머신)
// ==============================================================================

(function () {
  "use strict";

  // --- 1. 인게임 코어 상태 변수 ---
  let currentGameLessonId = "node-2", gameQuestions = [], currentQuestionIdx = 0, currentHearts = 5;
  let currentGameMode = "standard"; // 'standard' | 'review'
  let isInfiniteHeart = false;
  let combo = 0, maxCombo = 0, score = 0, speedMultiplier = 1.0;
  let isActive = false, isGameActive = false, isPaused = false, isFrozen = false;
  let isQuestionActive = false, isStageFinishing = false, isCurrentQuestionFailed = false, isInputReady = false;
  let dropRafId = null, dropStartTime = 0, freezeTimer = null, gameNextQuestionTimer = null;
  let currentCorrectChoiceIdx = -1, missedWords = [], correctWords = [], totalAttemptCount = 0, sessionStartTime = 0;
  let currentDropLane = "50%";
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
    if (isInfiniteHeart) {
      gameHeartsContainer.innerHTML = '<span class="text-xs sm:text-sm select-none font-black text-rose-500 flex items-center gap-1">💖 ∞</span>';
      return;
    }
    if (!gameHeartsContainer.querySelector(".game-heart")) {
      gameHeartsContainer.innerHTML = `
        <span class="game-heart material-symbols-outlined text-[14px] text-error transition-all" style="font-variation-settings: 'FILL' 1;">favorite</span>
        <span class="game-heart material-symbols-outlined text-[14px] text-error transition-all" style="font-variation-settings: 'FILL' 1;">favorite</span>
        <span class="game-heart material-symbols-outlined text-[14px] text-error transition-all" style="font-variation-settings: 'FILL' 1;">favorite</span>
        <span class="game-heart material-symbols-outlined text-[14px] text-error transition-all" style="font-variation-settings: 'FILL' 1;">favorite</span>
        <span class="game-heart material-symbols-outlined text-[14px] text-error transition-all" style="font-variation-settings: 'FILL' 1;">favorite</span>
      `;
    }
    gameHeartsContainer.querySelectorAll(".game-heart").forEach((icon, idx) => {
      const active = idx < currentHearts;
      icon.className = active ? "game-heart material-symbols-outlined text-[14px] text-error transition-all" : "game-heart material-symbols-outlined text-[14px] text-slate-300 transition-all opacity-40";
      icon.textContent = "favorite";
    });
    if (!window.isJumpTestSession && !window.isUnitSkipTestMode) {
      window.userHearts = currentHearts;
    }
  }

  function updateJumpTestHeartUI(hearts) {
    if (!gameHeartsContainer) return;
    const icons = gameHeartsContainer.querySelectorAll(".game-heart");
    icons.forEach((icon, idx) => {
      const active = idx < hearts;
      icon.className = active ? "game-heart material-symbols-outlined text-[14px] text-error transition-all" : "game-heart material-symbols-outlined text-[14px] text-slate-300 transition-all opacity-40";
      icon.textContent = "favorite";
    });
  }
  window.updateJumpTestHeartUI = updateJumpTestHeartUI;

  function decreaseHeart() {
    if (isInfiniteHeart) return Infinity;
    if (currentHearts <= 0) return 0;

    // 💡 [Karpathy Guidelines] 건너뛰기 시험 진행 중일 경우 실제 계정 하트는 절대 차감하지 않음
    if (window.isJumpTestSession || window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test") {
      currentHearts = Math.max(0, currentHearts - 1);
      window.jumpTestHearts = currentHearts;
      updateHeartsUI();
      if (typeof window.updateJumpTestHeartUI === "function") {
        window.updateJumpTestHeartUI(currentHearts);
      }
      return currentHearts;
    }

    currentHearts = Math.max(0, currentHearts - 1);
    updateHeartsUI();
    if (typeof window.setUserHearts === "function") window.setUserHearts(currentHearts);
    return currentHearts;
  }

  function updateItemCountUI() {
    const itemBar = document.getElementById("game-item-bar") || document.querySelector(".quiz-items-container");
    const isJumpTest = Boolean(window.isJumpTestSession || window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test");

    if (itemBar) {
      if (isJumpTest) {
        itemBar.classList.add("hidden");
        itemBar.style.display = "none";
        itemBar.style.pointerEvents = "none";
        return;
      } else {
        itemBar.classList.remove("hidden");
        itemBar.style.removeProperty("display");
        itemBar.style.display = "";
        itemBar.style.pointerEvents = "auto";
      }
    }

    const inv = (typeof window.getVocaInventory === "function")
      ? window.getVocaInventory()
      : (window.gameItemCounts || getInventory());
    window.gameItemCounts = inv;

    ["pass", "freeze", "bomb", "heal"].forEach(t => {
      const count = inv[t] ?? 0;
      const countEl = document.getElementById(`game-item-${t}-count`);
      const btnEl = document.getElementById(`game-item-${t}`);

      // 숫자 배지 갱신
      if (countEl) countEl.textContent = count;

      // 0개이거나 빙결 지속 중일 때 버튼 흐리게 + 클릭 차단
      if (btnEl) {
        const isDepleted = count <= 0;
        const shouldDisable = isDepleted || (t === "freeze" && typeof isFrozen !== "undefined" && isFrozen);

        btnEl.disabled = shouldDisable;
        btnEl.classList.toggle("opacity-40", shouldDisable);
        btnEl.classList.toggle("pointer-events-none", shouldDisable);
      }
    });
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
    try { window.speechSynthesis?.cancel(); } catch (_) { }

    if (!isActive || !isGameActive) return;
    if (!Array.isArray(gameQuestions) || gameQuestions.length === 0) {
      if (typeof window.showToast === "function") window.showToast("학습할 단어가 없습니다. 로드맵으로 돌아갑니다.", "⚠️");
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
    isInputReady = false;
    if (gameFreezeOverlay) gameFreezeOverlay.classList.add("hidden");
    updateHeaderStatusUI();

    const q = gameQuestions[currentQuestionIdx];
    if (!q) { finishGameStage(true); return; }

    if (!gameDroppingBubble || gameChoiceBtns.length === 0) initDOMElements();

    const qTerm = String(q.word || q.term || "").trim() || "VocaDash";

    if (gameDroppingWord) {
      gameDroppingWord.style.display = "inline-block";
      gameDroppingWord.style.opacity = "1";
      gameDroppingWord.style.whiteSpace = "nowrap"; // 💡 짧은 구문 강제 줄바꿈 방지
      gameDroppingWord.style.wordBreak = "keep-all";

      if (q.isCloze || qTerm.includes("[  ?  ]")) {
        gameDroppingWord.innerHTML = qTerm.replace(/\[\s*\?\s*\]/g, '<span class="cloze-blank-pill">[ ? ]</span>');
      } else {
        gameDroppingWord.textContent = qTerm;
      }
    }

    // 4지선다 보기 세팅 (해당 챕터 Unit 단어 풀 엄격 격리 및 빈칸 방어)
    const currentLang = window.currentActiveCourse || "es";
    let choices = [];
    if (typeof window.generateQuestionChoices === "function") {
      choices = window.generateQuestionChoices(q, gameQuestions, currentGameLessonId, currentLang);
    } else if (window.quizSessionGenerator?.generateQuestionChoices) {
      choices = window.quizSessionGenerator.generateQuestionChoices(q, gameQuestions, currentGameLessonId, currentLang);
    } else if (typeof window.generateOptionsForUnit === "function") {
      choices = window.generateOptionsForUnit(q, gameQuestions);
    } else {
      choices = [q.meaning || q.answer || q.word || "정답"];
    }

    // 정답 텍스트 보장 (빈 문자열 완전 방어)
    const rawCorrect = String(q.isCloze ? (q.answer || q.meaning) : (q.meaning || q.answer || "")).trim();
    const correctAns = rawCorrect || String(q.word || q.term || "정답").trim();

    // 4개 보기 배열 보장 및 빈 문자열 완전 방어
    while (choices.length < 4) {
      choices.push(`선택지 ${choices.length + 1}`);
    }

    currentCorrectChoiceIdx = choices.findIndex(c => {
      const s = typeof c === 'string' ? c.trim() : (c?.meaning || c?.word || '').trim();
      return s === correctAns;
    });
    if (currentCorrectChoiceIdx === -1) {
      choices[0] = correctAns;
      currentCorrectChoiceIdx = 0;
    }

    // 버튼 텍스트 할당 시 빈 문자열 완전 방어
    gameChoiceBtns.forEach((btn, idx) => {
      if (!btn) return;
      const opt = choices[idx];

      let displayText = '';
      if (typeof opt === 'string') displayText = opt.trim();
      else if (opt && typeof opt === 'object') displayText = (opt.meaning || opt.korean || opt.word || '').trim();

      // 만약 뜻이 비어있다면 임시 대체 텍스트를 부여하여 절대 공백 버튼이 되지 않도록 보장
      if (!displayText) {
        displayText = (idx === currentCorrectChoiceIdx) ? correctAns : `선택지 ${idx + 1}`;
      }

      btn.textContent = displayText;
      btn.dataset.choice = displayText;
      btn.dataset.index = idx;
      btn.disabled = false;
      btn.style.color = '#0f172a'; // slate-900 강제 적용 (가림 방지)
      btn.style.opacity = '1';
      btn.style.display = 'flex';
      btn.className = "game-choice-btn h-[44px] rounded-xl bg-white text-on-surface border border-slate-200 font-bold text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer";
    });

    // 🎲 [핵심 최적화] 타일 낙하 X축 위치 랜덤화 (좌 28%, 중 50%, 우 72% 안전 레인)
    const lanes = ["28%", "50%", "72%"];
    currentDropLane = lanes[Math.floor(Math.random() * lanes.length)];

    if (gameDroppingBubble) {
      gameDroppingBubble.style.transition = "none";
      gameDroppingBubble.style.position = "absolute";
      gameDroppingBubble.style.left = currentDropLane;
      gameDroppingBubble.style.transform = "translate3d(-50%, 0px, 0)";
      gameDroppingBubble.classList.remove("hidden");
      gameDroppingBubble.style.display = "flex";
      gameDroppingBubble.style.opacity = "1";
    }

    if (typeof window.speakWord === "function") {
      window.speakWord(q.word || q.term, currentLang);
    }

    dropStartTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    dropRafId = requestAnimationFrame(dropLoop);

    // 💡 [Karpathy Guidelines] 단어 생성 및 타이머 시작 직후 입력을 허용하도록 순서 보장 (조기 오답/미스 방어)
    setTimeout(() => {
      if (isActive && isGameActive && isQuestionActive) {
        isInputReady = true;
      }
    }, 300);
  }

  function dropLoop(timestamp) {
    if (!isQuestionActive || isPaused || !isActive || !isGameActive) return;
    if (isFrozen) { dropRafId = requestAnimationFrame(dropLoop); return; }

    if (!dropStartTime || timestamp < dropStartTime) {
      dropStartTime = timestamp;
      dropRafId = requestAnimationFrame(dropLoop);
      return;
    }

    const elapsed = timestamp - dropStartTime;
    // 💡 [Karpathy Guidelines] 단어 생성 초기(300ms) 동안은 데드라인 판정 차단
    if (elapsed < 300) {
      dropRafId = requestAnimationFrame(dropLoop);
      return;
    }

    const duration = dropBaseDuration / speedMultiplier;
    const progress = Math.min(1.0, elapsed / duration);
    const arenaH = (gameArena ? gameArena.clientHeight : 320) || 320;
    const maxDrop = Math.max(80, arenaH - 90);
    const curY = progress * maxDrop;

    if (gameDroppingBubble) {
      gameDroppingBubble.style.transform = `translate3d(-50%, ${curY}px, 0)`;
    }

    if (progress >= 1.0) {
      if (isInputReady) {
        handleDeadlineBreached();
      }
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
    if (isStageFinishing || !isQuestionActive || !isInputReady) return;
    isQuestionActive = false; cancelGameLoop(); window.stopTTS?.();
    totalAttemptCount++;
    combo = 0; speedMultiplier = 1.0;
    const q = gameQuestions[currentQuestionIdx];
    if (q) {
      if (!isCurrentQuestionFailed) {
        isCurrentQuestionFailed = true;
        missedWords.push(q);
        window.missedWords = missedWords;
        try {
          if (typeof window.recordAnswerResult === 'function') {
            window.recordAnswerResult(q, false);
          } else if (typeof window.addWrongWord === 'function') {
            window.addWrongWord(q);
          }
        } catch (_) { }
      }
    }
    window.totalAttemptCount = totalAttemptCount;
    if (isInfiniteHeart) {
      showGameFloatingEffect("다시 기억해봐요! 💡", false);
      window.playSound?.("wrong");
      gameNextQuestionTimer = setTimeout(nextQuestion, 900);
      return;
    }
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

    const bubble = gameDroppingBubble || document.getElementById("game-dropping-bubble") || document.getElementById("dropping-word");
    if (bubble) {
      bubble.classList.add("hidden");
      bubble.style.display = "none";
    }

    const currentQ = gameQuestions?.[currentQuestionIdx] || window.gameQuestions?.[currentQuestionIdx];
    if (currentQ) {
      if (!isCurrentQuestionFailed) {
        correctWords.push(currentQ);
        window.correctWords = correctWords;
        try { window.recordAnswerResult?.(currentQ, true); } catch (_) { }
        try { window.addMasteredWord?.(currentQ); } catch (_) { }
      }
    }
    totalAttemptCount++;
    window.totalAttemptCount = totalAttemptCount;

    if (btn) btn.classList.add("!bg-emerald-500", "!text-white", "!border-emerald-600", "ring-4", "ring-emerald-300");

    combo++;
    if (combo > maxCombo) maxCombo = combo;
    const isMasterRound = (window.currentSubStageRound === 3);
    score += isMasterRound ? (150 + (combo * 40)) : (100 + (combo * 20));
    window.score = score;
    window.maxCombo = maxCombo;
    speedMultiplier = Math.min(2.4, 1.0 + (combo * 0.05));
    updateHeaderStatusUI();

    showGameFloatingEffect(combo >= 3 ? `🔥 ${combo} 콤보!` : "정답!", true);
    window.playSound?.("correct");

    if (gameNextQuestionTimer) clearTimeout(gameNextQuestionTimer);
    gameNextQuestionTimer = setTimeout(nextQuestion, 70);
  }

  function handleWrongAnswer(btn, selectedText) {
    if (isStageFinishing || !isQuestionActive || !isInputReady) return;
    const isFirstFail = !isCurrentQuestionFailed;
    isCurrentQuestionFailed = true; combo = 0; speedMultiplier = 1.0; updateHeaderStatusUI();
    totalAttemptCount++;
    const currentQ = gameQuestions[currentQuestionIdx];
    if (currentQ && isFirstFail) {
      missedWords.push(currentQ);
      window.missedWords = missedWords;
      try {
        if (typeof window.recordAnswerResult === 'function') {
          window.recordAnswerResult(currentQ, false);
        } else if (typeof window.addWrongWord === 'function') {
          window.addWrongWord(currentQ);
        }
      } catch (_) { }
    }
    window.totalAttemptCount = totalAttemptCount;
    if (btn) { btn.classList.add("!bg-red-500", "!text-white", "!border-red-600"); setTimeout(() => btn?.classList.remove("!bg-red-500", "!text-white", "!border-red-600"), 500); }
    if (isInfiniteHeart) {
      showGameFloatingEffect("오답! 다시 도전 💬", false);
      window.playSound?.("wrong");
      return;
    }
    const remaining = decreaseHeart();
    showGameFloatingEffect("오답! -1 ❤️", false);
    window.playSound?.("wrong");
    if (remaining <= 0) { isQuestionActive = false; cancelGameLoop(); triggerGameOver(); }
  }

  function judgeAnswerDirectly(btn, selectedText) {
    if (!isInputReady || !isQuestionActive || !isActive || !isGameActive || isStageFinishing) return;
    const q = gameQuestions[currentQuestionIdx];
    if (!q) { finishGameStage(true); return; }

    const targetAns = String(q.isCloze ? (q.answer || q.meaning) : (q.meaning || q.answer || "")).trim();
    if (checkAnswerMatch(selectedText, targetAns)) {
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
    if (window.isJumpTestSession || window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test") {
      return; // 시험 중 아이템 동작 차단
    }
    if (!isGameActive && !window.isGameActive) return;
    const inv = (typeof window.getVocaInventory === "function")
      ? window.getVocaInventory()
      : (window.gameItemCounts || getInventory());

    if ((inv[itemType] ?? 0) <= 0) {
      window.showToast?.("⚠️ 아이템을 모두 사용했습니다!", "⚠️");
      return;
    }

    // 공통 수량 차감 및 동기화
    inv[itemType]--;
    saveInventory(inv);
    window.gameItemCounts = inv;

    if (itemType === "pass") {
      updateItemCountUI();
      showGameFloatingEffect("⚡ 번개 패스!", true);
      handleCorrectAnswer(null, "패스");

    } else if (itemType === "freeze") {
      if (typeof freezeTimer !== "undefined" && freezeTimer) clearTimeout(freezeTimer);
      isFrozen = true;
      if (gameFreezeOverlay) gameFreezeOverlay.classList.remove("hidden");
      updateItemCountUI();
      showGameFloatingEffect("❄️ 5초 빙결!", true);

      freezeTimer = setTimeout(() => {
        isFrozen = false;
        freezeTimer = null;
        if (gameFreezeOverlay) gameFreezeOverlay.classList.add("hidden");
        updateItemCountUI();
      }, 5000);

    } else if (itemType === "bomb") {
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
        inv.heal++;
        saveInventory(inv);
        window.gameItemCounts = inv;
        window.showToast?.("이미 체력이 가득 차 있습니다!", "💖");
        showGameFloatingEffect("이미 체력이 가득 차 있습니다!", false);
        return;
      }
      currentHearts = Math.min(5, currentHearts + 1);
      updateHeartsUI();
      updateItemCountUI();
      showGameFloatingEffect("💖 하트 +1 회복!", true);
    }
  }
  window.useGameItem = useGameItem;

  // 🎲 Fisher-Yates 셔플 유틸 (원본 불변성 보장 얕은 복사본 생성)
  function shuffleArray(arr) {
    if (!Array.isArray(arr) || arr.length <= 1) return Array.isArray(arr) ? [...arr] : [];
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  window.shuffleArray = window.shuffleArray || shuffleArray;

  // --- 7. 화면 라이프사이클 & 모달 위임 ---
  function openGameScreen(lessonId = "node-2", session = null, options = {}) {
    if (typeof window.closeResultModal === "function") window.closeResultModal();
    const resultModal = document.getElementById("game-result-modal");
    if (resultModal) {
      resultModal.classList.add("hidden", "opacity-0", "pointer-events-none");
      resultModal.classList.remove("opacity-100", "pointer-events-auto");
      resultModal.style.display = "none";
      resultModal.style.pointerEvents = "none";
    }

    initDOMElements();
    clearAllGameTimers();
    cancelGameLoop();
    if (window.stopTTS) window.stopTTS();
    try { window.speechSynthesis?.cancel(); } catch (_) { }

    // 💡 [Karpathy Guidelines] 세션 시작 시 오답/콤보/미스 플래그 및 플로팅 텍스트 완전 리셋
    isInputReady = false;
    isQuestionActive = false;
    isCurrentQuestionFailed = false;
    dropStartTime = 0;
    combo = 0; maxCombo = 0; score = 0; totalAttemptCount = 0; speedMultiplier = 1.0;
    missedWords = []; correctWords = [];
    if (gameFloatingEffect) {
      gameFloatingEffect.classList.add("hidden");
      gameFloatingEffect.classList.remove("animate-float-pop");
    }
    if (gameFloatingText) gameFloatingText.textContent = "";
    if (gameDroppingBubble) {
      gameDroppingBubble.style.transform = "translate3d(-50%, 0px, 0)";
      gameDroppingBubble.classList.add("hidden");
    }

    isStageFinishing = false;
    window.isStageFinishing = false;
    if (typeof window.resetStageFinishingFlag === "function") window.resetStageFinishingFlag();
    sessionStartTime = Date.now();
    window.currentSessionStartTime = sessionStartTime;

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
    if (currentGameLessonId !== "node-skip-test" && !window.isJumpTestSession) window.isUnitSkipTestMode = false;

    const explicitMode = options?.mode || (typeof lessonId === "object" && lessonId?.mode);
    const isReview = explicitMode === "review" ||
      (currentGameLessonId === "node-review" || String(currentGameLessonId).includes("review") || window.isRoadmapReviewSpeedrun || window.isReviewGameMode);
    currentGameMode = isReview ? "review" : "standard";
    window.currentGameMode = currentGameMode;
    if (isReview) {
      window.isReviewGameMode = true;
    }

    if (options?.isInfiniteHeart !== undefined) {
      isInfiniteHeart = Boolean(options.isInfiniteHeart);
    } else if (options?.isRoadmap || window.isRoadmapReviewSpeedrun || currentGameLessonId === "node-review" || String(currentGameLessonId).includes("review")) {
      isInfiniteHeart = false;
    } else if (options?.source === "vocaBook") {
      isInfiniteHeart = true;
    } else {
      isInfiniteHeart = false;
    }
    window.isInfiniteHeart = isInfiniteHeart;

    const currentLang = window.currentActiveCourse || "es";
    const incomingSession = (Array.isArray(session) && session.length > 0)
      ? session
      : (lessonId && typeof lessonId === "object" && Array.isArray(lessonId.session) && lessonId.session.length > 0)
        ? lessonId.session
        : (lessonId && typeof lessonId === "object" && Array.isArray(lessonId.words) && lessonId.words.length > 0)
          ? lessonId.words
          : null;

    let sourceQuestions = [];
    if (currentGameLessonId === "node-skip-test" || window.isUnitSkipTestMode) {
      if (incomingSession && incomingSession.length > 0) {
        sourceQuestions = incomingSession;
      } else if (Array.isArray(window.currentSessionQuestions) && window.currentSessionQuestions.length > 0) {
        sourceQuestions = window.currentSessionQuestions;
      } else {
        const targetU = window.currentSkipTestUnit || 2;
        sourceQuestions = (typeof window.generateJumpTestSession === "function")
          ? window.generateJumpTestSession(targetU, 10, currentLang)
          : (window.quizSessionGenerator?.generateJumpTestSession?.(targetU, 10, currentLang) || []);
      }
    } else if (incomingSession && incomingSession.length > 0) {
      sourceQuestions = incomingSession;
    } else if (Array.isArray(window.currentSessionQuestions) && window.currentSessionQuestions.length > 0) {
      sourceQuestions = window.currentSessionQuestions;
    } else if (window.quizSessionGenerator?.generateStageSession) {
      sourceQuestions = window.quizSessionGenerator.generateStageSession(currentGameLessonId, currentLang, 0) || [];
    } else if (typeof window.generateStageSession === "function") {
      sourceQuestions = window.generateStageSession(currentGameLessonId, currentLang, 0) || [];
    } else {
      const uNum = (window.currentUnitNumber || 1);
      const currentUnitId = 'unit-' + uNum;
      const vocaSource = (typeof window !== 'undefined' ? window.VOCA_DATA : null);
      const vocaWords = (vocaSource && typeof vocaSource.getWordsByUnit === 'function')
        ? vocaSource.getWordsByUnit(currentUnitId)
        : (vocaSource?.byUnit?.[currentUnitId] || []);
      if (Array.isArray(vocaWords) && vocaWords.length > 0) {
        sourceQuestions = vocaWords.slice(0, 10).map((w, idx) => ({ id: w.id || `q-${idx}`, word: w.word || w.term || '', term: w.word || w.term || '', meaning: w.meaning || '' }));
      } else {
        const course = (typeof window.getCurrentCourseData === "function") ? window.getCurrentCourseData() : (window.courseData_es || window.courseData);
        const curUnit = course?.units?.[0];
        sourceQuestions = (curUnit && Array.isArray(curUnit.words))
          ? curUnit.words.slice(0, 10).map((w, idx) => ({ id: w.id || `q-${idx}`, word: w.word || '', term: w.word || '', meaning: w.meaning || '' }))
          : [];
      }
    }

    if (isReview && (!Array.isArray(sourceQuestions) || sourceQuestions.length === 0)) {
      const coords = (typeof window.parseNodeCoordinates === "function") ? window.parseNodeCoordinates(currentGameLessonId) : null;
      const uNum = coords?.unitIndex || window.currentUnitNumber || 1;
      sourceQuestions = (typeof window.generateReviewSession === "function")
        ? window.generateReviewSession(uNum, currentLang)
        : (window.quizSessionGenerator?.generateReviewSession?.(uNum, currentLang) || []);
    }

    // 퀴즈 문제 큐 생성 시 얕은 복사본을 만들어 Fisher-Yates 셔플 적용 (원본 순서 불변성 유지)
    gameQuestions = shuffleArray(sourceQuestions);

    if (!Array.isArray(gameQuestions) || gameQuestions.length === 0) {
      if (typeof window.showToast === "function") window.showToast("학습할 단어가 없습니다. 로드맵으로 돌아갑니다.", "⚠️");
      (typeof window.exitGameToRoadmap === "function" ? window.exitGameToRoadmap : exitGameToRoadmap)(true);
      return;
    }

    currentQuestionIdx = 0;
    const isSkipTestSession = Boolean(window.isJumpTestSession || window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test");
    if (isSkipTestSession) {
      window.isJumpTestSession = true;
      window.isUnitSkipTestMode = true;
      window.jumpTestHearts = 3;
      currentHearts = 3;
    } else {
      const globalHearts = (typeof window.getUserHearts === "function") ? window.getUserHearts() : (window.userHearts || 5);
      currentHearts = isInfiniteHeart ? 999 : globalHearts;
    }
    combo = 0; maxCombo = 0; score = 0; speedMultiplier = 1.0;
    missedWords = []; correctWords = []; totalAttemptCount = 0;
    isActive = true; isGameActive = true; isPaused = false; isStageFinishing = false;
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
    speedMultiplier = currentSubStage === 3 ? 1.35 : (currentSubStage === 2 ? 1.2 : 1.0);
    window.currentRoundBaseSpeed = speedMultiplier;

    if (gameStageTitle) {
      const isSkipTest = window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test";
      const isBoss = (currentGameLessonId === "node-boss" || String(currentGameLessonId).includes("boss"));
      const isReviewMode = (currentGameMode === "review" || currentGameLessonId === "node-review" || String(currentGameLessonId).includes("review") || window.isRoadmapReviewSpeedrun);
      const coords = (typeof window.parseNodeCoordinates === "function") ? window.parseNodeCoordinates(currentGameLessonId) : null;
      const uNum = coords?.unitIndex || window.currentUnitNumber || 1;

      if (isSkipTest) {
        gameStageTitle.textContent = `⚡ Unit ${window.currentSkipTestUnit || (uNum + 1)} 건너뛰기 시험`;
      } else if (isBoss) {
        gameStageTitle.textContent = `Unit ${uNum} · 🔥 FINAL BOSS`;
      } else if (isReviewMode) {
        gameStageTitle.textContent = `Unit ${uNum} · 🔄 약점 복습`;
      } else {
        const match = String(currentGameLessonId).match(/(?:stage|node)[-_]?(\d+)/i);
        const stageNum = coords?.nodeIndex || (match ? match[1] : "2");
        const curProg = (window.nodeProgressMap?.[currentGameLessonId] || (typeof window.getNodeProgress === "function" ? window.getNodeProgress(currentGameLessonId)?.clearedCount : 0) || 0) + 1;
        gameStageTitle.textContent = `Unit ${uNum} · Stage ${stageNum} (${Math.min(3, curProg)}/3)`;
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
    const mode = currentGameMode;
    window.currentGameMode = currentGameMode;
    return window.gameResultModal?.finishGameStage?.(isClear, customAccuracy, { mode });
  }

  function triggerGameOver() {
    if (isInfiniteHeart) return;
    clearAllGameTimers(); cancelGameLoop();
    isActive = false; isGameActive = false; window.isActive = false; window.isGameActive = false; isQuestionActive = false;
    return window.gameResultModal?.triggerGameOver ? window.gameResultModal.triggerGameOver() : finishGameStage(false);
  }

  function closeGameScreen(force = false) {
    clearAllGameTimers(); cancelGameLoop();
    isActive = false; isGameActive = false; window.isActive = false; window.isGameActive = false;
    currentGameMode = "standard";
    window.currentGameMode = "standard";
    isInfiniteHeart = false;
    window.isInfiniteHeart = false;
    if (gameScreen) { gameScreen.classList.add("hidden", "opacity-0", "pointer-events-none"); gameScreen.style.display = "none"; }
  }

  function exitGameToRoadmap(force = false) {
    if (window.isJumpTestSession || window.isUnitSkipTestMode) {
      window.isJumpTestSession = false;
      window.isUnitSkipTestMode = false;
      window.updateHeartsUI?.();
    }

    closeGameScreen(force);
    currentGameMode = "standard";
    window.currentGameMode = "standard";
    isInfiniteHeart = false;
    window.isInfiniteHeart = false;
    window.isReviewGameMode = false;
    window.isRoadmapReviewSpeedrun = false;
    window.switchMainTab?.("home");

    if (window._shouldOpenAdRechargeOnRoadmap) {
      window._shouldOpenAdRechargeOnRoadmap = false;
      if (typeof window.showRewardAd === "function") {
        window.showRewardAd({ onReward: () => window.setUserHearts?.(5) });
      }
    }
  }

  function restartStageInMemory() {
    clearAllGameTimers(); cancelGameLoop();
    if (typeof window.closeResultModal === "function") window.closeResultModal();
    openGameScreen(currentGameLessonId, gameQuestions, { mode: currentGameMode, isInfiniteHeart });
  }

  function reviveGameWithAd() {
    clearAllGameTimers(); cancelGameLoop();
    currentHearts = 3;
    updateHeartsUI();
    window.setUserHearts?.(3);
    window.updateHeaderHearts?.(3);
    window.hearts = 3;

    isActive = true; isGameActive = true; isPaused = false; isFrozen = false; isStageFinishing = false;
    if (typeof window.resetStageFinishingFlag === "function") window.resetStageFinishingFlag();
    window.isActive = true; window.isGameActive = true; window.isPaused = false; window.isStageFinishing = false;

    if (gameFreezeOverlay) gameFreezeOverlay.classList.add("hidden");
    const targetQIdx = Math.max(0, Math.min((gameQuestions.length || 1) - 1, currentQuestionIdx));
    spawnQuestion(targetQIdx);
    showGameFloatingEffect("❤️ 부활! 하트 3개 충전!", true);
  }

  function startWrongWordsMiniReview() {
    if (window.gameResultModal?.startWrongWordsMiniReview) return window.gameResultModal.startWrongWordsMiniReview();
    window.openFlashcardScreen?.({ words: missedWords, onComplete: () => { window.closeFlashcardScreen?.(); } });
  }

  // --- 8. 이벤트 바인딩 및 전역 익스포트 ---
  function bindChoiceDelegation() {
    const c = document.getElementById("game-choices-container");
    if (!c || c._bound) return;
    c._bound = true;
    c.addEventListener("click", e => {
      const btn = e.target.closest(".game-choice-btn");
      if (btn && !btn.disabled) window.handleChoiceClick(btn, btn.dataset.choice || btn.textContent);
    });
  }
  window.handleChoiceClick = (btn, selectedText) => { window.stopTTS?.(); judgeAnswerDirectly(btn, selectedText); };

  function bindEvents() {
    initDOMElements();
    bindChoiceDelegation();

    const exitModal = document.getElementById("game-exit-confirm-modal");
    const btnResume = document.getElementById("btnResume");
    const btnExit = document.getElementById("btnExit");
    const closeBtn = document.getElementById("game-close-btn");

    const toggleExitModal = (show) => {
      if (!exitModal) return;
      if (show) {
        exitModal.classList.remove("hidden");
        exitModal.style.display = "flex";
      } else {
        exitModal.classList.add("hidden");
        exitModal.style.display = "none";
      }
    };

    // 1. 상단 X 버튼 탭 시: 게임/음성 일시정지 & 스티치 모달 노출
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (!isActive || !isGameActive) {
          exitGameToRoadmap();
          return;
        }
        isPaused = true;
        window.stopTTS?.();
        toggleExitModal(true);
      };
    }

    // 2. [계속하기] 탭 시: 모달 닫기 & 단어 낙하 루프 자연스럽게 재개
    if (btnResume) {
      btnResume.onclick = () => {
        toggleExitModal(false);
        isPaused = false;
        dropStartTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        dropRafId = requestAnimationFrame(dropLoop);
      };
    }

    // 3. [나가기] 탭 시: 모달 닫고 로드맵으로 복귀
    if (btnExit) {
      btnExit.onclick = () => {
        toggleExitModal(false);
        exitGameToRoadmap();
      };
    }

    const itemBar = document.getElementById("game-item-bar");
    if (itemBar) {
      itemBar.onclick = e => {
        if (window.isJumpTestSession || window.isUnitSkipTestMode || currentGameLessonId === "node-skip-test") return;
        const btn = e.target.closest("button[data-item]");
        if (btn?.dataset.item) useGameItem(btn.dataset.item);
      };
    }
  }

  // Public Exports
  Object.assign(window, {
    openGameScreen, closeGameScreen, exitGameToRoadmap,
    restartGame: restartStageInMemory, restartStageInMemory, reviveGameWithAd,
    finishGameStage, triggerGameOver, renderResultModal: isClear => finishGameStage(isClear),
    decreaseHeart, updateHeartsUI, updateItemCountUI,
    handleCorrectAnswer, handleWrongAnswer, handleDeadlineBreached,
    judgeAnswerDirectly, spawnQuestion, startWrongWordsMiniReview,
    startFallingGame: (lessonId, session) => openGameScreen(lessonId, session),
    launchGame: (type, list, opt) => openGameScreen(opt?.lessonId || "node-2", list),
    getGameEngineState: () => ({ currentGameLessonId, currentHearts, isInfiniteHeart, score, combo, maxCombo, missedWords, correctWords, totalAttemptCount, totalQ: gameQuestions.length, currentQuestionIdx })
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindEvents);
  } else {
    bindEvents();
  }
})();
