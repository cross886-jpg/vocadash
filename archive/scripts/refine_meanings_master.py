#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
refine_meanings_master.py
spanish_5000_master.csv 및 english_5000_master.csv의 Meaning 컬럼을
단일 대표 의미 1개로 정제하는 공통 파이프라인.
"""

import csv
import re
import os

def clean_meaning(word, meaning):
    if not meaning:
        return ""
    raw = meaning.strip()
    w = (word or "").lower()

    # 특수 예외 단어 및 통용어 우선 매핑
    if w in ("computer", "computers") or "계산자" in raw:
        return "계산기"
    if w == "fifty":
        return "오십"
    if w == "fifteen":
        return "십오"
    if w == "hop":
        return "뛰다"
    if w == "growls":
        return "으르렁거리다"
    if w == "sara":
        return "사라"

    # 1. 접미사 분절 결합: ([가-힣]+)\s*/\s*(하다|되다|시키다|받다|거리다)
    def repl_verb(m):
        prefix = m.group(1).strip()
        suffix = m.group(2).strip()
        if prefix.endswith("다"):
            return m.group(0) # 이미 온전한 용언 (예: 얻다 / 받다)
        if prefix.endswith("를") or prefix.endswith("을"):
            return prefix[:-1] + suffix # 키스를 / 하다 -> 키스하다
        if prefix.endswith("게") or prefix.endswith("로") or prefix.endswith("히"):
            return prefix + " " + suffix # 상하게 / 하다 -> 상하게 하다
        return prefix + suffix

    s = re.sub(r"([가-힣]+)\s*/\s*(하다|되다|시키다|받다|거리다)", repl_verb, raw)

    # 2. 슬래시(/) 분절 -> 첫 번째 대표 의미 단 1개만 추출
    tokens = [t.strip() for t in s.split("/") if t.strip()]
    if not tokens:
        return ""
    first = tokens[0]

    # 3. 괄호 설명 및 특수 기호 정리
    first = re.sub(r"〈[^〉]*〉|〔[^〕]*〕|《[^》]*》|【[^】]*】|『[^』]*』|（[^）]*）|\([^)]*\)|\[[^\]]*\]|<[^>]*>|\{[^}]*\}", "", first)
    first = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩¹²³⁴⁵·]+", "", first)

    # 4. 전치사 앞 물결표(~) 및 기타 물결표 제거
    first = re.sub(r"~+\s*", "", first)

    # 5. 특수문자, 쉼표, 슬래시, 마침표, 따옴표 정리
    first = re.sub(r"[()（）\[\]{}<>·,\'\"…\.]", "", first).strip()

    # 첫 번째 토큰이 괄호 제거 등으로 비었을 경우 대체 토큰 사용
    if not first and len(tokens) > 1:
        fallback = tokens[1]
        fallback = re.sub(r"〈[^〉]*〉|〔[^〕]*〕|《[^》]*》|【[^】]*】|『[^』]*』|（[^）]*）|\([^)]*\)|\[[^\]]*\]|<[^>]*>|\{[^}]*\}", "", fallback)
        fallback = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩¹²³⁴⁵·]+", "", fallback)
        fallback = re.sub(r"~+\s*", "", fallback)
        fallback = re.sub(r"[()（）\[\]{}<>·,\'\"…\.]", "", fallback).strip()
        first = fallback

    # 문법 불필요 용어 제거
    words = [wd for wd in first.split() if wd not in ["의", "과거", "분사형", "과거형", "타동사", "자동사", "형용사", "명사", "부사"]]
    if words:
        first = " ".join(words)

    # 최종 안전 정리 (쉼표, 슬래시, 물결표 완전 배제)
    first = first.replace(",", " ").replace("/", " ").replace("~", "").strip()
    return " ".join(first.split()).strip()

def process_csv(file_path, target_words):
    if not os.path.exists(file_path):
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return {}

    with open(file_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"\n📂 [{file_path}] 정제 시작 (총 {len(rows)}개 단어)...")

    sample_diffs = {}
    cleaned_rows = []
    empty_count = 0
    slash_count = 0
    comma_count = 0
    tilde_count = 0

    for r in rows:
        w = r["Word"]
        orig_m = r["Meaning"]
        clean_m = clean_meaning(w, orig_m)

        if not clean_m:
            empty_count += 1
            print(f"⚠️ 경고: 빈 의미 발생 ({w}: '{orig_m}')")
        if "/" in clean_m:
            slash_count += 1
        if "," in clean_m:
            comma_count += 1
        if "~" in clean_m:
            tilde_count += 1

        w_lower = w.lower()
        if w_lower in target_words and w_lower not in sample_diffs:
            sample_diffs[w_lower] = (orig_m, clean_m)

        r["Meaning"] = clean_m
        cleaned_rows.append(r)

    print(f"   검증 결과: 빈칸 {empty_count}건, 슬래시 {slash_count}건, 쉼표 {comma_count}건, 물결표 {tilde_count}건")

    with open(file_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    print(f"💾 [{file_path}] 저장 완료.")
    return sample_diffs

def main():
    es_targets = ["hola", "de", "bien", "en", "todo"]
    en_targets = ["arrest", "request", "dreams"]

    # 1. 스페인어 정제
    es_diffs = process_csv("spanish_5000_master.csv", es_targets)

    # 2. 영어 정제
    en_diffs = process_csv("english_5000_master.csv", en_targets)

    print("\n========================================================")
    print("📊 [대표 샘플 정제 전 vs 정제 후 대조 결과]")
    print("========================================================")
    print("🇪🇸 스페인어 샘플 (hola, de, bien, en, todo):")
    for t in es_targets:
        orig, new = es_diffs.get(t, ("N/A", "N/A"))
        print(f"  • {t:6s}: '{orig}' -> '{new}'")

    print("\n🇺🇸 영어 샘플 (arrest, request, dreams):")
    for t in en_targets:
        orig, new = en_diffs.get(t, ("N/A", "N/A"))
        print(f"  • {t:7s}: '{orig}' -> '{new}'")
    print("========================================================\n")

if __name__ == "__main__":
    main()

