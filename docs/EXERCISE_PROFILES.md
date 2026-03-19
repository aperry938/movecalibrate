# Exercise Profiles: Clinical Rationale and Biomechanical Justification

This document provides the clinical reasoning behind each of MoveCalibrate's 7 rehabilitation exercises, including target populations, biomechanical features used for assessment, compensation patterns detected, and the rationale for progressive difficulty levels.

---

## Exercise Selection Criteria

The 7 exercises were selected to satisfy four requirements:

1. **Domain coverage.** At least 2 exercises per movement category (upper body, lower body, balance) to enable cross-domain calibration comparison.
2. **Pose estimation feasibility.** Each exercise must be assessable from a single forward-facing webcam using 2D projected landmarks. Exercises requiring sagittal-plane-only assessment (e.g., side-lying hip abduction) or fine motor control (e.g., finger dexterity) are excluded.
3. **Common compensation patterns.** Each exercise must have at least one well-documented compensatory movement pattern that can be detected from biomechanical features. This is essential for the CI (confident-incorrect) pathway.
4. **Progressive difficulty.** Each exercise must support meaningful progression through 4 difficulty levels without changing the fundamental movement pattern. This enables the mastery system to track improvement within an exercise.

---

## Exercise 1: Standing Shoulder Flexion

**Category:** Upper Body
**ID:** `SHOULDER_FLEXION`

### Clinical Context

Forward arm raise is a foundational assessment of shoulder mobility and motor control. It is one of the first active range-of-motion exercises prescribed after rotator cuff repair, frozen shoulder mobilization, and post-stroke upper extremity rehabilitation.

### Target Populations

- Post-surgical shoulder (rotator cuff, labral repair, arthroplasty)
- Adhesive capsulitis (frozen shoulder) in the mobilization phase
- Post-stroke upper extremity rehabilitation
- Cervical radiculopathy with deltoid weakness

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| L/R Shoulder Flexion | 0, 1 | Primary: measures the target movement angle |
| Trunk Forward Lean | 15 | Compensation monitor: detects trunk extension substitution |

### Difficulty Progression

| Level | Target Angle | Ideal Range (normalized) | Hold Duration |
|-------|-------------|------------------------|---------------|
| 1 | 45 degrees | 0.20 -- 0.30 | 5 seconds |
| 2 | 90 degrees | 0.45 -- 0.55 | 5 seconds |
| 3 | 135 degrees | 0.70 -- 0.80 | 5 seconds |
| 4 | 180 degrees (full overhead) | 0.90 -- 1.00 | 5 seconds |

**Rationale:** The 45-degree increments match standard clinical ROM assessment landmarks. Level 4 (full overhead) is only achievable with full shoulder flexion ROM and adequate scapulohumeral rhythm.

### Compensation Pattern: Trunk Lean

**Detection:** Trunk forward lean > 0.10 (normalized)

**Clinical significance:** When shoulder flexion ROM is limited (due to pain, stiffness, or weakness), patients instinctively extend the trunk backward to raise the arm higher without actually increasing glenohumeral flexion. This is one of the most common compensations in shoulder rehabilitation and, if uncorrected, can lead to lumbar spine hyperextension and false ROM measurements.

---

## Exercise 2: Standing Shoulder Abduction

**Category:** Upper Body
**ID:** `SHOULDER_ABDUCTION`

### Clinical Context

Lateral arm raise assesses the supraspinatus (0-30 degrees initiation), middle deltoid (30-90 degrees), and upper trapezius/serratus anterior (>90 degrees for scapular rotation). The movement is clinically informative because it loads the subacromial space, making it sensitive to impingement pathology.

### Target Populations

- Subacromial impingement syndrome
- Rotator cuff tendinopathy
- Post-surgical shoulder (lateral approach)
- Scapular dyskinesis rehabilitation

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| L/R Shoulder Abduction | 2, 3 | Primary: measures lateral arm elevation |
| Spinal Lateral Flexion | 14 | Compensation monitor: detects lateral trunk lean |

### Difficulty Progression

| Level | Target Angle | Ideal Range | Hold Duration |
|-------|-------------|-------------|---------------|
| 1 | 45 degrees | 0.20 -- 0.30 | 5 seconds |
| 2 | 90 degrees | 0.45 -- 0.55 | 5 seconds |
| 3 | 135 degrees | 0.70 -- 0.80 | 5 seconds |
| 4 | 180 degrees | 0.90 -- 1.00 | 5 seconds |

