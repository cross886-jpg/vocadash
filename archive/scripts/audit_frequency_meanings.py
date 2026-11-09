#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_frequency_meanings.py
english_5000_master.csv의 상위 빈도 어휘(Rank 1~1500) 중 비일상적 왜곡 뜻을 전수 감사하는 스크립트.
"""

import csv
import os
import sys

INPUT_CSV = "english_5000_master.csv"
OUTPUT_REPORT = os.path.join("reports", "audit_frequency_anomalies.csv")

# 1. 단독으로 온전한 의미를 가지는 표준 1음절 명사/감탄사/수사 화이트리스트
VALID_1CHAR_WORDS = {
    '봄', '달', '해', '별', '비', '눈', '귀', '입', '코', '손', '발', '몸', '피', '뼈', 
    '숨', '잠', '약', '풀', '물', '불', '흙', '돌', '쇠', '금', '은', '동', '줄', '끝', 
    '앞', '뒤', '속', '겉', '밑', '위', '옆', '책', '펜', '공', '종', '신', '왕', '벌', 
    '양', '쥐', '닭', '곰', '뱀', '밥', '차', '옷', '집', '길', '꽃', '새', '개', '소', 
    '말', '낮', '밤', '삶', '빛', '꿈', '돈', '법', '칼', '총', '문', '벽', '방', '탑', 
    '점', '선', '면', '힘', '일', '도', '값', '목', '배', '간', '초', '분', '넷', '다섯',
    '여섯', '일곱', '여덟', '아홉', '열', '백', '천', '만', '억', '쪽', '둘', '셋', '팀', 
    '컵', '병', '빵', '알', '쌀', '털', '네', '너', '나', '그', '오', '잘', '응', '왜', 
    '날', '긴', '큰', '본', '똥', '아', '음', '곧', '딸', '씨', '꽤', '땅', '적', '팔', 
    '어', '야', '쉿', '섬', '강', '번'
}

# 영단어와 한글 뜻이 터무니없이 1글자로 오염된 명백한 이상치 목록
KNOWN_1CHAR_CORRUPTIONS = {
    'shall': '일',
    'couple': '개',
    'million': '뒤',
    'danny': '손',
    'east': '동'
}

# 2. 비일상적 희귀 전문 용어, 고어, 품사/문법 메타 설명 패턴
JARGON_OR_META_PATTERNS = [
    '한정사', '시제의', '강조의', '구분의', '전투용의', '금전상의', '신경질의', '공화당의',
    '의장', '왕자의', '공간의', '사의하게', '되는대로의', '몸의', '법전', '퍼팅', 
    '계통', '독실', '소령', '조사', '수계', '설태', '조면', '더껑이', '사철', 
    '철도', '오후의', '피의', '배의'
]

# 3. 조사/어미가 덜컥 잘려나간 문맥 절단 파편
TRUNCATED_PHRASES = {
    '말을', '차례로', '흥미를', '자랑으로', '생명을', '미소를', '받을', '합의를'
}

def audit_dataset():
    if not os.path.exists(INPUT_CSV):
        print(f"❌ 오류: 입력 파일 '{INPUT_CSV}'을 찾을 수 없습니다.")
        sys.exit(1)

    os.makedirs(os.path.dirname(OUTPUT_REPORT), exist_ok=True)

    anomalies = []
    total_inspected = 0

    with open(INPUT_CSV, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rank = int(row["Rank"])
            if rank > 1500:
                continue

            total_inspected += 1
            w = row["Word"]
            w_lower = w.lower()
            m = row["Meaning"].strip()
            ko = row["Example_KO"].strip()
            en = row["Example_EN"].strip()

            issue = None

            # 조건 1: 1글자 조사/어미/파편 잔재
            if (len(m) == 1 and m not in VALID_1CHAR_WORDS) or (w_lower in KNOWN_1CHAR_CORRUPTIONS and m == KNOWN_1CHAR_CORRUPTIONS[w_lower]):
                issue = "1글자 조사/어미/파편 잔재"
            # 조건 2: 8자 초과 긴 설명형 문구
            elif len(m) > 8:
                issue = "지나치게 긴 설명형 문구(8자 초과)"
            # 조건 3: 조사/어미가 절단된 미완성 파편
            elif m in TRUNCATED_PHRASES:
                issue = "문맥 절단 파편"
            # 조건 4: 일반 초중등 교과 과정에서 쓰이지 않는 희귀 전문 용어/고어/사전 메타 패턴
            elif any(p in m for p in JARGON_OR_META_PATTERNS):
                issue = "비일상적 희귀 전문 용어/사전 메타 왜곡"

            if issue:
                anomalies.append({
                    "Rank": rank,
                    "Word": w,
                    "Meaning": m,
                    "Issue_Type": issue,
                    "Example_EN": en,
                    "Example_KO": ko
                })

    # 리포트 CSV 저장
    fieldnames = ["Rank", "Word", "Meaning", "Issue_Type", "Example_EN", "Example_KO"]
    with open(OUTPUT_REPORT, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(anomalies)

    return total_inspected, anomalies

def main():
    print(f"🔍 '{INPUT_CSV}' 상위 빈도 어휘(Rank 1~1500) 비일상적 왜곡 뜻 감사 시작...")
    inspected, anomalies = audit_dataset()
    print(f"✅ 감사 완료: 상위 {inspected}개 단어 중 총 {len(anomalies)}건 이상치 검출")
    print(f"💾 감사 리포트 저장 완료: '{OUTPUT_REPORT}'\n")

    # 상위 20개 의심 단어 출력
    print("=" * 110)
    print(f"{'Rank':^6} | {'Word':^15} | {'Meaning':^15} | {'Issue_Type':^25} | {'Example_KO'}")
    print("-" * 110)
    for a in anomalies[:20]:
        print(f"{a['Rank']:^6} | {a['Word']:<15} | {a['Meaning']:<15} | {a['Issue_Type']:<25} | {a['Example_KO']}")
    print("=" * 110)

if __name__ == "__main__":
    main()

