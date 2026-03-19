import type {
  CalibrationOutcome,
  ConfidenceRating,
  CalibrationEntry,
} from './types';

/** Quality threshold for "correct" movement (configurable) */
export const QUALITY_THRESHOLD = 70;

/**
 * Determine the 4-outcome calibration result from confidence and quality.
 *
 * CC — confident and correct form
 * UC — unsure but correct form
 * UI — unsure and incorrect form
 * CI — confident but incorrect form (worst: overconfident with poor form)
 */
export function computeOutcome(
  confidence: ConfidenceRating,
  qualityScore: number,
  threshold = QUALITY_THRESHOLD,
): CalibrationOutcome {
  const correct = qualityScore >= threshold;

  if (confidence === 'confident' && correct) return 'CC';
  if (confidence === 'unsure' && correct) return 'UC';
  if (confidence === 'unsure' && !correct) return 'UI';
  // confidence === 'confident' && !correct
  return 'CI';
}

/**
 * Points awarded for each calibration outcome.
 *
 * CC  +3  Well-calibrated, good form
 * UC  -1  Good form but underconfident
 * UI  -2  Poor form, appropriately uncertain
 * CI  -5  Poor form, overconfident (harshest penalty)
 */
export function computePoints(outcome: CalibrationOutcome): number {
  switch (outcome) {
    case 'CC': return 3;
    case 'UC': return -1;
    case 'UI': return -2;
    case 'CI': return -5;
  }
}

/**
 * Compute the calibration gap between self-assessed confidence and actual
 * movement quality.
 *
 * Positive values indicate overconfidence; negative values indicate
 * underconfidence.
 *
 * Confidence mapping:  unsure → 0.3,  confident → 0.8
 * Quality mapping:     qualityScore / 100  (linear 0-1)
 */
export function computeCalibrationGap(
  confidence: ConfidenceRating,
  qualityScore: number,
): number {
  const confidenceValue = confidence === 'confident' ? 0.8 : 0.3;
  const qualityValue = qualityScore / 100;
  return confidenceValue - qualityValue;
}

/**
 * Time-weighted calibration score with exponential decay.
 *
 * Uses a 14-day half-life so recent sessions matter more than old ones.
 * Returns a score in [0, 100]. Requires at least 5 entries to produce a
 * meaningful score; returns 50 (neutral) otherwise.
 *
 * Formula:
 *   decayFactor = 0.5 ^ (daysSinceEntry / halfLife)
 *   weightedScore = sum(points * decay) / sum(maxPoints * decay) * 100
 */
export function computeCalibrationScore(
  history: CalibrationEntry[],
  decayHalfLifeDays = 14,
): number {
  if (history.length < 5) return 50;

  const now = Date.now();
  const msPerDay = 86_400_000;
  const maxPointsPerEntry = 3; // CC gives +3, the theoretical max

  let weightedPointsSum = 0;
  let weightedMaxSum = 0;

  for (const entry of history) {
    const entryTime = new Date(entry.timestamp).getTime();

    const daysSince = (now - entryTime) / msPerDay;
    const decayFactor = Math.pow(0.5, daysSince / decayHalfLifeDays);

    weightedPointsSum += entry.points * decayFactor;
    weightedMaxSum += maxPointsPerEntry * decayFactor;
  }

  if (weightedMaxSum === 0) return 50;

  const raw = (weightedPointsSum / weightedMaxSum) * 100;
  return Math.max(0, Math.min(100, raw));
}

/**
 * Check whether a movement quality score meets the "correct" threshold.
 */
export function isCorrectMovement(
  qualityScore: number,
  threshold = QUALITY_THRESHOLD,
): boolean {
  return qualityScore >= threshold;
}
