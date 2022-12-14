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


let lastGestureTime = 0;
let lastGesture = '';

function virtualKeyboard(gesture) {
   const now = Date.now();
   if (lastGesture === gesture && lastGestureTime > now - 300) {
     // 同样的手势最多每300ms触发一次
     return;
   }

   lastGestureTime = now;
   lastGesture = gesture;

  /**
   case 65: moveLeft(true); break;
   case 68: moveRight(true); break;
   case 83: drop(true); break;
   case 87: game._board.cur.rotate('right'); break;
  */

   switch (gesture) {
    case 'all':
      dispatchKey(83);
      break;
    case 'thumb':
      dispatchKey(65);
      break;
    case 'index':
      dispatchKey(68);
      break;
    case 'index_and_middle':
      dispatchKey(87);
      break;
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

async function requestCam() {
  const stream  = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { min: 720, ideal: 1280, max: 1280 },
      height: { min: 720, ideal: 720, max: 1280 },
      frameRate: { ideal: 30 }
    },
    audio: false
  });
  const tracks = stream.getVideoTracks();
  const settings = tracks[0].getSettings();
  return {
    settings,
    stream
  };
}

async function initApp() {
  let camRes;
  try {
    camRes = await requestCam();
  } catch (e) {
    return alert('cannot open camera');
  }

  const { settings,  stream } = camRes;
  console.log('initApp', settings);

  videoElement.width = settings.width;
  videoElement.height = settings.height;

  canvasElement.width = settings.width;
  canvasElement.height = settings.height;


  const winWidth = window.innerWidth;
  if (winWidth < 600) {
    const gameEl = document.querySelector('.game');
    gameEl.style.width = winWidth + 'px';
    gameEl.style.height = Math.ceil(winWidth * 16 / 9) + 'px';
  }


  const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    // return `/assets/@mediapipe/${file}`;
  }});

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);


  let currentPlayTime = 0;

  async function checkVideoFrame() {
    if (!videoElement.paused && videoElement.currentTime !== currentPlayTime) {
      currentPlayTime = videoElement.currentTime;
      await hands.send({
        image: videoElement
      });
    }
    requestAnimationFrame(checkVideoFrame);
  }

  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = function () {
    videoElement.play();
    requestAnimationFrame(checkVideoFrame);
  };


  document.querySelector('.container').style.display = 'flex';
  $('.game').blockrain({
    theme: 'gameboy',
    speed: 8,
    playText: 'Be a ninja',
  });
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
