# 점글이 하드웨어 표준 스펙

## 개요

이 문서는 점글이(Jeomgeuli) 프로젝트의 표준 하드웨어 아키텍처 및 스펙을 정의합니다. 이 스펙은 프로젝트의 표준 구조이며, AI나 개발자가 하드웨어 통합 코드를 생성할 때 반드시 따라야 하는 불변 규칙입니다.

---

## 1. 전체 아키텍처

점글이 하드웨어는 아래와 같은 3-계층 구조를 반드시 따라야 합니다:

```
[1] React PWA (스마트폰 또는 PC)
       ↕ Web Bluetooth (BLE)

[2] Raspberry Pi 4 (BLE → Serial Bridge)
       ↕ USB Serial

[3] Arduino UNO (Braille Cell Controller)
       ↕ GPIO (D2, D3, D4)

[4] 스마트 점자 모듈 × 3 (JY-SOFT 6-dot solenoid module, 총 18-dot)
```

### 아키텍처 다이어그램

```
┌─────────────────────────────────────┐
│   React PWA                         │
│   - Web Bluetooth API               │
│   - 점자 데이터 생성 및 전송         │
└──────────────┬──────────────────────┘
               │ BLE (Bluetooth Low Energy)
               │ Service: 12345678-1234-5678-1234-56789abcdef0
               │ Characteristic: abcdabcd-1234-5678-1111-abcdefabcdef
               ▼
┌─────────────────────────────────────┐
│   Raspberry Pi 4                    │
│   - BLE 서버 (bluezero)              │
│   - Serial Bridge                    │
│   - USB Serial → Arduino             │
└──────────────┬──────────────────────┘
               │ USB Serial (115200 baud)
               ▼
┌─────────────────────────────────────┐
│   Arduino UNO                        │
│   - Serial 수신                      │
│   - 점자 패턴 변환                    │
│   - Shift Register 제어              │
│   - GPIO: D2(DATA), D3(LATCH), D4(CLOCK) │
└──────────────┬──────────────────────┘
               │ GPIO (5핀 케이블)
               │ VCC, GND, DATA, LATCH, CLOCK
               ▼
┌─────────────────────────────────────┐
│   JY-SOFT 스마트 점자 모듈 × 3       │
│   - 74HC595 Shift Register × 1 per cell │
│   - L293D Motor Driver × 2 per cell     │
│   - 5V 솔레노이드 × 6 per cell          │
│   - 6-dot 점자 출력 × 3셀 (총 18-dot)   │
└─────────────────────────────────────┘
```

**중요**: 위 구조는 점글이 시스템의 표준 구조이며, 이 아키텍처를 기반으로만 하드웨어 코드를 생성해야 합니다.

---

## 2. 점자 모듈 상세 스펙 (JY-SOFT)

### 제품 정보

