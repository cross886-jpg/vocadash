// ==============================================================================
// VocaDash - 스페인 축구 실전팩 (Official Pack: pack_football)
// 스페인 현지 경기장 & 피치 콜 필수 어휘 및 실전 문장 (총 60종, 4 Units)
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
    id: "pack_football",
    courseId: "pack_football",
    title: "스페인 축구 실전팩",
    name: "스페인 축구 실전팩",
    courseName: "스페인 축구 실전팩",
    desc: "스페인 현지 경기장 & 피치 콜 필수 어휘 및 실전 문장",
    description: "스페인 현지 경기장 & 피치 콜 필수 어휘 및 실전 문장",
    badge: "⚽ 스페셜 팩",
    icon: "⚽",
    totalUnits: 4,
    units: [
      {
        unitId: 1,
        unitNumber: 1,
        id: 1,
        unit: 1,
        title: "Unit 1. 포지션 & 경기장 필수 어휘",
        desc: "골키퍼부터 공격수, 피치 구석구석 명칭",
        subtitle: "골키퍼부터 공격수, 피치 구석구석 명칭",
        words: [
          { id: "fb_101", word: "portero", pronunciation: "포르테로", meaning: "골키퍼" },
          { id: "fb_102", word: "defensa", pronunciation: "데펜사", meaning: "수비수" },
          { id: "fb_103", word: "centrocampista", pronunciation: "센트로캄피스타", meaning: "미드필더" },
          { id: "fb_104", word: "delantero", pronunciation: "델란테로", meaning: "공격수" },
          { id: "fb_105", word: "capitán", pronunciation: "카피탄", meaning: "주장" },
          { id: "fb_106", word: "entrenador", pronunciation: "엔트레나도르", meaning: "감독 / 코치" },
          { id: "fb_107", word: "árbitro", pronunciation: "아르비트로", meaning: "심판" },
          { id: "fb_108", word: "banquillo", pronunciation: "반키요", meaning: "벤치 / 후보석" },
          { id: "fb_109", word: "titular", pronunciation: "티툴라르", meaning: "선발 선수" },
          { id: "fb_110", word: "suplente", pronunciation: "수플렌테", meaning: "교체 선수" },
          { id: "fb_111", word: "campo", pronunciation: "캄포", meaning: "경기장 / 피치" },
          { id: "fb_112", word: "portería", pronunciation: "포르테리아", meaning: "골대 / 골문" },
          { id: "fb_113", word: "línea", pronunciation: "리네아", meaning: "터치라인 / 선" },
          { id: "fb_114", word: "área", pronunciation: "아레아", meaning: "페널티 박스" },
          { id: "fb_115", word: "vestuario", pronunciation: "베스투아리오", meaning: "라커룸" }
        ],
        nodes: [
          { id: "fb_1_n1", type: "stage", title: "1과: 포지션 핵심", stageNumber: 1, wordIds: ["fb_101", "fb_102", "fb_103", "fb_104", "fb_105", "fb_106", "fb_107", "fb_108"] },
          { id: "fb_1_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_1_n3", type: "stage", title: "2과: 경기장 시설", stageNumber: 2, wordIds: ["fb_109", "fb_110", "fb_111", "fb_112", "fb_113", "fb_114", "fb_115"] },
          { id: "fb_1_n4", type: "sentence", title: "핵심 문장", targetSentence: "El delantero marca un gol.", meaning: "공격수가 골을 넣는다." },
          { id: "fb_1_n5", type: "review", title: "약점 복습" },
          { id: "fb_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        unitId: 2,
        unitNumber: 2,
        id: 2,
        unit: 2,
        title: "Unit 2. 패스, 슛 & 경기 기본 액션",
        desc: "패스, 킥, 드리블과 경기 필수 동작",
        subtitle: "패스, 킥, 드리블과 경기 필수 동작",
        words: [
          { id: "fb_201", word: "pasar", pronunciation: "파사르", meaning: "패스하다" },
          { id: "fb_202", word: "tirar", pronunciation: "티라르", meaning: "슛하다" },
          { id: "fb_203", word: "centrar", pronunciation: "센트라르", meaning: "크로스를 올리다" },
          { id: "fb_204", word: "regatear", pronunciation: "레가테아르", meaning: "드리블 돌파하다" },
          { id: "fb_205", word: "presionar", pronunciation: "프레시오나르", meaning: "압박하다" },
          { id: "fb_206", word: "marcar", pronunciation: "마르카르", meaning: "골을 넣다 / 대인마크하다" },
          { id: "fb_207", word: "despejar", pronunciation: "데스페하르", meaning: "걷어내다 / 클리어링" },
          { id: "fb_208", word: "córner", pronunciation: "코르네르", meaning: "코너킥" },
          { id: "fb_209", word: "falta", pronunciation: "팔타", meaning: "파울" },
          { id: "fb_210", word: "penalti", pronunciation: "페날티", meaning: "페널티킥" },
          { id: "fb_211", word: "saque de banda", pronunciation: "사케 데 반다", meaning: "스로인" },
          { id: "fb_212", word: "fuera de juego", pronunciation: "푸에라 데 후에고", meaning: "오프사이드" },
          { id: "fb_213", word: "tarjeta amarilla", pronunciation: "타르헤타 아마리야", meaning: "옐로카드" },
          { id: "fb_214", word: "tarjeta roja", pronunciation: "타르헤타 로하", meaning: "레드카드" },
          { id: "fb_215", word: "balón", pronunciation: "발론", meaning: "축구공" }
        ],
        nodes: [
          { id: "fb_2_n1", type: "stage", title: "1과: 킥 & 패스 액션", stageNumber: 1, wordIds: ["fb_201", "fb_202", "fb_203", "fb_204", "fb_205", "fb_206", "fb_207", "fb_208"] },
          { id: "fb_2_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_2_n3", type: "stage", title: "2과: 판정과 세트피스", stageNumber: 2, wordIds: ["fb_209", "fb_210", "fb_211", "fb_212", "fb_213", "fb_214", "fb_215"] },
          { id: "fb_2_n4", type: "sentence", title: "핵심 문장", targetSentence: "Pasa el balón rápido.", meaning: "공을 빠르게 패스해." },
          { id: "fb_2_n5", type: "review", title: "약점 복습" },
          { id: "fb_2_n6", type: "boss", title: "Unit 2 보스전" }
        ]
      },
      {
        unitId: 3,
        unitNumber: 3,
        id: 3,
        unit: 3,
        title: "Unit 3. 피치 위 실전 콜 & 팀 소통",
        desc: "경기 중 선수들끼리 1초 만에 외치는 필수 구호",
        subtitle: "경기 중 선수들끼리 1초 만에 외치는 필수 구호",
        words: [
          { id: "fb_301", word: "¡Solo!", pronunciation: "솔로!", meaning: "혼자야! (뒤에 수비 없어!)" },
          { id: "fb_302", word: "¡Voy!", pronunciation: "보이!", meaning: "내가 갈게! (내 공이야!)" },
          { id: "fb_303", word: "¡Mía!", pronunciation: "미아!", meaning: "내 거야! (골키퍼/공 처리 콜)" },
          { id: "fb_304", word: "¡Pasa!", pronunciation: "파사!", meaning: "패스해! (공 줘!)" },
          { id: "fb_305", word: "¡Tira!", pronunciation: "티라!", meaning: "때려! (슛해!)" },
          { id: "fb_306", word: "¡Cuidado!", pronunciation: "쿠이다도!", meaning: "조심해! (상대 온다!)" },
          { id: "fb_307", word: "¡Hombre!", pronunciation: "옴브레!", meaning: "뒤에 사람 붙었어!" },
          { id: "fb_308", word: "¡Gira!", pronunciation: "히라!", meaning: "돌아서! (몸 돌려도 돼!)" },
          { id: "fb_309", word: "¡Cara!", pronunciation: "카라!", meaning: "정면 봐! (앞으로 돌아서!)" },
          { id: "fb_310", word: "¡Salimos!", pronunciation: "살리모스!", meaning: "라인 올려! (나가자!)" },
          { id: "fb_311", word: "¡Baja!", pronunciation: "바하!", meaning: "내려와! (수비 복귀해!)" },
          { id: "fb_312", word: "¡Presión!", pronunciation: "프레시온!", meaning: "압박해! (바짝 붙어!)" },
          { id: "fb_313", word: "¡Cambio de banda!", pronunciation: "캄비오 데 반다!", meaning: "반대쪽으로 전환해!" },
          { id: "fb_314", word: "¡Una más!", pronunciation: "우나 마스!", meaning: "한 번 더! / 한 골 더!" },
          { id: "fb_315", word: "¡Vamos!", pronunciation: "바모스!", meaning: "가자! / 파이팅!" }
        ],
        nodes: [
          { id: "fb_3_n1", type: "stage", title: "1과: 즉시 외치는 구호", stageNumber: 1, wordIds: ["fb_301", "fb_302", "fb_303", "fb_304", "fb_305", "fb_306", "fb_307", "fb_308"] },
          { id: "fb_3_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_3_n3", type: "stage", title: "2과: 전술 전환 콜", stageNumber: 2, wordIds: ["fb_309", "fb_310", "fb_311", "fb_312", "fb_313", "fb_314", "fb_315"] },
          { id: "fb_3_n4", type: "sentence", title: "핵심 문장", targetSentence: "¡Gira y juega con la banda!", meaning: "돌아서서 사이드로 연결해!" },
          { id: "fb_3_n5", type: "review", title: "약점 복습" },
          { id: "fb_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      },
      {
        unitId: 4,
        unitNumber: 4,
        id: 4,
        unit: 4,
        title: "Unit 4. 전술 지시 & 훈련 필수 문장",
        desc: "감독 지시와 실전 전술 상황 문장",
        subtitle: "감독 지시와 실전 전술 상황 문장",
        words: [
          { id: "fb_401", word: "Juega fácil", pronunciation: "후에가 파실", meaning: "쉽게 쉽게 플레이해" },
          { id: "fb_402", word: "Dame la pared", pronunciation: "다메 라 파레드", meaning: "원투(벽패스) 주고받자" },
          { id: "fb_403", word: "Balón al espacio", pronunciation: "발론 알 에스파시오", meaning: "공간으로 찔러줘" },
          { id: "fb_404", word: "Al primer toque", pronunciation: "알 프리메르 토케", meaning: "원터치로 때려/돌려" },
          { id: "fb_405", word: "Cierra la línea", pronunciation: "시에라 라 리네아", meaning: "라인 좁혀 / 틈 주지 마" },
          { id: "fb_406", word: "Cambia el juego", pronunciation: "캄비아 엘 후에고", meaning: "반대로 벌려줘 (플레이 전환)" },
          { id: "fb_407", word: "Abre el campo", pronunciation: "아브레 엘 캄포", meaning: "넓게 벌려 (측면 활용)" },
          { id: "fb_408", word: "Atento al rechace", pronunciation: "아텐토 알 레차세", meaning: "세컨드볼 집중해" },
          { id: "fb_409", word: "Gana la espalda", pronunciation: "가나 라 에스팔다", meaning: "수비 뒷공간 파고들어" },
          { id: "fb_410", word: "Mantén la posesión", pronunciation: "만텐 라 포세시온", meaning: "볼 소유권 지켜 (돌려)" },
          { id: "fb_411", word: "Haz la cobertura", pronunciation: "아스 라 코베르투라", meaning: "커버플레이 들어가" },
          { id: "fb_412", word: "Saque de esquina", pronunciation: "사케 데 에스키나", meaning: "코너킥 상황" },
          { id: "fb_413", word: "Tiempo de descuento", pronunciation: "티엠포 데 데스쿠엔토", meaning: "추가 시간" },
          { id: "fb_414", word: "Calienta en la banda", pronunciation: "칼리엔타 엔 라 반다", meaning: "사이드에서 몸 풀어" },
          { id: "fb_415", word: "Buen pase", pronunciation: "부에노 파세", meaning: "굿 패스! (나이스 패스)" }
        ],
        nodes: [
          { id: "fb_4_n1", type: "stage", title: "1과: 빌드업과 패스 전술", stageNumber: 1, wordIds: ["fb_401", "fb_402", "fb_403", "fb_404", "fb_405", "fb_406", "fb_407", "fb_408"] },
          { id: "fb_4_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_4_n3", type: "stage", title: "2과: 실전 전술 지시", stageNumber: 2, wordIds: ["fb_409", "fb_410", "fb_411", "fb_412", "fb_413", "fb_414", "fb_415"] },
          { id: "fb_4_n4", type: "sentence", title: "핵심 문장", targetSentence: "Hay que presionar arriba.", meaning: "앞에서부터 강하게 압박해야 해." },
          { id: "fb_4_n5", type: "review", title: "약점 복습" },
          { id: "fb_4_n6", type: "boss", title: "Unit 4 보스전" }
        ]
      }
    ],
    lessons: {
      'node-1': {
        title: '1과: 포지션 & 경기장 필수 어휘',
        desc: '골키퍼, 수비수, 미드필더, 공격수 등 그라운드 위 핵심 포지션 어휘 마스터!',
        icon: '⚽',
        level: '기초',
        category: '포지션',
        tags: ['축구', '포지션', '경기장']
      },
      'node-2': {
        title: '2과: 패스, 슛 & 경기 기본 액션',
        desc: '패스, 킥, 드리블과 경기 필수 동작과 판정 어휘 마스터!',
        icon: '🏃',
        level: '초급',
        category: '액션',
        tags: ['축구', '패스', '슛']
      },
      'node-3': {
        title: '3과: 피치 위 실전 콜 & 팀 소통',
        desc: '경기 중 선수들끼리 1초 만에 외치는 필수 구호와 전술 콜사인!',
        icon: '🗣️',
        level: '중급',
        category: '피치콜',
        tags: ['축구', '구호', '소통']
      },
      'node-boss': {
        title: '4과: 전술 지시 & 훈련 필수 문장',
        desc: '감독 지시와 실전 전술 상황 문장 총정리 & 챔피언 특별 보상!',
        icon: '👑',
        level: '보스전',
        category: '보스전',
        tags: ['축구', '전술', '보스전']
      }
    }
  };

  // 단어 ID 기반 맵 헬퍼 생성 및 양방향 속성(word/term, pronunciation/pron) 정규화
  const wordMap = {};
  packFootballData.units.forEach(u => {
    u.id = u.unitId;
    u.unit = u.unitNumber;
    u.subtitle = u.desc;
    u.words.forEach(w => {
      w.term = w.word;
      w.pron = w.pronunciation;
      w.phonetic = `[${w.pronunciation}]`;
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
