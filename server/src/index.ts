import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { RoomManager } from './rooms/RoomManager';
import { registerRoomEvents } from './events/roomEvents';
import { registerGameEvents } from './events/gameEvents';
import { registerDrawEvents } from './events/drawEvents';
import { registerChatEvents } from './events/chatEvents';

const app = express();
const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
} else {
  app.use(cors({ origin: corsOrigin }));
}
app.use(express.json());

const ioOptions = isProd
  ? {}
  : { cors: { origin: corsOrigin, methods: ['GET', 'POST'] } };

const io = new Server(httpServer, ioOptions);

const roomManager = new RoomManager();

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  registerRoomEvents(io, socket, roomManager);
  registerGameEvents(io, socket, roomManager);
  registerDrawEvents(io, socket);
  registerChatEvents(io, socket, roomManager);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (room) {
      room.handleDisconnect(socket.id);
      const players = room.getPlayers();
      io.to(room.code).emit('room:updated', { players });
      if (room.isEmpty()) {
        roomManager.removeRoom(room.code);
      }
    }
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
