/**
 * MoveCalibrate Export Utilities
 *
 * Provides JSON export functions for clinical data sharing. Creates
 * downloadable files containing session history, calibration records,
 * and mastery data for physiotherapist review.
 */

import { getSessionHistory } from '../storage/sessionHistory';
import { getCalibrationHistory } from '../storage/calibrationHistory';
import { getAllMasteryRecords } from '../storage/exerciseProgress';
import { getAllCompensationFlags } from '../storage/compensationLog';

/**
 * Create and trigger a download for a JSON file.
 *
 * Creates a temporary anchor element with a Blob URL, triggers a click,
 * then cleans up the URL. The data is serialized with 2-space indentation
 * for readability.
 */
export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export all clinical data as a single JSON file for physiotherapist review.
 *
 * Combines:
 *   - Session history (all sessions)
 *   - Calibration history (all entries)
 *   - Mastery records (all exercises at all levels)
 *   - Compensation flags (all exercises)
 *   - Export metadata (timestamp, version)
 */
export function exportSessionsForPhysio(): void {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    application: 'MoveCalibrate',
    sessions: getSessionHistory(),
    calibrationHistory: getCalibrationHistory(),
    masteryRecords: getAllMasteryRecords(),
    compensationFlags: getAllCompensationFlags(),
  };

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `movecalibrate-physio-export-${dateStr}.json`;

  exportToJSON(exportData, filename);
}
