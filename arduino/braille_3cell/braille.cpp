#include "braille.h"

braille::braille(int dataPin, int latchPin, int clockPin, int no_module) {
  this->dataPin = dataPin;
  this->latchPin = latchPin;
  this->clockPin = clockPin;
  this->no_module = no_module;
  this->cellBuffer = new byte[no_module];
  for (int i = 0; i < no_module; i++) {
    this->cellBuffer[i] = 0;
  }
}

braille::~braille() {
  delete[] cellBuffer;
}

void braille::begin() {
  pinMode(dataPin, OUTPUT);
  pinMode(latchPin, OUTPUT);
  pinMode(clockPin, OUTPUT);
  
  digitalWrite(latchPin, LOW);
  digitalWrite(clockPin, LOW);
  digitalWrite(dataPin, LOW);
  
  all_off();
  refresh();
}

void braille::all_off() {
  for (int i = 0; i < no_module; i++) {
    cellBuffer[i] = 0;
  }
}

void braille::refresh() {
  digitalWrite(latchPin, LOW);
  
  // 셀3 → 셀2 → 셀1 순서로 전송 (왼쪽 → 중간 → 오른쪽 표시)
  for (int i = no_module - 1; i >= 0; i--) {
    shiftOut(dataPin, clockPin, LSBFIRST, cellBuffer[i]);
  }
  
  digitalWrite(latchPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(latchPin, LOW);
}

void braille::on(int module, int dot) {
  if (module >= 0 && module < no_module && dot >= 0 && dot < 6) {
    // dot 0-5 maps to bit 5-0 (MSB to LSB)
    cellBuffer[module] |= (1 << (5 - dot));
  }
}

void braille::off(int module, int dot) {
  if (module >= 0 && module < no_module && dot >= 0 && dot < 6) {
    // dot 0-5 maps to bit 5-0 (MSB to LSB)
    cellBuffer[module] &= ~(1 << (5 - dot));
  }
}

