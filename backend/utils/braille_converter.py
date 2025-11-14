"""
점자 변환 유틸리티
"""
import json
import unicodedata
from pathlib import Path
from django.conf import settings
from typing import List

DATA_DIR = Path(settings.BASE_DIR) / "data"

# 전역 점자 매핑 캐시
_BRAILLE_MAP = None


def _load_braille_map() -> dict:
    """점자 매핑 테이블을 안전하게 로드 (캐시 사용)"""
    global _BRAILLE_MAP
    if _BRAILLE_MAP is not None:
        return _BRAILLE_MAP
    
    try:
        data_path = DATA_DIR / "ko_braille.json"
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            _BRAILLE_MAP = data
            return data
    except Exception:
        _BRAILLE_MAP = {}
        return {}


def text_to_cells(text: str) -> List[List[int]]:
    """
    텍스트를 점자 셀로 변환 (한글 자음+모음 분해 포함)
    
    Args:
        text: 변환할 텍스트
    
    Returns:
        점자 셀 리스트 [[0|1 x 6], ...]
    """
    try:
        # 유니코드 정규화로 조합형/분해형 통일 (NFC로 조합형 유지)
        normalized_text = unicodedata.normalize("NFC", text or "")
        braille_map = _load_braille_map()
        
        res = []
        for ch in normalized_text:
            # 먼저 완전한 글자로 매핑 시도
            arr = braille_map.get(ch)
            if isinstance(arr, list) and len(arr) == 6:
                res.append([1 if int(x) else 0 for x in arr])
                continue
            elif isinstance(arr, list) and len(arr) == 12:
                # 12개 점이면 2개 셀로 분할
                res.append([1 if int(x) else 0 for x in arr[:6]])
                res.append([1 if int(x) else 0 for x in arr[6:]])
                continue
            
            # 한글인 경우 자음+모음으로 분해
            if '가' <= ch <= '힣':
                base = ord(ch) - ord('가')
                initial = base // (21 * 28)  # 초성
                medial = (base % (21 * 28)) // 28  # 중성
                final = base % 28  # 종성
                
                consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
                vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
                
                if initial < len(consonants):
                    initial_char = consonants[initial]
                    initial_arr = braille_map.get(initial_char)
                    if isinstance(initial_arr, list) and len(initial_arr) == 6:
                        res.append([1 if int(x) else 0 for x in initial_arr])
                
                if medial < len(vowels):
                    medial_char = vowels[medial]
                    medial_arr = braille_map.get(medial_char)
                    if isinstance(medial_arr, list) and len(medial_arr) == 6:
                        res.append([1 if int(x) else 0 for x in medial_arr])
                
                if final > 0 and final < len(consonants):
                    final_char = consonants[final]
                    final_arr = braille_map.get(final_char)
                    if isinstance(final_arr, list) and len(final_arr) == 6:
                        res.append([1 if int(x) else 0 for x in final_arr])
            else:
                # 알 수 없는 문자는 공백으로 처리
                res.append([0, 0, 0, 0, 0, 0])
        
        return res
    except Exception:
        return []

