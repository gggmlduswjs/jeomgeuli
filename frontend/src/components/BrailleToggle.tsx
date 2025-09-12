import React from "react";
export default function BrailleToggle({
  on, onChange
}:{on:boolean; onChange:(v:boolean)=>void}) {
  return (
    <button
      aria-label="점자 출력"
      onClick={()=>onChange(!on)}
      className={`px-3 py-2 rounded-xl border ${on?"bg-accent-500 text-white border-accent-600":"bg-white text-brand-900 border-ink-100"}`}>
      점자출력 {on?"ON":"OFF"}
    </button>
  );
}
