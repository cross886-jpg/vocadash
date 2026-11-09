"""
verify_no_meaning_fragments.py
Automated assertion test verifying that 0 disallowed 1-character particles / fragments remain
in both data/english_5000_master.csv and js/data/data_en.js.
"""
import csv
import json
import re
import sys

DISALLOWED_JOSA = {
    '을', '를', '에', '의', '로', '개', '일', '와', '과', '서', '도', '은', '는', '이', '가', '만', '게', '보', '더', '할',
    '고', '며', '랑', '않', '하', '되', '인', '된', '1'
}

def verify_csv():
    with open('data/english_5000_master.csv', 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 4998, f"Expected 4998 rows, got {len(rows)}"

    violations = [r for r in rows if r['Meaning'].strip() in DISALLOWED_JOSA]
    assert len(violations) == 0, f"Found {len(violations)} CSV violations: {violations}"

    # Punctuation check
    bad_punct = [',', '/', '(', ')', '[', ']', '{', '}']
    punct_violations = [r for r in rows if any(p in r['Meaning'] for p in bad_punct)]
    assert len(punct_violations) == 0, f"Found {len(punct_violations)} punctuation violations in CSV"

    # Specific words check
    spec_map = {r['Word']: r['Meaning'] for r in rows}
    assert spec_map['through'] == '통해', f"through: {spec_map['through']}"
    assert spec_map['against'] == '맞서', f"against: {spec_map['against']}"
    assert spec_map['along'] == '따라', f"along: {spec_map['along']}"
    assert spec_map['across'] == '건너서', f"across: {spec_map['across']}"
    assert spec_map['into'] == '안으로', f"into: {spec_map['into']}"
    assert spec_map['toward'] == '쪽으로', f"toward: {spec_map['toward']}"
    assert spec_map['without'] == '없이', f"without: {spec_map['without']}"
    assert spec_map['by'] == '의해', f"by: {spec_map['by']}"
    assert spec_map['for'] == '위해', f"for: {spec_map['for']}"
    assert spec_map['from'] == '부터', f"from: {spec_map['from']}"
    assert spec_map['with'] == '함께', f"with: {spec_map['with']}"
    assert spec_map['of'] == '관한', f"of: {spec_map['of']}"
    assert spec_map['can'] == '할수있다', f"can: {spec_map['can']}"
    assert spec_map['will'] == '할것이다', f"will: {spec_map['will']}"
    assert spec_map['about'] == '대해', f"about: {spec_map['about']}"
    assert spec_map['at'] == '에서', f"at: {spec_map['at']}"

    print(f"✅ CSV Verification PASSED: 4,998 rows checked, 0 violations.")

def verify_js():
    with open('js/data/data_en.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the JSON object assigned to const courseData_en = { ... };
    start_token = "const courseData_en = {"
    start_idx = content.find(start_token)
    assert start_idx != -1, "Could not find 'const courseData_en = {' in js/data/data_en.js"

    brace_start = start_idx + len("const courseData_en = ")
    # Find matching closing brace
    depth = 0
    end_idx = -1
    for i in range(brace_start, len(content)):
        ch = content[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end_idx = i + 1
                break

    assert end_idx != -1, "Could not find matching closing brace"
    json_str = content[brace_start:end_idx]
    data = json.loads(json_str)
    units = data.get('units', [])
    total_words = 0
    violations = []

    for unit in units:
        for word_obj in unit.get('words', []):
            total_words += 1
            m = word_obj.get('meaning', '').strip()
            if m in DISALLOWED_JOSA:
                violations.append((word_obj.get('rank'), word_obj.get('word'), m))

    assert total_words == 4998, f"Expected 4998 words in JS, got {total_words}"
    assert len(violations) == 0, f"Found {len(violations)} JS violations: {violations}"

    print(f"✅ JS Runtime Data Verification PASSED: {total_words} words checked across {len(units)} units, 0 violations.")

if __name__ == '__main__':
    verify_csv()
    verify_js()
    print("🎉 All automated assertion verifications PASSED perfectly (0 violations)!")
