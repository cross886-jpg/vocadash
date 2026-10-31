// js/flashcard.js - VocaDash Flashcard Module
(function () {
  'use strict';

  const cheerMessages = [
    '첫 단어부터 신나게 질주해볼까요? 🐾', '좋은 페이스예요! 귀에 쏙쏙 들어오네요 🐱', '익숙한 표현들이 점점 늘어나고 있어요 ⚡',
    '벌써 4번째 단어 돌파! 아주 훌륭해요 👏', '절반이나 왔어요! 페이스를 유지해보세요 🏃‍♂️', '실전 여행에서 가장 많이 쓰이는 표현이에요 ✈️',
    '어려운 단어도 척척! 감각이 남다르시네요 🔥', '집중력 최고조! 단어 파트가 곧 끝나요 💫', '단어 완벽 정복! 이제 실전 문장으로 갑니다 🚀',
    '문장 보스 파트 시작! 귀를 기울여보세요 👑', '실전 회화 문장도 거침없이 술술! 💬', '거의 다 왔어요! 마지막 1문장 남았습니다 🔥', '대단해요! 13개 단어 & 실전 문장 완벽 예습 완료 🎉'
  ];

  let currentCardIndex = 0, isCardFlipped = false, isCardTransitioning = false;
  let activeDeck = [], currentLessonDeckTitle = '', currentFlashcardLessonId = 'node-2';
  let activeFlashcardOnComplete = null, activeFlashcardOptions = {};
  let isDragging = false, startX = 0, startY = 0, currentX = 0, currentY = 0, diffX = 0, diffY = 0, lastFlipTimestamp = 0;

  let els = {};
  function getEl(id, altId) { return document.getElementById(id) || (altId ? document.getElementById(altId) : null); }
  function initDOMElements() {
    els = {
      screen: getEl('flashcard-screen'), container: getEl('flashcard-container'), closeBtn: getEl('flashcard-close-btn'), skipBtn: getEl('flashcard-skip-btn'),
      title: getEl('flashcard-lesson-title'), progress: getEl('flashcard-progress-bar'), wrapper: getEl('flashcard-wrapper', 'flashcard-card-wrapper'),
      card: getEl('flashcard', 'flashcard-active-card') || getEl('flashcard-card'), behind: getEl('flashcard-behind', 'flashcard-card-behind'),
      behindTag: getEl('flashcard-behind-tag'), behindWord: getEl('flashcard-behind-word'), behindPhonetic: getEl('flashcard-behind-phonetic'),
      deckLayer2: getEl('flashcard-deck-layer-2'), tag: getEl('flashcard-tag', 'flashcard-front-tag'), front: getEl('flashcard-front'),
      back: getEl('flashcard-back'), speakerBtn: getEl('flashcard-speaker-btn'), word: getEl('flashcard-word', 'flashcard-front-word'),
      phonetic: getEl('flashcard-phonetic', 'flashcard-front-phonetic'), meaning: getEl('flashcard-meaning', 'flashcard-back-meaning'),
      exampleTarget: getEl('flashcard-example-target', 'flashcard-back-detail'), exampleMeaning: getEl('flashcard-example-meaning'),
      hint: getEl('flashcard-hint', 'flashcard-hint-text'), mascotImg: getEl('flashcard-mascot-img'), mascotMsg: getEl('flashcard-mascot-msg'),
      prevBtn: getEl('flashcard-prev-btn'), nextBtn: getEl('flashcard-next-btn'), dots: getEl('flashcard-dots'), stepText: getEl('flashcard-step-text'),
      ctaBtn: getEl('flashcard-cta-btn'), ctaText: getEl('flashcard-cta-text'), ctaIcon: getEl('flashcard-cta-icon')
    };
  }

  function resolveFlashcardArgs(lessonIdOrConfig, session, options) {
    let lessonId = 'node-2', words = null, onComplete = null, configOptions = {};
    if (lessonIdOrConfig && typeof lessonIdOrConfig === 'object' && !Array.isArray(lessonIdOrConfig)) {
      words = lessonIdOrConfig.words || lessonIdOrConfig.session || null;
      lessonId = lessonIdOrConfig.lessonId || lessonIdOrConfig.nodeId || window.currentGameLessonId || 'node-2';
      onComplete = lessonIdOrConfig.onComplete || null;
      configOptions = lessonIdOrConfig;
    } else if (Array.isArray(lessonIdOrConfig)) {
      words = lessonIdOrConfig; lessonId = window.currentGameLessonId || 'node-2';
      if (typeof session === 'function') onComplete = session;
      else if (session && typeof session === 'object') { onComplete = session.onComplete || null; configOptions = session; }
    } else {
      lessonId = lessonIdOrConfig || 'node-2'; words = session;
      if (typeof options === 'function') onComplete = options;
      else if (options && typeof options === 'object') { onComplete = options.onComplete || null; configOptions = options; }
    }
    return { lessonId, words, onComplete, configOptions };
  }

  function openFlashcardScreen(lessonIdOrConfig = 'node-2', session = null, options = null) {
    initDOMElements();
    if (typeof window.stopTTS === 'function') window.stopTTS();

    const parsed = resolveFlashcardArgs(lessonIdOrConfig, session, options);
    activeFlashcardOnComplete = parsed.onComplete;
    activeFlashcardOptions = parsed.configOptions;
    currentFlashcardLessonId = parsed.lessonId;
    window.currentGameLessonId = currentFlashcardLessonId;
    window.currentSelectedNodeId = currentFlashcardLessonId;

    ['closeCourseDropdown', 'closeLanguageModal', 'closeStreakModal', 'closeSettingsModal', 'closeLessonModal'].forEach(fn => {
      if (typeof window[fn] === 'function') window[fn]();
    });

    [document.getElementById('roadmap-screen'), document.getElementById('roadmap-header'), document.getElementById('game-screen'), document.getElementById('bottom-nav') || document.querySelector('nav')].forEach(el => {
      if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
    });

    const currentCourse = window.currentActiveCourse || 'es';
    let deck = parsed.words;
    if ((!deck || deck.length === 0) && typeof window.quizSessionGenerator?.generateStageSession === 'function') {
      const clCount = window.nodeProgressMap?.[currentFlashcardLessonId] || 0;
      deck = window.quizSessionGenerator.generateStageSession(currentFlashcardLessonId, currentCourse, clCount);
    }
    if ((!deck || deck.length === 0) && window.courseData?.units) {
      const uIdx = Math.max(0, (window.currentUnitNumber || 1) - 1);
      deck = window.courseData.units[uIdx]?.words || [];
    }

    activeDeck = (deck || []).map((item) => ({
      ...item, word: item.word || item.term || '', term: item.term || item.word || '', meaning: item.meaning || item.korean || '',
      phonetic: item.phonetic || (item.pronunciation ? `[${item.pronunciation}]` : ''), exampleTarget: item.exampleTarget || item.example || '',
      exampleMeaning: item.exampleMeaning || item.exampleKo || item.example_ko || '', isSentence: Boolean(item.type === 'sentence' || item.isSentence || (item.word && item.word.includes(' ') && item.word.length > 20)),
      tag: item.tag || (item.type === 'sentence' ? '실전 문장' : '핵심 어휘')
    }));
    window.currentSessionQuestions = activeDeck;

    const targetId = currentFlashcardLessonId;
    const coords = (typeof window.parseNodeCoordinates === 'function') ? window.parseNodeCoordinates(targetId) : null;
    let resolvedUnitId = (coords && coords.unitIndex) || window.currentUnitNumber || 1;
    const uMatch = String(targetId).match(/^u(\d+)/i);
    if (uMatch) resolvedUnitId = parseInt(uMatch[1], 10) || resolvedUnitId;

    const isBossNode = targetId === 'node-boss' || String(targetId).includes('boss') || String(targetId).endsWith('_n6') || (coords && (coords.nodeIndex === 'boss' || coords.nodeIndex === 6));
    const isReviewNode = !isBossNode && (targetId === 'node-review' || String(targetId).includes('review') || String(targetId).endsWith('_n4') || (coords && coords.nodeIndex === 'review') || Boolean(activeFlashcardOptions.isReview) || Boolean(window.isWrongWordsMiniReviewActive));

    let stageIndex = (coords && typeof coords.nodeIndex === 'number' && coords.nodeIndex !== 6) ? coords.nodeIndex : (parseInt(String(targetId).match(/(?:stage|node)[-_]?(\d+)/i)?.[1], 10) || 1);

    let clearedCount = 0;
    if (typeof window.getNodeProgress === 'function') {
      const p = window.getNodeProgress(targetId);
      clearedCount = typeof p === 'object' ? (p.clearedCount || 0) : (Number(p) || 0);
    } else if (window.nodeProgressMap && typeof window.nodeProgressMap[targetId] === 'number') {
      clearedCount = window.nodeProgressMap[targetId];
    }
    let currentRound = typeof activeFlashcardOptions.round === 'number' ? activeFlashcardOptions.round : Math.min(3, Math.max(1, (clearedCount || 0) + 1));

    if (isBossNode) currentLessonDeckTitle = `Unit ${resolvedUnitId} · 🔥 FINAL BOSS · 단어 예습`;
    else if (isReviewNode) currentLessonDeckTitle = `Unit ${resolvedUnitId} · 🔄 약점 극복 · 단어 예습`;
    else currentLessonDeckTitle = `Unit ${resolvedUnitId} · Stage ${stageIndex} (${currentRound}/3) · 단어 예습`;

    if (els.title) els.title.textContent = currentLessonDeckTitle;

    currentCardIndex = 0; isCardFlipped = false; isCardTransitioning = false; isDragging = false; diffX = 0; diffY = 0;

    const topEl = els.wrapper || els.card;
    if (topEl) { topEl.style.transition = ''; topEl.style.transform = 'translate(0px, 0px) rotate(0deg)'; topEl.style.opacity = '1'; }
    if (els.front) els.front.classList.remove('hidden'); if (els.back) els.back.classList.add('hidden');
    // scale 제거: translateY 오프셋과 opacity만 사용
    if (els.behind) { els.behind.style.transition = ''; els.behind.style.transform = 'translateY(-8px)'; els.behind.style.opacity = '0.7'; els.behind.style.display = 'flex'; }
    if (els.deckLayer2) { els.deckLayer2.style.transition = ''; els.deckLayer2.style.transform = 'translateY(-16px)'; els.deckLayer2.style.opacity = '0.8'; els.deckLayer2.style.display = 'block'; }
    if (els.mascotImg) els.mascotImg.src = `assets/characters/${(window.currentLanguage || window.currentActiveCourse || currentCourse || 'es') === 'en' ? 'en' : 'es'}-study.webp?v=88`;

    renderCurrentCard();
    bindEvents();

    if (els.screen) { els.screen.classList.remove('hidden', 'opacity-0', 'pointer-events-none'); els.screen.classList.add('opacity-100', 'pointer-events-auto'); els.screen.style.display = 'flex'; }
    if (els.container) { els.container.classList.remove('translate-y-full'); els.container.classList.add('translate-y-0'); }

    if (activeDeck[0] && (!window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false)) {
      setTimeout(() => {
        if (typeof window.speakWord === 'function') {
          window.speakWord(activeDeck[0].word || activeDeck[0].term, currentCourse);
        }
      }, 350);
    }
  }

  function closeFlashcardScreen(restoreRoadmap = true) {
    isCardTransitioning = false;
    if (typeof window.stopTTS === 'function') window.stopTTS();
    if (restoreRoadmap) window.isWrongWordsMiniReviewActive = false;
    if (els.container) { els.container.classList.remove('translate-y-0'); els.container.classList.add('translate-y-full'); }
    if (els.screen) { els.screen.classList.remove('opacity-100', 'pointer-events-auto'); els.screen.classList.add('opacity-0', 'pointer-events-none', 'hidden'); els.screen.style.display = 'none'; }
    if (restoreRoadmap) {
      const rs = document.getElementById('roadmap-screen'), rh = document.getElementById('roadmap-header'), bn = document.getElementById('bottom-nav') || document.querySelector('nav');
      if (rs) { rs.classList.remove('hidden'); rs.style.display = ''; }
      if (rh) { rh.classList.remove('hidden'); rh.style.display = ''; }
      if (bn) bn.classList.remove('hidden');
      if (typeof window.switchMainTab === 'function') window.switchMainTab('home', true);
    }
  }

  function renderCurrentCard() {
    if (!activeDeck || activeDeck.length === 0) return;
    const cardData = activeDeck[currentCardIndex];
    if (!cardData) return;

    isCardFlipped = false;
    if (els.front) els.front.classList.remove('hidden');
    if (els.back) els.back.classList.add('hidden');
    if (els.hint) els.hint.textContent = '👆 탭: 뜻 확인 · ↔ 밀기: 단어 넘기기';

    const isSentence = cardData.type === 'sentence' || cardData.isSentence || currentCardIndex >= 10;
    if (els.tag) els.tag.textContent = cardData.tag || (isSentence ? '실전 문장' : '핵심 어휘');
    if (els.word) {
      const termText = cardData.word || cardData.term || '';
      els.word.textContent = termText;
      const isLong = termText.length > 16;
      els.word.className = `font-headline-xl ${isLong ? 'text-2xl leading-snug' : 'text-3xl leading-none'} font-extrabold text-[#0F172A] tracking-tight mb-2 break-keep text-center select-none`;
    }

    if (els.phonetic) {
      const isPhoneticVisible = !window.vocadashSettings || window.vocadashSettings.showPhonetic !== false;
      els.phonetic.textContent = cardData.phonetic || '';
      els.phonetic.style.display = isPhoneticVisible ? '' : 'none';
      els.phonetic.classList.toggle('hidden', !isPhoneticVisible);
    }
    if (els.meaning) els.meaning.textContent = cardData.meaning || '';
    if (els.exampleTarget) els.exampleTarget.textContent = `"${cardData.exampleTarget || cardData.example || ''}"`;
    if (els.exampleMeaning) els.exampleMeaning.textContent = `"${cardData.exampleMeaning || cardData.exampleKo || cardData.example_ko || ''}"`;

    const total = activeDeck.length, stepNum = currentCardIndex + 1;
    if (els.stepText) els.stepText.textContent = `(${stepNum}/${total})`;
    if (els.progress) els.progress.style.width = `${Math.round((stepNum / total) * 100)}%`;
    if (els.mascotMsg) els.mascotMsg.textContent = cheerMessages[currentCardIndex] || cheerMessages[cheerMessages.length - 1];

    if (els.dots) {
      els.dots.innerHTML = '';
      const dotSize = total > 10 ? 'w-1.5 h-1.5' : 'w-2 h-2', dotGap = total > 10 ? 'gap-1' : 'gap-1.5';
      els.dots.className = `flex items-center justify-center shrink-0 overflow-hidden max-w-full ${dotGap}`;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = `${dotSize} rounded-full ${i <= currentCardIndex ? 'bg-[#22C55E]' : 'bg-slate-200'} shrink-0 transition-all`;
        els.dots.appendChild(dot);
      }
    }

    if (els.prevBtn) {
      els.prevBtn.disabled = currentCardIndex === 0;
      els.prevBtn.classList.toggle('opacity-40', currentCardIndex === 0);
      els.prevBtn.classList.toggle('cursor-not-allowed', currentCardIndex === 0);
    }
    const isLastCard = currentCardIndex >= total - 1;
    const isGameFollowup = Boolean(activeFlashcardOnComplete && (activeFlashcardOptions.mode === 'stage' || activeFlashcardOptions.action === 'game' || String(activeFlashcardOnComplete).includes('openGameScreen') || String(activeFlashcardOptions.onComplete).includes('openGameScreen')));

    if (els.nextBtn) els.nextBtn.innerHTML = isLastCard ? (isGameFollowup ? '<span>게임 시작</span><span class="material-symbols-outlined text-[16px] ml-0.5">sports_esports</span>' : '<span>완료</span><span class="material-symbols-outlined text-[16px] ml-0.5">check_circle</span>') : '<span>다음</span><span class="material-symbols-outlined text-[16px]">chevron_right</span>';

    if (els.ctaBtn) els.ctaBtn.className = isLastCard ? (isGameFollowup ? 'w-full h-14 bg-[#10B981] hover:bg-[#059669] active:translate-y-0.5 text-white font-extrabold text-base tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_0_#047857,0_10px_16px_-4px_rgba(16,185,129,0.4)] transition-all cursor-pointer' : 'w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 active:translate-y-0.5 text-white font-extrabold text-base tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_0_#b45309,0_10px_16px_-4px_rgba(245,158,11,0.4)] transition-all cursor-pointer') : 'w-full h-14 bg-[#22C55E] hover:bg-[#16a34a] active:translate-y-0.5 text-white font-extrabold text-base tracking-wide rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_6px_0_0_#15803d,0_10px_16px_-4px_rgba(34,197,94,0.4)] transition-all cursor-pointer';

    if (els.ctaText) els.ctaText.textContent = isLastCard ? (isGameFollowup ? '⚡ 단어 예습 완료! 게임 시작' : '학습 완료') : `다음 단어 보기 (${stepNum}/${total})`;
    if (els.ctaIcon) els.ctaIcon.textContent = isLastCard ? (isGameFollowup ? 'sports_esports' : 'check_circle') : 'chevron_right';

    const nextCardData = activeDeck[currentCardIndex + 1];
    if (nextCardData) {
      if (els.behindTag) els.behindTag.textContent = nextCardData.tag || '핵심 어휘';
      if (els.behindWord) els.behindWord.textContent = nextCardData.word || nextCardData.term || '';
      if (els.behindPhonetic) els.behindPhonetic.textContent = nextCardData.phonetic || '';
      if (els.behind) { els.behind.style.display = 'flex'; els.behind.style.opacity = '0.7'; els.behind.style.transform = 'translateY(-8px)'; }
      if (els.deckLayer2) { els.deckLayer2.style.display = 'block'; els.deckLayer2.style.opacity = '0.8'; els.deckLayer2.style.transform = 'translateY(-16px)'; }
    } else {
      if (els.behindTag) els.behindTag.textContent = '단어 예습';
      if (els.behindWord) els.behindWord.textContent = '🎉 완료!';
      if (els.behindPhonetic) els.behindPhonetic.textContent = isGameFollowup ? '[퀴즈로 이동]' : '[학습 완료]';
      if (els.behind) { els.behind.style.display = 'flex'; els.behind.style.opacity = '0.5'; els.behind.style.transform = 'translateY(-8px)'; }
      if (els.deckLayer2) els.deckLayer2.style.opacity = '0';
    }
  }

  function finishFlashcards(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (typeof window.stopTTS === 'function') window.stopTTS();
    if (typeof window.closeResultModal === 'function') window.closeResultModal();
    closeFlashcardScreen(false);
    if (Array.isArray(activeDeck) && activeDeck.length > 0) {
      if (typeof window.addMasteredWords === 'function') window.addMasteredWords(activeDeck);
      if (typeof window.updateProfileStats === 'function') window.updateProfileStats();
    }
    const callback = activeFlashcardOnComplete;
    activeFlashcardOnComplete = null;
    if (typeof callback === 'function') {
      callback(currentFlashcardLessonId, activeDeck);
      return;
    }
    closeFlashcardScreen(true);
  }

  const launchGameDirectly = finishFlashcards;

  function toggleCardFlip() {
    isCardFlipped = !isCardFlipped;
    if (isCardFlipped) {
      els.front?.classList.add('hidden');
      els.back?.classList.remove('hidden');
      if (els.hint) els.hint.textContent = '👆 다시 탭: 단어 보기 · ↔ 밀기: 단어 넘기기';
    } else {
      els.back?.classList.add('hidden');
      els.front?.classList.remove('hidden');
      if (els.hint) els.hint.textContent = '👆 탭: 뜻 확인 · ↔ 밀기: 단어 넘기기';
    }
    if (typeof window.playSound === 'function') window.playSound('card_flip');
  }

  function transitionToNextCard() {
    if (isCardTransitioning) return;
    const total = activeDeck.length;
    if (currentCardIndex >= total - 1) { finishFlashcards(); return; }
    isCardTransitioning = true;
    const topEl = els.wrapper || els.card;

    // 현재 카드 슬라이드 아웃 (수평 이동 + 페이드아웃만 적용)
    if (topEl) {
      topEl.style.transition = 'transform 220ms ease-out, opacity 220ms ease-out';
      topEl.style.transform = 'translateX(-110%)';
      topEl.style.opacity = '0';
    }
    // 뒷장 카드가 자연스럽게 올라옴 (scale 1.0 강제 확대 제거!)
    if (els.behind) {
      els.behind.style.transition = 'transform 220ms ease-out, opacity 220ms ease-out';
      els.behind.style.transform = 'translateY(0px)';
      els.behind.style.opacity = '1';
    }
    if (els.deckLayer2) {
      els.deckLayer2.style.transition = 'transform 220ms ease-out, opacity 220ms ease-out';
      els.deckLayer2.style.transform = 'translateY(-8px)';
      els.deckLayer2.style.opacity = '0.7';
    }

    setTimeout(() => {
      currentCardIndex++;
      renderCurrentCard();
      const currentCourse = window.currentActiveCourse || 'es', nextCard = activeDeck[currentCardIndex];
      if (nextCard && (!window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false) && typeof window.speakWord === 'function') {
        window.speakWord(nextCard.word || nextCard.term, currentCourse);
      }
      // 상태 복원 시에도 scale 제거
      if (topEl) { topEl.style.transition = 'none'; topEl.style.transform = 'translate(0px, 0px)'; topEl.style.opacity = '1'; }
      if (els.behind) { els.behind.style.transition = 'none'; els.behind.style.transform = 'translateY(-8px)'; els.behind.style.opacity = (currentCardIndex < total - 1) ? '0.7' : '0.5'; }
      if (els.deckLayer2) { els.deckLayer2.style.transition = 'none'; els.deckLayer2.style.transform = 'translateY(-16px)'; els.deckLayer2.style.opacity = (currentCardIndex < total - 2) ? '0.8' : '0'; }
      setTimeout(() => { isCardTransitioning = false; }, 20);
    }, 220);
  }

  function transitionToPrevCard() {
    if (isCardTransitioning) return;
    if (currentCardIndex <= 0) { resetCardPosition(); return; }
    isCardTransitioning = true;
    const topEl = els.wrapper || els.card;
    currentCardIndex--;
    renderCurrentCard();
    const currentCourse = window.currentActiveCourse || 'es', prevCard = activeDeck[currentCardIndex];
    if (prevCard && (!window.vocadashSettings || window.vocadashSettings.autoPlayAudio !== false) && typeof window.speakWord === 'function') {
      window.speakWord(prevCard.word || prevCard.term, currentCourse);
    }
    if (topEl) {
      topEl.style.transition = 'none';
      topEl.style.transform = 'translateX(-110%)';
      topEl.style.opacity = '0';
      void topEl.offsetWidth;
      requestAnimationFrame(() => {
        topEl.style.transition = 'transform 220ms ease-out, opacity 220ms ease-out';
        topEl.style.transform = 'translate(0px, 0px)';
        topEl.style.opacity = '1';
        setTimeout(() => {
          topEl.style.transition = '';
          topEl.style.transform = '';
          topEl.style.opacity = '';
          renderCurrentCard();
          isCardTransitioning = false;
        }, 220);
      });
    } else { isCardTransitioning = false; }
  }

  function handleNextCard() { transitionToNextCard(); }
  function handlePrevCard() { transitionToPrevCard(); }

  function startDrag(clientX, clientY, target) {
    if (isCardTransitioning || (target && target.closest('#flashcard-speaker-btn'))) return;
    isDragging = true; startX = clientX; startY = clientY; currentX = clientX; currentY = clientY; diffX = 0; diffY = 0;
    const targetEl = els.wrapper || els.card;
    if (targetEl) { targetEl.style.transition = 'none'; targetEl.classList.add('cursor-grabbing'); targetEl.classList.remove('cursor-grab'); }
  }

  function moveDrag(clientX, clientY, e) {
    if (!isDragging || isCardTransitioning) return;
    currentX = clientX; currentY = clientY; diffX = currentX - startX; diffY = currentY - startY;
    if (e && e.cancelable) e.preventDefault();
    const targetEl = els.wrapper || els.card;

    // 마지막 카드일 때 왼쪽으로 넘어가려 하면 저항(고무줄 탄성) 적용
    const isLastCard = currentCardIndex >= activeDeck.length - 1;
    let effectiveX = diffX;
    if (isLastCard && diffX < 0) {
      effectiveX = diffX * 0.25; // 왼쪽으로 잘 끌려가지 않도록 저항
    }

    if (targetEl) { targetEl.style.transition = 'none'; targetEl.style.transform = `translate(${effectiveX}px, ${diffY * 0.3}px)`; }
  }

  function safeToggleCardFlip() {
    const now = Date.now();
    if (now - lastFlipTimestamp < 220) return;
    lastFlipTimestamp = now;
    toggleCardFlip();
  }

  function endDrag() {
    if (!isDragging || isCardTransitioning) return;
    isDragging = false;
    const targetEl = els.wrapper || els.card;
    if (targetEl) { targetEl.classList.remove('cursor-grabbing'); targetEl.classList.add('cursor-grab'); }

    const isLastCard = currentCardIndex >= activeDeck.length - 1;

    // 마지막 카드는 왼쪽으로 밀어도 넘어가지 않고 제자리로 복귀
    if (diffX <= -50) {
      if (isLastCard) {
        resetCardPosition();
      } else {
        transitionToNextCard();
      }
      return;
    }

    if (diffX >= 50) { if (currentCardIndex > 0) transitionToPrevCard(); else resetCardPosition(); return; }
    resetCardPosition();
    if (Math.hypot(diffX, diffY) < 30) safeToggleCardFlip();
  }

  // 바운스 튀는 bezier(1.275)를 제거하고 정직한 ease-out으로 고정
  function resetCardPosition() {
    const targetEl = els.wrapper || els.card;
    if (!targetEl) return;
    targetEl.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease';
    targetEl.style.transform = 'translate(0px, 0px)';
    targetEl.style.opacity = '1';
    setTimeout(() => { if (!isDragging && !isCardTransitioning && targetEl) { targetEl.style.transition = ''; targetEl.style.transform = ''; } }, 200);
  }

  function bindEvents() {
    initDOMElements();
    const gestureTarget = els.wrapper || els.card;
    if (gestureTarget && !gestureTarget._gesturesBound) {
      gestureTarget._gesturesBound = true;
      gestureTarget.addEventListener('touchstart', (e) => { if (e.touches.length <= 1) startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target); }, { passive: true });
      gestureTarget.addEventListener('touchmove', (e) => { if (isDragging) moveDrag(e.touches[0].clientX, e.touches[0].clientY, e); }, { passive: false });
      gestureTarget.addEventListener('touchend', () => { if (isDragging) endDrag(); }, { passive: true });
      gestureTarget.addEventListener('touchcancel', () => { if (isDragging) endDrag(); }, { passive: true });
      gestureTarget.addEventListener('mousedown', (e) => { if (e.button === 0 && (!e.target || !e.target.closest('#flashcard-speaker-btn'))) startDrag(e.clientX, e.clientY, e.target); });
      window.addEventListener('mousemove', (e) => { if (isDragging) moveDrag(e.clientX, e.clientY, e); });
      window.addEventListener('mouseup', () => { if (isDragging) endDrag(); });
      gestureTarget.addEventListener('mouseleave', (e) => { if (isDragging && e.buttons === 0) endDrag(); });
      gestureTarget.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); safeToggleCardFlip(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); handleNextCard(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevCard(); }
      });
    }

    if (els.card) els.card.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); if (!e?.target?.closest('#flashcard-speaker-btn')) safeToggleCardFlip(); };
    if (els.speakerBtn) {
      els.speakerBtn.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        }
        els.speakerBtn.classList.add('scale-110');
        setTimeout(() => els.speakerBtn?.classList.remove('scale-110'), 180);
        const cardData = activeDeck[currentCardIndex];
        const course = window.currentActiveCourse || 'es';
        if (cardData && typeof window.speakWord === 'function') {
          window.speakWord(cardData.word || cardData.term, course, els.speakerBtn);
        }
      };
    }

    if (els.hint) els.hint.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); safeToggleCardFlip(); };
    if (els.closeBtn) els.closeBtn.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); closeFlashcardScreen(true); };
    if (els.skipBtn) els.skipBtn.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); finishFlashcards(e); };
    if (els.nextBtn) els.nextBtn.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); handleNextCard(); };
    if (els.prevBtn) els.prevBtn.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); handlePrevCard(); };
    if (els.ctaBtn) els.ctaBtn.onclick = (e) => { e?.preventDefault(); e?.stopPropagation(); handleNextCard(); };
  }

  Object.defineProperty(window, 'currentCardIndex', {
    get() { return currentCardIndex; }, set(v) { currentCardIndex = v; }, configurable: true
  });

  Object.assign(window, {
    openFlashcardScreen, openFlashcard: openFlashcardScreen, startFlashcard: openFlashcardScreen,
    showFlashcardScreen: openFlashcardScreen, closeFlashcardScreen, finishFlashcards,
    launchGameDirectly, initFlashcardDeck: openFlashcardScreen, loadFlashcards: openFlashcardScreen,
    toggleCardFlip, handleNextCard, handlePrevCard, renderCurrentCard
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindEvents);
  else bindEvents();
})();
