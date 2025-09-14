import React from "react";
import type { Cell } from "../lib/brailleMap";

export default function BrailleDots({ cell, size=28 }: { cell: Cell; size?: number }) {
  const dot = (on:boolean, key:string, idx:number) => (
    <span
      key={key+idx}
      className={`inline-block rounded-full border border-gray-300 mr-2 mb-2 ${on ? "bg-blue-500 shadow" : "bg-gray-100"}`}
      style={{ width: size, height: size }}
    />
  );
  const [d1,d2,d3,d4,d5,d6] = cell;
  return (
    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-white">
      <div className="flex flex-col">{dot(!!d1,"d",1)}{dot(!!d2,"d",2)}{dot(!!d3,"d",3)}</div>
      <div className="flex flex-col">{dot(!!d4,"d",4)}{dot(!!d5,"d",5)}{dot(!!d6,"d",6)}</div>
    </div>
  );
}
