import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GameMode } from '../types';

const MODE_LABELS: Record<GameMode, string> = {
  'classic': '🎨 Classic',
  'animation': '🎬 Animation',
  'score-attack': '⭐ Score Attack',
  'icebreaker': '🧊 Icebreaker',
  'knockout': '🥊 Knockout',
  'sandwich': '🥪 Sandwich',
};

export default function Lobby() {
  const navigate = useNavigate();
  const { state, startGame, leaveRoom } = useGame();
  const { roomCode, players, settings, phase, myId } = state;
  const myPlayer = players.find(p => p.id === myId);
  const isHost = myPlayer?.isHost ?? false;

  useEffect(() => {
    if (!roomCode) navigate('/');
  }, [roomCode, navigate]);

  useEffect(() => {
    if (phase !== 'lobby') navigate('/game');
  }, [phase, navigate]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode ?? '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white/10 rounded-xl px-6 py-3">
              <span className="text-purple-300 text-sm">Room Code</span>
              <div className="text-3xl font-bold text-white tracking-widest">{roomCode}</div>
            </div>
            <button onClick={copyCode} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl transition-all">
              📋 Copy
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <h2 className="text-white font-bold mb-3">Players ({players.length}/{settings.maxPlayers})</h2>
            <div className="space-y-2">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: p.color }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="text-white flex-1">{p.name}</span>
                  {p.isHost && <span className="text-yellow-400 text-sm">👑 Host</span>}
                  {!p.isConnected && <span className="text-gray-400 text-sm">disconnected</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <h2 className="text-white font-bold mb-3">Settings</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="text-white font-medium">{MODE_LABELS[settings.mode]}</span>
              </div>
              <div className="flex justify-between">
                <span>Rounds</span>
                <span className="text-white font-medium">{settings.rounds}</span>
              </div>
              <div className="flex justify-between">
                <span>Draw Time</span>
                <span className="text-white font-medium">{settings.drawTime}s</span>
              </div>
              <div className="flex justify-between">
                <span>Write Time</span>
                <span className="text-white font-medium">{settings.writeTime}s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={leaveRoom} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
            ← Leave
          </button>
          {isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl transition-all shadow-lg"
            >
              🎮 Start Game!
            </button>
          )}
          {!isHost && (
            <div className="flex-1 text-center py-4 text-gray-400">Waiting for host to start...</div>
          )}
        </div>
      </div>
    </div>
  );
}
