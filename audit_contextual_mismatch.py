#!/usr/bin/env python3
"""
audit_contextual_mismatch.py
Audits contextual semantic consistency between 표제어 뜻 (Meaning) and 한국어 예문 해석 (Example_KO)
across data/spanish_5000_master.csv and data/english_5000_master.csv.

Logic:
1. Exclude purely grammatical/functional words (pronouns, prepositions, particles, auxiliary modals).
2. Decompose Korean meanings into stems and common morphological variants (irregulars ㅂ, 르, etc.).
3. Check if any core stem/variant appears in Example_KO (space-agnostic).
4. Score suspicion for mismatches (empty examples, template examples, dictionary artifacts, content word absence).
5. Output statistical match percentage and top 20 most suspicious mismatched words per language.
"""

import csv
import os
import re

SPANISH_CSV = 'data/spanish_5000_master.csv'
ENGLISH_CSV = 'data/english_5000_master.csv'

FUNCTIONAL_WORDS = {
    # English
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
    'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
    'know', 'take', 'person', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
    'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
    'how', 'our', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
    'day', 'most', 'us', 'very', 'here', 'such', 'why', 'where', 'much', 'down', 'should',
    # Spanish
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para',
    'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este',
    'ir', 'otro', 'ese', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin', 'vez',
    'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer',
    'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella', 'sí',
    'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre', 'parecer', 'nuestro',
    'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
    'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'sólo', 'pues', 'llamar', 'venir', 'pensar',
    'aquel', 'momento'
}

FUNCTIONAL_MEANINGS = {
    '이것', '그것', '저것', '이', '그', '저', '나', '너', '우리', '그들', '당신', '그녀', '그 사람',
    '누구', '무엇', '어디', '언제', '어떻게', '왜', '어떤', '모든', '각각', '자신', '어느',
    '네', '아니오', '오직', '단지', '더', '덜', '더많은', '더적은', '매우', '아주',
    '잘', '꼭', '다시', '이미', '아직', '곧', '안녕', '하하', '쉿', '와우', '응', '그래',
    '있다', '없다', '이다', '아니다', '하다', '되다', '주다', '보다', '가다', '오다',
    '출신', '~의', '~로', '~에', '켜짐', '미국', '도(온도)', '은화', '날들', '나이',
    '것', '사람', '때', '곳', '해', '점', '줄', '수', '일', '번', '앞', '뒤', '위', '아래', '안', '밖'
}

