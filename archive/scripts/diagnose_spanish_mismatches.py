#!/usr/bin/env python3
"""
diagnose_spanish_mismatches.py
Diagnoses '영-한 중역 다의어 오염' and '뜻-예문 불일치' in data/spanish_5000_master.csv.

Covers 3 diagnostic patterns:
1. 뜻(meaning) ↔ 예문 해석(example_ko) 어근 불일치
2. 영-한 다의어 함정 (Pivot Translation Trap)
3. 품사 및 형태 왜곡 (형용사/명사인데 ~다 동사형, 또는 동사인데 명사형 등)
"""

import csv
import os
import re

SPANISH_CSV = 'data/spanish_5000_master.csv'

def clean_text(s):
    return re.sub(r'[\s\.,\?!~·\-_\"\'\(\)\[\]《》0-9]+', '', s)

def get_stems(m):
    m = re.sub(r'[\(\)\[\]~·,\-_/]+', ' ', m).strip()
    words = m.split()
    stems = set()
    for w in words:
        if w.endswith('하다') and len(w) > 2:
            stems.add(w[:-2])
            stems.add(w[:-1])
        elif w.endswith('되다') and len(w) > 2:
            stems.add(w[:-2])
        elif w.endswith('이다') and len(w) > 2:
            stems.add(w[:-2])
        elif w.endswith('다') and len(w) > 1:
            stems.add(w[:-1])
        else:
            stems.add(w)
    return stems

# Representative Pivot Translation Traps
PIVOT_WORDS = {
    'amable': ('종류', '친절한'),
    'don': ('선물', '선생님 / 님'),
    'carrera': ('경력', '달리기 / 경주'),
    'carreras': ('경주', '대회 / 레이스'),
    'órdenes': ('주문', '명령'),
    'mando': ('명령', '리모컨 / 조종기'),
    'manda': ('명령', '지시하다 / 보내다'),
    'rico': ('부자', '맛있는'),
    'rica': ('부자', '맛있는 / 풍성한'),
    'ricos': ('부자', '풍부한'),
    'ricas': ('부자', '맛있는 / 풍성한'),
    'corriente': ('현재', '해류 / 흐름'),
    'presenta': ('선물', '선보이다 / 제시하다'),
    'justo': ('박람회', '딱 / 알맞게'),
    'falta': ('실종', '부족 / 필요'),
    'salvo': ('저장됨', '무사한 / 안전한'),
    'salvó': ('저장됨', '구했다'),
    'vista': ('보기', '전망 / 경치'),
    'vez': ('시간', '번 / 차례'),
    'tipo': ('유형', '사람 / 녀석'),
    'media': ('평균', '반(30분) / 절반'),
    'partes': ('부품', '곳 / 지역'),
    'principio': ('원리', '처음 / 시작'),
    'junto': ('함께', '옆에 / 인접하여'),
    'director': ('감독', '교장 / 책임자'),
    'directora': ('감독', '원장 / 교장'),
    'banco': ('은행', '벤치'),
    'bancos': ('은행', '벤치'),
    'planta': ('공장', '식물 / 화초 / 층'),
    'plantas': ('식물', '화초 / 층'),
    'cuarto': ('네 번째', '방'),
    'cuarta': ('네 번째', '4층 / 4분의 1'),
    'carta': ('편지', '메뉴판 / 카드'),
    'cartas': ('카드', '카드게임 / 편지'),
    'cura': ('치료법', '신부 / 사제'),
    'vela': ('양초', '돛'),
    'velas': ('양초', '돛'),
    'muñeca': ('인형', '손목'),
    'cometa': ('혜성', '연(날리는 연)'),
    'manzana': ('사과', '블록(도시 구역)'),
    'batería': ('배터리', '드럼(악기)'),
    'hoja': ('잎', '종이 한 장 / 칼날'),
    'hojas': ('나뭇잎', '서류 / 문서'),
    'corte': ('절단', '베인 상처 / 법원'),
    'cortado': ('절단', '코르타도 / 자른'),
    'cortó': ('절단', '잘라냈다'),
    'segundo': ('두 번째', '초(시간)'),
    'segundos': ('초', '초(시간)'),
    'traje': ('정장', '가져왔다'),
    'tiempo': ('시간', '날씨'),
    'derecho': ('곧장', '오른쪽 / 곧장 / 권리'),
    'seguro': ('물론이죠', '확실한 / 안전한'),
    'paciente': ('참을성', '환자'),
    'pacientes': ('참을성', '환자들'),
    'segura': ('안전하다', '확신하는 / 안전한'),
    'propio': ('자신의', '고유한 / 적절한'),
    'broma': ('농담', '장난'),
    'peso': ('무게', '페소(통화)'),
    'fresco': ('신선한', '시원한'),
    'fresca': ('신선한', '시원한'),
    'tienda': ('가게', '텐트'),
    'pista': ('트랙', '단서 / 힌트'),
    'pistas': ('단서', '단서들 / 트랙'),
    'ratón': ('쥐', '마우스(컴퓨터)'),
    'cubierta': ('커버', '갑판'),
    'cheque': ('확인', '수표'),
    'caso': ('케이스', '경우 / 사건'),
    'compañía': ('회사', '동행 / 함께함'),
    'resto': ('휴식', '나머지 / 남은 것'),
    'vuelta': ('반환', '바퀴 / 산책'),
    'regreso': ('반환', '귀환 / 돌아옴'),
    'regresó': ('반환', '돌아왔다'),
    'vuelto': ('반환', '돌아온 / 거스름돈'),
    'copa': ('컵', '와인잔 / 잔'),
    'taza': ('컵', '찻잔 / 잔'),
    'rompe': ('휴식', '부서진다 / 깨진다'),
    'descansa': ('휴식', '쉬다 / 휴식하다'),
    'actuando': ('연기', '행동하는 / 조치하는'),
    'pico': ('피크', '봉우리 / 산봉우리')
}

