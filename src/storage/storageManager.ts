/**
 * MoveCalibrate Storage Manager
 *
 * Safe localStorage wrapper with try/catch on every operation.
 * All other storage modules route through these four functions
 * to guarantee graceful failure on quota errors, private browsing
 * restrictions, or corrupted data.
 */

import { STORAGE_PREFIX } from './storageKeys';

/**
 * Serialize and save a value to localStorage.
 * Returns true on success, false if the write fails for any reason.
 */
export function safeSave<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load and deserialize a value from localStorage.
 * Returns the parsed value on success, or the provided fallback if the key
 * is missing, empty, or contains unparseable data.
 */
export function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Remove a single key from localStorage.
 * Returns true on success, false if the removal fails.
 */
export function safeRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove all MoveCalibrate data from localStorage.
 *
 * Iterates through every localStorage key and removes those that start
 * with the STORAGE_PREFIX ('mc_'). Other applications' data is untouched.
 */
export function clearAllMcData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Silently fail — best-effort cleanup
  }
}
