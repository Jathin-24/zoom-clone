# Zoom Clone - Video Conferencing Application

A modern, real-time video conferencing application with instant messaging. Built with Node.js, Express, Socket.IO, and PeerJS. This application allows multiple users to join a room, have video calls, and chat with each other.

## ✨ Features

- 🎥 **HD Video Calls** - Crystal clear video streaming
- 🔊 **Crystal Clear Audio** - High-quality audio transmission
- 💬 **Instant Chat** - Real-time messaging within calls
- 🎯 **Easy Room Sharing** - Generate and share room links with one click
- 📱 **Mobile Responsive** - Works seamlessly on desktop and mobile
- 🔐 **No Login Required** - Start chatting immediately
- 👤 **Custom Usernames** - Set your name when joining

---

## 📁 Project Structure

```
zoom-clone/
├── server.js                # Backend server with Socket.IO
├── package.json             # Project dependencies
├── public/
│   └── script.js            # Frontend video & chat logic
├── views/
│   ├── index.ejs            # Home page (room creation/joining)
│   └── room.ejs             # Video room with chat panel
└── README.md                # This file
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
| `app.use(express.json())` | Parse JSON request bodies |
| `app.get('/', ...)` | **Root Route** - Renders home page with room creation/joining form |
| `app.post('/create-room', ...)` | **Create Room** - Generates new unique room ID and returns link |
| `app.get('/:room', ...)` | **Room Route** - Renders room.ejs template with room ID |
| `io.on('connection', ...)` | **Socket Connection** - Handles user connection to server |
| `socket.on('join-room', ...)` | **Join Room Event** - User joins specific room with ID and name |
| `socket.join(roomId)` | Adds user socket to specified room |
| `socket.to(roomId).emit('user-connected', userId, userName)` | Notifies others when user joins with their username |
| `socket.on('send-message', ...)` | **Chat Message Event** - Receives message and broadcasts to room |
| `socket.to(roomId).emit('receive-message', {...})` | Sends chat message to all users in room |
| `socket.on('disconnect', ...)` | **Disconnect Event** - User leaves room |
| `socket.to(roomId).emit('user-disconnected', userId, userName)` | Notifies others when user leaves with their username |
| `server.listen(port)` | Start server on PORT or 3000 |

#### How It Works
1. User visits `/` (home page) where they can create a new room or join existing one
2. **Create Room**: Generates unique room ID and displays shareable link
3. **Join Room**: User enters room ID to access an existing room
4. Server renders room template with the room ID
5. When user's WebSocket connects, server listens for 'join-room' event
6. Once user joins, server notifies all other users in that room about the connection
7. When user sends a message, server broadcasts it to all users in the room
8. When user disconnects, server notifies remaining users

---

### 2. **index.ejs** - Home Page Template

#### Purpose
- Provides beautiful UI for creating or joining video conference rooms
- Allows users to generate shareable room links
- Displays room ID for easy sharing with one-click copy functionality

#### Key Features

| Feature | Purpose |
|---------|---------|
| **Create Room Button** | Generates new unique room ID via `/create-room` POST endpoint |
| **Room Link Display** | Shows full URL that can be copied and shared |
| **Room ID Display** | Shows just the ID (shorter than full URL) for sharing |
| **Copy Buttons** | One-click copy to clipboard with confirmation |
| **Join Room Input** | Text field to enter room ID and join existing room |
| **Responsive Design** | Works on desktop, tablet, and mobile devices |
| **Modern UI** | Gradient backgrounds, smooth animations, professional styling |

#### Data Flow
```
User visits / → Renders index.ejs → User creates or joins room → Redirects to /:roomId → Loads room.ejs
```

---

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

### 3. **room.ejs** - Video Room Template

#### New Features Added
- **Chat Panel** - Sidebar with real-time messaging
- **Room ID Display** - Shows current room ID with copy button  
- **Video Controls** - Toggle video and audio on/off
- **Leave Button** - Exit call and return to home
- **Responsive Layout** - Adapts to mobile and desktop screens

---

### 3. **script.js** - Frontend Video Call & Chat Logic

#### Initial Setup

```javascript
const socket = io('/')                              // Connect to Socket.IO server
const videoGrid = document.getElementById('video-grid')  // Get video container
const myPeer = new Peer()                           // Create peer instance (WebRTC)
const myVideo = document.createElement('video')     // Create video element for user
const peers = {}                                    // Store active peer connections
const chatMessages = document.getElementById('chatMessages')  // Chat display area
const messageInput = document.getElementById('messageInput')  // Chat input field
let myUserName = prompt('Enter your name:')         // Get user's display name
```

#### Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| **sendMessage()** | None | Gets message from input, sends to room, adds to own chat |
| **addMessageToChat(sender, message, type)** | `sender` - User name, `message` - Text, `type` - 'own'/'other'/'system' | **Display Message** - Adds message to chat panel with sender name and timestamp |
| **getUserMedia()** | `{video: true, audio: true}` | **Get User's Camera/Mic** - Requests browser permission to access camera and microphone |
| **addVideoStream(video, stream)** | `video` - HTML element, `stream` - Media stream | **Display Video** - Sets video source and appends to grid |
| **connectToNewUser(userId, stream)** | `userId` - New user ID, `stream` - User's media stream | **Call New User** - Initiates PeerJS call to newly connected user |

#### Chat Event Listeners

| Event | Triggered By | Action |
|-------|--------------|--------|
| `sendBtn.click` or `messageInput.keypress Enter` | User action | Calls `sendMessage()` to send chat message |
| `socket.emit('send-message', roomId, message, userName)` | Client | Sends message to server to broadcast |
| `socket.on('receive-message', data)` | Server (via Socket.IO) | Receives message from other users and displays it |

#### Video Call Event Listeners

| Event | Triggered By | Action |
|-------|--------------|--------|
| `navigator.mediaDevices.getUserMedia()` | Browser permission | Captures user's camera/microphone stream, displays own video |
| `myPeer.on('call', ...)` | Remote user calls | Answers incoming call and displays remote user's video |
| `socket.on('user-connected', userId, userName)` | Server (via Socket.IO) | Someone joined the room → calls `connectToNewUser()` + shows system message |
| `socket.on('user-disconnected', userId, userName)` | Server (via Socket.IO) | Someone left the room → closes their peer connection + shows system message |
| `myPeer.on('open', ...)` | PeerJS server | User gets assigned peer ID → emits 'join-room' with user name |
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
1. **'join-room'** → User sends room ID, peer ID, and username when they join
2. **'send-message'** → User sends chat message with room ID, message text, and username
3. Server responds → Notifies other users in room

### Server → Client (Socket.IO)
1. **'user-connected'** → Alerts existing users when new user joins with their username
2. **'user-disconnected'** → Alerts users when someone leaves with their username
3. **'receive-message'** → Sends chat message to all users in room with sender info

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