- **제조사**: 주영SOFT (JY-SOFT)
- **제품명**: 스마트 점자 모듈 (아두이노 제어용)
- **출력 방식**: 6-dot 솔레노이드
- **모듈 수**: 3셀 (연결 시 18-dot / 3-byte 출력)
- **참고 블로그**: [주영 소프트 - 아두이노 제어 점자 표시기 사용기](https://m.blog.naver.com/mapes_khkim/222152736576)

### 물리적 사양

- **크기**: 36mm × 57mm × 98mm
- **무게**: 제품 사양 참조
- **케이스**: 3D 출력물 (플라스틱)

### 내부 구성

| 부품 | 수량 (per cell) | 총 수량 (3셀) | 역할 |
|------|----------------|-------------|------|
| 74HC595 Shift Register | 1개 | 3개 | 시리얼 데이터를 병렬로 변환 |
| L293D Motor Driver | 2개 | 6개 | 솔레노이드 구동 전류 증폭 |
| DS-0420S 솔레노이드 (5V) | 6개 | 18개 | 점자 핀 제어 (DOT 1~6) |

### 전기적 사양

- **구동 전압**: 5V DC
- **소비 전류**: 
  - 최소: 1.0A (6개 솔레노이드 모두 작동 시)
  - 권장: 1.5A 이상
  - 안전 여유: 2.0A 이상의 전원 공급 권장
- **전원 공급**: 배럴잭 (2핀) 또는 5핀 케이블의 VCC/GND

### 연결 단자

점자 모듈은 5핀 케이블과 2핀 전원 단자로 구성됩니다:

| 핀 번호 | 신호명 | 설명 | Arduino 연결 |
|---------|--------|------|--------------|
| 1 | VCC | 전원 (5V) | 5V (빨간색 표기) |
| 2 | GND | 그라운드 | GND |
| 3 | DATA | 시리얼 데이터 입력 | D2 |
| 4 | LATCH | 래치 신호 | D3 |
| 5 | CLOCK | 클럭 신호 | D4 |

**주의**: VCC 핀에는 빨간색 표기가 되어 있습니다.

### 점 번호 비트 구성

점자 패턴은 6-bit 정수(0~63)로 표현됩니다:

| 점 번호 | 비트 위치 | 비트 마스크 | 설명 |
|---------|-----------|-------------|------|
| DOT 1 | bit 0 | 0x01 (1) | 좌측 상단 |
| DOT 2 | bit 1 | 0x02 (2) | 중앙 상단 |
| DOT 3 | bit 2 | 0x04 (4) | 우측 상단 |
| DOT 4 | bit 3 | 0x08 (8) | 좌측 하단 |
| DOT 5 | bit 4 | 0x10 (16) | 중앙 하단 |
| DOT 6 | bit 5 | 0x20 (32) | 우측 하단 |

**점자 패턴 예시**:
- `0x00` (0): 모든 점 없음 (공백)
- `0x01` (1): DOT 1만 있음
- `0x3F` (63): 모든 점 있음 (6개 점 모두)

### 점자 레이아웃

```
DOT 1  DOT 2  DOT 3
  ●      ○      ○

DOT 4  DOT 5  DOT 6
  ○      ○      ○
```

---

## 3. Arduino UNO 핀맵 (불변 규칙)

Arduino UNO는 다음 핀맵을 반드시 따라야 합니다:

| 기능 | 핀 번호 | 설명 |
|------|---------|------|
| DATA | D2 | Shift Register 데이터 입력 |
| LATCH | D3 | Shift Register 래치 신호 |
| CLOCK | D4 | Shift Register 클럭 신호 |
| VCC | 5V | 전원 공급 (점자 모듈) |
| GND | GND | 그라운드 (라즈베리파이와 공통) |

**중요**: 이 핀맵은 변경할 수 없습니다. 다른 핀을 사용하면 안 됩니다.

---

## 4. Arduino 펌웨어 규격 (3셀 버전)

### 기본 구조

Arduino는 다음을 수행해야 합니다:

1. **입력**: USB Serial로 단일 문자 또는 점자 패턴 바이트를 수신
2. **처리**: 
   - 문자를 점자 패턴(6-bit integer)으로 변환
   - 3셀 버퍼에 저장 (새 문자는 셀1, 기존은 오른쪽으로 이동)
   - `shiftOut(DATA, CLOCK, MSBFIRST)`로 3셀을 순차 전송 (셀3→셀2→셀1)
   - LATCH HIGH → LOW로 상태 적용
3. **출력**: 점자 모듈 × 3에 패턴 전송 (총 18-dot)

### 3셀 버퍼 구조

- **셀1**: 가장 최근 문자 (새로 입력된 문자)
- **셀2**: 이전 문자
- **셀3**: 그 이전 문자

**버퍼 이동 규칙**:
- 새 문자 입력 시: 셀3 ← 셀2 ← 셀1 ← 새 패턴
- 예: 입력 "ㄱ" → "ㄴ" → "ㄷ"
  - 첫 번째: [셀1=ㄱ, 셀2=0, 셀3=0]
  - 두 번째: [셀1=ㄴ, 셀2=ㄱ, 셀3=0]
  - 세 번째: [셀1=ㄷ, 셀2=ㄴ, 셀3=ㄱ]

### Serial 통신 설정

- **보드레이트**: 115200 bps
- **데이터 비트**: 8
- **패리티**: 없음
- **정지 비트**: 1

### 코드 구조 예시 (3셀 버전)

```cpp
// 핀 정의 (불변)
const int DATA_PIN = 2;   // DATA 핀
const int LATCH_PIN = 3;  // LATCH 핀
const int CLOCK_PIN = 4;  // CLOCK 핀

// 3셀 버퍼 (셀1, 셀2, 셀3)
byte cellBuf[3] = {0, 0, 0};

void setup() {
  Serial.begin(115200);
  pinMode(DATA_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  Serial.println("[Arduino] 점글이 3셀 펌웨어 시작");
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    uint8_t pattern = brailleCharToPattern(c);
    
    // 버퍼 이동: 새 문자는 셀1에, 기존 내용은 오른쪽으로 이동
    cellBuf[2] = cellBuf[1];  // 셀2 → 셀3
    cellBuf[1] = cellBuf[0];  // 셀1 → 셀2
    cellBuf[0] = pattern;     // 새 패턴 → 셀1
    
    // 3셀 출력 (셀3 → 셀2 → 셀1 순서)
    setBraille3Cells(cellBuf);
  }
}

/**
 * 3셀 점자 패턴을 Shift Register로 전송
 * 전송 순서: 셀3 → 셀2 → 셀1 (마지막 셀부터 먼저 밀어넣음)
 * shiftOut 방향: MSBFIRST (최상위 비트부터)
 */
void setBraille3Cells(byte cells[3]) {
  digitalWrite(LATCH_PIN, LOW);
  // 셀3 → 셀2 → 셀1 순서로 전송
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, cells[2]);  // 셀3 먼저
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, cells[1]);  // 셀2
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, cells[0]);   // 셀1 마지막
  digitalWrite(LATCH_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(LATCH_PIN, LOW);
}

/**
 * 문자를 점자 패턴으로 변환
 * @param c 문자 (한글, 영문, 숫자 등)
 * @return 점자 패턴 (0~63, 6-bit)
 */
uint8_t brailleCharToPattern(char c) {
  // 실제 구현은 ko_braille.json 매핑 테이블 사용
  // 여기서는 예시만 제공
  
  // 한글 처리 (실제로는 자음/모음 분해 필요)
  if (c >= '가' && c <= '힣') {
    // 한글 → 점자 변환 로직
    // backend/data/ko_braille.json 참조
    return 0x01; // 임시
  }
  
  // 영문 처리
  if (c >= 'A' && c <= 'Z') {
    return (c - 'A') + 1; // 간단한 매핑
  }
  
  // 숫자 처리
  if (c >= '0' && c <= '9') {
    return (c - '0') + 0x20; // 간단한 매핑
  }
  
  return 0; // 공백 또는 미지원 문자
}
```

### 전송 순서 규칙 (불변)

**중요**: Shift Register가 직렬 연결되어 있으므로, 반드시 다음 순서를 따라야 합니다:

1. **셀3 → 셀2 → 셀1** 순서로 `shiftOut()` 호출
2. **MSBFIRST** 방향 사용 (최상위 비트부터 전송)
3. 마지막 셀(셀3)부터 먼저 밀어넣어야 올바른 위치에 배치됨

**이유**: Shift Register는 데이터를 시프트하면서 전달하므로, 마지막 셀부터 먼저 보내야 첫 번째 셀에 올바르게 배치됩니다.

---

## 5. Raspberry Pi BLE 브릿지 스펙

### 역할

라즈베리파이는 스마트폰/PWA와 아두이노 사이에서 **BLE ↔ USB Serial bridge** 역할을 수행합니다.

### BLE 정보 (불변)

| 항목 | 값 |
|------|-----|
| BLE Local Name | `"Jeomgeuli"` |
| Service UUID | `12345678-1234-5678-1234-56789abcdef0` |
| Characteristic UUID | `abcdabcd-1234-5678-1111-abcdefabcdef` |
| Write 속성 | Write Without Response 지원 |

### Serial 통신 설정

- **포트**: `/dev/ttyACM0` (Arduino가 연결된 포트, 확인 필요)
- **보드레이트**: 115200 bps
- **타임아웃**: 1초

### Python BLE 서버 기본 구조

```python
#!/usr/bin/env python3
"""
점글이 BLE → Serial Bridge 서버
Raspberry Pi 4에서 실행
"""

from bluezero import peripheral
from serial import Serial
import sys
import time

# BLE 설정 (불변)
DEVICE_NAME = "Jeomgeuli"
SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0"
CHAR_UUID = "abcdabcd-1234-5678-1111-abcdefabcdef"

# Serial 설정
SERIAL_PORT = "/dev/ttyACM0"  # Arduino 포트 (확인 필요)
BAUD_RATE = 115200

# Serial 연결
try:
    ser = Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"[Serial] {SERIAL_PORT} 연결됨 ({BAUD_RATE} baud)")
except Exception as e:
    print(f"[Serial] 연결 실패: {e}")
    print(f"[Serial] 사용 가능한 포트 확인: ls /dev/ttyACM* /dev/ttyUSB*")
    sys.exit(1)

def write_handler(value):
    """BLE Write → Serial 전송"""
    try:
        # BLE로 받은 데이터를 그대로 Serial로 전송
        ser.write(value)
        ser.flush()
        print(f"[BLE→Serial] {len(value)} 바이트 전송: {value.hex()}")
    except Exception as e:
        print(f"[BLE→Serial] 전송 실패: {e}")

# BLE 서버 생성
print(f"[BLE] 서버 초기화 중...")
print(f"[BLE] 디바이스 이름: {DEVICE_NAME}")
print(f"[BLE] Service UUID: {SERVICE_UUID}")
print(f"[BLE] Characteristic UUID: {CHAR_UUID}")

ble = peripheral.Peripheral(
    device_name=DEVICE_NAME,
    services=[{
        'uuid': SERVICE_UUID,
        'characteristics': [{
            'uuid': CHAR_UUID,
            'properties': ['write', 'write-without-response'],
            'write': write_handler
        }]
    }]
)

print(f"[BLE] 서버 시작. 연결 대기 중...")
try:
    ble.run()
except KeyboardInterrupt:
    print("\n[BLE] 서버 종료")
    ser.close()
    sys.exit(0)
```

### 설치 및 실행

```bash
# Raspberry Pi에서 의존성 설치
sudo apt-get update
sudo apt-get install python3-pip python3-serial
pip3 install bluezero

# 실행 (BLE 권한을 위해 sudo 필요할 수 있음)
sudo python3 raspberrypi/ble_server.py
```

---

## 6. React PWA Web Bluetooth 스펙

### Web Bluetooth API

PWA는 Web Bluetooth를 통해 라즈베리파이 BLE 서버에 연결합니다.

### BLE 설정 (불변)

```typescript
const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHARACTERISTIC_UUID = "abcdabcd-1234-5678-1111-abcdefabcdef";
const DEVICE_NAME = "Jeomgeuli";
```

### 장치 검색 코드

```typescript
const device = await navigator.bluetooth.requestDevice({
  filters: [{ name: "Jeomgeuli" }],
  optionalServices: [SERVICE_UUID]
});

const server = await device.gatt?.connect();
const service = await server.getPrimaryService(SERVICE_UUID);
const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
```

### 문자 전송 코드

```typescript
// 텍스트를 UTF-8 바이트로 변환하여 전송
const text = "가";
const encoder = new TextEncoder();
const data = encoder.encode(text);
await characteristic.writeValue(data);
```

### 점자 패턴 직접 전송

```typescript
// 점자 패턴(0~63)을 바이트 배열로 전송
const patterns = [0x01, 0x05, 0x03]; // 예: 3개 셀
const buffer = new Uint8Array(patterns);
await characteristic.writeValue(buffer);
```

### 브라우저 지원

- ✅ **Android Chrome**: 완전 지원
- ✅ **Desktop Chrome/Edge**: 완전 지원
- ⚠️ **iOS Safari**: 제한적 지원 (Web Bluetooth API 제한)
- ❌ **Firefox**: 미지원

**주의**: Web Bluetooth API는 HTTPS 환경에서만 동작합니다 (localhost는 예외).

---

## 7. 데이터 형식 및 프로토콜

### 점자 패턴 표현

점자 패턴은 6-bit 정수로 표현됩니다:

- **범위**: 0 ~ 63 (0x00 ~ 0x3F)
- **비트 구성**: [DOT1, DOT2, DOT3, DOT4, DOT5, DOT6] = [bit0, bit1, bit2, bit3, bit4, bit5]

### 비트 순서

```
비트 위치: [0, 1, 2, 3, 4, 5]
점 번호:   [1, 2, 3, 4, 5, 6]

예시:
- [1, 0, 0, 0, 0, 0] → 0x01 (DOT 1만 있음)
- [1, 0, 1, 0, 0, 0] → 0x05 (DOT 1, 3 있음)
- [1, 1, 1, 1, 1, 1] → 0x3F (모든 점 있음)
```

### BLE 전송 형식

BLE로 전송되는 데이터는 바이트 배열입니다:

```typescript
// 방법 1: 텍스트 전송 (문자 단위)
const text = "안녕하세요";
const encoder = new TextEncoder();
const data = encoder.encode(text);
// → [0xEC, 0x95, 0x88, 0xEB, 0x85, 0x95, ...] (UTF-8 바이트)

// 방법 2: 점자 패턴 직접 전송 (패턴 단위)
const patterns = [0x01, 0x05, 0x03]; // 3개 셀
const buffer = new Uint8Array(patterns);
// → [0x01, 0x05, 0x03]
```

### Serial 전송 형식

Raspberry Pi에서 Arduino로 전송되는 데이터:

```python
# BLE로 받은 데이터를 그대로 Serial로 전송
ser.write(value)  # value는 bytes 타입
```

Arduino에서 수신:

```cpp
// Serial로 문자 수신
char c = Serial.read();  // 단일 문자

// 또는 바이트 배열 수신
uint8_t buffer[64];
int len = Serial.readBytes(buffer, 64);
```

### 데이터 흐름 예시

**예시 1: 텍스트 "가" 전송**

```
React PWA:
  "가" → UTF-8: [0xEC, 0x95, 0x88]
  ↓ BLE 전송

Raspberry Pi:
  BLE 수신: [0xEC, 0x95, 0x88]
  ↓ Serial 전송 (그대로)

Arduino:
  Serial 수신: [0xEC, 0x95, 0x88]
  ↓ 문자 변환: "가"
  ↓ 점자 변환: 0x01 (예시)
  ↓ Shift Register 전송

점자 모듈:
  패턴 0x01 출력 (DOT 1만 켜짐)
```

**예시 2: 점자 패턴 직접 전송**

```
React PWA:
  패턴 배열: [0x01, 0x05, 0x03]
  ↓ BLE 전송

Raspberry Pi:
  BLE 수신: [0x01, 0x05, 0x03]
  ↓ Serial 전송 (그대로)

Arduino:
  Serial 수신: [0x01, 0x05, 0x03]
  ↓ Shift Register 전송 (변환 없이)

점자 모듈:
  셀 0: 패턴 0x01
  셀 1: 패턴 0x05
  셀 2: 패턴 0x03
```

---

## 8. 전체 동작 흐름

### 단계별 데이터 흐름

```
1. 사용자 입력 (React PWA)
   └─> "안녕하세요" 입력 또는 점자 패턴 생성

2. Web Bluetooth 연결
   └─> navigator.bluetooth.requestDevice()
   └─> "Jeomgeuli" 디바이스 검색 및 연결

3. BLE 데이터 전송
   └─> characteristic.writeValue(data)
   └─> Service UUID: 12345678-1234-5678-1234-56789abcdef0
   └─> Characteristic UUID: abcdabcd-1234-5678-1111-abcdefabcdef

4. Raspberry Pi BLE 수신
   └─> bluezero peripheral 서버
   └─> write_handler() 콜백 호출

5. Serial 전송
   └─> ser.write(value)
   └─> /dev/ttyACM0, 115200 baud

6. Arduino Serial 수신
   └─> Serial.read() 또는 Serial.readBytes()
   └─> 문자 또는 바이트 배열 수신

7. 점자 패턴 변환
   └─> brailleCharToPattern(c)
   └─> 문자 → 6-bit 패턴 (0~63)

8. Shift Register 제어
   └─> shiftOut(DATA, CLOCK, LSBFIRST, pattern)
   └─> digitalWrite(LATCH, HIGH) → LOW

9. 점자 모듈 출력
   └─> 74HC595 → L293D → 솔레노이드
   └─> 6-dot 점자 출력
```

### 동작 흐름 다이어그램

```
┌─────────────┐
│  React PWA  │
│             │
│  "안녕" 입력 │
└──────┬──────┘
       │
       │ Web Bluetooth
       │ (BLE)
       ▼
┌─────────────────┐
│  Raspberry Pi   │
│                 │
│  BLE 수신       │
│  → Serial 전송  │
└──────┬──────────┘
       │
       │ USB Serial
       │ (115200 baud)
       ▼
┌─────────────┐
│  Arduino    │
│             │
│  Serial 수신│
│  → 패턴 변환│
│  → ShiftOut │
└──────┬──────┘
       │
       │ GPIO
       │ (D2, D3, D4)
       ▼
┌─────────────┐
│ 점자 모듈   │
│             │
│  74HC595    │
│  → L293D    │
│  → 솔레노이드│
│  → 점자 출력│
└─────────────┘
```

---

## 9. 에러 핸들링 규칙

### BLE 연결 실패

- **자동 재시도**: 연결 실패 시 3회까지 자동 재시도
- **에러 메시지**: 사용자에게 친화적인 메시지 표시
- **권한 확인**: Bluetooth 권한이 허용되었는지 확인

### Arduino Serial 타임아웃

- **재연결**: Serial 통신 타임아웃 시 자동 재연결 시도
- **포트 확인**: `/dev/ttyACM0`이 올바른지 확인

### 전류 부족 감지

- **경고 표시**: 전원 공급이 부족할 경우 경고 메시지
- **권장 사항**: 2A 이상의 전원 어댑터 사용 안내

### BLE Characteristic 누락

- **에러 표시**: Characteristic을 찾을 수 없을 경우 명확한 에러 메시지
- **UUID 확인**: Service UUID와 Characteristic UUID가 정확한지 확인

---

## 10. 불변 규칙 (절대 변경 금지)

다음 항목들은 절대 변경할 수 없습니다:

### BLE 설정

- ❌ **BLE Local Name**: `"Jeomgeuli"` (변경 금지)
- ❌ **Service UUID**: `12345678-1234-5678-1234-56789abcdef0` (변경 금지)
- ❌ **Characteristic UUID**: `abcdabcd-1234-5678-1111-abcdefabcdef` (변경 금지)

### Arduino 핀맵

- ❌ **DATA 핀**: D2 (변경 금지)
- ❌ **LATCH 핀**: D3 (변경 금지)
- ❌ **CLOCK 핀**: D4 (변경 금지)

### 점자 모듈 사양

- ❌ **전압**: 5V (변경 금지)
- ❌ **통신 케이블**: 5핀 (VCC, GND, DATA, LATCH, CLOCK) (변경 금지)
- ❌ **점 번호 비트 구성**: DOT 1~6 = bit 0~5 (변경 금지)
- ❌ **모듈 수**: 3셀 (변경 금지)
- ❌ **총 출력**: 18-dot (3셀 × 6-dot) (변경 금지)

### Arduino 펌웨어 규칙

- ❌ **셀 버퍼 크기**: 3셀 (변경 금지)
- ❌ **전송 순서**: 셀3 → 셀2 → 셀1 (변경 금지)
- ❌ **shiftOut 방향**: MSBFIRST (변경 금지)
- ❌ **버퍼 이동**: 새 문자는 셀1, 기존은 오른쪽으로 이동 (변경 금지)

### Serial 통신

- ❌ **보드레이트**: 115200 bps (변경 금지)

---

## 11. 참고 자료

### 제품 정보

- **JY-SOFT 스마트 점자 모듈**: [네이버 스마트스토어](https://smartstore.naver.com/jysoft)
- **블로그 리뷰**: [주영 소프트 - 아두이노 제어 점자 표시기 사용기](https://m.blog.naver.com/mapes_khkim/222152736576)

### 기술 문서

- **Web Bluetooth API**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- **Arduino 공식 문서**: [Arduino Reference](https://www.arduino.cc/reference/en/)
- **74HC595 데이터시트**: Shift Register IC 사양
- **L293D 데이터시트**: Motor Driver IC 사양

### 관련 프로젝트 문서

- [하드웨어 연동 가이드](./HARDWARE_INTEGRATION.md)
- [Arduino 펌웨어 개발 가이드](./ARDUINO_FIRMWARE.md)

---

## 12. 문서 목적

이 문서는:

1. **하드웨어 통신 구조**를 표준화
2. **핀맵**을 명확히 정의
3. **BLE 규격**을 고정
4. **아두이노 제어 방식**을 표준화
5. **PWA Bluetooth 방식**을 정의
6. **전체 아키텍처 흐름**을 문서화

하기 위한 문서이며, 어디에 붙여넣어도 AI나 개발자가 같은 규칙으로 코드를 생성하도록 하는 것이 목적입니다.

---

## 부록: 점자 패턴 예시

### 한글 자음 예시

| 문자 | 점자 패턴 | 비트 표현 | 16진수 |
|------|-----------|-----------|--------|
| ㄱ | DOT 1 | `[1,0,0,0,0,0]` | 0x01 |
| ㄴ | DOT 1,3 | `[1,0,1,0,0,0]` | 0x05 |
| ㄷ | DOT 1,4,5 | `[1,0,0,1,1,0]` | 0x19 |

**참고**: 실제 한글 점자 매핑은 `backend/data/ko_braille.json` 파일을 참조하세요.

### 영문 예시

| 문자 | 점자 패턴 | 비트 표현 | 16진수 |
|------|-----------|-----------|--------|
| A | DOT 1 | `[1,0,0,0,0,0]` | 0x01 |
| B | DOT 1,2 | `[1,1,0,0,0,0]` | 0x03 |
| C | DOT 1,4 | `[1,0,0,1,0,0]` | 0x09 |

---

**문서 버전**: 1.0  
**최종 업데이트**: 2024년  
**작성자**: 점글이 프로젝트 팀

