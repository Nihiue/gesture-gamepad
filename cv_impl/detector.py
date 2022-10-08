import cv2
import mediapipe as mp

def hand_landmarks_to_vec(marks):
  vec = []
  for pt in mp.solutions.hands.HandLandmark:
    m = marks.landmark[pt]
    vec.append(m.x)
    vec.append(m.y)
    vec.append(m.z)
  return vec

def start(mode = 'Default', predict = None):

  mp_drawing = mp.solutions.drawing_utils
  mp_drawing_styles = mp.solutions.drawing_styles
  mp_hands = mp.solutions.hands

  ret_data = []
  cap = cv2.VideoCapture(0)
  with mp_hands.Hands(
      model_complexity=0,
      max_num_hands=1,
      min_detection_confidence=0.5,
      min_tracking_confidence=0.5) as hands:
    while cap.isOpened():
      success, image = cap.read()
      if not success:
        print("Ignoring empty camera frame.")
        # If loading a video, use 'break' instead of 'continue'.
        continue

      # To improve performance, optionally mark the image as not writeable to
      # pass by reference.
      image.flags.writeable = False
      image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
      results = hands.process(image)

      # Draw the hand annotations on the image.
      image.flags.writeable = True
      image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
      if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
          mp_drawing.draw_landmarks(
              image,
              hand_landmarks,
              mp_hands.HAND_CONNECTIONS,
              mp_drawing_styles.get_default_hand_landmarks_style(),
              mp_drawing_styles.get_default_hand_connections_style())

      image = cv2.flip(image, 1)
      # Flip the image horizontally for a selfie-view display.
      key_press = cv2.waitKey(20) & 0b11111111

      if (key_press == 27):
        break;

      if results.multi_hand_landmarks:
        vec = hand_landmarks_to_vec(results.multi_hand_landmarks[0])
        if (mode == 'Predict'):
          gesture = predict(vec)
          image = cv2.putText(image, gesture, (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 0, 0), 2, cv2.LINE_AA)

        if mode == 'Capture' and key_press == ord('c'):
          print('Capture: ' + str(len(ret_data)))
          ret_data.append(vec)

      cv2.imshow('Gaming Like a Ninjia: ' + mode, image)

  cap.release()
  return ret_data;
