// src/pages/LearnStep.tsx
import React, { useEffect, useMemo, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import BottomBar from "../components/BottomBar";
import { fetchChars, fetchWords, fetchSentences, convertBraille } from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import type { Cell } from "../lib/braille";

function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block w-4 h-4 rounded-full mx-1 my-1 border ${on ? "bg-blue-500 border-blue-500 shadow" : "bg-white border-gray-300"}`} />;
}
function CellView({ c }: { c: Cell }) {
  const [a,b,c2,d,e,f] = c || [0,0,0,0,0,0];
  return (
    <div className="inline-flex flex-col px-2 py-1 rounded-xl border bg-white mr-2">
      <div><Dot on={!!a}/><Dot on={!!d}/></div>
      <div><Dot on={!!b}/><Dot on={!!e}/></div>
      <div><Dot on={!!c2}/><Dot on={!!f}/></div>
    </div>
  );
}

type Item = {
  char?: string; word?: string; sentence?: string;
  name?: string; tts?: string | string[];
  cell?: Cell; cells?: Cell[]; braille?: Cell; brailles?: Cell[];
  examples?: string[];
};

export default function LearnStep(){
  const location = useLocation();
  const navigate = useNavigate();
  const mode: "char"|"word"|"sentence" =
    location.pathname.includes("/word") ? "word" :
    location.pathname.includes("/sentence") ? "sentence" : "char";

  const [items, setItems] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);
  const current = items[i];

  const title = mode==="char"?"자모 학습":mode==="word"?"단어 학습":"문장 학습";

  useEffect(() => {
    (async()=>{
      setLoading(true);
      try{
        const data = mode==="char" ? await fetchChars() : mode==="word" ? await fetchWords() : await fetchSentences();
        setItems(data?.items || []);
        setI(0);
      } finally { setLoading(false); }
    })();
  }, [mode]);

  // 점자 데이터가 없으면 클라이언트 변환으로 보충
  const [computed, setComputed] = useState<Cell[]>([]);
  useEffect(() => {
    const text = current?.word || current?.sentence || current?.char || current?.name || "";
    const hasCells =
      (current?.cells && current.cells.length) ||
      (current?.brailles && current.brailles.length) ||
      current?.cell || current?.braille;
    if (!text) { setComputed([]); return; }
    if (hasCells) { setComputed([]); return; } // 원본 데이터 우선
    (async()=> setComputed(await convertBraille(text)))();
  }, [current]);

  const heading = current?.word || current?.sentence || current?.char || current?.name || "";
  const cells: Cell[] = useMemo(() => {
    if (!current) return [];
    if (Array.isArray(current.cells) && current.cells.length) return current.cells as Cell[];
    if (Array.isArray(current.brailles) && current.brailles.length) return current.brailles as Cell[];
    if (current.cell) return [current.cell];
    if (current.braille) return [current.braille];
    return computed || [];
  }, [current, computed]);

  const say = (t: string) => { try { const u=new SpeechSynthesisUtterance(t); u.lang="ko-KR"; window.speechSynthesis.speak(u);}catch{} };
  useEffect(()=> {
    const t = Array.isArray(current?.tts) ? current?.tts.join(" ") : (current?.tts || heading);
    if (t) say(t);
  }, [i, heading]);

  const next = () => {
    if (i < items.length - 1) setI(i+1);
    else navigate(`/quiz/${mode}?auto=1`);   // 학습 끝 → 자동 퀴즈
  };
  const prev = () => setI(Math.max(0, i-1));
  const repeat = () => {
    const t = Array.isArray(current?.tts) ? current?.tts.join(" ") : (current?.tts || heading);
    if (t) say(t);
  };

  if (loading) return <AppShellMobile title={title}><div className="p-6 text-gray-500">불러오는 중…</div></AppShellMobile>;
  if (!current) return <AppShellMobile title={title}><div className="p-6 text-gray-500">학습 항목이 없습니다.</div></AppShellMobile>;

  return (
    <AppShellMobile title={title}>
      <div className="space-y-4 pb-28 p-4">
        <div className="rounded-2xl bg-white border p-4">
          <div className="text-sm text-gray-500 mb-1">안내</div>
          <div className="text-lg">{Array.isArray(current.tts) ? current.tts.join(" ") : (current.tts || heading)}</div>
          {!!current?.examples?.length && <div className="text-sm text-gray-400 mt-2">예시: {current.examples.join(", ")}</div>}
        </div>

        <div className="rounded-2xl bg-white border p-6 text-center">
          <div className="text-3xl font-extrabold text-slate-800 mb-3">{heading}</div>
          <div className="inline-flex">{cells.length ? cells.map((c,idx)=><CellView key={idx} c={c} />) : <span className="text-gray-400">점자 데이터가 없습니다.</span>}</div>
        </div>
      </div>

      <BottomBar onLeft={prev} onMid={repeat} onRight={next} rightLabel={i===items.length-1?"테스트":"다음"} />
    </AppShellMobile>
  );
}