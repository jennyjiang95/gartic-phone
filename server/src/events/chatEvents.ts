import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';

export function registerChatEvents(io: Server, socket: Socket, roomManager: RoomManager): void {
  socket.on('chat:message', ({ roomCode, message }: { roomCode: string; message: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    io.to(roomCode).emit('chat:message', {
      playerName: player.name,
      message: message.slice(0, 200),
      timestamp: Date.now(),
    });
  });

  socket.on('reaction:send', ({ roomCode, emoji }: { roomCode: string; emoji: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    io.to(roomCode).emit('reaction:broadcast', { playerName: player.name, emoji });
  });
}
