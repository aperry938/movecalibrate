/**
 * MoveCalibrate Pose Estimation Hook
 *
 * MediaPipe WASM-based pose landmarking running entirely in the browser.
 * Initializes the PoseLandmarker on mount, provides a processFrame callback
 * for per-frame detection, and extracts 30 biomechanical features from each
 * frame using the core biomechanics pipeline.
 *
 * Usage:
 *   const { landmarks, features, isReady, fps, error, processFrame } = usePoseEstimation();
 *   // In your animation loop:
 *   processFrame(videoElement);
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Landmark, BiomechanicalFeatures } from '../core/types';
import { extractFeatures, StabilityTracker } from '../core/biomechanics';

// ── Configuration ─────────────────────────────────────────────────────────────

const VISION_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

/** Number of frames to average for FPS display. */
const FPS_SAMPLE_SIZE = 30;

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface PoseEstimationState {
  /** Current frame's 33 pose landmarks, or null if no pose detected. */
  landmarks: Landmark[] | null;
  /** Current frame's 30 biomechanical features, or null if no pose detected. */
  features: BiomechanicalFeatures | null;
  /** Whether the PoseLandmarker model has finished loading and is ready. */
  isReady: boolean;
  /** Smoothed frames-per-second of the detection loop. */
  fps: number;
  /** Initialization error message, or null if successful. */
  error: string | null;
  /** Call this with a video element each animation frame to run detection. */
  processFrame: (video: HTMLVideoElement) => void;
  /** Direct ref to the PoseLandmarker instance for advanced use. */
  landmarkerRef: React.MutableRefObject<PoseLandmarker | null>;
}

export function usePoseEstimation(): PoseEstimationState {
  // ── State ─────────────────────────────────────────────────────────────────
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [features, setFeatures] = useState<BiomechanicalFeatures | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Refs (stable across renders) ──────────────────────────────────────────
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const stabilityTrackerRef = useRef<StabilityTracker>(new StabilityTracker(15));

  // FPS tracking: circular buffer of frame timestamps
  const frameTimesRef = useRef<number[]>([]);
  const lastTimestampRef = useRef<number>(0);

  // ── Initialize PoseLandmarker on mount ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);

        if (cancelled) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to initialize pose landmarker';
          setError(message);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // ── Per-frame processing callback ─────────────────────────────────────────
  const processFrame = useCallback((video: HTMLVideoElement) => {
    const landmarker = landmarkerRef.current;
    if (!landmarker) return;

    // Guard against calling with a video that hasn't started playing
    if (video.readyState < 2) return;

    // MediaPipe requires monotonically increasing timestamps
    const now = performance.now();
    if (now <= lastTimestampRef.current) return;
    lastTimestampRef.current = now;

    // Run pose detection
    const result = landmarker.detectForVideo(video, now);

    // Extract first person's landmarks (single-person mode)
    if (result.landmarks.length > 0) {
      const rawLandmarks = result.landmarks[0];

      // Convert MediaPipe NormalizedLandmark[] to our Landmark[]
      const converted: Landmark[] = rawLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 1.0,
      }));

      // Extract 30 biomechanical features with stability tracking
      const extractedFeatures = extractFeatures(
        converted,
        stabilityTrackerRef.current,
      );

      setLandmarks(converted);
      setFeatures(extractedFeatures);
    } else {
      setLandmarks(null);
      setFeatures(null);
    }

    // Update FPS counter using rolling average
    const frameTimes = frameTimesRef.current;
    frameTimes.push(now);

    if (frameTimes.length > FPS_SAMPLE_SIZE) {
      frameTimes.shift();
    }

    if (frameTimes.length >= 2) {
      const elapsed = frameTimes[frameTimes.length - 1] - frameTimes[0];
      const computedFps =
        elapsed > 0 ? ((frameTimes.length - 1) / elapsed) * 1000 : 0;
      setFps(Math.round(computedFps));
    }
  }, []);

  return {
    landmarks,
    features,
    isReady,
    fps,
    error,
    processFrame,
    landmarkerRef,
  };
}
