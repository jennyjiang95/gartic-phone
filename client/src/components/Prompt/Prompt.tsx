import { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function Prompt() {
  const { submitContent } = useGame();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitted) return;
    submitContent(text.trim(), 'prompt');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Submitted!</h2>
        <p className="text-purple-300">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">✍️ Write a Prompt</h2>
        <p className="text-purple-300 text-center mb-6">Write something fun for someone to draw!</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. 'A wizard riding a skateboard through space'"
            maxLength={100}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none text-lg"
            autoFocus
          />
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{text.length}/100</span>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              Submit →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
