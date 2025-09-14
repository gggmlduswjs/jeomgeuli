// src/pages/LearnStep.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, SkipForward, RotateCcw, HelpCircle } from "lucide-react";
import { fetchChars, fetchWords, fetchSentences, convertBraille } from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import type { Cell } from "../lib/brailleMap";

function Dot({ on }: { on: boolean }) {
  return (
    <span 
      className={`inline-block w-4 h-4 rounded-full mx-0.5 my-0.5 border-2 transition-all duration-200 ${
        on 
          ? "bg-primary border-primary shadow-sm" 
          : "bg-card border-border"
      }`} 
    />
  );
}

function CellView({ c }: { c: Cell }) {
  const [a,b,c2,d,e,f] = c || [0,0,0,0,0,0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-xl border border-border bg-white shadow-toss hover:shadow-toss-lg transition-shadow">
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

  if (loading) return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="text-muted">불러오는 중…</div>
      </div>
    </div>
  );
  
  if (!current) return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
      <div className="text-center">
        <div className="text-muted">학습 항목이 없습니다.</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-fg" aria-hidden="true" />
            </button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-fg">{title}</h1>
              <div className="text-xs text-muted mt-1">
                {i + 1} / {items.length}
              </div>
            </div>
            
            <div className="w-12"></div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* 진척도 바 */}
          <div className="bg-white rounded-2xl p-4 shadow-toss">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>진척도</span>
              <span>{Math.round(((i + 1) / items.length) * 100)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((i + 1) / items.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 안내 카드 */}
          <div className="bg-white rounded-2xl p-6 shadow-toss">
            <div className="text-sm text-primary font-medium mb-2">💡 학습 안내</div>
            <div className="text-lg leading-relaxed">
              {current?.decomposeTTS && Array.isArray(current.decomposeTTS) 
                ? current.decomposeTTS.join(" ")
                : current?.ttsIntro 
                ? current.ttsIntro
                : Array.isArray(current?.tts) 
                ? current.tts.join(" ") 
                : (current?.tts || heading)
              }
            </div>
            {!!current?.examples?.length && (
              <div className="text-sm text-muted mt-3 p-3 bg-card rounded-xl">
                <strong>예시:</strong> {current.examples.join(", ")}
              </div>
            )}
          </div>

          {/* 점자 표시 카드 */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-toss">
            <div className="text-4xl font-bold text-fg mb-6">{heading}</div>
            <div className="inline-flex flex-wrap justify-center gap-3">
              {cells.length ? (
                cells.map((c, idx) => <CellView key={idx} c={c} />)
              ) : (
                <div className="text-muted text-sm py-8">점자 데이터를 불러오는 중...</div>
              )}
            </div>
            {cells.length > 0 && (
              <div className="text-xs text-muted mt-4">
                {cells.length}개 점자 셀로 구성
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 하단 액션 바 */}
      <div className="bg-white border-t border-border shadow-toss">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={i === 0}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card text-fg hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="이전 항목"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </button>
            
            <button
              onClick={repeat}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="다시 듣기"
            >
              <RotateCcw className="w-4 h-4" />
              <span>반복</span>
            </button>
            
            <button
              onClick={next}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={i === items.length - 1 ? "테스트 시작" : "다음 항목"}
            >
              <span>{i === items.length - 1 ? "테스트" : "다음"}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}