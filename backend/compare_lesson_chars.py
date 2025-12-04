#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lesson_chars.json과 ko_braille.json을 비교하는 스크립트
"""

import json

# JSON 파일 로드
with open('data/ko_braille.json', 'r', encoding='utf-8') as f:
    ko_braille = json.load(f)

with open('data/lesson_chars.json', 'r', encoding='utf-8') as f:
    lesson_chars = json.load(f)

print('=== lesson_chars.json vs ko_braille.json 비교 ===\n')

mismatches = []
for item in lesson_chars.get('items', []):
    char = item.get('char')
    lesson_cell = item.get('cell')
    
    if not char or not lesson_cell:
        continue
    
    ko_cell = ko_braille.get(char)
    
    if ko_cell != lesson_cell:
        mismatches.append({
            'char': char,
            'lesson': lesson_cell,
            'ko_braille': ko_cell
        })

if mismatches:
    print('❌ 불일치 항목:\n')
    for m in mismatches:
        print(f'  {m["char"]}:')
        print(f'    lesson_chars.json: {m["lesson"]}')
        print(f'    ko_braille.json:   {m["ko_braille"]}')
        print()
else:
    print('✅ 모든 패턴이 일치합니다!\n')

print(f'불일치: {len(mismatches)}개')

