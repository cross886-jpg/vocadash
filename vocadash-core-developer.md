---
name: vocadash-core-developer
description: VocaDash 2D 러너 퀴즈 게임 및 로드맵 시스템 유지보수, UI/UX 규격 관리, 상태 동기화 및 디버깅 가이드
---

# VocaDash Core Architecture & Rule Guide

## 1. 파일 아키텍처 및 로드맵 렌더링
- **핵심 파일 배치**:
  - `js/app.js`: 로드맵 렌더링, 모달 바텀시트, 탭 전환 및 초기화 (⚠️ `roadmap.js`는 별도로 존재하지 않으므로 로드맵 관련 작업은 반드시 `js/app.js`를 기준으로 수행할 것)
  - `js/gameEngine.js`: 인게임 러닝 루프, 문제 낙하 및 퀴즈 채점, 결과 모달 렌더링 및 스테이지 완주 처리
  - `js/navigation.js`: 화면 라우팅, 3단계 학습 파이프라인(`startStageLearningPipeline`), 메인 탭 내비게이션
  - `js/sound.js`: 고품질 듀얼 사운드 재생 엔진(Google Translate TTS CDN + Web Speech API 폴백) 및 효과음
  - `js/flashcard.js`: 단어 예습 및 오답 복습 플래시카드 덱 모듈 (동적 `onComplete` 콜백 패턴)
- **복합 키 원칙 (Composite Key)**:
  - 모든 유닛 및 스테이지 노드의 진행도(`nodeProgressMap`, `masteredWords` 등) 저장은 반드시 `u${unitId}_${nodeId}` (예: `u1_node-1`, `u2_node-boss`) 네임스페이스 규칙을 따를 것.
  - 단순 `nodeId` 단독 키를 사용할 경우 유닛 간 상태 덮어쓰기 및 승급 오류가 발생하므로 절대 금지.

## 2. 노드 모달 및 보스전 규격
- **보스 노드 규격**:
  - 보스 노드는 3회 반복이 아닌 '단판 종합 시험'이므로 모달 오픈 시 라운드 진행도 박스(0/3)를 숨김(`hidden`) 처리할 것.
  - 텍스트 줄바꿈 시 이스케이프 오류 방지를 위해 `textContent` 대신 `innerHTML`과 `<br>` 태그를 사용할 것.
- **테마/코스 아이콘**:
  - 풋볼 코스 아이콘은 🏆 트로피를 사용할 것.

## 3. TTS 음성 중복 방지
- 문제 전환 및 보기 클릭 시 이전 음성이 겹치지 않도록 `window.stopTTS()` 및 `speechSynthesis.cancel()`을 반드시 선행 호출할 것.
- 정답 선택 시 불필요한 단어 재발음을 금지하고 효과음만 정제하여 출력할 것.

## 4. 플래시카드 및 화면 전환 결합 해제 (onComplete 패턴)
- `flashcard.js` 내부에 인게임 러너(`openGameScreen`)를 직접 호출하는 코드를 하드코딩하지 말 것.
- 플래시카드 완료 후 동작은 반드시 실행 시점에 동적 콜백(`onComplete`)으로 주입받아 처리할 것:
  - **일반 스테이지 예습 (`navigation.js`)**: `openFlashcardScreen({ words, onComplete: () => openGameScreen(nodeData) })`
  - **결과창 오답 복습 (`gameEngine.js`)**: `openFlashcardScreen({ words, onComplete: () => closeFlashcardScreen() })`

## 5. 클린 코드 원칙
- 문제 해결 시 땜질용 전역 플래그(예: `isWrongWordsMiniReviewActive`, `isTmpBypassFlag` 등)나 불필요한 중복 래퍼 함수를 무분별하게 증설하지 말 것.
- 근본 원인이 되는 기존 함수와 데이터 흐름을 정밀하게 분석하여 단일 책임 원칙에 맞게 리팩터링할 것.
