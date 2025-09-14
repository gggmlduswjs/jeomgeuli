import React from "react";
import BrailleDots from "./BrailleDots";
import type { Cell } from "../lib/brailleMap";

export default function BrailleRow({ cells }: { cells: Cell[] }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {cells.map((c, idx) => <BrailleDots key={idx} cell={c} />)}
    </div>
  );
}