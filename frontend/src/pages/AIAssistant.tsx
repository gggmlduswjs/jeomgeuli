import { useState, useCallback } from "react";
import { Link } from "react-router-dom";

type Mode = "news" | "explain" | "qa";

export default function AIAssistant() {
  const [brailleOn, setBrailleOn] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>("qa");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // 간단한 응답 시뮬레이션
      setTimeout(() => {
        setResponse({
          mode: currentMode,
          simple_tts: `${query}에 대한 답변입니다.`,
          keywords: ["키워드1", "키워드2"],
          cards: [
            { title: "관련 정보", desc: "상세 설명", url: "#" }
          ]
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("AI 응답 오류:", error);
      setIsLoading(false);
    }
  };

  // const handleMic = async (text: string) => {
  //   setQuery(text);
  //   await handleAsk();
  // };

  const repeat = useCallback(() => {
    if (response?.simple_tts) {
      const utterance = new SpeechSynthesisUtterance(response.simple_tts);
      utterance.lang = "ko-KR";
      window.speechSynthesis.speak(utterance);
    }
  }, [response?.simple_tts]);

  const learn = useCallback(() => {
    if (response?.keywords?.length) {
      console.log("학습 큐에 추가:", response.keywords);
      alert("키워드가 학습 큐에 추가되었습니다!");
    }
  }, [response?.keywords]);

  return (
    <div className="screen">
      <div className="container-phone">
        <div className="header-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">AI 어시스턴트</h1>
              <p className="text-gray-300">AI와 대화하며 정보 찾기</p>
            </div>
            <Link 
              to="/explore" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← 탐색으로
            </Link>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 모드 선택 */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">모드 선택</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCurrentMode("qa")}
                className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                  currentMode === "qa"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                💬 질문답변
              </button>
              <button
                onClick={() => setCurrentMode("news")}
                className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                  currentMode === "news"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📰 뉴스
              </button>
              <button
                onClick={() => setCurrentMode("explain")}
                className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                  currentMode === "explain"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📖 설명
              </button>
            </div>
          </div>

          {/* 질문 입력 */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">질문하기</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="무엇이 궁금하신가요?"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAsk}
                  disabled={!query.trim() || isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? "처리 중..." : "🔍 질문하기"}
                </button>
                
                <button
                  onClick={() => setBrailleOn(!brailleOn)}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                    brailleOn 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-2xl">📱</span>
                </button>
              </div>
            </div>
          </div>

          {/* 응답 표시 */}
          {response && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">AI 응답</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-blue-900">{response.simple_tts}</p>
                </div>
                
                {response.keywords && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.keywords.map((keyword: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {response.cards && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">관련 정보</h4>
                    {response.cards.map((card: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                        <h5 className="font-semibold text-gray-900">{card.title}</h5>
                        <p className="text-gray-600 text-sm mt-1">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={repeat}
              disabled={!response?.simple_tts}
              className="btn-ghost py-3"
            >
              🔊 다시 읽기
            </button>
            <button
              onClick={learn}
              disabled={!response?.keywords?.length}
              className="btn-accent py-3"
            >
              📚 학습하기
            </button>
          </div>

          {/* 점자 상태 표시 */}
          {brailleOn && (
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-semibold text-green-800">점자 출력 활성화</h3>
                  <p className="text-sm text-green-600">키워드가 점자로 출력됩니다</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}