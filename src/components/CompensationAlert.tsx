/**
 * CompensationAlert — Prominent alert banner for detected compensations.
 *
 * Displays a list of movement compensations and a brief explanation
 * of what compensations mean in a rehabilitation context.
 */

interface CompensationAlertProps {
  compensations: string[];
  exerciseName: string;
}

export default function CompensationAlert({
  compensations,
  exerciseName,
}: CompensationAlertProps) {
  if (compensations.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto bg-rose-50 border border-rose-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
          <span className="text-rose-500 text-lg font-bold">!</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-rose-800 mb-1">
            Compensation Alert
          </h3>
          <p className="text-sm text-rose-700 mb-3">
            During <span className="font-medium">{exerciseName}</span>, the following
            compensation patterns were detected:
          </p>
          <ul className="space-y-1.5 mb-4">
            {compensations.map((comp) => (
              <li key={comp} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-sm text-rose-700 font-medium">{comp}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-rose-600 leading-relaxed border-t border-rose-200 pt-3">
            Compensations are alternative movement patterns your body uses to work
            around limitations. While natural, they can reinforce imbalances and
            slow recovery. Awareness is the first step toward addressing them.
          </p>
        </div>
      </div>
    </div>
  );
}
