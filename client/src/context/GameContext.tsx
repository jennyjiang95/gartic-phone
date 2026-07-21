import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, RoomSettings, Assignment, Chain, GamePhase } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const defaultSettings: RoomSettings = {
  mode: 'classic',
  maxPlayers: 8,
  rounds: 3,
  drawTime: 90,
  writeTime: 45,
};

const defaultState: GameState = {
  roomCode: null,
  players: [],
  settings: defaultSettings,
  phase: 'lobby',
  assignment: null,
  chains: [],
  scores: {},
  timeLeft: 0,
  myId: null,
  myName: null,
};

interface GameContextValue {
  state: GameState;
  socket: Socket | null;
  connect: (name: string) => Socket;
  disconnect: () => void;
  createRoom: (name: string, settings?: Partial<RoomSettings>) => void;
  joinRoom: (roomCode: string, name: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  submitContent: (content: string, type: 'prompt' | 'drawing' | 'guess') => void;
  castVote: (targetPlayerId: string) => void;
  sendChat: (message: string) => void;
  sendReaction: (emoji: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback((name: string): Socket => {
    if (socketRef.current?.connected) return socketRef.current;

    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(s => ({ ...s, myId: socket.id ?? null, myName: name }));
    });

    socket.on('room:created', ({ roomCode, players, settings }: { roomCode: string; players: Player[]; settings: RoomSettings }) => {
      setState(s => ({ ...s, roomCode, players, settings }));
    });

    socket.on('room:updated', ({ players }: { players: Player[] }) => {
      setState(s => ({ ...s, players }));
    });

    socket.on('game:phase', ({ phase, assignment, timeLimit }: { phase: GamePhase; assignment: Assignment; timeLimit: number }) => {
      setState(s => ({ ...s, phase, assignment, timeLeft: timeLimit }));
    });

    socket.on('game:tick', ({ secondsLeft }: { secondsLeft: number }) => {
      setState(s => ({ ...s, timeLeft: secondsLeft }));
    });

    socket.on('game:reveal', ({ chains }: { chains: Chain[] }) => {
      setState(s => ({ ...s, phase: 'reveal', chains }));
    });

    socket.on('score:update', ({ scores }: { scores: Record<string, number> }) => {
      setState(s => ({ ...s, scores }));
    });

    socket.on('error', ({ message }: { message: string }) => {
      alert(message);
    });

    return socket;
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setState(defaultState);
  }, []);

  const createRoom = useCallback((name: string, settings?: Partial<RoomSettings>) => {
    const socket = connect(name);
    socket.emit('room:create', { playerName: name, settings });
  }, [connect]);

  const joinRoom = useCallback((roomCode: string, name: string) => {
    const socket = connect(name);
    socket.emit('room:join', { roomCode, playerName: name });
  }, [connect]);

  const leaveRoom = useCallback(() => {
    if (state.roomCode) {
      socketRef.current?.emit('room:leave', { roomCode: state.roomCode });
    }
    setState(s => ({ ...defaultState, myId: s.myId, myName: s.myName }));
  }, [state.roomCode]);

  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start', { roomCode: state.roomCode });
  }, [state.roomCode]);

  const submitContent = useCallback((content: string, type: 'prompt' | 'drawing' | 'guess') => {
    socketRef.current?.emit('game:submit', { roomCode: state.roomCode, content, type });
  }, [state.roomCode]);

  const castVote = useCallback((targetPlayerId: string) => {
    socketRef.current?.emit('vote:cast', { roomCode: state.roomCode, targetPlayerId });
  }, [state.roomCode]);

  const sendChat = useCallback((message: string) => {
    socketRef.current?.emit('chat:message', { roomCode: state.roomCode, message });
  }, [state.roomCode]);

  const sendReaction = useCallback((emoji: string) => {
    socketRef.current?.emit('reaction:send', { roomCode: state.roomCode, emoji });
  }, [state.roomCode]);

  return (
    <GameContext.Provider value={{
      state, socket: socketRef.current,
      connect, disconnect, createRoom, joinRoom, leaveRoom,
      startGame, submitContent, castVote, sendChat, sendReaction,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
