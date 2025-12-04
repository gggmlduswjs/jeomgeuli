# Arduino 펌웨어

점글이 하드웨어 시스템의 Arduino UNO 펌웨어입니다.

## 역할

Arduino는 Raspberry Pi로부터 Serial 데이터를 수신하여 점자 모듈을 제어합니다.

```
Raspberry Pi (USB Serial)
    ↓
Arduino UNO (Serial 수신 → 점자 패턴 변환)
    ↓ GPIO (D2, D3, D4)
JY-SOFT 점자 모듈
```

## 하드웨어 요구사항

- Arduino UNO (또는 호환 보드)
- JY-SOFT 스마트 점자 모듈 × 3 (3셀 버전, 총 18-dot)
- 5핀 케이블
- 5V, 2A 이상 전원 어댑터 (3셀 구동용)

## 하드웨어 연결

### Arduino와 점자 모듈 연결

HARDWARE_SPEC.md의 핀맵에 따라 연결합니다:

| 점자 모듈 | Arduino UNO | 설명 |
|-----------|-------------|------|
| VCC (빨간색) | 5V | 전원 공급 |
| GND | GND | 그라운드 |
| DATA | D2 | 시리얼 데이터 입력 |
| LATCH | D3 | 래치 신호 |
| CLOCK | D4 | 클럭 신호 |

**중요**: 핀맵은 변경할 수 없습니다 (HARDWARE_SPEC.md 불변 규칙).

### 전원 공급

- 점자 모듈: 5V, 2A 이상 어댑터 권장
- Arduino: USB 전원 또는 외부 전원

## 소프트웨어 요구사항

### Arduino IDE

