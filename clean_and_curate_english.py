#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
clean_and_curate_english.py
english_5000_master.csv를 30단어 표준 규격(Stage 1: 10단어, Stage 2: 10단어, Stage 3: 10단어)으로
Unit_ID('unit_XXX') 및 Node_ID('en_uX_nY')를 정규화하여 저장하는 스크립트.
"""

import csv
import os
import shutil

INPUT_FILE = "english_5000_master.csv"
BACKUP_FILE = "english_5000_master.csv.bak"

# 1. 안전 백업
if os.path.exists(INPUT_FILE):
    shutil.copyfile(INPUT_FILE, BACKUP_FILE)
    print(f"📦 안전 백업 완료: {BACKUP_FILE}")
else:
    print(f"❌ {INPUT_FILE} 파일이 없습니다.")
    exit(1)

# 2. 제거/치환 대상 토큰 노이즈
NOISE_MAP = {
    "'s": ("is", "이다 / 있다", "[이즈]", "He is my friend.", "그는 나의 친구입니다."),
    "'t": ("not", "아니다 / 않다", "[낫]", "It is not cold.", "춥지 않습니다."),
    "'m": ("am", "이다 / 있다", "[엠]", "I am ready.", "나는 준비되었습니다."),
    "'re": ("are", "이다 / 있다", "[아-]", "We are happy.", "우리는 행복합니다."),
    "'ll": ("will", "~할 것이다", "[윌]", "I will go there.", "나는 거기에 갈 것입니다."),
    "'ve": ("have", "가지다", "[해브]", "They have time.", "그들은 시간이 있습니다."),
    "'d": ("would", "~하곤 했다", "[우드]", "I would like that.", "그것이 좋겠습니다.")
}

# 3. Unit 1 추천 스타터 단어 (30단어 규격: Stage 1 10단어, Stage 2 10단어, Stage 3 10단어)
STARTER_ORDER = [
    # Stage 1 (1~10): 첫 인사 & 생존 명사 & 기초 연결
    "hello", "thank you", "yes", "no", "friend", "coffee", "water", "is", "good", "and",
    # Stage 2 (11~20): 안부 & 장소/가족 & 기초 동사/대명사
    "fine", "house", "in", "family", "have", "you", "i", "with", "book", "a",
    # Stage 3 (21~30): 정관사 & 기본 이동/행동 & 핵심 어휘
    "the", "go", "see", "to", "that", "make", "all", "time", "it", "not"
]

FALLBACK_INFO = {
    "hello": ("hello", "A1", "안녕하세요 / 안녕", "[헬로우]", "Hello nice to meet you.", "안녕하세요 만나서 반갑습니다."),
    "thank you": ("thank you", "A1", "감사합니다", "[땡큐]", "Thank you for your help.", "도와주셔서 감사합니다."),
    "yes": ("yes", "A1", "네 / 맞아요", "[예스]", "Yes I agree with you.", "네 당신 의견에 동의합니다."),
    "no": ("no", "A1", "아니요", "[노우]", "No I am fine.", "아니요 저는 괜찮습니다."),
    "friend": ("friend", "A1", "친구", "[프렌드]", "He is my best friend.", "그는 나의 가장 친한 친구입니다."),
    "coffee": ("coffee", "A1", "커피", "[커피]", "A cup of coffee please.", "따뜻한 커피 한 잔 부탁합니다."),
    "water": ("water", "A1", "물", "[워터]", "I drink fresh water every day.", "나는 매일 신선한 물을 마십니다."),
    "is": ("is", "A1", "이다 / 있다", "[이즈]", "He is my friend.", "그는 나의 친구입니다."),
    "good": ("good", "A1", "좋은", "[굿]", "Have a good day.", "오늘도 좋은 하루 보내세요."),
    "and": ("and", "A1", "그리고 / 와", "[앤드]", "You and I are a team.", "너와 나는 훌륭한 한 팀이다."),
    "fine": ("fine", "A1", "좋은 / 잘 지내는", "[파인]", "I am fine thank you.", "저는 잘 지내고 있습니다 감사합니다."),
    "house": ("house", "A1", "집", "[하우스]", "Welcome to my house.", "우리 집에 온 것을 환영합니다."),
    "in": ("in", "A1", "~ 안에 / 에서", "[인]", "She is in the library.", "그녀는 지금 도서관 안에 있습니다."),
    "family": ("family", "A1", "가족", "[패밀리]", "I love my family deeply.", "나는 나의 소중한 가족을 사랑합니다."),
    "have": ("have", "A1", "가지다 / 있다", "[해브]", "I have a question.", "궁금한 질문이 하나 있습니다."),
    "you": ("you", "A1", "너 / 당신", "[유]", "How are you doing today?", "오늘 하루 어떻게 지내시나요?"),
    "i": ("i", "A1", "나 / 저", "[아이]", "I am very happy today.", "나는 오늘 정말 행복합니다."),
    "with": ("with", "A1", "~와 함께", "[위드]", "Please walk with me.", "나와 함께 천천히 걸어가요."),
    "book": ("book", "A1", "책", "[북]", "This is an interesting book.", "이것은 대단히 흥미로운 책입니다."),
    "a": ("a", "A1", "하나의 / 어떤", "[어]", "I read a great story.", "나는 멋진 이야기를 하나 읽었습니다."),
    "the": ("the", "A1", "그 (정관사)", "[더]", "Look at the blue sky.", "저 푸른 하늘을 바라보세요."),
    "go": ("go", "A1", "가다", "[고우]", "Let us go to school.", "우리 함께 학교로 갑시다."),
    "see": ("see", "A1", "보다 / 알다", "[씨]", "I see a bright star.", "저기 밝은 별이 하나 보입니다."),
    "to": ("to", "A1", "~로 / ~에게", "[투]", "Welcome to our city.", "우리 아름다운 도시에 오신 것을 환영합니다."),
    "that": ("that", "A1", "저것 / 그", "[댓]", "That is a brilliant idea.", "그것은 참으로 훌륭한 생각입니다."),
    "make": ("make", "A1", "만들다", "[메이크]", "Make a wish tonight.", "오늘 밤 소원을 하나 빌어보세요."),
    "all": ("all", "A1", "모든 / 전부", "[올]", "All is well in the end.", "결국에는 모든 것이 다 잘 풀립니다."),
    "time": ("time", "A1", "시간", "[타임]", "Do you have time now?", "혹시 지금 시간 좀 있으신가요?"),
    "it": ("it", "A1", "그것 / 그 일", "[잇]", "It is a good idea.", "그것은 좋은 생각입니다."),
    "not": ("not", "A1", "아니다 / 않다", "[낫]", "It is not cold today.", "오늘은 날씨가 춥지 않습니다.")
}

raw_rows = []
word_map = {}

with open(INPUT_FILE, mode="r", encoding="utf-8-sig", errors="replace") as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if not row:
            continue
        if i == 0 and "Rank" in row[0]:
            continue

        while len(row) < 9:
            row.append("")

        word = row[1].strip()
        w_lower = word.lower()

        # 노이즈 단어 치환
        if w_lower in NOISE_MAP:
            nw, nm, np, n_es, n_ko = NOISE_MAP[w_lower]
            row[1] = nw
            row[5] = nm
            row[6] = np
            row[7] = n_es
            row[8] = n_ko
            w_lower = nw.lower()

        if w_lower not in word_map:
            word_map[w_lower] = row
        raw_rows.append(row)

# Unit 1 전용 30개 큐레이션 생성
curated_u1 = []
used_words = set()

for w in STARTER_ORDER:
    w_key = w.lower()
    used_words.add(w_key)
    if w_key in word_map and word_map[w_key][5].strip():
        r = list(word_map[w_key])
    else:
        fb = FALLBACK_INFO.get(w_key, (w, "A1", w, f"[{w}]", f"Sample sentence for {w}.", f"{w} 예문입니다."))
        r = ["", fb[0], fb[1], "unit_001", "", fb[2], fb[3], fb[4], fb[5]]
    curated_u1.append(r)

# 나머지 단어 목록 (Unit 1에 뽑힌 단어 제외)
remaining = [r for r in raw_rows if r[1].strip().lower() not in used_words]

# 전체 단어 30개 단위 정규화 (Stage 1: 10개, Stage 2: 10개, Stage 3: 10개)
all_data = curated_u1 + remaining
for idx, r in enumerate(all_data, start=1):
    r[0] = str(idx)
    u_idx = ((idx - 1) // 30) + 1
    pos_in_unit = (idx - 1) % 30
    if pos_in_unit < 10:
        n_num = 1
    elif pos_in_unit < 20:
        n_num = 2
    else:
        n_num = 5
    r[3] = f"unit_{u_idx:03d}"
    r[4] = f"en_u{u_idx}_n{n_num}"
    if not r[2]:
        r[2] = "A1" if u_idx <= 20 else ("A2" if u_idx <= 60 else "B1")

# 9대 표준 헤더 정의
headers = ["Rank", "Word", "Level", "Unit_ID", "Node_ID", "Meaning", "Pronunciation", "Example_EN", "Example_KO"]

with open(INPUT_FILE, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(headers)
    writer.writerows(all_data)

print("=" * 60)
print("✨ 영어 데이터 30단어 표준 규격 (Stage 1: 10, Stage 2: 10, Stage 3: 10) 정규화 완료!")
print("👉 Stage 1 (1~10): hello, thank you, yes, no, friend, coffee, water, is, good, and")
print("👉 Stage 2 (11~20): fine, house, in, family, have, you, i, with, book, a")
print("👉 Stage 3 (21~30): the, go, see, to, that, make, all, time, it, not")
print("👉 Node_ID 배정 규칙: 1~10번 -> en_u{U}_n1, 11~20번 -> en_u{U}_n2, 21~30번 -> en_u{U}_n5")
print(f"🎉 파일 업데이트 완료: {INPUT_FILE} (총 {len(all_data)}개 단어)")
print("=" * 60)
