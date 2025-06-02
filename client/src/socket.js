// socket.js
import { io } from 'socket.io-client';

const socket = io('http://192.168.43.76:5000', {
  transports: ['websocket'],  // Force WebSocket
  reconnection: true
});

export default socket;
