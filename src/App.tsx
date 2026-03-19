/**
 * MoveCalibrate App Shell
 *
 * State-based routing for the four views: dashboard, session, report, physio.
 * The session view orchestrates the full rep flow: preview -> confidence ->
 * countdown -> perform -> scoring -> result, using CameraView + rep hooks.
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  BiomechanicalFeatures,
  Landmark,
  ConfidenceRating,
  Deviation,
  SessionRecord,
  CalibrationOutcome,
} from './core/types';
import { getExerciseById } from './core/exerciseProfiles';
import { computeQualityScore, getDeviations, checkCompensations } from './core/qualityScoring';
import { useRepFlow } from './hooks/useRepFlow';
import { useAdaptiveSession } from './hooks/useAdaptiveSession';

import SessionDashboard from './components/SessionDashboard';
import SessionReport from './components/SessionReport';
import PhysioReport from './components/PhysioReport';
import CameraView from './components/CameraView';
import ExerciseGuide from './components/ExerciseGuide';
import ConfidenceInput from './components/ConfidenceInput';
import MovementFeedback from './components/MovementFeedback';
import CalibrationResult from './components/CalibrationResult';
import CompensationAlert from './components/CompensationAlert';

type AppView = 'dashboard' | 'session' | 'report' | 'physio';

interface RepResultData {
  confidence: ConfidenceRating;
  qualityScore: number;
  outcome: CalibrationOutcome;
  points: number;
  calibrationGap: number;
  deviations: Deviation[];
  compensationsDetected: string[];
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [sessionRecord, setSessionRecord] = useState<SessionRecord | null>(null);
  const [lastRepResult, setLastRepResult] = useState<RepResultData | null>(null);

  // Live quality tracking during perform phase
  const [liveQuality, setLiveQuality] = useState(0);
  const [liveDeviations, setLiveDeviations] = useState<Deviation[]>([]);
  const [liveCompensations, setLiveCompensations] = useState<string[]>([]);

  // Adaptive session hook
  const {
    isActive: _sessionIsActive,
    exerciseQueue,
    currentIndex,
    sessionMetrics: _sessionMetrics,
    startSession,
    completeRep,
    endSession,
    getCurrentExercise,
  } = useAdaptiveSession();

  // Get current exercise info
  const currentAssignment = getCurrentExercise();
  const currentExercise = currentAssignment
    ? currentAssignment.exercise
    : undefined;
  const currentDifficulty = currentAssignment?.difficultyLevel ?? 1;

  // Rep flow hook
  const {
    flowState,
    countdown,
    holdTimer,
    holdDuration,
    repResult,
    startPreview,
    setConfidence,
    addQualitySample,
    completeHold,
    nextRep,
  } = useRepFlow(currentExercise ?? null, currentDifficulty);

  // Handle frame data from camera during perform phase
  const handleFrame = useCallback(
    (features: BiomechanicalFeatures, _landmarks: Landmark[]) => {
      if (flowState !== 'perform' || !currentExercise) return;

      // Compute quality for this frame
      const quality = computeQualityScore(features, currentExercise, currentDifficulty);
      const deviations = getDeviations(features, currentExercise, currentDifficulty);
      const compensations = checkCompensations(features, currentExercise);

      // Update live display
      setLiveQuality(quality);
      setLiveDeviations(deviations);
      setLiveCompensations(compensations);

      // Feed into rep flow
      addQualitySample(features);
    },
    [flowState, currentExercise, currentDifficulty, addQualitySample],
  );

  // Auto-complete the hold when timer reaches duration
  useEffect(() => {
    if (flowState === 'perform' && holdTimer >= holdDuration) {
      completeHold();
    }
  }, [flowState, holdTimer, holdDuration, completeHold]);

  // React to repResult from useRepFlow becoming non-null (scoring complete)
  useEffect(() => {
    if (repResult && flowState === 'result') {
      const result: RepResultData = {
        confidence: repResult.confidence,
        qualityScore: repResult.qualityScore,
        outcome: repResult.outcome,
        points: repResult.points,
        calibrationGap: repResult.calibrationGap,
        deviations: repResult.deviations,
        compensationsDetected: repResult.compensationsDetected,
      };

      setLastRepResult(result);

      // Report to adaptive session
      completeRep(
        repResult.outcome,
        repResult.qualityScore,
        repResult.confidence,
        repResult.calibrationGap,
        repResult.compensationsDetected,
        repResult.points,
      );
    }
  }, [repResult, flowState, completeRep]);

  // ── View Handlers ─────────────────────────────────────────────────────────

  function handleStartSession() {
    startSession();
    setView('session');
    // Start the first exercise
    startPreview();
  }

  function handleConfidence(rating: ConfidenceRating) {
    // Reset live display state
    setLiveQuality(0);
    setLiveDeviations([]);
    setLiveCompensations([]);
    setConfidence(rating);
  }

  function handleNextRep() {
    setLastRepResult(null);

    // Check if there are more exercises
    if (currentIndex < exerciseQueue.length - 1) {
      nextRep();
      startPreview();
    } else {
      // Session complete
      const record = endSession();
      if (record) {
        setSessionRecord(record);
      }
      setView('report');
    }
  }

  function handleBeginExercise() {
    // Show the confidence input UI. The user selects their confidence rating
    // which then triggers the countdown via handleConfidenceSelect -> setConfidence.
    setShowConfidenceInput(true);
  }

  const [showConfidenceInput, setShowConfidenceInput] = useState(false);

  function handleConfidenceSelect(rating: ConfidenceRating) {
    setShowConfidenceInput(false);
    handleConfidence(rating);
  }

  function handleBackToDashboard() {
    setSessionRecord(null);
    setLastRepResult(null);
    setView('dashboard');
  }

  function handleViewPhysio() {
    setView('physio');
  }

  function handleExportPhysio() {
    setView('physio');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">MoveCalibrate</h1>
            <p className="text-xs text-slate-500">Adaptive Movement Rehabilitation</p>
          </div>
          {view !== 'dashboard' && (
            <button
              onClick={handleBackToDashboard}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              type="button"
            >
              Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Dashboard view */}
        {view === 'dashboard' && (
          <SessionDashboard
            onStartSession={handleStartSession}
            onViewPhysio={handleViewPhysio}
          />
        )}

        {/* Session view */}
        {view === 'session' && (
          <SessionView
            flowState={flowState}
            currentExercise={currentExercise}
            currentDifficulty={currentDifficulty}
            countdown={countdown}
            holdTimer={holdTimer}
            holdDuration={holdDuration}
            liveQuality={liveQuality}
            liveDeviations={liveDeviations}
            liveCompensations={liveCompensations}
            lastRepResult={lastRepResult}
            showConfidenceInput={showConfidenceInput}
            currentIndex={currentIndex}
            totalExercises={exerciseQueue.length}
            onFrame={handleFrame}
            onBegin={handleBeginExercise}
            onConfidence={handleConfidenceSelect}
            onNext={handleNextRep}
          />
        )}

        {/* Report view */}
        {view === 'report' && sessionRecord && (
          <SessionReport
            record={sessionRecord}
            onClose={handleBackToDashboard}
            onExportPhysio={handleExportPhysio}
          />
        )}

        {/* Physio report view */}
        {view === 'physio' && (
          <PhysioReport onClose={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
}

// ── Session View Sub-component ─────────────────────────────────────────────
// Extracted to keep the main App component readable. Orchestrates CameraView
// with the appropriate overlay panel based on the current rep flow state.

interface SessionViewProps {
  flowState: string;
  currentExercise: ReturnType<typeof getExerciseById>;
  currentDifficulty: number;
  countdown: number;
  holdTimer: number;
  holdDuration: number;
  liveQuality: number;
  liveDeviations: Deviation[];
  liveCompensations: string[];
  lastRepResult: RepResultData | null;
  showConfidenceInput: boolean;
  currentIndex: number;
  totalExercises: number;
  onFrame: (features: BiomechanicalFeatures, landmarks: Landmark[]) => void;
  onBegin: () => void;
  onConfidence: (rating: ConfidenceRating) => void;
  onNext: () => void;
}

function SessionView({
  flowState,
  currentExercise,
  currentDifficulty,
  countdown,
  holdTimer,
  holdDuration,
  liveQuality,
  liveDeviations,
  liveCompensations,
  lastRepResult,
  showConfidenceInput,
  currentIndex,
  totalExercises,
  onFrame,
  onBegin,
  onConfidence,
  onNext,
}: SessionViewProps) {
  const isPerforming = flowState === 'perform' || flowState === 'countdown';

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Exercise {currentIndex + 1} of {totalExercises}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalExercises }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < currentIndex
                  ? 'bg-emerald-400'
                  : i === currentIndex
                    ? 'bg-blue-500'
                    : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Camera feed (always visible during session, active during perform/countdown) */}
      <CameraView
        onFrame={onFrame}
        showSkeleton={isPerforming}
        showAngles={isPerforming}
        isActive={isPerforming}
      />

      {/* Countdown overlay */}
      {flowState === 'countdown' && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-2">Get ready...</p>
          <p className="text-6xl font-bold text-blue-500 tabular-nums">{countdown}</p>
        </div>
      )}

      {/* State-dependent panels */}
      {(flowState === 'idle' || flowState === 'preview') && currentExercise && !showConfidenceInput && (
        <ExerciseGuide
          exercise={currentExercise}
          difficultyLevel={currentDifficulty}
          onBegin={onBegin}
        />
      )}

      {showConfidenceInput && (
        <ConfidenceInput onSelect={onConfidence} />
      )}

      {flowState === 'perform' && (
        <MovementFeedback
          qualityScore={liveQuality}
          deviations={liveDeviations}
          holdTimer={holdTimer}
          holdDuration={holdDuration}
          compensationsDetected={liveCompensations}
        />
      )}

      {(flowState === 'scoring' || flowState === 'result') && lastRepResult && (
        <>
          <CalibrationResult result={lastRepResult} onNext={onNext} />
          {lastRepResult.compensationsDetected.length > 0 && currentExercise && (
            <CompensationAlert
              compensations={lastRepResult.compensationsDetected}
              exerciseName={currentExercise.name}
            />
          )}
        </>
      )}
    </div>
  );
}
