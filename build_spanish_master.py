import csv
import json
import os
import sys

INPUT_CSV = "spanish_5000_master.csv"
OUTPUT_FILES = [
    os.path.join("js", "data_es.js"),
    os.path.join("js", "data", "data_es.js")
]

EXPECTED_HEADERS = [
    "Rank", "Word", "Level", "Unit_ID", "Node_ID",
    "Meaning", "Pronunciation", "Example_ES", "Example_KO"
]

STAGE_TITLES_PRESET = {
    1: ("1과: 첫 만남과 감사", "2과: 안부와 작별 인사", "3과: 자기소개와 소통"),
    2: ("1과: 음료와 커피 주문", "2과: 메뉴 주문과 식사", "3과: 테이블 세팅과 요청"),
    3: ("1과: 대중교통과 방향", "2과: 길 묻기와 주요 장소", "3과: 도로 표지와 이동"),
    4: ("1과: 마트 계산과 결제", "2과: 식료품과 가격", "3과: 신선 식품과 매장 이용"),
}

def build_spanish_runtime_data():
    if not os.path.exists(INPUT_CSV):
        print(f"❌ 오류: 입력 파일 '{INPUT_CSV}'을 찾을 수 없습니다.")
        sys.exit(1)

    print(f"📖 '{INPUT_CSV}' 로딩 및 9대 정규 필드 파싱 시작...")
    
    with open(INPUT_CSV, mode="r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        try:
            raw_header = next(reader)
        except StopIteration:
            print("❌ 오류: CSV 파일이 비어 있습니다.")
            sys.exit(1)

        # BOM 및 공백 정리
        headers = [h.strip() for h in raw_header]
        
        # 헤더 무결성 검증
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
                print(f"⚠️ 경고: {line_num}행의 열 수가 부족합니다 (필요 {len(EXPECTED_HEADERS)}, 실제 {len(row)}). 건너뜀.")
                continue

            # 1:1 정규 필드 추출
            try:
                rank = int(row[col_idx["Rank"]].strip())
            except ValueError:
                rank = total_rows + 1

            word = row[col_idx["Word"]].strip()
            level = row[col_idx["Level"]].strip()
            unit_id = row[col_idx["Unit_ID"]].strip()
            node_id = row[col_idx["Node_ID"]].strip()
            meaning = row[col_idx["Meaning"]].strip()
            pronunciation = row[col_idx["Pronunciation"]].strip()
            example_es = row[col_idx["Example_ES"]].strip()
            example_ko = row[col_idx["Example_KO"]].strip()

            # 유닛 번호 산출 (unit_001 -> 1)
            try:
                u_num = int("".join(filter(str.isdigit, unit_id))) if any(c.isdigit() for c in unit_id) else ((rank - 1) // 30) + 1
            except Exception:
                u_num = ((rank - 1) // 30) + 1

            idx_in_unit = ((rank - 1) % 30) + 1
            word_id = f"es_{u_num * 100 + idx_in_unit}"

            word_obj = {
                "id": word_id,
                "rank": rank,
                "word": word,
                "term": word,
                "level": level,
                "unitId": unit_id,
                "nodeId": node_id,
                "meaning": meaning,
                "pronunciation": pronunciation,
                "pron": pronunciation,
                "phonetic": pronunciation if pronunciation.startswith("[") else f"[{pronunciation}]",
                "example_es": example_es,
                "example_ko": example_ko,
                "exampleTarget": example_es,
                "exampleMeaning": example_ko
            }

            all_words.append(word_obj)

            if u_num not in units_dict:
                units_dict[u_num] = []
            units_dict[u_num].append(word_obj)
            total_rows += 1

    print(f"✅ CSV 파싱 완료: 총 {total_rows}개 단어, {len(units_dict)}개 유닛 수집")

    # 유닛 및 노드 구조 빌드
    units = []
    for u_num in sorted(units_dict.keys()):
        u_words = units_dict[u_num]

        s1_title, s2_title, s3_title = STAGE_TITLES_PRESET.get(
            u_num,
            (f"1과: 기초 어휘 런", f"2과: 실전 패턴 런", f"3과: 심화 회화 런")
        )

        stage1_words = u_words[:10]
        stage2_words = u_words[10:20]
        stage3_words = u_words[20:30]

        nodes = [
            {
                "id": f"es_{u_num}_n1",
                "type": "stage",
                "title": s1_title,
                "stageNumber": 1,
                "wordIds": [w["id"] for w in stage1_words]
            },
            {
                "id": f"es_{u_num}_n2",
                "type": "stage",
                "title": s2_title,
                "stageNumber": 2,
                "wordIds": [w["id"] for w in stage2_words]
            },
            {
                "id": f"es_{u_num}_n3",
                "type": "bonus",
                "title": "보너스 상자",
                "rewardGems": 15
            },
            {
                "id": f"es_{u_num}_n4",
                "type": "review",
                "title": "약점 복습"
            },
            {
                "id": f"es_{u_num}_n5",
                "type": "stage",
                "title": s3_title,
                "stageNumber": 3,
                "wordIds": [w["id"] for w in stage3_words]
            },
            {
                "id": f"es_{u_num}_n6",
                "type": "boss",
                "title": f"Unit {u_num} 보스전"
            }
        ]

        unit_obj = {
            "unitId": u_num,
            "unitNumber": u_num,
            "id": u_num,
            "unit": u_num,
            "title": f"Unit {u_num}",
            "desc": "",
            "stages": [
                { "stageNumber": 1, "title": "1과 기초 런", "targetWords": len(stage1_words) },
                { "stageNumber": 2, "title": "2과 실전 런", "targetWords": len(stage2_words) },
                { "stageNumber": 3, "title": "보스전 마스터", "isBoss": True, "targetWords": len(stage3_words) }
            ],
            "words": u_words,
            "nodes": nodes
        }
        units.append(unit_obj)

    course_data = {
        "id": "es_main",
        "courseId": "es_main",
        "code": "es",
        "name": "스페인어 정규 코스",
        "courseName": "스페인어 정규 코스",
        "title": "스페인어 일상 실전",
        "desc": "인사, 카페/식당 주문, 길찾기부터 마트 쇼핑까지 매일 쓰는 필수 스페인어",
        "badge": "🇪🇸 정규 코스",
        "icon": "🇪🇸",
        "flag": "🇪🇸",
        "mascotImg": "assets/characters/es-study.webp?v=88",
        "totalUnits": len(units),
        "units": units
    }

    # JS 코드 생성 (UMD 규격 및 wordMap/양방향 색인 내장)
    json_str = json.dumps(course_data, ensure_ascii=False, indent=2)

    js_template = f"""(function (root, factory) {{
  if (typeof module === 'object' && module.exports) {{
    module.exports = factory();
  }} else {{
    root.courseData_es = factory();
  }}
}}(typeof globalThis !== 'undefined' ? globalThis : this, function () {{
  'use strict';

  const courseData_es = {json_str};

  // 단어 ID 매핑 및 양방향 속성 정규화
  const wordMap = {{}};
  courseData_es.units.forEach(u => {{
    u.id = u.unitId;
    u.unit = u.unitNumber;
    u.subtitle = u.desc || "";
    u.words.forEach(w => {{
      w.term = w.term || w.word;
      w.pron = w.pron || w.pronunciation;
      w.phonetic = w.phonetic || (w.pronunciation ? (w.pronunciation.startsWith('[') ? w.pronunciation : `[${{w.pronunciation}}]`) : '');
      w.exampleTarget = w.exampleTarget || w.example_es || '';
      w.exampleMeaning = w.exampleMeaning || w.example_ko || '';
      wordMap[w.id] = w;
      if (w.rank) {{
        wordMap['w_es_' + w.rank] = w;
        if (!wordMap['es_' + w.rank]) {{
          wordMap['es_' + w.rank] = w;
        }}
      }}
      if (w.word && !wordMap[w.word]) {{
        wordMap[w.word] = w;
      }}
    }});
  }});
  courseData_es.wordMap = wordMap;
  courseData_es.allWords = courseData_es.units.flatMap(u => u.words);

  if (typeof window !== 'undefined') {{
    window.courseData_es = courseData_es;
    window.courseData = courseData_es; // 기본 하위 호환 보장
    if (window.COURSES) {{
      window.COURSES['es_main'] = courseData_es;
    }}
  }}

  return courseData_es;
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
    print(f"\n🎉 스페인어 마스터 데이터 빌드가 성공적으로 완료되었습니다! (총 {len(units)}개 유닛, {total_rows}개 단어)")

if __name__ == "__main__":
    build_spanish_runtime_data()
