/**
 * MoveCalibrate Exercise Profiles
 *
 * Defines the 7 rehabilitation exercises with progressive difficulty levels,
 * ideal biomechanical ranges, and compensation detection rules.
 *
 * Each exercise specifies:
 *   - Critical features: the biomechanical indices that define correct form
 *   - Difficulty levels: progressive targets with ideal ranges per feature
 *   - Compensation rules: multi-feature checks for common movement faults
 *
 * All feature references use FeatureIndex enum for type safety and
 * alignment with the 30-element BiomechanicalFeatures array.
 */

import type { ExerciseProfile } from './types';
import { FeatureIndex } from './types';

// ── Exercise Definitions ────────────────────────────────────────────────────

const SHOULDER_FLEXION: ExerciseProfile = {
  id: 'SHOULDER_FLEXION',
  name: 'Standing Shoulder Flexion',
  category: 'upper',
  description:
    'Raise one arm forward to target angle while maintaining upright posture',
  instructions:
    'Stand tall. Slowly raise your arm forward to the target height. Keep your trunk still.',
  criticalFeatures: [
    FeatureIndex.L_SHOULDER_FLEXION,
    FeatureIndex.R_SHOULDER_FLEXION,
    FeatureIndex.TRUNK_FORWARD_LEAN,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: '45 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_FLEXION]: [0.20, 0.30],
        [FeatureIndex.R_SHOULDER_FLEXION]: [0.20, 0.30],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.05],
      },
      holdDuration: 5,
    },
    {
      level: 2,
      target: '90 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_FLEXION]: [0.45, 0.55],
        [FeatureIndex.R_SHOULDER_FLEXION]: [0.45, 0.55],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.05],
      },
      holdDuration: 5,
    },
    {
      level: 3,
      target: '135 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_FLEXION]: [0.70, 0.80],
        [FeatureIndex.R_SHOULDER_FLEXION]: [0.70, 0.80],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.07],
      },
      holdDuration: 5,
    },
    {
      level: 4,
      target: '180 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_FLEXION]: [0.90, 1.00],
        [FeatureIndex.R_SHOULDER_FLEXION]: [0.90, 1.00],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.08],
      },
      holdDuration: 5,
    },
  ],
  compensationRules: [
    {
      name: 'Trunk lean',
      description: 'Leaning backward to lift arm higher',
      featureChecks: [
        {
          featureIndex: FeatureIndex.TRUNK_FORWARD_LEAN,
          condition: 'above',
          threshold: 0.10,
        },
      ],
    },
  ],
};

const SHOULDER_ABDUCTION: ExerciseProfile = {
  id: 'SHOULDER_ABDUCTION',
  name: 'Standing Shoulder Abduction',
  category: 'upper',
  description:
    'Raise one arm out to the side to target angle while keeping trunk vertical',
  instructions:
    'Stand tall with arms at your sides. Slowly raise your arm out to the side to the target height. Do not lean.',
  criticalFeatures: [
    FeatureIndex.L_SHOULDER_ABDUCTION,
    FeatureIndex.R_SHOULDER_ABDUCTION,
    FeatureIndex.SPINAL_LATERAL_FLEXION,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: '45 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_ABDUCTION]: [0.20, 0.30],
        [FeatureIndex.R_SHOULDER_ABDUCTION]: [0.20, 0.30],
        [FeatureIndex.SPINAL_LATERAL_FLEXION]: [0.0, 0.05],
      },
      holdDuration: 5,
    },
    {
      level: 2,
      target: '90 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_ABDUCTION]: [0.45, 0.55],
        [FeatureIndex.R_SHOULDER_ABDUCTION]: [0.45, 0.55],
        [FeatureIndex.SPINAL_LATERAL_FLEXION]: [0.0, 0.05],
      },
      holdDuration: 5,
    },
    {
      level: 3,
      target: '135 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_ABDUCTION]: [0.70, 0.80],
        [FeatureIndex.R_SHOULDER_ABDUCTION]: [0.70, 0.80],
        [FeatureIndex.SPINAL_LATERAL_FLEXION]: [0.0, 0.07],
      },
      holdDuration: 5,
    },
    {
      level: 4,
      target: '180 degrees',
      idealRanges: {
        [FeatureIndex.L_SHOULDER_ABDUCTION]: [0.90, 1.00],
        [FeatureIndex.R_SHOULDER_ABDUCTION]: [0.90, 1.00],
        [FeatureIndex.SPINAL_LATERAL_FLEXION]: [0.0, 0.08],
      },
      holdDuration: 5,
    },
  ],
  compensationRules: [
    {
      name: 'Lateral trunk lean',
      description: 'Leaning the trunk sideways to get the arm higher',
      featureChecks: [
        {
          featureIndex: FeatureIndex.SPINAL_LATERAL_FLEXION,
          condition: 'above',
          threshold: 0.10,
        },
      ],
    },
    {
      name: 'Shoulder hiking',
      description: 'Elevating the shoulder girdle instead of true abduction',
      featureChecks: [
        {
          featureIndex: FeatureIndex.SHOULDER_HIP_OFFSET,
          condition: 'above',
          threshold: 0.15,
        },
      ],
    },
  ],
};

