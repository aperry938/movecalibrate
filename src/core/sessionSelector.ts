import type {
  ExerciseProfile,
  MasteryRecord,
  CompensationFlag,
  ExerciseAssignment,
} from './types';

import { isDueForReview } from './masteryEngine';
import { getPriorityMultiplier } from './compensationDetector';

/** Default session size (exercises per session). */
const DEFAULT_SESSION_SIZE = 8;

/** Pool allocation ratios. */
const WEAK_RATIO = 0.6;
const NEW_RATIO = 0.3;
// REVIEW gets the remainder

/**
 * Build a composite key for mastery record lookup.
 */
function masteryKey(exerciseId: string, difficultyLevel: number): string {
  return `${exerciseId}_${difficultyLevel}`;
}

/**
 * Deterministic-seeded shuffle using Fisher-Yates.
 * Uses Math.random for simplicity; swap in a seeded RNG for reproducibility
 * in tests.
 */
function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Weighted random selection without replacement.
 *
 * Picks `count` items from the pool, where each item's probability of
 * selection is proportional to its weight. Returns the selected items.
 */
function weightedSelect<T extends { weight: number }>(
  pool: T[],
  count: number,
): T[] {
  if (pool.length === 0 || count <= 0) return [];

  const remaining = [...pool];
  const selected: T[] = [];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight <= 0) {
      // All weights are zero; select uniformly
      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(remaining[idx]);
      remaining.splice(idx, 1);
      continue;
    }

    let roll = Math.random() * totalWeight;
    let chosenIdx = 0;

    for (let j = 0; j < remaining.length; j++) {
      roll -= remaining[j].weight;
      if (roll <= 0) {
        chosenIdx = j;
        break;
      }
    }

    selected.push(remaining[chosenIdx]);
    remaining.splice(chosenIdx, 1);
  }

  return selected;
}

/**
 * Select exercises for a session using the 60/30/10 rule.
 *
 * Pool allocation:
 *   WEAK  (60%): mastery < 2, or unresolved compensations, or due for review
 *   NEW   (30%): exercise+difficulty combos not yet attempted (no mastery record)
 *   REVIEW (10%): mastery >= 3, no active compensation flags
 *
 * Weak pool weighting:
 *   - Lower mastery = higher base weight (6 - masteryLevel)
 *   - Compensation flags apply a 4x multiplier (unresolved) or 2x (resolved)
 *
 * If a pool has insufficient entries, the shortfall is filled from the other
 * pools in order: weak -> new -> review.
 */
export function selectExercises(
  exercises: ExerciseProfile[],
  masteryRecords: Record<string, MasteryRecord>,
  compensationFlags: Record<string, CompensationFlag[]>,
  sessionSize: number = DEFAULT_SESSION_SIZE,
): ExerciseAssignment[] {
  type WeightedCandidate = {
    exerciseId: string;
    difficultyLevel: number;
    reason: 'weak' | 'new' | 'review';
    weight: number;
  };

  const weakPool: WeightedCandidate[] = [];
  const newPool: WeightedCandidate[] = [];
  const reviewPool: WeightedCandidate[] = [];

  for (const exercise of exercises) {
    const exerciseId = exercise.id;
    const flags = compensationFlags[exerciseId] ?? [];
    const hasUnresolvedCompensation = flags.some((f) => f.flagged && !f.resolved);

    // Each exercise has multiple difficulty levels; generate a candidate per level
    for (const diff of exercise.difficultyLevels) {
      const key = masteryKey(exerciseId, diff.level);
      const record = masteryRecords[key];

      // NEW: no mastery record exists for this exercise+difficulty combo
      if (!record) {
        newPool.push({
          exerciseId,
          difficultyLevel: diff.level,
          reason: 'new',
          weight: 1,
        });
        continue;
      }

      // WEAK: mastery < 2, or has unresolved compensations, or due for review
      const isWeak =
        record.masteryLevel < 2 ||
        hasUnresolvedCompensation ||
        isDueForReview(record);

      if (isWeak) {
        // Base weight: lower mastery = higher weight
        let weight = 6 - record.masteryLevel;

        // Apply compensation priority multiplier
        if (flags.length > 0) {
          const maxMultiplier = Math.max(...flags.map(getPriorityMultiplier));
          weight *= maxMultiplier;
        }

        weakPool.push({
          exerciseId,
          difficultyLevel: diff.level,
          reason: 'weak',
          weight: Math.max(1, weight),
        });
        continue;
      }

      // REVIEW: mastery >= 3, not flagged
      if (record.masteryLevel >= 3 && !hasUnresolvedCompensation) {
        reviewPool.push({
          exerciseId,
          difficultyLevel: diff.level,
          reason: 'review',
          weight: 1,
        });
        continue;
      }

      // Remaining exercises (mastery 2, no flags, not due) — add to weak pool
      // with low weight as borderline candidates.
      weakPool.push({
        exerciseId,
        difficultyLevel: diff.level,
        reason: 'weak',
        weight: 1,
      });
    }
  }

  // Target counts per pool
  const weakTarget = Math.ceil(sessionSize * WEAK_RATIO);
  const newTarget = Math.ceil(sessionSize * NEW_RATIO);
  const reviewTarget = Math.max(0, sessionSize - weakTarget - newTarget);

  // Select from each pool
  const weakSelected = weightedSelect(weakPool, weakTarget);
  const newSelected = weightedSelect(newPool, newTarget);
  const reviewSelected = weightedSelect(reviewPool, reviewTarget);

  let selected: WeightedCandidate[] = [
    ...weakSelected,
    ...newSelected,
    ...reviewSelected,
  ];

  // Fill shortfall from other pools if a pool was insufficient
  const shortfall = sessionSize - selected.length;

  if (shortfall > 0) {
    // Collect IDs already selected to avoid duplicates
    const selectedKeys = new Set(
      selected.map((s) => masteryKey(s.exerciseId, s.difficultyLevel)),
    );

    // Build overflow pool from all unselected candidates, prioritizing weak -> new -> review
    const overflow: WeightedCandidate[] = [
      ...weakPool,
      ...newPool,
      ...reviewPool,
    ].filter((c) => !selectedKeys.has(masteryKey(c.exerciseId, c.difficultyLevel)));

    const fillSelected = weightedSelect(overflow, shortfall);
    selected = [...selected, ...fillSelected];
  }

  // Shuffle to avoid predictable ordering
  const shuffled = shuffle(selected);

  // Map to ExerciseAssignment
  return shuffled.map((candidate) => ({
    exerciseId: candidate.exerciseId,
    difficultyLevel: candidate.difficultyLevel,
    reason: candidate.reason,
  }));
}
