/**
 * MoveCalibrate Biomechanical Feature Extraction
 *
 * Computes 30 anatomically meaningful features from MediaPipe 33-landmark pose data.
 * Ported from ZENith's biomechanical_features.py with full fidelity.
 *
 * Feature Groups:
 *   1. Joint Angles (16): Bilateral measurements of major articulations
 *   2. Segment Ratios (6): Proportional and alignment relationships
 *   3. Symmetry Metrics (4): Left-right bilateral comparison
 *   4. Stability Indicators (4): Balance and steadiness measures
 *
 * Total: 30 biomechanical features per frame, all normalized to [0, 1].
 */

import type { Landmark, Point2D, Point3D, BiomechanicalFeatures } from './types';
import {
  calculateAngle,
  euclideanDistance,
  midpoint,
  clamp,
} from './math';

// ── MediaPipe Landmark Indices ──────────────────────────────────────────────

const NOSE          = 0;
const L_SHOULDER    = 11;
const R_SHOULDER    = 12;
const L_ELBOW       = 13;
const R_ELBOW       = 14;
const L_WRIST       = 15;
const R_WRIST       = 16;
const L_HIP         = 23;
const R_HIP         = 24;
const L_KNEE        = 25;
const R_KNEE        = 26;
const L_ANKLE       = 27;
const R_ANKLE       = 28;
const L_HEEL        = 29;
const R_HEEL        = 30;
const L_FOOT_INDEX  = 31;
const R_FOOT_INDEX  = 32;

// ── Landmark Helpers ────────────────────────────────────────────────────────

/** Extract a 2D point from a landmark array. */
function pt2d(landmarks: Landmark[], idx: number): Point2D {
  return { x: landmarks[idx].x, y: landmarks[idx].y };
}

/** Extract a 3D point from a landmark array. */
function pt3d(landmarks: Landmark[], idx: number): Point3D {
  return { x: landmarks[idx].x, y: landmarks[idx].y, z: landmarks[idx].z };
}

/** 3D midpoint between two landmarks. */
function midpoint3d(a: Point3D, b: Point3D): Point3D {
  return {
    x: (a.x + b.x) / 2.0,
    y: (a.y + b.y) / 2.0,
    z: (a.z + b.z) / 2.0,
  };
}

/** Angle at vertex b formed by segments ba and bc, in degrees [0, 180]. */
function angle3pt(landmarks: Landmark[], aIdx: number, bIdx: number, cIdx: number): number {
  return calculateAngle(pt2d(landmarks, aIdx), pt2d(landmarks, bIdx), pt2d(landmarks, cIdx));
}

