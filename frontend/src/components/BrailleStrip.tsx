import BrailleCell from "./BrailleCell";
import { convertBraille } from "../lib/api";

export default function BrailleStrip({ text, size="normal" }:{text:string; size?:"normal"|"large"}){
  const cells = convertBraille(text);
  return (
    <div className="flex items-center justify-center gap-6">
      {cells.map((bits: boolean[], i: number)=> <BrailleCell key={i} pattern={bits} size={size} />)}
    </div>
  );
}
