import { useEffect, useState } from "react";
import { brailleConvert } from "../lib/api";
import { localToBrailleCells, type Cell } from "../lib/braille";

export default function useBraille(text: string) {
  const [cells, setCells] = useState<Cell[]>([]);
  useEffect(() => {
    let off = false;
    (async () => {
      if (!text) { setCells([]); return; }
      try {
        const r = await brailleConvert(text);
        if (!off && Array.isArray(r) && r.length) { 
          setCells(r); 
          return; 
        }
      } catch {}
      if (!off) setCells(localToBrailleCells(text));
    })();
    return () => { off = true; };
  }, [text]);
  return cells;
}