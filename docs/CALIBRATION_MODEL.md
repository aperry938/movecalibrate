# The Movement Calibration Gap: Theory and Implementation

This document explains the conceptual foundation of MoveCalibrate's novel contribution: applying metacognitive calibration metrics from learning science to proprioceptive awareness in movement rehabilitation.

---

## From Knowledge Calibration to Movement Calibration

### The Knowledge Calibration Gap (Meridian Labs)

In adaptive learning systems, the gap between a learner's *perceived* knowledge and their *actual* knowledge is a well-established metacognitive signal. The Meridian Labs adaptive learning platform operationalizes this through a 2x2 confidence-correctness matrix:

```
                    Answer Correct     Answer Incorrect
                   ┌─────────────────┬─────────────────┐
Confident          │  CC (+3 pts)    │  CI (-5 pts)    │
                   │  Well-calibrated│  Miscalibrated  │
                   │  mastery        │  critical gap   │
                   ├─────────────────┼─────────────────┤
Unsure             │  UC (-1 pt)     │  UI (-2 pts)    │
                   │  Underconfident │  Appropriate     │
                   │  — knows more   │  uncertainty     │
                   │  than they think│                  │
                   └─────────────────┴─────────────────┘
```

This model reveals that accuracy alone is insufficient. Two students who both answer 70% of questions correctly may have fundamentally different metacognitive profiles: one is well-calibrated (knows what they know), while the other is overconfident on items they get wrong and underconfident on items they get right.

### The Movement Calibration Gap (MoveCalibrate)

MoveCalibrate transfers this insight to movement rehabilitation by replacing "answer correct/incorrect" with "movement quality above/below threshold" and "confidence in knowledge" with "confidence in movement quality":

```
                    Quality >= 70      Quality < 70
                   ┌─────────────────┬─────────────────┐
Confident          │  CC (+3 pts)    │  CI (-5 pts)    │
("I'm doing       │  Well-calibrated│  Proprioceptive │
 this right")     │  proprioception │  miscalibration  │
                   ├─────────────────┼─────────────────┤
Unsure             │  UC (-1 pt)     │  UI (-2 pts)    │
("I'm not sure    │  Movement       │  Appropriate     │
 about my form")  │  anxiety        │  caution         │
                   └─────────────────┴─────────────────┘
```

The **Movement Calibration Gap** is the signed difference between self-assessed confidence and measured movement quality:

```
calibrationGap = confidenceValue - qualityValue

where:
  confidenceValue = 0.8 (confident) or 0.3 (unsure)
  qualityValue = qualityScore / 100
```

Positive values indicate overconfidence (patient thinks they are performing better than they are). Negative values indicate underconfidence (patient is performing better than they believe).

---

## The Four Clinical Outcomes

### CC: Confident + Correct (Well-Calibrated Proprioception)

**Points:** +3 (highest reward)

The patient believes they are performing the movement correctly, and they are. This indicates accurate proprioceptive awareness -- the patient can feel when their movement quality is good. This is the target state for rehabilitation: the patient has internalized correct movement patterns and knows it.

**Therapeutic implication:** Safe to progress. The patient's internal model matches external reality.

### UC: Unsure + Correct (Movement Anxiety)

**Points:** -1 (mild penalty)

The patient is performing correctly but does not trust their own proprioception. This is common in:
- Early rehabilitation when patients have been told their movement patterns are "wrong"
- Post-surgical patients who fear re-injury
- Patients with chronic pain who have learned to distrust body signals

**Therapeutic implication:** The movement itself does not need correction -- the patient's confidence does. Positive reinforcement and explicit feedback that their form is good can help rebuild proprioceptive trust. Persistent UC patterns may indicate psychological barriers to recovery that warrant discussion with the treating clinician.

### UI: Unsure + Incorrect (Appropriate Caution)

**Points:** -2 (moderate penalty)

The patient is not performing well and knows it. This is actually the second-best metacognitive state: the patient's proprioceptive awareness is functioning correctly even though their movement execution is not yet adequate.

**Therapeutic implication:** Standard rehabilitation progression. The patient needs more practice but their self-awareness is intact. Provide specific correction cues based on the detected deviations.

### CI: Confident + Incorrect (Proprioceptive Miscalibration)

**Points:** -5 (harshest penalty)

The patient believes they are performing correctly, but they are not. This is the most dangerous state because:

1. **Injury risk:** The patient cannot feel that they are compensating, so they will not self-correct.
2. **Compensation entrenchment:** Without awareness that a compensation pattern exists, the patient practices and reinforces faulty movement patterns.
3. **False recovery signals:** The patient reports feeling "fine" while actually degrading their movement quality.

