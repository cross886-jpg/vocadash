#!/usr/bin/env python3
"""
audit_and_fix_meanings.py
Performs a full automated scan across all 4,998 English words in data/english_5000_master.csv,
detects words with overly broad/abstract meanings or truncated particle fragments,
and applies the improved multi-step fallback extraction algorithm to resolve them.
"""

import csv
import json
import os
import re

MASTER_CSV = 'data/english_5000_master.csv'
EDU_JSON = 'data/education_vocab_3000.json'

ABSTRACT_WORDS = {
    '여자', '남자', '사람', '것', '때', '일', '곳', '점', '새끼', '곤봉', '개', '수', '등', '년', '쪽', '말',
    '과거', '복수형', '과거분사', '이름', '사전', '단위', '기호'
}

DIRECT_CONCEPTS = {
    'man': '남성', 'woman': '여성', 'person': '사람', 'human': '인간', 'thing': '것',
    'time': '시간', 'work': '일', 'job': '직업', 'place': '장소', 'point': '점',
    'horse': '말', 'year': '해', 'side': '쪽', 'name': '이름', 'past': '과거',
    'unit': '단원', 'dictionary': '사전', 'guy': '남자'
}

# English proper names transliteration for names that were previously tagged as '남자 이름'/'여자 이름'
NAME_TRANSLITERATIONS = {
    'sam': '샘', 'mary': '메리', 'alex': '알렉스', 'steve': '스티브', 'robert': '로버트',
    'chris': '크리스', 'charles': '찰스', 'amy': '에이미', 'kim': '김', 'jeff': '제프',
    'thomas': '토머스', 'kate': '케이트', 'dave': '데이브', 'simon': '사이먼', 'andy': '앤디',
    'tim': '팀', 'alan': '앨런', 'lisa': '리사', 'emily': '에밀리', 'walter': '월터',
    'carl': '칼', 'claire': '클레어', 'fred': '프레드', 'sean': '숀', 'susan': '수잔',
    'karen': '카렌', 'julie': '줄리', 'greg': '그렉', 'jones': '존스', 'jamie': '제이미',
    'marty': '마티', 'anne': '앤', 'marie': '마리', 'doug': '더그', 'abby': '애비',
    'linda': '린다', 'katie': '케이티', 'roy': '로이', 'todd': '토드', 'lou': '루',
    'jessica': '제시카', 'steven': '스티븐', 'justin': '저스틴', 'betty': '베티', 'edward': '에드워드',
    'marcus': '마커스', 'nathan': '네이선', 'margaret': '마가렛', 'catherine': '캐서린',
    'casey': '케이시', 'liz': '리즈', 'gus': '거스', 'nate': '네이트', 'olivia': '올리비아',
    'keith': '키스', 'malcolm': '말콤', 'ethan': '에단', 'elena': '엘레나', 'stanley': '스탠리',
    'rita': '리타', 'carrie': '캐리', 'ashley': '애슐리', 'julian': '줄리안', 'diane': '다이앤',
    'harold': '해럴드', 'monica': '모니카', 'zoe': '조이', 'marco': '마르코', 'karl': '칼',
    'natalie': '나탈리', 'janet': '자넷', 'raymond': '레이몬드', 'juan': '후안', 'neil': '닐',
    'quinn': '퀸', 'felix': '펠릭스', 'evan': '에반', 'christine': '크리스틴', 'ivan': '이반',
    'carla': '카를라', 'leslie': '레슬리', 'antonio': '안토니오', 'diego': '디에고', 'leonard': '레너드',
    'elliot': '엘리엇', 'jill': '질', 'dana': '다나', 'pierre': '피에르', 'adrian': '아드리안',
    'donald': '도널드', 'seth': '세스', 'ellie': '엘리', 'alicia': '알리시아', 'christina': '크리스티나',
    'eli': '엘리', 'samantha': '사만다', 'christopher': '크리스토퍼', 'dorothy': '도로시',
    'tracy': '트레이시', 'clara': '클라라', 'connor': '코너', 'paula': '폴라', 'jen': '젠',
    'audrey': '오드리', 'leon': '레온', 'walt': '월트', 'nora': '노라', 'jules': '줄스',
    'andrea': '안드레아', 'rosa': '로사', 'miles': '마일스'
}

GRAMMAR_INFLECTIONS = {
    'men': '남자들', 'feet': '발들', 'teeth': '치아들', 'wolves': '늑대들', 'thieves': '도둑들', 'yourselves': '너희자신',
    'taken': '가져간', 'born': '태어난', 'gotten': '얻은', 'eaten': '먹은', 'thrown': '던져진', 'shown': '보여준',
    'driven': '운전된', 'begun': '시작된', 'kidding': '농담하는', 'entering': '들어가는', 'del': '델연산자'
}

DISALLOWED_PARTICLES = {'을', '를', '에', '의', '로', '와', '과', '서', '도', '은', '는', '이', '가', '만', '게', '할', '일', '고', '며', '랑', '않', '하', '되', '인', '된', '1'}
TRAILING_JOSA = ('을', '를', '에', '의', '으로', '로', '와', '과', '에서', '에게', '이', '가')

def clean_definition(text):
    if not text:
        return ''
    text = re.sub(r'\(.*?\)', '', text)
    text = re.sub(r'\[.*?\]', '', text)
    text = text.replace('~', ' ').replace(',', ' ').replace('/', ' ')
    text = re.sub(r'^(?:을|를|에|의|로|으로|와|과|보다|에서)\s+', '', text)
    return re.sub(r'\s+', ' ', text).strip()

