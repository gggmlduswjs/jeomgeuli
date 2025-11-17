# 하드웨어 연동 가이드

## 개요

점글이는 BLE (Bluetooth Low Energy)를 통해 점자 디스플레이와 연동할 수 있습니다.

> **참고**: 직접 제작한 하드웨어를 사용하는 경우, Arduino 펌웨어 개발이 필요합니다. 자세한 내용은 [Arduino 펌웨어 개발 가이드](./ARDUINO_FIRMWARE.md)를 참고하세요.

## 지원 하드웨어

### 현재 지원
- **Orbit Reader 20** (설정 필요)
- **일반 BLE 점자 디스플레이** (표준 프로토콜)

### 브라우저 지원
- ✅ **Android Chrome**: 완전 지원
- ✅ **Desktop Chrome/Edge**: 완전 지원
- ⚠️ **iOS Safari**: 제한적 지원 (Web Bluetooth API 제한)

## 설정 방법

### 1. 하드웨어 정보 확인

실제 점자 디스플레이의 다음 정보가 필요합니다:
- **Service UUID**: BLE 서비스 UUID
- **Characteristic UUID**: 데이터 전송용 특성 UUID
- **디바이스 이름**: BLE 스캔 시 표시되는 이름

### 2. 코드 설정

`frontend/src/hooks/useBrailleBLE.ts` 파일에서 하드웨어별 설정:

```typescript
// 하드웨어별 설정 수정
const HARDWARE_CONFIGS = {
  orbit: {
    serviceUUID: "실제_서비스_UUID",
    charUUID: "실제_특성_UUID",
    namePrefix: "Orbit"
  },
  generic: {
    serviceUUID: "실제_서비스_UUID",
    charUUID: "실제_특성_UUID",
    namePrefix: "Braille"
  }
};
```

### 3. 디바이스 스캔 (개발자 도구)

브라우저 콘솔에서 디바이스 정보 확인:

```javascript
// 디바이스 스캔 및 UUID 확인
navigator.bluetooth.requestDevice({
  acceptAllDevices: true,
  optionalServices: ['battery_service']
}).then(device => {
  console.log('디바이스:', device.name, device.id);
  return device.gatt.connect();
}).then(server => {
  return server.getPrimaryServices();
}).then(services => {
  services.forEach(service => {
    console.log('Service UUID:', service.uuid);
    service.getCharacteristics().then(chars => {
      chars.forEach(char => {
        console.log('Characteristic UUID:', char.uuid);
        console.log('Properties:', char.properties);
      });
    });
  });
});
```

## 사용 방법

### 기본 사용

```typescript
import useBrailleBLE from '@/hooks/useBrailleBLE';

function MyComponent() {
  const { 
    isConnected, 
    isBluetoothSupported,
    deviceName,
    error,
    connect, 
    disconnect, 
    writeText 
  } = useBrailleBLE();

  // 연결
  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('연결 실패:', err);
    }
  };

  // 텍스트 전송
  const handleSend = async () => {
    if (isConnected) {
      await writeText('안녕하세요');
    }
  };

  return (
    <div>
      {!isBluetoothSupported && (
        <p>Bluetooth를 지원하지 않는 브라우저입니다.</p>
      )}
      {error && <p>오류: {error}</p>}
      {deviceName && <p>연결된 디바이스: {deviceName}</p>}
      <button onClick={handleConnect} disabled={isConnected}>
        {isConnected ? '연결됨' : '연결'}
      </button>
      <button onClick={handleSend} disabled={!isConnected}>
        텍스트 전송
      </button>
      {isConnected && (
        <button onClick={disconnect}>연결 해제</button>
      )}
    </div>
  );
}
```

### 하드웨어별 설정

```typescript
// Orbit Reader 20 사용
const { connect, writeText } = useBrailleBLE({
  hardwareType: 'orbit'
});

// 커스텀 설정
const { connect, writeText } = useBrailleBLE({
  serviceUUID: 'your-service-uuid',
  charUUID: 'your-characteristic-uuid',
  namePrefix: 'YourDevice'
});
```

## 데이터 형식

### 점자 셀 형식

점자 셀은 6개 점을 나타내는 배열입니다:

```typescript
// 각 셀: [dot1, dot2, dot3, dot4, dot5, dot6]
// true = 점 있음, false = 점 없음
const cells: number[][] = [
  [1, 0, 0, 0, 0, 0], // 'ㄱ'
  [1, 0, 1, 0, 0, 0], // 'ㄴ'
  // ...
];
```

### 직접 셀 전송

```typescript
const { writeCells } = useBrailleBLE();

// 점자 셀 배열 직접 전송
await writeCells([
  [1, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 0, 0]
]);
```

### 텍스트 자동 변환

```typescript
const { writeText } = useBrailleBLE();

// 텍스트를 점자로 자동 변환 후 전송
await writeText('안녕하세요');
// 내부적으로 API 호출 → 점자 변환 → BLE 전송
```

## 문제 해결

### 디바이스를 찾을 수 없음

1. **디바이스가 켜져 있는지 확인**
2. **Bluetooth가 활성화되어 있는지 확인**
3. **디바이스가 페어링 모드인지 확인**
4. **namePrefix 설정 확인**: 실제 디바이스 이름과 일치하는지

### 연결 실패

1. **권한 확인**
   - 브라우저 설정에서 Bluetooth 권한 허용
   - HTTPS 사용 (localhost 제외)

2. **UUID 확인**
   - Service UUID와 Characteristic UUID가 정확한지
   - 하드웨어 문서 참조

3. **브라우저 확인**
   - Chrome/Edge 권장
   - iOS Safari는 제한적

### 전송 실패

1. **연결 상태 확인**
   ```typescript
   if (!isConnected) {
     console.error('디바이스가 연결되지 않았습니다.');
     return;
   }
   ```

2. **데이터 형식 확인**
   - 점자 셀 형식이 올바른지
   - 하드웨어 프로토콜에 맞는지

3. **에러 메시지 확인**
   ```typescript
   try {
     await writeText('테스트');
   } catch (error) {
     console.error('전송 실패:', error);
     // error 객체에서 상세 정보 확인
   }
   ```

## 하드웨어별 프로토콜

### Orbit Reader 20

- **Service UUID**: `0000180f-0000-1000-8000-00805f9b34fb` (예시)
- **Characteristic UUID**: `00002a19-0000-1000-8000-00805f9b34fb` (예시)
- **데이터 형식**: 바이트 배열 (각 바이트 = 1 셀)

### 일반 점자 디스플레이

- 표준 HID 서비스 사용 가능
- 제조사 문서 참조 필요

## 보안 고려사항

1. **HTTPS 필수**: Web Bluetooth API는 HTTPS에서만 동작
2. **사용자 권한**: 디바이스 선택은 사용자가 직접 해야 함
3. **데이터 암호화**: 민감한 데이터는 추가 암호화 고려

## 참고 자료

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [BLE 점자 디스플레이 표준](https://www.bluetooth.com/specifications/specs/)
- [Orbit Reader 20 문서](https://www.orbitresearch.com/)