const KNEE_FLEXION: ExerciseProfile = {
  id: 'KNEE_FLEXION',
  name: 'Standing Hamstring Curl',
  category: 'lower',
  description:
    'Bend one knee to bring heel toward buttock while standing on the other leg',
  instructions:
    'Stand on one leg, holding a support if needed. Slowly curl your heel toward your buttock. Keep your hip still.',
  criticalFeatures: [
    FeatureIndex.L_KNEE_FLEXION,
    FeatureIndex.R_KNEE_FLEXION,
    FeatureIndex.L_HIP_FLEXION,
    FeatureIndex.R_HIP_FLEXION,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: '45 degrees',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.20, 0.35],
        [FeatureIndex.R_KNEE_FLEXION]: [0.20, 0.35],
        [FeatureIndex.L_HIP_FLEXION]: [0.0, 0.05],
        [FeatureIndex.R_HIP_FLEXION]: [0.0, 0.05],
      },
      holdDuration: 3,
    },
    {
      level: 2,
      target: '90 degrees',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.45, 0.60],
        [FeatureIndex.R_KNEE_FLEXION]: [0.45, 0.60],
        [FeatureIndex.L_HIP_FLEXION]: [0.0, 0.07],
        [FeatureIndex.R_HIP_FLEXION]: [0.0, 0.07],
      },
      holdDuration: 3,
    },
    {
      level: 3,
      target: '120 degrees',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.65, 0.80],
        [FeatureIndex.R_KNEE_FLEXION]: [0.65, 0.80],
        [FeatureIndex.L_HIP_FLEXION]: [0.0, 0.08],
        [FeatureIndex.R_HIP_FLEXION]: [0.0, 0.08],
      },
      holdDuration: 5,
    },
    {
      level: 4,
      target: '135 degrees (full curl)',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.80, 0.95],
        [FeatureIndex.R_KNEE_FLEXION]: [0.80, 0.95],
        [FeatureIndex.L_HIP_FLEXION]: [0.0, 0.10],
        [FeatureIndex.R_HIP_FLEXION]: [0.0, 0.10],
      },
      holdDuration: 5,
    },
  ],
  compensationRules: [
    {
      name: 'L hip flexion compensation',
      description:
        'Flexing the left hip forward to bring the heel closer instead of using pure knee flexion',
      featureChecks: [
        {
          featureIndex: FeatureIndex.L_HIP_FLEXION,
          condition: 'above',
          threshold: 0.12,
        },
      ],
    },
    {
      name: 'R hip flexion compensation',
      description:
        'Flexing the right hip forward to bring the heel closer instead of using pure knee flexion',
      featureChecks: [
        {
          featureIndex: FeatureIndex.R_HIP_FLEXION,
          condition: 'above',
          threshold: 0.12,
        },
      ],
    },
    {
      name: 'Trunk forward lean',
      description:
        'Leaning the trunk forward to compensate for limited knee flexion',
      featureChecks: [
        {
          featureIndex: FeatureIndex.TRUNK_FORWARD_LEAN,
          condition: 'above',
          threshold: 0.10,
        },
      ],
    },
  ],
};

