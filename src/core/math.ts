/**
 * MoveCalibrate Geometry Utilities
 *
 * Ported from ZENith's pose_foundations.py. Pure math functions
 * with no dependencies beyond the Point2D/Point3D types.
 */

import type { Point2D, Point3D } from './types';

/**
 * Calculate the interior angle at point b formed by segments ba and bc.
 * Uses atan2 for full-quadrant accuracy. Returns degrees in [0, 180].
 *
 * Ported from ZENith's calculate_angle(a, b, c).
 */
export function calculateAngle(a: Point2D, b: Point2D, c: Point2D): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180.0 / Math.PI));
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * Euclidean distance between two 2D points.
 */
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Euclidean distance between two 3D points.
 */
export function euclideanDistance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize a value into [0, 1] given a known min/max range.
 * Clamps the result so it never exceeds the bounds.
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Magnitude (length) of a 2D vector.
 */
export function vectorMagnitude(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Midpoint between two 2D points.
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2.0,
    y: (p1.y + p2.y) / 2.0,
  };
}

/**
 * Area of a convex polygon using the shoelace formula.
 *
 * Assumes points are ordered (clockwise or counter-clockwise).
 * For the base-of-support calculation, this receives the four foot landmarks
 * arranged as a convex hull. Returns the absolute area.
 *
 * If fewer than 3 points are given, returns 0.
 */
export function convexHullArea(points: Point2D[]): number {
  const n = points.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2.0;
}

/**
 * Clamp a value to the range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
