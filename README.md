# MoveCalibrate

**Adaptive Movement Rehabilitation with Confidence Calibration**

[![Deploy](https://github.com/aperry938/movecalibrate/actions/workflows/deploy.yml/badge.svg)](https://github.com/aperry938/movecalibrate/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A client-side adaptive rehabilitation system that introduces the **Movement Calibration Gap** -- a novel metric quantifying the mismatch between patient self-assessed movement confidence and AI-measured movement quality via real-time pose estimation. Privacy-preserving by architecture: zero server, zero network, all data stays on-device.

**[Live Demo](https://aperry938.github.io/movecalibrate/)** | **[Architecture](docs/ARCHITECTURE.md)** | **[Calibration Model](docs/CALIBRATION_MODEL.md)** | **[Exercise Profiles](docs/EXERCISE_PROFILES.md)**

---

## The Movement Calibration Gap

In knowledge assessment, the gap between what a learner *thinks* they know and what they *actually* know reveals critical metacognitive information. MoveCalibrate applies this to rehabilitation: the gap between a patient's *perceived* movement quality and their *measured* movement quality exposes proprioceptive miscalibration that standard movement metrics alone cannot capture.

The system uses a 2x2 confidence-correctness matrix producing four clinically distinct outcomes:

| | Correct Movement | Incorrect Movement |
|---|---|---|
| **Confident** | **CC** (+3) Well-calibrated proprioception | **CI** (-5) Proprioceptive miscalibration -- dangerous |
| **Unsure** | **UC** (-1) Movement anxiety / kinesiophobia | **UI** (-2) Appropriate caution |

A patient who moves incorrectly but rates themselves as "confident" (CI) has a proprioceptive deficit that risks re-injury through compensatory patterns they cannot feel. A patient who moves correctly but rates themselves as "unsure" (UC) may have kinesiophobia that inhibits rehabilitation adherence. Each quadrant requires a different clinical response.

**Theoretical grounding:** The 4-outcome model draws on metacognitive calibration research (Dunning & Kruger, 1999; Lichtenstein et al., 1982), proprioceptive awareness literature (Proske & Gandevia, 2012), kinesiophobia frameworks (Vlaeyen & Linton, 2000; Tampa Scale), and motor learning error entrenchment (Schmidt & Lee, 2020).

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      Browser (React 19 + Vite)                          │
│                                                                         │
│  ┌──────────┐    ┌────────────────────────────────────────────────────┐ │
│  │  Camera   │    │              Core Engine Layer                     │ │
│  │getUserMedia│   │                                                    │ │
│  └────┬─────┘    │  ┌────────────┐    ┌──────────────────────────┐   │ │
│       │          │  │ MediaPipe   │    │ Biomechanical Feature    │   │ │
│       ▼          │  │ WASM Pose   │───►│ Extraction (30 dim)      │   │ │
│  Video Frames    │  │ Landmarker  │    │ Float64Array(30)         │   │ │
│  @ 30fps         │  │ (33 lm × 4)│    └───────────┬──────────────┘   │ │
│       │          │  └────────────┘                │                   │ │
│       └─────────►│                                 │                   │ │
│                  │  ┌────────────────┐    ┌────────▼────────────────┐ │ │
│                  │  │ Confidence     │    │ Quality Scoring         │ │ │
│                  │  │ Input (patient │    │ (per-feature distance   │ │ │
│                  │  │ self-assess.)  │    │  from ideal ranges)     │ │ │
│                  │  └──────┬─────────┘    └────────┬───────────────┘ │ │
│                  │         │                       │                  │ │
│                  │  ┌──────▼───────────────────────▼───────────────┐ │ │
│                  │  │        4-Outcome Calibration Engine           │ │ │
│                  │  │ CC (Confident+Correct)  UC (Unsure+Correct)  │ │ │
│                  │  │ UI (Unsure+Incorrect)   CI (Conf.+Incorrect) │ │ │
│                  │  └──────────────────┬──────────────────────────┘  │ │
│                  │                     │                              │ │
│                  │  ┌──────────────────▼──────────────────────────┐  │ │
│                  │  │          Adaptive Engine                     │  │ │
│                  │  │  ┌─────────┐ ┌──────────┐ ┌────────────┐   │  │ │
│                  │  │  │ Mastery │ │  Spaced   │ │  Session   │   │  │ │
│                  │  │  │ 6-Tier  │ │Repetition │ │  Selector  │   │  │ │
│                  │  │  │ System  │ │ Scheduler │ │  60/30/10  │   │  │ │
│                  │  │  └─────────┘ └──────────┘ └────────────┘   │  │ │
│                  │  └────────────────────────────────────────────┘   │ │
│                  │                                                    │ │
│                  │  ┌────────────────────────────────────────────┐   │ │
│                  │  │ Compensation Detection + Recovery Readiness│   │ │
│                  │  │ (3-consecutive resolution, 4-factor score) │   │ │
│                  │  └────────────────────────────────────────────┘   │ │
│                  └────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   localStorage (mc_* keys)                        │  │
│  │ exerciseProgress │ compensationLog │ calibrationHistory │ sessions│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                            ↑
                  Zero server. Zero network.
                  All data stays on-device.
```

---

## Exercises

| # | Exercise | Category | Compensations Detected |
|---|----------|----------|----------------------|
| 1 | Standing Shoulder Flexion | Upper | Trunk lean |
| 2 | Standing Shoulder Abduction | Upper | Lateral trunk lean, shoulder hiking |
| 3 | Standing Hamstring Curl | Lower | Hip flexion compensation, trunk forward lean |
| 4 | Mini Squat | Lower | Excessive trunk lean, asymmetric loading, valgus collapse |
| 5 | Tandem Stance | Balance | Excessive sway, wide stance cheat, rapid corrections |
| 6 | Single Leg Stance | Balance | Trendelenburg sign, excessive trunk sway |
| 7 | Heel Raise | Lower | Asymmetric push-off, excessive wobble, knee hyperextension |

Each exercise has **4 progressive difficulty levels** with exercise-specific ideal biomechanical ranges, hold durations, and compensation detection rules. See [Exercise Profiles](docs/EXERCISE_PROFILES.md) for clinical rationale, target populations, and biomechanical details.

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

## Key Algorithms

### Confidence Calibration: 4-Outcome Model

The 2x2 matrix of {confident, unsure} x {correct, incorrect} produces four calibration outcomes with asymmetric point values: CC (+3), UC (-1), UI (-2), CI (-5). The CI penalty is harshest because confident-incorrect movement represents dangerous proprioceptive miscalibration that actively reinforces pathological patterns.

### Mastery System: 6-Tier with Spaced Repetition

Six levels (New, Learning, Familiar, Comfortable, Proficient, Mastered) with spaced repetition intervals [0, 1, 3, 7, 14, 30] days. Mastery advances on correct outcomes (CC/UC: +1) and regresses on incorrect outcomes (UI: -2, CI: -3).

### Session Selection: 60/30/10 Rule

Each session draws from three pools: **Weak** (60%) for exercises below mastery level 2 or with unresolved compensations, **New** (30%) for unattempted exercise-difficulty combinations, and **Review** (10%) for mastered exercises. Compensation flags apply 4x (unresolved) or 2x (resolved) priority multipliers.

### Recovery Readiness: 4-Factor Composite

A weighted composite of movement quality (35%), exercise coverage (30%), calibration accuracy (20%), and session consistency (15%), capped at 99 -- the system never claims perfect readiness.

### Compensation Detection: 3-Consecutive Resolution

Compensation patterns (e.g., trunk lean, Trendelenburg sign, valgus collapse) are flagged via AND-gate rule matching and tracked until 3 consecutive correct repetitions resolve the flag. Resolved flags remain monitored at 2x priority to prevent regression.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Pose Estimation | [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (WASM, browser-side) |
| Quality Scoring | [TensorFlow.js](https://www.tensorflow.org/js) (VAE quality model) |
| Framework | [React 19](https://react.dev/) + [TypeScript 5.9](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Storage | localStorage (on-device only) |
| Deployment | GitHub Pages (via GitHub Actions) |
| Server | None -- fully client-side |

---

## Getting Started

```bash
git clone https://github.com/aperry938/movecalibrate.git
cd movecalibrate
npm install
npm run dev
```

Open `http://localhost:5173/movecalibrate/` in a browser with webcam access.

### Requirements

- Node.js 22+
- Modern browser with WebAssembly and `getUserMedia` support (Chrome, Edge, Firefox)
- Webcam

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

---

## Project Structure

```
movecalibrate/
├── src/
│   ├── core/                       # Engine layer (pure TypeScript, no React)
│   │   ├── types.ts                # Type definitions + FeatureIndex enum
│   │   ├── math.ts                 # Geometry primitives (ported from ZENith)
│   │   ├── biomechanics.ts         # 30-feature extraction from 33 landmarks
│   │   ├── exerciseProfiles.ts     # 7 exercises x 4 difficulty levels
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
│   │   ├── CameraView.tsx          # Webcam feed + skeleton overlay
│   │   ├── SessionDashboard.tsx    # Home screen + readiness gauge
│   │   ├── ExerciseGuide.tsx       # Exercise instructions
│   │   ├── ConfidenceInput.tsx     # Pre-rep confidence self-assessment
│   │   ├── MovementFeedback.tsx    # Live quality + deviation display
│   │   ├── CalibrationResult.tsx   # Post-rep calibration outcome
│   │   ├── CompensationAlert.tsx   # Compensation pattern warnings
│   │   ├── SessionReport.tsx       # End-of-session summary
│   │   └── PhysioReport.tsx        # Exportable physiotherapist report
│   │
│   ├── simulation/                 # Synthetic patient trajectory generation
│   │   ├── patientArchetypes.ts    # 3 archetypal patient profiles
│   │   └── generateTrajectories.ts # Seeded trajectory simulation engine
│   │
│   ├── storage/                    # localStorage persistence layer
│   │   ├── storageKeys.ts          # Centralized mc_* key registry
│   │   ├── storageManager.ts       # Safe read/write with quota handling
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
│   ├── ARCHITECTURE.md             # 3-layer system design
│   ├── CALIBRATION_MODEL.md        # Movement Calibration Gap theory
│   └── EXERCISE_PROFILES.md        # Clinical rationale per exercise
│
├── training/                       # VAE training pipeline
├── .github/workflows/deploy.yml    # GitHub Pages CI/CD
└── README.md
```

---

## Privacy Architecture

MoveCalibrate processes all data on-device. This is a deliberate architectural decision, not a limitation:

- **Video frames** are processed by MediaPipe WASM in the browser and never transmitted
- **Biomechanical features** are computed client-side and stored in localStorage
- **Session history, mastery records, and calibration data** persist in `mc_*` localStorage keys
- **No server, no API calls, no analytics, no telemetry**

This design eliminates HIPAA/Privacy Act concerns that typically block home-based rehabilitation monitoring tools, making the system deployable without institutional data governance approval.

---

## Research Context

MoveCalibrate is part of a pre-PhD research portfolio demonstrating the transfer of adaptive AI systems from education to movement rehabilitation.

### Provenance

The adaptive engine algorithms originate from [Meridian Labs](https://meridianlabs.us) -- a production platform of 25 exam preparation apps serving 55,000+ items across 4 professional domains. The 30-feature biomechanical extraction pipeline is ported from [ZENith](https://github.com/aperry938/zenith-mvp), a movement analysis research prototype.

### Publication Target

**OzCHI 2026** (Australasian Computer-Human Interaction Conference) or **JMIR Rehabilitation and Assistive Technologies**.

### Novel Contribution

The **Movement Calibration Gap** -- applying metacognitive confidence calibration from learning science to proprioceptive awareness in rehabilitation. This bridges Human-Computer Interaction, kinesiology, and adaptive systems research.

### Related Publications

- Perry, A.C. (2026). "Confidence-Calibrated Adaptive Learning: An Integrated Adaptive Engine for Professional Exam Preparation." *AIED 2026 Late Breaking Results.* [Zenodo](https://doi.org/10.5281/zenodo.18820462)
- Perry, A.C. (2026). "Cross-Domain Analysis of a Confidence-Calibrated Adaptive Learning Engine." *EDM 2026 Poster/Demo.* [Zenodo](https://doi.org/10.5281/zenodo.19024683)

---

## Disclaimer

This is a **research prototype** and is not a medical device. It does not provide medical advice, diagnosis, or treatment. Consult your healthcare provider before beginning any exercise program. Stop immediately if you experience pain or dizziness.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

**Anthony C. Perry** -- [github.com/aperry938](https://github.com/aperry938) | [meridianlabs.us](https://meridianlabs.us)
