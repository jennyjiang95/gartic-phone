import { StrokeData } from '../../types';

interface Props {
  tool: StrokeData['tool'];
  color: string;
  size: number;
  presetColors: string[];
  onToolChange: (t: StrokeData['tool']) => void;
  onColorChange: (c: string) => void;
  onSizeChange: (s: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

const TOOLS: Array<{ id: StrokeData['tool']; icon: string; label: string }> = [
  { id: 'pencil', icon: '✏️', label: 'Pencil' },
  { id: 'eraser', icon: '🩹', label: 'Eraser' },
  { id: 'fill', icon: '🪣', label: 'Fill' },
  { id: 'line', icon: '╱', label: 'Line' },
  { id: 'rect', icon: '▭', label: 'Rect' },
  { id: 'circle', icon: '○', label: 'Circle' },
];

export default function CanvasToolbar({ tool, color, size, presetColors, onToolChange, onColorChange, onSizeChange, onUndo, onClear }: Props) {
  return (
    <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-xl p-3 w-16">
      {TOOLS.map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => onToolChange(t.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${tool === t.id ? 'bg-purple-600 shadow-lg scale-110' : 'hover:bg-white/10 text-gray-300'}`}
        >
          {t.icon}
        </button>
      ))}

      <div className="border-t border-white/20 my-1" />

      <button title="Undo (Ctrl+Z)" onClick={onUndo}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10">
        ↩️
      </button>
      <button title="Clear" onClick={onClear}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-500/30">
        🗑️
      </button>

      <div className="border-t border-white/20 my-1" />

      <div className="flex flex-col gap-1 items-center">
        {presetColors.slice(0, 10).map(c => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-8 h-4 rounded transition-all hover:scale-110 ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
            style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #666' : 'none' }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={e => onColorChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
          title="Custom color"
        />
      </div>

      <div className="border-t border-white/20 my-1" />

      <input
        type="range"
        min={1}
        max={40}
        value={size}
        onChange={e => onSizeChange(Number(e.target.value))}
        className="w-full accent-purple-500"
        style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '80px' }}
        title={`Brush size: ${size}px`}
      />
    </div>
  );
}
