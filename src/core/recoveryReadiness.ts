import type { RecoveryReadiness } from './types';

/** Weight for each readiness component. */
const WEIGHT_QUALITY = 0.35;
const WEIGHT_COVERAGE = 0.30;
const WEIGHT_CALIBRATION = 0.20;
const WEIGHT_CONSISTENCY = 0.15;

/** Maximum possible readiness score (never claim 100%). */
const MAX_READINESS = 99;

/**
 * Compute the 4-factor composite recovery readiness score.
 *
 * Components:
 *   A. Movement Quality  (35%) — scaled accuracy from recent quality scores
 *   B. Exercise Coverage  (30%) — proportion of exercises attempted
 *   C. Calibration Accuracy (20%) — from calibrationEngine
 *   D. Consistency        (15%) — session streak tiers
 *
 * Overall is capped at 99 (never claim perfect readiness).
 */
export function computeReadiness(
  recentQualityScores: number[],
  exercisesAttempted: number,
  totalExercises: number,
  calibrationScore: number,
  studyStreak: number,
): RecoveryReadiness {
  const quality = computeQualityComponent(recentQualityScores);
  const coverage = computeCoverageComponent(exercisesAttempted, totalExercises);
  const calibration = computeCalibrationComponent(calibrationScore);
  const consistency = computeConsistencyComponent(studyStreak);

  const rawOverall =
    quality * WEIGHT_QUALITY +
    coverage * WEIGHT_COVERAGE +
    calibration * WEIGHT_CALIBRATION +
    consistency * WEIGHT_CONSISTENCY;

  const overall = Math.min(MAX_READINESS, Math.round(rawOverall));

  return {
    overall,
    quality: Math.round(quality),
    coverage: Math.round(coverage),
    calibration: Math.round(calibration),
    consistency: Math.round(consistency),
  };
}

/**
 * Component A: Movement Quality (35% weight)
 *
 * Uses a scaled accuracy formula that rewards high quality nonlinearly:
 *   avg >= 90  →  scaled = 100
 *   avg >= 80  →  scaled = 70 + (avg - 80) * 3
 *   avg >= 70  →  scaled = 40 + (avg - 70) * 3
 *   avg <  70  →  scaled = avg * 0.57
 *
 * Returns 0 if no quality scores are available.
 */
function computeQualityComponent(recentQualityScores: number[]): number {
  if (recentQualityScores.length === 0) return 0;

  const avg =
    recentQualityScores.reduce((sum, q) => sum + q, 0) /
    recentQualityScores.length;

  if (avg >= 90) return 100;
  if (avg >= 80) return 70 + (avg - 80) * 3;
  if (avg >= 70) return 40 + (avg - 70) * 3;
  return avg * 0.57;
}

/**
 * Component B: Exercise Coverage (30% weight)
 *
 * Linear proportion of unique exercises attempted vs total available.
 * Capped at 100.
 */
function computeCoverageComponent(
  exercisesAttempted: number,
  totalExercises: number,
): number {
  if (totalExercises <= 0) return 0;
  const coverage = (exercisesAttempted / totalExercises) * 100;
  return Math.min(100, coverage);
}

/**
 * Component C: Calibration Accuracy (20% weight)
 *
 * Direct use of the calibration score from calibrationEngine (already 0-100).
 * Clamped for safety.
 */
function computeCalibrationComponent(calibrationScore: number): number {
  return Math.max(0, Math.min(100, calibrationScore));
}

/**
 * Component D: Consistency (15% weight)
 *
 * Tiered scoring based on consecutive session days (streak):
 *   >= 30 days → 100
 *   >= 21 days →  85
 *   >= 14 days →  70
 *   >=  7 days →  50
 *   >=  3 days →  30
 *   >=  1 day  →  10
 *   0 days     →   0
 */
function computeConsistencyComponent(studyStreak: number): number {
  const streak = Math.max(0, studyStreak);
  if (streak >= 30) return 100;
  if (streak >= 21) return 85;
  if (streak >= 14) return 70;
  if (streak >= 7) return 50;
  if (streak >= 3) return 30;
  if (streak >= 1) return 10;
  return 0;
}
