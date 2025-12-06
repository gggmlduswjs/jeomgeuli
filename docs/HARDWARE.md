# 하드웨어 명세서

**버전**: 1.0.0  
**작성일**: 2024년  
**프로젝트**: 점글이 (Jeomgeuli)

---

## 목차

1. [개요](#1-개요)
2. [하드웨어 아키텍처](#2-하드웨어-아키텍처)
3. [하드웨어 구성요소](#3-하드웨어-구성요소)
4. [연결 방법](#4-연결-방법)
5. [Arduino 펌웨어](#5-arduino-펌웨어)
6. [BLE 프로토콜](#6-ble-프로토콜)
7. [Serial 통신 프로토콜](#7-serial-통신-프로토콜)
8. [프론트엔드 연동](#8-프론트엔드-연동)
9. [문제 해결](#9-문제-해결)

---

## 1. 개요

점글이 프로젝트는 3셀 점자 디스플레이 하드웨어를 지원합니다. Web Serial API 또는 Web Bluetooth API를 통해 하드웨어와 통신합니다.

### 지원 방식

1. **Web Serial API** (권장)
   - Arduino UNO와 직접 연결
   - Raspberry Pi 불필요
   - Chrome/Edge 브라우저 지원

2. **Web Bluetooth API** (BLE)
   - Raspberry Pi 4를 BLE 서버로 사용
   - Arduino UNO와 USB Serial 연결
   - 모바일 및 데스크톱 지원

---

## 2. 하드웨어 아키텍처

### 전체 구조

```
┌─────────────────────────────────────┐
│   React PWA (스마트폰/PC)            │
│   - Web Serial API 또는              │
│   - Web Bluetooth API                │
└──────────────┬──────────────────────┘
               │
               │ (방법 A: Web Serial)
               │
┌──────────────▼──────────────────────┐
│   Arduino UNO                        │
│   - Serial 통신 (115200 bps)         │
│   - Shift Register 제어              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   JY-SOFT 점자 모듈 × 3              │
│   - 3셀 구성 (총 18-dot)              │
└─────────────────────────────────────┘

또는

┌─────────────────────────────────────┐
│   React PWA (스마트폰/PC)            │
│   - Web Bluetooth API                │
└──────────────┬──────────────────────┘
               │ BLE
               │
┌──────────────▼──────────────────────┐
│   Raspberry Pi 4                    │
│   - BLE 서버                         │
│   - BLE → Serial 변환                │
└──────────────┬──────────────────────┘
               │ Serial (115200 bps)
               │
┌──────────────▼──────────────────────┐
│   Arduino UNO                        │
│   - Shift Register 제어              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   JY-SOFT 점자 모듈 × 3              │
│   - 3셀 구성 (총 18-dot)              │
└─────────────────────────────────────┘
```

---

## 3. 하드웨어 구성요소

### 3.1 Arduino UNO

**사양**
- 마이크로컨트롤러: ATmega328P
- 전원: 5V
- 디지털 핀: 14개
- 아날로그 핀: 6개

**핀맵 (불변 규칙)**

| 기능 | 핀 번호 | 설명 |
|------|---------|------|
| DATA | D2 | Shift Register 데이터 입력 |
| LATCH | D3 | Shift Register 래치 신호 |
| CLOCK | D4 | Shift Register 클럭 신호 |
| Serial RX | D0 | Serial 통신 수신 |
| Serial TX | D1 | Serial 통신 송신 |

**⚠️ 주의**: 핀맵은 절대 변경할 수 없습니다.

### 3.2 JY-SOFT 스마트 점자 모듈

**제품 정보**
- 제조사: JY-SOFT
- 모델: 스마트 점자 모듈
- 구매처: 네이버 스마트스토어

**물리적 사양**
- 점자 셀: 1개 (6-dot)
- 점 번호: 1-6 (표준 점자 레이아웃)
- 크기: 약 20mm × 30mm

**전기적 사양**
- 전압: 5V
- 전류: 약 200mA/셀
- 총 전류 (3셀): 약 600mA

**연결 단자**
- 5핀 커넥터
- VCC (5V)
- GND
- DATA (Shift Register 출력)
- LATCH (Shift Register 래치)
- CLOCK (Shift Register 클럭)

**점 번호 비트 구성**

```
[1] [4]
[2] [5]
[3] [6]
```

비트 매핑:
- bit 0 → dot 1
- bit 1 → dot 2
- bit 2 → dot 3
- bit 3 → dot 4
- bit 4 → dot 5
- bit 5 → dot 6

### 3.3 Raspberry Pi 4 (방법 B만)

**역할**: BLE → Serial 브릿지

**사양**
- 모델: Raspberry Pi 4 Model B
- BLE: 내장 (Bluetooth 5.0)
- USB: USB-A 포트 (Arduino 연결)

**필요한 라이브러리**
- `bluezero` (Python BLE 라이브러리)
- `pyserial` (Serial 통신)

---

## 4. 연결 방법

### 방법 A: Web Serial API (권장)

#### 필요한 하드웨어

- Arduino UNO
- JY-SOFT 스마트 점자 모듈 × 3
- 5핀 케이블 (점자 모듈 연결용)
- 5V, 2A 이상 전원 어댑터 (3셀 구동용)

#### 실행 순서

1. **Arduino 펌웨어 업로드**

   ```bash
   # Arduino IDE에서
   # File → Open → arduino/braille_3cell/braille_3cell.ino
   # Tools → Board → Arduino UNO
   # Tools → Port → COM3 (Windows) 또는 /dev/ttyACM0 (Linux)
   # Upload 버튼 클릭
   ```

2. **하드웨어 연결**

   ```
   Arduino UNO          JY-SOFT 점자 모듈
   ───────────          ─────────────────
   D2 (DATA)    ────→   DATA
   D3 (LATCH)   ────→   LATCH
   D4 (CLOCK)   ────→   CLOCK
   5V           ────→   VCC
   GND          ────→   GND
   ```

   **3셀 연결**: 각 모듈을 병렬로 연결 (DATA, LATCH, CLOCK 공유)

3. **프론트엔드 실행**

   ```bash
   cd frontend
   npm run dev
   ```

4. **브라우저에서 연결**

   - http://localhost:5173 접속
   - 정보탐색 또는 홈 화면에서 "Arduino 연결" 버튼 클릭
   - Serial 포트 선택 (COM3 등)
   - 연결 완료

**주의사항**
- Chrome 또는 Edge 브라우저 사용 (Web Serial API 지원)
- HTTPS 환경에서만 동작 (localhost는 예외)
- Serial 포트는 한 번에 하나의 애플리케이션만 사용 가능

### 방법 B: BLE 서버 (Raspberry Pi)

#### 필요한 하드웨어

- Raspberry Pi 4
- Arduino UNO
- JY-SOFT 스마트 점자 모듈 × 3
- 5핀 케이블
- 5V, 2A 이상 전원 어댑터

#### 실행 순서

1. **Arduino 펌웨어 업로드** (방법 A와 동일)

2. **Raspberry Pi BLE 서버 실행**

   ```bash
   # Raspberry Pi에서
   cd raspberrypi
   
   # 의존성 설치
   sudo apt-get update
   sudo apt-get install python3-pip python3-bluez
   pip3 install bluezero pyserial
   
   # BLE 권한 설정
   sudo setcap 'cap_net_raw,cap_net_admin+eip' /usr/bin/python3
   
   # 서버 실행
   sudo python3 ble_server.py
   ```

3. **프론트엔드 실행** (방법 A와 동일)

4. **브라우저에서 BLE 연결**

   - http://localhost:5173 접속
   - 정보탐색 또는 홈 화면에서 "Jeomgeuli" 디바이스 연결
   - 연결 완료

---

## 5. Arduino 펌웨어

### 5.1 펌웨어 구조

**파일 위치**
- `arduino/braille_3cell/braille_3cell.ino` - 메인 스케치
- `arduino/braille_3cell/braille.h` - 클래스 헤더
- `arduino/braille_3cell/braille.cpp` - 클래스 구현

**클래스 구조**

```cpp
class braille {
private:
  int dataPin;      // D2
  int latchPin;     // D3
  int clockPin;     // D4
  int no_module;    // 3
  byte* cellBuffer; // 3셀 버퍼

public:
  braille(int dataPin, int latchPin, int clockPin, int no_module);
  ~braille();
  void begin();
  void all_off();
  void refresh();
  void on(int module, int dot);
  void off(int module, int dot);
};
```

### 5.2 주요 기능

#### 3셀 버퍼 관리

```cpp
byte cellBuffer[3];  // 셀1, 셀2, 셀3

// 새 문자는 셀1에, 기존은 오른쪽으로 이동
// 셀1 ← 셀2 ← 셀3
```

#### 점자 패턴 변환

**한글 처리**
- UTF-8 → UTF-16 변환
- 초성/중성/종성 분해
- 각각을 점자 패턴으로 변환

**ASCII 처리**
- ASCII 코드를 점자 패턴으로 직접 매핑

#### Shift Register 제어

```cpp
void braille::refresh() {
  digitalWrite(latchPin, LOW);
  
  // 셀3 → 셀2 → 셀1 순서로 전송 (LSBFIRST)
  for (int i = no_module - 1; i >= 0; i--) {
    shiftOut(dataPin, clockPin, LSBFIRST, cellBuffer[i]);
  }
  
  digitalWrite(latchPin, HIGH);
}
```

### 5.3 Serial 통신 설정

**보드레이트**: 115200 bps

**초기화**
```cpp
void setup() {
  Serial.begin(115200);
  bra.begin();
  delay(1000);
  bra.all_off();
  bra.refresh();
}
```

### 5.4 테스트 명령

**Serial Monitor에서 테스트**

| 명령 | 설명 |
|------|------|
| `test` | 모든 점 순차 테스트 (각 셀의 각 점을 순차적으로 켜기) |
| `all` | 모든 셀의 모든 점 켜기 |
| `cell1` | 셀1의 모든 점 켜기 |
| `cell2` | 셀2의 모든 점 켜기 |
| `cell3` | 셀3의 모든 점 켜기 |

**사용 예시**
```
Serial Monitor 입력: test
→ 셀1 점1 켜기 → 셀1 점2 켜기 → ... → 셀3 점6 켜기

Serial Monitor 입력: all
→ 모든 셀의 모든 점 켜기 (2초 후 자동 꺼짐)
```

---

## 6. BLE 프로토콜

### 6.1 BLE 설정 (불변)

**Service UUID**
```
12345678-1234-5678-1234-56789abcdef0
```

**Characteristic UUID**
```
abcdabcd-1234-5678-1111-abcdefabcdef
```

**디바이스 이름**
```
Jeomgeuli
```

**⚠️ 주의**: BLE 설정은 절대 변경할 수 없습니다.

### 6.2 데이터 형식

**BLE Write → Serial 전송**

BLE로 받은 데이터를 그대로 Serial로 전송합니다.

```python
def write_handler(value):
    """BLE Write → Serial 전송"""
    ser.write(value)
    ser.flush()
```

### 6.3 Raspberry Pi BLE 서버

**파일 위치**: `raspberrypi/ble_server.py`

**주요 설정**
```python
DEVICE_NAME = "Jeomgeuli"
SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0"
CHAR_UUID = "abcdabcd-1234-5678-1111-abcdefabcdef"

SERIAL_PORT = "/dev/ttyACM0"  # Arduino 포트
BAUD_RATE = 115200
```

**실행**
```bash
sudo python3 ble_server.py
```

---

## 7. Serial 통신 프로토콜

### 7.1 패킷 형식

**기본 형식**
```
[CMD, PATTERN]
```

**CMD 정의**
- `0x80` (128): CMD_SINGLE - 단일 자모
- `0x81` (129): CMD_MULTI - 완성형 한글 (3셀)
- `0x00` (0): CMD_CLEAR - 모든 셀 클리어

**PATTERN 형식**
- 6-bit 점자 패턴 (0-63)
- bit 0 → dot 1
- bit 1 → dot 2
- bit 2 → dot 3
- bit 3 → dot 4
- bit 4 → dot 5
- bit 5 → dot 6

### 7.2 CMD 정의

| CMD | 값 | 설명 |
|-----|-----|------|
| CMD_SINGLE | 0x80 | 단일 자모 (1셀) |
| CMD_MULTI | 0x81 | 완성형 한글 (3셀: 초성+중성+종성) |
| CMD_CLEAR | 0x00 | 모든 셀 클리어 |

### 7.3 PATTERN 형식

**점자 패턴 예시**

| 문자 | 점 번호 | 패턴 (hex) | 패턴 (binary) |
|------|---------|------------|---------------|
| ㄱ | [4] | 0x08 | 0b00001000 |
| ㄴ | [1,4] | 0x09 | 0b00001001 |
| ㅏ | [1,2,4,6] | 0x23 | 0b00100011 |

### 7.4 전송 예시

**예시 1: 단일 자모 "ㄱ"**
```
[0x80, 0x08]  // CMD_SINGLE + pattern for "ㄱ"
```

**예시 2: 완성형 한글 "가"**
```
[0x81, 0x08]  // CMD_MULTI + pattern for "ㄱ" (초성)
[0x81, 0x23]  // CMD_MULTI + pattern for "ㅏ" (중성)
[0x81, 0x00]  // CMD_MULTI + pattern for "" (종성 없음)
```

**예시 3: 클리어**
```
[0x00, 0x00]  // CMD_CLEAR
```

---

## 8. 프론트엔드 연동

### 8.1 Web Serial API 사용

**구현 파일**: `frontend/src/hooks/useBrailleSerial.ts`

**사용 예시**
```typescript
import { useBraillePlayback } from '@/hooks/useBraillePlayback';

const braille = useBraillePlayback({
  serial: {
    baudRate: 115200,
  },
});

// 연결
await braille.connect();

// 점자 출력
braille.enqueueKeywords(['키워드1', '키워드2']);

// 연결 해제
await braille.disconnect();
```

**주요 함수**
- `connect()`: Serial 포트 연결
- `disconnect()`: 연결 해제
- `enqueueKeywords(keywords: string[])`: 키워드 큐에 추가
- `next()`: 다음 키워드 출력
- `repeat()`: 현재 키워드 반복
- `pause()`: 일시정지

### 8.2 Web Bluetooth API 사용

**구현 파일**: `frontend/src/hooks/useBrailleBLE.ts`

**사용 예시**
```typescript
import { useBrailleBLE } from '@/hooks/useBrailleBLE';

const braille = useBrailleBLE({
  serviceUUID: '12345678-1234-5678-1234-56789abcdef0',
  characteristicUUID: 'abcdabcd-1234-5678-1111-abcdefabcdef',
  deviceName: 'Jeomgeuli',
});

// 연결
await braille.connect();

// 점자 출력
braille.sendPackets([[0x81, 0x08], [0x81, 0x23]]);
```

### 8.3 점자 재생 훅

**구현 파일**: `frontend/src/hooks/useBraillePlayback.ts`

**통합 인터페이스**
```typescript
const braille = useBraillePlayback({
  serial: {
    baudRate: 115200,
  },
  // 또는
  ble: {
    serviceUUID: '...',
    characteristicUUID: '...',
    deviceName: 'Jeomgeuli',
  },
});

// 자동 재생
braille.enqueueKeywords(['키워드1', '키워드2']);
// enabled가 true이면 자동으로 재생 시작
```

---

## 9. 문제 해결

### 9.1 Serial 연결 실패

**증상**: "Serial 포트를 열 수 없습니다"

**해결 방법**
1. Arduino가 USB에 연결되어 있는지 확인
2. 다른 프로그램이 Serial 포트를 사용 중인지 확인
3. 브라우저를 재시작
4. Chrome/Edge 브라우저 사용 확인

### 9.2 BLE 연결 실패

**증상**: "BLE 디바이스를 찾을 수 없습니다"

**해결 방법**
1. Raspberry Pi BLE 서버가 실행 중인지 확인
2. `sudo python3 ble_server.py` 실행
3. BLE 권한 확인: `sudo setcap 'cap_net_raw,cap_net_admin+eip' /usr/bin/python3`
4. 브라우저에서 BLE 권한 허용 확인

### 9.3 점자가 출력되지 않음

**증상**: 연결은 되지만 점자가 표시되지 않음

**해결 방법**
1. Arduino 펌웨어가 올바르게 업로드되었는지 확인
2. Serial Monitor에서 `test` 명령으로 하드웨어 테스트
3. 전원 공급 확인 (5V, 2A 이상)
4. 점자 모듈 연결 확인 (DATA, LATCH, CLOCK)

### 9.4 점자 패턴이 잘못됨

**증상**: 점자가 잘못된 패턴으로 표시됨

**해결 방법**
1. 점자 매핑 데이터 확인: `backend/data/ko_braille.json`
2. 한글 인코딩 확인: UTF-8 형식
3. 패킷 형식 확인: `[CMD, PATTERN]` 형식

### 9.5 전원 부족

**증상**: 점자가 일부만 표시되거나 깜빡임

**해결 방법**
1. 전원 어댑터 확인 (5V, 2A 이상 권장)
2. USB 전원만 사용하지 말고 외부 전원 사용
3. 점자 모듈 전원 LED 확인

---

## 부록

### A. 점자 패턴 예시

| 문자 | 점자 패턴 | 비트 표현 | 16진수 |
|------|-----------|-----------|--------|
| ㄱ | DOT 4 | `[0,0,0,1,0,0]` | 0x08 |
| ㄴ | DOT 1,4 | `[1,0,0,1,0,0]` | 0x09 |
| ㄷ | DOT 1,4,5 | `[1,0,0,1,1,0]` | 0x19 |
| ㅏ | DOT 1,2,4,6 | `[1,1,0,1,0,1]` | 0x23 |

### B. 참고 자료

- **JY-SOFT 스마트 점자 모듈**: [네이버 스마트스토어](https://smartstore.naver.com/jysoft)
- **블로그 리뷰**: [주영 소프트 - 아두이노 제어 점자 표시기 사용기](https://m.blog.naver.com/mapes_khkim/222152736576)
- **Web Serial API**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- **Web Bluetooth API**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

### C. 불변 규칙

다음 항목들은 절대 변경할 수 없습니다:

- ❌ **Arduino 핀맵**: D2 (DATA), D3 (LATCH), D4 (CLOCK)
- ❌ **BLE 설정**: Service UUID, Characteristic UUID, 디바이스 이름
- ❌ **Serial 보드레이트**: 115200 bps
- ❌ **점자 모듈 전압**: 5V
- ❌ **점자 패턴 비트 매핑**: bit 0-5 → dot 1-6
- ❌ **Shift Register 전송 순서**: 셀3 → 셀2 → 셀1 (LSBFIRST)
