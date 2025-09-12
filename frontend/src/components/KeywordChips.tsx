import React from "react";
export default function KeywordChips({items}:{items:string[]}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((k)=>(<span key={k} className="px-3 py-1 rounded-xl bg-brand-100 text-brand-800">{k}</span>))}
    </div>
  );
}
