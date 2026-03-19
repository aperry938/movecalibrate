/**
 * MoveCalibrate Core Types
 *
 * Shared type definitions for the adaptive movement rehabilitation engine.
 * All biomechanical features use Float64Array(30) for numeric precision
 * and alignment with the 30-feature extraction pipeline.
 */

// ── Geometry Primitives ─────────────────────────────────────────────────────

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// ── Biomechanical Feature System ────────────────────────────────────────────

/**
 * 30-element Float64Array holding all biomechanical features for a single frame.
 * All values normalized to [0, 1].
 */
export type BiomechanicalFeatures = Float64Array;

/**
 * Canonical feature indices. Maps each biomechanical feature to its position
 * in the 30-element BiomechanicalFeatures array.
 *
 * Groups:
 *   Joint Angles (0-15): Bilateral measurements of major articulations
 *   Segment Ratios (16-21): Proportional and alignment relationships
 *   Symmetry (22-25): Left-right bilateral comparison
 *   Stability (26-29): Balance and steadiness measures
 */
export const FeatureIndex = {
  // Joint Angles (16)
  L_SHOULDER_FLEXION:      0,
  R_SHOULDER_FLEXION:      1,
  L_SHOULDER_ABDUCTION:    2,
  R_SHOULDER_ABDUCTION:    3,
  L_ELBOW_FLEXION:         4,
  R_ELBOW_FLEXION:         5,
  L_HIP_FLEXION:           6,
  R_HIP_FLEXION:           7,
  L_HIP_ABDUCTION:         8,
  R_HIP_ABDUCTION:         9,
  L_KNEE_FLEXION:          10,
  R_KNEE_FLEXION:          11,
  L_ANKLE_DORSIFLEXION:    12,
  R_ANKLE_DORSIFLEXION:    13,
  SPINAL_LATERAL_FLEXION:  14,
  TRUNK_FORWARD_LEAN:      15,

  // Segment Ratios (6)
  TORSO_LEG_RATIO:         16,
  ARM_SPAN_SYMMETRY:       17,
  STANCE_WIDTH_RATIO:      18,
  SHOULDER_HIP_OFFSET:     19,
  COM_BASE_DISPLACEMENT:   20,
  HEAD_SPINE_ALIGNMENT:    21,

  // Symmetry (4)
  SHOULDER_SYMMETRY:       22,
  ELBOW_SYMMETRY:          23,
  HIP_SYMMETRY:            24,
  KNEE_SYMMETRY:           25,

  // Stability (4)
  LANDMARK_VELOCITY_VAR:   26,
  COM_OSCILLATION:         27,
  BASE_OF_SUPPORT_AREA:    28,
  WEIGHT_DISTRIBUTION:     29,
} as const;

export type FeatureIndex = (typeof FeatureIndex)[keyof typeof FeatureIndex];

// ── Exercise System ─────────────────────────────────────────────────────────

export type ExerciseCategory = 'upper' | 'lower' | 'balance' | 'core';

export interface DifficultyLevel {
  level: number;
  target: string;
  idealRanges: Record<number, [number, number]>;
  holdDuration: number;
}

export interface CompensationRule {
  name: string;
  description: string;
  featureChecks: Array<{
    featureIndex: number;
    condition: 'above' | 'below';
    threshold: number;
  }>;
}

export interface ExerciseProfile {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  instructions: string;
  difficultyLevels: DifficultyLevel[];
  criticalFeatures: number[];
  compensationRules: CompensationRule[];
}

// ── Quality Assessment ──────────────────────────────────────────────────────

export interface Deviation {
  featureName: string;
  featureIndex: number;
  actual: number;
  idealMin: number;
  idealMax: number;
  direction: 'too_high' | 'too_low';
  severity: number;
}

export interface QualityResult {
  score: number;
  deviations: Deviation[];
  compensationsDetected: string[];
}

// ── Calibration Engine ──────────────────────────────────────────────────────

export type ConfidenceRating = 'confident' | 'unsure';

/**
 * Four calibration outcomes from the 2x2 confidence-correctness matrix:
 *   CC = Confident + Correct    (well-calibrated mastery)
 *   UC = Unsure + Correct       (underconfidence — knows more than they think)
 *   UI = Unsure + Incorrect     (appropriate uncertainty)
 *   CI = Confident + Incorrect  (overconfidence — dangerous miscalibration)
 */
export type CalibrationOutcome = 'CC' | 'UC' | 'UI' | 'CI';

export interface CalibrationEntry {
  exerciseId: string;
  difficultyLevel: number;
  confidence: ConfidenceRating;
  qualityScore: number;
  outcome: CalibrationOutcome;
  points: number;
  calibrationGap: number;
  compensationFlags: string[];
  timestamp: string;
}

// ── Mastery & Tracking ──────────────────────────────────────────────────────

export interface MasteryRecord {
  masteryLevel: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastPerformed: string;
  nextReview: string;
  qualityHistory: number[];
  averageQuality: number;
  bestQuality: number;
}

export interface CompensationFlag {
  exerciseId: string;
  compensationName: string;
  flagged: boolean;
  occurrences: number;
  firstOccurrence: string;
  lastOccurrence: string;
  consecutiveCorrect: number;
  resolved: boolean;
  resolvedDate: string | null;
  deviationDetails: Array<{
    feature: string;
    direction: string;
    timestamp: string;
  }>;
}

// ── Session ─────────────────────────────────────────────────────────────────

export interface SessionRecord {
  date: string;
  duration: number;
  exercisesCompleted: number;
  averageQuality: number;
  averageCalibrationGap: number;
  outcomes: { CC: number; UC: number; UI: number; CI: number };
  compensationAlerts: number;
  masteryChanges: Array<{ exercise: string; from: number; to: number }>;
}

// ── Recovery & Readiness ────────────────────────────────────────────────────

export interface RecoveryReadiness {
  overall: number;
  quality: number;
  coverage: number;
  calibration: number;
  consistency: number;
}

// ── UI / Flow State ─────────────────────────────────────────────────────────

export type RepFlowState =
  | 'idle'
  | 'preview'
  | 'confidence'
  | 'countdown'
  | 'perform'
  | 'scoring'
  | 'result';

export interface ExerciseAssignment {
  exerciseId: string;
  difficultyLevel: number;
  reason: 'weak' | 'new' | 'review';
}
