import type { CompensationFlag } from './types';

/** Consecutive correct reps required to resolve a compensation flag. */
const RESOLUTION_THRESHOLD = 3;

/** Priority multiplier for exercises with unresolved compensation flags. */
const UNRESOLVED_PRIORITY = 4;

/** Priority multiplier for exercises with resolved compensation flags (maintained vigilance). */
const RESOLVED_PRIORITY = 2;

/**
 * Create a new compensation flag for a detected movement compensation.
 *
 * Compensation flags are the rehabilitation analog of Meridian Labs' critical
 * misconceptions. They track specific compensatory movement patterns (e.g.,
 * hip hiking during gait, trunk lean during a squat) that must be actively
 * monitored and resolved.
 */
export function createCompensationFlag(
  exerciseId: string,
  compensationName: string,
  details: { feature: string; direction: string },
): CompensationFlag {
  const now = new Date().toISOString();
  return {
    exerciseId,
    compensationName,
    flagged: true,
    occurrences: 1,
    firstOccurrence: now,
    lastOccurrence: now,
    consecutiveCorrect: 0,
    resolved: false,
    resolvedDate: null,
    deviationDetails: [{ feature: details.feature, direction: details.direction, timestamp: now }],
  };
}

/**
 * Update a compensation flag after a repetition.
 *
 * If the rep had correct form: increment consecutiveCorrect. If it reaches
 * RESOLUTION_THRESHOLD (3), mark the flag as resolved.
 *
 * If the rep had incorrect form (compensation present): reset
 * consecutiveCorrect to 0, increment occurrences, update lastOccurrence.
 *
 * Returns a new flag object (immutable update).
 */
export function updateCompensation(
  flag: CompensationFlag,
  wasCorrectForm: boolean,
): CompensationFlag {
  if (wasCorrectForm) {
    const newConsecutive = flag.consecutiveCorrect + 1;
    const nowResolved = newConsecutive >= RESOLUTION_THRESHOLD;

    return {
      ...flag,
      consecutiveCorrect: newConsecutive,
      resolved: flag.resolved || nowResolved,
      resolvedDate:
        flag.resolved
          ? flag.resolvedDate
          : nowResolved
            ? new Date().toISOString()
            : null,
    };
  }

  // Incorrect form — compensation was present
  const now = new Date().toISOString();

  if (flag.resolved) {
    // Re-flag: the compensation has recurred after resolution
    return {
      ...flag,
      resolved: false,
      resolvedDate: null,
      consecutiveCorrect: 0,
      occurrences: flag.occurrences + 1,
      lastOccurrence: now,
    };
  }

  return {
    ...flag,
    consecutiveCorrect: 0,
    occurrences: flag.occurrences + 1,
    lastOccurrence: now,
  };
}

/**
 * Get the session-selection priority multiplier for a compensation flag.
 *
 * Unresolved flags get 4x priority to ensure they are addressed aggressively.
 * Resolved flags still get 2x priority to maintain vigilance against
 * regression. This mirrors the Meridian Labs approach where resolved
 * misconceptions remain monitored.
 */
export function getPriorityMultiplier(flag: CompensationFlag): number {
  if (!flag.resolved) return UNRESOLVED_PRIORITY;
  return RESOLVED_PRIORITY;
}

/**
 * Get all exercise IDs that have at least one unresolved compensation flag.
 */
export function getActiveFlaggedExercises(
  flags: Record<string, CompensationFlag[]>,
): string[] {
  const flagged: string[] = [];

  for (const [exerciseId, exerciseFlags] of Object.entries(flags)) {
    const hasActive = exerciseFlags.some((f) => f.flagged && !f.resolved);
    if (hasActive) {
      flagged.push(exerciseId);
    }
  }

  return flagged;
}

/**
 * Check if a specific compensation pattern is currently active (unresolved)
 * for an exercise.
 */
export function isCompensationActive(
  flags: CompensationFlag[],
  compensationName: string,
): boolean {
  return flags.some(
    (f) => f.compensationName === compensationName && f.flagged && !f.resolved,
  );
}
