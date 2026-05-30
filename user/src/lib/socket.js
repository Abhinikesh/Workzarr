import { io } from 'socket.io-client';

export let socket = null;

export const connectSocket = (token) => {
  try {
    if (socket) return;
    
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('User socket connected successfully');
    });

    socket.on('disconnect', () => {
      console.log('User socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('User socket connection error:', err.message);
    });
  } catch (err) {
    console.warn('Socket connection initialization failed:', err.message);
  }
};

export const disconnectSocket = () => {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  } catch (err) {
    console.warn('Socket disconnect failed:', err.message);
  }
};
