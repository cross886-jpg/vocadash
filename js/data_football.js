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
    desc: "스페인 현지 경기장, 피치 콜, 전술 및 라커룸 실전 어휘 총 180종",
    badge: "⚽ 스페셜 팩",
    icon: "⚽",
    totalUnits: 6,
    units: [
      {
        unitId: 1,
        unitNumber: 1,
        id: 1,
        unit: 1,
        title: "Unit 1. 포지션, 피치 & 장비",
        desc: "상세 포지션과 축구 장비 및 그라운드 명칭",
        words: [
          { id: "fb_101", word: "portero", pronunciation: "포르테로", meaning: "골키퍼" },
          { id: "fb_102", word: "central", pronunciation: "센트랄", meaning: "센터백" },
          { id: "fb_103", word: "lateral", pronunciation: "라테랄", meaning: "풀백 / 윙백" },
          { id: "fb_104", word: "pivote", pronunciation: "피보테", meaning: "수비형 미드필더" },
          { id: "fb_105", word: "centrocampista", pronunciation: "센트로캄피스타", meaning: "미드필더" },
          { id: "fb_106", word: "extremo", pronunciation: "엑스트레모", meaning: "윙어 / 측면 공격수" },
          { id: "fb_107", word: "delantero", pronunciation: "델란테로", meaning: "스트라이커 / 공격수" },
          { id: "fb_108", word: "capitán", pronunciation: "카피탄", meaning: "주장" },
          { id: "fb_109", word: "entrenador", pronunciation: "엔트레나도르", meaning: "감독 / 코치" },
          { id: "fb_110", word: "árbitro", pronunciation: "아르비트로", meaning: "주심 / 심판" },
          { id: "fb_111", word: "juez de línea", pronunciation: "후에스 데 리네아", meaning: "부심 / 선심" },
          { id: "fb_112", word: "banquillo", pronunciation: "반키요", meaning: "벤치 / 후보석" },
          { id: "fb_113", word: "titular", pronunciation: "티툴라르", meaning: "선발 선수" },
          { id: "fb_114", word: "suplente", pronunciation: "수플렌테", meaning: "교체 선수" },
          { id: "fb_115", word: "campo", pronunciation: "캄포", meaning: "경기장 / 피치" },
          { id: "fb_116", word: "portería", pronunciation: "포르테리아", meaning: "골대 / 골문" },
          { id: "fb_117", word: "área", pronunciation: "아레아", meaning: "페널티 박스" },
          { id: "fb_118", word: "botas", pronunciation: "보타스", meaning: "축구화" },
          { id: "fb_119", word: "espinilleras", pronunciation: "에스피니예라스", meaning: "정강이 보호대" },
          { id: "fb_120", word: "vestuario", pronunciation: "베스투아리오", meaning: "라커룸" },
          { id: "fb_121", word: "guantes", pronunciation: "관테스", meaning: "골키퍼 장갑" },
          { id: "fb_122", word: "camiseta", pronunciation: "카미세타", meaning: "유니폼 상의" },
          { id: "fb_123", word: "pantalón corto", pronunciation: "판탈론 코르토", meaning: "유니폼 하의" },
          { id: "fb_124", word: "medias", pronunciation: "메디아스", meaning: "축구 스타킹" },
          { id: "fb_125", word: "peto", pronunciation: "페토", meaning: "훈련용 조끼" },
          { id: "fb_126", word: "cono", pronunciation: "코노", meaning: "훈련용 콘" },
          { id: "fb_127", word: "círculo central", pronunciation: "시르쿨로 센트랄", meaning: "하프라인 중앙 원" },
          { id: "fb_128", word: "banderín", pronunciation: "반데린", meaning: "코너 플래그" },
          { id: "fb_129", word: "grada", pronunciation: "그라다", meaning: "관중석" },
          { id: "fb_130", word: "césped", pronunciation: "세스페드", meaning: "잔디" }
        ],
        nodes: [
          { id: "fb_1_n1", type: "stage", title: "1과: 포지션 라인업", stageNumber: 1, wordIds: ["fb_101", "fb_102", "fb_103", "fb_104", "fb_105", "fb_106", "fb_107", "fb_108", "fb_109", "fb_110"] },
          { id: "fb_1_n2", type: "stage", title: "2과: 피치와 기본 장비", stageNumber: 2, wordIds: ["fb_111", "fb_112", "fb_113", "fb_114", "fb_115", "fb_116", "fb_117", "fb_118", "fb_119", "fb_120"] },
          { id: "fb_1_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_1_n4", type: "review", title: "약점 복습" },
          { id: "fb_1_n5", type: "stage", title: "3과: 훈련 용품과 그라운드", stageNumber: 3, wordIds: ["fb_121", "fb_122", "fb_123", "fb_124", "fb_125", "fb_126", "fb_127", "fb_128", "fb_129", "fb_130"] },
          { id: "fb_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        unitId: 2,
        unitNumber: 2,
        id: 2,
        unit: 2,
        title: "Unit 2. 패스, 슛 & 실전 액션",
        desc: "패스, 킥, 볼 터치 기술과 판정 룰",
        words: [
          { id: "fb_201", word: "pasar", pronunciation: "파사르", meaning: "패스하다" },
          { id: "fb_202", word: "tirar", pronunciation: "티라르", meaning: "슛하다" },
          { id: "fb_203", word: "centrar", pronunciation: "센트라르", meaning: "크로스를 올리다" },
          { id: "fb_204", word: "regatear", pronunciation: "레가테아르", meaning: "드리블 돌파하다" },
          { id: "fb_205", word: "control orientado", pronunciation: "콘트롤 오리엔타도", meaning: "방향 전환 터치" },
          { id: "fb_206", word: "volea", pronunciation: "볼레아", meaning: "발리슛" },
          { id: "fb_207", word: "vaselina", pronunciation: "바셀리나", meaning: "칩슛 / 로빙슛" },
          { id: "fb_208", word: "cabezazo", pronunciation: "카베사소", meaning: "헤더 / 헤딩슛" },
          { id: "fb_209", word: "despejar", pronunciation: "데스페하르", meaning: "걷어내다 / 클리어링" },
          { id: "fb_210", word: "presionar", pronunciation: "프레시오나르", meaning: "압박하다" },
          { id: "fb_211", word: "anticipar", pronunciation: "안티시파르", meaning: "가로채다 / 예측 차단" },
          { id: "fb_212", word: "marcar", pronunciation: "마르카르", meaning: "골을 넣다 / 대인마크" },
          { id: "fb_213", word: "córner", pronunciation: "코르네르", meaning: "코너킥" },
          { id: "fb_214", word: "falta", pronunciation: "팔타", meaning: "파울 / 반칙" },
          { id: "fb_215", word: "penalti", pronunciation: "페날티", meaning: "페널티킥" },
          { id: "fb_216", word: "saque de banda", pronunciation: "사케 데 반다", meaning: "스로인" },
          { id: "fb_217", word: "fuera de juego", pronunciation: "푸에라 데 후에고", meaning: "오프사이드" },
          { id: "fb_218", word: "tarjeta amarilla", pronunciation: "타르헤타 아마리야", meaning: "옐로카드" },
          { id: "fb_219", word: "tarjeta roja", pronunciation: "타르헤타 로하", meaning: "레드카드" },
          { id: "fb_220", word: "balón", pronunciation: "발론", meaning: "축구공" },
          { id: "fb_221", word: "taconazo", pronunciation: "타코나소", meaning: "힐패스 / 힐킥" },
          { id: "fb_222", word: "parada", pronunciation: "파라다", meaning: "선방 / 세이브" },
          { id: "fb_223", word: "saque de puerta", pronunciation: "사케 데 푸에르타", meaning: "골킥" },
          { id: "fb_224", word: "barrera", pronunciation: "바레라", meaning: "수비벽" },
          { id: "fb_225", word: "pérdida", pronunciation: "페르디다", meaning: "턴오버 / 볼 뺏김" },
          { id: "fb_226", word: "recuperación", pronunciation: "레쿠페라시온", meaning: "볼 탈환 / 인터셉트" },
          { id: "fb_227", word: "asistencia", pronunciation: "아시스텐시아", meaning: "어시스트" },
          { id: "fb_228", word: "gol en propia puerta", pronunciation: "골 엔 프로피아 푸에르타", meaning: "자책골" },
          { id: "fb_229", word: "mano", pronunciation: "마노", meaning: "핸드볼 반칙" },
          { id: "fb_230", word: "pisotón", pronunciation: "피소톤", meaning: "발 밟기 파울" }
        ],
        nodes: [
          { id: "fb_2_n1", type: "stage", title: "1과: 테크닉 & 슛", stageNumber: 1, wordIds: ["fb_201", "fb_202", "fb_203", "fb_204", "fb_205", "fb_206", "fb_207", "fb_208", "fb_209", "fb_210"] },
          { id: "fb_2_n2", type: "stage", title: "2과: 판정과 세트피스", stageNumber: 2, wordIds: ["fb_211", "fb_212", "fb_213", "fb_214", "fb_215", "fb_216", "fb_217", "fb_218", "fb_219", "fb_220"] },
          { id: "fb_2_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_2_n4", type: "review", title: "약점 복습" },
          { id: "fb_2_n5", type: "stage", title: "3과: 실전 공격과 수비", stageNumber: 3, wordIds: ["fb_221", "fb_222", "fb_223", "fb_224", "fb_225", "fb_226", "fb_227", "fb_228", "fb_229", "fb_230"] },
          { id: "fb_2_n6", type: "boss", title: "Unit 2 보스전" }
        ]
      },
      {
        unitId: 3,
        unitNumber: 3,
        id: 3,
        unit: 3,
        title: "Unit 3. 피치 위 1초 긴급 콜",
        desc: "경기 중 선수들끼리 1초 만에 외치는 필수 구호",
        words: [
          { id: "fb_301", word: "¡Solo!", pronunciation: "솔로!", meaning: "혼자야! (수비 없어!)" },
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
          { id: "fb_314", word: "¡Apóyate!", pronunciation: "아포야테!", meaning: "뒤로 리턴 주고 나와!" },
          { id: "fb_315", word: "¡Fuerza!", pronunciation: "푸에르사!", meaning: "몸싸움 버텨! / 힘내!" },
          { id: "fb_316", word: "¡Sube!", pronunciation: "수베!", meaning: "오버래핑해! / 올라가!" },
          { id: "fb_317", word: "¡Llega!", pronunciation: "예가!", meaning: "끝까지 따라가!" },
          { id: "fb_318", word: "¡Déjala!", pronunciation: "데할라!", meaning: "흘려! (내버려 둬!)" },
          { id: "fb_319", word: "¡Una más!", pronunciation: "우나 마스!", meaning: "한 번 더! / 한 골 더!" },
          { id: "fb_320", word: "¡Vamos!", pronunciation: "바모스!", meaning: "가자! / 파이팅!" },
          { id: "fb_321", word: "¡Toca y vete!", pronunciation: "토카 이 베테!", meaning: "주고 들어가! (원투 러닝)" },
          { id: "fb_322", word: "¡Aguanta!", pronunciation: "아관타!", meaning: "볼 지켜! / 버텨줘!" },
          { id: "fb_323", word: "¡Pide!", pronunciation: "피데!", meaning: "콜 해! (소리 질러!)" },
          { id: "fb_324", word: "¡Juega de cara!", pronunciation: "후에가 데 카라!", meaning: "정면 보고 바로 줘!" },
          { id: "fb_325", word: "¡Aquí!", pronunciation: "아키!", meaning: "여기 있어! (나 봐!)" },
          { id: "fb_326", word: "¡Atrás!", pronunciation: "아트라스!", meaning: "백패스 줘! / 뒤에 있어!" },
          { id: "fb_327", word: "¡Mete el cuerpo!", pronunciation: "메테 엘 쿠에르포!", meaning: "몸 먼저 집어넣어!" },
          { id: "fb_328", word: "¡No te gires!", pronunciation: "노 테 히레스!", meaning: "돌지 마! (뒤에 붙었어)" },
          { id: "fb_329", word: "¡Pega!", pronunciation: "페가!", meaning: "슛 때려! / 차!" },
          { id: "fb_330", word: "¡Bravo!", pronunciation: "브라보!", meaning: "나이스! / 잘했어!" }
        ],
        nodes: [
          { id: "fb_3_n1", type: "stage", title: "1과: 즉시 반응 콜", stageNumber: 1, wordIds: ["fb_301", "fb_302", "fb_303", "fb_304", "fb_305", "fb_306", "fb_307", "fb_308", "fb_309", "fb_310"] },
          { id: "fb_3_n2", type: "stage", title: "2과: 팀 소통과 전환", stageNumber: 2, wordIds: ["fb_311", "fb_312", "fb_313", "fb_314", "fb_315", "fb_316", "fb_317", "fb_318", "fb_319", "fb_320"] },
          { id: "fb_3_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_3_n4", type: "review", title: "약점 복습" },
          { id: "fb_3_n5", type: "stage", title: "3과: 실전 연계 콜", stageNumber: 3, wordIds: ["fb_321", "fb_322", "fb_323", "fb_324", "fb_325", "fb_326", "fb_327", "fb_328", "fb_329", "fb_330"] },
          { id: "fb_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      },
      {
        unitId: 4,
        unitNumber: 4,
        id: 4,
        unit: 4,
        title: "Unit 4. 전술 지시 & 빌드업",
        desc: "감독 전술 지시와 공간 활용 문장",
        words: [
          { id: "fb_401", word: "Juega fácil", pronunciation: "후에가 파실", meaning: "쉽게 쉽게 플레이해" },
          { id: "fb_402", word: "Dame la pared", pronunciation: "다메 라 파레드", meaning: "원투(벽패스) 주고받자" },
          { id: "fb_403", word: "Balón al espacio", pronunciation: "발론 알 에스파시오", meaning: "공간으로 찔러줘" },
          { id: "fb_404", word: "Al primer toque", pronunciation: "알 프리메르 토케", meaning: "원터치로 때려/돌려" },
          { id: "fb_405", word: "Cierra la línea", pronunciation: "시에라 라 리네아", meaning: "라인 좁혀 / 틈 주지 마" },
          { id: "fb_406", word: "Cambia el juego", pronunciation: "캄비아 엘 후에고", meaning: "반대로 벌려줘 (전환)" },
          { id: "fb_407", word: "Abre el campo", pronunciation: "아브레 엘 캄포", meaning: "넓게 벌려 (측면 활용)" },
          { id: "fb_408", word: "Atento al rechace", pronunciation: "아텐토 알 레차세", meaning: "세컨드볼 집중해" },
          { id: "fb_409", word: "Gana la espalda", pronunciation: "가나 라 에스팔다", meaning: "수비 뒷공간 파고들어" },
          { id: "fb_410", word: "Mantén la posesión", pronunciation: "만텐 라 포세시온", meaning: "볼 소유권 지켜 (돌려)" },
          { id: "fb_411", word: "Haz la cobertura", pronunciation: "아스 라 코베르투라", meaning: "커버플레이 들어가" },
          { id: "fb_412", word: "Presión alta", pronunciation: "프레시온 알타", meaning: "전방 압박 / 하이프레싱" },
          { id: "fb_413", word: "Repliegue", pronunciation: "레프리에게", meaning: "수비 복귀 / 진영 재정비" },
          { id: "fb_414", word: "Bascular", pronunciation: "바스쿨라르", meaning: "공 쪽으로 함께 이동 (시프트)" },
          { id: "fb_415", word: "Temporizar", pronunciation: "템포리사르", meaning: "수비 지연시키며 기다리기" },
          { id: "fb_416", word: "Transición rápida", pronunciation: "트란시시온 라피다", meaning: "빠른 공수 전환" },
          { id: "fb_417", word: "Segundo palo", pronunciation: "세군도 팔로", meaning: "먼 쪽 골대 (파포스트)" },
          { id: "fb_418", word: "Primer palo", pronunciation: "프리메르 팔로", meaning: "가까운 쪽 골대 (니어포스트)" },
          { id: "fb_419", word: "Tiempo de descuento", pronunciation: "티엠포 데 데스쿠엔토", meaning: "추가 시간" },
          { id: "fb_420", word: "Calienta en la banda", pronunciation: "칼리엔타 엔 라 반다", meaning: "사이드에서 몸 풀어" },
          { id: "fb_421", word: "Línea de cuatro", pronunciation: "리네아 데 쿠아트 로", meaning: "포백 라인" },
          { id: "fb_422", word: "Doblar la banda", pronunciation: "도블라르 라 반다", meaning: "측면 오버래핑 나가기" },
          { id: "fb_423", word: "Pase entre líneas", pronunciation: "파세 엔트레 리네아스", meaning: "수비 라인 사이 찌르는 스루패스" },
          { id: "fb_424", word: "Salida de balón", pronunciation: "살리다 데 발론", meaning: "후방 빌드업" },
          { id: "fb_425", word: "Bloque bajo", pronunciation: "블로케 바호", meaning: "수비 라인 깊게 내린 텐백" },
          { id: "fb_426", word: "Desmarque de ruptura", pronunciation: "데스마르케 데 룹투라", meaning: "뒷공간 침투 움직임" },
          { id: "fb_427", word: "Desmarque de apoyo", pronunciation: "데스마르케 데 아포요", meaning: "받아주러 내려오는 움직임" },
          { id: "fb_428", word: "Superioridad numérica", pronunciation: "수페리오리다드 누메리카", meaning: "숫자 우위 / 수적 우세" },
          { id: "fb_429", word: "Juego directo", pronunciation: "후에고 디렉토", meaning: "다이렉트 축구 (롱볼 전술)" },
          { id: "fb_430", word: "Balón parado", pronunciation: "발론 파라도", meaning: "세트피스 상황" }
        ],
        nodes: [
          { id: "fb_4_n1", type: "stage", title: "1과: 패스 & 공간 전술", stageNumber: 1, wordIds: ["fb_401", "fb_402", "fb_403", "fb_404", "fb_405", "fb_406", "fb_407", "fb_408", "fb_409", "fb_410"] },
          { id: "fb_4_n2", type: "stage", title: "2과: 압박과 수비 조직", stageNumber: 2, wordIds: ["fb_411", "fb_412", "fb_413", "fb_414", "fb_415", "fb_416", "fb_417", "fb_418", "fb_419", "fb_420"] },
          { id: "fb_4_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_4_n4", type: "review", title: "약점 복습" },
          { id: "fb_4_n5", type: "stage", title: "3과: 빌드업 & 침투", stageNumber: 3, wordIds: ["fb_421", "fb_422", "fb_423", "fb_424", "fb_425", "fb_426", "fb_427", "fb_428", "fb_429", "fb_430"] },
          { id: "fb_4_n6", type: "boss", title: "Unit 4 보스전" }
        ]
      },
      {
        unitId: 5,
        unitNumber: 5,
        id: 5,
        unit: 5,
        title: "Unit 5. 부상, 피지컬 & 컨디션",
        desc: "실제 훈련/경기 때 발생하는 부상과 몸 상태 표현",
        words: [
          { id: "fb_501", word: "tobillo", pronunciation: "토비요", meaning: "발목" },
          { id: "fb_502", word: "rodilla", pronunciation: "로디야", meaning: "무릎" },
          { id: "fb_503", word: "gemelo", pronunciation: "헤멜로", meaning: "종아리" },
          { id: "fb_504", word: "isquio", pronunciation: "이스키오", meaning: "햄스트링" },
          { id: "fb_505", word: "abductor", pronunciation: "압둑토르", meaning: "내전근 / 사타구니" },
          { id: "fb_506", word: "cuádriceps", pronunciation: "쿠아드리셉스", meaning: "대퇴사두근 (허벅지 앞)" },
          { id: "fb_507", word: "calambre", pronunciation: "칼람브레", meaning: "쥐 (근육 경련)" },
          { id: "fb_508", word: "sobrecarga", pronunciation: "소브레카르가", meaning: "근육 뭉침 / 과부하" },
          { id: "fb_509", word: "esguince", pronunciation: "에스긴세", meaning: "염좌 / 삠" },
          { id: "fb_510", word: "golpe", pronunciation: "골페", meaning: "타박상 / 충격" },
          { id: "fb_511", word: "hielo", pronunciation: "이에로", meaning: "얼음 / 아이싱" },
          { id: "fb_512", word: "fisio", pronunciation: "피시오", meaning: "팀 닥터 / 물리치료사" },
          { id: "fb_513", word: "estiramiento", pronunciation: "에스티라미엔토", meaning: "스트레칭" },
          { id: "fb_514", word: "calentamiento", pronunciation: "칼렌타미엔토", meaning: "워밍업 / 준비운동" },
          { id: "fb_515", word: "fatiga", pronunciation: "파티가", meaning: "피로 / 탈진" },
          { id: "fb_516", word: "tocado", pronunciation: "토카도", meaning: "통증이 있는 / 잔부상" },
          { id: "fb_517", word: "venda", pronunciation: "벤다", meaning: "붕대 / 테이핑" },
          { id: "fb_518", word: "recuperación", pronunciation: "레쿠페라시온", meaning: "회복 / 재활" },
          { id: "fb_519", word: "estar en forma", pronunciation: "에스타르 엔 포르마", meaning: "컨디션이 좋다" },
          { id: "fb_520", word: "fondo físico", pronunciation: "폰도 피시코", meaning: "기초 체력 / 지구력" },
          { id: "fb_521", word: "rotura", pronunciation: "로투라", meaning: "근육 파열" },
          { id: "fb_522", word: "menisco", pronunciation: "메니스코", meaning: "반월상 연골판" },
          { id: "fb_523", word: "ligamento", pronunciation: "리가멘토", meaning: "인대" },
          { id: "fb_524", word: "baja médica", pronunciation: "바하 메디카", meaning: "부상 결장 명단" },
          { id: "fb_525", word: "alta médica", pronunciation: "알타 메디카", meaning: "부상 복귀 허가" },
          { id: "fb_526", word: "molestia", pronunciation: "몰레스티아", meaning: "뻐근함 / 불편한 통증" },
          { id: "fb_527", word: "hidratación", pronunciation: "이드라타시온", meaning: "수분 보충" },
          { id: "fb_528", word: "masaje", pronunciation: "마사헤", meaning: "마사지" },
          { id: "fb_529", word: "agujetas", pronunciation: "아구헤타스", meaning: "운동 후 근육통" },
          { id: "fb_530", word: "vendaje funcional", pronunciation: "벤다헤 푼시오날", meaning: "압박 붕대 테이핑" }
        ],
        nodes: [
          { id: "fb_5_n1", type: "stage", title: "1과: 신체 부위와 부상", stageNumber: 1, wordIds: ["fb_501", "fb_502", "fb_503", "fb_504", "fb_505", "fb_506", "fb_507", "fb_508", "fb_509", "fb_510"] },
          { id: "fb_5_n2", type: "stage", title: "2과: 치료와 피지컬 관리", stageNumber: 2, wordIds: ["fb_511", "fb_512", "fb_513", "fb_514", "fb_515", "fb_516", "fb_517", "fb_518", "fb_519", "fb_520"] },
          { id: "fb_5_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_5_n4", type: "review", title: "약점 복습" },
          { id: "fb_5_n5", type: "stage", title: "3과: 정밀 진단과 재활", stageNumber: 3, wordIds: ["fb_521", "fb_522", "fb_523", "fb_524", "fb_525", "fb_526", "fb_527", "fb_528", "fb_529", "fb_530"] },
          { id: "fb_5_n6", type: "boss", title: "Unit 5 보스전" }
        ]
      },
      {
        unitId: 6,
        unitNumber: 6,
        id: 6,
        unit: 6,
        title: "Unit 6. 멘탈, 라커룸 & 경기 피드백",
        desc: "팀 분위기를 살리는 라커룸 소통과 경기 피드백",
        words: [
          { id: "fb_601", word: "¡Ánimo!", pronunciation: "아니모!", meaning: "힘내! / 기운 내!" },
          { id: "fb_602", word: "¡No pasa nada!", pronunciation: "노 파사 나다!", meaning: "괜찮아! (실수해도 돼!)" },
          { id: "fb_603", word: "¡Cabeza arriba!", pronunciation: "카베사 아리바!", meaning: "고개 숙이지 마!" },
          { id: "fb_604", word: "¡Seguimos!", pronunciation: "세기모스!", meaning: "계속 집중하자! / 끝까지!" },
          { id: "fb_605", word: "¡Bien visto!", pronunciation: "비엔 비스토!", meaning: "나이스 시야! / 잘 봤어!" },
          { id: "fb_606", word: "¡Buena cabeza!", pronunciation: "부에나 카베사!", meaning: "침착하게 잘했어!" },
          { id: "fb_607", word: "¡Juntos!", pronunciation: "훈토스!", meaning: "하나로 뭉쳐! (원팀!)" },
          { id: "fb_608", word: "intensidad", pronunciation: "인텐시다드", meaning: "강도 / 집중력" },
          { id: "fb_609", word: "actitud", pronunciation: "악티투드", meaning: "경기 태도 / 투지" },
          { id: "fb_610", word: "charla", pronunciation: "차를라", meaning: "감독 미팅 / 라커룸 대화" },
          { id: "fb_611", word: "descanso", pronunciation: "데스칸소", meaning: "하프타임 / 휴식 시간" },
          { id: "fb_612", word: "remontar", pronunciation: "레몬타르", meaning: "역전하다" },
          { id: "fb_613", word: "empate", pronunciation: "엠파테", meaning: "무승부" },
          { id: "fb_614", word: "victoria", pronunciation: "빅토리아", meaning: "승리" },
          { id: "fb_615", word: "derrota", pronunciation: "데로타", meaning: "패배" },
          { id: "fb_616", word: "portería a cero", pronunciation: "포르테리아 아 세로", meaning: "무실점 / 클린시트" },
          { id: "fb_617", word: "MVP", pronunciation: "에메 우베 페", meaning: "경기 최우수 선수" },
          { id: "fb_618", word: "clasificación", pronunciation: "클라시피카시온", meaning: "리그 순위표" },
          { id: "fb_619", word: "tres puntos", pronunciation: "트레스 푼토스", meaning: "승점 3점" },
          { id: "fb_620", word: "buen partido", pronunciation: "부엔 파르티도", meaning: "좋은 경기 / 수고했어" },
          { id: "fb_621", word: "orgullo", pronunciation: "오르구요", meaning: "자부심 / 팀의 긍지" },
          { id: "fb_622", word: "concentración", pronunciation: "콘센트라시온", meaning: "극도의 집중" },
          { id: "fb_623", word: "compañerismo", pronunciation: "콤파녜리스모", meaning: "동료애 / 팀워크" },
          { id: "fb_624", word: "autocrítica", pronunciation: "아우토크리티카", meaning: "자기반성 / 경기 피드백" },
          { id: "fb_625", word: "entrenamiento", pronunciation: "엔트레나미엔토", meaning: "훈련 / 트레이닝" },
          { id: "fb_626", word: "rival", pronunciation: "리발", meaning: "상대 팀 / 경쟁 상대" },
          { id: "fb_627", word: "derbi", pronunciation: "데르비", meaning: "더비 매치 / 라이벌전" },
          { id: "fb_628", word: "campeonato", pronunciation: "캄페오나토", meaning: "대회 / 챔피언십" },
          { id: "fb_629", word: "trofeo", pronunciation: "트로페오", meaning: "우승컵 / 트로피" },
          { id: "fb_630", word: "a por ellos", pronunciation: "아 포르 에요스", meaning: "잡으러 가자! / 쓸어버리자!" }
        ],
        nodes: [
          { id: "fb_6_n1", type: "stage", title: "1과: 피치 멘탈 & 격려", stageNumber: 1, wordIds: ["fb_601", "fb_602", "fb_603", "fb_604", "fb_605", "fb_606", "fb_607", "fb_608", "fb_609", "fb_610"] },
          { id: "fb_6_n2", type: "stage", title: "2과: 라커룸 & 결과 리뷰", stageNumber: 2, wordIds: ["fb_611", "fb_612", "fb_613", "fb_614", "fb_615", "fb_616", "fb_617", "fb_618", "fb_619", "fb_620"] },
          { id: "fb_6_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "fb_6_n4", type: "review", title: "약점 복습" },
          { id: "fb_6_n5", type: "stage", title: "3과: 팀 스피릿 & 승리", stageNumber: 3, wordIds: ["fb_621", "fb_622", "fb_623", "fb_624", "fb_625", "fb_626", "fb_627", "fb_628", "fb_629", "fb_630"] },
          { id: "fb_6_n6", type: "boss", title: "Unit 6 보스전" }
        ]
      }
    ]
  };

  // 단어 ID 매핑 및 양방향 속성 정규화
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
  // 스페인 축구 실전팩 스테이지 세션 문제 생성기 (Unit 1~4 1:1 정밀 매칭)
  function getFootballStageSession(nodeId) {
    const fb = (typeof window !== 'undefined' && window.packFootballData) || packFootballData;
    if (!fb || !Array.isArray(fb.units) || fb.units.length === 0) return [];

    const unlockedLevel = (typeof window !== 'undefined' && typeof window.getUnlockedUnitLevel === 'function' ? window.getUnlockedUnitLevel('es') : 1) || 1;
    let targetUnit = fb.units.find(u => u.id === unlockedLevel) || fb.units[0];

    let targetNode = null;
    for (const u of fb.units) {
      const found = Array.isArray(u.nodes) ? u.nodes.find(n => n.id === nodeId) : null;
      if (found) {
        targetUnit = u;
        targetNode = found;
        break;
      }
    }

    if (!targetNode && targetUnit && Array.isArray(targetUnit.nodes)) {
      if (nodeId === 'node-1') {
        targetNode = targetUnit.nodes.find(n => n.stageNumber === 1 || n.id.endsWith('_n1'));
      } else if (nodeId === 'node-2') {
        targetNode = targetUnit.nodes.find(n => n.stageNumber === 2 || n.id.endsWith('_n2'));
      } else if (nodeId === 'node-3') {
        targetNode = targetUnit.nodes.find(n => (n.stageNumber === 3 || n.id.endsWith('_n5') || n.type === 'sentence') && !n.id.endsWith('_n4') && !n.id.includes('review'));
      } else if (nodeId === 'node-boss') {
        targetNode = targetUnit.nodes.find(n => n.type === 'boss' || n.id.endsWith('_n6'));
      }
    }

    let words = [];
    if (targetNode && Array.isArray(targetNode.wordIds) && targetNode.wordIds.length > 0) {
      const idSet = new Set(targetNode.wordIds);
      words = (targetUnit.words || []).filter(w => idSet.has(w.id));
    } else if (targetNode && (targetNode.targetSentence || targetNode.type === 'sentence')) {
      const sentObj = {
        id: targetNode.id || `fb_${targetUnit.id}_sent`,
        term: targetNode.targetSentence || '¡Vamos al partido!',
        meaning: targetNode.meaning || '경기를 시작하자!',
        pron: targetNode.pron || '',
        phonetic: targetNode.pron ? `[${targetNode.pron}]` : '',
        type: 'sentence',
        isSentence: true
      };
      words = [sentObj, ...(targetUnit.words || []).slice(0, 5)];
    } else if (nodeId === 'node-boss' || (targetNode && targetNode.type === 'boss')) {
      words = (targetUnit.words || []).slice();
    } else {
      words = (targetUnit.words || []).slice(0, 6);
    }

    if (!words || words.length === 0) return [];

    let session = [];
    const count = Math.max(10, words.length);
    for (let i = 0; i < count; i++) {
      const w = words[i % words.length];
      const isSent = Boolean(w.type === 'sentence' || w.isSentence);
      session.push({
        id: w.id || `fb-q-${i + 1}`,
        term: w.term,
        word: w.term,
        meaning: w.meaning,
        pron: w.pron || '',
        phonetic: w.phonetic || (w.pron ? `[${w.pron}]` : ''),
        exampleTarget: isSent ? w.term : `El ${w.term} está en el campo.`,
        exampleMeaning: isSent ? w.meaning : `${w.meaning}가 경기장에 있다.`,
        type: isSent ? 'sentence' : 'word',
        isSentence: isSent,
        tag: `⚽ ${targetUnit.title ? targetUnit.title.split('.')[0] : '축구 실전'}`
      });
    }
    return session;
  }

  packFootballData.getFootballStageSession = getFootballStageSession;

  if (typeof window !== 'undefined') {
    window.packFootballData = packFootballData;
    window.getFootballStageSession = getFootballStageSession;
    if (window.COURSES) {
      window.COURSES['pack_football'] = packFootballData;
    }
  }

  return packFootballData;
}));

