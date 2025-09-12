import { useEffect, useMemo, useState } from "react";
import { convertBraille } from "../lib/api";
import { isCorrect } from "../lib/grade";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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

type Q = { text:string, gold:string|string[] };

function saveReview(items:Q[], kind:string){
  const key = `review_${new Date().toISOString().slice(0,10)}`;
  const prev = JSON.parse(localStorage.getItem(key)||"[]");
  const add = items.map(x=>({ kind, content:x.text, gold:x.gold }));
  localStorage.setItem(key, JSON.stringify(prev.concat(add)));
}

export default function Quiz(){
  const { kind } = useParams(); // char|word|sentence
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const bank:Record<string,Q[]> = {
    char: "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ".split("").map(ch=>({ text:ch, gold:[ch, ch==='ㄱ'?'기역':ch==='ㄴ'?'니은':''] })),
    word: ["학교","친구","엄마","아빠","책상","연필","사랑","바다","나무","별"].map(w=>({ text:w, gold:w })),
    sentence: [
      { text:"오늘 날씨가 맑다.", gold:"오늘날씨가맑다" },
      { text:"나는 학생이다.", gold:"나는학생이다" },
      { text:"책을 읽습니다.", gold:"책을읽습니다" },
      { text:"안녕하세요.", gold:"안녕하세요" },
      { text:"좋은 하루 되세요.", gold:"좋은하루되세요" }
    ],
  };
  const qs = useMemo(()=>bank[kind||"char"].slice(0,10),[kind]);
  const [idx,setIdx] = useState(0);
  const [ans,setAns] = useState("");
  const [wrong,setWrong] = useState<Q[]>([]);
  const cur = qs[idx];

  useEffect(()=>{ setAns(""); },[idx]);

  // Auto-start from learning mode
  useEffect(()=>{
    if (searchParams.get("auto")==="1") {
      // Auto-start: focus input or speak first question
      const input = document.querySelector('input[placeholder*="정답"]') as HTMLInputElement;
      if (input) input.focus();
    }
  },[searchParams]);

  const [cells,setCells] = useState<Cell[]>([]);
  useEffect(()=>{
    (async ()=>{
      const items = await convertBraille(cur.text);
      setCells(items || []);
    })();
  },[cur]);

  const submit = ()=>{
    const gold = Array.isArray(cur.gold) ? cur.gold : [cur.gold];
    const ok = isCorrect(ans||"", gold);
    if(!ok){
      setWrong(w=>w.concat([cur]));
    }
    if(idx+1<qs.length) setIdx(idx+1);
    else {
      if(wrong.length || !ok) saveReview(ok? wrong : wrong.concat([cur]), kind!);
      nav("/review"); // 결과 바로 복습
    }
  };

  return (
    <main className="p-6 space-y-4">
      <div className="card p-4">문제 {idx+1} / {qs.length}</div>
      <div className="card p-6 flex gap-3 flex-wrap justify-center">
        {cells.map((c,i)=>(<CellView key={i} c={c}/>))}
      </div>
      <div className="card p-4">
        <input className="input w-full mb-3" placeholder="정답을 말하거나 입력하세요"
          value={ans} onChange={e=>setAns(e.target.value)} />
        <div className="flex gap-3">
          <button className="btn flex-1" onClick={()=>setAns("")}>지우기</button>
          <button className="btn-primary flex-1" onClick={submit}>제출</button>
        </div>
      </div>
    </main>
  );
}