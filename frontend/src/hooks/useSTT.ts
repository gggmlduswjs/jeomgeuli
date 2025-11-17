import { useState, useCallback, useRef, useEffect } from 'react';
import GoogleStreamingProvider from '../stt/GoogleStreamingProvider';

interface STTHookReturn {
  start: () => void;
  stop: () => void;
  isListening: boolean;
  transcript: string;
  error: string | null;
  alternatives?: Array<{ transcript: string; confidence: number }>; // 여러 대안 추가
}

type VendorSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: ((this: VendorSpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: VendorSpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: VendorSpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: VendorSpeechRecognition, ev: Event) => any) | null;
};

type SpeechRecognitionCtor = new () => VendorSpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w: any = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as SpeechRecognitionCtor | null;
}

export function useSTT(): STTHookReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Array<{ transcript: string; confidence: number }>>([]);

  // Provider strategy: google (WS) or web speech (fallback)
  const providerRef = useRef<any>(null);
  useEffect(() => {
    try {
      const mode = String((import.meta as any).env?.VITE_STT_PROVIDER || 'webspeech').toLowerCase();
      providerRef.current = (mode === 'google') ? new (GoogleStreamingProvider as any)() : null;
    } catch {
      providerRef.current = null;
    }
  }, []);

  const recognitionRef = useRef<VendorSpeechRecognition | null>(null);
  const stoppingRef = useRef(false);      // stop 호출 직후 onend와의 레이스 방지
  const unmountedRef = useRef(false);      // 언마운트 가드

  const start = useCallback(() => {
    // If google provider is enabled, use it first
    const p = providerRef.current;
    if (p) {
      try {
        p.onResult((final: boolean, alts: Array<{ transcript: string; confidence?: number }>) => {
          if (unmountedRef.current) return;
          const sorted = Array.isArray(alts) ? [...alts].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)) : [];
          if (final && sorted.length) {
            const top = sorted[0];
            setTranscript(String(top.transcript ?? '').trim());
            setAlternatives(sorted.map(a => ({ transcript: String(a.transcript ?? '').trim(), confidence: (a.confidence ?? 0) as number })));
          }
        });
        p.onError((err: any) => {
          console.warn('[STT] Google provider error, falling back to Web Speech:', err);
          try { p.stop(); } catch {}
          providerRef.current = null;
          setIsListening(false);
          setError(err?.message || 'Google STT error');
        });
        p.start();
        setIsListening(true);
        setError(null);
        setTranscript('');
        console.log('[STT] Google provider started');
        return;
      } catch (e: any) {
        console.warn('[STT] Google provider start failed, fallback:', e);
        try { p.stop?.(); } catch {}
        providerRef.current = null;
        setIsListening(false);
      }
    }

    const Recognition = getRecognitionCtor();
    if (!Recognition) {
      console.warn('[STT] 브라우저가 음성 인식을 지원하지 않습니다.');
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    if (recognitionRef.current || isListening) {
      console.log('[STT] 이미 음성 인식이 진행 중입니다.');
      // 이미 진행중
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false; // 한 번만 인식하고 종료
      recognition.interimResults = false; // 최종 결과만 사용
      recognition.maxAlternatives = 3; // 여러 대안 활용

      recognition.onstart = () => {
        if (unmountedRef.current) return;
        stoppingRef.current = false;
        setIsListening(true);
        setError(null);
        setTranscript('');
        console.log('[STT] 음성 인식 시작됨');
      };

      recognition.onresult = (event: any) => {
        if (unmountedRef.current) return;
        let finalTranscript = '';
        const allAlternatives: Array<{ transcript: string; confidence: number }> = [];
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            // 여러 대안 처리 (confidence가 높은 순서로 정렬)
            const alternatives: Array<{ transcript: string; confidence: number }> = [];
            for (let j = 0; j < result.length; j++) {
              const alt = result[j];
              const t = alt?.transcript ?? '';
              const conf = alt?.confidence ?? 0;
              if (t.trim()) {
                alternatives.push({ transcript: t.trim(), confidence: conf });
              }
            }
            
            // confidence가 높은 순서로 정렬
            alternatives.sort((a, b) => b.confidence - a.confidence);
            
            // 첫 번째 대안을 최종 결과로 사용
            if (alternatives.length > 0) {
              finalTranscript += alternatives[0].transcript;
              allAlternatives.push(...alternatives);
              
              console.log(`[STT] 최종 인식: "${alternatives[0].transcript}" (신뢰도: ${(alternatives[0].confidence * 100).toFixed(1)}%)`);
              if (alternatives.length > 1) {
                console.log(`[STT] 대안들:`, alternatives.slice(1).map(a => `"${a.transcript}" (${(a.confidence * 100).toFixed(1)}%)`).join(', '));
              }
            }
          }
        }
        
        // 최종 결과 설정
        if (finalTranscript.trim()) {
          setTranscript(finalTranscript.trim());
          setAlternatives(allAlternatives);
          console.log(`[STT] 현재 전체 텍스트: "${finalTranscript.trim()}"`);
        }
      };

      recognition.onerror = (event: any) => {
        if (unmountedRef.current) return;
        const code = event?.error ?? 'unknown';
        if (code === 'aborted') {
          console.debug('[STT] aborted');
          recognitionRef.current = null;
          setIsListening(false);
          return;
        }
        const msg =
          code === 'not-allowed'
            ? '마이크 권한이 거부되었습니다.'
            : code === 'no-speech'
            ? '음성이 감지되지 않았습니다.'
            : code === 'audio-capture'
            ? '마이크가 감지되지 않았습니다.'
            : code === 'network'
            ? '네트워크 오류가 발생했습니다.'
            : '음성 인식 오류가 발생했습니다.';
        console.error(`[STT] 오류 발생: ${code} - ${msg}`);
        setError(`Speech recognition error: ${msg}`);
        setIsListening(false);
        // 안전정리
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        if (unmountedRef.current) return;
        console.log('[STT] 음성 인식 종료됨');
        // stop() 직후 발생하는 onend에서는 에러/상태를 덮어쓰지 않도록
        setIsListening(false);
        recognitionRef.current = null;
        stoppingRef.current = false;
      };

      recognitionRef.current = recognition;
      console.log('[STT] 음성 인식 시작 시도...');
      recognition.start();
    } catch (e: any) {
      console.error('[STT] 음성 인식 시작 실패:', e);
      setError(e?.message || '음성 인식을 시작할 수 없습니다.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isListening]);

  const stop = useCallback(() => {
    console.log('[STT] 음성 인식 중지 요청');
    stoppingRef.current = true;

    // Stop google provider if used
    if (providerRef.current) {
      try { providerRef.current.stop?.(); } catch {}
      providerRef.current = null;
      setIsListening(false);
      return;
    }

    const rec = recognitionRef.current;
    try {
      if (rec) {
        // 즉시 중단을 위해 abort 우선
        if (typeof rec.abort === 'function') rec.abort();
        else rec.stop();
      }
    } catch (e) {
      console.warn('[STT] 중지 중 오류:', e);
    } finally {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      try {
        // 중단 시 남아있는 핸들러가 상태를 덮어쓰지 않도록
        const rec = recognitionRef.current;
        if (rec) {
          if (typeof rec.abort === 'function') rec.abort();
          else rec.stop();
        }
      } catch {
        /* no-op */
      } finally {
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    isListening,
    transcript,
    error,
    alternatives,
  };
}

// TypeScript declarations for Web Speech API (minimum)
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }
}

export default useSTT;
