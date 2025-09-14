import { useState, useCallback } from 'react';
import { toBraille, cellsToBins, forBLE } from '../lib/brailleRules';

export function useBrailleBLE() {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    console.log("[BLE] 연결 시도 중...");
    // TODO: 실제 BLE 연결 로직
    // navigator.bluetooth.requestDevice() 등을 사용
    setIsConnected(true);
    console.log("[BLE] 연결 완료");
  }, []);

  const disconnect = useCallback(async () => {
    console.log("[BLE] 연결 해제 중...");
    // TODO: 실제 BLE 연결 해제 로직
    setIsConnected(false);
    console.log("[BLE] 연결 해제 완료");
  }, []);

  const writePattern = useCallback(async (text: string) => {
    if (!isConnected) {
      console.log("[BLE] 연결되지 않음. 먼저 연결해주세요.");
      return;
    }

    try {
      console.log(`[BLE] 점자 패턴 전송 시작: "${text}"`);
      
      // 텍스트를 점자로 변환
      const tokens = toBraille(text);
      const bins = cellsToBins(tokens);
      const packed = forBLE(bins);
      
      console.log(`[BLE] 변환된 점자 패턴:`, {
        tokens: tokens.length,
        bins: bins.length,
        packed: Array.from(packed)
      });
      
      // TODO: 실제 BLE GATT Write 특성으로 전송
      // await characteristic.writeValue(packed);
      
      console.log(`[BLE] 점자 패턴 전송 완료: "${text}"`);
    } catch (error) {
      console.error("[BLE] 점자 패턴 전송 실패:", error);
    }
  }, [isConnected]);

  return { 
    connect, 
    disconnect, 
    writePattern, 
    isConnected 
  };
}

export default useBrailleBLE;