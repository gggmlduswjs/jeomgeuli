import { useEffect, useMemo, useState } from "react";
import { convertBraille } from "../lib/api";
import BrailleCell from "../components/BrailleCell";

export default function Review(){
  const key = `review_${new Date().toISOString().slice(0,10)}`;
  const items = useMemo(()=> JSON.parse(localStorage.getItem(key)||"[]") as {kind:string, content:string}[], []);
  const [idx,setIdx] = useState(0);
  const cur = items[idx];

  const [cells,setCells] = useState<number[][]>([]);
  useEffect(()=>{
    (async ()=>{
      if(!cur) return;
      const result = await convertBraille(cur.content);
      setCells(result.map((x:any)=> x.cells?.[0] || [0,0,0,0,0,0]));
    })();
  },[cur]);

  if(items.length===0) return (<main className="p-6">오늘은 복습할 항목이 없습니다.</main>);

  return (
    <main className="p-6 space-y-4">
      <div className="text-lg font-semibold">복습 노트 ({new Date().toISOString().slice(0,10)})</div>
      <div className="card p-6">
        <div className="mb-2 text-gray-500">{cur.kind}</div>
        <div className="flex gap-3 flex-wrap">
          {cells.map((c,i)=>(<BrailleCell key={i} cell={c as any}/>))}
        </div>
        <div className="mt-3 text-2xl font-bold">{cur.content}</div>
      </div>
      <div className="fixed bottom-3 inset-x-0 px-6">
        <div className="flex gap-3">
          <button className="btn flex-1" onClick={()=>setIdx(Math.max(0,idx-1))}>이전</button>
          <button className="btn-primary flex-1" onClick={()=>setIdx(idx+1<items.length?idx+1:idx)}>다음</button>
        </div>
      </div>
    </main>
  );
}