#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scan_semantic_anomalies.py
english_5000_master.csv 4,998개 전수 단어에 대해 표제어(Word)와 한글 뜻(Meaning) 간
시맨틱 코사인 유사도를 산출하여 0.35 미만의 번역 왜곡 이상치를 전수 색출하는 스크립트.
"""

import csv
import json
import math
import os
import re
from collections import Counter

MASTER_CSV = "english_5000_master.csv"
STANDARD_VOCAB_JSON = os.path.join("data", "education_vocab_3000.json")
OUTPUT_REPORT = os.path.join("reports", "semantic_outliers.csv")
THRESHOLD = 0.35

IRREGULARS = {
    'best': 'good', 'better': 'good', 'worse': 'bad', 'worst': 'bad',
    'myself': 'me', 'yourself': 'you', 'himself': 'him', 'herself': 'her',
    'themselves': 'them', 'ourselves': 'us', 'those': 'that', 'these': 'this',
    'went': 'go', 'gone': 'go', 'came': 'come', 'saw': 'see', 'seen': 'see',
    'did': 'do', 'done': 'do', 'had': 'have', 'made': 'make', 'said': 'say',
    'took': 'take', 'taken': 'take', 'got': 'get', 'gotten': 'get',
    'knew': 'know', 'known': 'know', 'thought': 'think', 'told': 'tell',
    'became': 'become', 'left': 'leave', 'felt': 'feel', 'put': 'put',
    'brought': 'bring', 'began': 'begin', 'kept': 'keep', 'held': 'hold',
    'wrote': 'write', 'written': 'write', 'stood': 'stand', 'heard': 'hear',
    'let': 'let', 'meant': 'mean', 'set': 'set', 'met': 'meet', 'run': 'run',
    'ran': 'run', 'paid': 'pay', 'sat': 'sit', 'spoke': 'speak', 'spoken': 'speak',
    'lay': 'lie', 'led': 'lead', 'read': 'read', 'grew': 'grow', 'lost': 'lose',
    'fall': 'fall', 'fell': 'fall', 'fallen': 'fall', 'sent': 'send', 'built': 'build',
    'understood': 'understand', 'drew': 'draw', 'drawn': 'draw', 'spent': 'spend',
    'broke': 'break', 'broken': 'break', 'fucking': 'fuck', 'shit': 'shit'
}

SYNONYMS = [
    {'나', '내게', '나를', '내가', '나의', '나 자신'},
    {'너', '네게', '너를', '네가', '너의', '당신', '너 자신', '당신 자신'},
    {'그', '그는', '그를', '그의', '그 자신'},
    {'그녀', '그녀는', '그녀를', '그녀의', '그녀 자신'},
    {'우리', '우리는', '우리를', '우리의', '우리 자신'},
    {'그들', '그들은', '그들을', '그들의', '그것들', '저것들'},
    {'최고', '최고의', '가장', '우수한'},
    {'처럼', '대로', '같이', '만큼'},
    {'오', '아', '저런', '어머나', '이런'},
    {'누구나', '모두', '모든 사람', '다'},
    {'누군가', '누군', '아무도', '아무나', '사람'},
    {'보다', '비하여', '에 비해'},
    {'좋은', '즐거운', '훌륭한', '멋진'},
    {'어느', '모든', '각각의', '매'},
    {'나쁜', '사악한', '틀린', '잘못된'},
    {'굳은', '단단한', '견고한', '딱딱한', '어려운', '힘든'},
    {'떠난', '사라진', '가버린'},
    {'지독한', '형편없는', '빌어먹을'}
]

def check_synonym(w1, w2):
    for group in SYNONYMS:
        if any(w1 in item or item in w1 for item in group) and any(w2 in item or item in w2 for item in group):
            return True
    return False

def decompose_hangul(char):
    if not ('\uac00' <= char <= '\ud7a3'):
        return char
    code = ord(char) - 0xac00
    cho = code // (21 * 28)
    jung = (code % (21 * 28)) // 28
    jong = code % 28
    CHOS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
    JUNGS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
    JONGS = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
    return CHOS[cho] + JUNGS[jung] + (JONGS[jong] if jong > 0 else '')

def text_to_jamo(text):
    return ''.join(decompose_hangul(c) for c in text)

def get_ngrams(text, ns=(2, 3)):
    jamo = text_to_jamo(text)
    ngrams = []
    for n in ns:
        if len(jamo) < n:
            ngrams.append(jamo)
        else:
            ngrams.extend([jamo[i:i+n] for i in range(len(jamo)-n+1)])
    return Counter(ngrams)

def cosine_similarity(v1, v2):
    inter = set(v1.keys()) & set(v2.keys())
    dot = sum(v1[k] * v2[k] for k in inter)
    norm1 = math.sqrt(sum(v*v for v in v1.values()))
    norm2 = math.sqrt(sum(v*v for v in v2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

def compute_similarity(m, target_text):
    m = m.strip()
    target_text = target_text.strip()
    if not m or not target_text:
        return 0.0
    if m in target_text or target_text in m:
        return 1.0
    v_m = get_ngrams(m)
    words = re.findall(r'[\w가-힣]+', target_text)
    max_sim = 0.0
    for w in words:
        if m in w or w in m:
            return 1.0
        if check_synonym(m, w):
            return 0.95
        v_w = get_ngrams(w)
        sim = cosine_similarity(v_m, v_w)
        if sim > max_sim:
            max_sim = sim
    return max_sim

def load_standard_dictionary(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    edu_dict = {}
    for item in data:
        w = item['word'].strip().lower()
        meanings = []
        for m_entry in item.get('meanings', []):
            meanings.extend(m_entry.get('ko', []))
        edu_dict[w] = meanings
        for derived in item.get('derived', []):
            edu_dict[derived.strip().lower()] = meanings
    return edu_dict

def main():
    print("=" * 70)
    print(" 영단어-한글 뜻 시맨틱 유사도 전수 스캔 (scan_semantic_anomalies.py)")
    print("=" * 70)

    edu_dict = load_standard_dictionary(STANDARD_VOCAB_JSON)
    print(f"[*] 표준 사전 DB 로드 완료: {len(edu_dict)}개 어휘 매핑 가능")

    if not os.path.exists(MASTER_CSV):
        print(f"[!] 오류: {MASTER_CSV} 파일이 존재하지 않습니다.")
        return

    outliers = []
    total_scanned = 0

    with open(MASTER_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_scanned += 1
            rank = int(row['Rank'])
            raw_w = row['Word'].strip().lower()
            m = row['Meaning'].strip()
            ex_ko = row['Example_KO'].strip()

            # 1. 예문 번역과의 문맥 시맨틱 유사도
            sim_context = compute_similarity(m, ex_ko)

            # 2. 표준 교육부 사전과의 정의 시맨틱 유사도
            w_lookup = IRREGULARS.get(raw_w, raw_w)
            sim_dict = 0.0
            if w_lookup in edu_dict:
                for dm in edu_dict[w_lookup]:
                    s = compute_similarity(m, dm)
                    if s > sim_dict:
                        sim_dict = s

            # 종합 시맨틱 유사도 점수 (문맥 또는 사전 정의 최고치)
            score = round(max(sim_context, sim_dict), 4)

            if score < THRESHOLD:
                outliers.append({
                    'Rank': rank,
                    'Word': row['Word'].strip(),
                    'Meaning': m,
                    'Similarity_Score': f"{score:.4f}",
                    'Example_KO': ex_ko
                })

    # 유사도 오름차순(가장 왜곡이 심한 항목 우선), 동률 시 Rank 오름차순 정렬
    outliers.sort(key=lambda x: (float(x['Similarity_Score']), x['Rank']))

    # 결과 리포트 저장
    os.makedirs(os.path.dirname(OUTPUT_REPORT), exist_ok=True)
    with open(OUTPUT_REPORT, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['Rank', 'Word', 'Meaning', 'Similarity_Score', 'Example_KO'])
        writer.writeheader()
        writer.writerows(outliers)

    print(f"[*] 전체 스캔 단어: {total_scanned}개")
    print(f"[*] 유사도 하위 이상치 총 검출 건수 (Score < {THRESHOLD}): {len(outliers)}건")
    print(f"[*] 결과 리포트 저장: {OUTPUT_REPORT}")
    print("-" * 70)
    print(" 최하위 20개 단어 비교표 (Rank | Word | 현재 Meaning | Similarity Score | Example_KO)")
    print("-" * 70)
    print(f"{'Rank':>5} | {'Word':<15} | {'현재 Meaning':<12} | {'Similarity':>10} | {'Example_KO'}")
    print("-" * 70)

    for item in outliers[:20]:
        print(f"{item['Rank']:>5} | {item['Word']:<15} | {item['Meaning']:<12} | {item['Similarity_Score']:>10} | {item['Example_KO']}")
    print("=" * 70)

if __name__ == "__main__":
    main()

