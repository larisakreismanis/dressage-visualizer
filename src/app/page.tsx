'use client';
import React, { useMemo, useState } from 'react';

// Types
type LineSeg = { type: 'line'; waypoints: string[]; label?: string };
type CircleSeg = { type: 'circle'; at: string; direction: 'left' | 'right'; label?: string };
type Segment = LineSeg | CircleSeg;

// Inner arena size in px (maps 20m x 40m)
const ARENA_W = 200;
const ARENA_H = 400;

// Visual padding so nothing clips
const PAD = 24;           // outer margin around the whole SVG
const LABEL_OFFSET = 14;  // how far labels sit outside the rail

// Root SVG size includes padding
const W = ARENA_W + PAD * 2;
const H = ARENA_H + PAD * 2;

// Helpers to convert inner arena coords to SVG coords
const X = (x: number) => x + PAD;
const Y = (y: number) => y + PAD;

// --- Geometry (letter anchor points INSIDE the arena box) ---
// Coordinate system: (0,0) is top-left corner INSIDE the arena,
// y increases downward. C at top mid, A at bottom mid.
//
// Distances along the long side (40 m):
// - 6 m from either short end for F/K and M/H
// - 20 m mid for B/E and X
const Y_TOP_6  = (6 / 40) * ARENA_H;   // 6m from top = near C
const Y_MID_20 = (20 / 40) * ARENA_H;  // middle
const Y_BOT_34 = (34 / 40) * ARENA_H;  // 6m up from A

const geom: Record<string, { x: number; y: number }> = {
  // short sides
  C: { x: ARENA_W / 2, y: 0 },
  A: { x: ARENA_W / 2, y: ARENA_H },

  // left rail (A → C): K (bottom), E (middle), H (top)
K: { x: 0, y: Y_BOT_34 },
E: { x: 0, y: Y_MID_20 },
H: { x: 0, y: Y_TOP_6 },

// right rail (A → C): F (bottom), B (middle), M (top)
F: { x: ARENA_W, y: Y_BOT_34 },
B: { x: ARENA_W, y: Y_MID_20 },
M: { x: ARENA_W, y: Y_TOP_6 },



  // centerline
  G: { x: ARENA_W / 2, y: Y_TOP_6 },
  X: { x: ARENA_W / 2, y: Y_MID_20 },
  D: { x: ARENA_W / 2, y: Y_BOT_34 },
};

// Map used by path renderer
function pts(letters: string[]) {
  return letters
    .map((id) => {
      const p = geom[id];
      if (!p) throw new Error(`Unknown letter ${id}`);
      return `${X(p.x)},${Y(p.y)}`;
    })
    .join(' ');
}

// --- Label positions (OUTSIDE the arena box) ---
function labelPos(id: string) {
  const p = geom[id];
  if (!p) throw new Error(`Unknown letter ${id}`);

  // top/bottom center labels outside the short sides
  if (id === 'C') return { x: p.x, y: -LABEL_OFFSET, anchor: 'middle' as const, dy: 0 };
  if (id === 'A') return { x: p.x, y: ARENA_H + LABEL_OFFSET, anchor: 'middle' as const, dy: 0 };

 // left rail letters outside to the left
if (id === 'K' || id === 'E' || id === 'H') {
  return { x: -LABEL_OFFSET, y: p.y, anchor: 'end' as const, dy: 0 };
}
// right rail letters outside to the right
if (id === 'F' || id === 'B' || id === 'M') {
  return { x: ARENA_W + LABEL_OFFSET, y: p.y, anchor: 'start' as const, dy: 0 };
}


  // centerline letters also outside on the right, a bit further so they don't overlap right-rail labels
  if (id === 'D' || id === 'X' || id === 'G') {
    return { x: ARENA_W + LABEL_OFFSET * 3, y: p.y, anchor: 'start' as const, dy: 0 };
  }

  // fallback (shouldn't hit)
  return { x: p.x, y: p.y, anchor: 'middle' as const, dy: 0 };
}

// Order to draw labels (purely cosmetic)
const LETTERS: string[] = ['C', 'M', 'B', 'F', 'H', 'E', 'K', 'G', 'X', 'D', 'A'];

// --- Test data (approximate Intro A) ---
const introA_20x40: Segment[] = [
  { type: 'line', waypoints: ['A', 'X', 'C'], label: 'Enter (trot), then walk' },
  { type: 'line', waypoints: ['C', 'M'], label: 'Track right, trot' },
  { type: 'circle', at: 'B', direction: 'right', label: '20 m circle right' },
  { type: 'line', waypoints: ['K', 'X', 'M'], label: 'Change rein' },
  { type: 'circle', at: 'E', direction: 'left', label: '20 m circle left' },
  { type: 'line', waypoints: ['E', 'C', 'H'], label: 'Walk' },
  { type: 'line', waypoints: ['H', 'X', 'F'], label: 'Free walk on diagonal' },
  { type: 'line', waypoints: ['F', 'A', 'X'], label: 'Down centerline (walk)' },
];

