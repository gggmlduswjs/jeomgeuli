import { Link } from "react-router-dom";

export default function LearnChar() {
  return (
    <div className="screen">
      <div className="container-phone">
        <div className="header-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">자모 학습</h1>
              <p className="text-gray-300">한글 자음과 모음 학습</p>
            </div>
            <Link 
              to="/learn" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← 목록으로
            </Link>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="card text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-white">ㄱ</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">기역</h2>
              <p className="text-gray-600">자음 (초성/받침)</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">예시 단어</h3>
                <div className="flex justify-center space-x-3">
                  <span className="bg-white px-3 py-2 rounded-lg shadow-sm">가나</span>
                  <span className="bg-white px-3 py-2 rounded-lg shadow-sm">거북</span>
                  <span className="bg-white px-3 py-2 rounded-lg shadow-sm">기차</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">점자</h3>
                <div className="text-3xl font-mono text-blue-900">⠁</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <button className="btn-ghost py-3">
              ⬅️ 이전
            </button>
            <button className="btn-accent py-3">
              🔊 반복
            </button>
            <button className="btn-primary py-3">
              다음 ➡️
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">
              진행률: 1/40
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '2.5%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}