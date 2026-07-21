import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import CanvasReplay from '../Canvas/CanvasReplay';

export default function Vote() {
  const { state, castVote } = useGame();
  const { assignment, players } = state;
  const [voted, setVoted] = useState(false);

  let drawings: Array<{ playerId: string; content: string }> = [];
  try {
    drawings = assignment?.content ? JSON.parse(assignment.content) : [];
  } catch {
    drawings = [];
  }

  const handleVote = (playerId: string) => {
    if (voted) return;
    castVote(playerId);
    setVoted(true);
  };

  if (voted) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4 animate-bounce">⭐</div>
        <h2 className="text-2xl font-bold text-white mb-2">Vote cast!</h2>
        <p className="text-purple-300">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">⭐ Vote for the best drawing!</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {drawings.map(({ playerId, content }) => {
          const player = players.find(p => p.id === playerId);
          return (
            <div key={playerId} className="bg-white/10 backdrop-blur-md rounded-xl p-3">
              <CanvasReplay imageData={content} />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-white text-sm font-medium">{player?.name ?? 'Unknown'}</span>
                <button
                  onClick={() => handleVote(playerId)}
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition-all"
                >
                  ⭐ Vote
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
