#!/usr/bin/env python3
"""
apply_contextual_fixes.py
Surgically applies corrections for obvious mistranslations and empty/corrupted examples
discovered during contextual mismatch audit across Spanish and English master data.
"""

import csv
import os

SPANISH_CSV = 'data/spanish_5000_master.csv'
ENGLISH_CSV = 'data/english_5000_master.csv'

SPANISH_FIXES = {
    # 4 Empty examples
    19: {
        'Example_ES': 'Mi familia es muy importante para mí.',
        'Example_KO': '나의 가족은 나에게 매우 소중하다.'
    },
    41: {
        'Meaning': '만약',
        'Example_ES': 'Si tienes tiempo, podemos tomar un café.',
        'Example_KO': '만약 시간이 있다면 우리 커피 한 잔 할 수 있어.'
    },
    142: {
        'Example_ES': 'Es un hecho bien conocido por todos.',
        'Example_KO': '그것은 모두에게 잘 알려진 사실이다.'
    },
    144: {
        'Example_ES': 'Estamos listos para salir.',
        'Example_KO': '우리는 나갈 준비가 되어 있다.'
    },
    # Clitic verbs mistranslated as imperative/passive
    576: {'Meaning': '해야한다'},
    1045: {'Meaning': '너를 돕다'},
    1343: {'Meaning': '나를 돕다'},
    1454: {'Meaning': '나를 도와줘'},
    1917: {'Meaning': '찾아냈다'},
    1951: {'Meaning': '시도해보다'},
    2348: {'Meaning': '그를 돕다'},
    2381: {'Meaning': '너를 데려다주다'},
    2436: {'Meaning': '너에게 묻다'},
    2463: {'Meaning': '그에게 묻다'},
    2730: {'Meaning': '우리를 돕다'},
    2755: {'Meaning': '전화했다'},
    2953: {'Meaning': '어리석은 짓'},
    2998: {'Meaning': '그를 돕다'},
    3028: {'Meaning': '우리에게 말하다'},
    3111: {'Meaning': '그녀를 돕다'},
    3618: {'Meaning': '심사숙고하다'},
    3718: {'Meaning': '그녀를 데려다주다'},
    3769: {'Meaning': '너에게 부탁하다'},
    3966: {'Meaning': '그에게 물어봐라'},
    4093: {'Meaning': '심사숙고해라'},
    4532: {'Meaning': '나에게 말하다'},
    4605: {'Meaning': '도움이 되다'},
    4741: {'Meaning': '찾겠다'},
    4883: {'Meaning': '너를 찾다'},
    4949: {'Meaning': '필요할 것이다'}
}

ENGLISH_FIXES = {
    4201: {
        'Meaning': '가장 좋아하는',
        'Example_EN': 'Pizza is my favourite food.',
        'Example_KO': '피자는 내가 가장 좋아하는 음식이다.'
    },
    4068: {
        'Meaning': '깨닫다',
        'Example_EN': "I didn't realise you were here.",
        'Example_KO': '네가 여기 있는 줄 미처 깨닫지 못했어.'
    },
    4975: {
        'Meaning': '방어',
        'Example_EN': 'A strong defence is important.',
        'Example_KO': '강력한 방어가 중요하다.'
    },
    4002: {
        'Meaning': '부탁',
        'Example_EN': 'Can you do me a favour?',
        'Example_KO': '부탁 하나만 들어줄 수 있니?'
    },
    4240: {
        'Meaning': '잘못된',
        'Example_EN': 'You are mistaken about that.',
        'Example_KO': '너는 그것에 대해 잘못 알고 있다.'
    },
    3903: {
        'Meaning': '우연의 일치',
        'Example_EN': 'It was a pure coincidence.',
        'Example_KO': '그것은 순전한 우연의 일치였다.'
    },
    4364: {
        'Meaning': '대단히 매혹적인',
        'Example_EN': 'That was a fascinating story.',
        'Example_KO': '그것은 대단히 매혹적인 이야기였다.'
    },
    3180: {
        'Meaning': '텔레비전',
        'Example_EN': 'We watch TV together every evening.',
        'Example_KO': '우리는 매일 저녁 함께 텔레비전을 본다.'
    },
    3354: {
        'Meaning': '엄마',
        'Example_EN': 'Mommy baked fresh cookies for us.',
        'Example_KO': '엄마가 우리를 위해 갓 구운 쿠키를 구워 주셨다.'
    },
    3453: {
        'Meaning': '박사',
        'Example_EN': 'Dr. Smith is a renowned specialist.',
        'Example_KO': '스미스 박사는 유명한 전문의이다.'
    },
    3099: {
        'Meaning': '씨',
        'Example_EN': 'Mr. Kim is our new teacher.',
        'Example_KO': '김 씨는 우리의 새 선생님이다.'
    },
    3109: {
        'Meaning': '안녕',
        'Example_EN': 'Bye, see you tomorrow!',
        'Example_KO': '안녕, 내일 또 봐!'
    },
    3531: {
        'Meaning': '미 연방수사국',
        'Example_EN': 'The FBI investigated the cyber crime.',
        'Example_KO': '미 연방수사국이 사이버 범죄를 수사했다.'
    },
    3612: {
        'Meaning': '파운드',
        'Example_EN': 'This bag costs twenty pounds.',
        'Example_KO': '이 가방은 20파운드이다.'
    },
    4843: {
        'Meaning': '햄버거',
        'Example_EN': 'I ordered a delicious beef burger.',
        'Example_KO': '나는 맛있는 소고기 햄버거를 주문했다.'
    },
    4966: {
        'Meaning': '연회',
        'Example_EN': 'They prepared a magnificent feast.',
        'Example_KO': '그들은 성대한 연회를 준비했다.'
    },
    4940: {
        'Meaning': '찌꺼기',
        'Example_EN': 'Clear the scum off the boiling water.',
        'Example_KO': '끓는 물 위의 거품 찌꺼기를 걷어내라.'
    },
    4980: {
        'Meaning': '모르다',
        'Example_EN': 'I dunno what to say.',
        'Example_KO': '무슨 말을 해야 할지 모르겠어.'
    },
    4998: {
        'Meaning': '로미오',
        'Example_EN': 'Romeo loved Juliet deeply.',
        'Example_KO': '로미오는 줄리엣을 깊이 사랑했다.'
    },
    2896: {
        'Meaning': '정교화하다',
        'Example_EN': 'New tools sophisticate our workflow.',
        'Example_KO': '새 도구들이 우리의 업무 방식을 정교화한다.'
    }
}

def apply_fixes(csv_path, fixes):
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    updated_count = 0
    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        if rank in fixes:
            for k, v in fixes[rank].items():
                if k in r:
                    r[k] = v
            updated_count += 1

    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Applied fixes to {updated_count} rows in {csv_path}.")

if __name__ == '__main__':
    apply_fixes(SPANISH_CSV, SPANISH_FIXES)
    apply_fixes(ENGLISH_CSV, ENGLISH_FIXES)
