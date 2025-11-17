import { useEffect, useRef, useState, useCallback } from 'react';
import useSTT from '../../hooks/useSTT';
import useVoiceCommands from '../../hooks/useVoiceCommands';
import { useNavigate, useLocation } from 'react-router-dom';
import useTTS from '../../hooks/useTTS';
import VoiceEventBus, { onMicIntent } from '../../lib/voice/VoiceEventBus';
import micMode from '../../lib/voice/MicMode';
import { useVoiceStore } from '../../store/voice';

interface GlobalVoiceRecognitionProps {
  onTranscript?: (text: string) => void;
}

export default function GlobalVoiceRecognition({ onTranscript }: GlobalVoiceRecognitionProps) {
  const { start: startSTT, stop: stopSTT, isListening, transcript, alternatives } = useSTT();
  const { speak, stop: stopTTS } = useTTS();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showAnimation, setShowAnimation] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasStartedRef = useRef(false);
  const lastTranscriptRef = useRef<string>('');
  const lastBroadcastRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const transcriptProcessedRef = useRef(false);
  const pausedMediaRef = useRef<HTMLMediaElement[]>([]);
  const lastPointerRef = useRef<number>(0);
  const sttLockRef = useRef<boolean>(false);
  const coolUntilRef = useRef<number>(0);

  // 롱프레스 시간 (500ms)
  const LONG_PRESS_DURATION = 500;
  const TAP_TOGGLE_THRESHOLD = 300; // 300ms 이내 짧은 탭이면 토글
  const isVoiceActivePath = useCallback(() => {
    const p = location.pathname || '';
    return p.startsWith('/explore') || p.startsWith('/free-convert') || p.startsWith('/learn');
  }, [location.pathname]);

  // 모든 오디오/비디오 일시정지(겹침 방지)
  const stopAllMedia = useCallback(() => {
    pausedMediaRef.current = [];
    try {
      const media = Array.from(document.querySelectorAll('audio,video')) as HTMLMediaElement[];
      media.forEach(m => {
        if (!m.paused && !m.ended) {
          try { m.pause(); } catch {}
          pausedMediaRef.current.push(m);
        }
      });
    } catch {}
  }, []);

  // 짧은 비프음 재생
  const playBeep = useCallback(() => {
    try {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try { osc.stop(); ctx.close(); } catch {}
      }, 100);
    } catch {}
  }, []);

  // 포인터 스로틀
  const throttlePointer = useCallback((ms: number = 300) => {
    const now = Date.now();
    if (now - lastPointerRef.current < ms) return false;
    lastPointerRef.current = now;
    return true;
  }, []);

  // STT 안전 시작/중지 (MicMode intents에 맞춰 수행)
  const safeStart = useCallback(() => {
    if (sttLockRef.current) return;
    const now = Date.now();
    if (now < coolUntilRef.current) return;
    sttLockRef.current = true;
    try {
      stopTTS();
      stopAllMedia();
      playBeep();
      try { window.dispatchEvent(new CustomEvent('voice:mic-mode', { detail: { active: true } })); } catch {}
      startSTT();
    } finally {
      sttLockRef.current = false;
    }
  }, [startSTT, stopTTS, stopAllMedia, playBeep]);

  const safeStop = useCallback(() => {
    if (sttLockRef.current) return;
    sttLockRef.current = true;
    try {
      stopSTT();
    } finally {
      sttLockRef.current = false;
      coolUntilRef.current = Date.now() + 600;
      try { VoiceEventBus.emitMicMode(false); } catch {}
    }
  }, [stopSTT]);

  // 학습 메뉴 항목 선택 처리 함수 (재사용)
  const handleLearnMenuSelection = useCallback((text: string) => {
    let normalized = text.toLowerCase().trim();
    
    // 오인식 패턴 보정
    const misrecognitionMap: Record<string, string> = {
      "자무": "자모", "자모.": "자모", "참호": "자모", "잠오": "자모", "사모": "자모",
      "단어.": "단어", "다워": "단어", "다오": "단어", "암호": "단어",
      "문장.": "문장",
      "학습모드": "학습", "학습모드.": "학습",
    };
    
    for (const [wrong, correct] of Object.entries(misrecognitionMap)) {
      if (normalized.includes(wrong)) {
        normalized = normalized.replace(wrong, correct);
      }
    }
    
    // 학습 메뉴 항목 선택 처리 (어디서든 작동)
    if (/(자모|자음|모음|자무|참호|잠오|사모)/.test(normalized) || 
        normalized.startsWith('자') || 
        normalized.includes('자모') || 
        normalized.includes('자음') || 
        normalized.includes('모음') ||
        (normalized.length <= 3 && normalized[0] === '자')) {
      stopTTS();
      navigate('/learn/char');
      speak('자모 학습으로 이동합니다.');
      stopSTT();
      return true;
    }
    if (/(단어|워드|다워|다오|암호|word)/.test(normalized) || 
        normalized.startsWith('단') || 
        normalized.startsWith('word') ||
        normalized.includes('단어') ||
        normalized.includes('다워') ||
        normalized.includes('암호') ||
        normalized.includes('word') ||
        (normalized.length <= 3 && normalized[0] === '단') ||
        (normalized.length <= 3 && normalized[0] === '다') ||
        normalized === 'word' || normalized === '워드') {
      stopTTS();
      navigate('/learn/word');
      speak('단어 학습으로 이동합니다.');
      stopSTT();
      return true;
    }
    if (/(문장|센턴스)/.test(normalized) || 
        normalized.startsWith('문') || 
        normalized.includes('문장') ||
        (normalized.length <= 3 && normalized[0] === '문')) {
      stopTTS();
      navigate('/learn/sentence');
      speak('문장 학습으로 이동합니다.');
      stopSTT();
      return true;
    }
    if (/(자유\s*변환|자유변환|변환)/.test(normalized) || 
        normalized.includes('변환') || 
        normalized.includes('자유')) {
      stopTTS();
      navigate('/learn/free');
      speak('자유 변환으로 이동합니다.');
      stopSTT();
      return true;
    }
    
    return false;
  }, [navigate, speak, stopTTS, stopSTT]);

  // 음성 명령 처리
  const { onSpeech } = useVoiceCommands({
    home: () => {
      if (location.pathname !== '/') {
        navigate('/');
        speak('홈으로 이동합니다.');
      }
    },
    back: () => {
      navigate(-1);
      speak('뒤로 갑니다.');
    },
    learn: () => {
      navigate('/learn');
      speak('점자 학습 모드로 이동합니다.');
      stopSTT();
    },
    explore: () => {
      navigate('/explore');
      speak('정보 탐색 모드로 이동합니다.');
      stopSTT();
    },
    review: () => {
      navigate('/review');
      speak('복습 모드로 이동합니다.');
      stopSTT();
    },
    // 전역 재생 제어 명령은 이벤트로 브로드캐스트하여 화면 단에서 처리
    next: () => {
      window.dispatchEvent(new CustomEvent('voice:command', { detail: { type: 'next' } }));
    },
    prev: () => {
      window.dispatchEvent(new CustomEvent('voice:command', { detail: { type: 'prev' } }));
    },
    repeat: () => {
      window.dispatchEvent(new CustomEvent('voice:command', { detail: { type: 'repeat' } }));
    },
    freeConvert: () => {
      navigate('/free-convert');
      speak('자유 변환 모드로 이동합니다.');
      stopSTT();
    },
    quiz: () => {
      navigate('/quiz');
      speak('퀴즈 모드로 이동합니다.');
      stopSTT();
    },
    help: () => {
      const helpText = '화면을 길게 눌러 음성 명령을 사용할 수 있습니다. 학습, 탐색, 복습, 변환, 퀴즈 등의 명령을 말하세요.';
      speak(helpText);
    },
    mute: () => {
      stopTTS();
    },
    unmute: () => {
      speak('음성이 활성화되었습니다.');
    },
    stop: () => {
      stopSTT();
      speak('음성 인식을 중지합니다.');
    },
    pause: () => {
      stopSTT();
    },
    // 학습 메뉴 내 항목 선택 (speak 핸들러에서 처리) + 경로 기반 바이어스
    speak: (text: string) => {
      // 학습 메뉴 항목 선택 시도 (현재 경로 바이어스)
      if (location.pathname === '/learn') {
        if (handleLearnMenuSelection(text)) return;
      }
      
      // 기본 TTS 처리
      stopTTS();
      speak(text);
    },
  });

  // 음성 명령 처리 (중복 방지 완화 + 여러 대안 활용)
  useEffect(() => {
    if (!transcript) {
      transcriptProcessedRef.current = false;
      return;
    }
    
    // 중복 처리 방지 완화: 같은 텍스트가 1초 이내에 연속으로 오면 무시 (더 짧은 시간)
    const now = Date.now();
    const { lastTranscriptTime, lastTranscriptText } = useVoiceStore.getState();
    if (transcript === lastTranscriptText && transcriptProcessedRef.current && (now - lastTranscriptTime < 1000)) {
      console.log('[GlobalVoice] 중복 인식 무시:', transcript);
      return;
    }
    
    // 새로운 텍스트인 경우에만 처리
    if (transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      transcriptProcessedRef.current = true;
      console.log('[GlobalVoice] 인식된 텍스트:', transcript);
      
      let commandMatched = false;
      
      // 여러 대안이 있으면 모두 시도 (confidence 순서대로)
      if (alternatives && alternatives.length > 0) {
        console.log(`[GlobalVoice] ${alternatives.length}개의 대안 처리 중...`);
        // 각 대안을 순서대로 시도 (이미 confidence 순으로 정렬됨)
        for (const alt of alternatives) {
          const matched = onSpeech(alt.transcript);
          if (matched) {
            console.log(`[GlobalVoice] 대안 "${alt.transcript}"에서 명령 매칭 성공`);
            // 명령 성공 시에는 transcript 브로드캐스트를 하지 않음
            commandMatched = true;
            break; // 명령이 매칭되면 중단
          }
        }
      }
      
      // 대안에서 매칭되지 않았거나 대안이 없으면 기본 텍스트 처리
      if (!commandMatched) {
        const matched = onSpeech(transcript);
        if (matched) {
          commandMatched = true;
        } else {
          // onSpeech가 false를 반환한 경우 (학습 메뉴 항목 등)
          // 학습 메뉴 항목 선택 처리 시도
          if (handleLearnMenuSelection(transcript)) {
            commandMatched = true;
          } else {
            // 학습 메뉴 항목이 아니면 기본 TTS 처리
            stopTTS();
            speak(transcript);
          }
        }
        if (!commandMatched) {
          onTranscript?.(transcript);
          // 전역 이벤트로 최종 인식 텍스트 브로드캐스트 (정규화 + 중복 억제)
          try {
            const text = String(transcript || '').replace(/\s+/g, ' ').trim();
            const now = Date.now();
            if (text && !(lastBroadcastRef.current.text === text && now - lastBroadcastRef.current.time < 1500)) {
              lastBroadcastRef.current = { text, time: now };
              window.dispatchEvent(new CustomEvent('voice:transcript', { detail: { text } }));
            }
          } catch {}
        }
      }
      
      // 일정 시간 후 플래그 리셋 (같은 텍스트를 다시 말할 수 있도록)
      setTimeout(() => {
        transcriptProcessedRef.current = false;
        lastTranscriptRef.current = ''; // 리셋하여 같은 명령을 다시 말할 수 있게
      }, 1000); // 2초에서 1초로 단축
    }
  }, [transcript, alternatives, onSpeech, onTranscript]);

  // 롱프레스 시작
  const handlePointerDown = useCallback((e: PointerEvent) => {
    // 버튼이나 입력 필드에서는 작동하지 않도록
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a')
    ) {
      return;
    }

    pressStartRef.current = { x: e.clientX, y: e.clientY, ...( { time: Date.now() } as any) };
    hasStartedRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setShowAnimation(true);
      hasStartedRef.current = true;
      console.log('[GlobalVoice] 롱프레스 감지 - 음성 인식 시작');
      // Restrict long-press start to Explore/FreeConvert pages
      if (isVoiceActivePath()) {
        if (throttlePointer(350)) {
          micMode.requestStart();
        }
      } else {
        // 비활성 페이지에서는 무시
        setIsLongPressing(false);
        setShowAnimation(false);
        hasStartedRef.current = false;
      }
    }, LONG_PRESS_DURATION);
  }, [safeStart, isVoiceActivePath, throttlePointer]);

  // 롱프레스 종료
  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 롱프레스가 시작되었고 음성 인식이 진행 중이면 중지
    if (hasStartedRef.current && isListening) {
      console.log('[GlobalVoice] 롱프레스 종료 - 음성 인식 중지');
      micMode.requestStop();
    }

    // 짧은 탭: 마이크 토글
    if (pressStartRef.current) {
      const startTime = (pressStartRef.current as any).time ?? 0;
      const dt = Date.now() - startTime;
      if (dt < TAP_TOGGLE_THRESHOLD) {
        // Restrict tap-start to Explore/FreeConvert pages
        if (!isListening && isVoiceActivePath()) {
          console.log('[GlobalVoice] 탭 - STT 시작');
          if (throttlePointer(300)) micMode.requestStart();
        } else if (isListening && isVoiceActivePath()) {
          console.log('[GlobalVoice] 탭 - STT 중지');
          if (throttlePointer(300)) micMode.requestStop();
        }
      }
    }

    // 애니메이션 숨기기 (약간의 딜레이로 부드럽게)
    setTimeout(() => {
      setIsLongPressing(false);
      if (!isListening) {
        setShowAnimation(false);
      }
    }, 200);
  }, [isListening, safeStop, throttlePointer, isVoiceActivePath, safeStart]);

  // MicMode intents → 실제 STT start/stop 수행
  useEffect(() => {
    const unSubStart = onMicIntent((e) => {
      if (e?.action === 'start') safeStart();
      if (e?.action === 'stop') safeStop();
    });
    return () => {
      unSubStart();
    };
  }, [safeStart, safeStop]);

  // 포인터 이동 시 롱프레스 취소
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!pressStartRef.current) return;

    const dx = Math.abs(e.clientX - pressStartRef.current.x);
    const dy = Math.abs(e.clientY - pressStartRef.current.y);
    const threshold = 10; // 10px 이상 이동하면 취소

    if (dx > threshold || dy > threshold) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      pressStartRef.current = null;
    }
  }, []);

  // 전역 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handlePointerDown, handlePointerUp, handlePointerMove]);

  // 음성 인식 종료 시 애니메이션 숨기기
  useEffect(() => {
    if (!isListening && showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setIsLongPressing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, showAnimation]);

  if (!showAnimation && !isListening) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        showAnimation || isListening ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* 배경 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          showAnimation || isListening ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 중앙 마이크 애니메이션 */}
      <div className="relative flex flex-col items-center justify-center">
        {/* 파동 효과 (ChatGPT 스타일) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`absolute rounded-full border-2 ${
                isListening || isLongPressing
                  ? 'border-primary/40 animate-ping'
                  : 'border-primary/20'
              }`}
              style={{
                width: `${96 + i * 32}px`,
                height: `${96 + i * 32}px`,
                animationDelay: `${i * 150}ms`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>

        {/* 마이크 아이콘 */}
        <div
          className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isListening || isLongPressing
              ? 'scale-110 ring-4 ring-primary/30'
              : 'scale-100'
          }`}
        >
          {/* 마이크 SVG */}
          <svg
            className={`w-12 h-12 text-white transition-transform duration-300 ${
              isListening ? 'scale-110' : 'scale-100'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>

          {/* 내부 펄스 효과 */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '1s' }} />
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" style={{ animationDuration: '2s' }} />
            </>
          )}
        </div>

        {/* 상태 텍스트 */}
        <div className="mt-8 text-center">
          <p className="text-white text-lg font-semibold drop-shadow-lg">
            {isListening ? '🎤 말씀해 주세요...' : isLongPressing ? '음성 인식 준비 중...' : ''}
          </p>
          {transcript && (
            <p className="mt-2 text-white/90 text-sm drop-shadow-md max-w-xs px-4">
              {transcript}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

