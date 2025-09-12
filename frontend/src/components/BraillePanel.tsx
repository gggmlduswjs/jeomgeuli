// src/components/BraillePanel.tsx

type Props = {
  cells: number[][];
  size?: number; // px, 기본 18
};

export default function BraillePanel({ cells, size = 18 }: Props) {
  return (
    <div className="flex gap-5 justify-center items-start">
      {cells.map((cell, idx) => (
        <div key={idx} className="grid grid-cols-2 grid-rows-3 gap-2">
          {cell.map((on, i) => (
            <span
              key={i}
              className={`inline-block rounded-full shadow-sm ${on ? "bg-[#0B1A2A]" : "bg-gray-200"}`}
              style={{ width: size, height: size }}
              aria-label={on ? "점" : "빈 점"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
