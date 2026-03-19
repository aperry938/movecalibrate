/**
 * MoveCalibrate Adaptive Session Hook
 *
 * Manages the full lifecycle of a rehabilitation session:
 *   1. Start: load mastery/compensation state, select exercises adaptively
 *   2. Per-rep: update mastery, track compensations, log calibration entries
 *   3. End: build session record, persist to history, update streak
 *
 * The session queue is built by the core sessionSelector using the 60/30/10
 * pool allocation (weak/new/review). Each completed rep feeds back into the
 * mastery and compensation systems before the next exercise is presented.
 *
 * Usage:
 *   const session = useAdaptiveSession();
 *   await session.startSession(8);
 *   const { exercise, difficultyLevel } = session.getCurrentExercise();
 *   // After rep completes:
 *   session.completeRep(outcome, qualityScore, confidence, gap, compensations);
 *   // When all reps done:
 *   const record = session.endSession();
 */

import { useState, useCallback, useRef } from 'react';
import type {
  ExerciseAssignment,
  SessionRecord,
  CalibrationOutcome,
  ConfidenceRating,
  ExerciseProfile,
} from '../core/types';
import { selectExercises } from '../core/sessionSelector';
import { EXERCISES, getExerciseById } from '../core/exerciseProfiles';
import {
  getAllMasteryRecords,
  saveMasteryRecord,
  getMasteryRecord,
} from '../storage/exerciseProgress';
import {
  getAllCompensationFlags,
  saveCompensationFlag,
  getCompensationFlags,
} from '../storage/compensationLog';
import { appendCalibrationEntry } from '../storage/calibrationHistory';
import {
  appendSessionRecord,
  updateStreak,
} from '../storage/sessionHistory';
import {
  updateMastery,
  createMasteryRecord,
} from '../core/masteryEngine';
import {
  updateCompensation,
  createCompensationFlag,
} from '../core/compensationDetector';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionMetrics {
  totalReps: number;
  outcomes: { CC: number; UC: number; UI: number; CI: number };
  totalPoints: number;
  qualityScores: number[];
  calibrationGaps: number[];
  compensationAlerts: number;
  masteryChanges: Array<{ exercise: string; from: number; to: number }>;
}

export interface CurrentExercise {
  exercise: ExerciseProfile;
  difficultyLevel: number;
  reason: 'weak' | 'new' | 'review';
}

export interface AdaptiveSessionHook {
  /** Whether a session is currently in progress. */
  isActive: boolean;
  /** The ordered queue of exercise assignments for this session. */
  exerciseQueue: ExerciseAssignment[];
  /** Zero-based index of the current exercise in the queue. */
  currentIndex: number;
  /** Accumulated metrics for the current session. */
  sessionMetrics: SessionMetrics;
  /** Start a new adaptive session. Loads state, selects exercises, resets metrics. */
  startSession: (sessionSize?: number) => void;
  /** Record the result of a completed rep and advance to the next exercise. */
  completeRep: (
    outcome: CalibrationOutcome,
    qualityScore: number,
    confidence: ConfidenceRating,
    calibrationGap: number,
    compensationsDetected: string[],
    points: number,
  ) => void;
  /** End the session, persist the session record, update streak. Returns the record. */
  endSession: () => SessionRecord;
  /** Get the current exercise profile and difficulty level, or null if session not active. */
  getCurrentExercise: () => CurrentExercise | null;
}

// ── Helper: empty metrics ───────────────────────────────────────────────────

