import { useGame } from '../../context/GameContext';

export default function Scoreboard() {
  const { state, leaveRoom } = useGame();
  const { scores, players } = state;

  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-6">🏆 Scoreboard</h2>
        <div className="space-y-3">
          {ranked.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
              <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: p.color }}>
                {p.name[0].toUpperCase()}
              </div>
              <span className="text-white font-semibold flex-1">{p.name}</span>
              <span className="text-yellow-400 font-bold text-xl">{scores[p.id] ?? 0}</span>
            </div>
          ))}
        </div>
        <button
          onClick={leaveRoom}
          className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
