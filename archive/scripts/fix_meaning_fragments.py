#!/usr/bin/env python3
"""
fix_meaning_fragments.py
Permanently fixes particle/josa truncation and broken fragments in data/english_5000_master.csv.
"""
import csv
import sys

INPUT_CSV = 'data/english_5000_master.csv'

AUTHORITATIVE_ENRICHED = {
    # 가족 및 핵심 인칭 어휘
    'sister': '자매',
    'brother': '형제',
    'mother': '어머니',
    'father': '아버지',
    'parent': '부모',
    'son': '아들',
    'daughter': '딸',
    'cousin': '사촌',
    'woman': '여성',
    'man': '남성',
    'girl': '소녀',
    'boy': '소년',
    'grandmother': '할머니',
    'grandfather': '할아버지',
    'grandma': '할머니',
    'grandpa': '할아버지',

    # 1. Prepositions & Conjunctions & Modals (Explicit Prompt Requirements)
    'through': '통해',
    'against': '맞서',
    'along': '따라',
    'across': '건너서',
    'into': '안으로',
    'towards': '쪽으로',
    'toward': '쪽으로',
    'without': '없이',
    'by': '의해',
    'for': '위해',
    'from': '부터',
    'with': '함께',
    'of': '관한',
    'can': '할수있다',
    'will': '할것이다',
    'about': '대해',
    'at': '에서',

    # 2. Modals, Auxiliaries, and Grammatical Words
    'could': '할수있었다',
    'would': '할것이다',
    'should': '해야한다',
    'must': '해야한다',
    'ought': '해야한다',
    'above': '위에',
    'below': '아래에',
    'behind': '뒤에',
    'under': '아래에',
    'underneath': '아래에',
    'onto': '위로',
    'upon': '위에',
    'among': '사이에',
    'between': '사이에',
    'beyond': '너머에',
    'within': '이내에',
    'during': '동안에',
    'while': '동안에',
    'until': '까지',
    'till': '까지',
    'except': '제외하고',
    'despite': '불구하고',
    'unlike': '달리',
    'according': '따르면',
    'via': '경유하여',
    'neither': '어느쪽도아니다',
    'nor': '아니다',
    'either': '둘중하나',
    'both': '둘다',
    'another': '또다른',
    'each': '각각의',
    'few': '소수의',
    'single': '단하나의',
    'more': '더많은',
    'most': '가장많은',
    'less': '더적은',
    'anymore': '더이상',
    'whenever': '할때마다',
    'whoever': '누구든',
    'cannot': '할수없다',
    'doesn': '않다',
    'hadn': '않았다',
    'mustn': '안된다',
    'unless': '하지않으면',
    'to': '향하여',
    'as': '처럼',
    'so': '매우',
    'once': '한번',
    'totally': '완전히',
    'afterwards': '나중에',
    'might': '지도모른다',
    'else': '그밖의',
    'meanwhile': '그동안에',
    'was': '이었다',

    # 3. Truncated Verbs & Adjectives
    'become': '되다',
    'seem': '보이다',
    'pretend': '척하다',
    'prefer': '선호하다',
    'deserve': '받을만하다',
    'able': '할수있는',
    'capable': '유능한',
    'unable': '할수없는',
    'worth': '가치있는',
    'empty': '비어있는',
    'blank': '비어있는',
    'cheap': '저렴한',
    'bargain': '특가품',
    'bitter': '쓴맛의',
    'bare': '벌거벗은',
    'tight': '팽팽한',
    'first': '첫번째',
    'second': '두번째',
    'third': '세번째',
    'twice': '두번',
    'double': '두배의',
    'pair': '한쌍',
    'couple': '커플',
    'making': '만들기',
    'looking': '바라보는',
    'letting': '임대',
    'paying': '지불',
    'approaching': '다가오는',
    'setting': '배경',
    'trapped': '갇힌',
    'spent': '소비된',
    'gone': '사라진',
    'unhappy': '불행한',
    'stronger': '더강한',
    'greater': '더위대한',
    'bigger': '더큰',
    'biggest': '가장큰',
    'larger': '더큰',
    'highest': '가장높은',
    'louder': '더큰',
    'sweetie': '자기야',
    'fuckin': '빌어먹을',
    'goodnight': '잘자요',
    'lousy': '형편없는',
    'whirring': '윙윙거리는',
    'sunny': '화창한',
    'raining': '비내리는',
    'vulnerable': '취약한',
    'big': '크다',
    'large': '커다란',
    'long': '길다',
    'sour': '시큼한',
    'fortunate': '운이좋은',
    'breathe': '숨쉬다',
    'squeeze': '짜내다',
    'grasp': '붙잡다',
    'grip': '쥐다',

    # 4. Nouns, Pronouns, and Josa Suffix Avoidance
    'tooth': '치아',
    'silver': '은색',
    'dog': '강아지',
    'affair': '사건',
    'job': '직업',
    'ticket': '티켓',
    'enemy': '적군',
    'enemies': '적들',
    'throat': '목구멍',
    'county': '행정구',
    'bay': '해만',
    'gulf': '해만',
    'pipe': '파이프',
    'tube': '튜브',
    'award': '상장',
    'prize': '상품',
    'debt': '부채',
    'quantity': '수량',
    'amount': '양',
    'species': '종류',
    'clause': '조항',
    'phrase': '어구',
    'sphere': '구체',
    'verse': '운문',
    'versus': '대비',
    'has': '가지다',
    'everything': '모든것',
    'myself': '나자신',
    'your': '너의',
    'position': '위치',
    'department': '부서',
    'feelings': '감정',
    'stories': '이야기들',
    'bodies': '신체들',
    'families': '가족들',
    'happiness': '행복',
    'product': '제품',
    'jerk': '얼간이',
    'closet': '벽장',
    'barn': '헛간',
    'baker': '제빵사',
    'yards': '마당',
    'illness': '질병',
    'bureau': '사무국',
    'centuries': '수세기',
    'con': '사기',
    'sire': '폐하',
    'decade': '십년',
    'teenage': '십대의',
    'american': '미국의',
    'mister': '선생님',
    'herr': '씨',
    'honour': '명예',
    'honors': '명예',
    'honor': '명예',
    'london': '런던',
    'vegas': '베이거스',
    'hong': '홍콩',
    'patrick': '패트릭',
    'vincent': '빈센트',
    'barry': '배리',
    'luke': '누가',
    'helen': '헬렌',
    'shawn': '숀',
    'ruth': '루스',
    'jean': '청바지',
    'yep': '응',
    'guessing': '추측',
    'yen': '엔화',
    'mo': '순간',
    'mi': '마일',
    'li': '리',
    'si': '예',
    'mum': '엄마',
    'remark': '발언',
    'hi': '안녕',
    'aboard': '탑승하여',
    'partner': '동반자',
    'side': '측면',
    'example': '예시',

    # 5. Korean Word Form of Numbers & Symbols
    'sara': '사라',
    'fifteen': '십오',
    'twenty': '스물',
    'twelve': '열둘',
    'thirty': '서른',
    'thirteen': '열셋',
    'twenty-first': '스물한번째',
    'twenty-second': '스물두번째',
    'twenty-third': '스물세번째',
    'dozen': '열두개',
    'billion': '십억',
    'quarter': '사분의일',
    'fourth': '네번째',
    'fifth': '다섯번째',
    'sixth': '여섯번째',
    'elizabeth': '엘리자베스',
    'percent': '퍼센트',
    'impression': '인상',
    'mile': '마일',
    'serving': '일인분',
    'moron': '바보',
    'wagon': '마차',
    'ace': '에이스',
    'april': '사월',
    'june': '유월',
    'july': '칠월',
    'august': '팔월',
    'september': '구월',
    'october': '시월',
    'november': '십일월',
    'december': '십이월'
}

