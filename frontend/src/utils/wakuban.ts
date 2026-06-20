/**
 * Japanese racing frame (枠番) colours, indexed 1–8.
 */
export const WAKU_COLORS: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: '#FFFFFF', text: '#1a1a1a', label: 'White' },
    2: { bg: '#1a1a1a', text: '#FFFFFF', label: 'Black' },
    3: { bg: '#E53E3E', text: '#FFFFFF', label: 'Red' },
    4: { bg: '#3182CE', text: '#FFFFFF', label: 'Blue' },
    5: { bg: '#D69E2E', text: '#FFFFFF', label: 'Yellow' },
    6: { bg: '#38A169', text: '#FFFFFF', label: 'Green' },
    7: { bg: '#DD6B20', text: '#FFFFFF', label: 'Orange' },
    8: { bg: '#D53F8C', text: '#FFFFFF', label: 'Pink' },
};

type FrameMap = Record<number, number[]>;

const JRA_FRAME_MAPS: FrameMap = {
    9:  [1,2,3,4,5,6,7,8,8],
    10: [1,2,3,4,5,6,7,7,8,8],
    11: [1,2,3,4,5,6,6,7,7,8,8],
    12: [1,2,3,4,5,5,6,6,7,7,8,8],
    13: [1,2,3,4,4,5,5,6,6,7,7,8,8],
    14: [1,2,3,3,4,4,5,5,6,6,7,7,8,8],
    15: [1,2,2,3,3,4,4,5,5,6,6,7,7,8,8],
    16: [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8],
    17: [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,8],
    18: [1,1,2,2,3,3,4,4,5,5,6,6,7,7,7,8,8,8],
};

/**
 * Derives the 枠番 (frame number, 1–8) from the gate number and total runners.
 *
 * Japanese racing frame assignment rules:
 * - 8 or fewer runners    → frame == gate (1:1)
 * - 9–16 runners          → outer frames may hold 2 horses
 * - Frames fill from the outside (frame 1 fills last / stays single longest)
 *
 * Standard JRA assignment table (gate → frame):
 * This mirrors the official JRA 枠番 allocation table.
 */
export function getWakuban(gateNumber: number, numberOfRunners: number): number | null {
    if (!gateNumber || !numberOfRunners) return null;
    if (numberOfRunners <= 8) return gateNumber;

    const frameMap = JRA_FRAME_MAPS[numberOfRunners];
    return frameMap?.[gateNumber - 1] ?? null;
}