#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_braille_patterns.ino의 패턴 값과 ko_braille.json을 비교하는 스크립트
"""

import json

def array_to_pattern(arr):
    """배열을 패턴 바이트로 변환 (LSBFIRST: bit 0 = arr[0], bit 1 = arr[1], ...)"""
    pattern = 0
    for i, bit in enumerate(arr):
        if bit:
            pattern |= (1 << i)
    return pattern

# test_braille_patterns.ino의 패턴 값들
test_patterns = {
    'ㄱ': 0x01, 'ㄴ': 0x05, 'ㄷ': 0x13, 'ㄹ': 0x09, 'ㅁ': 0x0D,
    'ㅂ': 0x0B, 'ㅅ': 0x0A, 'ㅇ': 0x0C, 'ㅈ': 0x11, 'ㅊ': 0x19,
    'ㅋ': 0x15, 'ㅌ': 0x13, 'ㅍ': 0x1D, 'ㅎ': 0x12,
    'ㄲ': 0x03, 'ㄸ': 0x33, 'ㅃ': 0x2B, 'ㅆ': 0x1E, 'ㅉ': 0x31,
    'ㅏ': 0x04, 'ㅑ': 0x14, 'ㅓ': 0x02, 'ㅕ': 0x12, 'ㅗ': 0x0C,
    'ㅛ': 0x1C, 'ㅜ': 0x06, 'ㅠ': 0x16, 'ㅡ': 0x0A, 'ㅣ': 0x08,
    'ㅐ': 0x24, 'ㅔ': 0x22, 'ㅒ': 0x34, 'ㅖ': 0x32,
    'ㅘ': 0x2C, 'ㅙ': 0x2C, 'ㅚ': 0x2C,
    'ㅝ': 0x26, 'ㅞ': 0x26, 'ㅟ': 0x26, 'ㅢ': 0x2A
}

# ko_braille.json 로드
with open('data/ko_braille.json', 'r', encoding='utf-8') as f:
    ko_braille = json.load(f)

print('=== 패턴 비교 결과 ===\n')
mismatches = []
matches = []

for char, test_pattern in test_patterns.items():
    if char in ko_braille:
        json_arr = ko_braille[char]
        if isinstance(json_arr, list) and len(json_arr) == 6:
            json_pattern = array_to_pattern(json_arr)
            if json_pattern == test_pattern:
                matches.append(char)
            else:
                mismatches.append({
                    'char': char,
                    'test': test_pattern,
                    'json': json_pattern,
                    'json_arr': json_arr
                })
        else:
            mismatches.append({
                'char': char,
                'test': test_pattern,
                'json': None,
                'json_arr': json_arr,
                'error': f'Not 6-element array (length: {len(json_arr) if isinstance(json_arr, list) else "N/A"})'
            })
    else:
        mismatches.append({
            'char': char,
            'test': test_pattern,
            'json': None,
            'json_arr': None,
            'error': 'Not found in JSON'
        })

if mismatches:
    print('❌ 불일치 항목:\n')
    for m in mismatches:
        print(f'  {m["char"]}:')
        print(f'    Test (Arduino): 0x{m["test"]:02X}')
        if m['json'] is not None:
            print(f'    JSON:           0x{m["json"]:02X} (배열: {m["json_arr"]})')
            print(f'    → JSON 배열을 수정해야 합니다!')
        else:
            print(f'    JSON:           {m.get("error", "N/A")}')
        print()
else:
    print('✅ 모든 패턴이 일치합니다!\n')

print(f'일치: {len(matches)}개')
print(f'불일치: {len(mismatches)}개')

if mismatches:
    print('\n=== 수정이 필요한 항목 ===')
    for m in mismatches:
        if m['json'] is not None:
            # 올바른 배열 계산
            correct_arr = []
            test_p = m['test']
            for i in range(6):
                correct_arr.append(1 if (test_p & (1 << i)) else 0)
            print(f'{m["char"]}: {m["json_arr"]} → {correct_arr}')