### Compensation Patterns

**Lateral trunk lean** (Spinal lateral flexion > 0.10): Patient leans the trunk away from the raising arm to use momentum or gravity assistance. Common when deltoid or supraspinatus strength is insufficient for the target angle.

**Shoulder hiking** (Shoulder-hip offset > 0.15): Patient elevates the entire shoulder girdle (upper trapezius substitution) rather than producing true glenohumeral abduction. This is particularly common in subacromial impingement because it changes the subacromial space geometry. Detected via the shoulder-hip vertical alignment offset feature.

---

## Exercise 3: Standing Hamstring Curl

**Category:** Lower Body
**ID:** `KNEE_FLEXION`

### Clinical Context

Standing hamstring curl isolates knee flexion while challenging single-leg balance. It assesses hamstring strength and motor control, which are critical for gait (swing phase) and deceleration (running). The standing position adds a proprioceptive challenge absent from prone or seated hamstring exercises.

### Target Populations

- ACL reconstruction rehabilitation (hamstring graft or post-surgery strengthening)
- Hamstring strain recovery
- Total knee arthroplasty (flexion ROM restoration)
- Gait rehabilitation (swing phase training)

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| L/R Knee Flexion | 10, 11 | Primary: measures target movement |
| L/R Hip Flexion | 6, 7 | Compensation monitor: detects hip substitution |

### Difficulty Progression

| Level | Target Angle | Ideal Range | Hold Duration |
|-------|-------------|-------------|---------------|
| 1 | 45 degrees | 0.20 -- 0.35 | 3 seconds |
| 2 | 90 degrees | 0.45 -- 0.60 | 3 seconds |
| 3 | 120 degrees | 0.65 -- 0.80 | 5 seconds |
| 4 | 135 degrees (full curl) | 0.80 -- 0.95 | 5 seconds |

**Rationale:** Hold duration increases at levels 3-4 because deeper knee flexion requires more eccentric control to maintain. The wider ideal ranges (0.15 units vs 0.10 for shoulder exercises) account for greater variability in standing knee flexion due to balance demands.

### Compensation Patterns

**Hip flexion compensation** (L or R hip flexion > 0.12): Patient flexes the hip forward to bring the heel closer to the buttock without achieving full knee flexion. This substitution is common when hamstring weakness limits active knee flexion ROM. Detected bilaterally to cover both limbs.

**Trunk forward lean** (Trunk forward lean > 0.10): Patient leans the trunk forward to shift the center of mass and reduce the hamstring demand. Often co-occurs with hip flexion compensation.

---

## Exercise 4: Mini Squat

**Category:** Lower Body
**ID:** `MINI_SQUAT`

### Clinical Context

The bilateral squat is the most functionally relevant lower-extremity exercise in rehabilitation, required for sit-to-stand transfers, stair negotiation, and lower-body strengthening. The mini squat (controlled depth) allows progressive loading through increasing depth while monitoring trunk control, symmetry, and frontal-plane knee alignment.

### Target Populations

- Total knee/hip arthroplasty rehabilitation
- Patellofemoral pain syndrome
- ACL reconstruction (bilateral loading phase)
- Geriatric fall prevention
- General lower-extremity deconditioning

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| L/R Knee Flexion | 10, 11 | Primary: measures squat depth |
| Knee Symmetry | 25 | Symmetry monitor: detects unilateral offloading |
| Trunk Forward Lean | 15 | Compensation monitor: detects excessive forward lean |
| Weight Distribution | 29 | Balance monitor: detects lateral weight shift |

### Difficulty Progression

| Level | Target | Knee Range | Trunk Lean Max | Hold |
|-------|--------|-----------|----------------|------|
| 1 | Quarter squat (30 deg) | 0.15 -- 0.25 | 0.08 | 3s |
| 2 | Half squat (60 deg) | 0.30 -- 0.45 | 0.10 | 5s |
| 3 | Deep squat (90 deg) | 0.50 -- 0.65 | 0.15 | 5s |
| 4 | Full squat (120 deg) | 0.65 -- 0.80 | 0.18 | 5s |

**Rationale:** The trunk lean threshold increases with depth because deeper squats biomechanically require more forward trunk inclination to maintain the center of mass over the base of support. Level 1 allows minimal lean (0.08) because a quarter squat should be achievable without trunk compensation.

### Compensation Patterns

