import React from 'react';

interface BrailleCellProps {
  pattern: boolean[]; // 6개 점의 활성화 상태 [1,2,3,4,5,6]
  size?: 'normal' | 'large';
  label?: string;
  className?: string;
  onPatternChange?: (pattern: boolean[]) => void;
  interactive?: boolean;
}

export default function BrailleCell({ 
  pattern, 
  size = 'normal', 
  label,
  className = '',
  onPatternChange,
  interactive = false 
}: BrailleCellProps) {
  const dots = pattern.length === 6 ? pattern : [false, false, false, false, false, false];
  
  const handleDotClick = (index: number) => {
    if (!interactive || !onPatternChange) return;
    
    const newPattern = [...dots];
    newPattern[index] = !newPattern[index];
    onPatternChange(newPattern);
  };

  const getAriaLabel = () => {
    if (label) return label;
    
    const activeDots = dots.map((active, index) => active ? index + 1 : null).filter(Boolean);
    if (activeDots.length === 0) return '빈 점자 셀';
    
    return `점자 셀, 활성 점: ${activeDots.join(', ')}번`;
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div 
        className={`braille-grid ${size === 'large' ? 'large' : ''}`}
        role="img"
        aria-label={getAriaLabel()}
        tabIndex={interactive ? 0 : -1}
      >
        {dots.map((active, index) => (
          <div
            key={index}
            className={`braille-dot ${active ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDotClick(index);
              }
            }}
            tabIndex={interactive ? 0 : -1}
            role={interactive ? 'button' : 'img'}
            aria-label={`점 ${index + 1}번 ${active ? '활성' : '비활성'}`}
            aria-pressed={active}
          />
        ))}
      </div>
      {label && (
        <div className="mt-2 text-sm text-secondary" aria-live="polite">
          {label}
        </div>
      )}
    </div>
  );
}