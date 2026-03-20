@AGENTS.md

# Walkie Talkie — Project Context

## What this is
A mobile-first voice chat app. User taps Connect, gets a WebRTC session with OpenAI's Realtime API (gpt-realtime-1.5), and has a natural voice conversation. Single-user app for jon.cooper@gmail.com.

## Status
- **Phase 1: COMPLETE** — Voice chat with OpenAI Realtime API, Clerk auth, deployed on Vercel
- **Phase 2: PLANNED** — Bridge to Claude Code via "channels" beta for real-time voice-to-Claude-Code

## Architecture
```
Browser (WebRTC) <--audio--> OpenAI Realtime API
       |
       | POST /api/session (get ephemeral token)
       v
  Next.js Server (Vercel)
       |
       | Bearer OPENAI_API_KEY
       v
  OpenAI /v1/realtime/client_secrets
```

The server only brokers the initial ephemeral token. All audio flows directly between browser and OpenAI via WebRTC. No audio touches our server.

## Key files
- `src/app/api/session/route.ts` — Server endpoint that mints ephemeral OpenAI tokens. Uses the GA nested `audio` object schema. Defense-in-depth email check.
- `src/hooks/use-realtime-session.ts` — WebRTC lifecycle: creates RTCPeerConnection, gets mic, exchanges SDP with OpenAI, handles reconnection (3 attempts with exponential backoff).
- `src/hooks/use-audio-visualizer.ts` — Canvas-based circular waveform animation driven by AnalyserNode.
- `src/hooks/use-wake-lock.ts` — Screen Wake Lock API to keep screen on during sessions.
- `src/components/talk-button.tsx` — The big circular connect/disconnect button.
- `src/proxy.ts` — Clerk auth middleware (Next.js 16 convention, NOT `middleware.ts`).
- `src/lib/realtime-events.ts` — TypeScript types for OpenAI Realtime server events.

## Critical: OpenAI Realtime API (GA, March 2026)
The GA API schema differs from beta/training data:
- **Nested audio config:** `session.audio.input.turn_detection`, `session.audio.input.transcription`, `session.audio.output.voice`
- **Endpoint:** `POST /v1/realtime/client_secrets` (NOT `/v1/realtime/sessions`)
- **WebRTC:** `POST /v1/realtime/calls` — no `?model=` query param needed with ephemeral keys
- **Model:** `gpt-realtime-1.5` (not `gpt-4o-realtime-preview` which is deprecated)
- **No beta header needed:** `OpenAI-Beta: realtime=v1` is no longer required

## Deployment
- **Production:** https://walkietalkie-three.vercel.app
- **Vercel project:** `joncooper-8102s-projects/walkietalkie`
- **GitHub:** https://github.com/joncooper/walkietalkie
- Deploy: `vercel deploy --prod`
- Env sync: `vercel env pull .env.local`

## Env vars (all set on Vercel, all environments)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (public, safe for client)
- `CLERK_SECRET_KEY` — Clerk secret (server-only)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/sign-in`
- `OPENAI_API_KEY` — OpenAI key (server-only, never exposed to client)

## Clerk config
- App name: "Walkie Talkie"
- Google OAuth only (email/password disabled)
- Allowlist enabled with `jon.cooper@gmail.com`
- Restricted mode enabled
- Clerk app ID: `app_3BE73lISDtZIHU6ofR2iLRgs7zU`

## Phase 2 notes
Claude Code "channels" is a new beta feature (released ~March 19, 2026) that enables tool-use communication with Claude Code. The plan is to use OpenAI's voice model as the speech-to-text/text-to-speech layer, then route the text to Claude Code via channels for the actual intelligence. Extension point is the data channel event handler in `use-realtime-session.ts`.
