"use client";

import type { SessionState } from "@/hooks/use-realtime-session";

interface TalkButtonProps {
  state: SessionState;
  isSpeaking: boolean;
  isListening: boolean;
  onPress: () => void;
}

export function TalkButton({ state, isSpeaking, isListening, onPress }: TalkButtonProps) {
  const isConnected = state === "connected";
  const isConnecting = state === "connecting";
  const isError = state === "error";

  // Determine visual state
  let ringColor = "border-wt-idle/30";
  let bgColor = "bg-wt-idle/20";
  let animation = "";

  if (isError) {
    ringColor = "border-wt-error/50";
    bgColor = "bg-wt-error/10";
  } else if (isConnecting) {
    ringColor = "border-wt-idle/50";
    bgColor = "bg-wt-idle/20";
    animation = "animate-[pulse-connecting_1.5s_ease-in-out_infinite]";
  } else if (isConnected && isSpeaking) {
    ringColor = "border-wt-speaking";
    bgColor = "bg-wt-speaking/10";
  } else if (isConnected && isListening) {
    ringColor = "border-wt-listening";
    bgColor = "bg-wt-listening/10";
  } else if (isConnected) {
    ringColor = "border-wt-listening/40";
    bgColor = "bg-wt-surface";
    animation = "animate-[breathe_3s_ease-in-out_infinite]";
  }

  return (
    <button
      onClick={onPress}
      disabled={isConnecting}
      className={`
        relative w-[200px] h-[200px] rounded-full
        border-2 ${ringColor} ${bgColor}
        flex items-center justify-center
        transition-colors duration-300
        touch-action-manipulation
        [-webkit-tap-highlight-color:transparent]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-wt-listening/50
        disabled:cursor-not-allowed
        ${animation}
      `}
      aria-label={isConnected ? "Disconnect" : "Connect"}
    >
      {isConnecting ? (
        <SpinnerIcon />
      ) : isError ? (
        <AlertIcon />
      ) : isConnected && isSpeaking ? (
        <SpeakerIcon />
      ) : isConnected ? (
        <MicIcon />
      ) : (
        <MicOffIcon />
      )}
    </button>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-wt-listening"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-wt-muted"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5.66" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-wt-speaking"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-wt-error"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-wt-muted animate-[spin_1s_linear_infinite]"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
