/**
 * CalibrationResult — Post-rep calibration outcome display.
 *
 * Shows the 4-outcome calibration result (CC/UC/UI/CI) with contextual
 * messaging, quality score, points earned, and calibration gap indicator.
 */

import type { ConfidenceRating, CalibrationOutcome, Deviation } from '../core/types';

interface RepResult {
  confidence: ConfidenceRating;
  qualityScore: number;
  outcome: CalibrationOutcome;
  points: number;
  calibrationGap: number;
  deviations: Deviation[];
  compensationsDetected: string[];
}

interface CalibrationResultProps {
  result: RepResult;
  onNext: () => void;
}

const OUTCOME_CONFIG: Record<
  CalibrationOutcome,
  { label: string; description: string; bg: string; border: string; text: string; badge: string }
> = {
  CC: {
    label: 'Well Calibrated',
    description: 'Your confidence matched your performance. Great self-awareness.',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    badge: 'bg-emerald-500 text-white',
  },
  UC: {
    label: 'Movement Anxiety',
    description: 'Your form was good! You can trust your body more on this one.',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    badge: 'bg-sky-500 text-white',
  },
  UI: {
    label: 'Appropriate Caution',
    description: 'You correctly identified this as challenging. That awareness helps guide your recovery.',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-500 text-white',
  },
  CI: {
    label: 'Compensation Detected',
    description: 'Your body found a workaround. Building awareness of these patterns is the first step.',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    badge: 'bg-rose-500 text-white',
  },
};

function pointsDisplay(points: number): { label: string; color: string } {
  if (points > 0) return { label: `+${points}`, color: 'text-emerald-600' };
  if (points === 0) return { label: '0', color: 'text-slate-500' };
  return { label: `${points}`, color: 'text-rose-600' };
}

export default function CalibrationResult({ result, onNext }: CalibrationResultProps) {
  const config = OUTCOME_CONFIG[result.outcome];
  const pts = pointsDisplay(result.points);
  const gapPercent = Math.min(100, Math.max(-100, result.calibrationGap * 100));
  const gapAbs = Math.abs(gapPercent);
  const gapDirection = gapPercent > 5 ? 'Overconfident' : gapPercent < -5 ? 'Underconfident' : 'Well matched';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Outcome card */}
      <div className={`rounded-xl border p-6 ${config.bg} ${config.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${config.badge}`}>
            {result.outcome}
          </span>
          <h2 className={`text-xl font-bold ${config.text}`}>{config.label}</h2>
        </div>
        <p className={`text-sm leading-relaxed ${config.text} opacity-80`}>
          {config.description}
        </p>
      </div>

      {/* Scores row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Quality score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Quality Score
          </p>
          <p className={`text-3xl font-bold tabular-nums ${
            result.qualityScore >= 80
              ? 'text-emerald-600'
              : result.qualityScore >= 60
                ? 'text-amber-600'
                : 'text-rose-600'
          }`}>
            {Math.round(result.qualityScore)}
          </p>
        </div>

        {/* Points */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Points
          </p>
          <p className={`text-3xl font-bold tabular-nums ${pts.color}`}>
            {pts.label}
          </p>
        </div>
      </div>

      {/* Calibration gap */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Calibration Gap
          </span>
          <span className="text-sm text-slate-600">{gapDirection}</span>
        </div>
        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10" />
          {/* Gap indicator */}
          {gapPercent > 0 ? (
            <div
              className="absolute top-0 bottom-0 bg-rose-400 rounded-r-full"
              style={{
                left: '50%',
                width: `${Math.min(50, gapAbs / 2)}%`,
              }}
            />
          ) : gapPercent < 0 ? (
            <div
              className="absolute top-0 bottom-0 bg-sky-400 rounded-l-full"
              style={{
                right: '50%',
                width: `${Math.min(50, gapAbs / 2)}%`,
              }}
            />
          ) : null}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">Underconfident</span>
          <span className="text-[10px] text-slate-400">Overconfident</span>
        </div>
      </div>

      {/* Compensation details for CI outcome */}
      {result.outcome === 'CI' && result.compensationsDetected.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-rose-700 mb-2">
            Compensations Observed
          </h3>
          <ul className="space-y-1">
            {result.compensationsDetected.map((comp) => (
              <li key={comp} className="flex items-center gap-2 text-sm text-rose-600">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                {comp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-lg font-semibold rounded-xl px-6 py-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        type="button"
      >
        Next Exercise
      </button>
    </div>
  );
}
