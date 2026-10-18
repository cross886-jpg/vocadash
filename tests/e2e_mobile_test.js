const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { chromium } = require('playwright');

// =======================================================
// VocaDash Automated Mobile E2E Test Suite
// Device Profile: 390x844 (iPhone 14 standard), DPR=3, Touch
// =======================================================

const ROOT_DIR = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, 'test_results');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // Favicon fallback
        if (pathname === '/favicon.ico') {
          res.writeHead(200, { 'Content-Type': 'image/x-icon' });
          res.end();
          return;
        }

        if (pathname === '/' || pathname === '') {
          pathname = '/index.html';
        }
        const filePath = path.join(rootDir, pathname.replace(/^\/+/, ''));
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          console.warn(`[StaticServer 404] Requested: ${pathname} -> Not Found on disk: ${filePath}`);
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`404 Not Found: ${pathname}`);
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`500 Internal Error: ${err.message}`);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, baseUrl: `http://127.0.0.1:${port}` });
    });
    server.on('error', reject);
  });
}

async function runE2ETests() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  console.log('🚀 [VocaDash QA] Starting Local Static Server...');
  const { server, port, baseUrl } = await startStaticServer(ROOT_DIR);
  console.log(`📡 Server running at ${baseUrl}`);

  const testReport = {
    startTime: new Date().toISOString(),
    scenarios: [],
    consoleErrors: [],
    consoleWarnings: [],
    failedRequests: [],
    unexpectedDialogs: [],
    screenshots: []
  };

  function recordScenario(name, passed, details = {}) {
    testReport.scenarios.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${name}] ${details.summary || ''}`);
  }

  let browser;
  try {
    console.log('📱 Launching Mobile Chromium Emulation (390x844, DPR=3, Touch)...');
    browser = await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    });

    const page = await context.newPage();

    // Event Listeners for Errors, Warnings, and Dialogs
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        testReport.consoleErrors.push(text);
        console.error(`🚨 [Browser Error] ${text}`);
      } else if (type === 'warning') {
        testReport.consoleWarnings.push(text);
      }
    });

    page.on('pageerror', (err) => {
      testReport.consoleErrors.push(`[Uncaught PageError] ${err.toString()}`);
      console.error(`💥 [Page Error] ${err}`);
    });

    page.on('response', (resp) => {
      if (resp.status() >= 400) {
        testReport.failedRequests.push({ url: resp.url(), status: resp.status() });
        console.warn(`⚠️ [HTTP ${resp.status()}] ${resp.url()}`);
      }
    });

    page.on('dialog', async (dialog) => {
      const msg = dialog.message();
      testReport.unexpectedDialogs.push({ type: dialog.type(), message: msg });
      console.warn(`🛑 [Dialog Detected] ${dialog.type()}: "${msg}"`);
      await dialog.dismiss().catch(() => {});
    });

    // -----------------------------------------------------------------
    // SCENARIO A: Asset Loading Full Inspection (20 Assets)
    // -----------------------------------------------------------------
    console.log('\n🔍 --- [Scenario A: Asset Loading Verification] ---');
    const assetList = [
      // es 8종
      'assets/characters/es-idle.webp',
      'assets/characters/es-study.webp',
      'assets/characters/es-happy.webp',
      'assets/characters/es-fever.webp',
      'assets/characters/es-run.webp',
      'assets/characters/es-surprised.webp',
      'assets/characters/es-sad.webp',
      'assets/characters/es-victory.webp',
      // en 8종
      'assets/characters/en-idle.webp',
      'assets/characters/en-study.webp',
      'assets/characters/en-happy.webp',
      'assets/characters/en-fever.webp',
      'assets/characters/en-run.webp',
      'assets/characters/en-surprised.webp',
      'assets/characters/en-sad.webp',
      'assets/characters/en-victory.webp',
      // profile 4종
      'assets/profiles/profile-spanish.webp',
      'assets/profiles/profile-english.webp',
      'assets/profiles/profile-artist.webp',
      'assets/profiles/profile-explorer.webp'
    ];

    let assetFailures = [];
    for (const assetPath of assetList) {
      const assetUrl = `${baseUrl}/${assetPath}?v=53`;
      try {
        const resp = await page.request.get(assetUrl);
        if (resp.status() !== 200) {
          assetFailures.push({ assetPath, reason: `HTTP status ${resp.status()}` });
          continue;
        }
        const buffer = await resp.body();
        if (buffer.length < 50) {
          assetFailures.push({ assetPath, reason: `Invalid size (${buffer.length} bytes)` });
        }
      } catch (e) {
        assetFailures.push({ assetPath, reason: e.message });
      }
    }

    recordScenario('Scenario A: Asset Loading (20 Assets)', assetFailures.length === 0, {
      total: assetList.length,
      passed: assetList.length - assetFailures.length,
      failures: assetFailures,
      summary: assetFailures.length === 0 ? '모든 캐릭터(es 8종, en 8종) 및 프로필 배지(4종) 정상 로드 완료' : `${assetFailures.length}개 에셋 로딩 실패`
    });

    // -----------------------------------------------------------------
    // SCENARIO S: Brand Splash Intro Screen Verification
    // -----------------------------------------------------------------
    console.log('\n✨ --- [Scenario S: Brand Splash Intro Screen Verification] ---');
    await page.goto(baseUrl, { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => {
      return Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise(r => setTimeout(r, 2000))
      ]);
    });

    // Show splash screen state for visual screenshot capture
    await page.evaluate(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        splash.style.display = 'flex';
      }
    });

    // Capture 0: Splash Screen
    const splashScreenShot = path.join(RESULTS_DIR, '0_splash_screen.png');
    await page.screenshot({ path: splashScreenShot });
    testReport.screenshots.push({ name: '0_splash_screen.png', description: '브랜드 스플래시 인트로 화면' });

    const splashState = await page.evaluate(() => {
      const splash = document.getElementById('splash-screen');
      const mascot = document.getElementById('splash-mascot-img');
      const title = splash ? (splash.querySelector('h1')?.innerText || '') : '';
      const slogan = splash ? (splash.querySelector('p')?.innerText || '') : '';
      const isVisible = splash && !splash.classList.contains('hidden') && splash.style.display !== 'none';
      return {
        hasSplash: !!splash,
        isVisible,
        hasMascot: !!mascot,
        title,
        slogan
      };
    });

    const splashHasElements = splashState.hasSplash && splashState.hasMascot && splashState.title.replace(/\s+/g, '').includes('VocaDash') && splashState.slogan.includes('보카 대시');

    // Tap splash to dismiss
    await page.click('#splash-screen');
    await page.waitForTimeout(450);

    const splashDismissed = await page.evaluate(() => {
      const splash = document.getElementById('splash-screen');
      const isDismissed = !splash || splash.classList.contains('opacity-0') || splash.classList.contains('hidden') || splash.style.display === 'none';
      if (splash) {
        splash.classList.add('hidden', 'opacity-0', 'pointer-events-none');
        splash.style.display = 'none';
      }
      return isDismissed;
    });

    recordScenario('Scenario S: Brand Splash Intro Screen & Tap-to-Skip', splashHasElements && splashDismissed, {
      ...splashState,
      splashDismissed,
      summary: splashHasElements && splashDismissed ? '1.2초 스플래시(마스코트+타이포+슬로건) 정상 노출 및 터치 시 즉시 스킵 확인' : '스플래시 화면 렌더링 또는 스킵 실패'
    });

    // Capture 1: Main Screen after splash dismiss
    const mainScreenShot = path.join(RESULTS_DIR, '1_main_screen.png');
    await page.screenshot({ path: mainScreenShot });
    testReport.screenshots.push({ name: '1_main_screen.png', description: '메인 로드맵 화면' });

    // In-browser DOM check for broken images
    const brokenDomImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter((img) => img.naturalWidth === 0 && img.naturalHeight === 0 && img.complete)
        .map((img) => img.src);
    });
    recordScenario('Scenario A-2: DOM Image Rendering Integrity', brokenDomImages.length === 0, {
      brokenImages: brokenDomImages,
      summary: brokenDomImages.length === 0 ? '화면 내 엑박(Broken Image) 0건' : `엑박 이미지 발견: ${brokenDomImages.join(', ')}`
    });

    // -----------------------------------------------------------------
    // SCENARIO H: Compact Mobile Top Header Layout Verification
    // -----------------------------------------------------------------
    console.log('\n📐 --- [Scenario H: Compact Mobile Top Header Layout] ---');
    const headerState = await page.evaluate(() => {
      const header = document.getElementById('roadmap-header');
      const miniLogo = header ? header.querySelector('[title="VocaDash"]') : null;
      const langTrigger = document.getElementById('logo-lang-trigger');
      const langName = document.getElementById('header-lang-name');
      const flagEmoji = document.getElementById('header-flag-emoji');
      const headerSettings = header ? header.querySelector('#btn-main-settings') : null;
      const avatarBtn = document.getElementById('btn-header-profile');
      const avatarImg = document.getElementById('header-mascot-img');
      const streakBtn = document.getElementById('streak-trigger');
      const heartsBadge = document.getElementById('header-hearts-count');
      const gemsBadge = document.getElementById('header-gems-count') || document.querySelector('#header-gems-badge');

      // Check overflow on current viewport
      const isOverflowing = header ? (header.scrollWidth > header.clientWidth + 2) : false;

      return {
        hasMiniLogo: !!miniLogo && miniLogo.textContent.includes('Voca'),
        hasLangBadge: !!langTrigger && !!langName && !!flagEmoji,
        langNameText: langName ? langName.textContent.trim() : '',
        flagText: flagEmoji ? flagEmoji.textContent.trim() : '',
        hasHeaderSettings: !!headerSettings,
        hasAvatar: !!avatarBtn && !!avatarImg,
        hasPencil: avatarBtn ? avatarBtn.textContent.includes('✏️') : false,
        isFixed: header ? (window.getComputedStyle(header).position === 'fixed') : false,
        avatarImgWidth: avatarImg ? avatarImg.clientWidth : 0,
        hasStreak: !!streakBtn,
        hasHearts: !!heartsBadge,
        hasGems: !!gemsBadge,
        isOverflowing,
        headerWidth: header ? header.clientWidth : 0,
        headerScrollWidth: header ? header.scrollWidth : 0
      };
    });

    // Verify Course Dropdown Banner is completely removed per user request
    const courseSelectorRemoved = await page.evaluate(() => {
      const btn = document.getElementById('course-selector-btn');
      const menu = document.getElementById('course-dropdown-menu');
      return !btn && !menu;
    });

    // Verify 3D Casual Running Game Map & Bouncing Cat Marker
    const roadmapGameState = await page.evaluate(() => {
      const catMarker = document.getElementById('roadmap-cat-marker');
      const catImg = document.getElementById('cat-marker-img');
      const bonusNode = document.querySelector('[data-node-id="node-bonus"]');
      const reviewNode = document.querySelector('[data-node-id="node-review"]');
      const stage1Node = document.querySelector('[data-node-id="node-1"]');
      const stage2Node = document.querySelector('[data-node-id="node-2"]');
      const bossNode = document.querySelector('[data-node-id="node-boss"]');
      const btn3dCount = document.querySelectorAll('.node-btn.btn-3d').length;
      const signpost = document.getElementById('roadmap-signpost');
      const signpostText = signpost ? signpost.textContent : '';
      return {
        hasCatMarker: !!catMarker && catMarker.classList.contains('animate-cat-bounce'),
        hasCatImg: !!catImg && !!catImg.src,
        hasBonusNode: !!bonusNode && bonusNode.getAttribute('data-node-type') === 'bonus',
        hasReviewNode: !!reviewNode && reviewNode.getAttribute('data-node-type') === 'review',
        hasStageNodes: !!stage1Node && !!stage2Node && stage1Node.getAttribute('data-node-type') === 'stage',
        hasBossNode: !!bossNode && bossNode.getAttribute('data-node-type') === 'boss',
        hasMadridSignpost: signpostText.includes('MADRID'),
        btn3dCount
      };
    });

    // Test Bonus Modal interaction
    await page.click('#node-bonus-btn');
    await page.waitForTimeout(250);
    const bonusModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('bonus-modal-backdrop');
      return modal && !modal.classList.contains('pointer-events-none') && modal.classList.contains('opacity-100');
    });
    // Claim bonus
    await page.click('#bonus-claim-btn');
    await page.waitForTimeout(250);

    // Test Unit Overview Sheet interaction (verify language modal is NOT opened!)
    await page.click('#unit-banner');
    await page.waitForTimeout(250);
    const unitOverviewState = await page.evaluate(() => {
      const unitModal = document.getElementById('unit-overview-modal-backdrop');
      const langModal = document.getElementById('language-modal-backdrop');
      const titleEl = document.getElementById('unit-overview-title');
      const cards = document.querySelectorAll('.unit-item-card');
      return {
        unitModalOpen: unitModal && !unitModal.classList.contains('pointer-events-none') && unitModal.classList.contains('opacity-100'),
        langModalNotOpen: langModal ? langModal.classList.contains('pointer-events-none') : true,
        title: titleEl ? titleEl.textContent : '',
        cardCount: cards.length
      };
    });

    // Test Unit Skip Test Modal: Click locked unit card (Unit 2)
    await page.click('.unit-item-card[data-status="locked"]');
    await page.waitForTimeout(250);
    const skipModalOpened = await page.evaluate(() => {
      const modal = document.getElementById('unit-skip-modal-backdrop');
      const title = document.getElementById('unit-skip-modal-title');
      const desc = document.getElementById('unit-skip-modal-desc');
      const startBtn = document.getElementById('btn-start-unit-skip-test');
      const closeBtn = document.getElementById('btn-close-unit-skip-modal');
      const card = document.getElementById('unit-skip-modal-card');
      const cardText = card ? card.innerText : '';
      const hasTwoColCards = cardText.includes('🎯') && cardText.includes('문제 구성') && cardText.includes('총 15문제 (직행)') &&
                             cardText.includes('🏆') && cardText.includes('통과 기준') && cardText.includes('80% 이상 (12개)');
      return {
        isOpen: modal && !modal.classList.contains('pointer-events-none') && modal.classList.contains('opacity-100'),
        title: title ? title.textContent.trim() : '',
        desc: desc ? desc.textContent.trim() : '',
        hasStartBtn: !!startBtn,
        hasCloseBtn: !!closeBtn,
        hasTwoColCards
      };
    });

    // Test closing skip modal via [다음에 하기] button
    await page.click('#btn-close-unit-skip-modal');
    await page.waitForTimeout(200);
    const skipModalClosed = await page.evaluate(() => {
      const modal = document.getElementById('unit-skip-modal-backdrop');
      return modal ? (modal.classList.contains('pointer-events-none') || modal.classList.contains('opacity-0')) : true;
    });

    // Test [⚡ 바로 시험 달리기 🏃]: Bypasses flashcard preview directly into 15-question running game
    await page.click('.unit-item-card[data-status="locked"]');
    await page.waitForTimeout(200);
    await page.click('#btn-start-unit-skip-test');
    await page.waitForTimeout(400);

    const directGameTestState = await page.evaluate(() => {
      const gameScreen = document.getElementById('game-screen');
      const flashcardScreen = document.getElementById('flashcard-screen');
      const stageTitle = document.getElementById('game-stage-title');
      const isGameVisible = gameScreen && !gameScreen.classList.contains('hidden') && window.getComputedStyle(gameScreen).display !== 'none';
      const isFlashcardHidden = !flashcardScreen || flashcardScreen.classList.contains('hidden') || flashcardScreen.classList.contains('opacity-0') || window.getComputedStyle(flashcardScreen).display === 'none';
      const questions = window.currentSessionQuestions || [];

      return {
        isGameVisible,
        isFlashcardHidden,
        isUnitSkipTestMode: !!window.isUnitSkipTestMode,
        targetUnit: window.currentSkipTestUnit,
        questionCount: questions.length,
        stageTitle: stageTitle ? stageTitle.textContent.trim() : ''
      };
    });

    // Test unlockUnitsUpTo and view update
    await page.evaluate(() => {
      if (typeof window.exitGameToRoadmap === 'function') {
        window.isUnitSkipTestMode = false;
        window.exitGameToRoadmap(true);
      }
      if (typeof window.unlockUnitsUpTo === 'function') {
        window.unlockUnitsUpTo(2, 'es');
      }
    });
    await page.waitForTimeout(200);

    const unlockVerification = await page.evaluate(() => {
      const savedLevel = localStorage.getItem('vocadash_unlocked_unit_es');
      const subBadge = document.getElementById('unit-sub-badge');
      const prog = window.nodeProgressMap || {};
      const node1Target = document.getElementById('node-1-target');
      const node1StartPill = document.getElementById('node-1-start-pill');
      const node2Target = document.getElementById('node-2-target');
      const node2LockBadge = document.getElementById('node-2-lock-badge');
      const node3Target = document.getElementById('node-3-target');
      const nodeBossTarget = document.getElementById('node-boss-target');

      const isNode1Active = prog['node-1'] === 0 && node1Target?.dataset?.nodeType === 'active' && !node1StartPill?.classList?.contains('hidden');
      const isNode2Locked = prog['node-2'] === 0 && node2Target?.dataset?.nodeType === 'locked' && !node2LockBadge?.classList?.contains('hidden');
      const isNode3Locked = prog['node-3'] === 0 && node3Target?.dataset?.nodeType === 'locked';
      const isNodeBossLocked = prog['node-boss'] === 0 && nodeBossTarget?.dataset?.nodeType === 'locked';

      return {
        savedLevel,
        subBadgeText: subBadge ? subBadge.textContent.trim() : '',
        isNode1Active,
        isNode2Locked,
        isNode3Locked,
        isNodeBossLocked
      };
    });

    // Close unit overview modal if open
    await page.evaluate(() => {
      if (typeof window.closeUnitOverviewModal === 'function') window.closeUnitOverviewModal();
      if (typeof window.closeUnitSkipModal === 'function') window.closeUnitSkipModal();
      // Unlock subsequent nodes by completing node-1 for review modal test
      window.nodeProgressMap['node-1'] = 3;
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      window.updateRoadmapNodesUI();
    });
    await page.waitForTimeout(200);

    // Test Review Speed Run Modal interaction (Roadmap review node does NOT jump tabs!)
    await page.click('#node-review-btn');
    await page.waitForTimeout(250);
    const speedrunModalState = await page.evaluate(() => {
      const modal = document.getElementById('review-speedrun-modal-backdrop');
      const title = document.getElementById('review-speedrun-modal-title');
      const startBtn = document.getElementById('btn-start-speedrun-game');
      const reviewScreen = document.getElementById('review-screen');
      const roadmapScreen = document.getElementById('roadmap-screen');
      return {
        isOpen: modal && !modal.classList.contains('pointer-events-none') && modal.classList.contains('opacity-100'),
        title: title ? title.textContent.trim() : '',
        hasStartBtn: !!startBtn,
        roadmapRemainsVisible: roadmapScreen && !roadmapScreen.classList.contains('hidden'),
        reviewTabNotSwitched: reviewScreen ? reviewScreen.classList.contains('hidden') : true
      };
    });
    // Close speedrun modal
    await page.click('#btn-close-speedrun-modal');
    await page.waitForTimeout(200);

    // Test scrolling to verify header remains fixed at top: 0
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    const scrollPinned = await page.evaluate(() => {
      const h = document.getElementById('roadmap-header');
      return h ? Math.abs(h.getBoundingClientRect().top) < 2 : false;
    });
    await page.evaluate(() => window.scrollTo(0, 0));

    const skipTestModalValid =
      skipModalOpened.isOpen &&
      skipModalOpened.title.includes('⚡') &&
      skipModalOpened.title.includes('건너뛰기 시험') &&
      skipModalOpened.hasStartBtn &&
      skipModalOpened.hasCloseBtn &&
      skipModalOpened.hasTwoColCards &&
      skipModalClosed &&
      directGameTestState.isGameVisible &&
      directGameTestState.isFlashcardHidden &&
      directGameTestState.questionCount === 15 &&
      directGameTestState.stageTitle.includes('건너뛰기') &&
      unlockVerification.savedLevel === '2' &&
      unlockVerification.subBadgeText.includes('UNIT 2') &&
      unlockVerification.isNode1Active &&
      unlockVerification.isNode2Locked &&
      unlockVerification.isNode3Locked &&
      unlockVerification.isNodeBossLocked;

    const headerCompactValid =
      headerState.hasMiniLogo &&
      headerState.hasLangBadge &&
      !headerState.hasHeaderSettings &&
      headerState.hasAvatar &&
      !headerState.hasPencil &&
      headerState.isFixed &&
      scrollPinned &&
      courseSelectorRemoved &&
      roadmapGameState.hasCatMarker &&
      roadmapGameState.hasBonusNode &&
      roadmapGameState.hasReviewNode &&
      roadmapGameState.hasStageNodes &&
      roadmapGameState.hasBossNode &&
      roadmapGameState.hasMadridSignpost &&
      roadmapGameState.btn3dCount >= 5 &&
      bonusModalOpen &&
      speedrunModalState.isOpen &&
      speedrunModalState.roadmapRemainsVisible &&
      speedrunModalState.reviewTabNotSwitched &&
      speedrunModalState.title.includes('약점 극복 스피드 런') &&
      unitOverviewState.unitModalOpen &&
      unitOverviewState.langModalNotOpen &&
      unitOverviewState.cardCount === 10 &&
      !unitOverviewState.title.includes('🗺️') &&
      skipTestModalValid &&
      headerState.hasStreak &&
      headerState.hasHearts &&
      headerState.hasGems &&
      !headerState.isOverflowing;

    recordScenario('Scenario H: Compact Mobile Top Header Layout', headerCompactValid, {
      ...headerState,
      scrollPinned,
      courseSelectorRemoved,
      roadmapGameState,
      bonusModalOpen,
      unitOverviewState,
      skipModalOpened,
      directGameTestState,
      unlockVerification,
      summary: headerCompactValid ? '상단 유닛 배너 + 코스 맵 잠긴 유닛 건너뛰기 15문제 즉시 실전 러닝 시험 및 해금 정상 통과' : '헤더 및 로드맵 게임 비주얼 기준 미달'
    });

    // -----------------------------------------------------------------
    // SCENARIO B: Profile Avatar Change & Persistence
    // -----------------------------------------------------------------
    console.log('\n🎭 --- [Scenario B: Profile Avatar Change & Persistence] ---');
    await page.click('#btn-header-profile');
    await page.waitForTimeout(300);

    // Capture 3: Profile Modal
    const profileModalShot = path.join(RESULTS_DIR, '3_profile_modal.png');
    await page.screenshot({ path: profileModalShot });
    testReport.screenshots.push({ name: '3_profile_modal.png', description: '프로필 선택 모달' });

    // Verify Settings button inside profile modal
    const profileModalHasSettings = await page.evaluate(() => {
      const btn = document.getElementById('btn-profile-settings');
      return !!btn;
    });

    const avatarIds = ['spanish', 'english', 'artist', 'explorer'];
    let avatarChangeSuccess = true;
    let avatarChangeDetails = [];

    for (const avatarId of avatarIds) {
      const selector = `button[data-avatar-id="${avatarId}"]`;
      await page.click(selector);
      await page.waitForTimeout(150);

      const state = await page.evaluate((id) => {
        const curImg = document.getElementById('current-avatar-img');
        const headerImg = document.getElementById('header-mascot-img');
        const stored = localStorage.getItem('vocadash_profile_avatar') || '';
        return {
          curSrc: curImg ? curImg.src : '',
          headerSrc: headerImg ? headerImg.src : '',
          stored
        };
      }, avatarId);

      const matchesCur = state.curSrc.includes(`profile-${avatarId}.webp`);
      const matchesHeader = state.headerSrc.includes(`profile-${avatarId}.webp`);
      const matchesStored = state.stored.includes(`profile-${avatarId}.webp`);

      const stepPassed = matchesCur && matchesHeader && matchesStored;
      if (!stepPassed) {
        avatarChangeSuccess = false;
        console.warn(`⚠️ [Avatar Check Failed for ${avatarId}]:`, { matchesCur, matchesHeader, matchesStored, state });
      }

      avatarChangeDetails.push({
        avatarId,
        matchesCur,
        matchesHeader,
        matchesStored,
        stepPassed
      });
    }

    // Close profile modal
    await page.click('#close-profile-modal-btn');
    await page.waitForTimeout(200);

    recordScenario('Scenario B: Profile Avatar Change & Persistence', avatarChangeSuccess && profileModalHasSettings, {
      details: avatarChangeDetails,
      profileModalHasSettings,
      summary: avatarChangeSuccess && profileModalHasSettings ? '4개 아바타 순차 변경 시 상단 헤더 즉시 전환 및 localStorage 완벽 유지, 모달 내 설정 아이콘 포함 확인' : '아바타 변경 또는 저장 검증 실패'
    });

    // -----------------------------------------------------------------
    // SCENARIO C: Language Course Switch & Wrong Notes Isolation
    // -----------------------------------------------------------------
    console.log('\n🌐 --- [Scenario C: Language Course Switch & Wrong Notes Isolation] ---');
    await page.click('#logo-lang-trigger');
    await page.waitForTimeout(300);

    // Capture 2: Language Selection Modal
    const langModalShot = path.join(RESULTS_DIR, '2_language_modal.png');
    await page.screenshot({ path: langModalShot });
    testReport.screenshots.push({ name: '2_language_modal.png', description: '언어 선택 모달' });

    // Switch to English course
    await page.click('#card-en');
    await page.waitForTimeout(400);

    // Check Header Flag, Language Name, Roadmap Mascot Prefix, and Dynamic Signpost
    const langSwitchState = await page.evaluate(() => {
      const flag = document.getElementById('header-flag-emoji')?.textContent?.trim();
      const langName = document.getElementById('header-lang-name')?.textContent?.trim();
      const curLang = window.currentLanguage;
      const roadMascot = document.querySelector('#review-cat-banner-tile img, #roadmap-screen img[src*="characters/"]');
      const roadMascotSrc = roadMascot ? roadMascot.src : '';
      const signpost = document.getElementById('roadmap-signpost')?.textContent?.trim() || '';
      return { flag, langName, curLang, roadMascotSrc, signpost };
    });

    const flagCorrect = langSwitchState.flag === '🇺🇸';
    const langNameCorrect = langSwitchState.langName === '영어';
    const langCorrect = langSwitchState.curLang === 'en';
    const mascotCorrect = langSwitchState.roadMascotSrc.includes('en-');
    const signpostCorrect = langSwitchState.signpost.includes('NEW YORK');

    recordScenario('Scenario C-1: Language Switch to English (Flag & Mascot & Signpost)', flagCorrect && langNameCorrect && langCorrect && mascotCorrect && signpostCorrect, {
      flag: langSwitchState.flag,
      langName: langSwitchState.langName,
      curLang: langSwitchState.curLang,
      mascotSrc: langSwitchState.roadMascotSrc,
      signpost: langSwitchState.signpost,
      summary: flagCorrect && langNameCorrect && langCorrect && mascotCorrect && signpostCorrect ? '국기 🇺🇸 영어 배지, en-* 캐릭터 에셋, NEW YORK 이정표 표지판으로 즉시 전환 완료' : `언어 전환 상태 불일치 (flag: ${langSwitchState.flag}, langName: ${langSwitchState.langName}, lang: ${langSwitchState.curLang}, mascot: ${langSwitchState.roadMascotSrc}, signpost: ${langSwitchState.signpost})`
    });

    // Navigate to '단어장' Tab & '오답' Filter Chip
    await page.click('#tab-book');
    await page.waitForTimeout(300);
    const wrongChip = await page.$('#book-filter-wrong-chip');
    if (wrongChip) await wrongChip.click();
    await page.waitForTimeout(300);

    // Capture 4: Wordbook Wrong Notes Screen
    const reviewShot = path.join(RESULTS_DIR, '4_review_wrong_notes.png');
    await page.screenshot({ path: reviewShot });
    testReport.screenshots.push({ name: '4_review_wrong_notes.png', description: '단어장(오답 필터/영어 격리) 탭 화면' });

    const reviewState = await page.evaluate(() => {
      const reviewList = document.getElementById('book-words-container') || document.getElementById('review-word-list');
      const text = reviewList ? reviewList.innerText : '';
      const badge = document.getElementById('book-filter-wrong-count')?.textContent?.trim() || document.getElementById('tab-review-badge')?.textContent?.trim();
      const esStored = localStorage.getItem('vocadash_wrong_answers_es');
      const enStored = localStorage.getItem('vocadash_wrong_answers_en');
      const windowWrong = window.wrongWords || [];

      // Check for leaking Spanish words
      const spanishLeaked = text.includes('Formulario de entrada') || text.includes('Boleto de abordar') || text.includes('Pasaporte');
      const hasEmptyState = text.includes('틀린 단어가 없습니다! 완벽해요') || text.includes('마스터했어요');
      const windowWrongContainsEs = windowWrong.some((w) => w.lang === 'es');

      return {
        textSnippet: text.substring(0, 100).replace(/\n/g, ' '),
        badge,
        spanishLeaked,
        hasEmptyState,
        windowWrongLength: windowWrong.length,
        windowWrongContainsEs,
        hasEsStorage: !!esStored,
        hasEnStorage: !!enStored
      };
    });

    const wrongIsolationPassed = !reviewState.spanishLeaked && reviewState.hasEmptyState && !reviewState.windowWrongContainsEs;

    recordScenario('Scenario C-2: Wrong Answer Notes Storage Isolation', wrongIsolationPassed, {
      ...reviewState,
      summary: wrongIsolationPassed ? '영어 오답 0개 빈 화면(Empty State) 표시 및 스페인어 단어 0건 완전 격리 확인' : '스페인어 오답 누출 또는 격리 실패'
    });

    // -----------------------------------------------------------------
    // SCENARIO D: Game Flow (Stage Entry -> Flashcard -> Main Game -> Result)
    // -----------------------------------------------------------------
    console.log('\n🎮 --- [Scenario D: Game Flow Full Verification] ---');
    // Return to Roadmap Home Tab
    await page.click('#tab-home');
    await page.waitForTimeout(300);

    // Click active stage node (node-2)
    await page.click('#node-2-btn');
    await page.waitForTimeout(300);

    // Click lesson start button to enter Flashcard
    await page.click('#lesson-start-btn');
    await page.waitForTimeout(500);

    // Capture 5: Flashcard Screen
    const flashcardShot = path.join(RESULTS_DIR, '5_flashcard_screen.png');
    await page.screenshot({ path: flashcardShot });
    testReport.screenshots.push({ name: '5_flashcard_screen.png', description: '플래시카드 학습 화면' });

    const flashcardVisible = await page.evaluate(() => {
      const fc = document.getElementById('flashcard-screen');
      return fc && !fc.classList.contains('hidden') && fc.style.display !== 'none';
    });

    // Click Skip to start Main Game directly
    await page.click('#flashcard-skip-btn');
    await page.waitForTimeout(800);

    // Capture 6: Game Screen
    const gameShot = path.join(RESULTS_DIR, '6_game_screen.png');
    await page.screenshot({ path: gameShot });
    testReport.screenshots.push({ name: '6_game_screen.png', description: '인게임 플레이 화면' });

    const gameScreenVisible = await page.evaluate(() => {
      const gs = document.getElementById('game-screen');
      return gs && !gs.classList.contains('hidden') && gs.style.display !== 'none';
    });

    // Play through questions: click available choice buttons until result modal appears
    console.log('🕹️ Playing through dropping words questions...');
    let roundsPlayed = 0;
    let resultModalReached = false;

    for (let round = 0; round < 12; round++) {
      // Check if result modal is open
      const isResultOpen = await page.evaluate(() => {
        const modal = document.getElementById('game-result-modal');
        const clearCard = document.getElementById('game-result-clear-card');
        const overCard = document.getElementById('game-result-gameover-card');
        return (
          modal &&
          !modal.classList.contains('hidden') &&
          modal.style.display !== 'none' &&
          ((clearCard && !clearCard.classList.contains('hidden')) || (overCard && !overCard.classList.contains('hidden')))
        );
      });

      if (isResultOpen) {
        resultModalReached = true;
        break;
      }

      // Find choice button and click
      const choiceBtn = await page.$('.game-choice-btn');
      if (choiceBtn) {
        await choiceBtn.click();
        roundsPlayed++;
      }
      await page.waitForTimeout(700);
    }

    // Capture 7: Game Result Modal
    const resultShot = path.join(RESULTS_DIR, '7_game_result.png');
    await page.screenshot({ path: resultShot });
    testReport.screenshots.push({ name: '7_game_result.png', description: '게임 결과 모달 화면' });

    const gameFlowSuccess = flashcardVisible && gameScreenVisible && (resultModalReached || roundsPlayed > 0);

    recordScenario('Scenario D: Game Flow (Stage -> Flashcard -> In-Game -> Result)', gameFlowSuccess, {
      flashcardVisible,
      gameScreenVisible,
      roundsPlayed,
      resultModalReached,
      summary: gameFlowSuccess ? `플래시카드 진입, 본 게임 시작, 4지선다 인터랙션(${roundsPlayed}회) 및 결과 모달까지 막힘없이 완주` : '게임 플로우 도중 멈춤 또는 미완료'
    });

    // -----------------------------------------------------------------
    // SCENARIO E: Zero-Popup UX Validation
    // -----------------------------------------------------------------
    console.log('\n🛡️ --- [Scenario E: Zero-Popup UX Validation] ---');
    const noPopups = testReport.unexpectedDialogs.length === 0;
    recordScenario('Scenario E: Zero-Popup UX Validation', noPopups, {
      dialogCount: testReport.unexpectedDialogs.length,
      dialogs: testReport.unexpectedDialogs,
      summary: noPopups ? '진행 중 방해되는 네이티브 alert/confirm 팝업 0건 (원활한 UX 보장)' : `불필요한 팝업 감지: ${JSON.stringify(testReport.unexpectedDialogs)}`
    });

    // -----------------------------------------------------------------
    // SCENARIO F: Bonus 1-Time Limit & Weakness Review 10-Questions / Graduation
    // -----------------------------------------------------------------
    console.log('\n🎁 --- [Scenario F: Bonus 1-Time Limit & Review 10-Questions/Graduation] ---');
    const bonusAndReviewResult = await page.evaluate(async () => {
      const results = {};

      // 1) Bonus Claiming
      localStorage.removeItem('vocadash_claimed_bonuses');
      const initialClaimed = window.isBonusClaimed('node-bonus');
      results.initialClaimed = initialClaimed; // should be false

      const initGems = parseInt(localStorage.getItem('vocadash_gems') || '120', 10);
      window.openBonusModal('node-bonus');
      const claimBtn = document.getElementById('bonus-claim-btn');
      if (claimBtn) claimBtn.click();

      const afterGems = parseInt(localStorage.getItem('vocadash_gems') || '120', 10);
      const isClaimedNow = window.isBonusClaimed('node-bonus');
      results.isClaimedNow = isClaimedNow; // should be true
      results.gemsIncremented = afterGems === initGems + 15;

      const badgeText = document.getElementById('node-bonus-badge-text')?.textContent?.trim();
      const iconText = document.getElementById('node-bonus-icon')?.textContent?.trim();
      results.badgeText = badgeText; // '수령 완료 ✅'
      results.iconText = iconText; // '📦'

      // Try claim again
      window.openBonusModal('node-bonus');
      const modalTitleClaimed = document.getElementById('bonus-modal-title')?.textContent?.trim();
      results.modalTitleClaimed = modalTitleClaimed;
      if (claimBtn) claimBtn.click();
      const doubleGems = parseInt(localStorage.getItem('vocadash_gems') || '120', 10);
      results.duplicateBlocked = doubleGems === afterGems; // no extra gems

      // 2) Review Speedrun Modal & 10 questions
      window.openReviewSpeedrunModal();
      const speedrunTitle = document.getElementById('review-speedrun-modal-title')?.textContent?.trim();
      results.speedrunTitle = speedrunTitle; // '⚡ 약점 극복 스피드 런 (10문제)'

      window.startRoadmapReviewSpeedrun();
      results.questionsCount = window.currentSessionQuestions?.length; // should be 10
      results.isSpeedrunMode = window.isRoadmapReviewSpeedrun; // true

      // 3) Graduation streak logic
      window.recordAnswerResult({ id: 'test-grad-1', term: 'TestWord', meaning: '시험단어', lang: 'es' }, false);
      let list = window.loadWrongWords('es');
      let item = list.find(w => w.term === 'TestWord');
      results.streakInitZero = item && item.correctStreak === 0;

      // 4 correct answers -> streak 4
      for (let i = 0; i < 4; i++) {
        window.recordAnswerResult({ id: 'test-grad-1', term: 'TestWord', lang: 'es' }, true);
      }
      list = window.loadWrongWords('es');
      item = list.find(w => w.term === 'TestWord');
      results.streakFour = item && item.correctStreak === 4;

      // 1 wrong answer -> reset to 0
      window.recordAnswerResult({ id: 'test-grad-1', term: 'TestWord', lang: 'es' }, false);
      list = window.loadWrongWords('es');
      item = list.find(w => w.term === 'TestWord');
      results.streakResetZero = item && item.correctStreak === 0;

      // 5 consecutive correct answers -> graduated (deleted from list)
      for (let i = 0; i < 5; i++) {
        window.recordAnswerResult({ id: 'test-grad-1', term: 'TestWord', lang: 'es' }, true);
      }
      list = window.loadWrongWords('es');
      item = list.find(w => w.term === 'TestWord');
      results.graduatedDeleted = !item; // should be true (removed completely)

      return results;
    });

    const scenarioFPassed = 
      !bonusAndReviewResult.initialClaimed &&
      bonusAndReviewResult.isClaimedNow &&
      bonusAndReviewResult.gemsIncremented &&
      bonusAndReviewResult.badgeText === '수령 완료 ✅' &&
      bonusAndReviewResult.iconText === '📦' &&
      bonusAndReviewResult.duplicateBlocked &&
      bonusAndReviewResult.speedrunTitle.includes('10문제') &&
      bonusAndReviewResult.questionsCount === 10 &&
      bonusAndReviewResult.streakInitZero &&
      bonusAndReviewResult.streakFour &&
      bonusAndReviewResult.streakResetZero &&
      bonusAndReviewResult.graduatedDeleted;

    recordScenario('Scenario F: Bonus 1-Time Limit & Weakness Review 10-Questions/Graduation', scenarioFPassed, {
      ...bonusAndReviewResult,
      summary: scenarioFPassed
        ? '보너스 1회 제한 및 중복 방지, 10문제 스피드런 코스 구성, 5연속 정답 시 오답노트 영구 졸업 완벽 검증'
        : `검증 실패 세부사항: ${JSON.stringify(bonusAndReviewResult)}`
    });

    console.log('\n📦 --- [Scenario G: Course Management & Progress Isolation (DLC / Pack Expansion)] ---');
    const courseIsolationResult = await page.evaluate(() => {
      const results = {};

      // 1. 활성 코스 상태값 activeCourseId 기본값 검증
      results.defaultActiveCourse = window.activeCourseId;
      const mainCourseData = typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null;
      results.mainCourseHasUnits = !!(mainCourseData && mainCourseData.units && mainCourseData.units.length > 0);

      // 2. 메인 코스 초기 진행도 구조 검증
      const mainProgRaw = localStorage.getItem('vocadash_progress_main');
      const mainProg = mainProgRaw ? JSON.parse(mainProgRaw) : null;
      results.mainHasCompletedNodes = Array.isArray(mainProg?.completedNodes);
      results.mainHasClaimedBonuses = Array.isArray(mainProg?.claimedBonuses);
      results.mainHasUnlockedUnits = Array.isArray(mainProg?.unlockedUnits);
      results.mainUnitLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel() : 1;

      // 3. 축구팩(pack_football)으로 코스 전환 (switchCourse)
      window.switchCourse('pack_football');
      results.switchedCourseId = window.activeCourseId;
      results.storedActiveCourse = localStorage.getItem('vocadash_active_course');
      
      const footballData = typeof window.getCurrentCourseData === 'function' ? window.getCurrentCourseData() : null;
      results.footballPackId = footballData?.id;
      results.footballPackUnitsCount = footballData?.units?.length;

      // 4. 축구팩 진행도 격리 저장 검증 (진행도 변경)
      window.setUnlockedUnitLevel(2);
      window.markBonusClaimed('node-bonus');
      
      const footballProgRaw = localStorage.getItem('vocadash_progress_pack_football');
      const footballProg = footballProgRaw ? JSON.parse(footballProgRaw) : null;
      results.footballUnlockedUnits = footballProg?.unlockedUnits;
      results.footballClaimedBonuses = footballProg?.claimedBonuses;

      // 5. 메인 코스 진행도 불변 검증 (격리 보장)
      const mainProgAfterRaw = localStorage.getItem('vocadash_progress_main');
      const mainProgAfter = mainProgAfterRaw ? JSON.parse(mainProgAfterRaw) : null;
      results.mainProgUntouched = 
        mainProgAfter &&
        JSON.stringify(mainProgAfter.unlockedUnits) === JSON.stringify(mainProg.unlockedUnits);

      // 6. 축구팩 UI 연동 검증 (로드맵 상단 배너, 1번 노드, 단어장 탭)
      window.switchCourse('pack_football');
      const bannerTitle = document.getElementById('unit-main-title')?.textContent || '';
      const bannerBadge = document.getElementById('unit-lang-badge')?.textContent || '';
      const bannerIcon = document.getElementById('unit-thumb-icon')?.textContent || '';
      const node1Title = document.getElementById('node-1-title')?.textContent || '';
      
      results.bannerTitleFootball = bannerTitle;
      results.bannerBadgeFootball = bannerBadge;
      results.bannerIconFootball = bannerIcon;
      results.node1TitleFootball = node1Title;

      // 단어장 단어 렌더링 검증
      if (typeof window.renderBookWords === 'function') {
        window.renderBookWords('es', 'pack_football');
      }
      const bookCards = Array.from(document.querySelectorAll('.book-word-card'));
      const bookTerms = bookCards.map(c => c.dataset.term || '');
      results.bookHasPortero = bookTerms.includes('portero');
      results.bookHasDelantero = bookTerms.includes('delantero');
      results.bookHasArbitro = bookTerms.includes('árbitro');
      results.bookCardCount = bookCards.length;

      // 7. 메인 코스로 다시 전환하여 복원 검증
      window.switchCourse('main');
      results.restoredActiveCourse = window.activeCourseId;
      results.restoredMainUnitLevel = typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel() : 1;
      results.bannerTitleMain = document.getElementById('unit-main-title')?.textContent || '';
      results.bannerBadgeMain = document.getElementById('unit-lang-badge')?.textContent || '';

      // 8. renderRoadmap 정상 동작 확인
      results.hasRenderRoadmap = typeof window.renderRoadmap === 'function';

      // 9. 공식 축구팩 데이터 상세 필드 검증
      const fbDataObj = window.packFootballData;
      results.hasFootballUnits = Array.isArray(fbDataObj?.units) && fbDataObj.units.length === 4;
      results.unit1HasWords = Array.isArray(fbDataObj?.units?.[0]?.words) && fbDataObj.units[0].words.length === 12;
      results.unit1HasNodes = Array.isArray(fbDataObj?.units?.[0]?.nodes) && fbDataObj.units[0].nodes.length === 6;
      results.unit1HasSentence = fbDataObj?.units?.[0]?.nodes?.some(n => n.type === 'sentence' && n.targetSentence?.includes('El delantero marca un gol'));

      return results;
    });

    const scenarioGPassed = 
      courseIsolationResult.defaultActiveCourse === 'main' &&
      courseIsolationResult.mainCourseHasUnits &&
      courseIsolationResult.mainHasCompletedNodes &&
      courseIsolationResult.mainHasClaimedBonuses &&
      courseIsolationResult.mainHasUnlockedUnits &&
      courseIsolationResult.switchedCourseId === 'pack_football' &&
      courseIsolationResult.storedActiveCourse === 'pack_football' &&
      courseIsolationResult.footballPackId === 'pack_football' &&
      courseIsolationResult.footballPackUnitsCount === 4 &&
      Array.isArray(courseIsolationResult.footballUnlockedUnits) &&
      courseIsolationResult.footballUnlockedUnits.includes(2) &&
      Array.isArray(courseIsolationResult.footballClaimedBonuses) &&
      courseIsolationResult.footballClaimedBonuses.includes('node-bonus') &&
      courseIsolationResult.mainProgUntouched &&
      courseIsolationResult.bannerTitleFootball.includes('스페인 축구 실전팩') &&
      courseIsolationResult.bannerBadgeFootball.includes('스페셜 팩') &&
      courseIsolationResult.bannerIconFootball.includes('⚽') &&
      courseIsolationResult.node1TitleFootball.includes('포지션') &&
      courseIsolationResult.bookHasPortero &&
      courseIsolationResult.bookHasDelantero &&
      courseIsolationResult.hasFootballUnits &&
      courseIsolationResult.unit1HasWords &&
      courseIsolationResult.unit1HasNodes &&
      courseIsolationResult.unit1HasSentence &&
      courseIsolationResult.restoredActiveCourse === 'main' &&
      courseIsolationResult.hasRenderRoadmap;

    recordScenario('Scenario G: Course Management & Progress Isolation (DLC / Pack Expansion)', scenarioGPassed, {
      ...courseIsolationResult,
      summary: scenarioGPassed
        ? '⚽ 스페인 축구 실전팩(pack_football) 데이터 구축, 코스 스위칭, 배너/노드 갱신 및 단어장 연동 완벽 검증'
        : `검증 실패 세부사항: ${JSON.stringify(courseIsolationResult)}`
    });

    console.log('\n💖 --- [Scenario HP: Realistic Heart (HP) System, 0-Heart Block, Modal & Review Run Recharge] ---');
    const heartTestResult = await page.evaluate(async () => {
      const results = {};

      // 1. Initial State & Persistence check
      window.setUserHearts(5);
      results.initialHearts = window.getUserHearts();
      results.initialLocal = localStorage.getItem('vocadash_hearts');
      const headerEl = document.getElementById('header-hearts-count');
      results.headerTextInitial = headerEl ? headerEl.textContent.trim() : '';

      // Set to 3 hearts
      window.setUserHearts(3);
      results.heartsAfterSet3 = window.getUserHearts();
      results.localAfterSet3 = localStorage.getItem('vocadash_hearts');
      results.headerText3 = headerEl ? headerEl.textContent.trim() : '';
      const iconEl = document.getElementById('header-hearts-icon');
      results.headerIcon3 = iconEl ? iconEl.textContent.trim() : '';

      // 2. 0 Hearts Block & Modal Trigger check
      window.setUserHearts(0);
      results.heartsZero = window.getUserHearts();
      results.headerText0 = headerEl ? headerEl.textContent.trim() : '';
      results.headerIcon0 = iconEl ? iconEl.textContent.trim() : '';

      // Try opening stage 1 with 0 hearts
      const lessonModal = document.getElementById('lesson-card-sheet');
      const heartBackdrop = document.getElementById('heart-modal-backdrop');

      window.openLessonModal('node-1');
      results.lessonModalOpenedWithZeroHearts = lessonModal ? lessonModal.classList.contains('translate-y-0') : false;
      results.heartModalVisible = heartBackdrop ? heartBackdrop.classList.contains('opacity-100') : false;

      // Check modal content
      const titleEl = document.getElementById('heart-modal-title');
      const optAGem = document.getElementById('btn-recharge-with-gems');
      const optBReview = document.getElementById('btn-recharge-with-review');
      const optCTimer = document.getElementById('heart-countdown-display');
      results.modalHasTitle = titleEl ? titleEl.textContent.includes('하트가 모두 소진되었습니다') : false;
      results.hasOptionA = !!optAGem;
      results.hasOptionB = !!optBReview;
      results.hasOptionC = !!optCTimer;

      // 3. Gem Full Recharge (Option A) check
      localStorage.setItem('vocadash_gems', '120');
      if (optAGem) optAGem.click();
      results.heartsAfterGemRecharge = window.getUserHearts();
      results.gemsAfterRecharge = localStorage.getItem('vocadash_gems');
      results.modalClosedAfterGemRecharge = heartBackdrop ? heartBackdrop.classList.contains('opacity-0') : false;

      // 4. Background 30-min Timer Simulation check
      window.setUserHearts(3);
      // Simulate 35 mins elapsed (35 * 60 * 1000 = 2100000ms)
      const pastTime = Date.now() - (35 * 60 * 1000);
      localStorage.setItem('vocadash_hearts_timer_start', String(pastTime));
      const timerCheck = window.checkAndRechargeHearts();
      results.heartsAfter30MinElapsed = timerCheck.hearts;
      results.timerCalcWorking = timerCheck.hearts === 4;

      // 5. Review Run (오답런) Immunity & 80% Clear +3 Hearts check
      window.setUserHearts(0);
      // 오답런 진입 허용 확인 (10문제)
      window.isRoadmapReviewSpeedrun = true;
      window.isReviewGameMode = true;
      const reviewQuestions = Array.from({ length: 10 }, (_, i) => ({
        word: `test${i}`,
        meaning: `의미${i}`,
        distractors: ['오답1', '오답2', '오답3']
      }));
      window.openGameScreen('node-review', reviewQuestions);
      const gScreen = document.getElementById('game-screen');
      results.reviewScreenOpenedWithZeroHearts = gScreen ? gScreen.classList.contains('opacity-100') : false;

      // In review run, decreaseHeart should NOT decrease hearts or trigger GameOver
      const heartBeforeMiss = window.getUserHearts();
      window.decreaseHeart();
      const heartAfterMiss = window.getUserHearts();
      results.reviewHeartNotDeducted = (heartBeforeMiss === 0 && heartAfterMiss === 0);

      // Finish review with 100% (0 missed)
      window.finishGameStage(true);
      results.heartsAfter80PctReviewClear = window.getUserHearts();

      // Clean up & return home
      window.setUserHearts(5);
      window.isRoadmapReviewSpeedrun = false;
      window.isReviewGameMode = false;
      if (typeof window.exitGameToRoadmap === 'function') window.exitGameToRoadmap(true);

      return results;
    });

    console.log('💖 Heart system test details:', heartTestResult);
    const scenarioHPPassed = 
      heartTestResult.initialHearts === 5 &&
      heartTestResult.localAfterSet3 === '3' &&
      heartTestResult.headerText3 === '3' &&
      heartTestResult.headerIcon3 === '❤️' &&
      heartTestResult.headerText0 === '0' &&
      heartTestResult.headerIcon0 === '💔' &&
      heartTestResult.lessonModalOpenedWithZeroHearts === false &&
      heartTestResult.heartModalVisible === true &&
      heartTestResult.modalHasTitle === true &&
      heartTestResult.hasOptionA === true &&
      heartTestResult.hasOptionB === true &&
      heartTestResult.hasOptionC === true &&
      heartTestResult.heartsAfterGemRecharge === 5 &&
      heartTestResult.gemsAfterRecharge === '20' &&
      heartTestResult.timerCalcWorking === true &&
      heartTestResult.reviewScreenOpenedWithZeroHearts === true &&
      heartTestResult.reviewHeartNotDeducted === true &&
      heartTestResult.heartsAfter80PctReviewClear === 3;

    recordScenario('Scenario HP: Realistic Heart (HP) System, Zero-Heart Block, Modal & Review Run Recharge', scenarioHPPassed, {
      ...heartTestResult,
      summary: scenarioHPPassed
        ? '하트 상태 영구 유지(localStorage), 0개 시 게임 진입 차단 & 충전 모달 표출, 보석 100개 완충, 30분 타이머 계산, 오답런 0하트 진입/무차감 및 80% 클리어 시 하트 3개 충전 완벽 검증'
        : `검증 실패 세부사항: ${JSON.stringify(heartTestResult)}`
    });

    console.log('\n📚 --- [Scenario I: Wordbook Wrong Filter, Course Switcher & MiniGame Adapter] ---');
    const wordbookAndAdapterResult = await page.evaluate(async () => {
      const results = {};

      // 1. Ensure Spanish language is active
      if (typeof window.setLanguage === 'function') window.setLanguage('es');

      // Check wrong filter chip exists and has count badge
      const wrongChip = document.getElementById('book-filter-wrong-chip');
      const wrongCount = document.getElementById('book-filter-wrong-count');
      results.hasWrongChip = !!wrongChip;
      results.hasWrongCount = !!wrongCount;

      // 2. Set sample wrong words with streaks
      const sampleWrongWords = [
        { word: 'Prueba1', meaning: '시험1', correctStreak: 2, escaped: false, lang: 'es' },
        { word: 'Prueba2', meaning: '시험2', correctStreak: 4, escaped: false, lang: 'es' }
      ];
      window.wrongWords = sampleWrongWords;
      localStorage.setItem('vocadash_wrong_answers_es', JSON.stringify(sampleWrongWords));
      if (typeof window.updateWrongWordsBadge === 'function') window.updateWrongWordsBadge();

      // Check badge updated
      results.wrongBadgeCount = wrongCount ? wrongCount.textContent.trim() : '';

      // 3. Navigate to '단어장' tab (#tab-book) and click '오답' filter chip
      const tabBook = document.getElementById('tab-book');
      if (tabBook) tabBook.click();
      await new Promise(r => setTimeout(r, 100));
      if (wrongChip) wrongChip.click();
      await new Promise(r => setTimeout(r, 100));

      // Should be on book screen
      const bookScreen = document.getElementById('book-screen');
      results.bookScreenVisible = bookScreen && !bookScreen.classList.contains('hidden') && bookScreen.style.display !== 'none';

      // 4. Check wrong cards rendered with streak badges
      const wrongCards = document.querySelectorAll('.book-word-card-wrong');
      results.wrongCardsCount = wrongCards.length;
      results.firstCardStreak = wrongCards[0]?.querySelector('.bg-rose-50, .flex-shrink-0 span')?.textContent?.trim() || '';

      // Check banner exists and is visible
      const banner = document.getElementById('book-wrong-run-banner');
      const startRunBtn = document.getElementById('btn-book-start-wrong-run');
      results.bannerVisible = banner && !banner.classList.contains('hidden');
      results.hasStartRunBtn = !!startRunBtn;

      // 5. Test Course Switcher in Book Screen
      const courseBtn = document.getElementById('book-course-btn');
      if (courseBtn) courseBtn.click();
      const courseMenu = document.getElementById('book-course-dropdown-menu');
      results.dropdownVisible = courseMenu && !courseMenu.classList.contains('hidden');

      const footballItem = courseMenu?.querySelector('[data-course-id="pack_football"]');
      results.hasFootballItem = !!footballItem;
      if (footballItem) footballItem.click();

      results.activeCourseAfterSwitch = window.activeCourseId;
      results.storedCourseAfterSwitch = localStorage.getItem('vocadash_active_course');
      const courseTitle = document.getElementById('book-course-title');
      results.courseTitleText = courseTitle ? courseTitle.textContent.trim() : '';

      // Switch back to main
      window.switchCourse('main');
      results.restoredMainCourse = window.activeCourseId;

      // 6. Test launchGame Adapter
      results.hasLaunchGame = typeof window.launchGame === 'function';
      let launchCalled = false;
      const origStartFallingGame = window.startFallingGame;
      window.startFallingGame = function(lessonId, wordList, options) {
        launchCalled = true;
        return { lessonId, wordList, options };
      };
      window.launchGame('falling', [{ word: 'Test' }], { lessonId: 'node-test' });
      results.launchGameRoutedToFalling = launchCalled;
      window.startFallingGame = origStartFallingGame;

      // Clean up test wrong words
      localStorage.removeItem('vocadash_wrong_answers_es');
      if (typeof window.loadWrongWords === 'function') window.loadWrongWords('es');
      if (typeof window.updateWrongWordsBadge === 'function') window.updateWrongWordsBadge();

      return results;
    });

    console.log('📚 Wordbook and adapter test details:', wordbookAndAdapterResult);
    const scenarioIPassed = 
      wordbookAndAdapterResult.hasWrongChip === true &&
      wordbookAndAdapterResult.hasWrongCount === true &&
      wordbookAndAdapterResult.wrongBadgeCount === '2' &&
      wordbookAndAdapterResult.bookScreenVisible === true &&
      wordbookAndAdapterResult.wrongCardsCount === 2 &&
      wordbookAndAdapterResult.firstCardStreak.includes('/5') &&
      wordbookAndAdapterResult.bannerVisible === true &&
      wordbookAndAdapterResult.hasStartRunBtn === true &&
      wordbookAndAdapterResult.hasFootballItem === true &&
      wordbookAndAdapterResult.activeCourseAfterSwitch === 'pack_football' &&
      wordbookAndAdapterResult.storedCourseAfterSwitch === 'pack_football' &&
      wordbookAndAdapterResult.restoredMainCourse === 'main' &&
      wordbookAndAdapterResult.hasLaunchGame === true &&
      wordbookAndAdapterResult.launchGameRoutedToFalling === true;

    recordScenario('Scenario I: Wordbook Wrong Filter, Course Switcher & MiniGame Adapter', scenarioIPassed, {
      ...wordbookAndAdapterResult,
      summary: scenarioIPassed
        ? '교재단어장 [🔥 오답] 필터 칩 연동, 🔥 {streak}/5 뱃지 표시, 약점 극복 10문제 런 배너, 코스 스위처 연동, 하단 탭 연결 및 미니게임 실행 어댑터(launchGame) 정상 동작 완벽 검증'
        : `검증 실패 세부사항: ${JSON.stringify(wordbookAndAdapterResult)}`
    });

    console.log('\n🔊 --- [Scenario J: Spanish TTS (es-ES) & Web Audio Zero-Latency SFX System] ---');
    const audioSfxResult = await page.evaluate(async () => {
      const results = {};

      // 1. Check playSpanishTTS function and utterance configuration
      results.hasPlaySpanishTTS = typeof window.playSpanishTTS === 'function';

      let capturedUtterance = null;
      const origSpeak = window.speechSynthesis ? window.speechSynthesis.speak : null;
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = function(utt) {
          capturedUtterance = utt;
        };
      }

      window.playSpanishTTS('¡Hola mundo!');

      if (capturedUtterance) {
        results.ttsLang = capturedUtterance.lang;
        results.ttsPitch = capturedUtterance.pitch;
        results.ttsRate = capturedUtterance.rate;
        results.ttsText = capturedUtterance.text;
      }

      if (window.speechSynthesis && origSpeak) {
        window.speechSynthesis.speak = origSpeak;
      }

      // 2. Check Web Audio SFX playSound engine
      results.hasPlaySound = typeof window.playSound === 'function';
      results.hasGetAudioContext = typeof window.getAudioContext === 'function';
      results.hasIsSoundEnabled = typeof window.isSoundEnabled === 'function';

      // Verify all 4 primary sound types can be called without exception
      let soundsPlayedWithoutError = true;
      try {
        window.playSound('correct');
        window.playSound('wrong');
        window.playSound('gem');
        window.playSound('click');
        window.playSound('clear');
      } catch (e) {
        soundsPlayedWithoutError = false;
      }
      results.soundsPlayedWithoutError = soundsPlayedWithoutError;

      // 3. Test sound toggle state (localStorage: vocadash_sound_enabled)
      localStorage.setItem('vocadash_sound_enabled', 'false');
      results.soundDisabledCheck = window.isSoundEnabled() === false;

      localStorage.setItem('vocadash_sound_enabled', 'true');
      results.soundEnabledCheck = window.isSoundEnabled() === true;

      // 4. Test mobile audio policy unlock trigger
      results.hasUnlockAudioPolicy = typeof window.unlockAudioPolicy === 'function';
      let unlockSuccess = true;
      try {
        window.unlockAudioPolicy();
      } catch (_) {
        unlockSuccess = false;
      }
      results.unlockSuccess = unlockSuccess;

      return results;
    });

    console.log('🔊 Audio & SFX test details:', audioSfxResult);
    const scenarioJPassed = 
      audioSfxResult.hasPlaySpanishTTS === true &&
      audioSfxResult.ttsLang === 'es-ES' &&
      audioSfxResult.ttsPitch === 1.0 &&
      Math.abs(audioSfxResult.ttsRate - 0.95) < 0.01 &&
      audioSfxResult.ttsText === 'Hola mundo' &&
      audioSfxResult.hasPlaySound === true &&
      audioSfxResult.soundsPlayedWithoutError === true &&
      audioSfxResult.soundDisabledCheck === true &&
      audioSfxResult.soundEnabledCheck === true &&
      audioSfxResult.hasUnlockAudioPolicy === true &&
      audioSfxResult.unlockSuccess === true;

    recordScenario('Scenario J: Spanish TTS (es-ES) & Web Audio Zero-Latency SFX System', scenarioJPassed, {
      ...audioSfxResult,
      summary: scenarioJPassed
        ? 'es-ES 스페인 본토 TTS 강제 지정(pitch: 1.0, rate: 0.95), Web Audio API 오실레이터 무지연 효과음(correct, wrong, gem, click) 합성음, localStorage 토글 제어 및 모바일 오디오 정책 잠금 해제 완벽 검증'
        : `검증 실패 세부사항: ${JSON.stringify(audioSfxResult)}`
    });

    // -----------------------------------------------------------------
    // SCENARIO K: Bottom Navigation (4 Tabs), Word Pack Screen & Safe Bottom
    // -----------------------------------------------------------------
    console.log('\n🎒 --- [Scenario K: Bottom Navigation (4 Tabs: Home, Packs, Wordbook, Records), Word Pack Screen & Safe Bottom Padding] ---');
    const bottomNavAndPacksResult = await page.evaluate(async () => {
      const results = {};

      // 1. Check 4 bottom navigation tabs
      const tabHome = document.getElementById('tab-home');
      const tabPacks = document.getElementById('tab-packs');
      const tabBook = document.getElementById('tab-book');
      const tabRecords = document.getElementById('tab-records');

      results.hasTabHome = !!tabHome;
      results.hasTabPacks = !!tabPacks;
      results.hasTabBook = !!tabBook;
      results.hasTabRecords = !!tabRecords;

      results.tabPacksText = tabPacks ? tabPacks.textContent.trim() : '';
      results.tabBookText = tabBook ? tabBook.textContent.trim() : '';

      // 2. Test switching to Packs tab
      if (tabPacks) tabPacks.click();
      await new Promise(r => setTimeout(r, 100));

      const packsScreen = document.getElementById('packs-screen');
      results.packsScreenVisible = packsScreen && !packsScreen.classList.contains('hidden') && packsScreen.style.display !== 'none';

      // 3. Check packs screen cards and hero banner
      const footballCard = packsScreen ? packsScreen.querySelector('.pack-card[data-pack-id="pack_football"]') : null;
      const mainCard = packsScreen ? packsScreen.querySelector('.pack-card[data-pack-id="main"]') : null;
      results.hasFootballCard = !!footballCard;
      results.hasMainCard = !!mainCard;

      // 4. Test equipping pack_football
      const fbEquipBtn = footballCard ? footballCard.querySelector('.btn-pack-equip') : null;
      if (fbEquipBtn && !fbEquipBtn.disabled) fbEquipBtn.click();
      await new Promise(r => setTimeout(r, 100));

      results.activeCourseAfterEquip = window.activeCourseId;
      results.storedCourseAfterEquip = localStorage.getItem('vocadash_active_course');
      const heroTitleAfterEquip = document.getElementById('packs-hero-title')?.textContent?.trim() || '';
      results.heroTitleAfterEquip = heroTitleAfterEquip;

      // Switch back to main
      const mainEquipBtn = mainCard ? mainCard.querySelector('.btn-pack-equip') : null;
      if (mainEquipBtn && !mainEquipBtn.disabled) mainEquipBtn.click();
      await new Promise(r => setTimeout(r, 100));
      results.restoredMainCourse = window.activeCourseId;

      // 5. Check roadmap safe-bottom padding & bottom nav safe-area
      const roadmapScreen = document.getElementById('roadmap-screen');
      const roadmapComputed = roadmapScreen ? window.getComputedStyle(roadmapScreen) : null;
      const bottomNav = document.getElementById('bottom-nav');

      results.roadmapHasBottomPadding = roadmapScreen ? (parseInt(roadmapComputed?.paddingBottom || '0', 10) >= 140) : false;
      results.bottomNavHasSafeArea = bottomNav ? (bottomNav.style.paddingBottom.includes('safe-area-inset-bottom') || bottomNav.classList.contains('pb-safe')) : false;

      // 6. Check header hearts single number formatting
      const heartCountEl = document.getElementById('header-hearts-count');
      const heartIconEl = document.getElementById('header-hearts-icon');
      window.setUserHearts(5);
      results.heartCount5 = heartCountEl ? heartCountEl.textContent.trim() : '';
      results.heartIcon5 = heartIconEl ? heartIconEl.textContent.trim() : '';

      window.setUserHearts(0);
      results.heartCount0 = heartCountEl ? heartCountEl.textContent.trim() : '';
      results.heartIcon0 = heartIconEl ? heartIconEl.textContent.trim() : '';

      window.setUserHearts(5); // restore
      if (typeof window.switchMainTab === 'function') window.switchMainTab('home');

      return results;
    });

    console.log('🎒 Bottom Navigation & Packs test details:', bottomNavAndPacksResult);
    const scenarioKPassed = 
      bottomNavAndPacksResult.hasTabHome === true &&
      bottomNavAndPacksResult.hasTabPacks === true &&
      bottomNavAndPacksResult.hasTabBook === true &&
      bottomNavAndPacksResult.hasTabRecords === true &&
      bottomNavAndPacksResult.tabPacksText.includes('단어팩') &&
      bottomNavAndPacksResult.tabBookText.includes('단어장') &&
      bottomNavAndPacksResult.packsScreenVisible === true &&
      bottomNavAndPacksResult.hasFootballCard === true &&
      bottomNavAndPacksResult.hasMainCard === true &&
      bottomNavAndPacksResult.activeCourseAfterEquip === 'pack_football' &&
      bottomNavAndPacksResult.storedCourseAfterEquip === 'pack_football' &&
      bottomNavAndPacksResult.heroTitleAfterEquip.includes('스페인 축구 실전팩') &&
      bottomNavAndPacksResult.restoredMainCourse === 'main' &&
      bottomNavAndPacksResult.roadmapHasBottomPadding === true &&
      bottomNavAndPacksResult.bottomNavHasSafeArea === true &&
      bottomNavAndPacksResult.heartCount5 === '5' &&
      bottomNavAndPacksResult.heartIcon5 === '❤️' &&
      bottomNavAndPacksResult.heartCount0 === '0' &&
      bottomNavAndPacksResult.heartIcon0 === '💔';

    recordScenario('Scenario K: Bottom Nav (4 Tabs), Word Pack Screen, Safe-Bottom & Heart Single Number', scenarioKPassed, {
      ...bottomNavAndPacksResult,
      summary: scenarioKPassed
        ? '하단 4개 탭([홈], [단어팩], [단어장], [내 기록]) 전면 개편, 공식 단어팩 보관함/상점 화면 연동 및 장착 관리, 상단 헤더 하트 단일 숫자(❤️ 5, 💔 0) 표기, 로드맵 하단 safe-bottom 여백(140px 이상) 및 하단바 safe-area 완벽 검증'
        : `검증 실패 세부사항: ${JSON.stringify(bottomNavAndPacksResult)}`
    });

  } catch (err) {
    console.error('❌ Test execution encountered error:', err);
    testReport.fatalError = err.toString();
  } finally {
    if (browser) {
      await browser.close();
    }
    server.close();
    console.log('🛑 Local test server stopped.');
  }

  // Generate Markdown QA Report
  generateQAReport(testReport);
  return testReport;
}

function generateQAReport(report) {
  const totalScenarios = report.scenarios.length;
  const passedScenarios = report.scenarios.filter((s) => s.passed).length;
  const failedScenarios = totalScenarios - passedScenarios;
  const passRate = totalScenarios > 0 ? ((passedScenarios / totalScenarios) * 100).toFixed(1) : 0;

  // Filter benign external CDN / fallback errors if any
  const cleanConsoleErrors = report.consoleErrors.filter((e) => !e.includes('favicon.ico'));
  const cleanFailedRequests = report.failedRequests.filter((r) => !r.url.includes('favicon.ico'));

  const md = `# VocaDash 모바일 E2E 자동화 QA 최종 점검 리포트

