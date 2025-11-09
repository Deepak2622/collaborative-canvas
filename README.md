# Real-Time Collaborative Drawing Canvas

A multi-user drawing web application where several people can draw simultaneously on the same canvas with real-time synchronization, live cursors, and global undo/redo.

Built as part of the Flam Collaborative Canvas Challenge (2025).

---

## Live Demo

Frontend (Vercel): https://YOUR-VERCEL-URL.vercel.app  
Backend (Render): https://collaborative-canvas-l6f7.onrender.com

---

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | HTML5 Canvas, Vanilla JavaScript, CSS |
| Backend | Node.js, Express, Socket.IO |
| Realtime | WebSockets via Socket.IO |
| Deployment | Frontend - Vercel, Backend - Render |
| Version Control | Git, GitHub |

---

## Core Features

- Drawing tools: brush, eraser, adjustable stroke width, and color picker  
- Global undo/redo that works across all users in a shared room  
- Real-time synchronization using WebSockets (Socket.IO)  
- Live user cursors with unique colors  
- Multiple isolated rooms using `?room=name` in URL  
- Server-side conflict resolution for consistent state  
- Responsive canvas layout for different screen sizes  

---

## Setup Instructions

You can run this project locally in a few steps.

### 1. Clone the Repository
```bash
git clone https://github.com/Deepak2622/collaborative-canvas.git
cd collaborative-canvas

2. Install Dependencies
npm install

3. Start the Server
npm start


The server will start at http://localhost:3000

4. Open the App

Open client/index.html in your browser, or visit the deployed Vercel link.

How to Test with Multiple Users:

Open the deployed Vercel application in two tabs or browsers.

Draw in one window and observe real-time updates in the other.

Test undo and redo to verify global synchronization.

Move the mouse and confirm cursor updates across users.

To test separate rooms, use:

https://YOUR-VERCEL-URL.vercel.app?room=test2


Each room maintains an independent collaborative session.

Known Limitations / Bugs

No persistent storage (canvas resets if backend restarts).

Undo and redo operations apply globally to all users in the same room.

Basic mobile touch support (functional but minimal).

Minor latency may occur with high concurrent users.

No authentication (anonymous user sessions).

Time Spent on the Project:
Task	Duration
Architecture and Planning	4–5 hours
Backend (Socket.IO and Express)	6–7 hours
Frontend (Canvas tools, UI)	6 hours
Debugging and Testing	3 hours
Deployment (Render and Vercel)	2 hours

Total: Approximately 3–4 days of focused work.