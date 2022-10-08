import detector
import pickle
import os

model = open(os.path.dirname(__file__) + '/model/model.pkl', 'rb')
svm = pickle.load(model)

detector.start('Predict', svm)