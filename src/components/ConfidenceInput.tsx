/**
 * ConfidenceInput — Two-button self-assessment for confidence calibration.
 *
 * Asks the patient to rate their confidence before performing an exercise.
 * Maps to the 2x2 calibration matrix (confident/unsure x correct/incorrect).
 */

import type { ConfidenceRating } from '../core/types';

interface ConfidenceInputProps {
  onSelect: (rating: ConfidenceRating) => void;
}

export default function ConfidenceInput({ onSelect }: ConfidenceInputProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <p className="text-slate-600 text-center text-base mb-6">
        How confident are you in performing this exercise correctly?
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => onSelect('confident')}
          className="flex-1 min-h-[80px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-lg font-semibold rounded-xl px-6 py-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="button"
        >
          I Can Do This Well
        </button>

        <button
          onClick={() => onSelect('unsure')}
          className="flex-1 min-h-[80px] bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 text-lg font-semibold rounded-xl px-6 py-4 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          type="button"
        >
          I'm Not Sure
        </button>
      </div>
    </div>
  );
}