const MINI_SQUAT: ExerciseProfile = {
  id: 'MINI_SQUAT',
  name: 'Mini Squat',
  category: 'lower',
  description:
    'Bilateral squat to target depth with even weight distribution and upright trunk',
  instructions:
    'Stand with feet shoulder-width apart. Slowly bend both knees as if sitting back into a chair. Keep your weight even and trunk upright.',
  criticalFeatures: [
    FeatureIndex.L_KNEE_FLEXION,
    FeatureIndex.R_KNEE_FLEXION,
    FeatureIndex.KNEE_SYMMETRY,
    FeatureIndex.TRUNK_FORWARD_LEAN,
    FeatureIndex.WEIGHT_DISTRIBUTION,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: 'Quarter squat (30 degrees)',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.15, 0.25],
        [FeatureIndex.R_KNEE_FLEXION]: [0.15, 0.25],
        [FeatureIndex.KNEE_SYMMETRY]: [0.85, 1.0],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.08],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.15],
      },
      holdDuration: 3,
    },
    {
      level: 2,
      target: 'Half squat (60 degrees)',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.30, 0.45],
        [FeatureIndex.R_KNEE_FLEXION]: [0.30, 0.45],
        [FeatureIndex.KNEE_SYMMETRY]: [0.85, 1.0],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.10],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.15],
      },
      holdDuration: 5,
    },
    {
      level: 3,
      target: 'Deep squat (90 degrees)',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.50, 0.65],
        [FeatureIndex.R_KNEE_FLEXION]: [0.50, 0.65],
        [FeatureIndex.KNEE_SYMMETRY]: [0.80, 1.0],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.15],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.20],
      },
      holdDuration: 5,
    },
    {
      level: 4,
      target: 'Full squat (120 degrees)',
      idealRanges: {
        [FeatureIndex.L_KNEE_FLEXION]: [0.65, 0.80],
        [FeatureIndex.R_KNEE_FLEXION]: [0.65, 0.80],
        [FeatureIndex.KNEE_SYMMETRY]: [0.80, 1.0],
        [FeatureIndex.TRUNK_FORWARD_LEAN]: [0.0, 0.18],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.20],
      },
      holdDuration: 5,
    },
  ],
  compensationRules: [
    {
      name: 'Excessive trunk lean',
      description:
        'Leaning the trunk too far forward to compensate for limited ankle or hip mobility',
      featureChecks: [
        {
          featureIndex: FeatureIndex.TRUNK_FORWARD_LEAN,
          condition: 'above',
          threshold: 0.20,
        },
      ],
    },
    {
      name: 'Asymmetric loading',
      description:
        'Shifting weight to one side to avoid loading the weaker leg',
      featureChecks: [
        {
          featureIndex: FeatureIndex.KNEE_SYMMETRY,
          condition: 'below',
          threshold: 0.75,
        },
        {
          featureIndex: FeatureIndex.WEIGHT_DISTRIBUTION,
          condition: 'above',
          threshold: 0.65,
        },
      ],
    },
    {
      name: 'L valgus collapse',
      description:
        'Left knee caving inward during the squat, indicating weak left hip abductors',
      featureChecks: [
        {
          featureIndex: FeatureIndex.L_HIP_ABDUCTION,
          condition: 'below',
          threshold: 0.10,
        },
      ],
    },
    {
      name: 'R valgus collapse',
      description:
        'Right knee caving inward during the squat, indicating weak right hip abductors',
      featureChecks: [
        {
          featureIndex: FeatureIndex.R_HIP_ABDUCTION,
          condition: 'below',
          threshold: 0.10,
        },
      ],
    },
  ],
};

