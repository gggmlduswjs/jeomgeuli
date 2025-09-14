import { useEffect, useState } from "react";
import { toBraille, cellsToBins } from "../lib/brailleRules";

export default function useBraille(text: string) {
  const [cells, setCells] = useState<boolean[][]>([]);
  useEffect(() => {
    if (!text) { 
      setCells([]); 
      return; 
    }
    
    try {
      // 새로운 점자 변환 시스템 사용
      const tokens = toBraille(text);
      const bins = cellsToBins(tokens);
      setCells(bins);
    } catch (error) {
      console.error('점자 변환 오류:', error);
      setCells([]);
    }
  }, [text]);
  return cells;
}