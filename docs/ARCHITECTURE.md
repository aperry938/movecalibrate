# MoveCalibrate System Architecture

This document describes the 3-layer architecture, data flow, and state management of the MoveCalibrate adaptive movement rehabilitation system.

---

## Design Principles

1. **Client-side only.** No server, no network calls, no cloud storage. All computation and persistence happen in the browser. Patient movement data never leaves the device.
2. **Pure core, reactive shell.** The `core/` layer contains pure TypeScript functions with zero React dependencies. The `hooks/` layer wraps core logic in React state management. The `components/` layer renders UI. This separation enables testing the engine without a browser and swapping UI frameworks without touching algorithms.
3. **Port, don't rewrite.** Biomechanical features are ported from ZENith's Python implementation. Adaptive algorithms are ported from Meridian Labs' JavaScript engine. Each port preserves the original's semantics and naming conventions.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Presentation (components/)                     │
│  React components, view routing, user interaction        │
│  Depends on: Layer 2                                     │
├─────────────────────────────────────────────────────────┤
│  Layer 2: State Management (hooks/)                      │
│  React hooks, session lifecycle, frame processing loop   │
│  Depends on: Layer 1, storage/                           │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Core Engine (core/)                            │
│  Pure functions, zero React imports, zero side effects   │
│  Depends on: nothing (types only)                        │
├─────────────────────────────────────────────────────────┤
│  Persistence: Storage (storage/)                         │
│  localStorage wrapper with safe serialization            │
│  Depends on: nothing                                     │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: Core Engine (`src/core/`)

All computation lives here. Every module exports pure functions (or stateful classes with no React dependency like `StabilityTracker`). No module in this layer imports from React, hooks, components, or storage.

| Module | Responsibility |
|--------|---------------|
| `types.ts` | Shared type definitions, `FeatureIndex` enum mapping 30 biomechanical features to array positions |
| `math.ts` | Geometry primitives: angle calculation, distances, midpoints, convex hull area, clamping. Ported from ZENith's `pose_foundations.py` |
| `biomechanics.ts` | 30-feature extraction from 33 MediaPipe landmarks. Four compute functions (joint angles, segment ratios, symmetry, stability) concatenated into `Float64Array(30)`. Ported from ZENith's `biomechanical_features.py` |
| `exerciseProfiles.ts` | 7 exercise definitions, each with 4 difficulty levels specifying ideal biomechanical ranges, hold durations, and compensation rules |
| `qualityScoring.ts` | Quality score (0-100) computed as mean per-feature distance from ideal ranges. Deviation analysis and compensation pattern detection (AND-gate rule matching) |
| `calibrationEngine.ts` | 4-outcome model (CC/UC/UI/CI), asymmetric point scoring, calibration gap computation, time-weighted calibration score with 14-day exponential decay |
| `masteryEngine.ts` | 6-tier mastery levels with spaced repetition intervals [0, 1, 3, 7, 14, 30] days. Immutable record updates. Due-for-review checks |
| `sessionSelector.ts` | 60/30/10 pool allocation (weak/new/review) with weighted random selection. Compensation flags apply priority multipliers |
| `compensationDetector.ts` | Flag creation, 3-consecutive-correct resolution, priority multipliers (4x unresolved, 2x resolved), active flag queries |
| `recoveryReadiness.ts` | 4-factor composite: quality (35%), coverage (30%), calibration (20%), consistency (15%). Capped at 99 |

### Layer 2: State Management (`src/hooks/`)

Three hooks bridge the core engine with React's state model.

| Hook | Responsibility |
|------|---------------|
| `usePoseEstimation` | Initializes MediaPipe PoseLandmarker (WASM, GPU delegate). Per-frame detection callback extracts 33 landmarks and runs the 30-feature biomechanical pipeline. Maintains a 15-frame `StabilityTracker` for temporal features. Tracks FPS via rolling 30-frame average |
| `useRepFlow` | 7-state machine for a single rep: idle -> preview -> confidence -> countdown -> perform -> scoring -> result. Collects quality samples during perform phase, computes median quality, runs calibration scoring, aggregates compensations (>25% frame threshold) |
| `useAdaptiveSession` | Full session lifecycle: loads mastery/compensation state from localStorage, builds exercise queue via `selectExercises`, processes each rep (mastery updates, compensation tracking, calibration logging), produces `SessionRecord`, updates streak |

### Layer 3: Presentation (`src/components/`)

Nine components map to the four application views.

| Component | View | Purpose |
|-----------|------|---------|
| `SessionDashboard` | Dashboard | Home screen, readiness score, session history, start button |
| `CameraView` | Session | Webcam feed with optional skeleton overlay and angle annotations |
| `ExerciseGuide` | Session | Exercise name, description, instructions, difficulty target |
| `ConfidenceInput` | Session | Pre-rep binary confidence self-assessment (confident / unsure) |
| `MovementFeedback` | Session | Live quality score, deviation list, hold timer, compensation warnings |
| `CalibrationResult` | Session | Post-rep outcome display (CC/UC/UI/CI), points, calibration gap |
| `CompensationAlert` | Session | Alert panel for detected compensation patterns |
| `SessionReport` | Report | End-of-session summary: outcomes, quality, mastery changes |
| `PhysioReport` | Physio | Printable/exportable report for physiotherapist review |

---

## Data Flow

### Per-Frame Pipeline (during PERFORM phase)

