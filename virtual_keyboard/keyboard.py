import time
import serial

ser = serial.Serial('COM8', 9600, timeout=30)

last_press = 0

def press(k):
  global last_press
  now = time.time()
  if now - last_press > 0.5:
    last_press = now
    ser.write(k.encode())
