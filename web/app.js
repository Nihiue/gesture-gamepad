const svmWorker = new Worker('./svm_worker.js');

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

function virtualKeyboard(name) {
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
  virtualKeyboard(name);
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

      svmWorker.postMessage({
        type: 'predict',
        data: landmarksToVec(landmarks)
      });
    }
  }
  canvasCtx.restore();
}

async function detectCamSettings() {
  const stream  = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' }
  });
  const tracks = stream.getVideoTracks();
  const settings = tracks[0].getSettings();
  tracks.forEach(t => t.stop());
  return settings;
}

async function initApp() {
  const { aspectRatio } = await detectCamSettings();

  const vHeight = (aspectRatio > 1) ? 720 : 1280;
  const vWidth = Math.round(vHeight * aspectRatio);

  const outputEl = document.querySelector('.output_canvas');
  outputEl.width = vWidth;
  outputEl.height = vHeight;

  const winWidth = window.innerWidth;
  if (winWidth < 600) {
    const gameEl = document.querySelector('.game');
    gameEl.style.width = winWidth + 'px';
    gameEl.style.height = Math.ceil(winWidth * 16 / 9) + 'px';
  }

  document.querySelector('.container').style.display = 'flex';

  $('.game').blockrain({
    theme: 'gameboy',
    speed: 8,
    playText: 'Be a ninja',
  });

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
    width: vWidth,
    height: vHeight,
  });
  
  camera.start();
}


svmWorker.onmessage = (e) => {
  const data = e.data;
  switch (data.type) {
    case 'ready':
      initApp();
      break;
    case 'result': 
      onGesture(data.data);
      break;
  }
};
