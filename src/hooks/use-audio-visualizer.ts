"use client";

import { useRef, useCallback, useEffect } from "react";

interface UseAudioVisualizerOptions {
  analyser: AnalyserNode | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  color: string;
  baseRadius: number;
  lineWidth?: number;
  amplitudeScale?: number;
}

export function useAudioVisualizer({
  analyser,
  canvasRef,
  color,
  baseRadius,
  lineWidth = 2,
  amplitudeScale = 1.5,
}: UseAudioVisualizerOptions) {
  const animationRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !analyser) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    // Handle DPR for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    const dataArray = dataArrayRef.current;
    analyser.getByteTimeDomainData(dataArray);

    // Fade effect
    ctx.fillStyle = "rgba(10, 10, 15, 0.25)";
    ctx.fillRect(0, 0, width, height);

    // Draw circular waveform
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const sliceCount = dataArray.length;
    for (let i = 0; i <= sliceCount; i++) {
      const idx = i % sliceCount;
      const value = dataArray[idx];
      const amplitude = ((value - 128) / 128) * baseRadius * 0.4 * amplitudeScale;
      const angle = (idx / sliceCount) * Math.PI * 2 - Math.PI / 2;
      const radius = baseRadius + amplitude;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();

    // Inner glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    animationRef.current = requestAnimationFrame(draw);
  }, [analyser, canvasRef, color, baseRadius, lineWidth, amplitudeScale]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);
}
