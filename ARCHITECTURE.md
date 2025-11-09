+---------------------------+
|        Frontend           |
|  (Vercel - HTML/CSS/JS)   |
|---------------------------|
| - Canvas Drawing          |
| - Cursor Tracking         |
| - Undo/Redo UI            |
| - WebSocket Client (io)   |
+-------------+-------------+
              |
              | Socket.IO (WebSockets)
              v
+---------------------------+
|         Backend            |
| (Render - Node.js/Express) |
|---------------------------|
| - Room Management          |
| - State Synchronization    |
| - Undo/Redo Stack          |
| - Conflict Resolution      |
+----------------------------+

Data Flow
User A              Backend Server              User B
  |                       |                       |
  |---- draw_event ----->  |                       |
  |                       |--- broadcast --------> |
  | <--- draw_event ------ |                       |


WebSocket protocol
The communication between the client and server is handled through WebSocket events using Socket.IO. When a user joins a session, the server sends an init event that includes the initial canvas state, the user’s assigned color, and any previously drawn history. The draw_event is used bidirectionally between client and server to transmit live drawing strokes. As a user moves the cursor, cursor events are exchanged both ways to update other users’ pointer positions in real time.

Undo and redo operations are initiated by the client through undo and redo events, which request the server to reverse or reapply previous drawing actions. When these operations are processed, the server broadcasts action_undone and action_redone events to all connected clients, ensuring that everyone’s canvas reflects the same updated state.

Finally, the users_update event is sent from the server to all clients whenever there is a change in the active user list, such as when someone joins or leaves the session. This keeps every participant’s user interface synchronized with the current set of connected users.

Undo/Redo Strategy:

The undo and redo system is designed to maintain consistency across all connected users.
Each drawing operation is stored in a history stack on the server. The stack behaves as follows:

Add Action
Each stroke event from a user is appended to the actions list in the room’s state.

Undo Action
When any user triggers undo, the server removes the most recent operation (based on its index or operation ID) from the stack and broadcasts an action_undone message to all clients.
Each client re-renders the canvas without that stroke.

Redo Action
Redone operations are stored temporarily in a redo stack. When a redo event is triggered, the server restores the last undone action and broadcasts an action_redone event.

Consistency
All undo/redo operations are global, ensuring all users share the exact same visual state.

Performance Decisions:

To achieve smooth drawing performance and low latency under high-frequency events, the following optimizations were implemented:

Path Optimization
Consecutive points with minimal distance are discarded to reduce data transmission size.

Incremental Updates
Instead of sending full strokes continuously, the client sends smaller path_segment messages during drawing and one complete stroke at the end.

Curve Smoothing
Simple quadratic interpolation is applied to produce visually smooth curves.

Redraw Scheduling
All rendering updates use requestAnimationFrame() to minimize flicker and reduce unnecessary repaints.

Data Throttling
Mousemove/touchmove events are sampled at a controlled rate to balance performance and precision.

Efficient History Replay
When re-rendering (e.g., after undo/redo), only relevant actions are redrawn instead of the entire canvas when possible.

Conflict Resolution:

Simultaneous drawing by multiple users can lead to overlapping strokes or conflicting updates. The following strategies are used to maintain consistency:

Server as the Source of Truth
The backend maintains the authoritative list of all actions.
Clients treat server-confirmed actions as final and reconcile local predictions accordingly.

Sequential Operation IDs
Each stroke has a unique opId. Undo/redo or redraw actions reference these IDs directly, avoiding ambiguity.

Non-Blocking Drawing
Clients draw immediately (optimistic rendering) but still listen for server confirmations to update any missing metadata (like assigned opId).

Room Isolation
Each room maintains its own user list and history stack, ensuring no interference between rooms.

Network Resilience
Auto-reconnection logic ensures that after temporary disconnections, clients re-request the full state (request_full_state) and synchronize instantly.