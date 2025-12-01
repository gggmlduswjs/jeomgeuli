/*
 * 점글이 Arduino UNO 펌웨어
 * JY-SOFT 스마트 점자 모듈 제어
 * 
 * HARDWARE_SPEC.md의 스펙을 준수합니다.
 * 
 * 핀맵 (불변):
 * - DATA: D2
 * - LATCH: D3
 * - CLOCK: D4
 */

// 핀 정의 (HARDWARE_SPEC.md에 명시된 값 - 불변)
const int DATA_PIN = 2;   // DATA 핀
const int LATCH_PIN = 3;  // LATCH 핀
const int CLOCK_PIN = 4;  // CLOCK 핀

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
  
  Serial.println("[Arduino] 점글이 펌웨어 시작");
  Serial.println("[Arduino] 점자 모듈 대기 중...");
}

void loop() {
  if (Serial.available()) {
    // Serial로 문자 수신
    char c = Serial.read();
    
    // 문자를 점자 패턴으로 변환
    uint8_t pattern = brailleCharToPattern(c);
    
    // 점자 모듈에 패턴 출력
    setBraillePattern(pattern);
    
    Serial.print("[Arduino] 수신: '");
    Serial.print(c);
    Serial.print("' → 패턴: 0x");
    Serial.println(pattern, HEX);
  }
}

/**
 * 점자 패턴을 Shift Register로 전송
 * @param pattern 점자 패턴 (0~63, 6-bit)
 */
void setBraillePattern(uint8_t pattern) {
  // LATCH를 LOW로 설정 (데이터 입력 준비)
  digitalWrite(LATCH_PIN, LOW);
  
  // Shift Register로 데이터 전송
  // LSBFIRST: 최하위 비트부터 전송 (DOT 1 = bit 0)
  shiftOut(DATA_PIN, CLOCK_PIN, LSBFIRST, pattern);
  
  // LATCH를 HIGH → LOW로 변경하여 출력 적용
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
 * @param c 문자 (한글, 영문, 숫자 등)
 * @return 점자 패턴 (0~63, 6-bit)
 */
uint8_t brailleCharToPattern(char c) {
  // TODO: 실제 한글 점자 매핑 구현
  // backend/data/ko_braille.json 파일 참조 필요
  
  // 한글 처리 (실제로는 자음/모음 분해 필요)
  if (c >= '가' && c <= '힣') {
    // 한글 → 점자 변환 로직
    // backend/data/ko_braille.json 참조
    // 현재는 임시 매핑
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

