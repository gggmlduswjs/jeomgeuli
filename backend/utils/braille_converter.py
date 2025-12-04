"""
점자 변환 유틸리티
"""
import json
import os
import unicodedata
from pathlib import Path
from django.conf import settings
from typing import List

DATA_DIR = Path(settings.BASE_DIR) / "data"

# 전역 점자 매핑 캐시
_BRAILLE_MAP = None
_BRAILLE_MAP_MTIME = None  # 파일 수정 시간 캐시


def _load_braille_map() -> dict:
    """점자 매핑 테이블을 안전하게 로드 (캐시 사용, 파일 수정 시간 체크)"""
    global _BRAILLE_MAP, _BRAILLE_MAP_MTIME
    
    try:
        data_path = DATA_DIR / "ko_braille.json"
        current_mtime = os.path.getmtime(data_path) if data_path.exists() else None
        
        # 캐시가 있고 파일이 수정되지 않았으면 캐시 반환
        if _BRAILLE_MAP is not None and _BRAILLE_MAP_MTIME == current_mtime:
            return _BRAILLE_MAP
        
        # 파일 로드
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                _BRAILLE_MAP = data
                _BRAILLE_MAP_MTIME = current_mtime
                return data
        else:
            print(f"[braille_converter] Warning: ko_braille.json not found at {data_path}")
            _BRAILLE_MAP = {}
            _BRAILLE_MAP_MTIME = None
            return {}
    except Exception as e:
        print(f"[braille_converter] Error loading braille map: {e}")
        import traceback
        traceback.print_exc()
        _BRAILLE_MAP = {}
        _BRAILLE_MAP_MTIME = None
        return {}


def reload_braille_map():
    """점자 매핑 테이블 캐시 리셋 (JSON 파일 업데이트 후 사용)"""
    global _BRAILLE_MAP, _BRAILLE_MAP_MTIME
    _BRAILLE_MAP = None
    _BRAILLE_MAP_MTIME = None
    return _load_braille_map()


def dots_to_bit_array(dots: List[int]) -> List[int]:
    """
    점 번호 리스트를 비트 배열로 변환
    예: [1, 2, 6] → [1, 1, 0, 0, 0, 1]
    
    Args:
        dots: 점 번호 리스트 (1~6)
    
    Returns:
        비트 배열 [0|1 x 6]
    """
    bit_array = [0] * 6
    for dot in dots:
        if 1 <= dot <= 6:
            bit_array[dot - 1] = 1
    return bit_array


def bit_array_to_pattern(bit_array: List[int]) -> int:
    """
    비트 배열을 패턴 바이트로 변환
    예: [1, 1, 0, 0, 0, 1] → 0x23
    
    Args:
        bit_array: 비트 배열 [0|1 x 6]
    
    Returns:
        패턴 바이트 (0~63, 6-bit)
    """
    pattern = 0
    for i, bit in enumerate(bit_array):
        if bit:
            pattern |= (1 << i)
    return pattern & 0x3F


def normalize_braille_entry(entry, braille_map: dict = None) -> List[int]:
    """
    JSON 엔트리를 정규화 (점 번호 리스트 또는 비트 배열 모두 처리)
    
    Args:
        entry: JSON 엔트리 (점 번호 리스트, 비트 배열, 2차원 배열, 또는 문자열 참조)
        braille_map: 점자 매핑 테이블 (참조 해석용)
    
    Returns:
        비트 배열 [0|1 x 6]
    """
    if not isinstance(entry, list):
        return [0] * 6
    
    if len(entry) == 0:
        return [0] * 6
    
    # 2차원 배열 형식: [[6], [4]] (쌍자음, 이중모음, 겹받침)
    if len(entry) > 0 and isinstance(entry[0], list):
        # 첫 번째 항목만 반환 (나머지는 text_to_cells에서 처리)
        return normalize_braille_entry(entry[0], braille_map)
    
    # 문자열 참조 형식: ["ㅗ", "⠗"] (이중모음 처리)
    if all(isinstance(x, str) for x in entry):
        if braille_map:
            result = []
            for ref in entry:
                # 섹션별로 찾기
                ref_entry = None
                if "vowel" in braille_map and ref in braille_map["vowel"]:
                    ref_entry = braille_map["vowel"][ref]
                elif "special" in braille_map and ref in braille_map["special"]:
                    ref_entry = braille_map["special"][ref]
                elif "initial" in braille_map and ref in braille_map["initial"]:
                    ref_entry = braille_map["initial"][ref]
                elif "final" in braille_map and ref in braille_map["final"]:
                    ref_entry = braille_map["final"][ref]
                
                if ref_entry:
                    normalized = normalize_braille_entry(ref_entry, braille_map)
                    result.append(normalized)
                else:
                    result.append([0] * 6)
            # 첫 번째 항목만 반환 (나머지는 text_to_cells에서 처리)
            return result[0] if result else [0] * 6
        return [0] * 6
    
    # 비트 배열 형식 우선 체크: [1, 0, 0, 0, 0, 0] (길이 6, 0 또는 1만 포함)
    if len(entry) == 6 and all(x in [0, 1] for x in entry):
        return [int(x) for x in entry]
    
    # 점 번호 리스트 형식: [1, 2, 6] (모든 값이 1~6 범위)
    if all(isinstance(x, int) and 1 <= x <= 6 for x in entry):
        return dots_to_bit_array(entry)
    
    # 기타: 빈 배열이거나 잘못된 형식
    return [0] * 6


