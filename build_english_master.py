import csv
import urllib.request

DATA_URL = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt"
OUTPUT_FILE = "english_5000_master.csv"


def get_cefr_level(rank):
  if rank <= 750:
    return "A1"
  elif rank <= 1750:
    return "A2"
  elif rank <= 3250:
    return "B1"
  else:
    return "B2"


def generate_english_master_list(target_count=5000):
  print("📥 깃허브에서 영어 빈도 데이터 수신 중...")
  req = urllib.request.Request(
      DATA_URL,
      headers={
          "User-Agent": (
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
          )
      },
  )

  try:
    with urllib.request.urlopen(req) as resp:
      lines = resp.read().decode("utf-8").splitlines()
  except Exception as e:
    print(f"❌ 다운로드 오류 발생: {e}")
    return

  print(f"⚙️ 상위 {target_count}단어 가공 및 유닛/노드 배정 중...")

  rows = []
  rank = 1

  # 자주 쓰이는 1글자 단어('a', 'i') 외의 비정상 1글자 기호 제거
  valid_single_letters = {"a", "i"}

  for line in lines:
    parts = line.strip().split()
    if not parts:
      continue

    word = parts[0].lower()

    if len(word) < 2 and word not in valid_single_letters:
      continue

    # 영문 알파벳과 어포스트로피(')로만 이루어진 단어만 수집
    if not word.replace("'", "").isalpha():
      continue

    cefr = get_cefr_level(rank)

    # 10단어 = 1개 노드, 3개 노드(30단어) = 1개 유닛
    node_num = ((rank - 1) // 10) + 1
    unit_num = ((node_num - 1) // 3) + 1

    unit_id = f"unit_{unit_num:03d}"
    node_id = f"node_{node_num:03d}"

    rows.append({
        "Rank": rank,
        "Word": word,
        "CEFR": cefr,
        "Unit_ID": unit_id,
        "Node_ID": node_id,
        "Meaning_KR": "",
    })

    rank += 1
    if rank > target_count:
      break

  # CSV 파일 쓰기
  fieldnames = ["Rank", "Word", "CEFR", "Unit_ID", "Node_ID", "Meaning_KR"]
  with open(OUTPUT_FILE, mode="w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

  total_units = (target_count - 1) // 30 + 1
  total_nodes = (target_count - 1) // 10 + 1
  print(f"🎉 작업 완료! '{OUTPUT_FILE}' 파일이 생성되었습니다.")
  print(
      f"총 {target_count}개 단어 (총 {total_units}개 유닛 / {total_nodes}개"
      " 노드)"
  )


if __name__ == "__main__":
  generate_english_master_list(5000)