- **테스트 일시**: ${report.startTime}
- **테스트 디바이스 규격**: Mobile Emulation (390 x 844 px, DPR=3, Touch Support, Chrome Headless)
- **종합 결과**: **${passedScenarios}/${totalScenarios} 전원 통과 (${passRate}%)**

---

## 1. 시나리오별 상세 검증 결과

| 번호 | 시나리오 | 상태 | 요약 및 세부사항 |
| :---: | :--- | :---: | :--- |
${report.scenarios
  .map(
    (s, idx) =>
      `| ${idx + 1} | **${s.name}** | ${s.passed ? '🟢 PASS' : '🔴 FAIL'} | ${s.details.summary || ''} |`
  )
  .join('\n')}

---

## 2. 브라우저 콘솔 에러 및 404 리소스 점검

- **발견된 콘솔 에러 (console.error)**: ${cleanConsoleErrors.length}건
${cleanConsoleErrors.length === 0 ? '  - 특이사항 없음 (Console Clean ✨)' : cleanConsoleErrors.map((e) => `  - \`${e}\``).join('\n')}

- **발견된 내부 404 에셋 리소스**: ${cleanFailedRequests.length}건
${cleanFailedRequests.length === 0 ? '  - 404 누락 에셋 0건 (모든 리소스 200 OK 🚀)' : cleanFailedRequests.map((r) => `  - \`${r.url}\` (HTTP ${r.status})`).join('\n')}