def text_to_cells(text: str) -> List[List[int]]:
    """
    텍스트를 점자 셀로 변환 (한국 점자 규정 준수)
    
    Args:
        text: 변환할 텍스트
    
    Returns:
        점자 셀 리스트 [[0|1 x 6], ...]
    """
    try:
        # 유니코드 정규화로 조합형/분해형 통일 (NFC로 조합형 유지)
        normalized_text = unicodedata.normalize("NFC", text or "")
        braille_map = _load_braille_map()
        
        # 디버깅: JSON 구조 확인
        if not braille_map:
            print("[text_to_cells] Warning: braille_map is empty")
            return []
        
        # JSON 구조 확인 및 캐시 리셋
        if "initial" not in braille_map:
            print(f"[text_to_cells] Warning: JSON structure may be old format. Reloading...")
            reload_braille_map()
            braille_map = _load_braille_map()
            if "initial" not in braille_map:
                print("[text_to_cells] Error: JSON structure is invalid after reload")
                return []
        
        res = []
        for ch in normalized_text:
            # 먼저 완전한 글자로 매핑 시도 (하위 호환성)
            arr = braille_map.get(ch)
            if isinstance(arr, list) and len(arr) == 6:
                normalized = normalize_braille_entry(arr, braille_map)
                if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                    res.append(normalized)
                continue
            elif isinstance(arr, list) and len(arr) == 12:
                # 12개 점이면 2개 셀로 분할
                normalized1 = normalize_braille_entry(arr[:6], braille_map)
                normalized2 = normalize_braille_entry(arr[6:], braille_map)
                if any(normalized1):
                    res.append(normalized1)
                if any(normalized2):
                    res.append(normalized2)
                continue
            
            # 자모 문자 직접 처리 (한글 완성형 분해 전에 처리)
            # 초성 자모 처리
            if "initial" in braille_map and ch in braille_map["initial"]:
                initial_entry = braille_map["initial"][ch]
                # 2차원 배열 처리 (쌍자음): [[6], [4]]
                if isinstance(initial_entry, list) and len(initial_entry) > 0 and isinstance(initial_entry[0], list):
                    for sub_entry in initial_entry:
                        normalized = normalize_braille_entry(sub_entry, braille_map)
                        if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                            res.append(normalized)
                else:
                    normalized = normalize_braille_entry(initial_entry, braille_map)
                    if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                        res.append(normalized)
                continue
            
            # 중성 자모 처리
            if "vowel" in braille_map and ch in braille_map["vowel"]:
                medial_entry = braille_map["vowel"][ch]
                # 2차원 배열 처리 (이중모음): [[1, 2, 3, 6], [1, 2, 3, 5]]
                if isinstance(medial_entry, list) and len(medial_entry) > 0 and isinstance(medial_entry[0], list):
                    for sub_entry in medial_entry:
                        normalized = normalize_braille_entry(sub_entry, braille_map)
                        if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                            res.append(normalized)
                # 문자열 참조 형식: ["ㅗ", "⠗"] 형식
                elif isinstance(medial_entry, list) and len(medial_entry) == 2 and all(isinstance(x, str) for x in medial_entry):
                    # 참조 형식: 각 참조를 해석하여 추가
                    for ref in medial_entry:
                        ref_entry = None
                        if "vowel" in braille_map and ref in braille_map["vowel"]:
                            ref_entry = braille_map["vowel"][ref]
                        elif "special" in braille_map and ref in braille_map["special"]:
                            ref_entry = braille_map["special"][ref]
                        
                        if ref_entry:
                            normalized = normalize_braille_entry(ref_entry, braille_map)
                            if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                res.append(normalized)
                else:
                    normalized = normalize_braille_entry(medial_entry, braille_map)
                    if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                        res.append(normalized)
                continue
            
            # 종성 자모 처리
            if "final" in braille_map and ch in braille_map["final"]:
                final_entry = braille_map["final"][ch]
                # 2차원 배열 처리 (겹받침): [[1], [3]]
                if isinstance(final_entry, list) and len(final_entry) > 0 and isinstance(final_entry[0], list):
                    for sub_entry in final_entry:
                        normalized = normalize_braille_entry(sub_entry, braille_map)
                        if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                            res.append(normalized)
                else:
                    normalized = normalize_braille_entry(final_entry, braille_map)
                    if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                        res.append(normalized)
                continue
            
            # 한글인 경우 자음+모음으로 분해
            if '가' <= ch <= '힣':
                base = ord(ch) - ord('가')
                initial = base // (21 * 28)  # 초성
                medial = (base % (21 * 28)) // 28  # 중성
                final = base % 28  # 종성
                
                consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
                vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
                
                # 초성 처리
                if initial < len(consonants):
                    initial_char = consonants[initial]
                    # 새로운 구조에서 찾기
                    initial_entry = None
                    if "initial" in braille_map and initial_char in braille_map["initial"]:
                        initial_entry = braille_map["initial"][initial_char]
                    elif initial_char in braille_map:
                        initial_entry = braille_map[initial_char]
                    
                    if initial_entry:
                        # 2차원 배열 처리 (쌍자음): [[6], [4]]
                        if isinstance(initial_entry, list) and len(initial_entry) > 0 and isinstance(initial_entry[0], list):
                            for sub_entry in initial_entry:
                                normalized = normalize_braille_entry(sub_entry, braille_map)
                                if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                    res.append(normalized)
                        else:
                            normalized = normalize_braille_entry(initial_entry, braille_map)
                            if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                res.append(normalized)
                    else:
                        print(f"[text_to_cells] Warning: initial '{initial_char}' not found in JSON")
                
                # 중성 처리
                if medial < len(vowels):
                    medial_char = vowels[medial]
                    # 새로운 구조에서 찾기
                    medial_entry = None
                    if "vowel" in braille_map and medial_char in braille_map["vowel"]:
                        medial_entry = braille_map["vowel"][medial_char]
                    elif medial_char in braille_map:
                        medial_entry = braille_map[medial_char]
                    
                    if medial_entry:
                        # 2차원 배열 처리 (이중모음): [[1, 2, 3, 6], [1, 2, 3, 5]]
                        if isinstance(medial_entry, list) and len(medial_entry) > 0 and isinstance(medial_entry[0], list):
                            for sub_entry in medial_entry:
                                normalized = normalize_braille_entry(sub_entry, braille_map)
                                if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                    res.append(normalized)
                        # 문자열 참조 형식: ["ㅗ", "⠗"] 형식
                        elif isinstance(medial_entry, list) and len(medial_entry) == 2 and all(isinstance(x, str) for x in medial_entry):
                            # 참조 형식: 각 참조를 해석하여 추가
                            for ref in medial_entry:
                                ref_entry = None
                                if "vowel" in braille_map and ref in braille_map["vowel"]:
                                    ref_entry = braille_map["vowel"][ref]
                                elif "special" in braille_map and ref in braille_map["special"]:
                                    ref_entry = braille_map["special"][ref]
                                
                                if ref_entry:
                                    normalized = normalize_braille_entry(ref_entry, braille_map)
                                    if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                        res.append(normalized)
                                else:
                                    print(f"[text_to_cells] Warning: vowel ref '{ref}' not found")
                        else:
                            normalized = normalize_braille_entry(medial_entry, braille_map)
                            if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                res.append(normalized)
                    else:
                        print(f"[text_to_cells] Warning: medial '{medial_char}' not found in JSON")
                
                # 종성 처리
                if final > 0 and final < len(consonants):
                    final_char = consonants[final]
                    # 새로운 구조에서 찾기 (final 섹션 우선)
                    final_entry = None
                    if "final" in braille_map and final_char in braille_map["final"]:
                        final_entry = braille_map["final"][final_char]
                    elif "initial" in braille_map and final_char in braille_map["initial"]:
                        # 종성이 초성과 동일한 경우
                        final_entry = braille_map["initial"][final_char]
                    elif final_char in braille_map:
                        final_entry = braille_map[final_char]
                    
                    if final_entry:
                        # 2차원 배열 처리 (겹받침): [[1], [3]]
                        if isinstance(final_entry, list) and len(final_entry) > 0 and isinstance(final_entry[0], list):
                            for sub_entry in final_entry:
                                normalized = normalize_braille_entry(sub_entry, braille_map)
                                if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                    res.append(normalized)
                        else:
                            normalized = normalize_braille_entry(final_entry, braille_map)
                            if any(normalized):  # 빈 패턴이 아닌 경우만 추가
                                res.append(normalized)
            else:
                # 구두점 처리
                if "punctuation" in braille_map and ch in braille_map["punctuation"]:
                    normalized = normalize_braille_entry(braille_map["punctuation"][ch], braille_map)
                    res.append(normalized)
                else:
                    # 알 수 없는 문자는 공백으로 처리
                    res.append([0, 0, 0, 0, 0, 0])
        
        return res
    except Exception as e:
        print(f"[braille_converter] Error in text_to_cells: {e}")
        import traceback
        traceback.print_exc()
        return []

