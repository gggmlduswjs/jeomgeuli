/**
 * 음성 인식 피드백 수집 서비스
 * 오인식 패턴을 자동으로 수집하여 개선에 활용
 */

export interface MisrecognitionLog {
  original: string;
  corrected: string;
  context: string;
  timestamp: number;
  confidence?: number;
}

const STORAGE_KEY = 'voice_misrecognition_logs';
const MAX_LOGS = 100; // 최대 저장 개수

class VoiceFeedbackServiceClass {
  /**
   * 오인식 패턴 로깅
   */
  logMisrecognition(
    original: string,
    corrected: string,
    context: string,
    confidence?: number
  ): void {
    try {
      const logs = this.getLogs();
      const newLog: MisrecognitionLog = {
        original: original.trim().toLowerCase(),
        corrected: corrected.trim().toLowerCase(),
        context,
        timestamp: Date.now(),
        confidence,
      };
      
      // 중복 체크 (같은 original/corrected 조합이 최근 1시간 이내에 있으면 스킵)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const isDuplicate = logs.some(
        log =>
          log.original === newLog.original &&
          log.corrected === newLog.corrected &&
          log.context === newLog.context &&
          log.timestamp > oneHourAgo
      );
      
      if (!isDuplicate) {
        logs.push(newLog);
        // 최대 개수 제한
        if (logs.length > MAX_LOGS) {
          logs.shift(); // 가장 오래된 것 제거
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        console.log('[VoiceFeedback] 오인식 패턴 로깅:', newLog);
      }
    } catch (error) {
      console.warn('[VoiceFeedback] 로깅 실패:', error);
    }
  }
  
  /**
   * 저장된 로그 가져오기
   */
  getLogs(): MisrecognitionLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.warn('[VoiceFeedback] 로그 읽기 실패:', error);
      return [];
    }
  }
  
  /**
   * 로그 분석 - 자주 발생하는 오인식 패턴 추출
   */
  analyzeLogs(): Array<{ pattern: string; correct: string; count: number; contexts: string[] }> {
    const logs = this.getLogs();
    const patternMap = new Map<string, {
      correct: string;
      count: number;
      contexts: Set<string>;
    }>();
    
    for (const log of logs) {
      const key = `${log.original}->${log.corrected}`;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          correct: log.corrected,
          count: 0,
          contexts: new Set(),
        });
      }
      const entry = patternMap.get(key)!;
      entry.count++;
      entry.contexts.add(log.context);
    }
    
    // 빈도순으로 정렬
    return Array.from(patternMap.entries())
      .map(([pattern, data]) => ({
        pattern: pattern.split('->')[0],
        correct: data.correct,
        count: data.count,
        contexts: Array.from(data.contexts),
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * 로그 초기화
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[VoiceFeedback] 로그 초기화 완료');
    } catch (error) {
      console.warn('[VoiceFeedback] 로그 초기화 실패:', error);
    }
  }
  
  /**
   * 로그 내보내기 (분석용)
   */
  exportLogs(): string {
    const logs = this.getLogs();
    const analysis = this.analyzeLogs();
    return JSON.stringify({
      logs,
      analysis,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

const VoiceFeedbackService = new VoiceFeedbackServiceClass();

export default VoiceFeedbackService;

