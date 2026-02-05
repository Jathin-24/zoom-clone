const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer();
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
let myUserName = `User_${Math.random().toString(36).substr(2, 9)}`;
let myStream = null; // Store the stream globally

// Chat variables
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Prompt for username
const userName = prompt("Enter your name:") || myUserName;
if (userName) myUserName = userName;

// Chat send
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Add own message to chat
  addMessageToChat(myUserName, message, "own");

  // Send to others
  socket.emit("send-message", ROOM_ID, message, myUserName);
  messageInput.value = "";
  messageInput.focus();
}

function addMessageToChat(sender, message, type = "other") {
  const messageEl = document.createElement("div");
  messageEl.className = "message";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  messageEl.innerHTML = `
    <div class="sender">${type === "own" ? "📍 You" : sender}</div>
    <div>${message}</div>
    <div class="timestamp">${time}</div>
  `;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myStream = stream; // Store stream globally for toggle functions
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      // Answer incoming call and use caller metadata (if any) to show name
      call.answer(stream);
      const video = document.createElement("video");
      const callerName =
        (call.metadata && call.metadata.userName) || "Participant";
      const callerId = call.peer; // peer id of caller
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, callerName, callerId);
      });
    });

    socket.on("user-connected", (userId, userName) => {
      addMessageToChat(
        userName || "Someone",
        `${userName || "A user"} joined the call`,
        "system",
      );
      connectToNewUser(userId, stream, userName);
    });

    // Video and Audio Toggle Handlers
    const toggleVideoBtn = document.getElementById("toggleVideo");
    const toggleAudioBtn = document.getElementById("toggleAudio");
    let videoEnabled = true;
    let audioEnabled = true;

    if (toggleVideoBtn) {
      toggleVideoBtn.addEventListener("click", function () {
        videoEnabled = !videoEnabled;
        stream.getVideoTracks().forEach((track) => {
          track.enabled = videoEnabled;
        });
        this.textContent = videoEnabled ? "📹 Video On" : "📹 Video Off";
        this.style.background = videoEnabled ? "#667eea" : "#ff6b6b";
      });
    }

    if (toggleAudioBtn) {
      toggleAudioBtn.addEventListener("click", function () {
        audioEnabled = !audioEnabled;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = audioEnabled;
        });
        this.textContent = audioEnabled ? "🔊 Audio On" : "🔊 Audio Off";
        this.style.background = audioEnabled ? "#667eea" : "#ff6b6b";
      });
    }
  })
  .catch((err) => {
    alert("Please allow camera and microphone access");
    console.error(err);
  });

socket.on("user-disconnected", (userId, userName) => {
  addMessageToChat(
    userName || "Someone",
    `${userName || "A user"} left the call`,
    "system",
  );
  if (peers[userId]) peers[userId].close();
});

socket.on("receive-message", (data) => {
  addMessageToChat(data.userName, data.message);
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, myUserName);
});

function connectToNewUser(userId, stream, userName) {
  // Pass our local username as metadata so the remote side can label our stream
  const call = myPeer.call(userId, stream, {
    metadata: { userName: myUserName },
  });
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    // Use the provided userName (from server) if available, otherwise fallback
    addVideoStream(video, userVideoStream, userName || "Participant", userId);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream, name, peerId) {
  // If a video for this peerId already exists, update its stream instead of creating duplicate
  if (peerId) {
    const existing = document.querySelector(
      `.video-wrapper[data-peer-id="${peerId}"]`,
    );
    if (existing) {
      const existingVideo = existing.querySelector("video");
      if (existingVideo) {
        existingVideo.srcObject = stream;
        existingVideo.play().catch(() => {});
        // Update name if needed
        const label = existing.querySelector(".video-name");
        if (label) label.textContent = name || label.textContent;
        return;
      }
    }
  }

  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  // Mute local stream to avoid echo
  if (stream === myStream) video.muted = true;

  video.addEventListener("loadedmetadata", () => {
    video.play().catch(() => {});
  });

  // Create wrapper for name overlay
  const wrapper = document.createElement("div");
  wrapper.className = "video-wrapper";
  if (peerId) wrapper.setAttribute("data-peer-id", peerId);

  // Add name label
  const nameLabel = document.createElement("div");
  nameLabel.className = "video-name";
  nameLabel.textContent = name || myUserName;

  wrapper.appendChild(video);
  wrapper.appendChild(nameLabel);
  videoGrid.appendChild(wrapper);

  // Update video count for responsive layout
  updateVideoGrid();
}

// Update video grid layout based on count
function updateVideoGrid() {
  const videoCount = videoGrid.querySelectorAll("video").length;

  if (videoCount === 1) {
    videoGrid.classList.add("single-user");
  } else if (videoCount > 1) {
    videoGrid.classList.remove("single-user");
  }
}
