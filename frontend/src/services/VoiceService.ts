import { useVoiceStore } from '../store/voice';
import VoiceEventBus, { VoiceEventType, emitTranscript } from '../lib/voice/VoiceEventBus';
import micMode from '../lib/voice/MicMode';
import GoogleStreamingProvider from '../stt/GoogleStreamingProvider';

/**
 * STT Provider 인터페이스
 */
export interface STTProvider {
  start(): Promise<void>;
  stop(): void;
  isListening(): boolean;
  onResult(callback: (final: boolean, alternatives: Array<{ transcript: string; confidence?: number }>) => void): void;
  onError(callback: (error: { code: string; message?: string }) => void): void;
}

/**
 * STT 시작 옵션
 */
export interface StartSTTOptions {
  onResult?: (text: string, alternatives?: Array<{ transcript: string; confidence: number }>) => void;
  onError?: (error: string) => void;
  autoStop?: boolean; // 결과 수신 후 자동 중지 여부
}

/**
 * TTS Provider 인터페이스
 */
export interface TTSProvider {
  speak(text: string | string[], options?: { rate?: number; pitch?: number; volume?: number; lang?: string }): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): boolean;
}

/**
 * VoiceService - 음성 관련 비즈니스 로직 통합 서비스
 * STT/TTS 프로바이더를 관리하고 명령 처리를 오케스트레이션합니다.
 */
class VoiceServiceClass {
  private sttProvider: STTProvider | null = null;
  private ttsProvider: TTSProvider | null = null;
  private isInitialized = false;

