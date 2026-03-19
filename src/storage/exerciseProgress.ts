/**
 * MoveCalibrate Exercise Progress Storage
 *
 * CRUD operations for mastery records. Each record is keyed by a composite
 * of exerciseId and difficulty level: "SHOULDER_FLEXION_2".
 *
 * The full map is stored as a single JSON object under KEYS.EXERCISE_PROGRESS.
 * Individual lookups and writes read/write the whole map and extract/merge
 * the relevant entry. This keeps the localStorage footprint to one key
 * while supporting per-exercise-level granularity.
 */

import type { MasteryRecord } from '../core/types';
import { safeSave, safeLoad } from './storageManager';
import { KEYS } from './storageKeys';

/**
 * Build the composite storage key for an exercise at a difficulty level.
 */
function compositeKey(exerciseId: string, diffLevel: number): string {
  return `${exerciseId}_${diffLevel}`;
}

/**
 * Retrieve the mastery record for a specific exercise at a specific
 * difficulty level. Returns null if no record exists.
 */
export function getMasteryRecord(
  exerciseId: string,
  diffLevel: number,
): MasteryRecord | null {
  const all = safeLoad<Record<string, MasteryRecord>>(
    KEYS.EXERCISE_PROGRESS,
    {},
  );
  const key = compositeKey(exerciseId, diffLevel);
  return all[key] ?? null;
}

/**
 * Save (create or overwrite) the mastery record for a specific exercise
 * at a specific difficulty level.
 */
export function saveMasteryRecord(
  exerciseId: string,
  diffLevel: number,
  record: MasteryRecord,
): void {
  const all = safeLoad<Record<string, MasteryRecord>>(
    KEYS.EXERCISE_PROGRESS,
    {},
  );
  const key = compositeKey(exerciseId, diffLevel);
  all[key] = record;
  safeSave(KEYS.EXERCISE_PROGRESS, all);
}

/**
 * Return the entire mastery map. Keys are composite strings like
 * "SHOULDER_FLEXION_2"; values are MasteryRecord objects.
 *
 * Returns an empty object if nothing has been stored yet.
 */
export function getAllMasteryRecords(): Record<string, MasteryRecord> {
  return safeLoad<Record<string, MasteryRecord>>(KEYS.EXERCISE_PROGRESS, {});
}
