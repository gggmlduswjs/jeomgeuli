"""
한글 점자 인코딩 모듈
한글 문자를 점자 패턴으로 변환하고 CMD/PATTERN 패킷을 생성합니다.
"""
import unicodedata
from typing import List, Tuple
from .braille_converter import (
    _load_braille_map,
    dots_to_bit_array,
    bit_array_to_pattern,
    normalize_braille_entry,
)

# CMD 정의
CMD_SINGLE = 0x80  # 단일 셀 모드 (자모 모드)
CMD_MULTI = 0x81   # 다중 셀 모드 (단어/문장 모드)
CMD_CLEAR = 0x82   # 모든 셀 클리어
CMD_TEST = 0x83    # 테스트 모드 (dot1~dot6 순차 출력)


def dots_to_pattern(dots: List[int]) -> int:
    """
    점 번호 리스트를 패턴 바이트로 변환
    예: [1, 2, 6] → 0x23
    
    Args:
        dots: 점 번호 리스트 (1~6)
    
    Returns:
        패턴 바이트 (0~63, 6-bit)
    """
    bit_array = dots_to_bit_array(dots)
    return bit_array_to_pattern(bit_array)


def encode_char(char: str) -> List[Tuple[int, int]]:
    """
    단일 문자를 CMD/PATTERN 패킷 리스트로 변환
    
    Args:
        char: 변환할 문자 (한글 자모 또는 완성형)
    
    Returns:
        [(CMD, pattern), ...] 리스트
    """
    if not char:
        return []
    
    normalized_text = unicodedata.normalize("NFC", char)
    braille_map = _load_braille_map()
    
    if not braille_map or "initial" not in braille_map:
        return []
    
    packets = []
    
    # 자모 직접 처리
    if "initial" in braille_map and normalized_text[0] in braille_map["initial"]:
        initial_entry = braille_map["initial"][normalized_text[0]]
        # 2차원 배열 처리 (쌍자음)
        if isinstance(initial_entry, list) and len(initial_entry) > 0 and isinstance(initial_entry[0], list):
            for i, sub_entry in enumerate(initial_entry):
                normalized = normalize_braille_entry(sub_entry, braille_map)
                if any(normalized):
                    pattern = bit_array_to_pattern(normalized)
                    cmd = CMD_SINGLE if i == 0 else CMD_MULTI
                    packets.append((cmd, pattern))
            if packets:
                return packets
        else:
            normalized = normalize_braille_entry(initial_entry, braille_map)
            if any(normalized):
                pattern = bit_array_to_pattern(normalized)
                packets.append((CMD_SINGLE, pattern))
                return packets
    
    if "vowel" in braille_map and normalized_text[0] in braille_map["vowel"]:
        medial_entry = braille_map["vowel"][normalized_text[0]]
        # 2차원 배열 처리 (이중모음)
        if isinstance(medial_entry, list) and len(medial_entry) > 0 and isinstance(medial_entry[0], list):
            for i, sub_entry in enumerate(medial_entry):
                normalized = normalize_braille_entry(sub_entry, braille_map)
                if any(normalized):
                    pattern = bit_array_to_pattern(normalized)
                    cmd = CMD_SINGLE if i == 0 else CMD_MULTI
                    packets.append((cmd, pattern))
            if packets:
                return packets
        else:
            normalized = normalize_braille_entry(medial_entry, braille_map)
            if any(normalized):
                pattern = bit_array_to_pattern(normalized)
                packets.append((CMD_SINGLE, pattern))
                return packets
    
    if "final" in braille_map and normalized_text[0] in braille_map["final"]:
        final_entry = braille_map["final"][normalized_text[0]]
        # 2차원 배열 처리 (겹받침)
        if isinstance(final_entry, list) and len(final_entry) > 0 and isinstance(final_entry[0], list):
            for i, sub_entry in enumerate(final_entry):
                normalized = normalize_braille_entry(sub_entry, braille_map)
                if any(normalized):
                    pattern = bit_array_to_pattern(normalized)
                    cmd = CMD_SINGLE if i == 0 else CMD_MULTI
                    packets.append((cmd, pattern))
            if packets:
                return packets
        else:
            normalized = normalize_braille_entry(final_entry, braille_map)
            if any(normalized):
                pattern = bit_array_to_pattern(normalized)
                packets.append((CMD_SINGLE, pattern))
                return packets
    
    # 한글인 경우 자음+모음으로 분해
    if '가' <= normalized_text[0] <= '힣':
        base = ord(normalized_text[0]) - ord('가')
        initial = base // (21 * 28)  # 초성
        medial = (base % (21 * 28)) // 28  # 중성
        final = base % 28  # 종성
        
        consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
        vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
        
        patterns = []
        
        # 초성 처리
        if initial < len(consonants):
            initial_char = consonants[initial]
            if "initial" in braille_map and initial_char in braille_map["initial"]:
                initial_entry = braille_map["initial"][initial_char]
                # 2차원 배열 처리 (쌍자음): [[6], [4]]
                if isinstance(initial_entry, list) and len(initial_entry) > 0 and isinstance(initial_entry[0], list):
                    for sub_entry in initial_entry:
                        normalized = normalize_braille_entry(sub_entry, braille_map)
                        if any(normalized):
                            pattern = bit_array_to_pattern(normalized)
                            patterns.append(pattern)
                else:
                    normalized = normalize_braille_entry(initial_entry, braille_map)
                    if any(normalized):
                        pattern = bit_array_to_pattern(normalized)
                        patterns.append(pattern)
        
        # 중성 처리
        if medial < len(vowels):
            medial_char = vowels[medial]
            if "vowel" in braille_map and medial_char in braille_map["vowel"]:
                medial_entry = braille_map["vowel"][medial_char]
                
                # 2차원 배열 처리 (이중모음): [[1, 2, 3, 6], [1, 2, 3, 5]]
                if isinstance(medial_entry, list) and len(medial_entry) > 0 and isinstance(medial_entry[0], list):
                    for sub_entry in medial_entry:
                        normalized = normalize_braille_entry(sub_entry, braille_map)
                        if any(normalized):
                            pattern = bit_array_to_pattern(normalized)
                            patterns.append(pattern)
                # 문자열 참조 형식: ["ㅗ", "⠗"] 형식
                elif isinstance(medial_entry, list) and len(medial_entry) == 2 and all(isinstance(x, str) for x in medial_entry):
                    for ref in medial_entry:
                        ref_entry = None
                        if "vowel" in braille_map and ref in braille_map["vowel"]:
                            ref_entry = braille_map["vowel"][ref]
                        elif "special" in braille_map and ref in braille_map["special"]:
                            ref_entry = braille_map["special"][ref]
                        
                        if ref_entry:
                            normalized = normalize_braille_entry(ref_entry, braille_map)
                            if any(normalized):
                                pattern = bit_array_to_pattern(normalized)
                                patterns.append(pattern)
                else:
                    normalized = normalize_braille_entry(medial_entry, braille_map)
                    if any(normalized):
                        pattern = bit_array_to_pattern(normalized)
                        patterns.append(pattern)
        
        # 종성 처리
        if final > 0 and final < len(consonants):
            final_char = consonants[final]
            final_entry = None
            if "final" in braille_map and final_char in braille_map["final"]:
                final_entry = braille_map["final"][final_char]
            elif "initial" in braille_map and final_char in braille_map["initial"]:
                final_entry = braille_map["initial"][final_char]
            
            if final_entry:
                # 2차원 배열 처리 (겹받침): [[1], [3]]
                if isinstance(final_entry, list) and len(final_entry) > 0 and isinstance(final_entry[0], list):
                    for sub_entry in final_entry:
                        normalized = normalize_braille_entry(sub_entry, braille_map)
                        if any(normalized):
                            pattern = bit_array_to_pattern(normalized)
                            patterns.append(pattern)
                else:
                    normalized = normalize_braille_entry(final_entry, braille_map)
                    if any(normalized):
                        pattern = bit_array_to_pattern(normalized)
                        patterns.append(pattern)
        
        # 패턴이 있으면 패킷 생성
        if patterns:
            # 단일 패턴이면 CMD_SINGLE, 여러 패턴이면 CMD_MULTI
            cmd = CMD_SINGLE if len(patterns) == 1 else CMD_MULTI
            for i, pattern in enumerate(patterns):
                # 첫 번째 패턴만 CMD 설정, 나머지는 CMD_MULTI
                packet_cmd = cmd if i == 0 else CMD_MULTI
                packets.append((packet_cmd, pattern))
    
    else:
        # 구두점 처리
        if "punctuation" in braille_map and normalized_text[0] in braille_map["punctuation"]:
            normalized = normalize_braille_entry(braille_map["punctuation"][normalized_text[0]], braille_map)
            pattern = bit_array_to_pattern(normalized)
            packets.append((CMD_SINGLE, pattern))
        else:
            # 알 수 없는 문자는 공백
            packets.append((CMD_SINGLE, 0x00))
    
    return packets


def encode_word(word: str) -> List[Tuple[int, int]]:
    """
    단어를 CMD/PATTERN 패킷 리스트로 변환
    
    Args:
        word: 변환할 단어
    
    Returns:
        [(CMD, pattern), ...] 리스트
    """
    if not word:
        return []
    
    packets = []
    normalized_text = unicodedata.normalize("NFC", word or "")
    
    for char in normalized_text:
        char_packets = encode_char(char)
        packets.extend(char_packets)
    
    return packets


def encode_sentence(sentence: str) -> List[Tuple[int, int]]:
    """
    문장을 CMD/PATTERN 패킷 리스트로 변환
    
    Args:
        sentence: 변환할 문장
    
    Returns:
        [(CMD, pattern), ...] 리스트
    """
    return encode_word(sentence)


def text_to_packets(text: str) -> List[Tuple[int, int]]:
    """
    텍스트를 CMD/PATTERN 패킷 리스트로 변환 (메인 진입점)
    
    Args:
        text: 변환할 텍스트
    
    Returns:
        [(CMD, pattern), ...] 리스트
    """
    if not text:
        return []
    
    return encode_sentence(text)

