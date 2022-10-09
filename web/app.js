const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function landmarksToVec(landmarks) {
  const ret = new Array(63);
  for (let i = 0; i < landmarks.length; i += 1) {
    ret[i * 3] = landmarks[i].x;
    ret[i * 3 + 1] = landmarks[i].y;
    ret[i * 3 + 2] = landmarks[i].z;
  }
  return ret;
}

function dispatchKey(keyCode , delay = 50) {
  const keyDownEvt = new KeyboardEvent('keydown', {
    keyCode
  });

  document.dispatchEvent(keyDownEvt);

  setTimeout(() => {
    const keyUpEvt = new KeyboardEvent('keyup', {
      keyCode
    });
    document.dispatchEvent(keyUpEvt);
  }, delay);
}


let lastCommandTime = 0;
let gameStart = 0;

function virtulKeyboard(name) {
  /**
   case 65: moveLeft(true); break;
   case 68: moveRight(true); break;
   case 83: drop(true); break;
   case 87: game._board.cur.rotate('right'); break;
   */
   const now = Date.now();
   if (lastCommandTime > now - 800) {
     return;
   }
   lastCommandTime = now;

   if (name === 'index_and_middle' && gameStart < now - 3000) {
     gameStart = now;
     $('.game').blockrain('restart');
   }

   if (name === 'thumb') {
     dispatchKey(65);
   }
   if (name === 'index') {
     dispatchKey(68);
   }
   if (name === 'all') {
     dispatchKey(87);
   }
}

function onGesture(name) {
  document.querySelector('#gesture-name').textContent = name;
  if (name === 'idle') {
    return;
  }
  virtulKeyboard(name);
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {

      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                     {color: '#00FF00', lineWidth: 5});
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

      const gesture = gesture_predict(landmarksToVec(landmarks));
      onGesture(gesture);
    }
  }
  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({
      image: videoElement
    });
  },
  width: 1280,
  height: 720
});

camera.start();

