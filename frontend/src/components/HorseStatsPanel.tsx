// src/components/HorseStatsPanel.tsx

import type { Horse } from '../types/database';
import {
  rankToGrade,
  gradeColorClass,
  radarValue,
  lowestKnownRank,
  UNKNOWN_LABEL,
} from '../utils/gradeUtils';

// ── Stat definitions ────────────────────────────────────────

interface StatDef {
  key: keyof Pick<
    Horse,
    'speed' | 'stamina' | 'power' | 'guts' | 'intelligence' | 'spurt' | 'flexibility' | 'health'
  >;
  jp: string;
  en: string;
}

const STATS: StatDef[] = [
  { key: 'speed',        jp: 'スピード',   en: 'Speed'        },
  { key: 'stamina',      jp: 'スタミナ',   en: 'Stamina'      },
  { key: 'power',        jp: 'パワー',     en: 'Power'        },
  { key: 'guts',         jp: '勝負根性',   en: 'Guts'         },
  { key: 'intelligence', jp: '賢さ',       en: 'Intelligence' },
  { key: 'spurt',        jp: '瞬発力',     en: 'Spurt'        },
  { key: 'flexibility',  jp: '柔軟性',     en: 'Flexibility'  },
  { key: 'health',       jp: '健康',       en: 'Health'       },
];

// ── SVG Radar chart ──────────────────────────────────────────

const SIZE    = 260;
const CX      = SIZE / 2;
const CY      = SIZE / 2;
const RADIUS  = 88;   // chart shape radius
const LABEL_R = 112;  // label ring radius — outside the shape
const SIDES   = STATS.length;
const RINGS   = 5;

function angleOf(i: number) {
  // Start at top (-90°)
  return (Math.PI * 2 * i) / SIDES - Math.PI / 2;
}

function point(r: number, i: number) {
  const a = angleOf(i);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function polygonPoints(values: number[], maxVal: number) {
  return values
    .map((v, i) => {
      const r = (v / maxVal) * RADIUS;
      const p = point(r, i);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

interface RadarSVGProps {
  ranks: (number | null | undefined)[];
  lowest: number;
}

function RadarSVG({ ranks, lowest }: RadarSVGProps) {
  const MAX = 15;
  const values = ranks.map(r => radarValue(r, lowest));

  // Grid ring polygons
  const rings = Array.from({ length: RINGS }, (_, i) => {
    const fraction = (i + 1) / RINGS;
    const pts = Array.from({ length: SIDES }, (_, j) => {
      const r = fraction * RADIUS;
      const p = point(r, j);
      return `${p.x},${p.y}`;
    }).join(' ');
    return pts;
  });

  // Axis lines from center to each vertex
  const axes = Array.from({ length: SIDES }, (_, i) => {
    const p = point(RADIUS, i);
    return { x2: p.x, y2: p.y };
  });

  const shapePts = polygonPoints(values, MAX);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-label="Radar chart of horse stat grades"
      role="img"
    >
      {/* Grid rings */}
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={CX} y1={CY}
          x2={a.x2} y2={a.y2}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={0.5}
        />
      ))}

      {/* Data shape */}
      <polygon
        points={shapePts}
        fill="#7F77DD"
        fillOpacity={0.15}
        stroke="#7F77DD"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {values.map((v, i) => {
        const r = (v / MAX) * RADIUS;
        const p = point(r, i);
        const known = ranks[i] !== null && ranks[i] !== undefined;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={known ? '#534AB7' : 'currentColor'}
            fillOpacity={known ? 1 : 0.15}
          />
        );
      })}

      {/* Labels */}
      {STATS.map((stat, i) => {
        const p = point(LABEL_R, i);
        const angle = angleOf(i);
        // Align text based on which side of the chart it's on
        const anchor =
          Math.abs(angle) < 0.1 || Math.abs(angle - Math.PI) < 0.1
            ? 'middle'
            : Math.cos(angle) > 0.05
            ? 'start'
            : Math.cos(angle) < -0.05
            ? 'end'
            : 'middle';
        return (
          <text
            key={stat.key}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="central"
            fontSize={10}
            fill="currentColor"
            fillOpacity={0.5}
          >
            {stat.jp}
          </text>
        );
      })}
    </svg>
  );
}

// ── Grade item ───────────────────────────────────────────────

interface GradeItemProps {
  stat: StatDef;
  rank: number | null | undefined;
}

function GradeItem({ stat, rank }: GradeItemProps) {
  const grade     = rankToGrade(rank);
  const isUnknown = grade === UNKNOWN_LABEL;

  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted/50 px-3 py-2.5">
      <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
        {stat.jp}
      </span>
      <span className="text-[10px] text-muted-foreground/60">
        {stat.en}
      </span>
      <span
        className={[
          'mt-1 text-xl font-medium',
          isUnknown ? 'text-muted-foreground/40' : gradeColorClass(grade),
        ].join(' ')}
      >
        {grade}
      </span>
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────

interface HorseStatsPanelProps {
  horse: Horse;
}

export function HorseStatsPanel({ horse }: HorseStatsPanelProps) {
  const ranks  = STATS.map(s => horse[s.key] as number | null | undefined);
  const lowest = lowestKnownRank(ranks);

  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      {/* SVG Radar */}
      <div className="flex items-center justify-center">
        <RadarSVG ranks={ranks} lowest={lowest} />
      </div>

      {/* Grade grid */}
      <div className="grid grid-cols-2 gap-2">
        {STATS.map(stat => (
          <GradeItem
            key={stat.key}
            stat={stat}
            rank={horse[stat.key] as number | null | undefined}
          />
        ))}
      </div>
    </div>
  );
}