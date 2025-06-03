const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// ✅ Allow CORS for both Express and Socket.IO
const allowedOrigins = [
  "https://fabulous-mandazi-745494.netlify.app", // frontend URL
  '*'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
}));

// ✅ Basic route test
app.get('/ping', (req, res) => {
  res.send('pong');
});

const server = http.createServer(app);

// ✅ Socket.IO CORS setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// ✅ WebSocket logic
io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("message", (message) => {
    socket.broadcast.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

// ✅ Error handler
function error(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}
app.use(error);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`listening on Port ${PORT}`);
});
