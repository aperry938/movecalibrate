/**
 * MoveCalibrate Quality Scoring
 *
 * Computes movement quality from biomechanical features against an exercise
 * profile's ideal ranges. Ported from ZENith's biomechanical_features.py
 * scoring logic.
 *
 * Three entry points:
 *   computeQualityScore  — single 0-100 score for a rep
 *   getDeviations        — per-feature breakdown of form errors
 *   checkCompensations   — detect common movement fault patterns
 */

import type {
  BiomechanicalFeatures,
  ExerciseProfile,
  Deviation,
} from './types';
import { FeatureIndex } from './types';

// ── Feature Name Lookup ─────────────────────────────────────────────────────

/**
 * Map from FeatureIndex numeric value to human-readable name.
 * Built once from the enum for use in deviation reports.
 */
const FEATURE_NAMES: Record<number, string> = {};
for (const key of Object.keys(FeatureIndex)) {
  const val = (FeatureIndex as Record<string, number | string>)[key];
  if (typeof val === 'number') {
    FEATURE_NAMES[val] = key;
  }
}

/**
 * Get the human-readable name for a feature index.
 */
function featureName(index: number): string {
  return FEATURE_NAMES[index] ?? `FEATURE_${index}`;
}

// ── Quality Score ───────────────────────────────────────────────────────────

/**
 * Compute a quality score (0-100) for a single exercise rep.
 *
 * Algorithm:
 *   1. Look up the ideal ranges for the requested difficulty level.
 *   2. For each critical feature in the exercise profile:
 *      a. Read the actual value from the features array.
 *      b. If the value falls within [min, max]: featureScore = 100.
 *      c. Otherwise: penalty = |actual - nearestBound| / rangeWidth * 200
 *         featureScore = max(0, 100 - penalty).
 *   3. The final quality score is the mean of all feature scores, clamped to [0, 100].
 *
 * Features that appear in criticalFeatures but have no ideal range defined for
 * the chosen difficulty level are skipped (not penalized).
 */
export function computeQualityScore(
  features: BiomechanicalFeatures,
  profile: ExerciseProfile,
  difficultyLevel: number,
): number {
  const level = profile.difficultyLevels.find(
    (dl) => dl.level === difficultyLevel,
  );
  if (!level) return 0;

  const scores: number[] = [];

  for (const featureIndex of profile.criticalFeatures) {
    const range = level.idealRanges[featureIndex];
    if (!range) continue;

    const [idealMin, idealMax] = range;
    const actual = features[featureIndex];

    if (actual >= idealMin && actual <= idealMax) {
      scores.push(100);
    } else {
      const rangeWidth = idealMax - idealMin;
      // Avoid division by zero for point ranges
      const effectiveWidth = rangeWidth > 0 ? rangeWidth : 0.01;
      const nearestBound = actual < idealMin ? idealMin : idealMax;
      const distance = Math.abs(actual - nearestBound);
      const penalty = (distance / effectiveWidth) * 200;
      scores.push(Math.max(0, 100 - penalty));
    }
  }

  if (scores.length === 0) return 0;

  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.max(0, Math.min(100, mean));
}

// ── Deviations ──────────────────────────────────────────────────────────────

/**
 * Get per-feature deviations from ideal form for a single rep.
 *
 * Returns a Deviation object for every critical feature whose actual value
 * falls outside the ideal range. Features within range are omitted.
 *
 * Severity is the absolute distance from the nearest bound, normalized by
 * the ideal range width. A severity of 1.0 means the actual value is one
 * full range-width away from the ideal zone.
 */
export function getDeviations(
  features: BiomechanicalFeatures,
  profile: ExerciseProfile,
  difficultyLevel: number,
): Deviation[] {
  const level = profile.difficultyLevels.find(
    (dl) => dl.level === difficultyLevel,
  );
  if (!level) return [];

  const deviations: Deviation[] = [];

  for (const featureIndex of profile.criticalFeatures) {
    const range = level.idealRanges[featureIndex];
    if (!range) continue;

    const [idealMin, idealMax] = range;
    const actual = features[featureIndex];

    if (actual >= idealMin && actual <= idealMax) continue;

    const rangeWidth = idealMax - idealMin;
    const effectiveWidth = rangeWidth > 0 ? rangeWidth : 0.01;
    const direction: 'too_high' | 'too_low' =
      actual > idealMax ? 'too_high' : 'too_low';
    const nearestBound = direction === 'too_high' ? idealMax : idealMin;
    const severity = Math.abs(actual - nearestBound) / effectiveWidth;

    deviations.push({
      featureName: featureName(featureIndex),
      featureIndex,
      actual,
      idealMin,
      idealMax,
      direction,
      severity,
    });
  }

  return deviations;
}

// ── Compensation Detection ──────────────────────────────────────────────────

/**
 * Check for compensation patterns in the current frame.
 *
 * For each compensation rule in the exercise profile, all feature checks must
 * be satisfied simultaneously for the compensation to be flagged. This
 * implements an AND gate: a single unmet condition means the compensation is
 * not detected.
 *
 * Returns the names of all detected compensations. An empty array means no
 * compensations were observed.
 */
export function checkCompensations(
  features: BiomechanicalFeatures,
  profile: ExerciseProfile,
): string[] {
  const detected: string[] = [];

  for (const rule of profile.compensationRules) {
    let allMet = true;

    for (const check of rule.featureChecks) {
      const actual = features[check.featureIndex];

      if (check.condition === 'above' && actual <= check.threshold) {
        allMet = false;
        break;
      }
      if (check.condition === 'below' && actual >= check.threshold) {
        allMet = false;
        break;
      }
    }

    if (allMet) {
      detected.push(rule.name);
    }
  }

  return detected;
}
