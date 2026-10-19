// ==============================================================================
// VocaDash - 영어 코스 데이터 (js/data_en.js)
// 🇺🇸 영어 코스 전용 데이터 정의 (추후 확장 대비) 및 VOCA_DATA 영어 데이터베이스 주입
// ==============================================================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.courseData_en = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LESSON_1_EN = [
    { id: 'en-n1-w01', type: 'word', term: 'Hello', meaning: '안녕하세요!', example: 'Hello! How are you doing today?', exampleKo: '안녕하세요! 오늘 어떻게 지내세요?', phonetic: '[헬로우]', tag: '기초 필수' },
    { id: 'en-n1-w02', type: 'word', term: 'Thank you', meaning: '감사합니다', example: 'Thank you very much for your help.', exampleKo: '도움에 정말 감사드립니다.', phonetic: '[땡큐]', tag: '예의 표현' },
    { id: 'en-n1-w03', type: 'word', term: 'Please', meaning: '부탁합니다', example: 'A glass of water, please.', exampleKo: '물 한 잔 부탁합니다.', phonetic: '[플리즈]', tag: '주문/요청' },
    { id: 'en-n1-w04', type: 'word', term: 'Good morning', meaning: '좋은 아침입니다', example: 'Good morning, everyone!', exampleKo: '모두 좋은 아침입니다!', phonetic: '[굿 모닝]', tag: '일상 인사' },
    { id: 'en-n1-w05', type: 'word', term: 'Goodbye', meaning: '안녕히 가세요', example: 'Goodbye! See you later.', exampleKo: '안녕히 가세요! 나중에 봐요.', phonetic: '[굿바이]', tag: '작별 인사' },
    { id: 'en-n1-w06', type: 'word', term: 'Good afternoon', meaning: '좋은 오후입니다', example: 'Good afternoon, sir!', exampleKo: '좋은 오후입니다, 손님!', phonetic: '[굿 애프터눈]', tag: '일상 인사' },
    { id: 'en-n1-w07', type: 'word', term: 'Good evening', meaning: '좋은 저녁입니다', example: 'Good evening and welcome aboard.', exampleKo: '좋은 저녁입니다, 탑승을 환영합니다.', phonetic: '[굿 이브닝]', tag: '일상 인사' },
    { id: 'en-n1-w08', type: 'word', term: 'You are welcome', meaning: '천만에요', example: 'You are very welcome.', exampleKo: '천만에요, 별말씀을요.', phonetic: '[유 아 웰컴]', tag: '예의 표현' },
    { id: 'en-n1-w09', type: 'word', term: 'Excuse me', meaning: '실례합니다', example: 'Excuse me, where is the restroom?', exampleKo: '실례합니다, 화장실이 어디인가요?', phonetic: '[익스큐즈 미]', tag: '문의/호출' },
    { id: 'en-n1-w10', type: 'word', term: 'See you later', meaning: '나중에 봐요', example: 'See you later, take care!', exampleKo: '나중에 봐요, 조심히 가세요!', phonetic: '[씨 유 레이터]', tag: '작별 인사' },
    { id: 'en-n1-w11', type: 'word', term: 'Seat', meaning: '좌석 / 자리', example: 'Where is my seat?', exampleKo: '제 좌석은 어디인가요?', phonetic: '[시트]', tag: '기내 시설' },
    { id: 'en-n1-w12', type: 'word', term: 'Window seat', meaning: '창가 좌석', example: 'I prefer a window seat.', exampleKo: '창가 자리를 선호합니다.', phonetic: '[윈도우 시트]', tag: '기내 시설' },
    { id: 'en-n1-w13', type: 'word', term: 'Aisle seat', meaning: '통로 좌석', example: 'An aisle seat, please.', exampleKo: '통로 쪽 좌석으로 부탁합니다.', phonetic: '[아일 시트]', tag: '기내 시설' },
    { id: 'en-n1-w14', type: 'word', term: 'Blanket', meaning: '담요', example: 'Could I get an extra blanket?', exampleKo: '담요 한 장 더 주실 수 있나요?', phonetic: '[블랭킷]', tag: '기내 서비스' },
    { id: 'en-n1-w15', type: 'word', term: 'Headphones', meaning: '이어폰 / 헤드폰', example: 'My headphones are not working.', exampleKo: '제 이어폰이 작동하지 않아요.', phonetic: '[헤드폰즈]', tag: '기내 서비스' },
    { id: 'en-n1-w16', type: 'word', term: 'Water', meaning: '물 / 생수', example: 'Could I have cold water, please?', exampleKo: '시원한 물 한 잔 부탁합니다.', phonetic: '[워터]', tag: '기내 식음료' },
    { id: 'en-n1-w17', type: 'word', term: 'Coffee', meaning: '커피', example: 'Black coffee without sugar, please.', exampleKo: '설탕 없는 블랙커피로 부탁합니다.', phonetic: '[커피]', tag: '기내 식음료' },
    { id: 'en-n1-w18', type: 'word', term: 'Seatbelt', meaning: '안전벨트', example: 'Please fasten your seatbelt.', exampleKo: '안전벨트를 매어 주세요.', phonetic: '[시트벨트]', tag: '기내 안전' },
    { id: 'en-n1-w19', type: 'word', term: 'Takeoff', meaning: '이륙', example: 'Prepare for takeoff, please.', exampleKo: '이륙을 준비해 주세요.', phonetic: '[테이크오프]', tag: '운항 안내' },
    { id: 'en-n1-w20', type: 'word', term: 'Landing', meaning: '착륙', example: 'We will be landing soon.', exampleKo: '곧 착륙할 예정입니다.', phonetic: '[랜딩]', tag: '운항 안내' },
    { id: 'en-n1-s01', type: 'sentence', term: 'A glass of water, please.', meaning: '물 한 잔 부탁합니다.', example: 'A glass of water with ice, please.', exampleKo: '얼음 띄운 물 한 잔 부탁합니다.', phonetic: '[어 글래스 오브 워터 플리즈]', tag: '기내 요청' },
    { id: 'en-n1-s02', type: 'sentence', term: 'Can I change my seat?', meaning: '자리 변경할 수 있나요?', example: 'If available, can I change my seat?', exampleKo: '여유가 있다면 자리를 바꿔도 될까요?', phonetic: '[캔 아이 체인지 마이 시트]', tag: '기내 요청' },
    { id: 'en-n1-s03', type: 'sentence', term: 'Thank you very much for your help.', meaning: '도와주셔서 정말 감사합니다.', example: 'Thank you very much for your kind help.', exampleKo: '친절히 도와주셔서 정말 감사합니다.', phonetic: '[땡큐 베리 머치 포 유어 헬프]', tag: '감사 표현' },
    { id: 'en-n1-s04', type: 'sentence', term: 'Do you have an extra blanket?', meaning: '담요 하나 더 있나요?', example: 'I feel a bit cold, do you have an extra blanket?', exampleKo: '조금 추운데 담요 하나 더 있나요?', phonetic: '[두 유 해브 언 엑스트라 블랭킷]', tag: '기내 요청' },
    { id: 'en-n1-s05', type: 'sentence', term: 'Where is the restroom?', meaning: '화장실이 어디에 있나요?', example: 'Excuse me, where is the nearest restroom?', exampleKo: '실례합니다, 가장 가까운 화장실이 어디인가요?', phonetic: '[웨어 이즈 더 레스트룸]', tag: '기내 시설' },
    { id: 'en-n1-s06', type: 'sentence', term: 'What time do we land?', meaning: '몇 시에 착륙하나요?', example: 'Excuse me, what time do we land in New York?', exampleKo: '실례합니다, 뉴욕에 몇 시에 착륙하나요?', phonetic: '[왓 타임 두 위 랜드]', tag: '운항 문의' }
  ];

  // 3과 (수하물 찾기와 세관) 영어 코스 대응 데이터
  const LESSON_2_WORDS_EN = [
    {
      id: 'en-n2-w01',
      type: 'word',
      term: 'Passport',
      meaning: '여권',
      phonetic: '[패스포트]',
      tag: '입국 심사 필수',
      example: 'Here is my passport and ticket.',
      exampleKo: '여기 제 여권과 비행기표가 있습니다.',
      example_ko: '여기 제 여권과 비행기표가 있습니다.'
    },
    {
      id: 'en-n2-w02',
      type: 'word',
      term: 'Visa',
      meaning: '비자 / 입국 허가',
      phonetic: '[비자]',
      tag: '필수 서류',
      example: 'I have a valid tourist visa.',
      exampleKo: '유효한 관광 비자를 소지하고 있습니다.',
      example_ko: '유효한 관광 비자를 소지하고 있습니다.'
    },
    {
      id: 'en-n2-w03',
      type: 'word',
      term: 'Purpose',
      meaning: '방문 목적',
      phonetic: '[퍼포스]',
      tag: '심사 인터뷰',
      example: 'What is the purpose of your visit?',
      exampleKo: '방문 목적이 무엇인가요?',
      example_ko: '방문 목적이 무엇인가요?'
    },
    {
      id: 'en-n2-w04',
      type: 'word',
      term: 'Tourism',
      meaning: '관광',
      phonetic: '[투어리즘]',
      tag: '방문 목적',
      example: 'I am visiting for tourism.',
      exampleKo: '관광 목적으로 방문했습니다.',
      example_ko: '관광 목적으로 방문했습니다.'
    },
    {
      id: 'en-n2-w05',
      type: 'word',
      term: 'Business',
      meaning: '출장 / 사업',
      phonetic: '[비즈니스]',
      tag: '방문 목적',
      example: 'I am here on a business trip.',
      exampleKo: '사업 출장 차 왔습니다.',
      example_ko: '사업 출장 차 왔습니다.'
    },
    {
      id: 'en-n2-w06',
      type: 'word',
      term: 'Stay',
      meaning: '체류 기간',
      phonetic: '[스테이]',
      tag: '체류 관련',
      example: 'How long is your stay?',
      exampleKo: '체류 기간이 얼마나 되나요?',
      example_ko: '체류 기간이 얼마나 되나요?'
    },
    {
      id: 'en-n2-w07',
      type: 'word',
      term: 'Baggage',
      meaning: '수하물 / 짐',
      phonetic: '[배기지]',
      tag: '공항 필수',
      example: 'I have two pieces of baggage.',
      exampleKo: '짐이 두 개 있습니다.',
      example_ko: '짐이 두 개 있습니다.'
    },
    {
      id: 'en-n2-w08',
      type: 'word',
      term: 'Customs',
      meaning: '세관 / 통관',
      phonetic: '[커스텀스]',
      tag: '세관 통관',
      example: 'Please proceed to customs.',
      exampleKo: '세관으로 이동해 주세요.',
      example_ko: '세관으로 이동해 주세요.'
    },
    {
      id: 'en-n2-w09',
      type: 'word',
      term: 'Declaration',
      meaning: '세관 신고서',
      phonetic: '[데클라레이션]',
      tag: '세관 서류',
      example: 'Fill out this customs declaration card.',
      exampleKo: '이 세관 신고서를 작성하세요.',
      example_ko: '이 세관 신고서를 작성하세요.'
    },
    {
      id: 'en-n2-w10',
      type: 'word',
      term: 'Accommodation',
      meaning: '숙소 / 숙박지',
      phonetic: '[어코모데이션]',
      tag: '체류 정보',
      example: 'Where is your accommodation located?',
      exampleKo: '숙소 위치가 어디인가요?',
      example_ko: '숙소 위치가 어디인가요?'
    },
    {
      id: 'en-n2-w11',
      type: 'word',
      term: 'Hotel',
      meaning: '호텔',
      phonetic: '[호텔]',
      tag: '숙박 시설',
      example: 'I will stay at a downtown hotel.',
      exampleKo: '시내 호텔에서 머물 것입니다.',
      example_ko: '시내 호텔에서 머물 것입니다.'
    },
    {
      id: 'en-n2-w12',
      type: 'word',
      term: 'Return ticket',
      meaning: '귀국 항공권 / 왕복표',
      phonetic: '[리턴 티켓]',
      tag: '필수 증빙',
      example: 'Please show your return ticket.',
      exampleKo: '귀국 항공권을 보여주세요.',
      example_ko: '귀국 항공권을 보여주세요.'
    },
    {
      id: 'en-n2-w13',
      type: 'word',
      term: 'Passport control',
      meaning: '여권 심사대',
      phonetic: '[패스포트 컨트롤]',
      tag: '공항 시설',
      example: 'Line up at the passport control.',
      exampleKo: '여권 심사대에 줄을 서세요.',
      example_ko: '여권 심사대에 줄을 서세요.'
    },
    {
      id: 'en-n2-w14',
      type: 'word',
      term: 'Immigration officer',
      meaning: '출입국 심사관',
      phonetic: '[이미그레이션 오피서]',
      tag: '심사관 호출',
      example: 'The immigration officer checked my documents.',
      exampleKo: '입국 심사관이 내 서류를 검토했습니다.',
      example_ko: '입국 심사관이 내 서류를 검토했습니다.'
    },
    {
      id: 'en-n2-w15',
      type: 'word',
      term: 'Duration',
      meaning: '기간 / 체류 일수',
      phonetic: '[듀레이션]',
      tag: '인터뷰 질문',
      example: 'What is the duration of your stay?',
      exampleKo: '체류 기간이 어떻게 되나요?',
      example_ko: '체류 기간이 어떻게 되나요?'
    },
    {
      id: 'en-n2-w16',
      type: 'word',
      term: 'Address',
      meaning: '주소 / 행선지',
      phonetic: '[어드레스]',
      tag: '입국 서류',
      example: 'Write down the address of your stay.',
      exampleKo: '체류하실 곳의 주소를 적어주세요.',
      example_ko: '체류하실 곳의 주소를 적어주세요.'
    },
    {
      id: 'en-n2-w17',
      type: 'word',
      term: 'Entry form',
      meaning: '입국 신고서',
      phonetic: '[엔트리 폼]',
      tag: '필수 서류',
      example: 'Sign the entry form at the bottom.',
      exampleKo: '입국 신고서 하단에 서명하세요.',
      example_ko: '입국 신고서 하단에 서명하세요.'
    },
    {
      id: 'en-n2-w18',
      type: 'word',
      term: 'Currency',
      meaning: '통화 / 화폐',
      phonetic: '[커런시]',
      tag: '세관 신고',
      example: 'Do you carry excessive foreign currency?',
      exampleKo: '초과 외화를 소지하고 계신가요?',
      example_ko: '초과 외화를 소지하고 계신가요?'
    },
    {
      id: 'en-n2-w19',
      type: 'word',
      term: 'Border',
      meaning: '국경',
      phonetic: '[보더]',
      tag: '출입국 용어',
      example: 'We crossed the international border.',
      exampleKo: '우리는 국제 국경을 넘었습니다.',
      example_ko: '우리는 국제 국경을 넘었습니다.'
    },
    {
      id: 'en-n2-w20',
      type: 'word',
      term: 'Entry stamp',
      meaning: '입국 도장',
      phonetic: '[엔트리 스탬프]',
      tag: '입국 완료',
      example: 'The officer gave me an entry stamp.',
      exampleKo: '심사관이 입국 도장을 찍어주었습니다.',
      example_ko: '심사관이 입국 도장을 찍어주었습니다.'
    }
  ];

  // ===================================================
  // [2과: 입국 심사] 영어 코스 대응 문장 6개
  // ===================================================
  const LESSON_2_SENTENCES_EN = [
    {
      id: 'en-n2-s01',
      type: 'sentence',
      term: 'Here is my passport and my return ticket.',
      meaning: '여기 제 여권과 귀국 항공권입니다.',
      phonetic: '[히어 이즈 마이 패스포트 앤 마이 리턴 티켓]',
      tag: '서류 제출',
      example: 'Good morning, here is my passport and my return ticket.',
      exampleKo: '좋은 아침입니다, 여기 제 여권과 귀국 항공권입니다.',
      example_ko: '좋은 아침입니다, 여기 제 여권과 귀국 항공권입니다.'
    },
    {
      id: 'en-n2-s02',
      type: 'sentence',
      term: 'The purpose of my trip is tourism.',
      meaning: '제 여행 목적은 관광입니다.',
      phonetic: '[더 퍼포스 오브 마이 트립 이즈 투어리즘]',
      tag: '방문 목적',
      example: 'I am here for vacation, the purpose of my trip is tourism.',
      exampleKo: '휴가차 왔으며 여행 목적은 관광입니다.',
      example_ko: '휴가차 왔으며 여행 목적은 관광입니다.'
    },
    {
      id: 'en-n2-s03',
      type: 'sentence',
      term: 'I will stay in Spain for ten days.',
      meaning: '저는 스페인에서 열흘 동안 머물 예정입니다.',
      phonetic: '[아이 윌 스테이 인 스페인 포 텐 데이즈]',
      tag: '체류 기간',
      example: 'I will stay in Spain for ten days and then fly back.',
      exampleKo: '스페인에서 열흘 머무른 뒤 귀국합니다.',
      example_ko: '스페인에서 열흘 머무른 뒤 귀국합니다.'
    },
    {
      id: 'en-n2-s04',
      type: 'sentence',
      term: 'I have a confirmed reservation at this hotel.',
      meaning: '이 호텔에 예약 확인 내역이 있습니다.',
      phonetic: '[아이 해브 어 컨펌드 레저베이션 앳 디스 호텔]',
      tag: '숙소 확인',
      example: 'Here is the address, I have a confirmed reservation at this hotel.',
      exampleKo: '여기 주소가 있으며, 이 호텔에 예약 내역이 있습니다.',
      example_ko: '여기 주소가 있으며, 이 호텔에 예약 내역이 있습니다.'
    },
    {
      id: 'en-n2-s05',
      type: 'sentence',
      term: 'I am traveling alone for vacation and rest.',
      meaning: '휴식과 휴가를 위해 혼자 여행합니다.',
      phonetic: '[아이 앰 트래블링 얼론 포 베이케이션 앤 레스트]',
      tag: '동행 여부',
      example: 'Not for business, I am traveling alone for vacation and rest.',
      exampleKo: '일 때문이 아니라 휴가를 위해 혼자 여행합니다.',
      example_ko: '일 때문이 아니라 휴가를 위해 혼자 여행합니다.'
    },
    {
      id: 'en-n2-s06',
      type: 'sentence',
      term: 'I have nothing to declare at customs.',
      meaning: '세관에 신고할 물품이 전혀 없습니다.',
      phonetic: '[아이 해브 낫띵 투 디클레어 앳 커스텀스]',
      tag: '세관 통과',
      example: 'Only personal belongings, I have nothing to declare at customs.',
      exampleKo: '개인 소지품만 있어서 세관에 신고할 물품이 전혀 없습니다.',
      example_ko: '개인 소지품만 있어서 세관에 신고할 물품이 전혀 없습니다.'
    }
  ];

  // 1과 (기내 기본 표현) 보존용 데이터
  const LESSON_3_EN = [
    { id: 'en-n3-w01', type: 'word', term: 'Baggage claim', meaning: '수하물 수취대', example: 'Where is the baggage claim area?', exampleKo: '수하물 수취대가 어디인가요?', phonetic: '[배기지 클레임]', tag: '공항 필수' },
    { id: 'en-n3-w02', type: 'word', term: 'Suitcase', meaning: '여행 가방 / 캐리어', example: 'This is my black suitcase.', exampleKo: '이것이 제 검은색 캐리어입니다.', phonetic: '[수트케이스]', tag: '필수 어휘' },
    { id: 'en-n3-w03', type: 'word', term: 'Lost luggage', meaning: '분실된 수하물', example: 'I want to report my lost luggage.', exampleKo: '가방 분실을 신고하고 싶습니다.', phonetic: '[로스트 러기지]', tag: '위기 대처' },
    { id: 'en-n3-w04', type: 'word', term: 'Luggage tag', meaning: '수하물 태그', example: 'Here is my luggage claim tag.', exampleKo: '여기 수하물 태그가 있습니다.', phonetic: '[러기지 태그]', tag: '공항 필수' },
    { id: 'en-n3-w05', type: 'word', term: 'Customs inspection', meaning: '세관 검사', example: 'Please open your bag for customs inspection.', exampleKo: '세관 검사를 위해 가방을 열어주세요.', phonetic: '[커스텀스 인스펙션]', tag: '세관 필수' },
    { id: 'en-n3-w06', type: 'word', term: 'Tax', meaning: '세금 / 관세', example: 'You need to pay duty and tax.', exampleKo: '관세를 납부하셔야 합니다.', phonetic: '[택스]', tag: '세관 필수' },
    { id: 'en-n3-w07', type: 'word', term: 'Prohibited items', meaning: '반입 금지 물품', example: 'I do not have any prohibited items.', exampleKo: '반입 금지 물품은 없습니다.', phonetic: '[프로히비티드 아이템스]', tag: '세관 규정' },
    { id: 'en-n3-w08', type: 'word', term: 'Liquids', meaning: '액체류', example: 'Liquids must be in clear sealed bags.', exampleKo: '액체류는 투명 밀봉백에 넣어야 합니다.', phonetic: '[리퀴즈]', tag: '보안 규정' },
    { id: 'en-n3-w09', type: 'word', term: 'Nothing to declare', meaning: '신고 물품 없음 / 면세', example: 'Please proceed to the nothing to declare exit.', exampleKo: '신고 물품 없음 출구로 가세요.', phonetic: '[낫띵 투 디클레어]', tag: '세관 통로' },
    { id: 'en-n3-w10', type: 'word', term: 'Luggage cart', meaning: '수하물 카트', example: 'Where can I find a luggage cart?', exampleKo: '수하물 카트는 어디서 찾을 수 있나요?', phonetic: '[러기지 카트]', tag: '공항 편의' },
    { id: 'en-n3-w11', type: 'word', term: 'Damaged luggage', meaning: '파손된 짐', example: 'My luggage arrived damaged.', exampleKo: '제 짐이 파손되어 도착했습니다.', phonetic: '[데미지드 러기지]', tag: '위기 대처' },
    { id: 'en-n3-w12', type: 'word', term: 'Receipt', meaning: '구매 영수증', example: 'Do you have the purchase receipt?', exampleKo: '구매 영수증이 있으신가요?', phonetic: '[리시트]', tag: '세관 증빙' },
    { id: 'en-n3-w13', type: 'word', term: 'Green channel', meaning: '녹색 통로 (면세)', example: 'Follow the green channel if you have nothing to declare.', exampleKo: '신고할 물품이 없으면 녹색 통로로 가세요.', phonetic: '[그린 채널]', tag: '세관 통로' },
    { id: 'en-n3-s01', type: 'sentence', term: 'Where is the baggage claim?', meaning: '수하물 수취대가 어디인가요?', example: 'Excuse me, where is the baggage claim for flight 204?', exampleKo: '실례합니다, 204편 수하물 수취대가 어디인가요?', phonetic: '[웨어 이즈 더 배기지 클레임]', tag: '공항 필수' },
    { id: 'en-n3-s02', type: 'sentence', term: 'I want to report lost baggage.', meaning: '수하물 분실을 신고하고 싶습니다.', example: 'My suitcase did not appear, I want to report lost baggage.', exampleKo: '캐리어가 나오지 않아 분실 신고를 하고 싶습니다.', phonetic: '[아이 원트 투 리포트 로스트 배기지]', tag: '위기 대처' },
    { id: 'en-n3-s03', type: 'sentence', term: 'I have nothing to declare.', meaning: '신고할 물품이 없습니다.', example: 'Everything in my bag is personal, I have nothing to declare.', exampleKo: '가방 안의 모든 것은 개인 소지품이라 신고할 것이 없습니다.', phonetic: '[아이 해브 낫띵 투 디클레어]', tag: '세관 통관' }
  ];

  // 전체 데이터베이스 구조 (app.js 연동)
  const LESSON_BOSS_EN = [
    { id: 'en-nb-w01', type: 'word', term: 'Hello', word: 'Hello', meaning: '안녕하세요 / 안녕', phonetic: '[헬로우]', example: 'Hello, nice to meet you.', exampleKo: '안녕하세요, 만나서 반갑습니다.', tag: '필수 인사' },
    { id: 'en-nb-w02', type: 'word', term: 'Good morning', word: 'Good morning', meaning: '좋은 아침 / 안녕하세요', phonetic: '[굿 모닝]', example: 'Good morning, have a great day.', exampleKo: '좋은 아침이에요, 멋진 하루 보내세요.', tag: '필수 인사' },
    { id: 'en-nb-w03', type: 'word', term: 'Thank you', word: 'Thank you', meaning: '감사합니다 / 고마워', phonetic: '[땡큐]', example: 'Thank you very much for your help.', exampleKo: '도와주셔서 정말 감사합니다.', tag: '필수 예절' },
    { id: 'en-nb-w04', type: 'word', term: 'Please', word: 'Please', meaning: '부탁합니다 / 제발', phonetic: '[플리즈]', example: 'A cup of coffee, please.', exampleKo: '커피 한 잔 부탁합니다.', tag: '필수 예절' },
    { id: 'en-nb-w05', type: 'word', term: 'Sorry', word: 'Sorry', meaning: '죄송합니다 / 미안해요', phonetic: '[쏘리]', example: 'I am so sorry for being late.', exampleKo: '늦어서 정말 죄송합니다.', tag: '필수 예절' },
    { id: 'en-nb-w06', type: 'word', term: 'You are welcome', word: 'You are welcome', meaning: '천만에요', phonetic: '[유어 웰컴]', example: 'You are very welcome!', exampleKo: '별말씀을요, 천만에요!', tag: '필수 예절' },
    { id: 'en-nb-w07', type: 'word', term: 'Nice to meet you', word: 'Nice to meet you', meaning: '만나서 반갑습니다', phonetic: '[나이스 투 밋 유]', example: 'Nice to meet you in person.', exampleKo: '직접 만나 뵙게 되어 반갑습니다.', tag: '첫 만남' },
    { id: 'en-nb-w08', type: 'word', term: 'Goodbye', word: 'Goodbye', meaning: '안녕히 가세요 / 작별', phonetic: '[굿바이]', example: 'Goodbye and see you soon!', exampleKo: '안녕히 가세요, 곧 또 만나요!', tag: '작별 인사' },
    { id: 'en-nb-w09', type: 'word', term: 'One, two, three', word: 'One, two, three', meaning: '하나, 둘, 셋 (1, 2, 3)', phonetic: '[원, 투, 쓰리]', example: 'One, two, three, let us go!', exampleKo: '하나, 둘, 셋, 출발합시다!', tag: '기초 숫자' },
    { id: 'en-nb-w10', type: 'word', term: 'Ten', word: 'Ten', meaning: '열 (10)', phonetic: '[텐]', example: 'That will be ten dollars.', exampleKo: '총 10달러입니다.', tag: '기초 숫자' },
    { id: 'en-nb-w11', type: 'word', term: 'Hundred', word: 'Hundred', meaning: '백 (100)', phonetic: '[헌드레드]', example: 'One hundred percent confident.', exampleKo: '100퍼센트 자신 있습니다.', tag: '기초 숫자' },
    { id: 'en-nb-w12', type: 'word', term: 'How much is it?', word: 'How much is it?', meaning: '얼마인가요?', phonetic: '[하우 머치 이즈 잇]', example: 'Excuse me, how much is this?', exampleKo: '실례합니다, 이것은 얼마인가요?', tag: '쇼핑/일상' },
    { id: 'en-nb-w13', type: 'word', term: 'Where is it?', word: 'Where is it?', meaning: '어디에 있나요?', phonetic: '[웨어 이즈 잇]', example: 'Where is the nearest subway station?', exampleKo: '가장 가까운 지하철역이 어디인가요?', tag: '길찾기' },
    { id: 'en-nb-w14', type: 'word', term: 'Friend', word: 'Friend', meaning: '친구', phonetic: '[프렌드]', example: 'She is my best friend.', exampleKo: '그녀는 제 가장 친한 친구입니다.', tag: '일상 어휘' },
    { id: 'en-nb-w15', type: 'word', term: 'Awesome', word: 'Awesome', meaning: '최고의 / 훌륭한', phonetic: '[오썸]', example: 'You did an awesome job!', exampleKo: '정말 멋지게 잘 해내셨어요!', tag: '칭찬/감탄' },
    { id: 'en-nb-s01', type: 'sentence', term: 'Thank you so much for everything!', word: 'Thank you so much for everything!', meaning: '모든 것에 정말 감사합니다!', phonetic: '[땡큐 쏘 머치 포 에브리띵]', example: 'Thank you so much for everything today!', exampleKo: '오늘 모든 것에 진심으로 감사드려요!', tag: '보스 실전 문장' },
    { id: 'en-nb-s02', type: 'sentence', term: 'Have a wonderful day ahead!', word: 'Have a wonderful day ahead!', meaning: '앞으로 멋진 하루 보내세요!', phonetic: '[해브 어 원더풀 데이 어헤드]', example: 'Goodbye, have a wonderful day ahead!', exampleKo: '안녕히 가세요, 멋진 하루 보내세요!', tag: '보스 실전 문장' },
    { id: 'en-nb-s03', type: 'sentence', term: 'Could you please help me with this?', word: 'Could you please help me with this?', meaning: '이것 좀 도와주실 수 있나요?', phonetic: '[쿠쥬 플리즈 헬프 미 위드 디스]', example: 'Excuse me, could you please help me with this?', exampleKo: '실례합니다, 이것 좀 도와주실 수 있을까요?', tag: '보스 실전 문장' }
  ];


  // 1과 (기내 기본 표현) 영어 코스 대응 데이터

  // VOCA_DATA 데이터베이스에 영어 데이터 주입
  if (typeof window !== 'undefined' && window.VOCA_DATA && window.VOCA_DATA.database) {
    if (window.VOCA_DATA.database['node-1']) window.VOCA_DATA.database['node-1'].en = LESSON_1_EN;
    if (window.VOCA_DATA.database['node-2']) window.VOCA_DATA.database['node-2'].en = [...LESSON_2_WORDS_EN, ...LESSON_2_SENTENCES_EN];
    if (window.VOCA_DATA.database['node-3']) window.VOCA_DATA.database['node-3'].en = LESSON_3_EN;
    if (window.VOCA_DATA.database['node-boss']) window.VOCA_DATA.database['node-boss'].en = LESSON_BOSS_EN;
  }

  const courseData_en = {
    id: 'en_main',
    courseId: 'en_main',
    code: 'en',
    name: '영어 정규 코스',
    courseName: '영어 정규 코스',
    title: '영어 (필수 회화 & 어휘)',
    desc: '영어 (필수 회화 & 어휘)',
    description: '영어 (필수 회화 & 어휘)',
    badge: '🇺🇸 정규 코스',
    icon: '🇺🇸',
    flag: '🇺🇸',
    mascotImg: 'assets/characters/en-study.webp?v=88',
    ctaText: '영어로 학습하기',
    totalUnits: 10,
    units: [
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
    ],
    words: [
      ...LESSON_1_EN.filter(w => w.type === 'word' || !w.type),
      ...LESSON_2_WORDS_EN,
      ...LESSON_3_EN.filter(w => w.type === 'word'),
      ...LESSON_BOSS_EN.filter(w => w.type === 'word')
    ],
    sentences: [
      ...LESSON_1_EN.filter(s => s.type === 'sentence'),
      ...LESSON_2_SENTENCES_EN,
      ...LESSON_3_EN.filter(s => s.type === 'sentence'),
      ...LESSON_BOSS_EN.filter(s => s.type === 'sentence')
    ],
    lessons: {
      'node-1': { title: '1과: 기내 기본 표현', desc: 'Seat, Water 등 비행기 탑승 필수 영어 단어와 표현을 완벽하게 학습해보세요!', icon: '✈️', level: '초급', category: '공항/기내', tags: ['공항/기내', '공항', '기내', '비행기'] },
      'node-2': { title: '2과: 입국 심사', desc: 'Passport, Purpose 등 필수 공항 인터뷰 질문과 핵심 어휘 및 실전문장을 마스터하세요!', icon: '🛂', level: '초중급', category: '교통/길찾기', tags: ['교통/길찾기', '입국 심사', '인터뷰', '심사'] },
      'node-3': { title: '3과: 수하물 찾기와 세관', desc: 'Baggage claim, Customs 등 수하물 수취와 세관 검사 필수 표현을 마스터해보세요!', icon: '🧳', level: '중급', category: '호텔/숙소', tags: ['호텔/숙소', '수하물 찾기와 세관', '수하물', '세관'] },
      'node-boss': { title: '보스전: 뉴욕 마스터 관문', desc: '미국 입국 심사 및 공항 필수 영어 총정리 관문', icon: '👑', level: '보스전', category: '식당/카페', tags: ['식당/카페', '공항 마스터', '보스전'] }
    }
  };

  if (typeof window !== 'undefined') {
    window.courseData_en = courseData_en;
    if (window.COURSES) {
      window.COURSES['en_main'] = courseData_en;
    }
  }

  return Object.freeze(courseData_en);
});
