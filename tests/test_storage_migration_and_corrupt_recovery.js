const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Starting test_storage_migration_and_corrupt_recovery.js...');

function createMockLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial).map(([k, v]) => [k, String(v)]));
  return {
    get length() { return store.size; },
    key(i) { return Array.from(store.keys())[i] || null; },
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

function loadStack(initialStorage) {
  const ls = createMockLocalStorage(initialStorage);
  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    parseInt,
    isNaN,
    Number,
    String,
    Array,
    Object,
    Set,
    Map,
    Boolean,
    RegExp,
    localStorage: ls,
    currentLanguage: 'es',
    currentActiveCourse: 'es',
    currentCourseId: 'es_main',
    activeCourseId: 'main'
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const load = (rel) => vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'), sandbox, { filename: rel });
  load('js/data/courseSections.js');
  load('js/settingsStore.js');
  load('js/progressManager.js');
  return { sandbox, ls };
}

// --- TEST 1: Corrupted JSON / non-JSON ("done", "{broken", "null", "123", "[1,2]") safely recovers ---
{
  const { sandbox, ls } = loadStack({
    vocadash_progress_es_main: 'done',
    vocadash_user_data: '{broken_json',
    vocadash_claimed_bonuses: 'done',
    vocadash_completed_reviews: '{"wrong":"type"}',
    vocadash_settings: 'done',
    vocadash_prog_es_main_u1_n1: 'not_a_number'
  });

  const prog = sandbox.getCourseProgress('main', 'es');
  assert.deepStrictEqual(prog.completedNodes, [], 'completedNodes must recover to []');
  assert.deepStrictEqual(prog.claimedBonuses, [], 'claimedBonuses must recover to []');
  assert.deepStrictEqual(prog.unlockedUnits, [1], 'unlockedUnits must recover to [1]');
  const repairedMain = JSON.parse(ls.getItem('vocadash_progress_es_main'));
  assert.strictEqual(typeof repairedMain, 'object', 'Malformed vocadash_progress_es_main replaced with valid JSON');
  assert.deepStrictEqual(repairedMain.completedNodes, [], 'Repaired completedNodes must be []');
  assert.strictEqual(ls.getItem('vocadash_user_data'), null, 'Malformed vocadash_user_data cleaned');
  assert.strictEqual(ls.getItem('vocadash_claimed_bonuses'), null, 'Malformed vocadash_claimed_bonuses cleaned');
  assert.strictEqual(ls.getItem('vocadash_completed_reviews'), null, 'Malformed vocadash_completed_reviews cleaned');
  assert.strictEqual(sandbox.getNodeProgress('es_1_n1', 'es', 'main').clearedCount, 0, 'Non-numeric node progress recovers to 0');
  assert.strictEqual(sandbox.isBonusClaimed('es_1_n3'), false, 'isBonusClaimed recovers safely to false');
  assert.strictEqual(sandbox.isReviewNodeCompleted('es_1_n4', 1), false, 'isReviewNodeCompleted recovers safely to false');

  const settings = sandbox.settingsStore.getSettings();
  assert.strictEqual(settings.autoPlayAudio, true, 'Settings recover safely to defaults');
  assert.strictEqual(ls.getItem('vocadash_settings'), null, 'Invalid "done" settings key cleaned');
  console.log('✅ PASS TEST 1: Corrupted JSON / "done" strings safely recovered without crash');
}

// --- TEST 2: Legacy distributed keys absorbed into standard nodeProgressMap & obsolete keys cleaned ---
{
  const { sandbox, ls } = loadStack({
    node_progress_es_main_u1_node_1: '2',
    'node_progress_es_main_u1_node-1': '3',
    'node_progress_main_node-2': '2',
    'node_progress_pack_football_u1_node-1': '3',
    'vocadash_node_progress_node-2': '3',
    'u1_stage-1': '1',
    node_progress_es_main_corrupt: 'done',
    vocadash_review_completed_node_review: 'true'
  });

  // Note: 'node_progress_es_main_u1_node-1' has 3, 'node_progress_main_node-2' has 2, 'vocadash_node_progress_node-2' has 3
  const esMainProg = JSON.parse(ls.getItem('vocadash_progress_es_main'));
  assert.strictEqual(esMainProg.nodeProgressMap['es_1_n1'], 3, 'es_1_n1 absorbed into vocadash_progress_es_main.nodeProgressMap');
  assert.strictEqual(esMainProg.nodeProgressMap['es_1_n2'], 3, 'es_1_n2 max progress absorbed into vocadash_progress_es_main.nodeProgressMap');
  assert.strictEqual(sandbox.getNodeProgress('es_1_n1', 'es', 'main').clearedCount, 3, 'getNodeProgress reflects migrated Stage 1');
  assert.strictEqual(sandbox.getNodeProgress('es_1_n2', 'es', 'main').clearedCount, 3, 'getNodeProgress reflects migrated Stage 2');

  const fbProg = JSON.parse(ls.getItem('vocadash_progress_es_pack_football'));
  assert.strictEqual(fbProg.nodeProgressMap['fb_1_n1'], 3, 'Football legacy key absorbed into vocadash_progress_es_pack_football.nodeProgressMap');

  // Obsolete legacy distributed keys removed after migration
  assert.strictEqual(ls.getItem('node_progress_es_main_u1_node-1'), null, 'Legacy node_progress_es_main_u1_node-1 cleaned');
  assert.strictEqual(ls.getItem('node_progress_main_node-2'), null, 'Legacy node_progress_main_node-2 cleaned');
  assert.strictEqual(ls.getItem('node_progress_pack_football_u1_node-1'), null, 'Legacy node_progress_pack_football_u1_node-1 cleaned');
  assert.strictEqual(ls.getItem('vocadash_node_progress_node-2'), null, 'Legacy vocadash_node_progress_node-2 cleaned');
  assert.strictEqual(ls.getItem('u1_stage-1'), null, 'Legacy u1_stage-1 cleaned');
  assert.strictEqual(ls.getItem('node_progress_es_main_corrupt'), null, 'Malformed legacy node_progress_es_main_corrupt cleaned');
  console.log('✅ PASS TEST 2: Legacy distributed keys absorbed into nodeProgressMap & obsolete keys cleaned');
}

console.log('🎉 ALL TESTS IN test_storage_migration_and_corrupt_recovery.js PASSED PERFECTLY!');