**Excessive trunk lean** (Trunk forward lean > 0.20): Forward trunk lean beyond the depth-appropriate threshold indicates ankle dorsiflexion limitation, hip flexor tightness, or quadriceps weakness (using trunk momentum to initiate the movement).

**Asymmetric loading** (Knee symmetry < 0.75 AND weight distribution > 0.65): Two simultaneous conditions must be met (AND gate), detecting patients who shift weight to the stronger leg. Common after unilateral knee surgery or in chronic knee osteoarthritis.

**Valgus collapse** (L hip abduction < 0.10): Medial collapse of the knee during squatting indicates weak hip abductors (gluteus medius) and is a known risk factor for ACL injury and patellofemoral pain. Currently detected via hip abduction angle as a proxy for knee valgus.

---

## Exercise 5: Tandem Stance

**Category:** Balance
**ID:** `TANDEM_STANCE`

### Clinical Context

Tandem stance (heel-to-toe standing) is a standard clinical balance assessment tool used in the Romberg test, Berg Balance Scale, and Tinetti Performance-Oriented Mobility Assessment. It narrows the base of support in the anterior-posterior direction, challenging mediolateral balance control. It is sensitive to vestibular, proprioceptive, and cerebellar dysfunction.

### Target Populations

- Vestibular rehabilitation
- Peripheral neuropathy (balance training)
- Geriatric fall prevention
- Post-concussion balance rehabilitation
- Cerebellar ataxia assessment

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| CoM-Base Displacement | 20 | Primary: center of mass control |
| Landmark Velocity Variance | 26 | Stability: postural steadiness |
| Weight Distribution | 29 | Balance: anterior-posterior loading |
| Stance Width Ratio | 18 | Compliance: verifies narrow stance |

### Difficulty Progression

| Level | Target | CoM Max | Velocity Max | Hold |
|-------|--------|---------|-------------|------|
| 1 | Wide tandem, 10s | 0.15 | 0.15 | 10s |
| 2 | Narrow tandem, 15s | 0.12 | 0.12 | 15s |
| 3 | Heel-to-toe, 20s | 0.10 | 0.10 | 20s |
| 4 | Heel-to-toe eyes closed, 15s | 0.12 | 0.15 | 15s |

**Rationale:** Level 4 reduces hold duration (20s -> 15s) but adds eyes-closed condition, which removes visual vestibular input and dramatically increases difficulty. The CoM and velocity thresholds are relaxed slightly for level 4 because some increase in sway is expected without visual feedback.

### Compensation Patterns

**Excessive sway** (CoM-base displacement > 0.20): Large center-of-mass excursions indicate poor balance control. Distinguished from normal postural sway by the threshold magnitude.

**Wide stance cheat** (Stance width ratio > 0.30): Patient widens the stance beyond the tandem position to gain additional mediolateral stability. This defeats the purpose of the exercise and is detectable because the stance width ratio should be near zero for true heel-to-toe positioning.

**Rapid corrections** (Landmark velocity variance > 0.25): High-frequency postural adjustments (ankle strategy corrections) indicate the patient is at the edge of their balance capacity. While some corrections are normal, excessive correction frequency suggests the difficulty level may be too high.

---

## Exercise 6: Single Leg Stance

**Category:** Balance
**ID:** `SINGLE_LEG_STANCE`

### Clinical Context

Single-leg stance is the most clinically validated unilateral balance assessment. Normative data exists across age groups, and reduced single-leg stance time is a strong predictor of fall risk in older adults. The exercise challenges hip abductor strength (pelvic stability), ankle proprioception, and vestibular function simultaneously.

### Target Populations

- Hip arthroplasty rehabilitation (abductor strengthening)
- Ankle sprain rehabilitation (proprioceptive training)
- Geriatric fall risk reduction
- ACL reconstruction (single-leg stability phase)
- Lower extremity fracture rehabilitation (weight-bearing progression)

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| CoM-Base Displacement | 20 | Primary: center of mass control |
| Landmark Velocity Variance | 26 | Stability: postural steadiness |
| Hip Symmetry | 24 | Pelvic stability: Trendelenburg detection |
| CoM Oscillation | 27 | Balance: sway amplitude |

### Difficulty Progression

