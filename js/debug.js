// ==========================================
// 🛠 VocaDash 테스트 치트 툴 (debug.js)
// ==========================================
(function () {
    const old = document.getElementById('debug-cheat-panel');
    if (old) old.remove();

    // 1. 화면 우측 하단에 치트 버튼 박스 생성
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
    font-family: sans-serif;
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
      🔓 다음 유닛(Unit) 강제 해금
    </button>
    <div style="display:flex; gap:4px;">
      <input id="dbg-jump-unit-input" type="number" min="1" max="250" placeholder="Gate 번호" style="width:70px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px; padding:4px 6px; font-size:11px;">
      <button id="dbg-jump-unit-btn" style="flex:1; background:#059669; color:#fff; border:none; padding:6px 8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
        🚀 특정 Gate로 이동/해금
      </button>
    </div>
    <button id="dbg-add-gems" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
      [치트] 💎 보석 +100개 지급
    </button>
    <button id="dbg-max-items" style="background:#8b5cf6; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
      [치트] 🎒 아이템 풀충전 (전부 5개)
    </button>
    <button id="dbg-reset-course" style="background:#f59e0b; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
      🔄 현재 코스 데이터만 리셋
    </button>
    <button id="dbg-factory-reset" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
      💣 앱 전체 공장초기화 (완전 리셋)
    </button>
  `;

    document.body.appendChild(panel);

    // 패널 닫기 이벤트
    document.getElementById('dbg-close-btn').onclick = () => panel.remove();

    // 💡 치트 실행 시 플래그 강제 리셋 헬퍼 (연속 클릭 차단 방지)
    const unlockFinishingFlag = () => {
        if (typeof window.resetStageFinishingFlag === 'function') {
            window.resetStageFinishingFlag();
        }
        if (typeof isStageFinishing !== 'undefined') {
            isStageFinishing = false;
        }
        window.isStageFinishing = false;
    };

    // 1. 현재 스테이지 100% 즉시 완료
    document.getElementById('dbg-instant-clear').onclick = () => {
        unlockFinishingFlag();

        if (typeof finishGameStage === 'function') {
            finishGameStage(true, 100);
        } else if (typeof window.checkStageClear === 'function') {
            window.checkStageClear();
        } else {
            alert("게임 진행 화면에서 눌러주세요.");
        }
    };

    // 🔥 2. 현재 스테이지 40% 수준으로 통과 (하트 차감 포함)
    document.getElementById('dbg-clear-40').onclick = () => {
        unlockFinishingFlag();

        // 1) 40% 클리어 시뮬레이션: 하트 2개 차감 연출
        if (typeof decreaseHeart === 'function') {
            decreaseHeart();
            decreaseHeart();
        } else if (typeof setUserHearts === 'function') {
            const curH = Number(window.userHearts) || 5;
            setUserHearts(Math.max(1, curH - 2)); // 최소 1개는 남기고 2개 차감
        }

        // 2) 게임 내부 변수(정답/오답 수 등) 조율
        if (typeof window.currentAccuracy !== 'undefined') window.currentAccuracy = 40;
        if (typeof window.gameScore !== 'undefined') window.gameScore = 40;

        // 3) 스테이지 40% 클리어 호출
        if (typeof finishGameStage === 'function') {
            finishGameStage(true, 40);
        } else if (typeof window.onStageComplete === 'function') {
            window.onStageComplete({ clear: true, accuracy: 40 });
        } else if (typeof window.checkStageClear === 'function') {
            window.checkStageClear();
        } else {
            alert("게임 진행 화면에서 눌러주세요.");
        }
    };

    // 3. 특정 Gate/Unit 번호로 점프 및 해금 함수 (SSOT: debugJumpToUnit)
    function debugJumpToUnit(unitNumber) {
        const targetUnit = parseInt(unitNumber, 10);
        if (isNaN(targetUnit) || targetUnit < 1) {
            console.warn('[치트] 유효하지 않은 유닛 번호:', unitNumber);
            return false;
        }

        const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const course = window.currentCourseId || window.activeCourseId || (lang === 'en' ? 'en_main' : 'es_main');

        // 1) 이전 유닛들 전부 클리어 처리 및 targetUnit 해금
        if (typeof unlockUnitsUpTo === 'function') {
            unlockUnitsUpTo(targetUnit, lang, course);
        } else if (typeof setUnlockedUnitLevel === 'function') {
            setUnlockedUnitLevel(targetUnit, lang, course);
        } else if (typeof window.setUnlockedUnitLevel === 'function') {
            window.setUnlockedUnitLevel(targetUnit, lang, course);
        } else {
            localStorage.setItem(`vocadash_unlocked_${lang}_${course}`, String(targetUnit));
        }

        // 2) 전역 상태 및 로드맵 가시 뷰 갱신
        window.currentUnitNumber = targetUnit;
        window.activeUnit = targetUnit;
        window.currentUnitLevel = targetUnit;
        window._currentVisibleUnitIndex = Math.max(0, targetUnit - 1);
        try {
            localStorage.setItem('vocadash_current_unit', String(targetUnit));
            localStorage.setItem('vocadash_active_unit', String(targetUnit));
            localStorage.setItem('currentUnitLevel', String(targetUnit));
            localStorage.setItem('currentUnitIndex', String(Math.max(0, targetUnit - 1)));
        } catch (_) { }

        // 3) 로드맵 UI 갱신
        if (typeof window.loadRoadmapUnit === 'function') {
            window.loadRoadmapUnit(targetUnit);
        }
        if (typeof updateRoadmapNodesUI === 'function') {
            updateRoadmapNodesUI();
        }
        if (typeof updateTopUnitBanner === 'function') {
            updateTopUnitBanner(Math.max(0, targetUnit - 1));
        }
        if (typeof renderRoadmap === 'function') {
            renderRoadmap();
        }

        // 4) 탑승권 드로어 상태 동기화
        if (typeof window.renderCourseDrawer === 'function') {
            window.renderCourseDrawer(course);
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`[치트] 🚀 Gate/Unit ${targetUnit} (으)로 이동 및 해금 완료!`, '🚀');
        }
        return true;
    }
    window.debugJumpToUnit = debugJumpToUnit;

    // 특정 Gate 점프 버튼 이벤트 바인딩
    const jumpBtn = document.getElementById('dbg-jump-unit-btn');
    if (jumpBtn) {
        jumpBtn.onclick = () => {
            const input = document.getElementById('dbg-jump-unit-input');
            const targetUnit = input ? parseInt(input.value, 10) : 1;
            if (targetUnit >= 1) {
                debugJumpToUnit(targetUnit);
            } else {
                alert('이동할 1 이상의 Gate 번호를 입력하세요.');
            }
        };
    }

    // 3. 다음 유닛/챕터 강제 해금 (이전 유닛 전체 완벽 클리어 + 다음 유닛 1번 노드 활성화)
    document.getElementById('dbg-unlock-next').onclick = () => {
        const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const course = window.currentCourseId || window.activeCourseId || (lang === 'en' ? 'en_main' : 'es_main');

        let curUnit = 1;
        if (typeof getUnlockedUnitLevel === 'function') {
            curUnit = getUnlockedUnitLevel(lang, course);
        } else if (typeof window.getUnlockedUnitLevel === 'function') {
            curUnit = window.getUnlockedUnitLevel(lang, course);
        }
        debugJumpToUnit(curUnit + 1);
    };

    // [치트] 💎 보석 +100개 지급
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
        if (typeof window.setStoredGems === 'function') {
            window.setStoredGems(cur);
        } else {
            localStorage.setItem('vocadash_gems', String(cur));
            const el = document.getElementById('header-gems-count');
            if (el) el.textContent = String(cur);
            const statsEl = document.getElementById('stats-gems-count');
            if (statsEl) statsEl.textContent = `${cur}개`;
        }
        if (typeof window.renderShopItems === 'function') {
            window.renderShopItems();
        }
        if (typeof window.showToast === 'function') {
            window.showToast(`[치트] 💎 보석 +100개 지급 완료! (현재: ${cur}개)`, '💎');
        }
    };

    // [치트] 🎒 아이템 풀충전 (전부 5개)
    document.getElementById('dbg-max-items').onclick = () => {
        const fullInventory = { pass: 5, freeze: 5, bomb: 5, heal: 5 };
        if (typeof window.saveVocaInventory === 'function') {
            window.saveVocaInventory(fullInventory);
        } else {
            try {
                localStorage.setItem('vocadash_inventory', JSON.stringify(fullInventory));
            } catch (_) { }
        }
        if (typeof window.gameItemCounts !== 'undefined') {
            window.gameItemCounts = { ...fullInventory };
        }
        if (typeof updateItemCountUI === 'function') {
            updateItemCountUI();
        }
        if (typeof window.renderShopItems === 'function') {
            window.renderShopItems();
        }
        if (typeof window.showToast === 'function') {
            window.showToast('[치트] 🎒 모든 아이템이 풀충전(5개) 되었습니다!', '🎒');
        }
    };

    // 4. 현재 코스 진행도만 초기화
    document.getElementById('dbg-reset-course').onclick = () => {
        const lang = window.currentLanguage || 'es';
        const course = window.activeCourseId || 'main';
        if (confirm(`정말 [${lang} - ${course}] 코스 진행도만 초기화할까요?`)) {
            Object.keys(localStorage).forEach(key => {
                if (key.includes(lang) && key.includes(course)) {
                    localStorage.removeItem(key);
                }
            });
            location.reload();
        }
    };

    // =========================================================================
    // 💣 [공장초기화] 앱 전체 데이터 완전 리셋 및 Unit 1 무결성 복구
    // =========================================================================
    function resetAllData() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.clear();
                localStorage.setItem('vocadash_unlocked_es_main', '1');
                localStorage.setItem('vocadash_unlocked_en_main', '1');
                localStorage.setItem('vocadash_language', 'es');
                localStorage.setItem('vocadash_selected_lang', 'es');
                localStorage.setItem('vocadash_active_course', 'main');
                localStorage.setItem('vocadash_active_course_es', 'main');
                localStorage.setItem('vocadash_active_course_en', 'main');
                localStorage.setItem('vocadash_current_unit', '1');
                localStorage.setItem('vocadash_active_unit', '1');
                localStorage.setItem('currentUnitLevel', '1');
                localStorage.setItem('currentUnitIndex', '0');
                localStorage.setItem('vocadash_inventory', JSON.stringify({ pass: 2, freeze: 1, bomb: 1, heal: 1 }));
            }
            if (typeof window.saveVocaInventory === 'function') {
                window.saveVocaInventory({ pass: 2, freeze: 1, bomb: 1, heal: 1 });
            }
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }
        } catch (_) {}

        window.currentLanguage = 'es';
        window.currentActiveCourse = 'es';
        window.activeCourseId = 'main';
        window.currentCourseId = 'main';
        window.currentUnitNumber = 1;
        window.currentUnitLevel = 1;
        window.activeUnit = 1;
        window._currentVisibleUnitIndex = 0;
        if (typeof _hasUserScrolledRoadmap !== 'undefined') {
            _hasUserScrolledRoadmap = false;
        }
        window.currentSelectedNodeId = null;
        window.currentGameLessonId = null;
        window.currentLessonId = null;
        window.nodeProgressMap = {};
        window.wrongWords = [];

        if (typeof setUnlockedUnitLevel === 'function') {
            setUnlockedUnitLevel(1, 'es', 'main');
        } else if (typeof window.setUnlockedUnitLevel === 'function') {
            window.setUnlockedUnitLevel(1, 'es', 'main');
        }
        if (typeof updateRoadmapNodesUI === 'function') {
            updateRoadmapNodesUI();
        } else if (typeof window.updateRoadmapNodesUI === 'function') {
            window.updateRoadmapNodesUI();
        }
        if (typeof updateTopUnitBanner === 'function') {
            updateTopUnitBanner(0);
        } else if (typeof window.updateTopUnitBanner === 'function') {
            window.updateTopUnitBanner(0);
        }
        if (typeof renderRoadmap === 'function') {
            renderRoadmap();
        } else if (typeof window.renderRoadmap === 'function') {
            window.renderRoadmap();
        }
        if (typeof window.focusActiveRoadmapNode === 'function') {
            window.focusActiveRoadmapNode();
        }
        if (typeof window.updateWrongWordsBadge === 'function') {
            window.updateWrongWordsBadge();
        }
        if (typeof window.updateProfileStats === 'function') {
            window.updateProfileStats();
        }
    }
    window.resetAllData = resetAllData;
    window.handleFactoryReset = resetAllData;

    function resetAllLearningStats() {
        try {
            localStorage.removeItem('vocadash_total_questions');
            localStorage.removeItem('vocadash_correct_answers');
            localStorage.removeItem('vocadash_mastered_words');
            localStorage.removeItem('vocadash_overall_accuracy');
            if (typeof window.updateProfileStats === 'function') {
                window.updateProfileStats();
            } else if (typeof window.updateStatsScreenUI === 'function') {
                window.updateStatsScreenUI();
            }
        } catch (_) { }
    }
    window.resetAllLearningStats = resetAllLearningStats;

    // 5. 앱 전체 데이터 완전 공장초기화
    document.getElementById('dbg-factory-reset').onclick = () => {
        if (confirm("⚠️ 경고: 모든 진행도, 하트, 보석 데이터가 완전히 삭제되고 Unit 1로 초기화됩니다. 계속할까요?")) {
            if (typeof window.resetAllData === 'function') {
                window.resetAllData();
            } else if (typeof window.handleFactoryReset === 'function') {
                window.handleFactoryReset();
            } else {
                resetAllLearningStats();
                localStorage.clear();
                sessionStorage.clear();
            }
            try {
                localStorage.setItem('vocadash_inventory', JSON.stringify({ pass: 2, freeze: 1, bomb: 1, heal: 1 }));
            } catch (_) { }
            if (typeof window.saveVocaInventory === 'function') {
                window.saveVocaInventory({ pass: 2, freeze: 1, bomb: 1, heal: 1 });
            }
            location.href = location.pathname;
        }
    };
})();