const TANDEM_STANCE: ExerciseProfile = {
  id: 'TANDEM_STANCE',
  name: 'Tandem Stance',
  category: 'balance',
  description:
    'Stand heel-to-toe in a straight line, maintaining balance for the target duration',
  instructions:
    'Place one foot directly in front of the other, heel touching toe. Hold this position as still as possible for the target time.',
  criticalFeatures: [
    FeatureIndex.COM_BASE_DISPLACEMENT,
    FeatureIndex.LANDMARK_VELOCITY_VAR,
    FeatureIndex.WEIGHT_DISTRIBUTION,
    FeatureIndex.STANCE_WIDTH_RATIO,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: 'Wide tandem, 10 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.15],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.15],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.20],
        [FeatureIndex.STANCE_WIDTH_RATIO]: [0.10, 0.25],
      },
      holdDuration: 10,
    },
    {
      level: 2,
      target: 'Narrow tandem, 15 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.12],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.12],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.15],
        [FeatureIndex.STANCE_WIDTH_RATIO]: [0.05, 0.15],
      },
      holdDuration: 15,
    },
    {
      level: 3,
      target: 'Heel-to-toe, 20 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.10],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.10],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.12],
        [FeatureIndex.STANCE_WIDTH_RATIO]: [0.0, 0.08],
      },
      holdDuration: 20,
    },
    {
      level: 4,
      target: 'Heel-to-toe eyes closed, 15 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.12],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.15],
        [FeatureIndex.WEIGHT_DISTRIBUTION]: [0.0, 0.15],
        [FeatureIndex.STANCE_WIDTH_RATIO]: [0.0, 0.08],
      },
      holdDuration: 15,
    },
  ],
  compensationRules: [
    {
      name: 'Excessive sway',
      description:
        'Large center-of-mass displacement indicating poor balance control',
      featureChecks: [
        {
          featureIndex: FeatureIndex.COM_BASE_DISPLACEMENT,
          condition: 'above',
          threshold: 0.20,
        },
      ],
    },
    {
      name: 'Wide stance cheat',
      description:
        'Widening the stance beyond tandem position for extra stability',
      featureChecks: [
        {
          featureIndex: FeatureIndex.STANCE_WIDTH_RATIO,
          condition: 'above',
          threshold: 0.30,
        },
      ],
    },
    {
      name: 'Rapid corrections',
      description:
        'High-frequency postural adjustments indicating balance difficulty',
      featureChecks: [
        {
          featureIndex: FeatureIndex.LANDMARK_VELOCITY_VAR,
          condition: 'above',
          threshold: 0.25,
        },
      ],
    },
  ],
};

const SINGLE_LEG_STANCE: ExerciseProfile = {
  id: 'SINGLE_LEG_STANCE',
  name: 'Single Leg Stance',
  category: 'balance',
  description:
    'Stand on one leg maintaining upright posture and level hips for the target duration',
  instructions:
    'Lift one foot off the ground and balance on the other leg. Keep your hips level and body upright. Hold as still as possible.',
  criticalFeatures: [
    FeatureIndex.COM_BASE_DISPLACEMENT,
    FeatureIndex.LANDMARK_VELOCITY_VAR,
    FeatureIndex.HIP_SYMMETRY,
    FeatureIndex.COM_OSCILLATION,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: 'Single leg, 10 seconds (with support nearby)',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.18],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.18],
        [FeatureIndex.HIP_SYMMETRY]: [0.80, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.15],
      },
      holdDuration: 10,
    },
    {
      level: 2,
      target: 'Single leg, 20 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.15],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.15],
        [FeatureIndex.HIP_SYMMETRY]: [0.85, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.12],
      },
      holdDuration: 20,
    },
    {
      level: 3,
      target: 'Single leg, 30 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.12],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.12],
        [FeatureIndex.HIP_SYMMETRY]: [0.88, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.10],
      },
      holdDuration: 30,
    },
    {
      level: 4,
      target: 'Single leg eyes closed, 15 seconds',
      idealRanges: {
        [FeatureIndex.COM_BASE_DISPLACEMENT]: [0.0, 0.15],
        [FeatureIndex.LANDMARK_VELOCITY_VAR]: [0.0, 0.18],
        [FeatureIndex.HIP_SYMMETRY]: [0.82, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.15],
      },
      holdDuration: 15,
    },
  ],
  compensationRules: [
    {
      name: 'Trendelenburg sign',
      description:
        'Dropping the pelvis on the unsupported side, indicating weak hip abductors on the stance leg',
      featureChecks: [
        {
          featureIndex: FeatureIndex.HIP_SYMMETRY,
          condition: 'below',
          threshold: 0.70,
        },
      ],
    },
    {
      name: 'Excessive trunk sway',
      description:
        'Large oscillatory trunk movements to maintain balance',
      featureChecks: [
        {
          featureIndex: FeatureIndex.COM_OSCILLATION,
          condition: 'above',
          threshold: 0.25,
        },
      ],
    },
    {
      name: 'Rapid corrections',
      description:
        'High-frequency postural adjustments indicating significant balance difficulty',
      featureChecks: [
        {
          featureIndex: FeatureIndex.LANDMARK_VELOCITY_VAR,
          condition: 'above',
          threshold: 0.28,
        },
      ],
    },
  ],
};

