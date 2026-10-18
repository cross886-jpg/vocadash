// =================================================
// [고품질 듀얼 사운드 재생 엔진 (Dual TTS Player)]
// 1순위: Google Translate 고음질 원어민 CDN 오디오 스트림 재생
// 2순위: 네트워크 차단/에러 시 Web Speech API 고음질 보이스 선별 폴백
// =================================================
let currentPlayingAudio = null;
let cachedSynthesisVoices = [];

function loadSynthesisVoices() {
  if ('speechSynthesis' in window) {
    try {
      cachedSynthesisVoices = window.speechSynthesis.getVoices() || [];
    } catch (_) {}
  }
}
if ('speechSynthesis' in window) {
  loadSynthesisVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadSynthesisVoices;
  }
}

function getBestNaturalVoice(targetLang = 'es') {
  if (!('speechSynthesis' in window)) return null;
  if (cachedSynthesisVoices.length === 0) loadSynthesisVoices();

  const isEn = (targetLang === 'en' || targetLang === 'en-US');
  const langPrefix = isEn ? 'en' : 'es';

  // 1) 사용자 지정 고음질 자연어 보이스 우선순위 키워드
  const priorityKeywords = isEn
    ? ['Google US English', 'Natural', 'Samantha', 'Alex', 'Victoria', 'Karen']
    : ['Google español', 'Natural', 'Monica', 'Jorge', 'Paulina', 'Elvira', 'Mónica', 'Diego'];

  for (const kw of priorityKeywords) {
    const found = cachedSynthesisVoices.find(v =>
      v.lang && v.lang.toLowerCase().startsWith(langPrefix) &&
      v.name && v.name.toLowerCase().includes(kw.toLowerCase())
    );
    if (found) return found;
  }

  // 2) 언어 접두사 매칭 중 natural / google 포함 보이스 또는 첫 번째 매칭
  const langMatches = cachedSynthesisVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
  if (langMatches.length > 0) {
    const naturalVoice = langMatches.find(v =>
      v.name && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))
    );
    return naturalVoice || langMatches[0];
  }
  return null;
}

function sanitizeTTSText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[¡!¿?"'\[\]()“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function setUiSpeakerActive(buttonEl) {
  if (!buttonEl) return;
  buttonEl.classList.add('tts-speaking', 'text-emerald-500', 'animate-pulse');
  buttonEl.classList.remove('text-slate-400', 'text-slate-500', 'text-on-surface-variant');
}

function resetUiSpeakerActive(buttonEl) {
  if (!buttonEl) return;
  buttonEl.classList.remove('tts-speaking', 'text-emerald-500', 'animate-pulse');
}

function stopAllTTS() {
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (_) {}
    currentPlayingAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
  document.querySelectorAll('.tts-speaking').forEach(el => {
    resetUiSpeakerActive(el);
  });
}
window.stopTTS = stopAllTTS;

