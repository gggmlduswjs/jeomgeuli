#include "braille.h"

int dataPin = 2;
int latchPin = 3;
int clockPin = 4;
int no_module = 3;

braille bra(dataPin, latchPin, clockPin, no_module);

// 버퍼 및 문자 저장 변수
char string_buffer[100];
char string_buffer_serial[100][4];
int str_char_count = 0;
int last_cho = 0, last_jung = 0, last_jong = 0;

byte hangul_cho[19] = {
  0b00010000, 0b00010000, 0b00110000, 0b00011000, 0b00011000,
  0b00000100, 0b00100100, 0b00010100, 0b00010100, 0b00000001,
  0b00000001, 0b00111100, 0b00010001, 0b00010001, 0b00000101,
  0b00111000, 0b00101100, 0b00110100, 0b00011100
};

byte hangul2_cho[19] = {0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18};

byte hangul_jung[21] = {
  0b00101001, 0b00101110, 0b00010110, 0b00010110, 0b00011010,
  0b00110110, 0b00100101, 0b00010010, 0b00100011, 0b00101011,
  0b00101011, 0b00110111, 0b00010011, 0b00110010, 0b00111010,
  0b00111010, 0b00110010, 0b00110001, 0b00011001, 0b00011101, 0b00100110
};

byte hangul2_jung[21] = {0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20};

byte hangul_jong[28] = {
  0b00000000, 0b00100000, 0b00100000, 0b00100000, 0b00001100, 0b00001100,
  0b00001100, 0b00000110, 0b00001000, 0b00001000, 0b00001000, 0b00001000,
  0b00001000, 0b00001000, 0b00001000, 0b00001000, 0b00001001, 0b00101000,
  0b00101000, 0b00000010, 0b00000010, 0b00001111, 0b00100010, 0b00001010,
  0b00001110, 0b00001011, 0b00001101, 0b00000111
};

byte hangul2_jong[28] = {0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27};

byte ascii_data[127] = {
  0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000,
  0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000,
  0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000,
  0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000,
  0b00000000, 0b00001110, 0b00001011, 0b00000000, 0b00000000, 0b00010010, 0b00000000, 0b00000000,
  0b00001011, 0b00000001, 0b00100001, 0b00001001, 0b00000100, 0b00000110, 0b00001101, 0b00010101,
  0b00011100, 0b00100000, 0b00101000, 0b00110000, 0b00110100, 0b00100100, 0b00111000, 0b00111100,
  0b00101100, 0b00011000, 0b00000100, 0b00000101, 0b00000100, 0b00001100, 0b00000111, 0b00001011,
  0b00000000, 0b00100000, 0b00101000, 0b00110000, 0b00110100, 0b00100100, 0b00111000, 0b00111100,
  0b00101100, 0b00011000, 0b00011100, 0b00100010, 0b00101010, 0b00110010, 0b00110110, 0b00100110,
  0b00111010, 0b00111110, 0b00101110, 0b00011010, 0b00011110, 0b00100011, 0b00101011, 0b00011101,
  0b00110011, 0b00110111, 0b00100111, 0b00001011, 0b00010000, 0b00000101, 0b00000000, 0b00000011
};

void setup() {
  Serial.begin(9600);
  bra.begin();
  delay(1000);
  bra.all_off();
  bra.refresh();
}

