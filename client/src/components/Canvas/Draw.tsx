import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useCanvas } from '../../hooks/useCanvas';
import CanvasToolbar from './CanvasToolbar';
import { StrokeData } from '../../types';

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF8800', '#8800FF', '#00FF88', '#FF0088',
  '#884400', '#004488', '#448800', '#888888',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
];

export default function Draw() {
  const { state, socket, submitContent } = useGame();
  const { assignment, roomCode } = state;
  const [submitted, setSubmitted] = useState(false);
  const [currentTool, setCurrentToolState] = useState<StrokeData['tool']>('pencil');
  const [currentColor, setCurrentColorState] = useState('#000000');
  const [currentSize, setCurrentSizeState] = useState(4);
  const [showClear, setShowClear] = useState(false);

  const handleStroke = (stroke: StrokeData) => {
    socket?.emit('draw:stroke', { roomCode, stroke });
  };

  const { canvasRef, undo, clearCanvas, drawStroke, setTool, setColor, setSize, getDataURL } = useCanvas(handleStroke, false);

  useEffect(() => {
    if (!socket) return;
    const onStroke = ({ stroke }: { stroke: StrokeData }) => drawStroke(stroke);
    const onClear = () => clearCanvas();
    socket.on('draw:stroke', onStroke);
    socket.on('draw:clear', onClear);
    return () => { socket.off('draw:stroke', onStroke); socket.off('draw:clear', onClear); };
  }, [socket, drawStroke, clearCanvas]);

  const changeTool = (t: StrokeData['tool']) => { setCurrentToolState(t); setTool(t); };
  const changeColor = (c: string) => { setCurrentColorState(c); setColor(c); };
  const changeSize = (s: number) => { setCurrentSizeState(s); setSize(s); };

  const handleClear = () => {
    setShowClear(false);
    clearCanvas();
    socket?.emit('draw:clear', { roomCode });
  };

  const handleUndo = () => {
    undo();
    socket?.emit('draw:undo', { roomCode });
  };

  const handleSubmit = () => {
    if (submitted) return;
    const dataUrl = getDataURL();
    submitContent(dataUrl, 'drawing');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Drawing submitted!</h2>
        <p className="text-purple-300">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      {assignment?.content && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 text-center">
          <span className="text-purple-300 text-sm">Draw this: </span>
          <span className="text-white font-bold text-xl">{assignment.content}</span>
        </div>
      )}

      <div className="flex gap-4 w-full">
        <CanvasToolbar
          tool={currentTool}
          color={currentColor}
          size={currentSize}
          presetColors={PRESET_COLORS}
          onToolChange={changeTool}
          onColorChange={changeColor}
          onSizeChange={changeSize}
          onUndo={handleUndo}
          onClear={() => setShowClear(true)}
        />
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full rounded-xl shadow-xl border-2 border-white/20 bg-white touch-none"
            style={{ cursor: 'crosshair', aspectRatio: '3/2' }}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-xl rounded-xl transition-all shadow-lg"
      >
        Submit Drawing ✓
      </button>

      {showClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-white text-xl font-bold mb-2">Clear canvas?</h3>
            <p className="text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClear(false)} className="flex-1 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20">Cancel</button>
              <button onClick={handleClear} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl">Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
