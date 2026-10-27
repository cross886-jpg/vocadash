// ==============================================================================
// VocaDash Course & Static Configuration Registry (js/courseConfig.js)
// 코스 프리셋, 유닛 목록, 레슨 메타데이터, 다국어 팩 카탈로그 및 정적 설정
// ==============================================================================

(function (global) {
  'use strict';
  const target = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));

  // 1. 초기 사용자 상태 기본값
const DEFAULT_USER_PROGRESS = {
    currentCourse: 'pack_football',
    currentUnit: 0,
    currentNode: 0,
    stars: {},
    clearedNodes: [],
    unlockedNodes: ['fb_1_n1', 'es_1_n1', 'node-1'],
    weakWords: [],
    gems: 0,
    hearts: 5
  };
  window.DEFAULT_USER_PROGRESS = DEFAULT_USER_PROGRESS;
  target.DEFAULT_USER_PROGRESS = DEFAULT_USER_PROGRESS;

  // 2. 코스 프리셋 (스페인어, 영어)
const COURSE_PRESETS = {
    es: [
      { id: 'basic', icon: '🌱', title: '기초 회화', desc: '인사, 감사, 숫자 등 매일 쓰는 첫걸음' },
      { id: 'travel', icon: '✈️', title: '여행 스페인어', desc: '공항, 숙소, 식당 필수 회화' },
      { id: 'dele', icon: '🎓', title: 'DELE 준비과정', desc: 'A1~B2 등급별 어휘 및 실전 대비' },
      { id: 'business', icon: '💼', title: '비즈니스 스페인어', desc: '오피스 일상, 미팅, 이메일' }
    ],
    en: [
      { id: 'basic', icon: '🌱', title: '기초 회화', desc: '인사, 감사, 숫자 등 매일 쓰는 첫걸음' },
      { id: 'travel', icon: '✈️', title: '여행 영어', desc: '공항, 호텔, 카페 실전 회화' },
      { id: 'toeic', icon: '🎓', title: '토익/오픽 대비', desc: '필수 기출 어휘 및 빈출 표현' },
      { id: 'business', icon: '💼', title: '비즈니스 영어', desc: '오피스 실무, 미팅, 이메일' }
    ]
  };
  window.COURSE_PRESETS = COURSE_PRESETS;
  target.COURSE_PRESETS = COURSE_PRESETS;

  // 3. 레슨 세부 메타데이터 (타이틀, 설명, 아이콘, 난이도 등)
