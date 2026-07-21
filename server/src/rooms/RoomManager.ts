import { Room } from './Room';
import { RoomSettings } from '../types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(settings: RoomSettings): Room {
    const code = this.generateCode();
    const room = new Room(code, settings);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) return room;
    }
    return undefined;
  }

  removeRoom(code: string): void {
    this.rooms.delete(code);
  }

  private generateCode(): string {
    let code: string;
    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }
}