```
Camera (getUserMedia)
    │
    ▼
HTMLVideoElement @ 30fps
    │
    ▼
usePoseEstimation.processFrame(video)
    │
    ├── PoseLandmarker.detectForVideo(video, timestamp)
    │       → 33 NormalizedLandmark[] (x, y, z, visibility)
    │
    ├── extractFeatures(landmarks, stabilityTracker)
    │       → Float64Array(30) biomechanical features
    │       ├── computeJointAngles(landmarks)        → 16 values [0-15]
    │       ├── computeSegmentRatios(landmarks)       → 6 values  [16-21]
    │       ├── computeSymmetryMetrics(jointAngles)   → 4 values  [22-25]
    │       └── stabilityTracker.compute(landmarks)   → 4 values  [26-29]
    │
    ▼
App.handleFrame(features, landmarks)
    │
    ├── computeQualityScore(features, profile, difficulty) → 0-100
    ├── getDeviations(features, profile, difficulty)        → Deviation[]
    ├── checkCompensations(features, profile)               → string[]
    │
    ├── Update live display (quality, deviations, compensations)
    └── Collect samples for end-of-rep scoring
```

### Rep Completion Pipeline

```
Hold timer expires
    │
    ▼
Compute final quality (mean of all frame samples)
    │
    ├── computeOutcome(confidence, quality) → CC|UC|UI|CI
    ├── computePoints(outcome)              → +3|-1|-2|-5
    ├── computeCalibrationGap(confidence, quality) → signed float
    │
    ▼
useAdaptiveSession.completeRep(...)
    │
    ├── updateMastery(record, outcome, quality)
    │       → Save to localStorage
    │
    ├── Update compensation flags
    │       CI: create/increment flag
    │       CC/UC: increment consecutiveCorrect toward resolution
    │       → Save to localStorage
    │
    ├── appendCalibrationEntry(entry)
    │       → Save to localStorage
    │
    └── Update session metrics + advance to next exercise
```

### Session Lifecycle

```
Dashboard
    │
    ▼  startSession(8)
Load mastery records (localStorage)
Load compensation flags (localStorage)
    │
    ▼  selectExercises(exercises, mastery, compensations, 8)
Build 3 pools:
    Weak (60%): mastery < 2, unresolved compensations, due for review
    New  (30%): no mastery record for exercise+difficulty combo
    Review(10%): mastery >= 3, no active flags
    │
    ▼  Weighted random selection from each pool
exerciseQueue: ExerciseAssignment[8]
    │
    ▼  For each exercise in queue:
    ├── Preview (show instructions)
    ├── Confidence input (confident / unsure)
    ├── Countdown (3, 2, 1)
    ├── Perform (collect frame samples for holdDuration seconds)
    ├── Score (compute quality, outcome, update mastery/compensations)
    └── Result (display outcome, deviations, compensations)
    │
    ▼  endSession()
Build SessionRecord
Persist to sessionHistory (localStorage)
Update streak (localStorage)
    │
    ▼
Session Report → Dashboard
```

---

## State Management

### In-Memory State (React)

| State | Scope | Managed By |
|-------|-------|------------|
| App view (dashboard/session/report/physio) | App | `useState` in App.tsx |
| Current landmarks + features | Frame | `usePoseEstimation` |
| Rep flow state (7 phases) | Rep | `useRepFlow` |
| Quality samples, compensation samples | Rep | `useRef` arrays (not re-render triggering) |
| Session active, exercise queue, current index | Session | `useAdaptiveSession` |
| Session metrics (outcomes, quality, gaps) | Session | `useAdaptiveSession` |
| Live quality, deviations, compensations | Frame | `useState` in App.tsx |

### Persisted State (localStorage)

All keys prefixed with `mc_` to namespace within the browser's localStorage.

| Key | Module | Contents |
|-----|--------|----------|
| `mc_exerciseProgress` | `exerciseProgress.ts` | `Record<string, MasteryRecord>` keyed by `{exerciseId}_{difficultyLevel}` |
| `mc_compensationLog` | `compensationLog.ts` | `Record<string, CompensationFlag[]>` keyed by exerciseId |
| `mc_calibrationHistory` | `calibrationHistory.ts` | `CalibrationEntry[]` with timestamps, outcomes, gaps |
| `mc_sessionHistory` | `sessionHistory.ts` | `SessionRecord[]` with duration, outcomes, mastery changes |
| `mc_streak` | `sessionHistory.ts` | Current consecutive-day session streak |
| `mc_longestStreak` | `sessionHistory.ts` | All-time longest streak |
| `mc_lastSessionDate` | `sessionHistory.ts` | ISO date of most recent session |
| `mc_settings` | Reserved | User preferences (future) |

The storage layer uses a safe wrapper (`storageManager.ts`) that catches all exceptions from `localStorage.setItem`/`getItem`/`removeItem`, returning fallback values on quota errors, private browsing restrictions, or corrupted data. The `clearAllMcData()` function removes only `mc_`-prefixed keys, leaving other applications' data untouched.

---

## Provenance

| Component | Ported From | Original Language |
|-----------|-------------|-------------------|
| 30 biomechanical features | ZENith `biomechanical_features.py` | Python (NumPy) |
| Geometry primitives | ZENith `pose_foundations.py` | Python |
| Quality scoring | ZENith `biomechanical_features.py` scoring | Python |
| 4-outcome calibration model | Meridian Labs adaptive engine | JavaScript |
| 6-tier mastery + spaced repetition | Meridian Labs `adaptive-engine.js` | JavaScript |
| 60/30/10 session selection | Meridian Labs `sessionSelector.js` | JavaScript |
| Compensation detection | Adapted from Meridian Labs misconception tracking | JavaScript |
| Recovery readiness | Adapted from Meridian Labs exam readiness | JavaScript |