def decompose(syllable):
    if not ('가' <= syllable <= '힣'):
        return None
    code = ord(syllable) - 0xAC00
    final = code % 28
    medial = (code // 28) % 21
    initial = (code // 28) // 21
    return initial, medial, final

def compose(initial, medial, final):
    return chr(0xAC00 + (initial * 21 + medial) * 28 + final)

def clean_text(s):
    return re.sub(r'[\s\.,\?!~·\-_\"\'\(\)\[\]《》0-9]+', '', s)

def get_korean_variants(meaning):
    tokens = re.split(r'[,/·~()\s]+', meaning)
    variants = set()
    for tok in tokens:
        tok = tok.strip()
        if not tok:
            continue
        variants.add(clean_text(tok))

        # ㅂ irregular (e.g. 아름답다 -> 아름다운, 아름다워, 아름다우)
        if len(tok) >= 2 and tok.endswith('다'):
            char = tok[-2]
            d = decompose(char)
            if d and d[2] == 17:
                no_b = compose(d[0], d[1], 0)
                prefix = clean_text(tok[:-2] + no_b)
                variants.update({prefix + '운', prefix + '워', prefix + '우', prefix + '웠'})

        # 르 irregular (e.g. 빠르다 -> 빨라, 빠른, 자르다 -> 잘라)
        if len(tok) >= 3 and tok.endswith('르다'):
            target = tok[-3]
            d = decompose(target)
            if d and d[2] == 0:
                with_l = compose(d[0], d[1], 8)
                prefix = clean_text(tok[:-3] + with_l)
                variants.update({prefix + '라', prefix + '러', prefix + '른', prefix + '랐', prefix + '렀'})

        if tok.endswith('하다') and len(tok) > 2:
            root = clean_text(tok[:-2])
            variants.update({root, root + '하', root + '해', root + '한', root + '했', root + '하는'})
        elif tok.endswith('되다') and len(tok) > 2:
            root = clean_text(tok[:-2])
            variants.update({root, root + '되', root + '돼', root + '된', root + '됐', root + '되는'})
        elif tok.endswith('다') and len(tok) > 1:
            stem = clean_text(tok[:-1])
            variants.add(stem)
            if stem.endswith('이'):
                variants.add(stem[:-1] + '여')
            elif stem.endswith('우'):
                variants.add(stem[:-1] + '워')
    return {v for v in variants if v}

def audit_dataset(csv_path, ex_col, lang_name):
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} does not exist.")
        return None

    with open(csv_path, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    total_content = 0
    matched = 0
    mismatches = []

    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        w = r['Word'].lower().strip()
        m = r['Meaning'].strip()
        ex = r[ex_col].strip()

        # Filter out functional / grammatical auxiliary entries
        if w in FUNCTIONAL_WORDS or m in FUNCTIONAL_MEANINGS or len(m) <= 1:
            continue

        total_content += 1

        if not ex:
            mismatches.append({
                'rank': rank,
                'word': r['Word'],
                'meaning': m,
                'example': ex,
                'score': 100.0,
                'reason': '예문 누락(Empty)'
            })
            continue

        if '관련 실전 예문입니다' in ex:
            mismatches.append({
                'rank': rank,
                'word': r['Word'],
                'meaning': m,
                'example': ex,
                'score': 90.0 + len(m),
                'reason': '더미 템플릿 예문'
            })
            continue

        if any(c in ex for c in ['《', '》', '1.', '2.', '3.']) and ('명사' in ex or '동사' in ex or '숙어' in ex):
            mismatches.append({
                'rank': rank,
                'word': r['Word'],
                'meaning': m,
                'example': ex,
                'score': 85.0 + len(m),
                'reason': '사전 원문 태그 잔존'
            })
            continue

        clean_ex = clean_text(ex)
        variants = get_korean_variants(m)
        found = False
        for v in variants:
            if v and v in clean_ex:
                found = True
                break

        if found:
            matched += 1
        else:
            # Score semantic mismatch based on word specificity
            score = float(len(clean_text(m)) * 3 + len(w))
            mismatches.append({
                'rank': rank,
                'word': r['Word'],
                'meaning': m,
                'example': ex,
                'score': score,
                'reason': '핵심 의미 미포함'
            })

    mismatches.sort(key=lambda x: -x['score'])
    match_pct = (matched / total_content * 100.0) if total_content else 0.0

    print(f"\n=======================================================")
    print(f"📊 [{lang_name} 마스터 데이터 예문-뜻 문맥 교차 검증]")
    print(f"=======================================================")
    print(f"• 전체 어휘 수: {len(rows)}개")
    print(f"• 평가 대상 내용어: {total_content}개 (기능어/대명사/단음절 제외)")
    print(f"• 예문-뜻 일치 어휘: {matched}개 ({match_pct:.2f}%)")
    print(f"• 문맥 불일치 의심 어휘: {len(mismatches)}개 ({100.0 - match_pct:.2f}%)")
    print(f"\n[상위 20개 불일치 의심 리포트]")
    print(f"{'Rank':>5} | {'Word':<16} | {'Meaning':<15} | {'점수':>5} | {'사유':<14} | {'Example_KO'}")
    print("-" * 95)
    for d in mismatches[:20]:
        ex_preview = d['example'][:32] + '...' if len(d['example']) > 32 else d['example']
        print(f"{d['rank']:5d} | {d['word']:<16} | {d['meaning']:<15} | {d['score']:5.1f} | {d['reason']:<14} | {ex_preview}")

    return {
        'total': total_content,
        'matched': matched,
        'pct': match_pct,
        'mismatches': mismatches
    }

if __name__ == '__main__':
    es_res = audit_dataset(SPANISH_CSV, 'Example_KO', '스페인어')
    en_res = audit_dataset(ENGLISH_CSV, 'Example_KO', '영어')

