// src/pages/Explore.tsx
import React, { useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import { fetchNews, convertBraille } from "../lib/api";
import type { Cell } from "../lib/braille";

function Dot({ on }: { on:boolean }) {
  return <span className={`inline-block w-3 h-3 rounded-full mx-0.5 border ${on?"bg-blue-500 border-blue-500":"bg-white border-gray-300"}`} />;
}
function Chip({ word, cells }: { word: string; cells: Cell[] }) {
  return (
    <div className="inline-flex items-center mr-2 mb-2 rounded-full border px-3 py-1 bg-white">
      <span className="mr-2 text-sm font-medium">{word}</span>
      <div className="inline-flex">{cells.slice(0,3).map((c, i)=>(
        <span key={i} className="inline-flex flex-col mx-0.5">
          <div><Dot on={!!c[0]}/><Dot on={!!c[3]}/></div>
          <div><Dot on={!!c[1]}/><Dot on={!!c[4]}/></div>
          <div><Dot on={!!c[2]}/><Dot on={!!c[5]}/></div>
        </span>
      ))}</div>
    </div>
  );
}

export default function Explore(){
  const [q, setQ] = useState("오늘의 뉴스 5개 요약해줘");
  const [items, setItems] = useState<{title:string, summary:string, link?:string}[]>([]);
  const [chips, setChips] = useState<{word:string, cells:Cell[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const ask = async () => {
    setLoading(true); setErr(null);
    try{
      const list = await fetchNews(q);
      setItems(list);
      // 제목에서 간단 키워드 3개 추출 → 점자칩
      const ks = Array.from(new Set(list.map(x => (x.title||"").split(/[ ,:/\-]/)[0]).filter(Boolean))).slice(0,3);
      const withBraille = await Promise.all(ks.map(async w => ({ word:w, cells: await convertBraille(w) })));
      setChips(withBraille);
    }catch(e:any){
      setErr(e?.message || "요청에 실패했습니다.");
    }finally{ setLoading(false); }
  };

  return (
    <AppShellMobile title="정보 탐색">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <input className="flex-1 rounded-2xl border px-4 py-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="무엇을 도와드릴까요?" />
          <button onClick={ask} className="rounded-2xl bg-blue-600 text-white px-4 py-2">질문</button>
        </div>

        {chips.length>0 && (
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-sm text-gray-500 mb-2">핵심 키워드</div>
            {chips.map((c,i)=><Chip key={i} word={c.word} cells={c.cells} />)}
          </div>
        )}

        {loading && <div className="text-gray-500">불러오는 중…</div>}
        {err && <div className="text-red-500">{err}</div>}

        <div className="space-y-3">
          {items.map((n,idx)=>(
            <div key={idx} className="rounded-2xl border bg-white p-4">
              <div className="font-semibold mb-1">{n.title}</div>
              <div className="text-gray-600 text-sm">{n.summary}</div>
              {n.link ? <a className="text-blue-600 text-sm underline" href={n.link} target="_blank" rel="noreferrer">원문 보기</a> : null}
            </div>
          ))}
        </div>
      </div>
    </AppShellMobile>
  );
}