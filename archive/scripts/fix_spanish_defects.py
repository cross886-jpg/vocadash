#!/usr/bin/env python3
"""
fix_spanish_defects.py
Systematic batch correction for Spanish 5000 vocabulary defects:
- Normalize verb infinitives to ~하다 / ~이다 / 기본형
- Replace disallowed single-character particle fragments with complete Korean canonical terms
- Correct machine-translated transliterations (카운트, 테이크 아웃, 팔로우, 라이브, 리프트 등)
- Fix critical semantic mismatches (ser, haber, poder, gustar, conde, suyo, etc.)
- Output updated data/spanish_5000_master.csv
"""

import csv
import os

SPANISH_CSV = 'data/spanish_5000_master.csv'

# Canonical explicit corrections by Word or Rank
CORRECTIONS_BY_RANK = {
    5: '출신',            # de: 의 -> 출신
    44: '그들',           # las: 는 -> 그들
    45: '~의',           # del: 의 -> ~의
    50: '더많은',         # más: 더 -> 더많은
    52: '이것',           # esto: 이 -> 이것
    57: '했다',           # ha: 하 -> 했다
    58: '이번',           # esta: 이 -> 이번
    71: '이것',           # este: 이 -> 이것
    74: '이다',           # ser: 있다 -> 이다
    83: '오직',           # sólo: 만 -> 오직
    120: '위에',          # sobre: 약 -> 위에
    135: '나이',          # años: 살 -> 나이
    153: '보아라',        # mira: 봐 -> 보아라
    159: '말하다',        # hablar: 이야기 -> 말하다
    194: '더적은',        # menos: 덜 -> 더적은
    202: '날들',          # días: 일 -> 날들
    213: '있다',          # haber: 가지고 있다 -> 있다
    225: '이것들',        # estas: 이 -> 이것들
    303: '돌아가다',      # volver: 반환 -> 돌아가다
    354: '주다',          # da: 다 -> 주다
    363: '할수있다',      # poder: 힘 -> 할수있다
    373: '찾다',          # encontrar: 찾기 -> 찾다
    396: '계속하다',      # sigue: 팔로우 -> 계속하다
    413: '그러나',        # mas: 더 -> 그러나
    432: '일하다',        # trabajar: 일 -> 일하다
    454: '살다',          # vivir: 라이브 -> 살다
    512: '계속하다',      # seguir: 팔로우 -> 계속하다
    522: '기다리다',      # esperar: 잠깐 -> 기다리다
    549: '관하여',        # acerca: 약 -> 관하여
    559: '돕다',          # ayudar: 도움 -> 돕다
    581: '부르다',        # llamar: 전화 -> 부르다
    606: '놓다',          # poner: 넣어 -> 놓다
    616: '내 것',         # mía: 내 -> 내 것
    618: '시작하다',      # empezar: 시작 -> 시작하다
    621: '강아지',        # perro: 개 -> 강아지
    634: '찾다',          # buscar: 검색 -> 찾다
    638: '놀다',          # jugar: 놀이 -> 놀다
    697: '바꾸다',        # cambiar: 변화 -> 바꾸다
    757: '보세요',        # mire: 봐 -> 보세요
    794: '느끼다',        # sentir: 느낌 -> 느끼다
    804: '살다',          # vive: 라이브 -> 살다
    883: '듣다',          # escuchar: 들어봐 -> 듣다
    904: '끝내다',        # terminar: 마무리 -> 끝내다
    981: '보아라',        # miren: 봐 -> 보아라
    1057: '돌아가다',     # regresar: 반환 -> 돌아가다
    1060: '보다',         # mirar: 봐 -> 보다
    1061: '꺼내다',       # sacar: 테이크 아웃 -> 꺼내다
    1088: '구하다',       # salvar: 저장 -> 구하다
    1091: '귀찮게하다',   # joder: 씨발 -> 귀찮게하다 (동사원형)
    1095: '저녁먹다',     # cenar: 저녁 식사 -> 저녁먹다
    1167: '멈추다',       # parar: 중지 -> 멈추다
    1197: '신뢰하다',     # confiar: 신뢰 -> 신뢰하다
    1217: '춤추다',       # bailar: 댄스 -> 춤추다
    1246: '작품',         # obra: 일 -> 작품
    1257: '만지다',       # tocar: 접촉 -> 만지다
    1259: '세다',         # contar: 카운트 -> 세다
    1304: '그의 것',      # suyo: 너의 것 -> 그의 것
    1379: '탈출하다',     # escapar: 탈출 -> 탈출하다
    1428: '그녀의 것',    # suya: 너의 것 -> 그녀의 것
    1430: '끝내다',       # acabar: 마무리 -> 끝내다
    1436: '강아지들',     # perros: 개 -> 강아지들
    1495: '단지',         # solamente: 만 -> 단지
    1520: '싸우다',       # luchar: 싸움 -> 싸우다
    1528: '날다',         # volar: 파리 -> 날다
    1559: '잡다',         # coger: 잡기 -> 잡다
    1669: '싸우다',       # pelear: 싸움 -> 싸우다
    1671: '던지다',       # echar: 캐스트 -> 던지다
    1697: '돌보다',       # cuidar: 배려 -> 돌보다
    1713: '운전하다',     # conducir: 드라이브 -> 운전하다
    1755: '도와주다',     # ayude: 도움 -> 도와주다
    1792: '닫다',         # cerrar: 닫기 -> 닫다
    1807: '행동하다',     # actuar: 행위 -> 행동하다
    1808: '따라가다',     # siga: 팔로우 -> 따라가다
    1813: '시선',         # mirada: 봐 -> 시선
    1819: '깨뜨리다',     # romper: 휴식 -> 깨뜨리다
    1829: '시작하다',     # comenzar: 시작 -> 시작하다
    1862: '~로',          # to: 에 -> ~로
    1929: '쉬다',         # descansar: 휴식 -> 쉬다
    1961: '해야한다',     # deber: 의무 -> 해야한다
    1972: '청소하다',     # limpiar: 깨끗한 -> 청소하다
    1981: '작동하다',     # funcionar: 일 -> 작동하다
    1984: '다루다',       # manejar: 드라이브 -> 다루다
    2028: '멈추다',       # detener: 중지 -> 멈추다
    2100: '보복',         # venganza: 복수 -> 보복
    2130: '꺼내다',       # saca: 테이크 아웃 -> 꺼내다
    2244: '건설하다',     # construir: 빌드 -> 건설하다
    2282: '자르다',       # cortar: 절단 -> 자르다
    2286: '~의',          # of: 의 -> ~의
    2333: '일하다',       # trabajas: 일 -> 일하다
    2342: '통제하다',     # controlar: 제어 -> 통제하다
    2344: '보여주다',     # mostrar: 쇼 -> 보여주다
    2398: '던지다',       # tirar: 던져 -> 던지다
    2492: '하하',         # ja: 하 -> 하하
    2518: '여행하다',     # viajar: 여행 -> 여행하다
    2522: '넣다',         # meter: 넣어 -> 넣다
    2527: '담배피우다',   # fumar: 연기 -> 담배피우다
    2544: '은화',         # plata: 은 -> 은화
    2559: '일으키다',     # levanta: 리프트 -> 일으키다
    2560: '보지마라',     # mires: 봐 -> 보지마라
    2627: '검토하다',     # revisar: 검토 -> 검토하다
    2637: '뛰다',         # saltar: 점프 -> 뛰다
    2649: '바라보아라',   # mirad: 봐 -> 바라보아라
    2693: '내 것들',      # míos: 내 -> 내 것들
    2695: '연속적인',     # seguido: 팔로우함 -> 연속적인
    2717: '거짓말하다',   # mentir: 거짓말 -> 거짓말하다
    2737: '따르다',       # sigan: 팔로우 -> 따르다
    2786: '소리치다',     # gritar: 비명 -> 소리치다
    2804: '서명하다',     # firmar: 기호 -> 서명하다
    2838: '사랑하다',     # amar: 사랑 -> 사랑하다
    2929: '소개하다',     # presentar: 현재 -> 소개하다
    2938: '이것',         # ésto: 이 -> 이것
    2990: '백작',         # conde: 카운트 -> 백작
    3080: '보관하다',     # guardar: 저장 -> 보관하다
    3096: '잡다',         # atrapar: 잡기 -> 잡다
    3115: '내 것',        # mina: 내 -> 내 것
    3120: '요리하다',     # cocinar: 요리사 -> 요리하다
    3129: '수영하다',     # nadar: 수영 -> 수영하다
    3175: '공격하다',     # atacar: 공격 -> 공격하다
    3257: '타다',         # montar: 타고 -> 타다
    3259: '도(온도)',     # grados: 도 -> 도(온도)
    3291: '운전하다',     # conduce: 드라이브 -> 운전하다
    3302: '날들',         # dias: 일 -> 날들
    3314: '때리다',       # golpear: 히트 -> 때리다
    3389: '켜짐',         # on: 에 -> 켜짐
    3419: '깨어나다',     # despertar: 일어나 -> 깨어나다
    3503: '들어올리다',   # levantar: 리프트 -> 들어올리다
    3506: '중요하다',     # importar: 수입 -> 중요하다
    3510: '확인하다',     # comprobar: 확인 -> 확인하다
    3511: '작동하다',     # funcione: 일 -> 작동하다
    3628: '소리나다',     # sonar: 소리 -> 소리나다
    3781: '내 것',        # mia: 내 -> 내 것
    3832: '망치다',       # arruinar: 파멸 -> 망치다
    3935: '반납하다',     # devolver: 반환 -> 반납하다
    4072: '출시하다',     # lanzar: 던져 -> 출시하다
    4078: '덮다',         # cubrir: 커버 -> 덮다
    4121: '발견하다',     # hallar: 찾기 -> 발견하다
    4123: '다스리다',     # lidiar: 거래 -> 다스리다
    4134: '속이다',       # engañar: 속임수 -> 속이다
    4167: '살펴보아라',   # míralo: 봐 -> 살펴보아라
    4192: '방해하다',     # interrumpir: 인터럽트 -> 방해하다
    4199: '내기하다',     # apostar: 내기 -> 내기하다
    4205: '좋아하다',     # gustar: 같은 -> 좋아하다
    4215: '투표하다',     # votar: 투표 -> 투표하다
    4223: '제공하다',     # ofrecer: 제안 -> 제공하다
    4263: '삭제하다',     # eliminar: 삭제 -> 삭제하다
    4266: '일으키다',     # causar: 원인 -> 일으키다
    4293: '형성하다',     # formar: 형태 -> 형성하다
    4369: '사냥하다',     # cazar: 사냥 -> 사냥하다
    4373: '낚시하다',     # pescar: 물고기 -> 낚시하다
    4407: '그들의 것',    # suyos: 너의 것 -> 그들의 것
    4471: '충전하다',     # cargar: 부하 -> 충전하다
    4515: '연습하다',     # practicar: 연습 -> 연습하다
    4543: '입맞추다',     # besar: 키스 -> 입맞추다
    4569: '내 것들',      # mías: 내 -> 내 것들
    4659: '세다',         # cuente: 카운트 -> 세다
    4715: '이끌다',       # dirigir: 리드 -> 이끌다
    4863: '살해하다',     #杀人 -> 살해하다
    4929: '해방하다',     # liberar: 릴리스 -> 해방하다
    4932: '그리다',       # pintar: 페인트 -> 그리다
    4955: '미국',         # ee: 에 -> 미국
    4965: '직면하다',     # enfrentar: 얼굴 -> 직면하다
    4978: '판단하다',     # juzgar: 판사 -> 판단하다
    4981: '태우다',       # quemar: 화상 -> 태우다
}

