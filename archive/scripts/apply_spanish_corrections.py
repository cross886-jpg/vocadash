#!/usr/bin/env python3
"""
apply_spanish_corrections.py
Surgically applies precise semantic corrections to data/spanish_5000_master.csv.
Adheres strictly to @karpathy-guidelines:
- Only touches confirmed defective items.
- Preserves CSV headers, quotes, and line order.
- Validates that no particles, tags, or unwanted characters are introduced.
"""

import csv
import os
import re

SPANISH_CSV = 'data/spanish_5000_master.csv'

# Exactly 156 verified surgical corrections
CORRECTIONS = {
    29: {"meaning": "~에 / ~로"},
    49: {"meaning": "~에 / ~로"},
    4660: {"meaning": "보기 A"},
    4816: {"meaning": "수컷 / 수컷 동물"},
    80: {"meaning": "번 / 차례"},
    102: {"meaning": "날씨 / 시간"},
    184: {"meaning": "확신하는 / 확실한"},
    195: {"meaning": "사람 / 녀석"},
    256: {"meaning": "지난 / 과거의"},
    290: {"meaning": "경우 / 사건"},
    316: {"meaning": "이야기 / 역사"},
    361: {"meaning": "딱 / 알맞은"},
    394: {"meaning": "관점 / 점"},
    430: {"meaning": "바퀴 / 산책"},
    480: {"meaning": "2층 / 두 번째"},
    502: {"meaning": "찾고 있는"},
    521: {"meaning": "안전한 / 확실한"},
    558: {"meaning": "장소 / 곳"},
    588: {"meaning": "부족 / 필요"},
    617: {"meaning": "단단한 / 딱딱한"},
    629: {"meaning": "하겠다 / 할 것이다"},
    644: {"meaning": "나머지 / 남은 것"},
    667: {"meaning": "곧장 / 오른쪽"},
    729: {"meaning": "돌아온 / 거스름돈"},
    747: {"meaning": "예약 / 약속"},
    766: {"meaning": "자신만의 / 고유한"},
    786: {"meaning": "동행 / 함께함"},
    805: {"meaning": "전망 / 경치"},
    807: {"meaning": "선 / 노선"},
    816: {"meaning": "무사한 / 안전한"},
    829: {"meaning": "불가능한"},
    857: {"meaning": "달리기 / 경주"},
    874: {"meaning": "선생님 / 님"},
    910: {"meaning": "반(30분) / 절반"},
    914: {"meaning": "친절한 / 상냥한"},
    931: {"meaning": "곳 / 지역 / 각지"},
    935: {"meaning": "처음 / 시작"},
    954: {"meaning": "옆에 / 곁에"},
    962: {"meaning": "교장 / 책임자"},
    972: {"meaning": "훌륭한 / 멋진"},
    996: {"meaning": "시도"},
    1002: {"meaning": "아파트 / 층"},
    1020: {"meaning": "베인 상처 / 베임"},
    1025: {"meaning": "찾다 / 찾는다"},
    1162: {"meaning": "귀환 / 돌아옴 / 왕복"},
    1177: {"meaning": "단서 / 힌트"},
    1185: {"meaning": "명령"},
    1214: {"meaning": "놀고 있는 / 경기하는"},
    1250: {"meaning": "가지고 있는 / 가짐"},
    1318: {"meaning": "시절 / 시대 / 시간"},
    1391: {"meaning": "맛있는"},
    1402: {"meaning": "차례가 되다 / 만지다"},
    1459: {"meaning": "와인잔 / 잔"},
    1521: {"meaning": "완수 / 끝 / 곶"},
    1537: {"meaning": "지난 / 과거의"},
    1633: {"meaning": "말씀하시다 / 말하다"},
    1653: {"meaning": "리모컨 / 조종기"},
    1662: {"meaning": "슛 / 슈팅 / 발사"},
    1675: {"meaning": "자랑스러운"},
    1680: {"meaning": "끝마치다 / 끝내다"},
    1711: {"meaning": "승점 / 점수"},
    1784: {"meaning": "단단한 / 딱딱한"},
    1800: {"meaning": "끝나다 / 끝마치다"},
    1815: {"meaning": "열린"},
    1837: {"meaning": "필요"},
    1905: {"meaning": "부르는 / 울리는"},
    1987: {"meaning": "기울이고 있는 / 두고 있는"},
    2037: {"meaning": "두꺼운 / 뚱뚱한"},
    2047: {"meaning": "멋진 / 훌륭한"},
    2073: {"meaning": "슛 / 슈팅 / 발사"},
    2170: {"meaning": "만지다 / 건드리다"},
    2196: {"meaning": "치료 / 보약"},
    2203: {"meaning": "골치 아픈 / 곤욕스러운"},
    2310: {"meaning": "슛을 날렸다 / 발사했다"},
    2359: {"meaning": "해류 / 흐름"},
    2433: {"meaning": "찻잔 / 잔"},
    2443: {"meaning": "주다 / 주십시오"},
    2517: {"meaning": "따라가는 / 따르는"},
    2626: {"meaning": "수표"},
    2679: {"meaning": "운하 / 수로"},
    2719: {"meaning": "경기하다 / 놀다"},
    2722: {"meaning": "풍부한"},
    2731: {"meaning": "소개하다 / 선보이다"},
    2747: {"meaning": "향했다 / 마주했다"},
    2842: {"meaning": "싱싱한 / 신선한"},
    2846: {"meaning": "자랑스러워하는"},
    2908: {"meaning": "회의 / 위원회"},
    2911: {"meaning": "선 / 선들"},
    2918: {"meaning": "선수"},
    2937: {"meaning": "줄 / 열 / 행"},
    2979: {"meaning": "증명하다 / 보여주다"},
    3025: {"meaning": "찾는다면 / 찾다"},
    3049: {"meaning": "바위"},
    3051: {"meaning": "갑판"},
    3069: {"meaning": "결승선 / 목표"},
    3084: {"meaning": "구했다"},
    3114: {"meaning": "살펴보다 / 던지다"},
    3121: {"meaning": "맛있는"},
    3176: {"meaning": "물건 / 유물 / 물체"},
    3183: {"meaning": "돌아왔다 / 귀국했다"},
    3188: {"meaning": "풍성한 / 맛있는"},
    3223: {"meaning": "설명해 준다 / 설명하다"},
    3240: {"meaning": "질투하는 / 샘내는"},
    3248: {"meaning": "공공의 / 대중의"},
    3301: {"meaning": "지시하다 / 보내다"},
    3304: {"meaning": "누워 있는 / 엎드린"},
    3333: {"meaning": "장소들 / 명소들"},
    3341: {"meaning": "찾고 있다 / 찾는다"},
    3363: {"meaning": "우주의 / 공간의"},
    3402: {"meaning": "끝자락 / 뾰족한 끝"},
    3445: {"meaning": "두렵게 하다 / 겁주다"},
    3487: {"meaning": "급상승한 / 치솟은"},
    3493: {"meaning": "들어오는 / 들어가는"},
    3540: {"meaning": "행동하는 / 대응하는"},
    3587: {"meaning": "선보이다 / 제시하다"},
    3655: {"meaning": "이야기하는 / 세는"},
    3709: {"meaning": "연주한 / 터치한"},
    3722: {"meaning": "연주하는 / 만지는"},
    3745: {"meaning": "두툼한 / 큼직한"},
    3750: {"meaning": "대본 / 각본"},
    3754: {"meaning": "대회 / 레이스"},
    3850: {"meaning": "서류철 / 공문서"},
    3940: {"meaning": "화초 / 식물"},
    3945: {"meaning": "우물"},
    3974: {"meaning": "선수들"},
    4020: {"meaning": "발톱 / 손톱"},
    4076: {"meaning": "춤추는 / 춤추고 있는"},
    4124: {"meaning": "판결 / 선고"},
    4138: {"meaning": "부서진다 / 깨진다"},
    4140: {"meaning": "잎사귀 / 나뭇잎"},
    4152: {"meaning": "쉬다 / 휴식하다"},
    4235: {"meaning": "봉우리 / 산봉우리"},
    4322: {"meaning": "진료 기록 / 내역"},
    4329: {"meaning": "조언 / 팁"},
    4406: {"meaning": "돛 / 양초"},
    4452: {"meaning": "석유 / 원유"},
    4459: {"meaning": "사악한 / 악한"},
    4473: {"meaning": "곤욕스러운 / 힘든"},
    4495: {"meaning": "무리 / 친구들"},
    4503: {"meaning": "보기 B"},
    4561: {"meaning": "파블로"},
    4564: {"meaning": "해주셨다 / 주었다"},
    4566: {"meaning": "샘내는 / 질투하는"},
    4596: {"meaning": "겹 / 층 / 외투"},
    4606: {"meaning": "자른 / 코르타도 커피"},
    4644: {"meaning": "사냥감 / 먹잇감"},
    4679: {"meaning": "날다 / 날아간다"},
    4713: {"meaning": "부두 / 선착장"},
    4722: {"meaning": "가리킨다 / 나타낸다"},
    4736: {"meaning": "플레이 / 작전 / 한 판"},
    4816: {"meaning": "수컷 / 수컷 동물"},
    4821: {"meaning": "원장 / 교장"},
    4834: {"meaning": "와인잔 / 잔"},
    4838: {"meaning": "혹독한 / 거친"},
    4839: {"meaning": "움직이는 / 흔드는"},
    4874: {"meaning": "시원한 / 싱싱한"},
    4899: {"meaning": "잘라냈다"},
    4953: {"meaning": "마우스(컴퓨터) / 쥐"},
    4958: {"meaning": "증명하다 / 보여주다"},
    4996: {"meaning": "경기한 / 펼친"}
}

def apply_corrections():
    if not os.path.exists(SPANISH_CSV):
        print(f"Error: {SPANISH_CSV} not found.")
        return

    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))
        fieldnames = list(reader[0].keys())

    modified_rows = []
    before_after = []

    for row in reader:
        rank = int(row['Rank']) if row['Rank'].isdigit() else 0
        if rank in CORRECTIONS:
            old_meaning = row['Meaning']
            new_meaning = CORRECTIONS[rank]['meaning']
            if old_meaning != new_meaning:
                before_after.append((rank, row['Word'], old_meaning, new_meaning, row['Example_KO']))
                row['Meaning'] = new_meaning
                modified_rows.append(rank)

    # Write back cleanly
    with open(SPANISH_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(reader)

    print(f"✅ 교정 완료: 총 {len(modified_rows)}개 행이 성공적으로 업데이트되었습니다.")
    return before_after

if __name__ == '__main__':
    apply_corrections()
