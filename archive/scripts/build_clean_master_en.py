#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_clean_master_en.py
교육부 공식 3,000 기본 어휘 DB(data/education_vocab_3000.json) 및 표준 사전(Kengdic)을 소스로 삼아
english_5000_master.csv(4,998단어)를 난이도(A1 -> A2 -> B1 -> B2 -> C1) 및 유닛 순서로
완벽히 정렬하여 새로 빌드하는 스크립트.
"""

import csv
import json
import os
import re

EDU_VOCAB_PATH = os.path.join("data", "education_vocab_3000.json")
KENGDIC_PATH = os.path.join("data", "kengdic.tsv")
BACKUP_RANK_PATH = os.path.join("archive", "backups", "english_5000_master.csv.bak")
OUTPUT_CSV_PATH = os.path.join("data", "english_5000_master.csv")

# 1순위 대표 뜻 지정 단어 (다의어/오염 방지)
SPECIAL_MEANINGS = {
    'club': '클럽',
    'kid': '아이',
    'red': '빨간색',
    'rock': '바위',
    'spring': '봄',
    'bank': '은행',
    'smart': '똑똑한',
    'present': '선물',
    'match': '경기',
    'bear': '곰',
    'hello': '안녕하세요',
    'yes': '네',
    'no': '아니요',
    'i': '나',
    'you': '당신',
    'water': '물',
    'coffee': '커피',
    'friend': '친구',
    'family': '가족',
    'house': '집',
    'good': '좋은',
    'bar': '막대',
    'bow': '절하다',
    'bark': '짖다',
    'bat': '박쥐',
    'fan': '부채',
    'fine': '좋은',
    'fly': '날다',
    'left': '왼쪽',
    'letter': '편지',
    'light': '빛',
    'mean': '의미하다',
    'mine': '나의 것',
    'minute': '분',
    'miss': '그리워하다',
    'nail': '손톱',
    'park': '공원',
    'pen': '펜',
    'plant': '식물',
    'play': '놀다',
    'point': '점',
    'pound': '파운드',
    'ring': '반지',
    'row': '줄',
    'ruler': '자',
    'saw': '톱',
    'scale': '저울',
    'ship': '배',
    'sign': '신호',
    'sink': '가라앉다',
    'sound': '소리',
    'spot': '장소',
    'stamp': '우표',
    'star': '별',
    'stick': '막대기',
    'suit': '정장',
    'tear': '눈물',
    'tie': '묶다',
    'tip': '끝',
    'train': '기차',
    'trip': '여행',
    'watch': '시계',
    'wave': '파도',
    'well': '잘',
    'wind': '바람',
    'might': '힘',
    'without': '없이',
    'million': '백만',
    'shall': '할 것이다',
    'blood': '피',
    'sick': '아픈',
    'apartment': '아파트',
    'system': '체계',
    'code': '암호',
    'lot': '많은 것',
    'anyone': '누구나',
    'someone': '누군가',
    'everyone': '모두',
    'nobody': '아무도'
}

SPECIAL_EXAMPLES = {
    'hello': ('Hello nice to meet you.', '안녕하세요 만나서 반갑습니다.'),
    'yes': ('Yes I agree with you.', '네 당신 의견에 동의합니다.'),
    'no': ('No I am fine thank you.', '아니요 저는 괜찮습니다.'),
    'i': ('I go to school every day.', '나는 매일 학교에 간다.'),
    'you': ('How are you doing today?', '오늘 하루 어떻게 지내시나요?'),
    'water': ('I drink fresh water every day.', '나는 매일 신선한 물을 마신다.'),
    'coffee': ('A cup of hot coffee please.', '따뜻한 커피 한 잔 부탁합니다.'),
    'friend': ('She is my best friend.', '그녀는 나의 가장 친한 친구다.'),
    'good': ('Have a very good day.', '오늘도 좋은 하루 보내세요.'),
    'family': ('I love my family deeply.', '나는 우리 가족을 깊이 사랑한다.'),
    'house': ('Welcome to my sweet house.', '나의 아늑한 집에 온 것을 환영한다.'),
    'club': ('I joined the school soccer club.', '나는 학교 축구 클럽에 가입했다.'),
    'kid': ('The kid is playing happily outside.', '그 아이는 밖에서 즐겁게 놀고 있다.'),
    'red': ('She wore a bright red dress today.', '그녀는 오늘 밝은 빨간색 드레스를 입었다.'),
    'rock': ('I sat down on a large rock.', '나는 커다란 바위 위에 앉았다.'),
    'spring': ('Beautiful flowers bloom warmly in spring.', '꽃들이 따뜻한 봄에 아름답게 핀다.'),
    'bank': ('My father works at a central bank.', '우리 아버지는 중앙 은행에서 근무하신다.'),
    'smart': ('She is the smartest student in class.', '그녀는 반에서 가장 똑똑한 학생이다.'),
    'present': ('He gave her a wonderful birthday present.', '그는 그녀에게 멋진 생일 선물을 주었다.'),
    'match': ('We watched an exciting soccer match yesterday.', '우리는 어제 흥미진진한 축구 경기를 보았다.'),
    'bear': ('A large brown bear lives in the forest.', '커다란 갈색 곰이 숲속에 산다.')
}

def clean_text_field(text):
    """쉼표, 슬래시, 괄호, 물결표, 특수기호 및 다중 공백 제거"""
    if not text:
        return ""
    text = re.sub(r'\(.*?\)', '', text)
    text = re.sub(r'\[.*?\]', '', text)
    text = text.replace(',', ' ').replace('/', ' ').replace('~', ' ')
    text = text.replace('"', '').replace("'", "")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_meaning_field(text, word):
    w_lower = word.lower().strip()
    if w_lower in SPECIAL_MEANINGS:
        return SPECIAL_MEANINGS[w_lower]
    cleaned = clean_text_field(text)
    # 단일 대표 뜻 추출
    cleaned = cleaned.split()[0] if cleaned.split() else w_lower
    return cleaned

def load_kengdic(filepath):
    kengdic = {}
    if not os.path.exists(filepath):
        return kengdic
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            surface = row.get('surface', '').strip()
            gloss = row.get('gloss', '').strip().lower()
            if not surface or not gloss:
                continue
            parts = re.split(r'[,;]+', gloss)
            for p in parts:
                p = re.sub(r'^(to\s+|a\s+|an\s+|the\s+)', '', p.strip())
                p = re.sub(r'\s+', ' ', p).strip()
                if re.match(r'^[a-z]{3,}$', p) and p not in kengdic:
                    s_clean = clean_text_field(surface)
                    if s_clean:
                        kengdic[p] = s_clean
    return kengdic

def build_clean_master():
    print("=" * 70)
    print(" english_5000_master.csv 수준별 정렬 및 클린 빌드 시작")
    print("=" * 70)

    # 1. Kengdic 사전 로드
    kengdic = load_kengdic(KENGDIC_PATH)
    print(f"[*] Kengdic 사전 로드 완료: {len(kengdic)}개 표제어 색인")

    # 2. 교육부 공식 3,000 기본 어휘 DB 로드
    if not os.path.exists(EDU_VOCAB_PATH):
        raise FileNotFoundError(f"{EDU_VOCAB_PATH} 파일이 없습니다.")

    with open(EDU_VOCAB_PATH, 'r', encoding='utf-8') as f:
        edu_list = json.load(f)

    print(f"[*] 교육부 공식 DB 로드 완료: {len(edu_list)}개 어휘")

    # 교육부 어휘 수준별 분류: 초등(800), 중고공통(1,200), 선택(1,000)
    edu_elem = []    # 초등 (800) -> A1 (Rank 1 ~ 800)
    edu_mid_high = [] # 중고공통 (1,200) -> 700개 A2 (Rank 801 ~ 1,500), 500개 B1 (Rank 1,501 ~ 2,000)
    edu_opt = []     # 선택 (1,000) -> B1 (Rank 2,001 ~ 3,000)

    for item in edu_list:
        lvl = item.get('level', '')
        if lvl == '초등':
            edu_elem.append(item)
        elif lvl == '중고공통':
            edu_mid_high.append(item)
        else:
            edu_opt.append(item)

    print(f"    - 초등 어휘: {len(edu_elem)}개")
    print(f"    - 중고공통 어휘: {len(edu_mid_high)}개")
    print(f"    - 선택(심화) 어휘: {len(edu_opt)}개")

    # 빈도 순위 로드 (실제 일상 빈도 순으로 정렬하여 알파벳 순서 편중 전면 해소)
    backup_rank = {}
    if os.path.exists(BACKUP_RANK_PATH):
        with open(BACKUP_RANK_PATH, 'r', encoding='utf-8') as f:
            for idx, r in enumerate(csv.DictReader(f)):
                w = r['Word'].lower().strip()
                if w not in backup_rank:
                    backup_rank[w] = idx + 1

    # 각 수준 그룹 내에서 실제 일상 빈도 순서(Frequency Rank)로 정렬하여 A-Z 알파벳 편중 배제
    edu_elem.sort(key=lambda x: backup_rank.get(x['word'].lower(), 99999))
    edu_mid_high.sort(key=lambda x: backup_rank.get(x['word'].lower(), 99999))
    edu_opt.sort(key=lambda x: backup_rank.get(x['word'].lower(), 99999))

    # 3. 3,000단어 기본 리스트 구성
    vocab_3000_rows = []
    edu_words_set = set(item['word'].strip().lower() for item in edu_list)
    seen_words = set()

    def process_edu_item(item, target_level):
        w = item['word'].strip().lower()
        if w in seen_words:
            return None
        seen_words.add(w)

        # 뜻 추출
        meaning = ""
        if w in SPECIAL_MEANINGS:
            meaning = SPECIAL_MEANINGS[w]
        else:
            for mg in item.get('meanings', []):
                for k in mg.get('ko', []):
                    k_cl = clean_meaning_field(k, w)
                    if k_cl:
                        meaning = k_cl
                        break
                if meaning:
                    break
        if not meaning:
            meaning = clean_meaning_field(item.get('meanings', [{}])[0].get('ko', [''])[0], w)

        # 발음기호
        pron = item.get('ipa', '').strip()

        # 예문 및 해석
        if w in SPECIAL_EXAMPLES:
            ex_en, ex_ko = SPECIAL_EXAMPLES[w]
        else:
            exs = item.get('examples', [])
            if exs:
                ex_en = clean_text_field(exs[0].get('en', ''))
                ex_ko = clean_text_field(exs[0].get('ko', ''))
            else:
                ex_en = f"I use the word {w} every day."
                ex_ko = f"나는 매일 {meaning} 뜻의 단어를 사용한다."

        ex_en = clean_text_field(ex_en)
        ex_ko = clean_text_field(ex_ko)

        return {
            'Word': w,
            'Level': target_level,
            'Meaning': meaning,
            'Pronunciation': pron,
            'Example_EN': ex_en,
            'Example_KO': ex_ko
        }

    # Rank 1 ~ 800: 초등 (A1)
    for item in edu_elem:
        row = process_edu_item(item, 'A1')
        if row:
            vocab_3000_rows.append(row)

    # Rank 801 ~ 1,500: 중고공통 상위 700단어 (A2)
    for item in edu_mid_high[:700]:
        row = process_edu_item(item, 'A2')
        if row:
            vocab_3000_rows.append(row)

    # Rank 1,501 ~ 2,000: 중고공통 잔여 500단어 (B1)
    for item in edu_mid_high[700:]:
        row = process_edu_item(item, 'B1')
        if row:
            vocab_3000_rows.append(row)

    # Rank 2,001 ~ 3,000: 선택 1,000단어 (B1)
    for item in edu_opt:
        row = process_edu_item(item, 'B1')
        if row:
            vocab_3000_rows.append(row)

    print(f"[*] 교육부 3,000단어 정규화 완료: {len(vocab_3000_rows)}개 어휘")

    # 4. 잔여 1,998단어 (Rank 3,001 ~ 4,998) 선별: 수능 실전~고급 어휘 (Level: B2 ~ C1)
    needed_adv = 4998 - len(vocab_3000_rows)
    print(f"[*] 고급 어휘(B2/C1) 필요 수량: {needed_adv}개")

    banned_words = {
        'shit', 'fuck', 'fucking', 'bitch', 'asshole', 'damn', 'bastards', 'bastard', 'crap', 'sucks',
        'amanda', 'morgan', 'johnny', 'tommy', 'dick', 'wanna', 'gonna', 'gotta', 'couldn', 'didn',
        'wouldn', 'shouldn', 'hasn', 'haven', 'isn', 'aren', 'wasn', 'weren', 'don', 'won', 'gwen', 'stella',
        'freddy', 'allison', 'peggy', 'murphy', 'vanessa', 'shitty', 'bobby', 'billy',
        'sammy', 'charlie', 'eddie', 'lucy', 'annie', 'jackie', 'sarah', 'rachel',
        'jason', 'kevin', 'jerry', 'jimmy', 'danny', 'tony', 'larry', 'brian', 'gary',
        'eric', 'scott', 'kelly', 'terry', 'willy', 'ronnie', 'ricky', 'frankie'
    }

    def is_trivial_inflection(w):
        # 3000 기본 어휘 기준 단순 복수형(s) 및 과거형(ed) 필터링
        if w.endswith('s') and not w.endswith('ss') and not w.endswith('ous'):
            if w[:-1] in edu_words_set or w[:-2] in edu_words_set:
                return True
        if w.endswith('ed'):
            if w[:-2] in edu_words_set or w[:-1] in edu_words_set:
                return True
        return False

    primary_pool = []
    fallback_pool = []
    if os.path.exists(BACKUP_RANK_PATH):
        with open(BACKUP_RANK_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                w = r['Word'].lower().strip()
                if w in seen_words or w in banned_words or not re.match(r'^[a-z]{2,}$', w):
                    continue

                ex_en = clean_text_field(r.get('Example_EN', ''))
                ex_ko = clean_text_field(r.get('Example_KO', ''))
                if not ex_en or not ex_ko:
                    continue

                m = kengdic.get(w) or r.get('Meaning', '').strip()
                m_cl = clean_meaning_field(m, w)
                if not m_cl:
                    continue

                item = {
                    'Word': w,
                    'Meaning': m_cl,
                    'Pronunciation': r.get('Pronunciation', '').strip(),
                    'Example_EN': ex_en,
                    'Example_KO': ex_ko,
                    'Original_Rank': int(r['Rank']) if r['Rank'].isdigit() else 9999
                }

                if is_trivial_inflection(w):
                    fallback_pool.append(item)
                else:
                    primary_pool.append(item)

    # 원본 빈도순으로 정렬
    primary_pool.sort(key=lambda x: backup_rank.get(x['Word'], x['Original_Rank']))
    fallback_pool.sort(key=lambda x: backup_rank.get(x['Word'], x['Original_Rank']))

    selected_adv = []
    for item in primary_pool:
        if item['Word'] not in seen_words:
            seen_words.add(item['Word'])
            selected_adv.append(item)
            if len(selected_adv) == needed_adv:
                break

    if len(selected_adv) < needed_adv:
        for item in fallback_pool:
            if item['Word'] not in seen_words:
                seen_words.add(item['Word'])
                selected_adv.append(item)
                if len(selected_adv) == needed_adv:
                    break

    print(f"[*] 고급 어휘 선별 완료: {len(selected_adv)}개")

    # B2와 C1으로 수준 분할 (1,200개 B2, 798개 C1)
    b2_count = 1200
    for idx, item in enumerate(selected_adv):
        if idx < b2_count:
            item['Level'] = 'B2'
        else:
            item['Level'] = 'C1'

    all_vocab = vocab_3000_rows + selected_adv
    print(f"[*] 총 어휘 병합 완료: {len(all_vocab)}개 (목표: 4,998개)")

    if len(all_vocab) != 4998:
        raise ValueError(f"단어 수 불일치: {len(all_vocab)} != 4998")

    # 5. Rank, Unit_ID, Node_ID 번호 부여 및 최종 정규화
    final_rows = []
    level_counts = {'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0, 'C1': 0}

    for idx, item in enumerate(all_vocab):
        rank = idx + 1
        u_num = ((rank - 1) // 30) + 1
        idx_in_unit = ((rank - 1) % 30) + 1

        if idx_in_unit <= 10:
            node_id = f"en_u{u_num}_n1"
        elif idx_in_unit <= 20:
            node_id = f"en_u{u_num}_n2"
        else:
            node_id = f"en_u{u_num}_n5"

        unit_id = f"unit_{u_num:03d}"
        lvl = item['Level']
        level_counts[lvl] = level_counts.get(lvl, 0) + 1

        final_rows.append({
            'Rank': str(rank),
            'Word': item['Word'],
            'Level': lvl,
            'Unit_ID': unit_id,
            'Node_ID': node_id,
            'Meaning': item['Meaning'],
            'Pronunciation': item['Pronunciation'],
            'Example_EN': item['Example_EN'],
            'Example_KO': item['Example_KO']
        })

    # 6. CSV 저장
    fieldnames = ['Rank', 'Word', 'Level', 'Unit_ID', 'Node_ID', 'Meaning', 'Pronunciation', 'Example_EN', 'Example_KO']
    with open(OUTPUT_CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_rows)

    print(f"[*] {OUTPUT_CSV_PATH} 저장 완료 ({len(final_rows)}개 행)")
    print("-" * 70)
    print(f"난이도별 어휘 분포: {level_counts}")
    print("=" * 70)
    return level_counts, final_rows

if __name__ == '__main__':
    build_clean_master()
