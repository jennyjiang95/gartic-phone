import { useRef, useCallback, useEffect } from 'react';
import { StrokeData } from '../types';

export function useCanvas(onStroke?: (stroke: StrokeData) => void, readonly = false) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<Array<{ x: number; y: number }>>([]);
  const history = useRef<ImageData[]>([]);
  const tool = useRef<StrokeData['tool']>('pencil');
  const color = useRef('#000000');
  const size = useRef(4);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const previewSnapshot = useRef<ImageData | null>(null);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d') ?? null;
  }, []);

  const getPoint = useCallback((e: PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const saveSnapshot = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current.push(snapshot);
    if (history.current.length > 50) history.current.shift();
  }, [getCtx]);

  const undo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || history.current.length === 0) return;
    const snapshot = history.current.pop()!;
    ctx.putImageData(snapshot, 0, 0);
  }, [getCtx]);

  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    saveSnapshot();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getCtx, saveSnapshot]);

  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const idx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2], targetA = data[idx + 3];

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const { r: fr, g: fg, b: fb } = hexToRgb(fillColor);

    if (targetR === fr && targetG === fg && targetB === fb && targetA === 255) return;

    const matches = (i: number) =>
      Math.abs(data[i] - targetR) < 32 &&
      Math.abs(data[i + 1] - targetG) < 32 &&
      Math.abs(data[i + 2] - targetB) < 32 &&
      Math.abs(data[i + 3] - targetA) < 32;

    const stack = [{ x: Math.floor(startX), y: Math.floor(startY) }];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const i4 = (y * width + x) * 4;
      if (visited[y * width + x] || !matches(i4)) continue;
      visited[y * width + x] = 1;
      data[i4] = fr; data[i4 + 1] = fg; data[i4 + 2] = fb; data[i4 + 3] = 255;
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }
    ctx.putImageData(imageData, 0, 0);
  }, [getCtx]);

  const drawStroke = useCallback((stroke: StrokeData) => {
    const ctx = getCtx();
    if (!ctx || stroke.points.length === 0) return;

    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'fill') {
      floodFill(stroke.points[0].x, stroke.points[0].y, stroke.color);
    } else if (stroke.tool === 'pencil' || stroke.tool === 'eraser') {
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      }
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    } else if (stroke.tool === 'rect' && stroke.points.length >= 2) {
      const p0 = stroke.points[0], p1 = stroke.points[stroke.points.length - 1];
      ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
      const p0 = stroke.points[0], p1 = stroke.points[stroke.points.length - 1];
      const rx = Math.abs(p1.x - p0.x) / 2, ry = Math.abs(p1.y - p0.y) / 2;
      ctx.beginPath();
      ctx.ellipse(p0.x + (p1.x - p0.x) / 2, p0.y + (p1.y - p0.y) / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (stroke.tool === 'line' && stroke.points.length >= 2) {
      const p0 = stroke.points[0], p1 = stroke.points[stroke.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }, [getCtx, floodFill]);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (readonly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    saveSnapshot();
    const pt = getPoint(e);
    isDrawing.current = true;
    startPoint.current = pt;
    currentPoints.current = [pt];

    if (tool.current === 'fill') {
      floodFill(pt.x, pt.y, color.current);
      isDrawing.current = false;
      const stroke: StrokeData = {
        tool: 'fill', color: color.current, size: size.current, points: [pt], opacity: 1,
      };
      onStroke?.(stroke);
    } else {
      const ctx = getCtx();
      if (ctx) {
        previewSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    }
  }, [readonly, saveSnapshot, getPoint, floodFill, getCtx, onStroke]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDrawing.current || readonly) return;
    e.preventDefault();
    const pt = getPoint(e);
    currentPoints.current.push(pt);

    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    if (tool.current === 'pencil' || tool.current === 'eraser') {
      const pts = currentPoints.current;
      const last = pts[pts.length - 2];
      ctx.save();
      if (tool.current === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.strokeStyle = color.current;
      }
      ctx.lineWidth = size.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
    } else if (previewSnapshot.current) {
      ctx.putImageData(previewSnapshot.current, 0, 0);
      const partial: StrokeData = {
        tool: tool.current, color: color.current, size: size.current,
        points: [currentPoints.current[0], pt], opacity: 1,
      };
      drawStroke(partial);
    }
  }, [readonly, getPoint, getCtx, drawStroke]);

  const onPointerUp = useCallback((_e: PointerEvent) => {
    if (!isDrawing.current || readonly) return;
    isDrawing.current = false;
    previewSnapshot.current = null;

    const stroke: StrokeData = {
      tool: tool.current,
      color: color.current,
      size: size.current,
      points: currentPoints.current,
      opacity: 1,
    };
    onStroke?.(stroke);
    currentPoints.current = [];
  }, [readonly, onStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') undo();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPointerDown, onPointerMove, onPointerUp, undo]);

  return {
    canvasRef,
    undo,
    clearCanvas,
    drawStroke,
    setTool: (t: StrokeData['tool']) => { tool.current = t; },
    setColor: (c: string) => { color.current = c; },
    setSize: (s: number) => { size.current = s; },
    getDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
    getCurrentTool: () => tool.current,
    getCurrentColor: () => color.current,
    getCurrentSize: () => size.current,
  };
}
