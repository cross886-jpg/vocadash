#!/usr/bin/env python3
"""
diagnose_nuance_mismatches.py
Scans data/spanish_5000_master.csv for nuance/context discrepancies between
'Meaning' and 'Example_KO', focusing on words where the primary dictionary entry
does not intuitively reflect the contextual/secondary meaning in the example sentence.

Rule: READ-ONLY diagnosis script. Does NOT modify any CSV or JS file.
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

def diagnose():
    if not os.path.exists(SPANISH_CSV):
        print(f"Error: {SPANISH_CSV} not found.")
        return

    with open(SPANISH_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    print(f"=== [스페인어 마스터 데이터 뉘앙스/문맥 괴리 전수 진단] ===")
    print(f"• 대상 파일: {SPANISH_CSV} (총 {len(rows)}개 어휘)")

    # 1. Total stem mismatches
    stem_mismatches = []
    nuance_candidates = []

    for r in rows:
        rank = int(r['Rank']) if r['Rank'].isdigit() else 0
        w = r['Word'].strip().lower()
        m = r['Meaning'].strip()
        es = r['Example_ES'].strip()
        ko = r['Example_KO'].strip()

        stems = get_stems(m)
        has_stem = any(s in ko for s in stems if len(s) >= 2)
        if not has_stem:
            stem_mismatches.append(rank)

    print(f"• 표제어 뜻 어근 ↔ 예문 미포함 행수: {len(stem_mismatches)}건")

if __name__ == '__main__':
    diagnose()