/** Dot product of two 2D vectors. */
function dot2d(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

/** Dot product of two 3D vectors. */
function dot3d(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Magnitude of a 2D vector. */
function mag2d(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** Magnitude of a 3D vector. */
function mag3d(v: Point3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// ── Joint Angles (16 features) ──────────────────────────────────────────────

/**
 * Compute 16 joint angles from anatomical landmark positions.
 *
 * Captures the kinematic state of major articulations:
 *   - Shoulder flexion/abduction: arm position relative to torso
 *   - Elbow flexion: arm bend
 *   - Hip flexion/abduction: leg position relative to pelvis
 *   - Knee flexion: leg bend
 *   - Ankle dorsiflexion: foot-shin angle
 *   - Spinal lateral flexion: side-bend of trunk
 *   - Trunk forward lean: sagittal plane trunk angle
 *
 * Returns array of 16 values, all normalized to [0, 1] by dividing by 180.
 */
export function computeJointAngles(landmarks: Landmark[]): number[] {
  const angles = new Array<number>(16).fill(0);

  // Shoulder flexion: angle at shoulder (hip-shoulder-elbow) -- sagittal plane arm raise
  angles[0] = angle3pt(landmarks, L_HIP, L_SHOULDER, L_ELBOW);       // L shoulder flexion
  angles[1] = angle3pt(landmarks, R_HIP, R_SHOULDER, R_ELBOW);       // R shoulder flexion

  // Shoulder abduction: angle at shoulder in frontal plane
  // Approximated as hip-shoulder-wrist (captures full arm abduction)
  angles[2] = angle3pt(landmarks, L_HIP, L_SHOULDER, L_WRIST);       // L shoulder abduction
  angles[3] = angle3pt(landmarks, R_HIP, R_SHOULDER, R_WRIST);       // R shoulder abduction

  // Elbow flexion: angle at elbow (shoulder-elbow-wrist)
  angles[4] = angle3pt(landmarks, L_SHOULDER, L_ELBOW, L_WRIST);     // L elbow
  angles[5] = angle3pt(landmarks, R_SHOULDER, R_ELBOW, R_WRIST);     // R elbow

  // Hip flexion: angle at hip (shoulder-hip-knee) -- sagittal plane
  angles[6] = angle3pt(landmarks, L_SHOULDER, L_HIP, L_KNEE);        // L hip flexion
  angles[7] = angle3pt(landmarks, R_SHOULDER, R_HIP, R_KNEE);        // R hip flexion

  // Hip abduction: angle at hip (opposite_hip-hip-knee) -- frontal plane
  angles[8] = angle3pt(landmarks, R_HIP, L_HIP, L_KNEE);             // L hip abduction
  angles[9] = angle3pt(landmarks, L_HIP, R_HIP, R_KNEE);             // R hip abduction

  // Knee flexion: angle at knee (hip-knee-ankle)
  angles[10] = angle3pt(landmarks, L_HIP, L_KNEE, L_ANKLE);          // L knee
  angles[11] = angle3pt(landmarks, R_HIP, R_KNEE, R_ANKLE);          // R knee

  // Ankle dorsiflexion: angle at ankle (knee-ankle-foot_index)
  angles[12] = angle3pt(landmarks, L_KNEE, L_ANKLE, L_FOOT_INDEX);   // L ankle
  angles[13] = angle3pt(landmarks, R_KNEE, R_ANKLE, R_FOOT_INDEX);   // R ankle

  // Spinal lateral flexion: angle deviation of shoulder midpoint from vertical
  // through hip midpoint. Measures side-bending of the trunk.
  const lSh = pt2d(landmarks, L_SHOULDER);
  const rSh = pt2d(landmarks, R_SHOULDER);
  const lHp = pt2d(landmarks, L_HIP);
  const rHp = pt2d(landmarks, R_HIP);
  const shMid = midpoint(lSh, rSh);
  const hpMid = midpoint(lHp, rHp);
  const trunkVec: Point2D = { x: shMid.x - hpMid.x, y: shMid.y - hpMid.y };
  // Vertical = [0, -1] in image coords where y increases downward
  const vertical: Point2D = { x: 0.0, y: -1.0 };
  const trunkMag = mag2d(trunkVec);
  let cosAngle = dot2d(trunkVec, vertical) / (trunkMag + 1e-8);
  cosAngle = clamp(cosAngle, -1.0, 1.0);
  angles[14] = Math.acos(cosAngle) * (180.0 / Math.PI); // Spinal lateral flexion

  // Trunk forward lean: sagittal plane angle using z-coordinate
  // Approximated by shoulder-hip-vertical angle in the y-z plane
  const shMid3d = midpoint3d(pt3d(landmarks, L_SHOULDER), pt3d(landmarks, R_SHOULDER));
  const hpMid3d = midpoint3d(pt3d(landmarks, L_HIP), pt3d(landmarks, R_HIP));
  const trunk3d: Point3D = {
    x: shMid3d.x - hpMid3d.x,
    y: shMid3d.y - hpMid3d.y,
    z: shMid3d.z - hpMid3d.z,
  };
  const vert3d: Point3D = { x: 0.0, y: -1.0, z: 0.0 };
  let cosLean = dot3d(trunk3d, vert3d) / (mag3d(trunk3d) + 1e-8);
  cosLean = clamp(cosLean, -1.0, 1.0);
  angles[15] = Math.acos(cosLean) * (180.0 / Math.PI); // Trunk forward lean

  // Normalize all to [0, 1]
  for (let i = 0; i < 16; i++) {
    angles[i] /= 180.0;
  }

  return angles;
}

// ── Segment Ratios (6 features) ─────────────────────────────────────────────

/**
 * Compute 6 proportional/alignment features.
 *
 * Captures postural alignment relationships:
 *   - Torso-to-leg ratio: body proportion awareness
 *   - Arm span symmetry: bilateral arm extension balance
 *   - Stance width ratio: foot spread relative to hip width
 *   - Shoulder-hip alignment offset: frontal plane torso alignment
 *   - CoM-to-base displacement: balance (how centered is mass over support)
 *   - Head-spine alignment: cervical spine neutral check
 *
 * Returns array of 6 values, each in [0, 1].
 */
export function computeSegmentRatios(landmarks: Landmark[]): number[] {
  const ratios = new Array<number>(6).fill(0);

  // Torso length: shoulder midpoint to hip midpoint
  const shMid = midpoint(pt2d(landmarks, L_SHOULDER), pt2d(landmarks, R_SHOULDER));
  const hpMid = midpoint(pt2d(landmarks, L_HIP), pt2d(landmarks, R_HIP));
  const torsoLen = euclideanDistance(shMid, hpMid);

  // Leg length: hip to ankle (average of both sides)
  const lLeg = euclideanDistance(pt2d(landmarks, L_HIP), pt2d(landmarks, L_ANKLE));
  const rLeg = euclideanDistance(pt2d(landmarks, R_HIP), pt2d(landmarks, R_ANKLE));
  const legLen = (lLeg + rLeg) / 2.0;

  // Torso-to-leg ratio (typical ~0.5-0.7; normalized by clamping to [0, 2] then /2)
  ratios[0] = clamp(torsoLen / (legLen + 1e-8), 0.0, 2.0) / 2.0;

  // Arm span symmetry: |left_arm_length - right_arm_length| / avg_arm_length
  const lArm = euclideanDistance(pt2d(landmarks, L_SHOULDER), pt2d(landmarks, L_WRIST));
  const rArm = euclideanDistance(pt2d(landmarks, R_SHOULDER), pt2d(landmarks, R_WRIST));
  const avgArm = (lArm + rArm) / 2.0;
  // 0 = perfect symmetry (low = good). Raw magnitude: higher = more asymmetric.
  ratios[1] = clamp(Math.abs(lArm - rArm) / (avgArm + 1e-8), 0.0, 1.0);

  // Stance width / hip width
  const hipWidth = euclideanDistance(pt2d(landmarks, L_HIP), pt2d(landmarks, R_HIP));
  const stanceWidth = euclideanDistance(pt2d(landmarks, L_ANKLE), pt2d(landmarks, R_ANKLE));
  ratios[2] = clamp(stanceWidth / (hipWidth + 1e-8), 0.0, 5.0) / 5.0;

  // Shoulder-hip alignment offset (frontal plane)
  // Horizontal offset between shoulder midpoint and hip midpoint
  const offset = Math.abs(shMid.x - hpMid.x);
  // Normalize by hip width. 0 = perfectly stacked (low = good). Raw magnitude: higher = more offset.
  ratios[3] = clamp(offset / (hipWidth + 1e-8), 0.0, 1.0);

  // Center of Mass (CoM) horizontal displacement from Base of Support (BoS) center
  // Approximate CoM as weighted average of major segments:
  //   shoulders 20%, hips 40%, knees 20%, ankles 20%
  const knMid = midpoint(pt2d(landmarks, L_KNEE), pt2d(landmarks, R_KNEE));
  const anMid = midpoint(pt2d(landmarks, L_ANKLE), pt2d(landmarks, R_ANKLE));
  const comX = 0.2 * shMid.x + 0.4 * hpMid.x + 0.2 * knMid.x + 0.2 * anMid.x;

  // BoS center: midpoint of the four foot landmarks
  const lFootCenter = midpoint(pt2d(landmarks, L_HEEL), pt2d(landmarks, L_FOOT_INDEX));
  const rFootCenter = midpoint(pt2d(landmarks, R_HEEL), pt2d(landmarks, R_FOOT_INDEX));
  const bosCenter = midpoint(lFootCenter, rFootCenter);

  // Horizontal (x) displacement only -- vertical offset is pose-dependent
  const comDispX = Math.abs(comX - bosCenter.x);
  // Normalize by body height (shoulder-ankle distance) for pose-invariance
  const bodyHeight = euclideanDistance(shMid, anMid) + 1e-8;
  // 0 = centered (low = good). Raw magnitude: higher = more displaced.
  ratios[4] = clamp(comDispX / (bodyHeight * 0.3), 0.0, 1.0);

  // Head-spine alignment: offset of nose from shoulder midpoint
  const nose = pt2d(landmarks, NOSE);
  const headOffset = euclideanDistance(nose, shMid);
  // Normalize by torso length. 0 = perfectly aligned (low = good). Raw magnitude: higher = more misaligned.
  ratios[5] = clamp(headOffset / (torsoLen + 1e-8), 0.0, 1.0);

  return ratios;
}

// ── Symmetry Metrics (4 features) ───────────────────────────────────────────

/**
 * Compute 4 bilateral symmetry features from pre-computed joint angles.
 *
 * Each metric compares left vs right angles. 1.0 = perfect symmetry,
 * 0.0 = maximal asymmetry.
 *
 * Input: normalized joint angles (16 values in [0, 1]).
 */
export function computeSymmetryMetrics(jointAngles: number[]): number[] {
  const symmetry = new Array<number>(4).fill(0);

  // Shoulder symmetry: average of flexion and abduction symmetry
  const shFlexDiff = Math.abs(jointAngles[0] - jointAngles[1]);   // L/R shoulder flexion
  const shAbdDiff = Math.abs(jointAngles[2] - jointAngles[3]);    // L/R shoulder abduction
  symmetry[0] = 1.0 - clamp((shFlexDiff + shAbdDiff) / 2.0, 0.0, 1.0);

  // Elbow symmetry
  symmetry[1] = 1.0 - clamp(Math.abs(jointAngles[4] - jointAngles[5]), 0.0, 1.0);

  // Hip symmetry: average of flexion and abduction symmetry
  const hpFlexDiff = Math.abs(jointAngles[6] - jointAngles[7]);
  const hpAbdDiff = Math.abs(jointAngles[8] - jointAngles[9]);
  symmetry[2] = 1.0 - clamp((hpFlexDiff + hpAbdDiff) / 2.0, 0.0, 1.0);

  // Knee symmetry
  symmetry[3] = 1.0 - clamp(Math.abs(jointAngles[10] - jointAngles[11]), 0.0, 1.0);

  return symmetry;
}

// ── Stability Tracker (4 features) ──────────────────────────────────────────

/**
 * Tracks temporal stability features across frames.
 *
 * Maintains a 15-frame sliding window (0.5s at 30fps) for computing
 * frame-to-frame velocity variance and center-of-mass oscillation.
 * Must be called sequentially with each new frame via update().
 */
export class StabilityTracker {
  private readonly bufferSize: number;
  private landmarkHistory: number[][][]; // Array of [33][3] landmark snapshots
  private comHistory: Point2D[];         // Array of 2D CoM positions

  constructor(bufferSize: number = 15) {
    this.bufferSize = bufferSize;
    this.landmarkHistory = [];
    this.comHistory = [];
  }

  /** Clear all history. */
  reset(): void {
    this.landmarkHistory = [];
    this.comHistory = [];
  }

  /** Add current frame landmarks to the sliding window buffer. */
  update(landmarks: Landmark[]): void {
    // Extract all 33 landmark positions as [33][3]
    const pts: number[][] = [];
    for (let i = 0; i < 33; i++) {
      if (i < landmarks.length) {
        pts.push([landmarks[i].x, landmarks[i].y, landmarks[i].z]);
      } else {
        pts.push([0, 0, 0]);
      }
    }
    this.landmarkHistory.push(pts);
    if (this.landmarkHistory.length > this.bufferSize) {
      this.landmarkHistory.shift();
    }

    // Compute and store CoM (2D, using segment weighting)
    const shMidX = (pts[L_SHOULDER][0] + pts[R_SHOULDER][0]) / 2.0;
    const shMidY = (pts[L_SHOULDER][1] + pts[R_SHOULDER][1]) / 2.0;
    const hpMidX = (pts[L_HIP][0] + pts[R_HIP][0]) / 2.0;
    const hpMidY = (pts[L_HIP][1] + pts[R_HIP][1]) / 2.0;
    const knMidX = (pts[L_KNEE][0] + pts[R_KNEE][0]) / 2.0;
    const knMidY = (pts[L_KNEE][1] + pts[R_KNEE][1]) / 2.0;
    const anMidX = (pts[L_ANKLE][0] + pts[R_ANKLE][0]) / 2.0;
    const anMidY = (pts[L_ANKLE][1] + pts[R_ANKLE][1]) / 2.0;

    const comX = 0.2 * shMidX + 0.4 * hpMidX + 0.2 * knMidX + 0.2 * anMidX;
    const comY = 0.2 * shMidY + 0.4 * hpMidY + 0.2 * knMidY + 0.2 * anMidY;

    this.comHistory.push({ x: comX, y: comY });
    if (this.comHistory.length > this.bufferSize) {
      this.comHistory.shift();
    }
  }

  /**
   * Compute 4 stability indicators from the accumulated buffer.
   *
   *   1. landmark_velocity_var: frame-to-frame movement variance (inverted: 1 = steady)
   *   2. com_oscillation: CoM horizontal sway amplitude (inverted: 1 = stable)
   *   3. base_of_support_area: convex hull of foot landmarks (normalized)
   *   4. weight_distribution: bilateral weight balance (1 = even)
   *
   * Requires current-frame landmarks for features 3 and 4 (which are instantaneous).
   */
  compute(landmarks: Landmark[]): number[] {
    const stability = new Array<number>(4).fill(0);

    // 1. Landmark velocity variance
    if (this.landmarkHistory.length >= 3) {
      const velocities: number[] = [];
      for (let i = 1; i < this.landmarkHistory.length; i++) {
        const prev = this.landmarkHistory[i - 1];
        const curr = this.landmarkHistory[i];
        let sumNorm = 0;
        let count = 0;
        for (let j = 0; j < Math.min(prev.length, curr.length); j++) {
          const dx = curr[j][0] - prev[j][0];
          const dy = curr[j][1] - prev[j][1];
          const dz = curr[j][2] - prev[j][2];
          sumNorm += Math.sqrt(dx * dx + dy * dy + dz * dz);
          count++;
        }
        velocities.push(count > 0 ? sumNorm / count : 0);
      }

      // Variance of frame-to-frame velocities
      const mean = velocities.reduce((s, v) => s + v, 0) / velocities.length;
      const velVar = velocities.reduce((s, v) => s + (v - mean) * (v - mean), 0) / velocities.length;
      // 0 = steady (low = good). Raw magnitude: higher = more shaky.
      stability[0] = clamp(velVar / 0.005, 0.0, 1.0);
    } else {
      stability[0] = 0.5; // Neutral until enough history
    }

    // 2. CoM oscillation amplitude
    if (this.comHistory.length >= 3) {
      // Mean CoM position
      let meanX = 0;
      let meanY = 0;
      for (const c of this.comHistory) {
        meanX += c.x;
        meanY += c.y;
      }
      meanX /= this.comHistory.length;
      meanY /= this.comHistory.length;

      // RMS deviation from mean
      let sumSqDist = 0;
      for (const c of this.comHistory) {
        const dx = c.x - meanX;
        const dy = c.y - meanY;
        sumSqDist += dx * dx + dy * dy;
      }
      const oscillation = Math.sqrt(sumSqDist / this.comHistory.length);
      // 0 = stable (low = good). Raw magnitude: higher = more sway.
      stability[1] = clamp(oscillation / 0.03, 0.0, 1.0);
    } else {
      stability[1] = 0.5;
    }

    // 3. Base of support area (convex hull of 4 foot landmarks)
    const lHeel = pt2d(landmarks, L_HEEL);
    const rHeel = pt2d(landmarks, R_HEEL);
    const lToe = pt2d(landmarks, L_FOOT_INDEX);
    const rToe = pt2d(landmarks, R_FOOT_INDEX);

    // Approximate convex hull area as sum of two triangles
    // Triangle 1: lHeel, rHeel, lToe
    // Triangle 2: rHeel, lToe, rToe
    const area = triangleArea(lHeel, rHeel, lToe) + triangleArea(rHeel, lToe, rToe);
    // Normalize: typical BoS area [0, 0.05] in normalized coordinates
    stability[2] = clamp(area / 0.05, 0.0, 1.0);

    // 4. Weight distribution estimate
    // Compare horizontal CoM position to BoS center
    const bosCenterX = (lHeel.x + rHeel.x + lToe.x + rToe.x) / 4.0;
    const bosWidth = Math.max(
      Math.abs(lHeel.x - rHeel.x),
      Math.abs(lToe.x - rToe.x),
      1e-8
    );

    const shMid = midpoint(pt2d(landmarks, L_SHOULDER), pt2d(landmarks, R_SHOULDER));
    const hpMid = midpoint(pt2d(landmarks, L_HIP), pt2d(landmarks, R_HIP));
    const knMid = midpoint(pt2d(landmarks, L_KNEE), pt2d(landmarks, R_KNEE));
    const anMid = midpoint(pt2d(landmarks, L_ANKLE), pt2d(landmarks, R_ANKLE));

    const comX = 0.2 * shMid.x + 0.4 * hpMid.x + 0.2 * knMid.x + 0.2 * anMid.x;
    const offsetRatio = Math.abs(comX - bosCenterX) / bosWidth;
    // 0 = perfectly centered (low = good). Raw magnitude: higher = more asymmetric.
    stability[3] = clamp(offsetRatio, 0.0, 1.0);

    return stability;
  }
}

// ── Helper: Triangle Area ───────────────────────────────────────────────────

/** Area of a triangle from three 2D points using the cross product method. */
function triangleArea(p1: Point2D, p2: Point2D, p3: Point2D): number {
  const v1x = p2.x - p1.x;
  const v1y = p2.y - p1.y;
  const v2x = p3.x - p1.x;
  const v2y = p3.y - p1.y;
  return 0.5 * Math.abs(v1x * v2y - v1y * v2x);
}

// ── Main Extraction Function ────────────────────────────────────────────────

/**
 * Extract all 30 biomechanical features from a single frame of landmarks.
 *
 * Calls all four compute functions and concatenates the results into a
 * Float64Array(30). All values are in [0, 1].
 *
 * The stabilityTracker is updated internally (push + compute). If you need
 * stability features, pass a persistent StabilityTracker across frames.
 * If null/undefined, stability features default to 0.5 (neutral).
 *
 * @param landmarks - Array of 33 MediaPipe landmarks
 * @param stabilityTracker - Optional StabilityTracker for temporal features
 * @returns Float64Array of 30 biomechanical features
 */
export function extractFeatures(
  landmarks: Landmark[],
  stabilityTracker: StabilityTracker | null
): BiomechanicalFeatures {
  // Joint angles (16 features, indices 0-15)
  const jointAngles = computeJointAngles(landmarks);

  // Segment ratios (6 features, indices 16-21)
  const segmentRatios = computeSegmentRatios(landmarks);

  // Symmetry metrics (4 features, indices 22-25, derived from joint angles)
  const symmetry = computeSymmetryMetrics(jointAngles);

  // Stability indicators (4 features, indices 26-29)
  let stability: number[];
  if (stabilityTracker !== null) {
    stabilityTracker.update(landmarks);
    stability = stabilityTracker.compute(landmarks);
  } else {
    stability = [0.5, 0.5, 0.5, 0.5];
  }

  // Concatenate into Float64Array(30)
  const features = new Float64Array(30);

  for (let i = 0; i < 16; i++) {
    features[i] = jointAngles[i];
  }
  for (let i = 0; i < 6; i++) {
    features[16 + i] = segmentRatios[i];
  }
  for (let i = 0; i < 4; i++) {
    features[22 + i] = symmetry[i];
  }
  for (let i = 0; i < 4; i++) {
    features[26 + i] = stability[i];
  }

  return features;
}
