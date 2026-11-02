/**
 * js/data/courseSections.js
 * 코스/확장팩별 비행 여정(탑승권) 및 게이트 데이터 단일 진실 공급원 (SSOT)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.courseSections = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  const courseSections = {
    // 1. 스페인어 정규 코스 (ICN ➔ BCN ➔ MAD ...)
    es_main: {
      bannerTitle: "스페인행 모험 탑승권",
      bannerDesc: "목적지 비행 코스와 탑승 게이트를 선택하세요",
      sections: [
        {
          id: "es_sec_1",
          tier: "A1 입문 · 30 게이트",
          ticketCode: "VD-A1",
          fromCode: "ICN",
          fromName: "서울 인천",
          toCode: "BCN",
          toName: "바르셀로나",
          duration: "14h 직항",
          title: "바르셀로나 첫걸음 (A1)",
          desc: "기초 생존 스페인어 회화",
          unitStart: 1,
          unitEnd: 30,
          themeColor: "primary"
        },
        {
          id: "es_sec_2",
          tier: "A2 초급 · 40 게이트",
          ticketCode: "VD-A2",
          fromCode: "BCN",
          fromName: "바르셀로나",
          toCode: "MAD",
          toName: "마드리드",
          duration: "1h 국내선",
          title: "마드리드 일상 & 적응 (A2)",
          desc: "자신감 있는 일상 스페인어",
          unitStart: 31,
          unitEnd: 70,
          themeColor: "secondary"
        },
        {
          id: "es_sec_3",
          tier: "B1 중급 · 50 게이트",
          ticketCode: "VD-B1",
          fromCode: "MAD",
          fromName: "마드리드",
          toCode: "SVQ",
          toName: "세비야",
          duration: "2.5h 고속철",
          title: "안달루시아 열정과 문화 (B1)",
          desc: "현지인처럼 풍부한 감정 표현",
          unitStart: 71,
          unitEnd: 120,
          themeColor: "tertiary"
        },
        {
          id: "es_sec_4",
          tier: "B2 심화 · 46 게이트",
          ticketCode: "VD-B2",
          fromCode: "SVQ",
          fromName: "세비야",
          toCode: "VLC",
          toName: "발렌시아",
          duration: "1.2h 연결편",
          title: "발렌시아 축제와 비즈니스 (B2)",
          desc: "유창한 토론과 전문 어휘",
          unitStart: 121,
          unitEnd: 166,
          themeColor: "indigo"
        },
        {
          id: "es_sec_5",
          tier: "C1 고급 · 30 게이트",
          ticketCode: "VD-C1",
          fromCode: "VLC",
          fromName: "발렌시아",
          toCode: "AGP",
          toName: "말라가",
          duration: "1h 셔틀",
          title: "말라가 미식과 심화 회화 (C1)",
          desc: "고급 뉘앙스와 관용구 마스터",
          unitStart: 167,
          unitEnd: 196,
          themeColor: "rose"
        },
        {
          id: "es_sec_6",
          tier: "C2 마스터 · 20 게이트",
          ticketCode: "VD-C2",
          fromCode: "AGP",
          fromName: "말라가",
          toCode: "BIO",
          toName: "빌바오",
          duration: "1.5h 특별편",
          title: "빌바오 원어민 심화 (C2)",
          desc: "원어민급 네이티브 완성",
          unitStart: 197,
          unitEnd: 216,
          themeColor: "emerald"
        }
      ],
      units: {
        1: { title: "생존 첫걸음 & 일상 인사", desc: "¡Hola!, Gracias 등 기초 회화" },
        2: { title: "카페, 식당 & 타파스 주문", desc: "Café con leche, 타파스 메뉴 주문" },
        3: { title: "길찾기 & 대중교통", desc: "Metro 환승, 방향 및 위치 묻기" },
        4: { title: "마트 장보기, 결제 & 수량 표현", desc: "식재료 쇼핑, 가격 및 결제" }
      }
    },

    // 2. 스페인 축구 실전팩 (LOCKER ➔ PITCH ➔ STADIUM)
    es_soccer: {
      bannerTitle: "라리가 피치 실전 마스터 패스",
      bannerDesc: "피치 위 1초 외침과 실전 축구 스페인어를 마스터하세요",
      sections: [
        {
          id: "soccer_sec_1",
          tier: "MATCH 1 · 기본 피치",
          ticketCode: "MATCH-01",
          fromCode: "LOCKER",
          fromName: "라커룸",
          toCode: "PITCH",
          toName: "그라운드",
          duration: "전반전",
          title: "기초 피치 콜 & 포지션",
          desc: "상세 포지션 및 1초 필수 구호",
          unitStart: 1,
          unitEnd: 4,
          themeColor: "emerald"
        },
        {
          id: "soccer_sec_2",
          tier: "MATCH 2 · 실전 전술",
          ticketCode: "MATCH-02",
          fromCode: "PITCH",
          fromName: "그라운드",
          toCode: "CAMP",
          toName: "스타디움",
          duration: "후반전",
          title: "전술 지시 & 피지컬",
          desc: "감독 전술, 부상 및 심판 판정",
          unitStart: 5,
          unitEnd: 8,
          themeColor: "primary"
        }
      ],
      units: {
        1: { title: "포지션, 피치 & 장비", desc: "상세 포지션과 축구 장비 및 그라운드 명칭" },
        2: { title: "패스, 슛 & 실전 액션", desc: "패스, 킥, 볼 터치 기술과 판정 룰" },
        3: { title: "피치 위 1초 긴급 콜", desc: "경기 중 선수들끼리 1초 만에 외치는 필수 구호" },
        4: { title: "전술 지시 & 빌드업", desc: "감독 전술 지시와 공간 활용 문장" },
        5: { title: "부상, 피지컬 & 컨디션", desc: "실제 훈련/경기 때 발생하는 부상과 몸 상태 표현" },
        6: { title: "경기 후 인터뷰 & 피드백", desc: "경기 종료 후 감독/동료와의 전술 피드백" }
      }
    },

    // 3. 영어 정규 코스 (ICN ➔ SFO ➔ LAX ...)
    en_main: {
      bannerTitle: "미국행 어드벤처 탑승권",
      bannerDesc: "미 대륙 횡단 코스와 탑승 게이트를 선택하세요",
      sections: [
        {
          id: "en_sec_1",
          tier: "A1 입문 · 27 게이트",
          ticketCode: "VD-EN1",
          fromCode: "ICN",
          fromName: "서울 인천",
          toCode: "SFO",
          toName: "샌프란시스코",
          duration: "10h 직항",
          title: "실리콘밸리 첫걸음 (A1)",
          desc: "공항, 호텔 & 생존 기초 영어",
          unitStart: 1,
          unitEnd: 27,
          themeColor: "primary"
        },
        {
          id: "en_sec_2",
          tier: "A2 초급 · 40 게이트",
          ticketCode: "VD-EN2",
          fromCode: "SFO",
          fromName: "샌프란시스코",
          toCode: "LAX",
          toName: "로스앤젤레스",
          duration: "1.5h 해안선",
          title: "캘리포니아 라이프 (A2)",
          desc: "일상 스몰토크 & 여가 표현",
          unitStart: 28,
          unitEnd: 67,
          themeColor: "secondary"
        },
        {
          id: "en_sec_3",
          tier: "B1 중급 · 50 게이트",
          ticketCode: "VD-EN3",
          fromCode: "LAX",
          fromName: "로스앤젤레스",
          toCode: "ORD",
          toName: "시카고",
          duration: "4h 대륙횡단",
          title: "루트66 로드트립 (B1)",
          desc: "문제 대처와 상세한 상황 묘사",
          unitStart: 68,
          unitEnd: 117,
          themeColor: "tertiary"
        },
        {
          id: "en_sec_4",
          tier: "B2 심화 · 49 게이트",
          ticketCode: "VD-EN4",
          fromCode: "ORD",
          fromName: "시카고",
          toCode: "NYC",
          toName: "뉴욕 맨해튼",
          duration: "2.5h 특급",
          title: "맨해튼 비즈니스 & 미디어 (B2)",
          desc: "비즈니스 회화와 미디어 토론",
          unitStart: 118,
          unitEnd: 166,
          themeColor: "indigo"
        }
      ],
      units: {
        1: { title: "입국 심사 & 공항 첫걸음", desc: "SFO 도착, 세관 신고 & 환전" },
        2: { title: "우버 탑승 & 호텔 체크인", desc: "차량 호출 및 호텔 프론트 데스크" },
        3: { title: "미국 카페 & 스타벅스 커스텀", desc: "커피 사이즈, 원두 & 팁 결제" },
        4: { title: "트레이더조 & 마트 장보기", desc: "식료품 계산 및 봉투 요청" }
      }
    }
  };

  // 하위 호환성 (Legacy & Language Aliases)
  courseSections.es = courseSections.es_main;
  courseSections.en = courseSections.en_main;
  courseSections.pack_football = courseSections.es_soccer;
  courseSections.es_football = courseSections.es_soccer;
  courseSections.soccer = courseSections.es_soccer;
  courseSections.main = courseSections.es_main;

  if (typeof window !== 'undefined') {
    window.courseSections = courseSections;
  }

  return courseSections;
}));
