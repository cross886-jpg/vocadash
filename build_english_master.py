#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_english_master.py
english_5000_master.csv(9대 정규 필드)를 읽어
표준 30단어 규격(Stage 1: 10단어, Stage 2: 10단어, Stage 3: 10단어)의
웹 앱 런타임 데이터 파일(js/data_en.js 및 js/data/data_en.js)로 빌드하는 스크립트.
"""

import csv
import json
import os
import sys

from refine_english_master import (
    CURATED_WORDS,
    clean_meaning,
    clean_pron,
    clean_ex_en,
    clean_ex_ko
)

INPUT_CSV = "english_5000_master.csv"
OUTPUT_FILES = [
    os.path.join("js", "data_en.js"),
    os.path.join("js", "data", "data_en.js")
]

EXPECTED_HEADERS = [
    "Rank", "Word", "Level", "Unit_ID", "Node_ID",
    "Meaning", "Pronunciation", "Example_EN", "Example_KO"
]

def to_roman(n):
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman = ""
    i = 0
    while n > 0:
        for _ in range(n // val[i]):
            roman += syb[i]
            n -= val[i]
        i += 1
    return roman

def get_unit_metadata(u_num, word_count=30, total_words=4998):
    if u_num <= 30:
        lvl_name = "A1 기초 핵심 어휘"
        sub_idx = u_num
    elif u_num <= 70:
        lvl_name = "A2 실전 도약 어휘"
        sub_idx = u_num - 30
    elif u_num <= 120:
        lvl_name = "B1 중급 심화 어휘"
        sub_idx = u_num - 70
    else:
        lvl_name = "B2 고급 마스터 어휘"
        sub_idx = u_num - 120

    title = f"Unit {u_num}. {lvl_name} {to_roman(sub_idx)}"
    start_r = (u_num - 1) * 30 + 1
    end_r = min(total_words, start_r + word_count - 1)
    subtitle = f"빈도수 상위 {start_r}~{end_r}위 단어 {word_count}개 집중 훈련"
    return title, subtitle

def build_english_runtime_data():
    if not os.path.exists(INPUT_CSV):
        print(f"❌ 오류: 입력 파일 '{INPUT_CSV}'을 찾을 수 없습니다.")
        sys.exit(1)

    print(f"📖 '{INPUT_CSV}' 로딩 및 30단어 표준 규격 파싱 시작...")

    with open(INPUT_CSV, mode="r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        try:
            raw_header = next(reader)
        except StopIteration:
            print("❌ 오류: CSV 파일이 비어 있습니다.")
            sys.exit(1)

        headers = [h.strip() for h in raw_header]

        for expected in EXPECTED_HEADERS:
            if expected not in headers:
                print(f"❌ 오류: 필수 헤더 컬럼 '{expected}'이(가) 누락되었습니다. 현재 헤더: {headers}")
                sys.exit(1)

        col_idx = {name: headers.index(name) for name in EXPECTED_HEADERS}

        units_dict = {}
        all_words = []
        total_rows = 0

        for line_num, row in enumerate(reader, start=2):
            if not row or not any(field.strip() for field in row):
                continue

            if len(row) < len(EXPECTED_HEADERS):
                print(f"⚠️ 경고: {line_num}행 열 수 부족. 건너뜀.")
                continue

            try:
                rank = int(row[col_idx["Rank"]].strip())
            except ValueError:
                rank = total_rows + 1

            word = row[col_idx["Word"]].strip()
            level = row[col_idx["Level"]].strip()
            unit_id = row[col_idx["Unit_ID"]].strip()
            node_id = row[col_idx["Node_ID"]].strip()
            raw_meaning = row[col_idx["Meaning"]].strip()
            raw_pronunciation = row[col_idx["Pronunciation"]].strip()
            raw_example_en = row[col_idx["Example_EN"]].strip()
            raw_example_ko = row[col_idx["Example_KO"]].strip()

            w_lower = word.lower()
            if w_lower in CURATED_WORDS:
                c = CURATED_WORDS[w_lower]
                meaning = clean_meaning(c["meaning"], w_lower)
                phonetic_str = clean_pron(raw_pronunciation)
                example_en = c["ex_en"]
                example_ko = c["ex_ko"]
            else:
                meaning = clean_meaning(raw_meaning, w_lower)
                phonetic_str = clean_pron(raw_pronunciation)
                example_en = clean_ex_en(raw_example_en)
                example_ko = clean_ex_ko(raw_example_ko)

            # 쉼표 전면 배제 (파싱 무결성 유지)
            meaning = meaning.replace(",", " ")
            example_en = example_en.replace(",", " ")
            example_ko = example_ko.replace(",", " ")

            # 유닛 번호 산출 (unit_001 -> 1)
            try:
                u_num = int("".join(filter(str.isdigit, unit_id))) if any(c.isdigit() for c in unit_id) else ((rank - 1) // 30) + 1
            except Exception:
                u_num = ((rank - 1) // 30) + 1

            if u_num not in units_dict:
                units_dict[u_num] = []

            idx_in_unit = len(units_dict[u_num]) + 1
            word_id = f"en_{u_num * 100 + idx_in_unit}"

            # 30단어 기준 Node_ID 동기화 (1~10: n1, 11~20: n2, 21~30: n5)
            if idx_in_unit <= 10:
                expected_node_id = f"en_u{u_num}_n1"
            elif idx_in_unit <= 20:
                expected_node_id = f"en_u{u_num}_n2"
            else:
                expected_node_id = f"en_u{u_num}_n5"

            word_obj = {
                "id": word_id,
                "rank": rank,
                "word": word,
                "term": word,
                "level": level or ("A1" if u_num <= 20 else ("A2" if u_num <= 60 else "B1")),
                "unitId": unit_id or f"unit_{u_num:03d}",
                "nodeId": node_id or expected_node_id,
                "meaning": meaning,
                "pronunciation": phonetic_str,
                "pron": phonetic_str,
                "phonetic": phonetic_str,
                "example_en": example_en,
                "example_ko": example_ko,
                "exampleTarget": example_en,
                "exampleMeaning": example_ko
            }

            all_words.append(word_obj)
            units_dict[u_num].append(word_obj)
            total_rows += 1

    print(f"✅ CSV 파싱 완료: 총 {total_rows}개 단어, {len(units_dict)}개 유닛 수집")

    # 유닛 및 노드 구조 빌드 (표준 10단어 3단계 분배)
    units = []
    for u_num in sorted(units_dict.keys()):
        u_words = units_dict[u_num]

        u_title, u_desc = get_unit_metadata(u_num, len(u_words), total_rows)
        s_titles = ("1과: 기초 어휘 런", "2과: 실전 패턴 런", "3과: 심화 회화 런")

        stage1_words = u_words[:10]
        stage2_words = u_words[10:20]
        stage3_words = u_words[20:30]

        nodes = [
            {
                "id": f"en_u{u_num}_n1",
                "type": "stage",
                "title": s_titles[0],
                "stageNumber": 1,
                "wordIds": [w["id"] for w in stage1_words]
            },
            {
                "id": f"en_u{u_num}_n2",
                "type": "stage",
                "title": s_titles[1],
                "stageNumber": 2,
                "wordIds": [w["id"] for w in stage2_words]
            },
            {
                "id": f"en_u{u_num}_n3",
                "type": "bonus",
                "title": "보너스 상자",
                "rewardGems": 15
            },
            {
                "id": f"en_u{u_num}_n4",
                "type": "review",
                "title": "약점 복습"
            },
            {
                "id": f"en_u{u_num}_n5",
                "type": "stage",
                "title": s_titles[2],
                "stageNumber": 3,
                "wordIds": [w["id"] for w in stage3_words]
            },
            {
                "id": f"en_u{u_num}_n6",
                "type": "boss",
                "title": f"Unit {u_num} 보스전"
            }
        ]

        unit_obj = {
            "unitId": u_num,
            "unitNumber": u_num,
            "id": u_num,
            "unit": u_num,
            "title": u_title,
            "desc": u_desc,
            "stages": [
                { "stageNumber": 1, "title": s_titles[0], "targetWords": len(stage1_words) },
                { "stageNumber": 2, "title": s_titles[1], "targetWords": len(stage2_words) },
                { "stageNumber": 3, "title": s_titles[2], "targetWords": len(stage3_words) }
            ],
            "words": u_words,
            "nodes": nodes
        }
        units.append(unit_obj)

    course_data = {
        "id": "en_main",
        "courseId": "en_main",
        "code": "en",
        "name": "영어 정규 코스",
        "courseName": "영어 정규 코스",
        "title": "영어 일상 실전",
        "desc": "인사, 카페/식당 주문, 길찾기부터 마트 쇼핑까지 매일 쓰는 필수 영어",
        "badge": "🇺🇸 정규 코스",
        "icon": "🇺🇸",
        "flag": "🇺🇸",
        "mascotImg": "assets/characters/en-study.webp?v=88",
        "totalUnits": len(units),
        "units": units
    }

    # JS 코드 생성 (UMD 규격 및 wordMap/양방향 색인 내장)
    json_str = json.dumps(course_data, ensure_ascii=False, indent=2)

    js_template = f"""(function (root, factory) {{
  if (typeof module === 'object' && module.exports) {{
    module.exports = factory();
  }} else {{
    root.courseData_en = factory();
  }}
}}(typeof globalThis !== 'undefined' ? globalThis : this, function () {{
  'use strict';

  const courseData_en = {json_str};

  // 단어 ID 매핑 및 양방향 속성 정규화
  const wordMap = {{}};
  courseData_en.units.forEach(u => {{
    u.id = u.unitId;
    u.unit = u.unitNumber;
    u.subtitle = u.desc || "";
    u.words.forEach(w => {{
      w.term = w.term || w.word;
      w.pron = w.pron || w.pronunciation;
      w.phonetic = w.phonetic || (w.pronunciation ? (w.pronunciation.startsWith('[') ? w.pronunciation : `[${{w.pronunciation}}]`) : '');
      w.exampleTarget = w.exampleTarget || w.example_en || '';
      w.exampleMeaning = w.exampleMeaning || w.example_ko || '';
      wordMap[w.id] = w;
      if (w.rank) {{
        wordMap['w_en_' + w.rank] = w;
        if (!wordMap['en_' + w.rank]) {{
          wordMap['en_' + w.rank] = w;
        }}
      }}
      if (w.word && !wordMap[w.word]) {{
        wordMap[w.word] = w;
      }}
    }});
  }});
  courseData_en.wordMap = wordMap;
  courseData_en.allWords = courseData_en.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {{
    window.courseData_en = courseData_en;
    if (window.COURSES) {{
      window.COURSES['en_main'] = courseData_en;
    }}
  }}

  return courseData_en;
}}));
"""

    for out_path in OUTPUT_FILES:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, mode="w", encoding="utf-8") as out_f:
            out_f.write(js_template)
        file_size_kb = os.path.getsize(out_path) / 1024
        print(f"💾 빌드 파일 저장 완료: '{out_path}' ({file_size_kb:.1f} KB)")

    print("\n🔍 --- [빌드 결과 검증 샘플 객체] ---")
    sample_word = course_data["units"][0]["words"][0]
    print(json.dumps(sample_word, ensure_ascii=False, indent=2))
    print(f"\n🎉 영어 마스터 데이터 빌드가 성공적으로 완료되었습니다! (총 {len(units)}개 유닛, {total_rows}개 단어)")

if __name__ == "__main__":
    build_english_runtime_data()
