import csv
import os
import shutil

INPUT_FILE = "spanish_5000_master.csv"
BACKUP_FILE = "spanish_5000_master.csv.bak"

# 1. 파일 존재 여부 확인
if not os.path.exists(INPUT_FILE):
    print(f"❌ 오류: 현재 폴더에 '{INPUT_FILE}' 파일이 없습니다.")
    print(f"현재 실행 위치: {os.getcwd()}")
    print("👉 해결: 터미널에서 'cd' 명령어로 프로젝트 폴더로 먼저 이동하세요.")
    exit(1)

# 2. 백업 생성
shutil.copyfile(INPUT_FILE, BACKUP_FILE)
print(f"📦 원본 백업 완료: {BACKUP_FILE}")

rows = []
processed_count = 0
skipped_count = 0

# 3. CSV 읽기 및 쉼표 치환
with open(INPUT_FILE, mode="r", encoding="utf-8-sig", errors="replace") as f:
    reader = csv.reader(f)
    for line_num, row in enumerate(reader, start=1):
        if not row:
            continue
        
        # 9개 컬럼 규격: [Rank, Word, Level, Unit_ID, Node_ID, Meaning, Pronunciation, Example_ES, Example_KO]
        if len(row) >= 9:
            # Meaning (5번 인덱스): 뜻 내부 쉼표를 ' / ' 로 정리
            row[5] = row[5].replace(",", " /")

            # Example_ES (7번 인덱스): 스페인어 예문 내부 쉼표를 마침표로 치환
            row[7] = row[7].replace(",", ".")
            while ".." in row[7]:
                row[7] = row[7].replace("..", ".")
            row[7] = row[7].strip()

            # Example_KO (8번 인덱스): 한국어 예문 내부 쉼표를 공백으로 치환
            row[8] = row[8].replace(",", " ")
            row[8] = " ".join(row[8].split())

            processed_count += 1
        else:
            skipped_count += 1

        rows.append(row)

# 4. 파일 쓰기
with open(INPUT_FILE, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerows(rows)

print("=" * 45)
print(f"✅ 처리 완료: 총 {processed_count}개 단어 예문 쉼표 정리")
if skipped_count > 0:
    print(f"ℹ️ 헤더 또는 열 부족 행: {skipped_count}건 유지됨")
print(f"🎉 파일 저장 완료: {INPUT_FILE}")
print("=" * 45)
