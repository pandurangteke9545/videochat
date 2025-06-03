// socket.js
import { io } from 'socket.io-client';

const socket = io('https://aa55-2409-4042-8ec4-31f2-c59f-8de-bb94-95d7.ngrok-free.app', {
  transports: ['websocket'],  // Force WebSocket
  reconnection: true
});

console.log("This is the socket info",socket)

export default socket;

// https://aa55-2409-4042-8ec4-31f2-c59f-8de-bb94-95d7.ngrok-free.app

// 152.57.254.240
// http://192.168.43.76:5000
// videochat-e1z5vxhlh-shrees-projects-e21a6f7c.vercel.app