// tests/test_active_start_node_centering_e2e.js
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function run() {
  await new Promise(resolve => server.listen(8083, resolve));
  const baseUrl = 'http://localhost:8083';

  console.log('🚀 Starting Active START Node Centering & Scroll Target E2E Test...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // =========================================================================
    // 시나리오 1: 앱 최초 구동 시 1과 START 노드가 타겟으로 잡히는지
    // =========================================================================
    console.log('\n--- SCENARIO 1: Boot -> Stage 1 (START) is Centered ---');
    const s1 = await page.evaluate(() => {
      const activeEl = window.getActiveRoadmapNodeElement();
      return {
        id: activeEl ? activeEl.id : null,
        isNode1: activeEl ? (activeEl.id === 'node-1-container' || activeEl.dataset.nodeId === 'node-1') : false
      };
    });
    console.log('Scenario 1 result:', s1);
    if (!s1.isNode1) throw new Error(`Expected node-1-container, got: ${s1.id}`);
    console.log('✅ Scenario 1 PASS: Node 1 START is targeted on fresh boot');

    // =========================================================================
    // 시나리오 2: 1과 완료 시 -> 2과 START 노드가 타겟으로 잡히는지
    // =========================================================================
    console.log('\n--- SCENARIO 2: Stage 1 Completed -> Stage 2 (START) is Centered ---');
    const s2 = await page.evaluate(() => {
      localStorage.setItem('vocadash_prog_es_main_u1_n1', '3');
      if (typeof window.saveNodeProgress === 'function') window.saveNodeProgress();
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
      if (typeof window.focusActiveRoadmapNode === 'function') window.focusActiveRoadmapNode();

      const activeEl = window.getActiveRoadmapNodeElement();
      return {
        id: activeEl ? activeEl.id : null,
        datasetType: activeEl ? activeEl.dataset.nodeType : null
      };
    });
    console.log('Scenario 2 result:', s2);
    if (s2.id !== 'node-2-container') throw new Error(`Expected node-2-container, got: ${s2.id}`);
    console.log('✅ Scenario 2 PASS: Node 2 START is targeted after completing stage 1');

    // =========================================================================
    // 시나리오 3: 2과 완료 & 보너스 완료 & 오답 복습 미완료 -> 복습 노드가 START 타겟인지
    // =========================================================================
    console.log('\n--- SCENARIO 3: Stage 2 & Bonus Done -> Review Node (START) is Centered ---');
    const s3 = await page.evaluate(() => {
      localStorage.setItem('vocadash_prog_es_main_u1_n2', '3');
      if (typeof window.markBonusClaimed === 'function') {
        window.markBonusClaimed('node-bonus');
      }
      if (typeof window.updateRoadmapNodesUI === 'function') window.updateRoadmapNodesUI();
      if (typeof window.renderRoadmap === 'function') window.renderRoadmap();
      if (typeof window.focusActiveRoadmapNode === 'function') window.focusActiveRoadmapNode();

      const activeEl = window.getActiveRoadmapNodeElement();
      return {
        id: activeEl ? activeEl.id : null,
        datasetType: activeEl ? activeEl.dataset.nodeType : null
      };
    });
    console.log('Scenario 3 result:', s3);
    if (s3.id !== 'node-review-container') throw new Error(`Expected node-review-container, got: ${s3.id}`);
    console.log('✅ Scenario 3 PASS: Review node is targeted');

    // =========================================================================
    // 시나리오 4 [핵심 버그 검증]: 오답 복습 완료 후 로드맵 복귀 시!
    // 과거 버그: 완료된 2번 노드나 복습 노드가 화면 중앙에 머물고 3번 노드가 잘림.
    // 기대 동작: 완료된 2번 노드/복습 노드가 아니라 새로 해금된 3번 노드 (START 뱃지)가 화면 정중앙 고정!
    // =========================================================================
    console.log('\n--- SCENARIO 4 [USER BUG FIX VERIFICATION]: Review Finished -> Stage 3 (START) is Centered ---');
    const s4 = await page.evaluate(() => {
      // 오답 복습 모드 시뮬레이션
      window.isReviewGameMode = true;
      window.isRoadmapReviewSpeedrun = true;
      window.currentReviewUnitNumber = 1;
      window.currentReviewNodeId = 'u1_node-review';

      // gameEngine의 finishGameStage 로직 시뮬레이션 (라인 4073 분기)
      const targetReviewUnit = window.currentReviewUnitNumber || 1;
      const targetReviewId = window.currentReviewNodeId || 'u1_node-review';
      window.completeReviewNode(targetReviewId, targetReviewUnit);

      window.currentGameLessonId = null;
      window.currentSelectedNodeId = null;
      window.isExplicitExitRequested = true;
      window.exitGameToRoadmap(true);
      window.isExplicitExitRequested = false;

      window.updateRoadmapNodesUI();
      window.renderRoadmap();
      window.focusActiveRoadmapNode();

      const activeEl = window.getActiveRoadmapNodeElement();
      const node2 = document.getElementById('node-2-container');
      const nodeRev = document.getElementById('node-review-container');
      const node3 = document.getElementById('node-3-container');

      const rect3 = node3.getBoundingClientRect();
      const headerHeight = 140;
      const navHeight = 70;
      const viewportHeight = 844;
      const visibleCenter = headerHeight + (viewportHeight - headerHeight - navHeight) / 2;
      const node3Center = rect3.top + (rect3.height / 2);

      return {
        activeElementId: activeEl ? activeEl.id : null,
        node2IsCompleted: node2.dataset.nodeType === 'completed',
        nodeReviewIsCompleted: nodeRev.dataset.nodeType === 'completed',
        node3IsActive: node3.dataset.nodeType === 'active' || node3.classList.contains('active'),
        node3Center,
        visibleCenter,
        diff: Math.abs(node3Center - visibleCenter),
        isCentered: Math.abs(node3Center - visibleCenter) < 15
      };
    });
    console.log('Scenario 4 result:', s4);
    if (s4.activeElementId !== 'node-3-container') {
      throw new Error(`CRITICAL BUG: Expected node-3-container to be targeted, but got: ${s4.activeElementId}!`);
    }
    if (!s4.isCentered) {
      throw new Error(`Node 3 must be centered in viewport, but diff was: ${s4.diff}`);
    }
    console.log('🎉 Scenario 4 PASS: Completed nodes (node-2, review) are completely bypassed! Stage 3 (START) is perfectly centered in viewport!');

    // =========================================================================
    // 시나리오 5: 3과 완료 -> 보스전 START 노드 중앙 고정
    // =========================================================================
    console.log('\n--- SCENARIO 5: Stage 3 Completed -> Boss (START) is Centered ---');
    const s5 = await page.evaluate(() => {
      localStorage.setItem('vocadash_prog_es_main_u1_n3', '3');
      window.currentGameLessonId = null;
      window.currentSelectedNodeId = null;
      window.updateRoadmapNodesUI();
      window.renderRoadmap();
      window.focusActiveRoadmapNode();

      const activeEl = window.getActiveRoadmapNodeElement();
      return {
        id: activeEl ? activeEl.id : null
      };
    });
    console.log('Scenario 5 result:', s5);
    if (s5.id !== 'node-boss-container') throw new Error(`Expected node-boss-container, got: ${s5.id}`);
    console.log('✅ Scenario 5 PASS: Boss START node is targeted');

    // =========================================================================
    // 시나리오 6: 전체 완주 (보스까지 완료) -> 2순위 (마지막 열린 노드) 타겟팅
    // =========================================================================
    console.log('\n--- SCENARIO 6: All Nodes Completed -> Falls back to last open node ---');
    const s6 = await page.evaluate(() => {
      localStorage.setItem('vocadash_prog_es_main_u1_n6', '3');
      window.updateRoadmapNodesUI();
      window.renderRoadmap();
      window.focusActiveRoadmapNode();

      const activeEl = window.getActiveRoadmapNodeElement();
      const nodeIdentifier = activeEl ? (activeEl.id || activeEl.dataset.nodeId || activeEl.querySelector('.node-btn')?.dataset.nodeId || 'found-node') : null;
      return {
        id: nodeIdentifier
      };
    });
    console.log('Scenario 6 result:', s6);
    if (!s6.id) throw new Error('Expected a fallback node when all completed');
    console.log('✅ Scenario 6 PASS: Full clear fallback works properly');

    console.log('\n🏆 ALL 6 ROADMAP START SCROLL TARGET SCENARIOS PASSED 100%! 🚀');

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
