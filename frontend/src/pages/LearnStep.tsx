// src/pages/LearnStep.tsx
import React, { useEffect, useMemo, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import BottomBar from "../components/BottomBar";
import { fetchChars, fetchWords, fetchSentences, convertBraille } from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import type { Cell } from "../lib/braille";

function Dot({ on }: { on: boolean }) {
  return (
    <span 
      className={`inline-block w-5 h-5 rounded-full mx-0.5 my-0.5 border-2 transition-all duration-200 ${
        on 
          ? "bg-blue-600 border-blue-600 shadow-md" 
          : "bg-gray-100 border-gray-300"
      }`} 
    />
  );
}

function CellView({ c }: { c: Cell }) {
  const [a,b,c2,d,e,f] = c || [0,0,0,0,0,0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        <Dot on={!!a}/>
        <Dot on={!!d}/>
      </div>
      <div className="flex">
        <Dot on={!!b}/>
        <Dot on={!!e}/>
      </div>
      <div className="flex">
        <Dot on={!!c2}/>
        <Dot on={!!f}/>
      </div>
    </div>
  );
}

type Item = {
  char?: string; word?: string; sentence?: string;
  name?: string; tts?: string | string[];
  decomposeTTS?: string[]; ttsIntro?: string;
  cell?: Cell; cells?: Cell[]; braille?: Cell | string | string[]; brailles?: Cell[];
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
    const processBraille = async () => {
      const text = current?.word || current?.sentence || current?.char || current?.name || "";
      const hasCells =
        (current?.cells && current.cells.length) ||
        (current?.brailles && current.brailles.length) ||
        current?.cell || current?.braille;
      if (!text) { setComputed([]); return; }
      if (hasCells) { setComputed([]); return; } // 원본 데이터 우선
      
      // 클라이언트 사이드 점자 변환 개선
      try {
        const { localToBrailleCells } = await import("../lib/braille");
        const cells = localToBrailleCells(text);
        setComputed(cells);
      } catch (e) {
        console.warn("점자 변환 실패:", e);
        setComputed([]);
      }
    };
    
    processBraille();
  }, [current]);

  const heading = current?.word || current?.sentence || current?.char || current?.name || "";
  const cells: Cell[] = useMemo(() => {
    if (!current) return [];
    
    // 1. cells 배열이 있으면 우선 사용
    if (Array.isArray(current.cells) && current.cells.length) return current.cells as Cell[];
    
    // 2. brailles 배열이 있으면 사용
    if (Array.isArray(current.brailles) && current.brailles.length) return current.brailles as Cell[];
    
    // 3. cell 단일 값이 있으면 사용
    if (current.cell) return [current.cell];
    
    // 4. braille 필드 처리 (Cell, string, string[] 모두 가능)
    if (current.braille) {
      if (Array.isArray(current.braille)) {
        // string[]인 경우 - 각 문자를 점자로 변환
        const { localToBrailleCells } = require("../lib/braille");
        return current.braille.flatMap(char => localToBrailleCells(char));
      } else if (typeof current.braille === 'string') {
        // string인 경우 - 점자로 변환
        const { localToBrailleCells } = require("../lib/braille");
        return localToBrailleCells(current.braille);
      } else {
        // Cell인 경우
        return [current.braille];
      }
    }
    
    // 5. 마지막으로 computed 사용
    return computed || [];
  }, [current, computed]);

  const say = (t: string) => { try { const u=new SpeechSynthesisUtterance(t); u.lang="ko-KR"; window.speechSynthesis.speak(u);}catch{} };
  useEffect(()=> {
    let t = "";
    if (current?.decomposeTTS && Array.isArray(current.decomposeTTS)) {
      t = current.decomposeTTS.join(" ");
    } else if (current?.ttsIntro) {
      t = current.ttsIntro;
    } else if (Array.isArray(current?.tts)) {
      t = current.tts.join(" ");
    } else if (current?.tts) {
      t = current.tts;
    } else {
      t = heading;
    }
    if (t) say(t);
  }, [i, heading, current]);

  const next = () => {
    if (i < items.length - 1) setI(i+1);
    else navigate(`/quiz/${mode}?auto=1`);   // 학습 끝 → 자동 퀴즈
  };
  const prev = () => setI(Math.max(0, i-1));
  const repeat = () => {
    let t = "";
    if (current?.decomposeTTS && Array.isArray(current.decomposeTTS)) {
      t = current.decomposeTTS.join(" ");
    } else if (current?.ttsIntro) {
      t = current.ttsIntro;
    } else if (Array.isArray(current?.tts)) {
      t = current.tts.join(" ");
    } else if (current?.tts) {
      t = current.tts;
    } else {
      t = heading;
    }
    if (t) say(t);
  };

  if (loading) return <AppShellMobile title={title}><div className="p-6 text-gray-500">불러오는 중…</div></AppShellMobile>;
  if (!current) return <AppShellMobile title={title}><div className="p-6 text-gray-500">학습 항목이 없습니다.</div></AppShellMobile>;

  return (
    <AppShellMobile title={title}>
      <div className="space-y-4 pb-28 p-4">
        <div className="rounded-2xl bg-white border p-4">
          <div className="text-sm text-gray-500 mb-1">안내</div>
          <div className="text-lg">
            {current?.decomposeTTS && Array.isArray(current.decomposeTTS) 
              ? current.decomposeTTS.join(" ")
              : current?.ttsIntro 
              ? current.ttsIntro
              : Array.isArray(current?.tts) 
              ? current.tts.join(" ") 
              : (current?.tts || heading)
            }
          </div>
          {!!current?.examples?.length && <div className="text-sm text-gray-400 mt-2">예시: {current.examples.join(", ")}</div>}
        </div>

        <div className="rounded-2xl bg-white border p-6 text-center">
          <div className="text-3xl font-extrabold text-slate-800 mb-3">{heading}</div>
          <div className="inline-flex flex-wrap justify-center gap-2">
            {cells.length ? (
              cells.map((c, idx) => <CellView key={idx} c={c} />)
            ) : (
              <span className="text-gray-400 text-sm">점자 데이터를 불러오는 중...</span>
            )}
          </div>
          {cells.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              {cells.length}개 점자 셀
            </div>
          )}
        </div>
      </div>

      <BottomBar onLeft={prev} onMid={repeat} onRight={next} rightLabel={i===items.length-1?"테스트":"다음"} />
    </AppShellMobile>
  );
}