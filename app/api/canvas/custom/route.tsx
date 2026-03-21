/**
 * API ROUTE: Canvas Custom Renderer
 * Renderitza un disseny personalitzat de l'editor D&D com a PNG.
 * Usa next/og (ImageResponse) per generar la imatge al servidor.
 */

import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CanvasElement {
  type: 'text' | 'shape' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  shapeType?: 'rect' | 'circle' | 'line';
  fill?: string;
  borderRadius?: number;
}

function renderElement(el: CanvasElement): React.ReactElement | null {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
  };

  if (el.type === 'text') {
    return (
      <div
        key={`${el.x}-${el.y}-${el.text}`}
        style={{
          ...baseStyle,
          fontSize: el.fontSize || 48,
          fontWeight: el.fontWeight === 'bold' ? 700 : 400,
          color: el.color || '#ffffff',
          textAlign: el.textAlign || 'left',
          lineHeight: 1.1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {el.text || ''}
      </div>
    );
  }

  if (el.type === 'shape') {
    return (
      <div
        key={`${el.x}-${el.y}-shape`}
        style={{
          ...baseStyle,
          backgroundColor: el.fill || '#06b6d4',
          borderRadius: el.shapeType === 'circle' ? '50%' : (el.borderRadius || 0),
        }}
      />
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const w = parseInt(searchParams.get('w') || '1080');
    const h = parseInt(searchParams.get('h') || '1920');
    const bg = searchParams.get('bg') || '#0a0a0a';
    const elementsJson = searchParams.get('elements') || '[]';

    // Validate dimensions
    const width = Math.min(Math.max(w, 100), 4096);
    const height = Math.min(Math.max(h, 100), 4096);

    let elements: CanvasElement[] = [];
    try {
      elements = JSON.parse(elementsJson);
      if (!Array.isArray(elements)) elements = [];
    } catch {
      elements = [];
    }

    // Limit elements to prevent abuse
    elements = elements.slice(0, 50);

    return new ImageResponse(
      (
        <div
          style={{
            width,
            height,
            background: bg,
            position: 'relative',
            display: 'flex',
          }}
        >
          {elements.map((el, i) => {
            const rendered = renderElement(el);
            return rendered ? <div key={i}>{rendered}</div> : null;
          })}
        </div>
      ),
      { width, height },
    );
  } catch (error) {
    log.error('Error generant canvas personalitzat', error);
    return NextResponse.json({ ok: false, error: 'Error generant imatge' }, { status: 500 });
  }
}
