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
        desc: "매일 주고받는 첫인사, 감사, 사과 및 기초 대화",
        words: [
          { id: "es_101", word: "¡Hola!", pronunciation: "올라!", meaning: "안녕하세요 / 안녕" },
          { id: "es_102", word: "Buenos días", pronunciation: "부에노스 디아스", meaning: "좋은 아침이에요" },
          { id: "es_103", word: "Buenas tardes", pronunciation: "부에나스 타르데스", meaning: "좋은 오후예요" },
          { id: "es_104", word: "Buenas noches", pronunciation: "부에나스 노체스", meaning: "좋은 밤 되세요" },
          { id: "es_105", word: "Gracias", pronunciation: "그라시아스", meaning: "감사합니다" },
          { id: "es_106", word: "Muchas gracias", pronunciation: "무차스 그라시아스", meaning: "정말 감사합니다" },
          { id: "es_107", word: "De nada", pronunciation: "데 나다", meaning: "천만에요 / 별말씀을요" },
          { id: "es_108", word: "Por favor", pronunciation: "포르 파보르", meaning: "부탁합니다 / 제발" },
          { id: "es_109", word: "Perdón", pronunciation: "페르돈", meaning: "미안해요 / 실례합니다" },
          { id: "es_110", word: "Lo siento", pronunciation: "로 시엔토", meaning: "죄송합니다" },
          { id: "es_111", word: "Mucho gusto", pronunciation: "무초 구스토", meaning: "만나서 반갑습니다" },
          { id: "es_112", word: "¡Adiós!", pronunciation: "아디오스!", meaning: "안녕히 가세요" },
          { id: "es_113", word: "Hasta luego", pronunciation: "아스타 루에고", meaning: "나중에 또 봐요" },
          { id: "es_114", word: "Hasta mañana", pronunciation: "아스타 마냐나", meaning: "내일 봐요" },
          { id: "es_115", word: "Hasta pronto", pronunciation: "아스타 프론토", meaning: "조만간 봐요" },
          { id: "es_116", word: "Sí", pronunciation: "시", meaning: "네 / 맞아요" },
          { id: "es_117", word: "No", pronunciation: "노", meaning: "아니요" },
          { id: "es_118", word: "¿Cómo estás?", pronunciation: "코모 에스타스?", meaning: "어떻게 지내?" },
          { id: "es_119", word: "Bien, gracias", pronunciation: "비엔, 그라시아스", meaning: "잘 지내, 고마워" },
          { id: "es_120", word: "¿Y tú?", pronunciation: "이 투?", meaning: "너는 어때?" },
          { id: "es_121", word: "¿Cómo te llamas?", pronunciation: "코모 테 야마스?", meaning: "이름이 뭐야?" },
          { id: "es_122", word: "Me llamo...", pronunciation: "메 야모...", meaning: "내 이름은 ~야" },
          { id: "es_123", word: "Encantado", pronunciation: "엔칸타도", meaning: "반갑습니다 (남성)" },
          { id: "es_124", word: "Encantada", pronunciation: "엔칸타다", meaning: "반갑습니다 (여성)" },
          { id: "es_125", word: "¿De dónde eres?", pronunciation: "데 돈데 에레스?", meaning: "어느 나라 사람이야?" },
          { id: "es_126", word: "Soy de Corea", pronunciation: "소이 데 코레아", meaning: "한국에서 왔어요" },
          { id: "es_127", word: "No entiendo", pronunciation: "노 엔티엔도", meaning: "이해하지 못했어요" },
          { id: "es_128", word: "¿Puedes repetir?", pronunciation: "푸에데스 레페티르?", meaning: "다시 말해줄래?" },
          { id: "es_129", word: "Más despacio", pronunciation: "마스 데스파시오", meaning: "더 천천히요" },
          { id: "es_130", word: "Vale", pronunciation: "발레", meaning: "알겠어 / 좋아 / OK" }
        ],
        nodes: [
          { id: "es_1_n1", type: "stage", title: "1과: 첫 만남과 감사", stageNumber: 1, wordIds: ["es_101", "es_102", "es_103", "es_104", "es_105", "es_106", "es_107", "es_108", "es_109", "es_110"] },
          { id: "es_1_n2", type: "stage", title: "2과: 안부와 작별 인사", stageNumber: 2, wordIds: ["es_111", "es_112", "es_113", "es_114", "es_115", "es_116", "es_117", "es_118", "es_119", "es_120"] },
          { id: "es_1_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_1_n4", type: "review", title: "약점 복습" },
          { id: "es_1_n5", type: "stage", title: "3과: 자기소개와 소통", stageNumber: 3, wordIds: ["es_121", "es_122", "es_123", "es_124", "es_125", "es_126", "es_127", "es_128", "es_129", "es_130"] },
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
          { id: "es_202", word: "Café solo", pronunciation: "카페 솔로", meaning: "에스프레소" },
          { id: "es_203", word: "Café cortado", pronunciation: "카페 코르타도", meaning: "우유 살짝 탄 에스프레소" },
          { id: "es_204", word: "Agua fría", pronunciation: "아구아 프리아", meaning: "시원한 물" },
          { id: "es_205", word: "Agua del tiempo", pronunciation: "아구아 델 티엠포", meaning: "미지근한(상온) 물" },
          { id: "es_206", word: "Agua con gas", pronunciation: "아구아 콘 가스", meaning: "탄산수" },
          { id: "es_207", word: "Cerveza", pronunciation: "세르베사", meaning: "맥주" },
          { id: "es_208", word: "Caña", pronunciation: "카냐", meaning: "작은 생맥주 한 잔" },
          { id: "es_209", word: "Vino tinto", pronunciation: "비노 틴토", meaning: "레드 와인" },
          { id: "es_210", word: "Vino blanco", pronunciation: "비노 블랑코", meaning: "화이트 와인" },
          { id: "es_211", word: "Tapa", pronunciation: "타파", meaning: "타파스 (작은 안주 접시)" },
          { id: "es_212", word: "Ración", pronunciation: "라시온", meaning: "1인분 요리 접시" },
          { id: "es_213", word: "Pan", pronunciation: "판", meaning: "빵" },
          { id: "es_214", word: "La carta", pronunciation: "라 카르타", meaning: "메뉴판" },
          { id: "es_215", word: "Menú del día", pronunciation: "메누 델 디아", meaning: "오늘의 세트 메뉴" },
          { id: "es_216", word: "Camarero", pronunciation: "카마레로", meaning: "웨이터 / 종업원" },
          { id: "es_217", word: "La cuenta, por favor", pronunciation: "라 쿠엔타, 포르 파보르", meaning: "계산서 주세요" },
          { id: "es_218", word: "¿Cuánto cuesta?", pronunciation: "콴토 쿠에스타?", meaning: "얼마인가요?" },
          { id: "es_219", word: "Está muy rico", pronunciation: "에스타 무이 리코", meaning: "정말 맛있어요" },
          { id: "es_220", word: "Buen provecho", pronunciation: "부엔 프로베초", meaning: "맛있게 드세요" },
          { id: "es_221", word: "Tenedor y cuchillo", pronunciation: "테네도르 이 쿠치요", meaning: "포크와 나이프" },
          { id: "es_222", word: "Cuchara", pronunciation: "쿠차라", meaning: "숟가락" },
          { id: "es_223", word: "Vaso", pronunciation: "바소", meaning: "물컵 / 유리잔" },
          { id: "es_224", word: "Servilleta", pronunciation: "세르비예타", meaning: "냅킨 / 휴지" },
          { id: "es_225", word: "Sal y pimienta", pronunciation: "살 이 피미엔타", meaning: "소금과 후추" },
          { id: "es_226", word: "Aceite de oliva", pronunciation: "아세이테 데 올리바", meaning: "올리브유" },
          { id: "es_227", word: "Hielo", pronunciation: "이에로", meaning: "얼음" },
          { id: "es_228", word: "Sin azúcar", pronunciation: "신 아수카르", meaning: "설탕 없이" },
          { id: "es_229", word: "Para llevar", pronunciation: "파라 예바르", meaning: "포장해 주세요 (테이크아웃)" },
          { id: "es_230", word: "Para tomar aquí", pronunciation: "파라 토마르 아키", meaning: "먹고 갈게요" }
        ],
        nodes: [
          { id: "es_2_n1", type: "stage", title: "1과: 음료와 커피 주문", stageNumber: 1, wordIds: ["es_201", "es_202", "es_203", "es_204", "es_205", "es_206", "es_207", "es_208", "es_209", "es_210"] },
          { id: "es_2_n2", type: "stage", title: "2과: 메뉴 주문과 식사", stageNumber: 2, wordIds: ["es_211", "es_212", "es_213", "es_214", "es_215", "es_216", "es_217", "es_218", "es_219", "es_220"] },
          { id: "es_2_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_2_n4", type: "review", title: "약점 복습" },
          { id: "es_2_n5", type: "stage", title: "3과: 테이블 세팅과 요청", stageNumber: 3, wordIds: ["es_221", "es_222", "es_223", "es_224", "es_225", "es_226", "es_227", "es_228", "es_229", "es_230"] },
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
          { id: "es_310", word: "En la esquina", pronunciation: "엔 라 에스키나", meaning: "모퉁이에" },
          { id: "es_311", word: "Cerca", pronunciation: "세르카", meaning: "가까운" },
          { id: "es_312", word: "Lejos", pronunciation: "레호스", meaning: "먼 / 멀리" },
          { id: "es_313", word: "Calle", pronunciation: "카예", meaning: "길 / 거리" },
          { id: "es_314", word: "Avenida", pronunciation: "아베니다", meaning: "대로 / 큰길" },
          { id: "es_315", word: "Plaza", pronunciation: "플라사", meaning: "광장" },
          { id: "es_316", word: "Entrada", pronunciation: "엔트라다", meaning: "입구" },
          { id: "es_317", word: "Salida", pronunciation: "살리다", meaning: "출구" },
          { id: "es_318", word: "El baño", pronunciation: "엘 바뇨", meaning: "화장실" },
          { id: "es_319", word: "Aeropuerto", pronunciation: "아에로푸에르토", meaning: "공항" },
          { id: "es_320", word: "Centro", pronunciation: "센트로", meaning: "시내 / 중심가" },
          { id: "es_321", word: "Cruzar", pronunciation: "크루사르", meaning: "건너다" },
          { id: "es_322", word: "Semáforo", pronunciation: "세마포로", meaning: "신호등" },
          { id: "es_323", word: "Paso de peatones", pronunciation: "파소 데 페아토네스", meaning: "횡단보도" },
          { id: "es_324", word: "Mapa", pronunciation: "마파", meaning: "지도" },
          { id: "es_325", word: "Perdido", pronunciation: "페르디도", meaning: "길을 잃은" },
          { id: "es_326", word: "¿A qué hora sale?", pronunciation: "아 케 오라 살레?", meaning: "몇 시에 출발하나요?" },
          { id: "es_327", word: "¿Cuánto tarda?", pronunciation: "콴토 타르다?", meaning: "얼마나 걸리나요?" },
          { id: "es_328", word: "Próxima parada", pronunciation: "프록시마 파라다", meaning: "다음 정거장" },
          { id: "es_329", word: "Bajar", pronunciation: "바하르", meaning: "내리다" },
          { id: "es_330", word: "Subir", pronunciation: "수비르", meaning: "타다" }
        ],
        nodes: [
          { id: "es_3_n1", type: "stage", title: "1과: 대중교통과 방향", stageNumber: 1, wordIds: ["es_301", "es_302", "es_303", "es_304", "es_305", "es_306", "es_307", "es_308", "es_309", "es_310"] },
          { id: "es_3_n2", type: "stage", title: "2과: 길 묻기와 주요 장소", stageNumber: 2, wordIds: ["es_311", "es_312", "es_313", "es_314", "es_315", "es_316", "es_317", "es_318", "es_319", "es_320"] },
          { id: "es_3_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_3_n4", type: "review", title: "약점 복습" },
          { id: "es_3_n5", type: "stage", title: "3과: 도로 표지와 이동", stageNumber: 3, wordIds: ["es_321", "es_322", "es_323", "es_324", "es_325", "es_326", "es_327", "es_328", "es_329", "es_330"] },
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
          { id: "es_408", word: "Carro", pronunciation: "카로", meaning: "쇼핑 카트" },
          { id: "es_409", word: "Precio", pronunciation: "프레시오", meaning: "가격" },
          { id: "es_410", word: "Caja", pronunciation: "카하", meaning: "계산대" },
          { id: "es_411", word: "Caro", pronunciation: "카로", meaning: "비싼" },
          { id: "es_412", word: "Barato", pronunciation: "바라토", meaning: "저렴한 / 싼" },
          { id: "es_413", word: "Oferta", pronunciation: "오페르타", meaning: "할인 / 세일" },
          { id: "es_414", word: "Kilo", pronunciation: "킬로", meaning: "킬로그램 (kg)" },
          { id: "es_415", word: "Medio kilo", pronunciation: "메디오 킬로", meaning: "500그램 (반 킬로)" },
          { id: "es_416", word: "Fruta", pronunciation: "프루타", meaning: "과일" },
          { id: "es_417", word: "Verdura", pronunciation: "베르두라", meaning: "채소 / 야채" },
          { id: "es_418", word: "Carne", pronunciation: "카르네", meaning: "고기 / 육류" },
          { id: "es_419", word: "Pescado", pronunciation: "페스카도", meaning: "생선 / 해산물" },
          { id: "es_420", word: "Pollo", pronunciation: "포요", meaning: "닭고기" },
          { id: "es_421", word: "Leche", pronunciation: "레체", meaning: "우유" },
          { id: "es_422", word: "Huevos", pronunciation: "우에보스", meaning: "달걀" },
          { id: "es_423", word: "Queso", pronunciation: "케소", meaning: "치즈" },
          { id: "es_424", word: "Arroz", pronunciation: "아로스", meaning: "쌀" },
          { id: "es_425", word: "Agua", pronunciation: "아구아", meaning: "물" },
          { id: "es_426", word: "Cambio", pronunciation: "캄비오", meaning: "거스름돈" },
          { id: "es_427", word: "Moneda", pronunciation: "모네다", meaning: "동전" },
          { id: "es_428", word: "Abierto", pronunciation: "아비에르토", meaning: "영업 중 / 열림" },
          { id: "es_429", word: "Cerrado", pronunciation: "세라도", meaning: "문 닫음 / 닫힘" },
          { id: "es_430", word: "¿Tiene bolsa?", pronunciation: "티에네 볼사?", meaning: "봉투 있으신가요?" }
        ],
        nodes: [
          { id: "es_4_n1", type: "stage", title: "1과: 마트 계산과 결제", stageNumber: 1, wordIds: ["es_401", "es_402", "es_403", "es_404", "es_405", "es_406", "es_407", "es_408", "es_409", "es_410"] },
          { id: "es_4_n2", type: "stage", title: "2과: 식료품과 가격", stageNumber: 2, wordIds: ["es_411", "es_412", "es_413", "es_414", "es_415", "es_416", "es_417", "es_418", "es_419", "es_420"] },
          { id: "es_4_n3", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_4_n4", type: "review", title: "약점 복습" },
          { id: "es_4_n5", type: "stage", title: "3과: 신선 식품과 매장 이용", stageNumber: 3, wordIds: ["es_421", "es_422", "es_423", "es_424", "es_425", "es_426", "es_427", "es_428", "es_429", "es_430"] },
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
