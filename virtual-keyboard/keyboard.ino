#include <Keyboard.h>

#define KEY_PRESS_DELAY 20
#define MAX_KEY_COUNT 3

bool led = false;
int keyCount = 0;
int keyValue = 0;

void blink() {
  digitalWrite(LED_BUILTIN, led ? HIGH : LOW);
  led = !led;
}
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(2, INPUT);
  digitalWrite(LED_BUILTIN, LOW);
  randomSeed(analogRead(5));

  Keyboard.begin();
  Serial.begin(9600);
}

void loop() {
  keyCount = 0;
  while (Serial.available() > 0) {
    keyValue = Serial.read();
    if (keyValue < 48 || keyValue > 122) {
      continue;
    }
    if (keyValue >= 58 && keyValue <= 64) {
      continue;
    }
    if (keyValue >= 91 && keyValue <= 96) {
      continue;
    }
    if (keyValue >= 65 && keyValue <= 90) {
      // 将大写字母映射为小写
      keyValue = keyValue + 32;
    }
    if (keyCount < MAX_KEY_COUNT) {
      keyCount += 1;
      Keyboard.press(keyValue);
      Serial.write(keyValue);
      delay(5);
    }
  }

  if (keyCount > 0) {
    delay(KEY_PRESS_DELAY + random(KEY_PRESS_DELAY));
    Keyboard.releaseAll();
    blink();
  }
}