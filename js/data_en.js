(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.courseData_en = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const courseData_en = {
    id: "en_main",
    courseId: "en_main",
    code: "en",
    name: "영어 정규 코스",
    courseName: "영어 정규 코스",
    title: "영어 일상 실전",
    desc: "인사, 카페/식당 주문, 길찾기부터 마트 쇼핑까지 매일 쓰는 필수 영어",
    badge: "🇺🇸 정규 코스",
    icon: "🇺🇸",
    flag: "🇺🇸",
    mascotImg: "assets/characters/en-study.webp?v=88",
    totalUnits: 4,
    units: [
      {
        unitId: 1,
        unitNumber: 1,
        id: 1,
        unit: 1,
        title: "Unit 1. 생존 첫걸음 & 기본 인사",
        desc: "매일 주고받는 첫인사, 감사, 사과 및 기초 표현",
        words: [
          { id: "en_101", word: "Hello", pronunciation: "헬로우", meaning: "안녕하세요 / 안녕" },
          { id: "en_102", word: "Good morning", pronunciation: "굿 모닝", meaning: "좋은 아침이에요" },
          { id: "en_103", word: "Good afternoon", pronunciation: "굿 애프터눈", meaning: "좋은 오후예요" },
          { id: "en_104", word: "Good evening", pronunciation: "굿 이브닝", meaning: "좋은 저녁이에요" },
          { id: "en_105", word: "Thank you", pronunciation: "땡큐", meaning: "감사합니다" },
          { id: "en_106", word: "Thanks a lot", pronunciation: "땡스 어 랏", meaning: "정말 고마워요" },
          { id: "en_107", word: "You're welcome", pronunciation: "유어 웰컴", meaning: "천만에요 / 별말씀을요" },
          { id: "en_108", word: "Please", pronunciation: "플리즈", meaning: "부탁합니다 / 제발" },
          { id: "en_109", word: "Excuse me", pronunciation: "익스큐즈 미", meaning: "실례합니다 / 저기요" },
          { id: "en_110", word: "I'm sorry", pronunciation: "아임 쏘리", meaning: "죄송합니다 / 미안해요" },
          { id: "en_111", word: "Nice to meet you", pronunciation: "나이스 투 밋 유", meaning: "만나서 반갑습니다" },
          { id: "en_112", word: "Goodbye", pronunciation: "굿바이", meaning: "안녕히 가세요" },
          { id: "en_113", word: "See you later", pronunciation: "씨 유 레이터", meaning: "나중에 봐요" },
          { id: "en_114", word: "Yes", pronunciation: "예스", meaning: "네 / 맞아요" },
          { id: "en_115", word: "No", pronunciation: "노", meaning: "아니요" },
          { id: "en_116", word: "How are you?", pronunciation: "하우 아 유?", meaning: "어떻게 지내세요?" }
        ],
        nodes: [
          { id: "en_1_n1", type: "stage", title: "1과: 첫 만남과 감사", stageNumber: 1, wordIds: ["en_101", "en_102", "en_103", "en_104", "en_105", "en_106", "en_107", "en_108"] },
          { id: "en_1_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_1_n3", type: "stage", title: "2과: 사과와 작별 인사", stageNumber: 2, wordIds: ["en_109", "en_110", "en_111", "en_112", "en_113", "en_114", "en_115", "en_116"] },
          { id: "en_1_n4", type: "sentence", title: "핵심 문장", targetSentence: "Hello! How are you doing today?", meaning: "안녕하세요! 오늘 어떻게 지내세요?" },
          { id: "en_1_n5", type: "review", title: "약점 복습" },
          { id: "en_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        unitId: 2,
        unitNumber: 2,
        id: 2,
        unit: 2,
        title: "Unit 2. 카페 & 식당 주문",
        desc: "커피, 음료 주문과 계산서 요청하기",
        words: [
          { id: "en_201", word: "Coffee", pronunciation: "커피", meaning: "커피" },
          { id: "en_202", word: "Iced Americano", pronunciation: "아이스드 아메리카노", meaning: "아이스 아메리카노" },
          { id: "en_203", word: "Cold water", pronunciation: "콜드 워터", meaning: "시원한 물" },
          { id: "en_204", word: "Sparkling water", pronunciation: "스파클링 워터", meaning: "탄산수" },
          { id: "en_205", word: "Beer", pronunciation: "비어", meaning: "맥주" },
          { id: "en_206", word: "Menu", pronunciation: "메뉴", meaning: "메뉴판" },
          { id: "en_207", word: "Order", pronunciation: "오더", meaning: "주문하다 / 주문" },
          { id: "en_208", word: "Can I get...", pronunciation: "캔 아이 겟...", meaning: "~주실 수 있나요?" },
          { id: "en_209", word: "For here", pronunciation: "포 히어", meaning: "매장 식사" },
          { id: "en_210", word: "To go", pronunciation: "투 고", meaning: "테이크아웃 / 포장" },
          { id: "en_211", word: "The check, please", pronunciation: "더 체크, 플리즈", meaning: "계산서 주세요" },
          { id: "en_212", word: "How much is it?", pronunciation: "하우 머치 이즈 잇?", meaning: "얼마인가요?" },
          { id: "en_213", word: "Delicious", pronunciation: "딜리셔스", meaning: "맛있는" },
          { id: "en_214", word: "Fork and knife", pronunciation: "포크 앤 나이프", meaning: "포크와 나이프" },
          { id: "en_215", word: "Napkin", pronunciation: "냅킨", meaning: "냅킨 / 휴지" },
          { id: "en_216", word: "Receipt", pronunciation: "리시트", meaning: "영수증" }
        ],
        nodes: [
          { id: "en_2_n1", type: "stage", title: "1과: 음료와 커피 주문", stageNumber: 1, wordIds: ["en_201", "en_202", "en_203", "en_204", "en_205", "en_206", "en_207", "en_208"] },
          { id: "en_2_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_2_n3", type: "stage", title: "2과: 메뉴 주문과 계산", stageNumber: 2, wordIds: ["en_209", "en_210", "en_211", "en_212", "en_213", "en_214", "en_215", "en_216"] },
          { id: "en_2_n4", type: "sentence", title: "핵심 문장", targetSentence: "Can I get an iced coffee and the check, please?", meaning: "아이스 커피 한 잔과 계산서 부탁합니다." },
          { id: "en_2_n5", type: "review", title: "약점 복습" },
          { id: "en_2_n6", type: "boss", title: "Unit 2 보스전" }
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
          { id: "en_301", word: "Subway station", pronunciation: "서브웨이 스테이션", meaning: "지하철역" },
          { id: "en_302", word: "Bus stop", pronunciation: "버스 스탑", meaning: "버스 정류장" },
          { id: "en_303", word: "Taxi", pronunciation: "택시", meaning: "택시" },
          { id: "en_304", word: "Ticket", pronunciation: "티켓", meaning: "표 / 승차권" },
          { id: "en_305", word: "Train", pronunciation: "트레인", meaning: "기차 / 열차" },
          { id: "en_306", word: "Where is...?", pronunciation: "웨어 이즈...?", meaning: "~는 어디에 있나요?" },
          { id: "en_307", word: "Turn right", pronunciation: "턴 라이트", meaning: "우회전하세요" },
          { id: "en_308", word: "Turn left", pronunciation: "턴 레프트", meaning: "좌회전하세요" },
          { id: "en_309", word: "Go straight", pronunciation: "고 스트레이트", meaning: "직진하세요" },
          { id: "en_310", word: "Near", pronunciation: "니어", meaning: "가까운" },
          { id: "en_311", word: "Far", pronunciation: "파", meaning: "먼 / 멀리" },
          { id: "en_312", word: "Street", pronunciation: "스트리트", meaning: "길 / 거리" },
          { id: "en_313", word: "Map", pronunciation: "맵", meaning: "지도" },
          { id: "en_314", word: "Entrance", pronunciation: "엔트런스", meaning: "입구" },
          { id: "en_315", word: "Exit", pronunciation: "엑시트", meaning: "출구" },
          { id: "en_316", word: "Restroom", pronunciation: "레스트룸", meaning: "화장실" }
        ],
        nodes: [
          { id: "en_3_n1", type: "stage", title: "1과: 대중교통 타기", stageNumber: 1, wordIds: ["en_301", "en_302", "en_303", "en_304", "en_305", "en_306", "en_307", "en_308"] },
          { id: "en_3_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_3_n3", type: "stage", title: "2과: 길 묻기와 방향", stageNumber: 2, wordIds: ["en_309", "en_310", "en_311", "en_312", "en_313", "en_314", "en_315", "en_316"] },
          { id: "en_3_n4", type: "sentence", title: "핵심 문장", targetSentence: "Excuse me, where is the nearest subway station?", meaning: "실례합니다, 가장 가까운 지하철역이 어디인가요?" },
          { id: "en_3_n5", type: "review", title: "약점 복습" },
          { id: "en_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      },
      {
        unitId: 4,
        unitNumber: 4,
        id: 4,
        unit: 4,
        title: "Unit 4. 마트, 쇼핑 & 결제",
        desc: "마트 장보기, 카드 결제, 봉투와 영수증 받기",
        words: [
          { id: "en_401", word: "Supermarket", pronunciation: "수퍼마켓", meaning: "슈퍼마켓 / 마트" },
          { id: "en_402", word: "Store", pronunciation: "스토어", meaning: "가게 / 매장" },
          { id: "en_403", word: "Pay by card", pronunciation: "페이 바이 카드", meaning: "카드로 결제하다" },
          { id: "en_404", word: "In cash", pronunciation: "인 캐시", meaning: "현금으로" },
          { id: "en_405", word: "Bag", pronunciation: "백", meaning: "비닐봉투 / 쇼핑백" },
          { id: "en_406", word: "Receipt", pronunciation: "리시트", meaning: "영수증" },
          { id: "en_407", word: "Shopping cart", pronunciation: "쇼핑 카트", meaning: "쇼핑 카트 / 바구니" },
          { id: "en_408", word: "Price", pronunciation: "프라이스", meaning: "가격" },
          { id: "en_409", word: "Expensive", pronunciation: "익스펜시브", meaning: "비싼" },
          { id: "en_410", word: "Cheap", pronunciation: "칩", meaning: "저렴한 / 싼" },
          { id: "en_411", word: "Discount", pronunciation: "디스카운트", meaning: "할인 / 세일" },
          { id: "en_412", word: "Kilo", pronunciation: "킬로", meaning: "킬로그램 (kg)" },
          { id: "en_413", word: "Fruit", pronunciation: "프루트", meaning: "과일" },
          { id: "en_414", word: "Vegetable", pronunciation: "베지터블", meaning: "채소 / 야채" },
          { id: "en_415", word: "Meat", pronunciation: "미트", meaning: "고기 / 육류" },
          { id: "en_416", word: "Milk", pronunciation: "밀크", meaning: "우유" }
        ],
        nodes: [
          { id: "en_4_n1", type: "stage", title: "1과: 마트 장보기", stageNumber: 1, wordIds: ["en_401", "en_402", "en_403", "en_404", "en_405", "en_406", "en_407", "en_408"] },
          { id: "en_4_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_4_n3", type: "stage", title: "2과: 식료품과 결제", stageNumber: 2, wordIds: ["en_409", "en_410", "en_411", "en_412", "en_413", "en_414", "en_415", "en_416"] },
          { id: "en_4_n4", type: "sentence", title: "핵심 문장", targetSentence: "Can I pay by card? And a bag, please.", meaning: "카드로 결제할 수 있나요? 봉투도 하나 주세요." },
          { id: "en_4_n5", type: "review", title: "약점 복습" },
          { id: "en_4_n6", type: "boss", title: "Unit 4 보스전" }
        ]
      }
    ]
  };

  // 단어 ID 매핑 및 양방향 속성 정규화
  const wordMap = {};
  courseData_en.units.forEach(u => {
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
  courseData_en.wordMap = wordMap;
  courseData_en.allWords = courseData_en.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {
    window.courseData_en = courseData_en;
    if (window.COURSES) {
      window.COURSES['en_main'] = courseData_en;
    }
  }

  return courseData_en;
}));
