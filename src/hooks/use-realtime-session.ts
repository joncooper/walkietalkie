"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { RealtimeServerEvent } from "@/lib/realtime-events";

export type SessionState = "disconnected" | "connecting" | "connected" | "error";

interface SessionRefs {
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  audioEl: HTMLAudioElement | null;
  localStream: MediaStream | null;
  audioCtx: AudioContext | null;
  analyser: AnalyserNode | null;
  localSource: MediaStreamAudioSourceNode | null;
  remoteSource: MediaStreamAudioSourceNode | null;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  sessionStartTime: number | null;
  durationTimer: ReturnType<typeof setInterval> | null;
}

export interface UseRealtimeSessionReturn {
  state: SessionState;
  start: () => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  analyser: AnalyserNode | null;
  sessionDuration: number;
}

const MAX_RECONNECT_ATTEMPTS = 3;

export function useRealtimeSession(): UseRealtimeSessionReturn {
  const [state, setState] = useState<SessionState>("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  const refs = useRef<SessionRefs>({
    pc: null,
    dc: null,
    audioEl: null,
    localStream: null,
    audioCtx: null,
    analyser: null,
    localSource: null,
    remoteSource: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    sessionStartTime: null,
    durationTimer: null,
  });

  const cleanup = useCallback(() => {
    const r = refs.current;

    if (r.durationTimer) {
      clearInterval(r.durationTimer);
      r.durationTimer = null;
    }
    if (r.reconnectTimer) {
      clearTimeout(r.reconnectTimer);
      r.reconnectTimer = null;
    }

    r.localSource?.disconnect();
    r.remoteSource?.disconnect();
    r.localSource = null;
    r.remoteSource = null;

    r.dc?.close();
    r.dc = null;

    if (r.pc) {
      r.pc.getSenders().forEach((s) => s.track?.stop());
      r.pc.close();
      r.pc = null;
    }

    r.localStream?.getTracks().forEach((t) => t.stop());
    r.localStream = null;

    if (r.audioEl) {
      r.audioEl.srcObject = null;
      r.audioEl.remove();
      r.audioEl = null;
    }

    if (r.audioCtx && r.audioCtx.state !== "closed") {
      r.audioCtx.close();
    }
    r.audioCtx = null;
    r.analyser = null;
    r.sessionStartTime = null;

    setAnalyserNode(null);
    setIsSpeaking(false);
    setIsListening(false);
    setSessionDuration(0);
  }, []);

  const handleEvent = useCallback((event: RealtimeServerEvent) => {
    switch (event.type) {
      case "session.created":
      case "session.updated":
        break;

      case "input_audio_buffer.speech_started":
        setIsListening(true);
        break;
      case "input_audio_buffer.speech_stopped":
        setIsListening(false);
        break;

      case "output_audio_buffer.started":
        setIsSpeaking(true);
        break;
      case "output_audio_buffer.stopped":
        setIsSpeaking(false);
        break;

      case "error":
        console.error("Realtime API error:", event.error);
        setError(event.error.message);
        break;

      default:
        // Log unhandled events in dev for debugging
        if (process.env.NODE_ENV === "development") {
          console.log("Realtime event:", event.type);
        }
    }
  }, []);

  const connectWebRTC = useCallback(
    async (ephemeralKey: string) => {
      const r = refs.current;

      // 1. Create peer connection
      const pc = new RTCPeerConnection();
      r.pc = pc;

      // 2. Set up audio output (AI voice)
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      r.audioEl = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];

        // Connect remote audio to analyser when AI speaks
        if (r.audioCtx && r.analyser && e.streams[0]) {
          try {
            r.remoteSource = r.audioCtx.createMediaStreamSource(e.streams[0]);
            // Don't connect by default — we switch in/out based on speaking state
          } catch {
            // Remote stream may not be ready yet
          }
        }
      };

      // 3. Set up audio input (user mic)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      r.localStream = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Set up audio analysis
      const audioCtx = new AudioContext();
      await audioCtx.resume(); // Critical for iOS Safari
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      r.audioCtx = audioCtx;
      r.analyser = analyser;

      // Connect mic to analyser by default (user audio visualization)
      const localSource = audioCtx.createMediaStreamSource(stream);
      localSource.connect(analyser);
      r.localSource = localSource;

      setAnalyserNode(analyser);

      // 5. Create data channel
      const dc = pc.createDataChannel("oai-events");
      r.dc = dc;

      dc.onopen = () => {
        // Enable input audio transcription for Phase 2
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              input_audio_transcription: {
                model: "gpt-4o-mini-transcribe",
              },
            },
          })
        );
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as RealtimeServerEvent;
          handleEvent(event);
        } catch {
          console.error("Failed to parse realtime event:", e.data);
        }
      };

      dc.onclose = () => {
        if (refs.current.pc === pc) {
          // Unexpected close — try reconnect
          handleDisconnect("Data channel closed unexpectedly");
        }
      };

      // 6. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Exchange SDP with OpenAI
      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime/calls?model=gpt-realtime",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        throw new Error(`SDP exchange failed: ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Monitor ICE connection state
      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        if (iceState === "connected" || iceState === "completed") {
          setState("connected");
          r.reconnectAttempts = 0;

          // Start session duration timer
          r.sessionStartTime = Date.now();
          r.durationTimer = setInterval(() => {
            if (r.sessionStartTime) {
              setSessionDuration(
                Math.floor((Date.now() - r.sessionStartTime) / 1000)
              );
            }
          }, 1000);
        } else if (iceState === "failed" || iceState === "disconnected") {
          handleDisconnect("Connection lost");
        }
      };
    },
    [handleEvent]
  );

  const handleDisconnect = useCallback(
    (reason: string) => {
      const r = refs.current;
      cleanup();

      if (r.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.pow(2, r.reconnectAttempts) * 1000;
        r.reconnectAttempts++;
        setState("connecting");
        setError(`${reason}. Reconnecting in ${delay / 1000}s...`);

        r.reconnectTimer = setTimeout(async () => {
          try {
            const res = await fetch("/api/session", { method: "POST" });
            if (!res.ok) throw new Error("Failed to get session");
            const { value: ephemeralKey } = await res.json();
            await connectWebRTC(ephemeralKey);
          } catch (err) {
            handleDisconnect(
              err instanceof Error ? err.message : "Reconnection failed"
            );
          }
        }, delay);
      } else {
        setState("error");
        setError(`${reason}. Max reconnection attempts reached.`);
        r.reconnectAttempts = 0;
      }
    },
    [cleanup, connectWebRTC]
  );

  const start = useCallback(async () => {
    try {
      setState("connecting");
      setError(null);
      refs.current.reconnectAttempts = 0;

      // Get ephemeral token from our API
      const res = await fetch("/api/session", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || `Session request failed: ${res.status}`);
      }

      const { value: ephemeralKey } = await res.json();
      if (!ephemeralKey) {
        throw new Error("No ephemeral key received");
      }

      await connectWebRTC(ephemeralKey);
    } catch (err) {
      cleanup();
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [connectWebRTC, cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setState("disconnected");
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    start,
    stop,
    isSpeaking,
    isListening,
    error,
    analyser: analyserNode,
    sessionDuration,
  };
}
