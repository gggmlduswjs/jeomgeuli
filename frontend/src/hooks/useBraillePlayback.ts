import { useState, useEffect, useCallback } from 'react';
import { useBrailleBLE } from './useBrailleBLE';
import { localToBrailleCells } from '../lib/braille';

export function useBraillePlayback() {
  const { isConnected, writePattern } = useBrailleBLE();
  
  // 점자 재생 상태
  const [enabled, setEnabled] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // UI 미리보기용 상태
  const [currentWord, setCurrentWord] = useState<string>('');
  const [currentCells, setCurrentCells] = useState<boolean[][]>([]);

  // 데모 모드 (BLE 미연결 시)
  const demoMode = !isConnected;

  // 상태 배지 (파생 상태)
  const status = !enabled
    ? "대기 중"
    : isPlaying
      ? "출력 중"
      : queue.length ? "일시 정지" : "대기 중";
  
  const statusWithDemo = demoMode ? `${status} · 데모` : status;

  // 미리보기 설정
  const setPreview = useCallback((word: string) => {
    setCurrentWord(word);
    try {
      const cells = localToBrailleCells(word);
      setCurrentCells(cells);
      console.log('[BraillePlayback] 미리보기 설정:', word, cells);
    } catch (error) {
      console.error('[BraillePlayback] 미리보기 설정 실패:', error);
      setCurrentCells([]);
    }
  }, []);

  // 키워드 큐에 적재
  const enqueueKeywords = useCallback((kws: string[]) => {
    if (!kws?.length) return;
    console.log('[BraillePlayback] 키워드 큐 적재:', kws);
    setQueue(kws);
    setIndex(0);
    if (enabled) {
      start();
    }
  }, [enabled]);

  // 현재 키워드 출력
  const writeCurrent = useCallback(async () => {
    const word = queue[index];
    if (!word) { 
      setIsPlaying(false); 
      return; 
    }
    
    // 공통: 미리보기에 단어/셀 반영
    setPreview(word);
    
    if (demoMode) {
      // 데모: BLE 없이 1.5s 간격으로 표시만
      console.log('[BraillePlayback] 데모 모드 출력:', word);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return;
    }
    
    // 실제 BLE 출력
    console.log('[BraillePlayback] BLE 출력:', word);
    await writePattern(word);
  }, [queue, index, writePattern, demoMode, setPreview]);

  // 재생 시작
  const start = useCallback(async () => {
    if (!enabled || !queue.length) return;
    if (!demoMode && !isConnected) return; // 데모 모드가 아니면 BLE 연결 필요
    console.log('[BraillePlayback] 재생 시작');
    setIsPlaying(true);
    await writeCurrent();
  }, [enabled, queue.length, demoMode, isConnected, writeCurrent]);

  // 다음 키워드
  const next = useCallback(() => {
    if (!queue.length) return;
    console.log('[BraillePlayback] 다음 키워드');
    setIndex(i => {
      const ni = Math.min(i + 1, queue.length - 1);
      return ni;
    });
    if (enabled) {
      start();
    }
  }, [queue.length, enabled, start]);

  // 반복
  const repeat = useCallback(() => {
    if (!queue.length) return;
    console.log('[BraillePlayback] 반복');
    if (enabled) {
      start();
    }
  }, [queue.length, enabled, start]);

  // 일시 정지
  const pause = useCallback(() => {
    console.log('[BraillePlayback] 일시 정지');
    setIsPlaying(false);
  }, []);

  // 인덱스 설정
  const setIndexTo = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < queue.length) {
      console.log('[BraillePlayback] 인덱스 설정:', newIndex);
      setIndex(newIndex);
      if (enabled) {
        start();
      }
    }
  }, [queue.length, enabled, start]);

  // 리셋
  const reset = useCallback(() => {
    console.log('[BraillePlayback] 리셋');
    setQueue([]);
    setIndex(0);
    setIsPlaying(false);
  }, []);

  // 인덱스 변경 시 재출력
  useEffect(() => {
    if (enabled && isPlaying && (demoMode || isConnected)) { 
      writeCurrent(); 
    }
  }, [index, enabled, isPlaying, demoMode, isConnected, writeCurrent]);

  // 토글 상태 변경 시 자동 재생
  useEffect(() => {
    if (enabled && queue.length && (demoMode || isConnected)) {
      start();
    }
    if (!enabled) {
      setIsPlaying(false);
    }
  }, [enabled, queue.length, demoMode, isConnected, start]);

  return {
    // 상태
    enabled,
    setEnabled,
    queue,
    index,
    isPlaying,
    currentWord,
    currentCells,
    status: statusWithDemo,
    demoMode,
    
    // 메서드
    enqueueKeywords,
    start,
    next,
    repeat,
    pause,
    setIndexTo,
    reset,
  };
}

export default useBraillePlayback;
