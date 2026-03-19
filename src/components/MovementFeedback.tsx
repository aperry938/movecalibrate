/**
 * MovementFeedback — Real-time quality display during exercise performance.
 *
 * Shows quality score bar, hold timer progress, top deviations with
 * directional arrows, and compensation alert banner.
 */

import type { Deviation } from '../core/types';

interface MovementFeedbackProps {
  qualityScore: number;
  deviations: Deviation[];
  holdTimer: number;
  holdDuration: number;
  compensationsDetected: string[];
}

function qualityColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function qualityTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/^L /, 'Left ')
    .replace(/^R /, 'Right ');
}

export default function MovementFeedback({
  qualityScore,
  deviations,
  holdTimer,
  holdDuration,
  compensationsDetected,
}: MovementFeedbackProps) {
  const roundedScore = Math.round(qualityScore);
  const holdProgress = holdDuration > 0 ? Math.min(1, holdTimer / holdDuration) : 0;
  const holdRemaining = Math.max(0, holdDuration - holdTimer);
  const topDeviations = deviations
    .slice()
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Quality score */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Movement Quality
          </span>
          <span className={`text-3xl font-bold tabular-nums ${qualityTextColor(roundedScore)}`}>
            {roundedScore}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${qualityColor(roundedScore)}`}
            style={{ width: `${Math.min(100, roundedScore)}%` }}
          />
        </div>
      </div>

      {/* Hold timer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Hold Timer
          </span>
          <span className="text-lg font-semibold text-slate-700 tabular-nums">
            {holdRemaining.toFixed(1)}s
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${holdProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Top deviations */}
      {topDeviations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Form Deviations
          </h3>
          <div className="space-y-2">
            {topDeviations.map((dev, i) => (
              <div key={`${dev.featureIndex}-${i}`} className="flex items-center gap-3">
                <span
                  className={`shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                    dev.direction === 'too_high'
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {dev.direction === 'too_high' ? '\u2191' : '\u2193'}
                </span>
                <span className="text-sm text-slate-700 flex-1">
                  {formatFeatureName(dev.featureName)}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {(dev.severity * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compensation alert */}
      {compensationsDetected.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-rose-500 text-lg font-bold mt-px">!</span>
            <div>
              <h3 className="text-sm font-semibold text-rose-700 mb-1">
                Compensation Detected
              </h3>
              <ul className="space-y-0.5">
                {compensationsDetected.map((comp) => (
                  <li key={comp} className="text-sm text-rose-600">
                    {comp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
