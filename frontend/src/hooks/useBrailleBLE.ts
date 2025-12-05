import { useState, useCallback, useEffect } from "react";
import { textToPackets } from "@/lib/encodeHangul";

/**
 * 점자 BLE 디바이스 연결 및 제어 Hook
 * 
 * 지원하는 하드웨어:
 * - Orbit Reader 20
 * - Refreshable Braille Display (일반)
 * - 점글이 표준 하드웨어 (Jeomgeuli)
 * - 기타 표준 BLE 점자 디스플레이
 */

// BLE 서비스 및 특성 UUID (하드웨어별로 수정 필요)
const BRAILLE_SERVICE_UUID = "0000180a-0000-1000-8000-00805f9b34fb"; // Device Information Service (예시)
const BRAILLE_CHAR_UUID = "00002a29-0000-1000-8000-00805f9b34fb"; // Manufacturer Name String (예시)

// 하드웨어별 설정 (실제 하드웨어에 맞게 수정)
const HARDWARE_CONFIGS = {
  // Orbit Reader 20
  orbit: {
    serviceUUID: "0000180f-0000-1000-8000-00805f9b34fb",
    charUUID: "00002a19-0000-1000-8000-00805f9b34fb",
    namePrefix: "Orbit"
  },
  // 일반 점자 디스플레이
  generic: {
    serviceUUID: BRAILLE_SERVICE_UUID,
    charUUID: BRAILLE_CHAR_UUID,
    namePrefix: "Braille"
  },
  // 점글이 표준 하드웨어 (Raspberry Pi → Arduino → 점자 모듈)
  jeomgeuli: {
    serviceUUID: "12345678-1234-5678-1234-56789abcdef0",
    charUUID: "abcdabcd-1234-5678-1111-abcdefabcdef",
    namePrefix: "Jeomgeuli"
  }
};

export interface BrailleBLEConfig {
  hardwareType?: 'orbit' | 'generic' | 'jeomgeuli' | 'auto';
  serviceUUID?: string;
  charUUID?: string;
  namePrefix?: string;
}

