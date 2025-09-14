// import React from "react";

export function BrailleCell({dots=[0,0,0,0,0,0]}:{dots:number[]}){
  return (
    <div className="w-[56px] h-[80px] grid grid-cols-2 grid-rows-3 gap-2 rounded-xl bg-white shadow px-3 py-4">
      {dots.map((v,i)=>(
        <div key={i}
          className={`w-5 h-5 rounded-full border ${v? "bg-sky-500 border-sky-500 shadow-[0_2px_6px_rgba(2,132,199,.45)]":"bg-gray-200 border-gray-300"}`} />
      ))}
    </div>
  );
}

export function BrailleRow({cells=[]}:{cells:number[][]}){
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {cells.map((c,idx)=><BrailleCell key={idx} dots={c} />)}
    </div>
  );
}
