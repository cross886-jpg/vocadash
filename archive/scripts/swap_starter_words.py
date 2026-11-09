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

# 2. 비속어/잡음 대체 단어 매핑
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
word_dict = {}

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

        # 1차 비속어 정돈
        if target_word in SWAP_MAP:
            new_w, new_m, new_p, new_es, new_ko = SWAP_MAP[target_word]
            row[1] = new_w
            row[5] = new_m
            row[6] = new_p
            row[7] = new_es
            row[8] = new_ko

        w_key = row[1].strip().lower()
        if w_key not in word_dict:
            word_dict[w_key] = row
        rows.append(row)

# -------------------------------------------------------------
# 3. Unit 1 (Node 1 ~ Node 4, 총 28단어) 황금 학습 순서 정의
# 기초 인사/생존 어휘 + 핵심 동사 + 중간중간 연결어(de, y, con, que) 징검다리
# -------------------------------------------------------------
UNIT_1_ORDER = [
    # [Node 1: 첫 만남 & 기초 인사/긍부정]
    "hola", "gracias", "sí", "no", "de", "amigo", "café",
    # [Node 2: 기초 존재 & 상태 연결]
    "es", "agua", "bueno", "y", "bien", "casa", "en",
    # [Node 3: 기초 동사 & 소유/지칭]
    "tener", "yo", "tú", "con", "familia", "un", "una",
    # [Node 4: 문장 완성 & 관계 연결]
    "estar", "ir", "el", "la", "que", "hacer", "todo"
]

# 기존 DB에서 해당 단어 행 추출 (만약 DB에 없는 단어는 생성)
FALLBACK_DEFS = {
    "hola": ("hola", "안녕", "[올라]", "¡Hola! ¿Cómo estás?", "안녕! 어떻게 지내?"),
    "gracias": ("gracias", "감사합니다", "[그라시아스]", "Muchas gracias por tu ayuda.", "도와줘서 정말 고마워요."),
    "agua": ("agua", "물", "[아구아]", "Quiero un vaso de agua.", "물 한 잔 원해요."),
    "café": ("café", "커피", "[카페]", "Un café con leche, por favor.", "밀크 커피 한 잔 주세요."),
    "amigo": ("amigo", "친구", "[아미고]", "Juan es mi buen amigo.", "후안은 나의 좋은 친구입니다."),
    "casa": ("casa", "집", "[카사]", "Voy a mi casa.", "나는 내 집으로 간다."),
    "bueno": ("bueno", "좋은", "[부에노]", "Es un buen día.", "좋은 날입니다."),
    "bien": ("bien", "잘 / 좋은", "[비엔]", "Todo va muy bien.", "모든 것이 잘 풀리고 있어요."),
    "tener": ("tener", "가지다 / 있다", "[테네르]", "Tengo una pregunta.", "질문이 하나 있습니다."),
    "ir": ("ir", "가다", "[이르]", "Vamos a la playa.", "해변으로 가자."),
    "hacer": ("hacer", "하다 / 만들다", "[아세르]", "Tengo que hacer la tarea.", "숙제를 해야 합니다."),
    "todo": ("todo", "모든 것", "[토도]", "Todo está listo.", "모든 것이 준비되었습니다.")
}

curated_unit1 = []
used_words = set()

for word in UNIT_1_ORDER:
    w_lower = word.lower()
    used_words.add(w_lower)
    if w_lower in word_dict:
        row = list(word_dict[w_lower])
    else:
        fb = FALLBACK_DEFS.get(w_lower, (word, word, f"[{word}]", f"Ejemplo con {word}.", f"{word} 예문"))
        row = ["", fb[0], "A1", "unit_001", "", fb[1], fb[2], fb[3], fb[4]]
    curated_unit1.append(row)

# Unit 1으로 발탁된 단어들을 제외한 나머지 단어들 유지
remaining_rows = [r for r in rows if r[1].strip().lower() not in used_words]

# 4. Node_ID 및 Unit 매핑
for idx, r in enumerate(curated_unit1):
    r[2] = "A1"
    r[3] = "unit_001"
    node_num = (idx // 7) + 1
    r[4] = f"es_u1_n{node_num}"

# 전체 결합 및 Rank 재부여
final_rows = curated_unit1 + remaining_rows
for idx, r in enumerate(final_rows, start=1):
    r[0] = str(idx)

# 5. CSV 저장
with open(INPUT_FILE, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    if header:
        writer.writerow(header)
    writer.writerows(final_rows)

print("=" * 55)
print(f"✨ Unit 1 학습자 친화적 순서 완벽 재배치 완료!")
print(f"👉 Node 1 (1~7): hola, gracias, sí, no, de, amigo, café")
print(f"👉 Node 2 (8~14): es, agua, bueno, y, bien, casa, en")
print(f"👉 Node 3 (15~21): tener, yo, tú, con, familia, un, una")
print(f"👉 Node 4 (22~28): estar, ir, el, la, que, hacer, todo")
print(f"🎉 파일 업데이트 완료: {INPUT_FILE}")
print("=" * 55)
