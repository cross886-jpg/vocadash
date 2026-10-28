const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let pathname = decodeURIComponent(req.url.split('?')[0]);
      if (pathname === '/' || pathname === '') pathname = '/index.html';
      const filePath = path.join(rootDir, pathname.replace(/^\/+/, ''));
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function run() {
  console.log('🚀 Starting Instant Snap & Active Node Focus E2E Verification...');
  const server = await startStaticServer(ROOT_DIR);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/`;

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  // Helper: check if element is vertically centered in visible area
  async function checkNodeCentering(description) {
    const result = await page.evaluate(() => {
      const activeEl = window.getActiveRoadmapNodeElement ? window.getActiveRoadmapNodeElement() : null;
      if (!activeEl) return { found: false, reason: 'No active node element' };

      const rect = activeEl.getBoundingClientRect();
      const header = document.getElementById('roadmap-header');
      const headerHeight = header ? header.offsetHeight : 140;
      const nav = document.getElementById('bottom-nav') || document.querySelector('nav');
      const navHeight = nav ? nav.offsetHeight : 70;
      const viewportHeight = window.innerHeight;

      const visibleCenter = headerHeight + ((viewportHeight - headerHeight - navHeight) / 2);
      const nodeCenter = rect.top + (rect.height / 2);
      const diff = Math.abs(nodeCenter - visibleCenter);

      return {
        found: true,
        nodeId: activeEl.id || activeEl.dataset.nodeId || activeEl.className,
        nodeText: activeEl.textContent.trim().slice(0, 30),
        rectTop: rect.top,
        nodeCenter,
        visibleCenter,
        diff,
        scrollY: window.scrollY,
        isCentered: (diff < 60) || (window.scrollY === 0 && rect.top >= 130 && rect.top <= 250),
        subBadge: document.getElementById('unit-sub-badge')?.textContent || '',
        mainTitle: document.getElementById('unit-main-title')?.textContent || ''
      };
    });

    console.log(`[Check: ${description}]`, result);
    if (!result.found || !result.isCentered) {
      throw new Error(`Centering check failed for ${description}: ${JSON.stringify(result)}`);
    }
    return result;
  }

  try {
    // 1. Initial page load
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const bootCheck = await checkNodeCentering('Initial App Boot');
    if (!bootCheck.subBadge.includes('UNIT 1')) {
      throw new Error(`Expected UNIT 1 on boot, but got: ${bootCheck.subBadge}`);
    }

    // 2. Switch Language: es -> en
    console.log('🔄 Changing language to English...');
    await page.evaluate(() => {
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('en');
      }
    });
    await page.waitForTimeout(300);
    await checkNodeCentering('After Language Change (to EN)');

    // 3. Switch Language: en -> es
    console.log('🔄 Changing language back to Spanish...');
    await page.evaluate(() => {
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('es');
      }
    });
    await page.waitForTimeout(300);
    await checkNodeCentering('After Language Change (to ES)');

    // 4. Switch Tab: home -> book -> home
    console.log('🔄 Switching tab: Home -> Book -> Home...');
    await page.evaluate(() => window.switchMainTab('book'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.switchMainTab('home'));
    await page.waitForTimeout(300);
    await checkNodeCentering('After Tab Return to Home');

    // 5. In-game exit to roadmap
    console.log('🔄 Simulating in-game exit to roadmap...');
    await page.evaluate(() => {
      window.isExplicitExitRequested = true;
      if (typeof window.exitGameToRoadmap === 'function') {
        window.exitGameToRoadmap(true);
      }
    });
    await page.waitForTimeout(300);
    await checkNodeCentering('After In-Game Exit');

    // 6. Test Factory Reset
    console.log('💣 Testing Factory Reset (resetAllData)...');
    await page.evaluate(() => {
      if (typeof window.setUnlockedUnitLevel === 'function') {
        window.setUnlockedUnitLevel(3, 'es', 'main');
      }
      if (typeof window.renderRoadmap === 'function') {
        window.renderRoadmap();
      }
    });
    await page.waitForTimeout(300);
    console.log('  -> Manually unlocked to Unit 3. Now triggering resetAllData()...');

    await page.evaluate(() => {
      if (typeof window.resetAllData === 'function') {
        window.resetAllData();
      }
    });
    await page.waitForTimeout(500);

    const resetCheck = await checkNodeCentering('After Factory Reset');
    console.log('  -> Reset Result SubBadge:', resetCheck.subBadge, 'MainTitle:', resetCheck.mainTitle);
    if (!resetCheck.subBadge.includes('UNIT 1')) {
      throw new Error(`Factory Reset failed: expected UNIT 1, but got ${resetCheck.subBadge}`);
    }
    if (resetCheck.nodeId !== 'node-1-container') {
      throw new Error(`Factory Reset failed: expected active node to be node-1-container, got ${resetCheck.nodeId}`);
    }

    console.log('🎉 ALL 5 INSTANT SNAP & CENTERING SCENARIOS PASSED WITH FLYING COLORS! 🚀');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
