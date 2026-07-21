import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager';
import { registerRoomEvents } from './events/roomEvents';
import { registerGameEvents } from './events/gameEvents';
import { registerDrawEvents } from './events/drawEvents';
import { registerChatEvents } from './events/chatEvents';

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