function speakWithWebSpeechFallback(cleanWord, targetLangCode, buttonEl) {
  if (!('speechSynthesis' in window)) {
    if (buttonEl) resetUiSpeakerActive(buttonEl);
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const isEn = (targetLangCode === 'en' || targetLangCode === 'en-US');
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = isEn ? 'en-US' : 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const bestVoice = getBestNaturalVoice(targetLangCode);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => {
      if (buttonEl) resetUiSpeakerActive(buttonEl);
    };
    utterance.onerror = () => {
      if (buttonEl) resetUiSpeakerActive(buttonEl);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (buttonEl) resetUiSpeakerActive(buttonEl);
  }
}

function playDualTTS(text, lang = 'es', buttonEl = null) {
  stopAllTTS();

  const cleanWord = sanitizeTTSText(text);
  if (!cleanWord) return;

  const isEn = (lang === 'en' || lang === 'en-US');
  const targetLangCode = isEn ? 'en' : 'es';

  if (buttonEl) {
    setUiSpeakerActive(buttonEl);
  }

  // 1순위: Google Translate 고음질 CDN 오디오 스트림 재생
  const cdnUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLangCode}&q=${encodeURIComponent(cleanWord)}`;

  let fallbackTriggered = false;
  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    speakWithWebSpeechFallback(cleanWord, targetLangCode, buttonEl);
  };

  try {
    const audio = new Audio();
    currentPlayingAudio = audio;
    audio.playbackRate = 0.98;
    audio.src = cdnUrl;

    audio.onended = () => {
      if (currentPlayingAudio === audio) currentPlayingAudio = null;
      if (buttonEl) resetUiSpeakerActive(buttonEl);
    };

    audio.onerror = () => {
      if (currentPlayingAudio === audio) currentPlayingAudio = null;
      triggerFallback();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (currentPlayingAudio === audio) currentPlayingAudio = null;
        triggerFallback();
      });
    }
  } catch (err) {
    triggerFallback();
  }
}

window.speakWord = playDualTTS;
window.playTTS = playDualTTS;
window.safePlayTTS = playDualTTS;
window.playDualTTS = playDualTTS;

document.addEventListener('DOMContentLoaded', () => {
  // ===================================================
  // 0. BRAND SPLASH INTRO CONTROLLER (1.2s auto + tap to skip)
  // ===================================================
  const splashScreen = document.getElementById('splash-screen');
  const splashProgressBar = document.getElementById('splash-progress-bar');
  const splashMascot = document.getElementById('splash-mascot-img');
  let splashDismissed = false;

  function dismissSplash() {
    splashDismissed = true;
    if (!splashScreen) return;
    splashScreen.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      splashScreen.classList.add('hidden');
      splashScreen.style.display = 'none';
    }, 400);
  }
  window.dismissSplash = dismissSplash;

  if (splashScreen) {
    if (splashMascot) {
      let savedLang = 'es';
      try { savedLang = localStorage.getItem('vocadash_language') || 'es'; } catch (_) {}
      splashMascot.src = `assets/characters/${savedLang}-idle.webp?v=25`;
    }
    if (splashProgressBar) {
      setTimeout(() => {
        splashProgressBar.style.width = '100%';
      }, 50);
    }
    splashScreen.addEventListener('click', dismissSplash);
    splashScreen.addEventListener('touchstart', dismissSplash, { passive: true });

    // 리소스 로드 후 약 1.2초 동안 머문 뒤 부드럽게 페이드아웃
    if (document.readyState === 'complete') {
      setTimeout(dismissSplash, 1200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(dismissSplash, 1200);
      });
    }
    // 안전 타임아웃
    setTimeout(dismissSplash, 3000);
  }

  // 보안 유틸: HTML 특수문자 이스케이프 (XSS 취약점 원천 차단)
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.escapeHTML = escapeHTML;

  // 1. Shared Global State & Course Metadata (localStorage 동기화)
  const PROGRESS_STORAGE_KEY = 'vocadash_node_progress';
  function loadNodeProgress() {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            'node-1': Math.min(3, Math.max(0, typeof parsed['node-1'] === 'number' ? parsed['node-1'] : 3)),
            'node-2': Math.min(3, Math.max(0, typeof parsed['node-2'] === 'number' ? parsed['node-2'] : 0)),
            'node-3': Math.min(3, Math.max(0, typeof parsed['node-3'] === 'number' ? parsed['node-3'] : 0)),
            'node-boss': Math.min(3, Math.max(0, typeof parsed['node-boss'] === 'number' ? parsed['node-boss'] : 0))
          };
        }
      }
    } catch (e) {
      console.warn('localStorage 로드 예외 방어:', e);
    }
    return { 'node-1': 3, 'node-2': 0, 'node-3': 0, 'node-boss': 0 };
  }

  function saveNodeProgress() {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(window.nodeProgressMap));
    } catch (e) {
      console.warn('localStorage 저장 예외 방어:', e);
    }
  }

  window.nodeProgressMap = loadNodeProgress();
  window.saveNodeProgress = saveNodeProgress;
  window.currentSessionQuestions = [];

  function getSavedLanguage() {
    try {
      const val = localStorage.getItem('vocadash_language');
      if (val === 'en' || val === 'es') return val;
    } catch (_) {}
    return 'es';
  }
  window.getSavedLanguage = getSavedLanguage;
  window.currentActiveCourse = getSavedLanguage();
  window.currentLanguage = window.currentActiveCourse;

  function getSavedCourseId() {
    try {
      const val = localStorage.getItem('vocadash_current_course');
      if (val && typeof val === 'string' && /^[a-zA-Z0-9_-]+$/.test(val)) {
        return val;
      }
      return 'basic';
    } catch (_) {
      return 'basic';
    }
  }
  window.currentCourseId = getSavedCourseId();
  window.currentBookCourseId = window.currentCourseId;

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

  window.courseData = {
    es: { code: 'es', name: '스페인어', flag: '🇪🇸', title: '여행 필수 패턴', mascotImg: 'assets/characters/es-study.webp?v=25', ctaText: '스페인어로 학습하기', desc: '스페인어 (여행 필수 패턴)' },
    en: { code: 'en', name: '영어', flag: '🇺🇸', title: '필수 회화 & 어휘', mascotImg: 'assets/characters/en-study.webp?v=25', ctaText: '영어로 학습하기', desc: '영어 (필수 회화 & 어휘)' }
  };

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

  const courseCategoryMap = {
    basic: { icon: '🌱', titles: { es: '기초 회화', en: '기초 회화' }, categories: ['전체', '인사/안부', '감사/사과', '숫자/시간', '일상 기초'] },
    travel: { icon: '✈️', titles: { es: '여행 스페인어', en: '여행 영어' }, categories: ['전체', '공항/기내', '교통/길찾기', '호텔/숙소', '식당/카페'] },
    dele: { icon: '🎓', titles: { es: 'DELE 준비과정', en: 'DELE 준비과정' }, categories: ['전체', 'DELE A1', 'DELE A2', 'DELE B1', 'DELE B2'] },
    business: { icon: '💼', titles: { es: '비즈니스 스페인어', en: '비즈니스 영어' }, categories: ['전체', '오피스 일상', '이메일/문서', '미팅/협상', '비자/행정'] },
    toeic: { icon: '🎓', titles: { es: '토익/오픽 대비', en: '토익/오픽 대비' }, categories: ['전체', 'Part 1/2', 'Part 3/4', 'Part 5/6', 'Part 7'] }
  };

  let currentSelectedNodeId = 'node-2', modalSelectedCourse = 'es', lockedTooltipTimer = null;

  // DOM Helpers
  const el = (id) => document.getElementById(id), setText = (id, txt) => { const node = el(id); if (node) node.textContent = txt; }, on = (id, evt, fn) => { const node = el(id); if (node) node.addEventListener(evt, fn); };

  // 2. Global Toast & Notifications completely disabled per requirements
  window.showToast = function () {};
  window.showNotification = function () {};

  function toggleModal(backdrop, card, open, anim = 'fade') {
    if (backdrop) {
      backdrop.classList.toggle('opacity-0', !open); backdrop.classList.toggle('pointer-events-none', !open);
      backdrop.classList.toggle('opacity-100', open); backdrop.classList.toggle('pointer-events-auto', open);
    }
    if (card) {
      card.classList.toggle('opacity-0', !open); card.classList.toggle('pointer-events-none', !open);
      card.classList.toggle('opacity-100', open); card.classList.toggle('pointer-events-auto', open);
      if (anim === 'slide') { card.classList.toggle('translate-y-full', !open); card.classList.toggle('translate-y-0', open); }
      else {
        card.classList.toggle('scale-95', !open); card.classList.toggle('scale-100', open);
      }
    }
  }

  // 3. Roadmap Nodes & Lesson Bottom Sheet
  const lessonBackdrop = el('lesson-modal-backdrop'), lessonSheet = el('lesson-card-sheet'), lockedTooltip = el('locked-node-tooltip');

  window.openLessonModal = function (nodeId) {
    const gScreen = document.getElementById('game-screen');
    if (gScreen && gScreen.classList.contains('opacity-100') && !gScreen.classList.contains('pointer-events-none')) {
      console.warn('🛑 게임 화면 활성 중 openLessonModal 호출 차단됨!');
      return;
    }
    currentSelectedNodeId = nodeId;
    const courseId = window.currentCourseId || 'basic';
    const lessons = (window.COURSE_LESSONS && window.COURSE_LESSONS[courseId]) || (COURSE_LESSONS && COURSE_LESSONS[courseId]) || COURSE_LESSONS.basic;
    const progress = window.nodeProgressMap[nodeId] || 0;
    const data = (lessons && lessons[nodeId]) || window.nodeLessonData[nodeId] || window.nodeLessonData['node-2'];

    setText('lesson-modal-icon', data.icon); setText('lesson-modal-title', data.title); setText('lesson-modal-desc', data.desc);
    setText('lesson-modal-badge', `${nodeId === 'node-1' ? '1과' : nodeId === 'node-3' ? '3과' : nodeId === 'node-boss' ? '4과' : '2과'} · ${progress >= 3 ? '레슨 완료' : '현재 도전 중'}`);
    setText('lesson-modal-progress-text', `${progress}/3`);
    setText('lesson-start-btn-text', progress >= 3 ? '복습 시작하기' : progress === 2 ? '마지막 레슨 도전!' : progress === 1 ? '다음 레슨 계속하기' : '학습 시작하기');
    const progBar = el('lesson-modal-progress-bar');
    if (progBar) {
      progBar.style.width = progress >= 3 ? '100%' : progress === 2 ? '67%' : progress === 1 ? '33%' : '0%';
      progBar.className = `h-full rounded-full transition-all duration-300 ${progress >= 3 ? 'bg-primary' : 'bg-secondary'}`;
    }
    if (lessonBackdrop) {
      lessonBackdrop.classList.remove('opacity-0', 'pointer-events-none');
      lessonBackdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (lessonSheet) {
      lessonSheet.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');
      lessonSheet.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto', 'scale-100');
    }
  };
  window.showLessonModal = window.openLessonModal;
  window.openLessonPreview = window.openLessonModal;

  window.closeLessonModal = function () {
    if (lessonBackdrop) {
      lessonBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
      lessonBackdrop.classList.add('opacity-0', 'pointer-events-none');
    }
    if (lessonSheet) {
      lessonSheet.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto', 'scale-100');
      lessonSheet.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none', 'scale-95');
    }
  };

  function updateRoadmapNodesUI() {
    const lang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const courseId = window.currentCourseId || 'basic';
    const langPresets = COURSE_LESSONS[lang] || COURSE_LESSONS.es;
    const lessons = langPresets[courseId] || langPresets.basic || COURSE_LESSONS.es.basic;

    // Node 1 타이틀 및 버튼 타이틀 동적 반영
    const node1Title = el('node-1-title') || document.querySelector('[data-node-id="node-1"] .font-label-md');
    if (node1Title && lessons['node-1']) {
      node1Title.textContent = lessons['node-1'].title;
    }
    const node1Btn = el('node-1-btn');
    if (node1Btn && lessons['node-1']) {
      node1Btn.title = lessons['node-1'].title;
    }

    // Node 2 타이틀 동적 반영
    const node2Title = el('node-2-title') || document.querySelector('#node-2-label-card .font-label-md');
    if (node2Title && lessons['node-2']) {
      node2Title.textContent = lessons['node-2'].title;
    }

    // Node 3 타이틀 동적 반영
    const node3Title = el('node-3-title') || document.querySelector('#node-3-label-card .font-label-md');
    if (node3Title && lessons['node-3']) {
      node3Title.textContent = lessons['node-3'].title;
    }

    // Node Boss 타이틀 및 설명 동적 반영
    const nodeBossTitle = el('node-boss-title') || document.querySelector('[data-node-id="node-boss"] .font-headline-sm');
    if (nodeBossTitle && lessons['node-boss']) {
      nodeBossTitle.textContent = lessons['node-boss'].title;
    }
    const nodeBossDesc = el('node-boss-desc') || document.querySelector('[data-node-id="node-boss"] .font-label-sm.text-tertiary');
    if (nodeBossDesc && lessons['node-boss']) {
      nodeBossDesc.textContent = lessons['node-boss'].desc;
    }

    // 교재/단어장 챕터 타이틀 동기화
    const bookChapterTitle = el('book-chapter-title') || document.querySelector('#book-words-container span.uppercase');
    if (bookChapterTitle && lessons['node-1']) {
      bookChapterTitle.textContent = lessons['node-1'].title + (courseId === 'basic' ? ' (기초 회화)' : '');
    }

    const prog2 = window.nodeProgressMap['node-2'] || 0;
    const prog3 = window.nodeProgressMap['node-3'] || 0;

    // Node 2 요소 레퍼런스
    const banner2 = el('node-2-start-banner');
    const target2 = el('node-2-target');
    const ping2 = el('node-2-ping');
    const pulseRing2 = el('node-2-pulse-ring');
    const checkBadge2 = el('node-2-check-badge');
    const badge2 = el('node-2-label-badge');
    const btn2 = el('node-2-btn');
    const card2 = el('node-2-label-card');

    if (prog2 >= 3) {
      // 2과 완료 상태 (1과처럼 초록색 체크 & ⭐⭐⭐ 완료 표시)
      if (banner2) banner2.classList.add('hidden');
      if (ping2) ping2.classList.add('hidden');
      if (pulseRing2) pulseRing2.classList.add('hidden');
      if (checkBadge2) {
        checkBadge2.classList.remove('hidden');
        checkBadge2.style.display = 'flex';
      }
      if (target2) target2.dataset.nodeType = 'completed';

      if (btn2) {
        btn2.className = 'node-btn w-[72px] h-[72px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_6px_0_0_#15803d,0_12px_20px_-2px_rgba(34,197,94,0.35)] active:translate-y-1.5 active:shadow-[0_1px_0_0_#15803d] transition-all cursor-pointer';
        btn2.title = (lessons['node-2'] ? lessons['node-2'].title : '2과: 감사/사과') + ' (완료)';
        const iconSpan2 = btn2.querySelector('span');
        if (iconSpan2) {
          iconSpan2.className = 'material-symbols-outlined text-[34px]';
          iconSpan2.style.fontVariationSettings = "'FILL' 1";
          iconSpan2.textContent = 'check';
        }
      }

      if (card2) {
        card2.className = 'mt-3 flex flex-col items-center bg-surface-container-lowest px-3.5 py-1.5 rounded-2xl shadow-[0_3px_10px_rgba(0,0,0,0.05)] text-center border border-outline-variant/30 pointer-events-none';
      }

      if (badge2) {
        badge2.innerHTML = '<span class="text-xs">⭐</span><span class="text-xs">⭐</span><span class="text-xs">⭐</span><span class="font-label-sm text-[10px] text-primary font-bold ml-1">완료!</span>';
      }
    } else {
      // 2과 진행 중 상태
      if (banner2) banner2.classList.remove('hidden');
      if (ping2) ping2.classList.remove('hidden');
      if (pulseRing2) pulseRing2.classList.remove('hidden');
      if (checkBadge2) checkBadge2.classList.add('hidden');
      if (target2) target2.dataset.nodeType = 'active';

      if (btn2) {
        btn2.className = 'node-btn relative w-[76px] h-[76px] rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-[0_7px_0_0_#0284c7,0_16px_28px_rgba(2,132,199,0.35)] active:translate-y-1.5 active:shadow-[0_1px_0_0_#0284c7] transition-all cursor-pointer';
        btn2.title = lessons['node-2'] ? lessons['node-2'].title : '2과: 감사/사과';
        const iconSpan2 = btn2.querySelector('span');
        if (iconSpan2) {
          iconSpan2.className = 'material-symbols-outlined text-[36px] animate-wiggle';
          iconSpan2.style.fontVariationSettings = "'FILL' 1";
          iconSpan2.textContent = courseId === 'basic' ? 'sentiment_satisfied' : 'flight_takeoff';
        }
      }

      if (card2) {
        card2.className = 'mt-3.5 flex flex-col items-center bg-surface-container-lowest px-4 py-2 rounded-2xl shadow-[0_4px_14px_rgba(0,101,145,0.1)] text-center ring-2 ring-secondary-container/50 pointer-events-none';
      }

      if (badge2) {
        if (prog2 > 0) {
          badge2.innerHTML = `<span class="font-label-sm text-[11px] text-secondary font-black">${prog2}/3 레슨 진행중</span>`;
        } else {
          badge2.innerHTML = '<span class="font-label-sm text-[11px] text-secondary font-black">0/3 레슨 진행중</span>';
        }
      }
    }

    // Node 3 (2과 3회 달성 시 영구 해제, 3회 달성 시 완료 체크)
    const node3Container = el('node-3-container');
    const banner3 = el('node-3-start-banner');
    const node3Target = el('node-3-target');
    const ping3 = el('node-3-ping');
    const pulseRing3 = el('node-3-pulse-ring');
    const checkBadge3 = el('node-3-check-badge');
    const btn3 = el('node-3-btn');
    const badge3 = el('node-3-label-badge');
    const card3 = el('node-3-label-card');

    if (prog3 >= 3) {
      // 3과 완료 상태 (1과, 2과처럼 초록색 완료 체크 & ⭐⭐⭐ 완료 표시)
      if (node3Container) {
        node3Container.classList.remove('opacity-75');
        node3Container.classList.add('opacity-100');
        node3Container.style.opacity = '1';
      }
      if (banner3) banner3.classList.add('hidden');
      if (ping3) ping3.classList.add('hidden');
      if (pulseRing3) pulseRing3.classList.add('hidden');
      if (checkBadge3) {
        checkBadge3.classList.remove('hidden');
        checkBadge3.style.display = 'flex';
      }
      if (node3Target) {
        node3Target.dataset.nodeType = 'completed';
        node3Target.removeAttribute('data-lock-msg');
        node3Target.removeAttribute('data-lock-icon');
      }
      if (btn3) {
        btn3.className = 'node-btn w-[72px] h-[72px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_6px_0_0_#15803d,0_12px_20px_-2px_rgba(34,197,94,0.35)] active:translate-y-1.5 active:shadow-[0_1px_0_0_#15803d] transition-all cursor-pointer';
        btn3.title = (lessons['node-3'] ? lessons['node-3'].title : '3과: 수하물 찾기와 세관') + ' (완료)';
        const iconSpan3 = btn3.querySelector('span');
        if (iconSpan3) {
          iconSpan3.className = 'material-symbols-outlined text-[34px]';
          iconSpan3.style.fontVariationSettings = "'FILL' 1";
          iconSpan3.textContent = 'check';
        }
      }
      if (card3) {
        card3.className = 'mt-3 flex flex-col items-center bg-surface-container-lowest px-3.5 py-1.5 rounded-2xl shadow-[0_3px_10px_rgba(0,0,0,0.05)] text-center border border-outline-variant/30 pointer-events-none';
      }
      if (badge3) {
        badge3.innerHTML = '<span class="text-xs">⭐</span><span class="text-xs">⭐</span><span class="text-xs">⭐</span><span class="font-label-sm text-[10px] text-primary font-bold ml-1">완료!</span>';
      }
    } else if (prog2 >= 3) {
      if (node3Container) {
        node3Container.classList.remove('opacity-75');
        node3Container.classList.add('opacity-100');
        node3Container.style.opacity = '1';
      }
      if (banner3) banner3.classList.remove('hidden');
      if (ping3) ping3.classList.remove('hidden');
      if (pulseRing3) pulseRing3.classList.remove('hidden');
      if (checkBadge3) checkBadge3.classList.add('hidden');

      if (node3Target) {
        node3Target.dataset.nodeType = 'active';
        node3Target.removeAttribute('data-lock-msg');
        node3Target.removeAttribute('data-lock-icon');
      }
      if (btn3) {
        btn3.className = 'node-btn relative w-[76px] h-[76px] rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-[0_7px_0_0_#0284c7,0_16px_28px_rgba(2,132,199,0.35)] active:translate-y-1.5 active:shadow-[0_1px_0_0_#0284c7] transition-all cursor-pointer';
        btn3.title = lessons['node-3'] ? lessons['node-3'].title : '3과: 수하물 찾기와 세관';
        const iconSpan3 = btn3.querySelector('span');
        if (iconSpan3) {
          iconSpan3.className = 'material-symbols-outlined text-[36px] animate-wiggle';
          iconSpan3.textContent = 'luggage';
        }
      }
      if (card3) {
        card3.className = 'mt-3.5 flex flex-col items-center bg-surface-container-lowest px-4 py-2 rounded-2xl shadow-[0_4px_14px_rgba(0,101,145,0.1)] text-center ring-2 ring-secondary-container/50 pointer-events-none';
      }
      if (badge3) {
        if (prog3 > 0) {
          badge3.innerHTML = `<span class="font-label-sm text-[11px] text-secondary font-black">${prog3}/3 레슨 진행중</span>`;
        } else {
          badge3.innerHTML = '<span class="font-label-sm text-[11px] text-secondary font-black">지금 학습 가능! (0/3)</span>';
        }
      }
    } else {
      if (node3Container) {
        node3Container.classList.remove('opacity-100');
        node3Container.classList.add('opacity-75');
        node3Container.style.opacity = '0.75';
      }
      if (banner3) banner3.classList.add('hidden');
      if (ping3) ping3.classList.add('hidden');
      if (pulseRing3) pulseRing3.classList.add('hidden');
      if (checkBadge3) checkBadge3.classList.add('hidden');

      if (node3Target) {
        node3Target.dataset.nodeType = 'locked';
        node3Target.setAttribute('data-lock-msg', '이전 레슨을 먼저 완료해야 열려요!');
        node3Target.setAttribute('data-lock-icon', '🔒');
      }
      if (btn3) {
        btn3.className = 'node-btn w-[66px] h-[66px] rounded-full bg-surface-container-high text-outline flex items-center justify-center shadow-[0_5px_0_0_#bccbb9] active:translate-y-1 active:shadow-[0_1px_0_0_#bccbb9] transition-all cursor-pointer';
        btn3.title = '3과: 잠김';
        const iconSpan3 = btn3.querySelector('span');
        if (iconSpan3) {
          iconSpan3.className = 'material-symbols-outlined text-[28px]';
          iconSpan3.textContent = 'lock';
        }
      }
      if (card3) {
        card3.className = 'mt-3 flex flex-col items-center bg-surface-container-lowest px-3.5 py-1.5 rounded-2xl shadow-[0_3px_10px_rgba(0,0,0,0.05)] text-center border border-outline-variant/30 pointer-events-none';
      }
      if (badge3) {
        badge3.innerHTML = '<span class="font-label-sm text-[10px] text-outline font-semibold">2과 완료 후 잠금 해제</span>';
      }
    }

    // Node Boss (3과 3회 달성 시 영구 해제 & START 배너)
    const progBoss = window.nodeProgressMap['node-boss'] || 0;
    const nodeBossContainer = el('node-boss-container') || document.querySelector('[data-node-id="node-boss"]');
    const bannerBoss = el('node-boss-start-banner');
    const targetBoss = el('node-boss-target') || (nodeBossContainer && nodeBossContainer.querySelector('.node-target'));
    const glowBoss = el('node-boss-glow');
    const btnBoss = el('node-boss-btn') || (nodeBossContainer && nodeBossContainer.querySelector('.node-btn'));
    const lockBadgeBoss = el('node-boss-lock-badge');
    const checkBadgeBoss = el('node-boss-check-badge');
    const badgeBoss = el('node-boss-label-badge');

    if (prog3 >= 3) {
      if (nodeBossContainer) {
        nodeBossContainer.classList.remove('opacity-75');
        nodeBossContainer.classList.add('opacity-100');
        nodeBossContainer.style.opacity = '1';
      }
      if (lockBadgeBoss) lockBadgeBoss.classList.add('hidden');
      if (glowBoss) {
        glowBoss.classList.remove('hidden');
        glowBoss.classList.add('animate-pulse');
      }

      if (progBoss >= 3) {
        if (bannerBoss) bannerBoss.classList.add('hidden');
        if (targetBoss) {
          targetBoss.dataset.nodeType = 'completed';
          targetBoss.removeAttribute('data-lock-msg');
          targetBoss.removeAttribute('data-lock-icon');
        }
        if (checkBadgeBoss) {
          checkBadgeBoss.classList.remove('hidden');
          checkBadgeBoss.style.display = 'flex';
        }
        if (badgeBoss) {
          badgeBoss.innerHTML = '<span class="text-xs">⭐</span><span class="text-xs">⭐</span><span class="text-xs">⭐</span><span class="font-label-sm text-[10px] text-primary font-bold ml-1">완료!</span>';
        }
      } else {
        if (bannerBoss) bannerBoss.classList.remove('hidden');
        if (targetBoss) {
          targetBoss.dataset.nodeType = 'active';
          targetBoss.removeAttribute('data-lock-msg');
          targetBoss.removeAttribute('data-lock-icon');
        }
        if (checkBadgeBoss) checkBadgeBoss.classList.add('hidden');
        if (btnBoss) {
          btnBoss.title = (lessons['node-boss'] ? lessons['node-boss'].title : '4과: 보스전') + ' (도전 가능!)';
        }
        if (badgeBoss) {
          badgeBoss.innerHTML = '<span class="font-label-sm text-[11px] text-amber-600 font-extrabold flex items-center gap-1"><span>⚡</span><span>도전 가능!</span></span>';
        }
      }
    } else {
      if (nodeBossContainer) {
        nodeBossContainer.classList.add('opacity-75');
      }
      if (bannerBoss) bannerBoss.classList.add('hidden');
      if (targetBoss) {
        targetBoss.dataset.nodeType = 'locked';
        targetBoss.setAttribute('data-lock-msg', '1~3과를 모두 통과해야 보스전에 도전할 수 있어요!');
        targetBoss.setAttribute('data-lock-icon', '👑');
      }
      if (lockBadgeBoss) lockBadgeBoss.classList.remove('hidden');
      if (checkBadgeBoss) checkBadgeBoss.classList.add('hidden');
      if (badgeBoss) {
        badgeBoss.innerHTML = '<span class="font-label-sm text-[10px] text-outline font-semibold">3과 완료 후 잠금 해제</span>';
      }
    }

    // 각 스테이지 노드 DOM에 category/level/tags 메타데이터 동기화
    ['node-1', 'node-2', 'node-3', 'node-boss'].forEach((nid) => {
      const nodeEl = document.querySelector(`.roadmap-node[data-node-id="${nid}"]`);
      if (nodeEl && lessons && lessons[nid]) {
        const item = lessons[nid];
        nodeEl.setAttribute('data-category', item.category || item.level || '');
        nodeEl.setAttribute('data-level', item.level || item.category || '');
        nodeEl.setAttribute('data-tags', Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || ''));
      }
    });

    // 현재 활성화된 서브 필터(예: '전체', 'DELE A1', 'DELE A2' 등) 적용
    if (typeof filterRoadmapByCategory === 'function') {
      filterRoadmapByCategory(window.currentCategoryFilter || '전체');
    }
  }
  window.updateRoadmapNodesUI = updateRoadmapNodesUI;

  function showLockedTooltip(targetBtn) {
    if (!lockedTooltip || !targetBtn) return;
    clearTimeout(lockedTooltipTimer); targetBtn.appendChild(lockedTooltip);
    lockedTooltip.classList.remove('hidden', 'opacity-0', 'scale-95'); lockedTooltip.classList.add('opacity-100', 'scale-100');
    lockedTooltipTimer = setTimeout(() => { lockedTooltip.classList.add('opacity-0', 'scale-95'); setTimeout(() => lockedTooltip.classList.add('hidden'), 200); }, 2400);
  }

  document.querySelectorAll('.roadmap-node').forEach((node) => {
    const nid = node.dataset.nodeId;
    node.addEventListener('click', (e) => {
      if (nid === 'node-3') {
        const btn3 = el('node-3-btn') || node;
        if ((window.nodeProgressMap['node-2'] || 0) < 3) {
          btn3.classList.add('animate-lock-shake'); setTimeout(() => btn3.classList.remove('animate-lock-shake'), 450); showLockedTooltip(btn3);
          return;
        }
      } else if (nid === 'node-boss') {
        const btnBoss = el('node-boss-btn') || node.querySelector('.node-btn') || node;
        if ((window.nodeProgressMap['node-3'] || 0) < 3) {
          btnBoss.classList.add('animate-lock-shake');
          setTimeout(() => btnBoss.classList.remove('animate-lock-shake'), 450);
          showLockedTooltip(btnBoss);
          return;
        }
      }
      window.openLessonModal(nid);
    });
  });

  on('node-1-btn', 'click', () => window.openLessonModal('node-1'));
  on('node-2-btn', 'click', () => window.openLessonModal('node-2'));
  const node3Btn = el('node-3-btn');
  if (node3Btn) {
    node3Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if ((window.nodeProgressMap['node-2'] || 0) < 3) {
        node3Btn.classList.add('animate-lock-shake'); setTimeout(() => node3Btn.classList.remove('animate-lock-shake'), 450); showLockedTooltip(node3Btn);
      } else { window.openLessonModal('node-3'); }
    });
  }
  const nodeBossBtn = el('node-boss-btn');
  if (nodeBossBtn) {
    nodeBossBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if ((window.nodeProgressMap['node-3'] || 0) < 3) {
        nodeBossBtn.classList.add('animate-lock-shake'); setTimeout(() => nodeBossBtn.classList.remove('animate-lock-shake'), 450); showLockedTooltip(nodeBossBtn);
      } else { window.openLessonModal('node-boss'); }
    });
  }

  on('lesson-modal-close-btn', 'click', window.closeLessonModal);
  if (lessonBackdrop) lessonBackdrop.addEventListener('click', (e) => { if (e.target === lessonBackdrop) window.closeLessonModal(); });

  on('lesson-start-btn', 'click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window.closeLessonModal === 'function') window.closeLessonModal();
    const targetNodeId = currentSelectedNodeId || 'node-2';
    const round = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;
    const session = window.VOCA_DATA ? window.VOCA_DATA.generateStageSession(targetNodeId, window.currentActiveCourse, round) : [];
    window.currentSessionQuestions = session;
    if (typeof window.openFlashcardScreen === 'function') {
      window.openFlashcardScreen(targetNodeId, session);
    } else if (typeof window.openGameScreen === 'function') {
      window.openGameScreen(targetNodeId, session);
    }
  });
  on('continueStreakBtn', 'click', () => { window.closeStreakModal(); window.openLessonModal('node-2'); });

  // 4. Header Category Chips & Subcategory Dropdown & Stage Filter (Removed per requirements)
  function filterRoadmapByCategory() {
    const svgPath = document.getElementById('roadmap-svg-path') || document.querySelector('#roadmap-screen svg');
    const nodes = document.querySelectorAll('.roadmap-node');
    nodes.forEach((node) => {
      node.classList.remove('hidden');
      node.style.display = '';
    });
    if (svgPath) {
      svgPath.classList.remove('hidden');
      svgPath.style.display = '';
      svgPath.style.opacity = '1';
    }
  }
  window.filterRoadmapByCategory = filterRoadmapByCategory;

  function renderCategoryChips() {}
  window.renderCategoryChips = renderCategoryChips;
  function bindCategoryPills() {}
  window.bindCategoryPills = bindCategoryPills;

  const courseSelectBtn = el('course-selector-btn'), courseDropdown = el('course-dropdown-menu'), chevronIcon = el('dropdown-chevron-icon');

  window.openCourseDropdown = () => {
    if (!courseDropdown) return;
    renderCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es', window.currentCourseId);
    courseDropdown.classList.remove('hidden', 'opacity-0', '-translate-y-2', 'pointer-events-none');
    courseDropdown.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    if (chevronIcon) chevronIcon.classList.add('rotate-180');
  };

  window.closeCourseDropdown = () => {
    if (!courseDropdown) return;
    courseDropdown.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    courseDropdown.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
    if (chevronIcon) chevronIcon.classList.remove('rotate-180');
    setTimeout(() => {
      if (courseDropdown.classList.contains('opacity-0')) courseDropdown.classList.add('hidden');
    }, 200);
  };

  if (courseSelectBtn) {
    courseSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (courseDropdown && !courseDropdown.classList.contains('hidden') && !courseDropdown.classList.contains('opacity-0')) {
        window.closeCourseDropdown();
      } else {
        window.openCourseDropdown();
      }
    });
  }

  // 2. 외부 영역 클릭 시 닫기(Click Outside) 충돌 방어
  document.addEventListener('click', (e) => {
    if (e.target.closest('#course-dropdown-menu') || e.target.closest('#course-selector-btn')) {
      return;
    }
    if (courseDropdown && !courseDropdown.classList.contains('hidden') && !courseDropdown.classList.contains('opacity-0')) {
      window.closeCourseDropdown();
    }
  });

  // 1. 코스 드롭다운 동적 렌더링 함수 구현 (renderCourseDropdown)
  function renderCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), selectedCourseId) {
    const menu = document.getElementById('course-dropdown-menu');
    if (!menu) return;

    const targetCourseId = selectedCourseId || window.currentCourseId || getSavedCourseId() || 'basic';
    const presets = COURSE_PRESETS[lang] || COURSE_PRESETS.es;
    const currentSelected = presets.find((p) => p.id === targetCourseId) || presets[0];
    window.currentCourseId = currentSelected.id;
    window.currentBookCourseId = currentSelected.id;
    window.currentCategoryFilter = '전체';
    try {
      localStorage.setItem('vocadash_current_course', currentSelected.id);
    } catch (_) {}

    menu.innerHTML = presets.map((course) => {
      const isSelected = course.id === currentSelected.id;
      const btnClass = isSelected
        ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 font-semibold'
        : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50';
      const titleClass = isSelected ? 'text-emerald-950' : 'text-slate-700';
      const descClass = isSelected ? 'text-emerald-800/80' : 'text-slate-500';
      return `
        <button type="button" data-course-id="${escapeHTML(course.id)}" class="course-dropdown-item flex items-center justify-between p-2.5 rounded-xl ${btnClass} cursor-pointer transition-all" role="menuitem">
          <div class="flex items-center gap-2.5 pointer-events-none">
            <span class="text-base p-1.5 rounded-lg bg-surface-container-lowest shadow-xs border border-slate-100">${escapeHTML(course.icon)}</span>
            <div class="flex flex-col text-left">
              <span class="font-bold text-xs ${titleClass} item-title">${escapeHTML(course.title)}</span>
              <span class="text-[10px] ${descClass}">${escapeHTML(course.desc)}</span>
            </div>
          </div>
          <span class="item-check ${isSelected ? '' : 'hidden'} material-symbols-outlined text-[18px] text-emerald-600 font-bold">check</span>
        </button>
      `;
    }).join('');

    // 상단 드롭다운 메인 버튼 정보 세팅
    const dropdownTitle = document.getElementById('dropdown-course-title');
    const dropdownIcon = document.getElementById('dropdown-course-icon');
    if (dropdownTitle) dropdownTitle.textContent = currentSelected.title;
    if (dropdownIcon) dropdownIcon.textContent = currentSelected.icon;

    // 카테고리 칩 목록 동기화
    if (courseCategoryMap && courseCategoryMap[currentSelected.id]) {
      renderCategoryChips(courseCategoryMap[currentSelected.id].categories);
    }
  }
  window.renderCourseDropdown = renderCourseDropdown;

  // 드롭다운 아이템 클릭 이벤트 위임 및 상단 UI 반영
  const courseMenu = document.getElementById('course-dropdown-menu');
  if (courseMenu) {
    courseMenu.onclick = function (e) {
      e.stopPropagation();
      const itemBtn = e.target.closest('.course-dropdown-item');
      if (!itemBtn) return;

      const courseId = itemBtn.dataset.courseId;
      const titleEl = itemBtn.querySelector('.item-title');
      const title = titleEl ? titleEl.textContent.trim() : itemBtn.innerText.trim();

      const currentLang = window.currentLanguage || window.currentActiveCourse || 'es';
      const presets = COURSE_PRESETS[currentLang] || COURSE_PRESETS.es;
      const matched = presets.find((c) => c.id === courseId);
      const icon = matched ? matched.icon : (courseCategoryMap[courseId] ? courseCategoryMap[courseId].icon : '🌱');

      window.currentCourseId = courseId;
      window.currentBookCourseId = courseId;
      window.currentCategoryFilter = '전체';
      try {
        localStorage.setItem('vocadash_current_course', courseId);
      } catch (_) {}

      const dropdownTitle = document.getElementById('dropdown-course-title');
      const dropdownIcon = document.getElementById('dropdown-course-icon');
      if (dropdownTitle) dropdownTitle.textContent = title;
      if (dropdownIcon) dropdownIcon.textContent = icon;

      document.querySelectorAll('#course-dropdown-menu .course-dropdown-item').forEach((btn) => {
        const isSelected = btn.dataset.courseId === courseId;
        const check = btn.querySelector('.item-check');
        const titleSpan = btn.querySelector('.item-title');

        btn.className = `course-dropdown-item flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
          isSelected
            ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 font-semibold'
            : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50'
        }`;
        if (check) check.classList.toggle('hidden', !isSelected);
        if (titleSpan) {
          titleSpan.classList.toggle('text-emerald-950', isSelected);
          titleSpan.classList.toggle('text-slate-700', !isSelected);
        }
      });

      if (courseCategoryMap && courseCategoryMap[courseId]) {
        renderCategoryChips(courseCategoryMap[courseId].categories);
      }

      if (typeof updateRoadmapNodesUI === 'function') {
        updateRoadmapNodesUI();
      }

      if (typeof window.renderBookCourseDropdown === 'function') {
        window.renderBookCourseDropdown(currentLang, courseId);
      }

      if (typeof closeCourseDropdown === 'function') {
        closeCourseDropdown();
      } else if (typeof window.closeCourseDropdown === 'function') {
        window.closeCourseDropdown();
      } else {
        courseMenu.classList.add('hidden', 'opacity-0', '-translate-y-2', 'pointer-events-none');
        courseMenu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      }
    };
  }

  // 5. Language Modal
  const langBackdrop = el('language-modal-backdrop'), langCard = el('language-modal-card'), cardEs = el('card-es'), cardEn = el('card-en'), badgeEs = el('badge-es'), badgeEn = el('badge-en');

  function updateModalCardsUI(lang) {
    modalSelectedCourse = lang;
    const isEs = lang === 'es';

    const setCardStyle = (card, badge, isSelected) => {
      if (!card) return;
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      card.className = `course-card relative p-3.5 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#22c55e] ${
        isSelected
          ? 'border-[#22c55e] bg-[#f0fdf4] ring-2 ring-[#22c55e]/20 scale-[1.02] shadow-xs'
          : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200'
      }`;

      if (badge) {
        badge.className = `absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'border-[#22c55e] bg-[#22c55e]' : 'border-slate-300 bg-transparent'
        }`;
        const dot = badge.querySelector('.badge-dot') || badge.firstElementChild;
        if (dot) {
          dot.className = `badge-dot w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-white' : 'bg-transparent'}`;
        }
      }

      const nameEl = card.querySelector('.card-lang-name');
      if (nameEl) {
        nameEl.className = `card-lang-name font-bold text-sm tracking-tight transition-colors ${
          isSelected ? 'text-[#15803d]' : 'text-slate-700'
        }`;
      }

      const subEl = card.querySelector('.card-lang-sub');
      if (subEl) {
        subEl.className = `card-lang-sub text-[11px] transition-colors ${
          isSelected ? 'text-[#22c55e] font-semibold' : 'text-slate-400 font-medium'
        }`;
      }
    };

    setCardStyle(cardEs, badgeEs, isEs);
    setCardStyle(cardEn, badgeEn, !isEs);
  }

  window.openLanguageModal = () => { 
    if (typeof window.closeCourseDropdown === 'function') {
      window.closeCourseDropdown();
    }
    updateModalCardsUI(window.currentActiveCourse || 'es'); 
    toggleModal(langBackdrop, langCard, true); 
  };
  window.closeLanguageModal = () => toggleModal(langBackdrop, langCard, false);
  on('logo-lang-trigger', 'click', window.openLanguageModal);
  on('close-modal-btn', 'click', window.closeLanguageModal);
  // ===================================================
  // 5-B. 마스코트 고양이 캐릭터 및 전역 언어 상태 동기화
  // ===================================================
  function updateMascotCharacters(targetLang) {
    const lang = (targetLang === 'en') ? 'en' : 'es';
    const charPrefix = lang === 'en' ? 'en' : 'es';
    const v = '?v=25';

    // 1. Flashcard mascot
    const flashcardMascot = document.getElementById('flashcard-mascot-img');
    if (flashcardMascot) {
      flashcardMascot.src = 'assets/characters/' + charPrefix + '-study.webp' + v;
    }

    // 2. Game result clear mascot
    const resultMascot = document.getElementById('result-mascot-img');
    if (resultMascot) {
      resultMascot.src = 'assets/characters/' + charPrefix + '-victory.webp' + v;
    }

    // 3. Game over card mascot
    const gameoverMascots = document.querySelectorAll('#game-result-gameover-card img, #result-gameover-card img');
    gameoverMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-sad.webp' + v;
    });

    // 4. Roadmap speed review banner mascot (runner)
    const reviewMascot = document.querySelector('#review-cat-banner-tile img');
    if (reviewMascot) {
      reviewMascot.src = 'assets/characters/' + charPrefix + '-run.webp' + v;
    }

    // 5. Book sticker mascot
    const bookMascots = document.querySelectorAll('#book-screen img[alt*="scholarly"], #book-screen img[src*="characters/"]');
    bookMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-study.webp' + v;
    });

    // 6. Language modal preview mascots
    const modalEs = document.getElementById('mascot-img-es');
    if (modalEs) modalEs.src = 'assets/characters/es-study.webp' + v;
    const modalEn = document.getElementById('mascot-img-en');
    if (modalEn) modalEn.src = 'assets/characters/en-study.webp' + v;

    // 7. Streak celebration modal mascot (fever)
    const streakMascots = document.querySelectorAll('#streak-modal img, #streak-modal-card img');
    streakMascots.forEach(img => {
      img.src = 'assets/characters/' + charPrefix + '-fever.webp' + v;
    });

    // 8. Study profile screen scholar mascot
    const profileMascot = document.querySelector('#study-profile-screen img[alt*="Scholar Mascot"]') || document.querySelector('img[alt="VocaDash Scholar Mascot"]');
    if (profileMascot) {
      profileMascot.src = 'assets/characters/' + charPrefix + '-study.webp' + v;
    }

    // 9. Splash screen mascot
    const splashMascot = document.getElementById('splash-mascot-img');
    if (splashMascot) {
      splashMascot.src = 'assets/characters/' + charPrefix + '-idle.webp' + v;
    }
  }
  window.updateMascotCharacters = updateMascotCharacters;

  function renderBookWords(targetLang, courseId) {
    const lang = (targetLang === 'en') ? 'en' : 'es';
    const container = document.getElementById('book-words-container');
    if (!container) return;

    const chapterTitleEl = document.getElementById('book-chapter-title');
    if (chapterTitleEl) {
      chapterTitleEl.textContent = lang === 'en'
        ? '1과: 인사/기초 표현 (필수 회화 & 어휘)'
        : '1과: 인사/안부 (여행 필수 패턴)';
    }

    const wordsData = lang === 'en' ? [
      { term: 'Hello', meaning: '안녕 / 안녕하세요', phonetic: '[헬로우]', star: true },
      { term: 'Water', meaning: '물', phonetic: '[워터]', star: false },
      { term: 'Please', meaning: '부탁합니다 / 제발', phonetic: '[플리즈]', star: false },
      { term: 'Thank you', meaning: '감사합니다 / 고마워', phonetic: '[땡큐]', star: true },
      { term: 'Passport', meaning: '여권', phonetic: '[패스포트]', star: false },
      { term: 'Visa', meaning: '비자 / 입국 허가', phonetic: '[비자]', star: false },
      { term: 'Purpose', meaning: '방문 목적', phonetic: '[퍼포스]', star: false },
      { term: 'Tourism', meaning: '관광 / 여행', phonetic: '[투어리즘]', star: false },
      { term: 'Luggage', meaning: '수하물 / 짐', phonetic: '[러기지]', star: false },
      { term: 'Ticket', meaning: '항공권 / 탑승권', phonetic: '[티켓]', star: false },
      { term: 'Aisle seat', meaning: '통로 좌석', phonetic: '[아일 시트]', star: false },
      { term: 'Restroom', meaning: '화장실', phonetic: '[레스트룸]', star: false }
    ] : [
      { term: '¡Hola!', meaning: '안녕 / 안녕하세요', phonetic: '[올라]', star: true },
      { term: 'Agua', meaning: '물', phonetic: '[아구아]', star: false },
      { term: 'Por favor', meaning: '부탁합니다 / 제발', phonetic: '[포르 파보르]', star: false },
      { term: 'Gracias', meaning: '감사합니다 / 고마워', phonetic: '[그라시아스]', star: true },
      { term: 'Pasaporte', meaning: '여권', phonetic: '[파사포르테]', star: false },
      { term: 'Visado', meaning: '비자 / 입국 허가', phonetic: '[비사도]', star: false },
      { term: 'Propósito', meaning: '방문 목적', phonetic: '[프로포시토]', star: false },
      { term: 'Turismo', meaning: '관광 / 여행', phonetic: '[투리스모]', star: false },
      { term: 'Equipaje', meaning: '수하물 / 짐', phonetic: '[에키파헤]', star: false },
      { term: 'Billete', meaning: '항공권 / 탑승권', phonetic: '[비예테]', star: false },
      { term: 'Asiento', meaning: '좌석 / 자리', phonetic: '[아시엔토]', star: false },
      { term: 'Baño', meaning: '화장실', phonetic: '[바뇨]', star: false }
    ];

    const cards = container.querySelectorAll('.book-word-card');
    cards.forEach(c => c.remove());

    const isPhoneticVisible = window.vocadashSettings ? !!window.vocadashSettings.showPhonetic : true;
    const phoneticStyle = isPhoneticVisible ? '' : 'style="display: none;"';

    wordsData.forEach(item => {
      const art = document.createElement('article');
      art.className = 'book-word-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between mb-3 transition-all hover:shadow-md';
      art.dataset.term = item.term;
      art.dataset.meaning = item.meaning;
      art.innerHTML = `
        <div class="flex flex-col min-w-0 pr-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-slate-800 tracking-tight">${escapeHTML(item.term)}</span>
            <button aria-label="발음 듣기" class="book-audio-btn text-slate-400 hover:text-emerald-500 p-0.5 transition-colors cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px] text-emerald-600" style="font-variation-settings: 'FILL' 1;">volume_up</span>
            </button>
          </div>
          <span class="text-xs text-slate-400 font-medium mt-0.5">
            <span class="book-phonetic phonetic-hint" ${phoneticStyle}>${escapeHTML(item.phonetic)}</span>
            <span class="book-phonetic-dot text-slate-300 font-bold mx-0.5" ${phoneticStyle}>·</span>
            <span class="text-slate-700 font-semibold text-[13px]">${escapeHTML(item.meaning)}</span>
          </span>
        </div>
        <button aria-label="즐겨찾기" class="book-star-btn w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center ${item.star ? 'text-amber-400' : 'text-slate-300'} active:scale-90 transition-all cursor-pointer" type="button">
          <span class="material-symbols-outlined text-[20px]" ${item.star ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>star</span>
        </button>
      `;
      container.appendChild(art);
    });

    initBookScreenEvents();
  }
  window.renderBookWords = renderBookWords;

  function setLanguage(targetLang) {
    const lang = (targetLang === 'en' || targetLang === 'en-US') ? 'en' : 'es';
    window.currentActiveCourse = lang;
    window.currentLanguage = lang;
    try {
      localStorage.setItem('vocadash_language', lang);
    } catch (_) {}

    // 1. Settings screen 학습 언어 UI 즉시 갱신
    const settingsFlag = document.getElementById('settings-current-lang-flag');
    if (settingsFlag) {
      settingsFlag.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
    }
    const settingsDesc = document.getElementById('settings-current-lang-desc');
    if (settingsDesc) {
      settingsDesc.textContent = (lang === 'en') ? '영어 (필수 회화 & 어휘)' : '스페인어 (여행 필수 패턴)';
    }

    // 2. 상단 헤더 국기 이모지 및 언어명 배지 텍스트 즉시 갱신
    const headerFlag = document.getElementById('header-flag-emoji');
    if (headerFlag) {
      headerFlag.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
    }
    const headerLangName = document.getElementById('header-lang-name');
    if (headerLangName) {
      headerLangName.textContent = (lang === 'en') ? '영어' : '스페인어';
    }

    // 3. 코스 및 단어장 드롭다운 목록 즉시 갱신
    const selectedCourse = window.currentCourseId || 'basic';
    renderCourseDropdown(lang, selectedCourse);
    if (typeof window.renderBookCourseDropdown === 'function') {
      window.renderBookCourseDropdown(lang, selectedCourse);
    }

    // 4. 로드맵 노드 및 스테이지 타이틀 갱신 (진행도 언어별 로드)
    if (typeof loadNodeProgress === 'function') {
      window.nodeProgressMap = loadNodeProgress(lang);
    }
    updateRoadmapNodesUI();

    // 5. 단어장 단어 갱신
    renderBookWords(lang, selectedCourse);

    // 6. 캐릭터 마스코트 prefix (es-* <-> en-*) 갱신
    updateMascotCharacters(lang);

    // 7. 언어 선택 모달 내 상태 갱신 및 창 닫기 (토스트/알림 배너 없이 즉각 반영)
    updateModalCardsUI(lang);
    window.closeLanguageModal();

    // 8. 오답 노트 데이터 언어별(es/en) 격리 로드 및 오답 탭 즉시 리렌더링
    if (typeof loadWrongWords === 'function') {
      window.wrongWords = loadWrongWords(lang);
    }
    if (typeof updateWrongWordsBadge === 'function') {
      updateWrongWordsBadge();
    }
    if (typeof renderReviewWords === 'function') {
      renderReviewWords(window.currentReviewFilter || 'waiting');
    }

    // 9. 내 기록(통계) 화면 언어별 UI 갱신
    if (typeof updateStatsScreenUI === 'function') {
      updateStatsScreenUI();
    }
  }
  window.setLanguage = setLanguage;
  window.changeCourse = setLanguage;
  window.changeLanguage = setLanguage;

  let isLanguageSwitching = false;
  function handleCardLanguageSelect(targetLang) {
    if (isLanguageSwitching) return;
    isLanguageSwitching = true;

    // 1) 탭한 카드에 초록색 선택 테두리/체크 활성화 (active:scale-95 인터랙션과 함께 즉시 반영)
    updateModalCardsUI(targetLang);

    // 2) 약 0.15초 뒤 모달이 부드럽게 닫히면서 선택한 언어로 화면과 데이터셋이 즉시 갱신 (토스트/팝업 없이 조용히 전환)
    setTimeout(() => {
      try {
        setLanguage(targetLang);
      } finally {
        isLanguageSwitching = false;
      }
    }, 150);
  }

  if (cardEs) {
    cardEs.addEventListener('click', () => handleCardLanguageSelect('es'));
    cardEs.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardLanguageSelect('es');
      }
    });
  }

  if (cardEn) {
    cardEn.addEventListener('click', () => handleCardLanguageSelect('en'));
    cardEn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardLanguageSelect('en');
      }
    });
  }

  // 6. Streak & Profile Modals & Bottom Tabs
  const streakModal = el('streak-modal');
  const streakBackdrop = el('streak-modal-backdrop') || streakModal;
  const streakCard = el('streak-modal-card');

  window.openStreakModal = () => {
    const sModal = el('streak-modal');
    if (sModal) sModal.classList.remove('hidden');
    if (streakBackdrop) {
      streakBackdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      streakBackdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (streakCard) {
      streakCard.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-full');
      streakCard.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
    toggleModal(streakBackdrop, streakCard, true, 'slide');
  };

  window.closeStreakModal = () => {
    toggleModal(streakBackdrop, streakCard, false, 'slide');
    setTimeout(() => {
      const sModal = el('streak-modal');
      if (sModal && streakBackdrop && streakBackdrop.classList.contains('opacity-0')) {
        sModal.classList.add('hidden');
      }
    }, 220);
  };

  function showStreakModal() {
    const sModal = document.getElementById('streak-modal');
    if (sModal) {
      sModal.classList.remove('hidden');
    }
    if (typeof window.openStreakModal === 'function') {
      window.openStreakModal();
    } else {
      toggleModal(streakBackdrop, streakCard, true, 'slide');
    }
  }
  window.showStreakModal = showStreakModal;

  const handleOpenStreakModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sModal = document.getElementById('streak-modal');
    if (sModal) {
      sModal.classList.remove('hidden');
    }
    showStreakModal();
  };

  on('streak-trigger', 'click', handleOpenStreakModal);
  on('close-streak-modal-btn', 'click', (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    window.closeStreakModal();
  });
  on('btn-open-streak-modal', 'click', handleOpenStreakModal);
  on('stats-streak-card', 'click', handleOpenStreakModal);

  if (streakBackdrop) {
    streakBackdrop.addEventListener('click', (e) => {
      if (e.target === streakBackdrop) {
        window.closeStreakModal();
      }
    });
  }

  // 스트릭 모달 마일스톤 버튼 (7일 / 14일 / 30일) 탭 전환
  document.querySelectorAll('.milestone-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.milestone-btn').forEach((b) => {
        b.className = 'milestone-btn flex-1 py-1.5 px-2 rounded-lg bg-white text-slate-600 font-semibold text-[12px] text-center truncate cursor-pointer hover:bg-slate-50 transition active:scale-95';
      });
      btn.className = 'milestone-btn flex-1 py-1.5 px-2 rounded-lg bg-[#FF9600] text-white font-bold text-[12px] text-center shadow-sm border-b-2 border-[#E07900] truncate cursor-pointer transition active:scale-95';
    });
  });

  const profileBackdrop = el('profile-modal-backdrop'), profileCard = el('profile-modal-card');
  window.openProfileModal = () => toggleModal(profileBackdrop, profileCard, true, 'slide');
  window.closeProfileModal = () => toggleModal(profileBackdrop, profileCard, false, 'slide');
  on('close-profile-modal-btn', 'click', window.closeProfileModal);

  // ===================================================
  // 6-B. 오답노트 (오답 탈출) 데이터 및 화면 로직 (언어별 독립 격리)
  // ===================================================
  const DEFAULT_WRONG_WORDS_ES = [
    { id: 'w_es_1', term: 'Adiós', meaning: '잘 가요', phonetic: '[아디오스]', wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_2', term: 'Equipaje', meaning: '수하물 / 짐', phonetic: '[에키파헤]', wrongCount: 2, escaped: false, lang: 'es' },
    { id: 'w_es_3', term: 'Boleto', meaning: '티켓 / 표', phonetic: '[볼레토]', wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_4', term: 'Pasaporte', meaning: '여권', phonetic: '[파사포르테]', wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_5', term: 'Maleta', meaning: '여행 가방 / 캐리어', phonetic: '[말레타]', wrongCount: 2, escaped: false, lang: 'es' },
    { id: 'w_es_6', term: 'Aduana', meaning: '세관', phonetic: '[아두아나]', wrongCount: 1, escaped: false, lang: 'es' },
    { id: 'w_es_7', term: 'Vuelo', meaning: '항공편 / 비행', phonetic: '[부에글로]', wrongCount: 1, escaped: false, lang: 'es' }
  ];
  const DEFAULT_WRONG_WORDS_EN = [];

  function getWrongStorageKey(lang) {
    const curLang = (lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    return `vocadash_wrong_answers_${curLang}`;
  }

  function migrateLegacyWrongWords() {
    try {
      const legacy = localStorage.getItem('vocadash_wrong_words');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const esKey = 'vocadash_wrong_answers_es';
          const enKey = 'vocadash_wrong_answers_en';
          if (!localStorage.getItem(esKey)) {
            const esItems = parsed.filter(item => (item.lang || 'es') === 'es').map(item => ({ ...item, lang: 'es' }));
            if (esItems.length > 0) {
              localStorage.setItem(esKey, JSON.stringify(esItems));
            }
          }
          if (!localStorage.getItem(enKey)) {
            const enItems = parsed.filter(item => item.lang === 'en').map(item => ({ ...item, lang: 'en' }));
            if (enItems.length > 0) {
              localStorage.setItem(enKey, JSON.stringify(enItems));
            }
          }
        }
      }
    } catch (_) {}
  }
  migrateLegacyWrongWords();

  function loadWrongWords(targetLang) {
    const lang = (targetLang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const key = getWrongStorageKey(lang);
    try {
      let saved = localStorage.getItem(key);
      if (!saved && lang === 'es') {
        saved = localStorage.getItem('vocadash_wrong_words');
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item, idx) => ({
              id: String(item.id || `w_${lang}_${idx + 1}`),
              term: String(item.term || item.word || ''),
              meaning: String(item.meaning || item.kor || ''),
              phonetic: String(item.phonetic || ''),
              wrongCount: Number(item.wrongCount) || 1,
              escaped: !!item.escaped,
              lang: item.lang || lang
            }))
            .filter((item) => item.lang === lang);
        }
      }
    } catch (e) {
      console.warn('오답 단어 로드 파싱 오류 방어, 기본값 복구:', e);
    }
    const defaults = lang === 'es' ? [...DEFAULT_WRONG_WORDS_ES] : [...DEFAULT_WRONG_WORDS_EN];
    try {
      localStorage.setItem(key, JSON.stringify(defaults));
    } catch (_) {}
    return defaults;
  }

  function saveWrongWords(words, targetLang) {
    const lang = (targetLang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const key = getWrongStorageKey(lang);
    try {
      const validated = (words || []).map((w) => ({
        ...w,
        lang: w.lang || lang
      }));
      localStorage.setItem(key, JSON.stringify(validated));
      if (lang === 'es') {
        localStorage.setItem('vocadash_wrong_words', JSON.stringify(validated));
      }
    } catch (e) {
      console.warn('오답 단어 저장 실패:', e);
    }
  }

  window.loadWrongWords = loadWrongWords;
  window.saveWrongWords = saveWrongWords;
  window.wrongWords = loadWrongWords(window.currentLanguage || 'es');
  window.userHearts = 5;

  function updateHeartsUI() {
    const headerHeart = document.getElementById('header-hearts-count');
    if (headerHeart) headerHeart.textContent = window.userHearts;
    const reviewHeart = document.getElementById('review-hearts-display');
    if (reviewHeart) reviewHeart.textContent = `${window.userHearts}/5`;
  }
  window.updateUserHeartsUI = updateHeartsUI;

  function updateWrongWordsBadge() {
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const list = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const waitingWords = list.filter((w) => !w.escaped);
    const count = waitingWords.length;

    updateHeartsUI();

    // 1) 하단 탭 빨간 뱃지 숫자 (#tab-review-badge)
    const tabBadge = document.getElementById('tab-review-badge');
    if (tabBadge) {
      tabBadge.textContent = count;
      if (count > 0) {
        tabBadge.classList.remove('hidden');
      } else {
        tabBadge.classList.add('hidden');
      }
    }

    // 2) 상단 배너 '탈출 대기 중인 단어 N개' (#review-waiting-count-text)
    const waitingCountText = document.getElementById('review-waiting-count-text');
    if (waitingCountText) {
      waitingCountText.textContent = `탈출 대기 중인 단어 ${count}개`;
    }

    // 3) 필터 세그먼트 뱃지 (#review-filter-waiting-count, #review-filter-escaped-count)
    const filterWaitingBadge = document.getElementById('review-filter-waiting-count');
    if (filterWaitingBadge) {
      filterWaitingBadge.textContent = count;
    }
    const escapedCount = list.filter((w) => w.escaped).length;
    const filterEscapedBadge = document.getElementById('review-filter-escaped-count');
    if (filterEscapedBadge) {
      filterEscapedBadge.textContent = escapedCount;
    }
  }
  window.updateWrongWordsBadge = updateWrongWordsBadge;

  window.addWrongWord = function (wordObj) {
    try {
      const term = wordObj.term || wordObj.word;
      if (!term) return;
      const lang = (wordObj.lang || window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const list = loadWrongWords(lang);
      const existing = list.find((w) => w.term.toLowerCase() === term.toLowerCase());
      if (existing) {
        existing.wrongCount = (existing.wrongCount || 1) + 1;
        existing.escaped = false;
        existing.lang = lang;
      } else {
        list.unshift({
          id: 'w_' + lang + '_' + Date.now() + Math.random().toString(36).substr(2, 4),
          term: term,
          meaning: wordObj.meaning || wordObj.kor || '뜻 없음',
          phonetic: wordObj.phonetic || `[${term}]`,
          wrongCount: 1,
          escaped: false,
          lang: lang
        });
      }
      saveWrongWords(list, lang);

      const currentActiveLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      if (currentActiveLang === lang) {
        window.wrongWords = list;
        updateWrongWordsBadge();
        renderReviewWords(currentReviewFilter);
      }
    } catch (err) {
      console.warn('⚠️ addWrongWord 예외 방어:', err);
    }
  };

  // ===================================================
  // 단어 정렬 전용 텍스트 정제 헬퍼 함수
  // ===================================================
  function getSortableWord(word) {
    if (!word || typeof word !== 'string') return '';
    // 문장/단어 맨 앞의 ¿, ¡, 따옴표(", '), 괄호((, [), 특수문자, 공백 완전 제거
    return word.replace(/^[¿¡"'\(\[\s\-]+/g, '').trim().toLowerCase();
  }
  window.getSortableWord = getSortableWord;

  const SORT_MODES = [
    { id: 'wrong_desc', label: '🚨 오답 많은순' },
    { id: 'recent', label: '⏱️ 최신 오답순' },
    { id: 'alpha', label: '🔤 알파벳순' }
  ];
  let currentSortMode = 'wrong_desc';
  let currentReviewFilter = 'waiting';
  window.currentReviewFilter = currentReviewFilter;

  function sortWords(list, mode) {
    const arr = [...list];
    if (mode === 'wrong_desc') {
      arr.sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1));
    } else if (mode === 'recent') {
      arr.sort((a, b) => {
        const idA = String(a.id || '');
        const idB = String(b.id || '');
        return idB.localeCompare(idA);
      });
    } else if (mode === 'alpha' || mode === 'alphabet') {
      const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      arr.sort((a, b) => {
        const strA = getSortableWord(a.word || a.term);
        const strB = getSortableWord(b.word || b.term);
        return strA.localeCompare(strB, curLang, { sensitivity: 'base' });
      });
    }
    return arr;
  }
  function sortReviewWords(list = window.wrongWords, mode = currentSortMode) {
    const curLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const langList = (Array.isArray(list) ? list : []).filter(item => (item.lang || curLang) === curLang);
    return sortWords(langList, mode);
  }
  window.sortWords = sortWords;
  window.sortReviewWords = sortReviewWords;

  function renderReviewWords(filter = currentReviewFilter) {
    currentReviewFilter = filter;
    window.currentReviewFilter = filter;
    if (typeof updateReviewFilterTabs === 'function') {
      updateReviewFilterTabs(filter);
    }
    const container = document.getElementById('review-word-list');
    if (!container) return;

    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentWrongList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );

    const baseWords = filter === 'escaped'
      ? currentWrongList.filter((w) => w.escaped)
      : currentWrongList.filter((w) => !w.escaped);

    const words = sortWords(baseWords, currentSortMode);

    if (words.length === 0) {
      container.innerHTML = `
        <div class="py-12 px-4 text-center bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 flex flex-col items-center">
          <span class="text-4xl mb-2">🎉</span>
          <p class="font-headline-sm font-bold text-on-surface">틀린 단어가 없습니다! 완벽해요 🎉</p>
          <p class="text-xs text-on-surface-variant mt-1">모든 단어를 완벽하게 마스터했어요.</p>
        </div>
      `;
      updateWrongWordsBadge();
      return;
    }

    container.innerHTML = words.map((w, idx) => {
      const word = w.term || w.word || '';
      const rawPhonetic = (w.phonetic || '').replace(/^\[+|\]+$/g, '').trim();
      const phoneticFormatted = rawPhonetic ? `[${rawPhonetic}]` : '';
      const isEscaped = !!w.escaped;
      const count = Number(w.wrongCount) || 1;
      const badgeClass = isEscaped
        ? 'shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-[11px]'
        : 'shrink-0 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-semibold text-[11px]';
      const badgeText = isEscaped ? '🎉 탈출 완료' : `🚨 오답 ${count}회`;

      return `
      <div data-word-id="${escapeHTML(w.id || idx)}" data-term="${escapeHTML(word)}" class="review-word-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99] select-none">
        <!-- 1행: 표제어 + 발음 듣기 버튼 / 우측 오답 횟수 뱃지 -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
              ${escapeHTML(word)}
            </span>
            <button type="button" aria-label="발음 듣기" class="speaker-btn btn-review-audio text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center p-0.5" data-word="${escapeHTML(word)}" data-term="${escapeHTML(word)}">
              <span class="material-symbols-outlined text-[18px]">volume_up</span>
            </button>
          </div>
          <span class="${badgeClass}">
            ${badgeText}
          </span>
        </div>

        <!-- 2행: 한글 발음 기호 (무조건 단어 아래 독립된 행으로 고정) -->
        <p class="phonetic-hint review-word-phonetic text-xs font-normal text-slate-400 mt-1 select-none ${(!window.vocadashSettings || window.vocadashSettings.showPhonetic !== false) ? '' : 'hidden'}" style="${(!window.vocadashSettings || window.vocadashSettings.showPhonetic !== false) ? '' : 'display: none;'}">
          ${escapeHTML(phoneticFormatted)}
        </p>

        <!-- 3행: 한국어 뜻 -->
        <p class="text-sm font-medium text-slate-700 mt-1 leading-snug">
          ${escapeHTML(w.meaning || '')}
        </p>
      </div>
    `;
    }).join('');

    // 단어 카드 전체 클릭 시 safePlayTTS 호출 & 스피커 아이콘 펄스 애니메이션
    container.querySelectorAll('.review-word-card').forEach((card) => {
      card.onclick = function (e) {
        const term = this.dataset.term;
        const audioBtn = this.querySelector('.speaker-btn') || this.querySelector('.btn-review-audio');
        if (audioBtn) {
          audioBtn.classList.add('scale-125', 'text-emerald-600');
          setTimeout(() => {
            audioBtn.classList.remove('scale-125', 'text-emerald-600');
          }, 300);
        }
        const activeCourse = window.currentLanguage || window.currentActiveCourse || 'es';
        if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, activeCourse, audioBtn);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, activeCourse, audioBtn);
        }
      };
    });

    updateWrongWordsBadge();
  }
  window.renderReviewWords = renderReviewWords;

  // 2. 하단 탭 네비게이션 & 오답노트 화면 전환
  // 2. 하단 탭 네비게이션 & 오답노트 / 내 기록 화면 전환
  function updateStatsScreenUI() {
    try {
      const statsAvatarImg = document.getElementById('stats-avatar-img');
      const hallUserAvatar = document.getElementById('hall-user-avatar');
      const hallHeaderAvatar = document.getElementById('hall-header-avatar');
      let avatarSrc = (typeof selectedAvatarSrc !== 'undefined' && selectedAvatarSrc) ? selectedAvatarSrc : null;
      if (!avatarSrc) {
        try {
          const userProfileStr = localStorage.getItem('userProfile');
          if (userProfileStr) {
            const parsed = JSON.parse(userProfileStr);
            if (parsed && parsed.avatar) avatarSrc = parsed.avatar;
          }
        } catch (_) {}
      }
      if (!avatarSrc) {
        try {
          avatarSrc = localStorage.getItem('vocadash_profile_avatar');
        } catch (_) {}
      }
      const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      if (!avatarSrc) {
        avatarSrc = currentLang === 'en' ? 'assets/profiles/profile-english.webp?v=25' : 'assets/profiles/profile-spanish.webp?v=25';
      }
      if (avatarSrc && !avatarSrc.includes('lh3.googleusercontent.com/aida/')) {
        if (statsAvatarImg) statsAvatarImg.src = avatarSrc;
        if (hallUserAvatar) hallUserAvatar.src = avatarSrc;
        if (hallHeaderAvatar) hallHeaderAvatar.src = avatarSrc;
      }

      const statsNickname = document.getElementById('stats-nickname');
      const nicknameInput = document.getElementById('nickname-input');
      if (statsNickname) {
        let nick = (nicknameInput && nicknameInput.value) ? nicknameInput.value.trim() : null;
        let hasCustomNick = false;
        if (!nick) {
          try {
            const userProfileStr = localStorage.getItem('userProfile');
            if (userProfileStr) {
              const parsed = JSON.parse(userProfileStr);
              if (parsed && parsed.nickname) { nick = parsed.nickname; hasCustomNick = true; }
            }
          } catch (_) {}
        }
        if (!nick) {
          try {
            const savedNick = localStorage.getItem('vocadash_profile_nickname');
            if (savedNick) { nick = savedNick; hasCustomNick = true; }
          } catch (_) {}
        }
        if (!hasCustomNick) {
          nick = currentLang === 'en' ? '영어 질주러' : '스페인어 질주러';
        }
        statsNickname.textContent = nick;
      }

      const statsTitleBadge = document.getElementById('stats-title-badge');
      if (statsTitleBadge) {
        try {
          const savedTitle = localStorage.getItem('vocadash_profile_title');
          if (savedTitle) statsTitleBadge.textContent = savedTitle;
        } catch (_) {}
      }

      const statsLevelBadge = document.getElementById('stats-level-badge');
      if (statsLevelBadge) {
        statsLevelBadge.textContent = currentLang === 'en' ? 'Lv.5 글로벌 러너 ✈️' : 'Lv.5 여행자 ✈️';
      }

      const statsWordsCount = document.getElementById('stats-words-count');
      if (statsWordsCount) {
        statsWordsCount.textContent = currentLang === 'en' ? '24개' : '38개';
      }
      const statsAccuracyRate = document.getElementById('stats-accuracy-rate');
      if (statsAccuracyRate && !statsAccuracyRate.textContent) {
        statsAccuracyRate.textContent = '94%';
      }
      const statsGemsCount = document.getElementById('stats-gems-count');
      if (statsGemsCount && !statsGemsCount.textContent) {
        statsGemsCount.textContent = '120개';
      }
    } catch (err) {
      console.warn('[VocaDash] updateStatsScreenUI error ignored:', err);
    }
  }
  window.updateStatsScreenUI = updateStatsScreenUI;
  window.updateStatsUI = updateStatsScreenUI;
  window.renderUserStats = updateStatsScreenUI;

  let isAppSwitchingTab = false;
  function switchMainTab(tabName) {
    if (typeof window.switchMainTab === 'function' && window.switchMainTab !== switchMainTab) {
      window.switchMainTab(tabName);
      return;
    }
    if (isAppSwitchingTab) return;
    isAppSwitchingTab = true;
    try {
      window.isActive = false;
      window.isGameActive = false;
      if (typeof window.clearAllGameTimers === 'function') window.clearAllGameTimers();
      if (typeof window.stopTTS === 'function') window.stopTTS();
      if (typeof window.closeGameScreen === 'function') window.closeGameScreen();
      if (typeof window.closeFlashcardScreen === 'function') window.closeFlashcardScreen();

      const roadmapScreen = document.getElementById('roadmap-screen');
      const roadmapHeader = document.getElementById('roadmap-header');
      const reviewScreen = document.getElementById('review-screen');
      const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
      const settingsScreen = document.getElementById('settings-screen');
      const bookScreen = document.getElementById('book-screen');
      const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
      const loginScreen = document.getElementById('login-screen');

      let normTab = String(tabName || 'home').toLowerCase().trim();
      if (normTab === 'stats' || normTab === 'my-records' || normTab === 'record') normTab = 'records';
      if (normTab === 'study' || normTab === 'wordbook') normTab = 'book';
      if (normTab === 'roadmap') normTab = 'home';

      const screenMap = {
        home: { screen: roadmapScreen, header: roadmapHeader, tab: document.getElementById('tab-home') },
        review: { screen: reviewScreen, header: null, tab: document.getElementById('tab-review') },
        book: { screen: bookScreen, header: null, tab: document.querySelector('#tab-book, #tab-study, .nav-book, .nav-study') },
        records: { screen: statsScreen, header: null, tab: document.querySelector('#tab-records, #tab-stats, .nav-stats, .nav-records') }
      };

      const allScreens = [roadmapScreen, reviewScreen, bookScreen, statsScreen, settingsScreen, hallOfFameScreen, loginScreen];
      allScreens.forEach((sc) => {
        if (sc) {
          sc.classList.add('hidden');
          sc.style.display = 'none';
        }
      });

      if (roadmapHeader) {
        if (normTab === 'home') {
          roadmapHeader.classList.remove('hidden');
          roadmapHeader.style.removeProperty('display');
          roadmapHeader.style.display = '';
        } else {
          roadmapHeader.classList.add('hidden');
          roadmapHeader.style.display = 'none';
        }
      }

      const targetConfig = screenMap[normTab] || screenMap.home;
      if (targetConfig && targetConfig.screen) {
        targetConfig.screen.classList.remove('hidden');
        targetConfig.screen.style.removeProperty('display');
        targetConfig.screen.style.display = '';
      }

      const activeTabEl = targetConfig ? targetConfig.tab : null;
      document.querySelectorAll('.nav-item').forEach((n) => {
        n.classList.remove('text-primary', 'font-bold', 'text-[#22c55e]');
        n.classList.add('text-on-surface-variant');
        n.removeAttribute('aria-current');
      });
      if (activeTabEl) {
        activeTabEl.classList.remove('text-on-surface-variant');
        activeTabEl.classList.add('text-primary', 'font-bold');
        activeTabEl.setAttribute('aria-current', 'page');
      }

      if (normTab === 'records') {
        try {
          updateStatsScreenUI();
        } catch (_) {}
      } else if (normTab === 'review') {
        try {
          if (typeof renderReviewWords === 'function') renderReviewWords('waiting');
        } catch (_) {}
      } else if (normTab === 'book') {
        try {
          if (typeof syncBookPhoneticSetting === 'function') syncBookPhoneticSetting();
          if (typeof initBookScreenEvents === 'function') initBookScreenEvents();
        } catch (_) {}
      } else if (normTab === 'home') {
        try {
          if (typeof updateRoadmapNodesUI === 'function') updateRoadmapNodesUI();
        } catch (_) {}
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
    } finally {
      isAppSwitchingTab = false;
    }
  }
  if (!window.switchMainTab) {
    window.switchMainTab = switchMainTab;
  }

  const tabHomeBtn = document.getElementById('tab-home');
  if (tabHomeBtn) {
    tabHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('home');
    });
  }

  const tabReviewBtn = document.getElementById('tab-review');
  if (tabReviewBtn) {
    tabReviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('review');
    });
  }

  // 3번째 아이콘 '교재/단어장' (#tab-book, #tab-study, .nav-book, .nav-study)
  const tabBookBtns = document.querySelectorAll('#tab-book, #tab-study, .nav-book, .nav-study');
  tabBookBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('book');
    });
  });

  // 4번째 아이콘 '내 기록' (#tab-records, #tab-stats, .nav-stats, .nav-records)
  const tabRecordsBtns = document.querySelectorAll('#tab-records, #tab-stats, .nav-stats, .nav-records');
  tabRecordsBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('records');
    });
  });

  // 오답탈출 헤더의 프로필 아이콘 클릭 시 '내 기록' 화면(#stats-screen)으로 자연스럽게 전환
  const profileBtns = document.querySelectorAll('#btn-profile');
  profileBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('records');
    });
  });

  // '내 기록' 내 '외운 단어' 카드 클릭 시 교재/단어장 '암기 완료' 필터 탭으로 이동 (STEP 1)
  const cardMasteredWords = document.getElementById('card-mastered-words');
  if (cardMasteredWords) {
    cardMasteredWords.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchMainTab('book');
      setTimeout(() => {
        const memorizedChip = document.querySelector('.book-filter-chip[data-filter="memorized"]');
        if (memorizedChip) {
          memorizedChip.click();
        } else if (typeof window.applyBookFilter === 'function') {
          window.applyBookFilter('memorized');
        }
        const wordsContainer = document.getElementById('book-words-container');
        if (wordsContainer) {
          wordsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic(25);
      }
    });
  }

  // ===================================================
  // 6-C. 설정(Settings) 화면 전환
  // ===================================================
  function showSettingsScreen() {
    if (typeof window.openSettingsScreen === 'function') {
      window.openSettingsScreen();
      return;
    }
    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const roadmapScreen = document.getElementById('roadmap-screen');
    const roadmapHeader = document.getElementById('roadmap-header');
    const reviewScreen = document.getElementById('review-screen');
    const bookScreen = document.getElementById('book-screen');
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    if (roadmapScreen) roadmapScreen.classList.add('hidden');
    if (roadmapHeader) roadmapHeader.classList.add('hidden');
    if (statsScreen) statsScreen.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (bookScreen) {
      bookScreen.classList.add('hidden');
      bookScreen.style.display = 'none';
    }
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }
    if (settingsScreen) {
      settingsScreen.classList.remove('hidden');
      settingsScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (typeof window.syncSettingsUI === 'function') {
      window.syncSettingsUI();
    }
  }
  window.showSettingsScreen = showSettingsScreen;

  function hideSettingsScreen() {
    if (typeof window.closeSettingsScreen === 'function') {
      window.closeSettingsScreen();
      return;
    }
    const settingsScreen = document.getElementById('settings-screen');
    if (settingsScreen) {
      settingsScreen.classList.add('hidden');
      settingsScreen.style.display = 'none';
    }
    if (typeof switchMainTab === 'function') {
      switchMainTab('home');
    }
  }
  window.hideSettingsScreen = hideSettingsScreen;

  // ===================================================
  // 6-C-2. 명예의 전당(Hall of Fame) 화면 전환 & 인터랙션 연동
  // ===================================================
  function showHallOfFameScreen() {
    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    const roadmapScreen = document.getElementById('roadmap-screen');
    const roadmapHeader = document.getElementById('roadmap-header');
    const reviewScreen = document.getElementById('review-screen');
    const bookScreen = document.getElementById('book-screen');
    const settingsScreen = document.getElementById('settings-screen');

    if (statsScreen) {
      statsScreen.classList.add('hidden');
      statsScreen.style.display = 'none';
    }
    if (roadmapScreen) roadmapScreen.classList.add('hidden');
    if (roadmapHeader) roadmapHeader.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (bookScreen) {
      bookScreen.classList.add('hidden');
      bookScreen.style.display = 'none';
    }
    if (settingsScreen) {
      settingsScreen.classList.add('hidden');
      settingsScreen.style.display = 'none';
    }

    if (hallOfFameScreen) {
      hallOfFameScreen.classList.remove('hidden');
      hallOfFameScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    syncHallOfFameAvatar();
    initHallOfFameEvents();
  }
  window.showHallOfFameScreen = showHallOfFameScreen;

  function hideHallOfFameScreen() {
    const hallOfFameScreen = document.getElementById('hall-of-fame-screen');
    if (hallOfFameScreen) {
      hallOfFameScreen.classList.add('hidden');
      hallOfFameScreen.style.display = 'none';
    }

    const statsScreen = document.getElementById('stats-screen') || document.getElementById('my-records-screen');
    if (statsScreen) {
      statsScreen.classList.remove('hidden');
      statsScreen.style.removeProperty('display');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (typeof switchMainTab === 'function') {
      switchMainTab('records');
    }
  }
  window.hideHallOfFameScreen = hideHallOfFameScreen;

  function initHallOfFameEvents() {
    const screen = document.getElementById('hall-of-fame-screen');
    if (!screen) return;

    // 1. 상단 좌측 뒤로가기 화살표(←) 클릭 시 #stats-screen 복귀
    const backBtn = screen.querySelector('#btn-hall-of-fame-back');
    if (backBtn && backBtn.dataset.bound !== 'true') {
      backBtn.dataset.bound = 'true';
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideHallOfFameScreen();
      });
    }

    // 2. 상단 공유 아이콘 클릭 핸들러
    const shareBtn = screen.querySelector('#btn-hall-of-fame-share');
    if (shareBtn && shareBtn.dataset.bound !== 'true') {
      shareBtn.dataset.bound = 'true';
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
          navigator.share({
            title: 'VocaDash 명예의 전당',
            text: 'VocaDash에서 달성한 멋진 배지들을 확인해보세요!',
            url: (typeof document !== 'undefined' && document.URL) || 'https://vocadash.app'
          }).catch(() => {});
        } else if (typeof window.showToast === 'function') {
          window.showToast('🏆 명예의 전당 배지 링크가 복사되었습니다!', '✨');
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    }

    // 3. 상단 우측 프로필 아이콘 클릭 시 프로필 편집 또는 내 기록으로 복귀
    const profileBtn = screen.querySelector('#btn-hall-of-fame-profile');
    if (profileBtn && profileBtn.dataset.bound !== 'true') {
      profileBtn.dataset.bound = 'true';
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.openProfileEditModal === 'function') {
          window.openProfileEditModal();
        } else if (typeof window.openProfileModal === 'function') {
          window.openProfileModal();
        } else {
          hideHallOfFameScreen();
        }
      });
    }

    // 4. 배지 분류 탭 필터 인터랙션 (전체 보기 8 / 달성 완료 2 / 도전 중 6)
    const filterBtns = screen.querySelectorAll('.badge-filter-btn');
    const cards = screen.querySelectorAll('.badge-card');

    filterBtns.forEach((btn) => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 활성 스타일(다크 네이비 배경 & 볼드 텍스트) 이동
        filterBtns.forEach((b) => {
          b.className = 'badge-filter-btn flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs hover:bg-slate-200 hover:text-slate-800 active:scale-95 transition-all cursor-pointer';
        });
        btn.className = 'badge-filter-btn flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm active:scale-95 transition-transform flex items-center gap-1 cursor-pointer';

        // 해당하는 배지 카드들만 보이도록 가벼운 필터링 처리
        const filter = btn.dataset.badgeFilter || 'all';
        cards.forEach((card) => {
          const status = card.dataset.badgeStatus;
          if (filter === 'all') {
            card.classList.remove('hidden');
          } else if (filter === 'completed') {
            if (status === 'completed') card.classList.remove('hidden');
            else card.classList.add('hidden');
          } else if (filter === 'in-progress') {
            if (status === 'in-progress') card.classList.remove('hidden');
            else card.classList.add('hidden');
          }
        });

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(15);
        }
      });
    });

    // 5. 배지 카드 클릭 마이크로 피드백
    cards.forEach((card) => {
      if (card.dataset.cardBound === 'true') return;
      card.dataset.cardBound = 'true';
      card.addEventListener('click', () => {
        const title = card.querySelector('h2')?.textContent?.trim() || '배지';
        const isCompleted = card.dataset.badgeStatus === 'completed';
        if (typeof window.showToast === 'function') {
          if (isCompleted) {
            window.showToast(`✨ '${title}' 배지를 획득하셨습니다!`, '🎖️');
          } else {
            window.showToast(`🎯 '${title}' 배지를 향해 도전 중입니다!`, '🔥');
          }
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    });
  }
  window.initHallOfFameEvents = initHallOfFameEvents;

  // ===================================================
  // 6-D. 교재·단어장 화면(#book-screen) 설정 동기화 & 인터랙션 연동
  // ===================================================
  function syncBookPhoneticSetting() {
    let showPhonetic = true;
    try {
      const raw = localStorage.getItem('vocadash_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.showPhonetic !== undefined) {
          showPhonetic = !!parsed.showPhonetic;
        }
      } else if (window.vocadashSettings && window.vocadashSettings.showPhonetic !== undefined) {
        showPhonetic = !!window.vocadashSettings.showPhonetic;
      }
    } catch (_) {}

    const bookScreen = document.getElementById('book-screen');
    if (bookScreen) {
      const phonetics = bookScreen.querySelectorAll('.book-phonetic, .phonetic-hint');
      phonetics.forEach((el) => {
        if (showPhonetic) {
          el.classList.remove('hidden');
          el.style.removeProperty('display');
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });
      const dots = bookScreen.querySelectorAll('.book-phonetic-dot');
      dots.forEach((dot) => {
        dot.style.display = showPhonetic ? '' : 'none';
      });
    }

    if (typeof window.syncBookScreenSettings === 'function') {
      window.syncBookScreenSettings();
    }
  }
  window.syncBookPhoneticSetting = syncBookPhoneticSetting;

  function applyBookFilter(filterType) {
    const bookScreen = document.getElementById('book-screen');
    if (!bookScreen) return;
    const cards = bookScreen.querySelectorAll('.book-word-card');
    cards.forEach((card) => {
      const term = (card.dataset.term || '').trim();
      const isStarred = !!card.querySelector('.book-star-btn.text-amber-400, .book-star-btn.text-amber-500, button[aria-label="즐겨찾기"].text-amber-400, button[aria-label="즐겨찾기"].text-amber-500');
      // 1과 단어 중 ¡Hola!, Por favor -> 암기 완료 / Agua, Gracias -> 미암기
      const isMemorized = term === '¡Hola!' || term === 'Por favor';

      if (filterType === 'all') {
        card.classList.remove('hidden');
      } else if (filterType === 'memorized') {
        if (isMemorized) card.classList.remove('hidden');
        else card.classList.add('hidden');
      } else if (filterType === 'unmemorized') {
        if (!isMemorized) card.classList.remove('hidden');
        else card.classList.add('hidden');
      } else if (filterType === 'starred') {
        if (isStarred) card.classList.remove('hidden');
        else card.classList.add('hidden');
      }
    });

    if (filterType === 'alpha' || filterType === 'alphabet') {
      sortBookWords();
    }
  }
  window.applyBookFilter = applyBookFilter;

  function sortBookWords(itemsOrContainer, mode = 'alphabet') {
    if (Array.isArray(itemsOrContainer)) {
      const arr = [...itemsOrContainer];
      if (mode === 'alpha' || mode === 'alphabet') {
        arr.sort((a, b) => {
          const strA = getSortableWord(typeof a === 'string' ? a : (a.word || a.term || ''));
          const strB = getSortableWord(typeof b === 'string' ? b : (b.word || b.term || ''));
          return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
        });
      }
      return arr;
    }

    // DOM 환경에서 호출 시 #book-words-container 내부 단어 카드들을 알파벳순으로 정렬
    const bookWordsContainer = document.getElementById('book-words-container');
    if (!bookWordsContainer) return [];

    const cards = Array.from(bookWordsContainer.querySelectorAll('.book-word-card'));
    if (cards.length === 0) return [];

    cards.sort((a, b) => {
      const termA = a.dataset.term || a.querySelector('span.text-xl')?.textContent?.trim() || '';
      const termB = b.dataset.term || b.querySelector('span.text-xl')?.textContent?.trim() || '';
      const strA = getSortableWord(termA);
      const strB = getSortableWord(termB);
      return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
    });

    // 1과 섹션 헤더 뒤에 정렬된 순서대로 재배치
    const header = bookWordsContainer.firstElementChild;
    if (header) {
      let anchor = header;
      cards.forEach((card) => {
        anchor.after(card);
        anchor = card;
      });
    } else {
      cards.forEach((card) => bookWordsContainer.appendChild(card));
    }

    return cards;
  }
  window.sortBookWords = sortBookWords;

  const BOOK_COURSE_PRESETS = {
    es: [
      { id: 'basic', icon: '🌱', title: '기초 회화' },
      { id: 'travel', icon: '✈️', title: '여행 스페인어' },
      { id: 'dele', icon: '🎓', title: 'DELE 준비과정' },
      { id: 'business', icon: '💼', title: '비즈니스 스페인어' }
    ],
    en: [
      { id: 'basic', icon: '🌱', title: '기초 회화' },
      { id: 'travel', icon: '✈️', title: '여행 영어' },
      { id: 'toeic', icon: '🎓', title: '토익/오픽 대비' },
      { id: 'business', icon: '💼', title: '비즈니스 영어' }
    ]
  };
  window.BOOK_COURSE_PRESETS = BOOK_COURSE_PRESETS;
  window.currentBookCourseId = window.currentCourseId || 'basic';

  function renderBookCourseDropdown(lang = (window.currentLanguage || window.currentActiveCourse || 'es'), selectedCourseId) {
    const menu = document.getElementById('book-course-dropdown-menu');
    if (!menu) return;

    const currentLang = lang === 'en' ? 'en' : 'es';
    const presets = BOOK_COURSE_PRESETS[currentLang] || BOOK_COURSE_PRESETS.es;
    const activeId = selectedCourseId || window.currentBookCourseId || window.currentCourseId || 'basic';
    const currentSelected = presets.find((p) => p.id === activeId) || presets[0];
    window.currentBookCourseId = currentSelected.id;

    // 상단 버튼 텍스트 및 아이콘 즉시 갱신
    const titleEl = document.getElementById('book-course-title');
    const iconEl = document.getElementById('book-course-icon');
    if (titleEl) titleEl.textContent = currentSelected.title;
    if (iconEl) iconEl.textContent = currentSelected.icon;

    menu.innerHTML = presets.map((course) => {
      const isSelected = course.id === currentSelected.id;
      return `
        <button type="button" data-course-id="${escapeHTML(course.id)}" class="book-course-item flex items-center justify-between p-2.5 rounded-xl ${isSelected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold' : 'border border-transparent text-slate-700 font-medium'} text-xs cursor-pointer transition-all hover:bg-slate-100" role="menuitem">
          <div class="flex items-center gap-2 pointer-events-none">
            <span class="text-sm">${escapeHTML(course.icon)}</span>
            <span class="book-course-item-title">${escapeHTML(course.title)}</span>
          </div>
          <span class="material-symbols-outlined text-[16px] text-emerald-600 font-bold book-course-check ${isSelected ? '' : 'hidden'}">check</span>
        </button>
      `;
    }).join('');
  }
  window.renderBookCourseDropdown = renderBookCourseDropdown;

  function closeBookCourseDropdown() {
    const menu = document.getElementById('book-course-dropdown-menu');
    const btn = document.getElementById('book-course-btn') || document.querySelector('.book-course-selector');
    const chevron = document.getElementById('book-course-chevron');
    if (menu) menu.classList.add('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
  window.closeBookCourseDropdown = closeBookCourseDropdown;

  function initBookScreenEvents() {
    const bookScreen = document.getElementById('book-screen');
    if (!bookScreen) return;

    // 1. 단어 옆 스피커 아이콘(🔊) 클릭 시 safePlayTTS() 연동
    const audioBtns = bookScreen.querySelectorAll('.book-audio-btn, button[aria-label="발음 듣기"], .sound-btn');
    audioBtns.forEach((btn) => {
      if (btn.dataset.audioBound === 'true') return;
      btn.dataset.audioBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.book-word-card') || btn.closest('article');
        const term = (card && (card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim())) || '¡Hola!';

        // Micro-interaction bounce
        btn.classList.add('scale-125', 'text-emerald-500');
        setTimeout(() => {
          btn.classList.remove('scale-125', 'text-emerald-500');
        }, 350);

        // TTS 발음 재생 (듀얼 고음질 엔진 호출 & 버튼 UI 상태 전달)
        if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, window.currentActiveCourse || 'es-ES', btn);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, window.currentActiveCourse || 'es-ES', btn);
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(30);
        }
      });
    });

    // 단어 카드 본문 터치 시에도 자연스러운 TTS 발음 재생 지원
    const wordCards = bookScreen.querySelectorAll('.book-word-card');
    wordCards.forEach((card) => {
      if (card.dataset.cardClickBound === 'true') return;
      card.dataset.cardClickBound = 'true';
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const term = card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim() || '¡Hola!';
        const speaker = card.querySelector('.book-audio-btn, button[aria-label="발음 듣기"]');
        if (typeof window.safePlayTTS === 'function') {
          window.safePlayTTS(term, window.currentActiveCourse || 'es-ES', speaker);
        } else if (typeof window.speakWord === 'function') {
          window.speakWord(term, window.currentActiveCourse || 'es-ES', speaker);
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    });

    // 2. 즐겨찾기 별(★) 토글
    const starBtns = bookScreen.querySelectorAll('.book-star-btn, button[aria-label="즐겨찾기"], .star-btn');
    starBtns.forEach((btn) => {
      if (btn.dataset.starBound === 'true') return;
      btn.dataset.starBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const icon = btn.querySelector('.material-symbols-outlined');
        const isStarred = btn.classList.contains('text-amber-400') || btn.classList.contains('text-amber-500');

        if (isStarred) {
          btn.classList.remove('text-amber-400', 'text-amber-500');
          btn.classList.add('text-slate-300');
          if (icon) icon.style.fontVariationSettings = "'FILL' 0";
          if (typeof window.showToast === 'function') {
            window.showToast('즐겨찾기에서 제거되었습니다', '☆');
          }
        } else {
          btn.classList.remove('text-slate-300');
          btn.classList.add('text-amber-400');
          if (icon) icon.style.fontVariationSettings = "'FILL' 1";
          if (typeof window.showToast === 'function') {
            window.showToast('즐겨찾기에 추가되었습니다 ⭐', '★');
          }
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(25);
        }
      });
    });

    // 3. 필터 칩 토글
    const filterChips = bookScreen.querySelectorAll('.book-filter-chip, .filter-chip');
    filterChips.forEach((chip) => {
      if (chip.dataset.filterBound === 'true') return;
      chip.dataset.filterBound = 'true';
      chip.addEventListener('click', () => {
        filterChips.forEach((c) => {
          c.className = 'book-filter-chip flex items-center gap-1 flex-shrink-0 px-3.5 py-1.5 rounded-full bg-white text-slate-600 font-medium border border-slate-100 text-xs shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer';
          const dot = c.querySelector('.animate-pulse');
          if (dot) dot.remove();
        });

        chip.className = 'book-filter-chip flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 text-xs shadow-sm active:scale-95 transition-all cursor-pointer';
        if (!chip.querySelector('.animate-pulse')) {
          const pulseDot = document.createElement('span');
          pulseDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
          chip.prepend(pulseDot);
        }

        const filterType = chip.dataset.filter || 'all';
        applyBookFilter(filterType);

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(15);
        }
      });
    });

    // 4. 검색창 실시간 필터링
    const searchInput = bookScreen.querySelector('#book-search-input, input[type="search"]');
    if (searchInput && searchInput.dataset.searchBound !== 'true') {
      searchInput.dataset.searchBound = 'true';
      searchInput.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim().toLowerCase();
        const cleanQuery = getSortableWord(query);
        const cards = bookScreen.querySelectorAll('.book-word-card');
        cards.forEach((card) => {
          const rawTerm = (card.dataset.term || card.querySelector('span.text-xl')?.textContent?.trim() || '');
          const term = rawTerm.toLowerCase();
          const cleanTerm = getSortableWord(rawTerm);
          const text = (card.textContent || '').toLowerCase();
          if (!query || term.includes(query) || text.includes(query) || (cleanQuery && cleanTerm.includes(cleanQuery))) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    }

    // 5. 2과 섹션 클릭 피드백
    const ch2Toggle = bookScreen.querySelector('#book-chapter-2-toggle');
    if (ch2Toggle && ch2Toggle.dataset.toggleBound !== 'true') {
      ch2Toggle.dataset.toggleBound = 'true';
      ch2Toggle.addEventListener('click', () => {
        if (typeof window.showToast === 'function') {
          window.showToast('📖 2과 입국 심사는 현재 학습 진행 중입니다!', '✈️');
        }
        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(20);
        }
      });
    }

    // 6. 상단 우측 코스 선택 버튼 드롭다운 토글 및 항목 선택
    const bookCourseBtn = bookScreen.querySelector('#book-course-btn, .book-course-selector');
    const bookCourseMenu = bookScreen.querySelector('#book-course-dropdown-menu');
    const bookCourseChevron = bookScreen.querySelector('#book-course-chevron');

    if (bookCourseBtn && bookCourseMenu && bookCourseBtn.dataset.bound !== 'true') {
      bookCourseBtn.dataset.bound = 'true';

      bookCourseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isHidden = bookCourseMenu.classList.contains('hidden');
        if (isHidden) {
          renderBookCourseDropdown(window.currentLanguage || window.currentActiveCourse || 'es');
          bookCourseMenu.classList.remove('hidden');
          bookCourseBtn.setAttribute('aria-expanded', 'true');
          if (bookCourseChevron) bookCourseChevron.style.transform = 'rotate(180deg)';
        } else {
          closeBookCourseDropdown();
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(15);
        }
      });

      bookCourseMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemBtn = e.target.closest('.book-course-item') || e.target.closest('button[data-course-id]');
        if (!itemBtn) return;

        const courseId = itemBtn.dataset.courseId;
        const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const presets = BOOK_COURSE_PRESETS[currentLang] || BOOK_COURSE_PRESETS.es;
        const selected = presets.find((p) => p.id === courseId);

        const title = selected ? selected.title : (itemBtn.querySelector('.book-course-item-title')?.textContent?.trim() || itemBtn.innerText.trim());
        const icon = selected ? selected.icon : (itemBtn.querySelector('.text-sm')?.textContent?.trim() || '✈️');

        // 상단 버튼 텍스트와 아이콘 즉시 갱신
        const titleEl = document.getElementById('book-course-title');
        const iconEl = document.getElementById('book-course-icon');
        if (titleEl) titleEl.textContent = title;
        if (iconEl) iconEl.textContent = icon;
        window.currentBookCourseId = courseId;
        window.currentCourseId = courseId;
        try {
          localStorage.setItem('vocadash_current_course', courseId);
        } catch (_) {}

        // 드롭다운 체크 아이콘 갱신 및 닫기
        renderBookCourseDropdown(currentLang, courseId);
        closeBookCourseDropdown();

        // 메인 로드맵 코스 UI 및 노드 동기화
        if (typeof renderCourseDropdown === 'function') {
          renderCourseDropdown(currentLang, courseId);
        }
        if (typeof updateRoadmapNodesUI === 'function') {
          updateRoadmapNodesUI();
        }

        // 선택된 코스 변경 알림 토스트 표시
        if (typeof window.showToast === 'function') {
          window.showToast(`${icon} '${title}' 교재로 변경되었습니다.`, '📚');
        }

        if (typeof window.triggerHaptic === 'function') {
          window.triggerHaptic(25);
        }
      });
    }
  }
  window.initBookScreenEvents = initBookScreenEvents;

  // 메뉴 바깥 영역 클릭 시 열려 있는 #book-course-dropdown-menu 자동 닫기 (Click Outside)
  document.addEventListener('click', (e) => {
    const bookMenu = document.getElementById('book-course-dropdown-menu');
    const bookBtn = document.getElementById('book-course-btn') || document.querySelector('.book-course-selector');
    if (!bookMenu || bookMenu.classList.contains('hidden')) return;

    if (!bookMenu.contains(e.target) && (!bookBtn || !bookBtn.contains(e.target))) {
      closeBookCourseDropdown();
    }
  });

  // 1) 설정 화면 진입: '내 기록' 우측 상단 (#btn-open-settings, #btn-stats-settings), 프로필 모달 내 (#btn-profile-settings), 오답탈출 (#btn-review-settings)
  const openSettingsBtns = document.querySelectorAll('#btn-main-settings, #btn-review-settings, #btn-open-settings, #btn-stats-settings, #btn-profile-settings, .btn-open-settings');
  openSettingsBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
      showSettingsScreen();
    });
  });

  // 2) 설정 화면 뒤로가기: 좌측 상단 뒤로가기 버튼(←) 클릭 시 #settings-screen 숨김 -> #stats-screen 복귀
  const btnSettingsBack = document.getElementById('btn-settings-back');
  if (btnSettingsBack) {
    btnSettingsBack.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideSettingsScreen();
    });
  }

  // 2-B) 명예의 전당 진입: '내 기록' 화면 내의 '명예의 전당 (배지 2/8)' 우측 [전체보기 >] 링크 (#btn-view-all-badges)
  const viewBadgesBtns = document.querySelectorAll('#btn-view-all-badges, .btn-view-all-badges');
  viewBadgesBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showHallOfFameScreen();
    });
  });

  // 3) 프로필 편집 진입:
  // - '내 기록' 상단의 프로필 카드 영역 (#user-profile-card 또는 프로필 아바타/닉네임 영역)
  // - 설정 화면 상단 프로필 카드의 [수정 >] 버튼 (#btn-edit-profile-header, #btn-settings-edit-profile-quick)
  const profileEditTriggers = document.querySelectorAll(
    '#user-profile-card, #btn-edit-profile-header, #btn-settings-edit-profile-quick'
  );
  profileEditTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.openProfileModal();
    });
  });

  // 4) 설정 화면 내부 스위치 토글 기능
  // (js/settings.js의 toggleSwitch 및 localStorage 연동 함수가 존재할 경우 우선 위임)
  if (!window.toggleSwitch || typeof window.applySetting !== 'function') {
    window.toggleSwitch = function (button) {
      if (!button) return;
      const key = button.dataset.settingKey;
      if (window.vocadashSettings && key) {
        window.vocadashSettings[key] = !window.vocadashSettings[key];
        try { localStorage.setItem('vocadash_settings', JSON.stringify(window.vocadashSettings)); } catch (_) {}
      }
      const isChecked = button.getAttribute('aria-checked') === 'true';
      const thumb = button.querySelector('span');

      if (isChecked) {
        button.setAttribute('aria-checked', 'false');
        button.classList.remove('bg-primary-container');
        button.classList.add('bg-surface-variant');
        if (thumb) {
          thumb.classList.remove('translate-x-[22px]');
          thumb.classList.add('translate-x-0');
        }
      } else {
        button.setAttribute('aria-checked', 'true');
        button.classList.add('bg-primary-container');
        button.classList.remove('bg-surface-variant');
        if (thumb) {
          thumb.classList.remove('translate-x-0');
          thumb.classList.add('translate-x-[22px]');
        }
      }
    };
  }

  document.querySelectorAll('.settings-toggle-btn, .toggle-btn').forEach((btn) => {
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleSwitch === 'function') {
        window.toggleSwitch(this);
      }
    };
  });

  // 5) 설정 화면 부가 기능 (캐시 정리, 학습 언어 변경, 로그아웃 등)
  window.clearCacheAlert = function (btn) {
    const target = btn || document.getElementById('btn-settings-clear-cache');
    const desc = document.getElementById('settings-cache-desc') || (target ? target.querySelector('.text-on-surface-variant') : null);
    if (desc) {
      desc.textContent = '캐시가 성공적으로 비워졌습니다 (0 MB)';
      desc.classList.remove('text-on-surface-variant');
      desc.classList.add('text-primary', 'font-bold');
    }
    if (window.showToast) {
      window.showToast('🧹 임시 음성 캐시가 정리되었습니다 (0 MB)', '✨');
    }
  };

  const clearCacheBtn = document.getElementById('btn-settings-clear-cache');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.clearCacheAlert(this);
    });
  }

  const settingsLangRow = document.getElementById('settings-lang-change-row');
  if (settingsLangRow) {
    settingsLangRow.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openLanguageModal === 'function') {
        window.openLanguageModal();
      }
    });
  }

  // 인증 액션(#btn-auth-action) 및 로그인 화면 인터랙션은 js/navigation.js에서 전담 관리


  const settingsContactBtn = document.getElementById('btn-settings-contact');
  if (settingsContactBtn) {
    settingsContactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showToast) {
        window.showToast('💬 고객센터: support@vocadash.app', '📩');
      }
    });
  }

  const settingsTermsBtn = document.getElementById('btn-settings-terms');
  if (settingsTermsBtn) {
    settingsTermsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showToast) {
        window.showToast('📄 이용약관 및 개인정보처리방침 (v1.0.0)', '📋');
      }
    });
  }

  // 프로필 편집 및 고양이 아바타 연동 로직
  const VALID_AVATAR_FILES = [
    'profile-spanish.webp',
    'profile-english.webp',
    'profile-artist.webp',
    'profile-explorer.webp'
  ];

  function resolveAvatarFile(val) {
    if (!val) return 'profile-spanish.webp';
    const clean = String(val).split('?')[0];
    const filename = clean.split('/').pop();
    if (VALID_AVATAR_FILES.includes(filename)) return filename;
    if (clean.includes('english') || clean.includes('sunglass')) return 'profile-english.webp';
    if (clean.includes('artist') || clean.includes('scholar')) return 'profile-artist.webp';
    if (clean.includes('explorer') || clean.includes('relax')) return 'profile-explorer.webp';
    return 'profile-spanish.webp';
  }

  function resolveAvatarSrc(val) {
    const file = resolveAvatarFile(val);
    return `assets/profiles/${file}?v=25`;
  }

  let selectedAvatarFile = 'profile-spanish.webp';
  try {
    const savedProfile = localStorage.getItem('vocadash_profile');
    if (savedProfile) {
      selectedAvatarFile = resolveAvatarFile(savedProfile);
    } else {
      const savedAvatar = localStorage.getItem('vocadash_profile_avatar');
      if (savedAvatar && !savedAvatar.includes('lh3.googleusercontent.com/aida/')) {
        selectedAvatarFile = resolveAvatarFile(savedAvatar);
      } else {
        const userProfileStr = localStorage.getItem('userProfile');
        if (userProfileStr) {
          const parsed = JSON.parse(userProfileStr);
          if (parsed && (parsed.profile || parsed.avatar)) {
            selectedAvatarFile = resolveAvatarFile(parsed.profile || parsed.avatar);
          }
        }
      }
    }
  } catch (_) {}

  let selectedAvatarSrc = resolveAvatarSrc(selectedAvatarFile);

  let selectedTitle = '초급 마스터';
  try {
    const userProfileStr = localStorage.getItem('userProfile');
    if (userProfileStr) {
      const parsed = JSON.parse(userProfileStr);
      if (parsed && parsed.title) selectedTitle = parsed.title;
      if (parsed && parsed.nickname) {
        const statsNickname = document.getElementById('stats-nickname');
        if (statsNickname) statsNickname.textContent = parsed.nickname;
        const nicknameInput = document.getElementById('nickname-input');
        if (nicknameInput) nicknameInput.value = parsed.nickname;
      }
    }
  } catch (_) {}
  try {
    const savedTitle = localStorage.getItem('vocadash_profile_title');
    if (savedTitle) selectedTitle = savedTitle;
    const savedNick = localStorage.getItem('vocadash_profile_nickname');
    if (savedNick) {
      const statsNickname = document.getElementById('stats-nickname');
      if (statsNickname) statsNickname.textContent = savedNick;
      const nicknameInput = document.getElementById('nickname-input');
      if (nicknameInput) nicknameInput.value = savedNick;
    }
    const statsTitleBadge = document.getElementById('stats-title-badge');
    if (statsTitleBadge) statsTitleBadge.textContent = selectedTitle;
  } catch (_) {}

  function applyProfileAvatar(srcOrFile) {
    if (!srcOrFile) return;
    const file = resolveAvatarFile(srcOrFile);
    const src = resolveAvatarSrc(file);
    selectedAvatarFile = file;
    selectedAvatarSrc = src;

    // 1. 헤더 아바타
    const headerMascotImg = document.getElementById('header-mascot-img');
    if (headerMascotImg) {
      headerMascotImg.src = src;
      headerMascotImg.className = 'w-full h-full object-cover rounded-full';
    }

    // 2. 모달 내 메인 프리뷰
    const currentAvatarImg = document.getElementById('current-avatar-img');
    if (currentAvatarImg) {
      currentAvatarImg.src = src;
      currentAvatarImg.className = 'w-full h-full object-cover rounded-full transition-transform duration-200';
    }

    // 3. 통계 화면 아바타
    const statsAvatarImg = document.getElementById('stats-avatar-img');
    if (statsAvatarImg) statsAvatarImg.src = src;

    // 4. 설정 화면 배너 아바타
    const settingsAvatarImg = document.getElementById('settings-streak-avatar-img') || document.getElementById('settings-avatar-img');
    if (settingsAvatarImg) settingsAvatarImg.src = src;

    const settingsStreakBanner = document.getElementById('settings-streak-banner');
    if (settingsStreakBanner) {
      const bannerImg = settingsStreakBanner.querySelector('img');
      if (bannerImg) bannerImg.src = src;
    }

    // 5. 명예의 전당 아바타 동기화
    const hallUserAvatar = document.getElementById('hall-user-avatar');
    if (hallUserAvatar) hallUserAvatar.src = src;
    const hallHeaderAvatar = document.getElementById('hall-header-avatar');
    if (hallHeaderAvatar) hallHeaderAvatar.src = src;

    // 6. 설정 화면 빠른 선택 그리드 UI 동기화
    document.querySelectorAll('.quick-avatar-btn').forEach((btn) => {
      const btnFile = btn.dataset.avatarFile;
      const isSelected = (btnFile === file);
      const ring = btn.querySelector('.quick-avatar-ring');
      const chk = btn.querySelector('.quick-avatar-check');
      const lbl = btn.querySelector('.quick-avatar-label');
      if (ring) {
        ring.className = isSelected
          ? 'quick-avatar-ring relative w-12 h-12 rounded-full p-0.5 border-2 border-primary bg-white shadow-xs transition-all ring-2 ring-primary/20'
          : 'quick-avatar-ring relative w-12 h-12 rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
      }
      if (chk) chk.classList.toggle('hidden', !isSelected);
      if (lbl) {
        lbl.className = isSelected
          ? 'quick-avatar-label text-[11px] font-bold text-primary mt-1.5 truncate max-w-[64px]'
          : 'quick-avatar-label text-[11px] font-medium text-slate-500 mt-1.5 truncate max-w-[64px]';
      }
    });

    // 7. 모달 내 아바타 선택 그리드 UI 동기화
    document.querySelectorAll('.avatar-option').forEach((opt) => {
      const optFile = resolveAvatarFile(opt.dataset.avatarFile || opt.dataset.avatarSrc);
      const isSelected = (optFile === file);
      const ring = opt.querySelector('.avatar-ring') || opt.querySelector('div');
      const chk = opt.querySelector('.avatar-check');
      const lbl = opt.querySelector('.avatar-label');
      if (ring) {
        ring.className = isSelected
          ? 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border-2 border-[#22c55e] bg-white transition-all shadow-xs ring-2 ring-emerald-400/20'
          : 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
      }
      if (chk) chk.classList.toggle('hidden', !isSelected);
      if (lbl) {
        lbl.className = isSelected
          ? 'avatar-label text-xs font-bold text-[#22c55e] mt-1.5 truncate max-w-[68px]'
          : 'avatar-label text-xs font-medium text-slate-500 mt-1.5 truncate max-w-[68px]';
      }
    });
  }

  function syncHallOfFameAvatar() {
    let avatarSrc = null;
    try {
      const savedProfile = localStorage.getItem('vocadash_profile');
      if (savedProfile) {
        avatarSrc = resolveAvatarSrc(savedProfile);
      }
    } catch (_) {}
    if (!avatarSrc) {
      try {
        const saved = localStorage.getItem('vocadash_profile_avatar');
        if (saved && !saved.includes('lh3.googleusercontent.com/aida/')) {
          avatarSrc = resolveAvatarSrc(saved);
        }
      } catch (_) {}
    }
    if (!avatarSrc && typeof selectedAvatarSrc !== 'undefined' && selectedAvatarSrc) {
      avatarSrc = selectedAvatarSrc;
    }
    if (avatarSrc) {
      const hallUserAvatar = document.getElementById('hall-user-avatar');
      if (hallUserAvatar) hallUserAvatar.src = avatarSrc;
      const hallHeaderAvatar = document.getElementById('hall-header-avatar');
      if (hallHeaderAvatar) hallHeaderAvatar.src = avatarSrc;
    }
  }
  window.syncHallOfFameAvatar = syncHallOfFameAvatar;
  window.applyProfileAvatar = applyProfileAvatar;

  // 초기 렌더링 시 아바타 및 UI 동기화
  applyProfileAvatar(selectedAvatarFile);

  // 상단 헤더 프로필 버튼 클릭 이벤트 (프로필 선택 모달 열기)
  const headerProfileBtn = document.getElementById('btn-header-profile');
  if (headerProfileBtn) {
    headerProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openProfileModal === 'function') {
        window.openProfileModal();
      }
    });
  }

  // 설정 화면 스트릭 배너 아바타 클릭 이벤트
  const settingsStreakAvatarContainer = document.getElementById('settings-streak-avatar-container');
  if (settingsStreakAvatarContainer) {
    settingsStreakAvatarContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openProfileModal === 'function') {
        window.openProfileModal();
      }
    });
  }

  // 설정 화면 내 4종 고양이 즉시 변경 버튼 이벤트 바인딩
  document.querySelectorAll('.quick-avatar-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetFile = this.dataset.avatarFile || 'profile-spanish.webp';
      const targetName = this.dataset.avatarName || '프로필 고양이';
      selectedAvatarFile = targetFile;
      selectedAvatarSrc = resolveAvatarSrc(targetFile);

      try {
        localStorage.setItem('vocadash_profile', selectedAvatarFile);
        localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
        const userProfileStr = localStorage.getItem('userProfile');
        const parsed = userProfileStr ? JSON.parse(userProfileStr) : {};
        parsed.profile = selectedAvatarFile;
        parsed.avatar = selectedAvatarSrc;
        localStorage.setItem('userProfile', JSON.stringify(parsed));
      } catch (_) {}

      applyProfileAvatar(selectedAvatarFile);
      syncHallOfFameAvatar();
    });
  });

  // 프로필 모달 내 아바타 선택 상태 및 클릭 이벤트 바인딩
  document.querySelectorAll('.avatar-option').forEach((opt) => {
    opt.addEventListener('click', function () {
      const targetFile = this.dataset.avatarFile || resolveAvatarFile(this.dataset.avatarSrc);
      selectedAvatarFile = targetFile;
      selectedAvatarSrc = resolveAvatarSrc(targetFile);

      document.querySelectorAll('.avatar-option').forEach((o) => {
        const oFile = o.dataset.avatarFile || resolveAvatarFile(o.dataset.avatarSrc);
        const isCur = (oFile === targetFile);
        const oRing = o.querySelector('.avatar-ring') || o.querySelector('div');
        const oChk = o.querySelector('.avatar-check');
        const oLbl = o.querySelector('.avatar-label');
        if (oRing) {
          oRing.className = isCur
            ? 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border-2 border-[#22c55e] bg-white transition-all shadow-xs ring-2 ring-emerald-400/20'
            : 'avatar-ring relative w-[52px] h-[52px] rounded-full p-0.5 border border-slate-200 bg-slate-50 transition-all';
        }
        if (oChk) oChk.classList.toggle('hidden', !isCur);
        if (oLbl) {
          oLbl.className = isCur
            ? 'avatar-label text-xs font-bold text-[#22c55e] mt-1.5 truncate max-w-[68px]'
            : 'avatar-label text-xs font-medium text-slate-500 mt-1.5 truncate max-w-[68px]';
        }
      });

      const currentAvatarImg = document.getElementById('current-avatar-img');
      if (currentAvatarImg) currentAvatarImg.src = selectedAvatarSrc;

      // 즉시 상단 헤더 및 통계 아바타 동기화 & 로컬스토리지 즉시 영구 저장
      if (typeof applyProfileAvatar === 'function') {
        applyProfileAvatar(targetFile);
      }
      try {
        localStorage.setItem('vocadash_profile', targetFile);
        localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
      } catch (_) {}
    });
  });

  document.querySelectorAll('.title-pill').forEach((pill) => {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.title-pill').forEach((p) => {
        p.className = 'title-pill bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-sm py-2.5 px-3 rounded-xl border-b-4 border-slate-200 flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-1 transition-all cursor-pointer w-full';
        const check = p.querySelector('.material-symbols-outlined');
        if (check) check.classList.add('hidden');
      });

      this.className = 'title-pill bg-[#22c55e] text-white font-bold text-sm py-2.5 px-3 rounded-xl border-b-4 border-[#16a34a] flex items-center justify-center gap-1.5 shadow-sm active:border-b-0 active:translate-y-1 transition-all cursor-pointer w-full';
      const check = this.querySelector('.material-symbols-outlined');
      if (check) check.classList.remove('hidden');

      selectedTitle = this.dataset.title || selectedTitle;
    });
  });

  const saveProfileBtn = document.getElementById('save-profile-btn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const nicknameInput = document.getElementById('nickname-input');
      const newNickname = nicknameInput ? nicknameInput.value.trim() : '스페인어 질주러';

      const statsNickname = document.getElementById('stats-nickname');
      if (statsNickname && newNickname) statsNickname.textContent = newNickname;

      const statsTitleBadge = document.getElementById('stats-title-badge');
      if (statsTitleBadge) statsTitleBadge.textContent = selectedTitle;

      applyProfileAvatar(selectedAvatarFile);

      const settingsStreakBanner = document.getElementById('settings-streak-banner');
      if (settingsStreakBanner) {
        const bannerNick = document.getElementById('settings-streak-nickname') || settingsStreakBanner.querySelector('.font-headline-sm');
        if (bannerNick && newNickname) bannerNick.textContent = newNickname;
        const bannerTitle = document.getElementById('settings-streak-level') || settingsStreakBanner.querySelector('.font-body-sm');
        if (bannerTitle && selectedTitle) bannerTitle.textContent = `레벨 12 · ${selectedTitle}`;
      }

      try {
        localStorage.setItem('vocadash_profile', selectedAvatarFile);
        localStorage.setItem('vocadash_profile_avatar', selectedAvatarSrc);
        localStorage.setItem('vocadash_profile_nickname', newNickname);
        localStorage.setItem('vocadash_profile_title', selectedTitle);
        localStorage.setItem('userProfile', JSON.stringify({
          profile: selectedAvatarFile,
          avatar: selectedAvatarSrc,
          nickname: newNickname,
          title: selectedTitle
        }));
      } catch (_) {}
      syncHallOfFameAvatar();

      window.closeProfileModal();
    });
  }

  // 필터 버튼 이벤트
  const filterWaitingBtn = document.getElementById('review-filter-waiting-btn') || document.getElementById('tab-review-pending');
  const filterEscapedBtn = document.getElementById('review-filter-escaped-btn') || document.getElementById('tab-review-escaped');

  function updateReviewFilterTabs(activeTab) {
    const isWaiting = (activeTab === 'waiting');
    if (filterWaitingBtn) {
      filterWaitingBtn.className = isWaiting
        ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xs font-bold text-slate-900 text-xs transition-all cursor-pointer'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-medium text-xs hover:text-slate-800 transition-colors cursor-pointer';

      const waitingLabel = filterWaitingBtn.querySelector('span:not([id]):not(.w-2)');
      if (waitingLabel) {
        waitingLabel.className = isWaiting ? 'font-bold' : 'font-medium';
      }

      const waitingDot = filterWaitingBtn.querySelector('.w-2');
      if (waitingDot) {
        waitingDot.className = isWaiting ? 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' : 'w-2 h-2 rounded-full bg-slate-300';
      }

      const waitingBadge = document.getElementById('review-filter-waiting-count');
      if (waitingBadge) {
        waitingBadge.className = isWaiting
          ? 'font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]'
          : 'font-medium px-1.5 py-0.5 rounded-full bg-slate-100/70 text-slate-500 text-[11px]';
      }
    }

    if (filterEscapedBtn) {
      filterEscapedBtn.className = !isWaiting
        ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xs font-bold text-slate-900 text-xs transition-all cursor-pointer'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-medium text-xs hover:text-slate-800 transition-colors cursor-pointer';

      const escapedLabel = filterEscapedBtn.querySelector('span:not([id]):not(.w-2)');
      if (escapedLabel) {
        escapedLabel.className = !isWaiting ? 'font-bold' : 'font-medium';
      }

      const escapedBadge = document.getElementById('review-filter-escaped-count');
      if (escapedBadge) {
        escapedBadge.className = !isWaiting
          ? 'font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]'
          : 'font-medium px-1.5 py-0.5 rounded-full bg-slate-100/70 text-slate-500 text-[11px]';
      }
    }
  }
  window.updateReviewFilterTabs = updateReviewFilterTabs;

  if (filterWaitingBtn) {
    filterWaitingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateReviewFilterTabs('waiting');
      renderReviewWords('waiting');
    });
  }

  if (filterEscapedBtn) {
    filterEscapedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateReviewFilterTabs('escaped');
      renderReviewWords('escaped');
    });
  }

  // 정렬 기준 토글 버튼 이벤트
  const btnSortFilter = document.getElementById('btn-sort-filter');
  if (btnSortFilter) {
    btnSortFilter.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let currentIdx = SORT_MODES.findIndex((m) => m.id === currentSortMode);
      currentIdx = (currentIdx + 1) % SORT_MODES.length;
      currentSortMode = SORT_MODES[currentIdx].id;

      const filterTextEl = document.getElementById('sort-filter-text');
      if (filterTextEl) {
        filterTextEl.textContent = SORT_MODES[currentIdx].label;
      }

      renderReviewWords(currentReviewFilter);
      window.showToast(`${SORT_MODES[currentIdx].label}으로 정렬되었습니다.`, '🔄');
    });
  }

  // 1분 스피드 복습 시작 로직
  function startGameWithWords(words, options = {}) {
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const fallbackList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const list = (words && words.length > 0)
      ? words.filter((item) => (item.lang || currentLang) === currentLang)
      : fallbackList;
    if (!list || list.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('복습할 오답 단어가 없습니다! 🎉', '💡');
      }
      return;
    }

    window.isReviewGameMode = true;

    // 13문제 세트로 순환 패딩
    const session = [];
    let idx = 0;
    while (session.length < 13) {
      const item = list[idx % list.length];
      session.push({
        id: item.id || `review-q-${idx}`,
        word: item.term || item.word || '',
        term: item.term || item.word || '',
        meaning: item.meaning || '',
        phonetic: item.phonetic || '',
        type: 'word',
        isSentence: false,
        tag: '오답 복습',
        isReviewMode: true,
        lang: currentLang
      });
      idx++;
    }

    window.currentSessionQuestions = session;

    if (window.openGameScreen) {
      window.openGameScreen('node-review', session);
    } else if (window.startGameSession) {
      window.startGameSession('node-review', session);
    }

    const titleEl = document.getElementById('game-stage-title');
    if (titleEl) {
      titleEl.textContent = '⚡ 1분 스피드 오답 복습';
    }
  }
  window.startGameWithWords = startGameWithWords;

  const handleStartReview = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const currentLang = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
    const currentWrongList = (Array.isArray(window.wrongWords) ? window.wrongWords : []).filter(
      (item) => (item.lang || currentLang) === currentLang
    );
    const waitingWords = currentWrongList.filter((w) => !w.escaped);
    const targetList = waitingWords.length > 0 ? waitingWords : currentWrongList;
    startGameWithWords(targetList, { isReviewMode: true });
  };

  const btnReviewSpeed = document.getElementById('btn-start-review-speed');
  if (btnReviewSpeed) {
    btnReviewSpeed.addEventListener('click', handleStartReview);
  }

  // 배너 우측 반창고 고양이 타일 & 하트 뱃지 클릭 시에도 1분 스피드 복습 시작
  const catBannerTile = document.getElementById('review-cat-banner-tile');
  if (catBannerTile) {
    catBannerTile.addEventListener('click', handleStartReview);
    catBannerTile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleStartReview(e);
      }
    });
  }

  const catHeartBadge = document.getElementById('review-cat-heart-badge');
  if (catHeartBadge) {
    catHeartBadge.addEventListener('click', handleStartReview);
  }

  // 7. Result Modal & Stage Progression
  window.showGameResultModal = function (status) {
    const type = (status === true || status === 'clear') ? 'clear' : 'gameover';
    console.log('📢 결과 팝업 호출됨! 상태:', type);
    const isClear = (type === 'clear');
    const modal = document.getElementById('game-result-modal'), clear = document.getElementById('game-result-clear-card'), over = document.getElementById('game-result-gameover-card');
    if (!modal) return;

    const gScreen = document.getElementById('game-screen'), gContainer = document.getElementById('game-container');
    if (gScreen) { gScreen.classList.remove('opacity-0', 'pointer-events-none'); gScreen.classList.add('opacity-100', 'pointer-events-auto'); }
    if (gContainer) { gContainer.classList.remove('translate-y-full'); gContainer.classList.add('translate-y-0'); }

    modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    modal.style.display = 'flex'; modal.style.pointerEvents = 'auto'; modal.style.zIndex = '9999';

    const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [], maxCombo: 0, totalQ: 13, currentHearts: 5 };
    const totalQ = stats.totalQ || 13, missedList = stats.missedWords || [];
    const accuracy = Math.max(0, Math.min(100, Math.round(((totalQ - missedList.length) / totalQ) * 100)));

    if (missedList.length > 0 && typeof window.addWrongWord === 'function') {
      missedList.forEach(w => window.addWrongWord(w));
    }

    if (isClear) {
      if (clear) { clear.classList.remove('hidden'); clear.style.display = 'flex'; }
      if (over) { over.classList.add('hidden'); over.style.display = 'none'; }
      const confetti = el('result-confetti-container'); if (confetti) confetti.style.display = 'block';
      const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
      const mascotImg = el('result-mascot-img'); if (mascotImg) mascotImg.src = 'assets/characters/' + charPrefix + '-victory.webp?v=25';
      const earnedStars = stats.currentHearts >= 4 ? 3 : stats.currentHearts >= 2 ? 2 : 1;
      [el('result-star-1'), el('result-star-2'), el('result-star-3')].forEach((s, idx) => {
        if (s) { s.style.opacity = idx < earnedStars ? '1' : '0.3'; s.classList.toggle('grayscale', idx >= earnedStars); }
      });
      setText('result-accuracy-text', `${accuracy}%`); setText('result-combo-text', `x${stats.maxCombo || 0}`);
      const missedSec = el('result-missed-section');
      if (missedSec) {
        missedSec.classList.toggle('hidden', missedList.length === 0);
        if (missedList.length > 0) {
          setText('result-missed-word', missedList[0].word || missedList[0].term || '');
          setText('result-missed-phonetic', missedList[0].phonetic || '');
          setText('result-missed-meaning', missedList[0].meaning || '');
        }
      }
      if (window.playSuccessChime) window.playSuccessChime();
      const targetNodeId = window.currentGameLessonId || currentSelectedNodeId || 'node-2';
      const curProg = (window.nodeProgressMap && window.nodeProgressMap[targetNodeId]) || 0;
      if (window.isReviewGameMode) {
        setText('btn-result-primary-text', '오답노트로 복귀');
        window.userHearts = Math.min(5, (window.userHearts || 4) + 1);
        const headerHeart = document.getElementById('header-hearts-count');
        if (headerHeart) headerHeart.textContent = window.userHearts;
        const reviewHeart = document.getElementById('review-hearts-display');
        if (reviewHeart) reviewHeart.textContent = `${window.userHearts}/5`;
        if (window.showToast) window.showToast(`💖 1분 스피드 복습 완료! 하트 1개 충전 (+1 ❤️)`, '🎉');
      } else if (targetNodeId === 'node-3' || String(targetNodeId).includes('3')) {
        setText('btn-result-primary-text', '3과 마스터 & 4과(보스전) 도전!');
      } else if (targetNodeId === 'node-boss' || String(targetNodeId).includes('boss')) {
        setText('btn-result-primary-text', '보스전 클리어 & 로드맵으로');
      } else if (curProg >= 3) {
        setText('btn-result-primary-text', '2과 마스터 완료 & 3과 열기');
      } else {
        setText('btn-result-primary-text', `다음 스테이지 (${Math.min(3, curProg + 1)}/3)`);
      }
    } else {
      try {
        if (clear) { clear.classList.add('hidden'); clear.style.display = 'none'; }
        if (over) { over.classList.remove('hidden'); over.style.display = 'flex'; }
        const charPrefix = (window.currentLanguage || window.currentActiveCourse || 'es') === 'en' ? 'en' : 'es';
        const goMascots = document.querySelectorAll('#game-result-gameover-card img, #result-gameover-card img');
        goMascots.forEach(img => {
          img.src = 'assets/characters/' + charPrefix + '-sad.webp?v=25';
        });
        const lastFailed = missedList.length > 0 ? missedList[missedList.length - 1] : null;
        if (lastFailed) {
          setText('gameover-missed-word', lastFailed.word || lastFailed.term || '¡Buenos días!');
          setText('gameover-missed-phonetic', lastFailed.phonetic ? `[${lastFailed.phonetic.replace(/[\[\]]/g, '')}]` : '');
          setText('gameover-missed-meaning', lastFailed.meaning || '');
        }
        const solvedQ = Math.max(0, (stats.currentQuestionIdx || 0)), progPct = Math.round((solvedQ / totalQ) * 100);
        setText('gameover-progress-text', `${solvedQ} / ${totalQ} 단어 (${progPct}%)`);
        const goProgBar = el('gameover-progress-bar'); if (goProgBar) goProgBar.style.width = `${progPct}%`;
      } catch (err) {
        console.warn('⚠️ showGameResultModal gameover 렌더링 예외 방어:', err);
      }
    }
  };

  let resultModalOpenedTime = 0;
  const originalShowModal = window.showGameResultModal;
  window.showGameResultModal = function (status) {
    resultModalOpenedTime = Date.now();
    originalShowModal(status);
  };

  window.closeGameResultModal = function () {
    const modal = document.getElementById('game-result-modal'); if (!modal) return;
    modal.classList.add('opacity-0', 'pointer-events-none'); modal.style.pointerEvents = 'none';
    setTimeout(() => { modal.classList.add('hidden'); modal.style.display = 'none'; }, 200);
  };

  function finishGameStage(isClear = true) {
    console.log('🏁 app.js finishGameStage() 안전 호출: 결과 모달 노출');
    if (typeof window.clearAllGameTimers === 'function') window.clearAllGameTimers();
    if (typeof window.renderResultModal === 'function') {
      window.renderResultModal(isClear);
    } else {
      window.showGameResultModal(isClear ? 'clear' : 'gameover');
    }
  }
  if (!window.finishGameStage) {
    window.finishGameStage = finishGameStage;
  }

  // ===================================================
  // [게임 화면 제어 단일화: gameEngine.js 전담 위임 및 중복 정의 제거]
  // ===================================================
  function showRoadmap() {
    if (typeof window.exitGameToRoadmap === 'function') {
      window.exitGameToRoadmap();
    } else {
      if (typeof window.closeGameScreen === 'function') window.closeGameScreen();
      switchMainTab('home');
      updateRoadmapNodesUI();
    }
  }
  window.showRoadmap = showRoadmap;

  // ===================================================
  // [결과 모달 버튼 처리: gameEngine.js 단일 전담 위임]
  // ===================================================
  function proceedNextStage(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (typeof window.handleResultPrimary === 'function') {
      window.handleResultPrimary(e);
    }
  }
  window.proceedNextStage = proceedNextStage;

  const missedCard = el('result-gameover-card') || el('gameover-missed-card');
  if (missedCard) missedCard.addEventListener('click', (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [] };
    const lastFailed = stats.missedWords && stats.missedWords.length > 0 ? stats.missedWords[stats.missedWords.length - 1] : null;
    const btn = missedCard.querySelector('button');
    if (lastFailed && window.speakWord) window.speakWord(lastFailed.word || lastFailed.term, window.currentActiveCourse, btn);
  });

  const clearMissedCard = el('result-missed-card');
  if (clearMissedCard) clearMissedCard.addEventListener('click', (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const stats = window.getGameEngineState ? window.getGameEngineState() : { missedWords: [] };
    const btn = clearMissedCard.querySelector('button');
    if (stats.missedWords && stats.missedWords.length > 0 && window.speakWord) {
      window.speakWord(stats.missedWords[0].word || stats.missedWords[0].term, window.currentActiveCourse, btn);
    }
  });

  // 전역 링크 / 폼 전송 브라우저 내비게이션 원천 차단 (순수 SPA 보장)
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    const form = e.target && e.target.closest ? e.target.closest('form') : null;
    if (form) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  const initialCourse = window.currentCourseId || getSavedCourseId() || 'basic';
  const initialLang = getSavedLanguage();
  setLanguage(initialLang);
  updateWrongWordsBadge();
  renderReviewWords('waiting');
  syncBookPhoneticSetting();
  initHallOfFameEvents();
});
