const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let dpr = window.devicePixelRatio || 1;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const temp = document.createElement('canvas');
  temp.width = canvas.width;
  temp.height = canvas.height;
  temp.getContext('2d').drawImage(canvas, 0, 0);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.drawImage(temp, 0, 0);
}
window.addEventListener('resize', resize);
resize();

let isDrawing = false;
let currentPath = [];
let strokeColor = '#000';
let strokeSize = 4;
let erasing = false;
let pendingStroke = null;
const activePathSegments = {};
const drawnStrokes = new Map();
let redrawScheduled = false;

function getCanvasCoords(x, y) {
  const rect = canvas.getBoundingClientRect();
  return { x: x - rect.left, y: y - rect.top };
}

function optimizePath(points, minDistance = 2) {
  if (points.length <= 2) return points;
  const optimized = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = optimized[optimized.length - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= minDistance) optimized.push(curr);
  }
  optimized.push(points[points.length - 1]);
  return optimized;
}

function smoothPath(points, tension = 0.5) {
  if (points.length < 3) return points;
  const smoothed = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    smoothed.push({ x: cp1x, y: cp1y });
    smoothed.push(p1);
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
}

function drawStroke(points, color, size, smooth = false) {
  if (!points || points.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  if (smooth && points.length >= 3) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 2; i += 2) {
      const cp = points[i];
      const p = points[i + 1];
      ctx.quadraticCurveTo(cp.x, cp.y, p.x, p.y);
    }
    if (points.length % 2 === 0)
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  } else {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function replay(actions) {
  if (redrawScheduled) return;
  redrawScheduled = true;
  requestAnimationFrame(() => {
    drawnStrokes.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const a of actions) {
      if (a.type === 'stroke') {
        if (a.opId) drawnStrokes.set(a.opId, a);
        drawStroke(a.points, a.color, a.size, a.points.length >= 3);
      }
    }
    redrawActiveSegments();
    redrawScheduled = false;
  });
}

function redrawActiveSegments() {
  if (redrawScheduled) return;
  redrawScheduled = true;
  requestAnimationFrame(() => {
    for (const key in activePathSegments) {
      const seg = activePathSegments[key];
      if (seg && seg.points && seg.points.length >= 2)
        drawStroke(seg.points, seg.color, seg.size);
    }
    redrawScheduled = false;
  });
}

window.canvasAPI = {
  startLocalPath(x, y) {
    isDrawing = true;
    const coords = getCanvasCoords(x, y);
    currentPath = [coords];
  },

  extendLocalPath(x, y) {
    if (!isDrawing) return;
    const coords = getCanvasCoords(x, y);
    if (currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1];
      drawStroke(
        [lastPoint, coords],
        erasing ? '#ffffff' : strokeColor,
        erasing ? strokeSize * 2 : strokeSize
      );
    }
    currentPath.push(coords);
  },

  endLocalPath() {
    if (!isDrawing) return null;
    isDrawing = false;
    const optimizedPath = optimizePath(currentPath, 1.5);
    const smoothedPath =
      currentPath.length >= 3 ? smoothPath(optimizedPath, 0.3) : optimizedPath;
    const stroke = {
      opId: null,
      userId: null,
      type: 'stroke',
      points: smoothedPath,
      color: erasing ? '#ffffff' : strokeColor,
      size: erasing ? strokeSize * 2 : strokeSize,
      ts: Date.now(),
    };
    currentPath = [];
    pendingStroke = stroke;
    if (window.wsAPI && window.wsAPI.getUserId && window.wsAPI.getUserId())
      delete activePathSegments[window.wsAPI.getUserId()];
    return stroke;
  },

  drawRemote(payload) {
    if (payload.type === 'stroke') {
      if (
        pendingStroke &&
        pendingStroke.points &&
        payload.points &&
        pendingStroke.points.length === payload.points.length &&
        Math.abs(pendingStroke.ts - payload.ts) < 1000
      ) {
        pendingStroke.opId = payload.opId;
        if (payload.opId) drawnStrokes.set(payload.opId, payload);
        pendingStroke = null;
        return;
      }
      if (payload.userId) delete activePathSegments[payload.userId];
      if (payload.opId) drawnStrokes.set(payload.opId, payload);
      drawStroke(payload.points, payload.color, payload.size, payload.points.length >= 3);
    }
  },

  removeStroke(opId) {
    if (drawnStrokes.has(opId)) {
      drawnStrokes.delete(opId);
      if (redrawScheduled) return;
      redrawScheduled = true;
      requestAnimationFrame(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const stroke of drawnStrokes.values()) {
          if (stroke.type === 'stroke')
            drawStroke(stroke.points, stroke.color, stroke.size, stroke.points.length >= 3);
        }
        redrawActiveSegments();
        redrawScheduled = false;
      });
    }
  },

  addStroke(action) {
    if (action.opId && action.type === 'stroke') {
      drawnStrokes.set(action.opId, action);
      drawStroke(action.points, action.color, action.size, action.points.length >= 3);
    }
  },

  drawPathSegment(payload) {
    const key = payload.opId || payload.userId;
    if (key && payload.points && payload.points.length >= 2) {
      activePathSegments[key] = {
        points: payload.points,
        color: payload.color,
        size: payload.size,
      };
      redrawActiveSegments();
    }
  },

  replay,
  setColor(c) {
    strokeColor = c;
  },
  setSize(s) {
    strokeSize = s;
  },
  setEraser(flag) {
    erasing = flag;
  },
  getCurrentPath() {
    return currentPath;
  },
  getCurrentColor() {
    return erasing ? '#ffffff' : strokeColor;
  },
  getCurrentSize() {
    return erasing ? strokeSize * 2 : strokeSize;
  },
  isDrawing() {
    return isDrawing;
  },
  _setCurrentOpId(opId) {
    this._currentOpId = opId;
  },
};
