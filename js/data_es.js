(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.courseData_es = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const courseData_es = {
    id: "es_main",
    courseId: "es_main",
    code: "es",
    name: "스페인어 정규 코스",
    courseName: "스페인어 정규 코스",
    title: "스페인어 일상 실전",
    desc: "인사, 카페/식당 주문, 길찾기부터 마트 쇼핑까지 매일 쓰는 필수 스페인어",
    badge: "🇪🇸 정규 코스",
    icon: "🇪🇸",
    flag: "🇪🇸",
    mascotImg: "assets/characters/es-study.webp?v=88",
    totalUnits: 4,
    units: [
      {
        unitId: 1,
        unitNumber: 1,
        id: 1,
        unit: 1,
        title: "Unit 1. 생존 첫걸음 & 일상 인사",
        desc: "매일 주고받는 첫인사, 감사, 사과 및 기초 숫자",
        words: [
          { id: "es_101", word: "¡Hola!", pronunciation: "올라!", meaning: "안녕하세요 / 안녕" },
          { id: "es_102", word: "Buenos días", pronunciation: "부에노스 디아스", meaning: "좋은 아침이에요" },
          { id: "es_103", word: "Buenas tardes", pronunciation: "부에나스 타르데스", meaning: "좋은 오후예요" },
          { id: "es_104", word: "Buenas noches", pronunciation: "부에나스 노체스", meaning: "좋은 밤 되세요" },
          { id: "es_105", word: "Gracias", pronunciation: "그라시아스", meaning: "감사합니다" },
          { id: "es_106", word: "Muchas gracias", pronunciation: "무차스 그라시아스", meaning: "정말 감사합니다" },
          { id: "es_107", word: "De nada", pronunciation: "데 나다", meaning: "천만에요 / 별말씀을요" },
          { id: "es_108", word: "Por favor", pronunciation: "포르 파보르", meaning: "부탁합니다 / 제발" },
          { id: "es_109", word: "Perdón", pronunciation: "페르돈", meaning: "미안해요 / 잠시만요" },
          { id: "es_110", word: "Lo siento", pronunciation: "로 시엔토", meaning: "죄송합니다" },
          { id: "es_111", word: "Mucho gusto", pronunciation: "무초 구스토", meaning: "만나서 반갑습니다" },
          { id: "es_112", word: "¡Adiós!", pronunciation: "아디오스!", meaning: "안녕히 가세요" },
          { id: "es_113", word: "Hasta luego", pronunciation: "아스타 루에고", meaning: "나중에 또 봐요" },
          { id: "es_114", word: "Sí", pronunciation: "시", meaning: "네 / 맞아요" },
          { id: "es_115", word: "No", pronunciation: "노", meaning: "아니요" },
          { id: "es_116", word: "¿Cómo estás?", pronunciation: "코모 에스타스?", meaning: "어떻게 지내?" }
        ],
        nodes: [
          { id: "es_1_n1", type: "stage", title: "1과: 첫 만남과 감사", stageNumber: 1, wordIds: ["es_101", "es_102", "es_103", "es_104", "es_105", "es_106", "es_107", "es_108"] },
          { id: "es_1_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_1_n3", type: "stage", title: "2과: 사과와 작별 인사", stageNumber: 2, wordIds: ["es_109", "es_110", "es_111", "es_112", "es_113", "es_114", "es_115", "es_116"] },
          { id: "es_1_n4", type: "sentence", title: "핵심 문장", targetSentence: "¡Hola! ¿Cómo estás? Muy bien, gracias.", meaning: "안녕! 어떻게 지내? 아주 잘 지내, 고마워." },
          { id: "es_1_n5", type: "review", title: "약점 복습" },
          { id: "es_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        unitId: 2,
        unitNumber: 2,
        id: 2,
        unit: 2,
        title: "Unit 2. 카페, 식당 & 타파스 주문",
        desc: "커피, 물, 타파스 주문과 계산서 요청하기",
        words: [
          { id: "es_201", word: "Café con leche", pronunciation: "카페 콘 레체", meaning: "카페라떼 (밀크커피)" },
          { id: "es_202", word: "Café solo", pronunciation: "카페 솔로", meaning: "에스프레소 (블랙커피)" },
          { id: "es_203", word: "Agua fría", pronunciation: "아구아 프리아", meaning: "시원한 물" },
          { id: "es_204", word: "Agua con gas", pronunciation: "아구아 콘 가스", meaning: "탄산수" },
          { id: "es_205", word: "Cerveza", pronunciation: "세르베사", meaning: "맥주" },
          { id: "es_206", word: "Tapa", pronunciation: "타파", meaning: "타파스 (작은 안주 접시)" },
          { id: "es_207", word: "Ración", pronunciation: "라시온", meaning: "1인분 요리 접시" },
          { id: "es_208", word: "Pan", pronunciation: "판", meaning: "빵" },
          { id: "es_209", word: "La carta", pronunciation: "라 카르타", meaning: "메뉴판" },
          { id: "es_210", word: "Menú del día", pronunciation: "메누 델 디아", meaning: "오늘의 세트 메뉴" },
          { id: "es_211", word: "Camarero", pronunciation: "카마레로", meaning: "웨이터 / 종업원" },
          { id: "es_212", word: "La cuenta, por favor", pronunciation: "라 쿠엔타, 포르 파보르", meaning: "계산서 주세요" },
          { id: "es_213", word: "¿Cuánto cuesta?", pronunciation: "콴토 쿠에스타?", meaning: "얼마인가요?" },
          { id: "es_214", word: "Está muy rico", pronunciation: "에스타 무이 리코", meaning: "정말 맛있어요" },
          { id: "es_215", word: "Tenedor y cuchillo", pronunciation: "테네도르 이 쿠치요", meaning: "포크와 나이프" },
          { id: "es_216", word: "Servilleta", pronunciation: "세르비예타", meaning: "냅킨 / 휴지" }
        ],
        nodes: [
          { id: "es_2_n1", type: "stage", title: "1과: 음료와 커피 주문", stageNumber: 1, wordIds: ["es_201", "es_202", "es_203", "es_204", "es_205", "es_206", "es_207", "es_208"] },
          { id: "es_2_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_2_n3", type: "stage", title: "2과: 메뉴 주문과 계산", stageNumber: 2, wordIds: ["es_209", "es_210", "es_211", "es_212", "es_213", "es_214", "es_215", "es_216"] },
          { id: "es_2_n4", type: "sentence", title: "핵심 문장", targetSentence: "Un café con leche y la cuenta, por favor.", meaning: "카페라떼 한 잔과 계산서 부탁합니다." },
          { id: "es_2_n5", type: "review", title: "약점 복습" },
          { id: "es_2_n6", type: "boss", title: "Unit 2 보스전" }
        ]
      },
      {
        unitId: 3,
        unitNumber: 3,
        id: 3,
        unit: 3,
        title: "Unit 3. 길찾기 & 대중교통",
        desc: "지하철, 버스, 택시 이용 및 방향 묻기",
        words: [
          { id: "es_301", word: "Estación de metro", pronunciation: "에스타시온 데 메트로", meaning: "지하철역" },
          { id: "es_302", word: "Parada de autobús", pronunciation: "파라다 데 아우토부스", meaning: "버스 정류장" },
          { id: "es_303", word: "Taxi", pronunciation: "탁시", meaning: "택시" },
          { id: "es_304", word: "Billete", pronunciation: "비예테", meaning: "차표 / 티켓" },
          { id: "es_305", word: "Tren", pronunciation: "트렌", meaning: "기차 / 열차" },
          { id: "es_306", word: "¿Dónde está?", pronunciation: "돈데 에스타?", meaning: "어디에 있나요?" },
          { id: "es_307", word: "A la derecha", pronunciation: "아 라 데레차", meaning: "오른쪽에" },
          { id: "es_308", word: "A la izquierda", pronunciation: "아 라 이스키에르다", meaning: "왼쪽에" },
          { id: "es_309", word: "Todo recto", pronunciation: "토도 렉토", meaning: "곧장 / 직진" },
          { id: "es_310", word: "Cerca", pronunciation: "세르카", meaning: "가까운" },
          { id: "es_311", word: "Lejos", pronunciation: "레호스", meaning: "먼 / 멀리" },
          { id: "es_312", word: "Calle", pronunciation: "카예", meaning: "길 / 거리" },
          { id: "es_313", word: "Plaza", pronunciation: "플라사", meaning: "광장" },
          { id: "es_314", word: "Entrada", pronunciation: "엔트라다", meaning: "입구" },
          { id: "es_315", word: "Salida", pronunciation: "살리다", meaning: "출구" },
          { id: "es_316", word: "El baño", pronunciation: "엘 바뇨", meaning: "화장실" }
        ],
        nodes: [
          { id: "es_3_n1", type: "stage", title: "1과: 대중교통 타기", stageNumber: 1, wordIds: ["es_301", "es_302", "es_303", "es_304", "es_305", "es_306", "es_307", "es_308"] },
          { id: "es_3_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_3_n3", type: "stage", title: "2과: 길 묻기와 방향", stageNumber: 2, wordIds: ["es_309", "es_310", "es_311", "es_312", "es_313", "es_314", "es_315", "es_316"] },
          { id: "es_3_n4", type: "sentence", title: "핵심 문장", targetSentence: "Disculpe, ¿dónde está la estación de metro más cercana?", meaning: "실례합니다, 가장 가까운 지하철역이 어디인가요?" },
          { id: "es_3_n5", type: "review", title: "약점 복습" },
          { id: "es_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      },
      {
        unitId: 4,
        unitNumber: 4,
        id: 4,
        unit: 4,
        title: "Unit 4. 마트, 쇼핑 & 결제",
        desc: "식료품 장보기, 카드 결제, 봉투와 영수증 받기",
        words: [
          { id: "es_401", word: "Supermercado", pronunciation: "수페르메르카도", meaning: "슈퍼마켓 / 마트" },
          { id: "es_402", word: "Tienda", pronunciation: "티엔다", meaning: "가게 / 매장" },
          { id: "es_403", word: "Pagar con tarjeta", pronunciation: "파가르 콘 타르헤타", meaning: "카드로 결제하다" },
          { id: "es_404", word: "En efectivo", pronunciation: "엔 에펙티보", meaning: "현금으로" },
          { id: "es_405", word: "Bolsa", pronunciation: "볼사", meaning: "비닐봉투 / 쇼핑백" },
          { id: "es_406", word: "Ticket de compra", pronunciation: "티켓 데 콤프라", meaning: "영수증" },
          { id: "es_407", word: "Cesta de compra", pronunciation: "세스타 데 콤프라", meaning: "장바구니" },
          { id: "es_408", word: "Precio", pronunciation: "프레시오", meaning: "가격" },
          { id: "es_409", word: "Caro", pronunciation: "카로", meaning: "비싼" },
          { id: "es_410", word: "Barato", pronunciation: "바라토", meaning: "저렴한 / 싼" },
          { id: "es_411", word: "Oferta", pronunciation: "오페르타", meaning: "할인 / 세일" },
          { id: "es_412", word: "Kilo", pronunciation: "킬로", meaning: "킬로그램 (kg)" },
          { id: "es_413", word: "Fruta", pronunciation: "프루타", meaning: "과일" },
          { id: "es_414", word: "Verdura", pronunciation: "베르두라", meaning: "채소 / 야채" },
          { id: "es_415", word: "Carne", pronunciation: "카르네", meaning: "고기 / 육류" },
          { id: "es_416", word: "Pescado", pronunciation: "페스카도", meaning: "생선 / 해산물" },
          { id: "es_417", word: "Leche", pronunciation: "레체", meaning: "우유" }
        ],
        nodes: [
          { id: "es_4_n1", type: "stage", title: "1과: 마트 장보기", stageNumber: 1, wordIds: ["es_401", "es_402", "es_403", "es_404", "es_405", "es_406", "es_407", "es_408"] },
          { id: "es_4_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_4_n3", type: "stage", title: "2과: 식료품과 결제", stageNumber: 2, wordIds: ["es_409", "es_410", "es_411", "es_412", "es_413", "es_414", "es_415", "es_416", "es_417"] },
          { id: "es_4_n4", type: "sentence", title: "핵심 문장", targetSentence: "¿Puedo pagar con tarjeta? Y una bolsa, por favor.", meaning: "카드로 계산할 수 있나요? 봉투 하나도 주세요." },
          { id: "es_4_n5", type: "review", title: "약점 복습" },
          { id: "es_4_n6", type: "boss", title: "Unit 4 보스전" }
        ]
      }
    ]
  };

  // 단어 ID 매핑 및 양방향 속성 정규화
  const wordMap = {};
  courseData_es.units.forEach(u => {
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
  courseData_es.wordMap = wordMap;
  courseData_es.allWords = courseData_es.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {
    window.courseData_es = courseData_es;
    window.courseData = courseData_es; // 기본 하위 호환 보장
    if (window.COURSES) {
      window.COURSES['es_main'] = courseData_es;
    }
  }

  return courseData_es;
}));