1. [Arduino IDE 다운로드](https://www.arduino.cc/en/software)
2. Arduino IDE 설치

### braille.h 라이브러리

JY-SOFT 점자 모듈은 `braille.h` 라이브러리를 사용합니다.

**라이브러리 위치**:
- JY-SOFT 샘플 코드에 포함되어 있음
- 또는 JY-SOFT에 문의하여 제공받아야 함

**라이브러리 사용법**:
```cpp
#include "braille.h"

braille bra(DATA_PIN, LATCH_PIN, CLOCK_PIN, MODULE_COUNT);
bra.begin();
bra.set(cellIndex, pattern);
bra.refresh();
```

## 펌웨어 파일

### 3셀 버전 (표준)

- **메인 펌웨어**: `braille_3cell/braille_3cell.ino`
  - 3셀 점자 모듈 제어
  - Serial 통신으로 문자 수신 및 점자 출력
  - 확인된 설정: LSBFIRST, 셀 순서 3→2→1

- **하드웨어 테스트 코드**: `braille_3cell/test_all_dots.ino`
  - 모든 DOT(점) 개별 테스트
  - 각 셀의 6개 점이 모두 올바르게 작동하는지 확인
  - 하드웨어 구동 확인용

- **점자 패턴 테스트 코드**: `braille_3cell/test_braille_patterns.ino` ⭐ **새로 추가**
  - 각 한글 글자의 점자 패턴을 하드웨어에서 직접 테스트
  - `ko_braille.json` 데이터 검증용
  - 자동/수동 테스트 모드 지원
  - 상세 가이드: [TEST_GUIDE.md](braille_3cell/TEST_GUIDE.md)

## 펌웨어 업로드

### 1. 보드 선택

Arduino IDE에서:
- 도구 → 보드 → Arduino UNO

### 2. 포트 선택

Arduino가 USB로 연결된 포트를 선택:
- 도구 → 포트 → COM 포트 (Windows) 또는 /dev/ttyACM0 (Linux)

### 3. 업로드

- 스케치 → 업로드 (Ctrl+U)

### 4. 업로드 확인

시리얼 모니터를 열어 확인:
- 도구 → 시리얼 모니터
- 보드레이트: 115200
- 다음 메시지가 출력되면 성공:
  ```
  Braille 3-Cell Firmware Started
  LSBFIRST mode - Cell order: 3->2->1 (Left->Middle->Right)
  Waiting for input...
  ```

## 테스트

### 1. 하드웨어 구동 테스트 (권장)

먼저 하드웨어가 정상 작동하는지 확인:

1. `braille_3cell/test_all_dots.ino` 파일 열기
2. Arduino에 업로드
3. 시리얼 모니터 열기 (보드레이트: 115200)
4. 점자 모듈에서 각 테스트 결과 확인:
   - 각 셀의 6개 점(DOT 1~6)이 순서대로 올라오는지 확인
   - 3개 셀 모두 정상 작동하는지 확인

**테스트 결과 확인 사항:**
- ✅ 셀1 (오른쪽): DOT 1~6 순서대로 올라옴
- ✅ 셀2 (중간): DOT 1~6 순서대로 올라옴
- ✅ 셀3 (왼쪽): DOT 1~6 순서대로 올라옴
- ✅ 모든 셀의 모든 점이 정상 작동

### 1-1. 점자 패턴 데이터 검증 테스트 ⭐ **중요**

**ko_braille.json 데이터 정확성 검증:**

1. `braille_3cell/test_braille_patterns.ino` 파일 열기
2. Arduino에 업로드
3. 시리얼 모니터 열기 (보드레이트: 115200)
4. 테스트 실행:
   - 자동 테스트: `test` 입력 → 모든 패턴 순차 출력
   - 수동 테스트: 16진수 패턴 입력 (예: `01`, `05`)
   - 특정 글자: `ㄱ`, `ㄴ` 등 입력
5. 각 패턴의 하드웨어 출력 확인
6. 잘못된 패턴 발견 시 `backend/data/ko_braille.json` 수정

**상세 가이드**: [TEST_GUIDE.md](braille_3cell/TEST_GUIDE.md)

### 2. Serial 모니터 테스트

메인 펌웨어로 문자 입력 테스트:

1. `braille_3cell/braille_3cell.ino` 파일 열기
2. Arduino에 업로드
3. 시리얼 모니터 열기 (보드레이트: 115200)
4. 입력창에 문자 입력 (예: "A", "B", "C")
5. 전송
6. Arduino 로그 확인:
   ```
   Received: 'A' -> Pattern: 0x1 | Buffer: [Cell1=0x1, Cell2=0x0, Cell3=0x0]
   ```
7. 점자 모듈에서 점이 출력되는지 확인
8. 여러 문자 입력 시 버퍼 이동 확인 (오른쪽 → 중간 → 왼쪽)

### 3. Raspberry Pi 연동 테스트

1. Raspberry Pi에서 BLE 서버 실행
2. React PWA에서 "Jeomgeuli" 디바이스 연결
3. 점자 출력 테스트
4. Arduino Serial 모니터에서 수신 데이터 확인

### 4. Web Serial API 테스트

1. 백엔드 및 프론트엔드 실행
2. 브라우저에서 Arduino 연결 (Chrome/Edge)
3. 학습 모드나 정보탐색에서 점자 출력 테스트
4. Arduino Serial 모니터에서 수신 데이터 확인

## 문제 해결

### 업로드 실패

**증상**: "avrdude: stk500_getsync()" 오류

**해결 방법**:
1. Arduino가 올바른 포트에 연결되어 있는지 확인
2. 다른 프로그램이 Serial 포트를 사용 중인지 확인
3. Arduino 보드 선택이 올바른지 확인
4. USB 케이블이 데이터 전송을 지원하는지 확인

### 점자가 출력되지 않음

**증상**: Serial 모니터에는 로그가 출력되지만 점자가 나오지 않음

**해결 방법**:
1. 점자 모듈 전원 확인 (5V, 2A 이상, 3셀 구동용)
2. 핀 연결 확인 (D2, D3, D4)
3. `test_all_dots.ino`로 하드웨어 구동 테스트 먼저 수행
4. 점자 모듈의 LED나 상태 표시 확인
5. shiftOut 방향 확인 (LSBFIRST 사용)

### 점자가 잘못된 위치에 나타남

**증상**: 점자가 올라오지만 예상한 위치가 아님

**해결 방법**:
1. 셀 순서 확인: 셀3 → 셀2 → 셀1 전송 (왼쪽 → 중간 → 오른쪽 표시)
2. shiftOut 방향 확인: LSBFIRST 사용 (확인됨)
3. `test_all_dots.ino`로 각 DOT가 올바른 위치에 나타나는지 확인

### Serial 데이터 수신 안 됨

**증상**: Raspberry Pi에서 전송했지만 Arduino에서 수신되지 않음

**해결 방법**:
1. Serial 모니터에서 데이터 수신 확인
2. 보드레이트가 115200인지 확인
3. USB 케이블 연결 확인
4. Arduino가 다른 프로그램에서 사용 중인지 확인

### 한글 점자 변환 오류

**증상**: 한글 문자가 올바른 점자로 변환되지 않음

**해결 방법**:
1. `brailleCharToPattern()` 함수 구현 확인
2. `backend/data/ko_braille.json` 매핑 테이블 참조
3. UTF-8 인코딩 처리 확인

## 점자 패턴 변환 구현

현재 펌웨어는 기본 구조만 제공합니다. 실제 한글 점자 변환을 구현하려면:

1. `backend/data/ko_braille.json` 파일 참조
2. 한글 자음/모음 분해 로직 구현
3. 점자 매핑 테이블을 Arduino에 포함

**참고**: 완전한 한글 점자 변환은 복잡하므로, 가능하면 React PWA에서 점자 패턴으로 변환하여 전송하는 것을 권장합니다.

## 확인된 설정

테스트 코드로 확인된 하드웨어 설정:

- **shiftOut 방향**: `LSBFIRST` (확인됨)
- **셀 전송 순서**: 셀3 → 셀2 → 셀1 (왼쪽 → 중간 → 오른쪽 표시)
- **비트 매핑**:
  - DOT 1 = 0x01 (bit 0)
  - DOT 2 = 0x02 (bit 1)
  - DOT 3 = 0x04 (bit 2)
  - DOT 4 = 0x08 (bit 3)
  - DOT 5 = 0x10 (bit 4)
  - DOT 6 = 0x20 (bit 5)

## 참고 자료

- [HARDWARE_SPEC.md](../docs/HARDWARE_SPEC.md): 전체 하드웨어 스펙
- [TEST_GUIDE.md](braille_3cell/TEST_GUIDE.md): 점자 패턴 테스트 가이드 ⭐ **새로 추가**
- [JY-SOFT 블로그](https://m.blog.naver.com/mapes_khkim/222152736576): 점자 모듈 사용기
- [Arduino 공식 문서](https://www.arduino.cc/reference/en/)

