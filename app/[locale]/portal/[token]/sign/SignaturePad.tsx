'use client';

import { useRef, useState, useCallback } from 'react';

type Props = {
  onDataChange: (dataUrl: string | null) => void;
  clearLabel: string;
  hintText: string;
};

export function SignaturePad({ onDataChange, clearLabel, hintText }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function getCanvasPos(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * canvas.width) / rect.width,
      y: ((clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function startStroke(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getCanvasPos(canvas, clientX, clientY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(lastPos.current.x, lastPos.current.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    setHasStrokes(true);
  }

  function continueStroke(clientX: number, clientY: number) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(canvas, clientX, clientY);
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;

    if (!hasStrokes) {
      setHasStrokes(true);
    }
  }

  function endStroke() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      onDataChange(canvas.toDataURL('image/png'));
    }
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onDataChange(null);
  }, [onDataChange]);

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        aria-label={hintText}
        className="w-full rounded-lg border border-white/20 bg-white/5 touch-none cursor-crosshair"
        onMouseDown={(e) => startStroke(e.clientX, e.clientY)}
        onMouseMove={(e) => continueStroke(e.clientX, e.clientY)}
        onMouseUp={endStroke}
        onMouseLeave={endStroke}
        onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startStroke(t.clientX, t.clientY); }}
        onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; continueStroke(t.clientX, t.clientY); }}
        onTouchEnd={endStroke}
      />
      {!hasStrokes && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/25">
          {hintText}
        </p>
      )}
      {hasStrokes && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 rounded border border-white/15 px-2 py-0.5 text-xs text-white/40 hover:border-white/30 hover:text-white/70 transition-colors"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
