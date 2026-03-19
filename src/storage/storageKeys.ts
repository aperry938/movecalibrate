/**
 * MoveCalibrate Storage Keys
 *
 * Centralized registry of all localStorage keys used by the app.
 * Every key is prefixed with 'mc_' to namespace and avoid collisions.
 */

export const STORAGE_PREFIX = 'mc_';

export const KEYS = {
  EXERCISE_PROGRESS: 'mc_exerciseProgress',
  COMPENSATION_LOG: 'mc_compensationLog',
  CALIBRATION_HISTORY: 'mc_calibrationHistory',
  SESSION_HISTORY: 'mc_sessionHistory',
  SETTINGS: 'mc_settings',
  STREAK: 'mc_streak',
  LONGEST_STREAK: 'mc_longestStreak',
  LAST_SESSION_DATE: 'mc_lastSessionDate',
} as const;
