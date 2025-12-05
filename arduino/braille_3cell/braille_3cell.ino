/*
 * 점글이 Arduino UNO 펌웨어 (3셀 버전) - 단순 드라이버 모드
 * JY-SOFT 스마트 점자 모듈 × 3 제어
 * 
 * 리팩토링: "Dumb Hardware, Smart Software" 원칙
 * - 웹앱에서 모든 로직 처리 (한글 분해, 점자 변환)
 * - 아두이노는 받은 패턴을 그대로 하드웨어로 전송만 수행
 * 
 * 프로토콜: CMD 제거, 순수 패턴 배열만 전송
 * - 웹앱 → 아두이노: [pattern1, pattern2, pattern3, ...]
 * - 각 패턴은 0x00~0x3F (6-bit)
 * 
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
 * - 셀1: 가장 최근 패턴 (오른쪽에 표시)
 * - 셀2: 이전 패턴 (중간에 표시)
 * - 셀3: 그 이전 패턴 (왼쪽에 표시)
 */

// 핀 정의 (HARDWARE_SPEC.md에 명시된 값 - 불변)
const int DATA_PIN = 2;   // DATA 핀
const int LATCH_PIN = 3;  // LATCH 핀
const int CLOCK_PIN = 4;  // CLOCK 핀

// 3셀 버퍼 (셀1, 셀2, 셀3)
byte cellBuf[3] = {0, 0, 0};

// 디버그 모드 (Serial 출력 제어)
const bool DEBUG_MODE = true;  // false로 설정하면 디버그 출력 비활성화

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
  
  if (DEBUG_MODE) {
    Serial.println("Braille 3-Cell Firmware Started (Driver Mode)");
    Serial.println("Protocol: Raw pattern array (no CMD)");
    Serial.println("LSBFIRST mode - Cell order: 3->2->1 (Left->Middle->Right)");
    Serial.println("Waiting for patterns...");
  }
  
  // 초기화: 모든 셀 OFF
  setBraille3Cells(0x00, 0x00, 0x00);
  delay(100);
}

void loop() {
  // 웹앱에서 보내는 데이터: 순수 패턴 배열 [pattern1, pattern2, pattern3, ...]
  // 각 패턴은 0x00~0x3F (6-bit)
  // CMD 없이 패턴만 전송
  
  if (Serial.available() > 0) {
    // 받은 바이트를 패턴으로 처리 (6-bit 마스킹)
    uint8_t pattern = Serial.read() & 0x3F;
    
    if (DEBUG_MODE) {
      Serial.print("📥 Pattern received: 0x");
      if (pattern < 0x10) Serial.print("0");
      Serial.print(pattern, HEX);
      Serial.print(" [dots: ");
      bool first = true;
      for (int i = 0; i < 6; i++) {
        if (pattern & (1 << i)) {
          if (!first) Serial.print(", ");
          Serial.print(i + 1);
          first = false;
        }
      }
      if (first) Serial.print("none");
      Serial.print("]");
    }
    
    // 버퍼 이동: 새 패턴은 셀1에, 기존 패턴은 오른쪽으로 이동
    cellBuf[2] = cellBuf[1];  // 셀2 → 셀3
    cellBuf[1] = cellBuf[0];  // 셀1 → 셀2
    cellBuf[0] = pattern;     // 새 패턴 → 셀1
    
    if (DEBUG_MODE) {
      Serial.print(" -> Buffer: [0x");
      if (cellBuf[0] < 0x10) Serial.print("0");
      Serial.print(cellBuf[0], HEX);
      Serial.print(", 0x");
      if (cellBuf[1] < 0x10) Serial.print("0");
      Serial.print(cellBuf[1], HEX);
      Serial.print(", 0x");
      if (cellBuf[2] < 0x10) Serial.print("0");
      Serial.print(cellBuf[2], HEX);
      Serial.println("]");
    }
    
    // 하드웨어 업데이트
    setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
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
  // 패턴 유효성 검사 (6-bit 범위)
  cell1 = cell1 & 0x3F;  // 상위 2비트 마스킹
  cell2 = cell2 & 0x3F;
  cell3 = cell3 & 0x3F;
  
  if (DEBUG_MODE) {
    Serial.print("setBraille3Cells: [0x");
    if (cell1 < 0x10) Serial.print("0");
    Serial.print(cell1, HEX);
    Serial.print(", 0x");
    if (cell2 < 0x10) Serial.print("0");
    Serial.print(cell2, HEX);
    Serial.print(", 0x");
    if (cell3 < 0x10) Serial.print("0");
    Serial.print(cell3, HEX);
    Serial.println("]");
  }
  
  digitalWrite(LATCH_PIN, LOW);
  
  // LSBFIRST 사용 (테스트 코드로 확인됨)
  // 셀3 → 셀2 → 셀1 순서로 전송 (왼쪽 → 중간 → 오른쪽 표시)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell3);  // 셀3 먼저 (왼쪽)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell2);  // 셀2 (중간)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell1);  // 셀1 마지막 (오른쪽)
  
  digitalWrite(LATCH_PIN, HIGH);
  delayMicroseconds(10); // 짧은 대기 (안정성)
  digitalWrite(LATCH_PIN, LOW);
  
  if (DEBUG_MODE) {
    Serial.println("Hardware update completed");
  }
}

// 주의: 문자→점자 변환은 프론트엔드에서 처리되므로
// Arduino 펌웨어는 패턴을 그대로 받아서 디스플레이하는 역할만 수행합니다.

