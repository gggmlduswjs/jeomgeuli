import { useCallback } from 'react';
import type { Intent } from '../types/explore';

export function useNLU() {
  const parse = useCallback((text: string): Intent => {
    const t = text.toLowerCase().trim();
    
    // 명령어 우선 처리
    if (t.includes("자세히") || t.includes("자세하게") || t.includes("더 자세히")) {
      return "detail";
    }
    
    if (t.includes("키워드") && (t.includes("점자") || t.includes("출력"))) {
      return "braille";
    }
    
    if (t.includes("다음") || t.includes("다음거") || t.includes("다음 항목")) {
      return "next";
    }
    
    if (t.includes("반복") || t.includes("다시") || t.includes("다시 읽어")) {
      return "repeat";
    }
    
    if (t.includes("중지") || t.includes("그만") || t.includes("멈춰")) {
      return "stop";
    }
    
    // 도메인 분류
    if (t.includes("날씨") || t.includes("기상") || t.includes("온도") || t.includes("날씨가")) {
      return "weather";
    }
    
    if (t.includes("뉴스") || t.includes("뉴스 5개") || t.includes("오늘의 뉴스") || t.includes("뉴스 요약")) {
      return "news";
    }
    
    // 일반 질문
    return "generic";
  }, []);

  return { parse };
}

