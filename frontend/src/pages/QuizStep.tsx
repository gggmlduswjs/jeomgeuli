import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BrailleRow from "../components/BrailleRow";
import { convertBraille } from "../lib/api";
import type { Cell } from "../lib/brailleLocal";

export default function Quiz(){
  const { mode } = useParams(); // char|word|sentence
  const nav = useNavigate();
  const { state } = useLocation() as any;
  const src = state?.items || [];
  const [i,setI] = useState(0);
  const [answer,setAnswer] = useState("");
  const [result,setResult] = useState("");
  const cur = src[i];
  const targetText = mode==="char"?cur?.char:mode==="word"?cur?.word:cur?.sentence;
  const [cells,setCells] = useState<Cell[]>([]);

  useEffect(()=>{ 
    if(!targetText) return;
    const id = setTimeout(()=>{
      convertBraille(targetText).then(d=>setCells(d||[])); 
    }, 150);
    return ()=> clearTimeout(id);
  },[i,src]);

  const say = (t:string)=>{ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang="ko-KR"; speechSynthesis.speak(u);}catch{} };

  // 답 확인 시, 공백/미입력은 반드시 오답 처리
  const submit = (answer: string) => {
    const correct = (cur.text || "").trim();
    const user = (answer || "").trim();
    const isCorrect = user.length > 0 && user === correct;
    if (!isCorrect) {
      const key = "review:items";
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([...saved, { mode, text: correct }].slice(-200)));
    }
    setResult(isCorrect ? "정답입니다." : "오답입니다.");
    say(isCorrect ? "정답입니다" : "오답입니다");
  };

  const next = () => {
    submit(answer);
    setAnswer("");
    setResult("");
    if(i>=src.length-1) nav("/learn"); else setI(i+1);
  }

  if(!cur) return <main className="p-4">퀴즈 데이터가 없습니다.</main>;

  return (
    <main className="max-w-xl mx-auto p-4 pb-28">
      <section className="rounded-2xl bg-white shadow p-4 mb-4">
        점자를 촉각으로 확인한 뒤 정답을 말씀/입력하세요.
      </section>
      <section className="rounded-2xl bg-white shadow p-6 text-center">
        <BrailleRow cells={cells}/>
        <div className="mt-4 text-gray-500">곧 질문합니다</div>
      </section>

      <div className="rounded-2xl bg-white shadow p-4 mt-4">
        <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="정답 입력" className="w-full h-12 rounded-xl border px-3"/>
        {result && <div className={`mt-2 text-center ${result === "정답입니다." ? "text-green-600" : "text-red-500"}`}>{result}</div>}
      </div>

      <nav className="fixed bottom-3 left-0 right-0 max-w-xl mx-auto flex gap-3 px-4">
        <button className="flex-1 h-12 rounded-xl bg-gray-200" onClick={()=> setI(Math.max(0,i-1))}>이전</button>
        <button className="flex-1 h-12 rounded-xl bg-gray-300" onClick={()=> say("힌트가 없습니다")}>반복</button>
        <button className="flex-1 h-12 rounded-xl bg-blue-600 text-white" onClick={next}>다음</button>
      </nav>
    </main>
  );
}
