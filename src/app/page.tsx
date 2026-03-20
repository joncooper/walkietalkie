"use client";

import { useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { useRealtimeSession } from "@/hooks/use-realtime-session";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { TalkButton } from "@/components/talk-button";
import { Waveform } from "@/components/waveform";
import { ConnectionStatus } from "@/components/connection-status";
import { PermissionPrompt } from "@/components/permission-prompt";

export default function Home() {
  const session = useRealtimeSession();
  const wakeLock = useWakeLock();
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  const handleConnect = useCallback(async () => {
    if (session.state === "connected") {
      session.stop();
      wakeLock.release();
      return;
    }

    if (session.state === "error") {
      // Retry on error
      setShowPermissionPrompt(false);
    }

    // Check if we already have mic permission
    if (!micPermissionGranted) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (permissionStatus.state === "granted") {
          setMicPermissionGranted(true);
        } else if (permissionStatus.state === "prompt") {
          setShowPermissionPrompt(true);
          return;
        }
        // If denied, still try — getUserMedia will show the appropriate error
      } catch {
        // permissions.query may not support "microphone" on all browsers
        // Fall through and let getUserMedia handle it
      }
    }

    await startSession();
  }, [session, wakeLock, micPermissionGranted]);

  const startSession = useCallback(async () => {
    await session.start();
    await wakeLock.acquire();
  }, [session, wakeLock]);

  const handlePermissionAllow = useCallback(async () => {
    setShowPermissionPrompt(false);
    setMicPermissionGranted(true);
    await startSession();
  }, [startSession]);

  const handlePermissionDismiss = useCallback(() => {
    setShowPermissionPrompt(false);
  }, []);

  const isConnected = session.state === "connected";

  return (
    <main
      className="relative flex flex-col items-center justify-between h-dvh bg-wt-bg"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      {/* Header */}
      <header className="flex w-full items-center justify-between px-4 py-3">
        <h1 className="text-sm font-medium text-wt-muted tracking-wide uppercase">
          Walkie Talkie
        </h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </header>

      {/* Center area — waveform + button */}
      <div className="relative flex flex-1 items-center justify-center w-full">
        {/* Waveform canvas behind button */}
        {isConnected && (
          <Waveform
            analyser={session.analyser}
            isSpeaking={session.isSpeaking}
            isListening={session.isListening}
            isConnected={isConnected}
          />
        )}

        {/* Talk button */}
        <TalkButton
          state={session.state}
          isSpeaking={session.isSpeaking}
          isListening={session.isListening}
          onPress={handleConnect}
        />
      </div>

      {/* Status area */}
      <div className="pb-8">
        <ConnectionStatus
          state={session.state}
          isSpeaking={session.isSpeaking}
          isListening={session.isListening}
          error={session.error}
          sessionDuration={session.sessionDuration}
        />
      </div>

      {/* Permission prompt modal */}
      {showPermissionPrompt && (
        <PermissionPrompt
          onAllow={handlePermissionAllow}
          onDismiss={handlePermissionDismiss}
        />
      )}
    </main>
  );
}
