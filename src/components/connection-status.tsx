"use client";

import type { SessionState } from "@/hooks/use-realtime-session";

interface ConnectionStatusProps {
  state: SessionState;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  sessionDuration: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ConnectionStatus({
  state,
  isSpeaking,
  isListening,
  error,
  sessionDuration,
}: ConnectionStatusProps) {
  let statusText = "Tap to connect";
  let statusColor = "text-wt-muted";

  if (state === "connecting") {
    statusText = "Connecting...";
    statusColor = "text-wt-muted";
  } else if (state === "error") {
    statusText = error || "Connection error";
    statusColor = "text-wt-error";
  } else if (state === "connected") {
    if (isSpeaking) {
      statusText = "AI is responding...";
      statusColor = "text-wt-speaking";
    } else if (isListening) {
      statusText = "Listening...";
      statusColor = "text-wt-listening";
    } else {
      statusText = "Connected — speak anytime";
      statusColor = "text-wt-muted";
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <p className={`text-sm font-medium ${statusColor} transition-colors duration-300`}>
        {statusText}
      </p>
      {state === "connected" && (
        <p className="text-xs text-wt-muted/60 tabular-nums">
          {formatDuration(sessionDuration)}
        </p>
      )}
    </div>
  );
}
