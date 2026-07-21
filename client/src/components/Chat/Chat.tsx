import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';

interface ChatMessage {
  playerName: string;
  message: string;
  timestamp: number;
}

interface ReactionEvent {
  playerName: string;
  emoji: string;
}

const REACTIONS = ['😂', '😮', '❤️', '🔥', '👏', '🤯'];

export default function Chat() {
  const { socket, sendChat, sendReaction } = useGame();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Array<{ id: number; emoji: string; name: string }>>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reactionId = useRef(0);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg: ChatMessage) => setMessages(m => [...m.slice(-99), msg]);
    const onReaction = ({ playerName, emoji }: ReactionEvent) => {
      const id = reactionId.current++;
      setReactions(r => [...r, { id, emoji, name: playerName }]);
      setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 3000);
    };
    socket.on('chat:message', onMessage);
    socket.on('reaction:broadcast', onReaction);
    return () => { socket.off('chat:message', onMessage); socket.off('reaction:broadcast', onReaction); };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChat(input.trim());
    setInput('');
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl flex flex-col h-full relative overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 font-semibold text-white">💬 Chat</div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-semibold text-purple-300">{msg.playerName}: </span>
            <span className="text-gray-200">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-1 px-3 py-1 border-t border-white/10">
        {REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => sendReaction(emoji)}
            className="text-xl hover:scale-125 transition-all w-8 h-8 flex items-center justify-center">
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Say something..."
          maxLength={100}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none text-sm"
        />
        <button type="submit" className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
          Send
        </button>
      </form>

      <div className="absolute top-0 left-0 right-0 pointer-events-none">
        {reactions.map(r => (
          <div key={r.id} className="absolute animate-float text-4xl"
            style={{ left: `${20 + Math.random() * 60}%`, bottom: '20px' }}>
            {r.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
