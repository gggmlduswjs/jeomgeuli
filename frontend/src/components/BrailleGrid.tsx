import React from "react";

/**
 * 6점 점자(2 x 3)
 * props.pattern: "100000" 같은 6비트 문자열(점1~점6 순서)
 */
export default function BrailleGrid({
  pattern = "000000",
  size = 72,
  filledColor = "#0ea5e9",   // tailwind sky-500
  emptyColor = "#e5e7eb",    // gray-200
  label,
  className = ""
}: {
  pattern?: string;
  size?: number;
  filledColor?: string;
  emptyColor?: string;
  label?: React.ReactNode;
  className?: string;
}) {
  const dot = (on: boolean, key: number) => (
    <span
      key={key}
      style={{
        width: size / 3,
        height: size / 3,
        borderRadius: "50%",
        display: "inline-block",
        background: on ? filledColor : emptyColor,
        boxShadow: on ? "0 3px 8px rgba(0,0,0,.25)" : "inset 0 0 0 1px rgba(0,0,0,.06)"
      }}
    />
  );

  const flags = pattern.padEnd(6, "0").slice(0,6).split("").map(c => c === "1");

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4" style={{ width: size + 28 }}>
        {dot(flags[0], 1)}{dot(flags[3], 4)}
        {dot(flags[1], 2)}{dot(flags[4], 5)}
        {dot(flags[2], 3)}{dot(flags[5], 6)}
      </div>
      {label && <div className="mt-2 text-sm text-gray-500">{label}</div>}
    </div>
  );
}
