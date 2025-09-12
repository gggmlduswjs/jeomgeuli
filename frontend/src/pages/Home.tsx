import { Link } from "react-router-dom";

export default function Home(){
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0b1220] text-white px-5 py-4 text-lg font-bold">점글이</header>
      <div className="max-w-[560px] mx-auto p-6 space-y-6">
        <Link to="/learn" className="block text-center rounded-2xl bg-sky-600 text-white py-4 shadow-lg">점자 학습</Link>
        <Link to="/explore" className="block text-center rounded-2xl bg-amber-500 text-white py-4 shadow-lg">정보 탐색</Link>
      </div>
    </main>
  );
}