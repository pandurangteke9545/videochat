// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();

// // ✅ Allow CORS for both Express and Socket.IO
// const allowedOrigins = [
//   "https://fabulous-mandazi-745494.netlify.app", // frontend URL
//   '*'
// ];

// app.use(cors({
//   origin: allowedOrigins,
//   methods: ["GET", "POST"],
//   credentials: true,
// }));

// // ✅ Basic route test
// app.get('/ping', (req, res) => {
//   res.send('pong');
// });

// const server = http.createServer(app);

// // ✅ Socket.IO CORS setup
// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   }
// });

// // ✅ WebSocket logic
// io.on("connection", (socket) => {
//   console.log("Connected");

//   socket.on("message", (message) => {
//     // console.log("this is the new message",message)
//     socket.broadcast.emit("message", message);
//   });

//   socket.on("disconnect", () => {
//     console.log("Disconnected");
//   });
// });

// // ✅ Error handler
// function error(err, req, res, next) {
//   console.error(err.stack);
//   res.status(500).send("Internal Server Error");
// }
// app.use(error);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`listening on Port ${PORT}`);
// });


// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);

// const allowedOrigins = ["https://fabulous-mandazi-745494.netlify.app","http://localhost:5173"];

//  app.get('/ping', (req, res) => {
//   res.send('pong');
// });

// app.use(cors({
//   origin: allowedOrigins,
//   methods: ["GET", "POST"],
//   credentials: true,
// }));

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// let waitingUsers = [];
// let pairedUsers = {};

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);
//   waitingUsers.push(socket.id);
//   console.log("pushed user in waiting queue");
//   pairUser(socket.id);

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//     removeUser(socket.id);
//   });

//   socket.on("signal", (data) => {
//     const to = data.to;
//     if (io.sockets.sockets.get(to)) {
//       io.to(to).emit("signal", {
//         from: socket.id,
//         type: data.type,
//         sdp: data.sdp,
//         candidate: data.candidate,
//         text: data.text,
//       });
//     }
//   });
// });

// function pairUser(socketId) {
//   removeUser(socketId);
//   const available = waitingUsers.filter((id) => id !== socketId);
//   if (available.length === 0) {
//     waitingUsers.push(socketId);
//     return;
//   }

//   const partnerId = available[Math.floor(Math.random() * available.length)];
//   pairedUsers[socketId] = partnerId;
//   pairedUsers[partnerId] = socketId;

//   waitingUsers = waitingUsers.filter(id => id !== socketId && id !== partnerId);

//   io.to(socketId).emit("signal", { type: "ready", partnerId });
//   io.to(partnerId).emit("signal", { type: "ready", partnerId: socketId });

//   console.log(`🔗 Paired: ${socketId} <--> ${partnerId}`);
// }

// function removeUser(socketId) {
//   waitingUsers = waitingUsers.filter(id => id !== socketId);
//   const partnerId = pairedUsers[socketId];
//   if (partnerId) {
//     io.to(partnerId).emit("signal", { type: "partner-left" });
//     delete pairedUsers[partnerId];
//   }
//   delete pairedUsers[socketId];
// }

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`listening on Port ${PORT}`);
// });



///third time trying ///


const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://fabulous-mandazi-745494.netlify.app",
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
}));

app.get('/ping', (req, res) => {
  res.send('pong');
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

let waitingUsers = [];
let pairedUsers = new Map(); // socket.id -> partnerId

function pairUsers(socket1, socket2) {
  pairedUsers.set(socket1.id, socket2.id);
  pairedUsers.set(socket2.id, socket1.id);

  socket1.emit("message", { type: "ready", partnerId: socket2.id });
  socket2.emit("message", { type: "ready", partnerId: socket1.id });
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("findPartner", () => {
    const index = waitingUsers.findIndex(id => id !== socket.id);
    if (index !== -1) {
      const partnerId = waitingUsers.splice(index, 1)[0];
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        pairUsers(socket, partnerSocket);
      } else {
        waitingUsers.push(socket.id);
      }
    } else {
      waitingUsers.push(socket.id);
    }
  });

  socket.on("message", (msg) => {
    const partnerId = pairedUsers.get(socket.id);
    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    const partnerId = pairedUsers.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("message", { type: "bye" });
        waitingUsers.push(partnerId); // re-add to pool
      }
      pairedUsers.delete(partnerId);
    }

    pairedUsers.delete(socket.id);
    waitingUsers = waitingUsers.filter(id => id !== socket.id);
  });

  socket.on("leave", () => {
    const partnerId = pairedUsers.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("message", { type: "bye" });
        waitingUsers.push(partnerId); // re-add to pool
      }
      pairedUsers.delete(partnerId);
    }
    pairedUsers.delete(socket.id);
    waitingUsers = waitingUsers.filter(id => id !== socket.id);
    socket.emit("message", { type: "bye" });
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server listening on port 5000`);
});
