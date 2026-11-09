#!/usr/bin/env python3
"""
purge_dummy_and_untranslated.py
Permanently eliminates:
1. All dummy template examples (e.g., '관련 실전 예문입니다', 'This is an example for', '단어를 사용합니다')
2. All untranslated / non-Hangul meanings (e.g., where Meaning == Word or contains no Korean)
3. All Spanish clitic verb distortions ('...해보세요' -> '~해 주다 / ~하다')
Across data/english_5000_master.csv and data/spanish_5000_master.csv.
"""

import csv
import os
import re
import subprocess
import sys

ENGLISH_CSV = 'data/english_5000_master.csv'
SPANISH_CSV = 'data/spanish_5000_master.csv'
CLEAN_BASE_CSV = 'archive/backups/english_5000_master.csv.clean_base'

SPECIFIC_EN_24 = {
    'chffffff': ('지지직잡음', 'The radio made a strange static sound: chffffff.', '라디오에서 지지직거리는 이상한 잡음이 났다.'),
    'somethin': ('무엇인가', 'There is somethin strange going on.', '무언가 이상한 일이 일어나고 있다.'),
    'yay': ('환호', 'Yay, we finally won the championship!', '와, 우리가 드디어 우승했어!'),
    'vince': ('빈스', 'Vince is studying hard for his final exam.', '빈스는 기말시험을 위해 열심히 공부하고 있다.'),
    'comin': ('오는 중', 'Wait for me, I am comin right now.', '나 기다려, 지금 바로 가는 중이야.'),
    'ii': ('로마 숫자 2', 'Chapter II explains the basic grammar rules.', '제2장은 기본 문법 규칙을 설명한다.'),
    'talkin': ('이야기하는', 'What are you talkin about?', '너 지금 무슨 이야기를 하고 있는 거야?'),
    'louise': ('루이스', 'Louise enjoys painting landscapes on weekends.', '루이스는 주말마다 풍경화 그리는 것을 즐긴다.'),
    'nicole': ('니콜', 'Nicole prepared a delicious dinner for us.', '니콜은 우리를 위해 맛있는 저녁 식사를 준비했다.'),
    'aii': ('아이쿠', 'Aii, I bumped my knee against the desk.', '아이쿠, 책상에 무릎을 세게 부딪쳤어.'),
    'liam': ('리암', 'Liam scored the winning goal in the final game.', '리암이 결승전에서 결승골을 터뜨렸다.'),
    'uhh': ('글쎄', 'Uhh, I need a moment to think about it.', '어, 그것에 대해 생각할 시간이 잠시 필요해.'),
    'travis': ('트래비스', 'Travis works as a software engineer downtown.', '트래비스는 도심에서 소프트웨어 엔지니어로 일한다.'),
    'lauren': ('로렌', 'Lauren plays the violin in the youth orchestra.', '로렌은 청소년 오케스트라에서 바이올린을 연주한다.'),
    'brandon': ('브랜든', 'Brandon adopted a cute puppy from the shelter.', '브랜든은 보호소에서 귀여운 강아지를 입양했다.'),
    'iike': ('좋아하다', 'I feel like going for a walk in the park.', '나는 공원에 산책하러 가고 싶다.'),
    'megan': ('메건', 'Megan is reading an exciting mystery novel.', '메건은 흥미진진한 추리 소설을 읽고 있다.'),
    'kang': ('강씨', 'Professor Kang gave an inspiring lecture today.', '강 교수님은 오늘 깊은 영감을 주는 강의를 하셨다.'),
    'gina': ('지나', 'Gina visited the local art museum yesterday.', '지나는 어제 지역 미술관을 방문했다.'),
    'chan': ('찬씨', 'Jackie Chan is famous for his martial arts movies.', '성룡(재키 찬)은 무술 영화로 유명하다.'),
    'mario': ('마리오', 'Mario runs a cozy Italian restaurant downtown.', '마리오는 시내에서 아늑한 이탈리아 식당을 운영한다.'),
    'singh': ('싱씨', 'Dr. Singh published a new research paper this month.', '싱 박사는 이번 달에 새로운 연구 논문을 발표했다.'),
    'trevor': ('트레버', 'Trevor loves taking photos of natural scenery.', '트레버는 자연 풍경 사진을 찍는 것을 아주 좋아한다.'),
    'jenna': ('제나', 'Jenna baked fresh apple pie for the picnic.', '제나는 소풍을 위해 갓 구운 사과 파이를 구웠다.'),
    'na': ('하려고', 'I am gon na call you later tonight.', '오늘 밤 늦게 너에게 전화할게.'),
    'bo': ('보우', 'Bo washed the dishes after dinner yesterday.', 'Bo는 어제 저녁 식사 후 설거지를 했습니다.')
}

