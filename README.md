# Zoom Clone - Video Conferencing Application

A real-time video conferencing application built with Node.js, Express, Socket.IO, and PeerJS. This application allows multiple users to join a room and have video calls with each other.

---

## 📁 Project Structure

```
zoom-clone/
├── server.js          # Backend server
├── package.json       # Project dependencies
├── public/
│   └── script.js      # Frontend video call logic
├── views/
│   └── room.ejs       # HTML template for video room
└── README.md          # This file
```

---

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: HTML, CSS, JavaScript
- **Peer Connection**: PeerJS (WebRTC)
- **Other**: EJS (templating), UUID (room IDs)

---

## 📋 File-by-File Explanation

### 1. **server.js** - Backend Server

#### Dependencies
```javascript
const express = require('express')           // Web framework
const app = express()
const server = require('http').Server(app)   // HTTP server
const io = require('socket.io')(server)      // Real-time communication
const { v4: uuidV4 } = require('uuid')       // Generate unique room IDs
```

#### Functions & Routes

| Function | Purpose |
|----------|---------|
| `app.set('view engine', 'ejs')` | Configure EJS as templating engine |
| `app.use(express.static('public'))` | Serve static files from public folder |
| `app.get('/', ...)` | **Root Route** - Generates new unique room ID and redirects user |
| `app.get('/:room', ...)` | **Room Route** - Renders room.ejs template with room ID |
| `io.on('connection', ...)` | **Socket Connection** - Handles user connection to server |
| `socket.on('join-room', ...)` | **Join Room Event** - User joins specific room |
| `socket.join(roomId)` | Adds user socket to specified room |
| `socket.to(roomId).emit('user-connected', userId)` | Notifies others when user joins |
| `socket.on('disconnect', ...)` | **Disconnect Event** - User leaves room |
| `socket.to(roomId).emit('user-disconnected', userId)` | Notifies others when user leaves |
| `server.listen(3000)` | Start server on port 3000 |

#### How It Works
1. When user visits `/`, a unique room ID is generated and they are redirected to `/:room`
2. Server renders room template with their unique room ID
3. When user's WebSocket connects, server listens for 'join-room' event
4. Once user joins, server notifies all other users in that room about the connection
5. When user disconnects, server notifies remaining users in the room

---

### 2. **room.ejs** - HTML Template

#### Purpose
- Provides the UI structure for the video call room
- Loads necessary libraries and scripts
- Creates a video grid container for displaying videos

#### Key Elements

| Element | Purpose |
|---------|---------|
| `<script>const ROOM_ID = "<%= roomId %>"</script>` | Embeds server-generated room ID into client-side JavaScript |
| `<script src="https://unpkg.com/peerjs@1.2.0/dist/peerjs.min.js">` | Loads PeerJS library for WebRTC peer-to-peer connection |
| `<script src="/socket.io/socket.io.js">` | Loads Socket.IO client library |
| `<script src="script.js">` | Loads main video call logic |
| `<div id="video-grid"></div>` | Container where video elements are dynamically added |
| CSS Grid Layout | Displays videos in responsive grid (max 300x300px per video) |

#### Data Flow
```
Server renders room.ejs → ROOM_ID injected into page → Browser loads script.js → Script uses ROOM_ID to join the room
```

---

### 3. **script.js** - Frontend Video Call Logic

#### Initial Setup

```javascript
const socket = io('/')                              // Connect to Socket.IO server
const videoGrid = document.getElementById('video-grid')  // Get video container
const myPeer = new Peer()                           // Create peer instance (WebRTC)
const myVideo = document.createElement('video')     // Create video element for user
myVideo.muted = true                                // Mute own audio to prevent echo
const peers = {}                                    // Store active peer connections
```

#### Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| **getUserMedia()** | `{video: true, audio: true}` | **Get User's Camera/Mic** - Requests browser permission to access camera and microphone |
| **addVideoStream(video, stream)** | `video` - HTML element, `stream` - Media stream | **Display Video** - Sets video source and appends to grid |
| **connectToNewUser(userId, stream)** | `userId` - New user ID, `stream` - User's media stream | **Call New User** - Initiates PeerJS call to newly connected user |

#### Event Listeners

| Event | Triggered By | Action |
|-------|--------------|--------|
| `navigator.mediaDevices.getUserMedia()` | Browser permission | Captures user's camera/microphone stream, displays own video |
| `myPeer.on('call', ...)` | Remote user calls | Answers incoming call and displays remote user's video |
| `socket.on('user-connected', ...)` | Server (via Socket.IO) | Someone joined the room → calls `connectToNewUser()` |
| `socket.on('user-disconnected', ...)` | Server (via Socket.IO) | Someone left the room → closes their peer connection and removes video |
| `myPeer.on('open', ...)` | PeerJS server | User gets assigned peer ID → emits 'join-room' to notify server |
| `call.on('stream', ...)` | Remote user's media | Receives remote user's video stream and displays it |
| `call.on('close', ...)` | Remote user disconnects | Removes remote user's video from DOM |
| `video.addEventListener('loadedmetadata', ...)` | Video loaded | Starts playing video |

---

## 🔄 Communication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZOOM CLONE COMMUNICATION FLOW                  │
└─────────────────────────────────────────────────────────────────┘

