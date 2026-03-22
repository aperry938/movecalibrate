/**
 * SessionDashboard — Main home screen with recovery readiness, exercise grid,
 * and session history.
 *
 * Loads all persistent data on mount to compute the readiness gauge and
 * display per-exercise mastery levels and compensation flags.
 */

import { useState, useEffect } from 'react';
import type {
  RecoveryReadiness,
  MasteryRecord,
  CompensationFlag,
  SessionRecord,
} from '../core/types';
import { computeReadiness } from '../core/recoveryReadiness';
import { computeCalibrationScore } from '../core/calibrationEngine';
import { EXERCISES } from '../core/exerciseProfiles';
import { getAllMasteryRecords } from '../storage/exerciseProgress';
import { getAllCompensationFlags } from '../storage/compensationLog';
import { getCalibrationHistory } from '../storage/calibrationHistory';
import { getSessionHistory, getStreak } from '../storage/sessionHistory';

interface SessionDashboardProps {
  onStartSession: () => void;
  onViewPhysio: () => void;
}

const MASTERY_COLORS: Record<number, string> = {
  0: 'bg-slate-200 text-slate-600',
  1: 'bg-amber-200 text-amber-800',
  2: 'bg-yellow-200 text-yellow-800',
  3: 'bg-sky-200 text-sky-800',
  4: 'bg-blue-200 text-blue-800',
  5: 'bg-emerald-200 text-emerald-800',
};

const MASTERY_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
  5: 'Mastered',
};

function ReadinessGauge({ readiness }: { readiness: RecoveryReadiness }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = readiness.overall / 100;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="mb-3">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={readiness.overall >= 70 ? '#10b981' : readiness.overall >= 40 ? '#f59e0b' : '#f43f5e'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          className="transition-all duration-700"
        />
        {/* Score in center */}
        <text
          x="80"
          y="74"
          textAnchor="middle"
          className="fill-slate-800"
          fontSize="32"
          fontWeight="700"
        >
          {readiness.overall}
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-slate-500"
          fontSize="12"
        >
          Readiness
        </text>
      </svg>
    </div>
  );
}

function SubBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-700 tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function SessionDashboard({ onStartSession, onViewPhysio }: SessionDashboardProps) {
  const [readiness, setReadiness] = useState<RecoveryReadiness>({
    overall: 0,
    quality: 0,
    coverage: 0,
    calibration: 0,
    consistency: 0,
  });
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryRecord>>({});
  const [compFlags, setCompFlags] = useState<Record<string, CompensationFlag[]>>({});
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    // Load all persistent data
    const allMastery = getAllMasteryRecords();
    const allComps = getAllCompensationFlags();
    const calHistory = getCalibrationHistory();
    const sessions = getSessionHistory(3);
    const streak = getStreak();

    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time data load from localStorage
    setMasteryMap(allMastery);
    setCompFlags(allComps);
    setRecentSessions(sessions);

    // Compute readiness
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

  function getExerciseMasteryLevel(exerciseId: string): number {
    // Find highest mastery level across all difficulty levels for this exercise
    let maxLevel = 0;
    for (const key of Object.keys(masteryMap)) {
      if (key.startsWith(exerciseId + '_')) {
        maxLevel = Math.max(maxLevel, masteryMap[key].masteryLevel);
      }
    }
    return maxLevel;
  }

  function hasActiveCompensation(exerciseId: string): boolean {
    const flags = compFlags[exerciseId] ?? [];
    return flags.some((f) => f.flagged && !f.resolved);
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-6">
      {/* Research Prototype Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-amber-800 text-xs leading-relaxed">
          <span className="font-semibold">Research prototype</span> — not a medical device.
          Consult your healthcare provider before beginning any exercise program.
          This system does not provide medical advice, diagnosis, or treatment.
        </p>
      </div>

      {/* Recovery Readiness */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Recovery Readiness
        </h2>
        <ReadinessGauge readiness={readiness} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
          <SubBar label="Quality" value={readiness.quality} />
          <SubBar label="Coverage" value={readiness.coverage} />
          <SubBar label="Calibration" value={readiness.calibration} />
          <SubBar label="Consistency" value={readiness.consistency} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onStartSession}
          className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-lg font-semibold rounded-xl px-6 py-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="button"
        >
          Start Session
        </button>
        <button
          onClick={onViewPhysio}
          className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl px-4 py-4 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          type="button"
        >
          Physio Report
        </button>
      </div>

      {/* Exercise Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Exercises</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXERCISES.map((exercise) => {
            const level = getExerciseMasteryLevel(exercise.id);
            const hasComp = hasActiveCompensation(exercise.id);
            const masteryStyle = MASTERY_COLORS[level] ?? MASTERY_COLORS[0];
            const masteryLabel = MASTERY_LABELS[level] ?? `Level ${level}`;

            return (
              <div
                key={exercise.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {exercise.name}
                    </h3>
                    {hasComp && (
                      <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-rose-500" title="Active compensation" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 capitalize">{exercise.category}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${masteryStyle}`}>
                  {masteryLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session History */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {recentSessions
              .slice()
              .reverse()
              .map((session, idx) => (
                <div
                  key={`session-${idx}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.exercisesCompleted} exercises &middot;{' '}
                      {formatDuration(session.duration)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold tabular-nums ${
                      session.averageQuality >= 80
                        ? 'text-emerald-600'
                        : session.averageQuality >= 60
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    }`}>
                      {Math.round(session.averageQuality)}
                    </p>
                    <p className="text-xs text-slate-500">avg quality</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
