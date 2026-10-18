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
    icon: "⚽",
    badge: "스페셜 팩",
    description: "스페인 현지 경기장과 훈련장에서 바로 쓰는 필수 축구 어휘 & 피치 콜",
    units: [
      {
        id: 1,
        unit: 1,
        title: "Unit 1. 포지션 & 경기장",
        subtitle: "포지션, 심판, 경기장, 골대, 오프사이드",
        icon: "⚽",
        words: [
          { id: "fb_u1_w1", term: "portero", meaning: "골키퍼", pron: "포르테로" },
          { id: "fb_u1_w2", term: "defensa", meaning: "수비수", pron: "데펜사" },
          { id: "fb_u1_w3", term: "centrocampista", meaning: "미드필더", pron: "센트로캄피스타" },
          { id: "fb_u1_w4", term: "delantero", meaning: "공격수", pron: "델란테로" },
          { id: "fb_u1_w5", term: "árbitro", meaning: "심판", pron: "아르비트로" },
          { id: "fb_u1_w6", term: "entrenador", meaning: "감독 / 코치", pron: "엔트레나도르" },
          { id: "fb_u1_w7", term: "campo", meaning: "축구장 / 경기장", pron: "캄포" },
          { id: "fb_u1_w8", term: "portería", meaning: "골대", pron: "포르테리아" },
          { id: "fb_u1_w9", term: "banquillo", meaning: "교체 벤치", pron: "반키요" },
          { id: "fb_u1_w10", term: "fuera de juego", meaning: "오프사이드", pron: "푸에라 데 후에고" },
          { id: "fb_u1_w11", term: "saque de banda", meaning: "스로인", pron: "사케 데 반다" },
          { id: "fb_u1_w12", term: "córner", meaning: "코너킥", pron: "코르네르" }
        ],
        nodes: [
          { id: "fb_1_1", type: "stage", title: "포지션", stageNumber: 1, wordIds: ["fb_u1_w1","fb_u1_w2","fb_u1_w3","fb_u1_w4","fb_u1_w5","fb_u1_w6"] },
          { id: "fb_1_bonus", type: "bonus", title: "보너스", rewardGems: 15 },
          { id: "fb_1_2", type: "stage", title: "경기장", stageNumber: 2, wordIds: ["fb_u1_w7","fb_u1_w8","fb_u1_w9","fb_u1_w10","fb_u1_w11","fb_u1_w12"] },
          { id: "fb_1_sentence", type: "sentence", title: "문장", targetSentence: "El delantero marca un gol.", meaning: "공격수가 골을 넣는다." },
          { id: "fb_1_review", type: "review", title: "약점 복습" },
          { id: "fb_1_boss", type: "boss", title: "보스전" }
        ]
      },
      {
        id: 2,
        unit: 2,
        title: "Unit 2. 패스, 슛 & 경기 액션",
        subtitle: "패스, 슛, 크로스, 파울, 카드, 선방",
        icon: "🏃",
        words: [
          { id: "fb_u2_w1", term: "pasar", meaning: "패스하다", pron: "파사르" },
          { id: "fb_u2_w2", term: "tirar", meaning: "슛하다", pron: "티라르" },
          { id: "fb_u2_w3", term: "centrar", meaning: "크로스 올리다", pron: "센트라르" },
          { id: "fb_u2_w4", term: "regatear", meaning: "드리블(돌파)하다", pron: "레가테아르" },
          { id: "fb_u2_w5", term: "despejar", meaning: "걷어내다(클리어링)", pron: "데스페하르" },
          { id: "fb_u2_w6", term: "rematar", meaning: "마무리 슛/헤더하다", pron: "레마타르" },
          { id: "fb_u2_w7", term: "falta", meaning: "반칙 / 파울", pron: "팔타" },
          { id: "fb_u2_w8", term: "tarjeta amarilla", meaning: "경고 (옐로카드)", pron: "타르헤타 아마리야" },
          { id: "fb_u2_w9", term: "tarjeta roja", meaning: "퇴장 (레드카드)", pron: "타르헤타 로하" },
          { id: "fb_u2_w10", term: "penalti", meaning: "페널티킥", pron: "페날티" },
          { id: "fb_u2_w11", term: "asistencia", meaning: "어시스트 / 도움", pron: "아시스텐시아" },
          { id: "fb_u2_w12", term: "parada", meaning: "선방 (골키퍼 세이브)", pron: "파라다" }
        ],
        nodes: [
          { id: "fb_2_1", type: "stage", title: "패스와 슛", stageNumber: 1, wordIds: ["fb_u2_w1","fb_u2_w2","fb_u2_w3","fb_u2_w4","fb_u2_w5","fb_u2_w6"] },
          { id: "fb_2_bonus", type: "bonus", title: "보너스", rewardGems: 15 },
          { id: "fb_2_2", type: "stage", title: "판정과 수비", stageNumber: 2, wordIds: ["fb_u2_w7","fb_u2_w8","fb_u2_w9","fb_u2_w10","fb_u2_w11","fb_u2_w12"] },
          { id: "fb_2_sentence", type: "sentence", title: "문장", targetSentence: "Pasa el balón rápido.", meaning: "공을 빠르게 패스해." },
          { id: "fb_2_review", type: "review", title: "약점 복습" },
          { id: "fb_2_boss", type: "boss", title: "보스전" }
        ]
      },
      {
        id: 3,
        unit: 3,
        title: "Unit 3. 전술 & 포메이션",
        subtitle: "압박, 역습, 점유율, 라인, 간격, 2대1 패스",
        icon: "📋",
        words: [
          { id: "fb_u3_w1", term: "presión", meaning: "압박 (프레싱)", pron: "프레시온" },
          { id: "fb_u3_w2", term: "contraataque", meaning: "역습 (카운터어택)", pron: "콘트라아타케" },
          { id: "fb_u3_w3", term: "posesión", meaning: "볼 점유", pron: "포세시온" },
          { id: "fb_u3_w4", term: "línea", meaning: "수비/미드필드 라인", pron: "리네아" },
          { id: "fb_u3_w5", term: "bascular", meaning: "좌우 간격 이동/커버", pron: "바스쿨라르" },
          { id: "fb_u3_w6", term: "repliegue", meaning: "수비 전환/복귀", pron: "레플리에게" },
          { id: "fb_u3_w7", term: "cambio de juego", meaning: "반대 전환 패스", pron: "캄비오 데 후에고" },
          { id: "fb_u3_w8", term: "pared", meaning: "원투 패스 (2대1)", pron: "파레드" },
          { id: "fb_u3_w9", term: "espacio", meaning: "빈 공간", pron: "에스파시오" },
          { id: "fb_u3_w10", term: "marca", meaning: "대인 마크", pron: "마르카" },
          { id: "fb_u3_w11", term: "desmarque", meaning: "수비 따돌리기(움직임)", pron: "데스마르케" },
          { id: "fb_u3_w12", term: "táctica", meaning: "전술", pron: "탁티카" }
        ],
        nodes: [
          { id: "fb_3_1", type: "stage", title: "전술 기초", stageNumber: 1, wordIds: ["fb_u3_w1","fb_u3_w2","fb_u3_w3","fb_u3_w4","fb_u3_w5","fb_u3_w6"] },
          { id: "fb_3_bonus", type: "bonus", title: "보너스", rewardGems: 15 },
          { id: "fb_3_2", type: "stage", title: "공간 창출", stageNumber: 2, wordIds: ["fb_u3_w7","fb_u3_w8","fb_u3_w9","fb_u3_w10","fb_u3_w11","fb_u3_w12"] },
          { id: "fb_3_sentence", type: "sentence", title: "문장", targetSentence: "Hay que presionar arriba.", meaning: "앞에서부터 강하게 압박해야 해." },
          { id: "fb_3_review", type: "review", title: "약점 복습" },
          { id: "fb_3_boss", type: "boss", title: "보스전" }
        ]
      },
      {
        id: 4,
        unit: 4,
        title: "Unit 4. 피치 위 실전 콜 (소통)",
        subtitle: "내 볼, 돌아, 앞을 봐, 조심해, 파이팅",
        icon: "🗣️",
        words: [
          { id: "fb_u4_w1", term: "¡Mía!", meaning: "내 볼! (내가 잡을게!)", pron: "미아" },
          { id: "fb_u4_w2", term: "¡Solo!", meaning: "뒤에 아무도 없어! (프리야!)", pron: "솔로" },
          { id: "fb_u4_w3", term: "¡Gira!", meaning: "돌아서! (턴해!)", pron: "히라" },
          { id: "fb_u4_w4", term: "¡Voy!", meaning: "내가 간다!", pron: "보이" },
          { id: "fb_u4_w5", term: "¡Cara!", meaning: "앞을 봐! (앞으로 전개해!)", pron: "카라" },
          { id: "fb_u4_w6", term: "¡Juega!", meaning: "패스 줘! / 플레이해!", pron: "후에가" },
          { id: "fb_u4_w7", term: "¡Cuidado!", meaning: "조심해! (뒤에 붙었어!)", pron: "쿠이다도" },
          { id: "fb_u4_w8", term: "¡Bien!", meaning: "나이스! / 잘했어!", pron: "비엔" },
          { id: "fb_u4_w9", term: "¡Ánimo!", meaning: "파이팅! / 힘내자!", pron: "아니모" },
          { id: "fb_u4_w10", term: "¡Vamos!", meaning: "가자! / 해보자!", pron: "바모스" }
        ],
        nodes: [
          { id: "fb_4_1", type: "stage", title: "필수 콜", stageNumber: 1, wordIds: ["fb_u4_w1","fb_u4_w2","fb_u4_w3","fb_u4_w4","fb_u4_w5"] },
          { id: "fb_4_bonus", type: "bonus", title: "보너스", rewardGems: 15 },
          { id: "fb_4_2", type: "stage", title: "경기 파이팅", stageNumber: 2, wordIds: ["fb_u4_w6","fb_u4_w7","fb_u4_w8","fb_u4_w9","fb_u4_w10"] },
          { id: "fb_4_sentence", type: "sentence", title: "문장", targetSentence: "¡Gira y juega con la banda!", meaning: "돌아서서 사이드로 연결해!" },
          { id: "fb_4_review", type: "review", title: "약점 복습" },
          { id: "fb_4_boss", type: "boss", title: "보스전" }
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
        title: '2과: 경기장',
        desc: '축구장, 골대, 교체 벤치, 오프사이드, 스로인, 코너킥 등 경기장 구역과 룰 명칭!',
        icon: '🏟️',
        level: '초급',
        category: '경기장',
        tags: ['축구', '경기장', '룰']
      },
      'node-3': {
        title: '3과: 실전 문장',
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
