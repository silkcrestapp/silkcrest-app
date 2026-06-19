/**
 * Converts a finish time string (m:ss.f) to a float for DB storage.
 * e.g. "1:23.4" → 83.4
 * Returns null if the input is invalid.
 */
export function parseFinishTime(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d+):([0-5]\d)(\.\d+)?$/);
    if (!match) return null;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const fraction = match[3] ? parseFloat(match[3]) : 0;

    return minutes * 60 + seconds + fraction;
}

/**
 * Formats a float finish time back to a display string (m:ss.f).
 * e.g. 83.4 → "1:23.4"
 * Returns "—" if the value is null or undefined.
 */
export function formatFinishTime(value: number | null | undefined): string {
    if (value == null) return '—';

    const totalSeconds = Math.floor(value);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const fraction = value - totalSeconds;

    const secStr = seconds.toString().padStart(2, '0');
    const fracStr = fraction > 0
        ? (fraction.toFixed(1)).slice(1) // e.g. ".4"
        : '';

    return `${minutes}:${secStr}${fracStr}`;
}

/**
 * Validates that a finish time string is in the correct format (m:ss.f).
 * Returns an error message or null if valid.
 */
export function validateFinishTime(value: string): string | null {
    if (!value.trim()) return null; // optional field
    const parsed = parseFinishTime(value);
    if (parsed === null) return 'Use format m:ss.f (e.g. 1:23.4)';
    return null;
}