void loop() {
  if (Serial.available()) {
    String str = Serial.readStringUntil('\n');
    str.replace("\r", "");
    str.trim();
    
    // 테스트 명령 처리
    if (str == "test") {
      test_all_dots();
      return;
    }
    if (str == "all") {
      test_all_cells_all_dots();
      delay(2000);
      bra.all_off();
      bra.refresh();
      return;
    }
    if (str.startsWith("cell")) {
      int cellNum = str.charAt(4) - '0';
      if (cellNum >= 1 && cellNum <= 3) {
        test_cell_all(cellNum - 1);
        delay(2000);
        bra.all_off();
        bra.refresh();
      }
      return;
    }
    
    // 기존 문자 입력 처리
    Serial.println("입력됨: " + str);
    
    strcpy(string_buffer, str.c_str());
    int ind = 0, len = strlen(string_buffer), index = 0;
    
    while (ind < len) {
      int bytes = get_char_byte(string_buffer + ind);
      if (bytes == 1) {
        string_buffer_serial[index][0] = *(string_buffer + ind);
        string_buffer_serial[index][1] = 0;
        index++;
      } else if (bytes == 3) {
        string_buffer_serial[index][0] = *(string_buffer + ind);
        string_buffer_serial[index][1] = *(string_buffer + ind + 1);
        string_buffer_serial[index][2] = *(string_buffer + ind + 2);
        string_buffer_serial[index][3] = 0;
        index++;
      }
      ind += bytes;
    }
    
    str_char_count = index;
    
    for (int i = 0; i < str_char_count; i++) {
      if (string_buffer_serial[i][1] == 0) {
        int code = string_buffer_serial[i][0];
        ascii_braille(code);
        delay(300);
        bra.all_off();
        bra.refresh();
        delay(100);
        Serial.print("ASCII 출력: ");
        Serial.println(ascii_data[code], BIN);
      } else {
        unsigned int cho, jung, jong;
        split_han_cho_jung_jong(string_buffer_serial[i][0], string_buffer_serial[i][1], string_buffer_serial[i][2], cho, jung, jong);
        last_cho = cho;
        last_jung = jung;
        last_jong = jong;
        han_braille(cho, jung, jong);
        delay(300);
        bra.all_off();
        bra.refresh();
        delay(100);
      }
    }
    
    Serial.println();
  }
}

void han_braille(int index1, int index2, int index3) {
  bra.all_off();
  for (int i = 0; i < 6; i++) {
    if (hangul_cho[index1] & (1 << (5 - i))) bra.on(0, i);
    if (hangul_jung[index2] & (1 << (5 - i))) bra.on(1, i);
    if (hangul_jong[index3] & (1 << (5 - i))) bra.on(2, i);
  }
  bra.refresh();
}

void ascii_braille(int code) {
  bra.all_off();
  for (int i = 0; i < 6; i++) {
    if (ascii_data[code] & (1 << (5 - i))) bra.on(0, i);
  }
  bra.refresh();
}

unsigned char get_char_byte(char *pos) {
  char val = *pos;
  if ((val & 0b10000000) == 0) return 1;
  else if ((val & 0b11100000) == 0b11000000) return 2;
  else if ((val & 0b11110000) == 0b11100000) return 3;
  else if ((val & 0b11111000) == 0b11110000) return 4;
  else if ((val & 0b11111100) == 0b11111000) return 5;
  else return 6;
}

void split_han_cho_jung_jong(char byte1, char byte2, char byte3, unsigned int &cho, unsigned int &jung, unsigned int &jong) {
  unsigned int utf16 = (byte1 & 0b00001111) << 12 | (byte2 & 0b00111111) << 6 | (byte3 & 0b00111111);
  unsigned int val = utf16 - 0xAC00;
  unsigned char _jong = val % 28;
  unsigned char _jung = (val % (28 * 21)) / 28;
  unsigned char _cho = val / (28 * 21);
  
  cho = jung = jong = 0;
  for (int i = 0; i < 19; i++) if (_cho == hangul2_cho[i]) cho = i;
  for (int i = 0; i < 21; i++) if (_jung == hangul2_jung[i]) jung = i;
  for (int i = 0; i < 28; i++) if (_jong == hangul2_jong[i]) jong = i;
}

// 테스트 함수들
void test_all_dots() {
  Serial.println("=== 모든 점 순차 테스트 시작 ===");
  
  // 각 셀의 각 점을 순차적으로 켜기
  for (int cell = 0; cell < 3; cell++) {
    Serial.print("셀 ");
    Serial.print(cell + 1);
    Serial.println(" 테스트");
    
    for (int dot = 0; dot < 6; dot++) {
      bra.all_off();
      bra.on(cell, dot);
      bra.refresh();
      Serial.print("  점 ");
      Serial.print(dot + 1);
      Serial.println(" 켜기");
      delay(500);
    }
  }
  
  Serial.println("=== 테스트 완료 ===");
}

void test_cell_all(int cell) {
  bra.all_off();
  for (int dot = 0; dot < 6; dot++) {
    bra.on(cell, dot);
  }
  bra.refresh();
}

void test_all_cells_all_dots() {
  bra.all_off();
  for (int cell = 0; cell < 3; cell++) {
    for (int dot = 0; dot < 6; dot++) {
      bra.on(cell, dot);
    }
  }
  bra.refresh();
}