// 20 m circle: radius is half the width of the arena
function CircleAt({ at }: { at: string }) {
  const p = geom[at];
  if (!p) return null;
  const cx = X(ARENA_W / 2);   // centered horizontally
  const cy = Y(p.y);           // same Y as the letter (B or E)
  const r = ARENA_W / 2;       // 10 m in real units
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} />;
}

function SegmentLabel({ label, near }: { label: string; near: string }) {
  const p = geom[near];
  if (!p) return null;
  return (
    <text x={X(p.x)} y={Y(p.y)} dy={-8} fontSize={10} textAnchor="middle">
      {label}
    </text>
  );
}

function DrawSegment({ seg }: { seg: Segment }) {
  if (seg.type === 'line') {
    const way = seg.waypoints.filter(Boolean);
    const last = way[way.length - 1] ?? 'X';
    return (
      <g>
        <polyline
          points={pts(way)}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeOpacity={0.9}
        />
        {seg.label ? <SegmentLabel label={seg.label} near={last} /> : null}
      </g>
    );
  }
  if (seg.type === 'circle') {
    return (
      <g>
        <CircleAt at={seg.at} />
        {seg.label ? <SegmentLabel label={seg.label} near={seg.at} /> : null}
      </g>
    );
  }
  return null;
}

export default function Page() {
  const [visible, setVisible] = useState<boolean[]>(() => introA_20x40.map(() => true));
  const anyHidden = useMemo(() => visible.some((v) => !v), [visible]);
  const toggleAll = (on: boolean) => setVisible(introA_20x40.map(() => on));

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>USDF 2023 Intro A, 20x40 visualizer</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()}>Print</button>
          <button onClick={() => toggleAll(true)}>Show all</button>
          <button onClick={() => toggleAll(false)}>Hide all</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 16 }}>
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
            {/* inner arena */}
            <rect x={X(0)} y={Y(0)} width={ARENA_W} height={ARENA_H} fill="none" stroke="#222" strokeWidth={2} />

            {/* quarter lines */}
            <line x1={X(0)} y1={Y(ARENA_H * 0.25)} x2={X(ARENA_W)} y2={Y(ARENA_H * 0.25)} stroke="#e0e0e0" strokeDasharray="4 4" />
            <line x1={X(0)} y1={Y(ARENA_H * 0.75)} x2={X(ARENA_W)} y2={Y(ARENA_H * 0.75)} stroke="#e0e0e0" strokeDasharray="4 4" />

            {/* centerline */}
            <line x1={X(ARENA_W / 2)} y1={Y(0)} x2={X(ARENA_W / 2)} y2={Y(ARENA_H)} stroke="#bbb" strokeDasharray="4 4" />

            {/* labels outside the box */}
            {LETTERS.map((id) => {
              const p = labelPos(id);
              return (
                <text
                  key={id}
                  x={X(p.x)}
                  y={Y(p.y)}
                  fontSize={12}
                  textAnchor={p.anchor}
                  dominantBaseline="middle"
                >
                  {id}
                </text>
              );
            })}

            {/* path */}
            <g stroke="#0b74ff">
              {introA_20x40.map((seg, i) => (visible[i] ? <DrawSegment key={i} seg={seg} /> : null))}
            </g>
          </svg>

          <div style={{ fontSize: 12, color: '#444', marginTop: 8 }}>
            Blue lines are an approximate path for demo purposes.
          </div>
        </div>

        <aside style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <strong>Segments</strong>
            <span style={{ fontSize: 12, color: '#666' }}>{anyHidden ? 'Some hidden' : 'All visible'}</span>
          </div>
          <hr />
          <ol style={{ paddingLeft: 18, lineHeight: 1.5 }}>
            {introA_20x40.map((seg, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={visible[i]}
                  onChange={(e) => {
                    const v = [...visible];
                    v[i] = e.target.checked;
                    setVisible(v);
                  }}
                />
                <span>{seg.label || (seg.type === 'line' ? seg.waypoints.join(' → ') : `Circle at ${seg.at}`)}</span>
              </li>
            ))}
          </ol>
          <hr />
          <p style={{ fontSize: 12, color: '#666' }}>
            For official test text and diagrams, reference the USDF 2023 Intro A test from USDF or USEF. Do not redistribute PDFs.
          </p>
        </aside>
      </div>
    </div>
  );
}
