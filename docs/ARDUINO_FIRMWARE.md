# Arduino 펌웨어 개발 가이드

## 개요

점글이 프로젝트는 웹 애플리케이션으로, 하드웨어와 직접 통신하는 소프트웨어만 제공합니다. 실제 점자 디스플레이 하드웨어를 제어하려면 Arduino 펌웨어를 별도로 개발해야 합니다.

## 역할 분담

```
┌─────────────────────────────────────┐
│   점글이 프로젝트 (이 프로젝트)      │
│   - 웹 애플리케이션                  │
│   - 하드웨어와 통신하는 소프트웨어    │
│   - 점자 데이터 전송                  │
└──────────────┬──────────────────────┘
               │ BLE 통신
               ▼
┌─────────────────────────────────────┐
│   Arduino 펌웨어 (별도 개발 필요)     │
│   - 하드웨어 제어                     │
│   - 점자 핀 제어                      │
│   - BLE 수신 및 처리                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   점자 디스플레이 하드웨어            │
│   - 솔레노이드/서보 모터              │
│   - 점자 핀                           │
└─────────────────────────────────────┘
```

## 하드웨어 요구사항

### 권장 보드

1. **ESP32** (추천)
   - BLE 내장
   - WiFi 지원 (향후 확장 가능)
   - 저렴하고 구하기 쉬움
   - 예: ESP32 DevKit V1

2. **nRF52840**
   - BLE 5.0 지원
   - 저전력
   - 예: Adafruit Feather nRF52840

3. **Arduino Nano 33 BLE**
   - Arduino 호환
   - BLE 내장
   - 작은 크기

### 추가 부품

- **점자 핀 제어용**
  - 솔레노이드 (Solenoid) 또는
  - 서보 모터 (Servo Motor) 또는
  - 스테퍼 모터 (Stepper Motor)

- **전원 공급**
  - USB 전원 또는
  - 배터리 (모바일 사용 시)

- **점자 셀 모듈**
  - 6개 핀 × 셀 개수
  - 예: 20셀 = 120개 핀

## Arduino 펌웨어 코드 (ESP32)

### 프로젝트 구조

```
hardware/
└── arduino/
    └── braille_display/
        └── braille_display.ino
```

### 펌웨어 코드

#### `hardware/arduino/braille_display/braille_display.ino`

