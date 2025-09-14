import { FileText, Type, Volume2 } from 'lucide-react';
import { localToBrailleCells } from '../lib/braille';
import type { ChatResponse } from '../lib/api';

interface SummaryCardProps {
  data: ChatResponse;
  className?: string;
  onBulletClick?: (index: number) => void;
}

export function SummaryCard({ 
  data, 
  className = '',
  onBulletClick
}: SummaryCardProps) {
  // 안전장치: data가 없으면 빈 컴포넌트 반환
  if (!data) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 shadow-toss">
        <p className="text-muted">요약 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 키워드 클릭 시 점자 출력
  const handleKeywordClick = (keyword: string) => {
    console.log(`점자 출력: ${keyword}`);
    const brailleCells = localToBrailleCells(keyword);
    console.log('점자 패턴:', brailleCells);
    // TODO: 실제 BLE 점자 디스플레이로 전송
  };

  const { chat_markdown = '', keywords = [], braille_words = [], mode = 'qa', actions = {}, meta = {} } = data;
  
  // 마크다운을 파싱하여 불릿 포인트 추출
  const bullets = chat_markdown
    .split('\n')
    .filter(line => line.trim().startsWith('•'))
    .map(line => line.replace(/^•\s*/, '').trim());
  
  return (
    <div 
      className={`
        bg-white border border-border rounded-2xl p-6 shadow-toss
        ${className}
      `}
      role="region"
      aria-label={`${mode} 모드 응답`}
    >
      {/* 제목 */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-fg">
          {mode === 'news' ? '뉴스 요약' : mode === 'explain' ? '설명' : '답변'}
        </h3>
      </div>
      
      {/* 불릿 포인트 */}
      {bullets.length > 0 && (
        <div className="mb-6">
          <ul className="space-y-2" role="list">
            {bullets.map((bullet, index) => (
              <li 
                key={index}
                className={`flex items-start gap-3 ${onBulletClick ? 'cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors' : ''}`}
                role="listitem"
                aria-label={`요약 ${index + 1}: ${bullet}`}
                onClick={() => onBulletClick?.(index)}
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
      )}
      
      {/* 키워드 칩 */}
      {keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-muted mb-3">
            핵심 키워드
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <button
                key={index}
                onClick={() => handleKeywordClick(keyword)}
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
      )}
      
      {/* 액션 힌트 */}
      {actions.voice_hint && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted">
            <strong>음성 명령:</strong> {actions.voice_hint}
          </p>
          {actions.learn_suggestion && (
            <p className="text-sm text-muted mt-1">
              {actions.learn_suggestion}
            </p>
          )}
        </div>
      )}
      
      {/* 출처 힌트 */}
      {meta.source_hint && (
        <div className="text-xs text-muted text-center">
          {meta.source_hint}
        </div>
      )}
      
      {/* 스크린 리더용 요약 텍스트 */}
      <div className="sr-only" aria-live="polite">
        요약 완료: {bullets.join('. ')}. 키워드: {keywords.join(', ')}
      </div>
    </div>
  );
}

export default SummaryCard;
