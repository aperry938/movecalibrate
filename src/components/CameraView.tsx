/**
 * CameraView — Live camera feed with pose skeleton overlay.
 *
 * Manages getUserMedia lifecycle, renders video frames to a main canvas
 * (mirrored), and draws skeleton + angle annotations on a transparent
 * overlay canvas when landmarks are available.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { BiomechanicalFeatures, Landmark } from '../core/types';
import { usePoseEstimation } from '../hooks/usePoseEstimation';
import { drawSkeleton, drawAngles, clearCanvas } from '../utils/drawing';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

interface CameraViewProps {
  onFrame?: (features: BiomechanicalFeatures, landmarks: Landmark[]) => void;
  showSkeleton?: boolean;
  showAngles?: boolean;
  isActive?: boolean;
}

export default function CameraView({
  onFrame,
  showSkeleton = true,
  showAngles = false,
  isActive = false,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { landmarks, features, isReady, fps, error: poseError, processFrame } = usePoseEstimation();

  // Use refs for drawing data to avoid recreating the RAF callback every frame
  const landmarksRef = useRef<Landmark[] | null>(null);
  const featuresRef = useRef<BiomechanicalFeatures | null>(null);

  useEffect(() => { landmarksRef.current = landmarks; }, [landmarks]);
  useEffect(() => { featuresRef.current = features; }, [features]);

  // Start camera
  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: VIDEO_WIDTH },
            height: { ideal: VIDEO_HEIGHT },
            facingMode: 'user',
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error ? err.message : 'Camera access denied',
          );
        }
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    };
  }, []);

  // Frame processing callback
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const showSkeletonRef = useRef(showSkeleton);
  const showAnglesRef = useRef(showAngles);
  useEffect(() => { showSkeletonRef.current = showSkeleton; }, [showSkeleton]);
  useEffect(() => { showAnglesRef.current = showAngles; }, [showAngles]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;

    if (!video || !canvas || !overlay) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlay.getContext('2d');
    if (!ctx || !overlayCtx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Draw video frame to main canvas
    ctx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    // Process frame through pose estimation
    if (isReady) {
      processFrame(video);
    }

    // Clear overlay
    clearCanvas(overlayCtx, VIDEO_WIDTH, VIDEO_HEIGHT);

    // Draw skeleton and angles on overlay using refs (avoids RAF restart)
    const currentLandmarks = landmarksRef.current;
    const currentFeatures = featuresRef.current;

    if (currentLandmarks && currentLandmarks.length > 0) {
      if (showSkeletonRef.current) {
        drawSkeleton(overlayCtx, currentLandmarks, '#3b82f6', VIDEO_WIDTH, VIDEO_HEIGHT);
      }
      if (showAnglesRef.current) {
        drawAngles(overlayCtx, currentLandmarks, VIDEO_WIDTH, VIDEO_HEIGHT);
      }

      // Forward features to parent
      if (currentFeatures && onFrameRef.current) {
        onFrameRef.current(currentFeatures, currentLandmarks);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [isReady, processFrame]);

  // Animation loop control
  useEffect(() => {
    if (isActive && cameraReady) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [isActive, cameraReady, tick]);

  const errorMessage = cameraError || poseError;

  return (
    <div className="relative w-full max-w-[640px] mx-auto bg-slate-900 rounded-lg overflow-hidden">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        playsInline
        muted
        className="absolute opacity-0 pointer-events-none"
      />

      {/* Main canvas (mirrored) */}
      <canvas
        ref={canvasRef}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        className="w-full h-auto block"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Skeleton overlay canvas (mirrored, absolutely positioned) */}
      <canvas
        ref={overlayRef}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        className="absolute top-0 left-0 w-full h-auto pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* FPS counter */}
      {isActive && cameraReady && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded">
          {fps} FPS
        </div>
      )}

      {/* Loading state */}
      {!cameraReady && !errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-300 text-sm">Camera loading...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
          <div className="text-center px-4">
            <p className="text-rose-400 text-sm font-medium mb-1">Camera Error</p>
            <p className="text-slate-400 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
