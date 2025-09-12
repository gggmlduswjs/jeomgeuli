import React, { useEffect, useState } from "react";
import { convertBraille } from "../lib/api";
import BrailleRow from "../components/BrailleRow";
import type { Cell } from "../lib/brailleLocal";

export default function Free(){
  const [text, setText] = useState("");
  const [cells, setCells] = useState<Cell[]>([]);
  useEffect(()=> { 
    (async ()=> setCells(await convertBraille(text)))(); 
  }, [text]);

  // 실제 출력은 3셀씩만 한다고 가정(UX), 화면은 전체 보임
  const chunkForOutput = cells.slice(0,3);

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <input value={text} onChange={e=>setText(e.target.value)}
        placeholder="텍스트를 입력하세요"
        className="w-full rounded-2xl border px-4 py-3" />
      <section className="p-4 bg-white rounded-2xl border">
        <div className="text-sm text-gray-500 mb-2">전체 미리보기</div>
        <BrailleRow cells={cells}/>
      </section>
      <section className="p-4 bg-white rounded-2xl border">
        <div className="text-sm text-gray-500 mb-2">출력(3셀)</div>
        <BrailleRow cells={chunkForOutput}/>
      </section>
    </main>
  );
}