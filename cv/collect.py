import detector
import os

label = 'other'

filename = os.path.dirname(__file__) + '/data/' + label + '.csv'

data = detector.start('Capture')
print (filename, len(data));

csv = '';
for vec in data:
  csv += (','.join(map(lambda n: str(n), vec)) + '\n')

file = open(filename, mode='a+')
file.write(csv)
file.close()
