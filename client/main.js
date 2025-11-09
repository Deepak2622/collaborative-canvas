const canvasElement = document.getElementById('canvas');
const colorInput = document.getElementById('color');
const sizeInput = document.getElementById('size');
const eraserBtn = document.getElementById('eraser');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

let lastPathSegmentSent = 0;
const PATH_SEGMENT_THROTTLE = 30; 
let pathSegmentBuffer = [];
const BATCH_INTERVAL = 50;
let batchTimer = null;


let currentStrokeOpId = null;


function generateOpId() {
  return 'op_' + Math.random().toString(36).slice(2, 9);
}


colorInput.addEventListener('input', (e) => {
  window.canvasAPI.setColor(e.target.value);
});
colorInput.addEventListener('change', (e) => {
  window.canvasAPI.setColor(e.target.value);
});

const sizeValueEl = document.getElementById('size-value');
sizeInput.addEventListener('input', (e) => {
  const size = Number(e.target.value);
  window.canvasAPI.setSize(size);
  sizeValueEl.textContent = size + 'px';
});

eraserBtn.addEventListener('click', () => {
  const mode = (eraserBtn.dataset.on !== '1');
  window.canvasAPI.setEraser(mode);
  eraserBtn.dataset.on = mode ? '1' : '0';
});

undoBtn.addEventListener('click', () => {
  if (window.wsAPI) {
    window.wsAPI.undo();
  }
});

redoBtn.addEventListener('click', () => {
  if (window.wsAPI) {
    window.wsAPI.redo();
  }
});

function getXY(e) {
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}


canvasElement.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvasElement.setPointerCapture(e.pointerId);
  const p = getXY(e);

  
  currentStrokeOpId = generateOpId();

  
  if (window.canvasAPI) {
    window.canvasAPI._setCurrentOpId && window.canvasAPI._setCurrentOpId(currentStrokeOpId);
  }

  window.canvasAPI.startLocalPath(p.x, p.y);
});

canvasElement.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, { passive: false });

canvasElement.addEventListener('pointermove', (e) => {
  e.preventDefault();
  const p = getXY(e);
  const wasDrawing = window.canvasAPI.isDrawing();
  window.canvasAPI.extendLocalPath(p.x, p.y);
  if (window.wsAPI) {
    window.wsAPI.sendCursor({ x: p.x, y: p.y });

    if (wasDrawing) {
      const now = Date.now();
      if (now - lastPathSegmentSent > PATH_SEGMENT_THROTTLE) {
        const currentPath = window.canvasAPI.getCurrentPath();
        if (currentPath && currentPath.length >= 2) {
          const lastTwo = currentPath.slice(-2);

          
          pathSegmentBuffer.push({
            type: 'path_segment',
            opId: currentStrokeOpId,
            points: lastTwo,
            color: window.canvasAPI.getCurrentColor(),
            size: window.canvasAPI.getCurrentSize()
          });

          lastPathSegmentSent = now;

          if (!batchTimer) {
            batchTimer = setTimeout(() => {
              if (pathSegmentBuffer.length > 0 && window.wsAPI) {
                const latest = pathSegmentBuffer[pathSegmentBuffer.length - 1];
                window.wsAPI.emitPathSegment(latest);
                pathSegmentBuffer = [];
              }
              batchTimer = null;
            }, BATCH_INTERVAL);
          }
        }
      }
    }
  }
});

canvasElement.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

canvasElement.addEventListener('pointerup', (e) => {
  e.preventDefault();
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  pathSegmentBuffer = [];

  const stroke = window.canvasAPI.endLocalPath();
  if (stroke && window.wsAPI) {
    
    stroke.opId = currentStrokeOpId || stroke.opId;
    window.wsAPI.emitStroke(stroke);
  }

  
  currentStrokeOpId = null;
});

canvasElement.addEventListener('touchend', (e) => {
  e.preventDefault();
}, { passive: false });

window.canvasAPI.setColor(colorInput.value);
window.canvasAPI.setSize(Number(sizeInput.value));