**Therapeutic implication:** This requires immediate intervention. The system flags CI outcomes with compensation detection to identify exactly *what* the patient is doing wrong, and the 3-consecutive-correct resolution protocol ensures the compensation is actively addressed before the exercise can progress in mastery.

---

## Asymmetric Scoring Rationale

The point values are deliberately asymmetric:

| Outcome | Points | Rationale |
|---------|--------|-----------|
| CC | +3 | Correct movement + correct awareness = full reward |
| UC | -1 | Correct movement mitigates the confidence issue |
| UI | -2 | Incorrect movement, but awareness prevents harm |
| CI | -5 | Incorrect movement + no awareness = highest risk |

The magnitude gap between CC (+3) and CI (-5) reflects the clinical reality that one confident-incorrect repetition can entrench a compensation pattern that takes many correct repetitions to resolve. In Meridian Labs' knowledge domain, a CI (confident wrong answer) reveals a misconception that is actively harmful -- the learner will confidently apply incorrect knowledge. In rehabilitation, the analog is a compensation pattern the patient cannot feel.

---

## Time-Weighted Calibration Score

Raw calibration outcomes are aggregated into a single 0-100 calibration score using exponential time decay:

```
decayFactor = 0.5 ^ (daysSinceEntry / halfLife)
calibrationScore = sum(points * decay) / sum(maxPoints * decay) * 100
```

**Half-life:** 14 days. This means a session from 2 weeks ago contributes half as much as today's session, and a session from 4 weeks ago contributes only 25%.

**Minimum entries:** 5. Until the patient has completed at least 5 calibrated repetitions, the score returns 50 (neutral) to avoid unstable estimates from small samples.

**Purpose:** This feeds into the Recovery Readiness composite as the "calibration accuracy" component (20% weight). A patient who consistently moves correctly but underconfidently (many UC outcomes) will have a lower calibration score than one who is well-calibrated (many CC outcomes), even if their movement quality is identical.

---

## Interaction with Other Systems

### Mastery Engine

The 4-outcome model drives mastery progression with its own delta table:

| Outcome | Mastery Delta | Rationale |
|---------|--------------|-----------|
| CC | +1 | Progress: good form, good awareness |
| UC | +1 | Progress: form is correct regardless of confidence |
| UI | -2 | Regress: form needs work |
| CI | -3 | Harsh regress: form is wrong and patient does not know it |

Note that mastery treats UC the same as CC (+1) because the movement itself is correct. The confidence issue is tracked through the calibration score, not the mastery level. This separation means mastery reflects movement competence while calibration reflects proprioceptive awareness -- two orthogonal dimensions of rehabilitation progress.

### Compensation Detection

CI outcomes trigger compensation flag creation when compensatory movement patterns are simultaneously detected. The causal chain:

1. Patient rates "confident"
2. Quality score < 70 (incorrect movement)
3. `checkCompensations()` detects pattern (e.g., trunk lean during shoulder flexion)
4. Outcome = CI
5. Compensation flag created/incremented for the detected pattern
6. Flag requires 3 consecutive correct repetitions to resolve
7. Unresolved flags get 4x priority in session selection

This means CI + compensation creates a self-reinforcing correction loop: the exercise is surfaced more frequently until the patient can perform it correctly for 3 consecutive reps.

### Recovery Readiness

The calibration score contributes 20% to the composite Recovery Readiness score. This means a patient cannot reach high readiness through movement quality alone -- they must also demonstrate accurate proprioceptive self-assessment.

### Session Selection

Calibration outcomes affect session selection indirectly through mastery levels (CI drops mastery by 3, making the exercise more likely to appear in the Weak pool) and compensation flags (unresolved flags apply a 4x priority multiplier in weighted selection).

---

## Relationship to Knowledge Calibration Literature

The Movement Calibration Gap draws on established research in metacognition and calibration:

- **Dunning-Kruger effect:** Low-competence individuals tend to overestimate their ability. In movement rehabilitation, this maps to CI outcomes where patients with poor proprioception cannot detect their own compensation patterns.
- **Hard-easy effect (Lichtenstein et al., 1982):** Confidence calibration is poorer on difficult items. MoveCalibrate tests this by comparing calibration accuracy across difficulty levels within the same exercise.
- **Desirable difficulties (Bjork, 1994):** The system deliberately surfaces exercises where the patient is miscalibrated (CI outcomes), creating productive struggle that builds accurate proprioceptive awareness.

The novelty is in the *domain transfer*: applying metacognitive calibration metrics, well-studied in knowledge assessment, to proprioceptive awareness in movement rehabilitation -- a domain where the gap between "what you think you are doing" and "what you are actually doing" has direct physical consequences.
