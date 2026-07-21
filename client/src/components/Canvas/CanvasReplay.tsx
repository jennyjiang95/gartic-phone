import { useEffect } from 'react';
import { useCanvas } from '../../hooks/useCanvas';

interface Props {
  imageData?: string;
}

export default function CanvasReplay({ imageData }: Props) {
  const { canvasRef } = useCanvas(undefined, true);

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 600, 400);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 400);
      ctx.drawImage(img, 0, 0, 600, 400);
    };
    img.src = imageData;
  }, [imageData, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="w-full rounded-xl border-2 border-white/20 bg-white"
      style={{ aspectRatio: '3/2' }}
    />
  );
}
