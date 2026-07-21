import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import CanvasReplay from '../Canvas/CanvasReplay';

export default function Guess() {
  const { state, submitContent } = useGame();
  const { assignment } = state;
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitted) return;
    submitContent(text.trim(), 'guess');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Guess submitted!</h2>
        <p className="text-purple-300">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">🔍 What is this?</h2>
        <p className="text-purple-300 text-center mb-4">Someone drew this — what do you think it is?</p>
        <div className="mb-4 rounded-xl overflow-hidden">
          <CanvasReplay imageData={assignment?.content} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your guess..."
            maxLength={100}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
          >
            Guess!
          </button>
        </form>
      </div>
    </div>
  );
}