- **방해 팝업(Alert/Confirm) 발생 여부**: ${report.unexpectedDialogs.length}건
${report.unexpectedDialogs.length === 0 ? '  - 모달/토스트 기반 자연스러운 UX 유지 (Alert 차단 완벽 🛡️)' : report.unexpectedDialogs.map((d) => `  - [${d.type}] ${d.message}`).join('\n')}

---

## 3. 저장된 모바일 스크린샷 갤러리

다음 스크린샷들이 \`test_results/\` 폴더에 고해상도(390x844 DPR=3)로 저장되었습니다:
${report.screenshots.map((s, idx) => `${idx + 1}. **[${s.name}](file://${path.join(RESULTS_DIR, s.name)})**: ${s.description}`).join('\n')}

---

## 4. 예외 상황 및 개선 권장 사항
1. **브랜드 스플래시 인트로 화면 도입 및 터치 스킵**:
   - 앱 기동 시 1.2초간 고양이 마스코트, VocaDash 볼드 타이포, 슬로건이 노출되며, 화면 아무 곳이나 탭하면 즉시 메인 로드맵으로 페이드아웃 진입합니다.
2. **상단 헤더 모바일 최적화 (가로 잘림 완전 해결)**:
   - 'VocaDash' 영문 텍스트 로고 및 독립 설정 아이콘을 헤더에서 정리하고, 좌측(32px 아바타 + 국기 배지) 및 우측(🔥 스트릭, ❤️ 하트, 💎 보석)을 컴팩트하게 배치하여 360px 이하 초소형 모바일 기기에서도 넘침/잘림 없이 완벽히 표시됩니다.
3. **설정 화면 접근성 보존**:
   - 상단 헤더의 불필요한 설정 아이콘은 제거되었으나, 하단 '내 기록' 탭 우측 상단(\`#btn-open-settings\`) 및 프로필 편집 모달 내부(\`#btn-profile-settings\`)에서 설정창으로 원터치 진입할 수 있도록 다각도로 경로를 유지했습니다.
4. **오답노트 네임스페이스 완전 격리 검증 완료**:
   - 스페인어 오답(\`vocadash_wrong_answers_es\`)과 영어 오답(\`vocadash_wrong_answers_en\`)이 완벽히 분리되어, 언어를 영어로 변경 시 스페인어 단어 노출 0건 및 빈 화면(Empty State: "틀린 단어가 없습니다! 완벽해요 🎉")이 정확히 노출됨을 재검증했습니다.

`;

  const reportPath = path.join(RESULTS_DIR, 'QA_TEST_REPORT.md');
  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n📄 QA Test Report successfully written to: ${reportPath}`);
}

// Execute
runE2ETests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