```cpp
/*
 * 점자 디스플레이 BLE 펌웨어
 * ESP32 기반
 * 
 * UUID는 frontend/src/hooks/useBrailleBLE.ts와 일치해야 함
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE UUID 설정 (프론트엔드와 일치)
#define SERVICE_UUID        "0000180a-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "00002a29-0000-1000-8000-00805f9b34fb"

// 디바이스 이름 (프론트엔드 namePrefix와 일치)
#define DEVICE_NAME "점자디스플레이"

// 점자 셀 설정
#define CELL_COUNT 20  // 점자 셀 개수 (하드웨어에 맞게 수정)
#define DOTS_PER_CELL 6

// 연결 상태 LED (ESP32 내장 LED)
#define LED_PIN 2

// 핀 설정 (하드웨어에 맞게 수정)
// 예: 각 셀의 6개 점을 제어하는 핀 배열
// int cellPins[CELL_COUNT][DOTS_PER_CELL] = {
//   {2, 3, 4, 5, 6, 7},   // 셀 0
//   {8, 9, 10, 11, 12, 13}, // 셀 1
//   // ...
// };

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// 점자 데이터 버퍼
uint8_t brailleBuffer[CELL_COUNT] = {0};

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      digitalWrite(LED_PIN, HIGH);
      Serial.println("클라이언트 연결됨");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      digitalWrite(LED_PIN, LOW);
      Serial.println("클라이언트 연결 해제됨");
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();

      if (value.length() > 0) {
        Serial.print("수신된 데이터 길이: ");
        Serial.println(value.length());
        
        // 점자 데이터 처리
        int cellCount = min((int)value.length(), CELL_COUNT);
        
        for (int i = 0; i < cellCount; i++) {
          brailleBuffer[i] = value[i];
          updateBrailleCell(i, brailleBuffer[i]);
        }
        
        // 나머지 셀은 비우기
        for (int i = cellCount; i < CELL_COUNT; i++) {
          brailleBuffer[i] = 0;
          updateBrailleCell(i, 0);
        }
        
        Serial.println("점자 업데이트 완료");
      }
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("점자 디스플레이 BLE 펌웨어 시작");

  // 핀 초기화
  initializePins();

  // BLE 디바이스 초기화
  BLEDevice::init(DEVICE_NAME);
  
  // BLE 서버 생성
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // BLE 서비스 생성
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // BLE 특성 생성 (쓰기 가능)
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );

  pCharacteristic->setCallbacks(new MyCallbacks());

  // 서비스 시작
  pService->start();

  // BLE 광고 시작
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // 연결 속도 향상
  BLEDevice::startAdvertising();
  
  Serial.println("BLE 광고 시작. 연결 대기 중...");
  Serial.print("디바이스 이름: ");
  Serial.println(DEVICE_NAME);
  Serial.print("Service UUID: ");
  Serial.println(SERVICE_UUID);
  Serial.print("Characteristic UUID: ");
  Serial.println(CHARACTERISTIC_UUID);
}

void loop() {
  // 연결 상태 관리
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // 연결 해제 후 대기
    pServer->startAdvertising();
    Serial.println("재연결 대기 중...");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  delay(100);
}

/**
 * 핀 초기화
 * 하드웨어 구성에 맞게 수정 필요
 */
void initializePins() {
  Serial.println("핀 초기화 중...");
  
  // 연결 상태 LED 초기화
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // TODO: 실제 하드웨어 핀 초기화 코드
  // 예: 솔레노이드 제어 핀
  // for (int cell = 0; cell < CELL_COUNT; cell++) {
  //   for (int dot = 0; dot < DOTS_PER_CELL; dot++) {
  //     pinMode(cellPins[cell][dot], OUTPUT);
  //     digitalWrite(cellPins[cell][dot], LOW);
  //   }
  // }
  
  Serial.println("핀 초기화 완료");
}

/**
 * 점자 셀 업데이트
 * @param cellIndex 셀 인덱스 (0부터 시작)
 * @param dotPattern 점 패턴 (바이트, 각 비트가 하나의 점)
 */
void updateBrailleCell(int cellIndex, uint8_t dotPattern) {
  if (cellIndex < 0 || cellIndex >= CELL_COUNT) {
    return;
  }
  
  Serial.print("셀 ");
  Serial.print(cellIndex);
  Serial.print(": 패턴 0x");
  Serial.print(dotPattern, HEX);
  Serial.print(" (");
  
  // 점자 패턴을 6개 비트로 분해하여 핀 제어
  // 비트 순서: [0, 1, 2, 3, 4, 5] = [dot1, dot2, dot3, dot4, dot5, dot6]
  for (int dot = 0; dot < DOTS_PER_CELL; dot++) {
    bool dotState = (dotPattern >> dot) & 0x01;
    
    // TODO: 실제 하드웨어 핀 제어
    // 예: 솔레노이드 제어
    // digitalWrite(cellPins[cellIndex][dot], dotState ? HIGH : LOW);
    
    // 디버그 출력
    Serial.print(dotState ? "1" : "0");
  }
  Serial.println(")");
}
```

## 라이브러리 설치

### Arduino IDE 설정

