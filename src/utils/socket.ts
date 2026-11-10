import { io, Socket } from 'socket.io-client';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

export const SIGNALING_URL = isLocal
  ? 'http://localhost:5001'
  : (import.meta.env.VITE_SIGNALING_URL || 'https://guptgu-backend.onrender.com');

export const socket: Socket = io(SIGNALING_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 600
});
