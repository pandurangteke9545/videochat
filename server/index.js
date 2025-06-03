// // /server/index.js
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);

// // ✅ Properly initialize socket.io with CORS
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST'],
//   },
// });

// // ✅ Ping endpoint to confirm backend connectivity
// app.get('/ping', (req, res) => {
//   res.send('pong');
// });

// // ✅ Video chat logic
// let waitingUser = null;

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   if (waitingUser) {
//     // Pair the two users
//     const roomID = `${waitingUser.id}#${socket.id}`;
//     socket.join(roomID);
//     waitingUser.join(roomID);

//     // Notify both users
//     socket.emit('room-joined', { roomID, peerId: waitingUser.id });
//     waitingUser.emit('room-joined', { roomID, peerId: socket.id });

//     waitingUser = null;
//   } else {
//     waitingUser = socket;
//   }

//   socket.on('signal', ({ to, data }) => {
//     io.to(to).emit('signal', { from: socket.id, data });
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//     if (waitingUser && waitingUser.id === socket.id) {
//       waitingUser = null;
//     }
//     io.emit('peer-disconnected', socket.id);
//   });
// });

// // ✅ Listen on 0.0.0.0 for LAN access
// const PORT = 5000;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// });



// /server/index.js
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//   },
// });

// // Simple API check
// app.get('/ping', (req, res) => {
//   res.send('pong');
// });

// // Handle socket connections
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   socket.on('join', () => {
//     console.log('Join from:', socket.id);
//     socket.broadcast.emit('room-joined', {
//       peerId: socket.id,
//       createOffer: true,
//     });
//   });

//   socket.on('signal', ({ to, data }) => {
//     console.log(`Signal from ${socket.id} to ${to}`);
//     io.to(to).emit('signal', {
//       from: socket.id,
//       data,
//     });
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//     socket.broadcast.emit('peer-disconnected', socket.id);
//   });
// });

// const PORT = 5000;
// server.listen(PORT, '192.168.43.76', () => {
//   console.log(`Server running at http://192.168.43.76:${PORT}`);
// });





// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const allowedOrigins = ["https://fabulous-mandazi-745494.netlify.app"];

// app.use(cors({
//   origin: allowedOrigins,
//   methods: ["GET", "POST"],
//   credentials: true,
// }));

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// let waitingSocket = null; // store socket waiting for pair

// io.on("connection", (socket) => {
//   console.log("New user connected:", socket.id);

//   if (waitingSocket) {
//     // Pair current socket with waiting socket
//     const roomId = `room-${waitingSocket.id}-${socket.id}`;
//     socket.join(roomId);
//     waitingSocket.join(roomId);

//     // Notify both clients that they're paired
//     socket.emit("message", { type: "ready", roomId });
//     waitingSocket.emit("message", { type: "ready", roomId });

//     console.log(`Paired ${waitingSocket.id} and ${socket.id} in ${roomId}`);
//     waitingSocket = null;
//   } else {
//     // No one is waiting, so set current user as waiting
//     waitingSocket = socket;
//     console.log(`Waiting for a pair... (${socket.id})`);
//   }

//   socket.on("message", ({ roomId, ...rest }) => {
//     socket.to(roomId).emit("message", rest);
//   });

//   socket.on("disconnecting", () => {
//     if (waitingSocket?.id === socket.id) {
//       waitingSocket = null;
//     }

//     for (const roomId of socket.rooms) {
//       if (roomId !== socket.id) {
//         socket.to(roomId).emit("message", { type: "leave" });
//         console.log(`User ${socket.id} left room ${roomId}`);
//       }
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`listening on Port ${PORT}`));




const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// ✅ Allow CORS for both Express and Socket.IO
const allowedOrigins = [
  "https://fabulous-mandazi-745494.netlify.app", // frontend URL
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
