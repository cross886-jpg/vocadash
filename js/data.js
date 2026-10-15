// =================================================
// VocaDash Lesson 2 (입국 심사) Vocabulary & Sentence Database
// VOCA_DATA: 2과 핵심 스페인어 단어 20개 + 실전 문장 6개
// (Smart Sampling & Random Distractor Engine for VocaDash App)
// =================================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VOCA_DATA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Fisher-Yates 무작위 셔플 알고리즘
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ===================================================
  // [2과: 입국 심사] 스페인어 핵심 단어 20개
  // ===================================================
  const LESSON_2_WORDS_ES = [
    {
      id: 'es-n2-w01',
      type: 'word',
      term: 'Pasaporte',
      meaning: '여권',
      phonetic: '[파사포르테]',
      tag: '입국 심사 필수',
      example: 'Aquí tiene mi pasaporte y billete.',
      exampleKo: '여기 제 여권과 항공권이 있습니다.',
      example_ko: '여기 제 여권과 항공권이 있습니다.'
    },
    {
      id: 'es-n2-w02',
      type: 'word',
      term: 'Visado',
      meaning: '비자 / 입국 허가',
      phonetic: '[비사도]',
      tag: '필수 서류',
      example: 'Tengo un visado de turista válido.',
      exampleKo: '유효한 관광 비자를 소지하고 있습니다.',
      example_ko: '유효한 관광 비자를 소지하고 있습니다.'
    },
    {
      id: 'es-n2-w03',
      type: 'word',
      term: 'Propósito',
      meaning: '방문 목적',
      phonetic: '[프로포시토]',
      tag: '심사 인터뷰',
      example: '¿Cuál es el propósito de su viaje?',
      exampleKo: '여행 목적이 무엇인가요?',
      example_ko: '여행 목적이 무엇인가요?'
    },
    {
      id: 'es-n2-w04',
      type: 'word',
      term: 'Turismo',
      meaning: '관광',
      phonetic: '[투리스모]',
      tag: '방문 목적',
      example: 'Viajo a España por turismo.',
      exampleKo: '스페인에 관광 목적으로 여행합니다.',
      example_ko: '스페인에 관광 목적으로 여행합니다.'
    },
    {
      id: 'es-n2-w05',
      type: 'word',
      term: 'Negocios',
      meaning: '출장 / 사업',
      phonetic: '[네고시오스]',
      tag: '방문 목적',
      example: 'Estoy aquí por viaje de negocios.',
      exampleKo: '사업 출장 차 여기에 왔습니다.',
      example_ko: '사업 출장 차 여기에 왔습니다.'
    },
    {
      id: 'es-n2-w06',
      type: 'word',
      term: 'Estancia',
      meaning: '체류 기간',
      phonetic: '[에스탄시아]',
      tag: '체류 관련',
      example: 'La estancia máxima es de noventa días.',
      exampleKo: '최대 체류 기간은 90일입니다.',
      example_ko: '최대 체류 기간은 90일입니다.'
    },
    {
      id: 'es-n2-w07',
      type: 'word',
      term: 'Equipaje',
      meaning: '수하물 / 짐',
      phonetic: '[에키파헤]',
      tag: '공항 필수',
      example: 'Llevo dos piezas de equipaje.',
      exampleKo: '수하물 두 개를 가지고 있습니다.',
      example_ko: '수하물 두 개를 가지고 있습니다.'
    },
    {
      id: 'es-n2-w08',
      type: 'word',
      term: 'Aduana',
      meaning: '세관 / 통관',
      phonetic: '[아두아나]',
      tag: '세관 통관',
      example: 'Pase por el control de aduana.',
      exampleKo: '세관 검사대를 통과해 주세요.',
      example_ko: '세관 검사대를 통과해 주세요.'
    },
    {
      id: 'es-n2-w09',
      type: 'word',
      term: 'Declaración',
      meaning: '세관 신고서',
      phonetic: '[데클라라시온]',
      tag: '세관 서류',
      example: 'Rellene esta hoja de declaración.',
      exampleKo: '이 신고서 서식을 작성해 주세요.',
      example_ko: '이 신고서 서식을 작성해 주세요.'
    },
    {
      id: 'es-n2-w10',
      type: 'word',
      term: 'Alojamiento',
      meaning: '숙소 / 숙박지',
      phonetic: '[알로하미엔토]',
      tag: '체류 정보',
      example: '¿Dónde está su alojamiento en Madrid?',
      exampleKo: '마드리드 숙소는 어디에 있나요?',
      example_ko: '마드리드 숙소는 어디에 있나요?'
    },
    {
      id: 'es-n2-w11',
      type: 'word',
      term: 'Hotel',
      meaning: '호텔',
      phonetic: '[오텔]',
      tag: '숙박 시설',
      example: 'Me alojaré en un hotel céntrico.',
      exampleKo: '시내 중심가 호텔에 묵을 예정입니다.',
      example_ko: '시내 중심가 호텔에 묵을 예정입니다.'
    },
    {
      id: 'es-n2-w12',
      type: 'word',
      term: 'Billete de vuelta',
      meaning: '귀국 항공권 / 왕복표',
      phonetic: '[비예테 데 부엘타]',
      tag: '필수 증빙',
      example: 'Muestre su billete de vuelta, por favor.',
      exampleKo: '귀국 항공권을 보여주세요.',
      example_ko: '귀국 항공권을 보여주세요.'
    },
    {
      id: 'es-n2-w13',
      type: 'word',
      term: 'Control de pasaportes',
      meaning: '여권 심사대',
      phonetic: '[콘트롤 데 파사포르테스]',
      tag: '공항 시설',
      example: 'Haga la fila en el control de pasaportes.',
      exampleKo: '여권 심사대 줄을 서 주세요.',
      example_ko: '여권 심사대 줄을 서 주세요.'
    },
    {
      id: 'es-n2-w14',
      type: 'word',
      term: 'Oficial de inmigración',
      meaning: '출입국 심사관',
      phonetic: '[오피시알 데 인미그라시온]',
      tag: '심사관 호출',
      example: 'El oficial de inmigración revisa los documentos.',
      exampleKo: '입국 심사관이 서류를 검토합니다.',
      example_ko: '입국 심사관이 서류를 검토합니다.'
    },
    {
      id: 'es-n2-w15',
      type: 'word',
      term: 'Duración',
      meaning: '기간 / 체류 일수',
      phonetic: '[두라시온]',
      tag: '인터뷰 질문',
      example: '¿Cuál es la duración de su estancia?',
      exampleKo: '체류 기간이 어떻게 되나요?',
      example_ko: '체류 기간이 어떻게 되나요?'
    },
    {
      id: 'es-n2-w16',
      type: 'word',
      term: 'Dirección',
      meaning: '주소 / 행선지',
      phonetic: '[디렉시온]',
      tag: '입국 서류',
      example: 'Escriba la dirección de su estancia.',
      exampleKo: '머무실 곳의 주소를 적어주세요.',
      example_ko: '머무실 곳의 주소를 적어주세요.'
    },
    {
      id: 'es-n2-w17',
      type: 'word',
      term: 'Formulario de entrada',
      meaning: '입국 신고서',
      phonetic: '[포르물라리오 데 엔트라다]',
      tag: '필수 서류',
      example: 'Firme el formulario de entrada al final.',
      exampleKo: '입국 신고서 하단에 서명해 주세요.',
      example_ko: '입국 신고서 하단에 서명해 주세요.'
    },
    {
      id: 'es-n2-w18',
      type: 'word',
      term: 'Moneda',
      meaning: '통화 / 화폐',
      phonetic: '[모네다]',
      tag: '세관 신고',
      example: '¿Lleva moneda extranjera o efectivo?',
      exampleKo: '외화나 현금을 소지하고 계신가요?',
      example_ko: '외화나 현금을 소지하고 계신가요?'
    },
    {
      id: 'es-n2-w19',
      type: 'word',
      term: 'Frontera',
      meaning: '국경',
      phonetic: '[프론테라]',
      tag: '출입국 용어',
      example: 'Bienvenidos al cruce de frontera.',
      exampleKo: '국경 통과소에 오신 것을 환영합니다.',
      example_ko: '국경 통과소에 오신 것을 환영합니다.'
    },
    {
      id: 'es-n2-w20',
      type: 'word',
      term: 'Sello de entrada',
      meaning: '입국 도장',
      phonetic: '[세요 데 엔트라다]',
      tag: '입국 완료',
      example: 'Ponen el sello de entrada en el pasaporte.',
      exampleKo: '여권에 입국 확인 도장을 찍어줍니다.',
      example_ko: '여권에 입국 확인 도장을 찍어줍니다.'
    }
  ];

  // ===================================================
  // [2과: 입국 심사] 스페인어 실전 문장 6개
  // ===================================================
  const LESSON_2_SENTENCES_ES = [
    {
      id: 'es-n2-s01',
      type: 'sentence',
      term: 'Aquí tiene mi pasaporte y mi billete de vuelta.',
      meaning: '여기 제 여권과 귀국 항공권입니다.',
      phonetic: '[아키 티에네 미 파사포르테 이 미 비예테 데 부엘타]',
      tag: '서류 제출',
      example: 'Buenos días, aquí tiene mi pasaporte y mi billete de vuelta.',
      exampleKo: '좋은 아침입니다, 여기 제 여권과 귀국 항공권입니다.',
      example_ko: '좋은 아침입니다, 여기 제 여권과 귀국 항공권입니다.'
    },
    {
      id: 'es-n2-s02',
      type: 'sentence',
      term: 'El propósito de mi viaje es turismo.',
      meaning: '제 여행 목적은 관광입니다.',
      phonetic: '[엘 프로포시토 데 미 비아헤 에스 투리스모]',
      tag: '방문 목적',
      example: 'Vengo de vacaciones, el propósito de mi viaje es turismo.',
      exampleKo: '휴가차 왔으며 여행 목적은 관광입니다.',
      example_ko: '휴가차 왔으며 여행 목적은 관광입니다.'
    },
    {
      id: 'es-n2-s03',
      type: 'sentence',
      term: 'Me voy a quedar en España durante diez días.',
      meaning: '저는 스페인에서 열흘 동안 머물 예정입니다.',
      phonetic: '[메 보이 아 케다르 엔 에스파냐 두란테 디에스 디아스]',
      tag: '체류 기간',
      example: 'Me voy a quedar en España durante diez días y luego regreso.',
      exampleKo: '스페인에서 열흘 머무른 뒤 귀국합니다.',
      example_ko: '스페인에서 열흘 머무른 뒤 귀국합니다.'
    },
    {
      id: 'es-n2-s04',
      type: 'sentence',
      term: 'Tengo una reserva confirmada en este hotel.',
      meaning: '이 호텔에 예약 확인 내역이 있습니다.',
      phonetic: '[텐고 우나 레세르바 콘피르마다 엔 에스테 오텔]',
      tag: '숙소 확인',
      example: 'Aquí está la dirección, tengo una reserva confirmada en este hotel.',
      exampleKo: '여기 주소가 있으며, 이 호텔에 예약 내역이 있습니다.',
      example_ko: '여기 주소가 있으며, 이 호텔에 예약 내역이 있습니다.'
    },
    {
      id: 'es-n2-s05',
      type: 'sentence',
      term: 'Viajo solo por vacaciones y descanso.',
      meaning: '휴식과 휴가를 위해 혼자 여행합니다.',
      phonetic: '[비아호 솔로 포르 바카시오네스 이 데스칸소]',
      tag: '동행 여부',
      example: 'No vengo por trabajo, viajo solo por vacaciones y descanso.',
      exampleKo: '일 때문이 아니라 휴가를 위해 혼자 여행합니다.',
      example_ko: '일 때문이 아니라 휴가를 위해 혼자 여행합니다.'
    },
    {
      id: 'es-n2-s06',
      type: 'sentence',
      term: 'No tengo nada que declarar ante la aduana.',
      meaning: '세관에 신고할 물품이 전혀 없습니다.',
      phonetic: '[노 텐고 나다 케 데클라라르 안테 라 아두아나]',
      tag: '세관 통과',
      example: 'Solo llevo artículos personales, no tengo nada que declarar ante la aduana.',
      exampleKo: '개인 소지품만 있어서 세관에 신고할 물품이 전혀 없습니다.',
      example_ko: '개인 소지품만 있어서 세관에 신고할 물품이 전혀 없습니다.'
    }
  ];

  // ===================================================
  // [2과: 입국 심사] 영어 코스 대응 단어 20개
  // ===================================================
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
  const LESSON_1_ES = [
    { id: 'es-n1-w01', type: 'word', term: '¡Hola!', meaning: '안녕하세요!', example: '¡Hola! ¿Cómo estás?', exampleKo: '안녕하세요! 어떻게 지내세요?', phonetic: '[올라]', tag: '기초 필수' },
    { id: 'es-n1-w02', type: 'word', term: 'Gracias', meaning: '감사합니다', example: 'Muchas gracias por su ayuda.', exampleKo: '도움에 정말 감사드립니다.', phonetic: '[그라시아스]', tag: '예의 표현' },
    { id: 'es-n1-w03', type: 'word', term: 'Por favor', meaning: '부탁합니다', example: 'Un vaso de agua, por favor.', exampleKo: '물 한 잔 부탁합니다.', phonetic: '[포르 파보르]', tag: '주문/요청' },
    { id: 'es-n1-w04', type: 'word', term: 'Buenos días', meaning: '좋은 아침입니다', example: '¡Buenos días a todos!', exampleKo: '모두 좋은 아침입니다!', phonetic: '[부에노스 디아스]', tag: '일상 인사' },
    { id: 'es-n1-w05', type: 'word', term: '¡Adiós!', meaning: '안녕히 가세요', example: '¡Adiós! Hasta luego.', exampleKo: '안녕히 가세요! 나중에 봐요.', phonetic: '[아디오스]', tag: '작별 인사' },
    { id: 'es-n1-w06', type: 'word', term: 'Buenas tardes', meaning: '좋은 오후입니다', example: '¡Buenas tardes, señor!', exampleKo: '좋은 오후입니다, 손님!', phonetic: '[부에나스 타르데스]', tag: '일상 인사' },
    { id: 'es-n1-w07', type: 'word', term: 'Buenas noches', meaning: '좋은 밤 되세요', example: 'Buenas noches y que descanses.', exampleKo: '좋은 밤 되시고 푹 쉬세요.', phonetic: '[부에나스 노체스]', tag: '일상 인사' },
    { id: 'es-n1-w08', type: 'word', term: 'De nada', meaning: '천만에요', example: 'No hay de qué, de nada.', exampleKo: '별말씀을요, 천만에요.', phonetic: '[데 나다]', tag: '예의 표현' },
    { id: 'es-n1-w09', type: 'word', term: 'Disculpe', meaning: '실례합니다', example: 'Disculpe, ¿dónde está el baño?', exampleKo: '실례합니다, 화장실이 어디인가요?', phonetic: '[디스쿨페]', tag: '문의/호출' },
    { id: 'es-n1-w10', type: 'word', term: 'Hasta luego', meaning: '나중에 봐요', example: '¡Hasta luego, nos vemos pronto!', exampleKo: '나중에 봐요, 곧 만나요!', phonetic: '[아스타 루에고]', tag: '작별 인사' },
    { id: 'es-n1-w11', type: 'word', term: 'Asiento', meaning: '좌석 / 자리', example: '¿Cuál es mi asiento?', exampleKo: '제 좌석은 어디인가요?', phonetic: '[아시엔토]', tag: '기내 시설' },
    { id: 'es-n1-w12', type: 'word', term: 'Ventana', meaning: '창가 좌석', example: 'Prefiero asiento de ventana.', exampleKo: '창가 자리를 선호합니다.', phonetic: '[벤타나]', tag: '기내 시설' },
    { id: 'es-n1-w13', type: 'word', term: 'Pasillo', meaning: '통로 좌석', example: 'Un asiento de pasillo, por favor.', exampleKo: '통로 쪽 좌석으로 부탁합니다.', phonetic: '[파시요]', tag: '기내 시설' },
    { id: 'es-n1-w14', type: 'word', term: 'Manta', meaning: '담요', example: '¿Me puede dar una manta?', exampleKo: '담요 한 장 주실 수 있나요?', phonetic: '[만타]', tag: '기내 서비스' },
    { id: 'es-n1-w15', type: 'word', term: 'Auriculares', meaning: '이어폰 / 헤드폰', example: 'Mis auriculares no funcionan.', exampleKo: '제 이어폰이 작동하지 않아요.', phonetic: '[아우리쿨라레스]', tag: '기내 서비스' },
    { id: 'es-n1-w16', type: 'word', term: 'Agua', meaning: '물 / 생수', example: 'Un vaso de agua fría, por favor.', exampleKo: '시원한 물 한 잔 부탁합니다.', phonetic: '[아구아]', tag: '기내 식음료' },
    { id: 'es-n1-w17', type: 'word', term: 'Café', meaning: '커피', example: 'Café solo sin azúcar, por favor.', exampleKo: '설탕 없는 블랙커피로 부탁합니다.', phonetic: '[카페]', tag: '기내 식음료' },
    { id: 'es-n1-w18', type: 'word', term: 'Cinturón', meaning: '안전벨트', example: 'Abróchese el cinturón.', exampleKo: '안전벨트를 매어 주세요.', phonetic: '[신투론]', tag: '기내 안전' },
    { id: 'es-n1-w19', type: 'word', term: 'Despegue', meaning: '이륙', example: 'Prepárense para el despegue.', exampleKo: '이륙을 준비해 주세요.', phonetic: '[데스페게]', tag: '운항 안내' },
    { id: 'es-n1-w20', type: 'word', term: 'Aterrizaje', meaning: '착륙', example: 'Pronto iniciaremos el aterrizaje.', exampleKo: '곧 착륙을 시작하겠습니다.', phonetic: '[아테리사헤]', tag: '운항 안내' },
    { id: 'es-n1-s01', type: 'sentence', term: 'Un vaso de agua, por favor.', meaning: '물 한 잔 부탁합니다.', example: 'Un vaso de agua con hielo, por favor.', exampleKo: '얼음 띄운 물 한 잔 부탁합니다.', phonetic: '[운 바소 데 아구아 포르 파보르]', tag: '기내 요청' },
    { id: 'es-n1-s02', type: 'sentence', term: '¿Puedo cambiar de asiento?', meaning: '자리 변경할 수 있나요?', example: 'Si hay espacio, ¿puedo cambiar de asiento?', exampleKo: '여유가 있다면 자리를 바꿔도 될까요?', phonetic: '[푸에도 캄비아르 데 아시엔토]', tag: '기내 요청' },
    { id: 'es-n1-s03', type: 'sentence', term: 'Muchas gracias por su ayuda.', meaning: '도와주셔서 정말 감사합니다.', example: 'Muchas gracias por su ayuda y amabilidad.', exampleKo: '친절히 도와주셔서 정말 감사합니다.', phonetic: '[무차스 그라시아스 포르 수 아유다]', tag: '감사 표현' },
    { id: 'es-n1-s04', type: 'sentence', term: '¿Tiene una manta extra?', meaning: '담요 하나 더 있나요?', example: 'Tengo un poco de frío, ¿tiene una manta extra?', exampleKo: '조금 추운데 담요 하나 더 있나요?', phonetic: '[티에네 우나 만타 엑스트라]', tag: '기내 요청' },
    { id: 'es-n1-s05', type: 'sentence', term: '¿Dónde está el baño?', meaning: '화장실이 어디에 있나요?', example: 'Disculpe, ¿dónde está el baño más cercano?', exampleKo: '실례합니다, 가장 가까운 화장실이 어디인가요?', phonetic: '[돈데 에스타 엘 바뇨]', tag: '기내 시설' },
    { id: 'es-n1-s06', type: 'sentence', term: '¿A qué hora aterrizamos?', meaning: '몇 시에 착륙하나요?', example: 'Por favor, ¿a qué hora aterrizamos en Madrid?', exampleKo: '마드리드에 몇 시에 착륙하나요?', phonetic: '[아 케 오라 아테리사모스]', tag: '운항 문의' }
  ];

  // 3과 (수하물 찾기와 세관) 보존용 데이터
  const LESSON_3_ES = [
    { id: 'es-n3-w01', type: 'word', term: 'Cinta de equipaje', meaning: '수하물 수취대', example: '¿Dónde está la cinta de equipaje?', exampleKo: '수하물 수취대가 어디인가요?', phonetic: '[신타 데 에키파헤]', tag: '공항 필수' },
    { id: 'es-n3-w02', type: 'word', term: 'Maleta', meaning: '여행 가방 / 캐리어', example: 'Esta es mi maleta negra.', exampleKo: '이것이 제 검은색 캐리어입니다.', phonetic: '[말레타]', tag: '필수 어휘' },
    { id: 'es-n3-w03', type: 'word', term: 'Pérdida', meaning: '분실 / 유실물', example: 'Quiero reportar la pérdida de mi maleta.', exampleKo: '가방 분실을 신고하고 싶습니다.', phonetic: '[페르디다]', tag: '위기 대처' },
    { id: 'es-n3-w04', type: 'word', term: 'Reclamación', meaning: '수하물 신고 / 청구', example: 'Oficina de reclamación de equipajes.', exampleKo: '수하물 분실 및 청구 사무소.', phonetic: '[레클라마시온]', tag: '공항 필수' },
    { id: 'es-n3-w05', type: 'word', term: 'Etiqueta', meaning: '수하물 태그', example: 'Aquí tiene la etiqueta de su maleta.', exampleKo: '여기 수하물 태그가 있습니다.', phonetic: '[에티케타]', tag: '공항 필수' },
    { id: 'es-n3-w06', type: 'word', term: 'Inspección', meaning: '세관 검사', example: 'Abra su maleta para la inspección.', exampleKo: '검사를 위해 가방을 열어주세요.', phonetic: '[인스펙시온]', tag: '세관 필수' },
    { id: 'es-n3-w07', type: 'word', term: 'Impuesto', meaning: '세금 / 관세', example: 'Tiene que pagar un impuesto.', exampleKo: '관세를 납부하셔야 합니다.', phonetic: '[임푸에스토]', tag: '세관 필수' },
    { id: 'es-n3-w08', type: 'word', term: 'Artículos prohibidos', meaning: '반입 금지 물품', example: 'No llevo artículos prohibidos.', exampleKo: '반입 금지 물품은 없습니다.', phonetic: '[아르티쿨로스 프로이비도스]', tag: '세관 규정' },
    { id: 'es-n3-w09', type: 'word', term: 'Líquidos', meaning: '액체류', example: 'Los líquidos deben estar en bolsas transparentes.', exampleKo: '액체류는 투명 비닐팩에 넣어야 합니다.', phonetic: '[리키도스]', tag: '보안 규정' },
    { id: 'es-n3-w10', type: 'word', term: 'Nada que declarar', meaning: '신고 물품 없음 / 면세', example: 'Pase por el canal verde de nada que declarar.', exampleKo: '신고 물품 없음 녹색 통로로 가세요.', phonetic: '[나다 케 데클라라르]', tag: '세관 통로' },
    { id: 'es-n3-w11', type: 'word', term: 'Carro de equipaje', meaning: '수하물 카트', example: '¿Dónde puedo conseguir un carro de equipaje?', exampleKo: '수하물 카트는 어디서 찾을 수 있나요?', phonetic: '[카로 데 에키파헤]', tag: '공항 편의' },
    { id: 'es-n3-w12', type: 'word', term: 'Equipaje dañado', meaning: '파손된 짐', example: 'Mi equipaje está dañado.', exampleKo: '제 짐이 파손되었습니다.', phonetic: '[에키파헤 다냐도]', tag: '위기 대처' },
    { id: 'es-n3-w13', type: 'word', term: 'Candado', meaning: '자물쇠', example: 'El candado de la maleta está roto.', exampleKo: '가방 자물쇠가 부서졌어요.', phonetic: '[칸다도]', tag: '보안 용품' },
    { id: 'es-n3-w14', type: 'word', term: 'Límite de peso', meaning: '무게 제한', example: 'Ha superado el límite de peso.', exampleKo: '무게 제한을 초과했습니다.', phonetic: '[리미테 데 페소]', tag: '수하물 규정' },
    { id: 'es-n3-w15', type: 'word', term: 'Exceso de equipaje', meaning: '수하물 초과 요금', example: 'Debe pagar exceso de equipaje.', exampleKo: '수하물 초과 요금을 내셔야 합니다.', phonetic: '[엑세소 데 에키파헤]', tag: '수하물 규정' },
    { id: 'es-n3-w16', type: 'word', term: 'Artículos personales', meaning: '개인 소지품', example: 'Solo llevo artículos personales.', exampleKo: '개인 소지품만 가지고 있습니다.', phonetic: '[아르티쿨로스 페르소날레스]', tag: '세관 통관' },
    { id: 'es-n3-w17', type: 'word', term: 'Factura', meaning: '구매 영수증', example: '¿Tiene la factura de compra?', exampleKo: '구매 영수증이 있으신가요?', phonetic: '[팍투라]', tag: '세관 증빙' },
    { id: 'es-n3-w18', type: 'word', term: 'Canal verde', meaning: '녹색 통로 (면세)', example: 'Siga por el canal verde si no tiene nada que declarar.', exampleKo: '신고할 물품이 없으면 녹색 통로로 가세요.', phonetic: '[카날 베르데]', tag: '세관 통로' },
    { id: 'es-n3-w19', type: 'word', term: 'Canal rojo', meaning: '적색 통로 (세관 신고)', example: 'Pase por el canal rojo para declarar.', exampleKo: '신고할 물품이 있으면 적색 통로로 가세요.', phonetic: '[카날 로호]', tag: '세관 통로' },
    { id: 'es-n3-w20', type: 'word', term: 'Objetos de valor', meaning: '귀중품', example: 'No deje objetos de valor en la maleta.', exampleKo: '가방에 귀중품을 넣지 마세요.', phonetic: '[오브헤토스 데 발로르]', tag: '보안 및 세관' },
    { id: 'es-n3-s01', type: 'sentence', term: 'Mi maleta no ha aparecido.', meaning: '제 여행 가방이 안 나왔어요.', example: 'Mi maleta no ha aparecido en la cinta.', exampleKo: '수취대에 제 여행 가방이 나오지 않았어요.', phonetic: '[미 말레타 노 아 아파레시도]', tag: '위기 대처' },
    { id: 'es-n3-s02', type: 'sentence', term: '¿Dónde está la oficina de equipajes?', meaning: '분실물 보관소는 어디인가요?', example: 'Disculpe, ¿dónde está la oficina de equipajes perdidos?', exampleKo: '실례합니다, 분실물 보관소는 어디인가요?', phonetic: '[돈데 에스타 라 오피시나 데 에키파헤스]', tag: '공항 안내' },
    { id: 'es-n3-s03', type: 'sentence', term: 'Solo llevo artículos personales.', meaning: '개인 소지품만 가지고 있습니다.', example: 'No llevo nada comercial, solo artículos personales.', exampleKo: '상업용 물품은 없고 개인 소지품만 있습니다.', phonetic: '[솔로 예보 아르티쿨로스 페르소날레스]', tag: '세관 통관' },
    { id: 'es-n3-s04', type: 'sentence', term: '¿Tengo que pagar impuestos por esto?', meaning: '이것에 대해 세금을 내야 하나요?', example: 'Compré este reloj, ¿tengo que pagar impuestos por esto?', exampleKo: '이 시계를 샀는데 세금을 내야 하나요?', phonetic: '[텐고 케 파가르 임푸에스토스 포르 에스토]', tag: '세관 문의' },
    { id: 'es-n3-s05', type: 'sentence', term: 'Aquí tiene el recibo del equipaje.', meaning: '여기 수하물 표(영수증)가 있습니다.', example: 'Para el reporte, aquí tiene el recibo del equipaje.', exampleKo: '신고를 위해 여기 수하물 표를 확인해주세요.', phonetic: '[아키 티에네 엘 레시보 델 에키파헤]', tag: '분실 신고' },
    { id: 'es-n3-s06', type: 'sentence', term: 'Mi equipaje está roto y dañado.', meaning: '제 수하물이 파손되었습니다.', example: 'Mire, mi equipaje está roto y dañado por el vuelo.', exampleKo: '보세요, 비행 중 제 수하물이 부서졌습니다.', phonetic: '[미 에키파헤 에스타 로토 이 다냐도]', tag: '파손 신고' }
  ];

  // 4과: 일상 기초 (보스전) 종합 데이터 (인사, 감사, 숫자, 일상 총정리 단어 15개 + 문장 3개)
  const LESSON_BOSS_ES = [
    { id: 'es-nb-w01', type: 'word', term: '¡Hola!', word: '¡Hola!', meaning: '안녕하세요 / 안녕', phonetic: '[올라]', example: '¡Hola! ¿Cómo estás?', exampleKo: '안녕하세요! 어떻게 지내세요?', tag: '필수 인사' },
    { id: 'es-nb-w02', type: 'word', term: 'Buenos días', word: 'Buenos días', meaning: '좋은 아침 / 안녕하세요', phonetic: '[부에노스 디아스]', example: 'Buenos días, mucho gusto.', exampleKo: '좋은 아침입니다, 만나서 반가워요.', tag: '필수 인사' },
    { id: 'es-nb-w03', type: 'word', term: 'Gracias', word: 'Gracias', meaning: '감사합니다 / 고마워', phonetic: '[그라시아스]', example: 'Muchas gracias por tu ayuda.', exampleKo: '도와줘서 정말 고마워요.', tag: '필수 예절' },
    { id: 'es-nb-w04', type: 'word', term: 'Por favor', word: 'Por favor', meaning: '부탁합니다 / 제발', phonetic: '[포르 파보르]', example: 'Un café, por favor.', exampleKo: '커피 한 잔 부탁합니다.', tag: '필수 예절' },
    { id: 'es-nb-w05', type: 'word', term: 'Lo siento', word: 'Lo siento', meaning: '죄송합니다 / 미안해요', phonetic: '[로 시엔토]', example: 'Lo siento mucho por llegar tarde.', exampleKo: '늦어서 정말 죄송합니다.', tag: '필수 예절' },
    { id: 'es-nb-w06', type: 'word', term: 'De nada', word: 'De nada', meaning: '천만에요', phonetic: '[데 나다]', example: '—Gracias. —De nada.', exampleKo: '—감사합니다. —천만에요.', tag: '필수 예절' },
    { id: 'es-nb-w07', type: 'word', term: 'Mucho gusto', word: 'Mucho gusto', meaning: '만나서 반갑습니다', phonetic: '[무초 구스토]', example: 'Mucho gusto en conocerte.', exampleKo: '당신을 알게 되어 반갑습니다.', tag: '첫 만남' },
    { id: 'es-nb-w08', type: 'word', term: 'Adiós', word: 'Adiós', meaning: '안녕히 가세요 / 작별', phonetic: '[아디오스]', example: 'Adiós, ¡hasta pronto!', exampleKo: '안녕히 가세요, 곧 또 만나요!', tag: '작별 인사' },
    { id: 'es-nb-w09', type: 'word', term: 'Uno, dos, tres', word: 'Uno, dos, tres', meaning: '하나, 둘, 셋 (1, 2, 3)', phonetic: '[우노, 도스, 트레스]', example: 'Uno, dos, tres, ¡vamos!', exampleKo: '하나, 둘, 셋, 가자!', tag: '기초 숫자' },
    { id: 'es-nb-w10', type: 'word', term: 'Diez', word: 'Diez', meaning: '열 (10)', phonetic: '[디에스]', example: 'Son diez euros en total.', exampleKo: '모두 합쳐서 10유로입니다.', tag: '기초 숫자' },
    { id: 'es-nb-w11', type: 'word', term: 'Cien', word: 'Cien', meaning: '백 (100)', phonetic: '[시엔]', example: 'Cien por ciento seguro.', exampleKo: '100퍼센트 확실합니다.', tag: '기초 숫자' },
    { id: 'es-nb-w12', type: 'word', term: '¿Cuánto cuesta?', word: '¿Cuánto cuesta?', meaning: '얼마인가요?', phonetic: '[콴토 쿠에스타]', example: 'Disculpe, ¿cuánto cuesta esto?', exampleKo: '실례합니다, 이것은 얼마인가요?', tag: '쇼핑/일상' },
    { id: 'es-nb-w13', type: 'word', term: '¿Dónde está?', word: '¿Dónde está?', meaning: '어디에 있나요?', phonetic: '[돈데 에스타]', example: '¿Dónde está la estación?', exampleKo: '기차역이 어디에 있나요?', tag: '길찾기' },
    { id: 'es-nb-w14', type: 'word', term: 'Amigo', word: 'Amigo', meaning: '친구', phonetic: '[아미고]', example: 'Él es mi mejor amigo.', exampleKo: '그는 제 가장 친한 친구입니다.', tag: '일상 어휘' },
    { id: 'es-nb-w15', type: 'word', term: 'Excelente', word: 'Excelente', meaning: '훌륭한 / 최고', phonetic: '[엑셀렌테]', example: '¡Un trabajo excelente!', exampleKo: '정말 훌륭한 일이에요!', tag: '칭찬/감탄' },
    { id: 'es-nb-s01', type: 'sentence', term: '¡Muchas gracias por todo!', word: '¡Muchas gracias por todo!', meaning: '모든 것에 정말 감사합니다!', phonetic: '[무차스 그라시아스 포르 토도]', example: '¡Muchas gracias por todo, fue genial!', exampleKo: '모든 것에 감사드려요, 최고였어요!', tag: '보스 실전 문장' },
    { id: 'es-nb-s02', type: 'sentence', term: '¡Hasta luego, que tenga un buen día!', word: '¡Hasta luego, que tenga un buen día!', meaning: '다음에 또 봐요, 좋은 하루 보내세요!', phonetic: '[아스타 루에고, 케 텡가 운 부엔 디아]', example: '¡Adiós y hasta luego, que tenga un buen día!', exampleKo: '안녕히 가세요, 좋은 하루 보내세요!', tag: '보스 실전 문장' },
    { id: 'es-nb-s03', type: 'sentence', term: '¿Me puede ayudar, por favor?', word: '¿Me puede ayudar, por favor?', meaning: '도와주실 수 있나요, 부탁합니다?', phonetic: '[메 푸에데 아유다르 포르 파보르]', example: 'Disculpe, ¿me puede ayudar, por favor?', exampleKo: '실례합니다, 저 좀 도와주실 수 있나요?', tag: '보스 실전 문장' }
  ];

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

  // 전체 데이터베이스 구조 (app.js 연동)
  const database = {
    'node-1': {
      id: 'node-1',
      title: '1과: 기내 기본 표현',
      desc: '좌석 요청, 음료 주문, 착륙 안내 등 비행기 탑승 필수 단어와 실전 표현을 마스터하세요!',
      icon: '✈️',
      es: LESSON_1_ES,
      en: LESSON_1_ES
    },
    'node-2': {
      id: 'node-2',
      title: '2과: 입국 심사',
      desc: '입국 목적, 체류 기간, 숙소 위치 등 필수 공항 인터뷰 질문과 핵심 어휘 및 실전 문장을 마스터하세요!',
      icon: '🛂',
      es: [...LESSON_2_WORDS_ES, ...LESSON_2_SENTENCES_ES],
      en: [...LESSON_2_WORDS_EN, ...LESSON_2_SENTENCES_EN]
    },
    'node-3': {
      id: 'node-3',
      title: '3과: 수하물 찾기와 세관',
      desc: '수하물 수취대 찾기, 분실물 신고, 세관 검사 필수 표현과 실전문장을 마스터해보세요!',
      icon: '🧳',
      es: LESSON_3_ES,
      en: LESSON_3_ES
    },
    'node-boss': {
      id: 'node-boss',
      title: '4과: 일상 기초 (보스전)',
      desc: '인사, 감사, 숫자, 일상 기초 회화 총정리 & 보스전 최종 관문!',
      icon: '👑',
      es: LESSON_BOSS_ES,
      en: LESSON_BOSS_EN
    }
  };

  // 노드/레슨 키 식별자 정규화 헬퍼 (node-boss, node-4, node-3, 3, node-2 등 완벽 지원)
  function normalizeLessonId(id) {
    if (!id) return 'node-2';
    const s = String(id).trim().toLowerCase();
    if (s.includes('boss') || s.includes('4') || s === 'node-boss' || s === 'node-4') return 'node-boss';
    if (s.includes('3') || s === 'node-3') return 'node-3';
    if (s.includes('1') || s === 'node-1') return 'node-1';
    return 'node-2';
  }

  // 레슨 별칭 매핑
  database['node1'] = database['node-1'];
  database['1'] = database['node-1'];
  database['stage-1'] = database['node-1'];
  database['lesson-1'] = database['node-1'];
  database['node2'] = database['node-2'];
  database['2'] = database['node-2'];
  database['stage-2'] = database['node-2'];
  database['lesson-2'] = database['node-2'];
  database['node3'] = database['node-3'];
  database['3'] = database['node-3'];
  database['stage-3'] = database['node-3'];
  database['lesson-3'] = database['node-3'];
  database['nodeboss'] = database['node-boss'];
  database['boss'] = database['node-boss'];
  database['node-4'] = database['node-boss'];
  database['node4'] = database['node-boss'];
  database['4'] = database['node-boss'];
  database['stage-4'] = database['node-boss'];
  database['lesson-4'] = database['node-boss'];

  // 스마트 샘플링 세션 생성 함수 (Flashcard & Game 연동)
  // - 20개 단어 풀 중 무작위 10개 추출
  // - 6개 문장 풀 중 무작위 3개 추출
  // - 총 13개 문제 세트 생성 (부족 시 순환 폴백 보장)
  function generateStageSession(lessonId = 'node-2', lang = 'es', roundIndex = 0) {
    const normId = normalizeLessonId(lessonId);
    const lesson = database[normId] || database[lessonId] || (normId === 'node-boss' ? database['node-boss'] : (String(lessonId).includes('3') ? database['node-3'] : database['node-2']));
    const targetLang = (lang === 'en' || lang === 'en-US') ? 'en' : 'es';
    let pool = (lesson ? (lesson[targetLang] || lesson.es || lesson.en || []) : []).slice();

    if (pool.length === 0 && normId === 'node-boss') {
      pool = (targetLang === 'en' ? LESSON_BOSS_EN : LESSON_BOSS_ES).slice();
    } else if (pool.length === 0 && normId === 'node-3') {
      pool = LESSON_3_ES.slice();
    } else if (pool.length === 0) {
      pool = [...LESSON_2_WORDS_ES, ...LESSON_2_SENTENCES_ES];
    }

    const words = pool.filter(item => item.type === 'word');
    const sentences = pool.filter(item => item.type === 'sentence');

    // 단어 10개 + 문장 3개 랜덤 추출 (부족 시 순환 폴백 보장)
    let selectedWords = shuffle(words).slice(0, 10);
    if (selectedWords.length < 10 && words.length > 0) {
      let pIdx = 0;
      while (selectedWords.length < 10) {
        selectedWords.push(words[pIdx % words.length]);
        pIdx++;
      }
    }

    let selectedSentences = shuffle(sentences).slice(0, 3);
    if (selectedSentences.length < 3 && sentences.length > 0) {
      let sIdx = 0;
      while (selectedSentences.length < 3) {
        selectedSentences.push(sentences[sIdx % sentences.length]);
        sIdx++;
      }
    }

    // 만약 여전히 13개 미만이면 전체 풀에서 채우기
    let combined = [...selectedWords, ...selectedSentences];
    if (combined.length < 13 && pool.length > 0) {
      let cIdx = 0;
      while (combined.length < 13) {
        combined.push(pool[cIdx % pool.length]);
        cIdx++;
      }
    }

    return combined.map((item, idx) => {
      const isSent = item.type === 'sentence' || idx >= 10;
      return {
        ...item,
        word: item.term || item.word || '',
        term: item.term || item.word || '',
        meaning: item.meaning || '',
        phonetic: item.phonetic || '',
        exampleTarget: item.example || item.exampleTarget || '',
        exampleMeaning: item.exampleKo || item.example_ko || item.exampleMeaning || '',
        isSentence: isSent,
        tag: item.tag || (isSent ? '실전 문장' : '핵심 어휘')
      };
    });
  }

  // 레슨 타이틀 반환
  function getLessonTitle(lessonId = 'node-2') {
    const normId = normalizeLessonId(lessonId);
    const lesson = database[normId] || database[lessonId] || (normId === 'node-boss' ? database['node-boss'] : (String(lessonId).includes('3') ? database['node-3'] : database['node-2']));
    return lesson ? `${lesson.title} · 단어 예습` : (normId === 'node-boss' ? '4과: 일상 기초 (보스전) · 단어 예습' : (normId === 'node-3' ? '3과: 수하물 찾기와 세관 · 단어 예습' : '2과: 입국 심사 · 단어 예습'));
  }

  // 4지선다형 무작위 보기 생성 (정답 1개 + 오답 3개 셔플, 4개 선택지 절대 보장)
  function generateQuestionChoices(q, sessionQuestions, lessonId = 'node-2', lang = 'es') {
    try {
      if (!q) return [];
      const isSentence = Boolean(q.type === 'sentence' || q.isSentence);
      const normId = normalizeLessonId(lessonId);
      const lesson = database[normId] || database[lessonId] || (normId === 'node-boss' ? database['node-boss'] : (String(lessonId).includes('3') ? database['node-3'] : database['node-2']));
      let fullPool = [];
      if (lesson) {
        fullPool = lesson[lang] || lesson.es || lesson.en || [];
      }
      if (!Array.isArray(fullPool) || fullPool.length === 0) {
        fullPool = normId === 'node-boss' ? LESSON_BOSS_ES : (normId === 'node-3' ? LESSON_3_ES : (Array.isArray(sessionQuestions) && sessionQuestions.length > 0 ? sessionQuestions : [...LESSON_2_WORDS_ES, ...LESSON_2_SENTENCES_ES]));
      }

      const correctMeaning = String(q.meaning || q.answer || q.korean || q.ko || '').trim();

      const sameTypeMeanings = fullPool
        .filter(item => item && (item.type === (isSentence ? 'sentence' : 'word') || (isSentence ? item.isSentence : !item.isSentence)) && String(item.meaning || item.korean || '').trim() !== correctMeaning)
        .map(item => String(item.meaning || item.korean || '').trim());

      const allOtherMeanings = fullPool
        .filter(item => item && String(item.meaning || item.korean || '').trim() !== correctMeaning)
        .map(item => String(item.meaning || item.korean || '').trim());

      let candidates = Array.from(new Set(sameTypeMeanings.filter(m => m && m.trim())));
      if (candidates.length < 3) {
        candidates = Array.from(new Set([...candidates, ...allOtherMeanings.filter(m => m && m.trim())]));
      }

      if (candidates.length < 3) {
        const fallbackMeanings = normId === 'node-boss'
          ? ['안녕하세요 / 안녕', '좋은 아침 / 안녕하세요', '감사합니다 / 고마워', '부탁합니다 / 제발', '죄송합니다 / 미안해요', '천만에요', '만나서 반갑습니다', '얼마인가요?', '어디에 있나요?', '친구']
          : (normId === 'node-3'
            ? ['수하물 수취대', '여행 가방 / 캐리어', '분실 / 유실물', '세관 검사', '관세 / 세금', '반입 금지 물품', '액체류', '수하물 카트', '개인 소지품']
            : ['여권', '관광', '방문 목적', '체류 기간', '세관 신고서', '숙소 / 숙박지', '출장 / 사업', '귀국 항공권', '수하물 / 짐']);
        for (const fm of fallbackMeanings) {
          if (fm !== correctMeaning && !candidates.includes(fm)) candidates.push(fm);
          if (candidates.length >= 3) break;
        }
      }

      const selectedDistractors = shuffle(candidates).slice(0, 3);
      const choices = [correctMeaning, ...selectedDistractors];

      return shuffle(choices);
    } catch (choiceErr) {
      console.warn('⚠️ generateQuestionChoices 예외 안전 방어:', choiceErr);
      const fallbackAns = String(q && (q.meaning || q.answer || q.korean || '정답') || '정답').trim();
      return [fallbackAns, '여권', '관광', '감사합니다'];
    }
  }

  // ===================================================
  // 레슨별 코스 프리셋, 언어 메타데이터 및 초기 배지 목록
  // ===================================================
  const COURSE_PRESETS = {
    es: [
      { id: 'basic', icon: '🌱', title: '기초 회화', desc: '인사, 감사, 숫자 등 매일 쓰는 첫걸음' },
      { id: 'travel', icon: '✈️', title: '여행 스페인어', desc: '공항, 숙소, 식당 필수 회화' },
      { id: 'dele', icon: '🎓', title: 'DELE A1 대비', desc: 'A1 초급 자격증 핵심 단어' },
      { id: 'business', icon: '💼', title: '비즈니스 스페인어', desc: '오피스 일상, 미팅, 이메일' }
    ],
    en: [
      { id: 'basic', icon: '🌱', title: '기초 회화', desc: '인사, 감사, 숫자 등 매일 쓰는 첫걸음' },
      { id: 'travel', icon: '✈️', title: '여행 영어', desc: '공항, 호텔, 카페 실전 회화' },
      { id: 'toeic', icon: '🎓', title: '토익/오픽 대비', desc: '필수 기출 어휘 및 빈출 표현' },
      { id: 'business', icon: '💼', title: '비즈니스 영어', desc: '오피스 실무, 미팅, 이메일' }
    ]
  };

  const courseData = {
    es: { code: 'es', name: '스페인어', flag: '🇪🇸', title: '기초 회화', mascotImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP0JQeI4Dd0jPH-7xXCEyBdJGSJA_0M64KbAE-BGazI8m_Obek3-febLbZP6EApI5kIvctYdTgN57X-U5nDsngc4keOpz7pTToB_R_h2Nuke2HhcMaG1hqDMvsZ0hh5qomDeqXWBP2n8FjE5YcJL73OjopNvSrmb8ef0s2B_SxahJe5VqHYYipsHTcjQ9kMmU1oFP7LTlY43K7fuqHEp34Kj_Gsvs2RS6VS6D866u7NtJt3qW6-cGI', ctaText: '스페인어로 학습하기' },
    en: { code: 'en', name: '영어', flag: '🇺🇸', title: '기초 회화', mascotImg: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=240&q=80', ctaText: '영어로 학습하기' }
  };

  const COURSE_LESSONS = {
    basic: {
      'node-1': { title: '1과: 인사/안부', desc: '¡Hola!, ¿Cómo estás? 등 매일 쓰는 첫인사와 안부 표현을 마스터하세요!', icon: '🌱' },
      'node-2': { title: '2과: 감사/사과', desc: 'Gracias, Por favor, Lo siento 등 필수 예절 표현과 핵심 어휘를 완벽하게 학습해보세요!', icon: '🙏' },
      'node-3': { title: '3과: 숫자/시간', desc: '1부터 100까지의 숫자와 시각 표현, 요일을 쉽고 빠르게 익혀보세요!', icon: '⏰' },
      'node-boss': { title: '4과: 일상 기초 (보스전)', desc: '기초 회화 총정리 & 특별 보상', icon: '👑' }
    },
    travel: {
      'node-1': { title: '1과: 기내 기본 표현', desc: '좌석 요청, 음료 주문, 착륙 안내 등 비행기 탑승 필수 단어와 표현을 완벽하게 복습해보세요!', icon: '✈️' },
      'node-2': { title: '2과: 입국 심사', desc: '입국 목적, 체류 기간, 숙소 위치 등 필수 공항 인터뷰 질문과 핵심 어휘 10개 및 실전 문장 3개를 마스터하세요!', icon: '🛂' },
      'node-3': { title: '3과: 수하물 찾기와 세관', desc: '수하물 수취대 찾기, 분실물 신고, 세관 검사 필수 표현과 실전문장 13개를 마스터해보세요!', icon: '🧳' },
      'node-boss': { title: '보스전: 공항 마스터 관문', desc: '입국 심사 완벽 통과 & 특별 보상', icon: '👑' }
    },
    dele: {
      'node-1': { title: '1과: DELE A1 필수 어휘', desc: '기초 문법과 A1 빈출 단어 50선', icon: '📝' },
      'node-2': { title: '2과: DELE A2 어휘와 독해', desc: '중급 도약을 위한 일상 독해 어휘', icon: '📖' },
      'node-3': { title: '3과: DELE B1 핵심 표현', desc: '의견 표현과 논리적 문장 구성 어휘', icon: '🎓' },
      'node-boss': { title: '4과: DELE 실전 모의테스트', desc: 'DELE 시험 완벽 대비 실전 문제', icon: '👑' }
    },
    business: {
      'node-1': { title: '1과: 첫 출근과 인사', desc: '비즈니스 자기소개와 명함 교환, 직급 호칭', icon: '🤝' },
      'node-2': { title: '2과: 오피스 일상과 회의', desc: '회의 일정 잡기, 업무 협업 및 보고 표현', icon: '💼' },
      'node-3': { title: '3과: 이메일과 전화 응대', desc: '비즈니스 이메일 작성 및 바이어 통화 표현', icon: '📧' },
      'node-boss': { title: '4과: 비즈니스 협상 마스터', desc: '비즈니스 회화 총정리 & 특별 보상', icon: '👑' }
    },
    toeic: {
      'node-1': { title: '1과: Part 1/2 빈출 어휘', desc: '사진 묘사 및 질의응답 핵심 단어', icon: '🎧' },
      'node-2': { title: '2과: Part 3/4 비즈니스 회화', desc: '대화 및 설명문 빈출 표현', icon: '💬' },
      'node-3': { title: '3과: Part 5/6 문법/어휘', desc: '단문 및 장문 공란 메우기 핵심 단어', icon: '📄' },
      'node-boss': { title: '4과: Part 7 독해 실전 마스터', desc: '장문 독해 및 이메일/기사 지문 완성', icon: '👑' }
    }
  };

  const nodeLessonData = COURSE_LESSONS.basic;

  const courseCategoryMap = {
    basic: { icon: '🌱', titles: { es: '기초 회화', en: '기초 회화' }, categories: ['전체', '인사/안부', '감사/사과', '숫자/시간', '일상 기초'] },
    travel: { icon: '✈️', titles: { es: '여행 스페인어', en: '여행 영어' }, categories: ['전체', '공항/기내', '교통/길찾기', '호텔/숙소', '식당/카페'] },
    dele: { icon: '🎓', titles: { es: 'DELE A1 대비', en: 'DELE 시험 대비' }, categories: ['전체', 'DELE A1', 'DELE A2', 'DELE B1', 'DELE B2'] },
    business: { icon: '💼', titles: { es: '비즈니스 스페인어', en: '비즈니스 영어' }, categories: ['전체', '오피스 일상', '이메일/문서', '미팅/협상', '비자/행정'] },
    toeic: { icon: '🎓', titles: { es: '토익/오픽 대비', en: '토익/오픽 대비' }, categories: ['전체', 'Part 1/2', 'Part 3/4', 'Part 5/6', 'Part 7'] }
  };

  const INITIAL_BADGES = [
    { id: 'b1', name: '첫 승리의 질주', desc: '첫 번째 학습 레슨을 완료했습니다.', icon: '👑', unlocked: true, category: 'achievement' },
    { id: 'b2', name: '불타는 연속 5일', desc: '5일 연속으로 출석 학습을 달성했습니다.', icon: '🔥', unlocked: true, category: 'streak' },
    { id: 'b3', name: '어휘 마스터 100', desc: '총 100개 이상의 단어를 암기했습니다.', icon: '📚', unlocked: false, progress: '38/100', category: 'vocab' },
    { id: 'b4', name: '얼음 방패 수호자', desc: '얼음 방패 아이템을 사용하여 스트릭을 보호했습니다.', icon: '🛡️', unlocked: false, category: 'item' },
    { id: 'b5', name: '기내 생존 마스터', desc: '1과 기내 표현의 모든 레슨을 3별로 완주했습니다.', icon: '✈️', unlocked: false, category: 'lesson' },
    { id: 'b6', name: '심야의 열공러', desc: '오후 10시 이후에 학습을 완료했습니다.', icon: '🌙', unlocked: false, category: 'time' },
    { id: 'b7', name: '완벽주의자', desc: '오답 없이 100% 정답률로 세션을 마쳤습니다.', icon: '🎯', unlocked: false, category: 'accuracy' },
    { id: 'b8', name: '주말의 전사', desc: '토요일과 일요일 모두 출석 도장을 찍었습니다.', icon: '⚡', unlocked: false, category: 'streak' }
  ];

  if (typeof window !== 'undefined') {
    window.COURSE_PRESETS = COURSE_PRESETS;
    window.COURSE_LESSONS = COURSE_LESSONS;
    window.courseData = courseData;
    window.nodeLessonData = nodeLessonData;
    window.courseCategoryMap = courseCategoryMap;
    window.INITIAL_BADGES = INITIAL_BADGES;
  }

  // ===================================================
  // VOCA_DATA 내보내기 객체
  // - 2과 및 3과 단어와 문장 안전 접근 제공
  // - app.js 시스템 완벽 호환 (generateStageSession, database 등)
  // - Object.freeze를 통한 런타임 데이터 불변성 보호
  // ===================================================
  const instance = {
    // 2과(입국 심사) 직관적 직접 접근
    words: Object.freeze(LESSON_2_WORDS_ES.slice()),
    sentences: Object.freeze(LESSON_2_SENTENCES_ES.slice()),
    lesson2: Object.freeze({
      title: '2과: 입국 심사',
      icon: '🛂',
      words: LESSON_2_WORDS_ES,
      sentences: LESSON_2_SENTENCES_ES
    }),

    // 3과(수하물 찾기와 세관) 직관적 직접 접근
    lesson3: Object.freeze({
      title: '3과: 수하물 찾기와 세관',
      icon: '🧳',
      words: LESSON_3_ES.filter(item => item.type === 'word'),
      sentences: LESSON_3_ES.filter(item => item.type === 'sentence'),
      all: LESSON_3_ES
    }),
    lesson3Words: LESSON_3_ES,

    // 전체 DB 및 레슨 목록
    database: database,
    lessons: database,

    // 코스 및 메타데이터
    COURSE_PRESETS: COURSE_PRESETS,
    courseData: courseData,
    nodeLessonData: nodeLessonData,
    courseCategoryMap: courseCategoryMap,
    badges: INITIAL_BADGES,

    // 유틸리티 및 게임 세션 생성기
    shuffle: shuffle,
    normalizeLessonId: normalizeLessonId,
    getLessonTitle: getLessonTitle,
    generateStageSession: generateStageSession,
    generateQuestionChoices: generateQuestionChoices
  };

  return Object.freeze(instance);
});
