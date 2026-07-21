import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    createRoom(playerName.trim());
    navigate('/lobby');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 animate-bounce-in">
            🎨 Gartic Phone
          </h1>
          <p className="text-purple-300 text-lg">Draw, Guess, Laugh!</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
          <div className="flex rounded-xl overflow-hidden mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-3 font-semibold transition-all ${mode === 'create' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-3 font-semibold transition-all ${mode === 'join' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
            >
              Join Room
            </button>
          </div>

          <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm text-purple-300 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                required
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm text-purple-300 mb-1">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-letter code..."
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 tracking-widest text-center text-xl font-bold"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all shadow-lg"
            >
              {mode === 'create' ? '🚀 Create Room' : '🎮 Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
