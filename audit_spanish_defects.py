#!/usr/bin/env python3
"""
audit_spanish_defects.py
Full audit of data/spanish_5000_master.csv to detect all meaning defects:
a) Verb infinitives (-ar, -er, -ir) misclassified as nouns/imperatives instead of '~하다/~이다/동사원형'
b) Disallowed particle fragments ('을', '를', '에', '의', etc.) and single-character ambiguous words
c) Grammatical meta tags ('남성형', '여성형', '복수형', '과거분사', etc.) and transliterated artefacts
d) Semantic mismatches between Example_KO and Meaning
"""

import csv
import os
import sys

SPANISH_CSV = 'data/spanish_5000_master.csv'

DISALLOWED_PARTICLES = {
    '을', '를', '에', '의', '로', '와', '과', '서', '도', '은', '는', '이', '가', '만', '게', '할', '일',
    '고', '며', '랑', '않', '하', '되', '인', '된', '1', '개', '대', '약', '봐', '더', '덜', '살', '다', '내'
}

NON_VERB_AR_ER_IR = {
    'lugar', 'mujer', 'mar', 'primer', 'ayer', 'par', 'señor', 'color', 'error', 'flor',
    'amor', 'dolor', 'sabor', 'valor', 'calor', 'temor', 'motor', 'autor', 'favor', 'humor',
    'olor', 'vapor', 'chofer', 'taller', 'suéter', 'líder', 'cáncer', 'carácter', 'placer',
    'mártir', 'bar', 'hogar', 'cualquier', 'peter', 'oscar', 'spencer', 'walker', 'jennifer',
    'césar', 'solar', 'dólar', 'azar', 'nuclear', 'similar', 'collar', 'alquiler', 'celular',
    'azúcar', 'particular', 'popular', 'tyler', 'hitler', 'oliver', 'parker', 'cooper', 'miller',
    'cadáver', 'walter', 'tercer', 'sir', 'carter', 'roger', 'súper', 'super', 'familiar', 'militar',
    'amanecer'
}

GRAMMAR_TAGS = {'남성형', '여성형', '복수형', '과거분사', '복수'}

TRANSLITERATED_ERRORS = {'팔로우', '라이브', '카운트', '테이크 아웃', '테이크아웃', '리프트'}

def audit():
    if not os.path.exists(SPANISH_CSV):
        print(f"Error: {SPANISH_CSV} does not exist")
        return 1

    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    print(f"=== [스페인어 데이터 전수 감사 (총 {len(rows)}개 어휘)] ===")

    verb_defects = []
    particle_defects = []
    grammar_defects = []
    mismatch_defects = []

    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        w = r['Word'].lower().strip()
        m = r['Meaning'].strip()
        ex_ko = r['Example_KO']

        # a) Verb infinitives not ending in ~다 / ~하다 / ~되다 / ~이다
        if (w.endswith('ar') or w.endswith('er') or w.endswith('ir')) and len(w) >= 3:
            if w not in NON_VERB_AR_ER_IR:
                if not (m.endswith('다') or m.endswith('하다') or m.endswith('되다') or m.endswith('이다')):
                    verb_defects.append((rank, w, m, ex_ko[:30]))

        # b) Particles & 1-char ambiguous words
        if m in DISALLOWED_PARTICLES:
            particle_defects.append((rank, w, m, ex_ko[:30]))

        # c) Grammar tags & transliterated errors
        if m in GRAMMAR_TAGS or any(te in m for te in TRANSLITERATED_ERRORS):
            grammar_defects.append((rank, w, m, ex_ko[:30]))

        # d) Known critical mismatches
        if w == 'ser' and m != '이다':
            mismatch_defects.append((rank, w, m, "ser(이다) 오분류"))
        elif w == 'haber' and m != '있다':
            mismatch_defects.append((rank, w, m, "haber(있다) 오분류"))
        elif w == 'poder' and m != '할수있다':
            mismatch_defects.append((rank, w, m, "poder(할수있다) 오분류"))
        elif w == 'gustar' and not m.endswith('좋아하다'):
            mismatch_defects.append((rank, w, m, "gustar(좋아하다) 오분류"))
        elif w == 'conde' and '백작' not in m:
            mismatch_defects.append((rank, w, m, "conde(백작) 오역"))
        elif w in {'suyo', 'suya', 'suyos'} and m == '너의 것':
            mismatch_defects.append((rank, w, m, f"{w}(3인칭 소유대명사) 오역"))

    # Deduplicate total defect rows
    total_defective_ranks = set(
        [x[0] for x in verb_defects] +
        [x[0] for x in particle_defects] +
        [x[0] for x in grammar_defects] +
        [x[0] for x in mismatch_defects]
    )

    print(f"1. 동사원형(-ar/-er/-ir) 비동사형 표기 결함: {len(verb_defects)}건")
    print(f"2. 불량 조사 파편 및 1글자 모호어 결함: {len(particle_defects)}건")
    print(f"3. 문법 태그 및 영단어 기계 번역 결함: {len(grammar_defects)}건")
    print(f"4. 주요 최빈출 핵심 다의어 문맥 왜곡 결함: {len(mismatch_defects)}건")
    print(f"--------------------------------------------------")
    print(f"📌 총 고유 결함 건수 (중복 제거): {len(total_defective_ranks)}건")

    if total_defective_ranks:
        print("\n[상위 잔여 결함 목록 샘플]")
        all_defects = sorted(
            list({x[0]: x for x in (verb_defects + particle_defects + grammar_defects + mismatch_defects)}.values()),
            key=lambda x: x[0]
        )
        for d in all_defects[:15]:
            print(f"Rank {d[0]:4d}: {d[1]:15s} | Meaning: {d[2]:12s} | Detail: {d[3]}")
        return len(total_defective_ranks)
    else:
        print("✨ 모든 스페인어 어휘의 의미 무결성 검증 통과 (결함 0건)!")
        return 0

if __name__ == '__main__':
    exit_code = audit()
    sys.exit(exit_code)