| Level | Target | CoM Max | Hip Sym Min | Hold |
|-------|--------|---------|------------|------|
| 1 | Single leg, 10s (support nearby) | 0.18 | 0.80 | 10s |
| 2 | Single leg, 20s | 0.15 | 0.85 | 20s |
| 3 | Single leg, 30s | 0.12 | 0.88 | 30s |
| 4 | Single leg eyes closed, 15s | 0.15 | 0.82 | 15s |

### Compensation Patterns

**Trendelenburg sign** (Hip symmetry < 0.70): Dropping of the pelvis on the unsupported side, indicating weakness of the hip abductors (gluteus medius/minimus) on the stance leg. This is a well-established clinical sign with direct diagnostic implications. A positive Trendelenburg during single-leg stance is a red flag for hip abductor insufficiency.

**Excessive trunk sway** (CoM oscillation > 0.25): Large oscillatory trunk movements used to counterbalance poor single-leg stability. This strategy redistributes the center of mass but does not address the underlying balance deficit.

**Rapid corrections** (Landmark velocity variance > 0.28): High-frequency adjustments indicating the patient is working at the limit of their balance capacity.

---

## Exercise 7: Heel Raise

**Category:** Lower Body
**ID:** `HEEL_RAISE`

### Clinical Context

Heel raises assess and train gastrocnemius-soleus complex strength and ankle plantarflexion control. Calf strength is critical for gait propulsion (push-off phase), stair climbing, and balance recovery stepping strategies. The bilateral-to-unilateral progression is standard in Achilles tendon and ankle rehabilitation protocols.

### Target Populations

- Achilles tendon repair rehabilitation (Alfredson protocol progression)
- Ankle fracture post-immobilization strengthening
- Plantar fasciitis rehabilitation
- Peripheral arterial disease (claudication exercise)
- Geriatric mobility preservation

### Critical Biomechanical Features

| Feature | Index | Role |
|---------|-------|------|
| L/R Ankle Dorsiflexion | 12, 13 | Primary: measures plantarflexion height |
| Knee Symmetry | 25 | Symmetry: detects unilateral offloading |
| CoM Oscillation | 27 | Stability: wobble at top of raise |

### Difficulty Progression

| Level | Target | Ankle Range | Knee Sym Min | Hold |
|-------|--------|-----------|-------------|------|
| 1 | Bilateral, partial height | 0.30 -- 0.50 | 0.85 | 3s |
| 2 | Bilateral, full height | 0.60 -- 0.85 | 0.85 | 5s |
| 3 | Unilateral, partial height | 0.35 -- 0.55 | 0.70 | 3s |
| 4 | Unilateral, full height | 0.65 -- 0.90 | 0.65 | 5s |

**Rationale:** The knee symmetry threshold drops for unilateral levels (0.85 -> 0.70 -> 0.65) because single-leg heel raises inherently produce some asymmetry. The ankle dorsiflexion ranges use the inverse: higher dorsiflexion feature values correspond to greater plantarflexion (the knee-ankle-foot angle changes as the heel lifts).

### Compensation Patterns

**Asymmetric push-off** (Knee symmetry < 0.60): During bilateral raises, one side does significantly more work. This is common when one calf is weaker (post-injury) and the patient unconsciously shifts load to the stronger side.

**Excessive wobble** (CoM oscillation > 0.25): Large oscillatory movements at the top of the raise indicate poor calf endurance or proprioceptive control. The narrow base of support at full plantarflexion makes this position inherently unstable, so some oscillation is expected -- but excessive wobble suggests the difficulty level exceeds current capacity.

**Knee hyperextension** (L knee flexion < 0.02): Locking the knees into hyperextension during the raise. This shifts load from the calf musculature to the passive joint structures and is both a compensation for calf weakness and a risk factor for posterior knee capsule stress.

---

## Cross-Exercise Calibration Analysis

A key research question MoveCalibrate enables is whether patients are consistently calibrated across exercise domains or show domain-specific calibration patterns. For example:

- A patient may be well-calibrated (CC) on upper-body exercises but overconfident (CI) on balance exercises, suggesting they accurately perceive shoulder position but poorly perceive postural sway.
- A patient may show movement anxiety (UC) specifically on exercises similar to the movement that caused their injury, while being well-calibrated on unrelated exercises.

This cross-domain calibration analysis parallels Meridian Labs' finding that learners show domain-specific misconception concentrations -- they may be well-calibrated in one subject area but systematically overconfident in another. The 60/30/10 session selection algorithm ensures exercises from all categories appear in each session, enabling this cross-domain comparison.
