const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room') || 'main';

const socket = io({ 
  query: { room },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000
});

const cursorsDiv = document.getElementById('cursors');
const usersListDiv = document.getElementById('users-list');
const userCursors = {};
let userListItems = {};
let currentUserId = null;
let currentUserColor = null;
let isConnected = false;
let reconnectAttempts = 0;

socket.on('connect', () => {
  isConnected = true;
  reconnectAttempts = 0;
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.className = 'status-indicator connected';
    statusEl.querySelector('.status-text').textContent = 'Connected';
  }
  console.log('Connected to server');
});

socket.on('disconnect', (reason) => {
  isConnected = false;
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.className = 'status-indicator';
    statusEl.querySelector('.status-text').textContent = 'Disconnected';
  }
  console.log('Disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  reconnectAttempts = attemptNumber;
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.className = 'status-indicator connected';
    statusEl.querySelector('.status-text').textContent = 'Reconnected';
  }
  console.log('Reconnected after', attemptNumber, 'attempts');
  socket.emit('request_full_state');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.className = 'status-indicator reconnecting';
    statusEl.querySelector('.status-text').textContent = `Reconnecting... (${attemptNumber})`;
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.className = 'status-indicator';
    statusEl.querySelector('.status-text').textContent = 'Connection Error';
  }
});

socket.on('init', (data) => {
  try {
    if (!data || !data.userId) {
      console.error('Invalid init data received');
      return;
    }
    
    currentUserId = data.userId;
    currentUserColor = data.color || '#000000';
    
    if (data.history && Array.isArray(data.history)) {
      if (window.canvasAPI && window.canvasAPI.replay) {
        window.canvasAPI.replay(data.history);
      }
    }
    
    if (data.users && Array.isArray(data.users)) {
      updateUsersList(data.users);
    }
  } catch (error) {
    console.error('Error handling init event:', error);
  }
});

socket.on('draw_event', (payload) => {
  try {
    if (!payload || !payload.type) {
      console.warn('Invalid draw_event payload:', payload);
      return;
    }
    
    if (!window.canvasAPI) {
      console.error('canvasAPI not available');
      return;
    }
    
    if (payload.type === 'stroke') {
      if (payload.points && Array.isArray(payload.points) && payload.points.length > 0) {
        window.canvasAPI.drawRemote(payload);
      }
    } else if (payload.type === 'path_segment') {
      if (payload.points && Array.isArray(payload.points) && payload.points.length >= 2) {
        window.canvasAPI.drawPathSegment(payload);
      }
    }
  } catch (error) {
    console.error('Error handling draw_event:', error);
  }
});

socket.on('cursor', (payload) => {
  try {
    if (!payload || !payload.userId || payload.x === undefined || payload.y === undefined) {
      return;
    }
    
    if (payload.userId === currentUserId) {
      return;
    }
    
    let el = userCursors[payload.userId];
    if (!el) {
      el = document.createElement('div');
      el.className = 'cursor';
      el.style.background = payload.color || '#000';
      if (cursorsDiv) {
        cursorsDiv.appendChild(el);
      }
      userCursors[payload.userId] = el;
    }
    el.style.left = payload.x + 'px';
    el.style.top = payload.y + 'px';
  } catch (error) {
    console.error('Error handling cursor event:', error);
  }
});

socket.on('user_left', ({ userId }) => {
  const el = userCursors[userId];
  if (el) {
    el.remove();
    delete userCursors[userId];
  }
});

function updateUsersList(users) {
  try {
    if (!usersListDiv || !Array.isArray(users)) {
      return;
    }
    
    const userCountEl = document.getElementById('user-count');
    if (userCountEl) {
      userCountEl.textContent = users.length;
    }
    
    usersListDiv.innerHTML = '';
    userListItems = {};
    
    users.forEach(({ userId, color }) => {
      if (!userId) return;
      
      const item = document.createElement('div');
      item.className = 'user-item';
      
      const colorEl = document.createElement('div');
      colorEl.className = 'user-color';
      colorEl.style.background = color || '#000000';
      
      const nameEl = document.createElement('div');
      nameEl.className = 'user-name';
      const shortId = userId.substring(0, 8);
      nameEl.textContent = userId === currentUserId ? `You (${shortId})` : `User ${shortId}`;
      
      item.appendChild(colorEl);
      item.appendChild(nameEl);
      usersListDiv.appendChild(item);
      userListItems[userId] = item;
    });
  } catch (error) {
    console.error('Error updating users list:', error);
  }
}

socket.on('user_joined', ({ userId, color }) => {
});

socket.on('users_update', ({ users }) => {
  updateUsersList(users);
});

socket.on('full_state', (actions) => {
  try {
    if (!Array.isArray(actions)) {
      console.warn('Invalid full_state data:', actions);
      return;
    }
    
    if (window.canvasAPI && window.canvasAPI.replay) {
      window.canvasAPI.replay(actions);
    }
  } catch (error) {
    console.error('Error handling full_state:', error);
  }
});

window.wsAPI = {
  emitStroke(stroke) {
    if (!isConnected) {
      console.warn('Cannot emit stroke: not connected');
      return;
    }
    
    try {
      if (!stroke || !stroke.points || !Array.isArray(stroke.points) || stroke.points.length === 0) {
        console.warn('Invalid stroke data:', stroke);
        return;
      }
      
      stroke.userId = currentUserId;
      stroke.type = stroke.type || 'stroke';
      socket.emit('draw_event', stroke);
    } catch (error) {
      console.error('Error emitting stroke:', error);
    }
  },
  
  emitPathSegment(segment) {
    if (!isConnected) {
      return;
    }
    
    try {
      if (!segment || !segment.points || !Array.isArray(segment.points) || segment.points.length < 2) {
        return;
      }
      
      segment.userId = currentUserId;
      segment.type = segment.type || 'path_segment';
      socket.emit('draw_event', segment);
    } catch (error) {
      console.error('Error emitting path segment:', error);
    }
  },
  
  sendCursor(payload) {
    if (!isConnected) {
      return;
    }
    
    try {
      if (payload && typeof payload.x === 'number' && typeof payload.y === 'number') {
        socket.emit('cursor', payload);
      }
    } catch (error) {
      console.error('Error sending cursor:', error);
    }
  },
  
  undo() {
    if (!isConnected) {
      console.warn('Cannot undo: not connected');
      return;
    }
    socket.emit('undo');
  },
  
  redo() {
    if (!isConnected) {
      console.warn('Cannot redo: not connected');
      return;
    }
    socket.emit('redo');
  },
  
  getUserId() {
    return currentUserId;
  },
  
  getUserColor() {
    return currentUserColor;
  },
  
  isConnected() {
    return isConnected;
  }
};

