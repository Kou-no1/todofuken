import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InkPoint, InkStroke } from "../../types/handwriting";
import { getInkPoint } from "../../utils/handwriting";

type Props = {
  character: string;
  strokes: InkStroke[];
  showGuide: boolean;
  penWidth: number;
  onChange: (strokes: InkStroke[]) => void;
};

const SIZE = 1000;

function drawStroke(context: CanvasRenderingContext2D, stroke: InkStroke) {
  if (!stroke.points.length) return;
  context.strokeStyle = "#25364e";
  context.fillStyle = "#25364e";
  context.lineWidth = stroke.width * SIZE;
  context.lineCap = "round";
  context.lineJoin = "round";
  const first = stroke.points[0];
  if (stroke.points.length === 1) {
    context.beginPath();
    context.arc(first.x * SIZE, first.y * SIZE, context.lineWidth / 2, 0, 2 * Math.PI);
    context.fill();
    return;
  }
  context.beginPath();
  context.moveTo(first.x * SIZE, first.y * SIZE);
  for (const point of stroke.points.slice(1)) context.lineTo(point.x * SIZE, point.y * SIZE);
  context.stroke();
}

export function TracingCanvas({ character, strokes, showGuide, penWidth, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef({ character, strokes, showGuide, penWidth, onChange });
  currentRef.current = { character, strokes, showGuide, penWidth, onChange };
  const activeRef = useRef<{ pointerId: number; stroke: InkStroke } | null>(null);
  const frameRef = useRef<number | null>(null);
  const [fontReady, setFontReady] = useState(false);

  const paint = useCallback(() => {
    frameRef.current = null;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const paper = canvas.parentElement;
    const side = paper ? Math.min(paper.clientWidth, paper.clientHeight) : 0;
    if (!side) return;
    canvas.style.width = `${side}px`;
    canvas.style.height = `${side}px`;
    const pixels = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = pixels;
      canvas.height = pixels;
    }
    context.setTransform(pixels / SIZE, 0, 0, pixels / SIZE, 0, 0);
    context.clearRect(0, 0, SIZE, SIZE);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, SIZE, SIZE);
    context.strokeStyle = "#d1e8ec";
    context.lineWidth = 3;
    context.setLineDash([12, 12]);
    context.beginPath();
    context.moveTo(500, 0); context.lineTo(500, 1000);
    context.moveTo(0, 500); context.lineTo(1000, 500);
    context.stroke();
    context.setLineDash([]);
    if (currentRef.current.showGuide) {
      context.font = '600 790px "Handwriting Guide", serif';
      context.textAlign = "left";
      context.textBaseline = "alphabetic";
      context.fillStyle = "#d2d9e2";
      const metrics = context.measureText(currentRef.current.character);
      const x = 500 + (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2;
      const y = 500 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      context.fillText(currentRef.current.character, x, y);
    }
    for (const stroke of currentRef.current.strokes) drawStroke(context, stroke);
    if (activeRef.current) drawStroke(context, activeRef.current.stroke);
  }, []);

  const queuePaint = useCallback(() => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    let alive = true;
    document.fonts.load('600 790px "Handwriting Guide"', character).then(() => {
      if (alive) { setFontReady(true); queuePaint(); }
    }).catch(() => { if (alive) queuePaint(); });
    return () => { alive = false; };
  }, [character, queuePaint]);

  useEffect(() => { queuePaint(); }, [character, strokes, showGuide, queuePaint]);
  useEffect(() => {
    const observer = new ResizeObserver(queuePaint);
    if (canvasRef.current?.parentElement) observer.observe(canvasRef.current.parentElement);
    queuePaint();
    const cancel = () => { activeRef.current = null; queuePaint(); };
    window.addEventListener("blur", cancel);
    return () => {
      observer.disconnect();
      window.removeEventListener("blur", cancel);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [queuePaint]);

  const pointFor = (event: { clientX: number; clientY: number }): InkPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return getInkPoint(event.clientX, event.clientY, {
      left: rect.left + canvas.clientLeft, top: rect.top + canvas.clientTop,
      width: canvas.clientWidth, height: canvas.clientHeight
    });
  };

  const appendPoint = (event: { clientX: number; clientY: number }) => {
    const active = activeRef.current;
    const point = pointFor(event);
    if (!active || !point || active.stroke.points.length >= 4000) return;
    const last = active.stroke.points.at(-1)!;
    if (Math.hypot(point.x - last.x, point.y - last.y) > 0.001) active.stroke.points.push(point);
  };

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>, cancelled = false) => {
    const active = activeRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (!cancelled) appendPoint(event);
    activeRef.current = null;
    if (!cancelled) currentRef.current.onChange([...currentRef.current.strokes, active.stroke]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    queuePaint();
  };

  return <canvas
    ref={canvasRef}
    className="tracing-canvas"
    aria-label={`${character}をなぞるマス`}
    data-font-ready={fontReady}
    onPointerDown={(event) => {
      if (activeRef.current || !event.isPrimary || event.button !== 0 || strokes.length >= 150) return;
      const point = pointFor(event);
      if (!point) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activeRef.current = { pointerId: event.pointerId, stroke: { points: [point], width: currentRef.current.penWidth } };
      queuePaint();
    }}
    onPointerMove={(event) => {
      if (activeRef.current?.pointerId !== event.pointerId) return;
      event.preventDefault();
      const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
      for (const sample of samples.length ? samples : [event.nativeEvent]) appendPoint(sample);
      queuePaint();
    }}
    onPointerUp={(event) => endStroke(event)}
    onPointerCancel={(event) => endStroke(event, true)}
    onLostPointerCapture={(event) => endStroke(event, true)}
  >{character}の書き取り</canvas>;
}
