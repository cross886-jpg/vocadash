// ==============================================================================
// VocaDash - Revive & Accuracy Consistency Test
// 약점 복습 및 일반 스테이지 부활 후 완주 판정, 정확도 산출, 해금 정합성 단위 테스트
// ==============================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock DOM & localStorage
global.window = global;
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const domElements = {};
global.document = {
  readyState: 'complete',
  getElementById(id) {
    if (!domElements[id]) {
      const classSet = new Set();
      domElements[id] = {
        id,
        classList: {
          add: (...cls) => cls.forEach(c => classSet.add(c)),
          remove: (...cls) => cls.forEach(c => classSet.delete(c)),
          contains: c => classSet.has(c),
          toggle: (c, force) => {
            if (force === undefined) {
              if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
            } else if (force) classSet.add(c);
            else classSet.delete(c);
          }
        },
        style: {
          removeProperty: p => { delete domElements[id].style[p]; }
        },
        textContent: '',
        children: [],
        addEventListener() {},
        querySelectorAll: () => []
      };
    }
    return domElements[id];
  },
  querySelector: sel => (sel.startsWith('#') ? global.document.getElementById(sel.slice(1)) : null),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Modules
eval(fs.readFileSync(path.join(__dirname, '../js/progressManager.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameResultModal.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '../js/gameEngine.js'), 'utf-8'));

console.log('🧪 Starting test_revive_accuracy_consistency.js...');

// --- TEST 1: Revive keeps correctWords & attempts accumulated ---
console.log('\n--- TEST 1: Revive preserves correct/attempt stats without reset ---');
window.openGameScreen('u1_node-review', [
  { id: 'w1', word: 'hola', meaning: '안녕' },
  { id: 'w2', word: 'gracias', meaning: '감사' },
  { id: 'w3', word: 'amigo', meaning: '친구' }
]);
window.isReviewGameMode = true;
window.isRoadmapReviewSpeedrun = true;
window.currentReviewUnitNumber = 1;
window.currentReviewNodeId = 'u1_node-review';

// Answer w1 correctly
window.handleChoiceClick(null, '안녕');
assert.strictEqual(window.correctWords.length, 1, '1 correct answer recorded');
assert.strictEqual(window.totalAttemptCount, 1, '1 attempt recorded');

// Advance timer to question 2
window.spawnQuestion(1);

// Answer w2 wrong -> trigger game over (hearts depleted simulation)
window.decreaseHeart = () => 0; // deplete hearts
window.handleChoiceClick(null, '틀린답');
assert.strictEqual(window.missedWords.length, 1, '1 wrong answer recorded');
assert.strictEqual(window.totalAttemptCount, 2, '2 attempts recorded');
assert.strictEqual(window.correctWords.length, 1, 'correctWords preserved after game over');

// Click Ad Revive
window.reviveGameWithAd();
assert.strictEqual(window.correctWords.length, 1, 'correctWords must NOT be reset on revive');
assert.strictEqual(window.missedWords.length, 1, 'missedWords must NOT be reset on revive');
assert.strictEqual(window.totalAttemptCount, 2, 'totalAttemptCount must NOT be reset on revive');
assert.strictEqual(window.userHearts, 3, 'Hearts recharged to 3');
console.log('✅ PASS: Stats strictly preserved on revive');

// --- TEST 2: Finish after revive yields valid accuracy & SUCCESS result modal ---
console.log('\n--- TEST 2: Finish after revive yields valid accuracy & SUCCESS result modal ---');
// Answer remaining question w2 correctly after revive
window.handleChoiceClick(null, '감사');
assert.strictEqual(window.correctWords.length, 2, '2 correct answers recorded');
assert.strictEqual(window.totalAttemptCount, 3, '3 attempts recorded');

// Spawn and answer w3 correctly
window.spawnQuestion(2);
window.handleChoiceClick(null, '친구');
assert.strictEqual(window.correctWords.length, 3, '3 correct answers recorded');
assert.strictEqual(window.totalAttemptCount, 4, '4 attempts recorded (3 correct / 1 wrong = 75%)');

// Finish game stage (isClear = true)
window.finishGameStage(true);

const resultTitle = document.getElementById('result-title');
const resultSubtitle = document.getElementById('result-subtitle');
const resultAcc = document.getElementById('result-accuracy-text');
const btnPrimaryText = document.getElementById('btn-result-primary-text');

assert.strictEqual(resultTitle.textContent, '⚡ 약점 복습 완료!', 'Title must be review complete, not failed');
assert.strictEqual(resultSubtitle.textContent, '핵심 단어 복습을 성공적으로 마쳤습니다! 👏', 'Subtitle must indicate success');
assert.strictEqual(btnPrimaryText.textContent, '다음 스테이지 이동 ▶', 'Next stage button must be displayed');
assert(parseInt(resultAcc.textContent, 10) >= 50, 'Accuracy must be at least 50% on clear');
assert.strictEqual(window.lastEarnedStars >= 1, true, 'At least 1 star earned on clear');
console.log(`✅ PASS: Result modal renders success with accuracy ${resultAcc.textContent} and ${window.lastEarnedStars} star(s)`);

// --- TEST 3: Single Source of Truth: Review completion & Stage 3 unlock ---
console.log('\n--- TEST 3: Review completion & Stage 3 unlock consistency ---');
// Click next stage button
const btnNext = document.getElementById('btn-next-stage');
btnNext.onclick({ preventDefault() {}, stopPropagation() {} });

assert.strictEqual(window.isReviewCompleted('u1_node-review', 1), true, 'Review node must be marked completed');
assert.strictEqual(window.isNodeUnlocked(0, 4, 'node-3'), true, 'Stage 3 (node-3) must be unlocked');
console.log('✅ PASS: Review completed and Stage 3 unlocked consistently');

// --- TEST 4: Real Game Over (Refusal to revive / Exit) preserves Locked state ---
console.log('\n--- TEST 4: Real Game Over (exit without clear) does NOT unlock Stage 3 ---');
// Reset progress for Unit 2 review test
window.openGameScreen('u2_node-review', [
  { id: 'w10', word: 'sol', meaning: '태양' }
]);
window.isReviewGameMode = true;
window.isRoadmapReviewSpeedrun = true;
window.currentReviewUnitNumber = 2;
window.currentReviewNodeId = 'u2_node-review';

// Trigger genuine Game Over without clearing
window.triggerGameOver();

const overCard = document.getElementById('game-result-gameover-card');
assert.strictEqual(overCard.classList.contains('hidden'), false, 'Game over card must be visible on genuine failure');
assert.strictEqual(window.isReviewNodeCompleted('u2_node-review', 2), false, 'Unit 2 review must NOT be completed on fail');
console.log('✅ PASS: Real failure does not contaminate progress or prematurely unlock next stage');

console.log('\n🎉 ALL TESTS IN test_revive_accuracy_consistency.js PASSED PERFECTLY! 🚀');
