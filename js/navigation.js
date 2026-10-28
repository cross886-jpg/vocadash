// ==============================================================================
// VocaDash Navigation & Main Screen Switcher (js/navigation.js)
// [Karpathy 원칙] 순수 화면 토글 & 하단 5개 탭 내비게이션 전담 (~300줄 슬림화)
// 스트릭/명예의전당은 profileManager.js, 인게임 파이프라인은 lessonModal.js와 연계
// ==============================================================================

(function () {
  "use strict";

  const el = (id) => document.getElementById(id);
  let isNavSwitchingTab = false;

  function toggleModal(backdrop, card, open, anim = "fade") {
    if (!backdrop && !card) return;
    const isSlide = anim === "slide";
    if (open) {
      if (backdrop) {
        backdrop.classList.remove("hidden", "opacity-0", "pointer-events-none");
        backdrop.classList.add("opacity-100", "pointer-events-auto");
      }
      if (card) {
        card.classList.remove("hidden", "opacity-0", "pointer-events-none", isSlide ? "translate-y-full" : "scale-95");
        card.classList.add("opacity-100", "pointer-events-auto", isSlide ? "translate-y-0" : "scale-100");
      }
    } else {
      if (backdrop) {
        backdrop.classList.remove("opacity-100", "pointer-events-auto");
        backdrop.classList.add("opacity-0", "pointer-events-none");
      }
      if (card) {
        card.classList.remove("opacity-100", "pointer-events-auto", isSlide ? "translate-y-0" : "scale-100");
        card.classList.add("opacity-0", "pointer-events-none", isSlide ? "translate-y-full" : "scale-95");
      }
      setTimeout(() => {
        if (backdrop && backdrop.classList.contains("opacity-0")) backdrop.classList.add("hidden");
        if (card && card.classList.contains("opacity-0")) card.classList.add("hidden");
      }, 200);
    }
  }

  function setTabActive(activeTabEl) {
    if (!activeTabEl) return;
    const allTabBtns = document.querySelectorAll(
      "#tab-home, #tab-packs, #tab-book, #tab-review, #tab-records, .nav-tab-btn, [data-tab-name]"
    );
    allTabBtns.forEach((tab) => {
      tab.classList.remove("active", "text-emerald-700", "font-black");
      tab.classList.add("text-slate-400", "font-medium");
      const icon = tab.querySelector(".nav-icon, span.material-symbols-outlined, span:first-child");
      if (icon) {
        icon.classList.remove("text-emerald-700", "scale-110", "font-black");
        icon.classList.add("text-slate-400");
        icon.style.color = "";
      }
      const label = tab.querySelector(".nav-label, span.text-xs, span:last-child");
      if (label) {
        label.classList.remove("text-emerald-700", "font-black");
        label.classList.add("text-slate-400", "font-medium");
        label.style.color = "";
      }
    });

    activeTabEl.classList.remove("text-slate-400", "font-medium");
    activeTabEl.classList.add("active", "text-emerald-700", "font-black");
    const activeIcon = activeTabEl.querySelector(".nav-icon, span.material-symbols-outlined, span:first-child");
    if (activeIcon) {
      activeIcon.classList.remove("text-slate-400");
      activeIcon.classList.add("text-emerald-700", "scale-110", "font-black");
      activeIcon.style.color = "#047857";
    }
    const activeLabel = activeTabEl.querySelector(".nav-label, span.text-xs, span:last-child");
    if (activeLabel) {
      activeLabel.classList.remove("text-slate-400", "font-medium");
      activeLabel.classList.add("text-emerald-700", "font-black");
      activeLabel.style.color = "#047857";
    }
  }

  function switchMainTab(tabName, force = false) {
    let normTab = String(tabName || "home").toLowerCase().trim();
    if (normTab === "stats" || normTab === "my-records" || normTab === "record") normTab = "records";
    else if (normTab === "study" || normTab === "wordbook") normTab = "book";
    else if (normTab === "roadmap") normTab = "home";
    else if (normTab === "pack") normTab = "packs";

    if ((window.isGameActive === true || window.isActive === true) && !force && !window.isExplicitExitRequested) {
      return;
    }

    if (isNavSwitchingTab) return;
    isNavSwitchingTab = true;

    try {
      if (!window.isGameActive || force || window.isExplicitExitRequested) {
        window.isActive = false;
        window.isGameActive = false;
        window.clearAllGameTimers?.();
        window.stopTTS?.();
        window.closeGameScreen?.();
      }
      window.closeFlashcardScreen?.();

      const screens = {
        home: { screen: el("roadmap-screen"), tab: el("tab-home") },
        packs: { screen: el("packs-screen"), tab: document.querySelector("#tab-packs, .nav-packs") },
        review: { screen: el("review-screen"), tab: el("tab-review") },
        book: { screen: el("book-screen"), tab: document.querySelector("#tab-book, #tab-study, .nav-book, .nav-study") },
        records: { screen: el("stats-screen") || el("my-records-screen"), tab: document.querySelector("#tab-records, #tab-stats, .nav-stats, .nav-records") }
      };

      const extraScreens = [el("settings-screen"), el("hall-of-fame-screen"), el("login-screen")];
      Object.values(screens).forEach((item) => {
        if (item.screen) { item.screen.classList.add("hidden"); item.screen.style.display = "none"; }
      });
      extraScreens.forEach((sc) => { if (sc) { sc.classList.add("hidden"); sc.style.display = "none"; } });

      const gScreen = el("game-screen");
      if (gScreen) {
        gScreen.classList.remove("opacity-100", "pointer-events-auto");
        gScreen.classList.add("opacity-0", "pointer-events-none", "hidden");
        gScreen.style.display = "none";
      }
      const fScreen = el("flashcard-screen");
      if (fScreen) {
        fScreen.classList.remove("opacity-100", "pointer-events-auto");
        fScreen.classList.add("opacity-0", "pointer-events-none", "hidden");
        fScreen.style.display = "none";
      }

      const header = el("roadmap-header");
      if (header) {
        if (normTab === "home") { header.classList.remove("hidden"); header.style.removeProperty("display"); header.style.display = ""; }
        else { header.classList.add("hidden"); header.style.display = "none"; }
      }

      const targetConfig = screens[normTab] || screens.home;
      if (targetConfig.screen) {
        targetConfig.screen.classList.remove("hidden");
        targetConfig.screen.style.removeProperty("display");
        targetConfig.screen.style.display = "";
      }
      if (targetConfig.tab) setTabActive(targetConfig.tab);

      const bottomNav = el("bottom-nav") || document.querySelector("nav");
      if (bottomNav) {
        bottomNav.classList.remove("hidden");
        bottomNav.style.removeProperty("display");
        bottomNav.style.display = "";
        bottomNav.style.setProperty("bottom", "calc(1.2rem + env(safe-area-inset-bottom, 0px))", "important");
      }

      if (normTab === "records") {
        window.updateProfileStats?.();
      } else if (normTab === "packs") {
        window.renderPacksScreenUI?.();
      } else if (normTab === "review") {
        window.renderReviewWords?.("waiting");
      } else if (normTab === "book") {
        const curLang = window.currentLanguage || "es";
        const curCourse = window.activeCourseId || window.currentCourseId || "main";
        window.renderBookCourseDropdown?.(curLang, curCourse);
        window.renderBookWords?.(curLang, curCourse);
      } else if (normTab === "home") {
        window.renderRoadmap?.();
        if (typeof window.focusActiveRoadmapNode === "function") {
          window.focusActiveRoadmapNode();
        } else if (typeof window.autoScrollToActiveNode === "function") {
          window.autoScrollToActiveNode("instant");
        }
      }

      // ⚡ [UX 개선] 로드맵(home) 화면 진입 시에는 top: 0 리셋을 배제하여 긴 롤링 애니메이션을 방지하고, 타 탭 진입 시에만 상단 리셋 수행
      if (normTab !== "home") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    } finally {
      isNavSwitchingTab = false;
    }
  }

  function startStageLearningPipeline(nodeId, customSession = null) {
    const targetNodeId = nodeId || window.currentSelectedNodeId || window.currentGameLessonId || "node-2";
    window.currentSelectedNodeId = targetNodeId;
    window.currentGameLessonId = targetNodeId;
    window.closeLessonModal?.();

    const currentCourse = window.currentActiveCourse || window.currentLanguage || "es";
    const round = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;
    let session = customSession;

    if (!session || !Array.isArray(session) || session.length === 0) {
      if (window.quizSessionGenerator?.generateDeckForStage) {
        session = window.quizSessionGenerator.generateDeckForStage(targetNodeId, currentCourse, round);
      } else if (typeof window.generateStageSession === "function") {
        session = window.generateStageSession(targetNodeId, currentCourse, round);
      }
    }
    window.currentSessionQuestions = session || [];

    const roadmapScreen = el("roadmap-screen"); if (roadmapScreen) { roadmapScreen.classList.add("hidden"); roadmapScreen.style.display = "none"; }
    const roadmapHeader = el("roadmap-header"); if (roadmapHeader) { roadmapHeader.classList.add("hidden"); roadmapHeader.style.display = "none"; }
    const bottomNav = el("bottom-nav") || document.querySelector("nav"); if (bottomNav) { bottomNav.classList.add("hidden"); bottomNav.style.display = "none"; }

    const nodeData = { nodeId: targetNodeId, lessonId: targetNodeId, session, words: session };

    if (typeof window.openFlashcardScreen === "function") {
      window.openFlashcardScreen({
        words: session,
        lessonId: targetNodeId,
        nodeData: nodeData,
        onComplete: () => {
          if (typeof window.openGameScreen === "function") {
            window.openGameScreen(nodeData);
          }
        }
      });
    } else if (typeof window.openGameScreen === "function") {
      window.openGameScreen(nodeData);
    }
  }

  function openSettingsScreen() {
    const s = el("settings-screen");
    if (s) { s.classList.remove("hidden"); s.style.display = "block"; }
  }

  function closeSettingsScreen() {
    const s = el("settings-screen");
    if (s) { s.classList.add("hidden"); s.style.display = "none"; }
  }

  function initNavigationEvents() {
    const bNav = el("bottom-nav") || document.querySelector("nav");
    if (bNav) bNav.style.setProperty("bottom", "calc(1.2rem + env(safe-area-inset-bottom, 0px))", "important");

    const on = (id, fn) => {
      const node = el(id);
      if (node && !node._navBound) {
        node.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); fn(e); });
        node._navBound = true;
      }
    };

    on("tab-home", () => switchMainTab("home"));
    on("tab-packs", () => switchMainTab("packs"));
    on("tab-book", () => switchMainTab("book"));
    on("tab-records", () => switchMainTab("records"));
    on("tab-review", () => {
      switchMainTab("book");
      setTimeout(() => {
        const wrongChip = document.getElementById("book-filter-wrong-chip") || document.querySelector('.book-filter-chip[data-filter="wrong"]');
        if (wrongChip) wrongChip.click();
        else window.applyBookFilter?.("wrong");
      }, 50);
    });

    document.querySelectorAll("#btn-profile").forEach(btn => {
      if (!btn._navBound) {
        btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); switchMainTab("records"); });
        btn._navBound = true;
      }
    });

    const gemsBadge = el("header-gems-badge");
    if (gemsBadge && !gemsBadge._navBound) {
      gemsBadge.addEventListener("click", (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!window.isGameActive && !window.isActive) window.openShopModal?.();
      });
      gemsBadge._navBound = true;
    }

    ["btn-open-settings", "btn-main-settings"].forEach(id => on(id, openSettingsScreen));
    ["btn-settings-close", "btn-settings-back"].forEach(id => on(id, closeSettingsScreen));
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initNavigationEvents);
    else initNavigationEvents();
  }

  Object.assign(window, {
    switchMainTab,
    switchScreen: switchMainTab,
    toggleModal,
    setTabActive,
    startStageLearningPipeline,
    openSettingsScreen,
    closeSettingsScreen,
    initNavigationEvents
  });
})();
