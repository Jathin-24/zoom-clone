const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// Home page - room creation/joining
app.get("/", (req, res) => {
  res.render("index");
});

// Create new room endpoint
app.post("/create-room", (req, res) => {
  const roomId = uuidV4();
  res.json({ roomId: roomId, roomLink: `${req.get("host")}/${roomId}` });
});

// Join room page
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId, userName);

    // Chat functionality
    socket.on("send-message", (roomId, message, userName) => {
      socket.to(roomId).emit("receive-message", {
        userId: socket.id,
        userName: userName,
        message: message,
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId, userName);
    });
  });
});

server.listen(process.env.PORT || 3000);
