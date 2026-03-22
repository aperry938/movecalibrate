/**
 * Synthetic Patient Trajectory Generator
 *
 * Generates simulated calibration trajectories for the three patient
 * archetypes. Outputs per-session summary statistics suitable for
 * paper figures showing calibration gap evolution over time.
 *
 * Usage: import and call generateAllTrajectories() or run via
 * a simple script to produce JSON output for visualization.
 */

import type { CalibrationOutcome, ConfidenceRating } from '../core/types';
import type { PatientArchetype } from './patientArchetypes';
import { ALL_ARCHETYPES } from './patientArchetypes';

const QUALITY_THRESHOLD = 70;

// ── Types ─────────────────────────────────────────────────────────────────

export interface SimulatedRep {
  session: number;
  rep: number;
  confidence: ConfidenceRating;
  qualityScore: number;
  outcome: CalibrationOutcome;
  calibrationGap: number;
  compensationDetected: boolean;
}

export interface SessionSummary {
  session: number;
  reps: number;
  avgQuality: number;
  avgCalibrationGap: number;
  outcomes: { CC: number; UC: number; UI: number; CI: number };
  outcomeRates: { CC: number; UC: number; UI: number; CI: number };
  compensationRate: number;
  confidenceRate: number;
}

export interface PatientTrajectory {
  archetypeId: string;
  label: string;
  description: string;
  sessions: SessionSummary[];
  allReps: SimulatedRep[];
}

// ── Simulation ──────────────────────────────────────────────────────────

/** Seeded pseudo-random number generator for reproducibility. */
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Normal distribution sample using Box-Muller transform. */
function normalSample(rng: () => number, mean: number, stdDev: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function determineOutcome(
  confidence: ConfidenceRating,
  qualityScore: number,
): CalibrationOutcome {
  const isCorrect = qualityScore >= QUALITY_THRESHOLD;
  if (confidence === 'confident') {
    return isCorrect ? 'CC' : 'CI';
  }
  return isCorrect ? 'UC' : 'UI';
}

function computeCalibrationGap(
  confidence: ConfidenceRating,
  qualityScore: number,
): number {
  const confValue = confidence === 'confident' ? 1.0 : 0.0;
  const qualityNorm = qualityScore / 100;
  return Math.abs(confValue - qualityNorm);
}

export function generateTrajectory(
  archetype: PatientArchetype,
  seed: number = 42,
): PatientTrajectory {
  const rng = createRng(seed);
  const allReps: SimulatedRep[] = [];
  const sessions: SessionSummary[] = [];

  for (let s = 0; s < archetype.totalSessions; s++) {
    const sessionReps: SimulatedRep[] = [];
    const currentQualityMean = archetype.initialQualityMean + s * archetype.qualityGrowthPerSession;
    const currentConfidenceRate = Math.max(
      0.05,
      Math.min(0.95, archetype.initialConfidenceRate + s * archetype.confidenceGrowthPerSession),
    );
    const currentCompensationRate = Math.max(
      0.02,
      archetype.compensationRate - s * archetype.compensationDecayPerSession,
    );

    const outcomes = { CC: 0, UC: 0, UI: 0, CI: 0 };
    let totalQuality = 0;
    let totalGap = 0;
    let compensations = 0;

    for (let r = 0; r < archetype.repsPerSession; r++) {
      const confidence: ConfidenceRating =
        rng() < currentConfidenceRate ? 'confident' : 'unsure';

      const rawQuality = normalSample(rng, currentQualityMean, archetype.qualityStdDev);
      const qualityScore = Math.max(0, Math.min(100, Math.round(rawQuality)));

      const outcome = determineOutcome(confidence, qualityScore);
      const calibrationGap = computeCalibrationGap(confidence, qualityScore);
      const compensationDetected = rng() < currentCompensationRate;

      outcomes[outcome]++;
      totalQuality += qualityScore;
      totalGap += calibrationGap;
      if (compensationDetected) compensations++;

      const rep: SimulatedRep = {
        session: s + 1,
        rep: r + 1,
        confidence,
        qualityScore,
        outcome,
        calibrationGap,
        compensationDetected,
      };

      sessionReps.push(rep);
      allReps.push(rep);
    }

    const n = archetype.repsPerSession;
    sessions.push({
      session: s + 1,
      reps: n,
      avgQuality: Math.round((totalQuality / n) * 10) / 10,
      avgCalibrationGap: Math.round((totalGap / n) * 1000) / 1000,
      outcomes,
      outcomeRates: {
        CC: Math.round((outcomes.CC / n) * 1000) / 1000,
        UC: Math.round((outcomes.UC / n) * 1000) / 1000,
        UI: Math.round((outcomes.UI / n) * 1000) / 1000,
        CI: Math.round((outcomes.CI / n) * 1000) / 1000,
      },
      compensationRate: Math.round((compensations / n) * 1000) / 1000,
      confidenceRate: Math.round(currentConfidenceRate * 1000) / 1000,
    });
  }

  return {
    archetypeId: archetype.id,
    label: archetype.label,
    description: archetype.description,
    sessions,
    allReps,
  };
}

export function generateAllTrajectories(seed: number = 42): PatientTrajectory[] {
  return ALL_ARCHETYPES.map((archetype, i) =>
    generateTrajectory(archetype, seed + i * 1000),
  );
}

/**
 * Print a summary table for each archetype trajectory.
 * Useful for quick verification and paper figure data extraction.
 */
export function printTrajectorySummary(trajectories: PatientTrajectory[]): string {
  const lines: string[] = [];

  for (const traj of trajectories) {
    lines.push(`\n${'='.repeat(70)}`);
    lines.push(`${traj.label} (${traj.archetypeId})`);
    lines.push(traj.description);
    lines.push('='.repeat(70));
    lines.push(
      'Session | Avg Quality | Avg Gap | CC%   | UC%   | CI%   | UI%   | Comp%',
    );
    lines.push('-'.repeat(70));

    for (const s of traj.sessions) {
      const r = s.outcomeRates;
      lines.push(
        `  ${String(s.session).padStart(2)}     | ` +
          `${s.avgQuality.toFixed(1).padStart(6)}      | ` +
          `${s.avgCalibrationGap.toFixed(3).padStart(5)} | ` +
          `${(r.CC * 100).toFixed(1).padStart(5)} | ` +
          `${(r.UC * 100).toFixed(1).padStart(5)} | ` +
          `${(r.CI * 100).toFixed(1).padStart(5)} | ` +
          `${(r.UI * 100).toFixed(1).padStart(5)} | ` +
          `${(s.compensationRate * 100).toFixed(1).padStart(5)}`,
      );
    }

    // Summary row
    const firstSession = traj.sessions[0];
    const lastSession = traj.sessions[traj.sessions.length - 1];
    lines.push('-'.repeat(70));
    lines.push(
      `Change:   Quality ${firstSession.avgQuality.toFixed(1)} → ${lastSession.avgQuality.toFixed(1)} | ` +
        `Gap ${firstSession.avgCalibrationGap.toFixed(3)} → ${lastSession.avgCalibrationGap.toFixed(3)} | ` +
        `Comp ${(firstSession.compensationRate * 100).toFixed(0)}% → ${(lastSession.compensationRate * 100).toFixed(0)}%`,
    );
  }

  return lines.join('\n');
}
