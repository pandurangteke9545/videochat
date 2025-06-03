// socket.js
import { io } from 'socket.io-client';

const socket = io('http://192.168.46.76:5000', {
  transports: ['websocket'],  // Force WebSocket
  reconnection: true
});

export default socket;

// http://192.168.43.76:5000
// videochat-e1z5vxhlh-shrees-projects-e21a6f7c.vercel.app