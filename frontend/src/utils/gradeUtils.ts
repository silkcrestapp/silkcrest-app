// Grade scale — index 0 = rank 1 (G), index 14 = rank 15 (S+)
export const GRADES = [
  'G', 'F', 'F+', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+', 'S', 'S+',
] as const;

export type Grade = (typeof GRADES)[number];

export const UNKNOWN_LABEL = '???';

/** rank integer (1–15) → grade string. Returns '???' for null/undefined. */
export function rankToGrade(rank: number | null | undefined): Grade | typeof UNKNOWN_LABEL {
  if (rank === null || rank === undefined) return UNKNOWN_LABEL;
  return GRADES[rank - 1] ?? UNKNOWN_LABEL;
}

/** grade string → rank integer (1–15). Returns null for unknown. */
export function gradeToRank(grade: Grade): number {
  return GRADES.indexOf(grade) + 1;
}

/**
 * Tailwind text-color class for a grade.
 * Returns a muted class for unknown stats.
 */
export function gradeColorClass(grade: Grade | typeof UNKNOWN_LABEL): string {
  switch (grade) {
    case 'S+': return 'text-purple-500';
    case 'S':  return 'text-teal-500';
    case 'A+': return 'text-blue-500';
    case 'A':  return 'text-green-600';
    case 'B+': return 'text-amber-600';
    case 'B':  return 'text-stone-500';
    case 'C+': return 'text-orange-600';
    case 'C':  return 'text-pink-500';
    case 'D+':
    case 'D':
    case 'E+':
    case 'E':
    case 'F+':
    case 'F':
    case 'G':  return 'text-muted-foreground';
    default:   return 'text-muted-foreground'; // '???'
  }
}

/**
 * Hex color for Chart.js radar (cannot use Tailwind/CSS vars).
 * Returns a muted hex for unknown stats.
 */
export function gradeColorHex(grade: Grade | typeof UNKNOWN_LABEL): string {
  switch (grade) {
    case 'S+': return '#7F77DD';
    case 'S':  return '#1D9E75';
    case 'A+': return '#378ADD';
    case 'A':  return '#3B6D11';
    case 'B+': return '#BA7517';
    case 'B':  return '#5F5E5A';
    case 'C+': return '#993C1D';
    case 'C':  return '#D4537E';
    default:   return '#B4B2A9'; // D+ and below, and '???'
  }
}

/**
 * Radar chart plot value for a rank.
 * Unknown stats are plotted at 1 level below the lowest known stat,
 * with a floor of 1. If all stats are unknown, returns 0 (chart hides them).
 */
export function radarValue(
  rank: number | null | undefined,
  lowestKnownRank: number
): number {
  if (rank !== null && rank !== undefined) return rank;
  return Math.max(1, lowestKnownRank - 1);
}

/**
 * Given an array of nullable ranks, returns the lowest known rank.
 * Falls back to 1 if all are unknown.
 */
export function lowestKnownRank(ranks: (number | null | undefined)[]): number {
  const known = ranks.filter((r): r is number => r !== null && r !== undefined);
  return known.length > 0 ? Math.min(...known) : 1;
}