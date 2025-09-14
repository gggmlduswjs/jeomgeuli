import { useCallback, useRef, useState } from 'react';

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

interface TTSHookReturn {
  speak: (text: string | string[], options?: TTSOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

function useTTS(): TTSHookReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const utteranceQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  const isSupported = 'speechSynthesis' in window;

  const speak = useCallback((text: string | string[], options: TTSOptions = {}) => {
    if (!isSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      return;
    }

    // 기존 음성 정지
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    isProcessing.current = false;

    const texts = Array.isArray(text) ? text : [text];
    utteranceQueue.current = texts;

    if (texts.length === 0) return;

    const processQueue = () => {
      if (utteranceQueue.current.length === 0 || isProcessing.current) return;

      isProcessing.current = true;
      const currentText = utteranceQueue.current.shift()!;

      const utterance = new SpeechSynthesisUtterance(currentText);
      
      // 기본 설정
      utterance.lang = options.lang || 'ko-KR';
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // 이벤트 핸들러
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        currentUtterance.current = utterance;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtterance.current = null;
        isProcessing.current = false;

        // 큐에 더 있으면 다음 처리
        if (utteranceQueue.current.length > 0) {
          setTimeout(processQueue, 100); // 짧은 지연
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtterance.current = null;
        isProcessing.current = false;
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    processQueue();
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    utteranceQueue.current = [];
    setIsSpeaking(false);
    setIsPaused(false);
    isProcessing.current = false;
    currentUtterance.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;

    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;

    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported
  };
}

// named export와 default export 모두 제공
export { useTTS };
export default useTTS;