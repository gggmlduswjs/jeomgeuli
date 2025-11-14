import { useState, useCallback } from "react";

/**
 * 점자 BLE 디바이스 연결 및 제어 Hook
 */
export function useBrailleBLE() {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const connect = useCallback(async () => {
    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Bluetooth API를 지원하지 않는 브라우저입니다.");
      }

      // 이미 연결되어 있으면 재연결 시도
      if (device && device.gatt?.connected) {
        console.log("이미 연결된 디바이스가 있습니다.");
        return;
      }

      // 이전에 연결된 디바이스가 있으면 재연결 시도
      if (device) {
        try {
          const server = await device.gatt?.connect();
          if (server) {
            const service = await server.getPrimaryService("0000180a-0000-1000-8000-00805f9b34fb");
            const char = await service.getCharacteristic("00002a29-0000-1000-8000-00805f9b34fb");
            setCharacteristic(char);
            setIsConnected(true);
            console.log("기존 디바이스로 재연결 성공");
            return;
          }
        } catch (reconnectError) {
          console.log("기존 디바이스 재연결 실패, 새로 연결 시도:", reconnectError);
          // 재연결 실패 시 새로 연결
        }
      }

      // 새 디바이스 연결
      const newDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: "Braille" },
          { namePrefix: "점자" },
          { services: ["0000180a-0000-1000-8000-00805f9b34fb"] } // Device Information Service
        ],
        optionalServices: ["0000180a-0000-1000-8000-00805f9b34fb"]
      });

      const server = await newDevice.gatt?.connect();
      if (!server) {
        throw new Error("GATT 서버 연결에 실패했습니다.");
      }

      // 점자 디스플레이 서비스 (예시 UUID)
      const service = await server.getPrimaryService("0000180a-0000-1000-8000-00805f9b34fb");
      const char = await service.getCharacteristic("00002a29-0000-1000-8000-00805f9b34fb");

      setDevice(newDevice);
      setCharacteristic(char);
      setIsConnected(true);

      newDevice.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        // 디바이스 객체는 유지하여 재연결 가능하도록
        setCharacteristic(null);
      });

    } catch (error) {
      console.error("BLE 연결 실패:", error);
      
      // 사용자가 취소한 경우는 오류로 처리하지 않음
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.log("사용자가 BLE 디바이스 선택을 취소했습니다.");
        return; // 오류를 던지지 않고 조용히 종료
      }
      
      // 다른 오류는 그대로 던짐
      throw error;
    }
  }, [device]);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setDevice(null);
    setCharacteristic(null);
  }, [device]);

  const writePattern = useCallback(async (pattern: number[]) => {
    if (!characteristic || !isConnected) {
      throw new Error("BLE 디바이스가 연결되지 않았습니다.");
    }

    try {
      // 점자 패턴을 바이트 배열로 변환
      const data = new Uint8Array(pattern);
      await characteristic.writeValue(data);
    } catch (error) {
      console.error("점자 패턴 전송 실패:", error);
      throw error;
    }
  }, [characteristic, isConnected]);

  return {
    isConnected,
    connect,
    disconnect,
    writePattern
  };
}

export default useBrailleBLE;
