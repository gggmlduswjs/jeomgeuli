export default function BottomBar({
  onLeft, onMid, onRight, rightLabel="다음"
}:{ onLeft?:()=>void; onMid?:()=>void; onRight?:()=>void; rightLabel?:string }) {
  return (
    <div className="fixed left-0 right-0 bottom-0 bg-white/90 backdrop-blur border-t px-4 py-3 flex gap-3">
      <button className="flex-1 rounded-xl border py-3" onClick={onLeft}>이전</button>
      <button className="flex-1 rounded-xl border py-3" onClick={onMid}>반복</button>
      <button className="flex-1 rounded-xl bg-sky-600 text-white py-3" onClick={onRight}>{rightLabel}</button>
    </div>
  );
}