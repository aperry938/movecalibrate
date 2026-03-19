/**
 * MoveCalibrate Canvas Drawing Utilities
 *
 * Ported from ZENith's skeleton drawing pipeline. Renders pose landmarks,
 * skeleton connections, and joint angle annotations onto a 2D canvas overlay.
 *
 * All landmark coordinates are normalized [0, 1] by MediaPipe. Drawing
 * functions multiply by the canvas width/height to produce pixel positions.
 */

import type { Landmark } from '../core/types';

// ── MediaPipe Pose Connections ────────────────────────────────────────────────
// Pairs of landmark indices that form the skeleton wireframe.

export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [9, 10], [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32],
];

// ── Angle Display Configuration ──────────────────────────────────────────────
// Joint definitions for angle annotation: [pointA, vertex, pointC, label]
// The angle is measured at the vertex between segments vertex->A and vertex->C.

const ANGLE_JOINTS: Array<{
  a: number;
  vertex: number;
  c: number;
  label: string;
}> = [
  { a: 23, vertex: 11, c: 13, label: 'L Shoulder' },  // L hip -> L shoulder -> L elbow
  { a: 24, vertex: 12, c: 14, label: 'R Shoulder' },  // R hip -> R shoulder -> R elbow
  { a: 11, vertex: 13, c: 15, label: 'L Elbow' },     // L shoulder -> L elbow -> L wrist
  { a: 12, vertex: 14, c: 16, label: 'R Elbow' },     // R shoulder -> R elbow -> R wrist
  { a: 11, vertex: 23, c: 25, label: 'L Hip' },        // L shoulder -> L hip -> L knee
  { a: 12, vertex: 24, c: 26, label: 'R Hip' },        // R shoulder -> R hip -> R knee
  { a: 23, vertex: 25, c: 27, label: 'L Knee' },       // L hip -> L knee -> L ankle
  { a: 24, vertex: 26, c: 28, label: 'R Knee' },       // R hip -> R knee -> R ankle
];

// ── Drawing Functions ─────────────────────────────────────────────────────────

/**
 * Draw the skeleton wireframe and joint dots on a canvas.
 *
 * Renders connections as semi-transparent lines (2px) and landmarks as
 * filled circles (4px radius). Landmarks with visibility < 0.5 are skipped
 * entirely -- both the dot and any connections involving that landmark.
 *
 * @param ctx - Canvas 2D rendering context
 * @param landmarks - Array of 33 MediaPipe landmarks (normalized [0,1])
 * @param color - CSS color string for the skeleton (default: blue-500)
 * @param width - Canvas pixel width for coordinate scaling
 * @param height - Canvas pixel height for coordinate scaling
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  color: string = '#3b82f6',
  width: number = 640,
  height: number = 480,
): void {
  if (landmarks.length === 0) return;

  // Draw connection lines
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    if (startIdx >= landmarks.length || endIdx >= landmarks.length) continue;

    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    // Skip if either landmark has low visibility
    if (start.visibility < 0.5 || end.visibility < 0.5) continue;

    ctx.beginPath();
    ctx.moveTo(start.x * width, start.y * height);
    ctx.lineTo(end.x * width, end.y * height);
    ctx.stroke();
  }

  // Draw landmark dots
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = color;

  for (const landmark of landmarks) {
    if (landmark.visibility < 0.5) continue;

    const px = landmark.x * width;
    const py = landmark.y * height;

    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Draw angle annotations at key joints (shoulder, elbow, hip, knee).
 *
 * For each joint, calculates the angle at the vertex and renders:
 *   - A small arc showing the measured angle
 *   - A degree label with white text and dark shadow for readability
 *
 * Landmarks with visibility < 0.5 are skipped.
 *
 * @param ctx - Canvas 2D rendering context
 * @param landmarks - Array of 33 MediaPipe landmarks (normalized [0,1])
 * @param width - Canvas pixel width for coordinate scaling
 * @param height - Canvas pixel height for coordinate scaling
 */
export function drawAngles(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number = 640,
  height: number = 480,
): void {
  if (landmarks.length === 0) return;

  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (const joint of ANGLE_JOINTS) {
    if (
      joint.a >= landmarks.length ||
      joint.vertex >= landmarks.length ||
      joint.c >= landmarks.length
    ) continue;

    const a = landmarks[joint.a];
    const vertex = landmarks[joint.vertex];
    const c = landmarks[joint.c];

    // Skip if any landmark in the angle triplet has low visibility
    if (a.visibility < 0.5 || vertex.visibility < 0.5 || c.visibility < 0.5) continue;

    // Compute angle at vertex using atan2
    const ax = a.x * width;
    const ay = a.y * height;
    const vx = vertex.x * width;
    const vy = vertex.y * height;
    const cx = c.x * width;
    const cy = c.y * height;

    const angleA = Math.atan2(ay - vy, ax - vx);
    const angleC = Math.atan2(cy - vy, cx - vx);

    let angleDeg = Math.abs((angleA - angleC) * (180 / Math.PI));
    if (angleDeg > 180) angleDeg = 360 - angleDeg;

    // Draw small arc at the vertex
    const arcRadius = 16;
    const startAngle = Math.min(angleA, angleC);
    const endAngle = Math.max(angleA, angleC);

    // Choose the shorter arc
    let arcStart = startAngle;
    let arcEnd = endAngle;
    if (endAngle - startAngle > Math.PI) {
      arcStart = endAngle;
      arcEnd = startAngle + 2 * Math.PI;
    }

    ctx.strokeStyle = '#fbbf24'; // amber-400
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(vx, vy, arcRadius, arcStart, arcEnd);
    ctx.stroke();

    // Position the label slightly offset from the vertex
    const midAngle = (arcStart + arcEnd) / 2;
    const labelDistance = 28;
    const labelX = vx + Math.cos(midAngle) * labelDistance;
    const labelY = vy + Math.sin(midAngle) * labelDistance;

    const label = `${Math.round(angleDeg)}°`;

    // Dark shadow for readability on any background
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(label, labelX, labelY);

    // White text on top
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, labelX, labelY);
  }

  // Reset shadow state
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 1.0;
}

/**
 * Convert a flat array of 132 values (33 landmarks x 4 components each)
 * back into an array of Landmark objects.
 *
 * The flat format is [x0, y0, z0, v0, x1, y1, z1, v1, ...] where each
 * group of 4 values represents one landmark's (x, y, z, visibility).
 *
 * @param flat - Array of 132 numeric values
 * @returns Array of 33 Landmark objects
 */
export function flatToLandmarks(flat: number[]): Landmark[] {
  const landmarks: Landmark[] = [];
  const count = Math.floor(flat.length / 4);

  for (let i = 0; i < count; i++) {
    const offset = i * 4;
    landmarks.push({
      x: flat[offset],
      y: flat[offset + 1],
      z: flat[offset + 2],
      visibility: flat[offset + 3],
    });
  }

  return landmarks;
}

/**
 * Clear the entire canvas to transparent.
 *
 * @param ctx - Canvas 2D rendering context
 * @param width - Canvas pixel width
 * @param height - Canvas pixel height
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
}
