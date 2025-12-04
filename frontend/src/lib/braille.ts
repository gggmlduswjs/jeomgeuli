// src/lib/braille.ts - Local braille conversion utilities
import { textToPackets } from './encodeHangul';

/**
 * 패턴 바이트를 비트 배열로 변환
 * 예: 0x23 → [1, 1, 0, 0, 0, 1]
 */
function patternToBitArray(pattern: number): number[] {
  const bitArray = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 6; i++) {
    if (pattern & (1 << i)) {
      bitArray[i] = 1;
    }
  }
  return bitArray;
}

/**
 * Convert text to braille cells locally using encodeHangul
 * Returns boolean[][] where each inner array represents a 6-dot braille cell
 * 
 * This uses the encodeHangul module for full Korean braille support.
 */
export async function localToBrailleCells(text: string): Promise<boolean[][]> {
  if (!text) return [];
  
  try {
    // encodeHangul을 사용하여 패킷 얻기
    const packets = await textToPackets(text);
    
    // 패킷에서 패턴만 추출하여 비트 배열로 변환
    const cells: boolean[][] = [];
    for (const [cmd, pattern] of packets) {
      const bitArray = patternToBitArray(pattern);
      cells.push(bitArray.map(bit => bit === 1) as boolean[]);
    }
    
    return cells;
  } catch (error) {
    console.warn("[braille] localToBrailleCells failed, using fallback:", error);
    // Fallback: 빈 셀 반환
    return text.split('').map(() => [false, false, false, false, false, false]);
  }
}

/**
 * Synchronous version (for backward compatibility)
 * Note: This is a simplified fallback. Use async version for full support.
 */
export function localToBrailleCellsSync(text: string): boolean[][] {
  if (!text) return [];
  // Fallback: 빈 셀 반환
  return text.split('').map(() => [false, false, false, false, false, false]);
}

/**
 * 점 번호 리스트를 비트 배열로 변환
 * 예: [1, 2, 6] → [1, 1, 0, 0, 0, 1]
 * 
 * @param dots 점 번호 리스트 (1~6)
 * @returns 비트 배열 [0|1 x 6]
 */
export function dotsToBitArray(dots: number[]): number[] {
  const bitArray = [0, 0, 0, 0, 0, 0];
  for (const dot of dots) {
    if (dot >= 1 && dot <= 6) {
      bitArray[dot - 1] = 1;
    }
  }
  return bitArray;
}

/**
 * 비트 배열을 패턴 바이트로 변환
 * 예: [1, 1, 0, 0, 0, 1] → 0x23
 * 
 * 매핑 규칙 (하드웨어 스펙):
 * - bit0 → dot1, bit1 → dot2, bit2 → dot3, bit3 → dot4, bit4 → dot5, bit5 → dot6
 * 
 * @param bitArray 비트 배열 [0|1 x 6]
 * @returns 패턴 바이트 (0~63, 6-bit)
 */
export function bitArrayToPattern(bitArray: number[]): number {
  let pattern = 0;
  for (let i = 0; i < 6; i++) {
    if (bitArray[i]) {
      pattern |= (1 << i);  // bit0=dot1, bit1=dot2, ..., bit5=dot6
    }
  }
  const result = pattern & 0x3f;
  // 디버그 로그 (상세 모드에서만)
  if (process.env.NODE_ENV === 'development') {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      if (bitArray[i]) dots.push(i + 1);
    }
    console.log(`[bitArrayToPattern] 비트 배열: ${JSON.stringify(bitArray)} → 패턴: 0x${result.toString(16).toUpperCase().padStart(2, '0')} (dots: ${dots.length > 0 ? dots.join(',') : 'none'})`);
  }
  return result;
}

/**
 * 점 번호 리스트를 패턴 바이트로 직접 변환
 * 예: [1, 2, 6] → 0x23
 * 
 * @param dots 점 번호 리스트 (1~6)
 * @returns 패턴 바이트 (0~63, 6-bit)
 */
export function dotsToPattern(dots: number[]): number {
  return bitArrayToPattern(dotsToBitArray(dots));
}


