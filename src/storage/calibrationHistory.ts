/**
 * MoveCalibrate Calibration History Storage
 *
 * Append-only log of calibration entries. Stored as a single JSON array
 * under KEYS.CALIBRATION_HISTORY. Newest entries are appended to the end.
 *
 * Query functions support global retrieval (with optional limit) and
 * per-exercise filtering for progress dashboards and trend analysis.
 */

import type { CalibrationEntry } from '../core/types';
import { safeSave, safeLoad } from './storageManager';
import { KEYS } from './storageKeys';

/**
 * Append a new calibration entry to the end of the history log.
 */
export function appendCalibrationEntry(entry: CalibrationEntry): void {
  const history = safeLoad<CalibrationEntry[]>(KEYS.CALIBRATION_HISTORY, []);
  history.push(entry);
  safeSave(KEYS.CALIBRATION_HISTORY, history);
}

/**
 * Retrieve calibration history, newest last.
 *
 * If a limit is provided, returns the most recent N entries (taken from
 * the end of the array). Without a limit, returns the full history.
 */
export function getCalibrationHistory(limit?: number): CalibrationEntry[] {
  const history = safeLoad<CalibrationEntry[]>(KEYS.CALIBRATION_HISTORY, []);
  if (limit !== undefined && limit > 0 && history.length > limit) {
    return history.slice(-limit);
  }
  return history;
}

/**
 * Retrieve all calibration entries for a specific exercise, newest last.
 */
export function getCalibrationHistoryForExercise(
  exerciseId: string,
): CalibrationEntry[] {
  const history = safeLoad<CalibrationEntry[]>(KEYS.CALIBRATION_HISTORY, []);
  return history.filter((entry) => entry.exerciseId === exerciseId);
}
