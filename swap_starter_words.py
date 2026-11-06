import csv
import os
import shutil

INPUT_FILE = "spanish_5000_master.csv"
BACKUP_FILE = "spanish_5000_master.csv.bak_swap"

# 1. 안전 백업 생성
if os.path.exists(INPUT_FILE):
    shutil.copyfile(INPUT_FILE, BACKUP_FILE)
    print(f"📦 안전 백업 완료: {BACKUP_FILE}")
else:
    print(f"❌ {INPUT_FILE} 파일이 없습니다.")
    exit(1)

# 2. 비속어/노이즈 교체 맵 (기존 정의 유지)
SWAP_MAP = {
    "mierda": ("lunes", "월요일", "[루네스]", "El lunes voy a clase.", "월요일에 수업에 갑니다."),
    "eh": ("martes", "화요일", "[마르테스]", "El martes tengo reunión.", "화요일에 회의가 있습니다."),
    "ah": ("miércoles", "수요일", "[미에르콜레스]", "Hoy es miércoles.", "오늘은 수요일입니다."),
    "os": ("jueves", "목요일", "[후에베스]", "Nos vemos el jueves.", "목요일에 만나요."),
    "hey": ("viernes", "금요일", "[비에르네스]", "¡Por fin es viernes!", "드디어 금요일이다!"),
    "puta": ("sábado", "토요일", "[사바도]", "El sábado descanso.", "토요일에는 쉽니다."),
    "maldita": ("domingo", "일요일", "[도민고]", "El domingo voy al parque.", "일요일에 공원에 갑니다."),
    "idiota": ("pan", "빵", "[판]", "Compro pan fresco.", "신선한 빵을 삽니다."),
    "john": ("leche", "우유", "[레체]", "Bebo un vaso de leche.", "우유 한 잔을 마십니다."),
    "diablos": ("manzana", "사과", "[만사나]", "Me gusta la manzana roja.", "나는 빨간 사과를 좋아합니다."),
    "sexo": ("amigo", "친구", "[아미고]", "Juan es mi buen amigo.", "후안은 나의 좋은 친구입니다."),
    "uh": ("estudiante", "학생", "[에스투디안테]", "Soy un estudiante aplicado.", "나는 성실한 학생입니다."),
    "cállate": ("escuela", "학교", "[에스쿠엘라]", "La escuela está cerca.", "학교가 가까이에 있습니다."),
    "the": ("profesor", "선생님", "[프로페소르]", "El profesor habla español.", "선생님은 스페인어를 하십니다."),
    "sam": ("familia", "가족", "[파밀리아]", "Mi familia vive aquí.", "우리 가족은 여기에 삽니다."),
    "asesinato": ("ciudad", "도시", "[시우다드]", "Vivo en una bonita ciudad.", "나는 예쁜 도시에 삽니다.")
}

header = []
rows = []
swapped_count = 0

with open(INPUT_FILE, mode="r", encoding="utf-8-sig", errors="replace") as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if not row:
            continue
        if i == 0 and "Rank" in row[0]:
            header = row
            continue
            
        while len(row) < 9:
            row.append("")
        
        target_word = row[1].strip()

        # 1차: 유효하지 않은 어휘 교체
        if target_word in SWAP_MAP:
            new_w, new_m, new_p, new_es, new_ko = SWAP_MAP[target_word]
            row[1] = new_w   # Word
            row[5] = new_m   # Meaning
            row[6] = new_p   # Pronunciation
            row[7] = new_es  # Example_ES
            row[8] = new_ko  # Example_KO
            swapped_count += 1

        rows.append(row)

# -------------------------------------------------------------
# 3. Unit 1 단어 교차 배치 (Interleaving) 로직
# 관계사/전치사가 맨 앞에 몰리지 않도록 실질 어휘 사이에 분산 배치
# -------------------------------------------------------------
# 중간중간에 넣을 기능어 (전치사/관계사/단수관사 등)
GRAMMAR_WORDS = {"de", "que", "a", "la", "el", "y", "en", "lo", "por", "para", "se"}

# Unit 1에 속하는 상위 30개 단어 추출 (unit_001 대상)
unit1_rows = [r for r in rows if r[2].strip() == "unit_001" or (len(r) > 2 and "unit_001" in r[2])]
other_rows = rows[len(unit1_rows):]

if unit1_rows:
    grammar_pool = []
    content_pool = []

    for r in unit1_rows:
        word = r[1].strip().lower()
        if word in GRAMMAR_WORDS:
            grammar_pool.append(r)
        else:
            content_pool.append(r)

    # 교차 배치: 실질 어휘(명사/동사/인사 등) 2~3개마다 기능어 1개씩 삽입
    interleaved_unit1 = []
    c_idx, g_idx = 0, 0

    while c_idx < len(content_pool) or g_idx < len(grammar_pool):
        # 1. 실질 어휘 2개 우선 배치
        for _ in range(2):
            if c_idx < len(content_pool):
                interleaved_unit1.append(content_pool[c_idx])
                c_idx += 1
        # 2. 기능어 1개 삽입
        if g_idx < len(grammar_pool):
            interleaved_unit1.append(grammar_pool[g_idx])
            g_idx += 1

    # 재배치된 Unit 1의 Node_ID 및 Node 내 순번 정돈 (1노드당 7단어 기준 유지)
    for idx, r in enumerate(interleaved_unit1):
        node_num = (idx // 7) + 1
        r[3] = f"es_u1_n{node_num}"

    rows = interleaved_unit1 + other_rows

# 전체 Rank 1부터 5000까지 재부여
for idx, r in enumerate(rows, start=1):
    r[0] = str(idx)

# 4. CSV 덮어쓰기 저장
with open(INPUT_FILE, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    if header:
        writer.writerow(header)
    writer.writerows(rows)

print("=" * 50)
print(f"✨ 비속어/잡음 단어 정돈: {swapped_count}개 완료")
print(f"🔀 Unit 1 기능어(관계사/전치사) 징검다리 교차 배치 완료")
print(f"📦 Node_ID 및 Rank 넘버링 자동 보정 완료")
print(f"🎉 파일 업데이트 완료: {INPUT_FILE}")
print("=" * 50)
