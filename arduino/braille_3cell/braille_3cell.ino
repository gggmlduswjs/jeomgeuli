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

// 디버그 모드 (Serial 출력 제어)
const bool DEBUG_MODE = true;  // false로 설정하면 디버그 출력 비활성화

// 제어 바이트 정의
#define CMD_SINGLE_CELL 0x80  // 단일 셀 모드 (자모 모드)
#define CMD_MULTI_CELL  0x81  // 다중 셀 모드 (단어/문장 모드)
#define CMD_CLEAR       0x82  // 모든 셀 클리어
#define CMD_TEST        0x83  // 테스트 모드 (dot1~dot6 순차 출력)

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
    Serial.println("Braille 3-Cell Firmware Started");
    Serial.println("LSBFIRST mode - Cell order: 3->2->1 (Left->Middle->Right)");
    Serial.println("Waiting for input...");
  }
  
  // 초기화: 모든 셀 OFF
  setBraille3Cells(0x00, 0x00, 0x00);
  delay(100);
}

void loop() {
  // 최소 2바이트(제어+패턴)가 있을 때만 처리
  // test_braille_patterns.ino의 sendPattern()과 동일한 동작을 보장하기 위해
  // 제어 바이트와 패턴을 원자적으로 읽어서 처리
  if (Serial.available() > 0) {
    if (DEBUG_MODE) {
      Serial.print("Serial available: ");
      Serial.println(Serial.available());
    }
  }
  
  while (Serial.available() >= 2) {
    uint8_t cmd = Serial.read();
    uint8_t pattern = Serial.read() & 0x3F;  // 6-bit 마스킹
    
    if (DEBUG_MODE) {
      Serial.print("📥 Received: CMD=0x");
      if (cmd < 0x10) Serial.print("0");
      Serial.print(cmd, HEX);
      Serial.print(", PATTERN=0x");
      if (pattern < 0x10) Serial.print("0");
      Serial.print(pattern, HEX);
      Serial.print(" (바이트: [0x");
      if (cmd < 0x10) Serial.print("0");
      Serial.print(cmd, HEX);
      Serial.print(", 0x");
      if (pattern < 0x10) Serial.print("0");
      Serial.print(pattern, HEX);
      Serial.println("])");
    }
    
    if (cmd == CMD_SINGLE_CELL) {
      // test_braille_patterns.ino의 sendPattern(pattern, true)와 동일
      cellBuf[0] = pattern;
      cellBuf[1] = 0x00;
      cellBuf[2] = 0x00;
      
      if (DEBUG_MODE) {
        Serial.print("✅ CMD_SINGLE: Pattern 0x");
        if (pattern < 0x10) Serial.print("0");
        Serial.print(pattern, HEX);
        Serial.print(" -> Single cell mode (셀1에만 표시)");
        // 패턴을 점 번호로 변환하여 표시
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
        Serial.println("]");
      }
      
      setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
    } else if (cmd == CMD_MULTI_CELL) {
      // 다중 셀 모드: 버퍼 이동
      cellBuf[2] = cellBuf[1];
      cellBuf[1] = cellBuf[0];
      cellBuf[0] = pattern;
      
      if (DEBUG_MODE) {
        Serial.print("✅ CMD_MULTI: Pattern 0x");
        if (pattern < 0x10) Serial.print("0");
        Serial.print(pattern, HEX);
        Serial.print(" -> Multi cell mode (셀 버퍼 이동)");
        // 패턴을 점 번호로 변환하여 표시
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
        Serial.println("]");
      }
      
      setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
    } else if (cmd == CMD_CLEAR) {
      // 모든 셀 클리어
      cellBuf[0] = 0x00;
      cellBuf[1] = 0x00;
      cellBuf[2] = 0x00;
      
      if (DEBUG_MODE) {
        Serial.println("CMD_CLEAR -> All cells cleared");
      }
      
      setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
    } else if (cmd == CMD_TEST) {
      // 테스트 모드: dot1~dot6 순차 출력
      if (DEBUG_MODE) {
        Serial.println("CMD_TEST -> Sequential dot test");
      }
      
      // dot1~dot6 순차 출력 (각각 1초씩)
      uint8_t testPatterns[] = {0x01, 0x02, 0x04, 0x08, 0x10, 0x20}; // dot1~dot6
      for (int i = 0; i < 6; i++) {
        cellBuf[0] = testPatterns[i];
        cellBuf[1] = 0x00;
        cellBuf[2] = 0x00;
        setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
        
        if (DEBUG_MODE) {
          Serial.print("  Dot ");
          Serial.print(i + 1);
          Serial.print(" (Pattern 0x");
          if (testPatterns[i] < 0x10) Serial.print("0");
          Serial.print(testPatterns[i], HEX);
          Serial.println(")");
        }
        
        delay(1000); // 1초 대기
      }
      
      // 테스트 완료 후 모든 셀 OFF
      cellBuf[0] = 0x00;
      cellBuf[1] = 0x00;
      cellBuf[2] = 0x00;
      setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
      
      if (DEBUG_MODE) {
        Serial.println("CMD_TEST completed");
      }
    } else {
      // 제어 바이트가 아닌 경우 (하위 호환성)
      // 이전에 읽은 바이트를 패턴으로 처리하고, 현재 바이트를 다음 제어 바이트로 간주
      pattern = cmd & 0x3F;
      cellBuf[2] = cellBuf[1];
      cellBuf[1] = cellBuf[0];
      cellBuf[0] = pattern;
      
      if (DEBUG_MODE) {
        Serial.print("⚠️ NO_CMD: 알 수 없는 CMD 0x");
        if (cmd < 0x10) Serial.print("0");
        Serial.print(cmd, HEX);
        Serial.print(", Pattern 0x");
        if (pattern < 0x10) Serial.print("0");
        Serial.print(pattern, HEX);
        Serial.println(" -> Multi cell mode (legacy, CMD 무시)");
      }
      
      setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
    }
    
    if (DEBUG_MODE && cmd != CMD_TEST) {
      Serial.print("Buffer: [0x");
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

