import { useState, useCallback, useEffect } from "react";
import { textToPackets } from "@/lib/encodeHangul";

/**
 * Web Serial API를 사용한 Arduino 직접 연결
 * Raspberry Pi 없이 Windows에서 바로 사용 가능
 * 
 * 점자 패턴 변환 후 전송 (한글 지원)
 */

// 전역 Serial 포트 상태 (페이지 간 공유)
let globalSerialPort: SerialPort | null = null;
let globalIsConnected = false;
let globalDeviceName: string | null = null;
let globalBaudRate = 115200;

export interface BrailleSerialConfig {
  baudRate?: number;
}

export function useBrailleSerial(config: BrailleSerialConfig = {}) {
  const { baudRate = 115200 } = config;
  
  // 전역 상태와 동기화
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [port, setPort] = useState<SerialPort | null>(globalSerialPort);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(globalDeviceName);
  
  // 전역 상태 변경 감지 (다른 페이지에서 연결/해제 시)
  useEffect(() => {
    const checkGlobalState = () => {
      if (globalIsConnected !== isConnected) {
        setIsConnected(globalIsConnected);
      }
      if (globalSerialPort !== port) {
        setPort(globalSerialPort);
      }
      if (globalDeviceName !== deviceName) {
        setDeviceName(globalDeviceName);
      }
    };
    
    // 주기적으로 전역 상태 확인 (간단한 동기화)
    const interval = setInterval(checkGlobalState, 500);
    return () => clearInterval(interval);
  }, [isConnected, port, deviceName]);

  // Web Serial API 지원 확인
  const isSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  // 연결 해제 모니터링
  useEffect(() => {
    if (!port) return;

    const handleDisconnect = () => {
      setIsConnected(false);
      setPort(null);
      setError("Serial 포트 연결이 끊어졌습니다.");
    };

    // Serial 포트는 자동으로 연결 해제 이벤트를 제공하지 않으므로
    // 주기적으로 확인하거나, 에러 발생 시 처리
    return () => {
      // 클린업
    };
  }, [port]);

  const connect = useCallback(async () => {
    try {
      setError(null);

      if (!isSerialSupported) {
        throw new Error("Web Serial API를 지원하지 않는 브라우저입니다. Chrome 또는 Edge를 사용해주세요.");
      }

      // 전역 포트가 이미 연결되어 있으면 재사용
      if (globalSerialPort && globalSerialPort.readable && globalSerialPort.writable) {
        console.log("[Serial] 전역 포트 재사용");
        setPort(globalSerialPort);
        setIsConnected(true);
        setDeviceName(globalDeviceName);
        return;
      }

      // 로컬 포트가 이미 연결되어 있으면 재사용
      if (port && port.readable && port.writable) {
        console.log("[Serial] 로컬 포트 재사용");
        globalSerialPort = port;
        globalIsConnected = true;
        globalDeviceName = deviceName;
        setIsConnected(true);
        return;
      }

      // Serial 포트 요청
      console.log("[Serial] Serial 포트 선택 대기 중...");
      let newPort: SerialPort;
      try {
        newPort = await (navigator as any).serial.requestPort();
        console.log("[Serial] 포트 선택 완료");
      } catch (requestError: any) {
        // 사용자가 포트 선택을 취소한 경우
        if (requestError?.name === 'NotFoundError' || requestError?.name === 'AbortError') {
          console.log("[Serial] 사용자가 포트 선택을 취소했습니다.");
          setError("포트 선택이 취소되었습니다.");
          return;
        }
        throw requestError;
      }
      
      // 포트 정보 로깅
      const portInfo = newPort.getInfo?.();
      console.log("[Serial] 선택된 포트 정보:", portInfo);
      
      // 포트 열기 시도
      try {
        console.log(`[Serial] 포트 열기 시도 (baudRate: ${baudRate})...`);
      await newPort.open({ baudRate });
        console.log("[Serial] ✅ 포트 열기 성공");
      } catch (openError: any) {
        console.error("[Serial] 포트 열기 실패:", openError);
        console.error("[Serial] 에러 상세:", {
          name: openError?.name,
          message: openError?.message,
          stack: openError?.stack
        });
        
        // 포트가 이미 열려있는 경우
        if (openError?.name === 'InvalidStateError' || 
            (openError?.message && openError.message.includes('already open'))) {
          console.log("[Serial] 포트가 이미 열려있음, 재사용 시도");
          // 포트가 이미 열려있으면 readable/writable 확인
          if (newPort.readable && newPort.writable) {
            // 이미 열려있고 사용 가능하면 재사용
            globalSerialPort = newPort;
            globalIsConnected = true;
            setPort(newPort);
            setIsConnected(true);
            setError(null);
            console.log("[Serial] 이미 열린 포트 재사용 성공");
            return;
          }
        }
        
        // NetworkError: 포트가 다른 프로그램에서 사용 중
        if (openError?.name === 'NetworkError' || 
            openError?.message?.includes('Failed to open serial port')) {
          const errorMsg = "❌ 포트가 다른 프로그램에서 사용 중입니다.\n\n해결 방법:\n1. Arduino IDE의 Serial Monitor를 완전히 닫아주세요\n2. 다른 터미널 프로그램이 포트를 사용 중인지 확인하세요\n3. 몇 초 후 다시 시도해주세요";
          console.error("[Serial]", errorMsg);
          setError(errorMsg);
          return;
        }
        
        // 기타 에러는 재throw하여 외부 catch에서 처리
        throw openError;
      }
      
      // 전역 상태 업데이트
      globalSerialPort = newPort;
      globalIsConnected = true;
      globalBaudRate = baudRate;
      const newDeviceName = portInfo?.usbVendorId 
        ? `Arduino (VID: 0x${portInfo.usbVendorId.toString(16)}, PID: 0x${portInfo.usbProductId?.toString(16) || '???'})` 
        : "Arduino Serial";
      globalDeviceName = newDeviceName;
      
      // 로컬 상태 업데이트
      setPort(newPort);
      setIsConnected(true);
      setDeviceName(newDeviceName);
      setError(null);
      
      console.log("[Serial] ✅ Arduino 연결 성공:", newDeviceName);

    } catch (error: any) {
      console.error("[Serial] ❌ 연결 실패:", error);
      console.error("[Serial] 에러 상세:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      // NetworkError: 포트가 다른 프로그램에서 사용 중 (최상위 catch에서도 처리)
      if (error?.name === 'NetworkError' || 
          error?.message?.includes('Failed to open serial port')) {
        const errorMsg = "❌ 포트가 다른 프로그램에서 사용 중입니다.\n\n해결 방법:\n1. Arduino IDE의 Serial Monitor를 완전히 닫아주세요\n2. 다른 터미널 프로그램이 포트를 사용 중인지 확인하세요\n3. 몇 초 후 다시 시도해주세요";
        setError(errorMsg);
        console.error("[Serial]", errorMsg);
        return;
      }
      
      // 사용자가 취소한 경우는 오류로 처리하지 않음
      if (error?.name === 'NotFoundError' || error?.name === 'SecurityError' || error?.name === 'AbortError') {
        const message = error.name === 'SecurityError' 
          ? "Serial 포트 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요."
          : error.name === 'AbortError'
          ? "포트 선택이 취소되었습니다."
          : "포트를 찾을 수 없거나 사용자가 취소했습니다.";
        setError(message);
        console.log("[Serial]", message);
        return;
      }
      
      // InvalidStateError: 포트가 이미 열려있음
      if (error?.name === 'InvalidStateError') {
        if (error?.message?.includes('already open')) {
          console.log("[Serial] 포트가 이미 열려있음, 전역 상태로 설정");
          setIsConnected(globalIsConnected);
          setPort(globalSerialPort);
          setDeviceName(globalDeviceName);
          return;
        }
      }
      
      // 다른 오류는 설정
      const errorMsg = error?.message || "Serial 연결에 실패했습니다. Arduino IDE의 Serial Monitor를 닫고 다시 시도해주세요.";
      setError(errorMsg);
      console.error("[Serial]", errorMsg);
    }
  }, [port, isSerialSupported, baudRate, deviceName]);

  const disconnect = useCallback(async () => {
    const portToClose = port || globalSerialPort;
    if (portToClose) {
      try {
        await portToClose.close();
        
        // 전역 상태 초기화
        globalSerialPort = null;
        globalIsConnected = false;
        globalDeviceName = null;
        
        // 로컬 상태 초기화
        setPort(null);
        setIsConnected(false);
        setDeviceName(null);
        setError(null);
        console.log("[Serial] 연결 해제됨");
      } catch (err: any) {
        console.error("[Serial] 연결 해제 실패:", err);
        setError(`연결 해제 실패: ${err?.message || '알 수 없는 오류'}`);
      }
    }
  }, [port]);

  /**
   * 점자 셀 배열을 Serial로 전송
   * @param cells 점자 셀 배열 (각 셀은 6개 점을 나타내는 숫자 배열)
   */
  const writeCells = useCallback(async (cells: number[][]) => {
    const activePort = port || globalSerialPort;
    const activeConnected = isConnected || globalIsConnected;
    
    if (!activePort || !activeConnected) {
      throw new Error("Serial 포트가 연결되지 않았습니다.");
    }

    if (!activePort.writable) {
      throw new Error("WritableStream을 사용할 수 없습니다.");
    }

    // WritableStream이 locked 상태인지 확인
    if (activePort.writable.locked) {
      console.warn("[Serial] WritableStream이 locked 상태입니다. 잠시 대기 후 재시도...");
      // 잠시 대기 후 재시도 (최대 1초)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!activePort.writable?.locked) {
          break;
        }
      }
      if (activePort.writable?.locked) {
        throw new Error("WritableStream이 계속 locked 상태입니다. 이전 전송이 완료될 때까지 기다려주세요.");
      }
    }

    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    try {
      writer = activePort.writable.getWriter();

      // 점자 셀을 바이트 배열로 변환
      const buffer = new Uint8Array(cells.length);
      cells.forEach((cell, idx) => {
        // 6개 점을 바이트로 변환 (점이 있으면 1, 없으면 0)
        buffer[idx] = cell.reduce((acc, dot, i) => {
          return acc | ((dot ? 1 : 0) << i);
        }, 0);
      });

      await writer.write(buffer);
      
      console.log(`[Serial] ${cells.length}개 셀 전송 완료`);
    } catch (error: any) {
      console.error("[Serial] 점자 패턴 전송 실패:", error);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    } finally {
      // writer가 있으면 반드시 해제
      if (writer) {
        try {
          writer.releaseLock();
        } catch (releaseError) {
          console.warn("[Serial] Writer 해제 중 오류 (무시됨):", releaseError);
        }
      }
    }
  }, [port, isConnected]);

  /**
   * 점자 패턴 배열을 Serial로 전송 (리팩토링: CMD 제거)
   * @param patterns 패턴 배열 (0x00~0x3F)
   */
  const writePatterns = useCallback(async (patterns: number[]) => {
    const activePort = port || globalSerialPort;
    const activeConnected = isConnected || globalIsConnected;

    if (!activePort || !activeConnected) {
      throw new Error("Serial 포트가 연결되지 않았습니다.");
    }

    if (!activePort.writable) {
      throw new Error("WritableStream을 사용할 수 없습니다.");
    }

    // WritableStream이 locked 상태인지 확인
    if (activePort.writable.locked) {
      console.warn("[Serial] WritableStream이 locked 상태입니다. 잠시 대기 후 재시도...");
      // 잠시 대기 후 재시도 (최대 1초)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!activePort.writable?.locked) {
          break;
        }
      }
      if (activePort.writable?.locked) {
        throw new Error("WritableStream이 계속 locked 상태입니다. 이전 전송이 완료될 때까지 기다려주세요.");
      }
    }

    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    try {
      writer = activePort.writable.getWriter();

      // 패턴 배열을 Uint8Array로 변환 (6-bit 마스킹)
      const buffer = new Uint8Array(patterns.map(p => p & 0x3F));
      
      // 디버그 로그
      console.log(`[Serial] 📦 전송할 패턴 (${patterns.length}개):`);
      patterns.forEach((pattern, idx) => {
        const masked = pattern & 0x3F;
        console.log(`[Serial]   패턴 ${idx + 1}: 0x${masked.toString(16).toUpperCase().padStart(2, '0')}`);
      });

      // 한 번에 전송 (Arduino가 순차적으로 처리)
      await writer.write(buffer);
      
      // 패턴 간 delay (Arduino 버퍼 처리 시간 확보)
      if (patterns.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 50 * patterns.length));
      } else {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`[Serial] ✅ ${patterns.length}개 패턴 전송 완료`);
    } catch (error: any) {
      console.error("[Serial] 패턴 전송 실패:", error);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    } finally {
      // writer가 있으면 반드시 해제
      if (writer) {
        try {
        writer.releaseLock();
        } catch (releaseError) {
          console.warn("[Serial] Writer 해제 중 오류 (무시됨):", releaseError);
        }
      }
    }
  }, [port, isConnected]);

  /**
   * 텍스트를 점자 패턴으로 변환하여 Serial로 전송 (encodeHangul 사용)
   * @param text 전송할 텍스트
   */
  const writeText = useCallback(async (text: string) => {
    if (!text.trim()) {
      console.warn("[Serial] 빈 텍스트");
      return;
    }

    try {
      console.log(`[Serial] 텍스트 변환 시작: "${text}"`);
      // encodeHangul을 사용하여 로컬 변환
      const patterns = await textToPackets(text);
      console.log(`[Serial] 변환된 패턴 (${patterns.length}개):`, patterns);
      
      if (patterns.length === 0) {
        console.error("[Serial] ⚠️ 변환된 패턴이 없습니다!");
        console.error("[Serial] 텍스트:", text);
        console.error("[Serial] 각 문자 분석:");
        const { encodeChar } = await import("@/lib/encodeHangul");
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charPatterns = await encodeChar(char);
          console.error(`[Serial]   "${char}" (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}) -> ${charPatterns.length}개 패턴`);
          if (charPatterns.length === 0) {
            console.error(`[Serial]     ❌ 이 문자는 패턴이 생성되지 않았습니다!`);
        }
      }
        setError("변환된 패턴이 없습니다. 콘솔을 확인하세요.");
        return;
      }
      
      console.log(`[Serial] ${patterns.length}개 패턴 전송 시작`);
      await writePatterns(patterns);
      console.log(`[Serial] ✅ 전송 완료: ${patterns.length}개 패턴`);
    } catch (error: any) {
      console.error("[Serial] ❌ 텍스트 전송 실패:", error);
      console.error("[Serial] 에러 스택:", error.stack);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    }
  }, [writePatterns]);
  
  // 전역 포트 사용 (반환값에서 사용)
  const activePort = port || globalSerialPort;
  const activeConnected = isConnected || globalIsConnected;

  /**
   * 단일 패턴 전송
   */
  const sendSingle = useCallback(async (pattern: number) => {
    await writePatterns([pattern & 0x3F]);
  }, [writePatterns]);

  /**
   * 다중 패턴 전송
   */
  const sendMulti = useCallback(async (patterns: number[]) => {
    await writePatterns(patterns.map(p => p & 0x3F));
  }, [writePatterns]);

  /**
   * 모든 셀 클리어 (3개 셀 모두 0x00)
   */
  const sendClear = useCallback(async () => {
    await writePatterns([0x00, 0x00, 0x00]);
  }, [writePatterns]);

  /**
   * 테스트 모드 (dot1~dot6 순차 출력)
   */
  const sendTest = useCallback(async () => {
    const testPatterns = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20]; // dot1~dot6
    for (const pattern of testPatterns) {
      await writePatterns([pattern]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    }
    await writePatterns([0x00]); // 마지막에 클리어
  }, [writePatterns]);

  /**
   * 간단한 고정 패턴 전송 (디버깅용)
   * @param pattern 전송할 패턴 (0x00 ~ 0x3F)
   */
  const sendTestPattern = useCallback(async (pattern: number) => {
    const testPattern = pattern & 0x3F;
    console.log(`[Serial] 테스트 패턴 전송: 0x${testPattern.toString(16).toUpperCase().padStart(2, '0')}`);
    await writePatterns([testPattern]);
  }, [writePatterns]);

  return {
    isConnected: activeConnected,
    isSerialSupported,
    deviceName: deviceName || globalDeviceName,
    error,
    connect,
    disconnect,
    writePatterns,
    writeCells, // 레거시 호환
    writeText,
    sendSingle,
    sendMulti,
    sendClear,
    sendTest,
    sendTestPattern
  };
}

export default useBrailleSerial;

