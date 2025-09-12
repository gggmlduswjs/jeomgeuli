import React, { useCallback, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import MicButton from "../components/MicButton";
import BrailleToggle from "../components/BrailleToggle";
import KeywordChips from "../components/KeywordChips";
import useVoiceCommands from "../hooks/useVoiceCommands";
import { connectBraille, sendKeywords } from "../lib/bleBraille";
import { readSSE } from "../lib/sse";

type Msg = { role:"user"|"bot"; text:string };
export default function ExploreStreaming(){
  const [q,setQ]=useState("");
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [brailleOn,setBrailleOn]=useState(false);
  const [keywords,setKeywords]=useState<string[]>([]);

  const ask = useCallback(async (text:string)=>{
    const content = text.trim(); if(!content) return;
    setMsgs(m=>[...m,{role:"user",text:content},{role:"bot",text:""}]);
    const idx = msgs.length+1; // 방금 bot 자리
    try{
      await readSSE(`${import.meta.env.VITE_API_BASE}/api/chat/ask/stream`, { q: content }, (chunk)=>{
        setMsgs(m=>{
          const cp = [...m];
          cp[idx] = { role:"bot", text: (cp[idx]?.text||"")+chunk };
          return cp;
        });
      });
    }catch{
      setMsgs(m=>[...m,{role:"bot",text:"죄송해요. 잠시 후 다시 시도해주세요."}]);
    }
  },[msgs.length]);

  const learn = ()=> { 
    /* 현재 keywords를 복습노트로 POST */
    console.log("학습하기 - 키워드:", keywords);
  };

  const { onSpeech } = useVoiceCommands({
    next: ()=>{/* 다음 카드 or 다음 키워드 */},
    repeat: ()=>{/* 마지막 응답 재낭독 */},
    brailleOn: ()=> setBrailleOn(true),
    brailleOff: ()=> setBrailleOn(false),
    learn,
  });

  // MicButton onResult={text=>{ onSpeech(text); ask(text); }} 처럼
  // 질의에 쓰고, 명령어면 ask가 빈문자 들어가지 않게 가드:
  const handleMic = async (text:string)=>{
    const cmdMatched = /다음|이전|반복|멈춰|시작|학습하기|점자출력켜|점자출력꺼|점자켜|점자꺼/.test(text.replace(/\s/g,""));
    if (cmdMatched) { onSpeech(text); return; }
    await ask(text);
  };

  const handleBrailleToggle = async (v: boolean) => {
    setBrailleOn(v);
    if (v) {
      try { 
        await connectBraille(); 
        if (keywords.length) await sendKeywords(keywords); 
      }
      catch(e){ 
        alert("BLE 연결 실패"); 
        setBrailleOn(false); 
      }
    }
  };

  return (
    <AppShellMobile title="정보 탐색 (스트리밍)" right={<BrailleToggle on={brailleOn} onChange={handleBrailleToggle}/>}>
      {keywords.length>0 && (
        <div className="mb-4"><KeywordChips items={keywords}/></div>
      )}
      <div className="space-y-3 pb-40">
        {msgs.map((m,i)=>(
          <div key={i} className={`card ${m.role==="user"?"bg-brand-900 text-ink-white ml-12":"mr-12"}`}>{m.text}</div>
        ))}
      </div>

      <form
        className="fixed bottom-20 left-1/2 -translate-x-1/2 container-phone px-5"
        onSubmit={(e)=>{e.preventDefault(); ask(q);}}>
        <div className="flex gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 rounded-2xl border border-ink-100 px-4 py-3" placeholder="질문을 입력하거나 마이크를 누르세요"/>
          <button className="btn-primary">보내기</button>
          <MicButton onResult={handleMic}/>
        </div>
      </form>
    </AppShellMobile>
  );
}
