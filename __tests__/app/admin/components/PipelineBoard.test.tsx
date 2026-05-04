import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PipelineBoard, { type PipelineCardContext } from '@/app/admin/components/PipelineBoard';

const COLUMNS = [
  { status: 'NEW', label: 'Nous' },
  { status: 'CONTACTED', label: 'Contactats' },
];

type Item = { id: string; status: string; name: string };

const ITEMS: Item[] = [
  { id: 'a', status: 'NEW', name: 'Lead A' },
  { id: 'b', status: 'CONTACTED', name: 'Lead B' },
];

describe('PipelineBoard — contracte drag&drop desktop + mòbil (D.17)', () => {
  it('exposa al renderCard handlers de drag clàssics i de pointer events per a touch', () => {
    const captured = new Map<string, PipelineCardContext>();

    render(
      <PipelineBoard<Item>
        columnsDef={COLUMNS}
        items={ITEMS}
        getId={(item) => item.id}
        getStatus={(item) => item.status}
        updatingId={null}
        onMoveStatus={vi.fn()}
        renderCard={(item, ctx) => {
          captured.set(item.id, ctx);
          return (
            <article data-testid={`card-${item.id}`} {...ctx.dragHandlers}>
              {item.name}
            </article>
          );
        }}
      />,
    );

    expect(screen.getByText('Lead A')).toBeInTheDocument();
    expect(screen.getByText('Lead B')).toBeInTheDocument();

    const ctx = captured.get('a');
    expect(ctx).toBeDefined();
    expect(ctx!.dragHandlers.draggable).toBe(true);
    expect(typeof ctx!.dragHandlers.onDragStart).toBe('function');
    expect(typeof ctx!.dragHandlers.onDragEnd).toBe('function');
    expect(typeof ctx!.dragHandlers.onPointerDown).toBe('function');
    expect(typeof ctx!.dragHandlers.onPointerMove).toBe('function');
    expect(typeof ctx!.dragHandlers.onPointerUp).toBe('function');
    expect(typeof ctx!.dragHandlers.onPointerCancel).toBe('function');
    expect(ctx!.dragHandlers.style?.touchAction).toBe('pan-y');
  });

  it('quan un item està actualitzant-se, deshabilita drag i pointer drag', () => {
    const captured = new Map<string, PipelineCardContext>();

    render(
      <PipelineBoard<Item>
        columnsDef={COLUMNS}
        items={ITEMS}
        getId={(item) => item.id}
        getStatus={(item) => item.status}
        updatingId="a"
        onMoveStatus={vi.fn()}
        renderCard={(item, ctx) => {
          captured.set(item.id, ctx);
          return <article {...ctx.dragHandlers}>{item.name}</article>;
        }}
      />,
    );

    const aCtx = captured.get('a');
    const bCtx = captured.get('b');
    expect(aCtx!.isUpdating).toBe(true);
    expect(aCtx!.dragHandlers.draggable).toBe(false);
    expect(bCtx!.isUpdating).toBe(false);
    expect(bCtx!.dragHandlers.draggable).toBe(true);
  });

  it("ignora pointer down d'origen no-touch (ratolí)", () => {
    const captured = new Map<string, PipelineCardContext>();
    const onMoveStatus = vi.fn();

    render(
      <PipelineBoard<Item>
        columnsDef={COLUMNS}
        items={ITEMS}
        getId={(item) => item.id}
        getStatus={(item) => item.status}
        updatingId={null}
        onMoveStatus={onMoveStatus}
        renderCard={(item, ctx) => {
          captured.set(item.id, ctx);
          return <article {...ctx.dragHandlers}>{item.name}</article>;
        }}
      />,
    );

    const ctx = captured.get('a')!;
    const fakeMouseDown = {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      pointerType: 'mouse',
    } as unknown as React.PointerEvent<HTMLElement>;

    expect(() => ctx.dragHandlers.onPointerDown(fakeMouseDown)).not.toThrow();
    // No mouse drag triggered (mouse usa HTML5 drag&drop, no Pointer Events)
    expect(onMoveStatus).not.toHaveBeenCalled();
  });
});