SPANISH_FIXES = {
    # Untranslated / non-Hangul
    594: {'Meaning': '열'},
    1408: {'Meaning': '미 연방수사국'},
    1892: {'Meaning': '유전자(DNA)'},
    3152: {'Meaning': '세기(약어)'},
    3730: {'Meaning': '아이폰 운영체제'},
    3911: {'Meaning': '음(감탄사)'},
    4503: {'Meaning': '보기 b'},
    # Clitic distortions
    741: {'Meaning': '그를 보다'},
    1232: {'Meaning': '그녀를 보다'},
    3802: {'Meaning': '그것을 찾다'},
    4227: {'Meaning': '맛보다'},
    4530: {'Meaning': '나를 도와주다'},
    4872: {'Meaning': '그녀를 찾다'},
    4922: {'Meaning': '시도해보다'}
}

def clean_dict_artifacts(text):
    for tag in [' 2.', ' 3.', ' 4.', ' 5.', ' 숙어', ' 명사', ' 동사 자동사', ' 동사 타동사', ' ※']:
        if tag in text:
            text = text.split(tag)[0]
    text = re.sub(r'[\(\[\{《][^\)\]\}》]*[\)\]\}》]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_english():
    print(f"Loading {CLEAN_BASE_CSV}...")
    with open(CLEAN_BASE_CSV, 'r', encoding='utf-8') as f:
        clean_en = {r['Word'].lower(): r for r in csv.DictReader(f)}

    print(f"Loading {ENGLISH_CSV}...")
    with open(ENGLISH_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    fixed_dummy_count = 0
    fixed_untrans_count = 0
    fixed_dict_tags_count = 0

    for r in rows:
        w = r['Word'].lower()
        ex_ko = r['Example_KO']
        ex_en = r['Example_EN']
        m = r['Meaning'].strip()

        is_dummy_ex = any(pat in ex_ko for pat in ['관련 실전 예문입니다', '실전 예문입니다', '단어를 사용합니다']) or \
                      any(pat in ex_en for pat in ['This is an example for', 'in daily life'])
        is_untrans_m = (not any('가' <= c <= '힣' for c in m)) or \
                       (w == m.lower()) or \
                       (m in ['과거·과거', '과거형', '인칭·단수·직설법·현재형', '접두사모음'])

        if w in SPECIFIC_EN_24:
            new_m, new_en, new_ko = SPECIFIC_EN_24[w]
            if is_dummy_ex:
                r['Example_EN'] = new_en
                r['Example_KO'] = new_ko
                fixed_dummy_count += 1
            if is_untrans_m or r['Meaning'] != new_m:
                r['Meaning'] = new_m
                fixed_untrans_count += 1
        elif w in clean_en:
            c = clean_en[w]
            if is_dummy_ex:
                r['Example_EN'] = c['Example_EN']
                r['Example_KO'] = c['Example_KO']
                fixed_dummy_count += 1
            if is_untrans_m:
                r['Meaning'] = c['Meaning']
                fixed_untrans_count += 1

        # Clean trailing dictionary artifacts
        cleaned_ko = clean_dict_artifacts(r['Example_KO'])
        if cleaned_ko != r['Example_KO'] and len(cleaned_ko) > 2:
            r['Example_KO'] = cleaned_ko
            fixed_dict_tags_count += 1

    with open(ENGLISH_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ English CSV Updated: {fixed_dummy_count} dummy examples replaced, {fixed_untrans_count} untranslated meanings fixed, {fixed_dict_tags_count} dictionary tags cleaned.")
    return fixed_dummy_count, fixed_untrans_count

def clean_spanish():
    print(f"Loading {SPANISH_CSV}...")
    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    fixed_count = 0
    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        if rank in SPANISH_FIXES:
            for k, v in SPANISH_FIXES[rank].items():
                r[k] = v
            fixed_count += 1

    with open(SPANISH_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Spanish CSV Updated: {fixed_count} untranslated/clitic distortion rows fixed.")
    return fixed_count

def verify_all():
    print("\n🔍 --- [무결성 전수 검증 시작] ---")
    
    # 1. English Verification
    with open(ENGLISH_CSV, 'r', encoding='utf-8') as f:
        en_rows = list(csv.DictReader(f))
    
    en_dummy = 0
    en_untrans = 0
    for r in en_rows:
        w = r['Word'].lower()
        ex_ko = r['Example_KO']
        ex_en = r['Example_EN']
        m = r['Meaning'].strip()
        if any(pat in ex_ko for pat in ['관련 실전 예문입니다', '실전 예문입니다', '단어를 사용합니다']) or \
           any(pat in ex_en for pat in ['This is an example for', 'in daily life']):
            en_dummy += 1
        if (not any('가' <= c <= '힣' for c in m)) or (w == m.lower()) or (m in ['과거·과거', '과거형', '인칭·단수·직설법·현재형', '접두사모음']):
            en_untrans += 1
            print(f"ERROR: EN Rank {r['Rank']} untranslated: {w} -> {m}")

    # 2. Spanish Verification
    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        es_rows = list(csv.DictReader(f))

    es_dummy = 0
    es_untrans = 0
    es_clitic = 0
    for r in es_rows:
        w = r['Word'].lower()
        ex_ko = r['Example_KO']
        ex_es = r['Example_ES']
        m = r['Meaning'].strip()
        if any(pat in ex_ko for pat in ['관련 실전 예문입니다', '실전 예문입니다', '단어를 사용합니다']):
            es_dummy += 1
        if (not any('가' <= c <= '힣' for c in m)) or (w == m.lower()):
            es_untrans += 1
            print(f"ERROR: ES Rank {r['Rank']} untranslated: {w} -> {m}")
        if any(w.endswith(c) for c in ['te', 'le', 'la', 'lo', 'nos', 'me', 'se', 'les', 'los', 'las']) and len(w) > 4:
            if any(x in m for x in ['보세요', '해보세요', '세요', '하십시오']):
                es_clitic += 1
                print(f"ERROR: ES Rank {r['Rank']} clitic distortion: {w} -> {m}")

    print(f"• 영어 잔여 더미 예문: {en_dummy}건 (목표: 0건)")
    print(f"• 영어 잔여 미번역 표제어: {en_untrans}건 (목표: 0건)")
    print(f"• 스페인어 잔여 더미 예문: {es_dummy}건 (목표: 0건)")
    print(f"• 스페인어 잔여 미번역 표제어: {es_untrans}건 (목표: 0건)")
    print(f"• 스페인어 잔여 대명사 왜곡: {es_clitic}건 (목표: 0건)")

    assert en_dummy == 0, f"English still has {en_dummy} dummy examples!"
    assert en_untrans == 0, f"English still has {en_untrans} untranslated words!"
    assert es_dummy == 0, f"Spanish still has {es_dummy} dummy examples!"
    assert es_untrans == 0, f"Spanish still has {es_untrans} untranslated words!"
    assert es_clitic == 0, f"Spanish still has {es_clitic} clitic distortions!"
    assert len(en_rows) == 4998, f"English rows count {len(en_rows)} != 4998"
    assert len(es_rows) == 4998, f"Spanish rows count {len(es_rows)} != 4998"

    print("\n🎉 모든 무결성 검증을 완벽히 통과했습니다! (잔여 불량 행: 0건)")

if __name__ == '__main__':
    clean_english()
    clean_spanish()
    verify_all()
    
    print("\n🔨 동기화 빌드 실행 중...")
    subprocess.run([sys.executable, 'build_english_master.py'], check=True)
    subprocess.run([sys.executable, 'build_spanish_master.py'], check=True)
    print("✅ 런타임 JS 파일 동기화 빌드 완료!")