STEP 1: User A Joins Room
  ┌──────────────┐
  │   User A     │
  │  Browser     │
  └──────┬───────┘
         │ visits localhost:3000/:room1
         ▼
  ┌──────────────────────┐
  │  Express Server      │
  │  (server.js)         │
  │  renders room.ejs    │
  └──────┬───────────────┘
         │ sends room1 to client
         ▼
  ┌──────────────────────┐
  │  Browser gets:       │
  │  - ROOM_ID = room1   │
  │  - Loads script.js   │
  └──────┬───────────────┘
         │ script.js: myPeer gets ID from PeerJS cloud
         ▼
  ┌──────────────────────┐
  │  myPeer.on('open')   │
  │  emits 'join-room'   │
  │  to server           │
  └──────┬───────────────┘
         │ via Socket.IO
         ▼
  ┌──────────────────────┐
  │  Server:             │
  │  socket.join(room1)  │
  │  Now in room1        │
  └──────────────────────┘


STEP 2: User B Joins Same Room (room1)
  ┌──────────────┐
  │   User B     │
  │  Browser     │
  └──────┬───────┘
         │ visits localhost:3000/:room1
         ▼
  ┌──────────────────────┐
  │  Browser gets:       │
  │  ROOM_ID = room1     │
  │  Loads script.js     │
  └──────┬───────────────┘
         │ myPeer gets ID, emits 'join-room'
         ▼
  ┌──────────────────────────────────────┐
  │  Server receives 'join-room'          │
  │  socket.to(room1).emit('user-connected', userB_id)
  └──────┬───────────────────────────────┘
         │ Notifies User A about User B
         ▼
  ┌──────────────────────┐
  │   User A Browser     │
  │  socket receives:    │
  │  'user-connected'    │
  │  event with userB_id │
  └──────┬───────────────┘
         │ calls connectToNewUser(userB_id, stream)
         ▼
  ┌──────────────────────────────────────┐
  │  User A's Peer initiates call to B   │
  │  myPeer.call(userB_id, userA_stream) │
  └──────┬───────────────────────────────┘
         │ Direct peer connection (WebRTC)
         ▼
  ┌──────────────────────┐
  │   User B Browser     │
  │  myPeer.on('call')   │
  │  receives call       │
  └──────┬───────────────┘
         │ call.answer(userB_stream)
         ▼
  ┌──────────────────────────────────────┐
  │  WebRTC Peer Connection Established  │
  │  User A ◄──────► User B              │
  │  Exchange video streams directly     │
  └──────────────────────────────────────┘


STEP 3: Users See Videos
  ┌─────────────────────────────────────────┐
  │  Both users:                            │
  │  call.on('stream', userVideoStream)    │
  │  addVideoStream(video, userVideoStream) │
  │  Videos displayed in #video-grid       │
  └─────────────────────────────────────────┘


STEP 4: User A Disconnects
  ┌──────────────┐
  │   User A     │
  │ Closes tab   │
  └──────┬───────┘
         │ Socket disconnects
         ▼
  ┌──────────────────────┐
  │  Server receives:    │
  │  socket.on          │
  │  ('disconnect')      │
  └──────┬───────────────┘
         │ socket.to(room1).emit('user-disconnected', userA_id)
         ▼
  ┌──────────────────────┐
  │   User B Browser     │
  │  socket receives:    │
  │  'user-disconnected' │
  └──────┬───────────────┘
         │ if(peers[userA_id]) peers[userA_id].close()
         ▼
  ┌──────────────────────────────────────┐
  │  User A's video removed from grid    │
  │  Peer connection closed              │
  └──────────────────────────────────────┘
```

---

## 📡 Data Flow Summary

### Client → Server (Socket.IO)
1. **'join-room'** → User sends room ID and peer ID when they join
2. Server responds → Notifies other users in room

### Server → Client (Socket.IO)
1. **'user-connected'** → Alerts existing users when new user joins
2. **'user-disconnected'** → Alerts users when someone leaves

### Peer to Peer (WebRTC)
1. User A calls User B with their media stream
2. User B answers with their media stream
3. Media streams exchanged directly (no server in between)

---

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Start server with nodemon (auto-restart on changes)
npm run devStart

# Server runs on http://localhost:3000
```

**To test:**
1. Open `http://localhost:3000` in two browser tabs
2. Both tabs automatically get the same room ID
3. Both should display each other's video streams

---

## 🔑 Key Concepts

### Socket.IO (Real-time Communication)
- Used for **room management** and **user notifications**
- Tells users when others join/leave
- Does NOT transfer video/audio data

### PeerJS (WebRTC)
- Establishes **direct peer-to-peer connections** between users
- Transfers **actual video and audio streams**
- Works via browser's native WebRTC APIs

### Why Both?
- **Socket.IO**: Manages room logic (who joined, who left)
- **PeerJS**: Handles actual media streaming (more efficient than server relay)

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No video showing | Camera/mic not permitted | Allow permission when browser asks |
| Only see own video | Other user not connecting | Check console for errors, refresh page |
| Video freezes | Network issue | Check internet connection |
| Connection fails | PeerJS cloud server down | Switch to local PeerJS server |

---

## 📦 Dependencies

- **express**: Web framework for Node.js
- **socket.io**: Real-time bidirectional communication
- **ejs**: Templating engine
- **uuid**: Generate unique room IDs
- **peerjs**: WebRTC wrapper library
- **nodemon**: Auto-restart server during development

---

## 📝 License

This project is open source and available under the ISC license.