1. **Arduino IDE 설치**
   - [Arduino IDE 다운로드](https://www.arduino.cc/en/software)

2. **ESP32 보드 지원 추가**
   - 파일 → 환경설정 → 추가 보드 관리자 URL
   - 다음 URL 추가:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - 도구 → 보드 → 보드 관리자
   - "esp32" 검색 후 설치

3. **보드 선택**
   - 도구 → 보드 → ESP32 Arduino → ESP32 Dev Module

4. **포트 선택**
   - 도구 → 포트 → COM 포트 선택

5. **업로드 속도 설정**
   - 도구 → 업로드 속도 → 115200

### 필요한 라이브러리

ESP32 BLE 라이브러리는 ESP32 보드 패키지에 포함되어 있습니다. 별도 설치 불필요.

## 하드웨어 연결 예시

### 솔레노이드 방식

```
ESP32 GPIO → 트랜지스터/릴레이 → 솔레노이드 → 점자 핀
```

**회로 예시:**
```
ESP32 GPIO (예: GPIO 2)
    ↓
저항 (1kΩ)
    ↓
트랜지스터 베이스
    ↓
트랜지스터 컬렉터 → 솔레노이드 (+)
트랜지스터 에미터 → GND
솔레노이드 (-) → GND
```

### 서보 모터 방식

```
ESP32 GPIO → 서보 모터 드라이버 → 점자 핀 제어
```

### 스테퍼 모터 방식

```
ESP32 GPIO → 스테퍼 모터 드라이버 → 점자 핀 제어
```

## 프론트엔드와 통합

### 1. UUID 확인

펌웨어의 UUID와 프론트엔드 UUID가 일치해야 합니다:

**펌웨어:**
```cpp
#define SERVICE_UUID        "0000180a-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "00002a29-0000-1000-8000-00805f9b34fb"
#define DEVICE_NAME "점자디스플레이"
```

**프론트엔드 설정:**
`frontend/src/hooks/useBrailleBLE.ts` 파일 수정:

```typescript
const HARDWARE_CONFIGS = {
  // ... 기존 설정 ...
  
  // 직접 제작한 Arduino 디스플레이
  arduino: {
    serviceUUID: "0000180a-0000-1000-8000-00805f9b34fb", // 펌웨어와 일치
    charUUID: "00002a29-0000-1000-8000-00805f9b34fb",     // 펌웨어와 일치
    namePrefix: "점자디스플레이"  // 펌웨어 DEVICE_NAME과 일치
  }
};
```

### 2. 사용 예시

```typescript
import useBrailleBLE from '@/hooks/useBrailleBLE';

function MyComponent() {
  // Arduino 디스플레이 사용
  const { 
    connect, 
    disconnect, 
    writeText, 
    writeCells,
    isConnected,
    deviceName,
    error 
  } = useBrailleBLE({
    hardwareType: 'arduino'
    // 또는 직접 설정
    // serviceUUID: '0000180a-0000-1000-8000-00805f9b34fb',
    // charUUID: '00002a29-0000-1000-8000-00805f9b34fb',
    // namePrefix: '점자디스플레이'
  });

  // 연결
  const handleConnect = async () => {
    try {
      await connect();
      console.log('연결됨:', deviceName);
    } catch (err) {
      console.error('연결 실패:', err);
    }
  };

  // 텍스트 전송 (자동 점자 변환)
  const handleSendText = async () => {
    if (isConnected) {
      await writeText('안녕하세요');
    }
  };

  // 점자 셀 직접 전송
  const handleSendCells = async () => {
    if (isConnected) {
      await writeCells([
        [1, 0, 0, 0, 0, 0], // 'ㄱ'
        [1, 0, 1, 0, 0, 0]  // 'ㄴ'
      ]);
    }
  };

  return (
    <div>
      {error && <p>오류: {error}</p>}
      {deviceName && <p>연결된 디바이스: {deviceName}</p>}
      <button onClick={handleConnect} disabled={isConnected}>
        {isConnected ? '연결됨' : '연결'}
      </button>
      <button onClick={handleSendText} disabled={!isConnected}>
        텍스트 전송
      </button>
      <button onClick={handleSendCells} disabled={!isConnected}>
        셀 전송
      </button>
      {isConnected && (
        <button onClick={disconnect}>연결 해제</button>
      )}
    </div>
  );
}
```

## 데이터 형식

### 점자 셀 형식

프론트엔드에서 전송하는 데이터:

```typescript
// 각 셀: [dot1, dot2, dot3, dot4, dot5, dot6]
// 1 = 점 있음, 0 = 점 없음
const cells: number[][] = [
  [1, 0, 0, 0, 0, 0], // 'ㄱ' → 0x01
  [1, 0, 1, 0, 0, 0], // 'ㄴ' → 0x05
  // ...
];
```

### 바이트 변환

각 셀의 6개 점을 하나의 바이트로 변환:

```
비트 순서: [0, 1, 2, 3, 4, 5] = [dot1, dot2, dot3, dot4, dot5, dot6]
예: [1, 0, 0, 0, 0, 0] → 0x01
예: [1, 0, 1, 0, 0, 0] → 0x05
```

### 전송 형식

BLE로 전송되는 데이터:

```
[0x01, 0x05, 0x03, ...]  // 각 바이트 = 1개 셀
```

## 테스트 방법

### 1. 펌웨어 업로드

1. Arduino IDE에서 코드 열기
2. 보드 선택: ESP32 Dev Module
3. 포트 선택: COM 포트
4. 업로드 버튼 클릭
5. 업로드 완료 대기

### 2. 시리얼 모니터 확인

1. 도구 → 시리얼 모니터
2. 보드레이트: 115200
3. 다음 메시지 확인:
   ```
   점자 디스플레이 BLE 펌웨어 시작
   핀 초기화 중...
   핀 초기화 완료
   BLE 광고 시작. 연결 대기 중...
   디바이스 이름: 점자디스플레이
   Service UUID: 0000180a-0000-1000-8000-00805f9b34fb
   Characteristic UUID: 00002a29-0000-1000-8000-00805f9b34fb
   ```

### 3. 프론트엔드에서 연결 테스트

1. 개발 서버 실행:
   ```bash
   cd frontend
   npm run dev
   ```

2. 브라우저에서 접속 (HTTPS 필요, localhost 제외)

3. BLE 연결 버튼 클릭

4. 디바이스 선택: "점자디스플레이"

5. 연결 확인:
   - 프론트엔드: "연결됨" 표시
   - 시리얼 모니터: "클라이언트 연결됨" 메시지

### 4. 데이터 전송 테스트

```typescript
// 브라우저 콘솔에서
const { connect, writeCells } = useBrailleBLE({ hardwareType: 'arduino' });

await connect();
await writeCells([
  [1, 0, 0, 0, 0, 0], // 첫 번째 셀
  [1, 0, 1, 0, 0, 0]  // 두 번째 셀
]);
```

시리얼 모니터에서 확인:
```
수신된 데이터 길이: 2
셀 0: 패턴 0x1 (100000)
셀 1: 패턴 0x5 (101000)
점자 업데이트 완료
```

## 문제 해결

### 디바이스가 보이지 않음

1. **ESP32 재부팅 확인**
   - 시리얼 모니터에서 "BLE 광고 시작" 메시지 확인
   - 재부팅 후 다시 시도

2. **디바이스 이름 확인**
   - 시리얼 모니터에서 "디바이스 이름: 점자디스플레이" 확인
   - 프론트엔드 `namePrefix`와 일치하는지 확인

3. **BLE 광고 확인**
   - 시리얼 모니터에서 "BLE 광고 시작" 메시지 확인
   - 다른 BLE 스캔 앱으로 디바이스 확인

### 연결 실패

1. **UUID 확인**
   - 펌웨어와 프론트엔드 UUID가 정확히 일치하는지 확인
   - 대소문자 구분 없음 (모두 소문자)

2. **브라우저 권한 확인**
   - Chrome/Edge에서 Bluetooth 권한 허용
   - HTTPS 사용 (localhost 제외)

3. **디바이스 이름 확인**
   - 펌웨어 `DEVICE_NAME`과 프론트엔드 `namePrefix` 일치 확인

### 데이터가 전송되지 않음

1. **시리얼 모니터 확인**
   - `onWrite` 콜백이 호출되는지 확인
   - "수신된 데이터 길이" 메시지 확인

2. **데이터 길이 확인**
   - 전송하는 셀 개수가 `CELL_COUNT`를 초과하지 않는지 확인
   - 펌웨어에서 `min((int)value.length(), CELL_COUNT)` 사용

3. **연결 상태 확인**
   - 시리얼 모니터에서 "클라이언트 연결됨" 확인
   - LED가 켜져 있는지 확인 (연결 시)

### 점자가 표시되지 않음

1. **핀 설정 확인**
   - `cellPins` 배열이 실제 하드웨어와 일치하는지 확인
   - `initializePins()` 함수에서 핀 초기화 확인

2. **하드웨어 연결 확인**
   - 솔레노이드/서보 모터 연결 확인
   - 전원 공급 확인

3. **디버그 출력 확인**
   - 시리얼 모니터에서 점자 패턴 출력 확인
   - 예: "셀 0: 패턴 0x1 (100000)"

## 추가 개선 사항

### 배터리 레벨 모니터링

```cpp
#define BATTERY_SERVICE_UUID "0000180f-0000-1000-8000-00805f9b34fb"
#define BATTERY_CHAR_UUID "00002a19-0000-1000-8000-00805f9b34fb"

BLEService* pBatteryService = pServer->createService(BATTERY_SERVICE_UUID);
BLECharacteristic* pBatteryChar = pBatteryService->createCharacteristic(
  BATTERY_CHAR_UUID,
  BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
);

// 배터리 레벨 읽기 및 전송
uint8_t batteryLevel = readBatteryLevel();
pBatteryChar->setValue(&batteryLevel, 1);
pBatteryChar->notify();
```

### 연결 상태 LED

```cpp
#define LED_PIN 2  // ESP32 내장 LED

void updateConnectionLED() {
  digitalWrite(LED_PIN, deviceConnected ? HIGH : LOW);
}

// onConnect/onDisconnect에서 호출
```

### 전원 관리 (저전력 모드)

```cpp
#include "esp_sleep.h"

void loop() {
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    
    // 저전력 모드 진입 (연결 없을 때)
    esp_sleep_enable_timer_wakeup(1000000); // 1초
    esp_light_sleep_start();
    
    oldDeviceConnected = deviceConnected;
  }
  // ...
}
```

### 다중 셀 제어 최적화

```cpp
// 여러 셀을 한 번에 업데이트
void updateMultipleCells(int startCell, uint8_t* data, int count) {
  for (int i = 0; i < count && (startCell + i) < CELL_COUNT; i++) {
    updateBrailleCell(startCell + i, data[i]);
  }
}
```

## 참고 자료

- [ESP32 BLE Arduino 라이브러리](https://github.com/espressif/arduino-esp32)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [BLE 점자 디스플레이 표준](https://www.bluetooth.com/specifications/specs/)
- [Arduino 공식 문서](https://www.arduino.cc/reference/en/)

## 요약

1. **이 프로젝트**: 웹 애플리케이션 소프트웨어만 제공
2. **Arduino 펌웨어**: 별도 개발 필요 (이 가이드 참고)
3. **하드웨어**: 별도 제작/구입 필요
4. **통합**: UUID와 디바이스 이름 일치 필요

이 가이드를 따라 Arduino 펌웨어를 개발하고 점글이 프로젝트와 통합할 수 있습니다.

