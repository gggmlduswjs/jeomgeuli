import { Link } from "react-router-dom";

export default function LearnIndex(){
  return (
    <main className="max-w-[560px] mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">점자 학습</h2>
      <ul className="space-y-3">
        <li><Link to="/learn/char" className="block rounded-2xl bg-white px-5 py-4 shadow">자모 학습</Link></li>
        <li><Link to="/learn/word" className="block rounded-2xl bg-white px-5 py-4 shadow">단어 학습</Link></li>
        <li><Link to="/learn/sentence" className="block rounded-2xl bg-white px-5 py-4 shadow">문장 학습</Link></li>
        <li><Link to="/learn/free" className="block rounded-2xl bg-white px-5 py-4 shadow">자유 변환</Link></li>
        <li><Link to="/review" className="block rounded-2xl bg-white px-5 py-4 shadow border border-sky-200 text-sky-700">복습하기</Link></li>
      </ul>
    </main>
  );
}