const COURSE_LESSONS = {
    es: {
      basic: {
        'node-1': { title: '1과: 인사/안부', desc: '¡Hola!, ¿Cómo estás? 등 매일 쓰는 첫인사와 안부 표현을 마스터하세요!', icon: '🌱', level: '기초', category: '인사/안부', tags: ['인사/안부', '인사', '안부'] },
        'node-2': { title: '2과: 감사/사과', desc: 'Gracias, Por favor, Lo siento 등 필수 예절 표현과 핵심 어휘를 완벽하게 학습해보세요!', icon: '🙏', level: '기초', category: '감사/사과', tags: ['감사/사과', '감사', '사과'] },
        'node-3': { title: '3과: 숫자/시간', desc: '1부터 100까지의 숫자와 시각 표현, 요일을 쉽고 빠르게 익혀보세요!', icon: '⏰', level: '기초', category: '숫자/시간', tags: ['숫자/시간', '숫자', '시간'] },
        'node-boss': { title: '4과: 일상 기초 (보스전)', desc: '기초 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '일상 기초', tags: ['일상 기초', '일상', '기초', '보스전'] }
      },
      travel: {
        'node-1': { title: '1과: 기내 기본 표현', desc: '좌석 요청, 음료 주문, 착륙 안내 등 비행기 탑승 필수 단어와 표현을 완벽하게 복습해보세요!', icon: '✈️', level: '초급', category: '공항/기내', tags: ['공항/기내', '공항', '기내', '비행기'] },
        'node-2': { title: '2과: 입국 심사', desc: '입국 목적, 체류 기간, 숙소 위치 등 필수 공항 인터뷰 질문과 핵심 어휘 10개 및 실전 문장 3개를 마스터하세요!', icon: '🛂', level: '초중급', category: '교통/길찾기', tags: ['교통/길찾기', '입국 심사', '인터뷰', '심사'] },
        'node-3': { title: '3과: 수하물 찾기와 세관', desc: '수하물 수취대 찾기, 분실물 신고, 세관 검사 필수 표현과 실전문장 13개를 마스터해보세요!', icon: '🧳', level: '중급', category: '호텔/숙소', tags: ['호텔/숙소', '수하물 찾기와 세관', '수하물', '세관'] },
        'node-boss': { title: '보스전: 공항 마스터 관문', desc: '입국 심사 완벽 통과 & 특별 보상', icon: '👑', level: '보스전', category: '식당/카페', tags: ['식당/카페', '공항 마스터', '보스전'] }
      },
      dele: {
        'node-1': { title: '1과: DELE A1 (우리 몸 1)', desc: '신체 기본 부위 및 A1 기초 어휘 50선', icon: '📝', level: 'DELE A1', category: 'DELE A1', tags: ['DELE A1', 'A1', '우리 몸 1', '우리 몸'] },
        'node-2': { title: '2과: DELE A1 (우리 몸 2)', desc: '얼굴 및 감각 기관 핵심 어휘', icon: '👀', level: 'DELE A1', category: 'DELE A1', tags: ['DELE A1', 'A1', '우리 몸 2', '우리 몸'] },
        'node-3': { title: '3과: DELE A2 (세부 부위/장기)', desc: '세부 신체 부위 및 A2 실전 독해 어휘', icon: '🫀', level: 'DELE A2', category: 'DELE A2', tags: ['DELE A2', 'A2', '세부 부위/장기', '장기'] },
        'node-boss': { title: '4과: DELE 실전 모의테스트', desc: 'DELE B1/B2 실전 모의테스트 & 최종 관문', icon: '👑', level: 'DELE B2', category: 'DELE B2', tags: ['DELE B1', 'DELE B2', 'B1', 'B2', '모의테스트', '실전 모의테스트'] }
      },
      business: {
        'node-1': { title: '1과: 첫 출근과 인사', desc: '비즈니스 자기소개와 명함 교환, 직급 호칭', icon: '🤝', level: '실무', category: '오피스 일상', tags: ['오피스 일상', '출근', '인사'] },
        'node-2': { title: '2과: 오피스 일상과 회의', desc: '회의 일정 잡기, 업무 협업 및 보고 표현', icon: '💼', level: '실무', category: '이메일/문서', tags: ['이메일/문서', '회의', '보고'] },
        'node-3': { title: '3과: 이메일과 전화 응대', desc: '비즈니스 이메일 작성 및 바이어 통화 표현', icon: '📧', level: '실무', category: '미팅/협상', tags: ['미팅/협상', '이메일', '전화'] },
        'node-boss': { title: '4과: 비즈니스 협상 마스터', desc: '비즈니스 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '비자/행정', tags: ['비자/행정', '협상', '보스전'] }
      }
    },
    en: {
      basic: {
        'node-1': { title: '1과: 인사/기초 표현', desc: 'Hello, Thank you, Please 등 매일 쓰는 첫인사와 필수 기초 회화를 마스터하세요!', icon: '🌱', level: '기초', category: '인사/안부', tags: ['인사/안부', '인사'] },
        'node-2': { title: '2과: 감사/사과 표현', desc: 'Thank you, Sorry, Excuse me 등 필수 영어 예절 표현과 핵심 어휘를 완벽하게 학습해보세요!', icon: '🙏', level: '기초', category: '감사/사과', tags: ['감사/사과', '감사'] },
        'node-3': { title: '3과: 숫자와 시간', desc: '1부터 100까지의 영어 숫자와 시각 표현, 요일을 쉽고 빠르게 익혀보세요!', icon: '⏰', level: '기초', category: '숫자/시간', tags: ['숫자/시간', '숫자'] },
        'node-boss': { title: '4과: 필수 회화 (보스전)', desc: '기초 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '일상 기초', tags: ['일상 기초', '보스전'] }
      },
      travel: {
        'node-1': { title: '1과: 기내 필수 영어', desc: 'Water, Blanket, Aisle seat 등 비행기 탑승 필수 영어 단어와 표현을 완벽하게 복습해보세요!', icon: '✈️', level: '초급', category: '공항/기내', tags: ['공항/기내', '공항'] },
        'node-2': { title: '2과: 공항 & 입국 심사', desc: 'Passport, Purpose of visit 등 입국 심사 핵심 영어 어휘와 문장 마스터!', icon: '🛂', level: '초중급', category: '교통/길찾기', tags: ['교통/길찾기', '입국 심사'] },
        'node-3': { title: '3과: 수하물 찾기와 세관', desc: 'Baggage claim, Customs 등 수하물 분실 신고와 세관 통관 표현 마스터!', icon: '🧳', level: '중급', category: '호텔/숙소', tags: ['호텔/숙소', '수하물'] },
        'node-boss': { title: '보스전: 여행 영어 마스터', desc: '여행 영어 완벽 마스터 & 특별 보상', icon: '👑', level: '보스전', category: '식당/카페', tags: ['식당/카페', '보스전'] }
      },
      toeic: {
        'node-1': { title: '1과: Part 1/2 빈출 어휘', desc: '사진 묘사 및 질의응답 핵심 단어', icon: '🎧', level: '초급', category: 'Part 1/2', tags: ['Part 1/2', 'Part 1', 'Part 2'] },
        'node-2': { title: '2과: Part 3/4 비즈니스 회화', desc: '대화 및 설명문 빈출 표현', icon: '💬', level: '중급', category: 'Part 3/4', tags: ['Part 3/4', 'Part 3', 'Part 4'] },
        'node-3': { title: '3과: Part 5/6 문법/어휘', desc: '단문 및 장문 공란 메우기 핵심 단어', icon: '📄', level: '중상급', category: 'Part 5/6', tags: ['Part 5/6', 'Part 5', 'Part 6'] },
        'node-boss': { title: '4과: Part 7 독해 실전 마스터', desc: '장문 독해 및 이메일/기사 지문 완성', icon: '👑', level: '실전', category: 'Part 7', tags: ['Part 7', '독해', '보스전'] }
      },
      business: {
        'node-1': { title: '1과: 첫 출근과 인사', desc: '비즈니스 자기소개와 명함 교환, 직급 호칭', icon: '🤝', level: '실무', category: '오피스 일상', tags: ['오피스 일상', '출근'] },
        'node-2': { title: '2과: 오피스 일상과 회의', desc: '회의 일정 잡기, 업무 협업 및 보고 표현', icon: '💼', level: '실무', category: '이메일/문서', tags: ['이메일/문서', '회의'] },
        'node-3': { title: '3과: 이메일과 전화 응대', desc: '비즈니스 이메일 작성 및 바이어 통화 표현', icon: '📧', level: '실무', category: '미팅/협상', tags: ['미팅/협상', '이메일'] },
        'node-boss': { title: '4과: 비즈니스 협상 마스터', desc: '비즈니스 회화 총정리 & 특별 보상', icon: '👑', level: '보스전', category: '비자/행정', tags: ['비자/행정', '협상'] }
      }
    }
  };
  Object.assign(COURSE_LESSONS, COURSE_LESSONS.es);
  window.COURSE_LESSONS = COURSE_LESSONS;
  window.nodeLessonData = COURSE_LESSONS.basic;
  target.COURSE_LESSONS = COURSE_LESSONS;
  target.nodeLessonData = nodeLessonData;

  // 4. 코스 카테고리 맵
const courseCategoryMap = {
    basic: { icon: '🌱', titles: { es: '기초 회화', en: '기초 회화' }, categories: ['전체', '인사/안부', '감사/사과', '숫자/시간', '일상 기초'] },
    travel: { icon: '✈️', titles: { es: '여행 스페인어', en: '여행 영어' }, categories: ['전체', '공항/기내', '교통/길찾기', '호텔/숙소', '식당/카페'] },
    dele: { icon: '🎓', titles: { es: 'DELE 준비과정', en: 'DELE 준비과정' }, categories: ['전체', 'DELE A1', 'DELE A2', 'DELE B1', 'DELE B2'] },
    business: { icon: '💼', titles: { es: '비즈니스 스페인어', en: '비즈니스 영어' }, categories: ['전체', '오피스 일상', '이메일/문서', '미팅/협상', '비자/행정'] },
    toeic: { icon: '🎓', titles: { es: '토익/오픽 대비', en: '토익/오픽 대비' }, categories: ['전체', 'Part 1/2', 'Part 3/4', 'Part 5/6', 'Part 7'] }
  };
  target.courseCategoryMap = courseCategoryMap;

  // 5. 전체 코스 맵 유닛 프리셋 정의 (1~10 유닛)
const UNIT_LIST_PRESETS = {
    es: [
      { unit: 1, title: '생존 첫걸음', subtitle: '인사, 감사, 숫자 등 기초 표현 마스터', progress: 60, status: 'active', icon: '🇪🇸' },
      { unit: 2, title: '카페 & 주문', subtitle: '커피, 타파스, 메뉴 주문 & 계산', progress: 0, status: 'locked', icon: '☕' },
      { unit: 3, title: '길찾기 & 교통', subtitle: '지하철, 버스, 택시 & 위치 묻기', progress: 0, status: 'locked', icon: '🧭' },
      { unit: 4, title: '쇼핑 & 환전', subtitle: '가격 흥정, 사이즈 & 결제 표현', progress: 0, status: 'locked', icon: '🛍️' },
      { unit: 5, title: '호텔 & 숙소', subtitle: '체크인, 룸서비스 & 어메니티 요청', progress: 0, status: 'locked', icon: '🏨' },
      { unit: 6, title: '병원 & 약국', subtitle: '증상 설명, 응급처치 & 분실물 신고', progress: 0, status: 'locked', icon: '🏥' },
      { unit: 7, title: '친구 사귀기 & 취미', subtitle: '자기소개, 취향 & 주말 약속', progress: 0, status: 'locked', icon: '🎉' },
      { unit: 8, title: '날씨 & 일상 대화', subtitle: '사계절, 감정 표현 & 스몰토크', progress: 0, status: 'locked', icon: '☀️' },
      { unit: 9, title: '비즈니스 기초', subtitle: '이메일, 오피스 미팅 & 명함 교환', progress: 0, status: 'locked', icon: '💼' },
      { unit: 10, title: '현지 문화 & 관용구', subtitle: '스페인 속담, 슬랭 & 마스터 시험', progress: 0, status: 'locked', icon: '👑' }
    ],
    en: [
      { unit: 1, title: '생존 첫걸음', subtitle: 'Greeting, Thanks & Numbers Master', progress: 60, status: 'active', icon: '🇺🇸' },
      { unit: 2, title: '카페 & 주문', subtitle: 'Cafe, Food Ordering & The Check', progress: 0, status: 'locked', icon: '☕' },
      { unit: 3, title: '길찾기 & 교통', subtitle: 'Subway, Taxi & Asking Directions', progress: 0, status: 'locked', icon: '🧭' },
      { unit: 4, title: '쇼핑 & 환전', subtitle: 'Prices, Sizing & Credit Card', progress: 0, status: 'locked', icon: '🛍️' },
      { unit: 5, title: '호텔 & 숙소', subtitle: 'Check-in, Amenities & Front Desk', progress: 0, status: 'locked', icon: '🏨' },
      { unit: 6, title: '병원 & 약국', subtitle: 'Symptoms, Pharmacy & Emergencies', progress: 0, status: 'locked', icon: '🏥' },
      { unit: 7, title: '친구 사귀기 & 취미', subtitle: 'Small Talk, Hobbies & Weekend', progress: 0, status: 'locked', icon: '🎉' },
      { unit: 8, title: '날씨 & 일상 대화', subtitle: 'Weather, Mood & Daily Life', progress: 0, status: 'locked', icon: '☀️' },
      { unit: 9, title: '비즈니스 기초', subtitle: 'Emails, Business Meetings & Office', progress: 0, status: 'locked', icon: '💼' },
      { unit: 10, title: '현지 문화 & 관용구', subtitle: 'Native Idioms, Slang & Master Exam', progress: 0, status: 'locked', icon: '👑' }
    ]
  };
  window.UNIT_LIST_PRESETS = UNIT_LIST_PRESETS;
  target.UNIT_LIST_PRESETS = UNIT_LIST_PRESETS;

  // 6. 다국어 및 코스/테마 팩 레지스트리
const SUPPORTED_LANGUAGES = [
    { code: 'es', label: '스페인어(ES)', flag: '🇪🇸', active: true },
    { code: 'en', label: '영어(EN)', flag: '🇺🇸', active: true },
    { code: 'ja', label: '일본어(JA)', flag: '🇯🇵', active: false, badge: '오픈 예정' },
    { code: 'fr', label: '프랑스어(FR)', flag: '🇫🇷', active: false, badge: '오픈 예정' },
    { code: 'de', label: '독일어(DE)', flag: '🇩🇪', active: false, badge: '오픈 예정' }
  ];
  window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;

  const PACK_CATALOG = {
    es: [
      {
        id: 'pack_football',
        title: '스페인 축구 실전',
        category: '스페셜 팩',
        badge: 'Official DLC',
        desc: '스페인 현지 경기장 & 피치 콜 필수 어휘',
        icon: '⚽',
        wordsCount: 120,
        unitsCount: 6,
        lang: 'es',
        isComingSoon: false
      },
      {
        id: 'main',
        title: '스페인어 정규 코스',
        category: '정규 코스',
        badge: '기본 정규 코스',
        desc: '일상 회화 & 실전 기초 어휘 마스터',
        icon: '🇪🇸',
        wordsCount: 40,
        unitsCount: 4,
        lang: 'es',
        isComingSoon: false
      },
      {
        id: 'pack_business',
        title: '비즈니스 & 무역 실전',
        category: '비즈니스',
        badge: '출시 예정',
        desc: '바이어 미팅, 이메일, 계약 실무 비즈니스 어휘',
        icon: '💼',
        wordsCount: 80,
        unitsCount: 4,
        lang: 'es',
        isComingSoon: true
      },
      {
        id: 'pack_food',
        title: '스페인 미식 & 타파스 투어',
        category: '테마 여행',
        badge: '출시 예정',
        desc: '현지 맛집 주문부터 식재료, 와인 테이스팅',
        icon: '🥘',
        wordsCount: 80,
        unitsCount: 4,
        lang: 'es',
        isComingSoon: true
      }
    ],
    en: [
      {
        id: 'main_en',
        title: '영어 정규 코스',
        category: '정규 코스',
        badge: '기본 정규 코스',
        desc: '일상 회화 & 실전 필수 어휘 마스터',
        icon: '🇺🇸',
        wordsCount: 40,
        unitsCount: 4,
        lang: 'en',
        isComingSoon: false
      },
      {
        id: 'pack_en_opic',
        title: '오픽/토스 실전 비즈니스 영어',
        category: '시험 & 취업',
        badge: '출시 예정',
        desc: '외국계 기업 면접, 오피스 커뮤니케이션, 프레젠테이션',
        icon: '💼',
        wordsCount: 100,
        unitsCount: 5,
        lang: 'en',
        isComingSoon: true
      },
      {
        id: 'pack_en_travel',
        title: '여행영어 필수 서바이벌',
        category: '여행 & 회화',
        badge: '출시 예정',
        desc: '공항 입국심사, 호텔 체크인, 긴급상황 대처',
        icon: '✈️',
        wordsCount: 80,
        unitsCount: 4,
        lang: 'en',
        isComingSoon: true
      }
    ],
    ja: [
      {
        id: 'main_ja',
        title: '일본어 기초 회화',
        category: '정규 코스',
        badge: '오픈 예정',
        desc: '히라가나/가타카나 및 현지 여행 필수 어휘',
        icon: '🇯🇵',
        wordsCount: 40,
        unitsCount: 4,
        lang: 'ja',
        isComingSoon: true
      }
    ],
    fr: [
      {
        id: 'main_fr',
        title: '프랑스어 기초 회화',
        category: '정규 코스',
        badge: '오픈 예정',
        desc: '파리 여행 & 일상 에티켓 필수 어휘',
        icon: '🇫🇷',
        wordsCount: 40,
        unitsCount: 4,
        lang: 'fr',
        isComingSoon: true
      }
    ],
    de: [
      {
        id: 'main_de',
        title: '독일어 기초 회화',
        category: '정규 코스',
        badge: '오픈 예정',
        desc: '기초 문법 및 독일 현지 실전 회화',
        icon: '🇩🇪',
        wordsCount: 40,
        unitsCount: 4,
        lang: 'de',
        isComingSoon: true
      }
    ]
  };
  window.PACK_CATALOG = PACK_CATALOG;
  target.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
  target.PACK_CATALOG = PACK_CATALOG;

  // 7. 언어/코스 변경 모달 코스 목록
const MODAL_COURSES = {
    es: [
      {
        id: 'main',
        icon: '🇪🇸',
        title: '스페인어 정규 코스',
        desc: '일상 회화 & 실전 기초 어휘 마스터',
        badge: ''
      },
      {
        id: 'pack_football',
        icon: '⚽',
        title: '스페인 축구 실전팩',
        desc: '스페셜 팩 · 경기장 어휘 & 피치 콜',
        badge: 'Official DLC'
      }
    ],
    en: [
      {
        id: 'main',
        icon: '🇺🇸',
        title: '영어 정규 코스',
        desc: '일상 회화 & 실전 필수 어휘 마스터',
        badge: ''
      }
    ]
  };
  target.MODAL_COURSES = MODAL_COURSES;

  // 8. 로드맵 이정표 표지판 언어별 프리셋
const SIGNPOST_PRESETS = {
    es: {
      icon: '🏛️',
      text: 'MADRID 2.4km',
      code: 'ES',
      codeClass: 'bg-red-600 text-yellow-300',
      flag: '🇪🇸'
    },
    en: {
      icon: '🗽',
      text: 'NEW YORK 2.4km',
      code: 'US',
      codeClass: 'bg-blue-600 text-white',
      flag: '🇺🇸'
    },
    fr: {
      icon: '🗼',
      text: 'PARIS 2.4km',
      code: 'FR',
      codeClass: 'bg-blue-700 text-white',
      flag: '🇫🇷'
    },
    ja: {
      icon: '⛩️',
      text: 'TOKYO 2.4km',
      code: 'JP',
      codeClass: 'bg-red-600 text-white',
      flag: '🇯🇵'
    },
    zh: {
      icon: '🏮',
      text: 'BEIJING 2.4km',
      code: 'CN',
      codeClass: 'bg-red-600 text-yellow-300',
      flag: '🇨🇳'
    },
    de: {
      icon: '🏰',
      text: 'BERLIN 2.4km',
      code: 'DE',
      codeClass: 'bg-slate-900 text-yellow-300',
      flag: '🇩🇪'
    }
  };
  target.SIGNPOST_PRESETS = SIGNPOST_PRESETS;

  // 9. 교재/단어장 화면 코스 프리셋
const BOOK_COURSE_PRESETS = {
    es: [
      { id: 'main', icon: '🇪🇸', title: '스페인어 정규 코스' },
      { id: 'pack_football', icon: '⚽', title: '스페인 축구 실전팩' },
      { id: 'dele', icon: '🎓', title: 'DELE 준비과정' },
      { id: 'business', icon: '💼', title: '비즈니스 스페인어' }
    ],
    en: [
      { id: 'main', icon: '🇺🇸', title: '영어 정규 코스' },
      { id: 'pack_football', icon: '⚽', title: '축구 실전팩 (DLC)' },
      { id: 'toeic', icon: '🎓', title: '토익/오픽 대비' },
      { id: 'business', icon: '💼', title: '비즈니스 영어' }
    ]
  };
  window.BOOK_COURSE_PRESETS = BOOK_COURSE_PRESETS;
  target.BOOK_COURSE_PRESETS = BOOK_COURSE_PRESETS;

  // CommonJS 모듈 지원 (Node / 테스트 환경)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      DEFAULT_USER_PROGRESS,
      COURSE_PRESETS,
      COURSE_LESSONS,
      nodeLessonData,
      courseCategoryMap,
      UNIT_LIST_PRESETS,
      SUPPORTED_LANGUAGES,
      PACK_CATALOG,
      MODAL_COURSES,
      SIGNPOST_PRESETS,
      BOOK_COURSE_PRESETS
    };
  }
})(typeof window !== 'undefined' ? window : this);

