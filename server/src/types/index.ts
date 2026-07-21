export type GamePhase = 'lobby' | 'write' | 'draw' | 'guess' | 'vote' | 'reveal' | 'score';
export type GameMode = 'classic' | 'animation' | 'score-attack' | 'icebreaker' | 'knockout' | 'sandwich';

export interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
}

export interface RoomSettings {
  mode: GameMode;
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  writeTime: number;
}

export interface StrokeData {
  tool: 'pencil' | 'eraser' | 'fill' | 'rect' | 'circle' | 'line';
  color: string;
  size: number;
  points: Array<{ x: number; y: number }>;
  opacity: number;
}

export interface Assignment {
  type: 'write' | 'draw' | 'guess' | 'vote' | 'watch';
  content?: string;
  chainId: string;
  roundNumber: number;
}

export interface ChainEntry {
  type: 'prompt' | 'drawing' | 'guess';
  content: string;
  authorId: string;
  authorName: string;
}

export interface Chain {
  id: string;
  entries: ChainEntry[];
}
