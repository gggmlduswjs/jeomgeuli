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
- JY-SOFT 스마트 점자 모듈
- 5핀 케이블
- 5V, 2A 이상 전원 어댑터 (점자 모듈용)

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
  [Arduino] 점글이 펌웨어 시작
  [Arduino] 점자 모듈 대기 중...
  ```

## 테스트

### 1. Serial 모니터 테스트

Arduino IDE의 시리얼 모니터에서 직접 테스트:

1. 시리얼 모니터 열기 (보드레이트: 115200)
2. 입력창에 문자 입력 (예: "A")
3. 전송
4. Arduino 로그 확인:
   ```
   [Arduino] 수신: 'A' → 패턴: 0x1
   ```
5. 점자 모듈에서 점이 출력되는지 확인

### 2. Raspberry Pi 연동 테스트

1. Raspberry Pi에서 BLE 서버 실행
2. React PWA에서 "Jeomgeuli" 디바이스 연결
3. 점자 출력 테스트
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
1. 점자 모듈 전원 확인 (5V, 2A 이상)
2. 핀 연결 확인 (D2, D3, D4)
3. `braille.h` 라이브러리가 올바르게 포함되었는지 확인
4. 점자 모듈의 LED나 상태 표시 확인

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

## 참고 자료

- [HARDWARE_SPEC.md](../docs/HARDWARE_SPEC.md): 전체 하드웨어 스펙
- [JY-SOFT 블로그](https://m.blog.naver.com/mapes_khkim/222152736576): 점자 모듈 사용기
- [Arduino 공식 문서](https://www.arduino.cc/reference/en/)