function emptyMetrics(): SessionMetrics {
  return {
    totalReps: 0,
    outcomes: { CC: 0, UC: 0, UI: 0, CI: 0 },
    totalPoints: 0,
    qualityScores: [],
    calibrationGaps: [],
    compensationAlerts: 0,
    masteryChanges: [],
  };
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useAdaptiveSession(): AdaptiveSessionHook {
  // ── State ─────────────────────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [exerciseQueue, setExerciseQueue] = useState<ExerciseAssignment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>(
    emptyMetrics(),
  );

  // Track session start time for duration calculation
  const sessionStartRef = useRef<number>(0);

  // ── startSession ──────────────────────────────────────────────────────────
  const startSession = useCallback((sessionSize: number = 8) => {
    // Load current mastery and compensation state from localStorage
    const masteryRecords = getAllMasteryRecords();
    const compensationFlags = getAllCompensationFlags();

    // Build the adaptive exercise queue
    const queue = selectExercises(
      EXERCISES,
      masteryRecords,
      compensationFlags,
      sessionSize,
    );

    setExerciseQueue(queue);
    setCurrentIndex(0);
    setSessionMetrics(emptyMetrics());
    setIsActive(true);
    sessionStartRef.current = Date.now();
  }, []);

  // ── completeRep ───────────────────────────────────────────────────────────
  const completeRep = useCallback(
    (
      outcome: CalibrationOutcome,
      qualityScore: number,
      confidence: ConfidenceRating,
      calibrationGap: number,
      compensationsDetected: string[],
      points: number,
    ) => {
      if (!isActive || currentIndex >= exerciseQueue.length) return;

      const assignment = exerciseQueue[currentIndex];
      const exerciseId = assignment.exerciseId;
      const diffLevel = assignment.difficultyLevel;

      // 1. Update mastery record
      const existingMastery = getMasteryRecord(exerciseId, diffLevel);
      const currentRecord = existingMastery ?? createMasteryRecord();
      const previousLevel = currentRecord.masteryLevel;
      const updatedMastery = updateMastery(currentRecord, outcome, qualityScore);
      saveMasteryRecord(exerciseId, diffLevel, updatedMastery);

      // 2. Update/create compensation flags for CI outcomes
      if (outcome === 'CI' && compensationsDetected.length > 0) {
        for (const compName of compensationsDetected) {
          const existingFlags = getCompensationFlags(exerciseId);
          const existingFlag = existingFlags.find(
            (f) => f.compensationName === compName,
          );

          if (existingFlag) {
            const updated = updateCompensation(existingFlag, false);
            saveCompensationFlag(updated);
          } else {
            const newFlag = createCompensationFlag(exerciseId, compName, {
              feature: compName,
              direction: 'detected',
            });
            saveCompensationFlag(newFlag);
          }
        }
      } else {
        // For correct outcomes, update existing flags toward resolution
        const existingFlags = getCompensationFlags(exerciseId);
        for (const flag of existingFlags) {
          if (flag.flagged && !flag.resolved) {
            const isCorrect = outcome === 'CC' || outcome === 'UC';
            const updated = updateCompensation(flag, isCorrect);
            saveCompensationFlag(updated);
          }
        }
      }

      // 3. Append calibration entry to history
      const calibrationEntry = {
        exerciseId,
        difficultyLevel: diffLevel,
        confidence,
        qualityScore,
        outcome,
        points,
        calibrationGap,
        compensationFlags: compensationsDetected,
        timestamp: new Date().toISOString(),
      };
      appendCalibrationEntry(calibrationEntry);

      // 4. Update session metrics
      setSessionMetrics((prev) => {
        const updated: SessionMetrics = {
          totalReps: prev.totalReps + 1,
          outcomes: {
            ...prev.outcomes,
            [outcome]: prev.outcomes[outcome] + 1,
          },
          totalPoints: prev.totalPoints + points,
          qualityScores: [...prev.qualityScores, qualityScore],
          calibrationGaps: [...prev.calibrationGaps, calibrationGap],
          compensationAlerts:
            prev.compensationAlerts + (compensationsDetected.length > 0 ? 1 : 0),
          masteryChanges:
            previousLevel !== updatedMastery.masteryLevel
              ? [
                  ...prev.masteryChanges,
                  {
                    exercise: exerciseId,
                    from: previousLevel,
                    to: updatedMastery.masteryLevel,
                  },
                ]
              : prev.masteryChanges,
        };
        return updated;
      });

      // 5. Advance to next exercise
      setCurrentIndex((prev) => prev + 1);
    },
    [isActive, currentIndex, exerciseQueue],
  );

  // ── endSession ────────────────────────────────────────────────────────────
  const endSession = useCallback((): SessionRecord => {
    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);

    const avgQuality =
      sessionMetrics.qualityScores.length > 0
        ? sessionMetrics.qualityScores.reduce((s, q) => s + q, 0) /
          sessionMetrics.qualityScores.length
        : 0;

    const avgCalibrationGap =
      sessionMetrics.calibrationGaps.length > 0
        ? sessionMetrics.calibrationGaps.reduce((s, g) => s + g, 0) /
          sessionMetrics.calibrationGaps.length
        : 0;

    const record: SessionRecord = {
      date: new Date().toISOString(),
      duration,
      exercisesCompleted: sessionMetrics.totalReps,
      averageQuality: Math.round(avgQuality * 10) / 10,
      averageCalibrationGap: Math.round(avgCalibrationGap * 1000) / 1000,
      outcomes: { ...sessionMetrics.outcomes },
      compensationAlerts: sessionMetrics.compensationAlerts,
      masteryChanges: [...sessionMetrics.masteryChanges],
    };

    // Persist session record and update streak
    appendSessionRecord(record);
    updateStreak();

    // Reset session state
    setIsActive(false);
    setExerciseQueue([]);
    setCurrentIndex(0);
    setSessionMetrics(emptyMetrics());

    return record;
  }, [sessionMetrics]);

  // ── getCurrentExercise ────────────────────────────────────────────────────
  const getCurrentExercise = useCallback((): CurrentExercise | null => {
    if (!isActive || currentIndex >= exerciseQueue.length) return null;

    const assignment = exerciseQueue[currentIndex];
    const exercise = getExerciseById(assignment.exerciseId);

    if (!exercise) return null;

    return {
      exercise,
      difficultyLevel: assignment.difficultyLevel,
      reason: assignment.reason,
    };
  }, [isActive, currentIndex, exerciseQueue]);

  return {
    isActive,
    exerciseQueue,
    currentIndex,
    sessionMetrics,
    startSession,
    completeRep,
    endSession,
    getCurrentExercise,
  };
}
