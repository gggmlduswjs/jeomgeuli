import { useEffect, useState } from "react";
import { brailleConvert } from "../lib/api";
import { textToCellsLocal } from "../lib/braille_local";

export default function useBraille(text:string){
  const [cells,setCells]=useState<number[][]>([]);
  useEffect(()=>{
    let off=false;
    (async()=>{
      if(!text){ setCells([]); return; }
      try{
        const r = await brailleConvert(text);
        if(!off && r?.cells?.length) { setCells(r.cells); return; }
      }catch{}
      if(!off) setCells(textToCellsLocal(text));
    })();
    return ()=>{ off=true; };
  },[text]);
  return cells;
}