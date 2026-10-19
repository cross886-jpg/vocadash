// ==============================================================================
// VocaDash - 스페인어 정규 코스 데이터 (js/data_es.js)
// 🇪🇸 최신 VocaDash 표준 데이터 규격 (units.words 단일 규격, 총 4 Units)
// ==============================================================================

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
    title: "스페인어 (여행 & 일상 실전)",
    desc: "기내 표현, 입국 심사, 수하물 수취부터 일상 필수 회화까지",
    description: "기내 표현, 입국 심사, 수하물 수취부터 일상 필수 회화까지",
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
        title: "Unit 1. 기내 기본 표현 & 인사",
        desc: "비행기 좌석, 음료 요청 및 첫인사",
        subtitle: "비행기 좌석, 음료 요청 및 첫인사",
        words: [
          { id: "es_101", word: "¡Hola!", pronunciation: "올라", meaning: "안녕하세요!", example: "¡Hola! ¿Cómo estás?", exampleKo: "안녕하세요! 어떻게 지내세요?" },
          { id: "es_102", word: "Gracias", pronunciation: "그라시아스", meaning: "감사합니다", example: "Muchas gracias por su ayuda.", exampleKo: "도움에 정말 감사드립니다." },
          { id: "es_103", word: "Por favor", pronunciation: "포르 파보르", meaning: "부탁합니다", example: "Un vaso de agua, por favor.", exampleKo: "물 한 잔 부탁합니다." },
          { id: "es_104", word: "Buenos días", pronunciation: "부에노스 디아스", meaning: "좋은 아침입니다", example: "¡Buenos días a todos!", exampleKo: "모두 좋은 아침입니다!" },
          { id: "es_105", word: "¡Adiós!", pronunciation: "아디오스", meaning: "안녕히 가세요", example: "¡Adiós! Hasta luego.", exampleKo: "안녕히 가세요! 나중에 봐요." },
          { id: "es_106", word: "Buenas tardes", pronunciation: "부에나스 타르데스", meaning: "좋은 오후입니다", example: "¡Buenas tardes, señor!", exampleKo: "좋은 오후입니다, 손님!" },
          { id: "es_107", word: "Buenas noches", pronunciation: "부에나스 노체스", meaning: "좋은 밤 되세요", example: "Buenas noches y que descanses.", exampleKo: "좋은 밤 되시고 푹 쉬세요." },
          { id: "es_108", word: "De nada", pronunciation: "데 나다", meaning: "천만에요", example: "No hay de qué, de nada.", exampleKo: "별말씀을요, 천만에요." },
          { id: "es_109", word: "Disculpe", pronunciation: "디스쿨페", meaning: "실례합니다", example: "Disculpe, ¿dónde está el baño?", exampleKo: "실례합니다, 화장실이 어디인가요?" },
          { id: "es_110", word: "Hasta luego", pronunciation: "아스타 루에고", meaning: "나중에 봐요", example: "¡Hasta luego, nos vemos pronto!", exampleKo: "나중에 봐요, 곧 만나요!" },
          { id: "es_111", word: "Asiento", pronunciation: "아시엔토", meaning: "좌석 / 자리", example: "¿Cuál es mi asiento?", exampleKo: "제 좌석은 어디인가요?" },
          { id: "es_112", word: "Ventana", pronunciation: "벤타나", meaning: "창가 좌석", example: "Prefiero asiento de ventana.", exampleKo: "창가 자리를 선호합니다." },
          { id: "es_113", word: "Pasillo", pronunciation: "파시요", meaning: "통로 좌석", example: "Un asiento de pasillo, por favor.", exampleKo: "통로 쪽 좌석으로 부탁합니다." },
          { id: "es_114", word: "Manta", pronunciation: "만타", meaning: "담요", example: "¿Me puede dar una manta?", exampleKo: "담요 한 장 주실 수 있나요?" },
          { id: "es_115", word: "Auriculares", pronunciation: "아우리쿨라레스", meaning: "이어폰 / 헤드폰", example: "Mis auriculares no funcionan.", exampleKo: "제 이어폰이 작동하지 않아요." },
          { id: "es_116", word: "Agua", pronunciation: "아구아", meaning: "물 / 생수", example: "Un vaso de agua fría, por favor.", exampleKo: "시원한 물 한 잔 부탁합니다." },
          { id: "es_117", word: "Café", pronunciation: "카페", meaning: "커피", example: "Café solo sin azúcar, por favor.", exampleKo: "설탕 없는 블랙커피로 부탁합니다." },
          { id: "es_118", word: "Cinturón", pronunciation: "신투론", meaning: "안전벨트", example: "Abróchese el cinturón.", exampleKo: "안전벨트를 매어 주세요." },
          { id: "es_119", word: "Despegue", pronunciation: "데스페게", meaning: "이륙", example: "Prepárense para el despegue.", exampleKo: "이륙을 준비해 주세요." },
          { id: "es_120", word: "Aterrizaje", pronunciation: "아테리사헤", meaning: "착륙", example: "Pronto iniciaremos el aterrizaje.", exampleKo: "곧 착륙을 시작하겠습니다." },
          { id: "es_121", word: "Un vaso de agua, por favor.", pronunciation: "운 바소 데 아구아 포르 파보르", meaning: "물 한 잔 부탁합니다.", example: "Un vaso de agua con hielo, por favor.", exampleKo: "얼음 띄운 물 한 잔 부탁합니다." },
          { id: "es_122", word: "¿Puedo cambiar de asiento?", pronunciation: "푸에도 캄비아르 데 아시엔토", meaning: "자리 변경할 수 있나요?", example: "Si hay espacio, ¿puedo cambiar de asiento?", exampleKo: "여유가 있다면 자리를 바꿔도 될까요?" },
          { id: "es_123", word: "Muchas gracias por su ayuda.", pronunciation: "무차스 그라시아스 포르 수 아유다", meaning: "도와주셔서 정말 감사합니다.", example: "Muchas gracias por su ayuda y amabilidad.", exampleKo: "친절히 도와주셔서 정말 감사합니다." },
          { id: "es_124", word: "¿Tiene una manta extra?", pronunciation: "티에네 우나 만타 엑스트라", meaning: "담요 하나 더 있나요?", example: "Tengo un poco de frío, ¿tiene una manta extra?", exampleKo: "조금 추운데 담요 하나 더 있나요?" },
          { id: "es_125", word: "¿Dónde está el baño?", pronunciation: "돈데 에스타 엘 바뇨", meaning: "화장실이 어디에 있나요?", example: "Disculpe, ¿dónde está el baño más cercano?", exampleKo: "실례합니다, 가장 가까운 화장실이 어디인가요?" },
          { id: "es_126", word: "¿A qué hora aterrizamos?", pronunciation: "아 케 오라 아테리사모스", meaning: "몇 시에 착륙하나요?", example: "Por favor, ¿a qué hora aterrizamos en Madrid?", exampleKo: "마드리드에 몇 시에 착륙하나요?" }
        ],
        nodes: [
          { id: "es_1_n1", type: "stage", title: "1과: 기내 기본 인사", stageNumber: 1, wordIds: ["es_101", "es_102", "es_103", "es_104", "es_105", "es_106", "es_107", "es_108", "es_109", "es_110"] },
          { id: "es_1_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_1_n3", type: "stage", title: "2과: 기내 시설 & 요청", stageNumber: 2, wordIds: ["es_111", "es_112", "es_113", "es_114", "es_115", "es_116", "es_117", "es_118", "es_119", "es_120"] },
          { id: "es_1_n4", type: "sentence", title: "핵심 문장", targetSentence: "Un vaso de agua, por favor.", meaning: "물 한 잔 부탁합니다." },
          { id: "es_1_n5", type: "review", title: "약점 복습" },
          { id: "es_1_n6", type: "boss", title: "Unit 1 보스전" }
        ]
      },
      {
        unitId: 2,
        unitNumber: 2,
        id: 2,
        unit: 2,
        title: "Unit 2. 입국 심사 & 인터뷰",
        desc: "방문 목적, 체류 기간, 숙소 확인 질문",
        subtitle: "방문 목적, 체류 기간, 숙소 확인 질문",
        words: [
          { id: "es_201", word: "Pasaporte", pronunciation: "파사포르테", meaning: "여권", example: "Aquí tiene mi pasaporte y billete.", exampleKo: "여기 제 여권과 항공권이 있습니다." },
          { id: "es_202", word: "Visado", pronunciation: "비사도", meaning: "비자 / 입국 허가", example: "Tengo un visado de turista válido.", exampleKo: "유효한 관광 비자를 소지하고 있습니다." },
          { id: "es_203", word: "Propósito", pronunciation: "프로포시토", meaning: "방문 목적", example: "¿Cuál es el propósito de su viaje?", exampleKo: "여행 목적이 무엇인가요?" },
          { id: "es_204", word: "Turismo", pronunciation: "투리스모", meaning: "관광", example: "Viajo a España por turismo.", exampleKo: "스페인에 관광 목적으로 여행합니다." },
          { id: "es_205", word: "Negocios", pronunciation: "네고시오스", meaning: "출장 / 사업", example: "Estoy aquí por viaje de negocios.", exampleKo: "사업 출장 차 여기에 왔습니다." },
          { id: "es_206", word: "Estancia", pronunciation: "에스탄시아", meaning: "체류 기간", example: "La estancia máxima es de noventa días.", exampleKo: "최대 체류 기간은 90일입니다." },
          { id: "es_207", word: "Equipaje", pronunciation: "에키파헤", meaning: "수하물 / 짐", example: "Llevo dos piezas de equipaje.", exampleKo: "수하물 두 개를 가지고 있습니다." },
          { id: "es_208", word: "Aduana", pronunciation: "아두아나", meaning: "세관 / 통관", example: "Pase por el control de aduana.", exampleKo: "세관 검사대를 통과해 주세요." },
          { id: "es_209", word: "Declaración", pronunciation: "데클라라시온", meaning: "세관 신고서", example: "Rellene esta hoja de declaración.", exampleKo: "이 신고서 서식을 작성해 주세요." },
          { id: "es_210", word: "Alojamiento", pronunciation: "알로하미엔토", meaning: "숙소 / 숙박지", example: "¿Dónde está su alojamiento en Madrid?", exampleKo: "마드리드 숙소는 어디에 있나요?" },
          { id: "es_211", word: "Hotel", pronunciation: "오텔", meaning: "호텔", example: "Me alojaré en un hotel céntrico.", exampleKo: "시내 중심가 호텔에 묵을 예정입니다." },
          { id: "es_212", word: "Billete de vuelta", pronunciation: "비예테 데 부엘타", meaning: "귀국 항공권 / 왕복표", example: "Muestre su billete de vuelta, por favor.", exampleKo: "귀국 항공권을 보여주세요." },
          { id: "es_213", word: "Control de pasaportes", pronunciation: "콘트롤 데 파사포르테스", meaning: "여권 심사대", example: "Haga la fila en el control de pasaportes.", exampleKo: "여권 심사대 줄을 서 주세요." },
          { id: "es_214", word: "Oficial de inmigración", pronunciation: "오피시알 데 인미그라시온", meaning: "출입국 심사관", example: "El oficial de inmigración revisa los documentos.", exampleKo: "입국 심사관이 서류를 검토합니다." },
          { id: "es_215", word: "Duración", pronunciation: "두라시온", meaning: "기간 / 체류 일수", example: "¿Cuál es la duración de su estancia?", exampleKo: "체류 기간이 어떻게 되나요?" },
          { id: "es_216", word: "Dirección", pronunciation: "디렉시온", meaning: "주소 / 행선지", example: "Escriba la dirección de su estancia.", exampleKo: "머무실 곳의 주소를 적어주세요." },
          { id: "es_217", word: "Formulario de entrada", pronunciation: "포르물라리오 데 엔트라다", meaning: "입국 신고서", example: "Firme el formulario de entrada al final.", exampleKo: "입국 신고서 하단에 서명해 주세요." },
          { id: "es_218", word: "Moneda", pronunciation: "모네다", meaning: "통화 / 화폐", example: "¿Lleva moneda extranjera o efectivo?", exampleKo: "외화나 현금을 소지하고 계신가요?" },
          { id: "es_219", word: "Frontera", pronunciation: "프론테라", meaning: "국경", example: "Bienvenidos al cruce de frontera.", exampleKo: "국경 통과소에 오신 것을 환영합니다." },
          { id: "es_220", word: "Sello de entrada", pronunciation: "세요 데 엔트라다", meaning: "입국 도장", example: "Ponen el sello de entrada en el pasaporte.", exampleKo: "여권에 입국 확인 도장을 찍어줍니다." },
          { id: "es_221", word: "Aquí tiene mi pasaporte y mi billete de vuelta.", pronunciation: "아키 티에네 미 파사포르테 이 미 비예테 데 부엘타", meaning: "여기 제 여권과 귀국 항공권입니다.", example: "Buenos días, aquí tiene mi pasaporte y mi billete de vuelta.", exampleKo: "좋은 아침입니다, 여기 제 여권과 귀국 항공권입니다." },
          { id: "es_222", word: "El propósito de mi viaje es turismo.", pronunciation: "엘 프로포시토 데 미 비아헤 에스 투리스모", meaning: "제 여행 목적은 관광입니다.", example: "Vengo de vacaciones, el propósito de mi viaje es turismo.", exampleKo: "휴가차 왔으며 여행 목적은 관광입니다." },
          { id: "es_223", word: "Me voy a quedar en España durante diez días.", pronunciation: "메 보이 아 케다르 엔 에스파냐 두란테 디에스 디아스", meaning: "저는 스페인에서 열흘 동안 머물 예정입니다.", example: "Me voy a quedar en España durante diez días y luego regreso.", exampleKo: "스페인에서 열흘 머무른 뒤 귀국합니다." },
          { id: "es_224", word: "Tengo una reserva confirmada en este hotel.", pronunciation: "텐고 우나 레세르바 콘피르마다 엔 에스테 오텔", meaning: "이 호텔에 예약 확인 내역이 있습니다.", example: "Aquí está la dirección, tengo una reserva confirmada en este hotel.", exampleKo: "여기 주소가 있으며, 이 호텔에 예약 내역이 있습니다." },
          { id: "es_225", word: "Viajo solo por vacaciones y descanso.", pronunciation: "비아호 솔로 포르 바카시오네스 이 데스칸소", meaning: "휴식과 휴가를 위해 혼자 여행합니다.", example: "No vengo por trabajo, viajo solo por vacaciones 및 descanso.", exampleKo: "일 때문이 아니라 휴가를 위해 혼자 여행합니다." },
          { id: "es_226", word: "No tengo nada que declarar ante la aduana.", pronunciation: "노 텐고 나다 케 데클라라르 안테 라 아두아나", meaning: "세관에 신고할 물품이 전혀 없습니다.", example: "Solo llevo artículos personales, no tengo nada que declarar ante la aduana.", exampleKo: "개인 소지품만 있어서 세관에 신고할 물품이 전혀 없습니다." }
        ],
        nodes: [
          { id: "es_2_n1", type: "stage", title: "1과: 심사 필수 서류", stageNumber: 1, wordIds: ["es_201", "es_202", "es_203", "es_204", "es_205", "es_206", "es_207", "es_208", "es_209", "es_210"] },
          { id: "es_2_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_2_n3", type: "stage", title: "2과: 방문 목적 & 인터뷰", stageNumber: 2, wordIds: ["es_211", "es_212", "es_213", "es_214", "es_215", "es_216", "es_217", "es_218", "es_219", "es_220"] },
          { id: "es_2_n4", type: "sentence", title: "핵심 문장", targetSentence: "El propósito de mi viaje es turismo.", meaning: "제 여행 목적은 관광입니다." },
          { id: "es_2_n5", type: "review", title: "약점 복습" },
          { id: "es_2_n6", type: "boss", title: "Unit 2 보스전" }
        ]
      },
      {
        unitId: 3,
        unitNumber: 3,
        id: 3,
        unit: 3,
        title: "Unit 3. 수하물 찾기와 세관",
        desc: "수취대, 짐 분실 신고 및 세관 통과",
        subtitle: "수취대, 짐 분실 신고 및 세관 통과",
        words: [
          { id: "es_301", word: "Cinta de equipaje", pronunciation: "신타 데 에키파헤", meaning: "수하물 수취대", example: "¿Dónde está la cinta de equipaje?", exampleKo: "수하물 수취대가 어디인가요?" },
          { id: "es_302", word: "Maleta", pronunciation: "말레타", meaning: "여행 가방 / 캐리어", example: "Esta es mi maleta negra.", exampleKo: "이것이 제 검은색 캐리어입니다." },
          { id: "es_303", word: "Pérdida", pronunciation: "페르디다", meaning: "분실 / 유실물", example: "Quiero reportar la pérdida de mi maleta.", exampleKo: "가방 분실을 신고하고 싶습니다." },
          { id: "es_304", word: "Reclamación", pronunciation: "레클라마시온", meaning: "수하물 신고 / 청구", example: "Oficina de reclamación de equipajes.", exampleKo: "수하물 분실 및 청구 사무소." },
          { id: "es_305", word: "Etiqueta", pronunciation: "에티케타", meaning: "수하물 태그", example: "Aquí tiene la etiqueta de su maleta.", exampleKo: "여기 수하물 태그가 있습니다." },
          { id: "es_306", word: "Inspección", pronunciation: "인스펙시온", meaning: "세관 검사", example: "Abra su maleta para la inspección.", exampleKo: "검사를 위해 가방을 열어주세요." },
          { id: "es_307", word: "Impuesto", pronunciation: "임푸에스토", meaning: "세금 / 관세", example: "Tiene que pagar un impuesto.", exampleKo: "관세를 납부하셔야 합니다." },
          { id: "es_308", word: "Artículos prohibidos", pronunciation: "아르티쿨로스 프로이비도스", meaning: "반입 금지 물품", example: "No llevo artículos prohibidos.", exampleKo: "반입 금지 물품은 없습니다." },
          { id: "es_309", word: "Líquidos", pronunciation: "리키도스", meaning: "액체류", example: "Los líquidos deben estar en bolsas transparentes.", exampleKo: "액체류는 투명 비닐팩에 넣어야 합니다." },
          { id: "es_310", word: "Nada que declarar", pronunciation: "나다 케 데클라라르", meaning: "신고 물품 없음 / 면세", example: "Pase por el canal verde de nada que declarar.", exampleKo: "신고 물품 없음 녹색 통로로 가세요." },
          { id: "es_311", word: "Carro de equipaje", pronunciation: "카로 데 에키파헤", meaning: "수하물 카트", example: "¿Dónde puedo conseguir un carro de equipaje?", exampleKo: "수하물 카트는 어디서 찾을 수 있나요?" },
          { id: "es_312", word: "Equipaje dañado", pronunciation: "에키파헤 다냐도", meaning: "파손된 짐", example: "Mi equipaje está dañado.", exampleKo: "제 짐이 파손되었습니다." },
          { id: "es_313", word: "Candado", pronunciation: "칸다도", meaning: "자물쇠", example: "El candado de la maleta está roto.", exampleKo: "가방 자물쇠가 부서졌어요." },
          { id: "es_314", word: "Límite de peso", pronunciation: "리미테 데 페소", meaning: "무게 제한", example: "Ha superado el límite de peso.", exampleKo: "무게 제한을 초과했습니다." },
          { id: "es_315", word: "Exceso de equipaje", pronunciation: "엑세소 데 에키파헤", meaning: "수하물 초과 요금", example: "Debe pagar exceso de equipaje.", exampleKo: "수하물 초과 요금을 내셔야 합니다." },
          { id: "es_316", word: "Artículos personales", pronunciation: "아르티쿨로스 페르소날레스", meaning: "개인 소지품", example: "Solo llevo artículos personales.", exampleKo: "개인 소지품만 가지고 있습니다." },
          { id: "es_317", word: "Factura", pronunciation: "팍투라", meaning: "구매 영수증", example: "¿Tiene la factura de compra?", exampleKo: "구매 영수증이 있으신가요?" },
          { id: "es_318", word: "Canal verde", pronunciation: "카날 베르데", meaning: "녹색 통로 (면세)", example: "Siga por el canal verde si no tiene nada que declarar.", exampleKo: "신고할 물품이 없으면 녹색 통로로 가세요." },
          { id: "es_319", word: "Canal rojo", pronunciation: "카날 로호", meaning: "적색 통로 (세관 신고)", example: "Pase por el canal rojo para declarar.", exampleKo: "신고할 물품이 있으면 적색 통로로 가세요." },
          { id: "es_320", word: "Objetos de valor", pronunciation: "오브헤토스 데 발로르", meaning: "귀중품", example: "No deje objetos de valor en la maleta.", exampleKo: "가방에 귀중품을 넣지 마세요." },
          { id: "es_321", word: "Mi maleta no ha aparecido.", pronunciation: "미 말레타 노 아 아파레시도", meaning: "제 여행 가방이 안 나왔어요.", example: "Mi maleta no ha aparecido en la cinta.", exampleKo: "수취대에 제 여행 가방이 나오지 않았어요." },
          { id: "es_322", word: "¿Dónde está la oficina de equipajes?", pronunciation: "돈데 에스타 라 오피시나 데 에키파헤스", meaning: "분실물 보관소는 어디인가요?", example: "Disculpe, ¿dónde está la oficina de equipajes perdidos?", exampleKo: "실례합니다, 분실물 보관소는 어디인가요?" },
          { id: "es_323", word: "Solo llevo artículos personales.", pronunciation: "솔로 예보 아르티쿨로스 페르소날레스", meaning: "개인 소지품만 가지고 있습니다.", example: "No llevo nada comercial, solo artículos personales.", exampleKo: "상업용 물품은 없고 개인 소지품만 있습니다." },
          { id: "es_324", word: "¿Tengo que pagar impuestos por esto?", pronunciation: "텐고 케 파가르 임푸에스토스 포르 에스토", meaning: "이것에 대해 세금을 내야 하나요?", example: "Compré este reloj, ¿tengo que pagar impuestos por esto?", exampleKo: "이 시계를 샀는데 세금을 내야 하나요?" },
          { id: "es_325", word: "Aquí tiene el recibo del equipaje.", pronunciation: "아키 티에네 엘 레시보 델 에키파헤", meaning: "여기 수하물 표(영수증)가 있습니다.", example: "Para el reporte, aquí tiene el recibo del equipaje.", exampleKo: "신고를 위해 여기 수하물 표를 확인해주세요." },
          { id: "es_326", word: "Mi equipaje está roto y dañado.", pronunciation: "미 에키파헤 에스타 로토 이 다냐도", meaning: "제 수하물이 파손되었습니다.", example: "Mire, mi equipaje está roto y dañado por el vuelo.", exampleKo: "보세요, 비행 중 제 수하물이 부서졌습니다." }
        ],
        nodes: [
          { id: "es_3_n1", type: "stage", title: "1과: 수하물 찾기", stageNumber: 1, wordIds: ["es_301", "es_302", "es_303", "es_304", "es_305", "es_306", "es_307", "es_308", "es_309", "es_310"] },
          { id: "es_3_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_3_n3", type: "stage", title: "2과: 세관 검사 & 통관", stageNumber: 2, wordIds: ["es_311", "es_312", "es_313", "es_314", "es_315", "es_316", "es_317", "es_318", "es_319", "es_320"] },
          { id: "es_3_n4", type: "sentence", title: "핵심 문장", targetSentence: "Solo llevo artículos personales.", meaning: "개인 소지품만 가지고 있습니다." },
          { id: "es_3_n5", type: "review", title: "약점 복습" },
          { id: "es_3_n6", type: "boss", title: "Unit 3 보스전" }
        ]
      },
      {
        unitId: 4,
        unitNumber: 4,
        id: 4,
        unit: 4,
        title: "Unit 4. 일상 기초 & 마스터 관문",
        desc: "기초 회화, 숫자, 필수 표현 총정리",
        subtitle: "기초 회화, 숫자, 필수 표현 총정리",
        words: [
          { id: "es_401", word: "¡Hola!", pronunciation: "올라", meaning: "안녕하세요 / 안녕", example: "¡Hola! ¿Cómo estás?", exampleKo: "안녕하세요! 어떻게 지내세요?" },
          { id: "es_402", word: "Buenos días", pronunciation: "부에노스 디아스", meaning: "좋은 아침 / 안녕하세요", example: "Buenos días, mucho gusto.", exampleKo: "좋은 아침입니다, 만나서 반가워요." },
          { id: "es_403", word: "Gracias", pronunciation: "그라시아스", meaning: "감사합니다 / 고마워", example: "Muchas gracias por tu ayuda.", exampleKo: "도와줘서 정말 고마워요." },
          { id: "es_404", word: "Por favor", pronunciation: "포르 파보르", meaning: "부탁합니다 / 제발", example: "Un café, por favor.", exampleKo: "커피 한 잔 부탁합니다." },
          { id: "es_405", word: "Lo siento", pronunciation: "로 시엔토", meaning: "죄송합니다 / 미안해요", example: "Lo siento mucho por llegar tarde.", exampleKo: "늦어서 정말 죄송합니다." },
          { id: "es_406", word: "De nada", pronunciation: "데 나다", meaning: "천만에요", example: "—Gracias. —De nada.", exampleKo: "—감사합니다. —천만에요." },
          { id: "es_407", word: "Mucho gusto", pronunciation: "무초 구스토", meaning: "만나서 반갑습니다", example: "Mucho gusto en conocerte.", exampleKo: "당신을 알게 되어 반갑습니다." },
          { id: "es_408", word: "Adiós", pronunciation: "아디오스", meaning: "안녕히 가세요 / 작별", example: "Adiós, ¡hasta pronto!", exampleKo: "안녕히 가세요, 곧 또 만나요!" },
          { id: "es_409", word: "Uno, dos, tres", pronunciation: "우노, 도스, 트레스", meaning: "하나, 둘, 셋 (1, 2, 3)", example: "Uno, dos, tres, ¡vamos!", exampleKo: "하나, 둘, 셋, 가자!" },
          { id: "es_410", word: "Diez", pronunciation: "디에스", meaning: "열 (10)", example: "Son diez euros en total.", exampleKo: "모두 합쳐서 10유로입니다." },
          { id: "es_411", word: "Cien", pronunciation: "시엔", meaning: "백 (100)", example: "Cien por ciento seguro.", exampleKo: "100퍼센트 확실합니다." },
          { id: "es_412", word: "¿Cuánto cuesta?", pronunciation: "콴토 쿠에스타", meaning: "얼마인가요?", example: "Disculpe, ¿cuánto cuesta esto?", exampleKo: "실례합니다, 이것은 얼마인가요?" },
          { id: "es_413", word: "¿Dónde está?", pronunciation: "돈데 에스타", meaning: "어디에 있나요?", example: "¿Dónde está la estación?", exampleKo: "기차역이 어디에 있나요?" },
          { id: "es_414", word: "Amigo", pronunciation: "아미고", meaning: "친구", example: "Él es mi mejor amigo.", exampleKo: "그는 제 가장 친한 친구입니다." },
          { id: "es_415", word: "Excelente", pronunciation: "엑셀렌테", meaning: "훌륭한 / 최고", example: "¡Un trabajo excelente!", exampleKo: "정말 훌륭한 일이에요!" },
          { id: "es_416", word: "¡Muchas gracias por todo!", pronunciation: "무차스 그라시아스 포르 토도", meaning: "모든 것에 정말 감사합니다!", example: "¡Muchas gracias por todo, fue genial!", exampleKo: "모든 것에 감사드려요, 최고였어요!" },
          { id: "es_417", word: "¡Hasta luego, que tenga un buen día!", pronunciation: "아스타 루에고, 케 텡가 운 부엔 디아", meaning: "다음에 또 봐요, 좋은 하루 보내세요!", example: "¡Adiós y hasta luego, que tenga un buen día!", exampleKo: "안녕히 가세요, 좋은 하루 보내세요!" },
          { id: "es_418", word: "¿Me puede ayudar, por favor?", pronunciation: "메 푸에데 아유다르 포르 파보르", meaning: "도와주실 수 있나요, 부탁합니다?", example: "Disculpe, ¿me puede ayudar, por favor?", exampleKo: "실례합니다, 저 좀 도와주실 수 있나요?" }
        ],
        nodes: [
          { id: "es_4_n1", type: "stage", title: "1과: 기초 일상 표현", stageNumber: 1, wordIds: ["es_401", "es_402", "es_403", "es_404", "es_405", "es_406", "es_407", "es_408"] },
          { id: "es_4_n2", type: "bonus", title: "보너스 상자", rewardGems: 15 },
          { id: "es_4_n3", type: "stage", title: "2과: 숫자 & 필수 질문", stageNumber: 2, wordIds: ["es_409", "es_410", "es_411", "es_412", "es_413", "es_414", "es_415"] },
          { id: "es_4_n4", type: "sentence", title: "핵심 문장", targetSentence: "¡Muchas gracias por todo!", meaning: "모든 것에 정말 감사합니다!" },
          { id: "es_4_n5", type: "review", title: "약점 복습" },
          { id: "es_4_n6", type: "boss", title: "마스터 최종 보스전" }
        ]
      }
    ],
    lessons: {
      'node-1': {
        title: '1과: 기내 기본 표현',
        desc: '비행기 좌석 요청, 음료 주문, 착륙 안내 등 비행기 탑승 필수 스페인어!',
        icon: '✈️',
        level: '초급',
        category: '공항/기내',
        tags: ['스페인어', '공항', '기내', '비행기']
      },
      'node-2': {
        title: '2과: 입국 심사',
        desc: '입국 목적, 체류 기간, 숙소 위치 등 필수 공항 인터뷰 질문과 핵심 어휘!',
        icon: '🛂',
        level: '초중급',
        category: '입국심사',
        tags: ['스페인어', '입국심사', '여권', '인터뷰']
      },
      'node-3': {
        title: '3과: 수하물 찾기와 세관',
        desc: '수하물 수취대 찾기, 분실물 신고, 세관 검사 필수 표현 마스터!',
        icon: '🧳',
        level: '중급',
        category: '세관/수하물',
        tags: ['스페인어', '수하물', '세관', '짐찾기']
      },
      'node-boss': {
        title: '보스전: 공항 마스터 관문',
        desc: '기초 회화 총정리 & 스페인어 마스터 특별 보상!',
        icon: '👑',
        level: '보스전',
        category: '보스전',
        tags: ['스페인어', '공항 마스터', '보스전']
      }
    }
  };

  // 단어 ID 기반 맵 헬퍼 생성 및 양방향 속성(word/term, pronunciation/pron) 정규화
  const wordMap = {};
  courseData_es.units.forEach(u => {
    u.id = u.unitId;
    u.unit = u.unitNumber;
    u.subtitle = u.desc;
    u.words.forEach((w, idx) => {
      w.term = w.word;
      w.pron = w.pronunciation;
      w.phonetic = `[${w.pronunciation}]`;
      w.exampleTarget = w.example;
      w.exampleMeaning = w.exampleKo;
      wordMap[w.id] = w;
      // 레거시 id 호환 별칭 매핑
      const legacyId = (u.unitId === 1) ? (idx < 20 ? `es-n1-w${String(idx+1).padStart(2, '0')}` : `es-n1-s${String(idx-19).padStart(2, '0')}`)
        : (u.unitId === 2) ? (idx < 20 ? `es-n2-w${String(idx+1).padStart(2, '0')}` : `es-n2-s${String(idx-19).padStart(2, '0')}`)
        : (u.unitId === 3) ? (idx < 20 ? `es-n3-w${String(idx+1).padStart(2, '0')}` : `es-n3-s${String(idx-19).padStart(2, '0')}`)
        : (idx < 15 ? `es-nb-w${String(idx+1).padStart(2, '0')}` : `es-nb-s${String(idx-14).padStart(2, '0')}`);
      wordMap[legacyId] = w;
    });
  });
  courseData_es.wordMap = wordMap;

  // 전체 단어 평탄화 목록
  courseData_es.allWords = courseData_es.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {
    window.courseData_es = courseData_es;
    window.courseData = courseData_es; // 하위 호환 fallback
    if (!window.COURSES) window.COURSES = {};
    window.COURSES['es_main'] = courseData_es;
  }

  return courseData_es;
}));