def fix_spanish_csv():
    if not os.path.exists(SPANISH_CSV):
        print(f"Error: {SPANISH_CSV} not found.")
        return

    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"Loaded {len(rows)} rows from {SPANISH_CSV}.")

    corrected_count = 0
    sample_changes = []

    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        old_meaning = r['Meaning'].strip()

        if rank in CORRECTIONS_BY_RANK:
            new_meaning = CORRECTIONS_BY_RANK[rank]
            if old_meaning != new_meaning:
                r['Meaning'] = new_meaning
                corrected_count += 1
                if len(sample_changes) < 25:
                    sample_changes.append((rank, r['Word'], old_meaning, new_meaning, r['Example_KO'][:35]))

    with open(SPANISH_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Successfully corrected {corrected_count} rows in {SPANISH_CSV}.")
    print("\n--- [주요 교정 내역 샘플 (상위 25개)] ---")
    print(f"{'Rank':>5} | {'Word':<15} | {'이전 뜻':<12} -> {'교정 뜻':<12} | {'예문 해석':<30}")
    print("-" * 75)
    for c in sample_changes:
        print(f"{c[0]:5d} | {c[1]:<15} | {c[2]:<12} -> {c[3]:<12} | {c[4]}")

if __name__ == '__main__':
    fix_spanish_csv()
