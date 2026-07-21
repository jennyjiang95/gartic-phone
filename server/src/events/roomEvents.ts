import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { RoomSettings } from '../types';

const DEFAULT_SETTINGS: RoomSettings = {
  mode: 'classic',
  maxPlayers: 8,
  rounds: 3,
  drawTime: 90,
  writeTime: 45,
};

export function registerRoomEvents(io: Server, socket: Socket, roomManager: RoomManager): void {
  socket.on('room:create', ({ playerName, settings }: { playerName: string; settings?: Partial<RoomSettings> }) => {
    const mergedSettings: RoomSettings = { ...DEFAULT_SETTINGS, ...settings };
    const room = roomManager.createRoom(mergedSettings);
    room.addPlayer(socket.id, playerName, true);
    socket.join(room.code);
    socket.emit('room:created', {
      roomCode: room.code,
      players: room.getPlayers(),
      settings: room.settings,
    });
    console.log(`Room created: ${room.code} by ${playerName}`);
  });

  socket.on('room:join', ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    const room = roomManager.getRoom(roomCode.toUpperCase());
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.getPlayerCount() >= room.settings.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    room.addPlayer(socket.id, playerName);
    socket.join(room.code);
    socket.emit('room:created', {
      roomCode: room.code,
      players: room.getPlayers(),
      settings: room.settings,
    });
    socket.to(room.code).emit('room:updated', { players: room.getPlayers() });
    console.log(`${playerName} joined room ${room.code}`);
  });

  socket.on('room:leave', ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    room.removePlayer(socket.id);
    socket.leave(roomCode);
    const players = room.getPlayers();
    io.to(roomCode).emit('room:updated', { players });
    if (room.isEmpty()) roomManager.removeRoom(roomCode);
  });
}
