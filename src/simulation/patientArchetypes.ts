/**
 * Patient Archetype Definitions
 *
 * Three archetypal patient profiles for generating synthetic calibration
 * trajectories. Each archetype models a distinct proprioceptive calibration
 * pattern observed in rehabilitation practice.
 *
 * These archetypes produce illustrative data for the paper's scenario
 * analysis — they are NOT training data and do NOT claim to represent
 * validated clinical populations.
 */

export interface PatientArchetype {
  id: string;
  label: string;
  description: string;
  /** Starting probability of confident rating (0-1) */
  initialConfidenceRate: number;
  /** Starting movement quality mean (0-100) */
  initialQualityMean: number;
  /** Quality standard deviation (noise) */
  qualityStdDev: number;
  /** Per-session quality improvement rate */
  qualityGrowthPerSession: number;
  /** Per-session confidence adjustment rate (positive = grows more confident) */
  confidenceGrowthPerSession: number;
  /** Probability of compensation per rep (decreases for improver, stays for compensator) */
  compensationRate: number;
  /** Per-session compensation rate decay */
  compensationDecayPerSession: number;
  /** Number of sessions to simulate */
  totalSessions: number;
  /** Reps per session */
  repsPerSession: number;
}

/**
 * Archetype 1: The Improver
 *
 * Post-surgical patient progressing through rehabilitation. Starts with
 * moderate quality and mixed calibration. Over 10 sessions, quality improves,
 * confidence becomes better calibrated, and compensation patterns resolve.
 * CC rate increases steadily.
 */
export const IMPROVER: PatientArchetype = {
  id: 'improver',
  label: 'The Improver',
  description:
    'Post-surgical patient with steadily improving proprioceptive calibration. ' +
    'Quality and confidence align over time as compensations resolve.',
  initialConfidenceRate: 0.5,
  initialQualityMean: 55,
  qualityStdDev: 12,
  qualityGrowthPerSession: 3.5,
  confidenceGrowthPerSession: 0.04,
  compensationRate: 0.3,
  compensationDecayPerSession: 0.03,
  totalSessions: 10,
  repsPerSession: 8,
};

/**
 * Archetype 2: The Anxious Patient
 *
 * Patient with kinesiophobia — fear of movement. Good objective movement
 * quality but chronically low confidence. The UC (unsure-correct) rate
 * dominates early sessions. As mastery grows and positive feedback
 * accumulates, confidence slowly rises to match actual ability.
 */
export const ANXIOUS: PatientArchetype = {
  id: 'anxious',
  label: 'The Anxious Patient',
  description:
    'Patient with movement anxiety (kinesiophobia). Good form but persistent ' +
    'underconfidence. UC rate dominates early, resolving as confidence grows.',
  initialConfidenceRate: 0.15,
  initialQualityMean: 72,
  qualityStdDev: 10,
  qualityGrowthPerSession: 1.5,
  confidenceGrowthPerSession: 0.07,
  compensationRate: 0.08,
  compensationDecayPerSession: 0.01,
  totalSessions: 10,
  repsPerSession: 8,
};

/**
 * Archetype 3: The Compensator
 *
 * Patient with proprioceptive miscalibration. Consistently overestimates
 * their movement quality. High confidence despite poor form produces
 * persistent CI (confident-incorrect) outcomes. Compensation flags
 * remain active across sessions. This is the clinically dangerous
 * pattern the system is designed to detect.
 */
export const COMPENSATOR: PatientArchetype = {
  id: 'compensator',
  label: 'The Compensator',
  description:
    'Patient with proprioceptive miscalibration. High confidence with poor form ' +
    'produces persistent CI outcomes and unresolved compensation flags.',
  initialConfidenceRate: 0.82,
  initialQualityMean: 42,
  qualityStdDev: 14,
  qualityGrowthPerSession: 1.0,
  confidenceGrowthPerSession: -0.01,
  compensationRate: 0.55,
  compensationDecayPerSession: 0.01,
  totalSessions: 10,
  repsPerSession: 8,
};

export const ALL_ARCHETYPES = [IMPROVER, ANXIOUS, COMPENSATOR] as const;