const HEEL_RAISE: ExerciseProfile = {
  id: 'HEEL_RAISE',
  name: 'Heel Raise',
  category: 'lower',
  description:
    'Rise up onto the balls of the feet, progressing from bilateral to unilateral',
  instructions:
    'Stand with feet hip-width apart. Slowly rise up onto your toes as high as you can, then lower back down with control.',
  criticalFeatures: [
    FeatureIndex.L_ANKLE_DORSIFLEXION,
    FeatureIndex.R_ANKLE_DORSIFLEXION,
    FeatureIndex.KNEE_SYMMETRY,
    FeatureIndex.COM_OSCILLATION,
  ],
  difficultyLevels: [
    {
      level: 1,
      target: 'Bilateral, partial height',
      idealRanges: {
        [FeatureIndex.L_ANKLE_DORSIFLEXION]: [0.30, 0.50],
        [FeatureIndex.R_ANKLE_DORSIFLEXION]: [0.30, 0.50],
        [FeatureIndex.KNEE_SYMMETRY]: [0.85, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.12],
      },
      holdDuration: 3,
    },
    {
      level: 2,
      target: 'Bilateral, full height',
      idealRanges: {
        [FeatureIndex.L_ANKLE_DORSIFLEXION]: [0.60, 0.85],
        [FeatureIndex.R_ANKLE_DORSIFLEXION]: [0.60, 0.85],
        [FeatureIndex.KNEE_SYMMETRY]: [0.85, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.10],
      },
      holdDuration: 5,
    },
    {
      level: 3,
      target: 'Unilateral, partial height',
      idealRanges: {
        [FeatureIndex.L_ANKLE_DORSIFLEXION]: [0.35, 0.55],
        [FeatureIndex.R_ANKLE_DORSIFLEXION]: [0.35, 0.55],
        [FeatureIndex.KNEE_SYMMETRY]: [0.70, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.18],
      },
      holdDuration: 3,
    },
    {
      level: 4,
      target: 'Unilateral, full height',
      idealRanges: {
        [FeatureIndex.L_ANKLE_DORSIFLEXION]: [0.65, 0.90],
        [FeatureIndex.R_ANKLE_DORSIFLEXION]: [0.65, 0.90],
        [FeatureIndex.KNEE_SYMMETRY]: [0.65, 1.0],
        [FeatureIndex.COM_OSCILLATION]: [0.0, 0.20],
      },
      holdDuration: 5,
    },
  ],
  compensationRules: [
    {
      name: 'Asymmetric push-off',
      description:
        'Pushing off more with one foot than the other during bilateral raises',
      featureChecks: [
        {
          featureIndex: FeatureIndex.KNEE_SYMMETRY,
          condition: 'below',
          threshold: 0.60,
        },
      ],
    },
    {
      name: 'Excessive wobble',
      description:
        'Large oscillatory movements at the top of the raise indicating poor calf control',
      featureChecks: [
        {
          featureIndex: FeatureIndex.COM_OSCILLATION,
          condition: 'above',
          threshold: 0.25,
        },
      ],
    },
    {
      name: 'L knee hyperextension',
      description:
        'Locking the left knee into hyperextension during the raise',
      featureChecks: [
        {
          featureIndex: FeatureIndex.L_KNEE_FLEXION,
          condition: 'below',
          threshold: 0.02,
        },
      ],
    },
    {
      name: 'R knee hyperextension',
      description:
        'Locking the right knee into hyperextension during the raise',
      featureChecks: [
        {
          featureIndex: FeatureIndex.R_KNEE_FLEXION,
          condition: 'below',
          threshold: 0.02,
        },
      ],
    },
  ],
};

// ── Exported Collection ─────────────────────────────────────────────────────

export const EXERCISES: ExerciseProfile[] = [
  SHOULDER_FLEXION,
  SHOULDER_ABDUCTION,
  KNEE_FLEXION,
  MINI_SQUAT,
  TANDEM_STANCE,
  SINGLE_LEG_STANCE,
  HEEL_RAISE,
];

/**
 * Look up an exercise profile by its unique ID.
 * Returns undefined if no exercise matches.
 */
export function getExerciseById(id: string): ExerciseProfile | undefined {
  return EXERCISES.find((ex) => ex.id === id);
}
