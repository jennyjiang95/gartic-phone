import { Socket } from 'socket.io';
import { StrokeData } from '../types';

export function registerDrawEvents(_io: unknown, socket: Socket): void {
  socket.on('draw:stroke', ({ roomCode, stroke }: { roomCode: string; stroke: StrokeData }) => {
    socket.to(roomCode).emit('draw:stroke', { stroke });
  });

  socket.on('draw:clear', ({ roomCode }: { roomCode: string }) => {
    socket.to(roomCode).emit('draw:clear', {});
  });

  socket.on('draw:undo', ({ roomCode }: { roomCode: string }) => {
    socket.to(roomCode).emit('draw:undo', {});
  });
}
