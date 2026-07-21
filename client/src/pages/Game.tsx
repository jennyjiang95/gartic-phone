import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Prompt from '../components/Prompt/Prompt';
import Draw from '../components/Canvas/Draw';
import Guess from '../components/Guess/Guess';
import Vote from '../components/Vote/Vote';
import Reveal from '../components/Reveal/Reveal';
import Timer from '../components/Timer/Timer';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import Chat from '../components/Chat/Chat';

export default function Game() {
  const navigate = useNavigate();
  const { state } = useGame();
  const { roomCode, phase } = state;

  useEffect(() => {
    if (!roomCode) navigate('/');
  }, [roomCode, navigate]);

  const renderPhase = () => {
    switch (phase) {
      case 'write': return <Prompt />;
      case 'draw': return <Draw />;
      case 'guess': return <Guess />;
      case 'vote': return <Vote />;
      case 'reveal': return <Reveal />;
      case 'score': return <Scoreboard />;
      default: return <div className="text-white text-center text-2xl">Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-black/20">
        <div className="text-white font-bold text-lg">🎨 Gartic Phone</div>
        <Timer />
        <div className="text-purple-300 text-sm capitalize">{phase}</div>
      </div>
      <div className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex items-center justify-center">
          {renderPhase()}
        </div>
        <div className="w-72 hidden lg:flex flex-col gap-4">
          <Chat />
        </div>
      </div>
    </div>
  );
}
