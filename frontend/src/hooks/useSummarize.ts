import { useCallback } from "react";
import type { SummarizeResult } from "../types/explore";

export function useSummarize() {
  const summarize = useCallback(async (
    input: string, 
    source?: 'news' | 'weather' | 'generic'
  ): Promise<SummarizeResult> => {
    const clean = input.trim();
    
    // 도메인별 템플릿 기반 요약 생성
    if (source === 'weather') {
      const bullets = [
        `오늘 날씨는 맑음입니다`,
        `기온은 26도로 쾌적합니다`,
        `미세먼지 농도는 보통 수준입니다`,
        `바람은 약간 불고 있습니다`,
        `자외선 지수는 높으니 주의하세요`
      ];
      const keywords = ["맑음", "26도", "미세먼지"];
      const longText = `오늘 날씨는 전반적으로 맑고 쾌적한 날씨가 예상됩니다. 기온은 26도로 적당한 온도이며, 미세먼지 농도는 보통 수준입니다. 바람이 약간 불어 쾌적감을 주고 있으며, 자외선 지수는 높아 외출 시 선크림 사용을 권장합니다.`;
      
      return { bullets, keywords, longText, source };
    }
    
    if (source === 'news') {
      const bullets = [
        `${clean} 관련 주요 뉴스입니다`,
        `첫 번째 뉴스: 중요한 사건이 발생했습니다`,
        `두 번째 뉴스: 경제 관련 소식이 전해졌습니다`,
        `세 번째 뉴스: 사회 이슈에 대한 관심이 높아지고 있습니다`,
        `네 번째 뉴스: 기술 분야에서 새로운 발전이 있었습니다`
      ];
      const keywords = ["주요뉴스", "경제", "사회"];
      const longText = `${clean} 관련 뉴스 요약입니다. 첫 번째로 중요한 사건이 발생하여 사회적 관심을 끌고 있습니다. 경제 분야에서는 긍정적인 소식이 전해졌으며, 사회 이슈에 대한 논의가 활발해지고 있습니다. 기술 분야에서는 혁신적인 발전이 있었으며, 이러한 변화들이 미래에 미칠 영향을 주목해야 할 것 같습니다.`;
      
      return { bullets, keywords, longText, source };
    }
    
    // 일반 질문 처리
    const bullets = [
      `${clean}에 대한 핵심 요약 1`,
      `${clean}에 대한 핵심 요약 2`,
      `${clean}에 대한 핵심 요약 3`,
      `${clean}에 대한 핵심 요약 4`,
      `${clean}에 대한 핵심 요약 5`
    ];
    const keywords = ["핵심1", "핵심2", "핵심3"];
    const longText = `${clean}에 대한 자세한 설명입니다. ${bullets.join(" ")} 를 기반으로 더 길고 쉬운 설명을 제공합니다. 이 주제는 여러 측면에서 접근할 수 있으며, 각각의 관점에서 중요한 의미를 가지고 있습니다.`;
    
    return { bullets, keywords, longText, source: source ?? 'generic' };
  }, []);

  return { summarize };
}

