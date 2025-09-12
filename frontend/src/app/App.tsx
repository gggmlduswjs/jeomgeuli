import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LearnStep from "../pages/LearnStep";
import Quiz from "../pages/Quiz";
import Review from "../pages/Review";
import Explore from "../pages/Explore";

function Home(){
  return (
    <main className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">점글이</h1>
      <Link to="/learn" className="btn-primary w-full block text-center mb-3">점자 학습</Link>
      <Link to="/explore" className="btn w-full block text-center">정보 탐색</Link>
    </main>
  );
}

function LearnIndex(){
  return (
    <main className="p-6 max-w-sm mx-auto">
      <div className="text-lg font-semibold mb-3">점자 학습</div>
      <ul className="space-y-3">
        <li><Link className="card p-4 block" to="/learn/char">자모 학습</Link></li>
        <li><Link className="card p-4 block" to="/learn/word">단어 학습</Link></li>
        <li><Link className="card p-4 block" to="/learn/sentence">문장 학습</Link></li>
        <li><Link className="card p-4 block" to="/learn/free">자유 변환</Link></li>
        <li><Link className="card p-4 block" to="/review">복습하기</Link></li>
      </ul>
    </main>
  );
}

export default function App(){
  console.log("🔍 DEV Health Check");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/learn" element={<LearnIndex/>}/>
        <Route path="/learn/:kind" element={<LearnStep/>}/>
        <Route path="/quiz/:kind" element={<Quiz/>}/>
        <Route path="/review" element={<Review/>}/>
        <Route path="/explore" element={<Explore/>}/>
      </Routes>
    </BrowserRouter>
  );
}