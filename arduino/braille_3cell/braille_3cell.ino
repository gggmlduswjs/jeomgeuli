/*
 * 점글이 Arduino UNO 펌웨어 (3셀 버전)
 * JY-SOFT 스마트 점자 모듈 × 3 제어
 * 
 * HARDWARE_SPEC.md의 3셀 스펙을 준수합니다.
 * 테스트 코드로 확인된 설정:
 * - shiftOut 방향: LSBFIRST (확인됨)
 * - 셀 전송 순서: 셀3 → 셀2 → 셀1 (왼쪽 → 중간 → 오른쪽 표시)
 * 
 * 핀맵 (불변):
 * - DATA: D2
 * - LATCH: D3
 * - CLOCK: D4
 * 
 * 3셀 버퍼 구조:
 * - 셀1: 가장 최근 문자 (오른쪽에 표시)
 * - 셀2: 이전 문자 (중간에 표시)
 * - 셀3: 그 이전 문자 (왼쪽에 표시)
 */

// 핀 정의 (HARDWARE_SPEC.md에 명시된 값 - 불변)
const int DATA_PIN = 2;   // DATA 핀
const int LATCH_PIN = 3;  // LATCH 핀
const int CLOCK_PIN = 4;  // CLOCK 핀

// 3셀 버퍼 (셀1, 셀2, 셀3)
byte cellBuf[3] = {0, 0, 0};

void setup() {
  Serial.begin(115200);
  
  // 핀 모드 설정
  pinMode(DATA_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  
  // 초기 상태
  digitalWrite(LATCH_PIN, LOW);
  digitalWrite(CLOCK_PIN, LOW);
  digitalWrite(DATA_PIN, LOW);
  
  Serial.println("Braille 3-Cell Firmware Started");
  Serial.println("LSBFIRST mode - Cell order: 3->2->1 (Left->Middle->Right)");
  Serial.println("Waiting for input...");
  
  // 초기화: 모든 셀 OFF
  setBraille3Cells(0x00, 0x00, 0x00);
  delay(100);
}

void loop() {
  if (Serial.available()) {
    // Serial로 바이트 수신
    uint8_t data = Serial.read();
    uint8_t pattern;
    
    // 패턴 바이트인지 문자인지 구분
    // 패턴 바이트: 0x00~0x3F (6-bit 점자 패턴)
    // 문자: 그 외 (영문, 한글 등)
    if (data <= 0x3F) {
      // 패턴 바이트 직접 수신 (프론트엔드에서 변환된 패턴)
      pattern = data;
      Serial.print("Received pattern: 0x");
      Serial.println(pattern, HEX);
    } else {
      // 문자 수신 (레거시 지원: 영문/숫자만)
      char c = (char)data;
      pattern = brailleCharToPattern(c);
      Serial.print("Received char: '");
      Serial.print(c);
      Serial.print("' -> Pattern: 0x");
      Serial.println(pattern, HEX);
    }
    
    // 버퍼 이동: 새 패턴은 셀1에, 기존 내용은 오른쪽으로 이동
    // 셀3 ← 셀2 ← 셀1 ← 새 패턴
    cellBuf[2] = cellBuf[1];  // 셀2 → 셀3 (왼쪽으로 이동)
    cellBuf[1] = cellBuf[0];  // 셀1 → 셀2 (중간으로 이동)
    cellBuf[0] = pattern;     // 새 패턴 → 셀1 (오른쪽에 표시)
    
    // 3셀 출력 (셀3 → 셀2 → 셀1 순서로 전송하여 왼쪽 → 중간 → 오른쪽 표시)
    setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
    
    Serial.print("Buffer: [Cell1=0x");
    Serial.print(cellBuf[0], HEX);
    Serial.print(", Cell2=0x");
    Serial.print(cellBuf[1], HEX);
    Serial.print(", Cell3=0x");
    Serial.print(cellBuf[2], HEX);
    Serial.println("]");
  }
}

/**
 * 3셀 점자 패턴을 Shift Register로 전송
 * 
 * 테스트 코드로 확인된 설정:
 * - shiftOut 방향: LSBFIRST (확인됨)
 * - 전송 순서: 셀3 → 셀2 → 셀1 (왼쪽 → 중간 → 오른쪽 표시)
 * 
 * @param cell1 셀1 패턴 (오른쪽에 표시)
 * @param cell2 셀2 패턴 (중간에 표시)
 * @param cell3 셀3 패턴 (왼쪽에 표시)
 */
void setBraille3Cells(byte cell1, byte cell2, byte cell3) {
  digitalWrite(LATCH_PIN, LOW);
  
  // LSBFIRST 사용 (테스트 코드로 확인됨)
  // 셀3 → 셀2 → 셀1 순서로 전송 (왼쪽 → 중간 → 오른쪽 표시)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell3);  // 셀3 먼저 (왼쪽)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell2);  // 셀2 (중간)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell1);  // 셀1 마지막 (오른쪽)
  
  digitalWrite(LATCH_PIN, HIGH);
  delayMicroseconds(10); // 짧은 대기 (안정성)
  digitalWrite(LATCH_PIN, LOW);
}

/**
 * 문자를 점자 패턴으로 변환
 * 
 * 실제 구현은 backend/data/ko_braille.json 매핑 테이블을 참조해야 합니다.
 * 여기서는 기본 구조만 제공합니다.
 * 
 * @param c 문자 (영문, 숫자 등)
 * @return 점자 패턴 (0~63, 6-bit)
 */
uint8_t brailleCharToPattern(char c) {
  // 영문 처리
  if (c >= 'A' && c <= 'Z') {
    return (c - 'A') + 1;  // A=0x01, B=0x02, ...
  }
  
  // 소문자 처리
  if (c >= 'a' && c <= 'z') {
    return (c - 'a') + 1;
  }
  
  // 숫자 처리
  if (c >= '0' && c <= '9') {
    return (c - '0') + 0x20;  // 숫자 점자 패턴
  }
  
  // 공백
  if (c == ' ' || c == '\n' || c == '\r') {
    return 0x00;
  }
  
  // 기본값 (DOT 1)
  return 0x01;
}

