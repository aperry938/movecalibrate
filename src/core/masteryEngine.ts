import type { CalibrationOutcome, MasteryRecord } from './types';

/** Spaced repetition intervals in days, indexed by mastery level 0-5. */
export const MASTERY_INTERVALS = [0, 1, 3, 7, 14, 30];

/** Maximum mastery level (Mastered). */
export const MAX_MASTERY_LEVEL = 5;

/** Rolling window size for quality history. */
export const QUALITY_HISTORY_SIZE = 20;

/** Human-readable labels for each mastery tier. */
const MASTERY_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Familiar',
  3: 'Comfortable',
  4: 'Proficient',
  5: 'Mastered',
};

/**
 * Mastery level deltas for each calibration outcome.
 *
 * CC  +1  Well-calibrated, good form
 * UC  +1  Correct form, just unsure — still progresses
 * UI  -2  Poor form, appropriately uncertain
 * CI  -3  Poor form, overconfident — harshest regression
 */
const MASTERY_DELTAS: Record<CalibrationOutcome, number> = {
  CC: 1,
  UC: 1,
  UI: -2,
  CI: -3,
};

/**
 * Create a fresh mastery record for an exercise attempted for the first time.
 */
export function createMasteryRecord(): MasteryRecord {
  const now = new Date().toISOString();
  return {
    masteryLevel: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
    lastPerformed: now,
    nextReview: now, // immediately available for review
    qualityHistory: [],
    averageQuality: 0,
    bestQuality: 0,
  };
}

/**
 * Update a mastery record after a calibration outcome.
 *
 * Returns a new record (immutable update). The mastery level is adjusted by
 * the outcome's delta and clamped to [0, MAX_MASTERY_LEVEL]. Quality history
 * is maintained as a rolling window of the last QUALITY_HISTORY_SIZE scores.
 */
export function updateMastery(
  record: MasteryRecord,
  outcome: CalibrationOutcome,
  qualityScore: number,
): MasteryRecord {
  const delta = MASTERY_DELTAS[outcome];
  const newLevel = Math.max(0, Math.min(MAX_MASTERY_LEVEL, record.masteryLevel + delta));

  const isCorrect = outcome === 'CC' || outcome === 'UC';
  const timesCorrect = record.timesCorrect + (isCorrect ? 1 : 0);
  const timesIncorrect = record.timesIncorrect + (isCorrect ? 0 : 1);

  // Maintain rolling quality history window
  const qualityHistory = [...record.qualityHistory, qualityScore];
  if (qualityHistory.length > QUALITY_HISTORY_SIZE) {
    qualityHistory.splice(0, qualityHistory.length - QUALITY_HISTORY_SIZE);
  }

  const averageQuality =
    qualityHistory.reduce((sum, q) => sum + q, 0) / qualityHistory.length;
  const bestQuality = Math.max(record.bestQuality, qualityScore);

  const now = new Date().toISOString();

  const updated: MasteryRecord = {
    masteryLevel: newLevel,
    timesCorrect,
    timesIncorrect,
    lastPerformed: now,
    nextReview: '', // computed below
    qualityHistory,
    averageQuality,
    bestQuality,
  };

  updated.nextReview = getNextReview(updated);

  return updated;
}

/**
 * Compute the next review date based on the current mastery level.
 *
 * Uses MASTERY_INTERVALS to determine the number of days from now. Returns
 * an ISO 8601 date string.
 */
export function getNextReview(record: MasteryRecord): string {
  const base = new Date(record.lastPerformed);
  const intervalDays = MASTERY_INTERVALS[record.masteryLevel] ?? 0;
  base.setDate(base.getDate() + intervalDays);
  return base.toISOString().split('T')[0];
}

/**
 * Check whether an exercise is due for review (nextReview is in the past or
 * today).
 */
export function isDueForReview(record: MasteryRecord, today?: Date): boolean {
  const now = today ?? new Date();
  const reviewDate = new Date(record.nextReview);
  return reviewDate <= now;
}

/**
 * Get the human-readable label for a mastery level.
 */
export function getMasteryLabel(level: number): string {
  return MASTERY_LABELS[level] ?? 'Unknown';
}
