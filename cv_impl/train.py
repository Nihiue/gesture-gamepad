import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, f1_score, recall_score, precision_score
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV
import seaborn as sns
import os

basedir = os.path.dirname(__file__)
def read_label_data(label):
  filename = basedir + '/data/' + label + '.csv'
  df = pd.read_csv(filename)
  df.columns = [i for i in range(df.shape[1])]
  df['label'] = label

  return df

labels = ['all', 'idle', 'index_and_middle', 'index', 'thumb']

df = pd.concat(map(read_label_data, labels))

print(df)

X = df.iloc[:, :-1]
print("Features shape =", X.shape)

Y = df.iloc[:, -1]
print("Labels shape =", Y.shape)

x_train, x_test, y_train, y_test = train_test_split(X, Y, test_size=0.2, random_state=0)
svm = SVC(C=10, gamma=0.1, kernel='rbf')
svm.fit(x_train, y_train)

y_pred = svm.predict(x_test)
print('y_pred', y_pred)


cf_matrix = confusion_matrix(y_test, y_pred)
f1 = f1_score(y_test, y_pred, average='micro')
recall = recall_score(y_test, y_pred, average='micro')
precision = precision_score(y_test, y_pred, average='micro')

print('f1, recall, precision', f1, recall, precision)

import pickle

# save model
with open(basedir + '/model/model.pkl','wb') as f:
    pickle.dump(svm,f)