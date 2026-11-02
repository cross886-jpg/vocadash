/**
 * js/data/languagesRegistry.js
 * 지원 언어 및 공식 학습 코스 메타데이터 레지스트리 (SSOT)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.availableLanguages = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const availableLanguages = [
    {
      code: "es",
      nameKo: "스페인어",
      nameNative: "Español",
      flag: "🇪🇸",
      mascotImg: "assets/characters/es-study.webp?v=88",
      isReady: true,
      courses: [
        { id: "es_main", title: "스페인어 정규 코스", desc: "일상 회화 & 실전 기초 어휘 마스터", isDlc: false, icon: "🇪🇸" },
        { id: "es_soccer", title: "스페인 축구 실전팩", desc: "스페셜 팩 · 경기장 어휘 & 피치 콜", isDlc: true, badge: "Official DLC", icon: "⚽" }
      ]
    },
    {
      code: "en",
      nameKo: "영어",
      nameNative: "English",
      flag: "🇺🇸",
      mascotImg: "assets/characters/en-study.webp?v=88",
      isReady: true,
      courses: [
        { id: "en_main", title: "영어 정규 코스", desc: "일상 회화 & 실전 필수 어휘 마스터", isDlc: false, icon: "🇺🇸" }
      ]
    },
    {
      code: "ja",
      nameKo: "일본어",
      nameNative: "日本語",
      flag: "🇯🇵",
      mascotImg: "assets/characters/es-study.webp?v=88",
      isReady: false,
      badge: "오픈 예정 🌸",
      courses: []
    },
    {
      code: "fr",
      nameKo: "프랑스어",
      nameNative: "Français",
      flag: "🇫🇷",
      mascotImg: "assets/characters/en-study.webp?v=88",
      isReady: false,
      badge: "준비 중 🥐",
      courses: []
    }
  ];

  if (typeof window !== 'undefined') {
    window.availableLanguages = availableLanguages;
  }

  return availableLanguages;
}));

