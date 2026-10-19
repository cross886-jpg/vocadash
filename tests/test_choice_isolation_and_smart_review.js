const { chromium } = require('/Users/ianstudio/Desktop/vocadash/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 57639;
const ROOT_DIR = path.resolve(__dirname, '..');

function createStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

(async () => {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`📡 Test server running at http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Browser Error:', msg.text());
  });

  await page.goto(`http://127.0.0.1:${PORT}/index.html`);
  await page.waitForTimeout(1500);

  console.log('\n🧪 --- [TEST 1: Strict Choice Isolation (No Other Chapter Words)] ---');
  const isolationResult = await page.evaluate(() => {
    const course = window.courseData_es || (window.getCurrentCourseData && window.getCurrentCourseData());
    const unit1 = course.units[0];
    const unit2 = course.units[1];

    const unit1Meanings = new Set(unit1.words.map(w => (w.meaning || '').trim()));
    const unit2Meanings = new Set(unit2.words.map(w => (w.meaning || '').trim()));

    // Test questions from Unit 1 Stage 1
    const node1Words = unit1.words.slice(0, 8);
    let violations = [];
    let testsRan = 0;

    for (const q of node1Words) {
      // Test 10 times to account for randomness in shuffling
      for (let run = 0; run < 10; run++) {
        testsRan++;
        const choices = window.generateQuestionChoices(q, null, 'node-1', 'es');
        if (choices.length !== 4) {
          violations.push({ q: q.word, error: `Expected 4 choices, got ${choices.length}` });
        }
        for (const c of choices) {
          // If a choice belongs to Unit 2 and is NOT in Unit 1, it's a cross-chapter leak!
          if (unit2Meanings.has(c) && !unit1Meanings.has(c)) {
            violations.push({ q: q.word, leakedChoice: c, error: 'Unit 2 cafe word leaked into Unit 1 choice!' });
          }
        }
      }
    }

    // Also test getDistractorOptions directly
    for (const q of node1Words) {
      const distractors = window.getDistractorOptions(q, null, 'node-1', 'es');
      if (distractors.length !== 3) {
        violations.push({ q: q.word, error: `Expected 3 distractors, got ${distractors.length}` });
      }
      for (const d of distractors) {
        const m = (d.meaning || '').trim();
        if (unit2Meanings.has(m) && !unit1Meanings.has(m)) {
          violations.push({ q: q.word, leakedDistractor: m, error: 'Unit 2 cafe word in Unit 1 distractors!' });
        }
      }
    }

    return { testsRan, violationsCount: violations.length, violations };
  });

  console.log('Isolation Test Result:', isolationResult);
  if (isolationResult.violationsCount === 0) {
    console.log('✅ PASS [Test 1]: Unit 1 questions NEVER leak Unit 2 words (100% strict chapter isolation)!');
  } else {
    console.error('❌ FAIL [Test 1]: Leaked words found!', isolationResult.violations);
    process.exit(1);
  }

  console.log('\n🧪 --- [TEST 2: Weak Words Collection into localStorage] ---');
  const collectionResult = await page.evaluate(() => {
    localStorage.removeItem('vocadash_weak_word_ids');

    window.addWeakWordId('es_101');
    window.addWeakWordId('es_102');
    window.addWeakWordId('es_101'); // duplicate check

    const stored = JSON.parse(localStorage.getItem('vocadash_weak_word_ids') || '[]');
    const helperGet = window.getWeakWordIds();

    return {
      stored,
      helperGet,
      isEqual: JSON.stringify(stored) === JSON.stringify(['es_101', 'es_102']) &&
               JSON.stringify(helperGet) === JSON.stringify(['es_101', 'es_102'])
    };
  });

  console.log('Collection Result:', collectionResult);
  if (collectionResult.isEqual) {
    console.log('✅ PASS [Test 2]: Weak word IDs collected deduplicated into localStorage!');
  } else {
    console.error('❌ FAIL [Test 2]: Storage mismatch', collectionResult);
    process.exit(1);
  }

  console.log('\n🧪 --- [TEST 3: Smart Review Mixing of Previous Chapter Words] ---');
  const mixingResult = await page.evaluate(() => {
    // Set 3 weak words from Unit 1: es_101, es_102, es_103
    localStorage.setItem('vocadash_weak_word_ids', JSON.stringify(['es_101', 'es_102', 'es_103']));

    // Generate session for Unit 2 Stage 1 (es_2_n1 or node-1 in unit 2)
    window.currentUnitIndex = 1; // Unit 2
    const sessionWithWeak = window.createGameSession('es_2_n1', 'es', 0);

    const weakItems = sessionWithWeak.filter(q => q.isWeakReview || ['es_101', 'es_102', 'es_103'].includes(q.id));
    const baseItems = sessionWithWeak.filter(q => !q.isWeakReview);

    // Test with NO weak words (empty storage)
    localStorage.removeItem('vocadash_weak_word_ids');
    const sessionWithoutWeak = window.initStageWords('es_2_n1', 'es', 0);
    const weakItemsEmpty = sessionWithoutWeak.filter(q => q.isWeakReview);

    return {
      sessionWithWeakLength: sessionWithWeak.length,
      weakCount: weakItems.length,
      baseCount: baseItems.length,
      weakIds: weakItems.map(w => w.id),
      sessionWithoutWeakLength: sessionWithoutWeak.length,
      weakItemsEmptyCount: weakItemsEmpty.length
    };
  });

  console.log('Mixing Result:', mixingResult);
  const passMixing = mixingResult.sessionWithWeakLength === 10 &&
                     (mixingResult.weakCount >= 2 && mixingResult.weakCount <= 3) &&
                     (mixingResult.baseCount >= 7 && mixingResult.baseCount <= 8) &&
                     mixingResult.sessionWithoutWeakLength === 10 &&
                     mixingResult.weakItemsEmptyCount === 0;

  if (passMixing) {
    console.log('✅ PASS [Test 3]: Smart review mixing operates with 7:3 ratio (10 questions total) & pure 10 questions when empty!');
  } else {
    console.error('❌ FAIL [Test 3]: Smart review mixing failed ratio or lengths!', mixingResult);
    process.exit(1);
  }

  console.log('\n🧪 --- [TEST 4: Weak Word Overcome / Removal upon Correct Answer] ---');
  const overcomeResult = await page.evaluate(() => {
    // Put es_101 and es_102 in weak list
    localStorage.setItem('vocadash_weak_word_ids', JSON.stringify(['es_101', 'es_102']));

    window.removeWeakWordId('es_101');
    const after1 = window.getWeakWordIds();

    window.removeWeakWordId('es_102');
    const after2 = window.getWeakWordIds();

    return {
      after1,
      after2,
      success: after1.length === 1 && after1[0] === 'es_102' && after2.length === 0
    };
  });

  console.log('Overcome Result:', overcomeResult);
  if (overcomeResult.success) {
    console.log('✅ PASS [Test 4]: Answering mixed weak word correctly completely removes it from vocadash_weak_word_ids!');
  } else {
    console.error('❌ FAIL [Test 4]: Removal failed!', overcomeResult);
    process.exit(1);
  }

  await browser.close();
  server.close();
  console.log('\n🎉 ALL 4 UNIT/INTEGRATION TESTS PASSED PERFECTLY!\n');
})();
