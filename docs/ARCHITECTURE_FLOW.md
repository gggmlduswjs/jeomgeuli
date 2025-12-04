# 점글이 시스템 아키텍처 및 데이터 흐름

## 개요

이 문서는 점글이 프로젝트의 전체 아키텍처와 데이터 흐름을 설명합니다.

## 시스템 구성

```
Frontend (React/TypeScript)
    ↓
Backend (Django/Python) [선택적]
    ↓
BLE/Serial 통신
    ↓
Arduino Firmware
    ↓
점자 하드웨어 (3셀)
```

## 데이터 흐름

### 1. 텍스트 입력

사용자가 텍스트를 입력합니다 (예: "가나다").

### 2. 한글 분해

**Frontend (`encodeHangul.ts`)** 또는 **Backend (`encode_hangul.py`)**에서 한글을 초성/중성/종성으로 분해합니다:

```
"가" → 초성: "ㄱ", 중성: "ㅏ"
"나" → 초성: "ㄴ", 중성: "ㅏ"
"다" → 초성: "ㄷ", 중성: "ㅏ"
```

### 3. 점자 매핑 조회

`ko_braille.json`에서 각 자모의 점 번호를 조회합니다:

```json
{
  "initial": { "ㄱ": [4], "ㄴ": [1, 4], "ㄷ": [2, 4] },
  "vowel": { "ㅏ": [1, 2, 6] }
}
```

### 4. Dots → Pattern 변환

점 번호 리스트를 패턴 바이트로 변환합니다:

```typescript
// [1, 2, 6] → 0x23
function dotsToPattern(dots: number[]): number {
  let pattern = 0;
  for (const dot of dots) {
    pattern |= (1 << (dot - 1));
  }
  return pattern & 0x3F;
}
```

### 5. CMD 결정

패턴 개수에 따라 CMD를 결정합니다:

- 단일 패턴 (자모): `CMD_SINGLE` (0x80)
- 여러 패턴 (완성형 한글): `CMD_MULTI` (0x81)

### 6. 패킷 생성

CMD와 PATTERN을 조합하여 패킷을 생성합니다:

```typescript
// "가" → [[0x81, 0x08], [0x81, 0x23]]
const packets: [number, number][] = [
  [CMD_MULTI, pattern_initial],  // "ㄱ"
  [CMD_MULTI, pattern_medial]     // "ㅏ"
];
```

### 7. BLE/Serial 전송

각 패킷을 2-byte Uint8Array로 변환하여 전송합니다:

```typescript
for (const [cmd, pattern] of packets) {
  const buffer = new Uint8Array([cmd & 0xFF, pattern & 0x3F]);
  await characteristic.writeValue(buffer);  // BLE
  // 또는
  await writer.write(buffer);  // Serial
  await delay(50);  // 패킷 간 지연
}
```

### 8. Arduino 수신 및 처리

Arduino는 2바이트를 원자적으로 읽어 처리합니다:

```cpp
while (Serial.available() >= 2) {
    uint8_t cmd = Serial.read();
    uint8_t pattern = Serial.read() & 0x3F;
    
    if (cmd == CMD_SINGLE_CELL) {
        cellBuf[0] = pattern;
        cellBuf[1] = 0x00;
        cellBuf[2] = 0x00;
    } else if (cmd == CMD_MULTI_CELL) {
        cellBuf[2] = cellBuf[1];
        cellBuf[1] = cellBuf[0];
        cellBuf[0] = pattern;
    }
    
    setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
}
```

### 9. Shift Register 출력

Arduino는 3셀 버퍼를 Shift Register로 전송합니다:

```cpp
void setBraille3Cells(byte cell1, byte cell2, byte cell3) {
    digitalWrite(LATCH_PIN, LOW);
    shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell3);  // 왼쪽
    shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell2);  // 중간
    shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell1);  // 오른쪽
    digitalWrite(LATCH_PIN, HIGH);
}
```

### 10. 점자 하드웨어 출력

Shift Register가 점자 모듈에 패턴을 전송하여 점자가 표시됩니다.

## 전체 흐름 다이어그램

```
텍스트 입력: "가나다"
    ↓
[Frontend] encodeHangul.textToPackets("가나다")
    ↓
한글 분해:
  "가" → 초성 "ㄱ" + 중성 "ㅏ"
  "나" → 초성 "ㄴ" + 중성 "ㅏ"
  "다" → 초성 "ㄷ" + 중성 "ㅏ"
    ↓
ko_braille.json 조회:
  "ㄱ" → [4] → 0x08
  "ㅏ" → [1,2,6] → 0x23
  "ㄴ" → [1,4] → 0x09
  "ㄷ" → [2,4] → 0x0A
    ↓
패킷 생성:
  [[0x81, 0x08], [0x81, 0x23],  // "가"
   [0x81, 0x09], [0x81, 0x23],  // "나"
   [0x81, 0x0A], [0x81, 0x23]]  // "다"
    ↓
BLE/Serial 전송:
  [0x81, 0x08] → [0x81, 0x23] → ...
    ↓
[Arduino] 패킷 수신 및 버퍼 업데이트
    ↓
Shift Register 출력:
  cell3 → cell2 → cell1
    ↓
점자 하드웨어 출력
```

## 주요 모듈

### Frontend

- **`encodeHangul.ts`**: 한글을 패킷으로 변환
- **`brailleBLE.ts`**: 통합 BLE/Serial 인터페이스
- **`useBrailleBLE.ts`**: BLE 훅
- **`useBrailleSerial.ts`**: Serial 훅

### Backend

- **`encode_hangul.py`**: 한글을 패킷으로 변환 (서버 사이드)
- **`braille_converter.py`**: 점자 변환 유틸리티
- **`views.py`**: API 엔드포인트

### Arduino

- **`braille_3cell.ino`**: 메인 펌웨어
- 패킷 수신 및 처리
- Shift Register 제어

## 데이터 형식

### ko_braille.json

```json
{
  "initial": { "ㄱ": [4], ... },
  "vowel": { "ㅏ": [1, 2, 6], ... },
  "final": { "ㄱ": [4], ... },
  "special": { "⠗": [1, 2, 3, 5] },
  "punctuation": { " ": [0, 0, 0, 0, 0, 0], ... }
}
```

### 패킷 형식

```typescript
type Packet = [number, number];  // [CMD, PATTERN]
type Packets = Packet[];  // [[CMD, PATTERN], ...]
```

### 셀 버퍼

```cpp
byte cellBuf[3] = {cell1, cell2, cell3};
// cell1: 오른쪽 (가장 최근)
// cell2: 중간
// cell3: 왼쪽
```

## 성능 고려사항

1. **로컬 변환**: Frontend에서 로컬 변환을 지원하여 API 호출 없이도 작동 가능
2. **패킷 지연**: 패킷 간 50ms 지연으로 Arduino 버퍼 처리 시간 확보
3. **원자적 읽기**: Arduino는 항상 2바이트를 원자적으로 읽어 패킷 손실 방지

## 확장성

- 새로운 CMD 추가 가능 (0x84~0xFF)
- 점자 매핑은 JSON 파일로 관리하여 업데이트 용이
- BLE와 Serial 모두 동일한 프로토콜 사용

