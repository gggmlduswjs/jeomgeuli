import { FileText, Type, Volume2 } from 'lucide-react';
import type { SummarizeResult } from '../types/explore';

interface SummaryCardProps {
  summary: SummarizeResult;
  onDetailClick: () => void;
  onBrailleClick: () => void;
  onKeywordClick: (keyword: string) => void;
  className?: string;
}

export function SummaryCard({ 
  summary, 
  onDetailClick, 
  onBrailleClick, 
  onKeywordClick,
  className = '' 
}: SummaryCardProps) {
  const { bullets, keywords, source } = summary;
  
  return (
    <div 
      className={`
        bg-white border border-border rounded-2xl p-6 shadow-toss
        ${className}
      `}
      role="region"
      aria-label={`${source} 요약 정보`}
    >
      {/* 제목 */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-fg">
          요약 5가지
        </h3>
      </div>
      
      {/* 불릿 포인트 */}
      <div className="mb-6">
        <ul className="space-y-2" role="list">
          {bullets.map((bullet, index) => (
            <li 
              key={index}
              className="flex items-start gap-3"
              role="listitem"
              aria-label={`요약 ${index + 1}: ${bullet}`}
            >
              <span 
                className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"
                aria-hidden="true"
              />
              <span className="text-fg leading-relaxed">
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* 키워드 칩 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-3">
          핵심 키워드
        </h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <button
              key={index}
              onClick={() => onKeywordClick(keyword)}
              className="
                px-3 py-2 bg-primary/10 text-primary rounded-lg
                border border-primary/20 hover:bg-primary/20
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              "
              aria-label={`${keyword} 키워드 점자 출력`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
      
      {/* 액션 버튼들 */}
      <div className="flex gap-3">
        <button
          onClick={onDetailClick}
          className="
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            bg-accent text-white rounded-lg
            hover:bg-accent/90 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
          "
          aria-label="자세한 설명 보기"
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span>자세히 설명</span>
        </button>
        
        <button
          onClick={onBrailleClick}
          className="
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            bg-primary text-white rounded-lg
            hover:bg-primary/90 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          "
          aria-label="모든 키워드 점자 출력"
        >
          <Type className="w-4 h-4" aria-hidden="true" />
          <span>키워드 점자 출력</span>
        </button>
      </div>
      
      {/* 스크린 리더용 요약 텍스트 */}
      <div className="sr-only" aria-live="polite">
        요약 완료: {bullets.join('. ')}. 키워드: {keywords.join(', ')}
      </div>
    </div>
  );
}

export default SummaryCard;
