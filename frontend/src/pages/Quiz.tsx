import { useEffect, useMemo, useState } from "react";
import { convertBraille } from "../lib/api";
import { isCorrect } from "../lib/grade";
import BrailleCell from "../components/BrailleCell";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

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
    sentence: ["오늘 날씨가 맑다.","나는 학생이다.","책을 읽습니다."].map(s=>({ text:s, gold:s.replace(/\s+/g,"") })),
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

  const [cells,setCells] = useState<number[][]>([]);
  useEffect(()=>{
    (async ()=>{
      const items = await convertBraille(cur.text);
      setCells(items.map((x:any)=> x.cells?.[0] || [0,0,0,0,0,0]));
    })();
  },[cur]);

  const submit = ()=>{
    const ok = isCorrect(ans||"", cur.gold);
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
      <div className="card p-6 flex gap-3 flex-wrap">
        {cells.map((c,i)=>(<BrailleCell key={i} cell={c as any}/>))}
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