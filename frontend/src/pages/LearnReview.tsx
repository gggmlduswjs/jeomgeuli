import { Link } from "react-router-dom";
import { useState } from "react";

export default function LearnReview() {
  const [reviewItems] = useState([
    { id: 1, type: 'char', content: 'ㄱ', name: '기역', difficulty: 'easy' },
    { id: 2, type: 'word', content: '학교', syllables: ['학', '교'], difficulty: 'medium' },
    { id: 3, type: 'sentence', content: '안녕하세요', difficulty: 'hard' },
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="screen">
      <div className="container-phone">
        <div className="header-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">복습하기</h1>
              <p className="text-gray-300">틀린 항목과 키워드 복습</p>
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
          <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">복습 대기 항목</h2>
                <p className="text-red-100">총 {reviewItems.length}개 항목</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {reviewItems.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-700">
                          {item.type === 'char' ? '🔤' : item.type === 'word' ? '📝' : '📄'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.content}</h3>
                        {item.name && <p className="text-sm text-gray-600">{item.name}</p>}
                        {item.syllables && (
                          <p className="text-sm text-gray-600">
                            {item.syllables.join(' + ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                      {getDifficultyText(item.difficulty)}
                    </span>
                    <button className="btn-primary py-2 px-4 text-sm">
                      복습
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="card bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-3">📊 복습 통계</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-xs text-blue-800">대기 중</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">15</div>
                <div className="text-xs text-green-800">완료</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">2</div>
                <div className="text-xs text-orange-800">어려움</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-ghost py-3">
              🔄 전체 복습
            </button>
            <button className="btn-primary py-3">
              🎯 어려운 것만
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">
              💡 복습은 간격을 두고 반복할 때 효과적입니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}