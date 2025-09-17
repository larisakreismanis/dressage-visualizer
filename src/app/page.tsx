'use client';
import React, { useMemo, useState } from 'react';

// Types
type LineSeg = { type: 'line'; waypoints: string[]; label?: string };
type CircleSeg = { type: 'circle'; at: string; direction: 'left' | 'right'; label?: string };
type Segment = LineSeg | CircleSeg;

// Geometry, 20x40 small arena
const W = 400, H = 200;
const letterCoords: Record<string, { x: number; y: number }> = {
  A: { x: 0, y: H / 2 },
  C: { x: W, y: H / 2 },
  K: { x: (W * 1) / 6, y: H - 2 },
  E: { x: (W * 3) / 6, y: H - 2 },
  H: { x: (W * 5) / 6, y: H - 2 },
  F: { x: (W * 1) / 6, y: 2 },
  B: { x: (W * 3) / 6, y: 2 },
  M: { x: (W * 5) / 6, y: 2 },
  D: { x: (W * 1) / 3, y: H / 2 },
  X: { x: (W * 1) / 2, y: H / 2 },
  G: { x: (W * 2) / 3, y: H / 2 },
};

function pts(letters: string[]) {
  return letters
    .map((id) => {
      const p = letterCoords[id];
      if (!p) throw new Error(`Unknown letter ${id}`);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

// Approximate Intro A segments for demo
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

function CircleAt({ at }: { at: string }) {
  const c = letterCoords[at];
  if (!c) return null;
  const r = H / 4; // ~10 m
  return <circle cx={c.x} cy={c.y} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} />;
}

function SegmentLabel({ label, near }: { label: string; near: string }) {
  const p = letterCoords[near];
  if (!p) return null;
  return (
    <text x={p.x} y={p.y} dy={-8} fontSize={10} textAnchor="middle">
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
            {/* rail */}
            <rect x={0} y={0} width={W} height={H} fill="none" stroke="#222" strokeWidth={2} />
{/* quarter lines */}
<line x1={0} y1={H * 0.25} x2={W} y2={H * 0.25} stroke="#e0e0e0" strokeDasharray="4 4" />
<line x1={0} y1={H * 0.75} x2={W} y2={H * 0.75} stroke="#e0e0e0" strokeDasharray="4 4" />

            {/* centerline */}
            <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#bbb" strokeDasharray="4 4" />

            {/* letters */}
            {Object.entries(letterCoords).map(([id, p]) => (
              <text key={id} x={p.x} y={p.y} fontSize={12} textAnchor="middle" dominantBaseline="middle">
                {id}
              </text>
            ))}

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
