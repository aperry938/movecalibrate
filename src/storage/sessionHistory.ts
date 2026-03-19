/**
 * MoveCalibrate Session History Storage
 *
 * Append-only log of session records plus streak tracking.
 *
 * Session records are stored as a JSON array under KEYS.SESSION_HISTORY.
 * Streak data uses three separate keys (STREAK, LONGEST_STREAK,
 * LAST_SESSION_DATE) for fast reads without parsing the full session log.
 */

import type { SessionRecord } from '../core/types';
import { safeSave, safeLoad } from './storageManager';
import { KEYS } from './storageKeys';

// ── Session Records ─────────────────────────────────────────────────────────

/**
 * Append a new session record to the end of the history log.
 */
export function appendSessionRecord(record: SessionRecord): void {
  const history = safeLoad<SessionRecord[]>(KEYS.SESSION_HISTORY, []);
  history.push(record);
  safeSave(KEYS.SESSION_HISTORY, history);
}

/**
 * Retrieve session history, newest last.
 *
 * If a limit is provided, returns the most recent N records (taken from
 * the end of the array). Without a limit, returns the full history.
 */
export function getSessionHistory(limit?: number): SessionRecord[] {
  const history = safeLoad<SessionRecord[]>(KEYS.SESSION_HISTORY, []);
  if (limit !== undefined && limit > 0 && history.length > limit) {
    return history.slice(-limit);
  }
  return history;
}

// ── Streak Tracking ─────────────────────────────────────────────────────────

/**
 * Get the date-only string (YYYY-MM-DD) for a Date object.
 */
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get the current streak count.
 * Returns 0 if no streak data exists.
 */
export function getStreak(): number {
  return safeLoad<number>(KEYS.STREAK, 0);
}

/**
 * Update the streak after a session.
 *
 * Logic:
 *   - If the last session was yesterday: increment streak by 1.
 *   - If the last session was today: no change (already counted).
 *   - Otherwise (gap of 2+ days or no prior session): reset streak to 1.
 *
 * Also updates LONGEST_STREAK if the current streak exceeds it.
 * Returns the new streak value.
 */
export function updateStreak(): number {
  const now = new Date();
  const todayStr = toDateString(now);

  const lastDateStr = safeLoad<string>(KEYS.LAST_SESSION_DATE, '');

  let currentStreak = safeLoad<number>(KEYS.STREAK, 0);
  let longestStreak = safeLoad<number>(KEYS.LONGEST_STREAK, 0);

  if (lastDateStr === todayStr) {
    // Already exercised today -- streak unchanged
    return currentStreak;
  }

  if (lastDateStr !== '') {
    const lastDate = new Date(lastDateStr + 'T00:00:00');
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateString(yesterday);

    if (toDateString(lastDate) === yesterdayStr) {
      // Last session was yesterday -- extend streak
      currentStreak += 1;
    } else {
      // Gap of 2+ days -- reset streak
      currentStreak = 1;
    }
  } else {
    // First session ever
    currentStreak = 1;
  }

  // Update longest streak if needed
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    safeSave(KEYS.LONGEST_STREAK, longestStreak);
  }

  safeSave(KEYS.STREAK, currentStreak);
  safeSave(KEYS.LAST_SESSION_DATE, todayStr);

  return currentStreak;
}
