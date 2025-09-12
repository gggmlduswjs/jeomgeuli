import React from "react";

interface StepFooterProps {
  onPrev?: () => void;
  onRepeat?: () => void;
  onNext?: () => void;
  isLast?: boolean;
}

export default function StepFooter({ onPrev, onRepeat, onNext, isLast = false }: StepFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
      <div className="grid grid-cols-3 gap-2 p-4">
        <button
          onClick={onPrev}
          className="btn-dark text-sm"
        >
          이전
        </button>
        
        <button
          onClick={onRepeat}
          className="btn-dark text-sm"
        >
          반복
        </button>
        
        <button
          onClick={onNext}
          className="btn-primary text-sm"
        >
          {isLast ? "완료" : "다음"}
        </button>
      </div>
    </div>
  );
}
