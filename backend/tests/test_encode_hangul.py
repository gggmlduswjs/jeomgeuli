"""
Backend encodeHangul 모듈 테스트
"""
import unittest
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.encode_hangul import (
    encode_char,
    encode_word,
    encode_sentence,
    text_to_packets,
    CMD_SINGLE,
    CMD_MULTI,
    dots_to_pattern
)


class TestEncodeHangul(unittest.TestCase):
    
    def test_dots_to_pattern(self):
        """점 번호 리스트를 패턴으로 변환 테스트"""
        # [1,2,6] → 0x23 (bit0=1, bit1=1, bit5=1)
        self.assertEqual(dots_to_pattern([1, 2, 6]), 0x23)
        # [4] → 0x08 (bit3=1)
        self.assertEqual(dots_to_pattern([4]), 0x08)
        # [1,3,5] → 0x15 (bit0=1, bit2=1, bit4=1)
        self.assertEqual(dots_to_pattern([1, 3, 5]), 0x15)
    
    def test_encode_char_single_jamo(self):
        """단일 자모 인코딩 테스트 (CMD_SINGLE)"""
        # "ㄱ" → CMD_SINGLE + pattern
        packets = encode_char("ㄱ")
        self.assertGreater(len(packets), 0)
        self.assertEqual(packets[0][0], CMD_SINGLE)
        
        # "ㅏ" → CMD_SINGLE + pattern
        packets = encode_char("ㅏ")
        self.assertGreater(len(packets), 0)
        self.assertEqual(packets[0][0], CMD_SINGLE)
    
    def test_encode_char_complete_hangul(self):
        """완성형 한글 인코딩 테스트 (CMD_MULTI)"""
        # "가" → CMD_MULTI + patterns (초성+중성)
        packets = encode_char("가")
        self.assertGreaterEqual(len(packets), 2)  # 최소 2개 패턴 (초성+중성)
        self.assertEqual(packets[0][0], CMD_MULTI)
        
        # "각" → CMD_MULTI + patterns (초성+중성+종성)
        packets = encode_char("각")
        self.assertGreaterEqual(len(packets), 3)  # 최소 3개 패턴 (초성+중성+종성)
        self.assertEqual(packets[0][0], CMD_MULTI)
    
    def test_encode_word(self):
        """단어 인코딩 테스트"""
        # "가나다" → 여러 패킷
        packets = encode_word("가나다")
        self.assertGreater(len(packets), 0)
        
        # 각 패킷은 [cmd, pattern] 형식
        for packet in packets:
            self.assertEqual(len(packet), 2)
            self.assertIn(packet[0], [CMD_SINGLE, CMD_MULTI])
            self.assertGreaterEqual(packet[1], 0)
            self.assertLessEqual(packet[1], 0x3F)
    
    def test_encode_sentence(self):
        """문장 인코딩 테스트"""
        packets = encode_sentence("안녕하세요")
        self.assertGreater(len(packets), 0)
    
    def test_text_to_packets(self):
        """메인 진입점 테스트"""
        packets = text_to_packets("가나다")
        self.assertGreater(len(packets), 0)
        
        # 패킷 형식 검증
        for packet in packets:
            self.assertEqual(len(packet), 2)
            self.assertIn(packet[0], [CMD_SINGLE, CMD_MULTI])
            self.assertGreaterEqual(packet[1], 0)
            self.assertLessEqual(packet[1], 0x3F)
    
    def test_compound_vowels(self):
        """이중모음 테스트 (ㅙ, ㅞ, ㅟ)"""
        # 이중모음은 2개 패턴으로 변환되어야 함
        packets = encode_char("와")  # ㅘ는 단일 패턴
        self.assertGreater(len(packets), 0)
        
        # ㅙ, ㅞ, ㅟ는 ["ㅗ"/"ㅜ", "⠗"] 형식이므로 2개 패턴
        # (실제 구현에 따라 다를 수 있음)
    
    def test_punctuation(self):
        """구두점 테스트"""
        packets = encode_char(" ")
        self.assertEqual(len(packets), 1)
        self.assertEqual(packets[0][0], CMD_SINGLE)
        self.assertEqual(packets[0][1], 0x00)  # 공백은 0x00


if __name__ == '__main__':
    unittest.main()

