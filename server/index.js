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
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Simple API check
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', () => {
    console.log('Join from:', socket.id);
    socket.broadcast.emit('room-joined', {
      peerId: socket.id,
      createOffer: true,
    });
  });

  socket.on('signal', ({ to, data }) => {
    console.log(`Signal from ${socket.id} to ${to}`);
    io.to(to).emit('signal', {
      from: socket.id,
      data,
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('peer-disconnected', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
