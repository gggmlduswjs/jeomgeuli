import { useState, useEffect, useRef } from 'react';
import { MessageBubble } from '../components/MessageBubble';
import { SummaryCard } from '../components/SummaryCard';
import { ChatLikeInput } from '../components/ChatLikeInput';
import { useNLU } from '../hooks/useNLU';
import { useSummarize } from '../hooks/useSummarize';
import { useTTS } from '../hooks/useTTS';
import useBrailleBLE from '../hooks/useBrailleBLE';
import { fetchWeather, fetchNewsRSS } from '../lib/api';
import type { Message, SummarizeResult } from '../types/explore';

export default function Explore() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSummary, setCurrentSummary] = useState<SummarizeResult | null>(null);
  const [newsIndex, setNewsIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { parse } = useNLU();
  const { summarize } = useSummarize();
  const { speak, stop, isSpeaking } = useTTS();
  const { writePattern, connect, isConnected } = useBrailleBLE();
  
  // 메시지 추가 시 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 초기 환영 메시지
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: '안녕하세요! 정보탐색 모드입니다. "오늘 날씨", "뉴스 5개", "자세히", "키워드 점자 출력" 등의 명령을 말하거나 입력해주세요.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);
  
  const addMessage = (content: string, type: 'user' | 'assistant') => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };
  
  const handleUserInput = async (input: string) => {
    // 사용자 메시지 추가
    addMessage(input, 'user');
    setIsLoading(true);
    
    try {
      // 의도 파악
      const intent = parse(input);
      
      switch (intent) {
        case 'weather': {
          const weatherData = await fetchWeather();
          const weatherText = `${weatherData.location}의 오늘 날씨는 ${weatherData.condition}, 기온 ${weatherData.temp}도, 미세먼지 ${weatherData.pm25}입니다.`;
          const summary = await summarize(weatherText, 'weather');
          setCurrentSummary(summary);
          
          // 요약 카드 표시를 위한 시스템 메시지
          addMessage('날씨 정보를 요약했습니다.', 'assistant');
          
          // TTS로 요약 읽기
          speak(summary.bullets.join('. '));
          break;
        }
        
        case 'news': {
          const newsData = await fetchNewsRSS();
          const newsText = `오늘의 주요 뉴스 ${newsData.length}건을 요약했습니다.`;
          const summary = await summarize(newsText, 'news');
          setCurrentSummary(summary);
          setNewsIndex(0);
          
          addMessage('뉴스를 요약했습니다.', 'assistant');
          speak(summary.bullets.join('. '));
          break;
        }
        
        case 'detail': {
          if (currentSummary) {
            addMessage(currentSummary.longText, 'assistant');
            speak(currentSummary.longText);
          } else {
            addMessage('먼저 날씨나 뉴스를 요청해주세요.', 'assistant');
          }
          break;
        }
        
        case 'braille': {
          if (currentSummary) {
            addMessage('키워드를 점자로 출력합니다.', 'assistant');
            // 각 키워드를 순차적으로 점자 출력
            for (const keyword of currentSummary.keywords) {
              await writePattern(keyword);
              // 각 키워드 사이에 약간의 지연
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            addMessage('먼저 날씨나 뉴스를 요청해주세요.', 'assistant');
          }
          break;
        }
        
        case 'next': {
          if (currentSummary?.source === 'news') {
            setNewsIndex(prev => prev + 1);
            addMessage(`다음 뉴스로 이동했습니다. (${newsIndex + 2}번째)`, 'assistant');
          } else {
            addMessage('다음 항목이 없습니다.', 'assistant');
          }
          break;
        }
        
        case 'repeat': {
          if (currentSummary) {
            speak(currentSummary.bullets.join('. '));
            addMessage('요약을 다시 읽어드립니다.', 'assistant');
          } else {
            addMessage('반복할 내용이 없습니다.', 'assistant');
          }
          break;
        }
        
        case 'stop': {
          stop();
          addMessage('음성을 중지했습니다.', 'assistant');
          break;
        }
        
        default: {
          // 일반 질문 처리
          const summary = await summarize(input, 'generic');
          setCurrentSummary(summary);
          addMessage('질문에 대한 요약입니다.', 'assistant');
          speak(summary.bullets.join('. '));
        }
      }
    } catch (error) {
      console.error('처리 중 오류:', error);
      addMessage('죄송합니다. 처리 중 오류가 발생했습니다.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeywordClick = async (keyword: string) => {
    addMessage(`${keyword} 키워드를 점자로 출력합니다.`, 'assistant');
    await writePattern(keyword);
  };
  
  const handleDetailClick = () => {
    if (currentSummary) {
      addMessage(currentSummary.longText, 'assistant');
      speak(currentSummary.longText);
    }
  };
  
  const handleBrailleClick = async () => {
    if (currentSummary) {
      addMessage('모든 키워드를 점자로 출력합니다.', 'assistant');
      for (const keyword of currentSummary.keywords) {
        await writePattern(keyword);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primary">정보탐색 모드</h1>
              <p className="text-sm text-muted">ChatGPT 스타일로 정보를 탐색해보세요</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl">
                <div 
                  className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-muted'}`}
                  aria-label={isConnected ? '점자 디스플레이 연결됨' : '점자 디스플레이 연결 안됨'}
                />
                <span className="text-xs text-muted">
                  {isConnected ? '연결됨' : '연결 안됨'}
                </span>
              </div>
              <button
                onClick={connect}
                className="px-3 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="점자 디스플레이 연결"
              >
                연결
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* 메시지 영역 */}
      <main 
        className="flex-1 overflow-y-auto bg-bg"
        role="log"
        aria-label="대화 로그"
        aria-live="polite"
      >
        <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-32">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* 요약 카드 */}
          {currentSummary && (
            <SummaryCard
              summary={currentSummary}
              onDetailClick={handleDetailClick}
              onBrailleClick={handleBrailleClick}
              onKeywordClick={handleKeywordClick}
            />
          )}
          
          {/* 로딩 표시 */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-3 text-muted bg-white px-4 py-3 rounded-2xl shadow-toss">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                <span>처리 중...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      {/* 하단 입력바 */}
      <ChatLikeInput
        onSubmit={handleUserInput}
        disabled={isLoading}
        placeholder="메시지를 입력하거나 음성으로 말하세요..."
      />
    </div>
  );
}