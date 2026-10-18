// ==============================================================================
// VocaDash - 스페인 축구 실전팩 (Official Pack: pack_football)
// 스페인 현지 경기장과 훈련장에서 바로 쓰는 필수 축구 어휘 & 피치 콜
// ==============================================================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.packFootballData = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const packFootballData = {
    courseId: "pack_football",
    id: "pack_football",
    courseName: "스페인 축구 실전팩",
    name: "스페인 축구 실전팩",
    title: "스페인 축구 실전팩",
    icon: "⚽",
    badge: "스페셜 팩",
    description: "스페인 현지 경기장과 훈련장에서 바로 쓰는 필수 축구 어휘 & 피치 콜",
    units: [
      {
        id: 1,
        unit: 1,
        title: "Unit 1. 포지션 & 경기장",
        subtitle: "골키퍼부터 공격수, 축구장 구석구석 명칭",
        words: [
          { id: "fb_1_w1", term: "portero", meaning: "골키퍼", pron: "포르테로" },
          { id: "fb_1_w2", term: "defensa", meaning: "수비수", pron: "데펜사" },
          { id: "fb_1_w3", term: "centrocampista", meaning: "미드필더", pron: "센트로캄피스타" },
          { id: "fb_1_w4", term: "delantero", meaning: "공격수", pron: "델란테로" },
          { id: "fb_1_w5", term: "capitán", meaning: "주장", pron: "카피탄" },
          { id: "fb_1_w6", term: "entrenador", meaning: "감독", pron: "엔트레나도르" },
          { id: "fb_1_w7", term: "árbitro", meaning: "심판", pron: "아르비트로" },
          { id: "fb_1_w8", term: "banquillo", meaning: "벤치 / 후보석", pron: "반키요" },
          { id: "fb_1_w9", term: "titular", meaning: "선발 선수", pron: "티툴라르" },
          { id: "fb_1_w10", term: "suplente", meaning: "교체 선수", pron: "수플렌테" },
          { id: "fb_1_w11", term: "campo", meaning: "경기장 / 피치", pron: "캄포" },
          { id: "fb_1_w12", term: "portería", meaning: "골대 / 골문", pron: "포르테리아" },
          { id: "fb_1_w13", term: "línea", meaning: "라인 / 터치라인", pron: "리네아" },
          { id: "fb_1_w14", term: "área", meaning: "페널티 에어리어 / 박스", pron: "아레아" },
          { id: "fb_1_w15", term: "córner", meaning: "코너킥", pron: "코르네르" }
        ],
        nodes: [
          { id: "fb_1_n1", type: "stage", title: "1과: 포지션", stageNumber: 1, wordIds: ["fb_1_w1","fb_1_w2","fb_1_w3","fb_1_w4","fb_1_w5","fb_1_w6","fb_1_w7","fb_1_w9","fb_1_w10"] },
          { id: "fb_1_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_1_n3", type: "stage", title: "2과: 경기장 시설", stageNumber: 2, wordIds: ["fb_1_w8","fb_1_w11","fb_1_w12","fb_1_w13","fb_1_w14","fb_1_w15"] },
          { id: "fb_1_n4", type: "sentence", title: "핵심 문장", targetSentence: "El delantero marca un gol.", meaning: "공격수가 골을 넣는다." },
          { id: "fb_1_n5", type: "review", title: "약점 복습" },
          { id: "fb_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        id: 2,
        unit: 2,
        title: "Unit 2. 패스, 슛 & 경기 액션",
        subtitle: "패스, 드리블, 태클과 판정 어휘",
        words: [
          { id: "fb_2_w1", term: "pasar", meaning: "패스하다", pron: "파사르" },
          { id: "fb_2_w2", term: "tirar", meaning: "슛하다", pron: "티라르" },
          { id: "fb_2_w3", term: "centrar", meaning: "크로스 올리다", pron: "센트라르" },
          { id: "fb_2_w4", term: "regatear", meaning: "드리블하다", pron: "레가테아르" },
          { id: "fb_2_w5", term: "despejar", meaning: "걷어내다 (클리어)", pron: "데스페하르" },
          { id: "fb_2_w6", term: "rematar", meaning: "마무리 슛하다", pron: "레마타르" },
          { id: "fb_2_w7", term: "falta", meaning: "파울 / 반칙", pron: "팔타" },
          { id: "fb_2_w8", term: "tarjeta", meaning: "카드 (경고/퇴장)", pron: "타르헤타" },
          { id: "fb_2_w9", term: "penalti", meaning: "페널티킥", pron: "페날티" },
          { id: "fb_2_w10", term: "parada", meaning: "골키퍼 선방", pron: "파라다" },
          { id: "fb_2_w11", term: "asistencia", meaning: "어시스트", pron: "아시스텐시아" },
          { id: "fb_2_w12", term: "gol", meaning: "골 / 득점", pron: "골" }
        ],
        nodes: [
          { id: "fb_2_n1", type: "stage", title: "1과: 기본 킥 & 패스", stageNumber: 1, wordIds: ["fb_2_w1","fb_2_w2","fb_2_w3","fb_2_w4","fb_2_w5","fb_2_w6"] },
          { id: "fb_2_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_2_n3", type: "stage", title: "2과: 판정과 수비", stageNumber: 2, wordIds: ["fb_2_w7","fb_2_w8","fb_2_w9","fb_2_w10","fb_2_w11","fb_2_w12"] },
          { id: "fb_2_n4", type: "sentence", title: "핵심 문장", targetSentence: "Pasa el balón rápido.", meaning: "공을 빠르게 패스해." },
          { id: "fb_2_n5", type: "review", title: "약점 복습" },
          { id: "fb_2_n6", type: "boss", title: "Unit 2 보스전" }
        ]
      },
      {
        id: 3,
        unit: 3,
        title: "Unit 3. 전술 & 팀 조직",
        subtitle: "압박, 역습, 점유와 공간 전술",
        words: [
          { id: "fb_3_w1", term: "presión", meaning: "압박 (프레싱)", pron: "프레시온" },
          { id: "fb_3_w2", term: "contraataque", meaning: "역습", pron: "콘트라아타케" },
          { id: "fb_3_w3", term: "posesión", meaning: "점유율", pron: "포세시온" },
          { id: "fb_3_w4", term: "línea", meaning: "포지션 라인", pron: "리네아" },
          { id: "fb_3_w5", term: "bascular", meaning: "좌우 이동 커버", pron: "바스쿨라르" },
          { id: "fb_3_w6", term: "repliegue", meaning: "수비 복귀", pron: "레플리에게" },
          { id: "fb_3_w7", term: "espacio", meaning: "빈 공간", pron: "에스파시오" },
          { id: "fb_3_w8", term: "pared", meaning: "원투 패스 (2대1)", pron: "파레드" },
          { id: "fb_3_w9", term: "marca", meaning: "대인 마크", pron: "마르카" },
          { id: "fb_3_w10", term: "desmarque", meaning: "공간 침투 움직임", pron: "데스마르케" },
          { id: "fb_3_w11", term: "táctica", meaning: "전술", pron: "탁티카" },
          { id: "fb_3_w12", term: "estrategia", meaning: "세트피스 전략", pron: "에스트라테히아" }
        ],
        nodes: [
          { id: "fb_3_n1", type: "stage", title: "1과: 압박과 역습", stageNumber: 1, wordIds: ["fb_3_w1","fb_3_w2","fb_3_w3","fb_3_w4","fb_3_w5","fb_3_w6"] },
          { id: "fb_3_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_3_n3", type: "stage", title: "2과: 공간과 마크", stageNumber: 2, wordIds: ["fb_3_w7","fb_3_w8","fb_3_w9","fb_3_w10","fb_3_w11","fb_3_w12"] },
          { id: "fb_3_n4", type: "sentence", title: "핵심 문장", targetSentence: "Hay que presionar arriba.", meaning: "앞에서부터 강하게 압박해야 해." },
          { id: "fb_3_n5", type: "review", title: "약점 복습" },
          { id: "fb_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      },
      {
        id: 4,
        unit: 4,
        title: "Unit 4. 피치 위 실전 콜 & 소통",
        subtitle: "경기 중 선수들끼리 외치는 필수 외침",
        words: [
          { id: "fb_4_w1", term: "¡Mía!", meaning: "내 볼! (내가 잡을게)", pron: "미아" },
          { id: "fb_4_w2", term: "¡Solo!", meaning: "뒤에 아무도 없어! (프리야)", pron: "솔로" },
          { id: "fb_4_w3", term: "¡Gira!", meaning: "돌아서! (턴해)", pron: "히라" },
          { id: "fb_4_w4", term: "¡Voy!", meaning: "내가 간다!", pron: "보이" },
          { id: "fb_4_w5", term: "¡Cara!", meaning: "앞을 봐! (앞으로 전개)", pron: "카라" },
          { id: "fb_4_w6", term: "¡Juega!", meaning: "패스해! / 플레이해!", pron: "후에가" },
          { id: "fb_4_w7", term: "¡Cuidado!", meaning: "조심해! (뒤에 붙었어)", pron: "쿠이다도" },
          { id: "fb_4_w8", term: "¡Bien!", meaning: "나이스! / 잘했어!", pron: "비엔" },
          { id: "fb_4_w9", term: "¡Ánimo!", meaning: "파이팅! / 힘내자!", pron: "아니모" },
          { id: "fb_4_w10", term: "¡Vamos!", meaning: "가자! / 해보자!", pron: "바모스" }
        ],
        nodes: [
          { id: "fb_4_n1", type: "stage", title: "1과: 방향과 전환 콜", stageNumber: 1, wordIds: ["fb_4_w1","fb_4_w2","fb_4_w3","fb_4_w4","fb_4_w5"] },
          { id: "fb_4_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_4_n3", type: "stage", title: "2과: 파이팅과 피치 콜", stageNumber: 2, wordIds: ["fb_4_w6","fb_4_w7","fb_4_w8","fb_4_w9","fb_4_w10"] },
          { id: "fb_4_n4", type: "sentence", title: "핵심 문장", targetSentence: "¡Gira y juega con la banda!", meaning: "돌아서서 사이드로 연결해!" },
          { id: "fb_4_n5", type: "review", title: "약점 복습" },
          { id: "fb_4_n6", type: "boss", title: "Unit 4 보스전" }
        ]
      }
    ],
    lessons: {
      'node-1': {
        title: '1과: 포지션',
        desc: '골키퍼, 수비수, 미드필더, 공격수 등 그라운드 위 핵심 포지션 어휘 마스터!',
        icon: '⚽',
        level: '기초',
        category: '포지션',
        tags: ['축구', '포지션', '경기장']
      },
      'node-2': {
        title: '2과: 경기장 시설',
        desc: '축구장, 골대, 교체 벤치, 오프사이드, 스로인, 코너킥 등 경기장 구역과 룰 명칭!',
        icon: '🏟️',
        level: '초급',
        category: '경기장',
        tags: ['축구', '경기장', '룰']
      },
      'node-3': {
        title: '3과: 핵심 문장',
        desc: 'El delantero marca un gol. (공격수가 골을 넣는다) 등 실전 피치 표현 마스터!',
        icon: '⚽',
        level: '중급',
        category: '문장',
        tags: ['축구', '실전문장']
      },
      'node-boss': {
        title: '4과: 축구 실전팩 보스전',
        desc: 'Unit 1 실전 축구 어휘 총정리 & 챔피언 특별 보상',
        icon: '👑',
        level: '보스전',
        category: '보스전',
        tags: ['축구', '보스전']
      }
    }
  };

  // 단어 ID 기반 맵 헬퍼 생성
  const wordMap = {};
  packFootballData.units.forEach(u => {
    u.words.forEach(w => {
      wordMap[w.id] = w;
    });
  });
  packFootballData.wordMap = wordMap;

  // 전체 단어 평탄화 목록
  packFootballData.allWords = packFootballData.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {
    window.packFootballData = packFootballData;
  }

  return packFootballData;
}));
