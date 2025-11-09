# Collaborative Canvas

A real-time collaborative drawing canvas application built with Vanilla JavaScript, HTML5 Canvas, Node.js, and WebSockets. Multiple users can draw simultaneously on a shared canvas with real-time synchronization, undo/redo functionality, and user management.

## Features

- **Real-time Collaborative Drawing**: Multiple users can draw simultaneously with instant synchronization
- **Drawing Tools**: Brush, eraser, color picker, and adjustable stroke width
- **Global Undo/Redo**: Server-side undo/redo operations synchronized across all clients
- **User Management**: Visual indicators showing online users with assigned colors
- **Live Cursor Tracking**: See other users' cursor positions in real-time
- **Multiple Rooms**: Support for different drawing rooms via URL parameters
- **Client-side Prediction**: Immediate local feedback for low-latency drawing experience
- **Path Optimization**: Efficient stroke rendering with point reduction
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (>= 18.0.0)
- npm (>= 9.0.0)

## Setup Instructions

1. **Clone or download the repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

The application should now be running and ready to use!

## Development Mode

For development with auto-reload:
```bash
npm run dev
```

## How to Test with Multiple Users

### Method 1: Multiple Browser Windows/Tabs

1. Start the server: `npm start`
2. Open `http://localhost:3000` in your browser
3. Open the same URL in another browser window or tab
4. Start drawing in both windows - you should see each other's drawings in real-time

### Method 2: Multiple Devices on Same Network

1. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. Start the server: `npm start`
3. On each device, open: `http://YOUR_IP_ADDRESS:3000`
4. Test drawing simultaneously from different devices

### Method 3: Different Rooms

1. Open `http://localhost:3000` (main room)
2. Open `http://localhost:3000?room=room1` (different room)
3. Users in different rooms won't see each other's drawings
4. Users in the same room will see each other's drawings

## Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html      # Main HTML file
│   ├── style.css       # Stylesheet
│   ├── canvas.js       # Canvas drawing logic
│   ├── websocket.js    # WebSocket connection management
│   └── main.js         # Event handlers and coordination
├── server/
│   ├── server.js       # Express server and Socket.io setup
│   ├── rooms.js        # Room management
│   └── drawing-state.js # State management with undo/redo
├── package.json
├── Procfile            # Heroku deployment config
└── README.md
```

## Known Limitations

1. **No Persistent Storage**: Drawing state is lost when the server restarts. All drawings are stored in memory only.

2. **No Authentication**: Users are identified only by socket ID. No user accounts or authentication system.

3. **Limited Stroke Size**: Maximum stroke size is capped at 40px for UI consistency.

4. **No Drawing History Export**: Cannot save or export drawings as images or files.

5. **No Drawing Tools**: Only basic brush and eraser. No shapes, text, or other drawing tools.

6. **No Layer Management**: All drawings are on a single layer.

7. **Memory Usage**: Large drawings with many strokes can consume significant server memory over time.

8. **No Offline Support**: Requires active server connection. No offline drawing capability.

9. **Browser Compatibility**: Requires modern browsers with WebSocket and Canvas API support.

10. **No Rate Limiting**: No protection against spam or excessive drawing events (though basic validation exists).

## Time Spent on Project

- **Initial Setup & Architecture**: 2 hours
  - Project structure setup
  - WebSocket connection handling
  - Basic drawing functionality

- **Real-time Synchronization**: 3 hours
  - Path segment streaming
  - Client-side prediction
  - Event throttling and batching
  - Conflict resolution

- **Undo/Redo Implementation**: 2 hours
  - Operation-based CRDT design
  - Global state synchronization
  - Full state replay mechanism

- **User Management & UI**: 2 hours
  - User list display
  - Cursor tracking
  - Color assignment
  - Status indicators

- **Canvas Optimization**: 2 hours
  - Path optimization
  - Device pixel ratio handling
  - Efficient redrawing with requestAnimationFrame
  - Double-drawing prevention

- **Error Handling & Robustness**: 1.5 hours
  - Reconnection logic
  - Input validation
  - Error boundaries
  - Graceful degradation

- **UI/UX Polish**: 1.5 hours
  - Modern interface design
  - Responsive layout
  - Visual feedback
  - Status indicators

- **Testing & Debugging**: 2 hours
  - Multi-user testing
  - Edge case handling
  - Performance optimization

**Total Estimated Time: ~16 hours**

## Deployment

See `DEPLOYMENT.md` for Heroku deployment instructions.