// 전역 변수(var) 노출 보장 (window 없는 스코프 및 기존 코드 호환)
var DEFAULT_USER_PROGRESS = (typeof window !== 'undefined' ? window.DEFAULT_USER_PROGRESS : undefined);
var COURSE_PRESETS = (typeof window !== 'undefined' ? window.COURSE_PRESETS : undefined);
var COURSE_LESSONS = (typeof window !== 'undefined' ? window.COURSE_LESSONS : undefined);
var nodeLessonData = (typeof window !== 'undefined' ? window.nodeLessonData : undefined);
var courseCategoryMap = (typeof window !== 'undefined' ? window.courseCategoryMap : undefined);
var UNIT_LIST_PRESETS = (typeof window !== 'undefined' ? window.UNIT_LIST_PRESETS : undefined);
var SUPPORTED_LANGUAGES = (typeof window !== 'undefined' ? window.SUPPORTED_LANGUAGES : undefined);
var PACK_CATALOG = (typeof window !== 'undefined' ? window.PACK_CATALOG : undefined);
var MODAL_COURSES = (typeof window !== 'undefined' ? window.MODAL_COURSES : undefined);
var SIGNPOST_PRESETS = (typeof window !== 'undefined' ? window.SIGNPOST_PRESETS : undefined);
var BOOK_COURSE_PRESETS = (typeof window !== 'undefined' ? window.BOOK_COURSE_PRESETS : undefined);
