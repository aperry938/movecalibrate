/**
 * PhysioReport — Professional, printable report for physiotherapists.
 *
 * Aggregates all session history, mastery records, calibration data, and
 * compensation flags into a clean, print-optimized layout. Supports
 * JSON export and browser print.
 */

import { useState, useEffect } from 'react';
import type {
  MasteryRecord,
  CompensationFlag,
  SessionRecord,
  RecoveryReadiness,
} from '../core/types';
import { computeReadiness } from '../core/recoveryReadiness';
import { computeCalibrationScore } from '../core/calibrationEngine';
import { EXERCISES } from '../core/exerciseProfiles';
import { getAllMasteryRecords } from '../storage/exerciseProgress';
import { getAllCompensationFlags } from '../storage/compensationLog';
import { getCalibrationHistory } from '../storage/calibrationHistory';
import { getSessionHistory, getStreak } from '../storage/sessionHistory';
import { exportSessionsForPhysio } from '../utils/export';

interface PhysioReportProps {
  onClose: () => void;
}

const MASTERY_LABELS: Record<number, string> = {
  0: 'Not Started',
  1: 'Beginning',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Mastered',
};

export default function PhysioReport({ onClose }: PhysioReportProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryRecord>>({});
  const [compFlags, setCompFlags] = useState<Record<string, CompensationFlag[]>>({});
  const [readiness, setReadiness] = useState<RecoveryReadiness>({
    overall: 0,
    quality: 0,
    coverage: 0,
    calibration: 0,
    consistency: 0,
  });

  useEffect(() => {
    const allMastery = getAllMasteryRecords();
    const allComps = getAllCompensationFlags();
    const calHistory = getCalibrationHistory();
    const allSessions = getSessionHistory();
    const streak = getStreak();

    setMasteryMap(allMastery);
    setCompFlags(allComps);
    setSessions(allSessions);

    const recentQuality: number[] = [];
    for (const key of Object.keys(allMastery)) {
      const record = allMastery[key];
      if (record.qualityHistory.length > 0) {
        recentQuality.push(...record.qualityHistory.slice(-5));
      }
    }

    const exercisesAttempted = new Set(
      Object.keys(allMastery).map((k) => k.replace(/_\d+$/, '')),
    ).size;

    const calibrationScore = computeCalibrationScore(calHistory);
    const computed = computeReadiness(
      recentQuality,
      exercisesAttempted,
      EXERCISES.length,
      calibrationScore,
      streak,
    );
    setReadiness(computed);
  }, []);

  function getExerciseStats(exerciseId: string) {
    let totalReps = 0;
    let totalQuality = 0;
    let qualityCount = 0;
    let maxMastery = 0;

    for (const key of Object.keys(masteryMap)) {
      if (key.startsWith(exerciseId + '_')) {
        const record = masteryMap[key];
        const reps = record.timesCorrect + record.timesIncorrect;
        totalReps += reps;
        if (record.qualityHistory.length > 0) {
          totalQuality += record.qualityHistory.reduce((a, b) => a + b, 0);
          qualityCount += record.qualityHistory.length;
        }
        maxMastery = Math.max(maxMastery, record.masteryLevel);
      }
    }

    const avgQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;
    const flags = compFlags[exerciseId] ?? [];
    const activeFlags = flags.filter((f) => f.flagged && !f.resolved);

    return { totalReps, avgQuality, maxMastery, activeFlags };
  }

  const dateRange = sessions.length > 0
    ? `${new Date(sessions[0].date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} \u2013 ${new Date(sessions[sessions.length - 1].date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    : 'No sessions recorded';

  function handleExportJSON() {
    exportSessionsForPhysio();
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-break { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Report header */}
      <div className="text-center mb-6 print-break">
        <h1 className="text-2xl font-bold text-slate-800">MoveCalibrate</h1>
        <p className="text-sm text-slate-500">
          Adaptive Movement Rehabilitation &mdash; Physiotherapist Report
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Generated {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Patient info placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 print-break">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Session Summary
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Date Range:</span>
            <span className="text-slate-800 font-medium">{dateRange}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Sessions:</span>
            <span className="text-slate-800 font-medium">{sessions.length}</span>
          </div>
        </div>
      </div>

      {/* Recovery readiness breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 print-break">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Recovery Readiness Breakdown
        </h2>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'Overall', value: readiness.overall },
            { label: 'Quality', value: readiness.quality },
            { label: 'Coverage', value: readiness.coverage },
            { label: 'Calibration', value: readiness.calibration },
            { label: 'Consistency', value: readiness.consistency },
          ].map((item) => (
            <div key={item.label}>
              <p className={`text-xl font-bold tabular-nums ${
                item.value >= 70
                  ? 'text-emerald-600'
                  : item.value >= 40
                    ? 'text-amber-600'
                    : 'text-rose-600'
              }`}>
                {item.value}
              </p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 print-break">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Exercise Progress
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-3 text-xs font-semibold text-slate-500 uppercase">
                  Exercise
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                  Reps
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                  Avg Quality
                </th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                  Mastery
                </th>
                <th className="text-center py-2 pl-3 text-xs font-semibold text-slate-500 uppercase">
                  Compensations
                </th>
              </tr>
            </thead>
            <tbody>
              {EXERCISES.map((exercise) => {
                const stats = getExerciseStats(exercise.id);

                return (
                  <tr key={exercise.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-slate-800">{exercise.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{exercise.category}</p>
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums text-slate-700">
                      {stats.totalReps}
                    </td>
                    <td className={`text-right py-2.5 px-3 tabular-nums font-medium ${
                      stats.avgQuality >= 80
                        ? 'text-emerald-600'
                        : stats.avgQuality >= 60
                          ? 'text-amber-600'
                          : stats.totalReps > 0
                            ? 'text-rose-600'
                            : 'text-slate-400'
                    }`}>
                      {stats.totalReps > 0 ? Math.round(stats.avgQuality) : '\u2014'}
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <span className="text-xs text-slate-600">
                        {MASTERY_LABELS[stats.maxMastery] ?? `Level ${stats.maxMastery}`}
                      </span>
                    </td>
                    <td className="text-center py-2.5 pl-3">
                      {stats.activeFlags.length > 0 ? (
                        <div className="space-y-0.5">
                          {stats.activeFlags.map((flag) => (
                            <p key={flag.compensationName} className="text-xs text-rose-600">
                              {flag.compensationName} ({flag.occurrences}x)
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2 no-print">
        <button
          onClick={handleExportJSON}
          className="flex-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          type="button"
        >
          Export JSON
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl px-4 py-3 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          type="button"
        >
          Print Report
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
