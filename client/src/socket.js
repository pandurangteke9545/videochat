// socket.js
import { io } from 'socket.io-client';

const socket = io('http://192.168.43.76:5000');
 // Make sure this matches your backend

export default socket;
