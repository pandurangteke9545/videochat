// /server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingUser) {
    // Pair the two users
    const roomID = `${waitingUser.id}#${socket.id}`;
    socket.join(roomID);
    waitingUser.join(roomID);

    // Notify both users
    socket.emit('room-joined', { roomID, peerId: waitingUser.id });
    waitingUser.emit('room-joined', { roomID, peerId: socket.id });

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
    io.emit('peer-disconnected', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
