// ==========================================
// 🛠 VocaDash 테스트 치트 툴 (debug.js - SSoT 정규 버전)
// ==========================================
(function () {
    const old = document.getElementById('debug-cheat-panel');
    if (old) old.remove();

    // 1. 치트 패널 DOM 생성
    const panel = document.createElement('div');
    panel.id = 'debug-cheat-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid #38bdf8;
        border-radius: 12px;
        padding: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; color:#38bdf8; font-size:12px; font-weight:bold; margin-bottom:4px;">
          <span>🛠 VocaDash 치트 패널</span>
          <button id="dbg-close-btn" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px;">✕</button>
        </div>
        <button id="dbg-instant-clear" style="background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
          ⚡ 스테이지 100% 퍼펙트 클리어
        </button>
        <button id="dbg-clear-40" style="background:#eab308; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
          ⚠️ 스테이지 40% 턱걸이 클리어 (+🐾1)
        </button>
        <button id="dbg-unlock-next" style="background:#6366f1; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
          🔓 다음 유닛(Unit) 정규 해금
        </button>
        <div style="display:flex; gap:4px;">
          <input id="dbg-jump-unit-input" type="number" min="1" max="250" placeholder="Unit 번호" style="width:70px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px; padding:4px 6px; font-size:11px;">
          <button id="dbg-jump-unit-btn" style="flex:1; background:#059669; color:#fff; border:none; padding:6px 8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
            🚀 특정 Unit 이동/해금
          </button>
        </div>
        <button id="dbg-add-gems" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
          [치트] 💎 보석 +100개 지급
        </button>
        <button id="dbg-max-items" style="background:#8b5cf6; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
          [치트] 🎒 아이템 풀충전 (전부 5개)
        </button>
        <button id="dbg-factory-reset" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
          💣 앱 전체 공장초기화 (Unit 1 리셋)
        </button>
    `;

    document.body.appendChild(panel);
    document.getElementById('dbg-close-btn').onclick = () => panel.remove();

    // 💡 치트 실행 시 종료 플래그 리셋 헬퍼
    const unlockFinishingFlag = () => {
        if (typeof window.resetStageFinishingFlag === 'function') {
            window.resetStageFinishingFlag();
        }
        if (typeof isStageFinishing !== 'undefined') {
            isStageFinishing = false;
        }
        window.isStageFinishing = false;
    };

    // 1. 스테이지 클리어
    const triggerStageClear = (accuracy) => {
        unlockFinishingFlag();
        if (typeof window.finishGameStage === 'function') {
            window.finishGameStage(true, accuracy);
        } else if (typeof window.onStageComplete === 'function') {
            window.onStageComplete({ clear: true, accuracy });
        } else if (typeof window.checkStageClear === 'function') {
            window.checkStageClear();
        } else {
            alert('게임 진행 화면에서 실행해주세요.');
        }
    };

    document.getElementById('dbg-instant-clear').onclick = () => triggerStageClear(100);
    document.getElementById('dbg-clear-40').onclick = () => triggerStageClear(40);

    // 2. progressManager 기반 유닛 점프 및 해금 (SSoT)
    function debugJumpToUnit(unitNumber) {
        const targetUnit = parseInt(unitNumber, 10);
        if (isNaN(targetUnit) || targetUnit < 1) {
            alert('올바른 1 이상의 Unit 번호를 입력하세요.');
            return false;
        }

        const pm = window.progressManager;
        if (!pm) {
            console.error('[치트] progressManager 객체가 로드되지 않았습니다.');
            return false;
        }

        // 1) progressManager 실제 정규 메서드로 해금
        if (typeof pm.unlockUnitsUpTo === 'function') {
            pm.unlockUnitsUpTo(targetUnit);
        } else if (typeof pm.setUnlockedUnitLevel === 'function') {
            pm.setUnlockedUnitLevel(targetUnit);
        }

        // 2) 활성 위치 변경 및 영구 저장
        if (typeof pm.setActiveLocation === 'function') {
            const curLocation = pm.getActiveLocation?.() || {};
            pm.setActiveLocation({ ...curLocation, unitNumber: targetUnit });
        }
        if (typeof pm.save === 'function') {
            pm.save();
        }

        // 3) UI 리렌더링
        if (typeof window.renderRoadmap === 'function') {
            window.renderRoadmap(targetUnit);
        } else if (typeof window.loadRoadmapUnit === 'function') {
            window.loadRoadmapUnit(targetUnit);
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`[치트] 🚀 Unit ${targetUnit} 해금 및 이동 완료!`, '🚀');
        }
        return true;
    }
    window.debugJumpToUnit = debugJumpToUnit;

    document.getElementById('dbg-jump-unit-btn').onclick = () => {
        const val = document.getElementById('dbg-jump-unit-input')?.value;
        debugJumpToUnit(val);
    };

    // 3. 다음 유닛 해금
    document.getElementById('dbg-unlock-next').onclick = () => {
        const pm = window.progressManager;
        const curUnit = pm?.getUnlockedUnitLevel?.() || pm?.getActiveLocation?.()?.unitNumber || 1;
        debugJumpToUnit(curUnit + 1);
    };

    // 4. 재화 및 아이템 치트
    document.getElementById('dbg-add-gems').onclick = () => {
        let cur = 120;
        try {
            const saved = localStorage.getItem('vocadash_gems');
            if (saved !== null) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed)) cur = parsed;
            }
        } catch (_) { }
        cur += 100;
        localStorage.setItem('vocadash_gems', String(cur));
        if (typeof window.setStoredGems === 'function') window.setStoredGems(cur);
        if (typeof window.renderShopItems === 'function') window.renderShopItems();
        if (typeof window.showToast === 'function') window.showToast(`[치트] 💎 보석 +100개 지급 (현재: ${cur}개)`, '💎');
    };

    document.getElementById('dbg-max-items').onclick = () => {
        const fullInventory = { pass: 5, freeze: 5, bomb: 5, heal: 5 };
        localStorage.setItem('vocadash_inventory', JSON.stringify(fullInventory));
        if (typeof window.saveVocaInventory === 'function') window.saveVocaInventory(fullInventory);
        if (typeof window.gameItemCounts !== 'undefined') window.gameItemCounts = { ...fullInventory };
        if (typeof window.updateItemCountUI === 'function') window.updateItemCountUI();
        if (typeof window.renderShopItems === 'function') window.renderShopItems();
        if (typeof window.showToast === 'function') window.showToast('[치트] 🎒 아이템 풀충전 완료!', '🎒');
    };

    // 5. 공장초기화 (모든 스토리지 및 전역 진행도 완전 소각)
    document.getElementById('dbg-factory-reset').onclick = () => {
        if (!confirm('⚠️ 모든 진행도와 재화가 완전히 삭제되고 Unit 1로 초기화됩니다. 계속할까요?')) return;

        localStorage.clear();
        sessionStorage.clear();

        window.currentUnitNumber = 1;
        window.currentSelectedNodeId = 'node-1';

        // 기본 아이템 복원
        try {
            localStorage.setItem('vocadash_inventory', JSON.stringify({ pass: 2, freeze: 1, bomb: 1, heal: 1 }));
            localStorage.setItem('vocadash_hearts', '5');
            localStorage.setItem('vocadash_gems', '100');
        } catch (_) { }

        window.location.reload();
    };
})();
