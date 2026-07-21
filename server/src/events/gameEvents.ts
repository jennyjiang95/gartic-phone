import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';

export function registerGameEvents(io: Server, socket: Socket, roomManager: RoomManager): void {
  socket.on('game:start', ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    const player = room.getPlayer(socket.id);
    if (!player?.isHost) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }
    if (room.getPlayerCount() < 2) {
      socket.emit('error', { message: 'Need at least 2 players' });
      return;
    }
    room.startGame(io);
  });

  socket.on('game:submit', ({ roomCode, content, type }: { roomCode: string; content: string; type: 'prompt' | 'drawing' | 'guess' }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room?.gameEngine) return;
    room.gameEngine.handleSubmit(socket.id, content, type);
  });

  socket.on('vote:cast', ({ roomCode, targetPlayerId }: { roomCode: string; targetPlayerId: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room?.gameEngine) return;
    room.gameEngine.handleVote(socket.id, targetPlayerId);
  });
}
