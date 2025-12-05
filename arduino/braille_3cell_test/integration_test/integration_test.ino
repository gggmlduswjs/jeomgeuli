/*
 * 점글이 3셀 펌웨어 통합 테스트
 * 
 * 이 코드는 펌웨어의 패킷 처리 기능을 테스트합니다.
 * Serial Monitor에서 다음 명령을 입력하여 테스트할 수 있습니다:
 * 
 * - test_single: 단일 셀 모드 테스트
 * - test_multi: 다중 셀 모드 테스트
 * - test_clear: 클리어 명령 테스트
 * - test_test: 테스트 모드 명령 테스트
 * - test_all: 모든 테스트 실행
 */

const int DATA_PIN = 2;
const int LATCH_PIN = 3;
const int CLOCK_PIN = 4;

#define CMD_SINGLE_CELL 0x80
#define CMD_MULTI_CELL  0x81
#define CMD_CLEAR       0x82
#define CMD_TEST        0x83

byte cellBuf[3] = {0, 0, 0};

void setup() {
  Serial.begin(115200);
  
  pinMode(DATA_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  
  digitalWrite(LATCH_PIN, LOW);
  digitalWrite(CLOCK_PIN, LOW);
  digitalWrite(DATA_PIN, LOW);
  
  Serial.println("========================================");
  Serial.println("  점글이 3셀 펌웨어 통합 테스트");
  Serial.println("========================================");
  Serial.println();
  Serial.println("사용 가능한 명령:");
  Serial.println("  test_single - 단일 셀 모드 테스트");
  Serial.println("  test_multi  - 다중 셀 모드 테스트");
  Serial.println("  test_clear  - 클리어 명령 테스트");
  Serial.println("  test_test   - 테스트 모드 명령 테스트");
  Serial.println("  test_all    - 모든 테스트 실행");
  Serial.println();
  
  // 초기화: 모든 셀 OFF
  setBraille3Cells(0x00, 0x00, 0x00);
  delay(100);
}

void loop() {
  // 펌웨어의 실제 패킷 처리 로직 테스트
  if (Serial.available() >= 2) {
    uint8_t cmd = Serial.read();
    uint8_t pattern = Serial.read() & 0x3F;
    
    processPacket(cmd, pattern);
  }
  
  // 명령어 처리
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toLowerCase();
    
    if (command == "test_single") {
      testSingleCell();
    } else if (command == "test_multi") {
      testMultiCell();
    } else if (command == "test_clear") {
      testClear();
    } else if (command == "test_test") {
      testTestMode();
    } else if (command == "test_all") {
      testAll();
    }
  }
}

void processPacket(uint8_t cmd, uint8_t pattern) {
  if (cmd == CMD_SINGLE_CELL) {
    cellBuf[0] = pattern;
    cellBuf[1] = 0x00;
    cellBuf[2] = 0x00;
    Serial.print("CMD_SINGLE: Pattern 0x");
    if (pattern < 0x10) Serial.print("0");
    Serial.println(pattern, HEX);
  } else if (cmd == CMD_MULTI_CELL) {
    cellBuf[2] = cellBuf[1];
    cellBuf[1] = cellBuf[0];
    cellBuf[0] = pattern;
    Serial.print("CMD_MULTI: Pattern 0x");
    if (pattern < 0x10) Serial.print("0");
    Serial.println(pattern, HEX);
  } else if (cmd == CMD_CLEAR) {
    cellBuf[0] = 0x00;
    cellBuf[1] = 0x00;
    cellBuf[2] = 0x00;
    Serial.println("CMD_CLEAR");
  } else if (cmd == CMD_TEST) {
    Serial.println("CMD_TEST");
    // 테스트 모드는 실제 펌웨어에서 처리
  }
  
  setBraille3Cells(cellBuf[0], cellBuf[1], cellBuf[2]);
  
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

void testSingleCell() {
  Serial.println();
  Serial.println("=== 단일 셀 모드 테스트 ===");
  
  // 패턴 0x08 (dot 4) 전송
  Serial.println("패턴 0x08 전송 (CMD_SINGLE)...");
  processPacket(CMD_SINGLE_CELL, 0x08);
  delay(2000);
  
  Serial.println("테스트 완료");
  Serial.println();
}

void testMultiCell() {
  Serial.println();
  Serial.println("=== 다중 셀 모드 테스트 ===");
  
  // 여러 패턴 순차 전송
  uint8_t patterns[] = {0x08, 0x23, 0x15};
  for (int i = 0; i < 3; i++) {
    Serial.print("패턴 0x");
    if (patterns[i] < 0x10) Serial.print("0");
    Serial.print(patterns[i], HEX);
    Serial.println(" 전송 (CMD_MULTI)...");
    processPacket(CMD_MULTI_CELL, patterns[i]);
    delay(2000);
  }
  
  Serial.println("테스트 완료");
  Serial.println();
}

void testClear() {
  Serial.println();
  Serial.println("=== 클리어 명령 테스트 ===");
  
  // 먼저 패턴 표시
  processPacket(CMD_SINGLE_CELL, 0x08);
  delay(1000);
  
  // 클리어
  Serial.println("CMD_CLEAR 전송...");
  processPacket(CMD_CLEAR, 0x00);
  delay(2000);
  
  Serial.println("테스트 완료");
  Serial.println();
}

void testTestMode() {
  Serial.println();
  Serial.println("=== 테스트 모드 명령 테스트 ===");
  Serial.println("CMD_TEST 전송...");
  Serial.println("(실제 테스트 모드는 펌웨어에서 처리)");
  processPacket(CMD_TEST, 0x00);
  delay(2000);
  Serial.println("테스트 완료");
  Serial.println();
}

void testAll() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("  전체 테스트 시작");
  Serial.println("========================================");
  Serial.println();
  
  testSingleCell();
  delay(1000);
  testMultiCell();
  delay(1000);
  testClear();
  delay(1000);
  testTestMode();
  
  Serial.println("========================================");
  Serial.println("  전체 테스트 완료");
  Serial.println("========================================");
  Serial.println();
}

void setBraille3Cells(byte cell1, byte cell2, byte cell3) {
  cell1 = cell1 & 0x3F;
  cell2 = cell2 & 0x3F;
  cell3 = cell3 & 0x3F;
  
  digitalWrite(LATCH_PIN, LOW);
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell3);
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell2);
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, cell1);
  digitalWrite(LATCH_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(LATCH_PIN, LOW);
}

