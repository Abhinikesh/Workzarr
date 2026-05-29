import { io } from 'socket.io-client';

export let socket;

export const connectSocket = (token) => {
  try {
    if (socket) return;
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3
    });
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message));
  } catch (err) {
    console.warn('Socket init failed:', err.message);
  }
};

export const disconnectSocket = () => {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  } catch (err) {
    console.warn('Socket disconnect error:', err.message);
  }
};
