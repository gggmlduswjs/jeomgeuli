import { useMemo } from 'react';
import { localToBrailleCells } from '../lib/braille';

interface BrailleCellProps {
  keyword?: string;
  pattern?: boolean[];
  active?: boolean;
  className?: string;
}

export function BrailleCell({ keyword, pattern, active = true, className = '' }: BrailleCellProps) {
  // 점자 패턴 결정 (pattern이 우선, 없으면 keyword에서 변환)
  const braillePattern = useMemo(() => {
    if (pattern) {
      return pattern;
    }
    
    if (!keyword || !active) {
      return [false, false, false, false, false, false];
    }
    
    const cells = localToBrailleCells(keyword);
    // 첫 번째 셀의 패턴을 사용 (키워드는 보통 한 글자)
    return cells[0] || [false, false, false, false, false, false];
  }, [keyword, pattern, active]);

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* 점자 셀 시각화 (2x3 그리드) */}
      <div className="grid grid-cols-2 gap-1 p-3 bg-white border-2 border-slate-300 rounded-lg shadow-sm">
        {braillePattern.map((dot, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full border border-slate-400 ${
              dot ? 'bg-slate-800' : 'bg-white'
            }`}
            aria-label={`점자 ${index + 1}번 ${dot ? '켜짐' : '꺼짐'}`}
          />
        ))}
      </div>
      
      {/* 키워드 표시 */}
      {keyword && (
        <div className="text-center">
          <div className="text-sm font-medium text-slate-700">
            {active ? keyword : '대기 중'}
          </div>
          <div className="text-xs text-slate-500">
            {active ? '출력 중' : '정지됨'}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrailleCell;