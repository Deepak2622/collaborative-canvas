const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '..', 'client')));

const rooms = new RoomManager();

io.on('connection', (socket) => {
  const queryRoom = socket.handshake.query.room || 'main';
  const room = rooms.getRoom(queryRoom);
  const user = room.addUser(socket.id);

  socket.join(queryRoom);

  const usersList = Object.keys(room.users).map(id => ({
    userId: id,
    color: room.users[id].color
  }));

  socket.emit('init', { 
    userId: socket.id, 
    color: user.color, 
    history: room.state.getActions(),
    users: usersList
  });
  
  io.to(queryRoom).emit('user_joined', { userId: socket.id, color: user.color });
  io.to(queryRoom).emit('users_update', { users: usersList });

  socket.on('draw_event', (payload) => {
    try {
      if (!payload || typeof payload !== 'object') {
        console.warn('Invalid draw_event payload from', socket.id);
        return;
      }
      
      payload.userId = payload.userId || socket.id;
      
      if (payload.type === 'stroke') {
        if (!payload.points || !Array.isArray(payload.points) || payload.points.length === 0) {
          console.warn('Invalid stroke data from', socket.id);
          return;
        }
        
        if (payload.points.length > 10000) {
          console.warn('Stroke too large from', socket.id, '- truncated');
          payload.points = payload.points.slice(0, 10000);
        }
        
        const action = room.state.addAction(payload);
        io.to(queryRoom).emit('draw_event', action);
      } else if (payload.type === 'path_segment') {
        if (!payload.points || !Array.isArray(payload.points) || payload.points.length < 2) {
          return;
        }
        
        socket.to(queryRoom).emit('draw_event', payload);
      }
    } catch (error) {
      console.error('Error handling draw_event:', error);
    }
  });

  socket.on('cursor', (payload) => {
    socket.to(queryRoom).emit('cursor', { ...payload, userId: socket.id, color: room.users[socket.id]?.color });
  });

  socket.on('undo', () => {
    try {
      const undone = room.state.undo();
      if (undone) {
        io.to(queryRoom).emit('action_undone', { opId: undone.opId });
      }
    } catch (error) {
      console.error('Error handling undo:', error);
      socket.emit('error', { message: 'Failed to undo' });
    }
  });

  socket.on('redo', () => {
    try {
      const redone = room.state.redo();
      if (redone) {
        io.to(queryRoom).emit('action_redone', { opId: redone.opId, action: redone });
      }
    } catch (error) {
      console.error('Error handling redo:', error);
      socket.emit('error', { message: 'Failed to redo' });
    }
  });

  socket.on('request_full_state', () => {
    socket.emit('full_state', room.state.getActions());
  });

  socket.on('disconnect', (reason) => {
    try {
      room.removeUser(socket.id);
      io.to(queryRoom).emit('user_left', { userId: socket.id });
      
      const usersList = Object.keys(room.users).map(id => ({
        userId: id,
        color: room.users[id].color
      }));
      io.to(queryRoom).emit('users_update', { users: usersList });
      
      console.log(`User ${socket.id} disconnected from room ${queryRoom}. Reason: ${reason}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.PORT || 3000;

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
