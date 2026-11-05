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
          desc: "생존 기초 회화, 숫자/시간, 길 찾기, 카페/식당 주문, 호텔/대중교통",
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
          desc: "거주/월세, 병원/약국, 쇼핑/환불, 은행/우체국, 날씨/취미",
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
          toCode: "VLC",
          toName: "발렌시아",
          duration: "1.5h 고속철",
          title: "발렌시아 생활 & 확장 (B1)",
          desc: "여행 돌발 상황, 차량 렌트/사고, 기초 업무 메일, 대인 관계, 문화 생활",
          unitStart: 71,
          unitEnd: 120,
          themeColor: "tertiary"
        },
        {
          id: "es_sec_4",
          tier: "B2 중상급 · 46 게이트",
          ticketCode: "VD-B2",
          fromCode: "VLC",
          fromName: "발렌시아",
          toCode: "SVQ",
          toName: "세비야",
          duration: "2h 국내선",
          title: "세비야 비즈니스 & 시사 (B2)",
          desc: "직무 협상, 시사 이슈, 환경/사회 현상, 공식 컴플레인, 프레젠테이션",
          unitStart: 121,
          unitEnd: 166,
          themeColor: "indigo"
        },
        {
          id: "es_sec_5",
          tier: "C1 고급 · 30 게이트",
          ticketCode: "VD-C1",
          fromCode: "SVQ",
          fromName: "세비야",
          toCode: "SLM",
          toName: "살라망카",
          duration: "2.5h 고속철",
          title: "살라망카 학술 & 전문 (C1)",
          desc: "법률/행정 소송, 금융/거시경제, 학술 리포트, 고급 관용구 및 뉘앙스",
          unitStart: 167,
          unitEnd: 196,
          themeColor: "rose"
        },
        {
          id: "es_sec_6",
          tier: "C2 최고급 · 20 게이트",
          ticketCode: "VD-C2",
          fromCode: "SLM",
          fromName: "살라망카",
          toCode: "TOL",
          toName: "톨레도",
          duration: "1h 셔틀",
          title: "톨레도 원어민 마스터 (C2)",
          desc: "역사/문학적 맥락, 철학/외교 담론, 스페인 고유 속담, 최상위 전문 어휘",
          unitStart: 197,
          unitEnd: 216,
          themeColor: "emerald"
        }
      ],
      units: {}
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
