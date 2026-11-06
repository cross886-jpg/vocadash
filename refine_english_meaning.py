import csv
import re

def clean_meaning(word, meaning):
    if not meaning:
        return ""

    # Known edge cases / archaic words
    if word in ("computer", "computers"):
        return "계산기"
    if word == "fifty":
        return "오십"
    if word == "fifteen":
        return "십오"
    if word == "hop":
        return "뛰다"
    if word == "growls":
        return "으르렁거리다"
    if word == "sara":
        return "사라"

    # Step 1: Merge verb/adj suffix like "체포 / 하다" -> "체포하다", "신뢰 / 하다" -> "신뢰하다"
    def repl(m):
        prefix = m.group(1).strip()
        suffix = m.group(2).strip()
        if prefix.endswith("다"):
            return m.group(0) # Already a full verb like 얻다 / 받다
        if prefix.endswith("를") or prefix.endswith("을"):
            return prefix[:-1] + suffix # 키스를 / 하다 -> 키스하다
        if prefix.endswith("게") or prefix.endswith("로") or prefix.endswith("히"):
            return prefix + " " + suffix # 상하게 / 하다 -> 상하게 하다
        return prefix + suffix

    text = re.sub(r"([가-힣]+)\s*/\s*(하다|되다|시키다|받다|거리다)", repl, meaning)

    # Step 2: Split by slash and take first token
    tokens = [t.strip() for t in text.split("/") if t.strip()]
    if not tokens:
        return ""

    first = tokens[0]

    # Step 3: Remove brackets and inner annotations
    first = re.sub(r"\([^)]*\)", "", first)
    first = re.sub(r"（[^）]*）", "", first)
    first = re.sub(r"\[[^\]]*\]", "", first)
    first = re.sub(r"<[^>]*>", "", first)
    first = re.sub(r"\{[^}]*\}", "", first)

    # Remove stray brackets or punctuation (commas, slashes, brackets)
    first = re.sub(r"[()（）\[\]{}<>·,\'\"…\.]", "", first).strip()

    # If first token became empty (e.g. was just an annotation), fallback to next token if available
    if not first and len(tokens) > 1:
        fallback = tokens[1]
        fallback = re.sub(r"\([^)]*\)", "", fallback)
        fallback = re.sub(r"（[^）]*）", "", fallback)
        fallback = re.sub(r"\[[^\]]*\]", "", fallback)
        fallback = re.sub(r"[()（）\[\]{}<>·,\'\"…\.]", "", fallback).strip()
        first = fallback

    return first.strip()

def main():
    csv_path = "english_5000_master.csv"
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"Loaded {len(rows)} rows from {csv_path}")

    # Process and verify
    cleaned_rows = []
    targets = ["arrest", "request", "partner", "reach", "computer"]
    sample_diffs = {}

    empty_count = 0
    comma_count = 0
    slash_count = 0

    for r in rows:
        w = r["Word"]
        orig_m = r["Meaning"]
        new_m = clean_meaning(w, orig_m)

        if not new_m:
            empty_count += 1
            print(f"Warning: empty meaning for {w}: orig='{orig_m}'")
        if "," in new_m:
            comma_count += 1
        if "/" in new_m:
            slash_count += 1

        if w in targets and w not in sample_diffs:
            sample_diffs[w] = (orig_m, new_m)

        r["Meaning"] = new_m
        cleaned_rows.append(r)

    print(f"Validation: empty={empty_count}, comma={comma_count}, slash={slash_count}")

    # Write back to english_5000_master.csv
    with open(csv_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    print(f"Successfully saved {len(cleaned_rows)} rows to {csv_path}")

    print("\n--- Target 5 Samples Before / After ---")
    for t in targets:
        orig, new = sample_diffs.get(t, ("N/A", "N/A"))
        print(f"[{t}] '{orig}' -> '{new}'")

if __name__ == "__main__":
    main()