DISALLOWED_JOSA = {
    '을', '를', '에', '의', '로', '개', '일', '와', '과', '서', '도', '은', '는', '이', '가', '만', '게', '보', '더', '할',
    '고', '며', '랑', '않', '하', '되', '인', '된', '1'
}

def main():
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f'Total input rows: {len(rows)}')
    assert len(rows) == 4998, f"Expected 4998 rows, got {len(rows)}"

    corrected_words = []
    for r in rows:
        w = r['Word'].lower().strip()
        if w in AUTHORITATIVE_ENRICHED:
            new_m = AUTHORITATIVE_ENRICHED[w]
            old_m = r['Meaning'].strip()
            if old_m != new_m:
                corrected_words.append((r['Rank'], r['Word'], old_m, new_m))
                r['Meaning'] = new_m

    print(f'Total corrected words: {len(corrected_words)}')

    # Verification: Disallowed Josa count must be 0
    violations = [r for r in rows if r['Meaning'].strip() in DISALLOWED_JOSA]
    if violations:
        print(f"ERROR: {len(violations)} violations found:")
        for v in violations:
            print(f"  Rank {v['Rank']}: {v['Word']} -> '{v['Meaning']}'")
        sys.exit(1)

    # Verification: No commas, slashes, parens in Meaning
    bad_punct = [',', '/', '(', ')', '[', ']', '{', '}']
    punct_violations = [r for r in rows if any(p in r['Meaning'] for p in bad_punct)]
    if punct_violations:
        print(f"ERROR: {len(punct_violations)} punctuation violations found in Meaning")
        sys.exit(1)

    with open(INPUT_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f'Successfully updated {INPUT_CSV}.')

if __name__ == '__main__':
    main()
