'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { TESTS } from './tests';

// -------- Types --------
type LineSeg = { type: 'line'; waypoints: string[]; label?: string; step: number };
type CircleSeg = { type: 'circle'; at: string; direction: 'left' | 'right'; label?: string; step: number };
type Segment = LineSeg | CircleSeg;

type StepRow = {
  step: number;
  where: string;
  directive: string;
  ideas?: string;
};

type TestDef = {
  id: string;
  name: string;
  rows?: StepRow[];
  steps?: StepRow[];
  segments?: Segment[];
};

// -------- Arena constants --------
const ARENA_W = 200;
const ARENA_H = 400;

const PAD = 24;
const LABEL_OFFSET = 14;

const W = ARENA_W + PAD * 2;
const H = ARENA_H + PAD * 2;

const Xpx = (x: number) => x + PAD;
const Ypx = (y: number) => y + PAD;

// Geometry
const Y_TOP_6 = (6 / 40) * ARENA_H;
const Y_MID_20 = (20 / 40) * ARENA_H;
const Y_BOT_34 = (34 / 40) * ARENA_H;

const geom: Record<string, { x: number; y: number }> = {
  C: { x: ARENA_W / 2, y: 0 },
  A: { x: ARENA_W / 2, y: ARENA_H },

  // left rail (A → C): K/E/H
  K: { x: 0, y: Y_BOT_34 },
  E: { x: 0, y: Y_MID_20 },
  H: { x: 0, y: Y_TOP_6 },

  // right rail (A → C): F/B/M
  F: { x: ARENA_W, y: Y_BOT_34 },
  B: { x: ARENA_W, y: Y_MID_20 },
  M: { x: ARENA_W, y: Y_TOP_6 },

  // centerline
  G: { x: ARENA_W / 2, y: Y_TOP_6 },
  X: { x: ARENA_W / 2, y: Y_MID_20 },
  D: { x: ARENA_W / 2, y: Y_BOT_34 },
};

function toPoints(ids: string[]) {
  return ids
    .map((id) => {
      const p = geom[id];
      if (!p) throw new Error(`Unknown letter ${id}`);
      return `${Xpx(p.x)},${Ypx(p.y)}`;
    })
    .join(' ');
}

const CENTER_GUIDE_COLOR = '#bbb';
const isCenterLetter = (id: string) => id === 'G' || id === 'X' || id === 'D';

function labelPos(id: string) {
  const p = geom[id];
  if (!p) throw new Error(`Unknown letter ${id}`);

  if (id === 'C') return { x: p.x, y: -LABEL_OFFSET, anchor: 'middle' as const };
  if (id === 'A') return { x: p.x, y: ARENA_H + LABEL_OFFSET, anchor: 'middle' as const };

  if (id === 'K' || id === 'E' || id === 'H') return { x: -LABEL_OFFSET, y: p.y, anchor: 'end' as const };
  if (id === 'F' || id === 'B' || id === 'M') return { x: ARENA_W + LABEL_OFFSET, y: p.y, anchor: 'start' as const };

  return { x: p.x, y: p.y, anchor: 'middle' as const };
}

const LETTERS: string[] = ['C', 'M', 'B', 'F', 'H', 'E', 'K', 'G', 'X', 'D', 'A'];

// -------- SVG helpers --------
function CircleAt({ at }: { at: string }) {
  const p = geom[at];
  if (!p) return null;

  const cx = Xpx(ARENA_W / 2);
  const cy = Ypx(p.y);
  const r = ARENA_W / 2;

  return <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} />;
}