  /**
   * 서비스 초기화
   */
  init(sttProvider?: STTProvider, ttsProvider?: TTSProvider): void {
    if (this.isInitialized) {
      console.warn('[VoiceService] 이미 초기화됨');
      return;
    }

    this.sttProvider = sttProvider || this.createDefaultSTTProvider();
    this.ttsProvider = ttsProvider || this.createDefaultTTSProvider();
    
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * 기본 STT Provider 생성
   */
  private createDefaultSTTProvider(): STTProvider {
    // Google Streaming Provider 또는 Web Speech API 사용
    try {
      const mode = String((import.meta as any).env?.VITE_STT_PROVIDER || 'webspeech').toLowerCase();
      if (mode === 'google') {
        return new GoogleStreamingProvider() as unknown as STTProvider;
      }
    } catch (error) {
      console.warn('[VoiceService] Google provider 생성 실패, Web Speech 사용:', error);
    }

    return this.createWebSpeechSTTProvider();
  }

  /**
   * Web Speech API 기반 STT Provider 생성
   */
  private createWebSpeechSTTProvider(): STTProvider {
    const Recognition = this.getRecognitionCtor();
    if (!Recognition) {
      throw new Error('브라우저가 음성 인식을 지원하지 않습니다.');
    }

    let recognitionInstance: any = null;
    let isListening = false;
    let resultCallback: ((final: boolean, alternatives: Array<{ transcript: string; confidence?: number }>) => void) | null = null;
    let errorCallback: ((error: { code: string; message?: string }) => void) | null = null;

    return {
      start: async () => {
        if (isListening) {
          console.warn('[VoiceService] 이미 음성 인식이 진행 중입니다.');
          return;
        }

        try {
          const recognition = new Recognition();
          recognition.lang = 'ko-KR';
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.maxAlternatives = 3;

          recognition.onstart = () => {
            isListening = true;
            useVoiceStore.getState().setListening(true);
            useVoiceStore.getState().setSTTError(null);
          };

          recognition.onresult = (event: any) => {
            const alternatives: Array<{ transcript: string; confidence?: number }> = [];
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                for (let j = 0; j < result.length; j++) {
                  const alt = result[j];
                  const t = alt?.transcript ?? '';
                  const conf = alt?.confidence ?? 0;
                  if (t.trim()) {
                    alternatives.push({ transcript: t.trim(), confidence: conf });
                    if (j === 0) finalTranscript = t.trim();
                  }
                }
              }
            }

            if (finalTranscript && resultCallback) {
              alternatives.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
              resultCallback(true, alternatives);
              useVoiceStore.getState().setTranscript(finalTranscript, alternatives);
              emitTranscript(finalTranscript);
            }
          };

          recognition.onerror = (event: any) => {
            const code = event?.error ?? 'unknown';
            const msg = this.getErrorMessage(code);
            isListening = false;
            useVoiceStore.getState().setSTTError(msg);
            useVoiceStore.getState().setListening(false);
            if (errorCallback) {
              errorCallback({ code, message: msg });
            }
          };

          recognition.onend = () => {
            isListening = false;
            useVoiceStore.getState().setListening(false);
            recognitionInstance = null;
          };

          recognitionInstance = recognition;
          recognition.start();
        } catch (error: any) {
          isListening = false;
          const msg = error?.message || '음성 인식을 시작할 수 없습니다.';
          useVoiceStore.getState().setSTTError(msg);
          if (errorCallback) {
            errorCallback({ code: 'start_failed', message: msg });
          }
        }
      },

      stop: () => {
        if (recognitionInstance) {
          try {
            if (typeof recognitionInstance.abort === 'function') {
              recognitionInstance.abort();
            } else {
              recognitionInstance.stop();
            }
          } catch (error) {
            console.warn('[VoiceService] STT 중지 중 오류:', error);
          }
          recognitionInstance = null;
        }
        isListening = false;
        useVoiceStore.getState().setListening(false);
      },

      isListening: () => isListening,

      onResult: (callback) => {
        resultCallback = callback;
      },

      onError: (callback) => {
        errorCallback = callback;
      },
    };
  }

  /**
   * 기본 TTS Provider 생성
   */
  private createDefaultTTSProvider(): TTSProvider {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('브라우저가 음성 합성을 지원하지 않습니다.');
    }

    let currentUtterance: SpeechSynthesisUtterance | null = null;
    let utteranceQueue: string[] = [];
    let isProcessing = false;
    let isSpeaking = false;
    let isPaused = false;

    const processQueue = async (options: { rate?: number; pitch?: number; volume?: number; lang?: string } = {}) => {
      if (isProcessing || !utteranceQueue.length) return;

      isProcessing = true;
      const text = utteranceQueue.shift()!;
      const utt = new SpeechSynthesisUtterance(text);
      
      utt.rate = options.rate ?? 0.9;
      utt.pitch = options.pitch ?? 1.0;
      utt.volume = options.volume ?? 1.0;
      utt.lang = options.lang || 'ko-KR';

      utt.onstart = () => {
        currentUtterance = utt;
        isSpeaking = true;
        isPaused = false;
        useVoiceStore.getState().setSpeaking(true);
      };

      utt.onend = () => {
        currentUtterance = null;
        isSpeaking = false;
        isPaused = false;
        isProcessing = false;
        useVoiceStore.getState().setSpeaking(false);
        
        if (utteranceQueue.length) {
          setTimeout(() => processQueue(options), 60);
        }
      };

      utt.onerror = () => {
        currentUtterance = null;
        isSpeaking = false;
        isPaused = false;
        isProcessing = false;
        useVoiceStore.getState().setSpeaking(false);
        
        if (utteranceQueue.length) {
          setTimeout(() => processQueue(options), 60);
        }
      };

      try {
        window.speechSynthesis.speak(utt);
      } catch (error) {
        isProcessing = false;
        currentUtterance = null;
        if (utteranceQueue.length) {
          setTimeout(() => processQueue(options), 60);
        }
      }
    };

    return {
      speak: async (text: string | string[], options = {}) => {
        // Mic Mode 체크
        if (micMode.isActive() && !(options as any)?.allowDuringMic) {
          return;
        }

        const texts = (Array.isArray(text) ? text : [text])
          .map(t => String(t ?? '').trim())
          .filter(Boolean);

        if (!texts.length) return;

        // 기존 재생 정리
        try {
          window.speechSynthesis.cancel();
        } catch {}
        
        utteranceQueue = texts;
        useVoiceStore.getState().setTTSError(null);
        processQueue(options);
      },

      stop: () => {
        try {
          window.speechSynthesis.cancel();
        } catch {}
        utteranceQueue = [];
        currentUtterance = null;
        isProcessing = false;
        isSpeaking = false;
        isPaused = false;
        useVoiceStore.getState().setSpeaking(false);
      },

      pause: () => {
        if (!isSpeaking || isPaused) return;
        try {
          window.speechSynthesis.pause();
          isPaused = true;
          useVoiceStore.getState().setPaused(true);
        } catch {}
      },

      resume: () => {
        if (!isSpeaking || !isPaused) return;
        try {
          window.speechSynthesis.resume();
          isPaused = false;
          useVoiceStore.getState().setPaused(false);
        } catch {}
      },

      isSpeaking: () => isSpeaking,
    };
  }

  /**
   * Speech Recognition 생성자 가져오기
   */
  private getRecognitionCtor(): (new () => any) | null {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }

  /**
   * 에러 메시지 변환
   */
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'not-allowed':
        return '마이크 권한이 거부되었습니다.';
      case 'no-speech':
        return '음성이 감지되지 않았습니다.';
      case 'audio-capture':
        return '마이크가 감지되지 않았습니다.';
      case 'network':
        return '네트워크 오류가 발생했습니다.';
      case 'aborted':
        return '음성 인식이 중단되었습니다.';
      default:
        return '음성 인식 오류가 발생했습니다.';
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // Mic Mode 변경 시 TTS 자동 중지
    VoiceEventBus.on(VoiceEventType.MIC_MODE, (event) => {
      const detail = event.detail as { active?: boolean };
      if (detail?.active && this.ttsProvider) {
        this.ttsProvider.stop();
      }
    });
  }

  /**
   * STT 시작
   */
  async startSTT(options?: StartSTTOptions): Promise<void> {
    if (!this.isInitialized) {
      this.init();
    }

    if (!this.sttProvider) {
      throw new Error('STT Provider가 초기화되지 않았습니다.');
    }

    // TTS 중지
    if (this.ttsProvider) {
      this.ttsProvider.stop();
    }

    // Mic Mode 활성화 (Store 업데이트)
    useVoiceStore.getState().setMicMode(true);
    micMode.requestStart(); // 하위 호환성을 위해 유지 (내부적으로는 Store 사용)

    // 콜백 등록
    if (options?.onResult || options?.onError) {
      if (options.onResult) {
        this.sttProvider.onResult((final, alternatives) => {
          if (final && alternatives.length > 0) {
            const text = alternatives[0].transcript;
            const alts = alternatives.map(a => ({
              transcript: a.transcript,
              confidence: a.confidence ?? 0,
            }));
            options.onResult!(text, alts);
            
            // autoStop 옵션이 있으면 자동 중지
            if (options.autoStop) {
              this.stopSTT();
            }
          }
        });
      }

      if (options.onError) {
        this.sttProvider.onError((error) => {
          options.onError!(error.message || '음성 인식 오류가 발생했습니다.');
        });
      }
    }

    await this.sttProvider.start();
  }

  /**
   * STT 중지
   */
  stopSTT(): void {
    if (this.sttProvider) {
      this.sttProvider.stop();
    }
    // Store 업데이트
    useVoiceStore.getState().setMicMode(false);
    micMode.requestStop(); // 하위 호환성을 위해 유지
  }

  /**
   * TTS 재생
   */
  async speak(text: string | string[], options?: { rate?: number; pitch?: number; volume?: number; lang?: string; allowDuringMic?: boolean }): Promise<void> {
    if (!this.isInitialized) {
      this.init();
    }

    if (!this.ttsProvider) {
      throw new Error('TTS Provider가 초기화되지 않았습니다.');
    }

    await this.ttsProvider.speak(text, options);
  }

  /**
   * TTS 중지
   */
  stopTTS(): void {
    if (this.ttsProvider) {
      this.ttsProvider.stop();
    }
  }

  /**
   * TTS 일시정지
   */
  pauseTTS(): void {
    if (this.ttsProvider) {
      this.ttsProvider.pause();
    }
  }

  /**
   * TTS 재개
   */
  resumeTTS(): void {
    if (this.ttsProvider) {
      this.ttsProvider.resume();
    }
  }

  /**
   * 현재 STT 상태
   */
  isSTTListening(): boolean {
    return this.sttProvider?.isListening() ?? false;
  }

  /**
   * 현재 STT 상태 전체 조회
   */
  getSTTState(): {
    isListening: boolean;
    transcript: string;
    alternatives: Array<{ transcript: string; confidence: number }>;
    error: string | null;
  } {
    const store = useVoiceStore.getState();
    return {
      isListening: this.sttProvider?.isListening() ?? false,
      transcript: store.transcript,
      alternatives: store.alternatives,
      error: store.sttError,
    };
  }

  /**
   * 현재 TTS 상태
   */
  isTTSSpeaking(): boolean {
    return this.ttsProvider?.isSpeaking() ?? false;
  }
}

// Singleton 인스턴스
const VoiceService = new VoiceServiceClass();

// 자동 초기화
VoiceService.init();

export default VoiceService;

