// ==============================================================================
// VocaDash Spanish 5000 Master Data Loader & Indexer (js/dataLoader.js)
// spanish_5000_master.csv 파싱, CEFR 레벨 및 Unit별 인덱싱 & 전역 캐싱
// ==============================================================================

(function (global) {
  'use strict';

  const root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);

  // 전역 VOCA_DATA 보장 및 초기화 (기존 객체 속성 보존)
  root.VOCA_DATA = root.VOCA_DATA || {};
  const VOCA_DATA = root.VOCA_DATA;

  VOCA_DATA.byUnit = VOCA_DATA.byUnit || {};
  VOCA_DATA.byLevel = VOCA_DATA.byLevel || {};
  VOCA_DATA.allWords = VOCA_DATA.allWords || [];
  VOCA_DATA.isLoaded = false;
  VOCA_DATA.loadPromise = null;

  // 발음 단일 대괄호 정규화 유틸 (중복 대괄호 방지 및 안전한 [발음] 형태 보장)
  function formatPhonetic(raw) {
    if (!raw) return '';
    const cleaned = String(raw).trim().replace(/^\[+|\]+$/g, '').trim();
    return cleaned ? `[${cleaned}]` : '';
  }

  // 1. RFC 4180 호환 안전 CSV 파서 (BOM, 특수문자, 따옴표, 쉼표, 줄바꿈 방어)
  function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    // UTF-8 BOM(\uFEFF) 제거
    const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim().replace(/^[\uFEFF\s]+|[\s]+$/g, ''));
    const result = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;
      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        const headerName = headers[c];
        obj[headerName] = row[c] !== undefined ? row[c].trim() : '';
      }
      result.push(obj);
    }

    return result;
  }

  // 2. CSV 파싱 결과 인덱싱 및 캐싱
  function indexCsvData(csvText) {
    const rawList = parseCSV(csvText);
    if (!Array.isArray(rawList) || rawList.length === 0) return VOCA_DATA;

    const allWords = [];
    const byUnit = {};
    const byLevel = {};

    rawList.forEach((raw, idx) => {
      const rank = parseInt(raw.Rank, 10) || (idx + 1);
      const rawUnitId = raw.Unit_ID || '';
      const uNum = parseInt(rawUnitId.replace(/[^\d]/g, ''), 10) || 1;
      const unitKey = 'unit-' + uNum;
      const level = raw.Level ? raw.Level.toUpperCase() : 'A1';

      let meaning = raw.Meaning || '';
      let example_es = raw.example_es || raw.Example_ES || raw.exampleTarget || '';
      let example_ko = raw.example_ko || raw.Example_KO || raw.exampleMeaning || '';

      if (raw.Word === 'trabajo') {
        meaning = "일 (업무/직업)";
        example_es = "Tengo mucho trabajo.";
        example_ko = "일이 많아요.";
      } else if (raw.Word === 'día') {
        meaning = "날, 하루";
        example_es = "Buenos días.";
        example_ko = "좋은 하루 되세요.";
      }

      const wordObj = {
        rank,
        word: raw.Word || '',
        term: raw.Word || '',
        level,
        unitId: rawUnitId,
        unitNumber: uNum,
        nodeId: raw.Node_ID || '',
        meaning,
        example_es,
        example_ko,
        exampleTarget: example_es,
        exampleMeaning: example_ko,
        id: `w_es_${rank}`,
        lang: 'es'
      };

      allWords.push(wordObj);

      // byUnit 인덱싱
      if (!byUnit[unitKey]) {
        byUnit[unitKey] = [];
      }
      byUnit[unitKey].push(wordObj);

      // rawUnitId(예: unit_001) 비열거형 별칭 바인딩
      if (rawUnitId && !byUnit[rawUnitId]) {
        Object.defineProperty(byUnit, rawUnitId, {
          value: byUnit[unitKey],
          enumerable: false,
          writable: true,
          configurable: true
        });
      }

      // byLevel 인덱싱
      if (!byLevel[level]) {
        byLevel[level] = [];
      }
      byLevel[level].push(wordObj);
    });

    // VOCA_DATA 전역 구조체 동기화
    VOCA_DATA.allWords = allWords;
    VOCA_DATA.byUnit = byUnit;
    VOCA_DATA.byLevel = byLevel;
    VOCA_DATA.isLoaded = true;

    // 실제 커리큘럼 단어(Unit 1~4 등 한국어 뜻 및 발음 데이터 완비) 우선 동기화
    syncCurriculumUnits();

    return VOCA_DATA;
  }

  // 3. 실제 코스 데이터(data_es.js 등)의 유닛별 정규 단어를 VOCA_DATA에 우선 동기화
  function syncCurriculumUnits() {
    let sourceUnits = null;
    let sourceCourse = null;
    if (typeof window !== 'undefined') {
      sourceCourse = window.courseData_es || window.courseData || (window.COURSES && window.COURSES['es_main']);
      if (sourceCourse && Array.isArray(sourceCourse.units)) {
        sourceUnits = sourceCourse.units;
      }
    } else if (typeof require !== 'undefined') {
      try {
        const d = require('./data_es.js');
        if (d && Array.isArray(d.units)) {
          sourceCourse = d;
          sourceUnits = d.units;
        }
      } catch (e) {
        // 무시
      }
    }

    if (!Array.isArray(sourceUnits)) return;

    const allWords = [];
    const byLevel = {};

    sourceUnits.forEach(u => {
      const uNum = parseInt(u.unitNumber || u.unitId || u.unit || u.id, 10);
      if (!uNum || !Array.isArray(u.words) || u.words.length === 0) return;

      const unitKey = 'unit-' + uNum;
      const aliasKey = 'unit_' + String(uNum).padStart(3, '0');

      // 정규화된 단어 객체 배열 보장
      const formattedWords = u.words.map((w, idx) => {
        const wordObj = {
          id: w.id || `es_u${uNum}_${idx + 1}`,
          rank: w.rank || (idx + 1),
          word: w.word || w.term || '',
          term: w.term || w.word || '',
          meaning: w.meaning || w.korean || w.ko || '',
          pronunciation: w.pronunciation || w.pron || w.phonetic || '',
          phonetic: formatPhonetic(w.phonetic || w.pronunciation || w.pron),
          exampleTarget: w.exampleTarget || w.example || '',
          exampleMeaning: w.exampleMeaning || w.exampleKo || '',
          gender: w.gender || null,
          partOfSpeech: w.partOfSpeech || w.pos || null,
          level: w.level || (uNum <= 2 ? 'A1' : (uNum <= 4 ? 'A2' : 'B1')),
          unitId: aliasKey,
          unitNumber: uNum,
          lang: 'es'
        };
        allWords.push(wordObj);
        if (!byLevel[wordObj.level]) byLevel[wordObj.level] = [];
        byLevel[wordObj.level].push(wordObj);
        return wordObj;
      });

      // byUnit에 커리큘럼 단어 덮어쓰기 (풍부한 한국어 뜻과 발음 보존)
      VOCA_DATA.byUnit[unitKey] = formattedWords;
      VOCA_DATA.byUnit[aliasKey] = formattedWords;
      VOCA_DATA.byUnit[String(uNum)] = formattedWords;
    });

    if (allWords.length > 0) {
      VOCA_DATA.allWords = allWords;
      VOCA_DATA.byLevel = byLevel;
      VOCA_DATA.isLoaded = true;
    }
  }

  // 4. 안전한 Unit 단어 조회 유틸 (비동기 로딩 찰나에도 빈 배열 [] 안전 fallback)
  function getWordsByUnit(unitId) {
    if (!unitId) return [];
    if (VOCA_DATA.byUnit && VOCA_DATA.byUnit[unitId]) return VOCA_DATA.byUnit[unitId];
    const uNum = parseInt(String(unitId).replace(/[^\d]/g, ''), 10);
    if (uNum && VOCA_DATA.byUnit && VOCA_DATA.byUnit['unit-' + uNum]) {
      return VOCA_DATA.byUnit['unit-' + uNum];
    }
    return [];
  }

  // 5. 1회 비동기 fetch 및 전역 캐싱
  async function loadSpanish5000(csvUrl = 'data/spanish_5000_master.csv') {
    if (VOCA_DATA.isLoaded && VOCA_DATA.allWords.length > 0) {
      return VOCA_DATA;
    }
    if (VOCA_DATA.loadPromise) {
      return VOCA_DATA.loadPromise;
    }

    const promise = (async () => {
      try {
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.fetch === 'function') {
          const res = await window.fetch(csvUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          indexCsvData(text);
        } else if (typeof require !== 'undefined') {
          // Node.js 환경 지원
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, '../data/spanish_5000_master.csv');
          if (fs.existsSync(p)) {
            const text = fs.readFileSync(p, 'utf8');
            indexCsvData(text);
          }
        }
        return VOCA_DATA;
      } catch (err) {
        console.warn('⚠️ [dataLoader] spanish_5000_master.csv 로드 예외 방어:', err);
        return VOCA_DATA;
      }
    })();

    VOCA_DATA.loadPromise = promise;
    return promise;
  }

  // 브라우저 및 Node 환경에서 즉시 1회 초기화 (커리큘럼 유닛 우선 동기화 후 필요 시에만 CSV 로드)
  syncCurriculumUnits();
  if (!VOCA_DATA.isLoaded && (typeof fetch === 'function' || typeof require !== 'undefined')) {
    loadSpanish5000();
  }

  // 전역 노출
  VOCA_DATA.loadSpanish5000 = loadSpanish5000;
  VOCA_DATA.parseCSV = parseCSV;
  VOCA_DATA.indexCsvData = indexCsvData;
  VOCA_DATA.syncCurriculumUnits = syncCurriculumUnits;
  VOCA_DATA.getWordsByUnit = getWordsByUnit;

  root.loadSpanish5000 = loadSpanish5000;
  root.parseCSV = parseCSV;
  root.getWordsByUnit = getWordsByUnit;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VOCA_DATA;
  }

})(typeof window !== 'undefined' ? window : this);