export function useBrailleBLE(config: BrailleBLEConfig = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  // 하드웨어 설정 결정
  const hardwareConfig = config.hardwareType && config.hardwareType !== 'auto'
    ? HARDWARE_CONFIGS[config.hardwareType]
    : HARDWARE_CONFIGS.generic;

  const serviceUUID = config.serviceUUID || hardwareConfig.serviceUUID;
  const charUUID = config.charUUID || hardwareConfig.charUUID;
  const namePrefix = config.namePrefix || hardwareConfig.namePrefix;

  // BLE 지원 확인
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // 연결 상태 모니터링
  useEffect(() => {
    if (!device) return;

    const handleDisconnect = () => {
      setIsConnected(false);
      setCharacteristic(null);
      setError("디바이스 연결이 끊어졌습니다.");
    };

    device.addEventListener("gattserverdisconnected", handleDisconnect);
    return () => {
      device.removeEventListener("gattserverdisconnected", handleDisconnect);
    };
  }, [device]);

  const connect = useCallback(async () => {
    try {
      setError(null);

      if (!isBluetoothSupported) {
        throw new Error("Bluetooth API를 지원하지 않는 브라우저입니다. Chrome 또는 Edge를 사용해주세요.");
      }

      // 이미 연결되어 있으면 재연결 시도
      if (device && device.gatt?.connected) {
        console.log("[BLE] 이미 연결된 디바이스가 있습니다.");
        return;
      }

      // 이전에 연결된 디바이스가 있으면 재연결 시도
      if (device) {
        try {
          const server = await device.gatt?.connect();
          if (server) {
            const service = await server.getPrimaryService(serviceUUID);
            const char = await service.getCharacteristic(charUUID);
            setCharacteristic(char);
            setIsConnected(true);
            setDeviceName(device.name || "점자 디스플레이");
            console.log("[BLE] 기존 디바이스로 재연결 성공:", device.name);
            return;
          }
        } catch (reconnectError) {
          console.log("[BLE] 기존 디바이스 재연결 실패, 새로 연결 시도:", reconnectError);
          // 재연결 실패 시 새로 연결
        }
      }

      // 새 디바이스 연결
      console.log("[BLE] 새 디바이스 연결 시도...");
      const newDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: namePrefix },
          { namePrefix: "점자" },
          { services: [serviceUUID] }
        ],
        optionalServices: [serviceUUID]
      });

      const server = await newDevice.gatt?.connect();
      if (!server) {
        throw new Error("GATT 서버 연결에 실패했습니다.");
      }

      // 점자 디스플레이 서비스 및 특성 가져오기
      const service = await server.getPrimaryService(serviceUUID);
      const char = await service.getCharacteristic(charUUID);

      setDevice(newDevice);
      setCharacteristic(char);
      setIsConnected(true);
      setDeviceName(newDevice.name || "점자 디스플레이");

      console.log("[BLE] 연결 성공:", newDevice.name);

    } catch (error: any) {
      console.error("[BLE] 연결 실패:", error);
      
      // 사용자가 취소한 경우는 오류로 처리하지 않음
      if (error?.name === 'NotFoundError' || error?.name === 'SecurityError') {
        const message = error.name === 'SecurityError' 
          ? "Bluetooth 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요."
          : "디바이스를 찾을 수 없거나 사용자가 취소했습니다.";
        setError(message);
        console.log("[BLE]", message);
        return;
      }
      
      // 다른 오류는 설정
      setError(error?.message || "BLE 연결에 실패했습니다.");
      throw error;
    }
  }, [device, isBluetoothSupported, serviceUUID, charUUID, namePrefix]);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setDevice(null);
    setCharacteristic(null);
    setDeviceName(null);
    setError(null);
    console.log("[BLE] 연결 해제됨");
  }, [device]);

  /**
   * 점자 패턴 배열을 BLE로 전송 (리팩토링: CMD 제거)
   * @param patterns 패턴 배열 (0x00~0x3F)
   */
  const writePatterns = useCallback(async (patterns: number[]) => {
    if (!characteristic || !isConnected) {
      throw new Error("BLE 디바이스가 연결되지 않았습니다.");
    }

    try {
      // 패턴 배열을 Uint8Array로 변환 (6-bit 마스킹)
      const buffer = new Uint8Array(patterns.map(p => p & 0x3F));
      
      // 디버그 로그
      console.log(`[BLE] 📦 전송할 패턴 (${patterns.length}개):`);
      patterns.forEach((pattern, idx) => {
        const masked = pattern & 0x3F;
        console.log(`[BLE]   패턴 ${idx + 1}: 0x${masked.toString(16).toUpperCase().padStart(2, '0')}`);
      });

      // 한 번에 전송
      await characteristic.writeValue(buffer);
      
      // 패턴 간 delay (필요시)
      if (patterns.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 50 * patterns.length));
      }
      
      console.log(`[BLE] ✅ ${patterns.length}개 패턴 전송 완료`);
    } catch (error: any) {
      console.error("[BLE] 패턴 전송 실패:", error);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    }
  }, [characteristic, isConnected]);

  /**
   * 점자 셀 배열을 BLE로 전송 (레거시 호환)
   * @deprecated writePatterns 사용 권장
   * @param cells 점자 셀 배열 (각 셀은 6개 점을 나타내는 숫자 배열)
   */
  const writeCells = useCallback(async (cells: number[][]) => {
    if (!characteristic || !isConnected) {
      throw new Error("BLE 디바이스가 연결되지 않았습니다.");
    }

    try {
      // 점자 셀을 바이트 배열로 변환
      // 각 셀의 6개 점을 하나의 바이트로 변환 (비트 마스킹)
      const buffer = new Uint8Array(cells.length);
      cells.forEach((cell, idx) => {
        // 6개 점을 바이트로 변환 (점이 있으면 1, 없으면 0)
        // 점자 표준: [1,2,3,4,5,6] 순서
        buffer[idx] = cell.reduce((acc, dot, i) => {
          return acc | ((dot ? 1 : 0) << i);
        }, 0);
      });

      await characteristic.writeValue(buffer);
      console.log(`[BLE] ${cells.length}개 셀 전송 완료`);
    } catch (error: any) {
      console.error("[BLE] 점자 패턴 전송 실패:", error);
      setError(`전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    }
  }, [characteristic, isConnected]);

  /**
   * 텍스트를 점자로 변환하여 전송 (encodeHangul 사용)
   * @param text 전송할 텍스트
   */
  const writeText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      // encodeHangul을 사용하여 로컬 변환
      const patterns = await textToPackets(text);
      if (patterns.length === 0) {
        console.warn("[BLE] 변환된 패턴이 없습니다.");
        return;
      }
      
      await writePatterns(patterns);
    } catch (error: any) {
      console.error("[BLE] 텍스트 전송 실패:", error);
      setError(`텍스트 전송 실패: ${error?.message || '알 수 없는 오류'}`);
      throw error;
    }
  }, [writePatterns]);

  /**
   * 레거시 호환: 패턴 배열 직접 전송
   * @deprecated writePatterns 사용 권장
   */
  const writePattern = useCallback(async (pattern: number[]) => {
    await writePatterns(pattern);
  }, [writePatterns]);

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

  return {
    isConnected,
    isBluetoothSupported,
    deviceName,
    error,
    connect,
    disconnect,
    writePatterns,
    writeCells, // 레거시 호환
    writeText,
    writePattern, // 레거시 호환
    sendSingle,
    sendMulti,
    sendClear,
    sendTest
  };
}

export default useBrailleBLE;
