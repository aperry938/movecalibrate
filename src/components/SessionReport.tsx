/**
 * SessionReport — Post-session summary with outcome distribution,
 * calibration metrics, compensation alerts, and mastery changes.
 */

import type { SessionRecord } from '../core/types';

interface SessionReportProps {
  record: SessionRecord;
  onClose: () => void;
  onExportPhysio: () => void;
}

const OUTCOME_META: Record<string, { label: string; color: string; barColor: string }> = {
  CC: { label: 'Well Calibrated', color: 'text-emerald-600', barColor: 'bg-emerald-500' },
  UC: { label: 'Movement Anxiety', color: 'text-sky-600', barColor: 'bg-sky-500' },
  UI: { label: 'Appropriate Caution', color: 'text-amber-600', barColor: 'bg-amber-500' },
  CI: { label: 'Compensation', color: 'text-rose-600', barColor: 'bg-rose-500' },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function SessionReport({
  record,
  onClose,
  onExportPhysio,
}: SessionReportProps) {
  const totalOutcomes =
    record.outcomes.CC + record.outcomes.UC + record.outcomes.UI + record.outcomes.CI;

  if (totalOutcomes === 0) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Session ended early
          </h2>
          <p className="text-sm text-slate-500">No exercises completed.</p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="button"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const maxOutcome = Math.max(
    record.outcomes.CC,
    record.outcomes.UC,
    record.outcomes.UI,
    record.outcomes.CI,
    1,
  );

  const gapPercent = Math.round(record.averageCalibrationGap * 100);
  const gapDirection =
    gapPercent > 5 ? 'Overconfident' : gapPercent < -5 ? 'Underconfident' : 'Well matched';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Session Complete</h2>
        <p className="text-sm text-slate-500 mt-1">
          {new Date(record.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-800 tabular-nums">
            {formatDuration(record.duration)}
          </p>
          <p className="text-xs text-slate-500">Duration</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-800 tabular-nums">
            {record.exercisesCompleted}
          </p>
          <p className="text-xs text-slate-500">Exercises</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className={`text-2xl font-bold tabular-nums ${
            record.averageQuality >= 80
              ? 'text-emerald-600'
              : record.averageQuality >= 60
                ? 'text-amber-600'
                : 'text-rose-600'
          }`}>
            {Math.round(record.averageQuality)}
          </p>
          <p className="text-xs text-slate-500">Avg Quality</p>
        </div>
      </div>

      {/* Outcome distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Calibration Outcomes
        </h3>
        <div className="space-y-3">
          {(['CC', 'UC', 'UI', 'CI'] as const).map((key) => {
            const count = record.outcomes[key];
            const meta = OUTCOME_META[key];
            const barWidth = totalOutcomes > 0 ? (count / maxOutcome) * 100 : 0;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 tabular-nums">
                    {count}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calibration gap */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Average Calibration Gap
          </span>
          <span className="text-sm text-slate-600">{gapDirection}</span>
        </div>
        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10" />
          {gapPercent > 0 ? (
            <div
              className="absolute top-0 bottom-0 bg-rose-400 rounded-r-full"
              style={{
                left: '50%',
                width: `${Math.min(50, Math.abs(gapPercent) / 2)}%`,
              }}
            />
          ) : gapPercent < 0 ? (
            <div
              className="absolute top-0 bottom-0 bg-sky-400 rounded-l-full"
              style={{
                right: '50%',
                width: `${Math.min(50, Math.abs(gapPercent) / 2)}%`,
              }}
            />
          ) : null}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">Underconfident</span>
          <span className="text-[10px] text-slate-400">Overconfident</span>
        </div>
      </div>

      {/* Compensation alerts */}
      {record.compensationAlerts > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-rose-700 mb-1">
            Compensation Alerts
          </h3>
          <p className="text-sm text-rose-600">
            {record.compensationAlerts} compensation{record.compensationAlerts !== 1 ? 's' : ''}{' '}
            detected during this session. Review the Physio Report for details.
          </p>
        </div>
      )}

      {/* Mastery changes */}
      {record.masteryChanges.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Mastery Changes
          </h3>
          <div className="space-y-2">
            {record.masteryChanges.map((change, idx) => (
              <div
                key={`mastery-${idx}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-700">{change.exercise}</span>
                <span className="tabular-nums">
                  <span className="text-slate-400">Level {change.from}</span>
                  <span className="text-slate-400 mx-1.5">&rarr;</span>
                  <span className={change.to > change.from ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    Level {change.to}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onExportPhysio}
          className="flex-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          type="button"
        >
          Export for Physiotherapist
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="button"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
