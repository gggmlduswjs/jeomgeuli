import { useEffect, useMemo, useState } from "react";
import { convertBraille } from "../lib/api";
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

export default function Review(){
  const key = `review_${new Date().toISOString().slice(0,10)}`;
  const items = useMemo(()=> JSON.parse(localStorage.getItem(key)||"[]") as {kind:string, content:string}[], []);
  const [idx,setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const cur = items[idx];

  const [cells,setCells] = useState<Cell[]>([]);
  useEffect(()=>{
    (async ()=>{
      if(!cur) return;
      const result = await convertBraille(cur.content);
      setCells(result || []);
      setShowAnswer(false); // 새 문제로 넘어갈 때 답 숨기기
    })();
  },[cur]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (!completed.includes(idx)) {
      setCompleted([...completed, idx]);
    }
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
    } else {
      // 모든 복습 완료
      alert("오늘의 복습을 모두 완료했습니다! 🎉");
    }
  };

  const handlePrev = () => {
    setIdx(Math.max(0, idx - 1));
  };

  const speak = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  if(items.length===0) return (<main className="p-6">오늘은 복습할 항목이 없습니다.</main>);

  return (
    <main className="p-6 space-y-4 pb-32">
      {/* 진행률 표시 */}
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">복습 노트 ({new Date().toISOString().slice(0,10)})</div>
        <div className="text-sm text-gray-500">
          {idx + 1} / {items.length} ({completed.length} 완료)
        </div>
      </div>
      
      {/* 진행률 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${((idx + 1) / items.length) * 100}%` }}
        ></div>
      </div>

      {/* 복습 카드 */}
      <div className="card p-6">
        <div className="mb-2 text-gray-500">{cur.kind}</div>
        
        {/* 점자 표시 */}
        <div className="flex gap-3 flex-wrap justify-center mb-4">
          {cells.map((c,i)=>(<CellView key={i} c={c}/>))}
        </div>
        
        {/* 답 표시 */}
        {showAnswer ? (
          <div className="text-2xl font-bold text-center text-green-600 mb-4">
            {cur.content}
          </div>
        ) : (
          <div className="text-center mb-4">
            <div className="text-gray-500 mb-2">점자를 확인한 후 답을 맞춰보세요</div>
            <button 
              onClick={handleShowAnswer}
              className="btn-primary px-6 py-2"
            >
              답 보기
            </button>
          </div>
        )}
        
        {/* TTS 버튼 */}
        {showAnswer && (
          <div className="text-center">
            <button 
              onClick={() => speak(cur.content)}
              className="btn-secondary px-4 py-2"
            >
              🔊 읽어주기
            </button>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="fixed bottom-3 inset-x-0 px-6">
        <div className="flex gap-3">
          <button 
            className="btn flex-1" 
            onClick={handlePrev}
            disabled={idx === 0}
          >
            이전
          </button>
          <button 
            className="btn-primary flex-1" 
            onClick={handleNext}
          >
            {idx + 1 < items.length ? "다음" : "완료"}
          </button>
        </div>
      </div>
    </main>
  );
}