"use client";

import { useRef } from "react";
import { useAudioVisualizer } from "@/hooks/use-audio-visualizer";

interface WaveformProps {
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
  isListening: boolean;
  isConnected: boolean;
}

export function Waveform({ analyser, isSpeaking, isListening, isConnected }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  let color = "#4a5568"; // idle
  if (isSpeaking) color = "#4fd1c5"; // speaking (teal)
  else if (isListening) color = "#48bb78"; // listening (green)
  else if (isConnected) color = "#4a5568"; // connected but quiet

  useAudioVisualizer({
    analyser,
    canvasRef,
    color,
    baseRadius: 120,
    lineWidth: 2,
    amplitudeScale: isSpeaking ? 2 : 1.5,
  });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
