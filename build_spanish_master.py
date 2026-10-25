import urllib.request
import csv

DATA_URL = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt"
OUTPUT_FILE = "spanish_5000_master.csv"

def generate_master_list(target_count=5000):
    print("📥 깃허브에서 데이터 수신 중...")
    req = urllib.request.Request(DATA_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req) as resp:
            lines = resp.read().decode('utf-8').splitlines()
    except Exception as e:
        print(f"❌ 다운로드 오류: {e}")
        return

    print(f"⚙️ 상위 {target_count}단어 가공 및 유닛/노드 배정 중...")
    
    rows = []
    rank = 1

    for line in lines:
        parts = line.strip().split()
        if not parts:
            continue
        
        word = parts[0]

        if len(word) < 2 and word not in ['y', 'o', 'a']:
            continue

        unit_idx = ((rank - 1) // 30) + 1
        node_idx = (((rank - 1) % 30) // 10) + 1

        if rank <= 750:
            level = "A1"
        elif rank <= 1750:
            level = "A2"
        elif rank <= 3250:
            level = "B1"
        else:
            level = "B2"

        rows.append([
            rank,
            word,
            level,
            f"unit_{unit_idx:03d}",
            f"es_u{unit_idx}_n{node_idx}",
            ""
        ])

        rank += 1
        if rank > target_count:
            break

    with open(OUTPUT_FILE, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Rank", "Word", "Level", "Unit_ID", "Node_ID", "Meaning"])
        writer.writerows(rows)

    print(f"🎉 작업 완료! '{OUTPUT_FILE}' 파일이 생성되었습니다.")
    print(f"총 {len(rows)}개 단어 (총 {unit_idx}개 유닛 / {unit_idx * 3}개 노드)")

if __name__ == "__main__":
    generate_master_list(5000)
