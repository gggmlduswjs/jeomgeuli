import { useState, useCallback, useEffect } from "react";

/**
 * Web Serial API를 사용한 Arduino 직접 연결
 * Raspberry Pi 없이 Windows에서 바로 사용 가능
 */

export interface BrailleSerialConfig {
  baudRate?: number;
}

export function useBrailleSerial(config: BrailleSerialConfig = {}) {
  const { baudRate = 115200 } = config;
  
  const [isConnected, setIsConnected] = useState(false);
  const [port, setPort] = useState<SerialPort | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

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

      // 이미 연결되어 있으면 재연결 시도
      if (port && port.readable && port.writable) {
        console.log("[Serial] 이미 연결된 포트가 있습니다.");
        return;
      }

      // Serial 포트 요청
      console.log("[Serial] Serial 포트 선택 대기 중...");
      const newPort = await (navigator as any).serial.requestPort();
      
      // 포트 열기
      await newPort.open({ baudRate });
      
      setPort(newPort);
      setIsConnected(true);
      setDeviceName(newPort.getInfo?.()?.usbVendorId 
        ? `Arduino (COM${newPort.getInfo?.()?.usbVendorId})` 
        : "Arduino Serial");
      setError(null);
      
      console.log("[Serial] Arduino 연결 성공:", deviceName);

    } catch (error: any) {
      console.error("[Serial] 연결 실패:", error);
      
      // 사용자가 취소한 경우는 오류로 처리하지 않음
      if (error?.name === 'NotFoundError' || error?.name === 'SecurityError') {
        const message = error.name === 'SecurityError' 
          ? "Serial 포트 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요."
          : "포트를 찾을 수 없거나 사용자가 취소했습니다.";
        setError(message);
        console.log("[Serial]", message);
        return;
      }
      
      // 다른 오류는 설정
      setError(error?.message || "Serial 연결에 실패했습니다.");
      throw error;
    }
  }, [port, isSerialSupported, baudRate, deviceName]);

  const disconnect = useCallback(async () => {
    if (port) {
      try {
        await port.close();
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
    if (!port || !isConnected) {
      throw new Error("Serial 포트가 연결되지 않았습니다.");
    }

    try {
      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error("Writer를 가져올 수 없습니다.");
      }

      // 점자 셀을 바이트 배열로 변환
      const buffer = new Uint8Array(cells.length);
      cells.forEach((cell, idx) => {
        // 6개 점을 바이트로 변환 (점이 있으면 1, 없으면 0)
        buffer[idx] = cell.reduce((acc, dot, i) => {
          return acc | ((dot ? 1 : 0) << i);
        }, 0);
      });

      await writer.write(buffer);
      writer.releaseLock();
      
      console.log(`[Serial] ${cells.length}개 셀 전송 완료`);
    } catch (error: any) {
      console.error("[Serial] 점자 패턴 전송 실패:", error);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    }
  }, [port, isConnected]);

  /**
   * 텍스트를 Serial로 직접 전송
   * Arduino가 문자를 받아서 점자로 변환함
   * @param text 전송할 텍스트
   */
  const writeText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    if (!port || !isConnected) {
      throw new Error("Serial 포트가 연결되지 않았습니다.");
    }

    try {
      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error("Writer를 가져올 수 없습니다.");
      }

      // 텍스트를 UTF-8 바이트로 변환하여 전송
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      await writer.write(data);
      writer.releaseLock();
      
      console.log(`[Serial] ${text.length} 문자 전송: ${text}`);
    } catch (error: any) {
      console.error("[Serial] 텍스트 전송 실패:", error);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    }
  }, [port, isConnected]);

  return {
    isConnected,
    isSerialSupported,
    deviceName,
    error,
    connect,
    disconnect,
    writeCells,
    writeText,
  };
}

export default useBrailleSerial;

