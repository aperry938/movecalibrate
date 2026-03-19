# MoveCalibrate: Adaptive Movement Rehabilitation with Confidence Calibration

**Anthony C. Perry** -- [github.com/aperry938](https://github.com/aperry938)

---

## Abstract

MoveCalibrate is a client-side adaptive movement rehabilitation system that introduces the **Movement Calibration Gap** -- a novel metric comparing patient self-assessed movement confidence against AI-measured movement quality via real-time pose estimation. The system combines 30 expert-designed biomechanical features (ported from the [ZENith](https://github.com/aperry938/zenith-mvp) movement analysis framework) with a confidence calibration engine adapted from the [Meridian Labs](https://meridianlabs.us) adaptive learning platform.

Seven rehabilitation exercises spanning upper body, lower body, and balance domains are assessed through a **4-outcome model** detecting well-calibrated proprioception (CC), movement anxiety (UC), appropriate caution (UI), and compensation patterns (CI). An adaptive 6-tier mastery system with spaced repetition schedules exercise progression, while a 4-factor Recovery Readiness composite (quality, coverage, calibration, consistency) tracks rehabilitation progress.

The system runs entirely in the browser -- MediaPipe WASM for pose estimation, on-device localStorage for all data -- ensuring patient privacy by architectural design. No video or movement data ever leaves the device.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Browser (React 19 + Vite)                          │
│                                                                            │
│  ┌────────────┐    ┌───────────────────────────────────────────────────┐   │
│  │   Camera    │    │              Core Engine Layer                    │   │
│  │ getUserMedia│    │                                                   │   │
│  └─────┬──────┘    │  ┌──────────────┐    ┌─────────────────────────┐ │   │
│        │           │  │  MediaPipe    │    │  Biomechanical Feature  │ │   │
│        ▼           │  │  WASM Pose    │───►│  Extraction (30 dim)   │ │   │
│  Video Frames      │  │  Landmarker   │    │  Float64Array(30)      │ │   │
│  @ 30fps           │  │  (33 lm × 4) │    └──────────┬──────────────┘ │   │
│        │           │  └──────────────┘               │                │   │
│        └──────────►│                                  │                │   │
│                    │  ┌──────────────────┐    ┌───────▼──────────────┐ │   │
│                    │  │  Confidence      │    │  Quality Scoring     │ │   │
│                    │  │  Input           │    │  (per-feature vs     │ │   │
│                    │  │  (patient self-  │    │   ideal ranges)      │ │   │
│                    │  │   assessment)    │    └───────┬──────────────┘ │   │
│                    │  └───────┬──────────┘            │                │   │
│                    │          │                       │                │   │
│                    │  ┌───────▼───────────────────────▼──────────────┐ │   │
│                    │  │         4-Outcome Calibration Engine          │ │   │
│                    │  │  CC (Confident+Correct)  UC (Unsure+Correct) │ │   │
│                    │  │  UI (Unsure+Incorrect)   CI (Conf.+Incorrect)│ │   │
│                    │  └───────────────────┬──────────────────────────┘ │   │
│                    │                      │                            │   │
│                    │  ┌───────────────────▼──────────────────────────┐ │   │
│                    │  │           Adaptive Engine                     │ │   │
│                    │  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │ │   │
│                    │  │  │ Mastery │  │  Spaced   │  │  Session   │  │ │   │
│                    │  │  │ 6-Tier  │  │ Repetition│  │  Selector  │  │ │   │
│                    │  │  │ System  │  │ Scheduler │  │  60/30/10  │  │ │   │
│                    │  │  └─────────┘  └──────────┘  └────────────┘  │ │   │
│                    │  └──────────────────────────────────────────────┘ │   │
│                    │                                                   │   │
│                    │  ┌──────────────────────────────────────────────┐ │   │
│                    │  │  Compensation Detection + Recovery Readiness  │ │   │
│                    │  │  (3-consecutive resolution, 4-factor score)   │ │   │
│                    │  └──────────────────────────────────────────────┘ │   │
│                    └───────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    localStorage (mc_* keys)                          │   │
│  │  exerciseProgress │ compensationLog │ calibrationHistory │ sessions │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↑
                    Zero server. Zero network.
                    All data stays on-device.
```

---

## The Movement Calibration Gap

In knowledge assessment, the gap between what a student *thinks* they know and what they *actually* know reveals critical metacognitive information. MoveCalibrate applies this principle to movement rehabilitation: the gap between a patient's *perceived* movement quality and their *measured* movement quality -- the **Movement Calibration Gap** -- exposes proprioceptive miscalibration that standard movement quality metrics alone cannot capture.

A patient who moves correctly but rates themselves as "unsure" (UC) may have movement anxiety that inhibits rehabilitation adherence. A patient who moves incorrectly but rates themselves as "confident" (CI) has a dangerous proprioceptive miscalibration that risks re-injury through compensatory patterns they cannot feel.

This 2x2 confidence-correctness matrix produces four clinically distinct outcomes, each requiring a different therapeutic response.

---

## Exercises

| # | Exercise | Category | Description | Compensations Detected |
|---|----------|----------|-------------|----------------------|
| 1 | Standing Shoulder Flexion | Upper | Forward arm raise to target angle | Trunk lean |
| 2 | Standing Shoulder Abduction | Upper | Lateral arm raise to target angle | Lateral trunk lean, shoulder hiking |
| 3 | Standing Hamstring Curl | Lower | Single-leg heel-to-buttock knee flexion | Hip flexion compensation, trunk forward lean |
| 4 | Mini Squat | Lower | Bilateral squat to progressive depth | Excessive trunk lean, asymmetric loading, valgus collapse |
| 5 | Tandem Stance | Balance | Heel-to-toe standing balance hold | Excessive sway, wide stance cheat, rapid corrections |
| 6 | Single Leg Stance | Balance | Unilateral standing balance hold | Trendelenburg sign, excessive trunk sway, rapid corrections |
| 7 | Heel Raise | Lower | Bilateral/unilateral calf raises | Asymmetric push-off, excessive wobble, knee hyperextension |

Each exercise has 4 progressive difficulty levels with exercise-specific ideal biomechanical ranges and hold durations.

---

## Biomechanical Features (30 dimensions)

Ported from [ZENith](https://github.com/aperry938/zenith-mvp) with full fidelity. All values normalized to [0, 1].

| Category | Count | Features |
|----------|-------|----------|
| Joint Angles | 16 | Bilateral shoulder flexion/abduction, elbow flexion, hip flexion/abduction, knee flexion, ankle dorsiflexion, spinal lateral flexion, trunk forward lean |
| Segment Ratios | 6 | Torso-leg ratio, arm span symmetry, stance width, shoulder-hip alignment, CoM over BoS, head-spine alignment |
| Symmetry Metrics | 4 | Bilateral comparison: shoulder, elbow, hip, knee |
| Stability Indicators | 4 | Velocity variance, CoM oscillation, BoS area, weight distribution |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Pose estimation | @mediapipe/tasks-vision (WASM, browser-side) |
| Quality scoring | @tensorflow/tfjs (VAE quality scoring -- Phase 4) |
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Storage | localStorage (on-device only) |
| Server | None. Zero server, zero dependencies, fully client-side |

---

## Setup

```bash
git clone https://github.com/aperry938/movecalibrate
cd movecalibrate
npm install
npm run dev
```

Open `http://localhost:5173/movecalibrate/` in a browser with webcam access.

---

## Project Structure

```
movecalibrate/
├── src/
│   ├── core/                       # Engine layer (pure logic, no React)
│   │   ├── types.ts                # All type definitions + FeatureIndex enum
│   │   ├── math.ts                 # Geometry primitives (ported from ZENith)
│   │   ├── biomechanics.ts         # 30-feature extraction from 33 landmarks
│   │   ├── exerciseProfiles.ts     # 7 exercises × 4 difficulty levels
│   │   ├── qualityScoring.ts       # Per-feature quality + deviation analysis
│   │   ├── calibrationEngine.ts    # 4-outcome model + calibration gap
│   │   ├── masteryEngine.ts        # 6-tier mastery + spaced repetition
│   │   ├── sessionSelector.ts      # 60/30/10 adaptive session builder
│   │   ├── compensationDetector.ts # Flag tracking + 3-consecutive resolution
│   │   └── recoveryReadiness.ts    # 4-factor composite readiness score
│   │
│   ├── hooks/                      # React hooks (state management)
│   │   ├── usePoseEstimation.ts    # MediaPipe WASM init + per-frame detection
│   │   ├── useRepFlow.ts           # 7-state rep lifecycle machine
│   │   └── useAdaptiveSession.ts   # Full session orchestration
│   │
│   ├── components/                 # React UI components
│   │   ├── CameraView.tsx          # Webcam + skeleton overlay
│   │   ├── SessionDashboard.tsx    # Home screen + readiness display
│   │   ├── ExerciseGuide.tsx       # Exercise instructions + demo
│   │   ├── ConfidenceInput.tsx     # Pre-rep confidence self-assessment
│   │   ├── MovementFeedback.tsx    # Live quality + deviation display
│   │   ├── CalibrationResult.tsx   # Post-rep calibration outcome
│   │   ├── CompensationAlert.tsx   # Compensation pattern warnings
│   │   ├── SessionReport.tsx       # End-of-session summary
│   │   └── PhysioReport.tsx        # Exportable physiotherapist report
│   │
│   ├── storage/                    # localStorage persistence layer
│   │   ├── storageKeys.ts          # Centralized mc_* key registry
│   │   ├── storageManager.ts       # Safe read/write wrapper
│   │   ├── exerciseProgress.ts     # Mastery record CRUD
│   │   ├── compensationLog.ts      # Compensation flag CRUD
│   │   ├── calibrationHistory.ts   # Calibration entry append/query
│   │   └── sessionHistory.ts       # Session records + streak tracking
│   │
│   ├── utils/                      # Rendering and export utilities
│   │   ├── drawing.ts              # Canvas skeleton rendering
│   │   └── export.ts               # Data export functions
│   │
│   ├── App.tsx                     # App shell + view routing
│   └── main.tsx                    # React entry point
│
├── docs/
│   ├── ARCHITECTURE.md             # System design document
│   ├── CALIBRATION_MODEL.md        # Movement Calibration Gap theory
│   └── EXERCISE_PROFILES.md        # Clinical rationale per exercise
│
├── public/                         # Static assets
├── training/                       # VAE training data (Phase 4)
├── index.html                      # HTML entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md                       # This file
```

---

## Key Algorithms

### Confidence Calibration: 4-Outcome Model

The 2x2 matrix of {confident, unsure} x {correct, incorrect} produces four calibration outcomes with asymmetric point values: CC (+3), UC (-1), UI (-2), CI (-5). The CI penalty is harshest because confident-incorrect movement represents dangerous proprioceptive miscalibration.

### Mastery System: 6-Tier with Spaced Repetition

Six levels (New, Learning, Familiar, Comfortable, Proficient, Mastered) with spaced repetition intervals [0, 1, 3, 7, 14, 30] days. Mastery advances on correct outcomes (CC/UC: +1) and regresses on incorrect outcomes (UI: -2, CI: -3).

### Session Selection: 60/30/10 Rule

Each session draws from three pools: Weak (60%) for exercises below mastery level 2 or with unresolved compensations, New (30%) for unattempted exercise-difficulty combinations, and Review (10%) for mastered exercises. Compensation flags apply 4x (unresolved) or 2x (resolved) priority multipliers.

### Recovery Readiness: 4-Factor Composite

A weighted composite of movement quality (35%), exercise coverage (30%), calibration accuracy (20%), and session consistency (15%), capped at 99 (never claims perfect readiness).

### Compensation Detection: 3-Consecutive Resolution

Compensation patterns (e.g., trunk lean, Trendelenburg sign, valgus collapse) are flagged when detected and tracked until 3 consecutive correct repetitions resolve the flag. Resolved flags remain monitored at 2x priority to prevent regression.

---

## Research Context

MoveCalibrate is part of Anthony Perry's pre-PhD research portfolio, demonstrating the transfer of adaptive AI systems from education (Meridian Labs) to movement rehabilitation. The project targets **OzCHI 2026** or **JMIR Rehabilitation and Assistive Technologies** as a publication venue.

The core intellectual contribution -- applying metacognitive calibration metrics from learning science to proprioceptive awareness in rehabilitation -- bridges Human-Computer Interaction, kinesiology, and adaptive systems research.

---

## Related Work

- **[ZENith](https://github.com/aperry938/zenith-mvp)** -- Source of the 30 biomechanical features, pose-specific quality profiles, and real-time movement analysis architecture. MoveCalibrate ports ZENith's feature extraction pipeline to client-side TypeScript.
- **[Meridian Labs](https://meridianlabs.us)** -- Source of the adaptive engine algorithms: confidence calibration 4-outcome model, 6-tier mastery with spaced repetition, 60/30/10 session selection, and compensation tracking (adapted from misconception detection). 21 production apps, 33,750+ items.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