function DrawSegment({ seg }: { seg: Segment }) {
  if (seg.type === 'line') {
    return (
      <polyline
        points={toPoints(seg.waypoints)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeOpacity={0.9}
      />
    );
  }
  return <CircleAt at={seg.at} />;
}

// -------- Table grouping --------
function groupByStep(rows: StepRow[]) {
  const groups = new Map<number, StepRow[]>();
  const ordered: number[] = [];

  for (const r of rows) {
    if (!groups.has(r.step)) {
      groups.set(r.step, []);
      ordered.push(r.step);
    }
    groups.get(r.step)!.push(r);
  }

  return ordered.map((step) => ({ step, rows: groups.get(step)! }));
}

function StepsTable4Col({
  rows,
  isStepVisible,
  toggleStep,
}: {
  rows: StepRow[];
  isStepVisible: (step: number) => boolean;
  toggleStep: (step: number, on: boolean) => void;
}) {
  const groups = useMemo(() => groupByStep(rows), [rows]);

  return (
    <table>
      <thead>
        <tr>
          <th style={{ ...th, width: 64 }}>Step</th>
          <th style={{ ...th, width: 160 }}>Location</th>
          <th style={{ ...th, width: 220 }}>Test</th>
          <th style={th}>Directive Ideas</th>
        </tr>
      </thead>

      <tbody>
        {groups.flatMap((g) =>
          g.rows.map((r, idx) => (
            <tr key={`${g.step}-${idx}`}>
              {idx === 0 ? (
                <td style={td} rowSpan={g.rows.length}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isStepVisible(g.step)}
                      onChange={(e) => toggleStep(g.step, e.target.checked)}
                    />
                    <span>{g.step}</span>
                  </label>
                </td>
              ) : null}

              <td style={td}>{r.where}</td>
              <td style={td}>{r.directive}</td>
              <td style={td}>{r.ideas ?? ''}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// -------- Page --------
export default function Page() {
  const tests = TESTS as unknown as Record<string, TestDef>;

  const testIds = useMemo(() => Object.keys(tests), [tests]);
  const defaultTestId = (testIds[0] ?? '') as string;

  const [activeTestId, setActiveTestId] = useState<string>(defaultTestId);

  const activeTest = tests[activeTestId] ?? tests[testIds[0]];
  const stepRows = (activeTest?.rows ?? activeTest?.steps ?? []) as StepRow[];
  const segments = (activeTest?.segments ?? []) as Segment[];

  const stepsInSegments = useMemo(() => {
    const set = new Set<number>();
    for (const s of segments) set.add(s.step);
    return Array.from(set).sort((a, b) => a - b);
  }, [segments]);

  const [hiddenSteps, setHiddenSteps] = useState<Set<number>>(() => new Set());

  React.useEffect(() => {
    setHiddenSteps(new Set());
  }, [activeTestId]);

  const isStepVisible = useCallback(
    (step: number) => !hiddenSteps.has(step),
    [hiddenSteps]
  );

  const toggleStep = useCallback((step: number, on: boolean) => {
    setHiddenSteps((prev) => {
      const next = new Set(prev);
      if (on) next.delete(step);
      else next.add(step);
      return next;
    });
  }, []);

  const showAnyHidden = hiddenSteps.size > 0;

  const toggleAllSteps = useCallback(
    (on: boolean) => {
      if (on) {
        setHiddenSteps(new Set());
        return;
      }
      setHiddenSteps(new Set(stepsInSegments));
    },
    [stepsInSegments]
  );

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Dressage Test Visualizer</h1>
          <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{activeTest?.name ?? 'Dressage Test'}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={activeTestId} onChange={(e) => setActiveTestId(e.target.value)}>
            {testIds.map((id) => (
              <option key={id} value={id}>
                {tests[id]?.name ?? id}
              </option>
            ))}
          </select>

          <button onClick={() => window.print()}>Print</button>
          <button onClick={() => toggleAllSteps(true)}>Check all</button>
          <button onClick={() => toggleAllSteps(false)}>Uncheck all</button>
          <span style={{ fontSize: 12, color: '#666' }}>{showAnyHidden ? 'Some hidden' : 'All visible'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 560px', gap: 16, marginTop: 16 }}>
        {/* Left: Arena */}
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
            <rect x={Xpx(0)} y={Ypx(0)} width={ARENA_W} height={ARENA_H} fill="none" stroke="#222" strokeWidth={2} />

            {/* 6m lines */}
            <line
              x1={Xpx(0)}
              y1={Ypx(Y_TOP_6)}
              x2={Xpx(ARENA_W)}
              y2={Ypx(Y_TOP_6)}
              stroke="#e0e0e0"
              strokeDasharray="4 4"
            />
            <line
              x1={Xpx(0)}
              y1={Ypx(Y_BOT_34)}
              x2={Xpx(ARENA_W)}
              y2={Ypx(Y_BOT_34)}
              stroke="#e0e0e0"
              strokeDasharray="4 4"
            />

            {/* centerline */}
            <line
              x1={Xpx(ARENA_W / 2)}
              y1={Ypx(0)}
              x2={Xpx(ARENA_W / 2)}
              y2={Ypx(ARENA_H)}
              stroke={CENTER_GUIDE_COLOR}
              strokeDasharray="4 4"
            />

            {/* midline (E ↔ B) */}
            <line
              x1={Xpx(0)}
              y1={Ypx(Y_MID_20)}
              x2={Xpx(ARENA_W)}
              y2={Ypx(Y_MID_20)}
              stroke={CENTER_GUIDE_COLOR}
              strokeDasharray="4 4"
            />

            {/* letters */}
            {LETTERS.map((id) => {
              const p = labelPos(id);
              return (
                <text
                  key={id}
                  x={Xpx(p.x)}
                  y={Ypx(p.y)}
                  fontSize={12}
                  textAnchor={p.anchor}
                  dominantBaseline="middle"
                  fill={isCenterLetter(id) ? CENTER_GUIDE_COLOR : '#000'}
                  fontWeight={isCenterLetter(id) ? 600 : 400}
                >
                  {id}
                </text>
              );
            })}

            {/* path (visibility controlled by TABLE checkboxes) */}
            <g stroke="#0b74ff">
              {segments.map((seg, i) => (isStepVisible(seg.step) ? <DrawSegment key={i} seg={seg} /> : null))}
            </g>
          </svg>
        </div>

        {/* Right: Table */}
        <aside style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
          <strong>Test Steps</strong>
          <StepsTable4Col rows={stepRows} isStepVisible={isStepVisible} toggleStep={toggleStep} />

          <p style={{ fontSize: 12, color: '#666', marginTop: 12 }}>
            For official test text and diagrams, reference the USDF 2023 Intro A test from USDF or USEF.
          </p>
        </aside>
      </div>
    </div>
  );
}

// -------- Styles --------
const th: React.CSSProperties = {
  borderBottom: '1px solid #ddd',
  textAlign: 'left',
  padding: '6px',
  fontSize: 12,
};

const td: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: '6px',
  fontSize: 12,
  verticalAlign: 'top',
};
