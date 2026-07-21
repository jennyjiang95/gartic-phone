import { useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function useSocket(): Socket {
  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    socketRef.current = io(SERVER_URL, { autoConnect: false });
  }
  return socketRef.current;
}
