/**
 * ExerciseGuide — Pre-exercise instruction card.
 *
 * Shows the exercise name, description, instructions, current difficulty
 * level, and target position before the patient begins performing.
 */

import type { ExerciseProfile } from '../core/types';

interface ExerciseGuideProps {
  exercise: ExerciseProfile;
  difficultyLevel: number;
  onBegin: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  upper: 'Upper Body',
  lower: 'Lower Body',
  balance: 'Balance',
  core: 'Core',
};

const CATEGORY_COLORS: Record<string, string> = {
  upper: 'bg-blue-100 text-blue-700',
  lower: 'bg-emerald-100 text-emerald-700',
  balance: 'bg-amber-100 text-amber-700',
  core: 'bg-purple-100 text-purple-700',
};

export default function ExerciseGuide({
  exercise,
  difficultyLevel,
  onBegin,
}: ExerciseGuideProps) {
  const maxLevel = exercise.difficultyLevels.length;
  const currentLevel = exercise.difficultyLevels.find(
    (dl) => dl.level === difficultyLevel,
  );

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
          {exercise.name}
        </h2>
        <span
          className={`ml-3 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            CATEGORY_COLORS[exercise.category] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {CATEGORY_LABELS[exercise.category] ?? exercise.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-600 text-sm mb-4">{exercise.description}</p>

      {/* Instructions */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Instructions
        </h3>
        <p className="text-slate-700 text-sm leading-relaxed">
          {exercise.instructions}
        </p>
      </div>

      {/* Difficulty level */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Difficulty Level
        </h3>
        <div className="flex items-center gap-2">
          {exercise.difficultyLevels.map((dl) => (
            <div
              key={dl.level}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                dl.level === difficultyLevel
                  ? 'bg-blue-500 text-white'
                  : dl.level < difficultyLevel
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {dl.level}
            </div>
          ))}
          <span className="text-sm text-slate-500 ml-2">
            Level {difficultyLevel} of {maxLevel}
          </span>
        </div>
      </div>

      {/* Target position */}
      {currentLevel && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Target Position
          </h3>
          <p className="text-blue-800 text-sm font-medium">
            {currentLevel.target}
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Hold for {currentLevel.holdDuration} seconds
          </p>
        </div>
      )}

      {/* Safety notice */}
      <p className="text-xs text-slate-400 mb-4 text-center">
        Stop immediately if you experience pain or dizziness.
      </p>

      {/* Begin button */}
      <button
        onClick={onBegin}
        className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-lg font-semibold rounded-xl px-6 py-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        type="button"
      >
        Begin Exercise
      </button>
    </div>
  );
}
