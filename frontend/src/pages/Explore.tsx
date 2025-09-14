import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '../components/MessageBubble';
import SummaryCard from '../components/SummaryCard';
import { ChatLikeInput } from '../components/ChatLikeInput';
import BrailleCell from '../components/BrailleCell';
import BraillePanel from '../components/BraillePanel';
import { useTTS } from '../hooks/useTTS';
import { useBrailleBLE } from '../hooks/useBrailleBLE';
import { useBraillePlayback } from '../hooks/useBraillePlayback';
import useVoiceCommands from '../hooks/useVoiceCommands';
import { askAI } from '../lib/api';
import type { ChatMessage } from '../types/chat';
import type { ChatResponse } from '../lib/api';

export default function Explore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { speak } = useTTS();
  const { isConnected, connect, disconnect } = useBrailleBLE();
  const braille = useBraillePlayback();

  // 새 메시지 렌더 시 맨 아래로 스크롤
  useEffect(() => { 
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); 
  }, [messages, isLoading]);

  // AI 응답 처리 함수
  async function handleAiResponse(res: ChatResponse) {
    const ks = (res?.keywords ?? [])
      .filter((s: string) => typeof s === "string" && s.trim())
      .slice(0, 3);
    
    // 요약 응답인 경우 bullets 저장
    if (res.mode === 'summary' && res.bullets) {
      setSummaryBullets(res.bullets);
      setSelectedIndex(0);
    }
    
    // 키워드 큐에 적재 (토글 ON이면 자동 재생 시작)
    braille.enqueueKeywords(ks);
  }

  // "자세히" 요청 처리
  async function handleDetail(idx = selectedIndex) {
    const topic = summaryBullets[idx] ?? '';
    if (!topic) {
      speak('자세히 설명할 내용이 없어요.');
      return;
    }
    
    const q = `다음 요약 항목을 자세히 설명해줘. 소제목(배경/핵심/영향/추가로 알아두면)으로 2~3문장씩:\n"${topic}"`;
    
    try {
      setIsLoading(true);
      const resp = await askAI({ q, mode: 'detail', topic });
      
      // detail 모드 응답을 채팅 말풍선으로 추가
      const detailMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'card',
        payload: resp,
        createdAt: Date.now()
      };
      
      setMessages(prev => [...prev, detailMsg]);
      speak(resp.simple_tts || '자세히 설명을 시작할게요.');
      await handleAiResponse(resp);
    } catch (error) {
      console.error('자세히 요청 실패:', error);
      speak('자세히 설명을 불러오는데 문제가 있어요.');
    } finally {
      setIsLoading(false);
    }
  }

  // 불릿 클릭 시 해당 인덱스로 상세
  function onBulletClick(i: number) {
    setSelectedIndex(i);
    handleDetail(i);
  }

  // 점자 출력 핸들러들 (새로운 훅의 메서드 사용)
  const handleNext = braille.next;
  const handleRepeat = braille.repeat;
  const handleStop = braille.pause;

  // 음성 명령 매핑
  const { onSpeech } = useVoiceCommands({
    next: handleNext,
    repeat: handleRepeat,
    pause: handleStop,
    brailleOn: () => braille.setEnabled(true),
    brailleOff: () => braille.setEnabled(false),
    detail: handleDetail,
  });

  async function handleSubmit(userText: string) {
    // 유저 메시지 추가
    const userMsg: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      type: 'text', 
      text: userText, 
      createdAt: Date.now() 
    };
    setMessages(p => [...p, userMsg]);

    setIsLoading(true);
    const typingId = crypto.randomUUID();
    setMessages(p => [...p, { 
      id: typingId, 
      role: 'assistant', 
      type: 'text', 
      text: '__typing__', 
      createdAt: Date.now() 
    }]);

    try {
      // AI API 호출
      const response: ChatResponse = await askAI({ q: userText });

      // typing indicator 제거
      setMessages(p => p.filter(m => m.id !== typingId));

      // AI 응답 처리 (키워드 세팅 + 자동 점자 출력)
      await handleAiResponse(response);

      // AI 응답을 카드 메시지로 추가
      const cardMsg: ChatMessage = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        type: 'card', 
        payload: response, 
        createdAt: Date.now() 
      };
      setMessages(p => [...p, cardMsg]);

      // TTS로 simple_tts 읽기
      if (response.simple_tts) {
        speak(response.simple_tts);
      }
    } catch (error) {
      // typing indicator 제거
      setMessages(p => p.filter(m => m.id !== typingId));
      
      // 에러 메시지 추가
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'text',
        text: '죄송합니다. AI 응답을 생성하는 중 오류가 발생했습니다.',
        createdAt: Date.now()
      };
      setMessages(p => [...p, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 상단 컨트롤 바 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              isConnected 
                ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            } transition-colors`}
            aria-pressed={isConnected}
          >
            {isConnected ? "연결됨" : "연결"}
          </button>

          <label className="flex items-center gap-2 ml-2">
            <input
              type="checkbox"
              checked={braille.enabled}
              onChange={(e) => braille.setEnabled(e.target.checked)}
              className="w-4 h-4 text-primary"
              aria-label="점자 출력 토글"
            />
            <span className="text-sm font-medium text-fg">점자 출력</span>
          </label>

          <div className="ml-auto flex gap-2">
            <button 
              onClick={() => handleDetail()}
              disabled={!summaryBullets.length}
              className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="선택된 항목 자세히 설명"
            >
              자세히
            </button>
            <button 
              onClick={() => braille.enqueueKeywords(["경제", "기술", "스포츠"])}
              className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm hover:bg-blue-200 transition-colors" 
              aria-label="데모 키워드 점자 출력"
            >
              키워드 점자 출력
            </button>
            <button 
              onClick={handleRepeat} 
              disabled={!braille.queue.length}
              className="px-2 py-1 rounded bg-slate-100 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="현재 키워드 다시 출력"
            >
              ⟳ 반복
            </button>
            <button 
              onClick={handleNext}   
              disabled={!braille.queue.length}
              className="px-2 py-1 rounded bg-slate-100 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="다음 키워드 출력"
            >
              ▶ 다음
            </button>
            <button 
              onClick={handleStop}   
              disabled={!braille.queue.length}
              className="px-2 py-1 rounded bg-slate-100 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="점자 출력 정지"
            >
              ■ 정지
            </button>
          </div>
        </div>

        {/* 키워드 칩 */}
        {braille.queue.length > 0 && (
          <div className="flex items-center gap-4 mt-3">
            <div className="text-sm text-muted font-medium">핵심 키워드</div>
            <div className="flex gap-3">
              {braille.queue.map((w, i) => (
                <button
                  key={w + i}
                  onClick={() => { 
                    // 인덱스 변경 (새로운 훅에서 자동으로 재생)
                    braille.setEnabled(true);
                    braille.setIndexTo(i);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    i === braille.index 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-slate-300 text-slate-700 hover:border-primary hover:bg-primary/5"
                  }`}
                  aria-current={i === braille.index}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 점자 출력 패널 */}
        {braille.enabled && (
          <BraillePanel braille={braille} />
        )}
      </div>

      {/* 메시지 리스트 */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(m => {
          if (m.type === 'text') {
            // 타이핑 인디케이터
            if (m.text === '__typing__') {
              return (
                <MessageBubble key={m.id} role="assistant">
                  <span className="inline-flex gap-1" aria-label="답변 생성 중">
                    <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:120ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:240ms]" />
                  </span>
                </MessageBubble>
              );
            }
            // 일반 텍스트 메시지
            return <MessageBubble key={m.id} role={m.role} text={m.text} />;
          }
          
          // 카드 타입 메시지
          return (
            <div key={m.id} className="my-2">
              <SummaryCard data={m.payload} onBulletClick={onBulletClick} />
            </div>
          );
        })}
      </div>

      {/* 하단 입력바 */}
      <ChatLikeInput onSubmit={handleSubmit} />
    </div>
  );
}