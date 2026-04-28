import { useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';

/**
 * Interface with the real-time websocket connection
 */
export function useSocket() {
  const subscribe = useCallback((event, callback) => {
    socket.on(event, callback);
  }, []);

  const unsubscribe = useCallback((event, callback) => {
    socket.off(event, callback);
  }, []);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { socket, subscribe, unsubscribe, emit };
}

export default useSocket;