def diagnose():
    if not os.path.exists(SPANISH_CSV):
        print(f"Error: {SPANISH_CSV} not found.")
        return

    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    print(f"=== [스페인어 마스터 데이터 영-한 중역 및 의미 불일치 전수 진단] ===")
    print(f"• 대상 파일: {SPANISH_CSV} (총 {len(rows)}개 어휘)")

    stem_mismatches = []
    pivot_traps = []
    pos_distortions = []

    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        w = r['Word'].strip().lower()
        m = r['Meaning'].strip()
        ex_ko = r['Example_KO'].strip()

        # 1. Stem Mismatch
        stems = get_stems(m)
        has_stem = any(s in ex_ko for s in stems if len(s) >= 2)
        if not has_stem and len(m) >= 2:
            stem_mismatches.append(rank)

        # 2. Pivot Traps
        if w in PIVOT_WORDS:
            bad_m, estimated_m = PIVOT_WORDS[w]
            if m == bad_m or (not has_stem and any(em in ex_ko for em in estimated_m.split(' / '))):
                pivot_traps.append((rank, r['Word'], m, ex_ko, estimated_m))

        # 3. Part-of-speech & morphological distortions
        is_ko_verb = m.endswith('다') or m.endswith('하다') or m.endswith('되다') or m.endswith('이다')
        # A) Spanish Adjective/Noun ending in typical suffixes with '~다' verb meaning
        if any(w.endswith(suf) for suf in ['ción', 'sión', 'dad', 'tad', 'mente', 'oso', 'osa', 'ble', 'ico', 'ica']) and is_ko_verb:
            pos_distortions.append((rank, r['Word'], m, ex_ko, '형용사/명사인데 ~다 동사형 왜곡'))
        # B) Spanish verb forms / nouns misclassified
        elif w in ['intento', 'necesidad', 'significa', 'explica', 'indica', 'delicioso', 'celoso', 'celosa', 'imposible', 'maravilloso', 'maravillosa', 'orgulloso', 'orgullosa'] and is_ko_verb:
            pos_distortions.append((rank, r['Word'], m, ex_ko, '품사 불일치'))
        # C) Spanish verb infinitive with noun meaning (검색, 캐스트 등)
        elif m in ['검색', '캐스트', '휴식'] and not has_stem:
            pos_distortions.append((rank, r['Word'], m, ex_ko, '동사활용형인데 명사 왜곡'))

    all_flagged_ranks = set(stem_mismatches) | {x[0] for x in pivot_traps} | {x[0] for x in pos_distortions}

    print("\n--- [진단 결과 통계] ---")
    print(f"1. 뜻 ↔ 예문 해석 어근 불일치 건수: {len(stem_mismatches)}건")
    print(f"2. 대표적 영-한 다의어 함정(Pivot Trap) 오염 건수: {len(pivot_traps)}건")
    print(f"3. 품사 및 형태 왜곡(형용사/명사<->동사) 건수: {len(pos_distortions)}건")
    print(f"--------------------------------------------------")
    print(f"📌 총 고유 오염 의심 건수 (중복 제거): {len(all_flagged_ranks)}건")

if __name__ == '__main__':
    diagnose()

