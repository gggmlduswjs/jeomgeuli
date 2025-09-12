import BrailleCell from "./BrailleCell";
import { textToBrailleBits } from "../lib/braille";

export default function BrailleStrip({ text, size="md" }:{text:string; size?:"md"|"lg"}){
  const cells = textToBrailleBits(text);
  return (
    <div className="flex items-center justify-center gap-6">
      {cells.map((bits: any, i: number)=> <BrailleCell key={i} bits={bits} size={size} />)}
    </div>
  );
}
