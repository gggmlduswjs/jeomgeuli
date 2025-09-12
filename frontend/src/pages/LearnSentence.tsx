import { Link } from "react-router-dom";

export default function LearnSentence() {
  return (
    <div className="screen">
      <div className="container-phone">
        <div className="header-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">문장 학습</h1>
              <p className="text-gray-300">문장 구성과 점자 학습</p>
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
          <div className="card">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">안녕하세요</h2>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4">
                <div className="text-lg font-semibold">"안녕하세요"</div>
                <div className="text-sm opacity-90 mt-1">인사말</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">문장 분해</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white px-3 py-2 rounded-lg text-center">
                    <div className="text-sm font-bold">안녕</div>
                    <div className="text-xs text-gray-500">인사</div>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg text-center">
                    <div className="text-sm font-bold">하세요</div>
                    <div className="text-xs text-gray-500">존댓말</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-800 mb-2">점자</h3>
                <div className="text-lg font-mono text-purple-900 break-all">
                  ⠁⠃⠉⠇⠁⠣⠕⠊
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">사용 예시</h3>
                <div className="text-sm text-blue-900 space-y-1">
                  <p>• "안녕하세요, 선생님!"</p>
                  <p>• "안녕하세요, 처음 뵙겠습니다."</p>
                </div>
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
              진행률: 1/20
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '5%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}