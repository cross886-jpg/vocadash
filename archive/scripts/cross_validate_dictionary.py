#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cross_validate_dictionary.py
교육부 3,000 기본 어휘 표준 DB(data/education_vocab_3000.json)를 기반으로
english_5000_master.csv 전체를 1:1 교차 대조하여 일상 1순위 대표 뜻과 동떨어진
다의어/속어/파편 왜곡 어휘를 색출하는 감사 스크립트.
"""

import csv
import json
import os
import sys

MASTER_CSV = "english_5000_master.csv"
STANDARD_VOCAB_JSON = os.path.join("data", "education_vocab_3000.json")
OUTPUT_REPORT = os.path.join("reports", "dictionary_mismatches.csv")

# 문법적/품사적 동의어 및 파생 형태 매핑
SYNONYMS = {
    '나': ['나', '나는', '나를', '내가', '나의'],
    '너': ['너', '너는', '너를', '네가', '너의', '당신'],
    '그': ['그', '그는', '그를', '그의'],
    '그녀': ['그녀', '그녀는', '그녀를', '그녀의'],
    '우리': ['우리', '우리는', '우리를', '우리의'],
    '그들': ['그들', '그들은', '그들을', '그들의'],
    '위해': ['를 위해', '을 위해', '위하여', '위해'],
    '대해': ['에 대하여', '에 대해', '대해', '대하여'],
    '정말': ['정말로', '진짜', '참으로', '정말'],
    '매우': ['대단히', '아주', '매우', '몹시'],
    '오직': ['오로지', '다만', '오직', '단지'],
    '그냥': ['그저', '그냥', '단지'],
    '제발': ['부탁합니다', '부디', '제발'],
    '후에': ['뒤에', '후에', '나중에'],
    '전에': ['앞에', '전에', '이전에'],
    '가장': ['최고의', '가장'],
    '확신': ['확신하는', '확신하고', '확신']
}

def are_synonyms(m1, m2):
    if m1 == m2:
        return True
    for base, syns in SYNONYMS.items():
        if any(s in m1 for s in syns) and any(s in m2 for s in syns):
            return True
    return False

def load_standard_dictionary():
    if not os.path.exists(STANDARD_VOCAB_JSON):
        print(f"❌ 오류: 표준 어휘 사전 '{STANDARD_VOCAB_JSON}' 파일이 존재하지 않습니다.")
        sys.exit(1)

    with open(STANDARD_VOCAB_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    vocab_dict = {}
    for item in data:
        w = item["word"].lower().strip()
        meanings = []
        for group in item.get("meanings", []):
            for ko in group.get("ko", []):
                clean_ko = ko.strip().replace("~", "").strip()
                if clean_ko and clean_ko not in meanings:
                    meanings.append(clean_ko)

        if meanings:
            vocab_dict[w] = {
                "primary": meanings[0],
                "all_meanings": meanings,
                "level": item.get("level", ""),
                "pos": item.get("pos", [])
            }

        # 파생어/변형 표기 인덱싱
        for d in item.get("derived", []):
            d_clean = d.lower().strip()
            if d_clean and d_clean not in vocab_dict and meanings:
                vocab_dict[d_clean] = {
                    "primary": meanings[0],
                    "all_meanings": meanings,
                    "level": item.get("level", ""),
                    "pos": item.get("pos", [])
                }

    return vocab_dict

def find_lemma_entry(word, vocab_dict):
    w_lower = word.lower().strip()
    if w_lower in vocab_dict:
        return w_lower, vocab_dict[w_lower]

    # 기본 굴절형 분해 매칭
    suffixes = [
        ('s', 1), ('es', 2), ('ed', 2), ('ed', 1), ('ing', 3), ('ing', 2),
        ('er', 2), ('est', 3), ('ly', 2)
    ]
    for suf, l in suffixes:
        if w_lower.endswith(suf) and len(w_lower) > l + 2:
            base = w_lower[:-l]
            if base in vocab_dict:
                return base, vocab_dict[base]
            if suf == 'ing' and (base + 'e') in vocab_dict:
                return base + 'e', vocab_dict[base + 'e']
            if suf == 'ed' and (base + 'e') in vocab_dict:
                return base + 'e', vocab_dict[base + 'e']

    return None, None

def run_cross_validation():
    if not os.path.exists(MASTER_CSV):
        print(f"❌ 오류: '{MASTER_CSV}' 파일을 찾을 수 없습니다.")
        sys.exit(1)

    os.makedirs(os.path.dirname(OUTPUT_REPORT), exist_ok=True)
    vocab_dict = load_standard_dictionary()

    with open(MASTER_CSV, mode="r", encoding="utf-8") as f:
        master_rows = list(csv.DictReader(f))

    total_master = len(master_rows)
    mapped_count = 0
    match_count = 0
    mismatches = []

    for r in master_rows:
        w = r["Word"]
        cur_m = r["Meaning"].strip()
        ko_ex = r["Example_KO"].strip()
        en_ex = r["Example_EN"].strip()
        rank = int(r["Rank"])

        lemma, info = find_lemma_entry(w, vocab_dict)
        if not info:
            continue

        mapped_count += 1
        std_primary = info["primary"]
        std_all = info["all_meanings"]

        # 표준 사전 뜻과의 일치 여부 판정
        is_match = False
        for sm in std_all:
            if are_synonyms(cur_m, sm):
                is_match = True
                break
            sm_c = sm.replace("하다", "").replace("되다", "").replace("이다", "").replace("~", "").strip()
            cur_c = cur_m.replace("하다", "").replace("되다", "").replace("이다", "").replace("~", "").strip()
            if cur_c and sm_c and (cur_c == sm_c or (len(sm_c) >= 2 and sm_c in cur_c) or (len(cur_c) >= 2 and cur_c in sm_c)):
                is_match = True
                break

        if is_match:
            match_count += 1
        else:
            mismatches.append({
                "Rank": rank,
                "Word": w,
                "Current_Meaning": cur_m,
                "Standard_Primary_Meaning": std_primary,
                "Standard_All_Meanings": " / ".join(std_all),
                "Example_EN": en_ex,
                "Example_KO": ko_ex
            })

    # 리포트 CSV 저장
    fieldnames = [
        "Rank", "Word", "Current_Meaning", "Standard_Primary_Meaning",
        "Standard_All_Meanings", "Example_EN", "Example_KO"
    ]
    with open(OUTPUT_REPORT, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(mismatches)

    match_rate = (match_count / mapped_count * 100) if mapped_count > 0 else 0.0

    return {
        "total_master": total_master,
        "mapped_count": mapped_count,
        "match_count": match_count,
        "mismatch_count": len(mismatches),
        "match_rate": match_rate,
        "mismatches": mismatches
    }

def main():
    print(f"📖 표준 교육부 3,000 기본 어휘 DB 기반 1:1 교차 대조 시작...")
    res = run_cross_validation()

    print(f"✅ 전체 마스터 어휘: {res['total_master']}개")
    print(f"✅ 표준 사전 매핑 어휘: {res['mapped_count']}개")
    print(f"📊 표준 사전 매핑 일치율: {res['match_rate']:.2f}% (일치 {res['match_count']}건)")
    print(f"⚠️ 불일치 및 왜곡 검출 총 건수: {res['mismatch_count']}건")
    print(f"💾 대조 리포트 저장 완료: '{OUTPUT_REPORT}'\n")

    # 불일치 판정된 주요 단어 샘플 20개 출력
    print("=" * 115)
    print(f"{'Rank':^6} | {'Word':^12} | {'현재 뜻':^12} | {'표준 1순위 대표 뜻':^18} | {'예문 해석'}")
    print("-" * 115)
    
    # 대표적인 다의어/슬랭/파편 왜곡 사례 20건 선별 출력
    featured_ranks = [
        206, 215, 216, 229, 232, 250, 273, 289, 353, 382,
        391, 425, 476, 492, 516, 524, 536, 542, 562, 583
    ]
    
    m_dict = {m['Rank']: m for m in res['mismatches']}
    displayed = []
    for r in featured_ranks:
        if r in m_dict:
            displayed.append(m_dict[r])

    # 20개 채우기
    if len(displayed) < 20:
        for m in res['mismatches']:
            if m not in displayed:
                displayed.append(m)
            if len(displayed) == 20:
                break

    for item in displayed:
        print(f"{item['Rank']:^6} | {item['Word']:<12} | {item['Current_Meaning']:<12} | {item['Standard_Primary_Meaning']:<18} | {item['Example_KO']}")
    print("=" * 115)

if __name__ == "__main__":
    main()