def extract_smart_fallback(word, edu_item, cur_meaning, example_ko):
    """
    개선된 지능형 의미 추출 및 다단계 폴백 알고리즘
    """
    w = word.lower().strip()
    if w in DIRECT_CONCEPTS:
        return DIRECT_CONCEPTS[w]
    if w in NAME_TRANSLITERATIONS:
        return NAME_TRANSLITERATIONS[w]
    if w in GRAMMAR_INFLECTIONS:
        return GRAMMAR_INFLECTIONS[w]

    all_defs = []
    if edu_item:
        for mg in edu_item.get('meanings', []):
            for k in mg.get('ko', []):
                cd = clean_definition(k)
                if cd:
                    all_defs.append(cd)

    if not all_defs:
        return cur_meaning

    # 1단계: 단일어이면서 추상어가 아니고 조사 파편이 아닌 온전한 어휘 탐색
    clean_singles = [
        d for d in all_defs
        if ' ' not in d and d not in ABSTRACT_WORDS and not any(d.endswith(j) for j in TRAILING_JOSA) and d not in DISALLOWED_PARTICLES
    ]
    if clean_singles:
        # 예문 해석에 매칭되는 단어가 있다면 최우선 채택
        if example_ko:
            for cs in clean_singles:
                if cs in example_ko:
                    return cs
        return clean_singles[0]

    # 2단계: 구문(Phrase) 형태인 경우, 추상 수식어 배제 및 핵심 명사/어간 추출 또는 복합어 응축
    for d in all_defs:
        tokens = d.split()
        # 선두 수식어가 추상어인 경우(예: '여자 형제'), 후미의 핵심 명사('자매' or '형제') 추출
        if tokens[0] in ABSTRACT_WORDS and len(tokens) >= 2:
            head = tokens[-1]
            if head not in ABSTRACT_WORDS and not any(head.endswith(j) for j in TRAILING_JOSA) and head not in DISALLOWED_PARTICLES:
                return head
        # 첫 단어의 조사를 제거하여 온전한 어휘 추출 (예: '스케이트를 타다' -> '스케이트', '냄새가 나다' -> '냄새')
        first = tokens[0]
        for j in ('을', '를', '가', '이'):
            if first.endswith(j) and len(first) > len(j):
                stem = first[:-len(j)]
                if stem not in ABSTRACT_WORDS and len(stem) >= 2 and stem not in DISALLOWED_PARTICLES:
                    return stem
        # 구문 전체를 자연스러운 복합어로 응축 (예: '아침 식사' -> '아침식사', '키가 큰' -> '키가큰')
        condensed = d.replace(' ', '')
        if not any(condensed.endswith(j) for j in ('을', '를', '가', '이')) and condensed not in DISALLOWED_PARTICLES:
            return condensed

    return cur_meaning

def main():
    with open(EDU_JSON, 'r', encoding='utf-8') as f:
        edu_list = json.load(f)
    edu_map = {item['word'].lower().strip(): item for item in edu_list}

    with open(MASTER_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print("=" * 70)
    print(" 🔍 불량 의심 단어 전수 자동 색출 및 지능형 폴백 교정 실행")
    print("=" * 70)

    # 1. 색출 조건 정의
    # (a) 지나치게 추상적이거나 범위가 넓은 불량 단어
    # (b) 조사 파편 형태로 잘려나간 단어
    # (c) 사전 multiword 정의에서 선두 토막만 잘려나간 단어
    detected_defects = []
    for r in rows:
        w = r['Word'].lower().strip()
        m = r['Meaning'].strip()
        ex_ko = r['Example_KO']

        is_defective = False
        reason = ""

        if m in ABSTRACT_WORDS and w not in DIRECT_CONCEPTS:
            is_defective = True
            reason = f"추상적/비특정 어휘('{m}')"
        elif m in ['냄새가', '키가', '눈이', '책임이', '스케이트를', '스키를', '휴식을', '가지고', '들어', '다치게']:
            is_defective = True
            reason = f"조사 파편 잔재('{m}')"
        elif m in ['오늘', '저녁', '아침', '가득', '가장', '사랑하는', '아무것도', '결코'] and w in ['tonight', 'dinner', 'breakfast', 'full', 'favorite', 'darling', 'none', 'never', 'supper']:
            is_defective = True
            reason = f"복합어 선두 파편('{m}')"

        if is_defective:
            detected_defects.append((r, reason))

    print(f"[*] 총 검출된 불량 의심 단어: {len(detected_defects)}건")

    # 2. 지능형 폴백 알고리즘으로 자동 교정
    corrected_list = []
    for r, reason in detected_defects:
        w = r['Word'].lower().strip()
        old_m = r['Meaning'].strip()
        ex_ko = r['Example_KO']
        edu_item = edu_map.get(w)

        new_m = extract_smart_fallback(w, edu_item, old_m, ex_ko)
        if new_m != old_m:
            r['Meaning'] = new_m
            corrected_list.append((r['Rank'], r['Word'], old_m, new_m, reason))

    print(f"[*] 성공적으로 교정 완료된 단어: {len(corrected_list)}건\n")

    # 3. CSV 갱신 저장
    with open(MASTER_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"💾 '{MASTER_CSV}' 파일 갱신 저장 완료.")

    # 4. 상위 30개 교정 내역 출력
    print("\n[교정된 불량 단어 목록 상위 30개 (Word | 이전 뜻 | 교정된 뜻 | 색출 사유)]")
    print("-" * 75)
    print(f"{'Rank':<6} | {'Word':<14} | {'이전 뜻':<10} | {'교정된 뜻':<12} | {'색출 사유'}")
    print("-" * 75)
    for rank, word, old_m, new_m, reason in corrected_list[:30]:
        print(f"{rank:<6} | {word:<14} | {old_m:<10} | {new_m:<12} | {reason}")
    print("-" * 75)

if __name__ == '__main__':
    main()

