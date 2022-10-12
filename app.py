import pickle
import os
import numpy

from cv_impl import detector
from cv_impl import train

from virtual_keyboard import keyboard

model = open(os.path.dirname(__file__) + '/cv_impl/model/model.pkl', 'rb')
svm = pickle.load(model)


key_mappings = {
  'thumb': 'Q',
  'index': 'W',
  'index_and_middle': 'E',
  'all': 'R'
}

def send_key_stroke(gesture):
  if gesture in key_mappings:
    key = key_mappings.get(gesture)
    keyboard.press(key)
    return gesture + ': ' + key
  else:
    return gesture

def predict(vec):
  arr = numpy.array(train.vec_to_feature(vec))
  y_pred = svm.predict(arr.reshape(-1, arr.shape[0]))
  gesture = str(y_pred[0])
  return send_key_stroke(gesture)

print('loading...');
print('key mappings', key_mappings);

detector.start('Predict', predict)
