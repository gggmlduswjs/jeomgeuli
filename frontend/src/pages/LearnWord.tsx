import { Link } from "react-router-dom";

export default function LearnWord() {
  return (
    <div className="screen">
      <div className="container-phone">
        <div className="header-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">단어 학습</h1>
              <p className="text-gray-300">기본 단어와 점자 학습</p>
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
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-white">학교</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">학교</h2>
              <p className="text-gray-600">학 + 교</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">음절 분해</h3>
                <div className="flex justify-center space-x-3">
                  <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-green-600">학</div>
                    <div className="text-xs text-gray-500">학</div>
                  </div>
                  <div className="text-2xl text-gray-400 flex items-center">+</div>
                  <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-green-600">교</div>
                    <div className="text-xs text-gray-500">교</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">점자</h3>
                <div className="text-2xl font-mono text-green-900">⠁⠣⠁⠕</div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">예시 문장</h3>
                <p className="text-blue-900">"나는 학교에 갑니다."</p>
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
              진행률: 1/25
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '4%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}