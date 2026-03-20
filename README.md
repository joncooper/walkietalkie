# Walkie Talkie

A full-screen, mobile-first voice chat app that connects you to OpenAI's Realtime API via WebRTC. Dark theme, one big button, natural voice-activity-detected conversation.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Clerk** — Google OAuth, single-user allowlist
- **OpenAI Realtime API** — `gpt-realtime` model via WebRTC
- **Vercel** — deployment

## How It Works

1. You tap **Connect** — the app mints an ephemeral OpenAI token server-side and establishes a WebRTC peer connection directly between your browser and OpenAI.
2. Server-side voice activity detection (VAD) handles turn-taking — just talk naturally.
3. Audio never touches our server. The server only brokers the initial token.

## Setup

### 1. Clerk

1. Create a new app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Under **User & Authentication > Social Connections**, enable **Google** only (disable everything else)
3. Under **Restrictions > Allowlist**, enable it and add `jon.cooper@gmail.com`
4. Copy your **Publishable Key** and **Secret Key**

### 2. OpenAI

1. Get an API key at [platform.openai.com](https://platform.openai.com) with Realtime API access

### 3. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
OPENAI_API_KEY=sk-...
```

### 4. Run Locally

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

Import the repo at [vercel.com/new](https://vercel.com/new), add the 4 environment variables above, and deploy. Then add the production domain to Clerk's allowed origins.

## Project Structure

```
src/
  app/
    layout.tsx              — ClerkProvider, dark theme, viewport meta
    page.tsx                — Full-screen walkie talkie UI
    globals.css             — Tailwind v4 theme colors + animations
    sign-in/[[...sign-in]]/ — Clerk sign-in page
    api/session/route.ts    — Mints OpenAI ephemeral tokens
  proxy.ts                  — Clerk auth guard (Next.js 16 proxy convention)
  hooks/
    use-realtime-session.ts — WebRTC lifecycle, audio state, reconnection
    use-audio-visualizer.ts — Canvas circular waveform animation
    use-wake-lock.ts        — Screen Wake Lock API
  components/
    talk-button.tsx         — Large circular connect/disconnect button
    waveform.tsx            — Circular audio visualization
    connection-status.tsx   — State label + session timer
    permission-prompt.tsx   — Pre-mic-permission explanation modal
  lib/
    realtime-events.ts      — TypeScript types for Realtime API events
```

## Phase 2 (Planned)

Bridge to Claude Code via the "channels" beta — talk to Claude Code in real-time through the voice interface. The data channel event handler in `use-realtime-session.ts` is the extension point.
