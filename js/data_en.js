// ==============================================================================
// VocaDash - 영어 코스 데이터 (js/data_en.js)
// 🇺🇸 최신 VocaDash 표준 데이터 규격 (units.words 구조, 총 3 Units, 45개 핵심 어휘)
// ==============================================================================

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
    title: "영어 정규 코스",
    name: "영어 정규 코스",
    courseName: "영어 정규 코스",
    desc: "기내 표현, 입국 심사, 짐 찾기 실전 여행 & 회화 영어",
    description: "기내 표현, 입국 심사, 짐 찾기 실전 여행 & 회화 영어",
    badge: "🇺🇸 정규 코스",
    icon: "🇺🇸",
    flag: "🇺🇸",
    mascotImg: "assets/characters/en-study.webp?v=89",
    totalUnits: 3,
    units: [
      {
        unitId: 1,
        unitNumber: 1,
        id: 1,
        unit: 1,
        title: "Unit 1. 기내 기본 표현 & 비행기 탑승",
        desc: "좌석, 음료 주문, 착륙 안내 등 비행기 탑승 필수 어휘",
        subtitle: "좌석, 음료 주문, 착륙 안내 등 비행기 탑승 필수 어휘",
        words: [
          { id: "en_101", word: "seat", pronunciation: "시트", meaning: "좌석 / 자리" },
          { id: "en_102", word: "window seat", pronunciation: "윈도우 시트", meaning: "창가 좌석" },
          { id: "en_103", word: "aisle seat", pronunciation: "아일 시트", meaning: "통로 좌석" },
          { id: "en_104", word: "blanket", pronunciation: "블랭킷", meaning: "담요" },
          { id: "en_105", word: "headphones", pronunciation: "헤드폰즈", meaning: "이어폰 / 헤드폰" },
          { id: "en_106", word: "water", pronunciation: "워터", meaning: "물 / 생수" },
          { id: "en_107", word: "coffee", pronunciation: "커피", meaning: "커피" },
          { id: "en_108", word: "seatbelt", pronunciation: "시트벨트", meaning: "안전벨트" },
          { id: "en_109", word: "takeoff", pronunciation: "테이크오프", meaning: "이륙" },
          { id: "en_110", word: "landing", pronunciation: "랜딩", meaning: "착륙" },
          { id: "en_111", word: "hello", pronunciation: "헬로우", meaning: "안녕하세요" },
          { id: "en_112", word: "thank you", pronunciation: "땡큐", meaning: "감사합니다" },
          { id: "en_113", word: "please", pronunciation: "플리즈", meaning: "부탁합니다" },
          { id: "en_114", word: "excuse me", pronunciation: "익스큐즈 미", meaning: "실례합니다" },
          { id: "en_115", word: "restroom", pronunciation: "레스트룸", meaning: "화장실" }
        ],
        nodes: [
          { id: "en_1_n1", type: "stage", title: "1과: 기내 필수 어휘", stageNumber: 1, wordIds: ["en_101", "en_102", "en_103", "en_104", "en_105", "en_106", "en_107", "en_108"] },
          { id: "en_1_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_1_n3", type: "stage", title: "2과: 운항 & 기내 요청", stageNumber: 2, wordIds: ["en_109", "en_110", "en_111", "en_112", "en_113", "en_114", "en_115"] },
          { id: "en_1_n4", type: "sentence", title: "핵심 문장", targetSentence: "A glass of water, please.", meaning: "물 한 잔 부탁합니다." },
          { id: "en_1_n5", type: "review", title: "약점 복습" },
          { id: "en_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        unitId: 2,
        unitNumber: 2,
        id: 2,
        unit: 2,
        title: "Unit 2. 입국 심사 & 인터뷰 어휘",
        desc: "여권, 비자, 체류 목적 등 입국 심사 필수 소통",
        subtitle: "여권, 비자, 체류 목적 등 입국 심사 필수 소통",
        words: [
          { id: "en_201", word: "passport", pronunciation: "패스포트", meaning: "여권" },
          { id: "en_202", word: "visa", pronunciation: "비자", meaning: "비자 / 입국 허가" },
          { id: "en_203", word: "purpose", pronunciation: "퍼포스", meaning: "방문 목적" },
          { id: "en_204", word: "tourism", pronunciation: "투어리즘", meaning: "관광" },
          { id: "en_205", word: "business", pronunciation: "비즈니스", meaning: "출장 / 사업" },
          { id: "en_206", word: "stay", pronunciation: "스테이", meaning: "체류 기간" },
          { id: "en_207", word: "hotel", pronunciation: "호텔", meaning: "호텔 / 숙소" },
          { id: "en_208", word: "ticket", pronunciation: "티켓", meaning: "항공권 / 표" },
          { id: "en_209", word: "address", pronunciation: "어드레스", meaning: "주소" },
          { id: "en_210", word: "duration", pronunciation: "듀레이션", meaning: "체류 기간" },
          { id: "en_211", word: "occupation", pronunciation: "아큐페이션", meaning: "직업" },
          { id: "en_212", word: "currency", pronunciation: "커런시", meaning: "통화 / 외환" },
          { id: "en_213", word: "officer", pronunciation: "오피서", meaning: "심사관" },
          { id: "en_214", word: "inspection", pronunciation: "인스펙션", meaning: "검사 / 심사" },
          { id: "en_215", word: "return ticket", pronunciation: "리턴 티켓", meaning: "귀국 항공권" }
        ],
        nodes: [
          { id: "en_2_n1", type: "stage", title: "1과: 심사 필수 서류", stageNumber: 1, wordIds: ["en_201", "en_202", "en_203", "en_204", "en_205", "en_206", "en_207", "en_208"] },
          { id: "en_2_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_2_n3", type: "stage", title: "2과: 방문 목적 & 심사 인터뷰", stageNumber: 2, wordIds: ["en_209", "en_210", "en_211", "en_212", "en_213", "en_214", "en_215"] },
          { id: "en_2_n4", type: "sentence", title: "핵심 문장", targetSentence: "The purpose of my trip is tourism.", meaning: "제 여행 목적은 관광입니다." },
          { id: "en_2_n5", type: "review", title: "약점 복습" },
          { id: "en_2_n6", type: "boss", title: "Unit 2 보스전" }
        ]
      },
      {
        unitId: 3,
        unitNumber: 3,
        id: 3,
        unit: 3,
        title: "Unit 3. 짐 찾기 & 세관 통관",
        desc: "수하물 수취, 분실 신고 및 세관 신고 필수 어휘",
        subtitle: "수하물 수취, 분실 신고 및 세관 신고 필수 어휘",
        words: [
          { id: "en_301", word: "baggage claim", pronunciation: "배기지 클레임", meaning: "수하물 수취대" },
          { id: "en_302", word: "suitcase", pronunciation: "수트케이스", meaning: "여행 가방 / 캐리어" },
          { id: "en_303", word: "lost luggage", pronunciation: "로스트 러기지", meaning: "분실된 수하물" },
          { id: "en_304", word: "luggage tag", pronunciation: "러기지 태그", meaning: "수하물 태그" },
          { id: "en_305", word: "customs", pronunciation: "커스텀스", meaning: "세관" },
          { id: "en_306", word: "declaration", pronunciation: "데클러레이션", meaning: "신고서 / 세관신고" },
          { id: "en_307", word: "tax", pronunciation: "택스", meaning: "세금 / 관세" },
          { id: "en_308", word: "prohibited", pronunciation: "프로히비티드", meaning: "반입 금지된" },
          { id: "en_309", word: "liquids", pronunciation: "리퀴즈", meaning: "액체류" },
          { id: "en_310", word: "nothing to declare", pronunciation: "낫띵 투 디클레어", meaning: "신고 물품 없음" },
          { id: "en_311", word: "cart", pronunciation: "카트", meaning: "수하물 카트" },
          { id: "en_312", word: "damaged", pronunciation: "데미지드", meaning: "파손된" },
          { id: "en_313", word: "receipt", pronunciation: "리시트", meaning: "영수증" },
          { id: "en_314", word: "claim tag", pronunciation: "클레임 태그", meaning: "수취용 수하물표" },
          { id: "en_315", word: "green channel", pronunciation: "그린 채널", meaning: "녹색 통로 (면세)" }
        ],
        nodes: [
          { id: "en_3_n1", type: "stage", title: "1과: 수하물 찾기", stageNumber: 1, wordIds: ["en_301", "en_302", "en_303", "en_304", "en_305", "en_306", "en_307", "en_308"] },
          { id: "en_3_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "en_3_n3", type: "stage", title: "2과: 세관 검사 & 통관", stageNumber: 2, wordIds: ["en_309", "en_310", "en_311", "en_312", "en_313", "en_314", "en_315"] },
          { id: "en_3_n4", type: "sentence", title: "핵심 문장", targetSentence: "I have nothing to declare.", meaning: "신고할 물품이 없습니다." },
          { id: "en_3_n5", type: "review", title: "약점 복습" },
          { id: "en_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      }
    ],
    lessons: {
      'node-1': {
        title: '1과: 기내 기본 표현',
        desc: 'Seat, Water 등 비행기 탑승 필수 영어 단어와 표현을 완벽하게 학습해보세요!',
        icon: '✈️',
        level: '초급',
        category: '공항/기내',
        tags: ['영어', '공항', '기내', '비행기']
      },
      'node-2': {
        title: '2과: 입국 심사',
        desc: 'Passport, Purpose 등 필수 공항 인터뷰 질문과 핵심 어휘를 마스터하세요!',
        icon: '🛂',
        level: '초중급',
        category: '입국심사',
        tags: ['영어', '입국심사', '여권', '인터뷰']
      },
      'node-3': {
        title: '3과: 짐 찾기 & 세관',
        desc: 'Baggage claim, Customs 등 수하물 수취와 세관 검사 필수 표현 마스터!',
        icon: '🧳',
        level: '중급',
        category: '세관/수하물',
        tags: ['영어', '수하물', '세관', '짐찾기']
      },
      'node-boss': {
        title: '보스전: 뉴욕 마스터 관문',
        desc: '미국 입국 심사 및 공항 필수 영어 총정리 관문 & 마스터 특별 보상!',
        icon: '👑',
        level: '보스전',
        category: '보스전',
        tags: ['영어', '공항 마스터', '보스전']
      }
    }
  };

  // 단어 ID 기반 맵 헬퍼 생성 및 양방향 속성(word/term, pronunciation/pron) 정규화
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

  // 전체 단어 평탄화 목록
  courseData_en.allWords = courseData_en.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {
    window.courseData_en = courseData_en;
    if (window.COURSES) {
      window.COURSES['en_main'] = courseData_en;
    }
  }

  return courseData_en;
}));
