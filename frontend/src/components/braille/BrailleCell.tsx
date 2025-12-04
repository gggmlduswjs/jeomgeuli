import { useState, useEffect } from "react";
import { localToBrailleCells } from "@/lib/braille";
import type { DotArray } from "@/types";

type CellBool = [boolean, boolean, boolean, boolean, boolean, boolean];

interface BrailleCellProps {
  keyword?: string;
  pattern?: DotArray;     // 외부에서 넘어오는 임의 배열도 허용 → 내부 정규화
  active?: boolean;
  className?: string;
}

const OFF6: CellBool = [false, false, false, false, false, false];

const normalizeTo6 = (arr?: DotArray | CellBool): CellBool => {
  const out: boolean[] = Array.isArray(arr) ? arr.slice(0, 6) : [];
  while (out.length < 6) out.push(false);
  return out as CellBool;
};

export function BrailleCell({
  keyword,
  pattern,
  active = true,
  className = "",
}: BrailleCellProps) {
  // 점자 패턴 결정 (pattern 우선, 없으면 keyword 변환)
  const [braillePattern, setBraillePattern] = useState<CellBool>(OFF6);
  
  useEffect(() => {
    if (!active) {
      setBraillePattern(OFF6);
      return;
    }
    if (pattern) {
      setBraillePattern(normalizeTo6(pattern));
      return;
    }
    if (!keyword) {
      setBraillePattern(OFF6);
      return;
    }

    // localToBrailleCells는 async이므로 useEffect에서 처리
    let cancelled = false;
    (async () => {
      try {
        const cells = await localToBrailleCells(keyword);
        if (!cancelled) {
          // 한 글자 기준 첫 셀 사용. 없으면 OFF6
          const first = Array.isArray(cells) && cells.length > 0 ? (cells[0] as unknown as DotArray | undefined) : undefined;
          setBraillePattern(normalizeTo6(first));
        }
      } catch {
        if (!cancelled) setBraillePattern(OFF6);
      }
    })();
    
    return () => { cancelled = true; };
  }, [keyword, pattern, active]);

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* 점자 셀 시각화 (표준 2x3, column-major) */}
      <div
        className="grid grid-cols-2 grid-rows-3 grid-flow-col gap-1 p-3 bg-white border-2 border-slate-300 rounded-lg shadow-sm"
        role="group"
        aria-label={keyword ? `점자 셀: ${keyword}` : "점자 셀"}
      >
        {braillePattern.map((dot, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full border border-slate-400 ${
              dot ? "bg-slate-800" : "bg-white"
            }`}
            aria-hidden={true}
          />
        ))}
      </div>

      {/* 키워드 표시 */}
      {keyword && (
        <div className="text-center">
          <div className="text-sm font-medium text-slate-700">
            {active ? keyword : "대기 중"}
          </div>
          <div className="text-xs text-slate-500">
            {active ? "출력 중" : "정지됨"}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrailleCell;
