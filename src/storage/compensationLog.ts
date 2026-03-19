/**
 * MoveCalibrate Compensation Log Storage
 *
 * CRUD operations for compensation flags. Flags are grouped by exerciseId
 * in a single JSON object under KEYS.COMPENSATION_LOG.
 *
 * Each exercise can have multiple compensation flags (one per compensation
 * type, e.g., "Trunk lean", "Asymmetric loading"). Flags track occurrence
 * counts, resolution state, and deviation history for clinical insight.
 */

import type { CompensationFlag } from '../core/types';
import { safeSave, safeLoad } from './storageManager';
import { KEYS } from './storageKeys';

/**
 * Retrieve all compensation flags for a specific exercise.
 * Returns an empty array if no flags exist for that exercise.
 */
export function getCompensationFlags(exerciseId: string): CompensationFlag[] {
  const all = safeLoad<Record<string, CompensationFlag[]>>(
    KEYS.COMPENSATION_LOG,
    {},
  );
  return all[exerciseId] ?? [];
}

/**
 * Save a compensation flag. If a flag with the same exerciseId and
 * compensationName already exists, it is replaced. Otherwise the new
 * flag is appended to the exercise's list.
 */
export function saveCompensationFlag(flag: CompensationFlag): void {
  const all = safeLoad<Record<string, CompensationFlag[]>>(
    KEYS.COMPENSATION_LOG,
    {},
  );

  const exerciseFlags = all[flag.exerciseId] ?? [];

  const existingIndex = exerciseFlags.findIndex(
    (f) => f.compensationName === flag.compensationName,
  );

  if (existingIndex >= 0) {
    exerciseFlags[existingIndex] = flag;
  } else {
    exerciseFlags.push(flag);
  }

  all[flag.exerciseId] = exerciseFlags;
  safeSave(KEYS.COMPENSATION_LOG, all);
}

/**
 * Return the entire compensation log. Keys are exerciseId strings;
 * values are arrays of CompensationFlag objects.
 *
 * Returns an empty object if nothing has been stored yet.
 */
export function getAllCompensationFlags(): Record<string, CompensationFlag[]> {
  return safeLoad<Record<string, CompensationFlag[]>>(
    KEYS.COMPENSATION_LOG,
    {},
  );
}
