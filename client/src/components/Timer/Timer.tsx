import { useGame } from '../../context/GameContext';

export default function Timer() {
  const { state } = useGame();
  const { timeLeft, phase } = state;
  if (phase === 'lobby' || phase === 'reveal' || phase === 'score') return null;

  const pct = Math.max(0, Math.min(100, (timeLeft / 90) * 100));
  const urgency = timeLeft <= 10 ? 'text-red-400 animate-pulse' : timeLeft <= 30 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-bold text-xl tabular-nums ${urgency}`}>{timeLeft}s</span>
    </div>
  );
}
