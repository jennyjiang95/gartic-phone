import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import CanvasReplay from '../Canvas/CanvasReplay';

export default function Reveal() {
  const { state, leaveRoom } = useGame();
  const { chains, players } = state;
  const [chainIdx, setChainIdx] = useState(0);
  const [entryIdx, setEntryIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentChain = chains[chainIdx];
  const currentEntry = currentChain?.entries[entryIdx];

  useEffect(() => {
    if (!currentChain) return;
    const timer = setTimeout(() => {
      setFlipped(true);
      setTimeout(() => {
        setFlipped(false);
        if (entryIdx < currentChain.entries.length - 1) {
          setEntryIdx(i => i + 1);
        } else if (chainIdx < chains.length - 1) {
          setChainIdx(i => i + 1);
          setEntryIdx(0);
        }
      }, 600);
    }, 2500);
    return () => clearTimeout(timer);
  }, [chainIdx, entryIdx, currentChain, chains.length]);

  if (!currentChain || !currentEntry) {
    return (
      <div className="text-center p-8 w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-white mb-4">🎉 Game Over!</h2>
        <button onClick={leaveRoom} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
          Back to Home
        </button>
      </div>
    );
  }

  const startPlayer = players.find(p => p.id === currentChain.id);
  const author = players.find(p => p.id === currentEntry.authorId);

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-4">
        <span className="text-purple-300 text-sm">Chain {chainIdx + 1}/{chains.length} • Step {entryIdx + 1}/{currentChain.entries.length}</span>
        {startPlayer && (
          <h2 className="text-2xl font-bold text-white">{startPlayer.name}'s chain</h2>
        )}
      </div>

      <div
        className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl transition-all duration-300 ${flipped ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <div className="text-center mb-3">
          <span className="text-sm px-3 py-1 rounded-full bg-purple-600/50 text-purple-200 uppercase tracking-wide">
            {currentEntry.type}
          </span>
          {author && (
            <span className="ml-2 text-gray-400 text-sm">by {author.name}</span>
          )}
        </div>

        {currentEntry.type === 'drawing' ? (
          <CanvasReplay imageData={currentEntry.content} />
        ) : (
          <div className="min-h-24 flex items-center justify-center">
            <p className="text-3xl text-white font-bold text-center px-4">{currentEntry.content || '(blank)'}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 overflow-hidden">
        {currentChain.entries.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= entryIdx ? 'bg-purple-400' : 'bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
}
