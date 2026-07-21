import { Player, RoomSettings } from '../types';
import { GameEngine } from '../game/GameEngine';
import { Server } from 'socket.io';

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
  '#A9DFBF',
];

export class Room {
  code: string;
  settings: RoomSettings;
  private players: Map<string, Player> = new Map();
  private colorIndex = 0;
  gameEngine: GameEngine | null = null;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(code: string, settings: RoomSettings) {
    this.code = code;
    this.settings = settings;
  }

  addPlayer(id: string, name: string, isHost = false): Player {
    const player: Player = {
      id,
      name,
      color: PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length],
      isHost,
      isConnected: true,
      score: 0,
    };
    this.colorIndex++;
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    const remaining = Array.from(this.players.values());
    if (remaining.length > 0 && !remaining.some((p) => p.isHost)) {
      remaining[0].isHost = true;
    }
  }

  handleDisconnect(id: string): void {
    const player = this.players.get(id);
    if (!player) return;
    player.isConnected = false;

    const timer = setTimeout(() => {
      this.removePlayer(id);
      this.reconnectTimers.delete(id);
    }, 30000);
    this.reconnectTimers.set(id, timer);
  }

  handleReconnect(oldId: string, newId: string, _io: Server): void {
    const timer = this.reconnectTimers.get(oldId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(oldId);
    }
    const player = this.players.get(oldId);
    if (player) {
      player.id = newId;
      player.isConnected = true;
      this.players.delete(oldId);
      this.players.set(newId, player);
    }
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  startGame(io: Server): void {
    this.gameEngine = new GameEngine(io, this);
    this.gameEngine.start();
  }
}
