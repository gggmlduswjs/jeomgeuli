# BLE/Serial 통신 프로토콜

## 개요

점글이 프로젝트는 BLE와 Serial 통신 모두에서 동일한 2-byte 패킷 프로토콜을 사용합니다.

## 패킷 형식

모든 패킷은 **2바이트**로 구성됩니다:

```
[CMD, PATTERN]
```

- **CMD**: 명령 바이트 (1바이트)
- **PATTERN**: 점자 패턴 바이트 (1바이트, 6-bit)

## CMD 정의

| CMD | 값 | 설명 |
|-----|-----|------|
| CMD_SINGLE | 0x80 | 단일 셀 모드 (자모 모드) |
| CMD_MULTI | 0x81 | 다중 셀 모드 (단어/문장 모드) |
| CMD_CLEAR | 0x82 | 모든 셀 클리어 |
| CMD_TEST | 0x83 | 테스트 모드 (dot1~dot6 순차 출력) |

## PATTERN 형식

PATTERN은 6-bit 값 (0~63, 0x00~0x3F)입니다:

- bit0 → dot1
- bit1 → dot2
- bit2 → dot3
- bit3 → dot4
- bit4 → dot5
- bit5 → dot6

## 패킷 전송 규칙

### 1. 단일 자모 (CMD_SINGLE)

단일 자모(예: "ㄱ", "ㅏ")는 CMD_SINGLE을 사용합니다:

```
[0x80, pattern]
```

Arduino 펌웨어 동작:
- `cellBuf[0] = pattern`
- `cellBuf[1] = 0x00`
- `cellBuf[2] = 0x00`

### 2. 완성형 한글 (CMD_MULTI)

완성형 한글(예: "가", "나")은 CMD_MULTI를 사용합니다:

```
[0x81, pattern1]  // 첫 번째 패턴 (초성)
[0x81, pattern2]  // 두 번째 패턴 (중성)
[0x81, pattern3]  // 세 번째 패턴 (종성, 있는 경우)
```

Arduino 펌웨어 동작:
- 버퍼 이동: `cellBuf[2] = cellBuf[1]`, `cellBuf[1] = cellBuf[0]`, `cellBuf[0] = pattern`

### 3. 클리어 (CMD_CLEAR)

모든 셀을 클리어합니다:

```
[0x82, 0x00]
```

Arduino 펌웨어 동작:
- `cellBuf[0] = 0x00`
- `cellBuf[1] = 0x00`
- `cellBuf[2] = 0x00`

### 4. 테스트 모드 (CMD_TEST)

하드웨어 테스트를 위해 dot1~dot6를 순차적으로 출력합니다:

```
[0x83, 0x00]
```

Arduino 펌웨어 동작:
- dot1 (0x01) → dot2 (0x02) → dot3 (0x04) → dot4 (0x08) → dot5 (0x10) → dot6 (0x20)
- 각 패턴을 1초씩 표시

## 전송 예시

### 예시 1: 단일 자모 "ㄱ"

```
Frontend → Arduino:
[0x80, 0x08]  // CMD_SINGLE + pattern for "ㄱ"
```

### 예시 2: 완성형 한글 "가"

```
Frontend → Arduino:
[0x81, 0x08]  // CMD_MULTI + pattern for "ㄱ" (초성)
[0x81, 0x23]  // CMD_MULTI + pattern for "ㅏ" (중성)
```

### 예시 3: 단어 "가나"

```
Frontend → Arduino:
[0x81, 0x08]  // "가" 초성
[0x81, 0x23]  // "가" 중성
[0x81, 0x09]  // "나" 초성
[0x81, 0x23]  // "나" 중성
```

## 패킷 간 지연

연속 패킷 전송 시 패킷 간 50ms 지연을 두어 Arduino가 각 패킷을 안정적으로 처리할 수 있도록 합니다.

## BLE 전송

BLE 특성을 사용한 전송:

```typescript
const buffer = new Uint8Array([cmd & 0xFF, pattern & 0x3F]);
await characteristic.writeValue(buffer);
```

## Serial 전송

Web Serial API를 사용한 전송:

```typescript
const buffer = new Uint8Array([cmd & 0xFF, pattern & 0x3F]);
await writer.write(buffer);
```

## Arduino 펌웨어 수신

Arduino는 항상 2바이트를 원자적으로 읽어 처리합니다:

```cpp
while (Serial.available() >= 2) {
    uint8_t cmd = Serial.read();
    uint8_t pattern = Serial.read() & 0x3F;  // 6-bit 마스킹
    
    // CMD에 따라 처리
    if (cmd == CMD_SINGLE_CELL) {
        // 단일 셀 모드 처리
    } else if (cmd == CMD_MULTI_CELL) {
        // 다중 셀 모드 처리
    } else if (cmd == CMD_CLEAR) {
        // 클리어 처리
    } else if (cmd == CMD_TEST) {
        // 테스트 모드 처리
    }
}
```

## 하위 호환성

레거시 코드를 위해 제어 바이트가 없는 경우도 처리합니다:

- 제어 바이트가 0x80~0x83 범위가 아닌 경우, 해당 바이트를 패턴으로 간주하고 CMD_MULTI 모드로 처리합니다.

## 참고

- 모든 패킷은 2바이트로 고정됩니다.
- PATTERN은 항상 6-bit로 제한됩니다 (0x3F 마스킹).
- 패킷 전송 순서는 중요합니다 (특히 CMD_MULTI 모드).

